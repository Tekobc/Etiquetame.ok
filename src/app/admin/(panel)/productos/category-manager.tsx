"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeProductImage } from "@/lib/image/normalize";
import {
  createCategoryAction,
  setCategoryActiveAction,
  updateCategoryAction,
} from "./actions";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  isActive: boolean;
};

function CategoryEditor({
  category,
  onCancel,
}: {
  category?: CategoryRow;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [cover, setCover] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState(category?.coverUrl ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function selectCover(file: File) {
    try {
      const normalized = await normalizeProductImage(file);
      setCover(normalized.main);
      setPreviewUrl(URL.createObjectURL(normalized.main));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo preparar la portada.");
    }
  }

  function save() {
    const id = category?.id ?? crypto.randomUUID();
    setMessage("");
    startTransition(async () => {
      try {
        const supabase = createClient();
        const path = `categories/${id}/cover.webp`;
        if (cover) {
          const { error } = await supabase.storage.from("products").upload(path, cover, {
            cacheControl: "31536000",
            contentType: "image/webp",
            upsert: true,
          });
          if (error) throw new Error("No se pudo subir la portada.", { cause: error });
        }

        if (category) {
          await updateCategoryAction(id, { name, description, hasCover: Boolean(cover) });
          setMessage("Categoría actualizada.");
        } else {
          await createCategoryAction(id, { name, description, hasCover: Boolean(cover) });
          setMessage("Categoría creada.");
          setName("");
          setDescription("");
          setCover(null);
          setPreviewUrl("");
        }
        window.location.reload();
      } catch (error) {
        console.error("[admin-categories] No se pudo guardar la categoría:", error);
        setMessage(error instanceof Error ? error.message : "No se pudo guardar la categoría.");
      }
    });
  }

  return (
    <article className="category-admin-editor">
      {previewUrl ? (
        <Image alt="" className="category-admin-cover" height={150} src={previewUrl} unoptimized width={150} />
      ) : (
        <div className="category-admin-cover category-admin-cover-empty">Sin portada</div>
      )}
      <div className="category-admin-fields">
        <label className="admin-field">
          Nombre
          <input maxLength={80} minLength={2} onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label className="admin-field">
          Descripción
          <textarea maxLength={1000} onChange={(event) => setDescription(event.target.value)} rows={2} value={description} />
        </label>
        <input
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void selectCover(file);
            event.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
        <div className="product-admin-actions">
          <button className="button button-secondary" disabled={isPending} onClick={() => inputRef.current?.click()} type="button">
            {cover ? "Cambiar portada" : "Subir portada"}
          </button>
          <button className="button button-primary" disabled={isPending || name.trim().length < 2} onClick={save} type="button">
            {isPending ? "Guardando..." : category ? "Guardar cambios" : "Crear categoría"}
          </button>
          {onCancel ? <button className="product-visibility-toggle" disabled={isPending} onClick={onCancel} type="button">Cancelar</button> : null}
        </div>
        <p aria-live="polite" className="product-edit-message">{message}</p>
      </div>
    </article>
  );
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function toggle(category: CategoryRow) {
    startTransition(async () => {
      try {
        await setCategoryActiveAction(category.id, !category.isActive);
        window.location.reload();
      } catch (error) {
        console.error("[admin-categories] No se pudo cambiar la visibilidad:", error);
        setMessage(error instanceof Error ? error.message : "No se pudo cambiar la visibilidad.");
      }
    });
  }

  return (
    <section className="admin-card category-manager">
      <div className="admin-card-heading">
        <div>
          <h2>Categorías</h2>
          <p className="admin-muted">Editá los nombres, descripciones y portadas que ve tu clientela.</p>
        </div>
        {!creating ? <button className="button button-primary" onClick={() => setCreating(true)} type="button">Nueva categoría</button> : null}
      </div>
      {creating ? <CategoryEditor onCancel={() => setCreating(false)} /> : null}
      <div className="category-admin-list">
        {categories.map((category) => (
          <div className="category-admin-row" key={category.id}>
            <CategoryEditor category={category} />
            <button className="product-visibility-toggle" disabled={isPending} onClick={() => toggle(category)} type="button">
              {category.isActive ? "Activa · ocultar" : "Oculta · activar"}
            </button>
          </div>
        ))}
      </div>
      <p aria-live="polite" className="product-edit-message">{message}</p>
    </section>
  );
}
