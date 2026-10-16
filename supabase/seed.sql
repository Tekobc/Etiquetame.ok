insert into public.categories (
  slug,
  name,
  description,
  cover_path,
  sort_order,
  is_active
)
values
  (
    'stickers',
    'Stickers',
    'Diseños con frases, personajes o tu marca. Troquelados a la forma que quieras.',
    '/images/categorias/stickers.jpeg',
    1,
    true
  ),
  (
    'almanaques',
    'Almanaques',
    'Almanaques e imanes personalizados con tu logo y tus datos.',
    '/images/categorias/almanaques.jpeg',
    2,
    true
  ),
  (
    'toppers-y-mesa-dulce',
    'Toppers y mesa dulce',
    'Toppers, carteles, etiquetas y ambientación para tus celebraciones.',
    '/images/categorias/toppers-y-mesa-dulce.webp',
    3,
    true
  ),
  (
    'encendedores',
    'Encendedores personalizados',
    'Encendedores con el diseño que elijas.',
    '/images/categorias/encendedores.jpeg',
    4,
    true
  ),
  (
    'senaladores',
    'Señaladores',
    'Señaladores únicos con diseños propios o personalizados.',
    '/images/categorias/senaladores.jpeg',
    5,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  cover_path = excluded.cover_path,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
