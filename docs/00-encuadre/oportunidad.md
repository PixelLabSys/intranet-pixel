# Encuadre — Backoffice de la Intranet Pixel

**Nivel TRAZA:** Modular (aprobado por Alejo, 2026-11-12)
**Stack base decidido:** Supabase (BD + Auth + Storage) · intranet pública en GitHub Pages · administración con varios usuarios.

## Problema
La intranet v1 (https://pixellabsys.github.io/intranet-pixel/) es un HTML estático: cada cambio de menú, banner, noticia, evento o herramienta exige que Alejo (o Claude) edite código y haga push. Eso no escala ni lo puede hacer nadie más en Pixel.

## Oportunidad
Un backoffice donde personas autorizadas administren el contenido de la intranet sin tocar código, y la intranet lo muestre en vivo.

## Usuarios
- **Administradores** (Alejo + otras personas): editan contenido en el backoffice.
- **Pixeludos** (todo el personal): leen la intranet; no inician sesión.

## Fuera de alcance de esta etapa
- Páginas internas con contenido (los submenús solo enlazan; la estructura queda lista para páginas internas después).
- Login de los pixeludos / personalización por usuario.
- Comentarios, "me gusta", notificaciones.

## Glosario
- **Backoffice:** panel de administración (la "plataforma de backing").
- **Intranet:** el sitio público que lee el contenido.
- **Destacada:** noticia visible en la intranet (máximo 2 a la vez).
