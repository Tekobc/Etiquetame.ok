# CONTEXT.md — Etiquétame (Tienda de Stickers by Luana)

> Documento de contexto para el agente de código. Leelo completo antes de escribir una sola línea. Cuando algo no esté especificado, elegí el default más razonable, **anotalo en `DECISIONS.md`** y seguí. Si una ambigüedad cambia sustancialmente la solución, frená y preguntá.

---

## 0. Cómo trabajar con este documento

1. Seguí el **plan por fases** de la sección 16. No saltes de fase sin cumplir los criterios de aceptación.
2. Cada decisión técnica no obvia debe quedar en `DECISIONS.md` con: decisión, alternativa descartada, motivo y limitación conocida.
3. Verificá ejecutando (`pnpm build`, `pnpm lint`, `pnpm typecheck`) antes de dar una fase por terminada. Si algo no se pudo verificar, decilo explícitamente.
4. Ningún secreto en el código. Todo por variables de entorno (sección 15).
5. Idioma de la UI y del contenido: **español rioplatense (es-AR), con voseo** ("Pedí", "Elegí", "Subí"). Código, nombres de variables, tablas y commits: inglés.

---

## 1. Resumen del proyecto

**Etiquétame** es un emprendimiento argentino de **fabricación y venta de productos personalizados**, con foco en stickers. Se necesita un sitio web publicado en **Vercel** con backend en **Supabase** (Auth + Postgres + Storage).

El sitio tiene dos caras:

| Cara | Ruta | Quién la usa | Objetivo |
|---|---|---|---|
| **Pública** | `/` | Clientes, sin login | Conocer la marca, ver stickers disponibles, entender los trabajos personalizados y **generar un pedido** |
| **Admin** | `/admin/*` | Solo Luana (y quien ella autorice) | Cargar productos, recibir y gestionar pedidos, descargar adjuntos |

**Objetivo de negocio:** que un cliente nuevo pase de "llegué al sitio" a "mandé un pedido" en menos de 2 minutos, y que Luana gestione todo sin tocar código.

### Qué se hace en el emprendimiento (debe explicarse en el sitio)

Hay **5 categorías de trabajo**, cada una con una foto de referencia ya provista:

| # | Categoría | Slug | Archivo adjunto | Qué mostrar |
|---|---|---|---|---|
| 1 | **Stickers** | `stickers` | `sticker.ok.jpeg` | Stickers con frases y diseños, troquelados, listos para pegar |
| 2 | **Almanaques** | `almanaques` | `almanaq.ok.jpeg` | Almanaques/imanes personalizados con la marca del cliente (ej. un emprendimiento de pastelería con calendario 2026) |
| 3 | **Toppers y escenografía para mesa dulce** | `toppers-y-mesa-dulce` | `cumple.ok.webp` | Toppers para tortas y cupcakes, carteles, bolsitas y ambientación temática de cumpleaños (ej. cumple "Alfonso 4" temática construcción) |
| 4 | **Encendedores personalizados** | `encendedores` | `encendedor.ok.jpeg` | Encendedores con diseño a medida |
| 5 | **Señaladores** | `senaladores` | `señalador.ok.jpeg` | Señaladores de libros con diseños propios o personalizados |

Los seis archivos adjuntos originales están en la raíz del proyecto (`logo.ok.png` y las cinco fotos de la tabla). Al implementar la Fase 0, ubicarlos en las rutas `public/` de la sección 4, conservando el formato de imagen y normalizando los nombres de destino sin tildes.

> **Nota de contenido (no bloqueante):** la foto del encendedor muestra un personaje con derechos de autor. Para el sitio público conviene reemplazarla a futuro por un diseño propio o del cliente, para evitar reclamos de propiedad intelectual. Mientras tanto, usarla como placeholder.

---

## 2. Marca y dirección visual

### Identidad (extraída del logo adjunto `logo.ok.png`)

- **Nombre:** Etiquétame — "Tienda de stickers by Luana".
- **Logo:** círculo amarillo con tipografía bubble/retro en turquesa con contorno blanco, dos destellos en forma de rombo. Es **redondo, gordito, amigable, tipo sticker**.
- **Personalidad:** cálida, divertida, artesanal, con onda. Los productos de las fotos son pasteles y coloridos (rosa, lila, amarillo, celeste, rojo flor). El sitio debe sentirse como **abrir una hoja de stickers**, no como una tienda genérica.
- El logo adjunto `logo.ok.png` mide 1181 × 1181 px y cumple el mínimo de 1024 px. Usarlo tal cual en `public/brand/logo.png` y generar el favicon desde él; pedir un SVG solo si Luana dispone del original vectorial.

### Tokens de diseño (proponer, validar con eyedropper sobre el logo)

```css
:root {
  /* Marca */
  --sol:        #F6B72C; /* amarillo del logo: fondo de acentos y CTA */
  --turquesa:   #16A69A; /* turquesa del logo: títulos, links, foco */
  --tinta:      #17333A; /* texto principal (azul petróleo oscuro, NO negro puro) */
  --papel:      #FFFDF7; /* fondo base, blanco hueso cálido */

  /* Pasteles tomados de los stickers de referencia */
  --rosa:       #F6A9BE;
  --lila:       #BBA8EA;
  --durazno:    #FFD3B0;
  --celeste:    #A9D8F2;

  /* Utilidad */
  --error:      #D93C4A;
  --ok:         #2E9E6B;
}
```

