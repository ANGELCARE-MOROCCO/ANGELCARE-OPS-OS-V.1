begin;
create extension if not exists pgcrypto;

alter table public.angelcare_marketplace_quote_baskets add column if not exists basket_kind text not null default 'quotation';
alter table public.angelcare_marketplace_quote_baskets add column if not exists locale text not null default 'fr';
alter table public.angelcare_marketplace_quote_baskets add column if not exists visitor_reference_hash text;
alter table public.angelcare_marketplace_quote_baskets add column if not exists pricing_status text not null default 'not_revalidated';
alter table public.angelcare_marketplace_quote_baskets add column if not exists idempotency_key text;
do $$begin
 if not exists(select 1 from pg_constraint where conname='angelcare_marketplace_quote_baskets_basket_kind_check') then
  alter table public.angelcare_marketplace_quote_baskets add constraint angelcare_marketplace_quote_baskets_basket_kind_check check(basket_kind in('transactional','quotation'));
 end if;
 if not exists(select 1 from pg_constraint where conname='angelcare_marketplace_quote_baskets_locale_check') then
  alter table public.angelcare_marketplace_quote_baskets add constraint angelcare_marketplace_quote_baskets_locale_check check(locale in('fr','en','ar'));
 end if;
end$$;
create unique index if not exists ac_marketplace_quote_basket_idempotency_uq on public.angelcare_marketplace_quote_baskets(idempotency_key) where idempotency_key is not null;
create index if not exists ac_marketplace_quote_basket_visitor_idx on public.angelcare_marketplace_quote_baskets(visitor_reference_hash,basket_kind,basket_status,expires_at);

alter table public.angelcare_marketplace_quote_basket_items add column if not exists item_kind text;
alter table public.angelcare_marketplace_quote_basket_items add column if not exists price_status text not null default 'not_revalidated';
alter table public.angelcare_marketplace_quote_basket_items add column if not exists availability_status text not null default 'not_revalidated';
alter table public.angelcare_marketplace_quote_basket_items add column if not exists source_version text;
alter table public.angelcare_marketplace_quote_basket_items add column if not exists expires_at timestamptz;
create index if not exists ac_marketplace_quote_basket_item_lookup_idx on public.angelcare_marketplace_quote_basket_items(basket_id,catalog_item_id,catalog_variant_id);

create table if not exists public.angelcare_marketplace_conversion_sessions(
 id uuid primary key default gen_random_uuid(),
 public_reference text unique not null default ('CNV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,11))),
 session_key text unique not null,
 journey text not null check(journey in('service_booking','product_checkout','academy_enrollment','b2b_quotation','partner_subscription','quality_assessment')),
 status text not null default 'draft' check(status in('draft','configuring','identity_pending','eligibility_pending','availability_pending','consent_pending','review','ready','submitted','confirmed','handover_pending','expired','cancelled','failed')),
 locale text not null default 'fr' check(locale in('fr','en','ar')),
 territory_id uuid,
 tenant_id uuid,
 family_account_id uuid,
 crm_account_id uuid,
 catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id),
 quote_basket_id uuid references public.angelcare_marketplace_quote_baskets(id),
 visitor_reference_hash text not null,
 identity_context jsonb not null default '{}',
 configuration jsonb not null default '{}',
 eligibility_result jsonb not null default '{}',
 availability_result jsonb not null default '{}',
 price_snapshot_id uuid,
 source_route text,
 idempotency_key text not null,
 failure_code text,
 failure_message text,
 outcome_type text,
 outcome_id uuid,
 metadata jsonb not null default '{}',
 expires_at timestamptz not null,
 last_activity_at timestamptz not null default now(),
 submitted_at timestamptz,
 confirmed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(visitor_reference_hash,idempotency_key)
);

create table if not exists public.angelcare_marketplace_conversion_price_snapshots(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.angelcare_marketplace_conversion_sessions(id) on delete cascade,
 catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id),
 pricing_source text not null check(pricing_source in('finance_price_rule','catalog_fallback','quote_required')),
 price_book_id uuid references public.angelcare_marketplace_finance_price_books(id),
 price_rule_id uuid references public.angelcare_marketplace_finance_price_rules(id),
 currency_label text not null default 'Dh',
 pricing_model text not null,
 unit_price numeric(16,2),
 quantity numeric(12,2) not null default 1 check(quantity>0),
 subtotal numeric(16,2),
 discount_total numeric(16,2) not null default 0,
 tax_total numeric(16,2) not null default 0,
 grand_total numeric(16,2),
 status text not null check(status in('valid','quote_required','expired','rejected')),
 source_hash text not null,
 valid_until timestamptz not null,
 evidence jsonb not null default '{}',
 created_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_conversion_availability_holds(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.angelcare_marketplace_conversion_sessions(id) on delete cascade,
 catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id),
 hold_type text not null check(hold_type in('cohort_seat','inventory','service_capacity')),
 authority text not null check(authority in('catalog','academy','inventory','provider','corporate_quota','manual_review')),
 authority_object_id text,
 source_reference text,
 quantity numeric(12,2) not null default 1 check(quantity>0),
 status text not null default 'held' check(status in('held','confirmed','released','expired','rejected')),
 reason text,
 starts_at timestamptz,
 ends_at timestamptz,
 expires_at timestamptz not null,
 confirmed_at timestamptz,
 released_at timestamptz,
 evidence jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_conversion_consents(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.angelcare_marketplace_conversion_sessions(id) on delete cascade,
 consent_key text not null,
 consent_version text not null,
 locale text not null check(locale in('fr','en','ar')),
 accepted boolean not null,
 accepted_at timestamptz,
 text_hash text not null,
 evidence jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(session_id,consent_key,consent_version)
);

