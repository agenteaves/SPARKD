-- Isolated NFT checkout storage. No existing contest/site tables are modified.
do $$ begin
 if not exists(select 1 from vault.secrets where name='sparkd_nft_vault_seed_v1') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'sparkd_nft_vault_seed_v1','NFT Vault signing seed; server only, never disclose');
 end if;
end $$;
create table public.nft_vault_quotes(id uuid primary key,quote jsonb not null,created_at timestamptz not null default now());
alter table public.nft_vault_quotes enable row level security;
revoke all on public.nft_vault_quotes from anon,authenticated;
grant select,insert,update,delete on public.nft_vault_quotes to service_role;
create table public.nft_vault_rate_limits(bucket text primary key,count integer not null,created_at timestamptz not null default now());
alter table public.nft_vault_rate_limits enable row level security;
revoke all on public.nft_vault_rate_limits from anon,authenticated;
grant select,insert,update,delete on public.nft_vault_rate_limits to service_role;
create function public.nft_vault_signer_seed() returns text language sql security definer set search_path='' as $$
 select decrypted_secret from vault.decrypted_secrets where name='sparkd_nft_vault_seed_v1';
$$;
revoke all on function public.nft_vault_signer_seed() from public,anon,authenticated;
grant execute on function public.nft_vault_signer_seed() to service_role;
create function public.nft_vault_rate(p_key text,p_kind text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer; b text;
begin
 if p_kind not in ('read','write') or length(p_key)<>64 then return false; end if;
 delete from public.nft_vault_rate_limits where created_at<now()-interval '2 minutes';
 delete from public.nft_vault_quotes where created_at<now()-interval '1 day';
 b:=p_key||':'||p_kind||':'||floor(extract(epoch from now())/60)::text;
 insert into public.nft_vault_rate_limits(bucket,count) values(b,1) on conflict(bucket) do update set count=nft_vault_rate_limits.count+1 returning count into n;
 return n<=case when p_kind='read' then 60 else 30 end;
end $$;
revoke all on function public.nft_vault_rate(text,text) from public,anon,authenticated;
grant execute on function public.nft_vault_rate(text,text) to service_role;
