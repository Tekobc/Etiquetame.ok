# Etiquétame

Sitio de Etiquétame, la tienda de stickers y productos personalizados de
Luana. La interfaz está en español rioplatense y se diseña primero para
celulares.

## Requisitos

- Node.js 22 o posterior.
- Corepack habilitado y pnpm.

## Desarrollo local

```powershell
corepack pnpm install
corepack pnpm dev
```

Las credenciales locales del proyecto están en `.env.local`, un archivo
ignorado por Git. Para usar otro proyecto, copiá `.env.example` a `.env.local`
y completá las credenciales. Abrí [http://localhost:3000](http://localhost:3000).

## Supabase local

Con Docker Desktop en ejecución:

```powershell
corepack pnpm dlx supabase@2.121.0 start
corepack pnpm dlx supabase@2.121.0 db reset
corepack pnpm dlx supabase@2.121.0 test db
```

`db reset` aplica la migración y carga las cinco categorías desde `seed.sql`.
Las migraciones también incluyen el flujo de pedidos. La prueba pgTAP valida
el acceso público y el aislamiento de datos administrativos. Para apagar los
servicios:

```powershell
corepack pnpm dlx supabase@2.121.0 stop
```

## Supabase remoto

En este proyecto, el schema inicial se ejecutó manualmente en el SQL Editor.
Por eso, **no uses `db push` todavía**: Supabase puede no tener registrada esa
migración y tratar de ejecutarla por segunda vez. Para habilitar los cambios
nuevos, ejecutá en el SQL Editor el contenido de:

- `supabase/migrations/20261016010407_order_request_workflow.sql`

El archivo agrega idempotencia y rate limit a pedidos, habilita actualizaciones
en tiempo real y asegura que el catálogo público solo muestre productos de
categorías activas. Si todavía no corriste `supabase/seed.sql`, ejecutalo en el
SQL Editor para cargar las cinco categorías.

En **Authentication → Settings**, mantené deshabilitados los registros
públicos. Creá la primera cuenta desde el dashboard de Auth y agregá su ID en
el SQL Editor:

```sql
insert into public.admins (user_id)
values ('<uuid-del-usuario-creado-en-auth>');
```

La pertenencia a `public.admins` determina el acceso administrativo; no se
utiliza `user_metadata`.

## Variables de Vercel

Agregá estas variables en **Project → Settings → Environment Variables** para
cada entorno que vayas a desplegar (Development, Preview y Production):

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_WHATSAPP_NUMBER
NEXT_PUBLIC_INSTAGRAM_URL
```

La publishable key es apta para el cliente público; RLS es quien restringe el
acceso a las filas. Nunca pongas una clave `service_role` o `sb_secret` bajo un
nombre `NEXT_PUBLIC_`. `SUPABASE_SERVICE_ROLE_KEY` es privada y solo se usa en
el servidor. El formulario usa un honeypot y un límite de cinco solicitudes por
IP cada hora, aplicado por Supabase, para reducir spam sin depender de un
servicio externo.

Las variables de Vercel requieren un deployment nuevo para surtir efecto;
conectar el repo a Vercel habilita despliegues automáticos desde `main`.
`NEXT_PUBLIC_WHATSAPP_NUMBER` debe contener solo dígitos con código de país
(por ejemplo, `54911...`); Instagram debe ser una URL `https://`.

## Verificaciones

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Estado de la aplicación

La tienda incluye el formulario de pedidos con adjuntos a Storage, protección
anti-spam, catálogo público y confirmación; el panel permite revisar pedidos,
descargar archivos y gestionar diseños. El envío de pedidos requiere la nueva
migración y `SUPABASE_SERVICE_ROLE_KEY`. Las pruebas de base pgTAP requieren
Docker Desktop iniciado.

## Recursos de marca

- Logo: `public/brand/logo.png` (también se usa como ícono del sitio).
- Fotos de referencia: `public/images/categorias/`.
- Los originales adjuntos se conservan en la raíz del repositorio.

Las fotos son referencias iniciales para mostrar los tipos de trabajo. Antes de
publicar, reemplazá la imagen de encendedores por una pieza propia o autorizada.

## Próximas fases

La aplicación sigue las fases definidas en [`context.md`](./context.md). Esta
fase agrega el esquema, RLS, autenticación del panel y el estado inicial del
dashboard; el formulario y la gestión de pedidos se implementan en las fases
siguientes.
