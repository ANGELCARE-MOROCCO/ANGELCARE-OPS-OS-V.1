
-- AngelCare 360 Phase 2F - Documents, Reports, Storage & Export Runtime
-- Backend/system-only. No document/report/storage UI pages are introduced in this phase.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2E school ops runtime.

begin;

-- Compatibility safety inherited from Phase 1D/1E lineage.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Documents / reports / storage runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_document_folders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  parent_folder_id uuid references public.ac360_school_document_folders(id) on delete set null,
  folder_code text not null,
  label text not null,
  folder_type text not null default 'general',
  owner_scope text not null default 'organization',
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, folder_code),
  check (folder_type in ('general','student_file','guardian_file','staff_file','finance','attendance','medical','contracts','reports','exports','templates','archive','custom')),
  check (owner_scope in ('organization','campus','class','student','guardian','staff','finance','system')),
  check (status in ('active','locked','archived'))
);

create table if not exists public.ac360_school_document_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  document_id uuid not null references public.ac360_school_documents(id) on delete cascade,
  version_number integer not null default 1,
  file_name text,
  file_path text,
  file_size_bytes bigint not null default 0,
  mime_type text,
  checksum text,
  change_note text,
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(document_id, version_number),
  check (status in ('active','superseded','archived'))
);

create table if not exists public.ac360_school_document_review_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  document_id uuid not null references public.ac360_school_documents(id) on delete cascade,
  review_code text not null,
  review_type text not null default 'approval',
  status text not null default 'pending',
  requested_by uuid,
  requested_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, review_code),
  check (review_type in ('approval','quality_check','finance_validation','parent_consent','medical_review','archive_validation','custom')),
  check (status in ('pending','approved','rejected','cancelled','archived'))
);

create table if not exists public.ac360_school_document_access_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  document_id uuid references public.ac360_school_documents(id) on delete set null,
  access_type text not null default 'view',
  actor_app_user_id uuid,
  recipient_type text,
  recipient_id uuid,
  result text not null default 'success',
  ip_address text,
  user_agent text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (access_type in ('view','download','share','print','export','archive','restore','delete_attempt')),
  check (result in ('success','blocked','failed','warning'))
);

create table if not exists public.ac360_school_report_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_key text not null,
  label text not null,
  report_type text not null default 'standard',
  output_format text not null default 'pdf',
  data_scope text not null default 'organization',
  template_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  published_by uuid,
  published_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, template_key),
  check (report_type in ('standard','attendance','finance','student','classroom','executive','parent','staff','document','custom')),
  check (output_format in ('pdf','xlsx','csv','html','json')),
  check (data_scope in ('organization','campus','class','student','guardian','staff','finance','attendance','custom')),
  check (status in ('draft','published','inactive','archived'))
);

create table if not exists public.ac360_school_report_artifacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  report_job_id uuid references public.ac360_school_report_jobs(id) on delete cascade,
  document_id uuid references public.ac360_school_documents(id) on delete set null,
  artifact_code text not null,
  artifact_type text not null default 'report_pdf',
  output_format text not null default 'pdf',
  file_name text,
  file_path text,
  file_size_bytes bigint not null default 0,
  status text not null default 'generated',
  generated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, artifact_code),
  check (artifact_type in ('report_pdf','report_xlsx','report_csv','export_file','preview','snapshot','custom')),
  check (output_format in ('pdf','xlsx','csv','html','json')),
  check (status in ('queued','generated','failed','archived'))
);

create table if not exists public.ac360_school_report_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_id uuid references public.ac360_school_report_templates(id) on delete set null,
  schedule_code text not null,
  label text not null,
  cadence text not null default 'monthly',
  next_run_at timestamptz,
  last_run_at timestamptz,
  recipients_json jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, schedule_code),
  check (cadence in ('daily','weekly','monthly','quarterly','annual','manual')),
  check (status in ('active','paused','inactive','archived'))
);

create table if not exists public.ac360_school_export_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  export_code text not null,
  export_type text not null default 'data_export',
  data_scope text not null default 'organization',
  output_format text not null default 'xlsx',
  status text not null default 'queued',
  requested_by uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  output_document_id uuid references public.ac360_school_documents(id) on delete set null,
  output_path text,
  row_count integer not null default 0,
  file_size_bytes bigint not null default 0,
  error_message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, export_code),
  check (export_type in ('data_export','student_export','finance_export','attendance_export','document_export','full_backup','report_export','custom')),
  check (data_scope in ('organization','campus','class','student','guardian','staff','finance','attendance','documents','custom')),
  check (output_format in ('xlsx','csv','pdf','json','zip')),
  check (status in ('queued','running','ready','failed','cancelled','expired','archived'))
);

