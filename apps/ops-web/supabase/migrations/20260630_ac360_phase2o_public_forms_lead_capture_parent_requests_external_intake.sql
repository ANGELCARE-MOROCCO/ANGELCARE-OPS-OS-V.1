-- AngelCare 360 Phase 2O - Public Forms, Lead Capture, Parent Requests & External Intake Runtime
-- Ref: AC360-PH2O-PUBLIC-FORMS-LEAD-CAPTURE-PARENT-REQUESTS-EXTERNAL-INTAKE-2026-06-30
-- Scope: backend/system-only public intake runtime.
-- Strict rule: no forms/intake/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2N school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Public forms, external intake, parent requests and lead capture tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_intake_forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid,
  form_key text not null,
  title text not null,
  form_type text not null default 'admission',
  audience_type text not null default 'parents',
  status text not null default 'draft',
  public_slug text,
  public_token text not null default encode(gen_random_bytes(16), 'hex'),
  language text not null default 'fr',
  intro_text text,
  success_message text,
  settings_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, form_key),
  unique(org_id, public_slug),
  check (form_type in ('admission','parent_request','absence_request','document_collection','complaint','appointment','payment_promise','survey','event_registration','custom')),
  check (audience_type in ('parents','prospects','staff','public','partners','custom')),
  check (status in ('draft','published','paused','archived')),
  check (language in ('fr','ar','en','mixed'))
);

create table if not exists public.ac360_school_intake_form_fields (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  form_id uuid not null references public.ac360_school_intake_forms(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text',
  required boolean not null default false,
  sort_order integer not null default 100,
  options_json jsonb not null default '[]'::jsonb,
  validation_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(form_id, field_key),
  check (field_type in ('text','textarea','email','phone','number','date','select','multi_select','checkbox','file','consent','hidden','custom'))
);

create table if not exists public.ac360_school_external_intake_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  source_key text not null,
  label text not null,
  source_type text not null default 'website',
  status text not null default 'active',
  endpoint_token text not null default encode(gen_random_bytes(18), 'hex'),
  allowed_origins text[] not null default '{}',
  mapping_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, source_key),
  check (source_type in ('website','landing_page','facebook','instagram','google_forms','whatsapp','api','partner','import','custom')),
  check (status in ('active','paused','draft','archived'))
);

create table if not exists public.ac360_school_intake_mappings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  source_id uuid references public.ac360_school_external_intake_sources(id) on delete cascade,
  form_id uuid references public.ac360_school_intake_forms(id) on delete set null,
  mapping_key text not null,
  target_module text not null default 'admissions',
  target_action text not null default 'lead_create',
  field_map_json jsonb not null default '{}'::jsonb,
  default_values_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, mapping_key),
  check (target_module in ('admissions','parenttrust','communication','documents','finance','hr','operations','custom')),
  check (status in ('active','paused','draft','archived'))
);

create table if not exists public.ac360_school_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid,
  form_id uuid references public.ac360_school_intake_forms(id) on delete set null,
  source_id uuid references public.ac360_school_external_intake_sources(id) on delete set null,
  submission_key text not null,
  submission_type text not null default 'form',
  status text not null default 'received',
  parent_name text,
  parent_phone text,
  parent_email text,
  child_name text,
  payload_json jsonb not null default '{}'::jsonb,
  normalized_json jsonb not null default '{}'::jsonb,
  consent_json jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  processed_at timestamptz,
  linked_entity_type text,
  linked_entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, submission_key),
  check (submission_type in ('form','webhook','import','manual','public_api','custom')),
  check (status in ('received','validated','processing','converted','rejected','duplicate','archived'))
);

create table if not exists public.ac360_school_intake_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  submission_id uuid references public.ac360_school_intake_submissions(id) on delete cascade,
  event_type text not null,
  severity text not null default 'info',
  message text,
  actor_app_user_id uuid,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('info','warning','critical'))
);

create table if not exists public.ac360_school_parent_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid,
  submission_id uuid references public.ac360_school_intake_submissions(id) on delete set null,
  student_id uuid,
  guardian_id uuid,
  request_key text not null,
  request_type text not null default 'general',
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'open',
  due_at timestamptz,
  assigned_to uuid,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, request_key),
  check (request_type in ('absence','document','appointment','payment','complaint','pickup','medical','transport','admission','general','custom')),
  check (priority in ('low','medium','high','critical')),
  check (status in ('open','in_review','waiting_parent','approved','rejected','resolved','cancelled','archived'))
);