Reglas de color: el amarillo y el turquesa son protagonistas; los pasteles aparecen **en los stickers y como fondo de tarjetas de categoría**, no como decoración suelta. Verificar contraste AA (4.5:1) en todo texto. El turquesa sobre amarillo **no** cumple para texto chico: usar `--tinta` sobre amarillo.

### Tipografía

- **Display (títulos, hero):** `Bagel Fat One` (Google Fonts). Gordita y redonda, hermana del logo.
- **Cuerpo / UI:** `Figtree`. Legible, amable, muchos pesos.
- Cargar con `next/font/google` (self-hosting automático, sin layout shift).
- Escala: base 16 px, ratio ~1.25. Largo de línea < 70 caracteres. Títulos en sentence case, no todo en mayúsculas.

### Principios de UI

1. **El sticker es el lenguaje visual.** Todo lo "tarjeta" tiene esquinas generosas, borde blanco grueso tipo troquelado y sombra suave que lo despega de la hoja. Sin bordes finos de 1 px estilo SaaS.
2. **Una sola cosa memorable: el hero.** El resto del sitio es prolijo y tranquilo.
3. **Movimiento con propósito.** Una secuencia de entrada orquestada en el hero y respuestas a acciones del usuario (abrir modal, confirmar pedido). Nada de fade-in en cada sección.
4. **Mobile first.** La mayoría del tráfico llegará desde Instagram/WhatsApp en celular.
5. Evitar: etiquetas en mayúsculas espaciadas sobre cada título, flechas `→` en todos los botones, grillas de tarjetas idénticas sin jerarquía.

---

## 3. Stack técnico y decisiones

| Capa | Elección | Por qué (y alternativa descartada) |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript estricto** | Integración nativa con Vercel, Server Actions / Route Handlers, SSR para SEO. Descartado: Vite SPA (peor SEO y sin backend propio para firmar uploads). |
| Estilos | **Tailwind CSS v4** + variables CSS de la sección 2 | Rapidez y consistencia. |
| Componentes base | **shadcn/ui** (Radix) para `Dialog`, `Sheet`, `Select`, `Toast`, `Table`, `Tabs` | Accesibilidad resuelta (foco, ESC, aria) sin reinventar. |
| Animación | **Motion** (ex Framer Motion) | Layout animations, gestos, `useReducedMotion`. Descartado GSAP: más potente, pero más peso y licencia más compleja para lo que se necesita. |
| Carrusel | **Embla Carousel** + plugin autoplay | Liviano, táctil, accesible. |
| Formularios | **react-hook-form + zod** | Mismo schema zod en cliente y servidor. |
| Backend | **Supabase**: Auth, Postgres (con RLS), Storage | Pedido por el cliente. |
| Cliente Supabase | `@supabase/ssr` + `@supabase/supabase-js` | Sesión por cookies en App Router. |
| Procesado de imagen (cliente) | Canvas API nativa (sin dependencia) | Ver sección 11. |
| ZIP de adjuntos | `jszip` (solo en admin, import dinámico) | Descargar todos los adjuntos de un pedido de una vez. |
| Anti-spam | Honeypot + rate limit en Supabase | El formulario público escribe en la base; hay que protegerlo sin depender de un servicio externo. |
| Package manager | `pnpm` | |
| Deploy | **Vercel** (preview por PR + producción en `main`) | |

**Decisiones clave a respetar:**

- **Los pedidos públicos NO se insertan desde el navegador directo a Supabase.** Pasan por un Route Handler que valida, protege contra spam y usa la `service_role` solo en servidor. Alternativa descartada: política RLS de INSERT para `anon` (más simple, pero deja la tabla expuesta a spam y a payloads arbitrarios).
- **Los archivos del pedido se suben directo del navegador a Storage con URLs firmadas**, no a través de Vercel. Motivo: las Functions de Vercel limitan el body (~4.5 MB) y fotos de celular pesan más.

---

## 4. Estructura de carpetas

```
.
├─ context.md
├─ DECISIONS.md
├─ public/
│  ├─ brand/logo.png                  # ← logo.ok.png; reemplazar por SVG si Luana lo aporta
│  └─ images/categorias/
│     ├─ stickers.jpeg                # ← sticker.ok.jpeg
│     ├─ almanaques.jpeg              # ← almanaq.ok.jpeg
│     ├─ toppers-y-mesa-dulce.webp    # ← cumple.ok.webp
│     ├─ encendedores.jpeg            # ← encendedor.ok.jpeg
│     └─ senaladores.jpeg             # ← señalador.ok.jpeg (renombrar sin ñ)
├─ supabase/
│  ├─ migrations/0001_init.sql        # esquema + RLS + storage (sección 5 y 6)
│  └─ seed.sql                        # las 5 categorías
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx                  # hero + pedido, carrusel, trabajos, catálogo
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ (panel)/
│  │  │  │  ├─ layout.tsx             # guard de admin + sidebar
│  │  │  │  ├─ page.tsx               # resumen
│  │  │  │  ├─ pedidos/page.tsx
│  │  │  │  ├─ pedidos/[id]/page.tsx
│  │  │  │  ├─ productos/page.tsx
│  │  │  │  └─ productos/nuevo/page.tsx
│  │  ├─ api/orders/route.ts          # POST: crea pedido + URLs firmadas
│  │  ├─ api/orders/[id]/confirm/route.ts
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ public/  (Hero, OrderForm, FileDropzone, ProductCarousel, ProductGrid, ProductDialog, WorkCategories, Footer)
│  │  ├─ admin/   (OrdersTable, OrderDetail, AttachmentList, ProductUploader, ProductForm)
│  │  └─ ui/      # shadcn
│  ├─ lib/
│  │  ├─ supabase/{client.ts,server.ts,admin.ts,middleware.ts}
│  │  ├─ image/normalize.ts           # sección 11
│  │  ├─ validation/{order.ts,product.ts}
│  │  ├─ constants.ts                 # límites de archivos, categorías, WhatsApp
│  │  └─ utils.ts
│  ├─ middleware.ts                   # refresca sesión + protege /admin
│  └─ types/database.ts               # generado con `supabase gen types`
└─ .env.example
```