create table if not exists public.ac360_school_storage_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  snapshot_date date not null default current_date,
  source_key text not null default 'manual_reconcile',
  active_document_count integer not null default 0,
  archived_document_count integer not null default 0,
  version_count integer not null default 0,
  report_artifact_count integer not null default 0,
  export_job_count integer not null default 0,
  total_bytes bigint not null default 0,
  total_gb numeric not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, campus_id, snapshot_date, source_key)
);

create table if not exists public.ac360_school_document_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  document_id uuid references public.ac360_school_documents(id) on delete set null,
  report_job_id uuid references public.ac360_school_report_jobs(id) on delete set null,
  export_job_id uuid references public.ac360_school_export_jobs(id) on delete set null,
  alert_code text not null,
  alert_type text not null default 'storage_limit_warning',
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_code),
  check (alert_type in ('storage_limit_warning','storage_limit_reached','document_review_pending','report_failed','export_failed','archive_required','retention_warning','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','in_progress','resolved','dismissed','archived'))
);

-- Link Phase 2F structures to Phase 2A documents without breaking older deployments.
alter table if exists public.ac360_school_documents
  add column if not exists folder_id uuid references public.ac360_school_document_folders(id) on delete set null,
  add column if not exists current_version_id uuid references public.ac360_school_document_versions(id) on delete set null,
  add column if not exists retention_until date,
  add column if not exists review_status text not null default 'not_required';

alter table if exists public.ac360_school_report_jobs
  add column if not exists template_id uuid references public.ac360_school_report_templates(id) on delete set null,
  add column if not exists artifact_id uuid references public.ac360_school_report_artifacts(id) on delete set null,
  add column if not exists export_job_id uuid references public.ac360_school_export_jobs(id) on delete set null;

-- -----------------------------------------------------------------------------
-- 2. Indexes / touch triggers
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_doc_folders_org_status on public.ac360_school_document_folders(org_id, status, folder_type);
create index if not exists idx_ac360_doc_versions_doc on public.ac360_school_document_versions(document_id, created_at desc);
create index if not exists idx_ac360_doc_reviews_org_status on public.ac360_school_document_review_requests(org_id, status, review_type);
create index if not exists idx_ac360_doc_access_org_created on public.ac360_school_document_access_events(org_id, created_at desc);
create index if not exists idx_ac360_report_templates_org_status on public.ac360_school_report_templates(org_id, status, report_type);
create index if not exists idx_ac360_report_artifacts_org_status on public.ac360_school_report_artifacts(org_id, status, artifact_type);
create index if not exists idx_ac360_report_schedules_org_status on public.ac360_school_report_schedules(org_id, status, cadence);
create index if not exists idx_ac360_export_jobs_org_status on public.ac360_school_export_jobs(org_id, status, export_type);
create index if not exists idx_ac360_storage_snapshots_org_date on public.ac360_school_storage_snapshots(org_id, snapshot_date desc);
create index if not exists idx_ac360_document_alerts_org_status on public.ac360_school_document_alerts(org_id, status, severity);

-- Unique index with nullable campus_id semantics for storage snapshots.
drop index if exists idx_ac360_storage_snapshots_unique_coalesced;
create unique index if not exists idx_ac360_storage_snapshots_unique_coalesced
  on public.ac360_school_storage_snapshots(org_id, coalesce(campus_id, '00000000-0000-0000-0000-000000000000'::uuid), snapshot_date, source_key);

DO $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_document_folders','ac360_school_document_review_requests','ac360_school_report_templates','ac360_school_report_artifacts',
    'ac360_school_report_schedules','ac360_school_export_jobs','ac360_school_document_alerts'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
      execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. RPC runtime functions
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_documents_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_storage_gb numeric := 0;
  v_latest_snapshot jsonb := '{}'::jsonb;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;

  select coalesce(sum(file_size_bytes),0)::numeric / 1073741824.0 into v_storage_gb
  from public.ac360_school_documents d
  where d.org_id = p_org_id
    and (p_campus_id is null or d.campus_id = p_campus_id)
    and d.status in ('active','pending_review','approved');

  select coalesce(to_jsonb(s), '{}'::jsonb) into v_latest_snapshot
  from public.ac360_school_storage_snapshots s
  where s.org_id = p_org_id and (p_campus_id is null or s.campus_id = p_campus_id)
  order by s.created_at desc
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2f_documents_reports_storage_exports',
    'uiBuildAllowed', false,
    'asOfDate', coalesce(p_as_of_date,current_date),
    'documents', jsonb_build_object(
      'active', (select count(*) from public.ac360_school_documents where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('active','approved','pending_review')),
      'archived', (select count(*) from public.ac360_school_documents where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='archived'),
      'pendingReview', (select count(*) from public.ac360_school_document_review_requests where org_id=p_org_id and status='pending'),
      'folders', (select count(*) from public.ac360_school_document_folders where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='active')
    ),
    'reports', jsonb_build_object(
      'templates', (select count(*) from public.ac360_school_report_templates where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status <> 'archived'),
      'queued', (select count(*) from public.ac360_school_report_jobs where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('queued','running')),
      'generated', (select count(*) from public.ac360_school_report_jobs where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='generated'),
      'artifacts', (select count(*) from public.ac360_school_report_artifacts where org_id=p_org_id and status='generated')
    ),
    'exports', jsonb_build_object(
      'queued', (select count(*) from public.ac360_school_export_jobs where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('queued','running')),
      'ready', (select count(*) from public.ac360_school_export_jobs where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='ready'),
      'failed', (select count(*) from public.ac360_school_export_jobs where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='failed')
    ),
    'storage', jsonb_build_object(
      'currentGb', round(coalesce(v_storage_gb,0), 4),
      'latestSnapshot', v_latest_snapshot
    ),
    'alerts', jsonb_build_object(
      'open', (select count(*) from public.ac360_school_document_alerts where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('open','in_progress')),
      'critical', (select count(*) from public.ac360_school_document_alerts where org_id=p_org_id and severity='critical' and status in ('open','in_progress'))
    ),
    'checkedAt', now()
  );
