-- AngelCare 360 Phase 2 Foundation
-- Namespaced backend backbone for ANGELCARE 360 COMMAND CENTER
-- Prefix decision: angelcare360_ to avoid collision with the pre-existing ac360_ lineage.

create extension if not exists pgcrypto;

create or replace function public.angelcare360_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.angelcare360_domain_label(p_domain text)
returns text
language sql
immutable
as $$
  select case p_domain
    when 'direction' then 'Cockpit de Direction'
    when 'admissions' then 'Admissions'
    when 'eleves' then 'Élèves'
    when 'parents' then 'Parents'
    when 'enseignants' then 'Enseignants'
    when 'personnel' then 'Personnel'
    when 'classes' then 'Classes & sections'
    when 'matieres' then 'Matières'
    when 'annees_scolaires' then 'Années scolaires'
    when 'presences' then 'Présences'
    when 'emploi_du_temps' then 'Emploi du temps'
    when 'academics' then 'Cours & contenus pédagogiques'
    when 'examens' then 'Examens'
    when 'bulletins' then 'Bulletins'
    when 'finance' then 'Frais de scolarité'
    when 'paiements' then 'Paiements'
    when 'paie' then 'Paie'
    when 'transport' then 'Transport'
    when 'bibliotheque' then 'Bibliothèque'
    when 'inventaire' then 'Inventaire'
    when 'messagerie' then 'Messagerie'
    when 'notifications' then 'Notifications'
    when 'reclamations' then 'Réclamations'
    when 'documents' then 'Documents'
    when 'rapports' then 'Rapports'
    when 'parametres' then 'Paramètres'
    when 'audit' then 'Audit & sécurité'
    when 'securite' then 'Audit & sécurité'
    else initcap(replace(p_domain, '_', ' '))
  end;
$$;

create or replace function public.angelcare360_action_label(p_action text)
returns text
language sql
immutable
as $$
  select case p_action
    when 'view' then 'Consulter'
    when 'create' then 'Créer'
    when 'update' then 'Modifier'
    when 'delete' then 'Supprimer'
    when 'approve' then 'Valider'
    when 'export' then 'Exporter'
    when 'assign' then 'Affecter'
    when 'notify' then 'Notifier'
    when 'configure' then 'Configurer'
    when 'audit' then 'Auditer'
    else initcap(p_action)
  end;
$$;

create or replace function public.angelcare360_permission_label(p_domain text, p_action text)
returns text
language sql
immutable
as $$
  select public.angelcare360_action_label(p_action) || ' ' || public.angelcare360_domain_label(p_domain);
$$;

create or replace function public.angelcare360_role_permission_allowed(p_role_key text, p_domain_key text, p_action_key text)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_role_key = 'super_admin' then
    return true;
  end if;

  if p_role_key in ('direction_generale', 'direction_etablissement') then
    return p_action_key in ('view', 'create', 'update', 'approve', 'export', 'assign', 'notify', 'configure', 'audit')
      and p_domain_key <> 'securite' or p_action_key = 'view';
  end if;

  case p_role_key
    when 'administration' then
      return p_domain_key in ('direction', 'admissions', 'eleves', 'parents', 'enseignants', 'personnel', 'classes', 'matieres', 'annees_scolaires', 'presences', 'emploi_du_temps', 'academics', 'examens', 'bulletins', 'documents', 'rapports', 'parametres')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify', 'export');
    when 'reception' then
      return p_domain_key in ('admissions', 'eleves', 'parents', 'documents', 'messagerie', 'notifications', 'reclamations')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify');
    when 'enseignant' then
      return p_domain_key in ('eleves', 'parents', 'classes', 'matieres', 'presences', 'emploi_du_temps', 'academics', 'examens', 'bulletins', 'documents', 'messagerie', 'notifications')
        and p_action_key in ('view', 'update', 'assign', 'notify', 'export');
    when 'parent' then
      return p_domain_key in ('eleves', 'academics', 'bulletins', 'finance', 'paiements', 'documents', 'messagerie', 'notifications', 'reclamations')
        and p_action_key in ('view', 'notify');
    when 'eleve' then
      return p_domain_key in ('eleves', 'academics', 'bulletins', 'documents', 'messagerie', 'notifications')
        and p_action_key in ('view', 'notify');
    when 'comptabilite' then
      return p_domain_key in ('finance', 'paiements', 'rapports', 'documents', 'notifications', 'audit')
        and p_action_key in ('view', 'create', 'update', 'approve', 'export', 'notify', 'audit');
    when 'rh' then
      return p_domain_key in ('personnel', 'paie', 'documents', 'rapports', 'notifications', 'audit')
        and p_action_key in ('view', 'create', 'update', 'approve', 'export', 'assign', 'notify', 'audit');
    when 'transport' then
      return p_domain_key in ('transport', 'documents', 'notifications', 'rapports')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify', 'export');
    when 'bibliotheque' then
      return p_domain_key in ('bibliotheque', 'documents', 'rapports', 'notifications')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify', 'export');
    when 'qualite' then
      return p_domain_key in ('audit', 'rapports', 'parametres', 'notifications', 'reclamations')
        and p_action_key in ('view', 'export', 'configure', 'audit', 'notify');
    when 'support' then
      return p_domain_key in ('securite', 'parametres', 'audit', 'rapports', 'notifications')
        and p_action_key in ('view', 'configure', 'audit', 'export', 'notify');
    else
      return false;
  end case;
