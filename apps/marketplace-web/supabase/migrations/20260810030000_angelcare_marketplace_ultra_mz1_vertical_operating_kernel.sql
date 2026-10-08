begin;

-- ANGELCARE MARKETPLACE ULTRA MEGA ZIP 1
-- Sovereign admin access + vertical operating kernel + vendor execution authority.
-- Additive only. No production rows are deleted or truncated.

create table if not exists public.angelcare_marketplace_admin_access_policies(
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null unique references public.app_users(id) on delete restrict,
  status text not null default 'active' check(status in('active','suspended','revoked')),
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  require_mfa boolean not null default false,
  session_duration_hours integer not null default 12 check(session_duration_hours between 1 and 168),
  allowed_origins text[] not null default '{}',
  policy_metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.angelcare_marketplace_admin_access_policies(app_user_id,status,session_duration_hours,policy_metadata)
select distinct a.app_user_id,'active',12,jsonb_build_object('source','ultra_mz1_admin_authority_seed')
from public.angelcare_marketplace_user_role_assignments a
where a.active=true and a.role_key='marketplace_admin'
on conflict(app_user_id) do nothing;

create table if not exists public.angelcare_marketplace_workspace_registry(
  workspace_key text primary key,
  route text not null unique,
  domain text not null,
  mission text not null,
  primary_entity_type text not null,
  workspace_type text not null check(workspace_type in('command','queue','dossier','studio','reconciliation','configuration')),
  lifecycle jsonb not null default '[]',
  required_capabilities text[] not null default '{}',
  required_evidence text[] not null default '{}',
  verticality_version integer not null default 1,
  status text not null default 'production' check(status in('production','consolidating','retired')),
  owner_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_operating_cases(
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('OPSCASE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  workspace_key text not null references public.angelcare_marketplace_workspace_registry(workspace_key),
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  mission text,
  status text not null default 'open' check(status in('open','intake','validation','qualified','ready','in_progress','evidence_pending','approval_pending','blocked','recovery','reconciled','closed','cancelled')),
  priority text not null default 'normal' check(priority in('low','normal','high','urgent','critical')),
  risk_level text not null default 'normal' check(risk_level in('low','normal','high','critical')),
  owner_id uuid,
  tenant_id uuid,
  territory_id uuid,
  customer_id uuid,
  organization_id uuid,
  next_action text,
  due_at timestamptz,
  blockers text[] not null default '{}',
  financial_exposure numeric(18,2) not null default 0,
  currency_label text not null default 'Dh',
  source_system text not null default 'angelcare_marketplace',
  source_reference text,
  closure_code text,
  closure_summary text,
  closed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_key,entity_type,entity_id)
);

create table if not exists public.angelcare_marketplace_operating_assignments(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  assignee_type text not null default 'user' check(assignee_type in('user','team','provider','vendor','partner')),
  assignee_id uuid not null,
  role_label text,
  status text not null default 'active' check(status in('active','released','escalated','completed')),
  priority text not null default 'normal',
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  released_at timestamptz,
  reason text,
  created_at timestamptz not null default now()
);
create unique index if not exists ac_marketplace_operating_assignment_active_uq on public.angelcare_marketplace_operating_assignments(case_id,assignee_type,assignee_id) where status='active';

create table if not exists public.angelcare_marketplace_operating_timeline(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  event_kind text not null,
  action text not null,
  actor_id uuid,
  previous_state text,
  new_state text,
  reason text,
  request_id text,
  source text not null default 'marketplace_admin',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_operating_evidence(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  evidence_type text not null,
  title text not null,
  source_type text not null default 'manual',
  source_reference text,
  storage_reference text,
  validation_status text not null default 'submitted' check(validation_status in('requested','submitted','under_review','validated','rejected','superseded')),
  customer_visible boolean not null default false,
  submitted_by uuid,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_operating_approvals(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  approval_key text not null,
  version integer not null default 1,
  required_role text,
  status text not null default 'pending' check(status in('pending','approved','rejected','returned_for_rework','cancelled','superseded')),
  requested_by uuid,
  requested_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  evidence_ids uuid[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id,approval_key,version)
);

create table if not exists public.angelcare_marketplace_operating_exceptions(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('EXC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  exception_type text not null,
  status text not null default 'open' check(status in('open','triaged','owned','action_plan','resolved','verified','closed','cancelled')),
  severity text not null default 'medium' check(severity in('low','medium','high','critical')),
  summary text not null,
  next_action text,
  owner_id uuid,
  due_at timestamptz,
  blocker_codes text[] not null default '{}',
  financial_exposure numeric(18,2) not null default 0,
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_operating_recovery_actions(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  exception_id uuid references public.angelcare_marketplace_operating_exceptions(id) on delete set null,
  action_type text not null,
  status text not null default 'planned' check(status in('planned','approved','in_progress','completed','failed','cancelled')),
  idempotency_key text unique,
  title text not null,
  reason text,
  requested_by uuid,
  approved_by uuid,
  executed_by uuid,
  requested_at timestamptz not null default now(),
  executed_at timestamptz,
  before_state jsonb not null default '{}',
  after_state jsonb not null default '{}',
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_operating_comments(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare_marketplace_operating_cases(id) on delete restrict,
  author_id uuid,
  body text not null check(length(trim(body)) between 1 and 5000),
  visibility text not null default 'internal' check(visibility in('internal','customer','partner','provider','vendor')),
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_command_idempotency(
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  idempotency_key text not null,
  actor_id uuid,
  request_hash text,
  status text not null default 'claimed' check(status in('claimed','completed','failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  unique(scope,idempotency_key)
);

-- Vendor vertical authority. Existing vendor_links remains the canonical identity bridge.
create table if not exists public.angelcare_marketplace_vendor_contracts(
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.angelcare_marketplace_vendor_links(id) on delete restrict,
  public_reference text unique not null default ('VCON-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  contract_reference text,
  status text not null default 'draft' check(status in('draft','due_diligence','approval_pending','approved','active','renewal_due','suspended','terminated','expired')),
  starts_at date,
  ends_at date,
  renewal_mode text not null default 'manual',
  service_level jsonb not null default '{}',
  commercial_terms jsonb not null default '{}',
  settlement_terms jsonb not null default '{}',
  compliance_requirements jsonb not null default '{}',
  owner_id uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_vendor_orders(
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.angelcare_marketplace_vendor_links(id),
  fulfillment_case_id uuid references public.angelcare_marketplace_fulfillment_cases(id),
  public_reference text unique not null default ('VORD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  status text not null default 'requested' check(status in('requested','accepted','rejected','preparing','dispatched','delivered','evidence_pending','validated','disputed','cancelled','closed')),
  amount numeric(18,2) not null default 0,
  currency text not null default 'Dh',
  expected_at timestamptz,
  delivered_at timestamptz,
  evidence_status text not null default 'pending',
  quality_status text not null default 'pending',
  settlement_status text not null default 'not_ready',
  owner_id uuid,
  tenant_id uuid,
  territory_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_vendor_inventory_authority(
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.angelcare_marketplace_vendor_links(id) on delete restrict,
  catalog_item_id uuid not null,
  status text not null default 'unknown' check(status in('unknown','available','low','out_of_stock','discontinued','blocked')),
  quantity_available numeric(18,3),
  quantity_reserved numeric(18,3) not null default 0,
  lead_time_minutes integer,
  source text not null default 'manual',
  source_reference text,
  observed_at timestamptz not null default now(),
  updated_by uuid,
  unique(vendor_id,catalog_item_id)
);

create table if not exists public.angelcare_marketplace_vendor_quality_reviews(
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.angelcare_marketplace_vendor_links(id) on delete restrict,
  vendor_order_id uuid references public.angelcare_marketplace_vendor_orders(id) on delete set null,
  review_type text not null,
  status text not null default 'open' check(status in('open','evidence_required','review','approved','corrective_action','failed','closed')),
  score numeric(6,2),
  findings jsonb not null default '{}',
  corrective_actions jsonb not null default '[]',
  owner_id uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_vendor_performance_events(
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.angelcare_marketplace_vendor_links(id) on delete restrict,
  event_type text not null,
  score numeric(6,2),
  severity text,
  related_object_type text,
  related_object_id uuid,
  details jsonb not null default '{}',
  recorded_by uuid,
  created_at timestamptz not null default now()
);

-- Indexes for command queues.
create index if not exists ac_marketplace_operating_cases_queue_idx on public.angelcare_marketplace_operating_cases(workspace_key,status,priority,due_at,updated_at desc);
create index if not exists ac_marketplace_operating_cases_entity_idx on public.angelcare_marketplace_operating_cases(entity_type,entity_id);
create index if not exists ac_marketplace_operating_timeline_case_idx on public.angelcare_marketplace_operating_timeline(case_id,created_at desc);
create index if not exists ac_marketplace_operating_evidence_case_idx on public.angelcare_marketplace_operating_evidence(case_id,validation_status,submitted_at desc);
create index if not exists ac_marketplace_operating_approvals_case_idx on public.angelcare_marketplace_operating_approvals(case_id,status,requested_at desc);
create index if not exists ac_marketplace_operating_exceptions_queue_idx on public.angelcare_marketplace_operating_exceptions(status,severity,due_at,updated_at desc);
create index if not exists ac_marketplace_vendor_contract_queue_idx on public.angelcare_marketplace_vendor_contracts(status,ends_at,updated_at desc);
create index if not exists ac_marketplace_vendor_order_queue_idx on public.angelcare_marketplace_vendor_orders(status,expected_at,updated_at desc);
create index if not exists ac_marketplace_vendor_quality_queue_idx on public.angelcare_marketplace_vendor_quality_reviews(status,due_at,updated_at desc);

-- Canonical ZIP1 workspace registry. These are the mission authorities, not decorative route labels.
insert into public.angelcare_marketplace_workspace_registry(workspace_key,route,domain,mission,primary_entity_type,workspace_type,lifecycle,required_capabilities,required_evidence,verticality_version,owner_role)
values
('catalog.command','/angelcare-marketplace/admin/catalog','catalog','Gouverner l offre canonique jusqu à publication.','catalog_item','command','["draft","content_incomplete","commercial_review","pricing_ready","availability_ready","trust_ready","publication_ready","published","suspended","retired"]','{dossier,validation,publication,exceptions,audit}','{content,price,availability}',1,'marketplace_catalog_manager'),
('commercial.pipeline','/angelcare-marketplace/admin/commercial','commercial','Transformer la demande en engagement commercial traçable.','commercial_opportunity','command','["captured","qualified","opportunity","solution_build","quote","negotiation","commitment","won","lost"]','{intake,qualification,dossier,assignment,quote,closure,audit}','{}',1,'marketplace_commercial_manager'),
('conversion.command','/angelcare-marketplace/admin/conversion','conversion','Convertir une intention en objet canonique exactement une fois.','conversion_journey','command','["captured","qualified","scheduled","in_preparation","in_progress","completed","cancelled"]','{idempotency,payment_gate,state_transition,audit}','{}',1,'marketplace_conversion_manager'),
('payments.command','/angelcare-marketplace/admin/payments','payments','Contrôler intents, captures, remboursements, litiges et rapprochements.','payment_intent','command','["created","requires_action","processing","captured","partially_refunded","refunded","failed","cancelled","expired","reversed","disputed"]','{dossier,reconciliation,exceptions,recovery,audit}','{provider_event}',1,'marketplace_finance_manager'),
('wallet.command','/angelcare-marketplace/admin/wallet','wallet','Gouverner passif Wallet, réservations, écritures et exceptions.','wallet_account','command','["active","frozen","closed"]','{ledger,reservation,reconciliation,risk,audit}','{}',1,'marketplace_finance_manager'),
('orders.command','/angelcare-marketplace/admin/orders','orders','Porter l engagement client du paiement à la clôture.','order','command','["draft","awaiting_payment","paid","validated","execution_ready","in_fulfillment","partially_fulfilled","fulfilled","reconciled","closed","on_hold","cancelled","returned","disputed","recovery"]','{dossier,fulfillment,exceptions,reconciliation,closure,audit}','{payment,fulfillment}',1,'marketplace_operations_manager'),
('finance.command','/angelcare-marketplace/admin/finance','finance','Protéger prix, marge, invoice readiness et rapprochement.','finance_case','command','["open","review","approval_pending","approved","reconciled","closed"]','{pricing,approval,reconciliation,exceptions,audit}','{financial_evidence}',1,'marketplace_finance_manager'),
('providers.command','/angelcare-marketplace/admin/providers','providers','Qualifier la capacité provider avant affectation et paiement.','provider_profile','command','["lead","application","document_review","qualification","approved","activation","active","restricted","suspended","terminated"]','{onboarding,documents,eligibility,availability,assignment,performance,payable,audit}','{identity,documents,certifications}',1,'marketplace_provider_manager'),
('vendors.command','/angelcare-marketplace/admin/vendors','vendors','Gouverner vendor du onboarding au settlement.','vendor','command','["prospect","qualification","due_diligence","approved","contracted","active","performance_review","restricted","suspended","terminated"]','{onboarding,contracts,inventory,orders,quality,disputes,settlement,audit}','{contract,delivery,quality}',1,'marketplace_vendor_manager'),
('partner_os.command','/angelcare-marketplace/admin/partner-os','partner_os','Gouverner tenant SaaS du contrat au renouvellement.','partner_tenant','command','["draft","onboarding","trial","active","suspended","cancelled","archived"]','{tenant,subscription,modules,onboarding,usage,support,renewal,audit}','{onboarding}',1,'marketplace_partner_manager'),
('operations.fulfillment','/angelcare-marketplace/admin/operations/fulfillment','operations','Exécuter chaque obligation et prouver la livraison.','fulfillment_case','queue','["commercially_confirmed","readiness_review","ready_for_assignment","assigned","accepted","in_execution","evidence_pending","quality_review","completed","reconciliation_pending","reconciled","closed","blocked","failed","disputed","recovery","cancelled"]','{assignment,evidence,validation,exceptions,recovery,reconciliation,closure,audit}','{execution_proof}',1,'marketplace_operations_manager'),
('operations.returns','/angelcare-marketplace/admin/operations/returns','operations','Traiter retour et remède sans perdre effet financier.','return_case','queue','["submitted","eligibility_review","approved","receipt_pending","finance_decision","refund_or_credit","resolved","closed","rejected"]','{eligibility,evidence,financial_handover,closure,audit}','{return_evidence}',1,'marketplace_operations_manager'),
('operations.disputes','/angelcare-marketplace/admin/operations/disputes','operations','Investiguer un litige jusqu à décision et remédiation.','dispute','queue','["open","triage","investigation","decision_pending","remedy_pending","resolved","closed","reopened"]','{evidence,investigation,decision,remedy,closure,audit}','{dispute_evidence}',1,'marketplace_operations_manager'),
('operations.recovery','/angelcare-marketplace/admin/operations/recovery','operations','Restaurer service et intégrité après exception.','recovery_plan','queue','["draft","approval_pending","approved","in_progress","completed","cancelled","closed"]','{action_plan,approval,execution,evidence,closure,audit}','{}',1,'marketplace_operations_manager'),
('operations.reconciliation','/angelcare-marketplace/admin/operations/reconciliation','operations','Rapprocher attendu, observé et handover Finance.','reconciliation_case','reconciliation','["draft","evidence_incomplete","review","approval_pending","approved","finance_handover","posted","disputed","closed"]','{evidence,approval,finance_handover,closure,audit}','{reconciliation_evidence}',1,'marketplace_finance_manager')
on conflict(workspace_key) do update set route=excluded.route,domain=excluded.domain,mission=excluded.mission,primary_entity_type=excluded.primary_entity_type,workspace_type=excluded.workspace_type,lifecycle=excluded.lifecycle,required_capabilities=excluded.required_capabilities,required_evidence=excluded.required_evidence,verticality_version=excluded.verticality_version,status='production',owner_role=excluded.owner_role,updated_at=now();

-- Append-only timeline protects operational evidence history.
create or replace function public.angelcare_marketplace_operating_timeline_immutable() returns trigger language plpgsql as $$begin raise exception 'Marketplace operating timeline is immutable';end$$;
drop trigger if exists angelcare_marketplace_operating_timeline_no_update on public.angelcare_marketplace_operating_timeline;
create trigger angelcare_marketplace_operating_timeline_no_update before update or delete on public.angelcare_marketplace_operating_timeline for each row execute function public.angelcare_marketplace_operating_timeline_immutable();

create or replace function public.angelcare_marketplace_operating_case_ensure(
 p_workspace_key text,p_entity_type text,p_entity_id uuid,p_title text,p_actor_id uuid,p_tenant_id uuid default null,p_territory_id uuid default null,p_source_reference text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.angelcare_marketplace_operating_cases;
begin
 insert into public.angelcare_marketplace_operating_cases(workspace_key,entity_type,entity_id,title,owner_id,tenant_id,territory_id,source_reference,created_by,updated_by)
 values(p_workspace_key,p_entity_type,p_entity_id,p_title,p_actor_id,p_tenant_id,p_territory_id,p_source_reference,p_actor_id,p_actor_id)
 on conflict(workspace_key,entity_type,entity_id) do update set title=excluded.title,updated_by=p_actor_id,updated_at=now()
 returning * into r;
 insert into public.angelcare_marketplace_operating_timeline(case_id,event_kind,action,actor_id,new_state,source,metadata)
 values(r.id,'case','case.ensure',p_actor_id,r.status,'operating-kernel',jsonb_build_object('workspace_key',p_workspace_key)) on conflict do nothing;
 return to_jsonb(r);
end$$;

create or replace function public.angelcare_marketplace_operating_case_transition(
 p_case_id uuid,p_next_status text,p_reason text,p_actor_id uuid,p_request_id text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.angelcare_marketplace_operating_cases; old_status text;
begin
 select * into r from public.angelcare_marketplace_operating_cases where id=p_case_id for update;
 if r.id is null then raise exception 'Operating case not found'; end if;
 old_status:=r.status;
 if old_status in('closed','cancelled') then raise exception 'Terminal operating case cannot transition'; end if;
 if p_next_status not in('open','intake','validation','qualified','ready','in_progress','evidence_pending','approval_pending','blocked','recovery','reconciled','closed','cancelled') then raise exception 'Unsupported operating case status'; end if;
 update public.angelcare_marketplace_operating_cases set status=p_next_status,closure_code=case when p_next_status='closed' then coalesce(closure_code,'completed') else closure_code end,closed_at=case when p_next_status='closed' then now() else null end,updated_by=p_actor_id,updated_at=now() where id=p_case_id returning * into r;
 insert into public.angelcare_marketplace_operating_timeline(case_id,event_kind,action,actor_id,previous_state,new_state,reason,request_id,source) values(p_case_id,'state','case.transition',p_actor_id,old_status,p_next_status,p_reason,p_request_id,'operating-kernel');
 return to_jsonb(r);
end$$;

create or replace function public.angelcare_marketplace_operating_assignment_set(
 p_case_id uuid,p_assignee_type text,p_assignee_id uuid,p_role_label text,p_reason text,p_due_at timestamptz,p_actor_id uuid,p_request_id text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.angelcare_marketplace_operating_assignments;
begin
 update public.angelcare_marketplace_operating_assignments set status='released',released_at=now() where case_id=p_case_id and status='active';
 insert into public.angelcare_marketplace_operating_assignments(case_id,assignee_type,assignee_id,role_label,status,assigned_by,due_at,reason) values(p_case_id,p_assignee_type,p_assignee_id,p_role_label,'active',p_actor_id,p_due_at,p_reason) returning * into r;
 update public.angelcare_marketplace_operating_cases set owner_id=case when p_assignee_type='user' then p_assignee_id else owner_id end,due_at=coalesce(p_due_at,due_at),updated_by=p_actor_id,updated_at=now() where id=p_case_id;
 insert into public.angelcare_marketplace_operating_timeline(case_id,event_kind,action,actor_id,reason,request_id,source,metadata) values(p_case_id,'assignment','case.assign',p_actor_id,p_reason,p_request_id,'operating-kernel',jsonb_build_object('assignee_type',p_assignee_type,'assignee_id',p_assignee_id,'role_label',p_role_label));
 return to_jsonb(r);
end$$;

create or replace function public.angelcare_marketplace_operating_approval_decide(
 p_approval_id uuid,p_decision text,p_reason text,p_actor_id uuid,p_request_id text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.angelcare_marketplace_operating_approvals;
begin
 if p_decision not in('approved','rejected','returned_for_rework','cancelled') then raise exception 'Unsupported approval decision'; end if;
 update public.angelcare_marketplace_operating_approvals set status=p_decision,decided_by=p_actor_id,decided_at=now(),decision_reason=p_reason,updated_at=now() where id=p_approval_id and status='pending' returning * into r;
 if r.id is null then raise exception 'Pending approval not found'; end if;
 insert into public.angelcare_marketplace_operating_timeline(case_id,event_kind,action,actor_id,reason,request_id,source,metadata) values(r.case_id,'approval','approval.'||p_decision,p_actor_id,p_reason,p_request_id,'operating-kernel',jsonb_build_object('approval_id',r.id,'approval_key',r.approval_key));
 return to_jsonb(r);
end$$;

create or replace function public.angelcare_marketplace_operating_exception_transition(
 p_exception_id uuid,p_next_status text,p_reason text,p_actor_id uuid,p_request_id text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.angelcare_marketplace_operating_exceptions;
begin
 if p_next_status not in('open','triaged','owned','action_plan','resolved','verified','closed','cancelled') then raise exception 'Unsupported exception status'; end if;
 update public.angelcare_marketplace_operating_exceptions set status=p_next_status,resolution=case when p_next_status in('resolved','verified','closed') then p_reason else resolution end,resolved_by=case when p_next_status in('resolved','verified','closed') then p_actor_id else resolved_by end,resolved_at=case when p_next_status in('resolved','verified','closed') then now() else resolved_at end,updated_at=now() where id=p_exception_id returning * into r;
 if r.id is null then raise exception 'Operating exception not found'; end if;
 insert into public.angelcare_marketplace_operating_timeline(case_id,event_kind,action,actor_id,reason,request_id,source,metadata) values(r.case_id,'exception','exception.'||p_next_status,p_actor_id,p_reason,p_request_id,'operating-kernel',jsonb_build_object('exception_id',r.id,'exception_type',r.exception_type));
 return to_jsonb(r);
end$$;

-- New MZ1 permissions. marketplace_admin is auto-granted by the previously installed admin authority trigger.
insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive) values
('marketplace.operating_kernel.view','Voir le noyau opérationnel','Marketplace Operating Kernel',false),
('marketplace.operating_kernel.manage','Gérer dossiers, affectations et exceptions','Marketplace Operating Kernel',true),
('marketplace.operating_kernel.approve','Décider les approbations opérationnelles','Marketplace Operating Kernel',true),
('marketplace.vendors.manage','Gérer les vendors','Vendor Authority',true),
('marketplace.vendors.contracts.manage','Gérer les contrats vendor','Vendor Authority',true),
('marketplace.vendors.inventory.manage','Gérer l autorité inventaire vendor','Vendor Authority',true),
('marketplace.vendors.orders.manage','Gérer les commandes vendor','Vendor Authority',true),
('marketplace.vendors.quality.manage','Gérer qualité vendor','Vendor Authority',true),
('marketplace.vendors.settlements.manage','Gérer settlement vendor','Vendor Authority',true)
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive;

-- Keep executive compatibility while marketplace_admin remains absolute authority.
insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key from public.angelcare_marketplace_roles r cross join public.angelcare_marketplace_permissions p
where r.role_key in('marketplace_admin','marketplace_executive','marketplace_super_admin') and (p.permission_key like 'marketplace.operating_kernel.%' or p.permission_key like 'marketplace.vendors.%')
on conflict do nothing;

-- RLS: all new authorities are server-only. The standalone app accesses them through guarded service-role repositories.
alter table public.angelcare_marketplace_admin_access_policies enable row level security;
alter table public.angelcare_marketplace_workspace_registry enable row level security;
alter table public.angelcare_marketplace_operating_cases enable row level security;
alter table public.angelcare_marketplace_operating_assignments enable row level security;
alter table public.angelcare_marketplace_operating_timeline enable row level security;
alter table public.angelcare_marketplace_operating_evidence enable row level security;
alter table public.angelcare_marketplace_operating_approvals enable row level security;
alter table public.angelcare_marketplace_operating_exceptions enable row level security;
alter table public.angelcare_marketplace_operating_recovery_actions enable row level security;
alter table public.angelcare_marketplace_operating_comments enable row level security;
alter table public.angelcare_marketplace_command_idempotency enable row level security;
alter table public.angelcare_marketplace_vendor_contracts enable row level security;
alter table public.angelcare_marketplace_vendor_orders enable row level security;
alter table public.angelcare_marketplace_vendor_inventory_authority enable row level security;
alter table public.angelcare_marketplace_vendor_quality_reviews enable row level security;
alter table public.angelcare_marketplace_vendor_performance_events enable row level security;

revoke all on table public.angelcare_marketplace_admin_access_policies,public.angelcare_marketplace_workspace_registry,public.angelcare_marketplace_operating_cases,public.angelcare_marketplace_operating_assignments,public.angelcare_marketplace_operating_timeline,public.angelcare_marketplace_operating_evidence,public.angelcare_marketplace_operating_approvals,public.angelcare_marketplace_operating_exceptions,public.angelcare_marketplace_operating_recovery_actions,public.angelcare_marketplace_operating_comments,public.angelcare_marketplace_command_idempotency,public.angelcare_marketplace_vendor_contracts,public.angelcare_marketplace_vendor_orders,public.angelcare_marketplace_vendor_inventory_authority,public.angelcare_marketplace_vendor_quality_reviews,public.angelcare_marketplace_vendor_performance_events from anon,authenticated;
grant all on table public.angelcare_marketplace_admin_access_policies,public.angelcare_marketplace_workspace_registry,public.angelcare_marketplace_operating_cases,public.angelcare_marketplace_operating_assignments,public.angelcare_marketplace_operating_timeline,public.angelcare_marketplace_operating_evidence,public.angelcare_marketplace_operating_approvals,public.angelcare_marketplace_operating_exceptions,public.angelcare_marketplace_operating_recovery_actions,public.angelcare_marketplace_operating_comments,public.angelcare_marketplace_command_idempotency,public.angelcare_marketplace_vendor_contracts,public.angelcare_marketplace_vendor_orders,public.angelcare_marketplace_vendor_inventory_authority,public.angelcare_marketplace_vendor_quality_reviews,public.angelcare_marketplace_vendor_performance_events to service_role;
grant execute on function public.angelcare_marketplace_operating_case_ensure(text,text,uuid,text,uuid,uuid,uuid,text),public.angelcare_marketplace_operating_case_transition(uuid,text,text,uuid,text),public.angelcare_marketplace_operating_assignment_set(uuid,text,uuid,text,text,timestamptz,uuid,text),public.angelcare_marketplace_operating_approval_decide(uuid,text,text,uuid,text),public.angelcare_marketplace_operating_exception_transition(uuid,text,text,uuid,text) to service_role;

commit;
