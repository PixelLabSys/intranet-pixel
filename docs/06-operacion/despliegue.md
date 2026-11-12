# Despliegue y operación (Cortes 0–1)

## Poner en producción (cuando exista el proyecto Supabase)
1. Crear proyecto en Supabase; en Auth: desactivar "Allow new users to sign up", activar MFA (TOTP), Site URL y Redirect URLs = `https://pixellabsys.github.io/intranet-pixel/admin/`.
2. `supabase link` + `supabase db push` (migraciones), ejecutar `supabase/seed.sql`.
3. `supabase secrets set ADMIN_URL=https://pixellabsys.github.io/intranet-pixel/admin/` y `supabase functions deploy invite_admin`.
4. Crear el primer usuario (Auth → Invite) y ejecutar `supabase/bootstrap_primer_admin.sql` con su correo. Repetir para el segundo administrador (mínimo 2).
5. Poner URL y anon key (nunca service_role) en `assets/config.js` (rama producción), regenerar respaldo: `SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/export-respaldo.mjs`, commit y push.

## Notas operativas
- Quitar un administrador borra su fila en `admins`; su usuario en Auth.users queda (sin acceso). Borrarlo desde el panel de Supabase si se desea.
- Si el servidor falla o responde vacío, la intranet muestra `assets/respaldo.js` con aviso (tope 4 s).
- Local: `supabase start`; pruebas `supabase test db`; correos de invitación en http://127.0.0.1:56324.
- En local `[auth.email] enable_signup=true` habilita el proveedor de correo; el registro público sigue cerrado por `[auth] enable_signup=false`.
- Pendiente: export semanal del respaldo, ping anti-pausa (plan gratuito), plan de rescate de administradores.
