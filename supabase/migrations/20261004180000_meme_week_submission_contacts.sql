-- Private opt-in social contact for contest entrants.
-- This table deliberately has no anon/authenticated read or write access.
create table if not exists public.meme_week_submission_contacts (
  submission_id uuid primary key
    references public.meme_week_submissions(id) on delete cascade,
  x_handle text not null
    check (x_handle ~ '^[A-Za-z0-9_]{1,15}$'),
  updated_at timestamptz not null default now()
);

alter table public.meme_week_submission_contacts enable row level security;
revoke all on table public.meme_week_submission_contacts from anon, authenticated;
grant all on table public.meme_week_submission_contacts to service_role;

comment on table public.meme_week_submission_contacts is
  'Private opt-in X handles used only by contest admins to contact winners; never returned by public contest queries.';