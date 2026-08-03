begin;

-- ANGELCARE 360 CUSTOMER MEGA ZIP 4
-- SCHOOL FINANCE, COLLECTIONS, DOCUMENTS, REPORTING & COMPLIANCE AUTHORITY
-- Additive authority and evidence layer. Existing finance tables remain authoritative.

insert into storage.buckets (id,name,public)
values ('angelcare360-finance-documents','angelcare360-finance-documents',false)
on conflict(id) do update set public=false;

alter table public.angelcare360_invoices drop constraint if exists angelcare360_invoices_status_check;
alter table public.angelcare360_invoices add constraint angelcare360_invoices_status_check
  check (status in ('draft','validated','issued','sent','partial','partially_paid','paid','overdue','disputed','credited','void','cancelled','archived'));

alter table public.angelcare360_payments drop constraint if exists angelcare360_payments_status_check;
alter table public.angelcare360_payments add constraint angelcare360_payments_status_check
  check (status in ('pending','confirmed','partially_allocated','allocated','rejected','failed','refunded','reversed','cancelled','archived'));

alter table public.angelcare360_expenses drop constraint if exists angelcare360_expenses_status_check;
alter table public.angelcare360_expenses add constraint angelcare360_expenses_status_check
  check (status in ('draft','submitted','reviewed','approved','payment_pending','paid','reconciled','rejected','cancelled','archived'));

create table if not exists public.angelcare360_finance_number_sequences (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  sequence_key text not null,
  prefix text not null,
  current_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique(school_id,sequence_key)
);

create or replace function public.angelcare360_next_finance_number(
  p_school_id uuid,
  p_sequence_key text,
  p_prefix text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next bigint;
begin
  if p_school_id is null or coalesce(trim(p_sequence_key),'') = '' or coalesce(trim(p_prefix),'') = '' then
    raise exception 'Finance sequence arguments are required.';
  end if;
  insert into public.angelcare360_finance_number_sequences(school_id,sequence_key,prefix,current_value)
  values(p_school_id,p_sequence_key,p_prefix,0)
  on conflict(school_id,sequence_key) do nothing;
  update public.angelcare360_finance_number_sequences
     set current_value=current_value+1,prefix=p_prefix,updated_at=now()
   where school_id=p_school_id and sequence_key=p_sequence_key
   returning current_value into v_next;
  return upper(p_prefix)||'-'||to_char(current_date,'YYYY')||'-'||lpad(v_next::text,6,'0');
end;
$$;

revoke all on function public.angelcare360_next_finance_number(uuid,text,text) from public, anon, authenticated;
grant execute on function public.angelcare360_next_finance_number(uuid,text,text) to service_role;

create table if not exists public.angelcare360_finance_authority_executions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  operation_key text not null,
  entity_id uuid,
  idempotency_key text not null,
  state text not null default 'requested',
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  requested_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  attempt_count integer not null default 1,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,idempotency_key),
  check(state in ('requested','processing','approval_required','completed','replayed','rejected','failed'))
);

create table if not exists public.angelcare360_finance_fee_policy_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  fee_structure_id uuid not null references public.angelcare360_fee_structures(id) on delete restrict,
  policy_code text not null,
  version_number integer not null,
  status text not null default 'draft',
  effective_from date not null,
  effective_to date,
  policy_json jsonb not null default '{}'::jsonb,
  supersedes_version_id uuid references public.angelcare360_finance_fee_policy_versions(id) on delete set null,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,policy_code,version_number),
  check(status in ('draft','review','published','scheduled','suspended','superseded','retired','archived'))
);

create table if not exists public.angelcare360_finance_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  fee_policy_version_id uuid not null references public.angelcare360_finance_fee_policy_versions(id) on delete cascade,
  rule_code text not null,
  priority integer not null default 100,
  criteria_json jsonb not null default '{}'::jsonb,
  outcome_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  effective_from date,
  effective_to date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,fee_policy_version_id,rule_code)
);

create table if not exists public.angelcare360_finance_installment_plans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_fee_assignment_id uuid references public.angelcare360_student_fee_assignments(id) on delete restrict,
  payer_account_id uuid,
  plan_code text not null,
  total_amount numeric(18,2) not null default 0,
  deposit_amount numeric(18,2) not null default 0,
  installment_count integer not null default 1,
  schedule_json jsonb not null default '[]'::jsonb,
  current_revision integer not null default 1,
  status text not null default 'draft',
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,plan_code)
);

