# Decisiones del proyecto

## Fase 0 — Base

### Aplicación inicial

- **Decisión:** iniciar con Next.js 15.5 y App Router, React 19, TypeScript
  estricto, Tailwind CSS 4 y pnpm 12.11.2.
- **Alternativa descartada:** una SPA basada en Vite u otro framework.
- **Motivo:** respetar el stack acordado y facilitar SSR, rutas de servidor y
  despliegue posterior en Vercel.
- **Limitación conocida:** Supabase, autenticación, pedidos y administración
  todavía no están conectados; se desarrollan en sus fases correspondientes.

### Tipografías

- **Decisión:** cargar Bagel Fat One para títulos y Figtree para cuerpo/UI con
  `next/font/google`.
- **Alternativa descartada:** depender de fuentes instaladas localmente o
  cargarlas desde CSS en tiempo de ejecución.
- **Motivo:** siguen la dirección visual y `next/font` prepara fuentes
  optimizadas durante la compilación.
- **Limitación conocida:** la compilación necesita poder descargar las fuentes
  de Google si no están disponibles en caché.

### Contraste de los acentos turquesa

- **Decisión:** reservar `--turquesa` para acentos gráficos y usar
  `--turquesa-texto: #08766e` en texto y foco sobre papel; la combinación
  alcanza un contraste de 5.39:1.
- **Alternativa descartada:** usar el turquesa de marca original para texto
  chico sobre el fondo claro.
- **Motivo:** el tono original no alcanza el contraste AA requerido para texto
  normal; el tono oscuro conserva la identidad y cumple 4.5:1.
- **Limitación conocida:** cualquier nueva combinación de texto y fondo debe
  volver a verificarse.

### Recursos iniciales

- **Decisión:** preservar los originales adjuntos y copiarlos sin cambiar su
  formato a `public/brand/` y `public/images/categorias/`; servirlos como
  imágenes estáticas locales.
- **Alternativa descartada:** convertirlos o subirlos a un servicio externo
  durante la Fase 0.
- **Motivo:** mantiene la calidad y los formatos originales y evita configurar
  servicios externos antes de necesitarlos.
- **Limitación conocida:** la imagen de encendedores se considera provisional
  hasta contar con una imagen propia o autorizada para publicación.

### Inicio público sin backend

- **Decisión:** mostrar la identidad, una presentación estática y las cinco
  categorías; los llamados a la acción llevan a contenido disponible en la
  página.
- **Alternativa descartada:** enlazar a un formulario, WhatsApp o catálogo que
  todavía no existe o requiere datos de contacto pendientes.
- **Motivo:** entregar una primera pantalla navegable sin representar como
  operativas funciones que aún no se implementaron.
- **Limitación conocida:** los pedidos no se pueden enviar hasta completar la
  integración del formulario y su backend.

### Scripts de instalación permitidos

- **Decisión:** permitir en `pnpm-workspace.yaml` únicamente el script
  `postinstall` de `unrs-resolver`.
- **Alternativa descartada:** autorizar los scripts de instalación de todas las
  dependencias.
- **Motivo:** pnpm bloquea los scripts por seguridad; esta dependencia es usada
  por ESLint y su `postinstall` prepara el binding nativo opcional. El comando y
  su paquete se inspeccionaron antes de autorizarlo.
- **Limitación conocida:** el permiso queda fijado a esa dependencia; otras
  dependencias que agreguen scripts requerirán evaluación explícita.

## Fase 1 — Supabase y acceso administrativo

### Claves y clientes Supabase

- **Decisión:** usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para los clientes
  SSR y de navegador, con compatibilidad de lectura para la clave `anon`
  heredada. El cliente con permisos elevados es un módulo separado protegido
  con `server-only`.
- **Alternativa descartada:** exponer `service_role` al navegador o usar una
  clave privilegiada para consultas públicas.
- **Motivo:** las claves publishable son públicas por diseño y el acceso a filas
  se restringe mediante grants y RLS.
- **Limitación conocida:** las operaciones de servidor con privilegios requieren
  configurar su clave privada cuando se implementen.

### Permisos y autorización de administradores

- **Decisión:** revocar grants generales, permitir al público leer solo
  categorías y productos activos y proteger los datos restantes con grants
  mínimos y RLS. `private.is_admin()` consulta `public.admins` desde un esquema
  no expuesto con `search_path` vacío.
- **Alternativa descartada:** guardar roles en `user_metadata`, confiar solo en
  middleware o exponer una función privilegiada en `public`.
- **Motivo:** `user_metadata` es editable por el usuario y el middleware no
  sustituye la protección de la base de datos.
- **Limitación conocida:** la primera membresía administrativa se agrega
  deliberadamente mediante SQL con privilegios de administrador de la base.

### Sesiones SSR y prueba de políticas

- **Decisión:** renovar cookies con `src/middleware.ts`, verificar la sesión con
  `auth.getUser()` y volver a verificar identidad y membresía en el layout
  privado del panel. Se agrega una prueba pgTAP para roles anónimos y
  autenticados sin membresía de administrador.
- **Alternativa descartada:** confiar en cookies de sesión sin validación o dar
  por verificado RLS solo por lectura del SQL.
- **Motivo:** sigue la guía vigente de Supabase para Next.js 15 y permite probar
  de forma repetible el aislamiento.
- **Limitación conocida:** Docker Desktop no está disponible en este entorno;
  el test pgTAP queda preparado, pero no ejecutado.