end;
$$;

create table if not exists public.angelcare360_schools (
  id uuid primary key default gen_random_uuid(),
  school_code text not null unique,
  name text not null,
  legal_name text,
  school_type text not null default 'ecole',
  country text not null default 'Maroc',
  city text,
  address text,
  phone text,
  email text,
  website text,
  language text not null default 'fr',
  currency text not null default 'MAD',
  timezone text not null default 'Africa/Casablanca',
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'inactive', 'suspended', 'archived'))
);

create table if not exists public.angelcare360_school_settings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references public.angelcare360_schools(id) on delete cascade,
  default_language text not null default 'fr',
  default_currency text not null default 'MAD',
  default_timezone text not null default 'Africa/Casablanca',
  academic_year_start_month integer not null default 9,
  week_start_day integer not null default 1,
  grading_scale text not null default '0-20',
  attendance_grace_minutes integer not null default 10,
  allow_parent_portal boolean not null default true,
  allow_student_portal boolean not null default true,
  communication_sender_name text,
  school_year_label_format text not null default 'YYYY-YYYY+1',
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (academic_year_start_month between 1 and 12),
  check (week_start_day between 1 and 7),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  year_code text not null,
  label text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, year_code),
  unique(school_id, label),
  check (status in ('planned', 'active', 'closed', 'archived')),
  check (ends_on >= starts_on)
);

create table if not exists public.angelcare360_terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  term_code text not null,
  label text not null,
  starts_on date not null,
  ends_on date not null,
  order_index integer not null default 1,
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(academic_year_id, term_code),
  check (status in ('planned', 'active', 'closed', 'archived')),
  check (ends_on >= starts_on)
);

create table if not exists public.angelcare360_permissions (
  permission_key text primary key,
  domain_key text not null,
  action_key text not null,
  label text not null,
  description text,
  risk_level text not null default 'low',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (risk_level in ('low', 'medium', 'high', 'critical')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_roles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  role_key text not null,
  label text not null,
  description text,
  scope text not null default 'school',
  is_system_locked boolean not null default false,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, role_key),
  check (scope in ('platform', 'school', 'module', 'class', 'family')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.angelcare360_roles(id) on delete cascade,
  permission_key text not null references public.angelcare360_permissions(permission_key) on delete cascade,
  effect text not null default 'allow',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(role_id, permission_key),
  check (effect in ('allow', 'deny'))
);

create table if not exists public.angelcare360_user_roles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  role_id uuid not null references public.angelcare360_roles(id) on delete cascade,
  access_scope_id uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, app_user_id, role_id),
  check (status in ('active', 'paused', 'revoked', 'archived'))
);

create table if not exists public.angelcare360_access_scopes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  scope_key text not null,
  scope_type text not null,
  module_key text,
  route_path text,
  action_key text,
  entity_type text,
  entity_id uuid,
  label text not null,
  description text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, scope_key),
  check (scope_type in ('module', 'route', 'action', 'entity', 'school')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  document_code text not null,
  documentable_type text not null,
  documentable_id uuid not null,
  category text not null,
  title text not null,
  file_name text not null,
  file_path text not null,
  storage_provider text not null default 'supabase',
  mime_type text,
  file_size_bytes bigint,
  visibility text not null default 'private',
  status text not null default 'active',
  uploaded_by uuid references public.app_users(id) on delete set null,
  verified_by uuid references public.app_users(id) on delete set null,
  verified_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, document_code),
  check (visibility in ('private', 'school', 'public', 'restricted')),
  check (status in ('active', 'verified', 'archived', 'deleted'))
);

create table if not exists public.angelcare360_students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_code text not null,
  portal_app_user_id uuid references public.app_users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  full_name text not null,
  gender text,
  date_of_birth date,
  national_id text,
  current_class_id uuid,
  current_section_id uuid,
  admission_status text not null default 'pending',
  status text not null default 'active',
  admission_date date,
  exit_date date,
  transport_required boolean not null default false,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, student_code),
  check (admission_status in ('lead', 'pending', 'admitted', 'enrolled', 'transferred', 'withdrawn', 'graduated')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_parents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  parent_code text not null,
  portal_app_user_id uuid references public.app_users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  full_name text not null,
  email text,
  phone text,
  whatsapp text,
  occupation text,
  address text,
  preferred_language text not null default 'fr',
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, parent_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_student_parent_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  parent_id uuid not null references public.angelcare360_parents(id) on delete cascade,
  relationship_type text not null,
  is_primary boolean not null default false,
  is_guardian boolean not null default true,
  can_pickup boolean not null default true,
  can_receive_messages boolean not null default true,
  can_pay_fees boolean not null default true,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, parent_id),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  staff_code text not null,
  portal_app_user_id uuid references public.app_users(id) on delete set null,
  staff_type text not null default 'personnel',
  first_name text not null,
  last_name text not null,
  full_name text not null,
  email text,
  phone text,
  hire_date date,
  end_date date,
  department text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, staff_code),
  check (status in ('active', 'on_leave', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_staff_contracts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  staff_id uuid not null references public.angelcare360_staff(id) on delete cascade,
  contract_number text not null,
  contract_type text not null,
  starts_on date not null,
  ends_on date,
  employment_type text not null default 'full_time',
  salary_amount numeric not null default 0,
  currency text not null default 'MAD',
  workload_percent numeric not null default 100,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, contract_number),
  check (status in ('draft', 'active', 'suspended', 'ended', 'archived'))
);