---

## 5. Modelo de datos (Postgres / Supabase)

Archivo: `supabase/migrations/0001_init.sql`. Todo el esquema con **RLS activado en todas las tablas**.

```sql
create extension if not exists pgcrypto;

-- ───────── Admins ─────────
-- Rol por tabla (no por user_metadata, que el usuario puede editar).
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───────── Categorías ─────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  cover_path  text,                       -- ruta en /public o en bucket
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

-- ───────── Productos (catálogo público) ─────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug        text not null unique,
  name        text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  image_path  text not null,              -- imagen normalizada 1200x1200 (bucket "products")
  thumb_path  text not null,              -- miniatura 480x480
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_active_idx   on public.products (is_active, created_at desc);
create index products_category_idx on public.products (category_id);

-- ───────── Pedidos ─────────
create type public.order_status as enum
  ('nuevo', 'en_proceso', 'listo', 'entregado', 'cancelado');

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone         text not null check (char_length(phone) between 6 and 20),
  summary       text not null check (char_length(summary) between 5 and 300),   -- breve descripción
  details       text not null default '' check (char_length(details) <= 3000),  -- detalles
  category_id   uuid references public.categories(id) on delete set null,       -- opcional
  product_id    uuid references public.products(id)   on delete set null,       -- si "pidió este diseño"
  status        public.order_status not null default 'nuevo',
  admin_notes   text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index orders_status_created_idx on public.orders (status, created_at desc);

-- ───────── Adjuntos del pedido ─────────
create table public.order_attachments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  storage_path text not null,             -- bucket "order-files": {order_id}/{uuid}-{nombre_saneado}
  file_name    text not null,             -- nombre original (solo para mostrar)
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),
  uploaded     boolean not null default false,   -- se pone true en /confirm
  created_at   timestamptz not null default now()
);
create index order_attachments_order_idx on public.order_attachments (order_id);

-- ───────── updated_at automático ─────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ───────── RLS ─────────
alter table public.admins            enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.order_attachments enable row level security;

-- Lectura pública solo de lo activo
create policy "public read categories" on public.categories
  for select using (is_active);
create policy "public read products" on public.products
  for select using (is_active);

-- Admin: todo
create policy "admin all categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all attachments" on public.order_attachments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read admins" on public.admins
  for select to authenticated using (public.is_admin());

-- IMPORTANTE: NO hay policy de INSERT para anon en orders / order_attachments.
-- Los pedidos entran únicamente por el Route Handler con service_role.
```

`seed.sql`: insertar las 5 categorías de la sección 1 con `sort_order` 1–5 y descripciones cortas en español.

**Primer admin:** crear el usuario en Supabase Auth (dashboard) y ejecutar manualmente:
`insert into public.admins (user_id) values ('<uuid-del-usuario>');`
Documentarlo en el README. Desactivar "Allow new users to sign up" en Auth: **nadie se registra solo**.

---

## 6. Storage

| Bucket | Visibilidad | Contenido | Acceso |
|---|---|---|---|
| `products` | **Público (lectura)** | Imágenes normalizadas del catálogo (`{product_id}/main.webp`, `{product_id}/thumb.webp`) | Escritura solo admin |
| `order-files` | **Privado** | Adjuntos de pedidos (`{order_id}/{uuid}-{nombre}`) | Subida con URL firmada generada por servidor; lectura solo admin vía URL firmada de corta duración |

```sql
insert into storage.buckets (id, name, public) values
  ('products', 'products', true),
  ('order-files', 'order-files', false)
on conflict (id) do nothing;

create policy "admin write products bucket" on storage.objects
  for all to authenticated
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

create policy "admin read order-files" on storage.objects
  for select to authenticated
  using (bucket_id = 'order-files' and public.is_admin());
-- Sin policy de escritura para anon en order-files: se usa createSignedUploadUrl desde el servidor.
```

Configurar en el bucket `order-files`: tamaño máximo por archivo y lista de MIME permitidos (defensa en profundidad además de la validación del servidor).

---

## 7. Autenticación y autorización

