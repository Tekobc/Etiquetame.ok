"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedUser,
  isAdmin,
  requireAdmin as requireAdminUser,
} from "@/lib/supabase/admin-access";

const orderStatuses = [
  "nuevo",
  "en_proceso",
  "listo",
  "entregado",
  "cancelado",
] as const;

async function requireAdmin() {
  const supabase = await createClient();
  await requireAdminUser(supabase);
  return supabase;
}

export async function logoutAction() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (user && !(await isAdmin(supabase, user.id))) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      throw new Error("No se pudo cerrar la sesión.", { cause: error });
    }

    redirect("/admin/login?error=unauthorized");
  }

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    throw new Error("No se pudo cerrar la sesión.", { cause: error });
  }

  redirect("/admin/login");
}

export async function setOrderStatusAction(
  orderId: string,
  status: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    throw new Error("El pedido seleccionado no es válido.");
  }
  if (!orderStatuses.includes(status as (typeof orderStatuses)[number])) {
    throw new Error("El estado elegido no es válido.");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("orders")
    .update({ status: status as (typeof orderStatuses)[number] })
    .eq("id", orderId);

  if (error) {
    throw new Error("No se pudo actualizar el estado del pedido.", {
      cause: error,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

export async function saveOrderNotesAction(
  orderId: string,
  notes: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || notes.length > 3000) {
    throw new Error("Las notas no son válidas.");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("orders")
    .update({ admin_notes: notes })
    .eq("id", orderId);

  if (error) {
    throw new Error("No se pudieron guardar las notas internas.", {
      cause: error,
    });
  }
  revalidatePath(`/admin/pedidos/${orderId}`);
}

export async function deleteOrderAction(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    throw new Error("El pedido seleccionado no es válido.");
  }

  const supabase = await requireAdmin();
  const { data: attachments, error: attachmentError } = await supabase
    .from("order_attachments")
    .select("storage_path")
    .eq("order_id", orderId);

  if (attachmentError) {
    throw new Error("No se pudieron preparar los archivos para borrar.", {
      cause: attachmentError,
    });
  }

  const paths = attachments.map((attachment) => attachment.storage_path);
  if (paths.length > 0) {
    const { error } = await supabase.storage.from("order-files").remove(paths);
    if (error) {
      throw new Error("No se pudieron borrar los archivos del pedido.", {
        cause: error,
      });
    }
  }

  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) {
    throw new Error("No se pudo borrar el pedido.", { cause: error });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}

export async function getAttachmentDownloadUrlAction(
  orderId: string,
  attachmentId: string,
) {
  if (
    !/^[0-9a-f-]{36}$/i.test(orderId) ||
    !/^[0-9a-f-]{36}$/i.test(attachmentId)
  ) {
    throw new Error("El archivo solicitado no es válido.");
  }

  const supabase = await requireAdmin();
  const { data: attachment, error } = await supabase
    .from("order_attachments")
    .select("storage_path, file_name, uploaded")
    .eq("order_id", orderId)
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo encontrar el archivo solicitado.", {
      cause: error,
    });
  }
  if (!attachment || !attachment.uploaded) {
    throw new Error("El archivo todavía no está disponible para descargar.");
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from("order-files")
    .createSignedUrl(attachment.storage_path, 60, {
      download: attachment.file_name,
    });

  if (signedUrlError) {
    throw new Error("No se pudo preparar la descarga del archivo.", {
      cause: signedUrlError,
    });
  }

  return data.signedUrl;
}

export async function getOrderAttachmentUrlsAction(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    throw new Error("El pedido seleccionado no es válido.");
  }

  const supabase = await requireAdmin();
  const { data: attachments, error } = await supabase
    .from("order_attachments")
    .select("id, storage_path, file_name, uploaded")
    .eq("order_id", orderId);

  if (error) {
    throw new Error("No se pudieron preparar las descargas del pedido.", {
      cause: error,
    });
  }

  const available = attachments.filter((attachment) => attachment.uploaded);
  return Promise.all(
    available.map(async (attachment) => {
      const { data, error: signedUrlError } = await supabase.storage
        .from("order-files")
        .createSignedUrl(attachment.storage_path, 60, {
          download: attachment.file_name,
        });
      if (signedUrlError) {
        throw new Error(`No se pudo preparar ${attachment.file_name}.`, {
          cause: signedUrlError,
        });
      }
      return { name: attachment.file_name, url: data.signedUrl };
    }),
  );
}
