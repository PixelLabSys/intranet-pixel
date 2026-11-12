-- Intranet Pixel · Esquema, permisos y reglas (Corte 0)
-- Ver docs/02-sdd/modelo-datos.md (+ Enmiendas v2) y docs/05-decisiones/auditoria-pre-codigo.md

-- ============================ Funciones base ============================
create function public.icon_valid(i text) returns boolean
language sql immutable set search_path = '' as $$
  select i is null or i = any (array['card','users','briefcase','ops','gear','book','search','code','chat','camera',
    'file','activity','zap','cake','calendar','megaphone','link','home','folder','chart','mail','star','training','meeting']);
$$;

-- ============================ admins ============================
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null check (length(email) between 3 and 254),
  added_by   uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- is_admin: tiene fila en admins. can_write: además sesión con MFA (aal2).
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

create function public.can_write() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;

-- ============================ site_settings ============================
create table public.site_settings (
  key        text primary key check (key in ('banner_image','banner_eyebrow','banner_title','banner_text')),
  value      text not null default '' check (length(value) <= 500),
  updated_at timestamptz not null default now(),
  constraint banner_image_ok check (key <> 'banner_image' or value = '' or value ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$')
);

-- ============================ tool_categories / tools ============================
create table public.tool_categories (
  id         uuid primary key default gen_random_uuid(),
  label      text not null check (length(label) between 1 and 60),
  position   int not null default 0,
  visible    boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.tools (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.tool_categories (id) on delete restrict,
  name        text not null check (length(name) between 1 and 80),
  icon        text not null default 'link' check (public.icon_valid(icon)),
  url         text not null check (url ~ '^https://[^[:space:]]+$' and length(url) <= 1000),
  position    int not null default 0,
  visible     boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ============================ menu_items ============================
create table public.menu_items (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid references public.menu_items (id) on delete cascade,
  zone       text not null check (zone in ('top','quick')),
  label      text not null check (length(label) between 1 and 60),
  kind       text not null check (kind in ('url','anchor','tool')),
  target     text,
  tool_id    uuid references public.tools (id) on delete cascade,
  icon       text check (public.icon_valid(icon)),
  position   int not null default 0,
  visible    boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint menu_target_ok check (
    (kind = 'url'    and tool_id is null and target ~ '^(https://|mailto:)[^[:space:]]+$' and length(target) <= 1000)
 or (kind = 'anchor' and tool_id is null and target in ('#noticias','#calendario','#herramientas'))
 or (kind = 'tool'   and tool_id is not null and target is null)
  )
);

-- ============================ news ============================
create table public.news (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (length(title) between 1 and 140),
  body           text not null default '' check (length(body) <= 2000),
  category       text not null default 'General' check (length(category) between 1 and 40),
  image_path     text check (image_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  published_on   date not null default ((now() at time zone 'America/Bogota')::date),
  status         text not null default 'draft' check (status in ('draft','published')),
  featured_order smallint check (featured_order in (1,2)),
  updated_at     timestamptz not null default now(),
  constraint featured_only_published check (featured_order is null or status = 'published')
);
create unique index news_featured_slot on public.news (featured_order) where featured_order is not null;

-- ============================ events ============================
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(title) between 1 and 120),
  type         text not null check (type in ('cumple','reunion','capacitacion','otro')),
  person_name  text check (length(person_name) between 1 and 120),
  event_month  smallint check (event_month between 1 and 12),
  event_day    smallint check (event_day between 1 and 31),
  event_date   date,
  event_time   time,
  description  text not null default '' check (length(description) <= 500),
  visible      boolean not null default true,
  updated_at   timestamptz not null default now(),
  constraint events_by_type check (
    (type = 'cumple' and person_name is not null and event_month is not null and event_day is not null
       and event_date is null and event_time is null
       and event_day <= case event_month when 2 then 29 when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30 else 31 end)
 or (type <> 'cumple' and event_date is not null and person_name is null and event_month is null and event_day is null)
  )
);

-- ============================ audit_log ============================
create table public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  table_name text not null,
  action     text not null,
  old_row    jsonb,
  new_row    jsonb
);

-- ============================ Triggers ============================
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create function public.audit_row() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (user_id, table_name, action, old_row, new_row)
  values ((select auth.uid()), tg_table_name, tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;

create function public.guard_last_admin() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.admins) <= 1 then
    raise exception 'No se puede eliminar al último administrador' using errcode = 'P0001';
  end if;
  return old;
end $$;

create function public.menu_check() returns trigger language plpgsql set search_path = '' as $$
declare p record;
begin
  if new.parent_id is not null then
    if new.parent_id = new.id then raise exception 'Un menú no puede ser su propio padre' using errcode = 'P0001'; end if;
    select parent_id, zone into p from public.menu_items where id = new.parent_id;
    if not found then raise exception 'El menú padre no existe' using errcode = 'P0001'; end if;
    if p.parent_id is not null then raise exception 'Solo se permite un nivel de submenú' using errcode = 'P0001'; end if;
    if p.zone <> new.zone or new.zone <> 'top' then
      raise exception 'Los submenús solo existen en la zona superior y comparten zona con su padre' using errcode = 'P0001';
    end if;
    if tg_op = 'UPDATE' and exists (select 1 from public.menu_items where parent_id = new.id) then
      raise exception 'Un menú con submenús no puede pasar a ser submenú' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.zone <> old.zone and exists (select 1 from public.menu_items where parent_id = new.id) then
    raise exception 'No se puede cambiar de zona un menú con submenús' using errcode = 'P0001';
  end if;
  return new;
end $$;

create function public.news_status_guard() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status <> 'published' then new.featured_order := null; end if;
  return new;
end $$;

create trigger trg_admins_last  before delete on public.admins for each row execute function public.guard_last_admin();
create trigger trg_menu_check   before insert or update on public.menu_items for each row execute function public.menu_check();
create trigger trg_news_status  before insert or update on public.news for each row execute function public.news_status_guard();

do $$ declare t text; begin
  foreach t in array array['site_settings','tool_categories','tools','menu_items','news','events'] loop
    execute format('create trigger trg_%1$s_touch before update on public.%1$I for each row execute function public.touch_updated_at()', t);
  end loop;
  foreach t in array array['admins','site_settings','tool_categories','tools','menu_items','news','events'] loop
    execute format('create trigger trg_%1$s_audit after insert or update or delete on public.%1$I for each row execute function public.audit_row()', t);
  end loop;
end $$;

-- ============================ Funciones de negocio ============================
create function public.menu_parent_visible(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p is null or exists (select 1 from public.menu_items m where m.id = p and m.visible);
$$;

create function public.set_featured(p_id uuid, p_slot smallint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_write() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_slot not in (1,2) then raise exception 'Cupo inválido' using errcode = '22023'; end if;
  if not exists (select 1 from public.news where id = p_id and status = 'published') then
    raise exception 'La noticia debe estar publicada para destacarla' using errcode = 'P0001';
  end if;
  update public.news set featured_order = null where featured_order = p_slot and id <> p_id;
  update public.news set featured_order = p_slot where id = p_id;
end $$;

create function public.unset_featured(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_write() then raise exception 'No autorizado' using errcode = '42501'; end if;
  update public.news set featured_order = null where id = p_id;
end $$;

create function public.remove_admin(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_write() then raise exception 'No autorizado' using errcode = '42501'; end if;
  delete from public.admins where user_id = p_user;
end $$;

-- ============================ RLS ============================
alter table public.admins          enable row level security;
alter table public.site_settings   enable row level security;
alter table public.tool_categories enable row level security;
alter table public.tools           enable row level security;
alter table public.menu_items      enable row level security;
alter table public.news            enable row level security;
alter table public.events          enable row level security;
alter table public.audit_log       enable row level security;

create policy admins_read   on public.admins for select to authenticated
  using (user_id = (select auth.uid()) or public.can_write());
create policy audit_read    on public.audit_log for select to authenticated using (public.can_write());

create policy settings_pub  on public.site_settings   for select to anon, authenticated using (true);
create policy settings_adm  on public.site_settings   for all to authenticated using (public.can_write()) with check (public.can_write());

create policy cats_pub      on public.tool_categories for select to anon, authenticated using (visible);
create policy cats_adm      on public.tool_categories for all to authenticated using (public.can_write()) with check (public.can_write());

create policy tools_pub     on public.tools for select to anon, authenticated
  using (visible and exists (select 1 from public.tool_categories c where c.id = category_id and c.visible));
create policy tools_adm     on public.tools for all to authenticated using (public.can_write()) with check (public.can_write());

create policy menu_pub      on public.menu_items for select to anon, authenticated
  using (visible and public.menu_parent_visible(parent_id));
create policy menu_adm      on public.menu_items for all to authenticated using (public.can_write()) with check (public.can_write());

create policy news_pub      on public.news for select to anon, authenticated using (status = 'published');
create policy news_adm      on public.news for all to authenticated using (public.can_write()) with check (public.can_write());

create policy events_pub    on public.events for select to anon, authenticated using (visible);
create policy events_adm    on public.events for all to authenticated using (public.can_write()) with check (public.can_write());

-- ============================ Privilegios (mínimos) ============================
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Lectura pública (la intranet debe pedir columnas explícitas, no select=*)
grant select on public.site_settings, public.tool_categories, public.tools to anon, authenticated;
grant select (id, parent_id, zone, label, kind, target, tool_id, icon, position, visible) on public.menu_items to anon, authenticated;
grant select (id, title, body, category, image_path, published_on, status, featured_order) on public.news to anon, authenticated;
grant select (id, title, type, person_name, event_month, event_day, event_date, event_time, description, visible) on public.events to anon, authenticated;

-- Escritura (RLS la limita a administradores con MFA)
grant insert, update, delete on public.site_settings, public.tool_categories, public.tools, public.menu_items, public.events to authenticated;
grant select on public.menu_items, public.news, public.events to authenticated;         -- admin ve todas las columnas
grant insert (title, body, category, image_path, published_on, status) on public.news to authenticated;
grant update (title, body, category, image_path, published_on, status) on public.news to authenticated;
grant delete on public.news to authenticated;
grant select (user_id, email, added_by, created_at) on public.admins to authenticated;
grant select on public.audit_log to authenticated;

grant execute on function public.icon_valid(text)            to anon, authenticated;
grant execute on function public.menu_parent_visible(uuid)   to anon, authenticated;
grant execute on function public.is_admin()                  to authenticated;
grant execute on function public.can_write()                 to authenticated;
grant execute on function public.set_featured(uuid, smallint) to authenticated;
grant execute on function public.unset_featured(uuid)        to authenticated;
grant execute on function public.remove_admin(uuid)          to authenticated;

-- ============================ Storage: bucket media ============================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy media_select on storage.objects for select to authenticated using (bucket_id = 'media' and public.can_write());
create policy media_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.can_write());
create policy media_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.can_write()) with check (bucket_id = 'media' and public.can_write());
create policy media_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.can_write());