- **Supabase Auth con email + contraseña** (magic link como mejora opcional). Solo `/admin/login`. **Sin registro público.**
- `middleware.ts`: refresca la sesión (`@supabase/ssr`) y redirige a `/admin/login` si no hay sesión en `/admin/*`.
- **El middleware NO es la única barrera.** Cada layout/página/acción de `/admin` debe volver a verificar `getUser()` **y** `is_admin()` en el servidor. Si el usuario está logueado pero no es admin → 403 y cerrar sesión.
- Las Server Actions de admin verifican admin al principio de cada una.
- Usar `supabase.auth.getUser()` (valida contra Auth), **no** `getSession()`, para decisiones de seguridad en servidor.
- `SUPABASE_SERVICE_ROLE_KEY` solo existe en servidor (`lib/supabase/admin.ts`, con `import 'server-only'`). Jamás en un componente cliente ni con prefijo `NEXT_PUBLIC_`.

---

## 8. Sitio público (`/`)

Una sola página larga con anclas, `scroll-behavior: smooth`, header fijo con logo + links (Catálogo, Trabajos, Pedir) + botón WhatsApp.

### 8.1 Hero + pedido (la pantalla estrella)

**Requisito:** el hero y el formulario de pedido viven **en la misma pantalla** (primer viewport en desktop).

**Concepto visual: "la hoja de stickers".**

```
┌──────────────────────────────────────────────────────────────┐
│ [logo]            Catálogo   Trabajos   Pedir    [WhatsApp]  │
│                                                              │
│  Stickers y cosas           ┌───────────────────────────┐   │
│  lindas hechas a tu         │  Pedí lo tuyo             │   │
│  medida.                    │  Nombre  [_____________]  │   │
│  Almanaques, toppers,       │  Teléfono[_____________]  │   │
│  encendedores y más.        │  ¿Qué necesitás? [______] │   │
│                             │  Detalles   [__________]  │   │
│   ✦ stickers flotando ✦     │  [ Subí fotos o archivos ]│   │
│   (parallax + despegue)     │  [  Enviar pedido  ]      │   │
│                             └───────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- **Izquierda:** titular en `Bagel Fat One`, bajada corta, y una composición de **7–9 stickers con borde blanco troquelado** (usar imágenes reales del catálogo cuando existan; placeholders de las fotos provistas mientras tanto) que flotan con parallax suave y reaccionan al mouse/giroscopio. Al pasar el cursor/tocar, un sticker **"se despega" en una esquina** (efecto peel con `clip-path` + gradiente de brillo) y rota levemente.
- **Secuencia de entrada única (no repetir en otras secciones):** los stickers "se pegan" uno por uno (escala 1.15 → 1 con leve rotación y sombra que se achica), luego aparece el titular y por último el formulario. Duración total < 1.6 s. Respetar `prefers-reduced-motion` (sin movimiento, aparición simple).
- **Derecha:** tarjeta del formulario con estética de sticker (borde blanco grueso, sombra suave, esquina levemente despegada).
- **Mobile:** titular + 3 stickers animados + CTA "Hacer un pedido" que baja al formulario (que queda inmediatamente debajo). No ocultar el formulario en un modal.
- Copy sugerido (editable): H1 *"Todo lo que querés pegar, lo hacemos a tu medida."* · Bajada *"Stickers, almanaques, toppers, encendedores y señaladores personalizados. Contanos tu idea y la hacemos realidad."*
- Rendimiento: el LCP no puede depender de animaciones pesadas. Las imágenes del hero con `priority`, tamaños explícitos y formatos modernos. Cargar la capa de parallax/gestos de forma diferida.

### 8.2 Formulario de pedido (UI)

Campos (schema zod compartido, `lib/validation/order.ts`):

| Campo | Tipo | Reglas |
|---|---|---|
| Nombre | texto | requerido, 2–80 |
| Teléfono | texto | requerido; aceptar formatos argentinos (`+54 9 11…`, `11 1234-5678`); normalizar a dígitos para guardar; 6–20 |
| ¿Qué necesitás? | texto corto | requerido, 5–300 ("breve descripción") |
| Detalles | textarea | opcional, ≤ 3000 (medidas, cantidades, colores, fecha, etc.) |
| Tipo de trabajo | select | opcional, las 5 categorías |
| Archivos | dropzone | opcional, **múltiples**, ver límites abajo |
| `website` (honeypot) | oculto | debe llegar vacío |

**Límites de archivos (constantes en `lib/constants.ts`):** máx. **10 archivos**, **15 MB c/u**, **40 MB totales**. Tipos: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`, `application/pdf`, `image/svg+xml`, y, por ser archivos de diseño frecuentes, `application/zip`, `application/postscript` (.ai/.eps). *(SVG se guarda pero **nunca se renderiza inline** en el admin: solo se descarga o se muestra con `<img>`.)*

**Dropzone:** arrastrar y soltar + botón + (en mobile) cámara/galería. Miniaturas con botón para quitar, barra de progreso por archivo, errores claros por archivo ("Pesa 22 MB, el máximo es 15 MB"). Las fotos grandes de celular **se redimensionan en el cliente** a máx. 2400 px de lado manteniendo calidad alta (los adjuntos son material de trabajo, no catálogo: no degradar de más) y PDF/otros se suben tal cual.

**Estados:** enviando (botón deshabilitado + progreso) → éxito (pantalla de confirmación con animación de "sticker pegado", resumen del pedido y botón "Seguir por WhatsApp" con mensaje prellenado) → error (mensaje accionable, el formulario conserva lo escrito; reintento solo de los archivos que fallaron).

### 8.3 Carrusel de productos aleatorios

