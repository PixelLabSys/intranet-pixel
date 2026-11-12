# Criterios de aceptación (Dado / Cuando / Entonces)

## Corte 0 — Seguridad
- Dado un visitante anónimo, cuando intenta insertar, actualizar o borrar en cualquier tabla, subir/sobrescribir/listar en `media` o llamar `set_featured`/`invite_admin`, entonces recibe error (no "0 filas ok").
- Dado un usuario autenticado que no es admin, cuando intenta lo mismo, entonces falla igual.
- Dado un anónimo, cuando consulta `events` por la API, entonces no existe ninguna columna de año de nacimiento y no ve eventos `visible=false`, noticias en borrador ni menús ocultos.
- Dado un único admin, cuando intenta borrarse, entonces la BD lo impide.

## Corte 1
- Dado un admin con MFA, cuando sube una foto de 6 MB, entonces se reduce a ≤ 1920 px y se guarda sin EXIF; un archivo SVG o PDF se rechaza.
- Dado el banner sin imagen, cuando se carga la intranet, entonces se ve el fondo de píxeles.
- Dado un menú con submenú creado en el backoffice, cuando recargo la intranet, entonces aparece y se despliega (escritorio y móvil).
- Dado un enlace `javascript:alert(1)` en un menú, cuando intento guardarlo, entonces se rechaza; y si llegara a la BD, la intranet no lo pinta como enlace.
- Dado un admin, cuando invita un correo nuevo, entonces llega la invitación y el usuario queda en `admins` solo tras aceptar; la clave `service_role` no aparece en ningún archivo del repo.
- Dado Supabase caído (o respuesta vacía), cuando se carga la intranet, entonces en ≤ 5 s se ve el respaldo.

## Corte 2
- Dada una noticia en borrador, cuando intento destacarla, entonces se me pide publicarla primero.
- Dadas 2 destacadas, cuando destaco una tercera, entonces el sistema pregunta cuál reemplaza y la intranet muestra exactamente 2.
- Dos admins destacan a la vez en el último cupo: uno gana y el otro ve "otro admin acaba de ocupar ese cupo".
- Despublicar una destacada libera su cupo.

## Corte 3
- Dado un cumpleaños 29-feb, cuando el año no es bisiesto, entonces se muestra el 28-feb.
- Dado un cumpleaños, cuando paso el puntero o toco el día, entonces veo de quién es; un cumpleaños `visible=false` no aparece.
- Dado un día con cumpleaños y reunión, entonces se muestran ambos íconos o el de mayor prioridad y ambos en el detalle.
- "Hoy" se calcula en `America/Bogota`.

## Corte 4
- Dada una herramienta nueva (nombre, ícono, link), cuando la guardo, entonces aparece en su categoría y en "Todas"; ocultarla la quita sin borrarla.
- Borrar una categoría con herramientas se rechaza.
- Las 13 herramientas actuales funcionan igual tras la migración.
