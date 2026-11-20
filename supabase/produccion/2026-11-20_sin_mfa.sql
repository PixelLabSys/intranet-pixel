-- Pegar y ejecutar UNA VEZ en Supabase → SQL Editor del proyecto intranet-pixel.
-- Quita la exigencia de verificación en dos pasos: basta con ser administrador.
create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin();
$$;
