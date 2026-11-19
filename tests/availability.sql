-- Disposable schema from tests/fixtures/supabase.sql, after both migrations.
begin;
set local time zone 'America/Asuncion';
insert into public.barberos (id,nombre) values (1,'Prueba'),(2,'Otra agenda');
insert into public.turnos (barbero_id,fecha,hora,cliente_nombre,cliente_telefono,estado)
values (1,current_date,'14:00','Cliente de prueba','test','pendiente'),
       (1,current_date,'15:00','BLOQUEADO','N/A','bloqueado'),
       (2,current_date,'14:00','Cliente de prueba','test','confirmado');

set local role anon;
do $$
begin
  if (select count(*) from public.horarios_ocupados(current_date,'1')) <> 2 then
    raise exception 'Disponibilidad incorrecta para el primer profesional';
  end if;
  begin
    insert into public.turnos (barbero_id,fecha,hora,cliente_nombre,cliente_telefono,estado)
    values (1,current_date,'14:00','Otro cliente','test','pendiente');
    raise exception 'Se admitió un turno duplicado';
  exception when unique_violation then null;
  end;
  begin
    insert into public.turnos (barbero_id,fecha,hora,cliente_nombre,cliente_telefono,estado)
    values (1,current_date,'15:00','Otro cliente','test','pendiente');
    raise exception 'Se admitió una reserva sobre un bloqueo';
  exception when unique_violation then null;
  end;
end $$;
reset role;
update public.turnos set estado='cancelado' where barbero_id=1 and hora='14:00';
set local role anon;
do $$ begin
  if exists(select 1 from public.horarios_ocupados(current_date,'1') where hora::time='14:00') then
    raise exception 'La cancelación no liberó el horario';
  end if;
end $$;
insert into public.turnos (barbero_id,fecha,hora,cliente_nombre,cliente_telefono,estado)
values (1,current_date,'14:00','Nuevo turno tras cancelar','test','pendiente');
rollback;