create table if not exists public.angelcare360_finance_installment_plan_revisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  installment_plan_id uuid not null references public.angelcare360_finance_installment_plans(id) on delete cascade,
  revision_number integer not null,
  schedule_json jsonb not null default '[]'::jsonb,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(installment_plan_id,revision_number)
);

create table if not exists public.angelcare360_finance_billing_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete restrict,
  run_code text not null,
  idempotency_key text not null,
  status text not null default 'draft',
  preview_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  requested_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,idempotency_key),
  unique(school_id,run_code)
);

create table if not exists public.angelcare360_finance_billing_run_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  billing_run_id uuid not null references public.angelcare360_finance_billing_runs(id) on delete cascade,
  assignment_id uuid references public.angelcare360_student_fee_assignments(id) on delete set null,
  student_id uuid references public.angelcare360_students(id) on delete set null,
  invoice_id uuid references public.angelcare360_invoices(id) on delete set null,
  outcome text not null,
  amount numeric(18,2),
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(billing_run_id,assignment_id)
);

create table if not exists public.angelcare360_finance_payer_accounts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  account_code text not null,
  account_type text not null default 'family',
  label text not null,
  primary_person_id uuid references public.angelcare360_people_master(id) on delete set null,
  currency text not null default 'MAD',
  status text not null default 'active',
  current_balance numeric(18,2) not null default 0,
  available_credit numeric(18,2) not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,account_code)
);

create table if not exists public.angelcare360_finance_payer_account_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payer_account_id uuid not null references public.angelcare360_finance_payer_accounts(id) on delete cascade,
  student_id uuid references public.angelcare360_students(id) on delete cascade,
  person_id uuid references public.angelcare360_people_master(id) on delete cascade,
  responsibility_type text not null default 'primary_payer',
  allocation_percentage numeric(7,4),
  effective_from date not null default current_date,
  effective_to date,
  status text not null default 'active',
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists angelcare360_finance_payer_account_members_student_uq on public.angelcare360_finance_payer_account_members(school_id,payer_account_id,student_id);

create table if not exists public.angelcare360_finance_invoice_revisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  invoice_id uuid not null references public.angelcare360_invoices(id) on delete cascade,
  revision_number integer not null,
  revision_type text not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  reason text not null,
  revised_by uuid,
  revised_at timestamptz not null default now(),
  unique(invoice_id,revision_number)
);

create table if not exists public.angelcare360_finance_credit_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  invoice_id uuid not null references public.angelcare360_invoices(id) on delete restrict,
  credit_number text not null,
  amount numeric(18,2) not null check(amount>0),
  currency text not null default 'MAD',
  reason text not null,
  status text not null default 'draft',
  issued_by uuid,
  issued_at timestamptz,
  document_version_id uuid,
  created_at timestamptz not null default now(),
  unique(school_id,credit_number)
);

create table if not exists public.angelcare360_finance_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payment_id uuid not null references public.angelcare360_payments(id) on delete restrict,
  invoice_id uuid not null references public.angelcare360_invoices(id) on delete restrict,
  amount numeric(18,2) not null check(amount>0),
  status text not null default 'active',
  idempotency_key text,
  allocated_by uuid,
  allocated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,idempotency_key)
);

create table if not exists public.angelcare360_finance_payment_allocation_revisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  allocation_id uuid not null references public.angelcare360_finance_payment_allocations(id) on delete cascade,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  reason text not null,
  revised_by uuid,
  revised_at timestamptz not null default now()
);

create table if not exists public.angelcare360_finance_account_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payer_account_id uuid not null references public.angelcare360_finance_payer_accounts(id) on delete cascade,
  transaction_type text not null,
  amount numeric(18,2) not null,
  source_type text,
  source_id uuid,
  balance_after numeric(18,2),
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_finance_refund_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  payment_id uuid not null references public.angelcare360_payments(id) on delete restrict,
  refund_code text not null,
  requested_amount numeric(18,2) not null check(requested_amount>0),
  approved_amount numeric(18,2),
  reason text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  status text not null default 'requested',
  requested_by uuid,
  requested_at timestamptz not null default now(),
  approved_by uuid,
  approved_at timestamptz,
  executed_by uuid,
  executed_at timestamptz,
  execution_reference text,
  reconciliation_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,refund_code)
);