create table if not exists public.angelcare360_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  staff_id uuid not null references public.angelcare360_staff(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  class_id uuid,
  section_id uuid,
  subject_id uuid,
  assignment_type text not null default 'teaching',
  assigned_from date,
  assigned_to date,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'paused', 'ended', 'archived'))
);

create table if not exists public.angelcare360_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  contactable_type text not null,
  contactable_id uuid not null,
  contact_name text not null,
  relationship_type text,
  phone text,
  email text,
  priority integer not null default 1,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_code text not null,
  name text not null,
  level text not null,
  capacity integer not null default 0,
  order_index integer not null default 1,
  homeroom_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, academic_year_id, class_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_code text not null,
  name text not null,
  capacity integer not null default 0,
  room text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, section_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_code text not null,
  name text not null,
  short_name text,
  department text,
  credit_hours numeric,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, subject_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  teacher_id uuid references public.angelcare360_staff(id) on delete set null,
  coefficient numeric not null default 1,
  is_required boolean not null default true,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, subject_id, academic_year_id),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  enrollment_number text,
  enrollment_status text not null default 'enrolled',
  enrolled_on date not null default current_date,
  left_on date,
  promoted_from_class_id uuid references public.angelcare360_classes(id) on delete set null,
  transfer_reason text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, academic_year_id),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  staff_id uuid not null references public.angelcare360_staff(id) on delete cascade,
  class_id uuid references public.angelcare360_classes(id) on delete set null,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  subject_id uuid references public.angelcare360_subjects(id) on delete set null,
  assignment_role text not null default 'teacher',
  weekly_hours numeric not null default 0,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(staff_id, academic_year_id, class_id, subject_id),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_admission_leads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  lead_code text not null,
  parent_name text not null,
  parent_phone text,
  parent_email text,
  student_full_name text not null,
  desired_level text,
  source_channel text,
  assigned_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  contacted_at timestamptz,
  converted_at timestamptz,
  status text not null default 'new',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, lead_code),
  check (status in ('new', 'contacted', 'qualified', 'application_open', 'converted', 'archived'))
);

create table if not exists public.angelcare360_admission_applications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  application_code text not null,
  lead_id uuid references public.angelcare360_admission_leads(id) on delete set null,
  parent_id uuid references public.angelcare360_parents(id) on delete set null,
  student_id uuid references public.angelcare360_students(id) on delete set null,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  class_id uuid references public.angelcare360_classes(id) on delete set null,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  application_stage text not null default 'draft',
  application_date date not null default current_date,
  decision_date date,
  decision_reason text,
  status text not null default 'open',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, application_code),
  check (status in ('open', 'in_review', 'approved', 'rejected', 'waitlisted', 'archived'))
);

create table if not exists public.angelcare360_admission_status_history (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  application_id uuid not null references public.angelcare360_admission_applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references public.app_users(id) on delete set null,
  changed_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.angelcare360_admission_required_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  document_key text not null,
  title text not null,
  description text,
  required_for_stage text,
  sort_order integer not null default 1,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, document_key),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_admission_document_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  application_id uuid not null references public.angelcare360_admission_applications(id) on delete cascade,
  required_document_id uuid not null references public.angelcare360_admission_required_documents(id) on delete cascade,
  document_id uuid references public.angelcare360_documents(id) on delete set null,
  submitted_by uuid references public.app_users(id) on delete set null,
  submitted_at timestamptz,
  verification_status text not null default 'pending',
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id, required_document_id),
  check (verification_status in ('pending', 'complete', 'missing', 'rejected')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  session_date date not null,
  session_type text not null default 'daily',
  taken_by uuid references public.app_users(id) on delete set null,
  source text not null default 'manual',
  total_expected integer not null default 0,
  total_present integer not null default 0,
  total_absent integer not null default 0,
  total_late integer not null default 0,
  total_excused integer not null default 0,
  notes text,
  status text not null default 'open',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, section_id, session_date, session_type),
  check (status in ('open', 'closed', 'locked', 'archived'))
);

