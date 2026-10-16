import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de administración | Etiquétame",
};

export default function AdminDashboardPage() {
  return (
    <main className="admin-dashboard">
      <p className="eyebrow">Tu espacio de trabajo</p>
      <h1>¡Hola, Luana!</h1>
      <section aria-labelledby="empty-dashboard-title" className="admin-empty">
        <h2 id="empty-dashboard-title">Tu panel está listo.</h2>
        <p>
          Cuando incorporemos la gestión de pedidos y productos, vas a poder
          encontrarlos acá.
        </p>
      </section>
    </main>
  );
}
