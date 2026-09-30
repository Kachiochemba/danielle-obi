begin;
create or replace function public.delete_gift_records(p_ids uuid[])
returns integer language plpgsql security invoker set search_path = public, pg_temp as $$
declare removed integer;
begin
  if cardinality(p_ids) is null or cardinality(p_ids) < 1 or cardinality(p_ids) > 10000 then
    raise exception 'INVALID_IDS';
  end if;
  -- Both deletes commit together; only the records confirmed by the admin are affected.
  perform id from public.gift_pledges where id=any(p_ids) order by id for update;
  delete from public.gift_reservations where pledge_id=any(p_ids);
  delete from public.gift_pledges where id=any(p_ids);
  get diagnostics removed = row_count;
  return removed;
end $$;
revoke all on function public.delete_gift_records(uuid[]) from public, anon, authenticated;
grant execute on function public.delete_gift_records(uuid[]) to service_role;
notify pgrst, 'reload schema';
commit;
