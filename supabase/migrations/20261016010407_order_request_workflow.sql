alter table public.orders
add column client_request_id uuid;

drop policy "public read active products" on public.products;
create policy "public read active products"
on public.products
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.categories
    where categories.id = products.category_id
      and categories.is_active
  )
);

create unique index orders_client_request_id_idx
on public.orders (client_request_id)
where client_request_id is not null;

create table public.order_rate_limits (
  ip_hash text primary key check (char_length(ip_hash) = 64),
  window_started_at timestamptz not null default now(),
  request_count integer not null check (request_count between 1 and 5)
);

alter table public.order_rate_limits enable row level security;
revoke all on table public.order_rate_limits from public, anon, authenticated;
grant all on table public.order_rate_limits to service_role;

create function public.consume_order_rate_limit(p_ip_hash text)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  allowed boolean;
begin
  insert into public.order_rate_limits (ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update
  set
    window_started_at = case
      when public.order_rate_limits.window_started_at < now() - interval '1 hour'
        then now()
      else public.order_rate_limits.window_started_at
    end,
    request_count = case
      when public.order_rate_limits.window_started_at < now() - interval '1 hour'
        then 1
      else public.order_rate_limits.request_count + 1
    end
  where
    public.order_rate_limits.window_started_at < now() - interval '1 hour'
    or public.order_rate_limits.request_count < 5
  returning true into allowed;

  return coalesce(allowed, false);
end;
$$;

revoke all on function public.consume_order_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_order_rate_limit(text) to service_role;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
end;
$$;