- Muestra **productos activos del catálogo en orden aleatorio**, con autoplay lento, pausa al hover/foco/touch, flechas y *drag*. Cada item es la miniatura cuadrada unificada.
- **Aleatoriedad:** el servidor trae el pool (ej. hasta 24 activos) y el **cliente mezcla con Fisher–Yates después de hidratar** (`useEffect`). Alternativa descartada: `ORDER BY random()` en el servidor, que con caché/ISR devolvería siempre el mismo orden y provocaría *hydration mismatch*.
- Click en un item → abre el mismo popup de producto (8.5).
- Si hay < 4 productos, no hacer autoplay y mostrar el estado vacío correspondiente.

### 8.4 Sección "Qué hacemos" (trabajos personalizados)

Explicar los 5 tipos de trabajo, **una tarjeta por categoría con su foto**: título, 1–2 líneas de descripción y botón "Pedir esto" que hace scroll al formulario **con el select de tipo de trabajo ya seleccionado**.

Textos base (ajustables por Luana):

- **Stickers:** "Diseños con frases, personajes o tu marca. Troquelados a la forma que quieras."
- **Almanaques:** "Almanaques e imanes con tu logo y tus datos. Ideales para regalar a tus clientes."
- **Toppers y mesa dulce:** "Toppers para tortas y cupcakes, carteles, etiquetas y toda la ambientación temática de tu cumple."
- **Encendedores:** "Encendedores con el diseño que elijas. Un regalo distinto."
- **Señaladores:** "Señaladores únicos para quienes aman leer."

Composición: grilla asimétrica (una tarjeta destacada grande + cuatro más chicas en desktop; lista vertical en mobile). Fondo de cada tarjeta con un pastel distinto de la paleta. Las fotos se muestran completas con `object-fit: cover` sobre un ratio fijo (4:5) y foco configurable (`object-position`).

### 8.5 Catálogo de stickers disponibles + popup

- Grilla responsive (2 cols mobile, 3 tablet, 4–5 desktop) de **tiles cuadrados idénticos** (ver unificación de imagen, sección 11).
- **Filtros por categoría** con chips (Todos + las 5). Paginación "Ver más" (12 por tanda) o scroll con carga progresiva. Orden: recientes primero.
- **Click en un producto → popup (`Dialog` accesible)** con: imagen grande, nombre, descripción, categoría y botón **"Pedir este diseño"** (cierra el popup, hace scroll al formulario y precarga la referencia `product_id` + un texto sugerido "Me interesa: {nombre}").
- El popup anima con *shared layout* desde el tile (la imagen "crece" hasta el modal). Cierra con ESC, click afuera y botón visible. Atrapa foco, devuelve foco al tile al cerrar, bloquea scroll del fondo.
- **URL compartible:** al abrir un producto, reflejarlo en `?producto={slug}` (con `history.replaceState`) para poder mandar el link por WhatsApp; al cargar la página con ese parámetro, abrir el popup directamente.
- Estados: cargando (skeletons del mismo tamaño), vacío ("Estamos cargando stickers nuevos. Mientras tanto, contanos qué necesitás."), error (reintentar).

### 8.6 Footer

Logo, WhatsApp, Instagram, texto corto de la marca, "by Luana". Los datos de contacto vienen de `lib/constants.ts` / variables de entorno (sección 18).

---

## 9. Flujo técnico del pedido (crítico)

```
Navegador                         Route Handler (Vercel)                 Supabase
   │ 1. POST /api/orders ───────────▶ valida zod + honeypot + rate limit
   │    {datos, files:[{name,type,size}]}   rate limit por IP
   │                                  INSERT orders + order_attachments ─▶ (service_role)
   │                                  createSignedUploadUrl × N ────────▶ Storage
   │ ◀──── {orderId, uploads:[{path,token,signedUrl}]} ───────────────
   │ 2. PUT cada archivo directo ─────────────────────────────────────▶ Storage (order-files)
   │ 3. POST /api/orders/:id/confirm ─▶ verifica que los objetos existan
   │                                  marca uploaded=true ─────────────▶ DB
   │ ◀──── {ok} ──────────────────────────────────────────────────────
```

Reglas:

1. **Validación en el servidor es la verdad.** Volver a validar con el mismo schema zod: cantidad, tamaño y MIME **declarados**; sanear nombres de archivo (quitar `/`, `..`, caracteres de control, limitar longitud); generar el path de Storage en el servidor (`{orderId}/{uuid}-{nombreSaneado}`), nunca aceptar un path del cliente.
2. El honeypot lleno responde 200 "ok" silencioso sin guardar nada. Supabase aplica un límite de cinco solicitudes por IP cada hora.
3. **Rate limit** por IP (ej. 5 pedidos/hora). Implementación simple: tabla `rate_limits` o Upstash Redis si se prefiere; documentar la elegida. Sin esto, el endpoint es abusable.
4. Si falla la subida de algún archivo, el pedido **igual queda creado** (los datos son lo importante); el cliente ve qué archivos fallaron, puede reintentar, y el admin ve los adjuntos con `uploaded=false` marcados como "no subido".
5. `/confirm` verifica en Storage que los objetos existan realmente antes de marcar `uploaded=true`. Si no existen, no los marca.
6. Limpieza: pedidos con adjuntos `uploaded=false` de más de 24 h → job opcional (Vercel Cron) que borra los registros huérfanos.
7. Nunca devolver al cliente información de otros pedidos ni IDs enumerables más allá de su propio `orderId` recién creado.

