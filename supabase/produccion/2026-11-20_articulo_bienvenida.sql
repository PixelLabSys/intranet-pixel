-- Pegar y ejecutar en Supabase → SQL Editor. Carga el artículo en la noticia de bienvenida.
update public.news set body = $b$Esta es la nueva casa digital de Pixel Graphic: un solo lugar, hecho a la medida de nuestro equipo, para estar al día y encontrar rápido lo que necesitas para trabajar.

[b]Qué encuentras hoy[/b]
• Noticias y anuncios de la compañía, que puedes abrir completos con un clic.
• Calendario con cumpleaños, reuniones, capacitaciones y fechas especiales, cada uno con su emoji.
• Herramientas: los sistemas de Pixel organizados por categorías y con buscador, a un clic de distancia.
• Accesos rápidos y menús para llegar a cada sección sin perderte.
• Modo claro y oscuro, y una versión pensada para verse y funcionar muy bien en el celular.
• Entrada segura con tu cuenta de Google de la empresa: solo el equipo autorizado puede ver el contenido.

[b]Cómo se mantiene[/b]
Un backoffice sencillo permite a los administradores actualizar el banner, los menús, las noticias, el calendario y las herramientas sin escribir código, con un manual de uso y las novedades de la plataforma dentro de la misma herramienta.

[b]Hacia dónde vamos[/b]
Queremos que la Intranet sea el punto de encuentro de todo Pixel: más herramientas y procesos integrados, la información de la organización que hoy está dispersa y que, por su carácter reservado, solo verá el equipo autorizado, y nuevos espacios para conocernos y comunicarnos mejor.

La iremos construyendo con ustedes. Cuéntanos qué te gustaría encontrar aquí.$b$ where title like 'Bienvenidos a la nueva Intranet%';
select id, left(body, 60) as inicio, length(body) as largo from public.news where title like 'Bienvenidos a la nueva Intranet%';
