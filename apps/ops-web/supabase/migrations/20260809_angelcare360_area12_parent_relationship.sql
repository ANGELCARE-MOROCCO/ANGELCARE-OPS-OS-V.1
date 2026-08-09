begin;

set local lock_timeout = '5s';

set local statement_timeout = '120s';

do $$ begin if to_regclass('public.angelcare360_area11_families') is null then raise exception 'Area 11 baseline missing'; end if; if to_regclass('public.angelcare360_area10_student_profiles') is null then raise exception 'Area 10 baseline missing'; end if; if to_regclass('public.angelcare360_area9_handover_outcomes') is null then raise exception 'Area 9 baseline missing'; end if; if to_regclass('public.angelcare360_operator_product_operations') is null then raise exception 'Product Constitution registry missing'; end if; end $$;

do $$ declare c text; begin foreach c in array array['operation_key','route_path','feature_key','operation_name','permission_key','audit_event','mutation_endpoints','source_confidence','status','updated_at'] loop if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='angelcare360_operator_product_operations' and column_name=c) then raise exception 'Product Constitution incompatible: missing %',c; end if; end loop; end $$;

do $$ declare mutation_endpoints_type text; begin select data_type into mutation_endpoints_type from information_schema.columns where table_schema='public' and table_name='angelcare360_operator_product_operations' and column_name='mutation_endpoints'; if mutation_endpoints_type is distinct from 'jsonb' then raise exception 'Product Constitution incompatible: mutation_endpoints must be jsonb, found %',coalesce(mutation_endpoints_type,'missing'); end if; end $$;