**Notificación a Luana (Fase 4, opcional):** al confirmarse un pedido, enviar un email (Resend) con resumen y link al panel. Mientras tanto, el panel usa **Supabase Realtime** para mostrar el pedido nuevo con un aviso en pantalla.

---

## 10. Panel de administración (`/admin`)

Estética: misma marca pero **más sobria y utilitaria** (fondo `--papel`, mucho aire, tipografía Figtree, acento turquesa). Optimizado para uso desde **celular y desktop**: Luana va a revisar pedidos desde el teléfono.

### 10.1 Login (`/admin/login`)

Email + contraseña, mensajes de error genéricos ("Email o contraseña incorrectos"), sin enumeración de usuarios, botón con estado de carga. Tras login, redirige a `/admin/pedidos`.

### 10.2 Pedidos (`/admin/pedidos`)

- Lista con: fecha relativa, nombre, teléfono, resumen (truncado), categoría, **cantidad de adjuntos**, estado (badge de color).
- **Filtros:** por estado (tabs con contador), búsqueda por nombre/teléfono/resumen, rango de fechas.
- Orden: más recientes primero. Los `nuevo` con indicador destacado.
- **Tiempo real:** al entrar un pedido nuevo, aparece arriba con aviso (toast) sin recargar.
- Paginación de 25 en servidor (no traer todo).

### 10.3 Detalle de pedido (`/admin/pedidos/[id]`)

Muestra **toda la información solicitada**:

- Nombre, teléfono (con botones **"Llamar"** `tel:` y **"WhatsApp"** `https://wa.me/{numero}?text=…` con mensaje prellenado), fecha y hora.
- Breve descripción y detalles completos (respetando saltos de línea).
- Tipo de trabajo y, si corresponde, **el producto de referencia** (miniatura + link al producto).
- **Adjuntos:** grilla de miniaturas para imágenes (con lightbox para verlas grandes), ícono + nombre + tamaño para PDF y otros. Cada adjunto tiene **botón Descargar** (URL firmada con `download` y expiración corta, ej. 60 s, generada en servidor al hacer click). Botón **"Descargar todo (.zip)"** (JSZip en el cliente, descargando en paralelo limitado a 3, con progreso). Adjuntos `uploaded=false` marcados claramente.
- **Gestión:** selector de estado (`nuevo → en_proceso → listo → entregado / cancelado`), campo de **notas internas** (autoguardado con *debounce* y confirmación visible), botón eliminar pedido (con confirmación y borrado de archivos de Storage).

### 10.4 Productos / carga de stickers (`/admin/productos`)

**Requisito: módulo de carga super sencillo.** Debe poder cargarse un producto en **menos de 20 segundos**.

**Flujo ideal:**

1. Botón grande **"Subir stickers"**. Se abre una zona de arrastrar y soltar (o elegir desde galería/cámara) que acepta **una o muchas imágenes a la vez**.
2. Al soltar, **cada imagen se procesa en el navegador** (normalización, sección 11) y aparece como una tarjeta de borrador con vista previa **ya unificada** (como se verá en el sitio).
3. En cada tarjeta, solo dos campos: **Nombre** (se autocompleta con el nombre del archivo limpio: `hecha-para-brillar.png` → "Hecha para brillar") y **Categoría** (preseleccionada con la última usada). **Descripción** es opcional y colapsada.
4. Botón **"Publicar todos"**: sube las imágenes (principal + miniatura) a Storage, crea los registros y muestra confirmación. Progreso por tarjeta. Si una falla, se puede reintentar solo esa.

**Listado de productos:** grilla con las miniaturas, nombre, categoría, switch **Activo/Oculto** (efecto inmediato), editar (nombre, descripción, categoría, reemplazar imagen) y eliminar (con confirmación; borra también los archivos de Storage). Búsqueda y filtro por categoría. Reordenar es opcional (Fase 4).

Reglas: nombre 2–80, descripción ≤ 1000, slug autogenerado único (`slugify` + sufijo si colisiona). Todo el módulo vía Server Actions que verifican admin.

### 10.5 Resumen (`/admin`)

Tarjetas simples: pedidos nuevos sin atender, pedidos del mes, productos activos. Sin gráficos innecesarios.

---

## 11. Unificación de imágenes (requisito explícito)

**Problema:** Luana subirá imágenes de distinto tamaño, proporción y fondo (stickers troquelados, fotos cuadradas, verticales, PNG con transparencia). En el sitio **todo debe verse parejo**.

**Solución en dos capas (cliente al cargar + CSS al mostrar):**

1. **Normalización al subir** (`lib/image/normalize.ts`, Canvas API en el navegador):
   - Decodificar respetando orientación EXIF (`createImageBitmap(file, { imageOrientation: 'from-image' })`). HEIC: si el navegador no lo decodifica, mostrar un error claro pidiendo JPG/PNG.
   - Dibujar la imagen **completa, sin recortar** (`contain`) centrada en un lienzo **cuadrado de 1200×1200** con **margen interno del 6 %**, para que ningún sticker toque el borde.
   - Fondo del lienzo: **transparente** si la imagen tiene alfa; si no, el color de papel `--papel`. *(No se recorta: un recorte automático podría cortar texto de un sticker.)*
   - Exportar **WebP calidad 0.85** (principal, 1200×1200) y **WebP 0.8 miniatura 480×480**. Peso objetivo: principal < 250 KB, miniatura < 60 KB.
   - Rechazar imágenes menores a 400 px de lado con mensaje claro.
