import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const confirmationSchema = z.object({
  attachmentIds: z.array(z.string().uuid()).max(10),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;
  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: "El pedido no es válido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La confirmación no es válida." }, { status: 400 });
  }

  const parsed = confirmationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "La confirmación no es válida." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: attachments, error: queryError } = await supabase
    .from("order_attachments")
    .select("id, storage_path")
    .eq("order_id", orderId)
    .in("id", parsed.data.attachmentIds);

  if (queryError) {
    throw new Error("No se pudieron validar los archivos subidos.", {
      cause: queryError,
    });
  }

  const storage = supabase.storage.from("order-files");
  const uploadResults = await Promise.all(
    attachments.map(async (attachment) => {
      const [folder, ...nameParts] = attachment.storage_path.split("/");
      const name = nameParts.join("/");
      const { data, error } = await storage.list(folder, { search: name });
      if (error) {
        throw new Error("No se pudo verificar un archivo subido.", {
          cause: error,
        });
      }
      return {
        id: attachment.id,
        exists: data.some((file) => file.name === name),
      };
    }),
  );

  const uploadedIds = uploadResults
    .filter((result) => result.exists)
    .map((result) => result.id);
  if (uploadedIds.length > 0) {
    const { error: updateError } = await supabase
      .from("order_attachments")
      .update({ uploaded: true })
      .eq("order_id", orderId)
      .in("id", uploadedIds);

    if (updateError) {
      throw new Error("No se pudo confirmar la subida de los archivos.", {
        cause: updateError,
      });
    }
  }

  return NextResponse.json({
    uploadedIds,
    failedIds: uploadResults
      .filter((result) => !result.exists)
      .map((result) => result.id),
  });
}