create table if not exists public.angelcare360_finance_collection_cases (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  account_id uuid not null,
  case_code text not null,
  status text not null default 'monitoring',
  priority text not null default 'normal',
  outstanding_amount numeric(18,2) not null default 0,
  aging_bucket text not null default 'current',
  owner_id uuid,
  next_action text,
  due_at timestamptz,
  opened_by uuid,
  opened_at timestamptz not null default now(),
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,case_code)
);

create table if not exists public.angelcare360_finance_payment_commitments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  collection_case_id uuid not null references public.angelcare360_finance_collection_cases(id) on delete cascade,
  commitment_code text not null,
  committed_amount numeric(18,2) not null check(committed_amount>0),
  due_date date not null,
  schedule_json jsonb not null default '{}'::jsonb,
  source_invoice_ids uuid[] not null default '{}',
  status text not null default 'active',
  breach_reason text,
  recorded_by uuid,
  recorded_at timestamptz not null default now(),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,commitment_code)
);

create table if not exists public.angelcare360_finance_disputes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  account_id uuid,
  entity_type text not null,
  entity_id uuid,
  dispute_code text not null,
  reason text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  status text not null default 'opened',
  decision_reason text,
  consequence_json jsonb not null default '{}'::jsonb,
  opened_by uuid,
  opened_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,dispute_code)
);

create table if not exists public.angelcare360_finance_reconciliation_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  session_code text not null,
  source_type text not null,
  source_reference text,
  date_from date,
  date_to date,
  status text not null default 'open',
  summary_json jsonb not null default '{}'::jsonb,
  opened_by uuid,
  opened_at timestamptz not null default now(),
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(school_id,session_code)
);

create table if not exists public.angelcare360_finance_reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  reconciliation_session_id uuid references public.angelcare360_finance_reconciliation_sessions(id) on delete cascade,
  payment_id uuid references public.angelcare360_payments(id) on delete set null,
  source_reference text,
  source_amount numeric(18,2),
  matched_amount numeric(18,2),
  confidence numeric(7,4),
  conflict_json jsonb not null default '{}'::jsonb,
  status text not null default 'unmatched',
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_finance_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  period_code text not null,
  label text not null,
  date_from date not null,
  date_to date not null,
  status text not null default 'open',
  closure_snapshot jsonb not null default '{}'::jsonb,
  closed_by uuid,
  closed_at timestamptz,
  reopened_by uuid,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,period_code)
);

create table if not exists public.angelcare360_finance_closure_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  finance_period_id uuid not null references public.angelcare360_finance_periods(id) on delete cascade,
  run_code text not null,
  status text not null default 'review',
  blockers_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(school_id,run_code)
);

create table if not exists public.angelcare360_finance_document_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  template_code text not null,
  document_type text not null,
  language text not null default 'fr',
  version_number integer not null default 1,
  data_contract jsonb not null default '{}'::jsonb,
  template_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  effective_from timestamptz,
  effective_to timestamptz,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,template_code,version_number)
);

create table if not exists public.angelcare360_finance_document_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  document_number text not null,
  document_type text not null,
  source_type text not null,
  source_id uuid not null,
  source_revision_hash text not null,
  template_key text not null,
  template_version text not null,
  storage_bucket text not null,
  storage_path text not null,
  checksum_sha256 text not null,
  size_bytes bigint not null,
  status text not null default 'generated',
  supersedes_document_version_id uuid references public.angelcare360_finance_document_versions(id) on delete set null,
  generated_by uuid,
  generated_at timestamptz not null default now(),
  published_by uuid,
  published_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(school_id,document_number),
  unique(school_id,source_type,source_id,source_revision_hash,document_type)
);

create table if not exists public.angelcare360_finance_report_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  run_code text not null,
  report_key text not null,
  report_title text,
  output_format text not null default 'pdf',
  status text not null default 'queued',
  parameters_json jsonb not null default '{}'::jsonb,
  result_document_id uuid references public.angelcare360_finance_document_versions(id) on delete set null,
  result_storage_path text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  error_message text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique(school_id,run_code),
  unique(school_id,idempotency_key)
);

create table if not exists public.angelcare360_finance_export_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  export_code text not null,
  export_type text not null,
  format text not null,
  filters_json jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  storage_path text,
  checksum_sha256 text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique(school_id,export_code)
);

