-- Permite guardar la altura del banner (en px) elegida en el editor de imagen.
alter table public.site_settings drop constraint site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check
  check (key in ('banner_image','banner_eyebrow','banner_title','banner_text','banner_height'));
alter table public.site_settings add constraint banner_height_ok
  check (key <> 'banner_height' or (value ~ '^[0-9]{3}$' and value::int between 200 and 600));