end;
$$;

create or replace function public.ac360_school_register_document(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_folder_id uuid default null,
  p_student_id uuid default null,
  p_guardian_id uuid default null,
  p_staff_profile_id uuid default null,
  p_document_code text default null,
  p_document_type text default 'general',
  p_title text default null,
  p_file_name text default null,
  p_file_path text default null,
  p_file_size_bytes bigint default 0,
  p_mime_type text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_doc public.ac360_school_documents%rowtype;
  v_code text := coalesce(nullif(p_document_code,''), 'DOC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if coalesce(nullif(p_title,''),'') = '' then raise exception 'p_title is required'; end if;

  insert into public.ac360_school_documents(
    org_id,campus_id,folder_id,student_id,guardian_id,staff_profile_id,document_code,document_type,title,file_name,file_path,file_size_bytes,mime_type,status,uploaded_by,metadata_json
  ) values (
    p_org_id,p_campus_id,p_folder_id,p_student_id,p_guardian_id,p_staff_profile_id,v_code,coalesce(p_document_type,'general'),p_title,p_file_name,p_file_path,greatest(coalesce(p_file_size_bytes,0),0),p_mime_type,'active',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict (org_id, document_code) do update set
    campus_id=coalesce(excluded.campus_id, public.ac360_school_documents.campus_id),
    folder_id=coalesce(excluded.folder_id, public.ac360_school_documents.folder_id),
    title=excluded.title,
    document_type=excluded.document_type,
    file_name=excluded.file_name,
    file_path=excluded.file_path,
    file_size_bytes=excluded.file_size_bytes,
    mime_type=excluded.mime_type,
    status='active',
    metadata_json=public.ac360_school_documents.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_doc;

  insert into public.ac360_school_operation_events(org_id,campus_id,event_key,action_key,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_campus_id,'document.registered','school.document.register','document',v_doc.id,'info','Document registered in AC360 storage runtime.',p_actor_app_user_id,jsonb_build_object('documentCode',v_doc.document_code,'phase','phase_2f'));

  return jsonb_build_object('ok',true,'document',to_jsonb(v_doc));
end;
$$;

create or replace function public.ac360_school_create_document_version(
  p_org_id uuid,
  p_document_id uuid,
  p_file_name text default null,
  p_file_path text default null,
  p_file_size_bytes bigint default 0,
  p_mime_type text default null,
  p_checksum text default null,
  p_change_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_doc public.ac360_school_documents%rowtype;
  v_version public.ac360_school_document_versions%rowtype;
  v_next integer := 1;
begin
  if p_org_id is null or p_document_id is null then raise exception 'p_org_id and p_document_id are required'; end if;
  select * into v_doc from public.ac360_school_documents where id=p_document_id and org_id=p_org_id limit 1;
  if v_doc.id is null then raise exception 'Document not found'; end if;

  select coalesce(max(version_number),0)+1 into v_next from public.ac360_school_document_versions where document_id=p_document_id;
  update public.ac360_school_document_versions set status='superseded' where document_id=p_document_id and status='active';

  insert into public.ac360_school_document_versions(org_id,document_id,version_number,file_name,file_path,file_size_bytes,mime_type,checksum,change_note,status,created_by,metadata_json)
  values(p_org_id,p_document_id,v_next,p_file_name,p_file_path,greatest(coalesce(p_file_size_bytes,0),0),p_mime_type,p_checksum,p_change_note,'active',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning * into v_version;

  update public.ac360_school_documents
  set current_version_id=v_version.id,
      file_name=coalesce(p_file_name,file_name), file_path=coalesce(p_file_path,file_path), file_size_bytes=greatest(coalesce(p_file_size_bytes,file_size_bytes),0), mime_type=coalesce(p_mime_type,mime_type), updated_at=now()
  where id=p_document_id;

  return jsonb_build_object('ok',true,'version',to_jsonb(v_version));
end;
$$;

create or replace function public.ac360_school_archive_document(
  p_org_id uuid,
  p_document_id uuid,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_doc public.ac360_school_documents%rowtype;
begin
  update public.ac360_school_documents
  set status='archived', archived_at=now(), metadata_json=metadata_json || jsonb_build_object('archiveReason',p_reason,'archiveMetadata',coalesce(p_metadata,'{}'::jsonb)), updated_at=now()
  where org_id=p_org_id and id=p_document_id
  returning * into v_doc;
  if v_doc.id is null then raise exception 'Document not found'; end if;

  insert into public.ac360_school_document_access_events(org_id,document_id,access_type,actor_app_user_id,result,metadata_json)
  values(p_org_id,p_document_id,'archive',p_actor_app_user_id,'success',jsonb_build_object('reason',p_reason,'phase','phase_2f'));

  return jsonb_build_object('ok',true,'document',to_jsonb(v_doc),'archiveNotDelete',true);
end;
$$;

create or replace function public.ac360_school_request_document_review(
  p_org_id uuid,
  p_document_id uuid,
  p_review_type text default 'approval',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_review public.ac360_school_document_review_requests%rowtype; v_code text;
begin
  if not exists(select 1 from public.ac360_school_documents where id=p_document_id and org_id=p_org_id) then raise exception 'Document not found'; end if;
  v_code := 'DREV-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.ac360_school_document_review_requests(org_id,document_id,review_code,review_type,status,requested_by,metadata_json)
  values(p_org_id,p_document_id,v_code,coalesce(p_review_type,'approval'),'pending',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_review;
  update public.ac360_school_documents set status='pending_review', review_status='pending', updated_at=now() where id=p_document_id;
  return jsonb_build_object('ok',true,'review',to_jsonb(v_review));
end;
$$;

create or replace function public.ac360_school_decide_document_review(
  p_org_id uuid,
  p_review_id uuid,
  p_decision text,
  p_decision_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_review public.ac360_school_document_review_requests%rowtype; v_status text;
begin
  v_status := case when lower(coalesce(p_decision,'')) in ('approve','approved') then 'approved' when lower(coalesce(p_decision,'')) in ('reject','rejected') then 'rejected' else null end;
  if v_status is null then raise exception 'Decision must be approved or rejected'; end if;
  update public.ac360_school_document_review_requests
  set status=v_status, decided_by=p_actor_app_user_id, decided_at=now(), decision_note=p_decision_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where org_id=p_org_id and id=p_review_id
  returning * into v_review;
  if v_review.id is null then raise exception 'Review not found'; end if;
  update public.ac360_school_documents set status=v_status, review_status=v_status, updated_at=now() where id=v_review.document_id;
  return jsonb_build_object('ok',true,'review',to_jsonb(v_review));
end;
$$;

create or replace function public.ac360_school_record_document_access(
  p_org_id uuid,
  p_document_id uuid,
  p_access_type text default 'view',
  p_actor_app_user_id uuid default null,
  p_result text default 'success',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_event public.ac360_school_document_access_events%rowtype;
begin
  insert into public.ac360_school_document_access_events(org_id,document_id,access_type,actor_app_user_id,result,metadata_json)
  values(p_org_id,p_document_id,coalesce(p_access_type,'view'),p_actor_app_user_id,coalesce(p_result,'success'),coalesce(p_metadata,'{}'::jsonb)) returning * into v_event;
  return jsonb_build_object('ok',true,'event',to_jsonb(v_event));
end;
$$;

create or replace function public.ac360_school_upsert_report_template(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_template_key text default null,
  p_label text default null,
  p_report_type text default 'standard',
  p_output_format text default 'pdf',
  p_data_scope text default 'organization',
  p_template_json jsonb default '{}'::jsonb,
  p_status text default 'draft',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_template public.ac360_school_report_templates%rowtype; v_key text := coalesce(nullif(p_template_key,''),'TPL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if coalesce(nullif(p_label,''),'') = '' then raise exception 'p_label is required'; end if;
  insert into public.ac360_school_report_templates(org_id,campus_id,template_key,label,report_type,output_format,data_scope,template_json,status,created_by,published_by,published_at,metadata_json)
  values(p_org_id,p_campus_id,v_key,p_label,coalesce(p_report_type,'standard'),coalesce(p_output_format,'pdf'),coalesce(p_data_scope,'organization'),coalesce(p_template_json,'{}'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,case when p_status='published' then p_actor_app_user_id else null end,case when p_status='published' then now() else null end,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id, template_key) do update set
    campus_id=coalesce(excluded.campus_id, public.ac360_school_report_templates.campus_id), label=excluded.label, report_type=excluded.report_type, output_format=excluded.output_format, data_scope=excluded.data_scope, template_json=excluded.template_json, status=excluded.status, metadata_json=public.ac360_school_report_templates.metadata_json || excluded.metadata_json, updated_at=now()
  returning * into v_template;
  return jsonb_build_object('ok',true,'template',to_jsonb(v_template));
end;
$$;

create or replace function public.ac360_school_queue_report_job(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_template_key text default null,
  p_report_code text default null,
  p_report_type text default 'standard',
  p_title text default null,
  p_period_start date default null,
  p_period_end date default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_job public.ac360_school_report_jobs%rowtype; v_template uuid; v_code text := coalesce(nullif(p_report_code,''),'RPT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))); v_type text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  select id into v_template from public.ac360_school_report_templates where org_id=p_org_id and template_key=p_template_key limit 1;
  v_type := case when coalesce(p_report_type,'standard') in ('standard','attendance','finance','student','classroom','executive','custom') then coalesce(p_report_type,'standard') else 'custom' end;
  insert into public.ac360_school_report_jobs(org_id,campus_id,template_id,report_code,report_type,title,status,requested_by,period_start,period_end,metadata_json)
  values(p_org_id,p_campus_id,v_template,v_code,v_type,coalesce(p_title,'AC360 Report'),'queued',p_actor_app_user_id,p_period_start,p_period_end,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id, report_code) do update set title=excluded.title, status='queued', template_id=excluded.template_id, updated_at=now()
  returning * into v_job;
  return jsonb_build_object('ok',true,'reportJob',to_jsonb(v_job));
end;
$$;

create or replace function public.ac360_school_record_report_artifact(
  p_org_id uuid,
  p_report_job_id uuid,
  p_artifact_code text default null,
  p_artifact_type text default 'report_pdf',
  p_output_format text default 'pdf',
  p_file_name text default null,
  p_file_path text default null,
  p_file_size_bytes bigint default 0,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_artifact public.ac360_school_report_artifacts%rowtype; v_code text := coalesce(nullif(p_artifact_code,''),'ART-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
begin
  if not exists(select 1 from public.ac360_school_report_jobs where id=p_report_job_id and org_id=p_org_id) then raise exception 'Report job not found'; end if;
  insert into public.ac360_school_report_artifacts(org_id,report_job_id,artifact_code,artifact_type,output_format,file_name,file_path,file_size_bytes,status,generated_by,metadata_json)
  values(p_org_id,p_report_job_id,v_code,coalesce(p_artifact_type,'report_pdf'),coalesce(p_output_format,'pdf'),p_file_name,p_file_path,greatest(coalesce(p_file_size_bytes,0),0),'generated',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_artifact;
  update public.ac360_school_report_jobs set status='generated', output_path=coalesce(p_file_path, output_path), artifact_id=v_artifact.id, generated_at=now(), updated_at=now() where id=p_report_job_id;
  return jsonb_build_object('ok',true,'artifact',to_jsonb(v_artifact));
end;
$$;

create or replace function public.ac360_school_queue_export_job(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_export_code text default null,
  p_export_type text default 'data_export',
  p_data_scope text default 'organization',
  p_output_format text default 'xlsx',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_export public.ac360_school_export_jobs%rowtype; v_code text := coalesce(nullif(p_export_code,''),'EXP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
begin
  insert into public.ac360_school_export_jobs(org_id,campus_id,export_code,export_type,data_scope,output_format,status,requested_by,metadata_json)
  values(p_org_id,p_campus_id,v_code,coalesce(p_export_type,'data_export'),coalesce(p_data_scope,'organization'),coalesce(p_output_format,'xlsx'),'queued',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id, export_code) do update set status='queued', metadata_json=public.ac360_school_export_jobs.metadata_json || excluded.metadata_json, updated_at=now()
  returning * into v_export;
  return jsonb_build_object('ok',true,'exportJob',to_jsonb(v_export));
end;
$$;

create or replace function public.ac360_school_mark_export_ready(
  p_org_id uuid,
  p_export_job_id uuid,
  p_output_path text default null,
  p_file_size_bytes bigint default 0,
  p_row_count integer default 0,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_export public.ac360_school_export_jobs%rowtype;
begin
  update public.ac360_school_export_jobs
  set status='ready', output_path=p_output_path, file_size_bytes=greatest(coalesce(p_file_size_bytes,0),0), row_count=greatest(coalesce(p_row_count,0),0), completed_at=now(), metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where org_id=p_org_id and id=p_export_job_id
  returning * into v_export;
  if v_export.id is null then raise exception 'Export job not found'; end if;
  return jsonb_build_object('ok',true,'exportJob',to_jsonb(v_export));
end;
$$;

create or replace function public.ac360_school_reconcile_storage(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_source_key text default 'manual_reconcile',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_active integer := 0; v_archived integer := 0; v_versions integer := 0; v_artifacts integer := 0; v_exports integer := 0; v_bytes bigint := 0; v_snapshot public.ac360_school_storage_snapshots%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  select count(*), coalesce(sum(file_size_bytes),0) into v_active, v_bytes from public.ac360_school_documents where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('active','approved','pending_review');
  select count(*) into v_archived from public.ac360_school_documents where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='archived';
  select count(*) into v_versions from public.ac360_school_document_versions where org_id=p_org_id;
  select count(*) into v_artifacts from public.ac360_school_report_artifacts where org_id=p_org_id and status='generated';
  select count(*) into v_exports from public.ac360_school_export_jobs where org_id=p_org_id and status in ('ready','queued','running');

  insert into public.ac360_school_storage_snapshots(org_id,campus_id,snapshot_date,source_key,active_document_count,archived_document_count,version_count,report_artifact_count,export_job_count,total_bytes,total_gb,metadata_json)
  values(p_org_id,p_campus_id,current_date,coalesce(p_source_key,'manual_reconcile'),v_active,v_archived,v_versions,v_artifacts,v_exports,coalesce(v_bytes,0),(coalesce(v_bytes,0)::numeric/1073741824.0),coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id, campus_id, snapshot_date, source_key) do update set
    active_document_count=excluded.active_document_count,
    archived_document_count=excluded.archived_document_count,
    version_count=excluded.version_count,
    report_artifact_count=excluded.report_artifact_count,
    export_job_count=excluded.export_job_count,
    total_bytes=excluded.total_bytes,
    total_gb=excluded.total_gb,
    metadata_json=public.ac360_school_storage_snapshots.metadata_json || excluded.metadata_json
  returning * into v_snapshot;

  if v_snapshot.total_gb >= 4 then
    insert into public.ac360_school_document_alerts(org_id,campus_id,alert_code,alert_type,severity,status,title,message,metadata_json)
    values(p_org_id,p_campus_id,'STORAGE-' || to_char(current_date,'YYYYMMDD'),'storage_limit_warning','high','open','Storage usage requires review','Storage consumption is high. Review storage add-on or archive policy.',jsonb_build_object('totalGb',v_snapshot.total_gb,'phase','phase_2f'))
    on conflict(org_id, alert_code) do update set status='open', severity='high', message=excluded.message, metadata_json=public.ac360_school_document_alerts.metadata_json || excluded.metadata_json, updated_at=now();
  end if;

  return jsonb_build_object('ok',true,'snapshot',to_jsonb(v_snapshot));
end;
$$;

create or replace function public.ac360_school_resolve_document_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_alert public.ac360_school_document_alerts%rowtype;
begin
  update public.ac360_school_document_alerts
  set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), resolution_note=p_resolution_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where org_id=p_org_id and id=p_alert_id
  returning * into v_alert;
  if v_alert.id is null then raise exception 'Alert not found'; end if;
  return jsonb_build_object('ok',true,'alert',to_jsonb(v_alert));
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Feature/action registry and wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,status,metadata_json)
values
('documents_advanced','documents','Documents & Storage','Advanced document governance','Folders, versions, reviews, access log and archive-safe document governance.','access',false,true,false,'storage_gb',0,'active','{"phase":"phase_2f","growth_menu":true}'::jsonb),
('reports_advanced','reports','Reports & Exports','Advanced report runtime','Report templates, artifacts, schedules and export-ready report jobs.','usage',false,true,false,'report_generation',10,'active','{"phase":"phase_2f","growth_menu":true}'::jsonb),
('exports_basic','exports','Reports & Exports','Data export runtime','Queue and produce school data exports under audit and billing control.','usage',false,true,false,'report_generation',10,'active','{"phase":"phase_2f","growth_menu":true}'::jsonb),
('storage_governance','documents','Documents & Storage','Storage governance','Storage snapshots, alerts, retention and capacity reconciliation.','capacity',false,true,false,'storage_gb',0,'active','{"phase":"phase_2f"}'::jsonb)
on conflict(feature_key) do update set
  module_key=excluded.module_key, family=excluded.family, label=excluded.label, description=excluded.description, billing_family=excluded.billing_family, is_core=excluded.is_core, is_billable=excluded.is_billable, default_meter_key=excluded.default_meter_key, default_credit_cost=excluded.default_credit_cost, status=excluded.status, metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json, updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json)
values
('school.document.register','documents_storage','AC360-ENG-50','Register school document','Register document metadata/file under storage capacity governance.','documents.upload','storage_gb',0,'require_upgrade','{"phase":"phase_2f","capacity_key":"storage_gb"}'::jsonb),
('school.document.version.create','documents_advanced','AC360-ENG-50','Create document version','Create a new document version while preserving history.','documents.advanced','storage_gb',0,'require_upgrade','{"phase":"phase_2f","archive_not_delete":true}'::jsonb),
('school.document.archive','documents_storage','AC360-ENG-50','Archive school document','Archive a document without deleting historical evidence.','documents.archive',null,0,'block','{"phase":"phase_2f","archive_not_delete":true}'::jsonb),
('school.document.review.request','documents_advanced','AC360-ENG-50','Request document review','Submit document for approval/quality review.','documents.advanced',null,0,'require_upgrade','{"phase":"phase_2f"}'::jsonb),
('school.document.review.decide','documents_advanced','AC360-ENG-50','Decide document review','Approve or reject a document review.','documents.advanced',null,0,'require_upgrade','{"phase":"phase_2f"}'::jsonb),
('school.document.access.record','documents_storage','AC360-ENG-50','Record document access','Record document view/download/share/print events for audit.','documents.access_log',null,0,'block','{"phase":"phase_2f","audit_required":true}'::jsonb),
('school.report.template.upsert','reports_advanced','AC360-ENG-51','Upsert report template','Create or update a report template.','reports.advanced',null,0,'require_upgrade','{"phase":"phase_2f"}'::jsonb),
('school.report.job.queue','reports_basic','AC360-ENG-51','Queue report job','Queue one school report generation job.','reports.generate','report_generation',10,'require_topup','{"phase":"phase_2f"}'::jsonb),
('school.report.artifact.record','reports_advanced','AC360-ENG-51','Record report artifact','Attach generated PDF/XLS/CSV artifact to report job.','reports.advanced','report_generation',2,'require_topup','{"phase":"phase_2f"}'::jsonb),
('school.export.job.queue','exports_basic','AC360-ENG-51','Queue export job','Queue one school data export job.','reports.export','report_generation',10,'require_topup','{"phase":"phase_2f"}'::jsonb),
('school.export.mark_ready','exports_basic','AC360-ENG-51','Mark export ready','Mark a generated export as ready.','reports.export',null,0,'block','{"phase":"phase_2f"}'::jsonb),
('school.storage.reconcile','storage_governance','AC360-ENG-50','Reconcile storage usage','Compute storage usage snapshot and create alerts.','storage.governance','storage_gb',0,'require_upgrade','{"phase":"phase_2f"}'::jsonb),
('school.document.alert.resolve','storage_governance','AC360-ENG-50','Resolve document/storage alert','Resolve document, export, report or storage alert.','storage.governance',null,0,'block','{"phase":"phase_2f"}'::jsonb)
on conflict(action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table,
  enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.school_documents.document.register','/api/ac360/school-documents/documents/register','POST','school.document.register','documents_storage','AC360-ENG-50','angelcare_360_school_documents','ac360_school_documents','strict','storage_gb','request_or_generated','storage_gb_live_sum','school.document.upload','active','Registers document under AC360 storage guard.','{"phase":"phase_2f","capacity_key":"storage_gb"}'::jsonb),
('ac360.school_documents.document.version','/api/ac360/school-documents/documents/version','POST','school.document.version.create','documents_advanced','AC360-ENG-50','angelcare_360_school_documents','ac360_school_document_versions','strict','storage_gb','request_or_generated','storage_gb_live_sum','school.document.register','active','Creates document version under advanced document governance.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.document.archive','/api/ac360/school-documents/documents/archive','POST','school.document.archive','documents_storage','AC360-ENG-50','angelcare_360_school_documents','ac360_school_documents','strict','fixed_1','request_or_generated',null,null,'active','Archives document without deletion.','{"phase":"phase_2f","archive_not_delete":true}'::jsonb),
('ac360.school_documents.review.request','/api/ac360/school-documents/reviews/request','POST','school.document.review.request','documents_advanced','AC360-ENG-50','angelcare_360_school_documents','ac360_school_document_review_requests','strict','fixed_1','request_or_generated',null,null,'active','Requests document review.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.review.decide','/api/ac360/school-documents/reviews/decide','POST','school.document.review.decide','documents_advanced','AC360-ENG-50','angelcare_360_school_documents','ac360_school_document_review_requests','strict','fixed_1','request_or_generated',null,null,'active','Approves or rejects document review.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.access.record','/api/ac360/school-documents/documents/access','POST','school.document.access.record','documents_storage','AC360-ENG-50','angelcare_360_school_documents','ac360_school_document_access_events','strict','fixed_1','request_or_generated',null,null,'active','Records document access event.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.report_template.upsert','/api/ac360/school-documents/report-templates/upsert','POST','school.report.template.upsert','reports_advanced','AC360-ENG-51','angelcare_360_school_documents','ac360_school_report_templates','strict','fixed_1','request_or_generated',null,null,'active','Creates or updates report template.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.report_job.queue','/api/ac360/school-documents/reports/queue','POST','school.report.job.queue','reports_basic','AC360-ENG-51','angelcare_360_school_documents','ac360_school_report_jobs','strict','fixed_1','request_or_generated',null,'school.report.generate','active','Queues report job under report credits.','{"phase":"phase_2f","meter":"report_generation"}'::jsonb),
('ac360.school_documents.report_artifact.record','/api/ac360/school-documents/reports/artifact','POST','school.report.artifact.record','reports_advanced','AC360-ENG-51','angelcare_360_school_documents','ac360_school_report_artifacts','strict','fixed_1','request_or_generated',null,null,'active','Records report artifact after generation.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.export.queue','/api/ac360/school-documents/exports/queue','POST','school.export.job.queue','exports_basic','AC360-ENG-51','angelcare_360_school_documents','ac360_school_export_jobs','strict','fixed_1','request_or_generated',null,null,'active','Queues export job under report/export credits.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.export.ready','/api/ac360/school-documents/exports/ready','POST','school.export.mark_ready','exports_basic','AC360-ENG-51','angelcare_360_school_documents','ac360_school_export_jobs','strict','fixed_1','request_or_generated',null,null,'active','Marks export output ready.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.storage.reconcile','/api/ac360/school-documents/storage/reconcile','POST','school.storage.reconcile','storage_governance','AC360-ENG-50','angelcare_360_school_documents','ac360_school_storage_snapshots','strict','fixed_1','request_or_generated','storage_gb_live_sum',null,'active','Reconciles storage usage and alerts.','{"phase":"phase_2f"}'::jsonb),
('ac360.school_documents.alert.resolve','/api/ac360/school-documents/alerts/resolve','POST','school.document.alert.resolve','storage_governance','AC360-ENG-50','angelcare_360_school_documents','ac360_school_document_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves storage/document/report/export alert.','{"phase":"phase_2f"}'::jsonb)
on conflict(wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  fallback_action_key=excluded.fallback_action_key,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values
('documents_reports_storage_exports','AC360-ENG-50','documents_storage','Documents, Reports, Storage & Export Runtime','phase_2f_documents_reports_storage_exports','guarded',array['ac360_school_document_folders','ac360_school_document_versions','ac360_school_document_review_requests','ac360_school_document_access_events','ac360_school_report_templates','ac360_school_report_artifacts','ac360_school_report_schedules','ac360_school_export_jobs','ac360_school_storage_snapshots','ac360_school_document_alerts'],array['school.document.register','school.document.version.create','school.document.archive','school.document.review.request','school.document.review.decide','school.document.access.record','school.report.template.upsert','school.report.job.queue','school.report.artifact.record','school.export.job.queue','school.export.mark_ready','school.storage.reconcile','school.document.alert.resolve'],'{"phase":"phase_2f","uiBuildAllowed":false,"archiveNotDelete":true,"storageGovernance":true}'::jsonb)
on conflict(module_key) do update set
  engine_code=excluded.engine_code,
  feature_key=excluded.feature_key,
  label=excluded.label,
  phase=excluded.phase,
  status=excluded.status,
  data_tables=excluded.data_tables,
  guarded_actions=excluded.guarded_actions,
  metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, status, phase, sort_order) values
('school_docs_storage_high_recommend_storage_pack','High document storage recommends storage add-on','School Documents','storage.usage.high','{"storage_gb_gt":4}'::jsonb,'{"recommend_addon":"storage_25gb","create_alert":true}'::jsonb,'active','phase_2f_documents_reports_storage_exports',260),
('school_docs_review_pending_create_alert','Pending document review creates alert','School Documents','document.review.pending','{"pending_review_gt":0}'::jsonb,'{"create_document_alert":true,"severity":"medium"}'::jsonb,'active','phase_2f_documents_reports_storage_exports',261),
('school_reports_failed_create_alert','Failed report/export creates alert','School Reports','report_or_export.failed','{"failed_count_gt":0}'::jsonb,'{"create_document_alert":true,"severity":"high"}'::jsonb,'active','phase_2f_documents_reports_storage_exports',262)
on conflict(rule_key) do update set
  label=excluded.label,
  system_group=excluded.system_group,
  trigger_event=excluded.trigger_event,
  condition_json=excluded.condition_json,
  action_json=excluded.action_json,
  status=excluded.status,
  phase=excluded.phase,
  sort_order=excluded.sort_order,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 5. RLS service-role policies for backend API control
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_document_folders','ac360_school_document_versions','ac360_school_document_review_requests','ac360_school_document_access_events',
    'ac360_school_report_templates','ac360_school_report_artifacts','ac360_school_report_schedules','ac360_school_export_jobs',
    'ac360_school_storage_snapshots','ac360_school_document_alerts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

commit;
