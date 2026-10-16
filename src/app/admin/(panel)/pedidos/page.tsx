import type { Metadata } from "next";
import Link from "next/link";
import { OrdersRealtime } from "./orders-realtime";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-access";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "Pedidos | Panel de administración",
};

const statuses = [
  { value: "todos", label: "Todos" },
  { value: "nuevo", label: "Nuevos" },
  { value: "en_proceso", label: "En proceso" },
  { value: "listo", label: "Listos" },
  { value: "entregado", label: "Entregados" },
  { value: "cancelado", label: "Cancelados" },
] as const;

type SearchParams = Promise<{
  estado?: string;
  q?: string;
  desde?: string;
  hasta?: string;
  pagina?: string;
}>;

function safeSearchQuery(value: string) {
  return value.replace(/[^\p{L}\p{N}\s@+-]/gu, "").trim().slice(0, 80);
}

function validDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function buildHref(params: {
  estado?: string;
  q?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
}) {
  const query = new URLSearchParams();
  if (params.estado && params.estado !== "todos") query.set("estado", params.estado);
  if (params.q) query.set("q", params.q);
  if (params.desde) query.set("desde", params.desde);
  if (params.hasta) query.set("hasta", params.hasta);
  if (params.pagina && params.pagina > 1) query.set("pagina", String(params.pagina));
  const search = query.toString();
  return `/admin/pedidos${search ? `?${search}` : ""}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedStatus = params.estado ?? "todos";
  const selectedStatus = statuses.some((item) => item.value === requestedStatus)
    ? requestedStatus
    : "todos";
  const search = safeSearchQuery(params.q ?? "");
  const fromDate = validDate(params.desde);
  const toDate = validDate(params.hasta);
  const page = Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1);
  const pageSize = 25;
  const supabase = await createClient();
  await requireAdmin(supabase);

  const counts = await Promise.all(
    statuses.map(async ({ value }) => {
      let query = supabase.from("orders").select("id", { count: "exact", head: true });
      if (value !== "todos") {
        query = query.eq("status", value as Database["public"]["Enums"]["order_status"]);
      }
      const { count, error } = await query;
      if (error) {
        throw new Error("No se pudieron cargar los contadores de pedidos.", {
          cause: error,
        });
      }
      return [value, count ?? 0] as const;
    }),
  );
  const countByStatus = Object.fromEntries(counts);

  let ordersQuery = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (selectedStatus !== "todos") {
    ordersQuery = ordersQuery.eq(
      "status",
      selectedStatus as Database["public"]["Enums"]["order_status"],
    );
  }
  if (search) {
    const pattern = `"%${search}%"`;
    ordersQuery = ordersQuery.or(
      `customer_name.ilike.${pattern},phone.ilike.${pattern},summary.ilike.${pattern}`,
    );
  }
  if (fromDate) {
    ordersQuery = ordersQuery.gte("created_at", `${fromDate}T00:00:00-03:00`);
  }
  if (toDate) {
    const dayAfter = new Date(`${toDate}T00:00:00-03:00`);
    dayAfter.setDate(dayAfter.getDate() + 1);
    ordersQuery = ordersQuery.lt("created_at", dayAfter.toISOString());
  }

  const { data: orders, count, error } = await ordersQuery.range(
    (page - 1) * pageSize,
    page * pageSize - 1,
  );
  if (error) {
    throw new Error("No se pudieron cargar los pedidos.", { cause: error });
  }

  const orderIds = orders.map((order) => order.id);
  const categoryIds = [...new Set(orders.flatMap((order) => order.category_id ?? []))];
  const [categoriesResult, attachmentsResult] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from("categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length > 0
      ? supabase.from("order_attachments").select("order_id").in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesResult.error || attachmentsResult.error) {
    throw new Error("No se pudieron cargar los datos complementarios de pedidos.", {
      cause: categoriesResult.error ?? attachmentsResult.error,
    });
  }

  const categoryNames = new Map(
    categoriesResult.data.map((category) => [category.id, category.name]),
  );
  const attachmentCounts = new Map<string, number>();
  attachmentsResult.data.forEach(({ order_id }) => {
    attachmentCounts.set(order_id, (attachmentCounts.get(order_id) ?? 0) + 1);
  });
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const preservedParams = {
    estado: selectedStatus,
    q: search,
    desde: fromDate ?? undefined,
    hasta: toDate ?? undefined,
  };

  return (
    <main className="admin-dashboard admin-orders-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Tu espacio de trabajo</p>
          <h1>Pedidos</h1>
        </div>
        <span className="admin-result-count">{count ?? 0} resultados</span>
      </div>
      <OrdersRealtime />

      <nav className="order-status-tabs" aria-label="Filtrar por estado">
        {statuses.map(({ value, label }) => (
          <Link
            aria-current={selectedStatus === value ? "page" : undefined}
            className={selectedStatus === value ? "is-active" : ""}
            href={buildHref({ ...preservedParams, estado: value, pagina: 1 })}
            key={value}
          >
            {label} <span>{countByStatus[value] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <form className="order-filters" action="/admin/pedidos" method="get">
        {selectedStatus !== "todos" ? (
          <input name="estado" type="hidden" value={selectedStatus} />
        ) : null}
        <label className="admin-field">
          Buscar
          <input
            defaultValue={search}
            maxLength={80}
            name="q"
            placeholder="Nombre, teléfono o pedido"
            type="search"
          />
        </label>
        <label className="admin-field">
          Desde
          <input defaultValue={fromDate ?? ""} name="desde" type="date" />
        </label>
        <label className="admin-field">
          Hasta
          <input defaultValue={toDate ?? ""} name="hasta" type="date" />
        </label>
        <button className="button button-primary" type="submit">
          Filtrar
        </button>
      </form>

      {orders.length === 0 ? (
        <section className="admin-empty">
          <h2>No hay pedidos para mostrar.</h2>
          <p>Cuando llegue una consulta nueva, la vas a encontrar acá.</p>
        </section>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Cliente</th>
                <th scope="col">Pedido</th>
                <th scope="col">Trabajo</th>
                <th scope="col">Adjuntos</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className={order.status === "nuevo" ? "is-new-order" : ""} key={order.id}>
                  <td>
                    <time dateTime={order.created_at}>
                      {new Intl.DateTimeFormat("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Argentina/Buenos_Aires",
                      }).format(new Date(order.created_at))}
                    </time>
                  </td>
                  <td>
                    <strong>{order.customer_name}</strong>
                    <a href={`tel:+${order.phone}`}>+{order.phone}</a>
                  </td>
                  <td>
                    <Link className="order-summary-link" href={`/admin/pedidos/${order.id}`}>
                      {order.summary}
                    </Link>
                  </td>
                  <td>{order.category_id ? categoryNames.get(order.category_id) ?? "—" : "—"}</td>
                  <td>{attachmentCounts.get(order.id) ?? 0}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="admin-pagination" aria-label="Paginación de pedidos">
        <span>Página {page} de {pageCount}</span>
        <div>
          {page > 1 ? (
            <Link href={buildHref({ ...preservedParams, pagina: page - 1 })}>
              Anterior
            </Link>
          ) : null}
          {page < pageCount ? (
            <Link href={buildHref({ ...preservedParams, pagina: page + 1 })}>
              Siguiente
            </Link>
          ) : null}
        </div>
      </nav>
    </main>
  );
}
