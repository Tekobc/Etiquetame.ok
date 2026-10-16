import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderNotesEditor } from "../order-notes-editor";
import { OrderStatusForm } from "../order-status-form";
import { DeleteOrderButton } from "../delete-order-button";
import { DownloadAllZip } from "../download-all-zip";
import { DownloadAttachment } from "../download-attachment";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-access";

export const metadata: Metadata = {
  title: "Detalle del pedido | Panel de administración",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(date));
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    notFound();
  }
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    throw new Error("No se pudo cargar el pedido.", { cause: orderError });
  }
  if (!order) {
    notFound();
  }

  const [categoryResult, productResult, attachmentResult] = await Promise.all([
    order.category_id
      ? supabase.from("categories").select("name").eq("id", order.category_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    order.product_id
      ? supabase
          .from("products")
          .select("name, slug, thumb_path")
          .eq("id", order.product_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("order_attachments")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (categoryResult.error || productResult.error || attachmentResult.error) {
    throw new Error("No se pudieron cargar todos los datos del pedido.", {
      cause: categoryResult.error ?? productResult.error ?? attachmentResult.error,
    });
  }

  const attachments = attachmentResult.data;
  const digits = order.phone.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hola ${order.customer_name}, te escribo por tu consulta: ${order.summary}`,
  );

  return (
    <main className="admin-dashboard order-detail-page">
      <Link className="admin-back-link" href="/admin/pedidos">
        Volver a pedidos
      </Link>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Pedido recibido {formatDate(order.created_at)}</p>
          <h1>{order.customer_name}</h1>
          <p className="order-detail-summary">{order.summary}</p>
        </div>
        <span className={`status-badge status-${order.status}`}>
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div className="order-detail-grid">
        <div className="order-detail-main">
          <section className="admin-card">
            <h2>Datos del pedido</h2>
            <dl className="order-facts">
              <div><dt>Teléfono</dt><dd>+{digits}</dd></div>
              <div><dt>Tipo de trabajo</dt><dd>{categoryResult.data?.name ?? "A definir"}</dd></div>
              <div><dt>Fecha</dt><dd>{formatDate(order.created_at)}</dd></div>
              {productResult.data ? (
                <div className="order-product-reference">
                  <dt>Diseño de referencia</dt>
                  <dd>
                    <Link href={`/?producto=${productResult.data.slug}`}>
                      <Image
                        alt=""
                        height={76}
                        src={
                          supabase.storage
                            .from("products")
                            .getPublicUrl(productResult.data.thumb_path).data
                            .publicUrl
                        }
                        unoptimized
                        width={76}
                      />
                      {productResult.data.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
            {order.details ? (
              <div className="order-details-text">
                <h3>Detalles</h3>
                <p>{order.details}</p>
              </div>
            ) : null}
            <div className="order-contact-actions">
              <a className="button button-secondary" href={`tel:+${digits}`}>Llamar</a>
              <a
                className="button button-primary"
                href={`https://wa.me/${digits}?text=${whatsappMessage}`}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-heading">
              <h2>Archivos adjuntos ({attachments.length})</h2>
              {attachments.some((file) => file.uploaded) ? (
                <DownloadAllZip orderId={order.id} />
              ) : null}
            </div>
            {attachments.length === 0 ? (
              <p className="admin-muted">Este pedido no tiene archivos adjuntos.</p>
            ) : (
              <ul className="attachment-list">
                {attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <span aria-hidden="true" className="attachment-file-icon">
                      {attachment.mime_type.startsWith("image/") ? "▧" : "▤"}
                    </span>
                    <div>
                      <strong>{attachment.file_name}</strong>
                      <span>{formatBytes(attachment.size_bytes)}</span>
                    </div>
                    {attachment.uploaded ? (
                      <DownloadAttachment
                        attachmentId={attachment.id}
                        orderId={order.id}
                      />
                    ) : (
                      <span className="attachment-missing">No subido</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="order-detail-side">
          <section className="admin-card">
            <h2>Estado del pedido</h2>
            <OrderStatusForm currentStatus={order.status} orderId={order.id} />
          </section>
          <section className="admin-card">
            <h2>Notas para el equipo</h2>
            <OrderNotesEditor
              initialNotes={order.admin_notes}
              orderId={order.id}
            />
          </section>
          <section className="admin-card admin-danger-zone">
            <h2>Eliminar pedido</h2>
            <p>Se borrará también la información y los archivos adjuntos.</p>
            <DeleteOrderButton orderId={order.id} />
          </section>
        </aside>
      </div>
    </main>
  );
}