2. **Presentación uniforme con CSS:** todos los tiles usan `aspect-ratio: 1 / 1`, fondo con un pastel suave y `object-fit: contain`. Así, aunque algún dato histórico no esté normalizado, el layout no se rompe.

**Decisión:** procesar en el cliente en vez de en servidor (sharp) porque evita pasar archivos por las Functions de Vercel (límite de body) y es gratis. **Limitación:** depende del navegador de Luana; mitigada porque el admin se usa con navegadores modernos. Alternativa futura: Supabase Edge Function con `sharp`/ImageMagick para reprocesar.

**Servir imágenes:** las del catálogo ya vienen optimizadas, así que usar `next/image` con `unoptimized` para el bucket `products` evita consumir la cuota de Image Optimization de Vercel. Para imágenes del hero/estáticas, optimización de Next normal. Configurar `images.remotePatterns` con el host de Supabase. Cache largo (`cacheControl: '31536000'`) en uploads, con path único por versión para invalidar.

---

## 12. Animación y rendimiento

- Presupuesto: **LCP < 2.5 s en 4G**, CLS < 0.05, JS inicial de la ruta pública lo más chico posible. Importar con `dynamic()` lo pesado (Embla, parallax, diálogo del producto, JSZip, lightbox).
- Animar solo `transform` y `opacity`. Nada de animar `width/height/top/left`.
- Envolver todo en una utilidad que respete `prefers-reduced-motion` (desactiva parallax, flotado, autoplay del carrusel y reemplaza el "despegado" por un cambio de sombra).
- El efecto "despegar" es CSS puro con pseudo-elemento (esquina doblada con `clip-path` y gradiente) para no sumar peso de JS.
- Pausar animaciones infinitas cuando la pestaña no está visible o el elemento está fuera de viewport (`IntersectionObserver`).

---

## 13. SEO, accesibilidad y calidad

- **SEO:** `metadata` por página, Open Graph con imagen de marca (1200×630), `sitemap.xml`, `robots.txt`, JSON-LD `LocalBusiness`/`Organization`. `/admin/*` con `noindex` y bloqueado en robots.
- **Accesibilidad (mínimo AA):** navegación completa por teclado, foco visible (anillo turquesa de 3 px), `alt` descriptivo en cada producto (usar el nombre), labels asociados en todo el formulario, errores con `aria-describedby` y `role="alert"`, el carrusel con controles etiquetados y sin trampa de foco, contraste verificado.
- **Calidad:** TypeScript `strict`, ESLint, Prettier, `pnpm typecheck` sin errores. Tests (Vitest) para: schemas zod, `normalize.ts` (con casos límite), saneado de nombres de archivo, normalización de teléfonos AR. Un test e2e (Playwright) del flujo "crear pedido con 2 adjuntos" en la Fase 2.
- Casos límite a cubrir siempre: lista de productos vacía, nombres con emojis/tildes/ñ, archivos con nombres repetidos o con caracteres raros, desconexión a mitad de la subida, doble click en "Enviar" (idempotencia: deshabilitar botón y usar un `clientRequestId` para no duplicar pedidos).

---

## 14. Seguridad (checklist obligatorio)