create table if not exists public.ac360_school_parent_request_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  parent_request_id uuid not null references public.ac360_school_parent_requests(id) on delete cascade,
  event_type text not null,
  previous_status text,
  next_status text,
  note text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_school_lead_capture_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  submission_id uuid references public.ac360_school_intake_submissions(id) on delete set null,
  mapping_id uuid references public.ac360_school_intake_mappings(id) on delete set null,
  event_key text not null,
  action_taken text not null default 'captured',
  target_module text not null default 'admissions',
  target_entity_type text,
  target_entity_id uuid,
  status text not null default 'completed',
  result_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, event_key),
  check (action_taken in ('captured','converted_to_lead','created_request','flagged_duplicate','rejected','queued_review','custom')),
  check (status in ('completed','failed','queued','skipped','archived'))
);

create table if not exists public.ac360_school_intake_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  published_forms integer not null default 0,
  active_sources integer not null default 0,
  received_submissions integer not null default 0,
  unprocessed_submissions integer not null default 0,
  converted_submissions integer not null default 0,
  open_parent_requests integer not null default 0,
  critical_parent_requests integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

create table if not exists public.ac360_school_intake_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  alert_type text not null,
  severity text not null default 'warning',
  title text not null,
  message text,
  status text not null default 'open',
  linked_entity_type text,
  linked_entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  unique(org_id, alert_key),
  check (severity in ('info','warning','critical')),
  check (status in ('open','resolved','dismissed','archived'))
);

create index if not exists idx_ac360_intake_forms_org_status on public.ac360_school_intake_forms(org_id,status);
create index if not exists idx_ac360_intake_submissions_org_status on public.ac360_school_intake_submissions(org_id,status,created_at desc);
create index if not exists idx_ac360_parent_requests_org_status on public.ac360_school_parent_requests(org_id,status,priority);
create index if not exists idx_ac360_intake_alerts_org_status on public.ac360_school_intake_alerts(org_id,status,severity);

