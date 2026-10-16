"use client";

import { useState } from "react";
import { getOrderAttachmentUrlsAction } from "../actions";

function safeZipName(name: string) {
  return name.replace(/[\\/]/g, "-").replace(/[\u0000-\u001f]/g, "").slice(0, 200);
}

export function DownloadAllZip({
  orderId,
}: {
  orderId: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadZip() {
    setError(null);
    setProgress(0);

    try {
      const files = await getOrderAttachmentUrlsAction(orderId);
      if (files.length === 0) {
        throw new Error("Este pedido no tiene archivos disponibles para descargar.");
      }
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      let nextIndex = 0;
      let completed = 0;
      const usedNames = new Set<string>();

      async function worker() {
        while (nextIndex < files.length) {
          const file = files[nextIndex];
          nextIndex += 1;
          const response = await fetch(file.url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`No se pudo descargar ${file.name}.`);
          }
          const baseName = safeZipName(file.name);
          let zipName = baseName;
          let suffix = 2;
          while (usedNames.has(zipName)) {
            const extensionIndex = baseName.lastIndexOf(".");
            const stem =
              extensionIndex > 0 ? baseName.slice(0, extensionIndex) : baseName;
            const extension =
              extensionIndex > 0 ? baseName.slice(extensionIndex) : "";
            zipName = `${stem}-${suffix}${extension}`;
            suffix += 1;
          }
          usedNames.add(zipName);
          zip.file(zipName, await response.blob());
          completed += 1;
          setProgress(Math.round((completed / files.length) * 75));
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(3, files.length) }, () => worker()),
      );

      const archive = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 3 } },
        ({ percent }) => setProgress(75 + Math.round(percent * 0.25)),
      );
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pedido-${orderId.slice(0, 8)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setProgress(null);
    } catch (downloadError) {
      console.error("[admin-orders] Falló la descarga ZIP:", downloadError);
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "No se pudo preparar el ZIP. Volvé a intentarlo.",
      );
      setProgress(null);
    }
  }

  return (
    <div className="zip-download">
      <button
        className="button button-secondary"
        disabled={progress !== null}
        onClick={downloadZip}
        type="button"
      >
        {progress !== null ? `Preparando ZIP... ${progress}%` : "Descargar todo (.zip)"}
      </button>
      {error ? <p className="form-message" role="alert">{error}</p> : null}
      {progress !== null ? (
        <progress aria-label="Progreso de descarga" max={100} value={progress} />
      ) : null}
    </div>
  );
}
