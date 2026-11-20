-- Pegar y ejecutar UNA VEZ en Supabase → SQL Editor del proyecto intranet-pixel.
-- La función invite_admin (rol service_role, solo servidor) registra a los nuevos administradores.
grant select, insert, update on public.admins to service_role;
