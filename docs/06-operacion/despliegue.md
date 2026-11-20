# Despliegue y operación (Cortes 0–1)

## Poner en producción (cuando exista el proyecto Supabase)
1. Crear proyecto en Supabase; en Auth: desactivar "Allow new users to sign up", Site URL y Redirect URLs = `https://pixellabsys.github.io/intranet-pixel/admin/`.
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

## Agregar administradores y entrar con Google (2026-11-20)

Agregar un administrador es escribir su correo en Administradores > Agregar. La función `invite_admin` crea el usuario ya confirmado y sin contraseña y lo registra en `admins`; no se envía ningún correo. La persona entra con "Continuar con Google" usando ese mismo correo (cuenta Gmail o Google Workspace de la empresa). El registro público sigue cerrado.

Activar Google (una sola vez):
1. Google Cloud Console > APIs y servicios > Credenciales > Crear ID de cliente OAuth (aplicación web). URI de redirección autorizado: `https://zifpfkivgdqdzlyulzwf.supabase.co/auth/v1/callback`.
2. Supabase > Authentication > Sign In / Providers > Google: activar y pegar Client ID y Client Secret (el secreto solo va en el panel de Supabase).
3. Supabase > Authentication > URL Configuration: la URL del backoffice (`https://pixellabsys.github.io/intranet-pixel/admin/`) en Redirect URLs.
4. Redesplegar la función: `supabase functions deploy invite_admin`.

Límite: quien entra por Google solo pasa si su correo está en `admins`; cualquier otra cuenta ve "Sin acceso".
