"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrderAction } from "../actions";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    if (!window.confirm("¿Querés borrar este pedido y sus archivos? Esta acción no se puede deshacer.")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await deleteOrderAction(orderId);
        router.push("/admin/pedidos");
      } catch (actionError) {
        console.error("[admin-orders] No se pudo borrar el pedido:", actionError);
        setError("No se pudo borrar el pedido. Probá de nuevo.");
      }
    });
  }

  return (
    <div>
      <button
        className="button button-danger"
        disabled={isPending}
        onClick={handleDelete}
        type="button"
      >
        {isPending ? "Borrando..." : "Borrar pedido"}
      </button>
      {error ? <p className="form-message" role="alert">{error}</p> : null}
    </div>
  );
}
