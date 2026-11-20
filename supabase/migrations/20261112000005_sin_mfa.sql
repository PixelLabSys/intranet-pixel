-- Decisión de producto: se elimina la verificación en dos pasos (MFA) para simplificar el acceso.
-- can_write() deja de exigir sesión aal2: basta con ser administrador (fila en public.admins).
create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin();
$$;