create table if not exists public.angelcare360_attendance_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  attendance_session_id uuid not null references public.angelcare360_attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  attendance_status text not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  minutes_late integer,
  marked_by uuid references public.app_users(id) on delete set null,
  mark_source text not null default 'manual',
  note text,
  justification_required boolean not null default false,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attendance_session_id, student_id),
  check (attendance_status in ('present', 'absent', 'late', 'excused')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_attendance_justifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  attendance_record_id uuid not null references public.angelcare360_attendance_records(id) on delete cascade,
  justification_code text not null,
  reason_category text not null,
  description text not null,
  evidence_document_id uuid references public.angelcare360_documents(id) on delete set null,
  submitted_by uuid references public.app_users(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  decision text not null default 'pending',
  decision_reason text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attendance_record_id),
  check (decision in ('pending', 'accepted', 'rejected')),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_attendance_status_history (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  attendance_record_id uuid not null references public.angelcare360_attendance_records(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.app_users(id) on delete set null,
  changed_at timestamptz not null default now(),
  note text,
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.angelcare360_timetable_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  staff_id uuid references public.angelcare360_staff(id) on delete set null,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  room text,
  slot_type text not null default 'regular',
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (day_of_week between 1 and 7),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_school_calendar_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  event_code text not null,
  title text not null,
  description text,
  event_type text not null,
  starts_on date not null,
  ends_on date not null,
  all_day boolean not null default true,
  audience text not null default 'all',
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, event_code),
  check (status in ('planned', 'published', 'completed', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_lessons (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  staff_id uuid references public.angelcare360_staff(id) on delete set null,
  lesson_code text not null,
  lesson_date date not null,
  topic text not null,
  objectives text,
  homework_summary text,
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, lesson_code),
  check (status in ('planned', 'completed', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  created_by_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  assignment_code text not null,
  title text not null,
  description text,
  due_on date,
  max_score numeric,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, assignment_code),
  check (status in ('draft', 'published', 'closed', 'archived'))
);

create table if not exists public.angelcare360_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  assignment_id uuid not null references public.angelcare360_assignments(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  submitted_at timestamptz,
  score numeric,
  feedback text,
  status text not null default 'submitted',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assignment_id, student_id),
  check (status in ('draft', 'submitted', 'graded', 'late', 'archived'))
);

create table if not exists public.angelcare360_exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  exam_code text not null,
  title text not null,
  exam_type text not null,
  scheduled_on date not null,
  duration_minutes integer,
  max_score numeric,
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, exam_code),
  check (status in ('planned', 'open', 'closed', 'archived'))
);

create table if not exists public.angelcare360_exam_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  exam_id uuid not null references public.angelcare360_exams(id) on delete cascade,
  session_code text not null,
  room text,
  starts_at timestamptz,
  ends_at timestamptz,
  invigilator_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, session_code),
  check (status in ('planned', 'open', 'closed', 'archived'))
);

create table if not exists public.angelcare360_marks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  exam_id uuid references public.angelcare360_exams(id) on delete set null,
  assignment_id uuid references public.angelcare360_assignments(id) on delete set null,
  assessment_type text not null,
  score numeric not null default 0,
  max_score numeric not null default 20,
  grade text,
  recorded_by_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  recorded_at timestamptz not null default now(),
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'adjusted', 'archived'))
);

create table if not exists public.angelcare360_report_cards (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  term_id uuid references public.angelcare360_terms(id) on delete set null,
  report_card_code text not null,
  generated_on date not null default current_date,
  overall_average numeric,
  rank_position integer,
  attendance_summary text,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, report_card_code),
  check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.angelcare360_report_card_lines (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_card_id uuid not null references public.angelcare360_report_cards(id) on delete cascade,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  teacher_comment_id uuid,
  mark_average numeric,
  coefficient numeric not null default 1,
  letter_grade text,
  remarks text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_teacher_comments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  term_id uuid references public.angelcare360_terms(id) on delete set null,
  staff_id uuid not null references public.angelcare360_staff(id) on delete cascade,
  comment_type text not null default 'appreciation',
  comment_text text not null,
  rating integer,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_fee_structures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  fee_code text not null,
  label text not null,
  description text,
  due_day_of_month integer,
  currency text not null default 'MAD',
  applies_to_level text,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, fee_code),
  check (status in ('draft', 'active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_fee_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  fee_structure_id uuid not null references public.angelcare360_fee_structures(id) on delete cascade,
  item_code text not null,
  label text not null,
  fee_type text not null default 'tuition',
  amount numeric not null default 0,
  due_on date,
  is_required boolean not null default true,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(fee_structure_id, item_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_student_fee_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  fee_structure_id uuid not null references public.angelcare360_fee_structures(id) on delete cascade,
  assigned_on date not null default current_date,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, academic_year_id, fee_structure_id),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  invoice_number text not null,
  invoice_type text not null default 'tuition',
  invoice_date date not null default current_date,
  due_date date,
  currency text not null default 'MAD',
  subtotal_amount numeric not null default 0,
  discount_total numeric not null default 0,
  tax_total numeric not null default 0,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  balance_due numeric generated always as (greatest(total_amount - amount_paid, 0)) stored,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, invoice_number),
  check (status in ('draft', 'issued', 'sent', 'partial', 'paid', 'overdue', 'void', 'cancelled'))
);

create table if not exists public.angelcare360_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  invoice_id uuid not null references public.angelcare360_invoices(id) on delete cascade,
  fee_item_id uuid references public.angelcare360_fee_items(id) on delete set null,
  line_code text,
  label text not null,
  quantity numeric not null default 1,
  unit_amount numeric not null default 0,
  line_total numeric not null default 0,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  invoice_id uuid references public.angelcare360_invoices(id) on delete set null,
  student_id uuid references public.angelcare360_students(id) on delete set null,
  payment_number text not null,
  payment_date date not null default current_date,
  method text not null default 'manual',
  amount numeric not null default 0,
  allocated_amount numeric not null default 0,
  reference text,
  recorded_by uuid references public.app_users(id) on delete set null,
  status text not null default 'pending',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, payment_number),
  check (status in ('pending', 'confirmed', 'failed', 'refunded', 'cancelled'))
);

