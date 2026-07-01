-- AngelCare 360 Phase 2P - White Label, Branding, Custom Domains, Integrations & API Runtime
-- Ref: AC360-PH2P-BRANDING-DOMAINS-INTEGRATIONS-API-2026-06-30
-- Scope: backend/system-only white-label, branding, custom-domain, integration and API governance runtime.
-- Strict rule: no branding/integration/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2O school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Branding, custom domains, integrations, API and webhook tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_brand_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid,
  profile_key text not null default 'default',
  label text not null default 'Default Brand Profile',
  brand_name text,
  logo_document_id uuid,
  favicon_document_id uuid,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_family text,
  portal_title text,
  email_from_name text,
  footer_text text,
  language_default text not null default 'fr',
  status text not null default 'draft',
  settings_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, profile_key),
  check (language_default in ('fr','ar','en','mixed')),
  check (status in ('draft','review','approved','published','paused','archived'))
);

create table if not exists public.ac360_school_brand_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  brand_profile_id uuid references public.ac360_school_brand_profiles(id) on delete cascade,
  asset_key text not null,
  asset_type text not null default 'logo',
  document_id uuid,
  public_url text,
  file_name text,
  mime_type text,
  size_bytes bigint not null default 0,
  checksum text,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, asset_key),
  check (asset_type in ('logo','favicon','pdf_header','email_header','portal_banner','login_background','signature','other')),
  check (status in ('active','review','archived','rejected'))
);

create table if not exists public.ac360_school_custom_domains (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  brand_profile_id uuid references public.ac360_school_brand_profiles(id) on delete set null,
  domain_name text not null,
  domain_type text not null default 'parent_portal',
  status text not null default 'requested',
  verification_method text not null default 'dns_txt',
  verification_token text not null default encode(gen_random_bytes(18), 'hex'),
  dns_target text,
  ssl_status text not null default 'pending',
  last_checked_at timestamptz,
  verified_at timestamptz,
  activated_at timestamptz,
  archived_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(domain_name),
  check (domain_type in ('parent_portal','admission_forms','public_site','staff_portal','api','custom')),
  check (status in ('requested','pending_dns','verified','active','failed','paused','archived')),
  check (ssl_status in ('pending','issued','failed','expired','not_required'))
);

create table if not exists public.ac360_school_domain_verification_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  domain_id uuid not null references public.ac360_school_custom_domains(id) on delete cascade,
  event_type text not null default 'check',
  previous_status text,
  next_status text,
  dns_result_json jsonb not null default '{}'::jsonb,
  ssl_result_json jsonb not null default '{}'::jsonb,
  message text,
  actor_app_user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_school_integration_connectors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  connector_key text not null,
  label text not null,
  connector_type text not null default 'generic_api',
  direction text not null default 'outbound',
  status text not null default 'draft',
  base_url text,
  auth_type text not null default 'none',
  scopes text[] not null default '{}',
  settings_json jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, connector_key),
  check (connector_type in ('email','sms','whatsapp','payment_gateway','accounting','website','calendar','storage','bi','generic_api','webhook','custom')),
  check (direction in ('inbound','outbound','bidirectional')),
  check (auth_type in ('none','api_key','oauth2','basic','bearer','service_account','custom')),
  check (status in ('draft','active','paused','error','archived'))
);

create table if not exists public.ac360_school_integration_credentials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  connector_id uuid not null references public.ac360_school_integration_connectors(id) on delete cascade,
  credential_key text not null,
  secret_reference text,
  token_preview text,
  expires_at timestamptz,
  status text not null default 'active',
  rotated_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connector_id, credential_key),
  check (status in ('active','expired','revoked','archived'))
);

create table if not exists public.ac360_school_api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  api_key_prefix text not null,
  api_key_hash text not null,
  label text not null,
  scopes text[] not null default '{}',
  status text not null default 'active',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(api_key_prefix),
  check (status in ('active','expired','revoked','archived'))
);

create table if not exists public.ac360_school_webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  connector_id uuid references public.ac360_school_integration_connectors(id) on delete set null,
  webhook_key text not null,
  label text not null,
  endpoint_url text not null,
  event_types text[] not null default '{}',
  secret_reference text,
  status text not null default 'active',
  retry_policy_json jsonb not null default '{"max_attempts":3}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, webhook_key),
  check (status in ('active','paused','error','archived'))
);

create table if not exists public.ac360_school_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  webhook_id uuid references public.ac360_school_webhooks(id) on delete set null,
  delivery_key text not null,
  event_type text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  request_json jsonb not null default '{}'::jsonb,
  response_json jsonb not null default '{}'::jsonb,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  last_error text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, delivery_key),
  check (status in ('queued','sending','delivered','failed','cancelled'))
);