insert into public.angelcare360_product_reality_operation_catalog(
  operation_key,domain_key,label,description,permission_key,module_key,capability_key,feature_key,lifecycle_guard,requires_approval,idempotent,audit_event,command_family,operator_only,status
) values
  ('finance.workspace.view','finance','Ouvrir l’autorité financière','Valide le droit effectif avant chargement du commandement financier.','finance.view','finance','finance.overview',null,null,false,true,'finance.workspace.viewed','finance',false,'published'),
  ('finance.fee.create','finance','Créer une structure de frais','Crée une doctrine de frais en brouillon dans le contexte académique actif.','finance.create','finance','finance.frais',null,'finance_fee_policy',false,true,'finance.fee.created','finance',false,'published'),
  ('finance.fee.item.create','finance','Ajouter une ligne de frais','Ajoute une ligne tarifaire à une structure avant publication.','finance.create','finance','finance.frais',null,'finance_fee_policy',false,true,'finance.fee_item.created','finance',false,'published'),
  ('finance.installment_plan.create','finance','Créer un échéancier','Crée un plan structuré avec montant, dépôt, échéances et révision.','finance.create','finance','finance.affectations_frais',null,'finance_installment_plan',false,true,'finance.installment_plan.created','finance',false,'published'),
  ('finance.invoice.create','finance','Créer une facture manuelle','Crée une facture brouillon autoritative hors run avec contrôles de montant.','finance.create','finance','finance.factures',null,'finance_invoice',false,true,'finance.invoice.created','finance',false,'published'),
  ('finance.payment.confirm','finance','Confirmer un paiement','Confirme un encaissement avant allocation et émission de reçu.','finance.approve','finance','finance.paiements',null,'finance_payment',true,true,'finance.payment.confirmed','finance',false,'published'),
  ('finance.discount.apply','finance','Appliquer une remise','Applique une remise approuvée et recalcule la facture réelle.','finance.approve','finance','finance.remises',null,'finance_discount',true,true,'finance.discount.applied','finance',false,'published'),
  ('finance.reminder.create','finance','Créer une intention de relance','Crée une relance financière dédupliquée sans envoyer directement le canal.','finance.create','finance','finance.relances',null,'finance_collection',false,true,'finance.reminder.created','finance',false,'published'),
  ('finance.dispute.open','finance','Ouvrir un litige financier','Ouvre une contestation liée à un compte, une facture ou un paiement.','finance.create','finance','finance.relances',null,'finance_dispute',false,true,'finance.dispute.opened','finance',false,'published'),
  ('finance.reconciliation.session.open','finance','Ouvrir un rapprochement','Crée une session bornée pour banque, caisse, chèque ou passerelle.','finance.create','finance','finance.paiements',null,'finance_reconciliation',false,true,'finance.reconciliation.opened','finance',false,'published'),
  ('finance.period.create','finance','Créer une période financière','Crée une période opérationnelle avec dates et verrouillage futur.','finance.create','finance','finance.audit',null,'finance_period',false,true,'finance.period.created','finance',false,'published'),
  ('finance.document.template.publish','finance','Publier un template financier','Publie une version de template document avec contrat de données.','reports.approve','reports','reports.documents',null,'finance_document',true,true,'finance.document_template.published','finance',false,'published'),
  ('finance.fee.version.publish','finance','Publier une version de frais','Publie une doctrine tarifaire immutable et effective-dated.','finance.approve','finance','finance.frais',null,'finance_fee_policy',true,true,'finance.fee.version.published','finance',false,'published'),
  ('finance.assignment.create','finance','Créer une affectation de frais','Affecte une doctrine de frais à un élève, une famille ou une cohorte.','finance.create','finance','finance.affectations_frais',null,'finance_assignment',false,true,'finance.assignment.created','finance',false,'published'),
  ('finance.installment_plan.approve','finance','Approuver un échéancier','Active un plan de paiement versionné sans réécrire les échéances historiques.','finance.approve','finance','finance.affectations_frais',null,'finance_installment_plan',true,true,'finance.installment_plan.approved','finance',false,'published'),
  ('finance.billing_run.preview','finance','Prévisualiser un run de facturation','Calcule les éligibles, exclusions, montants et bloqueurs avant mutation.','finance.create','finance','finance.factures',null,'finance_billing_run',false,true,'finance.billing_run.previewed','finance',false,'published'),
  ('finance.billing_run.execute','finance','Exécuter un run de facturation','Produit les factures sans doublon et conserve un résultat par affectation.','finance.approve','finance','finance.factures',null,'finance_billing_run',true,true,'finance.billing_run.executed','finance',false,'published'),
  ('finance.invoice.issue','finance','Émettre une facture','Émet la facture autoritative et génère son document versionné.','finance.approve','finance','finance.factures',null,'finance_invoice',true,true,'finance.invoice.issued','finance',false,'published'),
  ('finance.invoice.credit','finance','Créer un avoir','Corrige une facture par un avoir sans effacer son histoire.','finance.approve','finance','finance.factures',null,'finance_invoice',true,true,'finance.invoice.credited','finance',false,'published'),
  ('finance.invoice.cancel','finance','Annuler une facture','Annule par une transition gouvernée avec motif et audit.','finance.approve','finance','finance.factures',null,'finance_invoice',true,true,'finance.invoice.cancelled','finance',false,'published'),
  ('finance.payment.capture','finance','Enregistrer un paiement','Capture un paiement après contrôle de référence, montant et méthode.','finance.create','finance','finance.paiements',null,'finance_payment',false,true,'finance.payment.captured','finance',false,'published'),
  ('finance.payment.allocate','finance','Affecter un paiement','Affecte un paiement à une ou plusieurs factures en préservant les invariants.','finance.update','finance','finance.paiements',null,'finance_payment_allocation',false,true,'finance.payment.allocated','finance',false,'published'),
  ('finance.payment.reallocate','finance','Réaffecter un paiement','Révise une affectation avec historique avant/après.','finance.approve','finance','finance.paiements',null,'finance_payment_allocation',true,true,'finance.payment.reallocated','finance',false,'published'),
  ('finance.receipt.issue','finance','Émettre un reçu','Génère un reçu financier immutable depuis le paiement réel.','finance.create','finance','finance.recus',null,'finance_receipt',false,true,'finance.receipt.issued','finance',false,'published'),
  ('finance.refund.request','finance','Demander un remboursement','Ouvre une demande liée au paiement source.','finance.create','finance','finance.paiements',null,'finance_refund',false,true,'finance.refund.requested','finance',false,'published'),
  ('finance.refund.approve','finance','Approuver un remboursement','Décide le montant remboursable sans réécrire le paiement source.','finance.approve','finance','finance.paiements',null,'finance_refund',true,true,'finance.refund.approved','finance',false,'published'),
  ('finance.refund.execute','finance','Exécuter un remboursement','Exécute et soumet le remboursement au rapprochement.','finance.approve','finance','finance.paiements',null,'finance_refund',true,true,'finance.refund.executed','finance',false,'published'),
  ('finance.discount.request','finance','Demander une remise','Enregistre une remise ou aide financière documentée.','finance.create','finance','finance.remises',null,'finance_discount',false,true,'finance.discount.requested','finance',false,'published'),
  ('finance.discount.approve','finance','Approuver une remise','Approuve une réduction et prépare son impact financier réel.','finance.approve','finance','finance.remises',null,'finance_discount',true,true,'finance.discount.approved','finance',false,'published'),
  ('finance.collection_case.open','finance','Ouvrir un dossier de recouvrement','Crée un dossier rattaché au compte payeur et aux créances.','finance.create','finance','finance.relances',null,'finance_collection',false,true,'finance.collection_case.opened','finance',false,'published'),
  ('finance.commitment.record','finance','Enregistrer un engagement','Crée une promesse de paiement avec montant et échéance.','finance.update','finance','finance.relances',null,'finance_collection',false,true,'finance.commitment.recorded','finance',false,'published'),
  ('finance.commitment.resolve','finance','Résoudre un engagement','Marque un engagement tenu, rompu ou renégocié.','finance.update','finance','finance.relances',null,'finance_collection',false,true,'finance.commitment.resolved','finance',false,'published'),
  ('finance.dispute.decide','finance','Décider un litige','Décide le litige et persiste sa conséquence financière.','finance.approve','finance','finance.relances',null,'finance_dispute',true,true,'finance.dispute.decided','finance',false,'published'),
  ('finance.statement.generate','finance','Générer un relevé','Génère un état de compte depuis le ledger autoritatif.','finance.view','finance','finance.etats_compte',null,'finance_document',false,true,'finance.statement.generated','finance',false,'published'),
  ('finance.expense.submit','finance','Soumettre une dépense','Crée une dépense opérationnelle avec justificatifs.','finance.create','finance','finance.depenses',null,'finance_expense',false,true,'finance.expense.submitted','finance',false,'published'),
  ('finance.expense.approve','finance','Approuver une dépense','Approuve selon seuils et séparation des tâches.','finance.approve','finance','finance.depenses',null,'finance_expense',true,true,'finance.expense.approved','finance',false,'published'),
  ('finance.expense.mark_paid','finance','Marquer une dépense payée','Enregistre le paiement sans réécrire l’approbation.','finance.update','finance','finance.depenses',null,'finance_expense',false,true,'finance.expense.paid','finance',false,'published'),
  ('finance.reconciliation.resolve','finance','Résoudre un rapprochement','Décide un match ou un écart avec preuve.','finance.approve','finance','finance.paiements',null,'finance_reconciliation',true,true,'finance.reconciliation.resolved','finance',false,'published'),
  ('finance.period.close','finance','Clôturer une période','Vérifie les bloqueurs et verrouille les mutations.','finance.approve','finance','finance.audit',null,'finance_period',true,true,'finance.period.closed','finance',false,'published'),
  ('finance.period.reopen','finance','Réouvrir une période','Réouvre par autorité, motif et obligation de re-clôture.','finance.approve','finance','finance.audit',null,'finance_period',true,true,'finance.period.reopened','finance',false,'published'),
  ('finance.document.generate','finance','Générer un document financier','Produit un PDF autoritatif versionné et empreinté.','reports.create','reports','reports.documents',null,'finance_document',false,true,'finance.document.generated','finance',false,'published'),
  ('finance.report.execute','finance','Exécuter un rapport financier','Crée un run borné et audité.','reports.create','reports','reports.catalogue',null,'finance_report',false,true,'finance.report.executed','finance',false,'published'),
  ('finance.export.execute','finance','Exécuter un export financier','Exécute un export contrôlé avec rétention et expiration.','reports.create','reports','reports.exports',null,'finance_export',false,true,'finance.export.executed','finance',false,'published'),
  ('finance.approval.decide','finance','Décider une approbation financière','Approuve ou rejette puis exécute la conséquence réelle.','finance.approve','finance','finance.audit',null,'shared_approval',false,true,'finance.approval.decided','finance',false,'published')
