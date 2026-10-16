"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function OrdersRealtime() {
  const [notice, setNotice] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          setNotice("Llegó un pedido nuevo.");
          router.refresh();
          window.setTimeout(() => setNotice(""), 6000);
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[admin-orders] No se pudo iniciar la actualización en tiempo real.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return notice ? (
    <p aria-live="polite" className="orders-realtime-notice" role="status">
      {notice}
    </p>
  ) : null;
}