create table if not exists public.angelcare360_area12_relationship_cases (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_relationship_cases enable row level security;

create index if not exists angelcare360_area12_relationship_cases_school_idx on public.angelcare360_area12_relationship_cases(school_id);

create index if not exists angelcare360_area12_relationship_cases_family_idx on public.angelcare360_area12_relationship_cases(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_relationship_cases_status_idx on public.angelcare360_area12_relationship_cases(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_relationship_cases from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_relationship_cases to service_role;

create table if not exists public.angelcare360_area12_parent_requests (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_parent_requests enable row level security;

create index if not exists angelcare360_area12_parent_requests_school_idx on public.angelcare360_area12_parent_requests(school_id);

create index if not exists angelcare360_area12_parent_requests_family_idx on public.angelcare360_area12_parent_requests(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_parent_requests_status_idx on public.angelcare360_area12_parent_requests(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_parent_requests from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_parent_requests to service_role;

create table if not exists public.angelcare360_area12_communication_links (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_communication_links enable row level security;

create index if not exists angelcare360_area12_communication_links_school_idx on public.angelcare360_area12_communication_links(school_id);

create index if not exists angelcare360_area12_communication_links_family_idx on public.angelcare360_area12_communication_links(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_communication_links_status_idx on public.angelcare360_area12_communication_links(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_communication_links from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_communication_links to service_role;

create table if not exists public.angelcare360_area12_meetings (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_meetings enable row level security;

create index if not exists angelcare360_area12_meetings_school_idx on public.angelcare360_area12_meetings(school_id);

create index if not exists angelcare360_area12_meetings_family_idx on public.angelcare360_area12_meetings(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_meetings_status_idx on public.angelcare360_area12_meetings(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_meetings from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_meetings to service_role;

create table if not exists public.angelcare360_area12_commitments (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_commitments enable row level security;

create index if not exists angelcare360_area12_commitments_school_idx on public.angelcare360_area12_commitments(school_id);

create index if not exists angelcare360_area12_commitments_family_idx on public.angelcare360_area12_commitments(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_commitments_status_idx on public.angelcare360_area12_commitments(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_commitments from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_commitments to service_role;

create table if not exists public.angelcare360_area12_complaints (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_complaints enable row level security;

create index if not exists angelcare360_area12_complaints_school_idx on public.angelcare360_area12_complaints(school_id);

create index if not exists angelcare360_area12_complaints_family_idx on public.angelcare360_area12_complaints(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_complaints_status_idx on public.angelcare360_area12_complaints(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_complaints from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_complaints to service_role;

create table if not exists public.angelcare360_area12_service_recoveries (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_service_recoveries enable row level security;

create index if not exists angelcare360_area12_service_recoveries_school_idx on public.angelcare360_area12_service_recoveries(school_id);

create index if not exists angelcare360_area12_service_recoveries_family_idx on public.angelcare360_area12_service_recoveries(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_service_recoveries_status_idx on public.angelcare360_area12_service_recoveries(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_service_recoveries from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_service_recoveries to service_role;

create table if not exists public.angelcare360_area12_satisfaction_campaigns (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_satisfaction_campaigns enable row level security;

create index if not exists angelcare360_area12_satisfaction_campaigns_school_idx on public.angelcare360_area12_satisfaction_campaigns(school_id);

create index if not exists angelcare360_area12_satisfaction_campaigns_family_idx on public.angelcare360_area12_satisfaction_campaigns(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_satisfaction_campaigns_status_idx on public.angelcare360_area12_satisfaction_campaigns(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_satisfaction_campaigns from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_satisfaction_campaigns to service_role;

create table if not exists public.angelcare360_area12_satisfaction_responses (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_satisfaction_responses enable row level security;

create index if not exists angelcare360_area12_satisfaction_responses_school_idx on public.angelcare360_area12_satisfaction_responses(school_id);

create index if not exists angelcare360_area12_satisfaction_responses_family_idx on public.angelcare360_area12_satisfaction_responses(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_satisfaction_responses_status_idx on public.angelcare360_area12_satisfaction_responses(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_satisfaction_responses from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_satisfaction_responses to service_role;

create table if not exists public.angelcare360_area12_attention_cases (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_attention_cases enable row level security;

create index if not exists angelcare360_area12_attention_cases_school_idx on public.angelcare360_area12_attention_cases(school_id);

create index if not exists angelcare360_area12_attention_cases_family_idx on public.angelcare360_area12_attention_cases(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_attention_cases_status_idx on public.angelcare360_area12_attention_cases(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_attention_cases from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_attention_cases to service_role;

create table if not exists public.angelcare360_area12_renewal_cases (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_renewal_cases enable row level security;

create index if not exists angelcare360_area12_renewal_cases_school_idx on public.angelcare360_area12_renewal_cases(school_id);

create index if not exists angelcare360_area12_renewal_cases_family_idx on public.angelcare360_area12_renewal_cases(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_renewal_cases_status_idx on public.angelcare360_area12_renewal_cases(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_renewal_cases from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_renewal_cases to service_role;

create table if not exists public.angelcare360_area12_departure_cases (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_departure_cases enable row level security;

create index if not exists angelcare360_area12_departure_cases_school_idx on public.angelcare360_area12_departure_cases(school_id);

create index if not exists angelcare360_area12_departure_cases_family_idx on public.angelcare360_area12_departure_cases(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_departure_cases_status_idx on public.angelcare360_area12_departure_cases(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_departure_cases from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_departure_cases to service_role;

create table if not exists public.angelcare360_area12_feedback (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_feedback enable row level security;

create index if not exists angelcare360_area12_feedback_school_idx on public.angelcare360_area12_feedback(school_id);

create index if not exists angelcare360_area12_feedback_family_idx on public.angelcare360_area12_feedback(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_feedback_status_idx on public.angelcare360_area12_feedback(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_feedback from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_feedback to service_role;

create table if not exists public.angelcare360_area12_handoffs (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_handoffs enable row level security;

create index if not exists angelcare360_area12_handoffs_school_idx on public.angelcare360_area12_handoffs(school_id);

create index if not exists angelcare360_area12_handoffs_family_idx on public.angelcare360_area12_handoffs(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_handoffs_status_idx on public.angelcare360_area12_handoffs(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_handoffs from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_handoffs to service_role;

create table if not exists public.angelcare360_area12_tasks (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_tasks enable row level security;

create index if not exists angelcare360_area12_tasks_school_idx on public.angelcare360_area12_tasks(school_id);

create index if not exists angelcare360_area12_tasks_family_idx on public.angelcare360_area12_tasks(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_tasks_status_idx on public.angelcare360_area12_tasks(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_tasks from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_tasks to service_role;

create table if not exists public.angelcare360_area12_notes (id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, parent_id uuid, student_id uuid, title text, description text, status text not null default 'open', priority text not null default 'normal', owner_user_id uuid, due_at timestamptz, next_action text, deep_link text, metadata jsonb not null default '{}'::jsonb, resolved_at timestamptz, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table public.angelcare360_area12_notes enable row level security;

create index if not exists angelcare360_area12_notes_school_idx on public.angelcare360_area12_notes(school_id);

create index if not exists angelcare360_area12_notes_family_idx on public.angelcare360_area12_notes(school_id,family_id) where family_id is not null;

create index if not exists angelcare360_area12_notes_status_idx on public.angelcare360_area12_notes(school_id,status,updated_at desc);

revoke all on public.angelcare360_area12_notes from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_notes to service_role;

create table if not exists public.angelcare360_area12_action_receipts (id uuid primary key default gen_random_uuid(), school_id uuid not null, operation_key text not null, idempotency_key text not null, subject_kind text not null, subject_id uuid not null, actor_user_id uuid, result_json jsonb not null default '{}'::jsonb, status text not null default 'completed', created_at timestamptz not null default now(), unique(school_id,operation_key,idempotency_key));

alter table public.angelcare360_area12_action_receipts enable row level security;

create index if not exists angelcare360_area12_action_receipts_school_idx on public.angelcare360_area12_action_receipts(school_id);

revoke all on public.angelcare360_area12_action_receipts from anon, authenticated;

grant select,insert,update,delete on public.angelcare360_area12_action_receipts to service_role;

insert into public.angelcare360_operator_product_operations(operation_key,route_path,feature_key,operation_name,permission_key,audit_event,mutation_endpoints,source_confidence,status,updated_at) values
('parent_request.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · view','parents.view','angelcare360.parent_relationship.parent_request.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.view_sensitive','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · view sensitive','parents.view','angelcare360.parent_relationship.parent_request.view_sensitive',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · create','parents.update','angelcare360.parent_relationship.parent_request.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.assign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · assign','parents.update','angelcare360.parent_relationship.parent_request.assign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.acknowledge','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · acknowledge','parents.update','angelcare360.parent_relationship.parent_request.acknowledge',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.respond','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · respond','parents.update','angelcare360.parent_relationship.parent_request.respond',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.request_information','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · request information','parents.update','angelcare360.parent_relationship.parent_request.request_information',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.wait_family','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · wait family','parents.update','angelcare360.parent_relationship.parent_request.wait_family',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.wait_team','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · wait team','parents.update','angelcare360.parent_relationship.parent_request.wait_team',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.prepare_response','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · prepare response','parents.update','angelcare360.parent_relationship.parent_request.prepare_response',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.resolve','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · resolve','parents.update','angelcare360.parent_relationship.parent_request.resolve',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.verify_resolution','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · verify resolution','parents.update','angelcare360.parent_relationship.parent_request.verify_resolution',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.close','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · close','parents.update','angelcare360.parent_relationship.parent_request.close',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · reopen','parents.update','angelcare360.parent_relationship.parent_request.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.escalate','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · escalate','parents.update','angelcare360.parent_relationship.parent_request.escalate',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_request.link_source','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent request · link source','parents.update','angelcare360.parent_relationship.parent_request.link_source',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · view','parents.view','angelcare360.parent_relationship.parent_communication.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.view_sensitive','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · view sensitive','parents.view','angelcare360.parent_relationship.parent_communication.view_sensitive',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.prepare','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · prepare','parents.update','angelcare360.parent_relationship.parent_communication.prepare',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.send','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · send','parents.update','angelcare360.parent_relationship.parent_communication.send',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.record_inbound','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · record inbound','parents.update','angelcare360.parent_relationship.parent_communication.record_inbound',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.record_outbound','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · record outbound','parents.update','angelcare360.parent_relationship.parent_communication.record_outbound',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.link_matter','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · link matter','parents.update','angelcare360.parent_relationship.parent_communication.link_matter',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.acknowledge','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · acknowledge','parents.update','angelcare360.parent_relationship.parent_communication.acknowledge',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.request_acknowledgement','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · request acknowledgement','parents.update','angelcare360.parent_relationship.parent_communication.request_acknowledgement',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_communication.mark_unreachable','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent communication · mark unreachable','parents.update','angelcare360.parent_relationship.parent_communication.mark_unreachable',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · view','parents.view','angelcare360.parent_relationship.parent_meeting.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · create','parents.update','angelcare360.parent_relationship.parent_meeting.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.confirm','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · confirm','parents.update','angelcare360.parent_relationship.parent_meeting.confirm',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.reschedule','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · reschedule','parents.update','angelcare360.parent_relationship.parent_meeting.reschedule',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.prepare','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · prepare','parents.update','angelcare360.parent_relationship.parent_meeting.prepare',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.add_agenda','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · add agenda','parents.update','angelcare360.parent_relationship.parent_meeting.add_agenda',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.record_outcome','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · record outcome','parents.update','angelcare360.parent_relationship.parent_meeting.record_outcome',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.create_followup','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · create followup','parents.update','angelcare360.parent_relationship.parent_meeting.create_followup',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.cancel','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · cancel','parents.update','angelcare360.parent_relationship.parent_meeting.cancel',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_meeting.record_no_show','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent meeting · record no show','parents.update','angelcare360.parent_relationship.parent_meeting.record_no_show',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · view','parents.view','angelcare360.parent_relationship.parent_commitment.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · create','parents.update','angelcare360.parent_relationship.parent_commitment.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.assign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · assign','parents.update','angelcare360.parent_relationship.parent_commitment.assign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.update','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · update','parents.update','angelcare360.parent_relationship.parent_commitment.update',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.complete','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · complete','parents.update','angelcare360.parent_relationship.parent_commitment.complete',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.verify','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · verify','parents.update','angelcare360.parent_relationship.parent_commitment.verify',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.mark_waiting','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · mark waiting','parents.update','angelcare360.parent_relationship.parent_commitment.mark_waiting',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.mark_impossible','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · mark impossible','parents.update','angelcare360.parent_relationship.parent_commitment.mark_impossible',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.cancel','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · cancel','parents.update','angelcare360.parent_relationship.parent_commitment.cancel',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · reopen','parents.update','angelcare360.parent_relationship.parent_commitment.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_commitment.escalate','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent commitment · escalate','parents.update','angelcare360.parent_relationship.parent_commitment.escalate',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · view','parents.view','angelcare360.parent_relationship.parent_complaint.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.view_sensitive','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · view sensitive','parents.view','angelcare360.parent_relationship.parent_complaint.view_sensitive',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · create','parents.update','angelcare360.parent_relationship.parent_complaint.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.acknowledge','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · acknowledge','parents.update','angelcare360.parent_relationship.parent_complaint.acknowledge',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.qualify','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · qualify','parents.update','angelcare360.parent_relationship.parent_complaint.qualify',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.assign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · assign','parents.update','angelcare360.parent_relationship.parent_complaint.assign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.add_evidence','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · add evidence','parents.update','angelcare360.parent_relationship.parent_complaint.add_evidence',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.request_information','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · request information','parents.update','angelcare360.parent_relationship.parent_complaint.request_information',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.escalate','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · escalate','parents.update','angelcare360.parent_relationship.parent_complaint.escalate',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.add_observation','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · add observation','parents.update','angelcare360.parent_relationship.parent_complaint.add_observation',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.prepare_resolution','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · prepare resolution','parents.update','angelcare360.parent_relationship.parent_complaint.prepare_resolution',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.request_approval','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · request approval','parents.update','angelcare360.parent_relationship.parent_complaint.request_approval',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.approve_resolution','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · approve resolution','parents.update','angelcare360.parent_relationship.parent_complaint.approve_resolution',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.resolve','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · resolve','parents.update','angelcare360.parent_relationship.parent_complaint.resolve',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.confirm_resolution','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · confirm resolution','parents.update','angelcare360.parent_relationship.parent_complaint.confirm_resolution',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.close','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · close','parents.update','angelcare360.parent_relationship.parent_complaint.close',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_complaint.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent complaint · reopen','parents.update','angelcare360.parent_relationship.parent_complaint.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · view','parents.view','angelcare360.parent_relationship.service_recovery.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · create','parents.update','angelcare360.parent_relationship.service_recovery.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.assign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · assign','parents.update','angelcare360.parent_relationship.service_recovery.assign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.add_action','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · add action','parents.update','angelcare360.parent_relationship.service_recovery.add_action',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.complete_action','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · complete action','parents.update','angelcare360.parent_relationship.service_recovery.complete_action',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.prepare_response','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · prepare response','parents.update','angelcare360.parent_relationship.service_recovery.prepare_response',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.complete','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · complete','parents.update','angelcare360.parent_relationship.service_recovery.complete',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.verify','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · verify','parents.update','angelcare360.parent_relationship.service_recovery.verify',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('service_recovery.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','service recovery · reopen','parents.update','angelcare360.parent_relationship.service_recovery.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · view','parents.view','angelcare360.parent_relationship.parent_satisfaction.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.create_campaign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · create campaign','parents.update','angelcare360.parent_relationship.parent_satisfaction.create_campaign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.send','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · send','parents.update','angelcare360.parent_relationship.parent_satisfaction.send',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.record_response','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · record response','parents.update','angelcare360.parent_relationship.parent_satisfaction.record_response',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.request_followup','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · request followup','parents.update','angelcare360.parent_relationship.parent_satisfaction.request_followup',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.assign_followup','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · assign followup','parents.update','angelcare360.parent_relationship.parent_satisfaction.assign_followup',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_satisfaction.complete_followup','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent satisfaction · complete followup','parents.update','angelcare360.parent_relationship.parent_satisfaction.complete_followup',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · view','parents.view','angelcare360.parent_relationship.parent_relationship.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.view_sensitive','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · view sensitive','parents.view','angelcare360.parent_relationship.parent_relationship.view_sensitive',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.create_attention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · create attention','parents.update','angelcare360.parent_relationship.parent_relationship.create_attention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.assign_attention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · assign attention','parents.update','angelcare360.parent_relationship.parent_relationship.assign_attention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.update_attention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · update attention','parents.update','angelcare360.parent_relationship.parent_relationship.update_attention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.resolve_attention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · resolve attention','parents.update','angelcare360.parent_relationship.parent_relationship.resolve_attention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.reopen_attention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · reopen attention','parents.update','angelcare360.parent_relationship.parent_relationship.reopen_attention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_relationship.add_context','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent relationship · add context','parents.update','angelcare360.parent_relationship.parent_relationship.add_context',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · view','parents.view','angelcare360.parent_relationship.parent_renewal.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.prepare','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · prepare','parents.update','angelcare360.parent_relationship.parent_renewal.prepare',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.contact','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · contact','parents.update','angelcare360.parent_relationship.parent_renewal.contact',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.record_intent','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · record intent','parents.update','angelcare360.parent_relationship.parent_renewal.record_intent',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.request_meeting','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · request meeting','parents.update','angelcare360.parent_relationship.parent_renewal.request_meeting',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.record_condition','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · record condition','parents.update','angelcare360.parent_relationship.parent_renewal.record_condition',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.confirm_relationship','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · confirm relationship','parents.update','angelcare360.parent_relationship.parent_renewal.confirm_relationship',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.defer','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · defer','parents.update','angelcare360.parent_relationship.parent_renewal.defer',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.mark_not_renewing','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · mark not renewing','parents.update','angelcare360.parent_relationship.parent_renewal.mark_not_renewing',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.handover','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · handover','parents.update','angelcare360.parent_relationship.parent_renewal.handover',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_renewal.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent renewal · reopen','parents.update','angelcare360.parent_relationship.parent_renewal.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · view','parents.view','angelcare360.parent_relationship.parent_departure.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.create_case','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · create case','parents.update','angelcare360.parent_relationship.parent_departure.create_case',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.record_reason','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · record reason','parents.update','angelcare360.parent_relationship.parent_departure.record_reason',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.request_intervention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · request intervention','parents.update','angelcare360.parent_relationship.parent_departure.request_intervention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.record_intervention','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · record intervention','parents.update','angelcare360.parent_relationship.parent_departure.record_intervention',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.prepare_handover','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · prepare handover','parents.update','angelcare360.parent_relationship.parent_departure.prepare_handover',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.confirm','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · confirm','parents.update','angelcare360.parent_relationship.parent_departure.confirm',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.handover','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · handover','parents.update','angelcare360.parent_relationship.parent_departure.handover',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.cancel','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · cancel','parents.update','angelcare360.parent_relationship.parent_departure.cancel',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_departure.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent departure · reopen','parents.update','angelcare360.parent_relationship.parent_departure.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · view','parents.view','angelcare360.parent_relationship.parent_feedback.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · create','parents.update','angelcare360.parent_relationship.parent_feedback.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.review','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · review','parents.update','angelcare360.parent_relationship.parent_feedback.review',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.assign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · assign','parents.update','angelcare360.parent_relationship.parent_feedback.assign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.convert_action','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · convert action','parents.update','angelcare360.parent_relationship.parent_feedback.convert_action',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.acknowledge','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · acknowledge','parents.update','angelcare360.parent_relationship.parent_feedback.acknowledge',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_feedback.close','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent feedback · close','parents.update','angelcare360.parent_relationship.parent_feedback.close',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_handoff.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent handoff · view','parents.view','angelcare360.parent_relationship.parent_handoff.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_handoff.create','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent handoff · create','parents.update','angelcare360.parent_relationship.parent_handoff.create',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_handoff.accept','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent handoff · accept','parents.update','angelcare360.parent_relationship.parent_handoff.accept',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_handoff.return','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent handoff · return','parents.update','angelcare360.parent_relationship.parent_handoff.return',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_handoff.complete','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent handoff · complete','parents.update','angelcare360.parent_relationship.parent_handoff.complete',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_handoff.escalate','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent handoff · escalate','parents.update','angelcare360.parent_relationship.parent_handoff.escalate',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_task.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent task · view','parents.view','angelcare360.parent_relationship.parent_task.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_task.assign','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent task · assign','parents.update','angelcare360.parent_relationship.parent_task.assign',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_task.complete','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent task · complete','parents.update','angelcare360.parent_relationship.parent_task.complete',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_task.reopen','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent task · reopen','parents.update','angelcare360.parent_relationship.parent_task.reopen',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_note.add','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent note · add','parents.update','angelcare360.parent_relationship.parent_note.add',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_evidence.request','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent evidence · request','parents.update','angelcare360.parent_relationship.parent_evidence.request',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_history.view','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent history · view','parents.view','angelcare360.parent_relationship.parent_history.view',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now()),
('parent_topup.request','/angelcare-360-command-center/relation-parents','parent-relationship.area12','parent topup · request','parents.update','angelcare360.parent_relationship.parent_topup.request',to_jsonb(ARRAY['/api/angelcare360/parent-relationship/area12']::text[]),'area12-contract','published',now())
on conflict (operation_key) do update set route_path=excluded.route_path,feature_key=excluded.feature_key,operation_name=excluded.operation_name,permission_key=excluded.permission_key,audit_event=excluded.audit_event,mutation_endpoints=excluded.mutation_endpoints,source_confidence=excluded.source_confidence,status=excluded.status,updated_at=now();

commit;

notify pgrst, 'reload schema';

select 'AREA 12 PARENT RELATIONSHIP APPLIED' as result, 17 as protected_area12_tables, 130 as canonical_operations, 'UNTOUCHED' as authentication_and_global_sessions, 'REQUESTED_AFTER_COMMIT' as postgrest_schema_reload;