-- -----------------------------------------------------------------------------
-- 2. Runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_intake_dashboard(p_org_id uuid, p_as_of_date date default current_date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_forms int; v_sources int; v_received int; v_unprocessed int; v_converted int; v_requests int; v_critical int; v_alerts int; v_snapshot public.ac360_school_intake_snapshots%rowtype;
begin
  select count(*) into v_forms from public.ac360_school_intake_forms where org_id=p_org_id and status='published';
  select count(*) into v_sources from public.ac360_school_external_intake_sources where org_id=p_org_id and status='active';
  select count(*) into v_received from public.ac360_school_intake_submissions where org_id=p_org_id and created_at::date=coalesce(p_as_of_date,current_date);
  select count(*) into v_unprocessed from public.ac360_school_intake_submissions where org_id=p_org_id and status in ('received','validated','processing');
  select count(*) into v_converted from public.ac360_school_intake_submissions where org_id=p_org_id and status='converted';
  select count(*) into v_requests from public.ac360_school_parent_requests where org_id=p_org_id and status in ('open','in_review','waiting_parent');
  select count(*) into v_critical from public.ac360_school_parent_requests where org_id=p_org_id and status in ('open','in_review','waiting_parent') and priority='critical';
  select count(*) into v_alerts from public.ac360_school_intake_alerts where org_id=p_org_id and status='open';

  insert into public.ac360_school_intake_snapshots(org_id,snapshot_date,published_forms,active_sources,received_submissions,unprocessed_submissions,converted_submissions,open_parent_requests,critical_parent_requests,metadata_json)
  values(p_org_id,coalesce(p_as_of_date,current_date),v_forms,v_sources,v_received,v_unprocessed,v_converted,v_requests,v_critical,jsonb_build_object('open_alerts',v_alerts,'phase','phase_2o'))
  on conflict(org_id,snapshot_date) do update set published_forms=excluded.published_forms,active_sources=excluded.active_sources,received_submissions=excluded.received_submissions,unprocessed_submissions=excluded.unprocessed_submissions,converted_submissions=excluded.converted_submissions,open_parent_requests=excluded.open_parent_requests,critical_parent_requests=excluded.critical_parent_requests,metadata_json=public.ac360_school_intake_snapshots.metadata_json||excluded.metadata_json,created_at=now()
  returning * into v_snapshot;

  return jsonb_build_object('ok',true,'snapshot',to_jsonb(v_snapshot),'open_alerts',v_alerts);
end $$;

create or replace function public.ac360_school_upsert_intake_form(p_org_id uuid,p_form_id uuid default null,p_form_key text default null,p_title text default null,p_form_type text default 'admission',p_audience_type text default 'parents',p_public_slug text default null,p_language text default 'fr',p_intro_text text default null,p_success_message text default null,p_settings_json jsonb default '{}'::jsonb,p_fields_json jsonb default '[]'::jsonb,p_status text default 'draft',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_form public.ac360_school_intake_forms%rowtype; v_field jsonb;
begin
  if p_form_id is not null then
    update public.ac360_school_intake_forms set form_key=coalesce(nullif(p_form_key,''),form_key), title=coalesce(nullif(p_title,''),title), form_type=coalesce(nullif(p_form_type,''),form_type), audience_type=coalesce(nullif(p_audience_type,''),audience_type), public_slug=coalesce(nullif(p_public_slug,''),public_slug), language=coalesce(nullif(p_language,''),language), intro_text=p_intro_text, success_message=p_success_message, settings_json=coalesce(p_settings_json,'{}'::jsonb), status=coalesce(nullif(p_status,''),status), metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_form_id and org_id=p_org_id returning * into v_form;
  end if;
  if v_form.id is null then
    insert into public.ac360_school_intake_forms(org_id,form_key,title,form_type,audience_type,public_slug,language,intro_text,success_message,settings_json,status,created_by,metadata_json)
    values(p_org_id,coalesce(nullif(p_form_key,''),'form-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_title,''),'Untitled Intake Form'),coalesce(nullif(p_form_type,''),'admission'),coalesce(nullif(p_audience_type,''),'parents'),nullif(p_public_slug,''),coalesce(nullif(p_language,''),'fr'),p_intro_text,p_success_message,coalesce(p_settings_json,'{}'::jsonb),coalesce(nullif(p_status,''),'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_form;
  end if;
  if jsonb_typeof(coalesce(p_fields_json,'[]'::jsonb))='array' then
    for v_field in select * from jsonb_array_elements(p_fields_json) loop
      insert into public.ac360_school_intake_form_fields(org_id,form_id,field_key,label,field_type,required,sort_order,options_json,validation_json,metadata_json)
      values(p_org_id,v_form.id,coalesce(v_field->>'field_key',v_field->>'key','field_'||substr(gen_random_uuid()::text,1,6)),coalesce(v_field->>'label','Field'),coalesce(v_field->>'field_type',v_field->>'type','text'),coalesce((v_field->>'required')::boolean,false),coalesce((v_field->>'sort_order')::int,100),coalesce(v_field->'options','[]'::jsonb),coalesce(v_field->'validation','{}'::jsonb),coalesce(v_field->'metadata','{}'::jsonb))
      on conflict(form_id,field_key) do update set label=excluded.label,field_type=excluded.field_type,required=excluded.required,sort_order=excluded.sort_order,options_json=excluded.options_json,validation_json=excluded.validation_json,metadata_json=public.ac360_school_intake_form_fields.metadata_json||excluded.metadata_json,updated_at=now();
    end loop;
  end if;
  return jsonb_build_object('ok',true,'form',to_jsonb(v_form));
end $$;

create or replace function public.ac360_school_publish_intake_form(p_org_id uuid,p_form_id uuid,p_status text default 'published',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_form public.ac360_school_intake_forms%rowtype;
begin
  update public.ac360_school_intake_forms set status=coalesce(nullif(p_status,''),'published'), published_at=case when coalesce(nullif(p_status,''),'published')='published' then coalesce(published_at,now()) else published_at end, metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_form_id and org_id=p_org_id returning * into v_form;
  return jsonb_build_object('ok',v_form.id is not null,'form',to_jsonb(v_form));
end $$;

create or replace function public.ac360_school_create_intake_submission(p_org_id uuid,p_form_id uuid default null,p_source_id uuid default null,p_submission_key text default null,p_submission_type text default 'form',p_parent_name text default null,p_parent_phone text default null,p_parent_email text default null,p_child_name text default null,p_payload_json jsonb default '{}'::jsonb,p_normalized_json jsonb default '{}'::jsonb,p_consent_json jsonb default '{}'::jsonb,p_ip_address text default null,p_user_agent text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sub public.ac360_school_intake_submissions%rowtype; v_alert public.ac360_school_intake_alerts%rowtype;
begin
  insert into public.ac360_school_intake_submissions(org_id,form_id,source_id,submission_key,submission_type,parent_name,parent_phone,parent_email,child_name,payload_json,normalized_json,consent_json,ip_address,user_agent,metadata_json)
  values(p_org_id,p_form_id,p_source_id,coalesce(nullif(p_submission_key,''),'submission-'||substr(gen_random_uuid()::text,1,10)),coalesce(nullif(p_submission_type,''),'form'),p_parent_name,p_parent_phone,p_parent_email,p_child_name,coalesce(p_payload_json,'{}'::jsonb),coalesce(p_normalized_json,'{}'::jsonb),coalesce(p_consent_json,'{}'::jsonb),p_ip_address,p_user_agent,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,submission_key) do update set payload_json=excluded.payload_json,normalized_json=excluded.normalized_json,metadata_json=public.ac360_school_intake_submissions.metadata_json||excluded.metadata_json,updated_at=now() returning * into v_sub;
  insert into public.ac360_school_intake_events(org_id,submission_id,event_type,severity,message,payload_json) values(p_org_id,v_sub.id,'submission.received','info','External intake submission received.',coalesce(p_payload_json,'{}'::jsonb));
  return jsonb_build_object('ok',true,'submission',to_jsonb(v_sub));
end $$;

create or replace function public.ac360_school_update_intake_submission_status(p_org_id uuid,p_submission_id uuid,p_status text,p_linked_entity_type text default null,p_linked_entity_id uuid default null,p_actor_app_user_id uuid default null,p_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sub public.ac360_school_intake_submissions%rowtype;
begin
  update public.ac360_school_intake_submissions set status=coalesce(nullif(p_status,''),status), linked_entity_type=coalesce(p_linked_entity_type,linked_entity_type), linked_entity_id=coalesce(p_linked_entity_id,linked_entity_id), processed_at=case when coalesce(nullif(p_status,''),status) in ('converted','rejected','duplicate','archived') then now() else processed_at end, metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_submission_id and org_id=p_org_id returning * into v_sub;
  if v_sub.id is not null then insert into public.ac360_school_intake_events(org_id,submission_id,event_type,severity,message,actor_app_user_id,payload_json) values(p_org_id,v_sub.id,'submission.status.'||v_sub.status,'info',p_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)); end if;
  return jsonb_build_object('ok',v_sub.id is not null,'submission',to_jsonb(v_sub));
end $$;

create or replace function public.ac360_school_process_lead_capture(p_org_id uuid,p_submission_id uuid,p_mapping_id uuid default null,p_action_taken text default 'captured',p_target_entity_type text default null,p_target_entity_id uuid default null,p_actor_app_user_id uuid default null,p_result_json jsonb default '{}'::jsonb,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event public.ac360_school_lead_capture_events%rowtype; v_key text;
begin
  v_key := 'lead-capture-'||coalesce(p_submission_id::text,substr(gen_random_uuid()::text,1,8))||'-'||substr(gen_random_uuid()::text,1,6);
  insert into public.ac360_school_lead_capture_events(org_id,submission_id,mapping_id,event_key,action_taken,target_entity_type,target_entity_id,result_json,metadata_json)
  values(p_org_id,p_submission_id,p_mapping_id,v_key,coalesce(nullif(p_action_taken,''),'captured'),p_target_entity_type,p_target_entity_id,coalesce(p_result_json,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb)) returning * into v_event;
  update public.ac360_school_intake_submissions set status=case when p_action_taken in ('converted_to_lead','created_request') then 'converted' when p_action_taken='flagged_duplicate' then 'duplicate' when p_action_taken='rejected' then 'rejected' else status end, linked_entity_type=coalesce(p_target_entity_type,linked_entity_type), linked_entity_id=coalesce(p_target_entity_id,linked_entity_id), processed_at=now(), updated_at=now() where id=p_submission_id and org_id=p_org_id;
  return jsonb_build_object('ok',true,'lead_capture_event',to_jsonb(v_event));
end $$;

create or replace function public.ac360_school_create_parent_request(p_org_id uuid,p_submission_id uuid default null,p_student_id uuid default null,p_guardian_id uuid default null,p_request_key text default null,p_request_type text default 'general',p_title text default null,p_description text default null,p_priority text default 'medium',p_due_at timestamptz default null,p_assigned_to uuid default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_request public.ac360_school_parent_requests%rowtype;
begin
  insert into public.ac360_school_parent_requests(org_id,submission_id,student_id,guardian_id,request_key,request_type,title,description,priority,due_at,assigned_to,created_by,metadata_json)
  values(p_org_id,p_submission_id,p_student_id,p_guardian_id,coalesce(nullif(p_request_key,''),'request-'||substr(gen_random_uuid()::text,1,10)),coalesce(nullif(p_request_type,''),'general'),coalesce(nullif(p_title,''),'Parent request'),p_description,coalesce(nullif(p_priority,''),'medium'),p_due_at,p_assigned_to,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_request;
  insert into public.ac360_school_parent_request_events(org_id,parent_request_id,event_type,next_status,note,actor_app_user_id,metadata_json) values(p_org_id,v_request.id,'request.created',v_request.status,p_description,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  if v_request.priority='critical' then
    insert into public.ac360_school_intake_alerts(org_id,alert_key,alert_type,severity,title,message,linked_entity_type,linked_entity_id,metadata_json)
    values(p_org_id,'critical-parent-request-'||v_request.id,'critical_parent_request','critical','Critical parent request',v_request.title,'parent_request',v_request.id,'{}'::jsonb)
    on conflict(org_id,alert_key) do nothing;
  end if;
  return jsonb_build_object('ok',true,'parent_request',to_jsonb(v_request));
end $$;

create or replace function public.ac360_school_update_parent_request_status(p_org_id uuid,p_request_id uuid,p_status text,p_resolution_note text default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_old text; v_request public.ac360_school_parent_requests%rowtype;
begin
  select status into v_old from public.ac360_school_parent_requests where id=p_request_id and org_id=p_org_id;
  update public.ac360_school_parent_requests set status=coalesce(nullif(p_status,''),status), resolution_note=coalesce(p_resolution_note,resolution_note), resolved_at=case when coalesce(nullif(p_status,''),status) in ('approved','rejected','resolved','cancelled','archived') then now() else resolved_at end, metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_request_id and org_id=p_org_id returning * into v_request;
  if v_request.id is not null then insert into public.ac360_school_parent_request_events(org_id,parent_request_id,event_type,previous_status,next_status,note,actor_app_user_id,metadata_json) values(p_org_id,v_request.id,'request.status.update',v_old,v_request.status,p_resolution_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)); end if;
  return jsonb_build_object('ok',v_request.id is not null,'parent_request',to_jsonb(v_request));
end $$;

create or replace function public.ac360_school_upsert_external_intake_source(p_org_id uuid,p_source_id uuid default null,p_source_key text default null,p_label text default null,p_source_type text default 'website',p_allowed_origins text[] default '{}',p_mapping_json jsonb default '{}'::jsonb,p_status text default 'active',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_source public.ac360_school_external_intake_sources%rowtype;
begin
  if p_source_id is not null then
    update public.ac360_school_external_intake_sources set source_key=coalesce(nullif(p_source_key,''),source_key),label=coalesce(nullif(p_label,''),label),source_type=coalesce(nullif(p_source_type,''),source_type),allowed_origins=coalesce(p_allowed_origins,allowed_origins),mapping_json=coalesce(p_mapping_json,'{}'::jsonb),status=coalesce(nullif(p_status,''),status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_source_id and org_id=p_org_id returning * into v_source;
  end if;
  if v_source.id is null then
    insert into public.ac360_school_external_intake_sources(org_id,source_key,label,source_type,allowed_origins,mapping_json,status,created_by,metadata_json)
    values(p_org_id,coalesce(nullif(p_source_key,''),'source-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'External Intake Source'),coalesce(nullif(p_source_type,''),'website'),coalesce(p_allowed_origins,'{}'),coalesce(p_mapping_json,'{}'::jsonb),coalesce(nullif(p_status,''),'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_source;
  end if;
  return jsonb_build_object('ok',true,'source',to_jsonb(v_source));
end $$;

create or replace function public.ac360_school_upsert_intake_mapping(p_org_id uuid,p_mapping_id uuid default null,p_source_id uuid default null,p_form_id uuid default null,p_mapping_key text default null,p_target_module text default 'admissions',p_target_action text default 'lead_create',p_field_map_json jsonb default '{}'::jsonb,p_default_values_json jsonb default '{}'::jsonb,p_status text default 'active',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_mapping public.ac360_school_intake_mappings%rowtype;
begin
  if p_mapping_id is not null then
    update public.ac360_school_intake_mappings set source_id=coalesce(p_source_id,source_id),form_id=coalesce(p_form_id,form_id),mapping_key=coalesce(nullif(p_mapping_key,''),mapping_key),target_module=coalesce(nullif(p_target_module,''),target_module),target_action=coalesce(nullif(p_target_action,''),target_action),field_map_json=coalesce(p_field_map_json,'{}'::jsonb),default_values_json=coalesce(p_default_values_json,'{}'::jsonb),status=coalesce(nullif(p_status,''),status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_mapping_id and org_id=p_org_id returning * into v_mapping;
  end if;
  if v_mapping.id is null then
    insert into public.ac360_school_intake_mappings(org_id,source_id,form_id,mapping_key,target_module,target_action,field_map_json,default_values_json,status,created_by,metadata_json)
    values(p_org_id,p_source_id,p_form_id,coalesce(nullif(p_mapping_key,''),'mapping-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_target_module,''),'admissions'),coalesce(nullif(p_target_action,''),'lead_create'),coalesce(p_field_map_json,'{}'::jsonb),coalesce(p_default_values_json,'{}'::jsonb),coalesce(nullif(p_status,''),'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_mapping;
  end if;
  return jsonb_build_object('ok',true,'mapping',to_jsonb(v_mapping));
end $$;

create or replace function public.ac360_school_reconcile_intake(p_org_id uuid,p_as_of_date date default current_date,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_dash jsonb; v_unprocessed int; v_critical int;
begin
  v_dash := public.ac360_school_intake_dashboard(p_org_id,p_as_of_date);
  v_unprocessed := coalesce((v_dash #>> '{snapshot,unprocessed_submissions}')::int,0);
  v_critical := coalesce((v_dash #>> '{snapshot,critical_parent_requests}')::int,0);
  if v_unprocessed > 10 then
    insert into public.ac360_school_intake_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'unprocessed-intake-'||coalesce(p_as_of_date,current_date),'unprocessed_submissions','warning','Unprocessed intake submissions',v_unprocessed::text || ' intake submission(s) require processing.',jsonb_build_object('count',v_unprocessed))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  if v_critical > 0 then
    insert into public.ac360_school_intake_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'critical-parent-requests-'||coalesce(p_as_of_date,current_date),'critical_parent_requests','critical','Critical parent requests open',v_critical::text || ' critical parent request(s) need immediate response.',jsonb_build_object('count',v_critical))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'dashboard',v_dash,'unprocessed_submissions',v_unprocessed,'critical_parent_requests',v_critical);
end $$;

create or replace function public.ac360_school_resolve_intake_alert(p_org_id uuid,p_alert_id uuid,p_actor_app_user_id uuid default null,p_resolution_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_alert public.ac360_school_intake_alerts%rowtype;
begin
  update public.ac360_school_intake_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('resolution_note',p_resolution_note)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id returning * into v_alert;
  return jsonb_build_object('ok',v_alert.id is not null,'alert',to_jsonb(v_alert));
end $$;

-- -----------------------------------------------------------------------------
-- 3. Billing feature/action registry and route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('public_forms_intake','school_operations','forms_workflows','Public Forms, Lead Capture & Parent Requests','Public forms, external intake sources, parent requests and lead capture processing runtime.','usage',false,true,false,'automation_credit',1,'{"phase":"phase_2o","growthMenu":"public_forms_lead_capture"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,default_meter_key=excluded.default_meter_key,default_credit_cost=excluded.default_credit_cost,metadata_json=public.ac360_feature_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json)
values('public_forms_lead_capture','Public Forms & Lead Capture','forms_workflows','Public admission/request forms, external intake sources, lead capture processing and parent request intake.','monthly',490,0,'module','{"annual_reference_price_mad":4900,"feature_keys":["public_forms_intake"]}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2o","menu":"growth_menu","annual_reference_price_mad":4900,"feature_keys":["public_forms_intake"]}'::jsonb)
on conflict(addon_key) do update set
  label=excluded.label,
  family=excluded.family,
  description=excluded.description,
  billing_model=excluded.billing_model,
  monthly_price_mad=excluded.monthly_price_mad,
  setup_price_mad=excluded.setup_price_mad,
  unit_label=excluded.unit_label,
  included_allowance_json=excluded.included_allowance_json,
  cancellable=excluded.cancellable,
  data_preservation_policy=excluded.data_preservation_policy,
  status=excluded.status,
  metadata_json=public.ac360_addons.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.intake.form.upsert','public_forms_intake','AC360-ENG-52','Upsert public intake form','Create or update a public intake form and fields.','intake.form.upsert',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.form.publish','public_forms_intake','AC360-ENG-52','Publish public intake form','Publish, pause or archive a public intake form.','intake.form.publish',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.submission.create','public_forms_intake','AC360-ENG-33','Create intake submission','Record a public form or external intake submission.','intake.submission.create','automation_credit',1,'require_topup','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.submission.status.update','public_forms_intake','AC360-ENG-52','Update intake submission status','Validate, reject, archive or convert an intake submission.','intake.submission.status.update',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.lead_capture.process','public_forms_intake','AC360-ENG-33','Process lead capture','Process intake submission into lead/request/review pipeline.','intake.lead_capture.process','automation_credit',1,'require_topup','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.parent_request.create','public_forms_intake','AC360-ENG-33','Create parent request','Create a parent request from intake or manual entry.','intake.parent_request.create','automation_credit',1,'require_topup','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.parent_request.status.update','public_forms_intake','AC360-ENG-52','Update parent request status','Update parent request status and resolution.','intake.parent_request.status.update',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.external_source.upsert','public_forms_intake','AC360-ENG-52','Upsert external intake source','Create or update website/API/social intake source.','intake.external_source.upsert',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.mapping.upsert','public_forms_intake','AC360-ENG-52','Upsert intake mapping','Create or update source/form mapping into target module.','intake.mapping.upsert',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.reconcile','public_forms_intake','AC360-ENG-38','Reconcile intake runtime','Refresh intake snapshots and alerts.','intake.reconcile',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb),
('school.intake.alert.resolve','public_forms_intake','AC360-ENG-38','Resolve intake alert','Resolve intake runtime alert.','intake.alert.resolve',null,0,'require_upgrade','{"phase":"phase_2o","suggested_addon_key":"public_forms_lead_capture"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_intake.form.upsert','/api/ac360/school-intake/forms/upsert','POST','school.intake.form.upsert','public_forms_intake','AC360-ENG-52','angelcare_360_school_intake','ac360_school_intake_forms','strict','fixed_1','request_or_generated',null,null,'active','Upserts public intake form.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.form.publish','/api/ac360/school-intake/forms/publish','POST','school.intake.form.publish','public_forms_intake','AC360-ENG-52','angelcare_360_school_intake','ac360_school_intake_forms','strict','fixed_1','request_or_generated',null,null,'active','Publishes public intake form.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.submission.create','/api/ac360/school-intake/submissions/create','POST','school.intake.submission.create','public_forms_intake','AC360-ENG-33','angelcare_360_school_intake','ac360_school_intake_submissions','strict','fixed_1','request_or_generated',null,null,'active','Creates intake submission.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.submission.status','/api/ac360/school-intake/submissions/status','POST','school.intake.submission.status.update','public_forms_intake','AC360-ENG-52','angelcare_360_school_intake','ac360_school_intake_submissions','strict','fixed_1','request_or_generated',null,null,'active','Updates intake submission status.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.lead_capture.process','/api/ac360/school-intake/lead-capture/process','POST','school.intake.lead_capture.process','public_forms_intake','AC360-ENG-33','angelcare_360_school_intake','ac360_school_lead_capture_events','strict','fixed_1','request_or_generated',null,null,'active','Processes lead capture.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.parent_request.create','/api/ac360/school-intake/parent-requests/create','POST','school.intake.parent_request.create','public_forms_intake','AC360-ENG-33','angelcare_360_school_intake','ac360_school_parent_requests','strict','fixed_1','request_or_generated',null,null,'active','Creates parent request.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.parent_request.status','/api/ac360/school-intake/parent-requests/status','POST','school.intake.parent_request.status.update','public_forms_intake','AC360-ENG-52','angelcare_360_school_intake','ac360_school_parent_requests','strict','fixed_1','request_or_generated',null,null,'active','Updates parent request status.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.external_source.upsert','/api/ac360/school-intake/external-sources/upsert','POST','school.intake.external_source.upsert','public_forms_intake','AC360-ENG-52','angelcare_360_school_intake','ac360_school_external_intake_sources','strict','fixed_1','request_or_generated',null,null,'active','Upserts external intake source.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.mapping.upsert','/api/ac360/school-intake/mappings/upsert','POST','school.intake.mapping.upsert','public_forms_intake','AC360-ENG-52','angelcare_360_school_intake','ac360_school_intake_mappings','strict','fixed_1','request_or_generated',null,null,'active','Upserts intake mapping.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.reconcile','/api/ac360/school-intake/reconcile','POST','school.intake.reconcile','public_forms_intake','AC360-ENG-38','angelcare_360_school_intake','ac360_school_intake_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles intake runtime.','{"phase":"phase_2o"}'::jsonb),
('ac360.school_intake.alert.resolve','/api/ac360/school-intake/alerts/resolve','POST','school.intake.alert.resolve','public_forms_intake','AC360-ENG-38','angelcare_360_school_intake','ac360_school_intake_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves intake alert.','{"phase":"phase_2o"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, sort_order, status, phase) values
('phase2o.intake.unprocessed.raise_alert','Unprocessed intake submissions raise alert','Public Forms & External Intake','intake.unprocessed.threshold','{"unprocessed_submissions_gt":10}'::jsonb,'{"emit_runtime_alert":"unprocessed_submissions"}'::jsonb,280,'active','phase_2o_public_forms_intake'),
('phase2o.parent.request.critical','Critical parent request alert','Public Forms & External Intake','parent_request.created','{"priority":"critical"}'::jsonb,'{"emit_runtime_alert":"critical_parent_request"}'::jsonb,281,'active','phase_2o_public_forms_intake'),
('phase2o.lead.capture.convert','Lead capture conversion workflow','Public Forms & External Intake','intake.submission.received','{"form_type":"admission"}'::jsonb,'{"process_lead_capture":"admissions"}'::jsonb,282,'active','phase_2o_public_forms_intake')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values('public_forms_lead_capture_parent_requests_external_intake','AC360-ENG-52','public_forms_intake','Public Forms, Lead Capture, Parent Requests & External Intake Runtime','phase_2o_public_forms_lead_capture_parent_requests_external_intake','guarded',array['ac360_school_intake_forms','ac360_school_intake_submissions','ac360_school_external_intake_sources','ac360_school_intake_mappings','ac360_school_parent_requests','ac360_school_lead_capture_events'],array['school.intake.form.upsert','school.intake.form.publish','school.intake.submission.create','school.intake.submission.status.update','school.intake.lead_capture.process','school.intake.parent_request.create','school.intake.parent_request.status.update','school.intake.external_source.upsert','school.intake.mapping.upsert','school.intake.reconcile','school.intake.alert.resolve'],'{"phase":"phase_2o","uiBuildAllowed":false,"backendOnly":true}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json||excluded.metadata_json,updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. RLS service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_school_intake_forms enable row level security;
alter table public.ac360_school_intake_form_fields enable row level security;
alter table public.ac360_school_external_intake_sources enable row level security;
alter table public.ac360_school_intake_mappings enable row level security;
alter table public.ac360_school_intake_submissions enable row level security;
alter table public.ac360_school_intake_events enable row level security;
alter table public.ac360_school_parent_requests enable row level security;
alter table public.ac360_school_parent_request_events enable row level security;
alter table public.ac360_school_lead_capture_events enable row level security;
alter table public.ac360_school_intake_snapshots enable row level security;
alter table public.ac360_school_intake_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_school_intake_forms','ac360_school_intake_form_fields','ac360_school_external_intake_sources','ac360_school_intake_mappings','ac360_school_intake_submissions','ac360_school_intake_events','ac360_school_parent_requests','ac360_school_parent_request_events','ac360_school_lead_capture_events','ac360_school_intake_snapshots','ac360_school_intake_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
