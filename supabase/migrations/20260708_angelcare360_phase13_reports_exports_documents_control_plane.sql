-- AngelCare 360 Phase 13 Reporting / Exports / Documents control plane
-- Additive, namespaced, server-side ready only.

begin;

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
    when 'exports' then 'Exports'
    when 'parametres' then 'Paramètres'
    when 'audit' then 'Audit & sécurité'
    when 'securite' then 'Audit & sécurité'
    else initcap(replace(p_domain, '_', ' '))
  end
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
      return p_domain_key in ('direction', 'admissions', 'eleves', 'parents', 'enseignants', 'personnel', 'classes', 'matieres', 'annees_scolaires', 'presences', 'emploi_du_temps', 'academics', 'examens', 'bulletins', 'documents', 'rapports', 'exports', 'parametres')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify', 'export');
    when 'reception' then
      return p_domain_key in ('admissions', 'eleves', 'parents', 'documents', 'messagerie', 'notifications', 'reclamations')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify');
    when 'enseignant' then
      return p_domain_key in ('eleves', 'parents', 'classes', 'matieres', 'presences', 'emploi_du_temps', 'academics', 'examens', 'bulletins', 'documents', 'messagerie', 'notifications', 'exports')
        and p_action_key in ('view', 'update', 'assign', 'notify', 'export');
    when 'parent' then
      return p_domain_key in ('eleves', 'academics', 'bulletins', 'finance', 'paiements', 'documents', 'messagerie', 'notifications', 'reclamations')
        and p_action_key in ('view', 'notify');
    when 'eleve' then
      return p_domain_key in ('eleves', 'academics', 'bulletins', 'documents', 'messagerie', 'notifications')
        and p_action_key in ('view', 'notify');
    when 'comptabilite' then
      return p_domain_key in ('finance', 'paiements', 'rapports', 'exports', 'documents', 'notifications', 'audit')
        and p_action_key in ('view', 'create', 'update', 'approve', 'export', 'notify', 'audit');
    when 'rh' then
      return p_domain_key in ('personnel', 'paie', 'rapports', 'exports', 'documents', 'notifications', 'audit')
        and p_action_key in ('view', 'create', 'update', 'approve', 'export', 'assign', 'notify', 'audit');
    when 'transport' then
      return p_domain_key in ('transport', 'documents', 'notifications', 'rapports', 'exports')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify', 'export');
    when 'bibliotheque' then
      return p_domain_key in ('bibliotheque', 'documents', 'rapports', 'exports', 'notifications')
        and p_action_key in ('view', 'create', 'update', 'assign', 'notify', 'export');
    when 'qualite' then
      return p_domain_key in ('audit', 'rapports', 'exports', 'parametres', 'notifications', 'reclamations')
        and p_action_key in ('view', 'export', 'configure', 'audit', 'notify');
    when 'support' then
      return p_domain_key in ('securite', 'parametres', 'audit', 'rapports', 'exports', 'notifications')
        and p_action_key in ('view', 'configure', 'audit', 'export', 'notify');
    else
      return false;
  end case;
end
$$;

create table if not exists public.angelcare360_report_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_id uuid not null references public.angelcare360_reports(id) on delete cascade,
  template_code text not null,
  label text not null,
  module_key text not null default 'rapports',
  report_family text not null default 'standard',
  output_format text not null default 'pdf_a4',
  description text,
  config_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, template_code),
  unique(school_id, report_id, label),
  check (status in ('draft', 'active', 'inactive', 'archived')),
  check (output_format in ('pdf_a4', 'csv', 'xlsx', 'json', 'print_view'))
);

