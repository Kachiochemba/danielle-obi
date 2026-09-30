begin;
alter table public.gift_pledges add column if not exists wish text;
alter table public.gift_pledges alter column email drop not null;
alter table public.gift_pledges drop constraint if exists gift_pledges_kind_check;
alter table public.gift_pledges add constraint gift_pledges_kind_check check (kind in ('money','items','wish'));
alter table public.gift_pledges drop constraint if exists gift_pledges_check;
alter table public.gift_pledges add constraint gift_pledges_check check (
 (kind='money' and amount is not null and amount > 0 and amount <= 100000000 and items='[]'::jsonb and wish is null)
 or (kind='items' and email is not null and amount is null and jsonb_array_length(items) between 1 and 10 and wish is null)
 or (kind='wish' and email is not null and amount is null and items='[]'::jsonb and wish is not null and length(trim(wish)) between 1 and 3000)
);
create or replace function public.submit_gift_entry(p_id uuid,p_name text,p_email text,p_kind text,p_amount numeric,p_items text[],p_wish text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare old public.gift_pledges; selected jsonb; item_count integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into old from public.gift_pledges where id=p_id;
 if found then
   if old.full_name<>p_name or old.email is distinct from p_email or old.kind<>p_kind
      or old.amount is distinct from p_amount or old.wish is distinct from p_wish
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
   if p_kind not in ('money','wish') or cardinality(p_items)<>0 then raise exception 'INVALID_GIFT'; end if;
   selected:='[]'::jsonb;
 end if;
 insert into public.gift_pledges(id,full_name,email,kind,amount,items,wish)
 values(p_id,p_name,p_email,p_kind,p_amount,selected,p_wish) returning * into old;
 if p_kind='items' then
   insert into public.gift_reservations(gift_id,pledge_id) select x,p_id from unnest(p_items) x;
 end if;
 return to_jsonb(old);
end $$;
revoke all on function public.submit_gift_entry(uuid,text,text,text,numeric,text[],text) from public,anon,authenticated;
grant execute on function public.submit_gift_entry(uuid,text,text,text,numeric,text[],text) to service_role;

notify pgrst,'reload schema';
commit;
