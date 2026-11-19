# Caja por barbero

La caja usa el mismo vínculo que la agenda: `barberos.auth_user_id = auth.uid()`. Cada barbero ve y registra sus propios movimientos. Se mantiene un único libro de cobros, devoluciones y gastos. Los importes son guaraníes enteros y positivos. La fecha efectiva del movimiento es la fecha civil de Paraguay (`America/Asuncion`); puede ser distinta de la fecha del turno. Los cobros parciales y las devoluciones parciales se registran por separado. Los importes cobrados se ingresan al recibir el pago.

La caja mensual suma cobros y resta devoluciones y gastos del mismo mes. Los turnos pendientes o confirmados que ya transcurrieron sin cobro registrado al cierre se señalan como información incompleta. Los gastos pendientes de carga no se pueden deducir de la agenda. Un mes vacío muestra «Período sin movimientos registrados». No se generan asientos para turnos históricos ni se importan precios de ejemplo.

## Aplicación en Supabase

Antes de aplicar las migraciones, verificá el esquema de la instancia y si ya existe un libro real de cobros, devoluciones o gastos. Si existe, conciliá e integrá esos datos primero para mantener un único registro. El checkout original solo contenía el contrato utilizado por el cliente.

La migración `202611190002_barber_cashbook.sql` depende de claves primarias en `public.barberos.id` (numérica) y `public.turnos.id`. La tabla nueva hereda los tipos de ambas claves. Requiere `barberos.auth_user_id`, `turnos.barbero_id`, `estado`, `fecha` y `hora`, así como los roles de Supabase `anon`, `authenticated` y la función `auth.uid()`. Confirmá que las políticas de la instancia permiten al barbero leer su perfil y sus turnos y reservan la asignación de perfiles a usuarios autorizados. Compará las restricciones de horarios existentes con la migración `202611190001_active_slots.sql`. Aplicá los archivos versionados en orden en desarrollo y validá el resultado antes de producción.

Los permisos SQL permiten al barbero consultar y agregar movimientos propios. Las claves foráneas preservan la relación con los turnos. Los reintentos de un mismo envío usan un UUID, y las devoluciones se validan contra el saldo histórico del turno bajo bloqueo transaccional. El cliente utiliza la sesión habitual de Supabase.

## Prueba de regresión

En una base PostgreSQL **desechable y vacía** con un usuario capaz de crear roles:

```sh
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f tests/fixtures/supabase.sql \
  -f supabase/migrations/202611190001_active_slots.sql \
  -f supabase/migrations/202611190002_barber_cashbook.sql \
  -f tests/cashbook.sql \
  -f tests/availability.sql
```

El fixture modela el esquema observado y la identidad de prueba. La prueba verifica el resultado de 50.000 Gs. sobre 80.000 cobrados, 20.000 devueltos y 10.000 de gastos; además comprueba cambio de mes, cobros faltantes, reintentos, devoluciones inválidas y acceso por perfil.
