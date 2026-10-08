begin;

-- Preconditions: current AngelCare/SANILA schema baseline, including app_users,
-- angelcare360_schools, angelcare360_operator_tenants and the seeded domain tables.
-- Apply this file before 20260903_sanila_master_demo_security_hardening.sql.

create table if not exists public.sanila_demo_configs (
  id uuid primary key default gen_random_uuid(),
  operator_tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete restrict,
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  school_admin_app_user_id uuid references public.app_users(id) on delete set null,
  classification text not null default 'master_demo' check (classification = 'master_demo'),
  active boolean not null default true,
  billing_mode text not null default 'non_billable' check (billing_mode = 'non_billable'),
  seed_version text not null default 'SANILA_MASTER_DEMO_SEED_2026_09_V1',
  seed_health text not null default 'not_seeded' check (seed_health in ('not_seeded','healthy','degraded','failed')),
  safety_status text not null default 'enforced' check (safety_status in ('enforced','degraded','disabled')),
  access_status text not null default 'active' check (access_status in ('active','suspended')),
  seeded_at timestamptz,
  verified_at timestamptz,
  last_seed_verified_at timestamptz,
  last_reset_at timestamptz,
  reset_status text not null default 'idle' check (reset_status in ('idle','running','failed')),
  reset_started_at timestamptz,
  reset_failure text,
  seed_counts jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_tenant_id),
  unique (school_id)
);

create unique index if not exists sanila_demo_configs_one_active_idx
  on public.sanila_demo_configs (classification)
  where active = true;

-- Existing domain indexes cover most school-scoped verification queries. These
-- additive indexes close the three high-volume/reset paths absent from baseline.
create index if not exists idx_sanila_demo_enrollments_school_status
  on public.angelcare360_class_enrollments(school_id,status);
create index if not exists idx_sanila_demo_attendance_school_student
  on public.angelcare360_attendance_records(school_id,student_id);
create index if not exists idx_sanila_demo_transport_assignments_school
  on public.angelcare360_transport_assignments(school_id);

alter table public.sanila_demo_configs add column if not exists access_status text not null default 'active' check (access_status in ('active','suspended'));
alter table public.sanila_demo_configs add column if not exists seeded_at timestamptz;
alter table public.sanila_demo_configs add column if not exists verified_at timestamptz;
alter table public.sanila_demo_configs add column if not exists reset_status text not null default 'idle' check (reset_status in ('idle','running','failed'));
alter table public.sanila_demo_configs add column if not exists reset_started_at timestamptz;
alter table public.sanila_demo_configs add column if not exists reset_failure text;
alter table public.sanila_demo_configs add column if not exists seed_counts jsonb not null default '{}'::jsonb;

create table if not exists public.sanila_demo_access_grants (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  public_inquiry_id uuid references public.angelcare_marketplace_public_inquiries(id) on delete set null,
  requester_name text not null,
  requester_email text,
  requester_phone text,
  issuer_user_id uuid references public.app_users(id) on delete set null,
  approval_state text not null default 'not_reviewed' check (approval_state in ('not_reviewed','under_review','needs_info','approved','rejected')),
  policy_type text not null default 'single_use' check (policy_type in ('single_use','n_uses','unlimited')),
  max_uses integer check (max_uses is null or max_uses > 0),
  activation_duration_minutes integer check (activation_duration_minutes is null or activation_duration_minutes > 0),
  absolute_expires_at timestamptz,
  status text not null default 'draft' check (status in ('draft','ready','active','used','exhausted','expired','suspended','revoked')),
  pin_hash text not null,
  pin_last4 text,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  used_count integer not null default 0 check (used_count >= 0),
  activated_at timestamptz,
  effective_expires_at timestamptz,
  last_access_at timestamptz,
  revoked_at timestamptz,
  suspended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (policy_type <> 'n_uses' or max_uses is not null),
  check (effective_expires_at is null or activated_at is not null),
  constraint sanila_demo_grants_formal_approval_ck check (approval_state='approved' or status not in ('ready','active','used','exhausted')),
  constraint sanila_demo_grants_policy_shape_ck check ((policy_type='single_use' and max_uses=1) or (policy_type='n_uses' and max_uses is not null) or (policy_type='unlimited' and max_uses is null)),
  constraint sanila_demo_grants_usage_bound_ck check (max_uses is null or used_count<=max_uses)
);

create index if not exists sanila_demo_grants_config_status_idx
  on public.sanila_demo_access_grants(config_id, status, updated_at desc);
create index if not exists sanila_demo_grants_inquiry_idx
  on public.sanila_demo_access_grants(public_inquiry_id, created_at desc);

