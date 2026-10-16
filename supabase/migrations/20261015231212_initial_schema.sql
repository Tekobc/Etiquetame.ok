create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  cover_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  image_path text not null,
  thumb_path text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_idx on public.products (is_active, created_at desc);
create index products_category_idx on public.products (category_id);

create type public.order_status as enum (
  'nuevo',
  'en_proceso',
  'listo',
  'entregado',
  'cancelado'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone text not null check (char_length(phone) between 6 and 20),
  summary text not null check (char_length(summary) between 5 and 300),
  details text not null default '' check (char_length(details) <= 3000),
  category_id uuid references public.categories(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  status public.order_status not null default 'nuevo',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_created_idx on public.orders (status, created_at desc);

create table public.order_attachments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded boolean not null default false,
  created_at timestamptz not null default now()
);

create index order_attachments_order_idx on public.order_attachments (order_id);

create function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.touch_updated_at() to authenticated, service_role;

create trigger products_touch
before update on public.products
for each row execute function public.touch_updated_at();

create trigger orders_touch
before update on public.orders
for each row execute function public.touch_updated_at();

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_attachments enable row level security;

create policy "public read active categories"
on public.categories
for select
to anon, authenticated
using (is_active);

create policy "public read active products"
on public.products
for select
to anon, authenticated
using (is_active);

create policy "admins read own membership"
on public.admins
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "admins read all memberships"
on public.admins
for select
to authenticated
using ((select private.is_admin()));

create policy "admins manage categories"
on public.categories
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins manage products"
on public.products
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins manage orders"
on public.orders
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins manage order attachments"
on public.order_attachments
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on table
  public.admins,
  public.categories,
  public.products,
  public.orders,
  public.order_attachments
from anon, authenticated, service_role;

grant select on table public.categories, public.products to anon;
grant select, insert, update, delete on table
  public.admins,
  public.categories,
  public.products,
  public.orders,
  public.order_attachments
to authenticated;

grant all on table
  public.admins,
  public.categories,
  public.products,
  public.orders,
  public.order_attachments
to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  ('products', 'products', true, 15728640, array['image/webp']),
  (
    'order-files',
    'order-files',
    false,
    15728640,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
      'image/svg+xml',
      'application/zip',
      'application/postscript'
    ]
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admins manage product images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'products'
  and (select private.is_admin())
)
with check (
  bucket_id = 'products'
  and (select private.is_admin())
);

create policy "admins read order attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'order-files'
  and (select private.is_admin())
);