create table if not exists public.ac360_school_integration_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  connector_id uuid references public.ac360_school_integration_connectors(id) on delete set null,
  event_key text not null,
  event_type text not null,
  severity text not null default 'info',
  status text not null default 'recorded',
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  actor_app_user_id uuid,
  created_at timestamptz not null default now(),
  unique(org_id, event_key),
  check (severity in ('info','warning','critical')),
  check (status in ('recorded','processed','failed','ignored'))
);

create table if not exists public.ac360_school_branding_integration_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  published_brand_profiles integer not null default 0,
  active_domains integer not null default 0,
  pending_domains integer not null default 0,
  active_connectors integer not null default 0,
  connector_errors integer not null default 0,
  active_api_keys integer not null default 0,
  active_webhooks integer not null default 0,
  failed_deliveries integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

create table if not exists public.ac360_school_integration_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  connector_id uuid references public.ac360_school_integration_connectors(id) on delete set null,
  domain_id uuid references public.ac360_school_custom_domains(id) on delete set null,
  alert_key text not null,
  alert_type text not null,
  severity text not null default 'warning',
  title text not null,
  message text,
  status text not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('info','warning','critical')),
  check (status in ('open','in_review','resolved','archived'))
);

create index if not exists idx_ac360_brand_profiles_org_status on public.ac360_school_brand_profiles(org_id,status);
create index if not exists idx_ac360_custom_domains_org_status on public.ac360_school_custom_domains(org_id,status);
create index if not exists idx_ac360_connectors_org_status on public.ac360_school_integration_connectors(org_id,status);
create index if not exists idx_ac360_api_keys_org_status on public.ac360_school_api_keys(org_id,status);
create index if not exists idx_ac360_webhooks_org_status on public.ac360_school_webhooks(org_id,status);
create index if not exists idx_ac360_integration_alerts_org_status on public.ac360_school_integration_alerts(org_id,status);

