-- Pegar y ejecutar UNA VEZ en Supabase → SQL Editor del proyecto intranet-pixel.
-- Acceso restringido a la organización (ADR-003). Después: activar el filtro de registro y el registro de usuarios (ver docs/06-operacion/despliegue.md).
-- Acceso restringido: la intranet solo la lee quien tenga sesión y esté autorizado
-- (dominio de la organización, correo individual de la lista, o administrador). Ver ADR-003.

create table public.access_domains (
  domain     text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$'
                                   and domain not in ('gmail.com','googlemail.com','hotmail.com','outlook.com','live.com','yahoo.com','icloud.com','proton.me','protonmail.com')),
  added_by   uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.access_emails (
  email      text primary key check (email = lower(email) and length(email) <= 254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  added_by   uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
insert into public.access_domains (domain) values ('pixel-g.com'), ('pxl-g.com');

-- ¿Este correo está autorizado? (lo usan is_member y el filtro de registro)
create function public.email_allowed(p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_email is not null and (
    exists (select 1 from public.access_domains d where d.domain = lower(split_part(p_email, '@', 2)))
    or exists (select 1 from public.access_emails e where e.email = lower(p_email))
    or exists (select 1 from public.admins a where lower(a.email) = lower(p_email))
  );
$$;

-- ¿La sesión actual pertenece a alguien autorizado? Exige correo confirmado.
create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select public.email_allowed(u.email) from auth.users u
                   where u.id = (select auth.uid()) and u.email_confirmed_at is not null), false);
$$;

-- Filtro de registro (Auth Hook "Before User Created"): rechaza correos no autorizados.
create function public.hook_before_user_created(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if public.email_allowed(event->'user'->>'email') then return '{}'::jsonb; end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Este correo no está autorizado'));
end $$;

alter table public.access_domains enable row level security;
alter table public.access_emails  enable row level security;
create policy access_domains_adm on public.access_domains for all to authenticated using (public.can_write()) with check (public.can_write());
create policy access_emails_adm  on public.access_emails  for all to authenticated using (public.can_write()) with check (public.can_write());
create trigger trg_access_domains_audit after insert or update or delete on public.access_domains for each row execute function public.audit_row();
create trigger trg_access_emails_audit  after insert or update or delete on public.access_emails  for each row execute function public.audit_row();

-- Lectura de contenido: solo miembros (antes era pública)
drop policy settings_pub on public.site_settings;
drop policy cats_pub     on public.tool_categories;
drop policy tools_pub    on public.tools;
drop policy menu_pub     on public.menu_items;
drop policy news_pub     on public.news;
drop policy events_pub   on public.events;
create policy settings_pub on public.site_settings   for select to authenticated using (public.is_member());
create policy cats_pub     on public.tool_categories for select to authenticated using (visible and public.is_member());
create policy tools_pub    on public.tools for select to authenticated
  using (visible and public.is_member() and exists (select 1 from public.tool_categories c where c.id = category_id and c.visible));
create policy menu_pub     on public.menu_items for select to authenticated using (visible and public.is_member() and public.menu_parent_visible(parent_id));
create policy news_pub     on public.news   for select to authenticated using (status = 'published' and public.is_member());
create policy events_pub   on public.events for select to authenticated using (visible and public.is_member());

-- El rol anónimo ya no lee nada
revoke all on all tables in schema public from anon;
revoke execute on function public.icon_valid(text), public.menu_parent_visible(uuid) from anon;
grant execute on function public.icon_valid(text), public.menu_parent_visible(uuid) to authenticated;

-- Privilegios
grant select, insert, update, delete on public.access_domains, public.access_emails to authenticated;
grant select, insert, update on public.access_domains, public.access_emails to service_role;
grant select on public.access_domains, public.access_emails to supabase_auth_admin;
revoke execute on function public.email_allowed(text), public.is_member(), public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.is_member() to authenticated;
grant execute on function public.email_allowed(text) to supabase_auth_admin, service_role;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
