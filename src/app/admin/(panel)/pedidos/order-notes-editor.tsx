"use client";

import { useEffect, useRef, useState } from "react";
import { saveOrderNotesAction } from "../actions";

export function OrderNotesEditor({
  orderId,
  initialNotes,
}: {
  orderId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const lastSaved = useRef(initialNotes);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (notes === lastSaved.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const valueToSave = notes;
      setSaveState("saving");
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveOrderNotesAction(orderId, valueToSave))
        .then(() => {
          lastSaved.current = valueToSave;
          setSaveState("saved");
        })
        .catch((error: unknown) => {
          console.error("[admin-orders] No se pudieron guardar las notas:", error);
          setSaveState("error");
        });
    }, 650);

    return () => window.clearTimeout(timer);
  }, [notes, orderId]);

  return (
    <div className="order-notes-editor">
      <label className="admin-field" htmlFor="order-admin-notes">
        Notas internas
        <textarea
          id="order-admin-notes"
          maxLength={3000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anotá detalles para el equipo..."
          rows={5}
          value={notes}
        />
      </label>
      <p aria-live="polite" className={`notes-save-state is-${saveState}`}>
        {saveState === "saving"
          ? "Guardando..."
          : saveState === "error"
            ? "No se guardó. Seguí editando para volver a intentar."
            : "Notas guardadas"}
      </p>
    </div>
  );
}
