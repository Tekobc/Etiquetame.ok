import { setOrderStatusAction } from "../actions";

const statusLabels = {
  nuevo: "Nuevo",
  en_proceso: "En proceso",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
} as const;

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: keyof typeof statusLabels;
}) {
  return (
    <div className="order-status-options" aria-label="Cambiar estado del pedido">
      {Object.entries(statusLabels).map(([status, label]) => (
        <form action={setOrderStatusAction.bind(null, orderId, status)} key={status}>
          <button
            aria-current={status === currentStatus ? "true" : undefined}
            className={`status-choice status-${status}${status === currentStatus ? " is-selected" : ""}`}
            disabled={status === currentStatus}
            type="submit"
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  );
}
