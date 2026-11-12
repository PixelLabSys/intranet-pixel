begin;
create extension if not exists pgtap with schema extensions;
select plan(48);

-- Datos de prueba (como postgres; el seed ya cargó contenido)
insert into auth.users (id, aud, role, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin@pixel.test'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'persona@pixel.test');
insert into public.admins (user_id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@pixel.test');
insert into public.news (id, title, status) values ('cccccccc-0000-4000-8000-00000000000a', 'Borrador oculto', 'draft');
insert into public.menu_items (id, zone, label, kind, target, visible) values
  ('dddddddd-0000-4000-8000-000000000001', 'top', 'Padre oculto', 'anchor', '#noticias', false);
insert into public.menu_items (zone, label, kind, target, parent_id) values
  ('top', 'Hijo de oculto', 'anchor', '#calendario', 'dddddddd-0000-4000-8000-000000000001');
insert into public.events (title, type, person_name, event_month, event_day, visible) values
  ('Cumple oculto', 'cumple', 'Persona Oculta', 5, 5, false), ('Cumple público', 'cumple', 'Laura', 6, 15, true);

-- ===================== ANÓNIMO =====================
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*)::int from public.news where status <> 'published'), 0, 'anon: no ve borradores');
select is((select count(*)::int from public.news), 2, 'anon: ve las 2 noticias publicadas');
select is((select count(*)::int from public.menu_items where label = 'Hijo de oculto'), 0, 'anon: no ve submenú cuyo padre está oculto');
select is((select count(*)::int from public.events where person_name = 'Persona Oculta'), 0, 'anon: no ve cumpleaños oculto');
select is((select count(*)::int from public.events where person_name = 'Laura'), 1, 'anon: ve cumpleaños visible');
select throws_ok($$ select updated_at from public.news $$, '42501', null, 'anon: no puede leer columnas internas (updated_at)');
select throws_ok($$ select * from public.news $$, '42501', null, 'anon: select * falla (obliga a columnas explícitas)');
select throws_ok($$ select * from public.admins $$, '42501', null, 'anon: no lee admins');
select throws_ok($$ select * from public.audit_log $$, '42501', null, 'anon: no lee audit_log');
select throws_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','x','https://x.co') $$, '42501', null, 'anon: no inserta tools');
select throws_ok($$ insert into public.news (title) values ('x') $$, '42501', null, 'anon: no inserta noticias');
select throws_ok($$ update public.site_settings set value = 'hack' $$, '42501', null, 'anon: no actualiza ajustes');
select throws_ok($$ delete from public.events $$, '42501', null, 'anon: no borra eventos');
select throws_ok($$ select public.set_featured('cccccccc-0000-4000-8000-00000000000a', 1::smallint) $$, '42501', null, 'anon: no ejecuta set_featured');
select throws_ok($$ select public.remove_admin('aaaaaaaa-0000-4000-8000-000000000001') $$, '42501', null, 'anon: no ejecuta remove_admin');
select throws_ok($$ select public.can_write() $$, '42501', null, 'anon: no ejecuta can_write');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('media', 'x.png') $$, '42501', null, 'anon: no sube a storage');
select is((select count(*)::int from storage.objects where bucket_id = 'media'), 0, 'anon: no lista storage');

-- ===================== AUTENTICADO NO-ADMIN (aal2) =====================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','x','https://x.co') $$, '42501', null, 'no-admin: no inserta tools (RLS)');
select throws_ok($$ select public.set_featured('cccccccc-0000-4000-8000-00000000000a', 1::smallint) $$, '42501', null, 'no-admin: set_featured falla con error (no "0 filas")');
select is((select count(*)::int from public.admins), 0, 'no-admin: no ve la tabla admins');
select is((select count(*)::int from public.news where status = 'draft'), 0, 'no-admin: no ve borradores');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('media', 'x.png') $$, '42501', null, 'no-admin: no sube a storage');

-- ===================== ADMIN SIN MFA (aal1) =====================
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.news where status = 'draft'), 0, 'admin aal1: no ve borradores (exige MFA)');
select throws_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','x','https://x.co') $$, '42501', null, 'admin aal1: no escribe');
select is((select count(*)::int from public.admins), 1, 'admin aal1: sí ve su propia fila en admins');

