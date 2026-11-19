# Richard Dure · Barber Studio

Sitio de reservas con Next.js 16, React 19 y Supabase. La portada y la reserva están en `/`. El acceso del equipo, la agenda diaria y la caja personal comparten `/admin`.

## Desarrollo

Instalá las dependencias del lockfile con pnpm y ejecutá `npm run dev`. Para probar autenticación y escritura, configurá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de un proyecto de desarrollo antes de arrancar o compilar. Usá la clave pública del proyecto. Los permisos de los clientes dependen de las políticas de la base.

Para comprobar el proyecto, ejecutá `npm run build` y `./node_modules/.bin/tsc --noEmit --incremental false`. El script histórico `lint` requiere ESLint, ausente del manifiesto original.

## Qué se reutilizó

- **Reserva.** `components/booking/booking-engine.tsx` mantiene el catálogo y las franjas de `lib/mock-data.ts`, los 14 días reservables sin domingos y el alta en `turnos` con estado `pendiente`. El estudio confirma el turno desde la agenda. Las consultas públicas de `supabase/migrations/202611190001_active_slots.sql` exponen nombres reservables y horas ocupadas. El índice único protege cada combinación de profesional, fecha y hora mientras el turno esté activo. La base prevalece si dos personas eligen el mismo horario.
- **Sesión y permisos.** `lib/supabase/client.ts` y `lib/supabase/server.ts` mantienen la conexión. `components/admin/admin-login.tsx` inicia sesión con correo y contraseña, `app/admin/page.tsx` restaura la sesión y atiende cambios de autenticación. `components/admin/admin-dashboard.tsx` vincula al usuario mediante `barberos.auth_user_id` y gestiona los turnos y bloqueos de ese barbero.
- **Caja.** El repositorio inicial contenía turnos y estados, sin migraciones históricas ni registro contable. El libro aditivo registra movimientos efectivos por barbero. El resumen mensual presenta cobros, devoluciones, gastos y resultado en PYG, con fecha del negocio en `America/Asuncion`. Los prerrequisitos, las pruebas con una base desechable y el orden de las migraciones están en [Caja por barbero](supabase/CASHBOOK.md). El esquema y las políticas de la instancia comercial requieren verificación antes de aplicar SQL.
- **Fotos y datos públicos.** Las fotos originales se sirven desde `public/trabajos/`. En el orden de las seis referencias, los nombres son `degradado-bajo`, `linea-lateral`, `flequillo`, `barba-perfilada`, `diseno` y `plateado`, con extensión WebP, JPG, JPEG o PNG en minúsculas. La compilación incluye las imágenes disponibles. Hasta entonces la portada utiliza una composición editorial de herramientas y el portafolio enlaza al Instagram facilitado por el estudio. Las opciones de servicio corresponden a la agenda interna. Los precios de muestra, la dirección y el teléfono de la plantilla anterior quedan fuera del sitio.
