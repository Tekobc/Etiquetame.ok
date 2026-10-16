"use client";

import { useState } from "react";
import { getAttachmentDownloadUrlAction } from "../actions";

export function DownloadAttachment({
  orderId,
  attachmentId,
}: {
  orderId: string;
  attachmentId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);
    setIsLoading(true);
    try {
      const url = await getAttachmentDownloadUrlAction(orderId, attachmentId);
      window.location.assign(url);
    } catch (downloadError) {
      console.error("[admin-orders] No se pudo preparar el archivo:", downloadError);
      setError("No se pudo preparar la descarga. Volvé a intentarlo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="attachment-download">
      <button
        className="button button-secondary"
        disabled={isLoading}
        onClick={download}
        type="button"
      >
        {isLoading ? "Preparando..." : "Descargar"}
      </button>
      {error ? <span className="attachment-download-error" role="alert">{error}</span> : null}
    </div>
  );
}
