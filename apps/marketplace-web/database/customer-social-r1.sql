-- Separate activation. No Auth provider setting, credential or existing account is overwritten.
begin;
do $$ begin
 if to_regclass('public.angelcare_marketplace_customer_accounts') is null then raise exception 'Native customer accounts table is required'; end if;
 if to_regclass('public.angelcare_marketplace_customer_social_profiles') is not null and obj_description(to_regclass('public.angelcare_marketplace_customer_social_profiles'),'pg_class') is distinct from 'ANGELCARE_CUSTOMER_SOCIAL_R1' then raise exception 'Existing social profile table is not this package; preserved'; end if;
end $$;
create table if not exists public.angelcare_marketplace_customer_social_profiles (
 auth_user_id uuid primary key references auth.users(id) on delete cascade,
 customer_account_id uuid not null unique references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 provider text not null check(provider in ('google','facebook','apple')),
 consent_version text not null,
 consent_accepted_at timestamptz not null default now(),
 completed_at timestamptz not null default now(),
 marketing_accepted boolean not null default false check(marketing_accepted=false)
);
comment on table public.angelcare_marketplace_customer_social_profiles is 'ANGELCARE_CUSTOMER_SOCIAL_R1';
alter table public.angelcare_marketplace_customer_social_profiles enable row level security;
revoke all on public.angelcare_marketplace_customer_social_profiles from public,anon,authenticated;
grant select,insert,update,delete on public.angelcare_marketplace_customer_social_profiles to service_role;
-- Fail and roll back if historical duplicate identities exist; never auto-delete or merge them.
create unique index if not exists angelcare_customer_social_auth_identity_r1 on public.angelcare_marketplace_customer_accounts(auth_user_id);

create or replace function public.angelcare_marketplace_complete_customer_social_profile(
 p_user_id uuid,p_provider text,p_full_name text,p_phone text,p_account_kind text,p_locale text,p_accepted boolean,p_consent_version text
) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare v_auth record;v_account public.angelcare_marketplace_customer_accounts%rowtype;
begin
 if p_provider not in ('google','facebook','apple') or p_provider is null then raise exception 'Provider not allowed';end if;
 if p_accepted is distinct from true or p_consent_version is distinct from 'customer-social-r1-20261012' then raise exception 'Explicit customer consent required';end if;
 if p_account_kind not in ('family','organization') or p_account_kind is null or p_locale not in ('fr','en','ar') or p_locale is null then raise exception 'Invalid customer classification';end if;
 if p_full_name is null or length(btrim(p_full_name))<2 or length(p_full_name)>180 or p_full_name~'[[:cntrl:]]' then raise exception 'Full name required';end if;
 if p_phone is null or p_phone!~'^\+?[0-9]{8,18}$' then raise exception 'Contact phone required';end if;
 select id,email,email_confirmed_at into v_auth from auth.users where id=p_user_id;
 if not found or v_auth.email is null or v_auth.email_confirmed_at is null then raise exception 'Verified Auth identity required';end if;
 if not exists(select 1 from auth.identities where user_id=p_user_id and provider=p_provider) then raise exception 'Social identity required';end if;
 perform pg_advisory_xact_lock(hashtextextended('angelcare-customer-social:'||p_user_id::text,0));
 select * into v_account from public.angelcare_marketplace_customer_accounts where auth_user_id=p_user_id for update;
 if found then
  if v_account.status not in ('active','pending_verification') then raise exception 'Customer account is unavailable';end if;
  -- Existing native customer records are never reset or reclassified by social completion.
  return jsonb_build_object('customer_account_id',v_account.id,'already_registered',true);
 end if;
 insert into public.angelcare_marketplace_customer_accounts(auth_user_id,account_kind,status,display_name,email,phone,preferred_locale,email_verified_at,premium_status,updated_at)
 values(p_user_id,p_account_kind,'active',btrim(p_full_name),v_auth.email,p_phone,p_locale,v_auth.email_confirmed_at,false,now()) returning * into v_account;
 insert into public.angelcare_marketplace_customer_social_profiles(auth_user_id,customer_account_id,provider,consent_version,consent_accepted_at,completed_at,marketing_accepted)
 values(p_user_id,v_account.id,p_provider,p_consent_version,now(),now(),false);
 return jsonb_build_object('customer_account_id',v_account.id,'already_registered',false);
end $$;
revoke all on function public.angelcare_marketplace_complete_customer_social_profile(uuid,text,text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_complete_customer_social_profile(uuid,text,text,text,text,text,boolean,text) to service_role;
create or replace function public.angelcare_marketplace_customer_social_ready() returns text language sql stable security invoker set search_path=pg_catalog as $$
 select case when obj_description(to_regclass('public.angelcare_marketplace_customer_social_profiles'),'pg_class')='ANGELCARE_CUSTOMER_SOCIAL_R1' then 'customer-social-r1-20261012' else null end
$$;
revoke all on function public.angelcare_marketplace_customer_social_ready() from public,anon,authenticated;
grant execute on function public.angelcare_marketplace_customer_social_ready() to service_role;
notify pgrst,'reload schema';
commit;
