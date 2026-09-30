begin;
create table if not exists public.gift_catalog (
 id text primary key, name text not null, active boolean not null default true
);
create table if not exists public.gift_pledges (
 id uuid primary key,
 full_name text not null check (length(full_name) between 2 and 120),
 email text not null check (length(email) between 3 and 255),
 kind text not null check (kind in ('money','items')),
 amount numeric(14,2),
 items jsonb not null default '[]',
 created_at timestamptz not null default now(),
 notification_sent_at timestamptz,
 check ((kind='money' and amount > 0 and amount <= 100000000 and items='[]'::jsonb)
 or (kind='items' and amount is null and jsonb_array_length(items) between 1 and 10))
);
create table if not exists public.gift_reservations (
 gift_id text primary key references public.gift_catalog(id),
 pledge_id uuid not null references public.gift_pledges(id)
);
create index if not exists gift_reservations_pledge_id on public.gift_reservations(pledge_id);
create index if not exists gift_pledges_created_at on public.gift_pledges(created_at desc);
alter table public.gift_catalog enable row level security;
alter table public.gift_pledges enable row level security;
alter table public.gift_reservations enable row level security;
revoke all on public.gift_catalog, public.gift_pledges, public.gift_reservations from anon, authenticated;
grant all on public.gift_catalog, public.gift_pledges, public.gift_reservations to service_role;
insert into public.gift_catalog(id,name) values
 ('steam-cleaner','Steam cleaner'),('carpet-cleaner','Carpet cleaning machine'),
 ('carpet-extractor','Carpet extractor'),('gas-cooker','Gas cooker'),('air-fryer','Air fryer'),
 ('microwave','Microwave'),('deep-freezer','Deep freezer'),('juicer','Juicer'),('toaster','Toaster'),('ac','Air conditioner')
on conflict(id) do nothing;

create or replace function public.submit_gift_pledge(p_id uuid,p_name text,p_email text,p_kind text,p_amount numeric,p_items text[])
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare old public.gift_pledges; selected jsonb; item_count integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into old from public.gift_pledges where id=p_id;
 if found then
   if old.full_name<>p_name or old.email<>p_email or old.kind<>p_kind
      or old.amount is distinct from p_amount
      or (select coalesce(array_agg(x->>'id' order by x->>'id'),'{}'::text[]) from jsonb_array_elements(old.items) x)
         is distinct from (select coalesce(array_agg(x order by x),'{}'::text[]) from unnest(p_items) x) then
     raise exception 'REQUEST_CONFLICT';
   end if;
   return to_jsonb(old);
 end if;
 if p_kind='items' then
   item_count:=cardinality(p_items);
   if item_count is null or item_count<1 or item_count>10 or item_count<>(select count(distinct x) from unnest(p_items) x) then
     raise exception 'INVALID_ITEMS';
   end if;
   perform id from public.gift_catalog where id=any(p_items) and active order by id for update;
   if (select count(*) from public.gift_catalog where id=any(p_items) and active)<>item_count then
     raise exception 'INVALID_ITEMS';
   end if;
   if exists(select 1 from public.gift_reservations where gift_id=any(p_items)) then
     raise exception 'GIFT_UNAVAILABLE';
   end if;
   select jsonb_agg(jsonb_build_object('id',id,'name',name) order by id) into selected from public.gift_catalog where id=any(p_items);
 else
   if p_kind<>'money' or cardinality(p_items)<>0 then raise exception 'INVALID_GIFT'; end if;
   selected:='[]'::jsonb;
 end if;
 insert into public.gift_pledges(id,full_name,email,kind,amount,items)
 values(p_id,p_name,p_email,p_kind,p_amount,selected) returning * into old;
 if p_kind='items' then
   insert into public.gift_reservations(gift_id,pledge_id) select x,p_id from unnest(p_items) x;
 end if;
 return to_jsonb(old);
end $$;
revoke all on function public.submit_gift_pledge(uuid,text,text,text,numeric,text[]) from public,anon,authenticated;
grant execute on function public.submit_gift_pledge(uuid,text,text,text,numeric,text[]) to service_role;
notify pgrst,'reload schema';
commit;