create table if not exists public.angelcare360_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payment_id uuid not null references public.angelcare360_payments(id) on delete cascade,
  receipt_number text not null,
  issued_at timestamptz not null default now(),
  receipt_document_id uuid references public.angelcare360_documents(id) on delete set null,
  status text not null default 'issued',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, receipt_number),
  check (status in ('issued', 'void', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_discounts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  student_id uuid references public.angelcare360_students(id) on delete set null,
  invoice_id uuid references public.angelcare360_invoices(id) on delete set null,
  discount_code text not null,
  discount_type text not null,
  amount numeric not null default 0,
  reason text,
  approved_by uuid references public.app_users(id) on delete set null,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, discount_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_payment_reminders (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  invoice_id uuid not null references public.angelcare360_invoices(id) on delete cascade,
  student_id uuid references public.angelcare360_students(id) on delete set null,
  reminder_code text not null,
  reminder_type text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  channel text not null default 'email',
  status text not null default 'scheduled',
  delivered_by uuid references public.app_users(id) on delete set null,
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(invoice_id, reminder_code),
  check (status in ('scheduled', 'sent', 'failed', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_finance_accounts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  account_code text not null,
  label text not null,
  account_type text not null,
  currency text not null default 'MAD',
  opening_balance numeric not null default 0,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, account_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_expenses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  expense_code text not null,
  expense_date date not null default current_date,
  category text not null,
  vendor_name text not null,
  account_id uuid references public.angelcare360_finance_accounts(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'MAD',
  payment_method text not null default 'cash',
  status text not null default 'draft',
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, expense_code),
  check (status in ('draft', 'approved', 'paid', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_payroll_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  period_code text not null,
  label text not null,
  starts_on date not null,
  ends_on date not null,
  payment_date date,
  status text not null default 'planned',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, period_code),
  check (status in ('planned', 'open', 'closed', 'paid', 'archived')),
  check (ends_on >= starts_on)
);

create table if not exists public.angelcare360_payroll_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payroll_period_id uuid not null references public.angelcare360_payroll_periods(id) on delete cascade,
  staff_id uuid not null references public.angelcare360_staff(id) on delete cascade,
  payroll_number text not null,
  base_salary numeric not null default 0,
  gross_amount numeric not null default 0,
  deductions_total numeric not null default 0,
  bonuses_total numeric not null default 0,
  net_amount numeric not null default 0,
  payment_status text not null default 'pending',
  paid_at timestamptz,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, payroll_number),
  check (payment_status in ('pending', 'partial', 'paid', 'failed')),
  check (status in ('draft', 'approved', 'paid', 'archived'))
);

create table if not exists public.angelcare360_payroll_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payroll_record_id uuid not null references public.angelcare360_payroll_records(id) on delete cascade,
  item_code text not null,
  item_type text not null,
  label text not null,
  amount numeric not null default 0,
  notes text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payroll_record_id, item_code),
  check (item_type in ('earning', 'deduction', 'bonus', 'allowance')),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_transport_routes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  route_code text not null,
  label text not null,
  route_type text not null default 'school_bus',
  responsible_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, route_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_transport_stops (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  route_id uuid not null references public.angelcare360_transport_routes(id) on delete cascade,
  stop_code text not null,
  label text not null,
  order_index integer not null default 1,
  latitude numeric,
  longitude numeric,
  planned_time time,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(route_id, stop_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  vehicle_code text not null,
  plate_number text not null,
  model text,
  capacity_seats integer not null default 0,
  assigned_driver_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  insurance_expires_on date,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, vehicle_code),
  unique(school_id, plate_number),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_transport_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  route_id uuid not null references public.angelcare360_transport_routes(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  vehicle_id uuid references public.angelcare360_transport_vehicles(id) on delete set null,
  pickup_stop_id uuid references public.angelcare360_transport_stops(id) on delete set null,
  dropoff_stop_id uuid references public.angelcare360_transport_stops(id) on delete set null,
  assigned_on date not null default current_date,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, academic_year_id),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_library_books (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  book_code text not null,
  isbn text,
  title text not null,
  author text,
  publisher text,
  category text,
  language text not null default 'fr',
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, book_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_library_copies (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  book_id uuid not null references public.angelcare360_library_books(id) on delete cascade,
  copy_code text not null,
  barcode text,
  acquisition_date date,
  shelf_location text,
  condition text not null default 'good',
  status text not null default 'available',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, copy_code),
  check (status in ('available', 'loaned', 'reserved', 'lost', 'archived'))
);

create table if not exists public.angelcare360_library_loans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  copy_id uuid not null references public.angelcare360_library_copies(id) on delete cascade,
  borrower_type text not null,
  borrower_student_id uuid references public.angelcare360_students(id) on delete set null,
  borrower_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  loaned_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  fine_amount numeric not null default 0,
  status text not null default 'open',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (borrower_type in ('student', 'staff')),
  check (status in ('open', 'returned', 'overdue', 'lost', 'archived'))
);

create table if not exists public.angelcare360_inventory_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  category_code text not null,
  label text not null,
  description text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, category_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_inventory_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  category_id uuid not null references public.angelcare360_inventory_categories(id) on delete cascade,
  item_code text not null,
  label text not null,
  unit_of_measure text not null default 'unit',
  barcode text,
  current_stock numeric not null default 0,
  reorder_level numeric not null default 0,
  purchase_price numeric not null default 0,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, item_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  item_id uuid not null references public.angelcare360_inventory_items(id) on delete cascade,
  movement_code text not null,
  movement_type text not null,
  quantity numeric not null default 0,
  movement_date date not null default current_date,
  reference_type text,
  reference_id uuid,
  performed_by uuid references public.app_users(id) on delete set null,
  notes text,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, movement_code),
  check (movement_type in ('in', 'out', 'adjust', 'transfer')),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  message_code text not null,
  sender_app_user_id uuid references public.app_users(id) on delete set null,
  sender_role text,
  subject text not null,
  body text not null,
  message_type text not null default 'internal',
  sent_at timestamptz,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, message_code),
  check (status in ('draft', 'sent', 'archived'))
);

