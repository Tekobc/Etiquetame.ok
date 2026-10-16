"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_ORDER_FILE_BYTES,
  MAX_ORDER_FILES,
  MAX_ORDER_TOTAL_BYTES,
  orderFileSchema,
} from "@/lib/validation/order";
import { categories } from "@/lib/constants";
import type { PublicProduct } from "@/lib/products/types";

type SelectedFile = {
  id: string;
  file: File;
};

type UploadLink = {
  id: string;
  path: string;
  token: string;
  name: string;
  type: string;
  size: number;
};

const ACCEPTED_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".pdf",
  ".svg",
  ".zip",
  ".ai",
  ".eps",
].join(",");

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function resizeImage(file: File): Promise<File> {
  if (["image/heic", "image/heif"].includes(file.type)) {
    return createImageBitmap(file)
      .then((bitmap) => {
        bitmap.close();
        return file;
      })
      .catch(() => {
        throw new Error(
          `${file.name}: este navegador no puede leer HEIC/HEIF. Convertí la imagen a JPG o PNG.`,
        );
      });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.resolve(file);
  }

  return createImageBitmap(file, { imageOrientation: "from-image" }).then(
    (bitmap) => {
      if (Math.max(bitmap.width, bitmap.height) <= 2400) {
        bitmap.close();
        return file;
      }

      const scale = 2400 / Math.max(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        bitmap.close();
        throw new Error("No se pudo preparar la imagen. Probá con otro archivo.");
      }

      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      return new Promise<File>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo comprimir la imagen."));
              return;
            }

            const name = file.name.replace(/\.[^.]+$/, ".webp");
            resolve(new File([blob], name, { type: "image/webp" }));
          },
          "image/webp",
          0.92,
        );
      });
    },
  ).catch(() => {
    throw new Error(
      `${file.name}: no se pudo abrir la imagen. Probá con una copia JPG o PNG.`,
    );
  });
}

