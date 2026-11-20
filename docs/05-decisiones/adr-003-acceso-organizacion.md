# ADR-003 — La intranet solo la ve quien pertenece a la organización

Fecha: 2026-11-20. Estado: aprobado por Alejandro.

## Contexto
La intranet era pública (lectura anónima) y mostraba un respaldo guardado en el repositorio. Habrá información confidencial de la organización.

## Decisión
- Para leer contenido hace falta sesión (Google) y estar autorizado: correo de un dominio de `access_domains` (hoy pixel-g.com y pxl-g.com), correo individual de `access_emails` (Gmail seleccionados) o administrador. Lo decide `public.is_member()` en RLS, exigiendo correo confirmado.
- El rol `anon` ya no lee ninguna tabla.
- Filtro de registro (Auth Hook "Before User Created", `public.hook_before_user_created`): solo se crean cuentas de correos autorizados. Los administradores creados por la función `invite_admin` (API de administración) no pasan por el hook.
- Google Cloud queda en modo Externo (los Gmail lo exigen); la restricción real la hacen RLS y el hook. No se pueden autorizar dominios de correo público (gmail.com, hotmail.com, etc.).
- Se elimina la copia de respaldo pública (`respaldo.js`): si el servidor no responde, se muestra un aviso para reintentar.
- Las imágenes del bucket `media` siguen con enlace público (decisión aceptada por ahora).

## Consecuencias
- Una cuenta ya creada cuyo correo se quita de la lista sigue existiendo, pero deja de ver contenido.
- Quitar un dominio o correo no cierra sesiones abiertas de inmediato: el acceso se pierde en cuanto vence el token (hasta 1 hora).
- Si se necesita proteger imágenes confidenciales, hay que volver el bucket privado y servir URLs firmadas.
