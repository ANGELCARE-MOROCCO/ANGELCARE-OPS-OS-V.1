-- ANGELCARE Content Command Center 360 · Production Operations & Release Control
begin;
create extension if not exists pgcrypto;
create table if not exists public.market_content_production_controls(
 control_key text primary key default 'global',maintenance_mode boolean not null default false,manual_only_mode boolean not null default false,ai_automation_paused boolean not null default false,tavily_paused boolean not null default false,openrouter_paused boolean not null default false,scheduled_scans_paused boolean not null default false,scheduled_publishing_paused boolean not null default false,reason text not null default '',critical_authority_id uuid,critical_authority_name text not null default 'Aissaoui Ilyass',updated_by uuid,updated_by_name text not null default 'System',updated_at timestamptz not null default now()
);
insert into public.market_content_production_controls(control_key) values('global') on conflict do nothing;
create table if not exists public.market_content_release_versions(
 id uuid primary key default gen_random_uuid(),version_code text not null unique,label text not null,status text not null default 'candidate' check(status in('draft','candidate','active','superseded','retired')),doctrine_version text not null,skills_version text not null,commands_version text not null,provider_assignment_version text not null,freeze_scope text[] not null default '{}',notes text not null default '',created_by uuid,created_by_name text not null default '',approved_by uuid,approved_by_name text not null default '',approved_at timestamptz,effective_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists market_content_one_active_release_idx on public.market_content_release_versions((status)) where status='active';
insert into public.market_content_release_versions(version_code,label,status,doctrine_version,skills_version,commands_version,provider_assignment_version,freeze_scope,notes,created_by_name)
values('1.0','AC Content Command Center 360 · Production Release 1.0','candidate','AC-CCC-DOC-1.0','AC-CCC-SKL-1.0','AC-CCC-CMD-1.0','AC-CCC-AI-1.0',array['routes','core_statuses','entity_ownership','canonical_apis','database_contracts','permissions','doctrine','provider_assignments'],'Candidate production initiale. Activation requiert l’autorité critique.','Aissaoui Ilyass')
on conflict(version_code) do nothing;
create table if not exists public.market_content_operational_incidents(
 id uuid primary key default gen_random_uuid(),source_type text not null,source_id text not null,incident_type text not null,severity text not null default 'warning' check(severity in('info','warning','high','critical')),status text not null default 'open' check(status in('open','assigned','retry_scheduled','manual_continuation','resolved','dismissed')),summary text not null,detail text not null default '',owner_id uuid,owner_name text not null default '',next_action text not null default '',source_href text not null default '',resolution_reason text not null default '',resolved_by uuid,resolved_by_name text not null default '',resolved_at timestamptz,occurred_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(source_type,source_id,incident_type)
);
create index if not exists market_content_operational_incidents_queue_idx on public.market_content_operational_incidents(status,severity,occurred_at desc);
create table if not exists public.market_content_ai_cost_ledger(
 id bigserial primary key,provider text not null,model text not null default '',capability text not null,director_id text,mission_id text,run_id text,input_tokens bigint not null default 0,output_tokens bigint not null default 0,latency_ms bigint not null default 0,estimated_cost_dh numeric(14,4) not null default 0,created_by text,occurred_at timestamptz not null default now()
);
create index if not exists market_content_ai_cost_period_idx on public.market_content_ai_cost_ledger(occurred_at desc,provider,model);
create table if not exists public.market_content_budget_policies(
 id uuid primary key default gen_random_uuid(),scope_type text not null,scope_id text not null,daily_limit_dh numeric(14,2) not null default 0,monthly_limit_dh numeric(14,2) not null default 0,warning_percent integer not null default 80 check(warning_percent between 1 and 100),hard_stop boolean not null default false,fallback_provider text not null default '',fallback_model text not null default '',fx_usd_to_dh numeric(10,4) not null default 10.0,updated_by uuid,updated_by_name text not null default '',updated_at timestamptz not null default now(),unique(scope_type,scope_id)
);
insert into public.market_content_budget_policies(scope_type,scope_id,daily_limit_dh,monthly_limit_dh,warning_percent,hard_stop,fallback_provider) values('global','global',250,5000,80,true,'manual') on conflict(scope_type,scope_id) do nothing;
create table if not exists public.market_content_international_defaults(
 id uuid primary key default gen_random_uuid(),scope_type text not null,scope_id text not null,label text not null,timezone text not null default 'Africa/Casablanca',locale text not null default 'fr-MA',default_language text not null default 'fr',content_languages text[] not null default array['fr'],currency text not null default 'Dh',date_format text not null default 'DD/MM/YYYY',week_starts_on integer not null default 1,working_days integer[] not null default array[1,2,3,4,5],holidays text[] not null default '{}',market_scope text[] not null default array['Morocco'],updated_by uuid,updated_by_name text not null default '',updated_at timestamptz not null default now(),unique(scope_type,scope_id)
);
insert into public.market_content_international_defaults(scope_type,scope_id,label,timezone,locale,default_language,content_languages,currency,market_scope) values('global','global','AngelCare Morocco · Global Command','Africa/Casablanca','fr-MA','fr',array['fr','en'],'Dh',array['Morocco','International']) on conflict(scope_type,scope_id) do nothing;
create table if not exists public.market_content_role_home_profiles(
 role_key text primary key,label text not null,default_route text not null,visible_routes text[] not null default '{}',onboarding_state text not null default 'ready' check(onboarding_state in('draft','ready','active','retired')),updated_by uuid,updated_by_name text not null default '',updated_at timestamptz not null default now()
);
insert into public.market_content_role_home_profiles(role_key,label,default_route,visible_routes,onboarding_state) values
('content_officer','Content Producer','/market-os/content-command-center/tasks/execution',array['/market-os/content-command-center/tasks','/market-os/content-command-center/studio','/market-os/content-command-center/evidence'],'active'),
('copywriter','Copywriter','/market-os/content-command-center/tasks/execution',array['/market-os/content-command-center/briefs','/market-os/content-command-center/tasks','/market-os/content-command-center/studio'],'active'),
('designer','Designer','/market-os/content-command-center/studio',array['/market-os/content-command-center/tasks','/market-os/content-command-center/studio','/market-os/content-command-center/evidence'],'active'),
('marketing_manager','Campaign Manager','/market-os/content-command-center/campaigns',array['/market-os/content-command-center/opportunities','/market-os/content-command-center/campaigns','/market-os/content-command-center/campaigns/live'],'active'),
('marketing_director','Content Command Director','/market-os/content-command-center',array['/market-os/content-command-center','/market-os/content-command-center/opportunities','/market-os/content-command-center/campaigns','/market-os/content-command-center/production-operations'],'active'),
('admin','Platform Administrator','/market-os/content-command-center/production-operations',array['/market-os/content-command-center/production-operations','/market-os/content-command-center/record-governance','/market-os/content-command-center/ai-director'],'active')
on conflict(role_key) do nothing;
create table if not exists public.market_content_notification_rules(
 event_key text primary key,label text not null,enabled boolean not null default true,severity text not null default 'warning',channels text[] not null default array['in_app'],recipient_roles text[] not null default '{}',dedupe_minutes integer not null default 60,escalate_after_minutes integer not null default 240,updated_by uuid,updated_by_name text not null default '',updated_at timestamptz not null default now()
);
insert into public.market_content_notification_rules(event_key,label,severity,channels,recipient_roles,dedupe_minutes,escalate_after_minutes) values
('work.assigned','Travail assigné','info',array['in_app'],array['content_officer','copywriter','designer'],30,0),
('deadline.approaching','Échéance proche','warning',array['in_app','email'],array['content_officer','marketing_manager'],240,1440),
('review.requested','Révision requise','warning',array['in_app'],array['content_manager','brand_manager'],60,480),
('publication.failed','Publication en échec','high',array['in_app','email'],array['publishing_officer','marketing_manager'],30,120),
('provider.unavailable','Provider indisponible','high',array['in_app','email'],array['marketing_director','admin'],60,180),
('budget.threshold','Seuil budget IA atteint','critical',array['in_app','email'],array['marketing_director','admin'],120,60),
('critical.override','Override critique demandé','critical',array['in_app','email'],array['owner','admin'],0,30),
('permanent.deletion','Suppression permanente demandée','critical',array['in_app','email'],array['owner','admin'],0,30)
on conflict(event_key) do nothing;

do $$declare t text;begin foreach t in array array['market_content_production_controls','market_content_release_versions','market_content_operational_incidents','market_content_ai_cost_ledger','market_content_budget_policies','market_content_international_defaults','market_content_role_home_profiles','market_content_notification_rules'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on table public.%I from anon, authenticated',t);execute format('grant all on table public.%I to service_role',t);end loop;end$$;
grant usage,select on sequence public.market_content_ai_cost_ledger_id_seq to service_role;
commit;
