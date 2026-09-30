-- Applied to production on 2026-09-30. These RPCs are called by trusted
-- server code and must not be invokable through the public Data API.
revoke execute on function public.check_sparkd_man_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_sparkd_man_rate_limit(text, integer, integer)
  to service_role;

revoke execute on function public.check_meme_week_submission_eligibility(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.check_meme_week_submission_eligibility(uuid, text, text)
  to service_role;
