import { createHmac, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeUploadFileName } from "@/lib/orders/files";
import { orderRequestSchema } from "@/lib/validation/order";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("x-real-ip") ??
    forwardedFor?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function createUploadLinks(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  files: Array<{
    id: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }>,
) {
  const results = await Promise.all(
    files.map(async (file) => {
      const { data, error } = await supabase.storage
        .from("order-files")
        .createSignedUploadUrl(file.storage_path);

      if (error) {
        throw new Error("No se pudo preparar la subida de los archivos.", {
          cause: error,
        });
      }

      return {
        id: file.id,
        path: data.path,
        token: data.token,
        name: file.file_name,
        type: file.mime_type,
        size: file.size_bytes,
      };
    }),
  );

  return { ok: true, orderId, uploads: results };
}

async function recoverExistingOrder(
  supabase: ReturnType<typeof createAdminClient>,
  clientRequestId: string,
) {
  const { data: existing, error } = await supabase
    .from("orders")
    .select("id")
    .eq("client_request_id", clientRequestId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo recuperar el pedido existente.", {
      cause: error,
    });
  }

  if (!existing) {
    return null;
  }

  const { data: attachments, error: attachmentError } = await supabase
    .from("order_attachments")
    .select("id, storage_path, file_name, mime_type, size_bytes")
    .eq("order_id", existing.id)
    .eq("uploaded", false);

  if (attachmentError) {
    throw new Error("No se pudieron recuperar los archivos del pedido.", {
      cause: attachmentError,
    });
  }

  return createUploadLinks(supabase, existing.id, attachments);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return jsonError("No se pudo validar el origen de la solicitud.", 403);
      }
    } catch {
      return jsonError("No se pudo validar el origen de la solicitud.", 403);
    }
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_768) {
    return jsonError("La solicitud es demasiado grande.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("El pedido debe enviarse en formato JSON.", 400);
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);
  }

  const order = parsed.data;
  if (order.website.trim()) {
    return NextResponse.json(
      { ok: true, orderId: null, uploads: [] },
      { status: 202 },
    );
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
    getSupabaseServiceRoleKey();
  } catch (error) {
    console.error("[orders] Falta configurar el acceso seguro a Supabase:", error);
    return jsonError(
      "El formulario no está habilitado todavía. Falta completar la configuración del servidor.",
      503,
    );
  }

  const existing = await recoverExistingOrder(supabase, order.clientRequestId);
  if (existing) {
    return NextResponse.json(existing);
  }

  const ipHash = createHmac("sha256", getSupabaseServiceRoleKey())
    .update(getClientIp(request))
    .digest("hex");
  const { data: withinLimit, error: rateLimitError } = await supabase.rpc(
    "consume_order_rate_limit",
    { p_ip_hash: ipHash },
  );

  if (rateLimitError) {
    console.error("[orders] No se pudo comprobar el límite de solicitudes:", rateLimitError);
    return jsonError(
      "No se pudo procesar el pedido en este momento. Probá más tarde.",
      503,
    );
  }

  if (!withinLimit) {
    return jsonError(
      "Se alcanzó el límite de pedidos por ahora. Probá de nuevo dentro de una hora.",
      429,
    );
  }

  let categoryId: string | null = null;
  if (order.categorySlug) {
    const { data: category, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", order.categorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw new Error("No se pudo validar el tipo de trabajo.", { cause: error });
    }
    if (!category) {
      return jsonError("El tipo de trabajo elegido ya no está disponible.", 400);
    }
    categoryId = category.id;
  }

  if (order.productId) {
    const { data: product, error } = await supabase
      .from("products")
      .select("id")
      .eq("id", order.productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw new Error("No se pudo validar el producto de referencia.", {
        cause: error,
      });
    }
    if (!product) {
      return jsonError("El diseño elegido ya no está disponible.", 400);
    }
  }

  const { data: created, error: createError } = await supabase
    .from("orders")
    .insert({
      customer_name: order.customerName,
      phone: order.phone,
      summary: order.summary,
      details: order.details,
      category_id: categoryId,
      product_id: order.productId,
      client_request_id: order.clientRequestId,
    })
    .select("id")
    .single();

  if (createError) {
    if (createError.code === "23505") {
      const recovered = await recoverExistingOrder(
        supabase,
        order.clientRequestId,
      );
      if (recovered) {
        return NextResponse.json(recovered);
      }
    }
    throw new Error("No se pudo crear el pedido.", { cause: createError });
  }

  const attachments = order.files.map((file) => ({
    order_id: created.id,
    storage_path: `${created.id}/${randomUUID()}-${sanitizeUploadFileName(file.name)}`,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded: false,
  }));

  if (attachments.length > 0) {
    const { error } = await supabase.from("order_attachments").insert(attachments);
    if (error) {
      const { error: rollbackError } = await supabase
        .from("orders")
        .delete()
        .eq("id", created.id);
      if (rollbackError) {
        console.error("[orders] No se pudo limpiar el pedido incompleto:", rollbackError);
      }
      throw new Error("No se pudieron registrar los archivos del pedido.", {
        cause: error,
      });
    }
  }

  try {
    const { data: savedAttachments, error } = await supabase
      .from("order_attachments")
      .select("id, storage_path, file_name, mime_type, size_bytes")
      .eq("order_id", created.id);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      await createUploadLinks(supabase, created.id, savedAttachments),
    );
  } catch (error) {
    const { error: rollbackError } = await supabase
      .from("orders")
      .delete()
      .eq("id", created.id);
    if (rollbackError) {
      console.error("[orders] No se pudo limpiar el pedido sin enlaces:", rollbackError);
    }
    throw new Error("No se pudieron preparar los enlaces de subida.", {
      cause: error,
    });
  }
}
