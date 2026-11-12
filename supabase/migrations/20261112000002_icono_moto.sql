-- Agrega el ícono 'moto' al catálogo permitido.
create or replace function public.icon_valid(i text) returns boolean
language sql immutable set search_path = '' as $$
  select i is null or i = any (array['card','users','briefcase','ops','gear','book','search','code','chat','camera',
    'file','activity','zap','cake','calendar','megaphone','link','home','folder','chart','mail','star','training','meeting','moto']);
$$;