create table if not exists public.sanila_demo_access_events (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references public.sanila_demo_access_grants(id) on delete set null,
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  public_inquiry_id uuid references public.angelcare_marketplace_public_inquiries(id) on delete set null,
  actor_user_id uuid references public.app_users(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','notice','warning','critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sanila_demo_events_lookup_idx
  on public.sanila_demo_access_events(config_id, created_at desc);
create index if not exists sanila_demo_events_grant_idx
  on public.sanila_demo_access_events(grant_id, created_at desc);

create table if not exists public.sanila_demo_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  grant_id uuid not null references public.sanila_demo_access_grants(id) on delete cascade,
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  activated_at timestamptz not null,
  effective_expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sanila_demo_sessions_active_idx
  on public.sanila_demo_sessions(config_id, effective_expires_at)
  where revoked_at is null;

create table if not exists public.sanila_demo_reset_runs (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  status text not null check (status in ('running','succeeded','failed','refused')),
  requested_by uuid references public.app_users(id) on delete set null,
  target_school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  seed_version text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists sanila_demo_reset_runs_config_idx on public.sanila_demo_reset_runs(config_id, started_at desc);

create table if not exists public.sanila_demo_side_effect_events (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  channel text not null,
  operation text not null,
  outcome text not null check (outcome in ('blocked','simulated')),
  actor_user_id uuid references public.app_users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sanila_demo_side_effect_events_config_idx on public.sanila_demo_side_effect_events(config_id, created_at desc);

create or replace function public.sanila_validate_demo_config_scope()
returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from public.angelcare360_operator_tenants t where t.id=new.operator_tenant_id and t.school_id=new.school_id) then raise exception 'SANILA Demo config tenant/school scope mismatch'; end if;
  return new;
end $$;
drop trigger if exists sanila_demo_config_scope_guard on public.sanila_demo_configs;
create trigger sanila_demo_config_scope_guard before insert or update of operator_tenant_id,school_id on public.sanila_demo_configs for each row execute function public.sanila_validate_demo_config_scope();

create or replace function public.sanila_validate_demo_session_scope()
returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from public.sanila_demo_access_grants g join public.sanila_demo_configs c on c.id=g.config_id where g.id=new.grant_id and c.id=new.config_id and c.school_id=new.school_id) then raise exception 'SANILA Demo session grant/config/school scope mismatch'; end if;
  return new;
end $$;
drop trigger if exists sanila_demo_session_scope_guard on public.sanila_demo_sessions;
create trigger sanila_demo_session_scope_guard before insert or update of grant_id,config_id,school_id on public.sanila_demo_sessions for each row execute function public.sanila_validate_demo_session_scope();

create or replace function public.sanila_validate_demo_side_effect_scope()
returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from public.sanila_demo_configs c where c.id=new.config_id and c.school_id=new.school_id) then raise exception 'SANILA Demo side-effect config/school scope mismatch'; end if;
  return new;
end $$;
drop trigger if exists sanila_demo_side_effect_scope_guard on public.sanila_demo_side_effect_events;
create trigger sanila_demo_side_effect_scope_guard before insert or update of config_id,school_id on public.sanila_demo_side_effect_events for each row execute function public.sanila_validate_demo_side_effect_scope();

create or replace function public.sanila_master_demo_fixture_uuid(p_config_id uuid, p_fixture_key text)
returns uuid language sql immutable strict as $$
  select (substr(md5(p_config_id::text || ':' || p_fixture_key),1,8)||'-'||substr(md5(p_config_id::text || ':' || p_fixture_key),9,4)||'-4'||substr(md5(p_config_id::text || ':' || p_fixture_key),14,3)||'-a'||substr(md5(p_config_id::text || ':' || p_fixture_key),18,3)||'-'||substr(md5(p_config_id::text || ':' || p_fixture_key),21,12))::uuid
$$;

create or replace function public.sanila_is_master_demo_school(p_school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sanila_demo_configs c
    join public.angelcare360_schools s on s.id = c.school_id
    join public.angelcare360_operator_tenants t on t.id = c.operator_tenant_id and t.school_id = s.id
    where c.school_id = p_school_id and c.classification = 'master_demo' and c.billing_mode = 'non_billable'
      and c.safety_status = 'enforced' and c.active = true
      and s.metadata_json->>'sanila_master_demo' = 'true'
  )
$$;

create or replace function public.sanila_configure_master_demo(p_operator_tenant_id uuid,p_school_id uuid,p_school_admin_app_user_id uuid,p_actor_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result public.sanila_demo_configs%rowtype;
begin
  if not exists(select 1 from public.angelcare360_operator_tenants t where t.id=p_operator_tenant_id and t.school_id=p_school_id and t.status='active') then raise exception 'Active Operator tenant is not linked to the requested school'; end if;
  if not exists(select 1 from public.angelcare360_schools s where s.id=p_school_id and s.status='active') then raise exception 'Active school is required'; end if;
  if not exists(select 1 from public.app_users u where u.id=p_school_admin_app_user_id and u.status='active') then raise exception 'Active School Admin identity is required'; end if;
  if not exists(select 1 from public.angelcare360_user_roles ur where ur.app_user_id=p_school_admin_app_user_id and ur.school_id=p_school_id and ur.status='active') then raise exception 'Active School Admin school role is required'; end if;
  update public.angelcare360_schools set metadata_json=coalesce(metadata_json,'{}'::jsonb)||jsonb_build_object('sanila_master_demo',true,'fictional',true),updated_at=now() where id=p_school_id;
  insert into public.sanila_demo_configs(operator_tenant_id,school_id,school_admin_app_user_id,classification,active,access_status,billing_mode,seed_version,safety_status,created_by,updated_by)
  values(p_operator_tenant_id,p_school_id,p_school_admin_app_user_id,'master_demo',true,'active','non_billable','SANILA_MASTER_DEMO_SEED_2026_09_V1','enforced',p_actor_user_id,p_actor_user_id)
  on conflict(operator_tenant_id) do update set school_id=excluded.school_id,school_admin_app_user_id=excluded.school_admin_app_user_id,classification='master_demo',active=true,access_status='active',billing_mode='non_billable',seed_version='SANILA_MASTER_DEMO_SEED_2026_09_V1',safety_status='enforced',updated_by=p_actor_user_id,updated_at=now()
  returning * into result;
  insert into public.sanila_demo_access_events(config_id,actor_user_id,event_type,severity,metadata) values(result.id,p_actor_user_id,'environment_configured','notice',jsonb_build_object('operator_tenant_id',p_operator_tenant_id,'school_id',p_school_id));
  return to_jsonb(result);
end $$;

create or replace function public.sanila_master_demo_upsert(p_config_id uuid, p_table text, p_fixture_key text, p_payload jsonb, p_required boolean default true)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_rel regclass; v_id uuid; v_cols text; v_values text; v_updates text; v_missing text[]; v_sql text;
begin
  if p_table !~ '^angelcare360_[a-z0-9_]+$' then raise exception 'Unsafe demo seed table: %', p_table; end if;
  v_rel := to_regclass('public.' || p_table);
  if v_rel is null then if p_required then raise exception 'Required SANILA table missing: %', p_table; end if; return false; end if;
  v_id := public.sanila_master_demo_fixture_uuid(p_config_id, p_fixture_key);
  p_payload := p_payload || jsonb_build_object('id', v_id);
  select array_agg(c.column_name order by c.ordinal_position) into v_missing
    from information_schema.columns c where c.table_schema='public' and c.table_name=p_table
      and c.is_nullable='NO' and c.column_default is null and coalesce(c.is_generated,'NEVER')='NEVER' and not (p_payload ? c.column_name);
  if coalesce(array_length(v_missing,1),0)>0 then
    if p_required then raise exception 'Seed payload % missing columns for %: %', p_fixture_key,p_table,array_to_string(v_missing,','); end if;
    return false;
  end if;
  select string_agg(format('%I',c.column_name),', ' order by c.ordinal_position),
         string_agg(format('r.%I',c.column_name),', ' order by c.ordinal_position),
         string_agg(format('%I=excluded.%I',c.column_name,c.column_name),', ' order by c.ordinal_position)
    into v_cols,v_values,v_updates from information_schema.columns c
    where c.table_schema='public' and c.table_name=p_table and p_payload ? c.column_name and coalesce(c.is_generated,'NEVER')='NEVER';
  v_sql := format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) r on conflict (id) do update set %s',p_table,v_cols,v_values,p_table,v_updates);
  execute v_sql using p_payload;
  return true;
end $$;

create or replace function public.sanila_seed_master_demo(p_config_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.sanila_demo_configs%rowtype; y uuid; class_id uuid; section_id uuid; student_id uuid; parent_id uuid; staff_id uuid;
  subject_id uuid; session_id uuid; invoice_id uuid; payment_id uuid; route_id uuid; vehicle_id uuid; stop_id uuid; book_id uuid; copy_id uuid; exam_id uuid; payroll_record_id uuid;
  i int; j int; k int; level_idx int; present_count int; absent_count int; late_count int; amount numeric; paid numeric;
  first_names text[] := array['Lina','Yasmine','Adam','Aya','Rayan','Nour','Ilyas','Maya','Youssef','Salma','Amine','Meryem','Omar','Sara','Mehdi','Ines','Anas','Leila','Samir','Nadia'];
  last_names text[] := array['Idrissi','Alaoui','Bennani','El Fassi','Amrani','Tazi','Berrada','Chraibi','Benjelloun','Skalli','Lahlou','Zerhouni','Kettani','Mansouri','Fassi'];
  levels text[] := array['Maternelle','CP','CE1','CE2','CM1','CM2','6e','5e','4e','3e','Tronc commun','1re Bac'];
  subjects text[] := array['Français','Arabe','Anglais','Mathématiques','Sciences','Histoire-Géographie','Informatique','Arts','Éducation physique','Éducation islamique','Physique-Chimie','Vie scolaire'];
  counts jsonb; verification jsonb;
begin
  select * into c from public.sanila_demo_configs where id=p_config_id for update;
  if not found or c.classification<>'master_demo' or c.billing_mode<>'non_billable' or c.safety_status<>'enforced' or not c.active then raise exception 'Target is not an enforced Master Demo configuration'; end if;
  if not exists(select 1 from public.angelcare360_operator_tenants t where t.id=c.operator_tenant_id and t.school_id=c.school_id and t.status='active') then raise exception 'Master Demo tenant/school relationship is invalid'; end if;
  update public.angelcare360_schools set name='SANILA INTERNATIONAL SCHOOL — DEMO', legal_name='SANILA International School Demo (fictional)', school_code='SANILA-MASTER-DEMO', school_type='ecole_privee', country='Maroc', city='Casablanca', address='Boulevard Démonstration, Casablanca (adresse fictive)', phone='+212000000000', email='direction@sanila-demo.invalid', website='https://sanila-demo.invalid', language='fr', currency='MAD', timezone='Africa/Casablanca', status='active', metadata_json=coalesce(metadata_json,'{}')||jsonb_build_object('sanila_master_demo',true,'fictional',true,'seed_version','SANILA_MASTER_DEMO_SEED_2026_09_V1'), updated_at=now() where id=c.school_id;
  if not public.sanila_is_master_demo_school(c.school_id) then raise exception 'Deterministic Master Demo classification failed'; end if;
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_school_settings','school-settings',jsonb_build_object('school_id',c.school_id,'default_language','fr','default_currency','MAD','default_timezone','Africa/Casablanca','academic_year_start_month',9,'week_start_day',1,'grading_scale','0-20','attendance_grace_minutes',10,'allow_parent_portal',true,'allow_student_portal',true,'communication_sender_name','SANILA International School — Démo','school_year_label_format','YYYY-YYYY+1','status','active','metadata_json',jsonb_build_object('demo',true,'fixture_key','school-settings')));
  y:=public.sanila_master_demo_fixture_uuid(c.id,'academic-year:2026-2027');
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_academic_years','academic-year:2026-2027',jsonb_build_object('school_id',c.school_id,'year_code','2026-2027','label','2026–2027','starts_on','2026-09-01','ends_on','2027-06-30','is_current',true,'status','active','metadata_json',jsonb_build_object('demo',true,'fixture_key','academic-year:2026-2027')));
  for i in 1..3 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_terms','term:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'term_code','DEMO-T'||i,'label','Trimestre '||i,'starts_on',(array['2026-09-01','2027-01-04','2027-04-05'])[i],'ends_on',(array['2026-12-18','2027-03-26','2027-06-30'])[i],'order_index',i,'status',case when i=1 then 'active' else 'planned' end,'metadata_json',jsonb_build_object('demo',true))); end loop;
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_governance_sites','site:casablanca',jsonb_build_object('school_id',c.school_id,'site_code','DEMO-CASA','name','Campus Casablanca — Démo','site_type','campus','city','Casablanca','country','Maroc','timezone','Africa/Casablanca','status','active','metadata_json',jsonb_build_object('demo',true)));
  for i in 1..12 loop subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||i); perform public.sanila_master_demo_upsert(c.id,'angelcare360_subjects','subject:'||i,jsonb_build_object('school_id',c.school_id,'subject_code','DEMO-SUB-'||lpad(i::text,2,'0'),'name',subjects[i],'short_name',subjects[i],'department','Pédagogie','credit_hours',case when i<=6 then 4 else 2 end,'status','active','metadata_json',jsonb_build_object('demo',true))); end loop;
  for i in 1..72 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_staff','staff:'||i,jsonb_build_object('school_id',c.school_id,'staff_code','DEMO-STF-'||lpad(i::text,3,'0'),'staff_type',case when i=1 then 'direction' when i<=6 then 'administration' when i<=54 then 'enseignant' else 'support' end,'first_name',first_names[1+((i-1)%array_length(first_names,1))],'last_name',last_names[1+(((i*3)-1)%array_length(last_names,1))],'full_name',first_names[1+((i-1)%array_length(first_names,1))]||' '||last_names[1+(((i*3)-1)%array_length(last_names,1))],'email','staff.'||lpad(i::text,3,'0')||'@sanila-demo.invalid','phone','+2120001'||lpad(i::text,5,'0'),'hire_date','2024-09-02','department',case when i=1 then 'Direction' when i<=6 then 'Administration' when i<=54 then 'Pédagogie' else 'Services' end,'status',case when i=72 then 'on_leave' else 'active' end,'metadata_json',jsonb_build_object('demo',true,'fixture_key','staff:'||i)));
    staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_staff_contracts','staff-contract:'||i,jsonb_build_object('school_id',c.school_id,'staff_id',staff_id,'contract_number','DEMO-CDI-'||lpad(i::text,3,'0'),'contract_type','CDI','starts_on','2024-09-02','employment_type','full_time','salary_amount',6500+(i%9)*450,'currency','MAD','workload_percent',100,'status','active','metadata_json',jsonb_build_object('demo',true)),false);
  end loop;
  for i in 1..36 loop
    level_idx:=1+((i-1)/3); class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||i); section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||i); staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i-1)%48)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_classes','class:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_code','DEMO-'||lpad(level_idx::text,2,'0')||'-'||chr(64+(((i-1)%3)+1)),'name',levels[level_idx]||' '||chr(64+(((i-1)%3)+1)),'level',lower(replace(levels[level_idx],' ', '_')),'capacity',22,'order_index',i,'homeroom_staff_id',staff_id,'status','active','metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_sections','section:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_code','DEMO-SEC-'||lpad(i::text,2,'0'),'name',levels[level_idx]||' '||chr(64+(((i-1)%3)+1)),'capacity',22,'room','Salle '||lpad(i::text,2,'0'),'status','active','metadata_json',jsonb_build_object('demo',true)));
    for j in 1..4 loop subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((level_idx+j-2)%12))); staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i+j-2)%48)));
      perform public.sanila_master_demo_upsert(c.id,'angelcare360_class_subjects','class-subject:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'subject_id',subject_id,'teacher_id',staff_id,'coefficient',case when j<=2 then 2 else 1 end,'is_required',true,'status','active','metadata_json',jsonb_build_object('demo',true)));
      perform public.sanila_master_demo_upsert(c.id,'angelcare360_teacher_assignments','teacher-assignment:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'staff_id',staff_id,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'assignment_role','teacher','weekly_hours',3,'status','active','metadata_json',jsonb_build_object('demo',true)),false);
    end loop;
    subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((level_idx-1)%12)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_lessons','lesson:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'staff_id',staff_id,'lesson_code','DEMO-LEC-'||lpad(i::text,3,'0'),'lesson_date','2026-09-02','topic','Séquence de rentrée '||levels[level_idx],'objectives','Diagnostic et objectifs du trimestre','status',case when i%7=0 then 'planned' else 'delivered' end,'metadata_json',jsonb_build_object('demo',true)),false);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_assignments','assignment:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'created_by_staff_id',staff_id,'assignment_code','DEMO-DEV-'||lpad(i::text,3,'0'),'title','Travail de consolidation '||i,'description','Exercice fictif du Master Demo','due_on','2026-09-18','max_score',20,'status',case when i%5=0 then 'due' else 'published' end,'metadata_json',jsonb_build_object('demo',true)),false);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_exams','exam:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'exam_code','DEMO-EXAM-'||lpad(i::text,3,'0'),'title','Évaluation diagnostique '||levels[level_idx],'exam_type','diagnostic','scheduled_on','2026-09-10','duration_minutes',60,'max_score',20,'status','graded','metadata_json',jsonb_build_object('demo',true)),false);
  end loop;
  for i in 1..450 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_parents','parent:'||i,jsonb_build_object('school_id',c.school_id,'parent_code','DEMO-PAR-'||lpad(i::text,4,'0'),'first_name',first_names[1+((i+4)%array_length(first_names,1))],'last_name',last_names[1+(((i*5)-1)%array_length(last_names,1))],'full_name',first_names[1+((i+4)%array_length(first_names,1))]||' '||last_names[1+(((i*5)-1)%array_length(last_names,1))],'email','guardian.'||lpad(i::text,4,'0')||'@sanila-demo.invalid','phone','+2120002'||lpad(i::text,5,'0'),'whatsapp','+2120002'||lpad(i::text,5,'0'),'occupation',(array['Architecte','Médecin','Ingénieur','Enseignant','Entrepreneur','Cadre'])[1+((i-1)%6)],'address','Casablanca — adresse fictive','preferred_language',case when i%9=0 then 'ar' else 'fr' end,'status','active','metadata_json',jsonb_build_object('demo',true,'family_code','DEMO-FAM-'||lpad(i::text,4,'0')))); end loop;
  for i in 1..600 loop
    class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||(1+((i-1)%36))); section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||(1+((i-1)%36))); student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i); parent_id:=public.sanila_master_demo_fixture_uuid(c.id,'parent:'||(1+((i-1)%450)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_students','student:'||i,jsonb_build_object('school_id',c.school_id,'student_code','DEMO-STU-'||lpad(i::text,4,'0'),'first_name',first_names[1+((i-1)%array_length(first_names,1))],'last_name',last_names[1+(((i*7)-1)%array_length(last_names,1))],'full_name',first_names[1+((i-1)%array_length(first_names,1))]||' '||last_names[1+(((i*7)-1)%array_length(last_names,1))],'gender',case when i%2=0 then 'female' else 'male' end,'date_of_birth',('2009-01-01'::date+((i*11)%4000))::text,'national_id',null,'current_class_id',class_id,'current_section_id',section_id,'admission_status','enrolled','status','active','admission_date','2026-09-01','transport_required',i<=300,'metadata_json',jsonb_build_object('demo',true,'fixture_key','student:'||i)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_student_parent_links','student-parent:'||i,jsonb_build_object('school_id',c.school_id,'student_id',student_id,'parent_id',parent_id,'relationship_type',case when i%2=0 then 'mother' else 'father' end,'is_primary',true,'is_guardian',true,'can_pickup',true,'can_receive_messages',true,'can_pay_fees',true,'status','active','metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_class_enrollments','enrollment:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'class_id',class_id,'section_id',section_id,'enrollment_number','DEMO-ENR-'||lpad(i::text,4,'0'),'enrollment_status','enrolled','enrolled_on','2026-09-01','status','active','metadata_json',jsonb_build_object('demo',true)));
    exam_id:=public.sanila_master_demo_fixture_uuid(c.id,'exam:'||(1+((i-1)%36))); subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((((1+((i-1)%36))-1)/3)%12))); perform public.sanila_master_demo_upsert(c.id,'angelcare360_marks','mark:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'subject_id',subject_id,'exam_id',exam_id,'assessment_type','diagnostic','score',10+(i%11),'max_score',20,'grade',case when i%11<5 then 'Bien' else 'Très bien' end,'recorded_by_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i-1)%48))),'recorded_at','2026-09-11T10:00:00Z','status','active','mark_state',case when i%97=0 then 'absent' else 'present' end,'metadata_json',jsonb_build_object('demo',true)),false);
  end loop;
  for i in 1..60 loop parent_id:=public.sanila_master_demo_fixture_uuid(c.id,'parent:'||i); perform public.sanila_master_demo_upsert(c.id,'angelcare360_admission_applications','admission:'||i,jsonb_build_object('school_id',c.school_id,'application_code','DEMO-ADM-'||lpad(i::text,3,'0'),'parent_id',parent_id,'academic_year_id',y,'class_id',public.sanila_master_demo_fixture_uuid(c.id,'class:'||(1+((i-1)%36))),'section_id',public.sanila_master_demo_fixture_uuid(c.id,'section:'||(1+((i-1)%36))),'application_stage',case when i<=30 then 'accepted' when i<=45 then 'pending_review' when i<=54 then 'rejected' else 'withdrawn' end,'application_date','2026-08-15','decision_date',case when i<=30 or i>45 then '2026-08-24' else null end,'decision_reason',case when i>45 then 'Décision fictive de démonstration' else null end,'status',case when i<=30 then 'approved' when i<=45 then 'in_review' when i<=54 then 'rejected' else 'archived' end,'metadata_json',jsonb_build_object('demo',true))); end loop;
  for j in 1..10 loop
    for i in 1..36 loop
      class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||i); section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||i); session_id:=public.sanila_master_demo_fixture_uuid(c.id,'attendance-session:'||j||':'||i); present_count:=0; absent_count:=0; late_count:=0;
      for k in i..600 by 36 loop if (k+j)%41=0 then absent_count:=absent_count+1; elsif (k+j)%23=0 then late_count:=late_count+1; else present_count:=present_count+1; end if; end loop;
      perform public.sanila_master_demo_upsert(c.id,'angelcare360_attendance_sessions','attendance-session:'||j||':'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'session_date',('2026-09-01'::date+j)::text,'session_type','daily','source','manual','total_expected',present_count+absent_count+late_count,'total_present',present_count,'total_absent',absent_count,'total_late',late_count,'total_excused',0,'status','closed','metadata_json',jsonb_build_object('demo',true)));
      for k in i..600 by 36 loop student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||k); perform public.sanila_master_demo_upsert(c.id,'angelcare360_attendance_records','attendance:'||j||':'||k,jsonb_build_object('school_id',c.school_id,'attendance_session_id',session_id,'student_id',student_id,'attendance_status',case when (k+j)%41=0 then 'absent' when (k+j)%23=0 then 'late' else 'present' end,'check_in_at',case when (k+j)%41=0 then null else ('2026-09-'||lpad((1+j)::text,2,'0')||'T'||case when (k+j)%23=0 then '08:17:00Z' else '07:55:00Z' end) end,'minutes_late',case when (k+j)%23=0 then 17 else 0 end,'mark_source','manual','note',case when (k+j)%41=0 then 'Absence à justifier — démo' else null end,'justification_required',(k+j)%41=0,'status','active','metadata_json',jsonb_build_object('demo',true))); end loop;
    end loop;
  end loop;
  for i in 1..3 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_fee_structures','fee-structure:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'fee_code','DEMO-FEE-'||i,'label',(array['Scolarité','Transport','Activités'])[i],'description','Barème fictif Master Demo','due_day_of_month',5,'currency','MAD','applies_to_level',null,'status','active','metadata_json',jsonb_build_object('demo',true))); end loop;
  for i in 1..4 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_fee_items','fee-item:'||i,jsonb_build_object('school_id',c.school_id,'fee_structure_id',public.sanila_master_demo_fixture_uuid(c.id,'fee-structure:'||(1+((i-1)%3))),'item_code','DEMO-FEE-ITEM-'||i,'label',(array['Scolarité septembre','Transport septembre','Activité scientifique','Scolarité octobre'])[i],'fee_type',case when i=2 then 'transport' else 'tuition' end,'amount',(array[3200,700,450,3200])[i],'due_on',(array['2026-09-05','2026-09-05','2026-09-20','2026-10-05'])[i],'is_required',i<>3,'status','active','metadata_json',jsonb_build_object('demo',true))); end loop;
  for i in 1..600 loop
    student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i); invoice_id:=public.sanila_master_demo_fixture_uuid(c.id,'invoice:'||i); amount:=case when i%7=0 then 3900 else 3200 end; paid:=case when i%10<5 then amount when i%10<8 then amount/2 else 0 end;
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_invoices','invoice:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'invoice_number','DEMO-INV-'||lpad(i::text,4,'0'),'invoice_type','tuition','invoice_date','2026-09-01','due_date','2026-09-05','currency','MAD','subtotal_amount',amount,'discount_total',case when i%10=0 then 200 else 0 end,'tax_total',0,'total_amount',amount,'amount_paid',paid,'status',case when paid=amount then 'paid' when paid>0 then 'partially_paid' when i%3=0 then 'overdue' else 'issued' end,'metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_invoice_lines','invoice-line:'||i,jsonb_build_object('school_id',c.school_id,'invoice_id',invoice_id,'fee_item_id',public.sanila_master_demo_fixture_uuid(c.id,'fee-item:1'),'line_code','DEMO-LINE-'||lpad(i::text,4,'0'),'label','Scolarité septembre 2026','quantity',1,'unit_amount',amount,'line_total',amount,'status','active','metadata_json',jsonb_build_object('demo',true)));
    if paid>0 then payment_id:=public.sanila_master_demo_fixture_uuid(c.id,'payment:'||i); perform public.sanila_master_demo_upsert(c.id,'angelcare360_payments','payment:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'invoice_id',invoice_id,'student_id',student_id,'payment_number','DEMO-PAY-'||lpad(i::text,4,'0'),'payment_date','2026-09-04','method','bank_transfer','amount',paid,'allocated_amount',paid,'reference','DEMO-REF-'||lpad(i::text,4,'0'),'status','allocated','metadata_json',jsonb_build_object('demo',true))); perform public.sanila_master_demo_upsert(c.id,'angelcare360_receipts','receipt:'||i,jsonb_build_object('school_id',c.school_id,'payment_id',payment_id,'receipt_number','DEMO-REC-'||lpad(i::text,4,'0'),'issued_at','2026-09-04T10:00:00Z','status','issued','metadata_json',jsonb_build_object('demo',true)),false); end if;
    if i%10=0 then perform public.sanila_master_demo_upsert(c.id,'angelcare360_discounts','discount:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'invoice_id',invoice_id,'discount_code','DEMO-DISC-'||lpad(i::text,4,'0'),'discount_type','fixed','amount',200,'reason','Remise fratrie fictive','status','applied','metadata_json',jsonb_build_object('demo',true))); end if;
  end loop;
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_periods','payroll-period:sep',jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'period_code','DEMO-PAYROLL-2026-09','label','Paie septembre 2026','starts_on','2026-09-01','ends_on','2026-09-30','payment_date','2026-09-29','status','review','metadata_json',jsonb_build_object('demo',true)),false);
  for i in 1..72 loop staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i); payroll_record_id:=public.sanila_master_demo_fixture_uuid(c.id,'payroll-record:'||i); perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_records','payroll-record:'||i,jsonb_build_object('school_id',c.school_id,'payroll_period_id',public.sanila_master_demo_fixture_uuid(c.id,'payroll-period:sep'),'staff_id',staff_id,'payroll_number','DEMO-PR-'||lpad(i::text,3,'0'),'base_salary',6500+(i%9)*450,'gross_amount',6800+(i%9)*450,'deductions_total',case when i%11=0 then 350 else 200 end,'bonuses_total',300,'net_amount',6900+(i%9)*450-(case when i%11=0 then 350 else 200 end),'payment_status',case when i%11=0 then 'pending' else 'paid' end,'paid_at',case when i%11=0 then null else '2026-09-29T12:00:00Z' end,'status',case when i%11=0 then 'approved' else 'paid' end,'metadata_json',jsonb_build_object('demo',true,'attention_required',i%11=0)),false); for j in 1..2 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_items','payroll-item:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'payroll_record_id',payroll_record_id,'item_code','DEMO-PRI-'||i||'-'||j,'item_type',case when j=1 then 'earning' else 'deduction' end,'label',case when j=1 then 'Salaire de base' else 'Cotisation fictive' end,'amount',case when j=1 then 6500+(i%9)*450 else 200 end,'notes',case when i%11=0 and j=2 then 'Contrôle requis — démo' else null end,'status','active','metadata_json',jsonb_build_object('demo',true)),false); end loop; end loop;
  for i in 1..8 loop
    vehicle_id:=public.sanila_master_demo_fixture_uuid(c.id,'vehicle:'||i); route_id:=public.sanila_master_demo_fixture_uuid(c.id,'route:'||i); staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(55+i));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_transport_vehicles','vehicle:'||i,jsonb_build_object('school_id',c.school_id,'vehicle_code','DEMO-BUS-'||lpad(i::text,2,'0'),'plate_number','DEMO-'||lpad(i::text,4,'0'),'model','Minibus scolaire fictif','capacity_seats',45,'assigned_driver_staff_id',staff_id,'insurance_expires_on','2027-04-30','status',case when i=8 then 'maintenance' else 'active' end,'metadata_json',jsonb_build_object('demo',true,'exception',i=8)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_transport_routes','route:'||i,jsonb_build_object('school_id',c.school_id,'route_code','DEMO-ROUTE-'||lpad(i::text,2,'0'),'label','Circuit Casablanca '||i,'route_type','school_bus','responsible_staff_id',staff_id,'status',case when i=8 then 'suspended' else 'active' end,'vehicle_id',vehicle_id,'accompagnateur_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(63+((i-1)%8))),'capacity_seats',45,'metadata_json',jsonb_build_object('demo',true)));
    for j in 1..5 loop stop_id:=public.sanila_master_demo_fixture_uuid(c.id,'stop:'||i||':'||j); perform public.sanila_master_demo_upsert(c.id,'angelcare360_transport_stops','stop:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'route_id',route_id,'stop_code','DEMO-STOP-'||i||'-'||j,'label',(array['Maarif','Racine','Bourgogne','Anfa','Oasis'])[j]||' — arrêt fictif','order_index',j,'latitude',33.55+(i::numeric/1000)+(j::numeric/10000),'longitude',-7.65+(i::numeric/1000),'planned_time',('07:'||lpad((5+j*6)::text,2,'0')),'status','active','metadata_json',jsonb_build_object('demo',true))); end loop;
  end loop;
  for i in 1..300 loop student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i); route_id:=public.sanila_master_demo_fixture_uuid(c.id,'route:'||(1+((i-1)%8))); vehicle_id:=public.sanila_master_demo_fixture_uuid(c.id,'vehicle:'||(1+((i-1)%8))); stop_id:=public.sanila_master_demo_fixture_uuid(c.id,'stop:'||(1+((i-1)%8))||':'||(1+((i-1)%5))); perform public.sanila_master_demo_upsert(c.id,'angelcare360_transport_assignments','transport-assignment:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'route_id',route_id,'student_id',student_id,'vehicle_id',vehicle_id,'pickup_stop_id',stop_id,'dropoff_stop_id',stop_id,'assigned_on','2026-09-01','status',case when i%73=0 then 'pending' else 'active' end,'metadata_json',jsonb_build_object('demo',true,'exception',i%73=0))); end loop;
  for i in 1..120 loop book_id:=public.sanila_master_demo_fixture_uuid(c.id,'library-book:'||i); copy_id:=public.sanila_master_demo_fixture_uuid(c.id,'library-copy:'||i); perform public.sanila_master_demo_upsert(c.id,'angelcare360_library_books','library-book:'||i,jsonb_build_object('school_id',c.school_id,'book_code','DEMO-BOOK-'||lpad(i::text,3,'0'),'isbn',null,'title','Ouvrage pédagogique fictif '||i,'author','Auteur Démo '||(1+((i-1)%20)),'publisher','Éditions SANILA Démo','category',(array['Jeunesse','Sciences','Littérature','Langues'])[1+((i-1)%4)],'language',case when i%5=0 then 'ar' else 'fr' end,'status','active','metadata_json',jsonb_build_object('demo',true))); perform public.sanila_master_demo_upsert(c.id,'angelcare360_library_copies','library-copy:'||i,jsonb_build_object('school_id',c.school_id,'book_id',book_id,'copy_code','DEMO-COPY-'||lpad(i::text,3,'0'),'barcode','DEMOBC'||lpad(i::text,6,'0'),'acquisition_date','2026-08-15','shelf_location','R-'||(1+((i-1)%8)),'condition','good','status',case when i<=45 then 'loaned' else 'available' end,'metadata_json',jsonb_build_object('demo',true))); if i<=45 then perform public.sanila_master_demo_upsert(c.id,'angelcare360_library_loans','library-loan:'||i,jsonb_build_object('school_id',c.school_id,'copy_id',copy_id,'borrower_type','student','borrower_student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'loaned_at','2026-09-01T10:00:00Z','due_at',case when i=1 then '2026-09-05T17:00:00Z' else '2026-09-25T17:00:00Z' end,'fine_amount',case when i=1 then 10 else 0 end,'status',case when i=1 then 'overdue' else 'open' end,'metadata_json',jsonb_build_object('demo',true))); end if; end loop;
  for i in 1..4 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_inventory_categories','inventory-category:'||i,jsonb_build_object('school_id',c.school_id,'category_code','DEMO-INV-CAT-'||i,'label',(array['Pédagogie','Administration','Entretien','Informatique'])[i],'description','Catégorie fictive Master Demo','status','active','metadata_json',jsonb_build_object('demo',true))); end loop;
  for i in 1..40 loop amount:=case when i<=5 then 2 when i<=8 then 0 else 20+(i%15) end; perform public.sanila_master_demo_upsert(c.id,'angelcare360_inventory_items','inventory-item:'||i,jsonb_build_object('school_id',c.school_id,'category_id',public.sanila_master_demo_fixture_uuid(c.id,'inventory-category:'||(1+((i-1)%4))),'item_code','DEMO-INV-'||lpad(i::text,3,'0'),'label','Article scolaire fictif '||i,'unit_of_measure','unité','current_stock',amount,'reorder_level',5,'purchase_price',25+(i%10)*5,'status',case when amount=0 then 'out_of_stock' when amount<5 then 'low_stock' else 'active' end,'responsible_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(55+((i-1)%18))),'metadata_json',jsonb_build_object('demo',true))); perform public.sanila_master_demo_upsert(c.id,'angelcare360_inventory_movements','inventory-movement:'||i,jsonb_build_object('school_id',c.school_id,'item_id',public.sanila_master_demo_fixture_uuid(c.id,'inventory-item:'||i),'movement_code','DEMO-MOVE-'||lpad(i::text,3,'0'),'movement_type','in','quantity',amount,'movement_date','2026-08-25','reference_type','initial_demo_stock','notes','Mouvement fictif canonique','status','active','metadata_json',jsonb_build_object('demo',true)),false); end loop;
  for i in 1..12 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_messages','message:'||i,jsonb_build_object('school_id',c.school_id,'message_code','DEMO-MSG-'||lpad(i::text,2,'0'),'sender_role',case when i%3=0 then 'comptabilite' else 'direction' end,'subject',(array['Rentrée 2026','Rappel transport','Activités pédagogiques','Facture disponible'])[1+((i-1)%4)],'body','Communication interne fictive du Master Demo.','message_type','internal','sent_at','2026-09-03T08:00:00Z','status','sent','metadata_json',jsonb_build_object('demo',true,'external_delivery','simulated'))); end loop;
  for i in 1..40 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_message_recipients','message-recipient:'||i,jsonb_build_object('school_id',c.school_id,'message_id',public.sanila_master_demo_fixture_uuid(c.id,'message:'||(1+((i-1)%12))),'recipient_parent_id',public.sanila_master_demo_fixture_uuid(c.id,'parent:'||i),'delivery_status',case when i<=12 then 'pending' when i%3=0 then 'read' else 'delivered' end,'read_at',case when i>12 and i%3=0 then '2026-09-03T10:00:00Z' else null end,'status','active','metadata_json',jsonb_build_object('demo',true)),false); end loop;
  for i in 1..20 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_notifications','notification:'||i,jsonb_build_object('school_id',c.school_id,'notification_code','DEMO-NOTIF-'||lpad(i::text,3,'0'),'recipient_parent_id',public.sanila_master_demo_fixture_uuid(c.id,'parent:'||i),'recipient_role','parent','channel','in_app','title','Notification SANILA Démo '||i,'body','Notification fictive et sans effet externe.','scheduled_for','2026-09-03T09:00:00Z','status',case when i<=8 then 'scheduled' else 'sent' end,'metadata_json',jsonb_build_object('demo',true,'unread',i<=8)),false); end loop;
  for i in 1..8 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_reclamations','claim:'||i,jsonb_build_object('school_id',c.school_id,'reclamation_code','DEMO-RECL-'||lpad(i::text,2,'0'),'reporter_role','parent','subject','Réclamation fictive '||i,'description','Dossier de démonstration sans donnée client.','related_entity_type',case when i%2=0 then 'transport' else 'attendance' end,'priority',case when i=1 then 'high' else 'medium' end,'status',case when i<=3 then 'open' else 'resolved' end,'resolved_at',case when i<=3 then null else '2026-09-02T14:00:00Z' end,'resolution_notes',case when i<=3 then null else 'Résolution fictive enregistrée' end,'submitted_by_parent_id',public.sanila_master_demo_fixture_uuid(c.id,'parent:'||i),'metadata_json',jsonb_build_object('demo',true))); end loop;
  for i in 1..4 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_reports','report:'||i,jsonb_build_object('school_id',c.school_id,'report_code','DEMO-RPT-'||i,'report_family',(array['attendance','finance','academics','operations'])[i],'label','Rapport Master Demo '||i,'description','Rapport fictif 2026–2027','owner_role','direction','status','active','config_json',jsonb_build_object('demo',true),'metadata_json',jsonb_build_object('demo',true)),false); end loop;
  for i in 1..12 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_audit_logs','audit:'||i,jsonb_build_object('school_id',c.school_id,'actor_role','system','module',(array['seed','attendance','finance','transport'])[1+((i-1)%4)],'action','demo_fixture_event','entity_type','master_demo','entity_id',c.school_id,'severity',case when i=1 then 'warning' else 'info' end,'before_data','{}'::jsonb,'after_data',jsonb_build_object('fixture',i),'metadata',jsonb_build_object('demo',true)),false); end loop;
  update public.sanila_demo_configs set seed_version='SANILA_MASTER_DEMO_SEED_2026_09_V1' where id=c.id;
  verification:=public.sanila_verify_master_demo(c.id);
  if not coalesce((verification->>'ok')::boolean,false) then raise exception 'Canonical seed verification failed: %',verification; end if;
  counts:=verification->'counts';
  update public.sanila_demo_configs set seed_version='SANILA_MASTER_DEMO_SEED_2026_09_V1',seed_health='healthy',seeded_at=now(),verified_at=now(),last_seed_verified_at=now(),seed_counts=counts,reset_failure=null,updated_at=now() where id=c.id;
  insert into public.sanila_demo_access_events(config_id,event_type,severity,metadata) values(c.id,'canonical_seed_completed','notice',jsonb_build_object('seed_version','SANILA_MASTER_DEMO_SEED_2026_09_V1','counts',counts));
  return jsonb_build_object('ok',true,'seed_version','SANILA_MASTER_DEMO_SEED_2026_09_V1','counts',counts);
end $$;

create or replace function public.sanila_verify_master_demo(p_config_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.sanila_demo_configs%rowtype; counts jsonb; expected jsonb; failures jsonb:='[]'::jsonb; bad int; result jsonb; item record;
begin
  select * into c from public.sanila_demo_configs where id=p_config_id;
  if not found then return jsonb_build_object('ok',false,'failures',jsonb_build_array('CONFIG_MISSING')); end if;
  if c.classification<>'master_demo' or c.billing_mode<>'non_billable' or c.safety_status<>'enforced' or not c.active then failures:=failures||jsonb_build_array('CLASSIFICATION_OR_SAFETY_INVALID'); end if;
  if not public.sanila_is_master_demo_school(c.school_id) then failures:=failures||jsonb_build_array('SCHOOL_NOT_DETERMINISTICALLY_MASTER_DEMO'); end if;
  if c.seed_version<>'SANILA_MASTER_DEMO_SEED_2026_09_V1' then failures:=failures||jsonb_build_array('SEED_VERSION_MISMATCH'); end if;
  select jsonb_build_object('schools',1,'sites',(select count(*) from public.angelcare360_governance_sites where school_id=c.school_id and status='active'),'students',(select count(*) from public.angelcare360_students where school_id=c.school_id and status='active'),'parents',(select count(*) from public.angelcare360_parents where school_id=c.school_id and status='active'),'classes',(select count(*) from public.angelcare360_classes where school_id=c.school_id and status='active'),'employees',(select count(*) from public.angelcare360_staff where school_id=c.school_id),'teachers',(select count(*) from public.angelcare360_staff where school_id=c.school_id and staff_type='enseignant'),'admissions',(select count(*) from public.angelcare360_admission_applications where school_id=c.school_id),'attendance',(select count(*) from public.angelcare360_attendance_records where school_id=c.school_id),'invoices',(select count(*) from public.angelcare360_invoices where school_id=c.school_id),'payments',(select count(*) from public.angelcare360_payments where school_id=c.school_id),'transport',(select count(*) from public.angelcare360_transport_assignments where school_id=c.school_id),'library',(select count(*) from public.angelcare360_library_books where school_id=c.school_id),'library_loans',(select count(*) from public.angelcare360_library_loans where school_id=c.school_id),'inventory',(select count(*) from public.angelcare360_inventory_items where school_id=c.school_id),'claims',(select count(*) from public.angelcare360_reclamations where school_id=c.school_id)) into counts;
  expected:=jsonb_build_object('schools',1,'sites',1,'students',600,'parents',450,'classes',36,'employees',72,'teachers',48,'admissions',60,'attendance',6000,'invoices',600,'payments',480,'transport',300,'library',120,'library_loans',45,'inventory',40,'claims',8);
  for item in select * from jsonb_each_text(expected) loop if coalesce((counts->>item.key)::int,-1)<>item.value::int then failures:=failures||jsonb_build_array('CANONICAL_COUNT_MISMATCH:'||item.key||':'||coalesce(counts->>item.key,'missing')||':expected:'||item.value); end if; end loop;
  if (counts->>'students')::int<500 then failures:=failures||jsonb_build_array('STUDENT_COUNT_BELOW_500'); end if;
  if (counts->>'classes')::int<30 then failures:=failures||jsonb_build_array('CLASS_COUNT_BELOW_30'); end if;
  if (counts->>'employees')::int<60 then failures:=failures||jsonb_build_array('EMPLOYEE_COUNT_BELOW_60'); end if;
  if not exists(select 1 from public.angelcare360_academic_years where school_id=c.school_id and year_code='2026-2027' and status='active') then failures:=failures||jsonb_build_array('ACADEMIC_YEAR_INVALID'); end if;
  select count(*) into bad from public.angelcare360_students s left join public.angelcare360_class_enrollments e on e.student_id=s.id and e.school_id=s.school_id and e.status='active' left join public.angelcare360_student_parent_links l on l.student_id=s.id and l.school_id=s.school_id and l.status='active' where s.school_id=c.school_id and s.status='active' and (e.id is null or l.id is null or s.current_class_id<>e.class_id); if bad>0 then failures:=failures||jsonb_build_array('STUDENT_RELATIONSHIP_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_invoices i where i.school_id=c.school_id and (i.total_amount<0 or i.amount_paid<0 or i.amount_paid>i.total_amount or i.balance_due<>greatest(i.total_amount-i.amount_paid,0)); if bad>0 then failures:=failures||jsonb_build_array('FINANCE_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_payments p where p.school_id=c.school_id and (p.amount<0 or p.allocated_amount<0 or p.allocated_amount>p.amount or (p.invoice_id is not null and not exists(select 1 from public.angelcare360_invoices i where i.id=p.invoice_id and i.school_id=p.school_id))); if bad>0 then failures:=failures||jsonb_build_array('PAYMENT_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_attendance_records r join public.angelcare360_attendance_sessions s on s.id=r.attendance_session_id where r.school_id=c.school_id and (s.school_id<>r.school_id or not exists(select 1 from public.angelcare360_students st where st.id=r.student_id and st.school_id=r.school_id)); if bad>0 then failures:=failures||jsonb_build_array('ATTENDANCE_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_transport_assignments a where a.school_id=c.school_id and (not exists(select 1 from public.angelcare360_students s where s.id=a.student_id and s.school_id=a.school_id) or not exists(select 1 from public.angelcare360_transport_routes r where r.id=a.route_id and r.school_id=a.school_id)); if bad>0 then failures:=failures||jsonb_build_array('TRANSPORT_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_library_loans l join public.angelcare360_library_copies cp on cp.id=l.copy_id join public.angelcare360_library_books b on b.id=cp.book_id where l.school_id=c.school_id and (cp.school_id<>c.school_id or b.school_id<>c.school_id); if bad>0 then failures:=failures||jsonb_build_array('LIBRARY_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_inventory_items i where i.school_id=c.school_id and (i.current_stock<0 or not exists(select 1 from public.angelcare360_inventory_categories cat where cat.id=i.category_id and cat.school_id=i.school_id)); if bad>0 then failures:=failures||jsonb_build_array('INVENTORY_INTEGRITY:'||bad); end if;
  select count(*) into bad from public.angelcare360_students s where s.school_id=c.school_id and (coalesce(s.metadata_json->>'demo','false')<>'true' or s.national_id is not null); if bad>0 then failures:=failures||jsonb_build_array('STUDENT_DEMO_SAFETY:'||bad); end if;
  select (select count(*) from public.angelcare360_parents p where p.school_id=c.school_id and ((p.email is not null and p.email not like '%@sanila-demo.invalid') or (p.phone is not null and p.phone not like '+212000%'))) + (select count(*) from public.angelcare360_staff s where s.school_id=c.school_id and ((s.email is not null and s.email not like '%@sanila-demo.invalid') or (s.phone is not null and s.phone not like '+212000%'))) + (select count(*) from public.angelcare360_schools s where s.id=c.school_id and (s.email is distinct from 'direction@sanila-demo.invalid' or s.phone is distinct from '+212000000000')) into bad; if bad>0 then failures:=failures||jsonb_build_array('REAL_CONTACT_RISK:'||bad); end if;
  result:=jsonb_build_object('ok',jsonb_array_length(failures)=0,'classification',c.classification,'access_status',c.access_status,'billing_mode',c.billing_mode,'safety_status',c.safety_status,'seed_version',c.seed_version,'counts',counts,'failures',failures);
  update public.sanila_demo_configs set seed_health=case when jsonb_array_length(failures)=0 then 'healthy' else 'degraded' end,verified_at=now(),last_seed_verified_at=now(),seed_counts=counts,updated_at=now() where id=c.id;
  return result;
end $$;

create or replace function public.sanila_reset_master_demo(p_config_id uuid, p_requested_by uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.sanila_demo_configs%rowtype; run_id uuid:=gen_random_uuid(); t text; pending_tables text[]; next_pending text[]; result jsonb;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('sanila-master-demo-reset:'||p_config_id::text,0)) then raise exception 'Master Demo reset is already running'; end if;
  select * into c from public.sanila_demo_configs where id=p_config_id for update;
  if not found then return jsonb_build_object('ok',false,'code','RESET_REFUSED_NOT_MASTER_DEMO','reason','CONFIG_NOT_FOUND'); end if;
  if not public.sanila_is_master_demo_school(c.school_id) then insert into public.sanila_demo_reset_runs(id,config_id,status,requested_by,target_school_id,seed_version,completed_at,detail) values(run_id,c.id,'refused',p_requested_by,c.school_id,c.seed_version,now(),jsonb_build_object('reason','NOT_MASTER_DEMO')); return jsonb_build_object('ok',false,'code','RESET_REFUSED_NOT_MASTER_DEMO','run_id',run_id); end if;
  insert into public.sanila_demo_reset_runs(id,config_id,status,requested_by,target_school_id,seed_version) values(run_id,c.id,'running',p_requested_by,c.school_id,'SANILA_MASTER_DEMO_SEED_2026_09_V1');
  update public.sanila_demo_configs set reset_status='running',reset_started_at=now(),reset_failure=null,seed_health='degraded',updated_at=now() where id=c.id;
  begin
    select array_agg(distinct col.table_name order by col.table_name) into pending_tables
      from information_schema.columns col
      join information_schema.tables tab on tab.table_schema=col.table_schema and tab.table_name=col.table_name and tab.table_type='BASE TABLE'
      where col.table_schema='public' and col.column_name='school_id' and col.table_name like 'angelcare360\_%' escape '\'
        and col.table_name not like 'angelcare360\_access\_%' escape '\'
        and col.table_name not like 'angelcare360\_operator\_tenant\_%' escape '\'
        and col.table_name not in ('angelcare360_schools','angelcare360_operator_tenants','angelcare360_operator_tenant_access_accounts','angelcare360_user_roles','angelcare360_access_scopes','angelcare360_sensitive_access_grants','angelcare360_temporary_access_grants');
    loop
      next_pending:=array[]::text[];
      foreach t in array coalesce(pending_tables,array[]::text[]) loop
        begin
          execute format('delete from public.%I where school_id=$1',t) using c.school_id;
        exception when foreign_key_violation then
          next_pending:=array_append(next_pending,t);
        end;
      end loop;
      exit when coalesce(array_length(next_pending,1),0)=0;
      if array_length(next_pending,1)=array_length(pending_tables,1) then raise exception 'Reset dependency cycle or protected reference in tables: %',array_to_string(next_pending,','); end if;
      pending_tables:=next_pending;
    end loop;
    result:=public.sanila_seed_master_demo(c.id);
    result:=public.sanila_verify_master_demo(c.id);
    if not coalesce((result->>'ok')::boolean,false) then raise exception 'Post-reset verification failed: %',result; end if;
    update public.sanila_demo_configs set last_reset_at=now(),reset_status='idle',reset_started_at=null,reset_failure=null,seed_health='healthy',updated_at=now() where id=c.id;
    update public.sanila_demo_reset_runs set status='succeeded',completed_at=now(),detail=result where id=run_id;
    insert into public.sanila_demo_access_events(config_id,actor_user_id,event_type,severity,metadata) values(c.id,p_requested_by,'canonical_reset_completed','warning',jsonb_build_object('run_id',run_id,'preserved','public_inquiries,demo_grants,demo_sessions,demo_access_events,operator_tenant,school_admin_identity,security_config'));
    return jsonb_build_object('ok',true,'run_id',run_id,'verify',result);
  exception when others then
    update public.sanila_demo_configs set reset_status='failed',reset_failure=sqlerrm,seed_health='failed',updated_at=now() where id=c.id;
    update public.sanila_demo_reset_runs set status='failed',completed_at=now(),detail=jsonb_build_object('error',sqlerrm) where id=run_id;
    return jsonb_build_object('ok',false,'run_id',run_id,'error',sqlerrm);
  end;
end $$;

alter table public.sanila_demo_configs enable row level security;
alter table public.sanila_demo_access_grants enable row level security;
alter table public.sanila_demo_access_events enable row level security;
alter table public.sanila_demo_sessions enable row level security;
alter table public.sanila_demo_reset_runs enable row level security;
alter table public.sanila_demo_side_effect_events enable row level security;

revoke all on public.sanila_demo_configs from anon, authenticated;
revoke all on public.sanila_demo_access_grants from anon, authenticated;
revoke all on public.sanila_demo_access_events from anon, authenticated;
revoke all on public.sanila_demo_sessions from anon, authenticated;
revoke all on public.sanila_demo_reset_runs from anon, authenticated;
revoke all on public.sanila_demo_side_effect_events from anon, authenticated;
grant all on public.sanila_demo_configs to service_role;
grant all on public.sanila_demo_access_grants to service_role;
grant all on public.sanila_demo_access_events to service_role;
grant all on public.sanila_demo_sessions to service_role;
grant all on public.sanila_demo_reset_runs to service_role;
grant all on public.sanila_demo_side_effect_events to service_role;
revoke all on function public.sanila_seed_master_demo(uuid) from public, anon, authenticated;
revoke all on function public.sanila_configure_master_demo(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.sanila_verify_master_demo(uuid) from public, anon, authenticated;
revoke all on function public.sanila_reset_master_demo(uuid,uuid) from public, anon, authenticated;
revoke all on function public.sanila_master_demo_fixture_uuid(uuid,text) from public, anon, authenticated;
revoke all on function public.sanila_is_master_demo_school(uuid) from public, anon, authenticated;
revoke all on function public.sanila_master_demo_upsert(uuid,text,text,jsonb,boolean) from public, anon, authenticated;
revoke all on function public.sanila_validate_demo_config_scope() from public, anon, authenticated;
revoke all on function public.sanila_validate_demo_session_scope() from public, anon, authenticated;
revoke all on function public.sanila_validate_demo_side_effect_scope() from public, anon, authenticated;
grant execute on function public.sanila_seed_master_demo(uuid) to service_role;
grant execute on function public.sanila_configure_master_demo(uuid,uuid,uuid,uuid) to service_role;
grant execute on function public.sanila_verify_master_demo(uuid) to service_role;
grant execute on function public.sanila_reset_master_demo(uuid,uuid) to service_role;
grant execute on function public.sanila_master_demo_fixture_uuid(uuid,text) to service_role;
grant execute on function public.sanila_is_master_demo_school(uuid) to service_role;
grant execute on function public.sanila_master_demo_upsert(uuid,text,text,jsonb,boolean) to service_role;

commit;
