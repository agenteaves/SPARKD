-- SPARKD Arcade finalize transaction draft. NOT DEPLOYED.
-- IMPORTANT: Call ONLY after trusted backend has independently replayed
-- a server-issued seed and calculated the verified result.
-- Requires schema-draft.sql. Do not accept client-reported score as verified.
create or replace function sparkd_arcade.finalize_run(
  p_run_id uuid,
  p_player_id uuid,
  p_score integer,
  p_orbs integer,
  p_steps integer,
  p_accepted boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_rows integer;
begin
  if p_run_id is null or p_player_id is null or p_accepted is null then
    raise exception 'missing required argument' using errcode='22023';
  end if;
  if p_accepted and (
    p_score is null or p_orbs is null or p_steps is null or
    p_score < 0 or p_score > 10000000 or
    p_orbs < 0 or p_orbs > 100000 or
    p_steps < 1 or p_steps > 54000
  ) then
    raise exception 'invalid verified replay result' using errcode='22023';
  end if;
  update sparkd_arcade.runs
     set state=case when p_accepted then 'verified' else 'rejected' end,
         verified_score=case when p_accepted then p_score else null end,
         verified_orbs=case when p_accepted then p_orbs else null end,
         verified_steps=case when p_accepted then p_steps else null end,
         finalized_at=now()
   where id=p_run_id and player_id=p_player_id
     and state='active' and expires_at>now();
  get diagnostics v_rows = row_count;
  return v_rows=1;
end;
$$;
revoke all on function sparkd_arcade.finalize_run(uuid,uuid,integer,integer,integer,boolean)
  from public, anon, authenticated;
grant execute on function sparkd_arcade.finalize_run(uuid,uuid,integer,integer,integer,boolean)
  to service_role;
-- Replay verification must occur BEFORE this call in trusted backend.
-- This function prevents reuse but cannot prove p_score is genuine by itself.
