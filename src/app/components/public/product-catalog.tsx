"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicProduct } from "@/lib/products/types";

const PAGE_SIZE = 12;

function shuffleProducts(items: PublicProduct[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }
  return result;
}

export function ProductCatalog({
  products,
  categories,
  loadError,
}: {
  products: PublicProduct[];
  categories: Array<{ slug: string; name: string }>;
  loadError: string | null;
}) {
  const [shuffled, setShuffled] = useState(products);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setShuffled(shuffleProducts(products));
  }, [products]);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("producto");
    if (slug && products.some((product) => product.slug === slug)) {
      setSelectedSlug(slug);
    }
  }, [products]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedSlug && !dialog.open) {
      dialog.showModal();
    } else if (!selectedSlug && dialog.open) {
      dialog.close();
    }
  }, [selectedSlug]);

  const selectedProduct = products.find((product) => product.slug === selectedSlug);
  const filteredProducts = useMemo(
    () =>
      shuffled.filter(
        (product) => !categoryFilter || product.categorySlug === categoryFilter,
      ),
    [categoryFilter, shuffled],
  );
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const carouselProducts = shuffled.slice(0, Math.min(8, shuffled.length));

  useEffect(() => {
    if (
      carouselProducts.length < 4 ||
      carouselPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        setCarouselIndex((current) => (current + 1) % carouselProducts.length);
      }
    }, 7000);

    return () => window.clearInterval(interval);
  }, [carouselPaused, carouselProducts.length]);

  function reflectProductInUrl(slug: string | null) {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set("producto", slug);
    } else {
      url.searchParams.delete("producto");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function openProduct(slug: string) {
    setSelectedSlug(slug);
    reflectProductInUrl(slug);
  }

  function closeProduct() {
    setSelectedSlug(null);
    reflectProductInUrl(null);
  }

  function askForProduct(product: PublicProduct) {
    closeProduct();
    window.dispatchEvent(
      new CustomEvent("etiquetame:product-selected", {
        detail: {
          id: product.id,
          name: product.name,
          categorySlug: product.categorySlug,
        },
      }),
    );
  }

  return (
    <>
      <section className="product-showcase section-wrap" id="catalogo">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Diseños para inspirarte</p>
            <h2>Un sticker puede empezar una gran idea.</h2>
          </div>
          <p className="section-intro">
            Mirá algunos diseños y contanos cuál te gustaría hacer a tu manera.
          </p>
        </div>

        {loadError ? (
          <p className="catalog-error" role="alert">{loadError}</p>
        ) : products.length === 0 ? (
          <p className="catalog-empty">
            Estamos preparando nuevos diseños. Mientras tanto,{" "}
            <a href="#pedir">contanos qué necesitás</a>.
          </p>
        ) : (
          <>
            {carouselProducts.length >= 4 ? (
              <div
                className="product-carousel"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setCarouselPaused(false);
                  }}}
                  onFocus={() => setCarouselPaused(true)}
                  onMouseEnter={() => setCarouselPaused(true)}
                  onMouseLeave={() => setCarouselPaused(false)}
                >
                <div className="product-carousel-controls">
                  <span>Algunos diseños, elegidos al azar</span>
                  <div>
                    <button
                      aria-label="Ver diseños anteriores"
                      onClick={() =>
                        setCarouselIndex((current) =>
                          (current - 1 + carouselProducts.length) % carouselProducts.length,
                        )
                      }
                      type="button"
                    >
                      Anterior
                    </button>
                    <button
                      aria-label="Ver más diseños"
                      onClick={() =>
                        setCarouselIndex((current) => (current + 1) % carouselProducts.length)
                      }
                      type="button"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
                <button
                  className="product-carousel-item"
                  onClick={() => openProduct(carouselProducts[carouselIndex].slug)}
                  type="button"
                >
                  <Image
                    alt={carouselProducts[carouselIndex].name}
                    height={320}
                    src={carouselProducts[carouselIndex].thumbUrl}
                    unoptimized
                    width={320}
                  />
                  <span>{carouselProducts[carouselIndex].name}</span>
                </button>
              </div>
            ) : null}

            <div className="catalog-filters" aria-label="Filtrar diseños por categoría">
              <button
                aria-pressed={!categoryFilter}
                className={!categoryFilter ? "is-selected" : ""}
                onClick={() => {
                  setCategoryFilter("");
                  setVisibleCount(PAGE_SIZE);
                }}
                type="button"
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  aria-pressed={categoryFilter === category.slug}
                  className={categoryFilter === category.slug ? "is-selected" : ""}
                  key={category.slug}
                  onClick={() => {
                    setCategoryFilter(category.slug);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  type="button"
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="public-product-grid">
              {visibleProducts.map((product) => (
                <button
                  aria-label={`Ver ${product.name}`}
                  className="public-product-card"
                  key={product.id}
                  onClick={() => openProduct(product.slug)}
                  type="button"
                >
                  <span className="public-product-image">
                    <Image
                      alt=""
                      height={420}
                      loading="lazy"
                      src={product.thumbUrl}
                      unoptimized
                      width={420}
                    />
                  </span>
                  <span className="public-product-name">{product.name}</span>
                  <span className="public-product-category">{product.categoryName}</span>
                </button>
              ))}
            </div>
            {visibleProducts.length < filteredProducts.length ? (
              <button
                className="button button-secondary catalog-more"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                type="button"
              >
                Ver más diseños
              </button>
            ) : null}
          </>
        )}
      </section>

      <dialog
        aria-labelledby="product-dialog-title"
        className="product-dialog"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeProduct();
        }}
        onClose={() => {
          if (selectedSlug) {
            setSelectedSlug(null);
            reflectProductInUrl(null);
          }
        }}
        ref={dialogRef}
      >
        {selectedProduct ? (
          <div className="product-dialog-content">
            <button
              aria-label="Cerrar detalle"
              className="product-dialog-close"
              onClick={closeProduct}
              type="button"
            >
              Cerrar
            </button>
            <Image
              alt={selectedProduct.name}
              height={700}
              src={selectedProduct.imageUrl}
              unoptimized
              width={700}
            />
            <div>
              <p className="eyebrow">{selectedProduct.categoryName}</p>
              <h2 id="product-dialog-title">{selectedProduct.name}</h2>
              {selectedProduct.description ? <p>{selectedProduct.description}</p> : null}
              <button
                className="button button-primary"
                onClick={() => askForProduct(selectedProduct)}
                type="button"
              >
                Pedir este diseño
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
