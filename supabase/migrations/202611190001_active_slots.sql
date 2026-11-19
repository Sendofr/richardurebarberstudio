begin;

-- Existing active duplicates deliberately stop the migration. Inspect and
-- reconcile them with the studio before deploying; never rewrite bookings here.
create unique index if not exists turnos_un_horario_activo_idx
  on public.turnos (barbero_id, fecha, hora)
  where estado <> 'cancelado';

-- The existing public booking catalog offered barber IDs 1, 2 and 3.
-- Projects restricting raw profile reads can expose their real display names
-- for these bookable IDs without granting access to emails or auth_user_id.
create function public.profesionales_reservables()
returns table (id text, nombre text)
language sql stable security definer
set search_path = ''
as $$
  select b.id::text, b.nombre::text from public.barberos b
  where b.id::text in ('1', '2', '3')
  order by b.nombre, b.id;
$$;
revoke all on function public.profesionales_reservables() from public;
grant execute on function public.profesionales_reservables() to anon, authenticated;

-- Keep the booking grid readable even when turnos RLS hides customer records.
-- Limit the public view to the existing catalog and upcoming scheduling window.
create function public.horarios_ocupados(p_fecha date, p_barbero_id text)
returns table (hora text)
language sql stable security definer
set search_path = ''
as $$
  select t.hora::text from public.turnos t
  where p_barbero_id in ('1', '2', '3')
    and t.barbero_id::text = p_barbero_id
    and t.fecha = p_fecha and t.estado <> 'cancelado'
    and p_fecha between (current_timestamp at time zone 'America/Asuncion')::date
      and (current_timestamp at time zone 'America/Asuncion')::date + 21
  order by t.hora;
$$;
revoke all on function public.horarios_ocupados(date, text) from public;
grant execute on function public.horarios_ocupados(date, text) to anon, authenticated;

commit;