create table if not exists public.angelcare360_message_recipients (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  message_id uuid not null references public.angelcare360_messages(id) on delete cascade,
  recipient_app_user_id uuid references public.app_users(id) on delete set null,
  recipient_student_id uuid references public.angelcare360_students(id) on delete set null,
  recipient_parent_id uuid references public.angelcare360_parents(id) on delete set null,
  recipient_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  delivery_status text not null default 'pending',
  read_at timestamptz,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivery_status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  notification_code text not null,
  recipient_app_user_id uuid references public.app_users(id) on delete set null,
  recipient_role text,
  channel text not null default 'in_app',
  title text not null,
  body text not null,
  action_href text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  status text not null default 'scheduled',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, notification_code),
  check (status in ('scheduled', 'sent', 'delivered', 'read', 'archived'))
);

create table if not exists public.angelcare360_announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  announcement_code text not null,
  title text not null,
  body text not null,
  audience text not null default 'all',
  published_at timestamptz,
  expires_at timestamptz,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, announcement_code),
  check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.angelcare360_reclamations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  reclamation_code text not null,
  submitted_by_app_user_id uuid references public.app_users(id) on delete set null,
  reporter_role text,
  subject text not null,
  description text not null,
  related_entity_type text,
  related_entity_id uuid,
  priority text not null default 'medium',
  status text not null default 'open',
  resolved_at timestamptz,
  resolution_notes text,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, reclamation_code),
  check (priority in ('low', 'medium', 'high', 'critical')),
  check (status in ('open', 'in_progress', 'resolved', 'closed', 'archived'))
);

create table if not exists public.angelcare360_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_code text not null,
  report_family text not null,
  label text not null,
  description text,
  owner_role text,
  status text not null default 'active',
  config_json jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, report_code),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_report_exports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_id uuid not null references public.angelcare360_reports(id) on delete cascade,
  export_code text not null,
  export_format text not null default 'pdf',
  requested_by uuid references public.app_users(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  file_document_id uuid references public.angelcare360_documents(id) on delete set null,
  status text not null default 'requested',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, export_code),
  check (export_format in ('pdf', 'csv', 'xlsx')),
  check (status in ('requested', 'processing', 'completed', 'failed', 'cancelled'))
);

create table if not exists public.angelcare360_audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  actor_user_id uuid references public.app_users(id) on delete set null,
  actor_role text,
  module text not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  severity text not null default 'info',
  ip_address text,
  user_agent text,
  request_id text,
  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('debug', 'info', 'notice', 'warning', 'critical'))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'angelcare360_user_roles_access_scope_fk'
      and conrelid = 'public.angelcare360_user_roles'::regclass
  ) then
    alter table public.angelcare360_user_roles
      add constraint angelcare360_user_roles_access_scope_fk
      foreign key (access_scope_id) references public.angelcare360_access_scopes(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'angelcare360_staff_assignments_class_fk'
      and conrelid = 'public.angelcare360_staff_assignments'::regclass
  ) then
    alter table public.angelcare360_staff_assignments
      add constraint angelcare360_staff_assignments_class_fk
      foreign key (class_id) references public.angelcare360_classes(id) on delete set null;
    alter table public.angelcare360_staff_assignments
      add constraint angelcare360_staff_assignments_section_fk
      foreign key (section_id) references public.angelcare360_sections(id) on delete set null;
    alter table public.angelcare360_staff_assignments
      add constraint angelcare360_staff_assignments_subject_fk
      foreign key (subject_id) references public.angelcare360_subjects(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'angelcare360_students_current_class_fk'
      and conrelid = 'public.angelcare360_students'::regclass
  ) then
    alter table public.angelcare360_students
      add constraint angelcare360_students_current_class_fk
      foreign key (current_class_id) references public.angelcare360_classes(id) on delete set null;
    alter table public.angelcare360_students
      add constraint angelcare360_students_current_section_fk
      foreign key (current_section_id) references public.angelcare360_sections(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'angelcare360_report_card_lines_teacher_comment_fk'
      and conrelid = 'public.angelcare360_report_card_lines'::regclass
  ) then
    alter table public.angelcare360_report_card_lines
      add constraint angelcare360_report_card_lines_teacher_comment_fk
      foreign key (teacher_comment_id) references public.angelcare360_teacher_comments(id) on delete set null;
  end if;
end $$;