- [ ] RLS activo en **todas** las tablas; probar con un cliente `anon` que no puede leer `orders`, `order_attachments`, `admins` ni productos inactivos.
- [ ] `service_role` solo en servidor y con `server-only`.
- [ ] Bucket `order-files` privado; descargas solo por URL firmada de corta vida y solo para admins.
- [ ] Validación de MIME **y** de extensión; nunca confiar en el `Content-Type` declarado como única defensa. Los adjuntos no se ejecutan ni se renderizan como HTML.
- [ ] SVG nunca inline; solo `<img>` o descarga.
- [ ] Sanitizar/escapar todo texto del usuario al mostrarlo en admin (React ya escapa; **prohibido `dangerouslySetInnerHTML`** con datos de pedidos).
- [ ] Headers de seguridad en `next.config` (CSP razonable, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`).
- [ ] Sin signup público en Supabase Auth; política de contraseñas mínima; recomendar activar MFA para la cuenta admin.
- [ ] Datos personales (nombre, teléfono): solo visibles al admin. Incluir en el sitio una **política de privacidad** simple (Ley 25.326 de Protección de Datos Personales, Argentina) y una casilla/aviso en el formulario ("Usamos tus datos solo para contactarte por tu pedido").
- [ ] Variables de entorno cargadas en Vercel por entorno (Preview ≠ Production); nunca commitear `.env.local`.

---

## 15. Variables de entorno y despliegue

`.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # SOLO servidor


# Sitio
NEXT_PUBLIC_SITE_URL=https://etiquetame.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=          # formato internacional sin +, ej. 5491112345678
NEXT_PUBLIC_INSTAGRAM_URL=

# Opcionales (Fase 4)
RESEND_API_KEY=
ORDER_NOTIFY_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Deploy:** repo en GitHub → proyecto en Vercel (framework Next.js, Node 22 LTS, `pnpm`). Producción desde `main`, previews por PR. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Vercel para cada entorno requerido. La clave publicable está diseñada para el cliente; la protección de los datos depende de RLS. **Nunca** agregar `service_role` o `sb_secret` con prefijo `NEXT_PUBLIC_`. En Supabase: configurar **Site URL** y **Redirect URLs** con el dominio de Vercel (y previews si hacen falta). Migraciones versionadas en `supabase/migrations` y aplicadas con la CLI de Supabase. Documentar todo en el `README.md` (setup local, cómo crear el primer admin, cómo correr migraciones). Las variables locales van en `.env.local` (ignorado por Git); pushear el repo no crea las variables en Vercel: configurarlas en Project Settings y volver a desplegar.

---

## 16. Plan por fases y criterios de aceptación

### Fase 0 — Base
Inicializar Next.js + TS + Tailwind + shadcn, fuentes, tokens de color, layout, `.env.example`, `DECISIONS.md`, README.
**Aceptación:** `pnpm dev` y `pnpm build` pasan; la home muestra el header con logo y tokens aplicados.

### Fase 1 — Supabase
Migración `0001_init.sql`, seed de categorías, buckets y policies, clientes Supabase (client/server/admin), middleware, tipos generados, login admin funcional con guard doble.
**Aceptación:** un usuario no admin no puede entrar a `/admin`; un cliente `anon` no puede leer `orders`; el admin ve un panel vacío.

### Fase 2 — Pedido end-to-end
Formulario + dropzone + flujo de la sección 9 (init → subida firmada → confirm), honeypot, rate limit, pantalla de éxito.
**Aceptación:** crear un pedido con 3 fotos desde un celular se refleja en la base y en Storage; un archivo no permitido o demasiado grande es rechazado con mensaje claro; el doble click no duplica.

### Fase 3 — Admin de pedidos
Lista con filtros y tiempo real, detalle con adjuntos, descarga individual y ZIP, cambio de estado, notas, WhatsApp/llamar.
**Aceptación:** Luana ve el pedido de la fase 2 con sus fotos, descarga cada una y el ZIP completo, y cambia su estado.

### Fase 4 — Catálogo (admin + público)
Módulo de carga multi-imagen con normalización, listado/edición/ocultar, grilla pública con filtros, popup con URL compartible, carrusel aleatorio, botón "Pedir este diseño" que precarga el formulario.
**Aceptación:** subir 10 imágenes de proporciones distintas termina en 10 tiles idénticos en cuadrado; el popup abre/cierra con teclado; el link `?producto=slug` abre el popup.

### Fase 5 — Hero y marca
Hero animado con stickers y efecto de despegado, secuencia de entrada, sección "Qué hacemos" con las 5 fotos, footer, microinteracciones del modal y confirmación del pedido.
**Aceptación:** Lighthouse mobile ≥ 90 en Performance y ≥ 95 en Accessibility y SEO; todo funciona con `prefers-reduced-motion` activado.

### Fase 6 — Pulido y salida
SEO/OG, política de privacidad, headers de seguridad, tests, notificación por email (opcional), cron de limpieza, revisión del checklist de la sección 14, deploy a producción.
**Aceptación:** checklist de seguridad 100 % tildado; flujo e2e en verde; README permite a otra persona levantar el proyecto desde cero.

---

## 17. Fuera de alcance (por ahora)

Carrito, precios en el catálogo, pagos online, stock, cuentas de clientes, multi-idioma, panel de métricas avanzado. El campo de precio **no existe** en el modelo; si se quisiera, se agrega después (columna `price_ars` nullable) sin romper nada.

---

## 18. Supuestos y datos pendientes

Supuestos tomados (cambiar si no aplican):

1. Un solo administrador inicial (Luana); la tabla `admins` permite sumar más.
2. El catálogo es una **vitrina** (no se compra en el sitio): la acción final siempre es "hacer un pedido" o seguir por WhatsApp.
3. Sin precios públicos.
4. Moneda y zona horaria: ARS, `America/Argentina/Buenos_Aires` (mostrar fechas en esa zona).

Datos que Luana debe aportar (usar placeholders configurables hasta tenerlos):

- [x] Logo PNG de 1181 × 1181 px adjunto (`logo.ok.png`); un SVG es opcional si existe el original vectorial.
- [ ] Número de WhatsApp (con código de país) y usuario/link de Instagram.
- [ ] Dominio definitivo (si no, usar el `.vercel.app`).
- [ ] Email del primer admin.
- [ ] Textos finales de las 5 categorías y del hero (los de este documento son sugerencias).
- [ ] Primeras 10–20 imágenes del catálogo.

---

## 19. Reglas finales para el agente

**Hacé:**
- Pensá la solución antes de codear y dejá registro del "por qué" en `DECISIONS.md`.
- Mantené componentes chicos con una sola responsabilidad; compartí schemas zod entre cliente y servidor.
- Manejá errores de forma explícita y mostrale al usuario qué pasó y cómo seguir. Los mensajes de error no piden disculpas ni son vagos.
- Escribí comentarios que expliquen el *por qué*, no el *qué*.
- Verificá ejecutando antes de decir que algo funciona.

**No hagas:**
- No insertar pedidos desde el cliente directo a la base.
- No usar `service_role` fuera del servidor.
- No agregar dependencias para algo que el navegador o la librería estándar ya resuelven.
- No tocar código no relacionado con la fase en curso.
- No agregar animaciones decorativas fuera de las especificadas.
- No dar nada por terminado sin cumplir su criterio de aceptación.
