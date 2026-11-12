# Backlog Build Ready — Backoffice Intranet Pixel (Modular)

Construcción por **cortes verticales**: cada corte se entrega funcionando de extremo a extremo (BD → backoffice → intranet) y se valida antes del siguiente.

## Corte 0 — Cimientos (sin pantallas de usuario)
- Esquema SQL completo (`supabase/01_schema.sql`): tablas, CHECKs, triggers (`updated_at/by`, último admin, jerarquía de menús, destacadas), `is_admin()`, `set_featured`, `audit_log`.
- RLS + permisos de RPC + bucket `media` con límites y políticas (`02_rls_storage.sql`).
- Bootstrap del primer admin (`00_bootstrap.sql`) y Edge Function `invite_admin`.
- **Pruebas de seguridad SQL** (`supabase/tests/`): anon no escribe/sube/lista; no-admin autenticado no escribe ni llama RPC; anon no ve borradores/ocultos ni año de cumpleaños.
- Salida: todas las pruebas negativas pasan.

## Corte 1 — Acceso, Banner y Menús
- Login + MFA TOTP + "Olvidé mi contraseña" + pantalla Administradores (invitar/quitar).
- Banner: subir imagen (redimensión/re-codificación en el navegador), quitar imagen → píxeles, editar 3 textos.
- Menús `top` (con submenús) y `quick` (con enlace libre o `tool_id`): crear, editar, ordenar, ocultar, borrar.
- Intranet: lee de Supabase con timeout 4 s y respaldo; menú móvil; render con `textContent` + validador de URL único.

## Corte 2 — Noticias
- CRUD con foto, categoría, borrador/publicada; destacar (cupo 1/2, reemplazo atómico); intranet muestra solo las 2 destacadas.

## Corte 3 — Calendario
- CRUD de eventos (cumpleaños con mes/día, repetición anual, `visible`; reunión/capacitación/otro con fecha y hora); intranet con ícono, detalle al tocar/pasar puntero y lista del mes; "hoy" en `America/Bogota`.

## Corte 4 — Herramientas
- Categorías (pestañas) y herramientas: nombre, ícono del catálogo, link, orden, ocultar; las 13 actuales migradas como datos iniciales.

## Operación (transversal)
- `06-operacion`: despliegue, rescate de admins, Redirect URLs, exportación semanal, ping anti-pausa, manual de uso.

## Dependencias externas (bloqueos de inicio, no de diseño)
1. Proyecto Supabase: URL + clave `anon` (nunca `service_role`).
2. Correos de los administradores iniciales (≥ 2).
3. Alguien ejecuta los SQL en Supabase (SQL Editor o CLI con su sesión) — Claude prepara los archivos y las pruebas.
