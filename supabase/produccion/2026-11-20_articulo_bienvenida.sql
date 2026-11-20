-- Pegar y ejecutar en Supabase - SQL Editor. Carga el articulo en la noticia de bienvenida (solo caracteres ASCII).
update public.news set body = U&'Esta es la nueva casa digital de Pixel Graphic: un solo lugar, hecho a la medida de nuestro equipo, para estar al d\00eda y encontrar r\00e1pido lo que necesitas para trabajar.

[b]Qu\00e9 encuentras hoy[/b]
\2022 Noticias y anuncios de la compa\00f1\00eda, que puedes abrir completos con un clic.
\2022 Calendario con cumplea\00f1os, reuniones, capacitaciones y fechas especiales, cada uno con su emoji.
\2022 Herramientas: los sistemas de Pixel organizados por categor\00edas y con buscador, a un clic de distancia.
\2022 Accesos r\00e1pidos y men\00fas para llegar a cada secci\00f3n sin perderte.
\2022 Modo claro y oscuro, y una versi\00f3n pensada para verse y funcionar muy bien en el celular.
\2022 Entrada segura con tu cuenta de Google de la empresa: solo el equipo autorizado puede ver el contenido.

[b]C\00f3mo se mantiene[/b]
Un backoffice sencillo permite a los administradores actualizar el banner, los men\00fas, las noticias, el calendario y las herramientas sin escribir c\00f3digo, con un manual de uso y las novedades de la plataforma dentro de la misma herramienta.

[b]Hacia d\00f3nde vamos[/b]
Queremos que la Intranet sea el punto de encuentro de todo Pixel: m\00e1s herramientas y procesos integrados, la informaci\00f3n de la organizaci\00f3n que hoy est\00e1 dispersa y que, por su car\00e1cter reservado, solo ver\00e1 el equipo autorizado, y nuevos espacios para conocernos y comunicarnos mejor.

La iremos construyendo con ustedes. Cu\00e9ntanos qu\00e9 te gustar\00eda encontrar aqu\00ed.' where title like 'Bienvenidos a la nueva Intranet%';
select left(body, 120) as inicio, length(body) as largo from public.news where title like 'Bienvenidos a la nueva Intranet%';
