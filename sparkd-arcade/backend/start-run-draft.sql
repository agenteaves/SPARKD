-- SPARKD arcade start-run transaction draft; requires schema-draft.sql first.
-- NOT DEPLOYED. Call ONLY from a trusted backend after verifying user JWT.
-- Function is SECURITY INVOKER; only service_role can execute it.
create or replace function sparkd_arcade.start_run(p_player_id uuid)
returns table(run_id uuid, run_seed bigint, run_expires_at timestamptz, run_number smallint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_slot smallint;
  v_seed bigint;
  v_expires timestamptz := now() + interval '15 minutes';
  v_id uuid;
begin
  if p_player_id is null then
    raise exception 'player identity required' using errcode='22023';
  end if;
  -- Ensure the account still exists. Caller must already have authenticated it.
  if not exists (select 1 from auth.users where id=p_player_id) then
    raise exception 'unknown player' using errcode='22023';
  end if;
  -- Competing starts may choose the same slot. Unique constraint + ON CONFLICT
  -- makes allocation atomic; loop to attempt another available slot.
  for v_slot in 1..5 loop
    v_seed := (('x'||encode(gen_random_bytes(4),'hex'))::bit(32)::bigint % 4294967295) + 1;
    insert into sparkd_arcade.runs(player_id,utc_day,run_number,seed,expires_at)
    values(p_player_id,v_day,v_slot,v_seed,v_expires)
    on conflict (player_id,utc_day,run_number) do nothing
    returning id into v_id;
    if v_id is not null then
      run_id:=v_id;run_seed:=v_seed;run_expires_at:=v_expires;run_number:=v_slot;
      return next;
      return;
    end if;
  end loop;
  raise exception 'daily arcade run limit reached' using errcode='P0001';
end;
$$;
revoke all on function sparkd_arcade.start_run(uuid) from public, anon, authenticated;
grant execute on function sparkd_arcade.start_run(uuid) to service_role;