create index if not exists idx_angelcare360_schools_status on public.angelcare360_schools(status, school_code);
create index if not exists idx_angelcare360_school_settings_school on public.angelcare360_school_settings(school_id, status);
create index if not exists idx_angelcare360_years_school_status on public.angelcare360_academic_years(school_id, status, starts_on desc);
create index if not exists idx_angelcare360_terms_year on public.angelcare360_terms(academic_year_id, order_index);
create index if not exists idx_angelcare360_roles_school on public.angelcare360_roles(school_id, role_key);
create index if not exists idx_angelcare360_user_roles_school_user on public.angelcare360_user_roles(school_id, app_user_id, status);
create index if not exists idx_angelcare360_access_scopes_school on public.angelcare360_access_scopes(school_id, scope_type, scope_key);
create index if not exists idx_angelcare360_students_school_status on public.angelcare360_students(school_id, status, full_name);
create index if not exists idx_angelcare360_parents_school_status on public.angelcare360_parents(school_id, status, full_name);
create index if not exists idx_angelcare360_staff_school_status on public.angelcare360_staff(school_id, status, full_name);
create index if not exists idx_angelcare360_documents_school_type on public.angelcare360_documents(school_id, documentable_type, category);
create index if not exists idx_angelcare360_classes_school_year on public.angelcare360_classes(school_id, academic_year_id, status);
create index if not exists idx_angelcare360_sections_class on public.angelcare360_sections(class_id, status);
create index if not exists idx_angelcare360_subjects_school on public.angelcare360_subjects(school_id, status, name);
create index if not exists idx_angelcare360_enrollments_student_year on public.angelcare360_class_enrollments(student_id, academic_year_id, status);
create index if not exists idx_angelcare360_admission_leads_school_status on public.angelcare360_admission_leads(school_id, status, created_at desc);
create index if not exists idx_angelcare360_admission_applications_school_status on public.angelcare360_admission_applications(school_id, status, application_stage);
create index if not exists idx_angelcare360_attendance_sessions_school_date on public.angelcare360_attendance_sessions(school_id, session_date desc, class_id);
create index if not exists idx_angelcare360_attendance_records_session_status on public.angelcare360_attendance_records(attendance_session_id, attendance_status);
create index if not exists idx_angelcare360_timetable_school_day on public.angelcare360_timetable_slots(school_id, day_of_week, start_time);
create index if not exists idx_angelcare360_lessons_school_date on public.angelcare360_lessons(school_id, lesson_date desc);
create index if not exists idx_angelcare360_assignments_school_due on public.angelcare360_assignments(school_id, due_on desc, status);
create index if not exists idx_angelcare360_exams_school_date on public.angelcare360_exams(school_id, scheduled_on desc);
create index if not exists idx_angelcare360_marks_student_subject on public.angelcare360_marks(student_id, subject_id, academic_year_id);
create index if not exists idx_angelcare360_report_cards_school_term on public.angelcare360_report_cards(school_id, term_id, generated_on desc);
create index if not exists idx_angelcare360_fee_structures_school_year on public.angelcare360_fee_structures(school_id, academic_year_id, status);
create index if not exists idx_angelcare360_invoices_school_status_date on public.angelcare360_invoices(school_id, status, invoice_date desc);
create index if not exists idx_angelcare360_payments_school_date on public.angelcare360_payments(school_id, payment_date desc, status);
create index if not exists idx_angelcare360_payroll_school_status on public.angelcare360_payroll_records(school_id, status, payroll_period_id);
create index if not exists idx_angelcare360_transport_routes_school_status on public.angelcare360_transport_routes(school_id, status);
create index if not exists idx_angelcare360_library_books_school_status on public.angelcare360_library_books(school_id, status, title);
create index if not exists idx_angelcare360_inventory_items_school_status on public.angelcare360_inventory_items(school_id, status, label);
create index if not exists idx_angelcare360_messages_school_status on public.angelcare360_messages(school_id, status, created_at desc);
create index if not exists idx_angelcare360_notifications_school_status on public.angelcare360_notifications(school_id, status, scheduled_for desc);
create index if not exists idx_angelcare360_reclamations_school_status on public.angelcare360_reclamations(school_id, status, priority);
create index if not exists idx_angelcare360_reports_school_status on public.angelcare360_reports(school_id, status, report_family);
create index if not exists idx_angelcare360_report_exports_school_status on public.angelcare360_report_exports(school_id, status, requested_at desc);
create index if not exists idx_angelcare360_audit_school_created on public.angelcare360_audit_logs(school_id, created_at desc);
create index if not exists idx_angelcare360_audit_module_action on public.angelcare360_audit_logs(module, action, severity);
create index if not exists idx_angelcare360_audit_entity on public.angelcare360_audit_logs(entity_type, entity_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'angelcare360_schools',
    'angelcare360_school_settings',
    'angelcare360_academic_years',
    'angelcare360_terms',
    'angelcare360_permissions',
    'angelcare360_roles',
    'angelcare360_role_permissions',
    'angelcare360_user_roles',
    'angelcare360_access_scopes',
    'angelcare360_documents',
    'angelcare360_students',
    'angelcare360_parents',
    'angelcare360_student_parent_links',
    'angelcare360_staff',
    'angelcare360_staff_contracts',
    'angelcare360_staff_assignments',
    'angelcare360_emergency_contacts',
    'angelcare360_classes',
    'angelcare360_sections',
    'angelcare360_subjects',
    'angelcare360_class_subjects',
    'angelcare360_class_enrollments',
    'angelcare360_teacher_assignments',
    'angelcare360_admission_leads',
    'angelcare360_admission_applications',
    'angelcare360_admission_status_history',
    'angelcare360_admission_required_documents',
    'angelcare360_admission_document_submissions',
    'angelcare360_attendance_sessions',
    'angelcare360_attendance_records',
    'angelcare360_attendance_justifications',
    'angelcare360_attendance_status_history',
    'angelcare360_timetable_slots',
    'angelcare360_school_calendar_events',
    'angelcare360_lessons',
    'angelcare360_assignments',
    'angelcare360_assignment_submissions',
    'angelcare360_exams',
    'angelcare360_exam_sessions',
    'angelcare360_marks',
    'angelcare360_report_cards',
    'angelcare360_report_card_lines',
    'angelcare360_teacher_comments',
    'angelcare360_fee_structures',
    'angelcare360_fee_items',
    'angelcare360_student_fee_assignments',
    'angelcare360_invoices',
    'angelcare360_invoice_lines',
    'angelcare360_payments',
    'angelcare360_receipts',
    'angelcare360_discounts',
    'angelcare360_payment_reminders',
    'angelcare360_finance_accounts',
    'angelcare360_expenses',
    'angelcare360_payroll_periods',
    'angelcare360_payroll_records',
    'angelcare360_payroll_items',
    'angelcare360_transport_routes',
    'angelcare360_transport_stops',
    'angelcare360_transport_vehicles',
    'angelcare360_transport_assignments',
    'angelcare360_library_books',
    'angelcare360_library_copies',
    'angelcare360_library_loans',
    'angelcare360_inventory_categories',
    'angelcare360_inventory_items',
    'angelcare360_inventory_movements',
    'angelcare360_messages',
    'angelcare360_message_recipients',
    'angelcare360_notifications',
    'angelcare360_announcements',
    'angelcare360_reclamations',
    'angelcare360_reports',
    'angelcare360_report_exports',
    'angelcare360_audit_logs'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.angelcare360_touch_updated_at()', t, t);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'angelcare360_schools',
    'angelcare360_school_settings',
    'angelcare360_academic_years',
    'angelcare360_terms',
    'angelcare360_permissions',
    'angelcare360_roles',
    'angelcare360_role_permissions',
    'angelcare360_user_roles',
    'angelcare360_access_scopes',
    'angelcare360_documents',
    'angelcare360_students',
    'angelcare360_parents',
    'angelcare360_student_parent_links',
    'angelcare360_staff',
    'angelcare360_staff_contracts',
    'angelcare360_staff_assignments',
    'angelcare360_emergency_contacts',
    'angelcare360_classes',
    'angelcare360_sections',
    'angelcare360_subjects',
    'angelcare360_class_subjects',
    'angelcare360_class_enrollments',
    'angelcare360_teacher_assignments',
    'angelcare360_admission_leads',
    'angelcare360_admission_applications',
    'angelcare360_admission_status_history',
    'angelcare360_admission_required_documents',
    'angelcare360_admission_document_submissions',
    'angelcare360_attendance_sessions',
    'angelcare360_attendance_records',
    'angelcare360_attendance_justifications',
    'angelcare360_attendance_status_history',
    'angelcare360_timetable_slots',
    'angelcare360_school_calendar_events',
    'angelcare360_lessons',
    'angelcare360_assignments',
    'angelcare360_assignment_submissions',
    'angelcare360_exams',
    'angelcare360_exam_sessions',
    'angelcare360_marks',
    'angelcare360_report_cards',
    'angelcare360_report_card_lines',
    'angelcare360_teacher_comments',
    'angelcare360_fee_structures',
    'angelcare360_fee_items',
    'angelcare360_student_fee_assignments',
    'angelcare360_invoices',
    'angelcare360_invoice_lines',
    'angelcare360_payments',
    'angelcare360_receipts',
    'angelcare360_discounts',
    'angelcare360_payment_reminders',
    'angelcare360_finance_accounts',
    'angelcare360_expenses',
    'angelcare360_payroll_periods',
    'angelcare360_payroll_records',
    'angelcare360_payroll_items',
    'angelcare360_transport_routes',
    'angelcare360_transport_stops',
    'angelcare360_transport_vehicles',
    'angelcare360_transport_assignments',
    'angelcare360_library_books',
    'angelcare360_library_copies',
    'angelcare360_library_loans',
    'angelcare360_inventory_categories',
    'angelcare360_inventory_items',
    'angelcare360_inventory_movements',
    'angelcare360_messages',
    'angelcare360_message_recipients',
    'angelcare360_notifications',
    'angelcare360_announcements',
    'angelcare360_reclamations',
    'angelcare360_reports',
    'angelcare360_report_exports',
    'angelcare360_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'angelcare360_service_role_all', t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'angelcare360_service_role_all', t);
  end loop;
end $$;

create or replace function public.angelcare360_record_audit(
  p_school_id uuid,
  p_actor_user_id uuid,
  p_actor_role text,
  p_module text,
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_severity text default 'info',
  p_ip_address text default null,
  p_user_agent text default null,
  p_request_id text default null,
  p_before_data jsonb default '{}'::jsonb,
  p_after_data jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.angelcare360_audit_logs(
    school_id,
    actor_user_id,
    actor_role,
    module,
    action,
    entity_type,
    entity_id,
    severity,
    ip_address,
    user_agent,
    request_id,
    before_data,
    after_data,
    metadata
  ) values (
    p_school_id,
    p_actor_user_id,
    p_actor_role,
    p_module,
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_severity, 'info'),
    p_ip_address,
    p_user_agent,
    p_request_id,
    coalesce(p_before_data, '{}'::jsonb),
    coalesce(p_after_data, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;