create table if not exists public.angelcare360_report_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_id uuid not null references public.angelcare360_reports(id) on delete cascade,
  report_template_id uuid references public.angelcare360_report_templates(id) on delete set null,
  request_code text not null,
  report_code text not null,
  report_family text not null default 'standard',
  module_key text not null default 'rapports',
  date_from date,
  date_to date,
  filters_json jsonb not null default '{}'::jsonb,
  status text not null default 'requested',
  requested_by uuid references public.app_users(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  result_export_id uuid references public.angelcare360_report_exports(id) on delete set null,
  result_document_id uuid references public.angelcare360_documents(id) on delete set null,
  error_message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, request_code),
  check (status in ('draft', 'requested', 'processing_locked', 'ready', 'failed', 'cancelled'))
);

create table if not exists public.angelcare360_export_files (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_export_id uuid references public.angelcare360_report_exports(id) on delete set null,
  export_code text not null,
  file_code text not null,
  file_name text not null,
  file_path text not null,
  storage_provider text not null default 'supabase',
  mime_type text,
  file_size_bytes bigint,
  export_format text not null default 'pdf_a4',
  status text not null default 'ready',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, export_code),
  unique(school_id, file_code),
  check (export_format in ('pdf_a4', 'csv', 'xlsx', 'json', 'print_view')),
  check (status in ('ready', 'blocked_not_configured', 'archived'))
);

create table if not exists public.angelcare360_document_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  template_code text not null,
  label text not null,
  document_type text not null default 'general',
  output_format text not null default 'pdf_a4',
  description text,
  retention_days integer,
  config_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, template_code),
  check (output_format in ('pdf_a4', 'csv', 'xlsx', 'json', 'print_view')),
  check (status in ('draft', 'ready', 'archived', 'blocked_not_configured')),
  check (retention_days is null or retention_days >= 0)
);

insert into public.angelcare360_permissions (
  permission_key,
  domain_key,
  action_key,
  label,
  description,
  risk_level,
  status
)
select
  domain_key || '.' || action_key,
  domain_key,
  action_key,
  public.angelcare360_permission_label(domain_key, action_key),
  'Permission AngelCare 360 pour ' || public.angelcare360_permission_label(domain_key, action_key),
  case
    when domain_key in ('finance', 'paie', 'audit', 'securite', 'exports') or action_key in ('delete', 'configure') then 'high'
    when action_key in ('approve', 'export', 'audit') then 'medium'
    else 'low'
  end,
  'active'
from (
  select unnest(array['exports']::text[]) as domain_key
) d
cross join unnest(array['view','create','update','delete','approve','export','assign','notify','configure','audit']::text[]) as action_key
on conflict (permission_key) do update set
  domain_key = excluded.domain_key,
  action_key = excluded.action_key,
  label = excluded.label,
  description = excluded.description,
  risk_level = excluded.risk_level,
  status = excluded.status;

insert into public.angelcare360_role_permissions (role_id, permission_key, effect, metadata_json)
select r.id, p.permission_key, 'allow', '{"phase":"phase_13"}'::jsonb
from public.angelcare360_roles r
join public.angelcare360_permissions p
  on public.angelcare360_role_permission_allowed(r.role_key, p.domain_key, p.action_key)
where p.domain_key = 'exports'
on conflict (role_id, permission_key) do update set
  effect = excluded.effect,
  metadata_json = excluded.metadata_json;

create index if not exists idx_angelcare360_report_templates_school_status on public.angelcare360_report_templates(school_id, status, report_family);
create index if not exists idx_angelcare360_report_requests_school_status on public.angelcare360_report_requests(school_id, status, requested_at desc);
create index if not exists idx_angelcare360_export_files_school_status on public.angelcare360_export_files(school_id, status, created_at desc);
create index if not exists idx_angelcare360_document_templates_school_status on public.angelcare360_document_templates(school_id, status, document_type);

do $$
declare
  t text;
begin
  foreach t in array array[
    'angelcare360_report_templates',
    'angelcare360_report_requests',
    'angelcare360_export_files',
    'angelcare360_document_templates'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'trg_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.angelcare360_touch_updated_at()', 'trg_' || t || '_updated_at', t);
  end loop;
end $$;

commit;
