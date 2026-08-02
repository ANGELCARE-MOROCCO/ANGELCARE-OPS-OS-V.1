begin;

create table if not exists public.angelcare_marketplace_journeys(
 id uuid primary key default gen_random_uuid(),
 public_reference text unique not null default ('JNY-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,11))),
 journey_type text not null check(journey_type in('product_order','kit_order','family_booking','recurring_service','academy_enrollment','b2b_quotation','hospitality_programme','corporate_benefit','partner_activation','quality_assessment')),
 status text not null default 'registered' check(status in('registered','awaiting_customer','awaiting_angelcare','qualified','scheduled','in_preparation','in_progress','completed','blocked','recovery','cancelled')),
 locale text not null default 'fr' check(locale in('fr','en','ar')),
 title text not null,
 subtitle text,
 owner_user_id uuid,
 family_account_id uuid,
 crm_account_id uuid,
 tenant_id uuid,
 territory_id uuid,
 conversion_outcome_id uuid unique references public.angelcare_marketplace_conversion_outcomes(id),
 canonical_object_type text not null,
 canonical_object_id uuid,
 current_authority text not null,
 next_action_label text,
 next_action_due_at timestamptz,
 risk_level text not null default 'low' check(risk_level in('low','medium','high','critical')),
 completion_percent int not null default 5 check(completion_percent between 0 and 100),
 scheduled_start_at timestamptz,
 scheduled_end_at timestamptz,
 completed_at timestamptz,
 financial_status jsonb not null default '{}',
 fulfillment_status jsonb not null default '{}',
 customer_context jsonb not null default '{}',
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_journey_participants(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 participant_type text not null check(participant_type in('customer','family_member','organization_member','learner','operator','provider','trainer','system')),
 participant_id uuid, display_name text, role_label text, visibility text not null default 'customer' check(visibility in('customer','organization','internal','restricted')),
 status text not null default 'active' check(status in('invited','active','removed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_links(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 authority_type text not null, authority_object_id text not null, relationship_type text not null,
 customer_visible boolean not null default false, metadata jsonb not null default '{}', created_at timestamptz not null default now(),
 unique(journey_id,authority_type,authority_object_id,relationship_type)
);
create table if not exists public.angelcare_marketplace_journey_events(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 event_key text not null, title text not null, description text,
 status text not null check(status in('registered','awaiting_customer','awaiting_angelcare','qualified','scheduled','in_preparation','in_progress','completed','blocked','recovery','cancelled')),
 authority_type text not null, authority_object_id text, evidence jsonb not null default '{}', customer_visible boolean not null default true,
 occurred_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_actions(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 action_key text not null, title text not null, description text,
 status text not null default 'open' check(status in('open','in_progress','completed','waived','expired')),
 due_at timestamptz, consequence text, action_url text, required_authority text not null,
 evidence jsonb not null default '{}', completed_by uuid, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_documents(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 document_type text not null, title text not null, version_label text, locale text not null default 'fr' check(locale in('fr','en','ar')),
 visibility text not null default 'customer' check(visibility in('customer','organization','internal','restricted')),
 source_system text not null, source_object_id text, download_url text, checksum text, expires_at timestamptz,
 status text not null default 'pending' check(status in('pending','published','expired','withdrawn')),
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_notifications(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 channel text not null check(channel in('in_app','email','whatsapp','sms')), template_key text not null,
 title text not null, message text not null, locale text not null default 'fr' check(locale in('fr','en','ar')),
 status text not null default 'queued' check(status in('queued','sent','delivered','failed','acknowledged')),
 deep_link text, recipient_reference text, failure_reason text, scheduled_at timestamptz not null default now(), sent_at timestamptz,
 delivered_at timestamptz, acknowledged_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_preferences(
 id uuid primary key default gen_random_uuid(), owner_user_id uuid, family_account_id uuid, tenant_id uuid,
 channel_preferences jsonb not null default '{}', locale text not null default 'fr' check(locale in('fr','en','ar')),
 mandatory_alerts_enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_change_requests(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 request_type text not null, status text not null default 'submitted' check(status in('submitted','under_review','approved','rejected','completed','cancelled')),
 reason text not null, requested_changes jsonb not null default '{}', policy_decision jsonb not null default '{}',
 submitted_by uuid, reviewed_by uuid, submitted_at timestamptz not null default now(), resolved_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_exceptions(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 exception_code text not null, severity text not null default 'warning' check(severity in('info','warning','high','critical')),
 status text not null default 'open' check(status in('open','acknowledged','resolved','dismissed')), message text not null,
 authority_type text not null, authority_object_id text, evidence jsonb not null default '{}', owner_id uuid,
 resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_recovery_cases(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 issue_type text not null, urgency text not null default 'medium' check(urgency in('low','medium','high','critical')),
 status text not null default 'open' check(status in('open','investigating','proposal','awaiting_customer','resolved','closed')),
 summary text not null, evidence jsonb not null default '{}', resolution_proposal text, opened_by uuid, owner_id uuid,
 customer_accepted_at timestamptz, sla_due_at timestamptz, resolved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_sla_events(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 sla_key text not null, status text not null check(status in('started','at_risk','breached','met','cancelled')),
 target_at timestamptz not null, measured_at timestamptz, evidence jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_journey_customer_views(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 viewer_user_id uuid, viewer_reference_hash text, locale text not null default 'fr', viewed_at timestamptz not null default now(), metadata jsonb not null default '{}'
);
create table if not exists public.angelcare_marketplace_journey_policies(
 id uuid primary key default gen_random_uuid(), policy_key text unique not null, name_fr text not null, description_fr text,
 policy_value jsonb not null default '{}', status text not null default 'active' check(status in('draft','active','paused','archived')),
 version int not null default 1, approved_by uuid, approved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists ac_journey_scope_idx on public.angelcare_marketplace_journeys(tenant_id,territory_id,status,updated_at desc);
create index if not exists ac_journey_owner_idx on public.angelcare_marketplace_journeys(owner_user_id,family_account_id,status,updated_at desc);
create index if not exists ac_journey_type_idx on public.angelcare_marketplace_journeys(journey_type,status,created_at desc);
create index if not exists ac_journey_action_queue_idx on public.angelcare_marketplace_journey_actions(status,due_at);
create index if not exists ac_journey_event_timeline_idx on public.angelcare_marketplace_journey_events(journey_id,occurred_at desc);
create index if not exists ac_journey_notification_queue_idx on public.angelcare_marketplace_journey_notifications(status,scheduled_at);
create index if not exists ac_journey_recovery_queue_idx on public.angelcare_marketplace_journey_recovery_cases(status,urgency,sla_due_at);

create or replace function public.angelcare_marketplace_materialize_journey_from_conversion()
returns trigger language plpgsql security definer set search_path=public as $$
declare
 s public.angelcare_marketplace_conversion_sessions%rowtype;
 item_name text;
 mapped_type text;
 v_journey_id uuid;
 owner_id uuid;
begin
 select * into s from public.angelcare_marketplace_conversion_sessions where id=new.session_id;
 if not found then return new; end if;
 select name_fr into item_name from public.angelcare_marketplace_catalog_items where id=s.catalog_item_id;
 mapped_type := case s.journey
  when 'product_checkout' then case when coalesce(s.metadata->>'item_kind','')='kit' then 'kit_order' else 'product_order' end
  when 'service_booking' then case when coalesce(s.configuration->>'frequency','') in('weekly','monthly','recurring') then 'recurring_service' else 'family_booking' end
  when 'academy_enrollment' then 'academy_enrollment'
  when 'partner_subscription' then 'partner_activation'
  when 'quality_assessment' then 'quality_assessment'
  else case
   when coalesce(s.configuration->>'vertical','')='hospitality' then 'hospitality_programme'
   when coalesce(s.configuration->>'vertical','')='corporate' then 'corporate_benefit'
   else 'b2b_quotation' end
 end;
 begin owner_id := nullif(s.identity_context->>'user_id','')::uuid; exception when others then owner_id := null; end;
 insert into public.angelcare_marketplace_journeys(
  journey_type,status,locale,title,subtitle,owner_user_id,family_account_id,crm_account_id,tenant_id,territory_id,
  conversion_outcome_id,canonical_object_type,canonical_object_id,current_authority,next_action_label,next_action_due_at,
  risk_level,completion_percent,financial_status,fulfillment_status,customer_context,metadata
 ) values(
  mapped_type,'registered',s.locale,coalesce(item_name,'Parcours ANGELCARE'),
  'Parcours post-conversion gouverné et relié à ses autorités canoniques.',owner_id,s.family_account_id,s.crm_account_id,s.tenant_id,s.territory_id,
  new.id,new.canonical_object_type,new.canonical_object_id,new.canonical_object_type,
  case when new.status='handover_pending' then 'Finaliser le handover ANGELCARE' else 'Consulter la confirmation' end,
  now()+interval '48 hours','low',10,
  jsonb_build_object('source','finance_authority','status','linked'),
  jsonb_build_object('source',new.canonical_object_type,'status',new.status),
  coalesce(s.identity_context,'{}'::jsonb),jsonb_build_object('conversion_session_id',s.id,'conversion_reference',s.public_reference)
 ) on conflict(conversion_outcome_id) do update set
  canonical_object_type=excluded.canonical_object_type,canonical_object_id=excluded.canonical_object_id,
  current_authority=excluded.current_authority,fulfillment_status=excluded.fulfillment_status,updated_at=now()
 returning id into v_journey_id;
 if not exists(select 1 from public.angelcare_marketplace_journey_events where journey_id=v_journey_id and event_key='conversion_confirmed') then
  insert into public.angelcare_marketplace_journey_events(journey_id,event_key,title,description,status,authority_type,authority_object_id,evidence,customer_visible)
  values(v_journey_id,'conversion_confirmed','Conversion confirmée','Le parcours a été matérialisé à partir d’une issue canonique de Conversion Universe.','registered','conversion-universe',new.id::text,jsonb_build_object('outcome_type',new.outcome_type,'public_reference',new.public_reference),true);
 end if;
 if not exists(select 1 from public.angelcare_marketplace_journey_actions where journey_id=v_journey_id and action_key='review_confirmation') then
  insert into public.angelcare_marketplace_journey_actions(journey_id,action_key,title,description,status,due_at,consequence,action_url,required_authority)
  values(v_journey_id,'review_confirmation','Vérifier la confirmation','Contrôlez les informations du parcours et signalez immédiatement toute divergence.','open',now()+interval '48 hours','Le parcours reste en attente de votre accusé.','/angelcare-marketplace/fr/account/journeys/'||v_journey_id,'customer');
 end if;
 if not exists(select 1 from public.angelcare_marketplace_journey_notifications where journey_id=v_journey_id and template_key='journey_created') then
  insert into public.angelcare_marketplace_journey_notifications(journey_id,channel,template_key,title,message,locale,status,deep_link)
  values(v_journey_id,'in_app','journey_created','Votre parcours ANGELCARE est ouvert','La conversion a été confirmée. Suivez les prochaines étapes dans Mon ANGELCARE.',s.locale,'queued','/angelcare-marketplace/'||s.locale||'/account/journeys/'||v_journey_id);
 end if;
 return new;
end;$$;

drop trigger if exists trg_ac_materialize_journey_from_conversion on public.angelcare_marketplace_conversion_outcomes;
create trigger trg_ac_materialize_journey_from_conversion after insert or update of status,canonical_object_id on public.angelcare_marketplace_conversion_outcomes
for each row when (new.status in('created','submitted','handover_pending')) execute function public.angelcare_marketplace_materialize_journey_from_conversion();

insert into public.angelcare_marketplace_journeys(journey_type,status,locale,title,subtitle,family_account_id,crm_account_id,tenant_id,territory_id,conversion_outcome_id,canonical_object_type,canonical_object_id,current_authority,next_action_label,next_action_due_at,risk_level,completion_percent,financial_status,fulfillment_status,customer_context,metadata)
select case s.journey when 'product_checkout' then 'product_order' when 'service_booking' then 'family_booking' when 'academy_enrollment' then 'academy_enrollment' when 'partner_subscription' then 'partner_activation' when 'quality_assessment' then 'quality_assessment' else 'b2b_quotation' end,
'registered',s.locale,coalesce(i.name_fr,'Parcours ANGELCARE'),'Parcours matérialisé depuis Conversion Universe.',s.family_account_id,s.crm_account_id,s.tenant_id,s.territory_id,o.id,o.canonical_object_type,o.canonical_object_id,o.canonical_object_type,'Consulter la confirmation',now()+interval '48 hours','low',10,jsonb_build_object('source','finance_authority','status','linked'),jsonb_build_object('source',o.canonical_object_type,'status',o.status),s.identity_context,jsonb_build_object('conversion_session_id',s.id,'backfill',true)
from public.angelcare_marketplace_conversion_outcomes o
join public.angelcare_marketplace_conversion_sessions s on s.id=o.session_id
left join public.angelcare_marketplace_catalog_items i on i.id=s.catalog_item_id
where o.status in('created','submitted','handover_pending') and not exists(select 1 from public.angelcare_marketplace_journeys j where j.conversion_outcome_id=o.id)
on conflict(conversion_outcome_id) do nothing;

create or replace view public.angelcare_marketplace_journey_command_v with (security_invoker=true) as
select j.*,coalesce((select count(*) from public.angelcare_marketplace_journey_actions a where a.journey_id=j.id and a.status='open'),0) as open_actions,
coalesce((select count(*) from public.angelcare_marketplace_journey_recovery_cases r where r.journey_id=j.id and r.status not in('resolved','closed')),0) as open_recovery_cases,
coalesce((select count(*) from public.angelcare_marketplace_journey_notifications n where n.journey_id=j.id and n.status='failed'),0) as failed_notifications
from public.angelcare_marketplace_journeys j;
create or replace view public.angelcare_marketplace_journey_funnel_v with (security_invoker=true) as
select journey_type,status,count(*)::bigint as journey_count,avg(completion_percent)::numeric(8,2) as average_completion,
count(*) filter(where risk_level in('high','critical'))::bigint as high_risk_count
from public.angelcare_marketplace_journeys group by journey_type,status;

insert into public.angelcare_marketplace_journey_policies(policy_key,name_fr,description_fr,policy_value,status,version) values
('customer_visibility','Visibilité client','Affiche uniquement les événements, documents et participants autorisés.',jsonb_build_object('evidence_required',true,'restricted_documents_hidden',true),'active',1),
('change_request_control','Demandes de changement','Toute modification est évaluée par la politique et l’autorité source.',jsonb_build_object('automatic_acceptance',false,'audit_required',true),'active',1),
('notification_truth','Vérité des notifications','Aucune notification ne peut annoncer un état non confirmé par son autorité.',jsonb_build_object('authority_confirmation_required',true),'active',1),
('recovery_sla','SLA récupération','Cadre SLA pour les incidents rattachés aux parcours.',jsonb_build_object('critical_hours',2,'high_hours',8,'default_hours',24),'active',1)
on conflict(policy_key) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,policy_value=excluded.policy_value,status='active',version=greatest(public.angelcare_marketplace_journey_policies.version,excluded.version),updated_at=now();

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive) values
('marketplace.journeys.view','Voir Journey Control','Customer Journey Control',false),
('marketplace.journeys.manage','Gérer les parcours','Customer Journey Control',true),
('marketplace.journeys.actions.manage','Gérer les actions client','Customer Journey Control',true),
('marketplace.journeys.documents.manage','Gérer les documents parcours','Customer Journey Control',true),
('marketplace.journeys.notifications.manage','Gérer les notifications parcours','Customer Journey Control',true),
('marketplace.journeys.recovery.manage','Gérer Journey Recovery','Customer Journey Control',true),
('marketplace.journeys.configuration.manage','Configurer Journey Control','Customer Journey Control',true),
('marketplace.journeys.analytics.view','Voir Journey Analytics','Customer Journey Control',false),
('marketplace.journeys.export','Exporter les preuves parcours','Customer Journey Control',true)
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive;
insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key from public.angelcare_marketplace_roles r cross join public.angelcare_marketplace_permissions p
where r.role_key in('marketplace_super_admin','marketplace_executive') and p.permission_key like 'marketplace.journeys.%'
on conflict do nothing;

alter table public.angelcare_marketplace_modules drop constraint if exists angelcare_marketplace_modules_introduced_by_mega_zip_check;
alter table public.angelcare_marketplace_modules add constraint angelcare_marketplace_modules_introduced_by_mega_zip_check check(introduced_by_mega_zip>=1);
insert into public.angelcare_marketplace_modules(module_key,name,description,route_prefix,module_type,audience,status,enabled,required_permissions,required_dependencies,territory_aware,tenant_aware,locale_aware,health_status,owner_role,introduced_by_mega_zip)
values('journey-control-universe','Orders, Fulfillment & Journey Control','Mon ANGELCARE, orders, bookings, enrollments, quotations, notifications, documents and recovery.','/angelcare-marketplace/admin/journeys','operating_engine',array['family','tenant','admin','executive']::text[],'enabled',true,array['marketplace.journeys.view']::text[],array['conversion-universe','catalog-discovery','finance-authority','territory-os']::text[],true,true,true,'healthy','marketplace_journey_manager',23)
on conflict(module_key) do update set name=excluded.name,description=excluded.description,route_prefix=excluded.route_prefix,status='enabled',enabled=true,required_permissions=excluded.required_permissions,required_dependencies=excluded.required_dependencies,health_status='healthy',updated_at=now();
insert into public.angelcare_marketplace_feature_flags(flag_key,name,description,enabled,status,reason)
values('marketplace.journeys.enabled','Customer Journey Control Universe','Orders, requests, fulfillment visibility, Mon ANGELCARE and service recovery.',true,'active','Global Marketplace Journey Control Universe')
on conflict(flag_key) do update set enabled=true,status='active',reason=excluded.reason,updated_at=now();

alter table public.angelcare_marketplace_journeys enable row level security;
alter table public.angelcare_marketplace_journey_participants enable row level security;
alter table public.angelcare_marketplace_journey_links enable row level security;
alter table public.angelcare_marketplace_journey_events enable row level security;
alter table public.angelcare_marketplace_journey_actions enable row level security;
alter table public.angelcare_marketplace_journey_documents enable row level security;
alter table public.angelcare_marketplace_journey_notifications enable row level security;
alter table public.angelcare_marketplace_journey_preferences enable row level security;
alter table public.angelcare_marketplace_journey_change_requests enable row level security;
alter table public.angelcare_marketplace_journey_exceptions enable row level security;
alter table public.angelcare_marketplace_journey_recovery_cases enable row level security;
alter table public.angelcare_marketplace_journey_sla_events enable row level security;
alter table public.angelcare_marketplace_journey_customer_views enable row level security;
alter table public.angelcare_marketplace_journey_policies enable row level security;

revoke all on table public.angelcare_marketplace_journeys,public.angelcare_marketplace_journey_participants,public.angelcare_marketplace_journey_links,public.angelcare_marketplace_journey_events,public.angelcare_marketplace_journey_actions,public.angelcare_marketplace_journey_documents,public.angelcare_marketplace_journey_notifications,public.angelcare_marketplace_journey_preferences,public.angelcare_marketplace_journey_change_requests,public.angelcare_marketplace_journey_exceptions,public.angelcare_marketplace_journey_recovery_cases,public.angelcare_marketplace_journey_sla_events,public.angelcare_marketplace_journey_customer_views,public.angelcare_marketplace_journey_policies from anon,authenticated;
grant all on table public.angelcare_marketplace_journeys,public.angelcare_marketplace_journey_participants,public.angelcare_marketplace_journey_links,public.angelcare_marketplace_journey_events,public.angelcare_marketplace_journey_actions,public.angelcare_marketplace_journey_documents,public.angelcare_marketplace_journey_notifications,public.angelcare_marketplace_journey_preferences,public.angelcare_marketplace_journey_change_requests,public.angelcare_marketplace_journey_exceptions,public.angelcare_marketplace_journey_recovery_cases,public.angelcare_marketplace_journey_sla_events,public.angelcare_marketplace_journey_customer_views,public.angelcare_marketplace_journey_policies to service_role;
grant select on table public.angelcare_marketplace_journey_command_v,public.angelcare_marketplace_journey_funnel_v to service_role;

commit;
