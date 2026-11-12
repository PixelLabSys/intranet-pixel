# Fase 4 · Tensión — hallazgos y resoluciones

Severidad: C = crítico (bloquea Build Ready) · A = alto · M = medio · B = bajo.
Las resoluciones **enmiendan** el SDD (`docs/02-sdd`).

| # | Sev | Hallazgo | Resolución |
|---|:--:|---|---|
| T1 | C | **Primer admin:** con signup cerrado y `admins` protegida por RLS, nadie podría crear el primer administrador. | El dueño del proyecto Supabase inserta el primer `user_id` en `admins` desde el SQL Editor (script `supabase/00_bootstrap.sql`). Los siguientes admins se agregan desde el backoffice (pantalla "Administradores", solo admins). |
| T2 | C | **RLS recursiva:** la política "es admin" que consulta `admins` desde `admins` puede dar recursión o bloquear la lectura. | Función `is_admin()` `SECURITY DEFINER` con `search_path` fijo; todas las políticas la usan. `admins` solo legible por admins vía esa función. |
| T3 | A | **Máx. 2 destacadas en concurrencia:** un índice único parcial no resuelve el intercambio en un solo UPDATE. | Función `set_featured(id, slot, replaces)` transaccional: libera el cupo del reemplazado y asigna el nuevo; índice único parcial en `featured_order` donde `featured` como red de seguridad. |
| T4 | A | **Inyección de enlaces:** un admin (o cuenta comprometida) podría poner `javascript:` en un menú/herramienta/noticia y atacar a todos los visitantes. | Validación al guardar **y** al pintar: solo `https:`, `http:`, `mailto:` y anclas `#` de un catálogo fijo. Todo texto se pinta con `textContent`, nunca como HTML. Restricción `CHECK` en BD para `url`/`target`. |
| T5 | A | **Datos personales públicos:** nombres + día/mes de cumpleaños visibles a cualquiera con el enlace (sitio público). | Decisión de Pixel (ver pregunta abajo). Mitigación ya fijada: sin año, solo nombre; opción "ocultar" por evento; ruta de salida: mover la intranet a hosting con acceso restringido. |
| T6 | A | **Intranet vacía si Supabase falla o se pausa** (plan gratis pausa por inactividad). | Contenido actual embebido como respaldo + aviso discreto "contenido en caché"; los accesos diarios cuentan como actividad; si se pausa, reactivación manual documentada en `06-operacion`. |
| T7 | M | **Imágenes pesadas / huérfanas** al reemplazar o borrar. | Redimensionado en el navegador (máx. 1920 px de ancho, calidad 0.85) antes de subir; al reemplazar/borrar se elimina el archivo anterior; límite 3 MB sigue como tope. |
| T8 | M | **Ediciones simultáneas** de dos admins. | Última escritura gana, con `updated_at`/`updated_by` en cada tabla; la pantalla avisa si el registro cambió desde que se abrió. |
| T9 | M | **Anclas de menú inexistentes** (`#noticias`…). | Catálogo fijo de anclas (Noticias, Calendario, Herramientas) en el selector; el admin no teclea anclas. |
| T10 | M | **Recuperación de contraseña / sesión caducada** no contemplada en pantallas. | Login con "Olvidé mi contraseña" (correo de Supabase) y cierre de sesión por inactividad; el backoffice redirige al login si la sesión expira. |
| T11 | M | **Librería de terceros sin versión fija** (supabase-js desde CDN). | Versión exacta fijada (`@supabase/supabase-js@2.x.y`) y cargada desde CDN permitido; sin otras dependencias. |
| T12 | M | **Accesos rápidos vs herramientas** podrían duplicarse. | Un acceso rápido puede "tomar" una herramienta existente (se guarda su URL/ícono) o ser enlace libre. |
| T13 | M | **Zona horaria:** "hoy" y cumpleaños cerca de medianoche. | Fechas solo como `date` (sin hora UTC); "hoy" se calcula en `America/Bogota`. |
| T14 | B | **Auditoría de cambios** (quién editó) no existía. | `updated_by`/`updated_at` (ya en T8); sin historial completo en MVP. |
| T15 | B | **Cumpleaños 29-feb** | Ya cubierto en reglas de negocio (se muestra el 28-feb en años no bisiestos). |

## Estado de la puerta de salida
- Críticos (T1, T2): resueltos por diseño — **pendiente de tu aprobación**.
- Altos (T3–T6): resueltos o con decisión explícita; **T5 requiere tu decisión**.
- Medios/Bajos: aceptados con resolución.

## Decisión que necesita Alejo
**T5 — ¿Aceptas que la intranet pública muestre nombre + día/mes de cumpleaños?** (Sin año, con opción de ocultar y con salida a hosting restringido después.) Propuesta: sí, para el MVP.

## Siguiente (Fase 4.5)
Auditoría adversarial independiente con **Claude Opus** sobre PRD + SDD + artefactos + este documento. Por la regla de independencia de TRAZA debe hacerse en un hilo con Opus, no en este.
