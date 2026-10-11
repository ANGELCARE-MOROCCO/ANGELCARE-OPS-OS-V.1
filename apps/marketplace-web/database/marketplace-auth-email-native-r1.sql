-- SOURCE FILE ONLY. Installer never executes SQL or activates the Auth hook.
-- Auth -> protected delivery ledger -> existing Email OS Supports send authority.
begin;
create schema if not exists angelcare_private;
revoke all on schema angelcare_private from public, anon, authenticated;
grant usage on schema angelcare_private to supabase_auth_admin;
-- Refuse to adopt an unrelated table with the same name.
do $$ begin
 if to_regclass('angelcare_private.marketplace_auth_email_jobs') is not null
 and obj_description(to_regclass('angelcare_private.marketplace_auth_email_jobs'),'pg_class') is distinct from 'ANGELCARE_AUTH_EMAIL_NATIVE_R1' then
  raise exception 'Unrecognised Auth email ledger preserved';
 end if;
end $$;
create table if not exists angelcare_private.marketplace_auth_email_jobs (
 id uuid primary key default gen_random_uuid(),
 dedup_key text not null unique,
 action text not null,
 recipient_slot text not null check (recipient_slot in ('primary','current','new')),
 payload jsonb,
 state text not null default 'queued' check (state in ('queued','processing','retry_wait','provider_accepted','failed','delivery_unknown','expired')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '15 minutes',
 lease_token uuid,
 lease_until timestamptz,
 provider_message_id text,
 last_error_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
comment on table angelcare_private.marketplace_auth_email_jobs is 'ANGELCARE_AUTH_EMAIL_NATIVE_R1';
create index if not exists marketplace_auth_email_due_idx on angelcare_private.marketplace_auth_email_jobs (next_attempt_at,created_at) where state in ('queued','retry_wait');
alter table angelcare_private.marketplace_auth_email_jobs enable row level security;
revoke all on angelcare_private.marketplace_auth_email_jobs from public, anon, authenticated, service_role;
grant insert on angelcare_private.marketplace_auth_email_jobs to supabase_auth_admin;
-- Conflict inference can read the unique key; expose only its irreversible hash.
grant select(dedup_key) on angelcare_private.marketplace_auth_email_jobs to supabase_auth_admin;
drop policy if exists auth_email_hook_insert on angelcare_private.marketplace_auth_email_jobs;
create policy auth_email_hook_insert on angelcare_private.marketplace_auth_email_jobs for insert to supabase_auth_admin with check (true);
drop policy if exists auth_email_hook_dedup on angelcare_private.marketplace_auth_email_jobs;
create policy auth_email_hook_dedup on angelcare_private.marketplace_auth_email_jobs for select to supabase_auth_admin using (true);

-- This trusted Auth-only function never makes a network call and never activates accounts.
create or replace function public.angelcare_marketplace_auth_email_hook(event jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog
as $$
declare
 u jsonb:=event->'user'; e jsonb:=event->'email_data'; a text:=e->>'email_action_type';
 payload_value jsonb; slots text[]; slot_value text; recipient_value text; key_value text;
 locale_value text; identity_value text;
begin
 if coalesce(jsonb_typeof(u),'')<>'object' or coalesce(jsonb_typeof(e),'')<>'object'
 or coalesce(u->>'id','') !~ '^[0-9a-fA-F-]{36}$'
 or coalesce(u->>'email','') !~ '^[^[:space:]<>]+@[^[:space:]<>]+\.[^[:space:]<>]+$'
 or length(coalesce(a,'')) not between 1 and 80 then
  raise exception 'AUTH_EMAIL_PAYLOAD_INVALID';
 end if;
 if a not in ('signup','recovery','magiclink','invite','email_change','reauthentication') and a !~ '^[a-z_]+_notification$' then
  raise exception 'AUTH_EMAIL_ACTION_UNSUPPORTED';
 end if;
 locale_value:=case when u->'user_metadata'->>'locale' in ('en','ar') then u->'user_metadata'->>'locale' else 'fr' end;
 if a='email_change' then
  if coalesce(u->>'new_email','') !~ '^[^[:space:]<>]+@[^[:space:]<>]+\.[^[:space:]<>]+$' then raise exception 'AUTH_EMAIL_NEW_RECIPIENT_INVALID'; end if;
  if coalesce(e->>'token_hash','')<>'' and coalesce(e->>'token_hash_new','')<>'' then slots:=array['current','new'];
  else slots:=array['new'];end if;
 else slots:=array['primary'];end if;
 -- Only fields necessary to compose Auth email are retained. No account/profile/password data.
 payload_value:=jsonb_build_object('user',jsonb_build_object('id',u->>'id','email',u->>'email','new_email',u->>'new_email','user_metadata',jsonb_build_object('locale',locale_value,'marketplace_account_kind',u->'user_metadata'->>'marketplace_account_kind')),
 'email_data',jsonb_build_object('email_action_type',a,'token',e->>'token','token_hash',e->>'token_hash','token_new',e->>'token_new','token_hash_new',e->>'token_hash_new','redirect_to',e->>'redirect_to','site_url',e->>'site_url',
 'old_email',e->>'old_email','old_phone',e->>'old_phone','provider',e->>'provider','factor_type',e->>'factor_type'));
 -- Auth retry of the same token is idempotent. Notification events use the user revision.
 identity_value:=coalesce(nullif(e->>'token_hash',''),nullif(e->>'token',''),nullif(u->>'updated_at',''),gen_random_uuid()::text);
 foreach slot_value in array slots loop
  recipient_value:=case when slot_value='new' then u->>'new_email' else u->>'email' end;
  key_value:=encode(sha256(convert_to(jsonb_build_array(u->>'id',a,lower(recipient_value),slot_value,identity_value,e->>'token_hash_new',e->>'old_email',e->>'old_phone',e->>'provider',e->>'factor_type')::text,'UTF8')),'hex');
  insert into angelcare_private.marketplace_auth_email_jobs(dedup_key,action,recipient_slot,payload)
  values(key_value,a,slot_value,payload_value) on conflict(dedup_key) do nothing;
 end loop;
 return '{}'::jsonb;
end $$;
revoke all on function public.angelcare_marketplace_auth_email_hook(jsonb) from public,anon,authenticated,service_role;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.angelcare_marketplace_auth_email_hook(jsonb) to supabase_auth_admin;
comment on function public.angelcare_marketplace_auth_email_hook(jsonb) is 'ANGELCARE_AUTH_EMAIL_NATIVE_R1';

-- One cross-process delivery lane. SKIP LOCKED plus the advisory lock avoids competing claims.
create or replace function public.angelcare_marketplace_auth_email_claim()
returns jsonb language plpgsql security definer set search_path=pg_catalog
as $$
declare j angelcare_private.marketplace_auth_email_jobs%rowtype;
begin
 if not pg_try_advisory_xact_lock(174291,60811) then return null; end if;
 update angelcare_private.marketplace_auth_email_jobs set state='delivery_unknown',payload=null,last_error_code='LEASE_ACKNOWLEDGEMENT_UNKNOWN',updated_at=now()
 where state='processing' and lease_until<now();
 update angelcare_private.marketplace_auth_email_jobs set state=case when state='delivery_unknown' then state else 'expired' end,payload=null,updated_at=now()
 where expires_at<now() and state in ('queued','retry_wait','failed','delivery_unknown');
 if exists(select 1 from angelcare_private.marketplace_auth_email_jobs where state='processing' and lease_until>=now())
 or exists(select 1 from angelcare_private.marketplace_auth_email_jobs where state='provider_accepted' and updated_at>now()-interval '2 seconds') then return null;end if;
 select * into j from angelcare_private.marketplace_auth_email_jobs where state in ('queued','retry_wait') and next_attempt_at<=now() and expires_at>now()
 order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 update angelcare_private.marketplace_auth_email_jobs set state='processing',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '10 minutes',updated_at=now()
 where id=j.id returning * into j;
 return jsonb_build_object('id',j.id,'lease_token',j.lease_token,'action',j.action,'recipient_slot',j.recipient_slot,'payload',j.payload,'attempts',j.attempts);
end $$;
revoke all on function public.angelcare_marketplace_auth_email_claim() from public,anon,authenticated,supabase_auth_admin;
grant execute on function public.angelcare_marketplace_auth_email_claim() to service_role;

create or replace function public.angelcare_marketplace_auth_email_finish(p_id uuid,p_lease uuid,p_state text,p_code text default null,p_message_id text default null)
returns boolean language plpgsql security definer set search_path=pg_catalog
as $$
declare j angelcare_private.marketplace_auth_email_jobs%rowtype; delay_value integer;
begin
 if p_state not in ('retry_wait','failed','delivery_unknown','provider_accepted') then raise exception 'AUTH_EMAIL_RESULT_STATE_INVALID';end if;
 if p_code is not null and p_code !~ '^[A-Z0-9_]{1,80}$' then raise exception 'AUTH_EMAIL_RESULT_CODE_INVALID';end if;
 select * into j from angelcare_private.marketplace_auth_email_jobs where id=p_id and lease_token=p_lease and state in ('processing','delivery_unknown') for update;
 if not found then return false;end if;
 if p_state='retry_wait' and (j.attempts>=6 or j.expires_at<=now()) then p_state:='failed';end if;
 delay_value:=case when p_code='SMTP_AUTH_535' then 300 else least(300,30*power(2,greatest(0,j.attempts-1))::integer) end;
 update angelcare_private.marketplace_auth_email_jobs set state=p_state,
 next_attempt_at=case when p_state='retry_wait' then now()+make_interval(secs=>delay_value) else next_attempt_at end,
 payload=case when p_state in ('provider_accepted','delivery_unknown') then null else payload end,
 provider_message_id=case when p_state='provider_accepted' then left(regexp_replace(coalesce(p_message_id,''),'[\r\n]','','g'),255) else provider_message_id end,
 last_error_code=p_code,lease_until=null,updated_at=now() where id=p_id;
 return true;
end $$;
revoke all on function public.angelcare_marketplace_auth_email_finish(uuid,uuid,text,text,text) from public,anon,authenticated,supabase_auth_admin;
grant execute on function public.angelcare_marketplace_auth_email_finish(uuid,uuid,text,text,text) to service_role;

-- Diagnostics omit addresses, message bodies, links, passwords and all OTP data.
create or replace function public.angelcare_marketplace_auth_email_status()
returns jsonb language sql security definer set search_path=pg_catalog
as $$
 select jsonb_build_object('counts',coalesce((select jsonb_object_agg(state,n) from(select state,count(*) n from angelcare_private.marketplace_auth_email_jobs group by state)s),'{}'::jsonb),
 'recent',coalesce((select jsonb_agg(row_to_json(s)) from(select id,action,recipient_slot,state,attempts,last_error_code,created_at,updated_at from angelcare_private.marketplace_auth_email_jobs order by created_at desc limit 20)s),'[]'::jsonb));
$$;
revoke all on function public.angelcare_marketplace_auth_email_status() from public,anon,authenticated,supabase_auth_admin;
grant execute on function public.angelcare_marketplace_auth_email_status() to service_role;
notify pgrst, 'reload schema';
commit;
