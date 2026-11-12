-- Ejecutar UNA vez en el SQL Editor de Supabase, DESPUÉS de crear tu usuario
-- (Authentication → Users → Add user) y reemplazando el correo.
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'TU_CORREO@dominio.com';
