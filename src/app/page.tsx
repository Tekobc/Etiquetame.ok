import Image from "next/image";
import { categories } from "@/lib/constants";

export default function Home() {
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
          <a href="#trabajos">Qué hacemos</a>
          <a href="#sobre">La tienda</a>
          <a className="nav-cta" href="#trabajos">
            Ver los trabajos
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
            <a className="button button-primary" href="#trabajos">
              Descubrí qué hacemos
              <span aria-hidden="true" className="button-spark">
                ✳
              </span>
            </a>
            <p className="hero-note">
              Diseñado con cariño. Preparado especialmente para vos.
            </p>
          </div>

          <div className="hero-art" aria-label="Algunos trabajos de Etiquétame">
            <div className="hero-art-backdrop" />
            <figure className="hero-photo sticker-photo">
              <Image
                src="/images/categorias/stickers.jpeg"
                alt="Stickers coloridos con frases y diseños propios"
                width={896}
                height={1152}
                sizes="(max-width: 760px) 64vw, 360px"
                priority
              />
            </figure>
            <figure className="hero-photo calendar-photo">
              <Image
                src="/images/categorias/almanaques.jpeg"
                alt="Almanaques personalizados para emprendimientos"
                width={900}
                height={1600}
                sizes="(max-width: 760px) 28vw, 164px"
              />
            </figure>
            <div className="hero-sticker-note">
              <span className="note-star" aria-hidden="true">
                ✦
              </span>
              <span>Hecho para vos</span>
            </div>
            <div className="hero-dot-pattern" aria-hidden="true" />
          </div>
        </section>

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
        <a className="back-to-top" href="#inicio">
          Volver al inicio
        </a>
      </footer>
    </>
  );
}