on conflict(operation_key) do update set
  domain_key=excluded.domain_key,label=excluded.label,description=excluded.description,permission_key=excluded.permission_key,module_key=excluded.module_key,
  capability_key=excluded.capability_key,feature_key=excluded.feature_key,lifecycle_guard=excluded.lifecycle_guard,requires_approval=excluded.requires_approval,
  idempotent=excluded.idempotent,audit_event=excluded.audit_event,command_family=excluded.command_family,operator_only=excluded.operator_only,status='published',updated_at=now();

insert into public.angelcare360_product_reality_policy_versions(school_id,policy_key,domain_key,name,version_number,configuration,status,effective_from,published_at)
select s.id,p.policy_key,'finance',p.name,1,p.configuration,'published',now(),now()
from public.angelcare360_schools s
cross join (values
 ('finance_fee_policy','Doctrine de frais', '{"versioned":true,"effectiveDating":true,"immutableAfterPublication":true}'::jsonb),
 ('finance_assignment','Éligibilité et affectation', '{"preventDuplicateActive":true,"requireActiveStudent":true}'::jsonb),
 ('finance_installment_plan','Échéanciers', '{"preserveRevisions":true,"preventSilentRewrite":true}'::jsonb),
 ('finance_billing_run','Production de factures', '{"previewRequired":true,"idempotent":true,"perRecordResult":true}'::jsonb),
 ('finance_invoice','Factures et avoirs', '{"immutableAfterIssue":true,"creditNoteRequired":true,"safeDecimal":true}'::jsonb),
 ('finance_payment','Paiements', '{"duplicateReferenceCheck":true,"preserveSource":true}'::jsonb),
 ('finance_payment_allocation','Affectation de paiement', '{"balanced":true,"revisionRequired":true}'::jsonb),
 ('finance_receipt','Reçus', '{"immutableVersion":true,"sourcePaymentRequired":true}'::jsonb),
 ('finance_refund','Remboursements', '{"approvalRequired":true,"sourcePaymentPreserved":true}'::jsonb),
 ('finance_discount','Remises et aides', '{"approvalThresholds":true,"realFinancialConsequence":true}'::jsonb),
 ('finance_collection','Recouvrement', '{"agingConfigurable":true,"commitmentMonitoring":true}'::jsonb),
 ('finance_dispute','Litiges', '{"evidenceRequired":true,"financialConsequenceRequired":true}'::jsonb),
 ('finance_expense','Dépenses', '{"segregationOfDuties":true,"evidenceRequired":true}'::jsonb),
 ('finance_reconciliation','Rapprochement', '{"deterministicMatchingOnly":true,"reviewRequiredForConflicts":true}'::jsonb),
 ('finance_period','Périodes financières', '{"serverLock":true,"reopenReasonRequired":true}'::jsonb),
 ('finance_document','Documents financiers', '{"privateStorage":true,"checksum":true,"historicalVersion":true}'::jsonb),
 ('finance_report','Rapports financiers', '{"boundedPayload":true,"backgroundExecution":true}'::jsonb),
 ('finance_export','Exports contrôlés', '{"tenantScoped":true,"retention":true,"expiry":true}'::jsonb)
) as p(policy_key,name,configuration)
where not exists (
  select 1 from public.angelcare360_product_reality_policy_versions v where v.school_id=s.id and v.policy_key=p.policy_key and v.version_number=1
);


