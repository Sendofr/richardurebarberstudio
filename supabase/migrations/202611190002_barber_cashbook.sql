-- Apply to the existing Supabase schema. Copy the actual primary-key types
-- (including legacy turno IDs) without copying rows or changing either table.
begin;

create table public.caja_movimientos as
  select b.id as barbero_id, t.id as turno_id
  from public.barberos b cross join public.turnos t
  with no data;

alter table public.caja_movimientos
  alter column barbero_id set not null,
  add column id uuid primary key default gen_random_uuid(),
  add column tipo text not null check (tipo in ('cobro', 'devolucion', 'gasto')),
  add column monto integer not null check (monto > 0),
  add column fecha date not null,
  add column concepto text check (length(trim(concepto)) between 1 and 160),
  add column creado_en timestamptz not null default now(),
  add foreign key (barbero_id) references public.barberos(id),
  add foreign key (turno_id) references public.turnos(id),
  add check ((tipo = 'gasto') = (turno_id is null)),
  add check (tipo <> 'gasto' or concepto is not null);

create index caja_por_periodo on public.caja_movimientos (barbero_id, fecha);
create index caja_por_turno on public.caja_movimientos (turno_id) where turno_id is not null;
alter table public.caja_movimientos enable row level security;
revoke all on public.caja_movimientos from public, anon, authenticated;
grant select on public.caja_movimientos to authenticated;
grant insert (id, barbero_id, turno_id, tipo, monto, fecha, concepto)
  on public.caja_movimientos to authenticated;

create policy caja_lectura_propia on public.caja_movimientos for select to authenticated
  using (exists (select 1 from public.barberos b
    where b.id = caja_movimientos.barbero_id and b.auth_user_id = (select auth.uid())));

create policy caja_registro_propio on public.caja_movimientos for insert to authenticated
  with check (
    exists (select 1 from public.barberos b
      where b.id = caja_movimientos.barbero_id and b.auth_user_id = (select auth.uid()))
    and (turno_id is null or exists (select 1 from public.turnos t
      where t.id = caja_movimientos.turno_id and t.barbero_id = caja_movimientos.barbero_id
      and t.estado <> 'bloqueado'))
  );

-- Serialize cash operations for the same appointment. Validate the running
-- balance even for backdated refunds; a later collection cannot fund one.
create function public.validar_movimiento_caja() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.fecha > (current_timestamp at time zone 'America/Asuncion')::date then
    raise exception using errcode = '23514', message = 'La fecha del movimiento es futura';
  end if;
  if new.turno_id is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('caja:' || new.turno_id::text, 0));
  if new.tipo = 'devolucion' and exists (
    select 1 from (
      select sum(sum(importe)) over (order by fecha) as saldo
      from (
        select m.fecha, case when m.tipo = 'cobro' then m.monto else -m.monto end as importe
        from public.caja_movimientos m where m.turno_id = new.turno_id
        union all select new.fecha, -new.monto
      ) movimientos group by fecha
    ) diario where saldo < 0
  ) then
    raise exception using errcode = '23514', message = 'La devolución supera lo cobrado para ese turno y fecha';
  end if;
  return new;
end $$;

create trigger caja_validar before insert on public.caja_movimientos
  for each row execute function public.validar_movimiento_caja();

-- Aggregate in Postgres, independently of PostgREST row limits.
create function public.resumen_caja(p_barbero bigint, p_desde date, p_hasta date)
returns table (cobrado bigint, devuelto bigint, gastos bigint, movimientos bigint, sin_cobro bigint)
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(m.monto) filter (where m.tipo = 'cobro'), 0),
         coalesce(sum(m.monto) filter (where m.tipo = 'devolucion'), 0),
         coalesce(sum(m.monto) filter (where m.tipo = 'gasto'), 0), count(*),
         (select count(*) from public.turnos t
          where t.barbero_id = p_barbero and t.fecha::date between p_desde and p_hasta
          and (t.fecha::date + t.hora::time) <= current_timestamp at time zone 'America/Asuncion'
          and t.estado in ('confirmado', 'pendiente')
          and not exists (select 1 from public.caja_movimientos c
            where c.turno_id = t.id and c.tipo = 'cobro' and c.fecha <= p_hasta))
  from public.caja_movimientos m where m.barbero_id = p_barbero and m.fecha between p_desde and p_hasta
  having exists (select 1 from public.barberos b where b.id = p_barbero and b.auth_user_id = (select auth.uid()))
$$;

revoke all on function public.resumen_caja(bigint, date, date) from public, anon, authenticated;
grant execute on function public.resumen_caja(bigint, date, date) to authenticated;
revoke all on function public.validar_movimiento_caja() from public, anon, authenticated;
commit;
