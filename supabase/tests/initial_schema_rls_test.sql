BEGIN;

SELECT plan(11);

INSERT INTO public.categories (slug, name, is_active)
VALUES
  ('rls-test-inactive-category', 'Categoría oculta de prueba', false),
  ('rls-test-active-category', 'Categoría visible de prueba', true);

INSERT INTO public.products (
  category_id,
  slug,
  name,
  image_path,
  thumb_path,
  is_active
)
SELECT id, 'rls-test-active-product', 'Producto activo de prueba', 'test/main.webp', 'test/thumb.webp', true
FROM public.categories
WHERE slug = 'stickers'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  category_id,
  slug,
  name,
  image_path,
  thumb_path,
  is_active
)
SELECT id, 'rls-test-inactive-product', 'Producto oculto de prueba', 'test/hidden.webp', 'test/hidden-thumb.webp', false
FROM public.categories
WHERE slug = 'stickers'
ON CONFLICT (slug) DO NOTHING;

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orders'::regclass),
  true,
  'row level security is enabled on orders'
);

SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::integer FROM public.categories WHERE slug = 'rls-test-active-category'),
  1,
  'anonymous visitors can read active categories'
);

SELECT is(
  (SELECT count(*)::integer FROM public.categories WHERE slug = 'rls-test-inactive-category'),
  0,
  'anonymous visitors cannot read inactive categories'
);

SELECT is(
  (SELECT count(*)::integer FROM public.products WHERE slug = 'rls-test-active-product'),
  1,
  'anonymous visitors can read active products'
);

SELECT is(
  (SELECT count(*)::integer FROM public.products WHERE slug = 'rls-test-inactive-product'),
  0,
  'anonymous visitors cannot read inactive products'
);

SELECT throws_ok(
  'SELECT * FROM public.orders',
  '42501',
  NULL,
  'anonymous visitors cannot read orders'
);

SELECT throws_ok(
  'SELECT * FROM public.order_attachments',
  '42501',
  NULL,
  'anonymous visitors cannot read order attachments'
);

SELECT throws_ok(
  'SELECT * FROM public.admins',
  '42501',
  NULL,
  'anonymous visitors cannot read admin memberships'
);

RESET ROLE;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::integer FROM public.categories WHERE slug LIKE 'rls-test-%'),
  1,
  'non-admin users can only read active categories'
);

SELECT is(
  (SELECT count(*)::integer FROM public.orders),
  0,
  'non-admin users cannot read orders'
);

SELECT is(
  (SELECT count(*)::integer FROM public.admins),
  0,
  'non-admin users cannot read admin memberships'
);

SELECT * FROM finish();
ROLLBACK;
