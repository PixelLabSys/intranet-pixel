-- Emoji opcional para identificar cada evento en el calendario (se muestra en lugar del número del día).
alter table public.events add column emoji text check (emoji is null or char_length(emoji) between 1 and 8);
grant select (emoji) on public.events to anon, authenticated;
