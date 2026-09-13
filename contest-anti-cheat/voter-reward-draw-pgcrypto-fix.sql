-- SPARKD Meme of the Week voter reward draw fix
-- Production issue: SECURITY DEFINER function had search_path public,pg_temp,
-- while pgcrypto is installed in the extensions schema. Unqualified digest()
-- therefore failed on every scheduled voter reward draw.

create or replace function public.draw_meme_week_voter_reward(p_contest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_status text;
  v_existing public.meme_week_voter_rewards%rowtype;
  v_seed uuid := gen_random_uuid();
  v_vote_id uuid;
  v_wallet text;
  v_submission_id uuid;
begin
  select c.status into v_status
  from public.meme_week_contests c
  where c.id = p_contest_id;

  if v_status is null then raise exception 'Contest not found.'; end if;
  if v_status <> 'completed' then raise exception 'Voter reward can only be drawn after the contest is completed.'; end if;

  select * into v_existing
  from public.meme_week_voter_rewards r
  where r.contest_id = p_contest_id;

  if found then
    return jsonb_build_object(
      'contestId', v_existing.contest_id,
      'walletAddress', v_existing.wallet_address,
      'submissionId', v_existing.submission_id,
      'rewardUsd', v_existing.reward_usd,
      'selectedAt', v_existing.selected_at,
      'payoutStatus', v_existing.payout_status,
      'alreadySelected', true
    );
  end if;

  select v.id,
         coalesce(v.reward_wallet_address, case when v.voting_method = 'wallet' then v.wallet_address else null end),
         v.submission_id
    into v_vote_id, v_wallet, v_submission_id
  from public.meme_week_votes v
  join public.meme_week_submissions s
    on s.id = v.submission_id and s.contest_id = v.contest_id
  where v.contest_id = p_contest_id
    and coalesce(v.reward_wallet_address, case when v.voting_method = 'wallet' then v.wallet_address else null end) is not null
    and lower(trim(coalesce(v.reward_wallet_address, v.wallet_address))) <> lower(trim(s.wallet_address))
  order by encode(
    extensions.digest(
      convert_to(
        coalesce(v.reward_wallet_address, v.wallet_address) || ':' || v.id::text || ':' || v_seed::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) asc
  limit 1;

  if v_wallet is null then
    return jsonb_build_object('contestId', p_contest_id, 'selected', false, 'reason', 'no_eligible_votes');
  end if;

  insert into public.meme_week_voter_rewards (
    contest_id, vote_id, wallet_address, submission_id, reward_usd, random_seed, payout_status
  ) values (
    p_contest_id, v_vote_id, v_wallet, v_submission_id, 5.00, v_seed, 'pending'
  )
  on conflict (contest_id) do nothing;

  select * into v_existing
  from public.meme_week_voter_rewards r
  where r.contest_id = p_contest_id;

  return jsonb_build_object(
    'contestId', v_existing.contest_id,
    'walletAddress', v_existing.wallet_address,
    'submissionId', v_existing.submission_id,
    'rewardUsd', v_existing.reward_usd,
    'selectedAt', v_existing.selected_at,
    'payoutStatus', v_existing.payout_status,
    'alreadySelected', false
  );
end;
$function$;

revoke all on function public.draw_meme_week_voter_reward(uuid) from public, anon, authenticated;
grant execute on function public.draw_meme_week_voter_reward(uuid) to service_role;
