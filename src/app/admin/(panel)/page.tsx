import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-access";

export const metadata: Metadata = {
  title: "Resumen | Panel de administración",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const monthParts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).formatToParts(new Date());
  const month = monthParts.find((part) => part.type === "month")?.value;
  const year = monthParts.find((part) => part.type === "year")?.value;
  const monthStart = new Date(`${year}-${month}-01T00:00:00-03:00`);
  const [{ count: newOrders, error: newOrdersError }, { count: monthOrders, error: monthError }, { count: activeProducts, error: productsError }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "nuevo"),
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

  if (newOrdersError || monthError || productsError) {
    throw new Error("No se pudieron cargar los datos del resumen.", {
      cause: newOrdersError ?? monthError ?? productsError,
    });
  }

  return (
    <main className="admin-dashboard">
      <p className="eyebrow">Tu espacio de trabajo</p>
      <h1>¡Hola, Luana!</h1>
      <div className="admin-summary-grid">
        <Link className="admin-summary-card summary-card-highlight" href="/admin/pedidos?estado=nuevo">
          <span>Pedidos nuevos</span>
          <strong>{newOrders ?? 0}</strong>
          <span>Revisar consultas</span>
        </Link>
        <Link className="admin-summary-card" href="/admin/pedidos">
          <span>Pedidos del mes</span>
          <strong>{monthOrders ?? 0}</strong>
          <span>Ver todos los pedidos</span>
        </Link>
        <Link className="admin-summary-card" href="/admin/productos">
          <span>Productos activos</span>
          <strong>{activeProducts ?? 0}</strong>
          <span>Administrar catálogo</span>
        </Link>
      </div>
      <section className="admin-empty">
        <h2>Tu tienda, un paso más cerca.</h2>
        <p>
          Revisá las consultas, organizá los pedidos y mantené al día tus
          diseños desde este panel.
        </p>
      </section>
    </main>
  );
}