export function OrderForm({ products }: { products: PublicProduct[] }) {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [requestId, setRequestId] = useState("");
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState("");
  const [productId, setProductId] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const totalFileBytes = useMemo(
    () => files.reduce((total, selected) => total + selected.file.size, 0),
    [files],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("categoria");
    const requestedProduct = params.get("producto");
    const product = products.find((item) => item.slug === requestedProduct);
    if (requestedCategory) {
      setCategorySlug(requestedCategory);
      document.getElementById("pedir")?.scrollIntoView();
    }
    if (product) {
      setProductId(product.id);
      setCategorySlug(product.categorySlug);
      setSummary(`Me interesa: ${product.name}`);
    }
  }, [products]);

  useEffect(() => {
    function handleProductSelected(event: Event) {
      const detail = (event as CustomEvent<{
        id: string;
        name: string;
        categorySlug: string;
      }>).detail;
      setProductId(detail.id);
      setCategorySlug(detail.categorySlug);
      setSummary(`Me interesa: ${detail.name}`);
      document.getElementById("pedir")?.scrollIntoView({ behavior: "smooth" });
    }

    window.addEventListener("etiquetame:product-selected", handleProductSelected);
    return () =>
      window.removeEventListener("etiquetame:product-selected", handleProductSelected);
  }, []);

  useEffect(() => {
    if (
      !siteKey ||
      !turnstileReady ||
      !turnstileContainerRef.current ||
      !window.turnstile
    ) {
      return;
    }

    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
      theme: "light",
    });
    turnstileIdRef.current = widgetId;

    return () => {
      if (turnstileIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileIdRef.current);
        turnstileIdRef.current = null;
      }
    };
  }, [siteKey, turnstileReady]);

  async function addFiles(fileList: FileList | File[]) {
    setFileError(null);
    const incoming = Array.from(fileList);
    if (files.length + incoming.length > MAX_ORDER_FILES) {
      setFileError(`Podés adjuntar hasta ${MAX_ORDER_FILES} archivos.`);
      return;
    }

    try {
      const prepared = await Promise.all(incoming.map(resizeImage));
      const next = prepared.map((file) => ({ id: crypto.randomUUID(), file }));
      let total = totalFileBytes;

      for (const selected of next) {
        if (selected.file.size > MAX_ORDER_FILE_BYTES) {
          throw new Error(`${selected.file.name}: el máximo por archivo es 15 MB.`);
        }
        const validation = orderFileSchema.safeParse({
          name: selected.file.name,
          type: selected.file.type,
          size: selected.file.size,
        });
        if (!validation.success) {
          throw new Error(
            `${selected.file.name}: ${validation.error.issues[0]?.message ?? "archivo inválido"}`,
          );
        }
        total += selected.file.size;
        if (total > MAX_ORDER_TOTAL_BYTES) {
          throw new Error("El peso total de los archivos no puede superar 40 MB.");
        }
      }

      setFiles((current) => [...current, ...next]);
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : "No se pudieron preparar los archivos seleccionados.",
      );
    }
  }

  function removeFile(fileId: string) {
    setFiles((current) => current.filter((item) => item.id !== fileId));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    if (!siteKey || !turnstileToken) {
      setRequestError(
        siteKey
          ? "Completá la verificación antispam para enviar tu pedido."
          : "El formulario está en preparación. Volvé a intentarlo más tarde.",
      );
      return;
    }

    setIsSubmitting(true);
    const clientRequestId = requestId || crypto.randomUUID();
    setRequestId(clientRequestId);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId,
          customerName,
          phone,
          summary,
          details,
          categorySlug: categorySlug || null,
          productId: productId || null,
          website,
          turnstileToken,
          files: files.map(({ file }) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        }),
      });
      const init = (await response.json()) as
        | { ok: true; orderId: string | null; uploads: UploadLink[] }
        | { error: string };

      if (!response.ok || !("orderId" in init)) {
        throw new Error("error" in init ? init.error : "No se pudo crear el pedido.");
      }
      if (!init.orderId) {
        setCompletedOrderId("accepted");
        return;
      }

      const supabase = createClient();
      const selectedByName = new Map(
        files.map(({ file }) => [`${file.name}:${file.size}`, file]),
      );
      const uploadFailures: string[] = [];
      const uploadedIds: string[] = [];

      for (const upload of init.uploads) {
        const file = selectedByName.get(`${upload.name}:${upload.size}`);
        if (!file) {
          uploadFailures.push(upload.name);
          continue;
        }
        const { error } = await supabase.storage
          .from("order-files")
          .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: upload.type,
            cacheControl: "3600",
          });
        if (error) {
          uploadFailures.push(upload.name);
        } else {
          uploadedIds.push(upload.id);
        }
      }

      const confirmation = await fetch(`/api/orders/${init.orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentIds: uploadedIds }),
      });
      if (!confirmation.ok) {
        throw new Error(
          "El pedido quedó guardado, pero no pudimos confirmar los archivos. Reintentá el envío.",
        );
      }

      if (uploadFailures.length > 0) {
        setRequestError(
          `El pedido se creó, pero no se pudieron subir: ${uploadFailures.join(", ")}. Podés volver a enviar el formulario para reintentarlos.`,
        );
        setCompletedOrderId(null);
      } else {
        setCompletedOrderId(init.orderId);
        setRequestId("");
      }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el pedido. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
      setTurnstileToken("");
      if (turnstileIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileIdRef.current);
      }
    }
  }

  if (completedOrderId !== null) {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const whatsappUrl = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, ya envié el pedido ${completedOrderId}.`) }`
      : null;

    return (
      <section className="order-card order-success" id="pedir" aria-live="polite">
        <p className="eyebrow">¡Listo, llegó tu idea!</p>
        <h2>Recibimos tu pedido.</h2>
        <p>
          {completedOrderId && completedOrderId !== "accepted"
            ? `Tu número de referencia es ${completedOrderId.slice(0, 8)}. Luana se va a contactar con vos para seguir.`
            : "Recibimos la solicitud."}
        </p>
        {whatsappUrl ? (
          <a className="button button-primary" href={whatsappUrl} rel="noreferrer" target="_blank">
            Seguir por WhatsApp
          </a>
        ) : null}
        <button
          className="order-reset"
          onClick={() => {
            setCompletedOrderId(null);
            setCustomerName("");
            setPhone("");
            setSummary("");
            setDetails("");
            setCategorySlug("");
            setProductId("");
            setFiles([]);
          }}
          type="button"
        >
          Enviar otro pedido
        </button>
      </section>
    );
  }

  return (
    <section className="order-card" id="pedir" aria-labelledby="order-form-title">
      {siteKey ? (
        <Script
          id="cloudflare-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
      ) : null}
      <p className="eyebrow">Tu próximo proyecto empieza acá</p>
      <h2 id="order-form-title">Contame qué tenés en mente.</h2>
      <p className="order-intro">
        Completá tus datos y Luana te responde para darle forma a tu idea.
      </p>
      <form className="order-form" onSubmit={handleSubmit}>
        <input name="productId" type="hidden" value={productId} />
        <label className="order-field">
          Tu nombre
          <input
            autoComplete="name"
            maxLength={80}
            minLength={2}
            onChange={(event) => setCustomerName(event.target.value)}
            required
            value={customerName}
          />
        </label>
        <label className="order-field">
          Teléfono o WhatsApp
          <input
            autoComplete="tel"
            maxLength={40}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+54 9 11 1234-5678"
            required
            value={phone}
          />
        </label>
        <label className="order-field">
          ¿Qué necesitás?
          <input
            maxLength={300}
            minLength={5}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Por ejemplo, stickers para mi emprendimiento"
            required
            value={summary}
          />
        </label>
        <label className="order-field">
          Tipo de trabajo
          <select
            onChange={(event) => setCategorySlug(event.target.value)}
            value={categorySlug}
          >
            <option value="">Todavía no lo sé</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="order-field">
          Detalles (opcional)
          <textarea
            maxLength={3000}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Medidas, cantidades, colores o fecha..."
            rows={3}
            value={details}
          />
        </label>
        <div
          className={`order-file-drop${isDragging ? " is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void addFiles(event.dataTransfer.files);
          }}
        >
          <input
            accept={ACCEPTED_TYPES}
            className="visually-hidden"
            multiple
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
          <span aria-hidden="true" className="upload-symbol">＋</span>
          <div>
            <strong>Sumá fotos o archivos</strong>
            <span>Hasta 10 archivos, 15 MB cada uno y 40 MB en total.</span>
          </div>
          <button
            className="button button-secondary"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Elegir archivos
          </button>
        </div>
        {files.length > 0 ? (
          <ul className="order-file-list" aria-label="Archivos seleccionados">
            {files.map(({ id, file }) => (
              <li key={id}>
                <span>{file.name} · {formatBytes(file.size)}</span>
                <button
                  aria-label={`Quitar ${file.name}`}
                  onClick={() => removeFile(id)}
                  type="button"
                >
                  Quitar
                </button>
              </li>
            ))}
            <li className="order-file-total">
              {files.length}/{MAX_ORDER_FILES} · {formatBytes(totalFileBytes)}/40 MB
            </li>
          </ul>
        ) : null}
        {fileError ? <p className="form-message" role="alert">{fileError}</p> : null}
        <label className="order-honeypot" aria-hidden="true">
          Sitio web
          <input
            autoComplete="off"
            name="website"
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            value={website}
          />
        </label>
        {siteKey ? (
          <div className="turnstile-container" ref={turnstileContainerRef} />
        ) : (
          <p className="form-message" role="status">
            El formulario está en preparación y todavía no recibe pedidos.
          </p>
        )}
        {requestError ? <p className="form-message" role="alert">{requestError}</p> : null}
        <p className="privacy-notice">
          Usamos tus datos únicamente para responder por este pedido.{" "}
          <a href="/privacidad">Leé nuestra política de privacidad.</a>
        </p>
        <button
          className="button button-primary order-submit"
          disabled={isSubmitting || !siteKey}
          type="submit"
        >
          {isSubmitting ? "Enviando tu idea..." : "Enviar pedido"}
        </button>
      </form>
    </section>
  );
}
