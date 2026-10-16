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
La prueba pgTAP valida el acceso público y el aislamiento de datos
administrativos. Para apagar los servicios:

```powershell
corepack pnpm dlx supabase@2.121.0 stop
```

## Supabase remoto

Para enlazar el proyecto y aplicar la migración necesitás iniciar sesión en la
CLI con una cuenta que tenga acceso administrativo a la base:

```powershell
corepack pnpm dlx supabase@2.121.0 login
corepack pnpm dlx supabase@2.121.0 link --project-ref jyhqetwkakilgfhgufoo
corepack pnpm dlx supabase@2.121.0 db push
```

Después, ejecutá `supabase/seed.sql` en el SQL Editor de Supabase. En
**Authentication → Settings**, mantené deshabilitados los registros públicos.
Creá la primera cuenta desde el dashboard de Auth y agregá su ID en el SQL
Editor:

```sql
insert into public.admins (user_id)
values ('<uuid-del-usuario-creado-en-auth>');
```

La pertenencia a `public.admins` determina el acceso administrativo; no se
utiliza `user_metadata`.

## Variables de Vercel

Agregá estas variables en **Project → Settings → Environment Variables** para
cada entorno requerido (Development, Preview y Production):

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

La publishable key es apta para el cliente público; RLS es quien restringe el
acceso a las filas. Nunca pongas una clave `service_role` o `sb_secret` bajo un
nombre `NEXT_PUBLIC_`. Las variables de Vercel requieren un despliegue nuevo
para surtir efecto; conectar el repo a Vercel habilita despliegues automáticos
desde `main`.

## Verificaciones

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

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