create table if not exists public.angelcare_marketplace_conversion_outcomes(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.angelcare_marketplace_conversion_sessions(id) on delete cascade,
 outcome_type text not null,
 canonical_object_type text not null,
 canonical_object_id uuid,
 public_reference text not null,
 status text not null check(status in('created','submitted','handover_pending','failed')),
 handover_payload jsonb not null default '{}',
 idempotency_key text unique not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_conversion_events(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.angelcare_marketplace_conversion_sessions(id) on delete cascade,
 event_type text not null,
 payload jsonb not null default '{}',
 created_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_conversion_exceptions(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.angelcare_marketplace_conversion_sessions(id) on delete cascade,
 exception_code text not null,
 message text not null,
 severity text not null default 'warning' check(severity in('info','warning','high','critical')),
 status text not null default 'open' check(status in('open','acknowledged','resolved','dismissed')),
 owner_id uuid,
 resolution_notes text,
 evidence jsonb not null default '{}',
 resolved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_conversion_policies(
 id uuid primary key default gen_random_uuid(),
 policy_key text unique not null,
 name_fr text not null,
 description_fr text,
 policy_value jsonb not null default '{}',
 status text not null default 'active' check(status in('draft','active','paused','archived')),
 version int not null default 1,
 approved_by uuid,
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists ac_conversion_session_scope_idx on public.angelcare_marketplace_conversion_sessions(territory_id,tenant_id,status,last_activity_at desc);
create index if not exists ac_conversion_session_journey_idx on public.angelcare_marketplace_conversion_sessions(journey,status,created_at desc);
create index if not exists ac_conversion_session_visitor_idx on public.angelcare_marketplace_conversion_sessions(visitor_reference_hash,expires_at);
create index if not exists ac_conversion_price_session_idx on public.angelcare_marketplace_conversion_price_snapshots(session_id,created_at desc);
create index if not exists ac_conversion_hold_expiry_idx on public.angelcare_marketplace_conversion_availability_holds(status,expires_at);
create index if not exists ac_conversion_consent_session_idx on public.angelcare_marketplace_conversion_consents(session_id,consent_key);
create index if not exists ac_conversion_event_session_idx on public.angelcare_marketplace_conversion_events(session_id,created_at desc);
create index if not exists ac_conversion_exception_queue_idx on public.angelcare_marketplace_conversion_exceptions(status,severity,created_at desc);

create or replace view public.angelcare_marketplace_conversion_session_v with (security_invoker=true) as
select s.id,s.public_reference,s.session_key,s.journey,s.status,s.locale,s.territory_id,s.tenant_id,s.family_account_id,s.crm_account_id,s.catalog_item_id,i.public_reference as item_reference,i.slug as item_slug,i.kind as item_kind,i.name_fr as item_name_fr,s.quote_basket_id,s.price_snapshot_id,s.failure_code,s.failure_message,s.expires_at,s.last_activity_at,s.submitted_at,s.confirmed_at,s.outcome_type,s.outcome_id,s.created_at
from public.angelcare_marketplace_conversion_sessions s
join public.angelcare_marketplace_catalog_items i on i.id=s.catalog_item_id;

create or replace view public.angelcare_marketplace_conversion_funnel_v with (security_invoker=true) as
select journey,status,count(*)::bigint as session_count,min(created_at) as first_created_at,max(last_activity_at) as last_activity_at
from public.angelcare_marketplace_conversion_sessions
group by journey,status;

insert into public.angelcare_marketplace_conversion_policies(policy_key,name_fr,description_fr,policy_value,status,version) values
('availability_hold_ttl','Durée des holds disponibilité','Durée maximale avant libération automatique.',jsonb_build_object('minutes',30),'active',1),
('price_snapshot_ttl','Durée des snapshots prix','Fenêtre de validité avant revérification.',jsonb_build_object('minutes',30),'active',1),
('session_ttl','Durée des sessions publiques','Expiration des parcours non confirmés.',jsonb_build_object('hours',48),'active',1),
('required_consents','Consentements obligatoires','Liste des consentements exigés avant confirmation.',jsonb_build_object('keys',jsonb_build_array('marketplace_terms','privacy_notice')),'active',1),
('confirmation_idempotency','Confirmation idempotente','Empêche la duplication des résultats canoniques.',jsonb_build_object('enabled',true),'active',1)
on conflict(policy_key) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,policy_value=excluded.policy_value,status='active',version=greatest(public.angelcare_marketplace_conversion_policies.version,excluded.version),updated_at=now();

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive) values
('marketplace.conversion.view','Voir Conversion Command','Marketplace Conversion',false),
('marketplace.conversion.manage','Gérer sessions et handovers','Marketplace Conversion',true),
('marketplace.conversion.recover','Récupérer une conversion','Marketplace Conversion',true),
('marketplace.conversion.configuration.manage','Gérer les politiques de conversion','Marketplace Conversion',true),
('marketplace.conversion.analytics.view','Voir les analytics de conversion','Marketplace Conversion',false),
('marketplace.conversion.export','Exporter les preuves de conversion','Marketplace Conversion',true)
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key from public.angelcare_marketplace_roles r cross join public.angelcare_marketplace_permissions p
where r.role_key in('marketplace_super_admin','marketplace_executive') and p.permission_key like 'marketplace.conversion.%'
on conflict do nothing;

-- Compatibility evolution:
-- Original Build 360 modules used sequence numbers 1–20.
-- Post-MZ20 Marketplace completion deliveries continue the governed
-- sequence without falsifying ownership as Mega ZIP 20.
alter table public.angelcare_marketplace_modules
  drop constraint if exists
  angelcare_marketplace_modules_introduced_by_mega_zip_check;

alter table public.angelcare_marketplace_modules
  add constraint
  angelcare_marketplace_modules_introduced_by_mega_zip_check
  check (introduced_by_mega_zip >= 1);

insert into public.angelcare_marketplace_modules(module_key,name,description,route_prefix,module_type,audience,status,enabled,required_permissions,required_dependencies,territory_aware,tenant_aware,locale_aware,health_status,owner_role,introduced_by_mega_zip)
values('conversion-universe','Basket, Booking & Checkout Conversion','Paniers, prix, disponibilité, consentements, booking, enrollment, quotation et handovers.','/angelcare-marketplace/admin/conversion','operating_engine',array['public','family','tenant','admin','executive']::text[],'enabled',true,array['marketplace.conversion.view']::text[],array['foundation','catalog-discovery','finance-authority','territory-os']::text[],true,true,true,'healthy','marketplace_conversion_manager',22)
on conflict(module_key) do update set name=excluded.name,description=excluded.description,route_prefix=excluded.route_prefix,status='enabled',enabled=true,required_permissions=excluded.required_permissions,required_dependencies=excluded.required_dependencies,health_status='healthy',updated_at=now();

insert into public.angelcare_marketplace_feature_flags(flag_key,name,description,enabled,status,reason)
values('marketplace.conversion.enabled','Marketplace Conversion Universe','Basket, booking, enrollment, quotation and checkout governed conversion layer.',true,'active','Global Marketplace Conversion Universe')
on conflict(flag_key) do update set enabled=true,status='active',reason=excluded.reason,updated_at=now();

alter table public.angelcare_marketplace_conversion_sessions enable row level security;
alter table public.angelcare_marketplace_conversion_price_snapshots enable row level security;
alter table public.angelcare_marketplace_conversion_availability_holds enable row level security;
alter table public.angelcare_marketplace_conversion_consents enable row level security;
alter table public.angelcare_marketplace_conversion_outcomes enable row level security;
alter table public.angelcare_marketplace_conversion_events enable row level security;
alter table public.angelcare_marketplace_conversion_exceptions enable row level security;
alter table public.angelcare_marketplace_conversion_policies enable row level security;

revoke all on table public.angelcare_marketplace_conversion_sessions,public.angelcare_marketplace_conversion_price_snapshots,public.angelcare_marketplace_conversion_availability_holds,public.angelcare_marketplace_conversion_consents,public.angelcare_marketplace_conversion_outcomes,public.angelcare_marketplace_conversion_events,public.angelcare_marketplace_conversion_exceptions,public.angelcare_marketplace_conversion_policies from anon,authenticated;
grant all on table public.angelcare_marketplace_conversion_sessions,public.angelcare_marketplace_conversion_price_snapshots,public.angelcare_marketplace_conversion_availability_holds,public.angelcare_marketplace_conversion_consents,public.angelcare_marketplace_conversion_outcomes,public.angelcare_marketplace_conversion_events,public.angelcare_marketplace_conversion_exceptions,public.angelcare_marketplace_conversion_policies to service_role;
grant select on table public.angelcare_marketplace_conversion_session_v,public.angelcare_marketplace_conversion_funnel_v to service_role;

commit;