create index if not exists ac360_fin_exec_school_state_idx on public.angelcare360_finance_authority_executions(school_id,state,created_at desc);
create index if not exists ac360_fin_billing_school_status_idx on public.angelcare360_finance_billing_runs(school_id,status,created_at desc);
create index if not exists ac360_fin_alloc_payment_idx on public.angelcare360_finance_payment_allocations(school_id,payment_id,status);
create index if not exists ac360_fin_alloc_invoice_idx on public.angelcare360_finance_payment_allocations(school_id,invoice_id,status);
create index if not exists ac360_fin_collection_due_idx on public.angelcare360_finance_collection_cases(school_id,status,due_at);
create index if not exists ac360_fin_commitment_due_idx on public.angelcare360_finance_payment_commitments(school_id,status,due_date);
create index if not exists ac360_fin_refund_status_idx on public.angelcare360_finance_refund_requests(school_id,status,requested_at desc);
create index if not exists ac360_fin_period_dates_idx on public.angelcare360_finance_periods(school_id,date_from,date_to,status);
create index if not exists ac360_fin_docs_source_idx on public.angelcare360_finance_document_versions(school_id,source_type,source_id,generated_at desc);
create index if not exists ac360_fin_reports_status_idx on public.angelcare360_finance_report_runs(school_id,status,requested_at desc);
create index if not exists ac360_fin_exports_status_idx on public.angelcare360_finance_export_runs(school_id,status,requested_at desc);

