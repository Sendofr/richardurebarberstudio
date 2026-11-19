-- Run against an empty dev database after tests/fixtures/supabase.sql and migrations.
begin;
insert into public.barberos (id,nombre,auth_user_id) values
  (1,'Barbero A','aaaaaaaa-0000-0000-0000-000000000001'),
  (2,'Barbero B','bbbbbbbb-0000-0000-0000-000000000002');
insert into public.turnos (id,barbero_id,fecha,hora,cliente_nombre,cliente_telefono,estado) values
  ('11111111-0000-0000-0000-000000000001',1,'2025-01-10','09:00','Cliente A','test','confirmado'),
  ('11111111-0000-0000-0000-000000000002',1,'2025-01-10','10:00','Cliente B','test','confirmado'),
  ('22222222-0000-0000-0000-000000000001',2,'2025-01-10','09:00','Cliente C','test','confirmado');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',true);
insert into public.caja_movimientos (id,barbero_id,turno_id,tipo,monto,fecha,concepto) values
  ('99999999-0000-0000-0000-000000000001',1,'11111111-0000-0000-0000-000000000001','cobro',80000,'2025-01-10',null),
  ('99999999-0000-0000-0000-000000000002',1,'11111111-0000-0000-0000-000000000001','devolucion',20000,'2025-01-12',null),
  ('99999999-0000-0000-0000-000000000003',1,null,'gasto',10000,'2025-01-15','Insumos'),
  ('99999999-0000-0000-0000-000000000004',1,'11111111-0000-0000-0000-000000000002','cobro',50000,'2025-02-01',null);

do $$
declare r record;
begin
  select * into strict r from public.resumen_caja(1,'2025-01-01','2025-01-31');
  if (r.cobrado,r.devuelto,r.gastos,r.movimientos,r.sin_cobro) <> (80000,20000,10000,3,1)
     or r.cobrado - r.devuelto - r.gastos <> 50000 then raise exception 'Resumen de enero incorrecto'; end if;
  select * into strict r from public.resumen_caja(1,'2025-02-01','2025-02-28');
  if (r.cobrado,r.devuelto,r.gastos,r.movimientos,r.sin_cobro) <> (50000,0,0,1,0)
    then raise exception 'Cobro tardío en período incorrecto'; end if;
  if exists (select * from public.resumen_caja(2,'2025-01-01','2025-01-31')) then raise exception 'Resumen ajeno visible'; end if;
  begin
    insert into public.caja_movimientos (id,barbero_id,tipo,monto,fecha,concepto)
    values ('99999999-0000-0000-0000-000000000003',1,'gasto',10000,'2025-01-15','Insumos');
    raise exception 'Reintento duplicado aceptado';
  exception when unique_violation then null; end;
  begin
    insert into public.caja_movimientos (barbero_id,turno_id,tipo,monto,fecha)
    values (1,'11111111-0000-0000-0000-000000000001','devolucion',60001,'2025-01-25');
    raise exception 'Devolución excesiva aceptada';
  exception when check_violation then null; end;
  begin
    insert into public.caja_movimientos (barbero_id,turno_id,tipo,monto,fecha)
    values (1,'11111111-0000-0000-0000-000000000001','devolucion',1,'2025-01-09');
    raise exception 'Devolución previa al cobro aceptada';
  exception when check_violation then null; end;
  begin
    insert into public.caja_movimientos (barbero_id,turno_id,tipo,monto,fecha)
    values (1,'22222222-0000-0000-0000-000000000001','cobro',1,'2025-01-10');
    raise exception 'Cobro de turno ajeno aceptado';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.caja_movimientos (barbero_id,tipo,monto,fecha,concepto)
    values (2,'gasto',1,'2025-01-10','Ajeno');
    raise exception 'Gasto en caja ajena aceptado';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002',true);
do $$ begin
  if exists (select * from public.caja_movimientos) then raise exception 'Libro de otro barbero visible'; end if;
end $$;
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000003',true);
do $$ begin
  if exists (select * from public.resumen_caja(1,'2025-01-01','2025-01-31')) then raise exception 'Resumen visible para usuario sin perfil'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform * from public.caja_movimientos;
    raise exception 'Caja visible para anónimo';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.resumen_caja(1,'2025-01-01','2025-01-31');
    raise exception 'Resumen visible para anónimo';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
