"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeProductImage } from "@/lib/image/normalize";
import { createProductAction } from "./actions";

type CategoryOption = { id: string; name: string };
type ProductDraft = {
  id: string;
  fileName: string;
  name: string;
  description: string;
  categoryId: string;
  main: Blob;
  thumbnail: Blob;
  previewUrl: string;
  error: string | null;
  isUploading: boolean;
};

function productNameFromFile(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-AR"));
}

export function ProductUploader({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [drafts, setDrafts] = useState<ProductDraft[]>([]);
  const [lastCategoryId, setLastCategoryId] = useState(categories[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const draftsRef = useRef(drafts);

  useEffect(() => {
    const savedCategory = window.localStorage.getItem("etiquetame-last-category");
    if (savedCategory && categories.some((category) => category.id === savedCategory)) {
      setLastCategoryId(savedCategory);
    }
  }, [categories]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(
    () => () =>
      draftsRef.current.forEach((draft) => URL.revokeObjectURL(draft.previewUrl)),
    [],
  );

  async function addImages(fileList: FileList | File[]) {
    setFileError("");
    setNotice("");
    const selected = Array.from(fileList);
    if (drafts.length + selected.length > 10) {
      setFileError("Podés preparar hasta 10 productos a la vez.");
      return;
    }

    const newDrafts: ProductDraft[] = [];
    for (const file of selected) {
      try {
        const normalized = await normalizeProductImage(file);
        newDrafts.push({
          id: crypto.randomUUID(),
          fileName: file.name,
          name: productNameFromFile(file.name),
          description: "",
          categoryId: lastCategoryId,
          main: normalized.main,
          thumbnail: normalized.thumbnail,
          previewUrl: URL.createObjectURL(normalized.main),
          error: null,
          isUploading: false,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `${file.name}: no se pudo procesar la imagen.`;
        setFileError((current) => [current, message].filter(Boolean).join(" "));
      }
    }
    setDrafts((current) => [...current, ...newDrafts]);
  }

  function updateDraft(id: string, patch: Partial<ProductDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    );
  }

  function removeDraft(id: string) {
    setDrafts((current) => {
      const draft = current.find((item) => item.id === id);
      if (draft) URL.revokeObjectURL(draft.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function publishDraft(draft: ProductDraft) {
    const supabase = createClient();
    const mainPath = `${draft.id}/main.webp`;
    const thumbPath = `${draft.id}/thumb.webp`;
    const { error: mainError } = await supabase.storage
      .from("products")
      .upload(mainPath, draft.main, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: true,
      });
    if (mainError) {
      throw new Error(`No se pudo subir ${draft.fileName}.`, { cause: mainError });
    }

    const { error: thumbError } = await supabase.storage
      .from("products")
      .upload(thumbPath, draft.thumbnail, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: true,
      });
    if (thumbError) {
      await supabase.storage.from("products").remove([mainPath]);
      throw new Error(`No se pudo crear la miniatura de ${draft.fileName}.`, {
        cause: thumbError,
      });
    }

    await createProductAction(draft.id, {
      name: draft.name,
      description: draft.description,
      categoryId: draft.categoryId,
    });
    window.localStorage.setItem("etiquetame-last-category", draft.categoryId);
    setLastCategoryId(draft.categoryId);
  }

  async function publishAll() {
    if (drafts.some((draft) => draft.name.trim().length < 2 || !draft.categoryId)) {
      setFileError("Cada diseño necesita un nombre y una categoría.");
      return;
    }
    setFileError("");
    setNotice("");

    let index = 0;
    const completed = new Set<string>();
    async function worker() {
      while (index < drafts.length) {
        const draft = drafts[index];
        index += 1;
        updateDraft(draft.id, { isUploading: true, error: null });
        try {
          await publishDraft(draft);
          completed.add(draft.id);
          updateDraft(draft.id, { isUploading: false });
        } catch (error) {
          console.error("[admin-products] No se pudo publicar el diseño:", error);
          updateDraft(draft.id, {
            isUploading: false,
            error:
              error instanceof Error
                ? error.message
                : "No se pudo publicar este diseño.",
          });
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(3, drafts.length) }, () => worker()),
    );
    if (completed.size > 0) {
      setDrafts((current) => {
        current
          .filter((draft) => completed.has(draft.id))
          .forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
        return current.filter((draft) => !completed.has(draft.id));
      });
      setNotice(
        completed.size === 1
          ? "Producto publicado."
          : `Se publicaron ${completed.size} productos.`,
      );
    }
  }

  return (
    <section className="admin-card product-uploader">
      <div className="admin-card-heading">
        <div>
          <h2>Subir diseños</h2>
          <p className="admin-muted">Elegí una o varias imágenes; se acomodan en cuadrados automáticamente.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Elegir imágenes
        </button>
      </div>
      <input
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="visually-hidden"
        multiple
        onChange={(event) => {
          if (event.target.files) void addImages(event.target.files);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <div
        className="product-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void addImages(event.dataTransfer.files);
        }}
      >
        También podés arrastrar las imágenes acá. Se aceptan JPG, PNG y WebP.
      </div>
      {fileError ? <p className="form-message" role="alert">{fileError}</p> : null}
      {notice ? <p className="product-publish-notice" role="status">{notice}</p> : null}
      {drafts.length > 0 ? (
        <>
          <div className="product-draft-grid">
            {drafts.map((draft) => (
              <article className="product-draft-card" key={draft.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`Vista previa de ${draft.name || draft.fileName}`} src={draft.previewUrl} />
                <div className="product-draft-fields">
                  <label className="admin-field">
                    Nombre
                    <input
                      maxLength={80}
                      minLength={2}
                      onChange={(event) => updateDraft(draft.id, { name: event.target.value })}
                      value={draft.name}
                    />
                  </label>
                  <label className="admin-field">
                    Categoría
                    <select
                      onChange={(event) => updateDraft(draft.id, { categoryId: event.target.value })}
                      value={draft.categoryId}
                    >
                      <option value="">Elegí una categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <details>
                    <summary>Agregar descripción (opcional)</summary>
                    <textarea
                      maxLength={1000}
                      onChange={(event) => updateDraft(draft.id, { description: event.target.value })}
                      rows={3}
                      value={draft.description}
                    />
                  </details>
                  {draft.error ? <p className="form-message" role="alert">{draft.error}</p> : null}
                  <button
                    className="product-remove-draft"
                    disabled={draft.isUploading}
                    onClick={() => removeDraft(draft.id)}
                    type="button"
                  >
                    {draft.isUploading ? "Publicando..." : "Quitar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <button className="button button-primary product-publish-all" onClick={publishAll} type="button">
            Publicar todos
          </button>
        </>
      ) : null}
    </section>
  );
}
