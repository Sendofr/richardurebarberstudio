-- Disposable PostgreSQL database only. This models the observed client contract;
-- the deployed schema and its policies have not been exported from Supabase.
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth, public to anon, authenticated;

create table public.barberos (
  id bigint primary key, nombre text not null, especialidad text, foto_url text,
  auth_user_id uuid unique, created_at timestamptz not null default now()
);
create table public.turnos (
  id uuid primary key default gen_random_uuid(), barbero_id bigint not null references public.barberos(id),
  fecha date not null, hora time not null, cliente_nombre text not null, cliente_telefono text not null,
  servicio text, estado text not null,
  created_at timestamptz not null default now()
);

grant select (id, nombre, especialidad, foto_url) on public.barberos to anon;
grant select on public.barberos to authenticated;
grant select (barbero_id, fecha, hora, estado) on public.turnos to anon;
grant insert (barbero_id, fecha, hora, cliente_nombre, cliente_telefono, servicio, estado)
  on public.turnos to anon, authenticated;
grant select, update (estado), delete on public.turnos to authenticated;
alter table public.turnos enable row level security;
create policy disponibilidad on public.turnos for select to anon using (true);
create policy reservar on public.turnos for insert to anon with check (estado = 'pendiente');
create policy agenda_personal on public.turnos for all to authenticated
  using (exists (select 1 from public.barberos b where b.id = turnos.barbero_id and b.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.barberos b where b.id = turnos.barbero_id and b.auth_user_id = auth.uid()));