-- -----------------------------------------------------------------------------
-- 2. RPC runtime
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_branding_integrations_dashboard(p_org_id uuid,p_as_of_date date default current_date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_snapshot public.ac360_school_branding_integration_snapshots%rowtype; v_alerts jsonb;
begin
  insert into public.ac360_school_branding_integration_snapshots(
    org_id,snapshot_date,published_brand_profiles,active_domains,pending_domains,active_connectors,connector_errors,active_api_keys,active_webhooks,failed_deliveries,metadata_json
  ) values(
    p_org_id,coalesce(p_as_of_date,current_date),
    (select count(*) from public.ac360_school_brand_profiles where org_id=p_org_id and status='published'),
    (select count(*) from public.ac360_school_custom_domains where org_id=p_org_id and status='active'),
    (select count(*) from public.ac360_school_custom_domains where org_id=p_org_id and status in ('requested','pending_dns','failed')),
    (select count(*) from public.ac360_school_integration_connectors where org_id=p_org_id and status='active'),
    (select count(*) from public.ac360_school_integration_connectors where org_id=p_org_id and status='error'),
    (select count(*) from public.ac360_school_api_keys where org_id=p_org_id and status='active'),
    (select count(*) from public.ac360_school_webhooks where org_id=p_org_id and status='active'),
    (select count(*) from public.ac360_school_webhook_deliveries where org_id=p_org_id and status='failed' and created_at::date=coalesce(p_as_of_date,current_date)),
    '{"phase":"phase_2p"}'::jsonb
  ) on conflict(org_id,snapshot_date) do update set
    published_brand_profiles=excluded.published_brand_profiles,
    active_domains=excluded.active_domains,
    pending_domains=excluded.pending_domains,
    active_connectors=excluded.active_connectors,
    connector_errors=excluded.connector_errors,
    active_api_keys=excluded.active_api_keys,
    active_webhooks=excluded.active_webhooks,
    failed_deliveries=excluded.failed_deliveries,
    metadata_json=public.ac360_school_branding_integration_snapshots.metadata_json || excluded.metadata_json
  returning * into v_snapshot;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into v_alerts
  from public.ac360_school_integration_alerts a
  where a.org_id=p_org_id and a.status in ('open','in_review')
  limit 50;

  return jsonb_build_object('ok',true,'snapshot',to_jsonb(v_snapshot),'alerts',coalesce(v_alerts,'[]'::jsonb));
end $$;

create or replace function public.ac360_school_upsert_brand_profile(
  p_org_id uuid,p_brand_profile_id uuid default null,p_profile_key text default null,p_label text default null,p_brand_name text default null,
  p_primary_color text default null,p_secondary_color text default null,p_accent_color text default null,p_font_family text default null,
  p_portal_title text default null,p_email_from_name text default null,p_footer_text text default null,p_language_default text default 'fr',
  p_settings_json jsonb default '{}'::jsonb,p_status text default 'draft',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_profile public.ac360_school_brand_profiles%rowtype;
begin
  if p_brand_profile_id is not null then
    update public.ac360_school_brand_profiles set
      profile_key=coalesce(nullif(p_profile_key,''),profile_key),
      label=coalesce(nullif(p_label,''),label),
      brand_name=coalesce(p_brand_name,brand_name),
      primary_color=coalesce(p_primary_color,primary_color),
      secondary_color=coalesce(p_secondary_color,secondary_color),
      accent_color=coalesce(p_accent_color,accent_color),
      font_family=coalesce(p_font_family,font_family),
      portal_title=coalesce(p_portal_title,portal_title),
      email_from_name=coalesce(p_email_from_name,email_from_name),
      footer_text=coalesce(p_footer_text,footer_text),
      language_default=coalesce(nullif(p_language_default,''),language_default),
      settings_json=settings_json||coalesce(p_settings_json,'{}'::jsonb),
      status=coalesce(nullif(p_status,''),status),
      metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),
      updated_at=now()
    where id=p_brand_profile_id and org_id=p_org_id returning * into v_profile;
  end if;
  if v_profile.id is null then
    insert into public.ac360_school_brand_profiles(org_id,profile_key,label,brand_name,primary_color,secondary_color,accent_color,font_family,portal_title,email_from_name,footer_text,language_default,settings_json,status,created_by,metadata_json)
    values(p_org_id,coalesce(nullif(p_profile_key,''),'default'),coalesce(nullif(p_label,''),'Default Brand Profile'),p_brand_name,p_primary_color,p_secondary_color,p_accent_color,p_font_family,p_portal_title,p_email_from_name,p_footer_text,coalesce(nullif(p_language_default,''),'fr'),coalesce(p_settings_json,'{}'::jsonb),coalesce(nullif(p_status,''),'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
    on conflict(org_id,profile_key) do update set label=excluded.label,brand_name=excluded.brand_name,primary_color=excluded.primary_color,secondary_color=excluded.secondary_color,accent_color=excluded.accent_color,font_family=excluded.font_family,portal_title=excluded.portal_title,email_from_name=excluded.email_from_name,footer_text=excluded.footer_text,language_default=excluded.language_default,settings_json=public.ac360_school_brand_profiles.settings_json||excluded.settings_json,status=excluded.status,metadata_json=public.ac360_school_brand_profiles.metadata_json||excluded.metadata_json,updated_at=now()
    returning * into v_profile;
  end if;
  return jsonb_build_object('ok',true,'brand_profile',to_jsonb(v_profile));
end $$;

create or replace function public.ac360_school_register_brand_asset(
  p_org_id uuid,p_brand_profile_id uuid default null,p_asset_key text default null,p_asset_type text default 'logo',p_document_id uuid default null,
  p_public_url text default null,p_file_name text default null,p_mime_type text default null,p_size_bytes bigint default 0,p_checksum text default null,
  p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_asset public.ac360_school_brand_assets%rowtype;
begin
  insert into public.ac360_school_brand_assets(org_id,brand_profile_id,asset_key,asset_type,document_id,public_url,file_name,mime_type,size_bytes,checksum,created_by,metadata_json)
  values(p_org_id,p_brand_profile_id,coalesce(nullif(p_asset_key,''),'asset-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_asset_type,''),'logo'),p_document_id,p_public_url,p_file_name,p_mime_type,coalesce(p_size_bytes,0),p_checksum,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,asset_key) do update set brand_profile_id=excluded.brand_profile_id,asset_type=excluded.asset_type,document_id=excluded.document_id,public_url=excluded.public_url,file_name=excluded.file_name,mime_type=excluded.mime_type,size_bytes=excluded.size_bytes,checksum=excluded.checksum,status='active',metadata_json=public.ac360_school_brand_assets.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_asset;
  return jsonb_build_object('ok',true,'asset',to_jsonb(v_asset));
end $$;

create or replace function public.ac360_school_request_custom_domain(
  p_org_id uuid,p_brand_profile_id uuid default null,p_domain_name text default null,p_domain_type text default 'parent_portal',p_dns_target text default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_domain public.ac360_school_custom_domains%rowtype;
begin
  insert into public.ac360_school_custom_domains(org_id,brand_profile_id,domain_name,domain_type,status,dns_target,created_by,metadata_json)
  values(p_org_id,p_brand_profile_id,lower(trim(p_domain_name)),coalesce(nullif(p_domain_type,''),'parent_portal'),'pending_dns',p_dns_target,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(domain_name) do update set brand_profile_id=excluded.brand_profile_id,domain_type=excluded.domain_type,status='pending_dns',dns_target=excluded.dns_target,metadata_json=public.ac360_school_custom_domains.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_domain;
  insert into public.ac360_school_domain_verification_events(org_id,domain_id,event_type,next_status,message,actor_app_user_id,payload_json)
  values(p_org_id,v_domain.id,'requested',v_domain.status,'Custom domain verification requested.',p_actor_app_user_id,jsonb_build_object('domain_name',v_domain.domain_name));
  return jsonb_build_object('ok',true,'domain',to_jsonb(v_domain));
end $$;

create or replace function public.ac360_school_verify_custom_domain(
  p_org_id uuid,p_domain_id uuid,p_verified boolean default false,p_ssl_status text default 'pending',p_actor_app_user_id uuid default null,p_dns_result jsonb default '{}'::jsonb,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_domain public.ac360_school_custom_domains%rowtype; v_prev text;
begin
  select status into v_prev from public.ac360_school_custom_domains where id=p_domain_id and org_id=p_org_id;
  update public.ac360_school_custom_domains set status=case when p_verified then 'active' else 'failed' end, ssl_status=coalesce(nullif(p_ssl_status,''),ssl_status), verified_at=case when p_verified then now() else verified_at end, activated_at=case when p_verified then now() else activated_at end, last_checked_at=now(), metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where id=p_domain_id and org_id=p_org_id returning * into v_domain;
  insert into public.ac360_school_domain_verification_events(org_id,domain_id,event_type,previous_status,next_status,dns_result_json,ssl_result_json,message,actor_app_user_id)
  values(p_org_id,p_domain_id,'verification_check',v_prev,v_domain.status,coalesce(p_dns_result,'{}'::jsonb),jsonb_build_object('ssl_status',v_domain.ssl_status),case when p_verified then 'Domain verified and activated.' else 'Domain verification failed.' end,p_actor_app_user_id);
  if not p_verified then
    insert into public.ac360_school_integration_alerts(org_id,domain_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_domain_id,'domain-verification-failed-'||p_domain_id,'domain_verification_failed','warning','Custom domain verification failed','DNS or SSL verification failed for custom domain.',jsonb_build_object('domain_id',p_domain_id))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  return jsonb_build_object('ok',v_domain.id is not null,'domain',to_jsonb(v_domain));
end $$;

create or replace function public.ac360_school_upsert_integration_connector(
  p_org_id uuid,p_connector_id uuid default null,p_connector_key text default null,p_label text default null,p_connector_type text default 'generic_api',p_direction text default 'outbound',p_base_url text default null,p_auth_type text default 'none',p_scopes text[] default '{}',p_settings_json jsonb default '{}'::jsonb,p_status text default 'draft',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_connector public.ac360_school_integration_connectors%rowtype;
begin
  if p_connector_id is not null then
    update public.ac360_school_integration_connectors set connector_key=coalesce(nullif(p_connector_key,''),connector_key),label=coalesce(nullif(p_label,''),label),connector_type=coalesce(nullif(p_connector_type,''),connector_type),direction=coalesce(nullif(p_direction,''),direction),base_url=coalesce(p_base_url,base_url),auth_type=coalesce(nullif(p_auth_type,''),auth_type),scopes=coalesce(p_scopes,scopes),settings_json=settings_json||coalesce(p_settings_json,'{}'::jsonb),status=coalesce(nullif(p_status,''),status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_connector_id and org_id=p_org_id returning * into v_connector;
  end if;
  if v_connector.id is null then
    insert into public.ac360_school_integration_connectors(org_id,connector_key,label,connector_type,direction,base_url,auth_type,scopes,settings_json,status,created_by,metadata_json)
    values(p_org_id,coalesce(nullif(p_connector_key,''),'connector-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'Integration Connector'),coalesce(nullif(p_connector_type,''),'generic_api'),coalesce(nullif(p_direction,''),'outbound'),p_base_url,coalesce(nullif(p_auth_type,''),'none'),coalesce(p_scopes,'{}'),coalesce(p_settings_json,'{}'::jsonb),coalesce(nullif(p_status,''),'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
    on conflict(org_id,connector_key) do update set label=excluded.label,connector_type=excluded.connector_type,direction=excluded.direction,base_url=excluded.base_url,auth_type=excluded.auth_type,scopes=excluded.scopes,settings_json=public.ac360_school_integration_connectors.settings_json||excluded.settings_json,status=excluded.status,metadata_json=public.ac360_school_integration_connectors.metadata_json||excluded.metadata_json,updated_at=now()
    returning * into v_connector;
  end if;
  return jsonb_build_object('ok',true,'connector',to_jsonb(v_connector));
end $$;

create or replace function public.ac360_school_issue_api_key(p_org_id uuid,p_label text default null,p_scopes text[] default '{}',p_expires_at timestamptz default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_raw text := encode(gen_random_bytes(24),'hex'); v_prefix text := 'ac360_'||substr(encode(gen_random_bytes(6),'hex'),1,12); v_key public.ac360_school_api_keys%rowtype;
begin
  insert into public.ac360_school_api_keys(org_id,api_key_prefix,api_key_hash,label,scopes,expires_at,created_by,metadata_json)
  values(p_org_id,v_prefix,crypt(v_raw,gen_salt('bf')),coalesce(nullif(p_label,''),'API Key'),coalesce(p_scopes,'{}'),p_expires_at,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_key;
  return jsonb_build_object('ok',true,'api_key',to_jsonb(v_key),'one_time_token',v_prefix || '_' || v_raw);
end $$;

create or replace function public.ac360_school_revoke_api_key(p_org_id uuid,p_api_key_id uuid,p_actor_app_user_id uuid default null,p_reason text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_key public.ac360_school_api_keys%rowtype;
begin
  update public.ac360_school_api_keys set status='revoked',revoked_at=now(),revoked_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('reason',p_reason)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_api_key_id and org_id=p_org_id returning * into v_key;
  return jsonb_build_object('ok',v_key.id is not null,'api_key',to_jsonb(v_key));
end $$;

create or replace function public.ac360_school_upsert_webhook(p_org_id uuid,p_webhook_id uuid default null,p_connector_id uuid default null,p_webhook_key text default null,p_label text default null,p_endpoint_url text default null,p_event_types text[] default '{}',p_status text default 'active',p_retry_policy_json jsonb default '{"max_attempts":3}'::jsonb,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_webhook public.ac360_school_webhooks%rowtype;
begin
  if p_webhook_id is not null then
    update public.ac360_school_webhooks set connector_id=p_connector_id,webhook_key=coalesce(nullif(p_webhook_key,''),webhook_key),label=coalesce(nullif(p_label,''),label),endpoint_url=coalesce(p_endpoint_url,endpoint_url),event_types=coalesce(p_event_types,event_types),status=coalesce(nullif(p_status,''),status),retry_policy_json=coalesce(p_retry_policy_json,retry_policy_json),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_webhook_id and org_id=p_org_id returning * into v_webhook;
  end if;
  if v_webhook.id is null then
    insert into public.ac360_school_webhooks(org_id,connector_id,webhook_key,label,endpoint_url,event_types,status,retry_policy_json,created_by,metadata_json)
    values(p_org_id,p_connector_id,coalesce(nullif(p_webhook_key,''),'webhook-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'Webhook'),coalesce(nullif(p_endpoint_url,''),'https://example.com/webhook'),coalesce(p_event_types,'{}'),coalesce(nullif(p_status,''),'active'),coalesce(p_retry_policy_json,'{"max_attempts":3}'::jsonb),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
    on conflict(org_id,webhook_key) do update set connector_id=excluded.connector_id,label=excluded.label,endpoint_url=excluded.endpoint_url,event_types=excluded.event_types,status=excluded.status,retry_policy_json=excluded.retry_policy_json,metadata_json=public.ac360_school_webhooks.metadata_json||excluded.metadata_json,updated_at=now()
    returning * into v_webhook;
  end if;
  return jsonb_build_object('ok',true,'webhook',to_jsonb(v_webhook));
end $$;

create or replace function public.ac360_school_record_webhook_delivery(p_org_id uuid,p_webhook_id uuid default null,p_delivery_key text default null,p_event_type text default null,p_status text default 'queued',p_attempt_count int default 0,p_request_json jsonb default '{}'::jsonb,p_response_json jsonb default '{}'::jsonb,p_last_error text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_delivery public.ac360_school_webhook_deliveries%rowtype;
begin
  insert into public.ac360_school_webhook_deliveries(org_id,webhook_id,delivery_key,event_type,status,attempt_count,request_json,response_json,last_error,delivered_at,metadata_json)
  values(p_org_id,p_webhook_id,coalesce(nullif(p_delivery_key,''),'delivery-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_event_type,''),'event'),coalesce(nullif(p_status,''),'queued'),coalesce(p_attempt_count,0),coalesce(p_request_json,'{}'::jsonb),coalesce(p_response_json,'{}'::jsonb),p_last_error,case when p_status='delivered' then now() else null end,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,delivery_key) do update set status=excluded.status,attempt_count=excluded.attempt_count,request_json=excluded.request_json,response_json=excluded.response_json,last_error=excluded.last_error,delivered_at=coalesce(excluded.delivered_at,public.ac360_school_webhook_deliveries.delivered_at),metadata_json=public.ac360_school_webhook_deliveries.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_delivery;
  if v_delivery.status='failed' then
    insert into public.ac360_school_integration_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'webhook-delivery-failed-'||v_delivery.id,'webhook_delivery_failed','warning','Webhook delivery failed','A webhook delivery failed and may require retry.',jsonb_build_object('delivery_id',v_delivery.id))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'delivery',to_jsonb(v_delivery));
end $$;

create or replace function public.ac360_school_record_integration_event(p_org_id uuid,p_connector_id uuid default null,p_event_key text default null,p_event_type text default null,p_severity text default 'info',p_status text default 'recorded',p_payload_json jsonb default '{}'::jsonb,p_result_json jsonb default '{}'::jsonb,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event public.ac360_school_integration_events%rowtype;
begin
  insert into public.ac360_school_integration_events(org_id,connector_id,event_key,event_type,severity,status,payload_json,result_json,actor_app_user_id)
  values(p_org_id,p_connector_id,coalesce(nullif(p_event_key,''),'integration-event-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_event_type,''),'generic'),coalesce(nullif(p_severity,''),'info'),coalesce(nullif(p_status,''),'recorded'),coalesce(p_payload_json,'{}'::jsonb)||coalesce(p_metadata,'{}'::jsonb),coalesce(p_result_json,'{}'::jsonb),p_actor_app_user_id)
  on conflict(org_id,event_key) do update set status=excluded.status,severity=excluded.severity,payload_json=public.ac360_school_integration_events.payload_json||excluded.payload_json,result_json=excluded.result_json,actor_app_user_id=excluded.actor_app_user_id returning * into v_event;
  if v_event.severity='critical' or v_event.status='failed' then
    insert into public.ac360_school_integration_alerts(org_id,connector_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_connector_id,'integration-event-critical-'||v_event.id,'integration_event_critical','critical','Critical integration event','An integration event requires immediate review.',jsonb_build_object('event_id',v_event.id))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'event',to_jsonb(v_event));
end $$;

create or replace function public.ac360_school_reconcile_branding_integrations(p_org_id uuid,p_as_of_date date default current_date,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_dash jsonb; v_pending int; v_errors int; v_failed int;
begin
  v_dash := public.ac360_school_branding_integrations_dashboard(p_org_id,p_as_of_date);
  v_pending := coalesce((v_dash #>> '{snapshot,pending_domains}')::int,0);
  v_errors := coalesce((v_dash #>> '{snapshot,connector_errors}')::int,0);
  v_failed := coalesce((v_dash #>> '{snapshot,failed_deliveries}')::int,0);
  if v_pending > 0 then
    insert into public.ac360_school_integration_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'pending-domain-verification-'||coalesce(p_as_of_date,current_date),'pending_domain_verification','warning','Pending custom domain verification',v_pending::text || ' custom domain(s) need DNS/SSL verification.',jsonb_build_object('count',v_pending))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  if v_errors > 0 or v_failed > 0 then
    insert into public.ac360_school_integration_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'integration-health-issues-'||coalesce(p_as_of_date,current_date),'integration_health_issues','critical','Integration health issues detected',(v_errors+v_failed)::text || ' integration issue(s) require review.',jsonb_build_object('connector_errors',v_errors,'failed_deliveries',v_failed))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'dashboard',v_dash,'pending_domains',v_pending,'connector_errors',v_errors,'failed_deliveries',v_failed);
end $$;

create or replace function public.ac360_school_resolve_integration_alert(p_org_id uuid,p_alert_id uuid,p_actor_app_user_id uuid default null,p_resolution_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_alert public.ac360_school_integration_alerts%rowtype;
begin
  update public.ac360_school_integration_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('resolution_note',p_resolution_note)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id returning * into v_alert;
  return jsonb_build_object('ok',v_alert.id is not null,'alert',to_jsonb(v_alert));
end $$;

-- -----------------------------------------------------------------------------
-- 3. Billing feature/action registry and route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('branding_integrations_api','school_operations','branding_integrations','White Label, Branding, Custom Domains, Integrations & API','Custom branding, domain verification, connectors, API keys, webhooks and integration health runtime.','enterprise',false,true,false,'automation_credit',1,'{"phase":"phase_2p","growthMenu":"branding_integrations_api"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,default_meter_key=excluded.default_meter_key,default_credit_cost=excluded.default_credit_cost,metadata_json=public.ac360_feature_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json)
values('branding_integrations_api','Branding, Custom Domains & Integrations','branding_integrations','White-label branding profiles, custom domains, API keys, webhooks and integration governance.','setup_plus_monthly',990,1500,'module','{"annual_reference_price_mad":9900,"feature_keys":["branding_integrations_api"],"included_custom_domains":1,"included_webhooks":3}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2p","menu":"growth_menu","annual_reference_price_mad":9900,"feature_keys":["branding_integrations_api"]}'::jsonb)
on conflict(addon_key) do update set label=excluded.label,family=excluded.family,description=excluded.description,billing_model=excluded.billing_model,monthly_price_mad=excluded.monthly_price_mad,setup_price_mad=excluded.setup_price_mad,unit_label=excluded.unit_label,included_allowance_json=excluded.included_allowance_json,cancellable=excluded.cancellable,data_preservation_policy=excluded.data_preservation_policy,status=excluded.status,metadata_json=public.ac360_addons.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.branding.profile.upsert','branding_integrations_api','AC360-ENG-52','Upsert brand profile','Create or update school white-label brand profile.','branding.profile.upsert',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.branding.asset.register','branding_integrations_api','AC360-ENG-50','Register brand asset','Register logo, favicon or branded asset.','branding.asset.register','storage_gb',0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.domain.request','branding_integrations_api','AC360-ENG-52','Request custom domain','Request custom domain verification.','domain.request',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.domain.verify','branding_integrations_api','AC360-ENG-52','Verify custom domain','Record DNS/SSL custom domain verification.','domain.verify',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.integration.connector.upsert','branding_integrations_api','AC360-ENG-52','Upsert integration connector','Create/update integration connector configuration.','integration.connector.upsert',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.api_key.issue','branding_integrations_api','AC360-ENG-52','Issue API key','Issue scoped API key for external integrations.','api_key.issue',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.api_key.revoke','branding_integrations_api','AC360-ENG-52','Revoke API key','Revoke scoped API key.','api_key.revoke',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.webhook.upsert','branding_integrations_api','AC360-ENG-52','Upsert webhook','Create or update outbound webhook endpoint.','webhook.upsert',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.webhook.delivery.record','branding_integrations_api','AC360-ENG-33','Record webhook delivery','Record webhook delivery attempt/result.','webhook.delivery.record','automation_credit',1,'require_topup','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.integration.event.record','branding_integrations_api','AC360-ENG-33','Record integration event','Record integration event/result/alert source.','integration.event.record','automation_credit',1,'require_topup','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.branding_integrations.reconcile','branding_integrations_api','AC360-ENG-38','Reconcile branding integrations','Refresh branding, domains, API and integration health snapshots.','branding_integrations.reconcile',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb),
('school.integration.alert.resolve','branding_integrations_api','AC360-ENG-38','Resolve integration alert','Resolve custom domain/integration runtime alert.','integration.alert.resolve',null,0,'require_upgrade','{"phase":"phase_2p","suggested_addon_key":"branding_integrations_api"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_branding.profile.upsert','/api/ac360/school-branding/branding/profile/upsert','POST','school.branding.profile.upsert','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_brand_profiles','strict','fixed_1','request_or_generated',null,null,'active','Upserts brand profile.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.asset.register','/api/ac360/school-branding/branding/assets/register','POST','school.branding.asset.register','branding_integrations_api','AC360-ENG-50','angelcare_360_school_branding_integrations','ac360_school_brand_assets','strict','fixed_1','request_or_generated',null,null,'active','Registers brand asset.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.domain.request','/api/ac360/school-branding/domains/request','POST','school.domain.request','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_custom_domains','strict','fixed_1','request_or_generated',null,null,'active','Requests custom domain.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.domain.verify','/api/ac360/school-branding/domains/verify','POST','school.domain.verify','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_custom_domains','strict','fixed_1','request_or_generated',null,null,'active','Verifies custom domain.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.integration_connector.upsert','/api/ac360/school-branding/integrations/connectors/upsert','POST','school.integration.connector.upsert','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_integration_connectors','strict','fixed_1','request_or_generated',null,null,'active','Upserts integration connector.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.api_key.issue','/api/ac360/school-branding/api-keys/issue','POST','school.api_key.issue','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_api_keys','strict','fixed_1','request_or_generated',null,null,'active','Issues API key.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.api_key.revoke','/api/ac360/school-branding/api-keys/revoke','POST','school.api_key.revoke','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_api_keys','strict','fixed_1','request_or_generated',null,null,'active','Revokes API key.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.webhook.upsert','/api/ac360/school-branding/webhooks/upsert','POST','school.webhook.upsert','branding_integrations_api','AC360-ENG-52','angelcare_360_school_branding_integrations','ac360_school_webhooks','strict','fixed_1','request_or_generated',null,null,'active','Upserts webhook.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.webhook_delivery.record','/api/ac360/school-branding/webhooks/deliveries/record','POST','school.webhook.delivery.record','branding_integrations_api','AC360-ENG-33','angelcare_360_school_branding_integrations','ac360_school_webhook_deliveries','strict','fixed_1','request_or_generated',null,null,'active','Records webhook delivery.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.integration_event.record','/api/ac360/school-branding/integrations/events/record','POST','school.integration.event.record','branding_integrations_api','AC360-ENG-33','angelcare_360_school_branding_integrations','ac360_school_integration_events','strict','fixed_1','request_or_generated',null,null,'active','Records integration event.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.reconcile','/api/ac360/school-branding/reconcile','POST','school.branding_integrations.reconcile','branding_integrations_api','AC360-ENG-38','angelcare_360_school_branding_integrations','ac360_school_branding_integration_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles branding and integration runtime.','{"phase":"phase_2p"}'::jsonb),
('ac360.school_branding.alert.resolve','/api/ac360/school-branding/alerts/resolve','POST','school.integration.alert.resolve','branding_integrations_api','AC360-ENG-38','angelcare_360_school_branding_integrations','ac360_school_integration_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves integration alert.','{"phase":"phase_2p"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, sort_order, status, phase) values
('phase2p.domain.pending.raise_alert','Pending custom domains raise alert','Branding & Integrations','domain.pending_dns.threshold','{"pending_domains_gt":0}'::jsonb,'{"emit_runtime_alert":"pending_domain_verification"}'::jsonb,290,'active','phase_2p_branding_integrations'),
('phase2p.webhook.failed.raise_alert','Failed webhook delivery raises alert','Branding & Integrations','webhook.delivery.failed','{"status":"failed"}'::jsonb,'{"emit_runtime_alert":"webhook_delivery_failed"}'::jsonb,291,'active','phase_2p_branding_integrations'),
('phase2p.connector.error.raise_alert','Integration connector error raises alert','Branding & Integrations','connector.status.error','{"status":"error"}'::jsonb,'{"emit_runtime_alert":"integration_health_issues"}'::jsonb,292,'active','phase_2p_branding_integrations')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values('branding_custom_domains_integrations_api','AC360-ENG-52','branding_integrations_api','White Label, Branding, Custom Domains, Integrations & API Runtime','phase_2p_branding_domains_integrations_api','guarded',array['ac360_school_brand_profiles','ac360_school_brand_assets','ac360_school_custom_domains','ac360_school_integration_connectors','ac360_school_api_keys','ac360_school_webhooks','ac360_school_webhook_deliveries','ac360_school_integration_events'],array['school.branding.profile.upsert','school.branding.asset.register','school.domain.request','school.domain.verify','school.integration.connector.upsert','school.api_key.issue','school.api_key.revoke','school.webhook.upsert','school.webhook.delivery.record','school.integration.event.record','school.branding_integrations.reconcile','school.integration.alert.resolve'],'{"phase":"phase_2p","uiBuildAllowed":false,"backendOnly":true,"secretsPolicy":"no_plaintext_secrets"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json||excluded.metadata_json,updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. RLS service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_school_brand_profiles enable row level security;
alter table public.ac360_school_brand_assets enable row level security;
alter table public.ac360_school_custom_domains enable row level security;
alter table public.ac360_school_domain_verification_events enable row level security;
alter table public.ac360_school_integration_connectors enable row level security;
alter table public.ac360_school_integration_credentials enable row level security;
alter table public.ac360_school_api_keys enable row level security;
alter table public.ac360_school_webhooks enable row level security;
alter table public.ac360_school_webhook_deliveries enable row level security;
alter table public.ac360_school_integration_events enable row level security;
alter table public.ac360_school_branding_integration_snapshots enable row level security;
alter table public.ac360_school_integration_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_school_brand_profiles','ac360_school_brand_assets','ac360_school_custom_domains','ac360_school_domain_verification_events','ac360_school_integration_connectors','ac360_school_integration_credentials','ac360_school_api_keys','ac360_school_webhooks','ac360_school_webhook_deliveries','ac360_school_integration_events','ac360_school_branding_integration_snapshots','ac360_school_integration_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
