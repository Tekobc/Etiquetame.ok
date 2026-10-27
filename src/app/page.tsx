import Image from "next/image";
import { categories } from "@/lib/constants";
import { OrderForm } from "./components/public/order-form";
import { ProductCatalog } from "./components/public/product-catalog";
import { createClient } from "@/lib/supabase/server";
import type { PublicProduct } from "@/lib/products/types";

export default async function Home() {
  const supabase = await createClient();
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("products")
      .select("id, slug, name, description, category_id, image_path, thumb_path, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);
  const catalogError = categoriesResult.error ?? productsResult.error;
  if (catalogError) {
    console.error("[catalog] No se pudo cargar el catálogo público:", catalogError);
  }

  const categoryMap = new Map(
    (categoriesResult.data ?? []).map((category) => [category.id, category]),
  );
  const products: PublicProduct[] = (productsResult.data ?? []).flatMap((product) => {
    const category = categoryMap.get(product.category_id);
    if (!category) return [];
    return [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        categoryId: product.category_id,
        categorySlug: category.slug,
        categoryName: category.name,
        imageUrl: supabase.storage.from("products").getPublicUrl(product.image_path).data.publicUrl,
        thumbUrl: supabase.storage.from("products").getPublicUrl(product.thumb_path).data.publicUrl,
        createdAt: product.created_at,
      },
    ];
  });

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Etiquétame, inicio">
          <Image
            className="brand-logo"
            src="/brand/logo.png"
            alt=""
            width={76}
            height={76}
          />
          <span className="brand-caption">Tienda de stickers by Luana</span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          <a href="#catalogo">Diseños</a>
          <a href="#trabajos">Qué hacemos</a>
          <a className="nav-cta" href="#pedir">
            Hacer un pedido
          </a>
        </nav>
      </header>

      <main>
        <section className="hero section-wrap" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true" className="eyebrow-spark">
                ✦
              </span>
              Ideas lindas, hechas a tu manera
            </p>
            <h1>
              Todo lo que querés pegar,{" "}
              <span className="title-highlight">lo hacemos a tu medida.</span>
            </h1>
            <p className="hero-description">
              Stickers, almanaques, toppers, encendedores y señaladores
              personalizados. Contanos tu idea y la hacemos realidad.
            </p>
            <a className="button button-primary" href="#pedir">
              Hacer un pedido
              <span aria-hidden="true" className="button-spark">
                ✳
              </span>
            </a>
            <p className="hero-note">
              Diseñado con cariño. Preparado especialmente para vos.
            </p>
            <div className="hero-sticker-cluster" aria-hidden="true">
              {categories.slice(0, 3).map((category, index) => (
                <div className={`hero-mini-sticker hero-mini-sticker-${index + 1}`} key={category.slug}>
                  <Image
                    alt=""
                    height={150}
                    priority={index === 0}
                    src={category.image}
                    width={150}
                  />
                </div>
              ))}
              <span className="hero-mini-caption">Ideas hechas a tu medida ✦</span>
            </div>
          </div>

          <OrderForm products={products} />
        </section>

        <ProductCatalog
          categories={categoriesResult.data ?? []}
          loadError={catalogError ? "No pudimos cargar los diseños ahora. Volvé a intentarlo más tarde." : null}
          products={products}
        />

        <section className="work-section section-wrap" id="trabajos">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Un mundo de posibilidades</p>
              <h2>¿Qué te gustaría hacer?</h2>
            </div>
            <p className="section-intro">
              Contanos tu idea: hay un montón de formas de convertirla en algo
              especial.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <article
                className={`category-card category-card-${index + 1}`}
                key={category.slug}
              >
                <div className="category-image-wrap">
                  <Image
                    className="category-image"
                    src={category.image}
                    alt={category.imageAlt}
                    width={category.width}
                    height={category.height}
                    sizes="(max-width: 640px) 88vw, (max-width: 980px) 42vw, 30vw"
                  />
                  <span className="category-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <div className="category-copy">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <a
                    className="category-order-link"
                    href={`/?categoria=${category.slug}#pedir`}
                  >
                    Pedir esto
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="sobre">
          <div className="about-inner section-wrap">
            <span className="about-spark" aria-hidden="true">
              ✳
            </span>
            <div>
              <p className="eyebrow">Pequeños detalles, grandes sonrisas</p>
              <h2>Una tienda creativa para darle forma a tus ideas.</h2>
            </div>
            <p className="about-copy">
              Etiquétame es el espacio de Luana para crear piezas personalizadas
              con color, dedicación y ese detalle que las hace tuyas.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#inicio">
          Etiquétame
        </a>
        <p>Hecho con cariño por Luana, en Argentina.</p>
        {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? (
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}`}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp
          </a>
        ) : null}
        {process.env.NEXT_PUBLIC_INSTAGRAM_URL ? (
          <a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL} rel="noreferrer" target="_blank">
            Instagram
          </a>
        ) : null}
        <a href="/privacidad">Privacidad</a>
        <a className="back-to-top" href="#inicio">
          Volver al inicio
        </a>
      </footer>
    </>
  );
}
