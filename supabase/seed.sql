-- Datos iniciales = contenido actual de la intranet v1
insert into public.site_settings (key, value) values
  ('banner_image', ''), ('banner_eyebrow', 'Intranet Pixel'), ('banner_title', '¡Bienvenido, Pixeludo!'),
  ('banner_text', 'Mantente al día con las noticias de la compañía, los próximos eventos y todas las herramientas que necesitas en tu día.')
on conflict (key) do nothing;

insert into public.tool_categories (id, label, position) values
  ('00000000-0000-4000-8000-000000000001', 'Dirección y Administración', 1),
  ('00000000-0000-4000-8000-000000000002', 'Producción', 2);

insert into public.tools (category_id, name, icon, url, position) values
  ('00000000-0000-4000-8000-000000000001','Sistema de Seguimiento de Tarjetas de Crédito','card','https://pixelgraphicsas.github.io/tc-monitor/',1),
  ('00000000-0000-4000-8000-000000000001','CRM Pixel','users','https://pixelgraphicsas.github.io/crm-pixel/',2),
  ('00000000-0000-4000-8000-000000000001','Sistema de Tercerización','briefcase','https://pixel-tercerizacion.vercel.app/solicitudes',3),
  ('00000000-0000-4000-8000-000000000001','OP Producción','ops','https://docs.google.com/spreadsheets/d/1hTZuAtWAzeSqo7Lef1WTplJt-ssFg0QL-KaqZUbQADY/edit?gid=1128677851#gid=1128677851',4),
  ('00000000-0000-4000-8000-000000000001','OP Engine','gear','https://docs.google.com/spreadsheets/d/1IFafW5ZDw9b_IYjNQ_rLZgn9FP5UZSrjuClQMM27W60/edit?gid=1632966025#gid=1632966025',5),
  ('00000000-0000-4000-8000-000000000001','OP Manuales','book','https://script.google.com/a/macros/pixel-g.com/s/AKfycbwr1iK1R6qJbfwOA5h3_MDbumr8pPJdNWloyFZYsXu01rDktAUZy-_tsr5IWV9dMMewsA/exec',6),
  ('00000000-0000-4000-8000-000000000002','Buscador de Archivos Digital','search','https://pixelgraphicsas.github.io/drive-copiador/',1),
  ('00000000-0000-4000-8000-000000000002','Extractor de Códigos para Diseño','code','https://pixelgraphicsas.github.io/catalogo-extractor/',2),
  ('00000000-0000-4000-8000-000000000002','Mensajería Pixeluda','chat','https://pixelgraphicsas.github.io/mensajeria-pixel/',3),
  ('00000000-0000-4000-8000-000000000002','Muestras Fotografía','camera','https://docs.google.com/spreadsheets/d/19zKnfL_o0G-A12u42ARh7HF__ypJki0xZyjqPufXNJ4/edit?gid=130603725#gid=130603725',4),
  ('00000000-0000-4000-8000-000000000002','Sistema de Solicitudes','file','https://sistema-solicitudes-pixel.vercel.app/',5),
  ('00000000-0000-4000-8000-000000000002','SSS - Seguimiento de Sistemas','activity','https://sss-solicitudes-sistemas-pixel.vercel.app/direccion',6),
  ('00000000-0000-4000-8000-000000000002','PIXEL ONE','zap','https://sss-solicitudes-sistemas-pixel.vercel.app/direccion',7);

insert into public.menu_items (zone, label, kind, target, position) values
  ('top','Noticias','anchor','#noticias',1),
  ('top','Calendario','anchor','#calendario',2),
  ('top','Herramientas','anchor','#herramientas',3);

insert into public.menu_items (zone, label, kind, tool_id, icon, position)
select 'quick', t.name, 'tool', t.id, null, x.pos
from (values ('CRM Pixel',1),('Sistema de Solicitudes',2),('Buscador de Archivos Digital',3),('Sistema de Tercerización',4),('Mensajería Pixeluda',5)) as x(name,pos)
join public.tools t on t.name = x.name;

insert into public.news (title, body, category, status, published_on) values
  ('Bienvenidos a la nueva Intranet Pixel', 'Aquí encontrarás todas nuestras herramientas en un solo lugar.', 'Anuncios', 'published', '2026-11-12'),
  ('Próximamente: noticias de la compañía', 'Este espacio se actualizará con las novedades de Pixel.', 'Novedades', 'published', '2026-11-12');
update public.news set featured_order = 1 where title like 'Bienvenidos%';
update public.news set featured_order = 2 where title like 'Próximamente%';
