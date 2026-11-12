# PRD — Backoffice de la Intranet Pixel (Modular)

## Objetivo y éxito
Que un administrador cambie cualquier contenido de la intranet en minutos y sin tocar código.
Éxito = (a) Alejo publica una noticia con foto, un evento y un cambio de banner sin ayuda; (b) los cambios se ven en la intranet al recargar; (c) cero cambios de código para el contenido del día a día.

## Módulos y requisitos (por corte de construcción)

### Corte 1 — Acceso, Banner y Menús
- Login de administradores (correo + contraseña); varios admins; sin registro público.
- **Banner:** imagen editable (subir foto) o volver al fondo de píxeles; editar eyebrow, título (ej. "¡Bienvenido, Pixeludo!") y texto.
- **Menú superior (junto al logo):** crear, editar, ordenar y borrar menús y submenús. Cada ítem: etiqueta + destino (enlace externo, ancla de la página o —luego— página interna). Los submenús se despliegan en la intranet.
- **Menús siguientes ("los que siguen"):** barra de accesos rápidos y pestañas de herramientas, editables igual (etiqueta, ícono, destino, orden). *(Interpretación a confirmar.)*

### Corte 2 — Noticias y actualizaciones
- Crear/editar/borrar noticia: título, texto, categoría, fecha, **foto**.
- Estados: borrador / publicada. Elegir **cuáles 2 están destacadas** en la intranet (si se marca una tercera, se pide cuál reemplaza).

### Corte 3 — Calendario
- Crear/editar/borrar eventos **públicos**: título, fecha (y hora opcional), tipo (cumpleaños, reunión, capacitación, otro), descripción.
- **Cumpleaños:** ícono de torta sobre el día; al pasar el puntero se muestra de quién es (nombre; sin año de nacimiento). Reuniones y capacitaciones con su ícono y detalle al pasar el puntero.
- Varios eventos el mismo día; el lateral lista los del mes.

### Corte 4 — Herramientas
- Agregar/editar/ordenar/ocultar herramientas: nombre, **ícono** (de un catálogo del sistema de diseño Pixel), link, categoría (Dirección y Administración / Producción / nuevas).

## Reglas de negocio iniciales
1. Solo administradores autenticados escriben; cualquier visitante lee solo contenido **publicado**.
2. Máximo 2 noticias destacadas simultáneas.
3. Cumpleaños: solo nombre + día y mes (dato personal mínimo).
4. Todo texto de la intranet sigue el Design System v2 (Inter, claro/oscuro, sin degradados).

## Criterios de aceptación (resumen)
- Admin crea noticia con foto, la marca destacada y aparece en la intranet; la tercera destacada exige reemplazo.
- Evento de cumpleaños muestra torta y, al pasar el puntero, el nombre.
- Menú con submenú creado en el backoffice se ve y despliega en la intranet.
- Un visitante sin login no puede editar nada (probado).

## Riesgos
- La intranet es pública: no guardar datos sensibles (los cumpleaños llevan solo nombre y día/mes; confirmar con Pixel el consentimiento — Habeas Data).
- Subida de imágenes: límite de tamaño y tipos permitidos.
- Los links a herramientas quedan visibles públicamente (decisión ya asumida con GitHub Pages).

## Preguntas abiertas (para aprobar el PRD)
1. ¿"Los menús que siguen" = barra de accesos rápidos + pestañas de herramientas? ¿Algo más (títulos de sección)?
2. Cumpleaños: ¿ingresas tú cada cumpleaños a mano, o conviene cargar un listado (Excel/CSV) de todo el personal?
3. ¿Los eventos pueden repetirse cada año (cumpleaños anual)? Propuesta: sí, opción "se repite cada año".
4. ¿Quiénes serán los admins iniciales (correos)?
