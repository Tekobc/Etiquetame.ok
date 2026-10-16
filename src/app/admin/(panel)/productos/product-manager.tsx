"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  deleteProductAction,
  setProductActiveAction,
  updateProductAction,
} from "./actions";
import { ProductUploader } from "./product-uploader";

type CategoryOption = { id: string; name: string };
type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  thumbUrl: string;
  isActive: boolean;
};

function ProductCard({
  product,
  categories,
}: {
  product: ProductRow;
  categories: CategoryOption[];
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage("");
    startTransition(async () => {
      try {
        await updateProductAction(product.id, { name, description, categoryId });
        setMessage("Cambios guardados.");
      } catch (error) {
        console.error("[admin-products] No se pudo editar el producto:", error);
        setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
      }
    });
  }

  function toggleVisibility() {
    startTransition(async () => {
      try {
        await setProductActiveAction(product.id, !product.isActive);
      } catch (error) {
        console.error("[admin-products] No se pudo cambiar la visibilidad:", error);
        setMessage("No se pudo cambiar la visibilidad.");
      }
    });
  }

  function remove() {
    if (!window.confirm(`¿Querés eliminar "${product.name}" y sus imágenes?`)) return;
    startTransition(async () => {
      try {
        await deleteProductAction(product.id);
      } catch (error) {
        console.error("[admin-products] No se pudo eliminar el producto:", error);
        setMessage("No se pudo eliminar el producto.");
      }
    });
  }

  return (
    <article className="product-admin-card">
      <Image
        alt=""
        height={360}
        src={product.thumbUrl}
        unoptimized
        width={360}
      />
      <div className="product-admin-fields">
        <label className="admin-field">
          Nombre
          <input maxLength={80} minLength={2} onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <label className="admin-field">
          Categoría
          <select onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <details>
          <summary>Descripción</summary>
          <textarea maxLength={1000} onChange={(event) => setDescription(event.target.value)} rows={3} value={description} />
        </details>
        <div className="product-admin-actions">
          <button className="button button-secondary" disabled={isPending} onClick={save} type="button">
            Guardar
          </button>
          <button className="product-visibility-toggle" disabled={isPending} onClick={toggleVisibility} type="button">
            {product.isActive ? "Activo · ocultar" : "Oculto · activar"}
          </button>
          <button className="product-delete-button" disabled={isPending} onClick={remove} type="button">
            Eliminar
          </button>
        </div>
        <p aria-live="polite" className="product-edit-message">{message}</p>
      </div>
    </article>
  );
}

export function ProductManager({
  categories,
  products,
}: {
  categories: CategoryOption[];
  products: ProductRow[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const visibleProducts = products.filter((product) => {
    const matchesSearch = product.name.toLocaleLowerCase("es-AR").includes(search.toLocaleLowerCase("es-AR"));
    return matchesSearch && (!categoryFilter || product.categoryId === categoryFilter);
  });

  return (
    <div className="product-manager">
      <ProductUploader categories={categories} />
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Diseños publicados</h2>
            <p className="admin-muted">{products.length} productos en total</p>
          </div>
          <div className="product-list-filters">
            <label className="visually-hidden" htmlFor="product-search">Buscar productos</label>
            <input
              id="product-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar diseño"
              type="search"
              value={search}
            />
            <label className="visually-hidden" htmlFor="product-category-filter">Filtrar por categoría</label>
            <select
              id="product-category-filter"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
        {visibleProducts.length === 0 ? (
          <p className="admin-muted">No hay diseños que coincidan con la búsqueda.</p>
        ) : (
          <div className="product-admin-grid">
            {visibleProducts.map((product) => (
              <ProductCard categories={categories} key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