alter table public.angelcare360_product_reality_approvals add column if not exists domain text;
create index if not exists ac360_reality_approvals_domain_status_idx on public.angelcare360_product_reality_approvals(school_id,domain,status,requested_at desc);

-- Server-authority tables: service-role only. Customer access is mediated by typed APIs.
do $$
declare t text;
begin
  foreach t in array array[
    'angelcare360_finance_number_sequences','angelcare360_finance_authority_executions','angelcare360_finance_fee_policy_versions',
    'angelcare360_finance_eligibility_rules','angelcare360_finance_installment_plans','angelcare360_finance_installment_plan_revisions',
    'angelcare360_finance_billing_runs','angelcare360_finance_billing_run_items','angelcare360_finance_payer_accounts',
    'angelcare360_finance_payer_account_members','angelcare360_finance_invoice_revisions','angelcare360_finance_credit_notes',
    'angelcare360_finance_payment_allocations','angelcare360_finance_payment_allocation_revisions','angelcare360_finance_account_credit_transactions',
    'angelcare360_finance_refund_requests','angelcare360_finance_collection_cases','angelcare360_finance_payment_commitments',
    'angelcare360_finance_disputes','angelcare360_finance_reconciliation_sessions','angelcare360_finance_reconciliation_matches',
    'angelcare360_finance_periods','angelcare360_finance_closure_runs','angelcare360_finance_document_templates',
    'angelcare360_finance_document_versions','angelcare360_finance_report_runs','angelcare360_finance_export_runs'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant all on table public.%I to service_role',t);
  end loop;
end $$;

revoke all on table public.angelcare360_finance_number_sequences from public;

commit;
