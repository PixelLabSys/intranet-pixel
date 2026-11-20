-- Pegar y ejecutar en Supabase → SQL Editor. Repite (sin riesgo) los permisos de las listas de acceso
-- y muestra cómo quedaron en la tabla de resultados.
grant select, insert, update, delete on public.access_domains, public.access_emails to authenticated;
grant select, insert, update on public.access_domains, public.access_emails to service_role;
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as permisos
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('access_domains', 'access_emails') and grantee in ('authenticated', 'service_role')
group by 1, 2 order by 1, 2;