-- ===================== ADMIN CON MFA (aal2) =====================
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::int from public.news where status = 'draft'), 1, 'admin aal2: ve borradores');
select lives_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','Nueva','https://ok.example.com/x') $$, 'admin: inserta herramienta válida');
select throws_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','Mala','javascript:alert(1)') $$, '23514', null, 'admin: rechaza javascript: en tools');
select throws_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','Mala','http://inseguro.com') $$, '23514', null, 'admin: rechaza http:// (solo https)');
select throws_ok($$ insert into public.tools (category_id, name, url) values ('00000000-0000-4000-8000-000000000001','Mala','https://a.com/ b') $$, '23514', null, 'admin: rechaza URL con espacio');
select throws_ok($$ insert into public.menu_items (zone,label,kind,target) values ('top','x','url','javascript:alert(1)') $$, '23514', null, 'admin: rechaza javascript: en menús');
select throws_ok($$ insert into public.menu_items (zone,label,kind,target) values ('top','x','anchor','#otro') $$, '23514', null, 'admin: rechaza ancla fuera de catálogo');
select throws_ok($$ insert into public.tools (category_id, name, icon, url) values ('00000000-0000-4000-8000-000000000001','x','hack','https://ok.com') $$, '23514', null, 'admin: rechaza ícono fuera de catálogo');
select throws_ok($$ delete from public.tool_categories where id = '00000000-0000-4000-8000-000000000001' $$, '23503', null, 'admin: no borra categoría con herramientas');

-- jerarquía de menús
select throws_ok($$ insert into public.menu_items (zone,label,kind,target,parent_id) values ('top','nieto','anchor','#noticias',(select id from public.menu_items where label='Hijo de oculto')) $$, 'P0001', null, 'menú: no más de un nivel');
select throws_ok($$ insert into public.menu_items (zone,label,kind,target,parent_id) values ('quick','sub','anchor','#noticias','dddddddd-0000-4000-8000-000000000001') $$, 'P0001', null, 'menú: submenú solo en zona top y misma zona');

-- eventos
select throws_ok($$ insert into public.events (title,type,person_name,event_month,event_day,event_date) values ('c','cumple','Ana',3,4,'1990-03-04') $$, '23514', null, 'cumpleaños: no admite año (event_date)');
select lives_ok($$ insert into public.events (title,type,person_name,event_month,event_day) values ('c','cumple','Bis',2,29) $$, 'cumpleaños: 29-feb se puede guardar');
select throws_ok($$ insert into public.events (title,type,person_name,event_month,event_day) values ('c','cumple','Mala',4,31) $$, '23514', null, 'cumpleaños: 31-abr rechazado');

-- noticias destacadas
select throws_ok($$ update public.news set featured_order = 1 where id = 'cccccccc-0000-4000-8000-00000000000a' $$, '42501', null, 'destacadas: UPDATE directo de featured_order bloqueado');
select throws_ok($$ select public.set_featured('cccccccc-0000-4000-8000-00000000000a', 1::smallint) $$, 'P0001', null, 'destacadas: un borrador no se puede destacar');
select lives_ok($$ update public.news set status = 'published', title = 'Tercera' where id = 'cccccccc-0000-4000-8000-00000000000a' $$, 'admin: publica la noticia');
select lives_ok($$ select public.set_featured('cccccccc-0000-4000-8000-00000000000a', 1::smallint) $$, 'destacadas: set_featured reemplaza el cupo 1');
select is((select count(*)::int from public.news where featured_order is not null), 2, 'destacadas: siguen siendo exactamente 2');
select lives_ok($$ update public.news set status = 'draft' where id = 'cccccccc-0000-4000-8000-00000000000a' $$, 'admin: despublica la destacada');
select is((select featured_order from public.news where id = 'cccccccc-0000-4000-8000-00000000000a'), null, 'destacadas: despublicar libera el cupo');

-- último admin
select throws_ok($$ select public.remove_admin('aaaaaaaa-0000-4000-8000-000000000001') $$, 'P0001', null, 'admins: no se puede quitar al último');

select * from finish();
rollback;
