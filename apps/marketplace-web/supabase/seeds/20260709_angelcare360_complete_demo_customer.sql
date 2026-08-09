-- AngelCare 360 complete demo customer seed
-- Local/staging only. Do not run against production.
-- This file seeds one realistic Casablanca crèche/preschool tenant for operator and command-center simulation.
-- Payment gate overlay is seeded from public.angelcare360_operator_payment_gates and must remain idempotent.
-- Skipped: no campus/site table was found; multi-site intent is stored in metadata only.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- School core
-- ---------------------------------------------------------------------------

insert into public.angelcare360_schools (
  id,
  school_code,
  name,
  legal_name,
  school_type,
  country,
  city,
  address,
  phone,
  email,
  website,
  language,
  currency,
  timezone,
  status,
  metadata_json
)
values (
  md5('AC360-DEMO-PE-CASA-SCHOOL')::uuid,
  'AC360-DEMO-PE-CASA-SCHOOL',
  'École Les Petits Explorateurs Casablanca',
  'Les Petits Explorateurs Casablanca SARL',
  'creche_prescolaire',
  'Maroc',
  'Casablanca',
  'Quartier Gauthier, Casablanca, Maroc',
  '+212 5 22 00 01 01',
  'direction@petits-explorateurs-casa.demo',
  'https://petits-explorateurs-casa.demo',
  'fr',
  'MAD',
  'Africa/Casablanca',
  'active',
  '{
    "demo": true,
    "tenant_slug": "petits-explorateurs-casa-demo",
    "client_code": "AC360-DEMO-PE-CASA",
    "sites": [
      {"name": "Site Centre-Ville", "city": "Casablanca"},
      {"name": "Site Gauthier Annexe", "city": "Casablanca"}
    ]
  }'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  school_type = excluded.school_type,
  country = excluded.country,
  city = excluded.city,
  address = excluded.address,
  phone = excluded.phone,
  email = excluded.email,
  website = excluded.website,
  language = excluded.language,
  currency = excluded.currency,
  timezone = excluded.timezone,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_school_settings (
  id,
  school_id,
  default_language,
  default_currency,
  default_timezone,
  academic_year_start_month,
  week_start_day,
  grading_scale,
  attendance_grace_minutes,
  allow_parent_portal,
  allow_student_portal,
  communication_sender_name,
  school_year_label_format,
  status,
  metadata_json
)
select
  md5(s.id::text || ':school_settings')::uuid,
  s.id,
  'fr',
  'MAD',
  'Africa/Casablanca',
  7,
  1,
  '0-20',
  10,
  true,
  true,
  'AngelCare 360 Demo',
  'YYYY-YYYY+1',
  'active',
  '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
from public.angelcare360_schools s
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  default_language = excluded.default_language,
  default_currency = excluded.default_currency,
  default_timezone = excluded.default_timezone,
  academic_year_start_month = excluded.academic_year_start_month,
  week_start_day = excluded.week_start_day,
  grading_scale = excluded.grading_scale,
  attendance_grace_minutes = excluded.attendance_grace_minutes,
  allow_parent_portal = excluded.allow_parent_portal,
  allow_student_portal = excluded.allow_student_portal,
  communication_sender_name = excluded.communication_sender_name,
  school_year_label_format = excluded.school_year_label_format,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_academic_years (
  id,
  school_id,
  year_code,
  label,
  starts_on,
  ends_on,
  is_current,
  status,
  metadata_json
)
select
  md5(s.id::text || ':2026-2027')::uuid,
  s.id,
  '2026-2027',
  '2026-2027',
  '2026-07-01',
  '2027-06-30',
  true,
  'active',
  '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
from public.angelcare360_schools s
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  label = excluded.label,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_current = excluded.is_current,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_terms (
  id,
  school_id,
  academic_year_id,
  term_code,
  label,
  starts_on,
  ends_on,
  order_index,
  status,
  metadata_json
)
select
  md5(s.id::text || ':2026-2027:DEMO-T1')::uuid,
  s.id,
  y.id,
  'DEMO-T1',
  'Juillet - Octobre 2026',
  '2026-07-01',
  '2026-10-31',
  1,
  'active',
  '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo","current_period":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  label = excluded.label,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  order_index = excluded.order_index,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_terms (
  id,
  school_id,
  academic_year_id,
  term_code,
  label,
  starts_on,
  ends_on,
  order_index,
  status,
  metadata_json
)
select
  md5(s.id::text || ':2026-2027:DEMO-T2')::uuid,
  s.id,
  y.id,
  'DEMO-T2',
  'Novembre 2026 - Février 2027',
  '2026-11-01',
  '2027-02-28',
  2,
  'planned',
  '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  label = excluded.label,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  order_index = excluded.order_index,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

-- ---------------------------------------------------------------------------
-- Operator customer dossier
-- ---------------------------------------------------------------------------

insert into public.angelcare360_operator_clients (
  id,
  client_code,
  display_name,
  legal_name,
  client_type,
  city,
  country,
  address,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  status,
  lifecycle_stage,
  source,
  health_status,
  risk_level,
  notes
)
values (
  '00000000-0000-0000-0000-000000000201',
  'AC360-DEMO-PE-CASA',
  'École Les Petits Explorateurs Casablanca',
  'Les Petits Explorateurs Casablanca SARL',
  'Crèche & préscolaire',
  'Casablanca',
  'Maroc',
  'Quartier Gauthier, Casablanca',
  'Mme Salma Bennani',
  'salma.bennani.demo@angelcarehub.ma',
  '+212 600 000 101',
  'active',
  'live',
  'manual_demo',
  'watch',
  'low',
  'Demo account for internal simulation.'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  legal_name = excluded.legal_name,
  client_type = excluded.client_type,
  city = excluded.city,
  country = excluded.country,
  address = excluded.address,
  primary_contact_name = excluded.primary_contact_name,
  primary_contact_email = excluded.primary_contact_email,
  primary_contact_phone = excluded.primary_contact_phone,
  status = excluded.status,
  lifecycle_stage = excluded.lifecycle_stage,
  source = excluded.source,
  health_status = excluded.health_status,
  risk_level = excluded.risk_level,
  notes = excluded.notes;

insert into public.angelcare360_operator_tenants (
  id,
  client_id,
  tenant_slug,
  environment,
  status,
  provisioning_status,
  command_center_url,
  go_live_date
)
values (
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000201',
  'petits-explorateurs-casa-demo',
  'pilot',
  'active',
  'active',
  '/angelcare-360-command-center',
  '2026-07-01'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  environment = excluded.environment,
  status = excluded.status,
  provisioning_status = excluded.provisioning_status,
  command_center_url = excluded.command_center_url,
  go_live_date = excluded.go_live_date;

insert into public.angelcare360_operator_plans (
  id,
  plan_code,
  name,
  description,
  monthly_price_mad,
  annual_price_mad,
  billing_cycle,
  max_students,
  max_staff,
  max_users,
  max_sites,
  included_modules,
  included_features,
  support_level,
  status
)
values
  (
    '00000000-0000-0000-0000-000000000211',
    'AC360-START',
    'AC360 Start',
    'Entry plan for small crèches and preschools.',
    3900,
    39000,
    'monthly',
    50,
    10,
    10,
    1,
    '["admissions","people","attendance","communication","reports"]'::jsonb,
    '["online_payment_locked","whatsapp_locked","sms_locked"]'::jsonb,
    'standard',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000212',
    'AC360-GROWTH',
    'AC360 Growth',
    'Default growth plan used for the Casablanca demo tenant.',
    6900,
    69000,
    'monthly',
    100,
    25,
    20,
    2,
    '["admissions","people","attendance","academics","finance","transport","library","inventory","communication","reports","exports"]'::jsonb,
    '["pdf_a4","xlsx_locked","online_payment_locked","whatsapp_locked","sms_locked"]'::jsonb,
    'priority',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000213',
    'AC360-SIGNATURE',
    'AC360 Signature',
    'Full-suite plan for larger institutions.',
    9900,
    99000,
    'monthly',
    250,
    80,
    60,
    4,
    '["admissions","people","attendance","academics","finance","transport","library","inventory","communication","reports","exports"]'::jsonb,
    '["pdf_a4","xlsx","online_payment","whatsapp","sms"]'::jsonb,
    'premium',
    'active'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_mad = excluded.monthly_price_mad,
  annual_price_mad = excluded.annual_price_mad,
  billing_cycle = excluded.billing_cycle,
  max_students = excluded.max_students,
  max_staff = excluded.max_staff,
  max_users = excluded.max_users,
  max_sites = excluded.max_sites,
  included_modules = excluded.included_modules,
  included_features = excluded.included_features,
  support_level = excluded.support_level,
  status = excluded.status;

insert into public.angelcare360_operator_packages (
  id,
  package_code,
  name,
  description,
  module_keys,
  feature_keys,
  status
)
values
  (
    '00000000-0000-0000-0000-000000000221',
    'PACK-SCOLARITE',
    'Pack Scolarité',
    'Admissions, people, attendance, academics and school year basics.',
    '["admissions","people","attendance","academics"]'::jsonb,
    '["pdf_a4"]'::jsonb,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000222',
    'PACK-FINANCE-PAIEMENTS',
    'Pack Finance & Paiements',
    'School fees, invoices, receipts and reminders.',
    '["finance","paiements"]'::jsonb,
    '["online_payment_locked"]'::jsonb,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000223',
    'PACK-COMMUNICATION',
    'Pack Communication',
    'Messaging, notifications and claims management.',
    '["communication","notifications","reclamations"]'::jsonb,
    '["whatsapp_locked","sms_locked"]'::jsonb,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000224',
    'PACK-REPORTING',
    'Pack Reporting',
    'Reports, exports and generated documents.',
    '["reports","exports","documents"]'::jsonb,
    '["pdf_a4","xlsx_locked"]'::jsonb,
    'active'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  module_keys = excluded.module_keys,
  feature_keys = excluded.feature_keys,
  status = excluded.status;

insert into public.angelcare360_operator_subscriptions (
  id,
  client_id,
  tenant_id,
  plan_id,
  subscription_code,
  status,
  start_date,
  trial_ends_at,
  current_period_start,
  current_period_end,
  billing_cycle,
  billing_amount_mad,
  discount_amount_mad,
  cancellation_reason,
  suspended_reason
)
values (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  (select id from public.angelcare360_operator_plans where plan_code = 'AC360-GROWTH'),
  'SUB-AC360-DEMO-PE-CASA-001',
  'past_due',
  '2026-07-01',
  null,
  '2026-07-01',
  '2026-07-31',
  'monthly',
  6900,
  0,
  null,
  'Pending settlement for June overdue invoice.'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  plan_id = excluded.plan_id,
  status = excluded.status,
  start_date = excluded.start_date,
  trial_ends_at = excluded.trial_ends_at,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  billing_cycle = excluded.billing_cycle,
  billing_amount_mad = excluded.billing_amount_mad,
  discount_amount_mad = excluded.discount_amount_mad,
  cancellation_reason = excluded.cancellation_reason,
  suspended_reason = excluded.suspended_reason;

insert into public.angelcare360_operator_billing_accounts (
  id,
  client_id,
  billing_name,
  billing_email,
  billing_phone,
  billing_address,
  tax_identifier,
  payment_terms_days,
  status
)
values (
  '00000000-0000-0000-0000-000000000302',
  '00000000-0000-0000-0000-000000000201',
  'Les Petits Explorateurs Casablanca SARL',
  'billing.demo@angelcarehub.ma',
  '+212 600 000 101',
  'Quartier Gauthier, Casablanca, Maroc',
  'MA-DEMO-PE-CASA-001',
  7,
  'active'
)
on conflict (id) do update set
  billing_name = excluded.billing_name,
  billing_email = excluded.billing_email,
  billing_phone = excluded.billing_phone,
  billing_address = excluded.billing_address,
  tax_identifier = excluded.tax_identifier,
  payment_terms_days = excluded.payment_terms_days,
  status = excluded.status;

insert into public.angelcare360_operator_invoices (
  id,
  client_id,
  subscription_id,
  billing_account_id,
  invoice_number,
  issue_date,
  due_date,
  period_start,
  period_end,
  subtotal_mad,
  discount_mad,
  total_mad,
  amount_paid_mad,
  balance_due_mad,
  status,
  notes
)
values
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000302',
    'AC360-INV-DEMO-0001',
    '2026-05-15',
    '2026-05-22',
    '2026-05-01',
    '2026-05-31',
    6900,
    0,
    6900,
    6900,
    0,
    'paid',
    'Paid invoice for May 2026 subscription.'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000302',
    'AC360-INV-DEMO-0002',
    '2026-07-01',
    '2026-07-08',
    '2026-07-01',
    '2026-07-31',
    6900,
    0,
    6900,
    0,
    6900,
    'issued',
    'Current invoice awaiting settlement.'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000302',
    'AC360-INV-DEMO-0003',
    '2026-06-15',
    '2026-06-22',
    '2026-06-01',
    '2026-06-30',
    6900,
    0,
    6900,
    0,
    6900,
    'overdue',
    'Overdue invoice used for dunning simulation.'
  )
on conflict (id) do update set
  client_id = excluded.client_id,
  subscription_id = excluded.subscription_id,
  billing_account_id = excluded.billing_account_id,
  issue_date = excluded.issue_date,
  due_date = excluded.due_date,
  period_start = excluded.period_start,
  period_end = excluded.period_end,
  subtotal_mad = excluded.subtotal_mad,
  discount_mad = excluded.discount_mad,
  total_mad = excluded.total_mad,
  amount_paid_mad = excluded.amount_paid_mad,
  balance_due_mad = excluded.balance_due_mad,
  status = excluded.status,
  notes = excluded.notes;

insert into public.angelcare360_operator_payments (
  id,
  client_id,
  invoice_id,
  payment_reference,
  payment_date,
  amount_mad,
  method,
  status,
  received_by,
  notes
)
values
  (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000401',
    'PAY-AC360-DEMO-0001',
    '2026-05-18',
    6900,
    'bank_transfer',
    'confirmed',
    null,
    'Confirmed payment for invoice AC360-INV-DEMO-0001.'
  ),
  (
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000402',
    'PAY-AC360-DEMO-0002',
    '2026-07-03',
    6900,
    'bank_transfer',
    'pending',
    null,
    'Pending manual validation for current month payment.'
  )
on conflict (id) do update set
  client_id = excluded.client_id,
  invoice_id = excluded.invoice_id,
  payment_date = excluded.payment_date,
  amount_mad = excluded.amount_mad,
  method = excluded.method,
  status = excluded.status,
  received_by = excluded.received_by,
  notes = excluded.notes;

-- Active blocking payment gate for the overdue June invoice.
insert into public.angelcare360_operator_payment_gates (
  id,
  client_id,
  tenant_id,
  invoice_id,
  subscription_id,
  gate_code,
  status,
  amount_due_mad,
  currency,
  reason,
  due_date,
  blocking,
  provider_key,
  checkout_url,
  online_payment_reference,
  manual_processed_by,
  manual_processed_at,
  resolved_by,
  resolved_at,
  resolution_reason,
  created_by
)
values (
  '00000000-0000-0000-0000-000000000601',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000403',
  '00000000-0000-0000-0000-000000000301',
  'AC360-GATE-DEMO-PE-CASA-0001',
  'active',
  6900,
  'MAD',
  'Facture SaaS AngelCare 360 en attente de règlement.',
  '2026-06-22',
  true,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null
)
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  invoice_id = excluded.invoice_id,
  subscription_id = excluded.subscription_id,
  status = excluded.status,
  amount_due_mad = excluded.amount_due_mad,
  currency = excluded.currency,
  reason = excluded.reason,
  due_date = excluded.due_date,
  blocking = excluded.blocking,
  provider_key = excluded.provider_key,
  checkout_url = excluded.checkout_url,
  online_payment_reference = excluded.online_payment_reference,
  manual_processed_by = excluded.manual_processed_by,
  manual_processed_at = excluded.manual_processed_at,
  resolved_by = excluded.resolved_by,
  resolved_at = excluded.resolved_at,
  resolution_reason = excluded.resolution_reason,
  created_by = excluded.created_by,
  updated_at = now();

insert into public.angelcare360_operator_dunning_actions (
  id,
  client_id,
  invoice_id,
  action_type,
  status,
  due_date,
  notes
)
values (
  '00000000-0000-0000-0000-000000000503',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000403',
  'email_reminder',
  'planned',
  '2026-07-10',
  'Planned reminder for overdue subscription invoice.'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  invoice_id = excluded.invoice_id,
  action_type = excluded.action_type,
  status = excluded.status,
  due_date = excluded.due_date,
  notes = excluded.notes;

insert into public.angelcare360_operator_onboarding_tasks (
  id,
  client_id,
  tenant_id,
  title,
  description,
  status,
  priority,
  due_date,
  completed_at
)
values
  (
    '00000000-0000-0000-0000-000000000511',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Collect school logo and branding',
    'Done: brand assets uploaded for the demo tenant.',
    'done',
    'normal',
    '2026-07-02',
    '2026-07-02T09:15:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000512',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Verify billing contact',
    'In progress: confirm billing email and terms with the school.',
    'in_progress',
    'high',
    '2026-07-09',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000513',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Validate payment gateway provisioning',
    'Blocked pending operator payment-gate table / overlay schema.',
    'blocked',
    'urgent',
    '2026-07-09',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000514',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Publish customer onboarding pack',
    'Todo: prepare customer-facing quick start checklist.',
    'todo',
    'normal',
    '2026-07-11',
    null
  )
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  priority = excluded.priority,
  due_date = excluded.due_date,
  completed_at = excluded.completed_at;

insert into public.angelcare360_operator_support_tickets (
  id,
  client_id,
  tenant_id,
  subject,
  description,
  category,
  priority,
  status,
  assigned_to,
  resolution_summary,
  resolved_at
)
values
  (
    '00000000-0000-0000-0000-000000000521',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Welcome email not received',
    'The school did not receive the initial onboarding email.',
    'onboarding',
    'normal',
    'resolved',
    null,
    'Re-sent the onboarding pack and confirmed delivery.',
    '2026-07-04T11:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000522',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Invoice PDF layout question',
    'School asked how to print invoices to A4.',
    'billing',
    'low',
    'new',
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000523',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'Payment confirmation review urgent',
    'School needs a manual payment validation for the overdue invoice.',
    'billing',
    'urgent',
    'assigned',
    null,
    null,
    null
  )
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  subject = excluded.subject,
  description = excluded.description,
  category = excluded.category,
  priority = excluded.priority,
  status = excluded.status,
  assigned_to = excluded.assigned_to,
  resolution_summary = excluded.resolution_summary,
  resolved_at = excluded.resolved_at;

insert into public.angelcare360_operator_contracts (
  id,
  client_id,
  subscription_id,
  contract_code,
  status,
  start_date,
  end_date,
  renewal_date,
  signed_at,
  document_url,
  notes
)
values (
  '00000000-0000-0000-0000-000000000531',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  'CTR-AC360-DEMO-PE-CASA-001',
  'active',
  '2026-07-01',
  '2027-06-30',
  '2027-06-01',
  '2026-07-01T10:00:00Z',
  null,
  'Active contract metadata for the demo tenant.'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  subscription_id = excluded.subscription_id,
  status = excluded.status,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  renewal_date = excluded.renewal_date,
  signed_at = excluded.signed_at,
  document_url = excluded.document_url,
  notes = excluded.notes;

insert into public.angelcare360_operator_renewals (
  id,
  client_id,
  subscription_id,
  renewal_date,
  status,
  probability,
  expected_amount_mad,
  notes
)
values (
  '00000000-0000-0000-0000-000000000541',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  '2027-05-15',
  'upcoming',
  70,
  82800,
  'Renewal forecast for the Casablanca demo school.'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  subscription_id = excluded.subscription_id,
  renewal_date = excluded.renewal_date,
  status = excluded.status,
  probability = excluded.probability,
  expected_amount_mad = excluded.expected_amount_mad,
  notes = excluded.notes;

insert into public.angelcare360_operator_service_requests (
  id,
  client_id,
  tenant_id,
  request_type,
  title,
  description,
  priority,
  status,
  due_date
)
values (
  '00000000-0000-0000-0000-000000000551',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  'billing_follow_up',
  'Need invoice copy with A4 export',
  'School requested a clean printable invoice and an emailed copy for the billing contact.',
  'normal',
  'new',
  '2026-07-10'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  request_type = excluded.request_type,
  title = excluded.title,
  description = excluded.description,
  priority = excluded.priority,
  status = excluded.status,
  due_date = excluded.due_date;

insert into public.angelcare360_operator_incidents (
  id,
  client_id,
  tenant_id,
  severity,
  status,
  title,
  description,
  started_at,
  resolved_at
)
values (
  '00000000-0000-0000-0000-000000000552',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  'medium',
  'open',
  'Temporary delay in invoice reminder workflow',
  'Reminder routing is delayed while the payment-gate schema remains unavailable.',
  '2026-07-08T08:30:00Z',
  null
)
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  severity = excluded.severity,
  status = excluded.status,
  title = excluded.title,
  description = excluded.description,
  started_at = excluded.started_at,
  resolved_at = excluded.resolved_at;

insert into public.angelcare360_operator_tasks (
  id,
  client_id,
  tenant_id,
  title,
  description,
  status,
  priority,
  due_date,
  completed_at
)
values (
  '00000000-0000-0000-0000-000000000553',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  'Confirm invoice email recipient',
  'Check that billing.demo@angelcarehub.ma receives the current invoice copy.',
  'todo',
  'high',
  '2026-07-10',
  null
)
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  priority = excluded.priority,
  due_date = excluded.due_date,
  completed_at = excluded.completed_at;

insert into public.angelcare360_operator_notes (
  id,
  client_id,
  tenant_id,
  author_id,
  note_type,
  body,
  visibility
)
values (
  '00000000-0000-0000-0000-000000000554',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  null,
  'internal_note',
  'Demo tenant prepared for operator / command-center end-to-end simulation.',
  'internal'
)
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  author_id = excluded.author_id,
  note_type = excluded.note_type,
  body = excluded.body,
  visibility = excluded.visibility;

insert into public.angelcare360_operator_service_events (
  id,
  client_id,
  tenant_id,
  event_type,
  severity,
  title,
  description,
  status,
  occurred_at
)
values
  (
    '00000000-0000-0000-0000-000000000561',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'tenant.provisioned',
    'info',
    'Tenant provisioning completed',
    'The Casablanca demo tenant is active and ready.',
    'resolved',
    '2026-07-01T09:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000562',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'billing.overdue',
    'medium',
    'Overdue invoice requires follow-up',
    'Invoice AC360-INV-DEMO-0003 is overdue and needs manual handling.',
    'watching',
    '2026-07-08T10:20:00Z'
  )
on conflict (id) do update set
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  event_type = excluded.event_type,
  severity = excluded.severity,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  occurred_at = excluded.occurred_at;

insert into public.angelcare360_operator_audit_logs (
  id,
  actor_user_id,
  actor_role,
  client_id,
  tenant_id,
  module,
  action,
  entity_type,
  entity_id,
  severity,
  before_data,
  after_data,
  metadata
)
values
  (
    '00000000-0000-0000-0000-000000000571',
    null,
    'operator_admin',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'clients',
    'client.created',
    'angelcare360_operator_clients',
    '00000000-0000-0000-0000-000000000201',
    'notice',
    '{}'::jsonb,
    '{"client_code":"AC360-DEMO-PE-CASA","status":"active"}'::jsonb,
    '{"demo":true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000572',
    null,
    'finance_operator',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'billing',
    'subscription.activated',
    'angelcare360_operator_subscriptions',
    '00000000-0000-0000-0000-000000000301',
    'notice',
    '{}'::jsonb,
    '{"subscription_code":"SUB-AC360-DEMO-PE-CASA-001","status":"past_due"}'::jsonb,
    '{"demo":true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000573',
    null,
    'finance_operator',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'billing',
    'invoice.issued',
    'angelcare360_operator_invoices',
    '00000000-0000-0000-0000-000000000402',
    'notice',
    '{}'::jsonb,
    '{"invoice_number":"AC360-INV-DEMO-0002","status":"issued"}'::jsonb,
    '{"demo":true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000574',
    null,
    'operator_admin',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'features',
    'feature.enabled',
    'angelcare360_operator_feature_flags',
    '00000000-0000-0000-0000-000000000000',
    'notice',
    '{}'::jsonb,
    '{"feature":"admissions","enabled":true}'::jsonb,
    '{"demo":true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000575',
    null,
    'finance_operator',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'email',
    'email.attempted',
    'angelcare360_operator_invoices',
    '00000000-0000-0000-0000-000000000403',
    'notice',
    '{}'::jsonb,
    '{"invoice_number":"AC360-INV-DEMO-0003","email":"billing.demo@angelcarehub.ma"}'::jsonb,
    '{"demo":true,"email_status":"ready"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000576',
    null,
    'finance_operator',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'billing',
    'payment_gate.created',
    'angelcare360_operator_payment_gates',
    '00000000-0000-0000-0000-000000000601',
    'notice',
    '{}'::jsonb,
    '{"gate_code":"AC360-GATE-DEMO-PE-CASA-0001","status":"active","blocking":true,"amount_due_mad":6900,"currency":"MAD"}'::jsonb,
    '{"demo":true,"seeded":true}'::jsonb
  )
on conflict (id) do update set
  actor_user_id = excluded.actor_user_id,
  actor_role = excluded.actor_role,
  client_id = excluded.client_id,
  tenant_id = excluded.tenant_id,
  module = excluded.module,
  action = excluded.action,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  severity = excluded.severity,
  before_data = excluded.before_data,
  after_data = excluded.after_data,
  metadata = excluded.metadata;

insert into public.angelcare360_operator_feature_flags (
  id,
  client_id,
  tenant_id,
  feature_key,
  feature_label,
  module_key,
  status,
  enabled,
  locked_reason,
  scheduled_for,
  activated_at,
  activated_by
)
values
  (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'admissions',
    'Admissions',
    'admissions',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'people',
    'People',
    'people',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000603',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'attendance',
    'Attendance',
    'attendance',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000604',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'academics',
    'Academics',
    'academics',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000605',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'finance',
    'Finance',
    'finance',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000606',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'transport',
    'Transport',
    'transport',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000607',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'library',
    'Library',
    'library',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000608',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'inventory',
    'Inventory',
    'inventory',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000609',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'communication',
    'Communication',
    'messaging',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-00000000060a',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'reports',
    'Reports',
    'reports',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-00000000060b',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'exports',
    'Exports',
    'exports',
    'enabled',
    true,
    null,
    null,
    '2026-07-01T09:00:00Z',
    null
  ),
  (
    '00000000-0000-0000-0000-00000000060c',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'xlsx_export',
    'XLSX export',
    'exports',
    'locked',
    false,
    'XLSX export is locked until the export engine is enabled.',
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-00000000060d',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'online_payment',
    'Online payment',
    'finance',
    'locked',
    false,
    'Online payment is locked until a provider is configured.',
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-00000000060e',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'whatsapp',
    'WhatsApp',
    'communication',
    'locked',
    false,
    'WhatsApp is locked until an official provider is configured.',
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-00000000060f',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'sms',
    'SMS',
    'communication',
    'locked',
    false,
    'SMS is locked until an SMS gateway is configured.',
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000610',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'pdf_a4',
    'PDF/A4',
    'documents',
    'enabled',
    true,
    null,
    '2026-07-01',
    '2026-07-01T09:00:00Z',
    null
  )
on conflict (id) do update set
  feature_label = excluded.feature_label,
  module_key = excluded.module_key,
  status = excluded.status,
  enabled = excluded.enabled,
  locked_reason = excluded.locked_reason,
  scheduled_for = excluded.scheduled_for,
  activated_at = excluded.activated_at,
  activated_by = excluded.activated_by;

insert into public.angelcare360_operator_usage_limits (
  id,
  client_id,
  tenant_id,
  limit_key,
  label,
  allowed_value,
  current_value,
  unit,
  status,
  reset_cycle
)
values
  (
    '00000000-0000-0000-0000-000000000621',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'max_students',
    'Maximum students',
    100,
    16,
    'students',
    'active',
    'monthly'
  ),
  (
    '00000000-0000-0000-0000-000000000622',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'max_staff',
    'Maximum staff',
    25,
    6,
    'staff',
    'active',
    'monthly'
  ),
  (
    '00000000-0000-0000-0000-000000000623',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'max_sites',
    'Maximum sites',
    2,
    1,
    'sites',
    'active',
    'monthly'
  ),
  (
    '00000000-0000-0000-0000-000000000624',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'max_users',
    'Maximum users',
    20,
    8,
    'users',
    'active',
    'monthly'
  ),
  (
    '00000000-0000-0000-0000-000000000625',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'exports_per_month',
    'Exports per month',
    200,
    12,
    'exports',
    'active',
    'monthly'
  ),
  (
    '00000000-0000-0000-0000-000000000626',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    'emails_per_month',
    'Emails per month',
    500,
    14,
    'emails',
    'active',
    'monthly'
  )
on conflict (id) do update set
  label = excluded.label,
  allowed_value = excluded.allowed_value,
  current_value = excluded.current_value,
  unit = excluded.unit,
  status = excluded.status,
  reset_cycle = excluded.reset_cycle;

-- The remaining customer-side school data is added below in a follow-up patch block.

-- ---------------------------------------------------------------------------
-- Customer school structure, people, admissions, attendance and academics
-- ---------------------------------------------------------------------------

insert into public.angelcare360_classes (
  id,
  school_id,
  academic_year_id,
  class_code,
  name,
  level,
  capacity,
  order_index,
  status,
  metadata_json
)
select
  md5(s.id::text || ':' || y.year_code || ':' || c.class_code)::uuid,
  s.id,
  y.id,
  c.class_code,
  c.name,
  c.level,
  c.capacity,
  c.order_index,
  'active',
  c.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join (
  values
    ('DEMO-PS-A', 'Petite Section A', 'petite_section', 8, 1, '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb),
    ('DEMO-MS-A', 'Moyenne Section A', 'moyenne_section', 8, 2, '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb),
    ('DEMO-GS-A', 'Grande Section A', 'grande_section', 8, 3, '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb),
    ('DEMO-PREP-A', 'Préparatoire A', 'preparatoire', 8, 4, '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb)
) as c(class_code, name, level, capacity, order_index, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  name = excluded.name,
  level = excluded.level,
  capacity = excluded.capacity,
  order_index = excluded.order_index,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_sections (
  id,
  school_id,
  academic_year_id,
  class_id,
  section_code,
  name,
  capacity,
  room,
  status,
  metadata_json
)
select
  md5(cls.id::text || ':' || sec.section_code)::uuid,
  s.id,
  y.id,
  cls.id,
  sec.section_code,
  sec.name,
  sec.capacity,
  sec.room,
  'active',
  sec.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = y.id
join (
  values
    ('DEMO-PS-A', 'DEMO-SEC-PS-A', 'Petite Section A', 8, 'Salle 101', '{"demo":true,"class_code":"DEMO-PS-A"}'::jsonb),
    ('DEMO-MS-A', 'DEMO-SEC-MS-A', 'Moyenne Section A', 8, 'Salle 102', '{"demo":true,"class_code":"DEMO-MS-A"}'::jsonb),
    ('DEMO-GS-A', 'DEMO-SEC-GS-A', 'Grande Section A', 8, 'Salle 103', '{"demo":true,"class_code":"DEMO-GS-A"}'::jsonb),
    ('DEMO-PREP-A', 'DEMO-SEC-PREP-A', 'Préparatoire A', 8, 'Salle 104', '{"demo":true,"class_code":"DEMO-PREP-A"}'::jsonb)
) as sec(class_code, section_code, name, capacity, room, metadata_json) on sec.class_code = cls.class_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  name = excluded.name,
  capacity = excluded.capacity,
  room = excluded.room,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_subjects (
  id,
  school_id,
  subject_code,
  name,
  short_name,
  department,
  credit_hours,
  status,
  metadata_json
)
values
  (
    md5('AC360-DEMO-PE-CASA-SCHOOL:DEMO-SUB-LANGAGE')::uuid,
    (select id from public.angelcare360_schools where school_code = 'AC360-DEMO-PE-CASA-SCHOOL'),
    'DEMO-SUB-LANGAGE',
    'Langage',
    'Langage',
    'Pédagogie',
    3,
    'active',
    '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
  ),
  (
    md5('AC360-DEMO-PE-CASA-SCHOOL:DEMO-SUB-MATH')::uuid,
    (select id from public.angelcare360_schools where school_code = 'AC360-DEMO-PE-CASA-SCHOOL'),
    'DEMO-SUB-MATH',
    'Mathématiques',
    'Maths',
    'Pédagogie',
    3,
    'active',
    '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
  ),
  (
    md5('AC360-DEMO-PE-CASA-SCHOOL:DEMO-SUB-EVEIL')::uuid,
    (select id from public.angelcare360_schools where school_code = 'AC360-DEMO-PE-CASA-SCHOOL'),
    'DEMO-SUB-EVEIL',
    'Éveil scientifique',
    'Éveil',
    'Pédagogie',
    2,
    'active',
    '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
  ),
  (
    md5('AC360-DEMO-PE-CASA-SCHOOL:DEMO-SUB-ARTS')::uuid,
    (select id from public.angelcare360_schools where school_code = 'AC360-DEMO-PE-CASA-SCHOOL'),
    'DEMO-SUB-ARTS',
    'Arts plastiques',
    'Arts',
    'Pédagogie',
    2,
    'active',
    '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
  ),
  (
    md5('AC360-DEMO-PE-CASA-SCHOOL:DEMO-SUB-MOTRICITE')::uuid,
    (select id from public.angelcare360_schools where school_code = 'AC360-DEMO-PE-CASA-SCHOOL'),
    'DEMO-SUB-MOTRICITE',
    'Motricité',
    'Motricité',
    'Pédagogie',
    2,
    'active',
    '{"demo":true,"tenant_slug":"petits-explorateurs-casa-demo"}'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  department = excluded.department,
  credit_hours = excluded.credit_hours,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_staff (
  id,
  school_id,
  staff_code,
  staff_type,
  first_name,
  last_name,
  full_name,
  email,
  phone,
  hire_date,
  department,
  status,
  metadata_json
)
select
  md5(st.staff_code)::uuid,
  s.id,
  st.staff_code,
  st.staff_type,
  st.first_name,
  st.last_name,
  st.full_name,
  st.email,
  st.phone,
  st.hire_date::date,
  st.department,
  'active',
  st.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-STF-001', 'direction', 'Fatima Zahra', 'Ait Ali', 'Fatima Zahra Ait Ali', 'fatima.zahra@petits-explorateurs-casa.demo', '+212 600 100 001', '2024-09-01', 'Direction', '{"demo":true,"role":"director"}'::jsonb),
    ('DEMO-STF-002', 'enseignant', 'Amina', 'El Fassi', 'Amina El Fassi', 'amina.el-fassi@petits-explorateurs-casa.demo', '+212 600 100 002', '2024-09-01', 'Pédagogie', '{"demo":true,"transport_coordinator":true}'::jsonb),
    ('DEMO-STF-003', 'enseignant', 'Hicham', 'El Idrissi', 'Hicham El Idrissi', 'hicham.el-idrissi@petits-explorateurs-casa.demo', '+212 600 100 003', '2024-09-01', 'Pédagogie', '{"demo":true}'::jsonb),
    ('DEMO-STF-004', 'enseignant', 'Sara', 'Benjelloun', 'Sara Benjelloun', 'sara.benjelloun@petits-explorateurs-casa.demo', '+212 600 100 004', '2024-09-01', 'Pédagogie', '{"demo":true}'::jsonb),
    ('DEMO-STF-005', 'enseignant', 'Rachid', 'Bekkali', 'Rachid Bekkali', 'rachid.bekkali@petits-explorateurs-casa.demo', '+212 600 100 005', '2024-09-01', 'Pédagogie', '{"demo":true}'::jsonb),
    ('DEMO-STF-006', 'comptabilite', 'Nadia', 'El Mansouri', 'Nadia El Mansouri', 'nadia.el-mansouri@petits-explorateurs-casa.demo', '+212 600 100 006', '2024-09-01', 'Finance', '{"demo":true}'::jsonb)
) as st(staff_code, staff_type, first_name, last_name, full_name, email, phone, hire_date, department, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  staff_type = excluded.staff_type,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  hire_date = excluded.hire_date,
  department = excluded.department,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_parents (
  id,
  school_id,
  parent_code,
  first_name,
  last_name,
  full_name,
  email,
  phone,
  whatsapp,
  occupation,
  address,
  preferred_language,
  status,
  metadata_json
)
select
  md5(p.parent_code)::uuid,
  s.id,
  p.parent_code,
  p.first_name,
  p.last_name,
  p.full_name,
  p.email,
  p.phone,
  p.whatsapp,
  p.occupation,
  p.address,
  'fr',
  'active',
  p.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-PAR-001', 'Salma', 'Bennani', 'Salma Bennani', 'salma.bennani@petits-explorateurs-casa.demo', '+212 600 200 001', '+212 600 200 001', 'Médecin', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-01"}'::jsonb),
    ('DEMO-PAR-002', 'Mehdi', 'El Idrissi', 'Mehdi El Idrissi', 'mehdi.el-idrissi@petits-explorateurs-casa.demo', '+212 600 200 002', '+212 600 200 002', 'Ingénieur', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-02"}'::jsonb),
    ('DEMO-PAR-003', 'Karima', 'Berrada', 'Karima Berrada', 'karima.berrada@petits-explorateurs-casa.demo', '+212 600 200 003', '+212 600 200 003', 'Architecte', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-03"}'::jsonb),
    ('DEMO-PAR-004', 'Yassine', 'El Amrani', 'Yassine El Amrani', 'yassine.el-amrani@petits-explorateurs-casa.demo', '+212 600 200 004', '+212 600 200 004', 'Entrepreneur', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-04"}'::jsonb),
    ('DEMO-PAR-005', 'Nadia', 'Tazi', 'Nadia Tazi', 'nadia.tazi@petits-explorateurs-casa.demo', '+212 600 200 005', '+212 600 200 005', 'Pharmacienne', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-05"}'::jsonb),
    ('DEMO-PAR-006', 'Hamza', 'Alaoui', 'Hamza Alaoui', 'hamza.alaoui@petits-explorateurs-casa.demo', '+212 600 200 006', '+212 600 200 006', 'Commerçant', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-06"}'::jsonb),
    ('DEMO-PAR-007', 'Mouna', 'Chraibi', 'Mouna Chraibi', 'mouna.chraibi@petits-explorateurs-casa.demo', '+212 600 200 007', '+212 600 200 007', 'Consultante', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-07"}'::jsonb),
    ('DEMO-PAR-008', 'Hassan', 'Fassi', 'Hassan Fassi', 'hassan.fassi@petits-explorateurs-casa.demo', '+212 600 200 008', '+212 600 200 008', 'Cadre', 'Casablanca', '{"demo":true,"family_code":"DEMO-FAM-08"}'::jsonb)
) as p(parent_code, first_name, last_name, full_name, email, phone, whatsapp, occupation, address, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  occupation = excluded.occupation,
  address = excluded.address,
  preferred_language = excluded.preferred_language,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_students (
  id,
  school_id,
  student_code,
  first_name,
  last_name,
  full_name,
  gender,
  date_of_birth,
  national_id,
  current_class_id,
  current_section_id,
  admission_status,
  status,
  admission_date,
  transport_required,
  metadata_json
)
select
  md5(st.student_code)::uuid,
  s.id,
  st.student_code,
  st.first_name,
  st.last_name,
  st.full_name,
  st.gender,
  st.date_of_birth::date,
  st.national_id,
  cls.id,
  sec.id,
  'enrolled',
  'active',
  '2026-07-01'::date,
  st.transport_required,
  st.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-STU-001', 'Adam', 'El Mansouri', 'Adam El Mansouri', 'M', '2021-09-12', null, 'DEMO-PS-A', 'DEMO-SEC-PS-A', false, '{"demo":true,"family_code":"DEMO-FAM-01"}'::jsonb),
    ('DEMO-STU-002', 'Lina', 'Benjelloun', 'Lina Benjelloun', 'F', '2021-11-03', null, 'DEMO-PS-A', 'DEMO-SEC-PS-A', false, '{"demo":true,"family_code":"DEMO-FAM-01"}'::jsonb),
    ('DEMO-STU-003', 'Youssef', 'Berrada', 'Youssef Berrada', 'M', '2021-05-22', null, 'DEMO-PS-A', 'DEMO-SEC-PS-A', false, '{"demo":true,"family_code":"DEMO-FAM-02"}'::jsonb),
    ('DEMO-STU-004', 'Aya', 'El Amrani', 'Aya El Amrani', 'F', '2021-07-18', null, 'DEMO-PS-A', 'DEMO-SEC-PS-A', false, '{"demo":true,"family_code":"DEMO-FAM-02"}'::jsonb),
    ('DEMO-STU-005', 'Salma', 'Tazi', 'Salma Tazi', 'F', '2020-09-28', null, 'DEMO-MS-A', 'DEMO-SEC-MS-A', false, '{"demo":true,"family_code":"DEMO-FAM-03"}'::jsonb),
    ('DEMO-STU-006', 'Sami', 'Alaoui', 'Sami Alaoui', 'M', '2020-11-14', null, 'DEMO-MS-A', 'DEMO-SEC-MS-A', false, '{"demo":true,"family_code":"DEMO-FAM-03"}'::jsonb),
    ('DEMO-STU-007', 'Inès', 'Bennani', 'Inès Bennani', 'F', '2020-03-09', null, 'DEMO-MS-A', 'DEMO-SEC-MS-A', false, '{"demo":true,"family_code":"DEMO-FAM-04"}'::jsonb),
    ('DEMO-STU-008', 'Yanis', 'Chraibi', 'Yanis Chraibi', 'M', '2020-08-25', null, 'DEMO-MS-A', 'DEMO-SEC-MS-A', false, '{"demo":true,"family_code":"DEMO-FAM-04"}'::jsonb),
    ('DEMO-STU-009', 'Nour', 'El Fassi', 'Nour El Fassi', 'F', '2019-10-06', null, 'DEMO-GS-A', 'DEMO-SEC-GS-A', false, '{"demo":true,"family_code":"DEMO-FAM-05"}'::jsonb),
    ('DEMO-STU-010', 'Rayan', 'Haddad', 'Rayan Haddad', 'M', '2019-12-20', null, 'DEMO-GS-A', 'DEMO-SEC-GS-A', true, '{"demo":true,"family_code":"DEMO-FAM-05"}'::jsonb),
    ('DEMO-STU-011', 'Malak', 'Idrissi', 'Malak Idrissi', 'F', '2019-04-15', null, 'DEMO-GS-A', 'DEMO-SEC-GS-A', false, '{"demo":true,"family_code":"DEMO-FAM-06"}'::jsonb),
    ('DEMO-STU-012', 'Sofia', 'Lamrani', 'Sofia Lamrani', 'F', '2019-06-11', null, 'DEMO-GS-A', 'DEMO-SEC-GS-A', false, '{"demo":true,"family_code":"DEMO-FAM-06"}'::jsonb),
    ('DEMO-STU-013', 'Meryem', 'Oulhaj', 'Meryem Oulhaj', 'F', '2018-05-01', null, 'DEMO-PREP-A', 'DEMO-SEC-PREP-A', true, '{"demo":true,"family_code":"DEMO-FAM-07"}'::jsonb),
    ('DEMO-STU-014', 'Zakaria', 'Benkirane', 'Zakaria Benkirane', 'M', '2018-07-17', null, 'DEMO-PREP-A', 'DEMO-SEC-PREP-A', true, '{"demo":true,"family_code":"DEMO-FAM-07"}'::jsonb),
    ('DEMO-STU-015', 'Imane', 'Ait Lahcen', 'Imane Ait Lahcen', 'F', '2018-09-23', null, 'DEMO-PREP-A', 'DEMO-SEC-PREP-A', true, '{"demo":true,"family_code":"DEMO-FAM-08"}'::jsonb),
    ('DEMO-STU-016', 'Othmane', 'El Idrissi', 'Othmane El Idrissi', 'M', '2018-02-08', null, 'DEMO-PREP-A', 'DEMO-SEC-PREP-A', true, '{"demo":true,"family_code":"DEMO-FAM-08"}'::jsonb)
) as st(student_code, first_name, last_name, full_name, gender, date_of_birth, national_id, class_code, section_code, transport_required, metadata_json) on true
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = (select id from public.angelcare360_academic_years where school_id = s.id and year_code = '2026-2027') and cls.class_code = st.class_code
join public.angelcare360_sections sec on sec.class_id = cls.id and sec.section_code = st.section_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  full_name = excluded.full_name,
  gender = excluded.gender,
  date_of_birth = excluded.date_of_birth,
  national_id = excluded.national_id,
  current_class_id = excluded.current_class_id,
  current_section_id = excluded.current_section_id,
  admission_status = excluded.admission_status,
  status = excluded.status,
  admission_date = excluded.admission_date,
  transport_required = excluded.transport_required,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_student_parent_links (
  id,
  school_id,
  student_id,
  parent_id,
  relationship_type,
  is_primary,
  is_guardian,
  can_pickup,
  can_receive_messages,
  can_pay_fees,
  status,
  metadata_json
)
select
  md5(stu.student_code || ':' || par.parent_code)::uuid,
  s.id,
  stu.id,
  par.id,
  case
    when right(stu.student_code, 3) in ('001', '003', '005', '007', '009', '011', '013', '015') then 'père'
    else 'mère'
  end,
  true,
  true,
  true,
  true,
  true,
  'active',
  jsonb_build_object('demo', true, 'family_code', stu.metadata_json->>'family_code')
from public.angelcare360_schools s
join public.angelcare360_students stu on stu.school_id = s.id
join public.angelcare360_parents par on par.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (stu.student_code = 'DEMO-STU-001' and par.parent_code = 'DEMO-PAR-001')
    or (stu.student_code = 'DEMO-STU-002' and par.parent_code = 'DEMO-PAR-001')
    or (stu.student_code = 'DEMO-STU-003' and par.parent_code = 'DEMO-PAR-002')
    or (stu.student_code = 'DEMO-STU-004' and par.parent_code = 'DEMO-PAR-002')
    or (stu.student_code = 'DEMO-STU-005' and par.parent_code = 'DEMO-PAR-003')
    or (stu.student_code = 'DEMO-STU-006' and par.parent_code = 'DEMO-PAR-003')
    or (stu.student_code = 'DEMO-STU-007' and par.parent_code = 'DEMO-PAR-004')
    or (stu.student_code = 'DEMO-STU-008' and par.parent_code = 'DEMO-PAR-004')
    or (stu.student_code = 'DEMO-STU-009' and par.parent_code = 'DEMO-PAR-005')
    or (stu.student_code = 'DEMO-STU-010' and par.parent_code = 'DEMO-PAR-005')
    or (stu.student_code = 'DEMO-STU-011' and par.parent_code = 'DEMO-PAR-006')
    or (stu.student_code = 'DEMO-STU-012' and par.parent_code = 'DEMO-PAR-006')
    or (stu.student_code = 'DEMO-STU-013' and par.parent_code = 'DEMO-PAR-007')
    or (stu.student_code = 'DEMO-STU-014' and par.parent_code = 'DEMO-PAR-007')
    or (stu.student_code = 'DEMO-STU-015' and par.parent_code = 'DEMO-PAR-008')
    or (stu.student_code = 'DEMO-STU-016' and par.parent_code = 'DEMO-PAR-008')
  )
on conflict (id) do update set
  relationship_type = excluded.relationship_type,
  is_primary = excluded.is_primary,
  is_guardian = excluded.is_guardian,
  can_pickup = excluded.can_pickup,
  can_receive_messages = excluded.can_receive_messages,
  can_pay_fees = excluded.can_pay_fees,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_emergency_contacts (
  id,
  school_id,
  contactable_type,
  contactable_id,
  contact_name,
  relationship_type,
  phone,
  email,
  priority,
  status,
  metadata_json
)
select
  ec.id::uuid,
  s.id,
  ec.contactable_type,
  stu.id,
  ec.contact_name,
  ec.relationship_type,
  ec.phone,
  ec.email,
  ec.priority::integer,
  'active',
  ec.metadata_json
from public.angelcare360_schools s
join (
  values
    ('00000000-0000-0000-0000-000000000701', 'student', 'DEMO-STU-001', 'M. Omar El Mansouri', 'oncle', '+212 600 300 001', 'omar.demo@petits-explorateurs-casa.demo', 1, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000702', 'student', 'DEMO-STU-005', 'Mme Khadija Tazi', 'grand-mère', '+212 600 300 002', 'khadija.demo@petits-explorateurs-casa.demo', 1, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000703', 'student', 'DEMO-STU-009', 'M. Saad El Fassi', 'père', '+212 600 300 003', 'saad.demo@petits-explorateurs-casa.demo', 1, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000704', 'student', 'DEMO-STU-013', 'Mme Yasmine Oulhaj', 'mère', '+212 600 300 004', 'yasmine.demo@petits-explorateurs-casa.demo', 1, '{"demo":true}'::jsonb)
) as ec(id, contactable_type, student_code, contact_name, relationship_type, phone, email, priority, metadata_json) on true
join public.angelcare360_students stu on stu.school_id = s.id and stu.student_code = ec.student_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  school_id = excluded.school_id,
  contactable_type = excluded.contactable_type,
  contactable_id = excluded.contactable_id,
  contact_name = excluded.contact_name,
  relationship_type = excluded.relationship_type,
  phone = excluded.phone,
  email = excluded.email,
  priority = excluded.priority,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_class_subjects (
  id,
  school_id,
  academic_year_id,
  class_id,
  subject_id,
  teacher_id,
  coefficient,
  is_required,
  status,
  metadata_json
)
select
  md5(cls.class_code || ':' || sub.subject_code || ':' || y.year_code)::uuid,
  s.id,
  y.id,
  cls.id,
  sub.id,
  st.id,
  1,
  true,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = y.id
join public.angelcare360_subjects sub on sub.school_id = s.id and sub.subject_code in ('DEMO-SUB-LANGAGE','DEMO-SUB-MATH','DEMO-SUB-EVEIL','DEMO-SUB-ARTS')
join public.angelcare360_staff st on st.school_id = s.id and st.staff_code in ('DEMO-STF-002','DEMO-STF-003','DEMO-STF-004','DEMO-STF-005')
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (cls.class_code = 'DEMO-PS-A' and sub.subject_code = 'DEMO-SUB-LANGAGE' and st.staff_code = 'DEMO-STF-002')
    or (cls.class_code = 'DEMO-MS-A' and sub.subject_code = 'DEMO-SUB-MATH' and st.staff_code = 'DEMO-STF-003')
    or (cls.class_code = 'DEMO-GS-A' and sub.subject_code = 'DEMO-SUB-EVEIL' and st.staff_code = 'DEMO-STF-004')
    or (cls.class_code = 'DEMO-PREP-A' and sub.subject_code = 'DEMO-SUB-ARTS' and st.staff_code = 'DEMO-STF-005')
  )
on conflict (id) do update set
  teacher_id = excluded.teacher_id,
  coefficient = excluded.coefficient,
  is_required = excluded.is_required,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_staff_assignments (
  id,
  school_id,
  academic_year_id,
  staff_id,
  class_id,
  section_id,
  subject_id,
  assignment_type,
  assigned_from,
  assigned_to,
  status,
  metadata_json
)
select
  md5(st.staff_code || ':' || y.year_code || ':' || cls.class_code || ':' || sub.subject_code)::uuid,
  s.id,
  y.id,
  st.id,
  cls.id,
  sec.id,
  sub.id,
  'teaching',
  '2026-07-01',
  null,
  'active',
  jsonb_build_object('demo', true, 'homeroom', true)
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = y.id
join public.angelcare360_sections sec on sec.class_id = cls.id
join public.angelcare360_subjects sub on sub.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (cls.class_code = 'DEMO-PS-A' and st.staff_code = 'DEMO-STF-002' and sub.subject_code = 'DEMO-SUB-LANGAGE')
    or (cls.class_code = 'DEMO-MS-A' and st.staff_code = 'DEMO-STF-003' and sub.subject_code = 'DEMO-SUB-MATH')
    or (cls.class_code = 'DEMO-GS-A' and st.staff_code = 'DEMO-STF-004' and sub.subject_code = 'DEMO-SUB-EVEIL')
    or (cls.class_code = 'DEMO-PREP-A' and st.staff_code = 'DEMO-STF-005' and sub.subject_code = 'DEMO-SUB-ARTS')
  )
on conflict (id) do update set
  section_id = excluded.section_id,
  assignment_type = excluded.assignment_type,
  assigned_from = excluded.assigned_from,
  assigned_to = excluded.assigned_to,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_admission_required_documents (
  id,
  school_id,
  academic_year_id,
  document_key,
  title,
  description,
  required_for_stage,
  sort_order,
  status,
  metadata_json
)
select
  md5(doc.document_key || ':' || y.year_code)::uuid,
  s.id,
  y.id,
  doc.document_key,
  doc.title,
  doc.description,
  'documents_en_attente',
  doc.sort_order::integer,
  'active',
  doc.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join (
  values
    ('DEMO-ADMDOC-BIRTH', 'Acte de naissance', 'Copie de l’acte de naissance', 1, '{"demo":true}'::jsonb),
    ('DEMO-ADMDOC-VACCINE', 'Carnet de vaccination', 'Carnet ou certificat de vaccination', 2, '{"demo":true}'::jsonb),
    ('DEMO-ADMDOC-PHOTO', 'Photos d’identité', 'Photos récentes de l’enfant', 3, '{"demo":true}'::jsonb)
) as doc(document_key, title, description, sort_order, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  academic_year_id = excluded.academic_year_id,
  title = excluded.title,
  description = excluded.description,
  required_for_stage = excluded.required_for_stage,
  sort_order = excluded.sort_order,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_admission_leads (
  id,
  school_id,
  lead_code,
  parent_name,
  parent_phone,
  parent_email,
  student_full_name,
  child_first_name,
  child_last_name,
  child_date_of_birth,
  relationship_type,
  desired_level,
  source_channel,
  assigned_staff_id,
  contacted_at,
  converted_at,
  next_action,
  next_action_at,
  responsible_staff_id,
  priority,
  status,
  metadata_json
)
select
  md5(l.lead_code)::uuid,
  s.id,
  l.lead_code,
  l.parent_name,
  l.parent_phone,
  l.parent_email,
  l.student_full_name,
  l.child_first_name,
  l.child_last_name,
  l.child_date_of_birth::date,
  l.relationship_type,
  l.desired_level,
  l.source_channel,
  st.id,
  l.contacted_at::timestamptz,
  l.converted_at::timestamptz,
  l.next_action,
  l.next_action_at::timestamptz,
  st.id,
  l.priority,
  l.status,
  l.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-LEAD-001', 'Mme Salma Bennani', '+212 600 400 001', 'salma.bennani.demo@angelcarehub.ma', 'Adam El Mansouri', 'Adam', 'El Mansouri', '2021-09-12', 'mère', 'Petite Section', 'WhatsApp', 'DEMO-STF-001', '2026-06-28T10:00:00Z', null, 'Planifier visite', '2026-07-10T09:00:00Z', 'high', 'contacted', '{"demo":true,"family_code":"DEMO-FAM-01"}'::jsonb),
    ('DEMO-LEAD-002', 'M. Mehdi El Idrissi', '+212 600 400 002', 'mehdi.el-idrissi.demo@angelcarehub.ma', 'Lina Benjelloun', 'Lina', 'Benjelloun', '2021-11-03', 'père', 'Petite Section', 'Referral', 'DEMO-STF-001', '2026-06-29T11:00:00Z', null, 'Envoyer dossier', '2026-07-10T11:00:00Z', 'normal', 'qualified', '{"demo":true,"family_code":"DEMO-FAM-01"}'::jsonb),
    ('DEMO-LEAD-003', 'Mme Karima Berrada', '+212 600 400 003', 'karima.berrada.demo@angelcarehub.ma', 'Youssef Berrada', 'Youssef', 'Berrada', '2021-05-22', 'mère', 'Petite Section', 'Walk-in', 'DEMO-STF-001', '2026-07-01T10:30:00Z', null, 'Appeler pour créneau', '2026-07-09T15:00:00Z', 'normal', 'application_open', '{"demo":true,"family_code":"DEMO-FAM-02"}'::jsonb)
) as l(lead_code, parent_name, parent_phone, parent_email, student_full_name, child_first_name, child_last_name, child_date_of_birth, relationship_type, desired_level, source_channel, staff_code, contacted_at, converted_at, next_action, next_action_at, priority, status, metadata_json) on true
join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = l.staff_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  parent_name = excluded.parent_name,
  parent_phone = excluded.parent_phone,
  parent_email = excluded.parent_email,
  student_full_name = excluded.student_full_name,
  child_first_name = excluded.child_first_name,
  child_last_name = excluded.child_last_name,
  child_date_of_birth = excluded.child_date_of_birth,
  relationship_type = excluded.relationship_type,
  desired_level = excluded.desired_level,
  source_channel = excluded.source_channel,
  assigned_staff_id = excluded.assigned_staff_id,
  contacted_at = excluded.contacted_at,
  converted_at = excluded.converted_at,
  next_action = excluded.next_action,
  next_action_at = excluded.next_action_at,
  responsible_staff_id = excluded.responsible_staff_id,
  priority = excluded.priority,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_documents (
  id,
  school_id,
  document_code,
  documentable_type,
  documentable_id,
  category,
  title,
  file_name,
  file_path,
  storage_provider,
  mime_type,
  file_size_bytes,
  visibility,
  status,
  metadata_json
)
select
  md5(d.document_code)::uuid,
  s.id,
  d.document_code,
  d.documentable_type,
  stu.id,
  d.category,
  d.title,
  d.file_name,
  d.file_path,
  'supabase',
  d.mime_type,
  d.file_size_bytes::bigint,
  d.visibility,
  d.status,
  d.metadata_json
from public.angelcare360_schools s
join public.angelcare360_students stu on stu.school_id = s.id
join (
  values
    ('DEMO-DOC-STU-001', 'student', 'DEMO-STU-001', 'identity', 'Dossier étudiant Adam', 'demo-student-adam.pdf', 'demo/documents/demo-student-adam.pdf', 'application/pdf', 182000, 'school', 'active', '{"demo":true,"purpose":"admissions"}'::jsonb),
    ('DEMO-DOC-STU-002', 'student', 'DEMO-STU-005', 'health', 'Fiche santé Salma', 'demo-student-salma.pdf', 'demo/documents/demo-student-salma.pdf', 'application/pdf', 154000, 'school', 'active', '{"demo":true,"purpose":"attendance"}'::jsonb)
) as d(document_code, documentable_type, documentable_id, category, title, file_name, file_path, mime_type, file_size_bytes, visibility, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (d.document_code = 'DEMO-DOC-STU-001' and stu.student_code = 'DEMO-STU-001')
    or (d.document_code = 'DEMO-DOC-STU-002' and stu.student_code = 'DEMO-STU-005')
  )
on conflict (id) do update set
  documentable_type = excluded.documentable_type,
  documentable_id = excluded.documentable_id,
  category = excluded.category,
  title = excluded.title,
  file_name = excluded.file_name,
  file_path = excluded.file_path,
  storage_provider = excluded.storage_provider,
  mime_type = excluded.mime_type,
  file_size_bytes = excluded.file_size_bytes,
  visibility = excluded.visibility,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_documents (
  id,
  school_id,
  document_code,
  documentable_type,
  documentable_id,
  category,
  title,
  file_name,
  file_path,
  storage_provider,
  mime_type,
  file_size_bytes,
  visibility,
  status,
  metadata_json
)
select
  md5('DEMO-DOC-SCHOOL-001')::uuid,
  s.id,
  'DEMO-DOC-SCHOOL-001',
  'school',
  s.id,
  'reports',
  'Rapport PDF A4 - Synthèse mensuelle',
  'demo-report-summary.pdf',
  'demo/documents/demo-report-summary.pdf',
  'supabase',
  'application/pdf',
  208000,
  'school',
  'active',
  '{"demo":true,"purpose":"report_export"}'::jsonb
from public.angelcare360_schools s
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  documentable_type = excluded.documentable_type,
  documentable_id = excluded.documentable_id,
  category = excluded.category,
  title = excluded.title,
  file_name = excluded.file_name,
  file_path = excluded.file_path,
  storage_provider = excluded.storage_provider,
  mime_type = excluded.mime_type,
  file_size_bytes = excluded.file_size_bytes,
  visibility = excluded.visibility,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_admission_applications (
  id,
  school_id,
  application_code,
  lead_id,
  parent_id,
  student_id,
  academic_year_id,
  class_id,
  section_id,
  child_first_name,
  child_last_name,
  child_date_of_birth,
  child_gender,
  child_nationality,
  parent_first_name,
  parent_last_name,
  relationship_type,
  phone,
  email,
  address,
  application_stage,
  application_date,
  decision_date,
  decision_status,
  decision_reason,
  next_action,
  next_action_at,
  responsible_staff_id,
  converted_at,
  status,
  metadata_json
)
select
  md5(a.application_code)::uuid,
  s.id,
  a.application_code,
  lead.id,
  par.id,
  stu.id,
  y.id,
  cls.id,
  sec.id,
  a.child_first_name,
  a.child_last_name,
  a.child_date_of_birth::date,
  a.child_gender,
  'Marocaine',
  a.parent_first_name,
  a.parent_last_name,
  a.relationship_type,
  a.phone,
  a.email,
  a.address,
  a.application_stage,
  a.application_date::date,
  a.decision_date::date,
  a.decision_status,
  a.decision_reason,
  a.next_action,
  a.next_action_at::timestamptz,
  st.id,
  a.converted_at::timestamptz,
  a.status,
  a.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = y.id
join public.angelcare360_sections sec on sec.class_id = cls.id
join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = 'DEMO-STF-001'
join public.angelcare360_admission_leads lead on lead.school_id = s.id
join public.angelcare360_parents par on par.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
join (
  values
    ('DEMO-APP-001', 'DEMO-LEAD-001', 'DEMO-PAR-001', 'DEMO-STU-001', 'DEMO-PS-A', 'DEMO-SEC-PS-A', 'Adam', 'El Mansouri', '2021-09-12', 'M', 'Salma', 'Bennani', 'mère', '+212 600 400 001', 'salma.bennani.demo@angelcarehub.ma', 'Casablanca', 'in_review', '2026-07-01', null, 'pending', null, 'Envoyer dossier complet', '2026-07-10T09:00:00Z', 'DEMO-STF-001', null, 'open', '{"demo":true,"source":"walk_in"}'::jsonb),
    ('DEMO-APP-002', 'DEMO-LEAD-002', 'DEMO-PAR-002', 'DEMO-STU-005', 'DEMO-MS-A', 'DEMO-SEC-MS-A', 'Salma', 'Tazi', '2020-09-28', 'F', 'Karima', 'Berrada', 'mère', '+212 600 400 003', 'karima.berrada.demo@angelcarehub.ma', 'Casablanca', 'approved', '2026-07-03', '2026-07-03', 'accepted', 'Complete dossier ready for enrollment.', 'Convert to enrollment', '2026-07-09T15:00:00Z', 'DEMO-STF-001', '2026-07-03T09:00:00Z', 'converted', '{"demo":true,"source":"referral"}'::jsonb)
) as a(application_code, lead_code, parent_code, student_code, class_code, section_code, child_first_name, child_last_name, child_date_of_birth, child_gender, parent_first_name, parent_last_name, relationship_type, phone, email, address, application_stage, application_date, decision_date, decision_status, decision_reason, next_action, next_action_at, staff_code, converted_at, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
  and lead.lead_code = a.lead_code
  and par.parent_code = a.parent_code
  and stu.student_code = a.student_code
  and cls.class_code = a.class_code
  and sec.section_code = a.section_code
  and st.staff_code = a.staff_code
on conflict (id) do update set
  lead_id = excluded.lead_id,
  parent_id = excluded.parent_id,
  student_id = excluded.student_id,
  academic_year_id = excluded.academic_year_id,
  class_id = excluded.class_id,
  section_id = excluded.section_id,
  child_first_name = excluded.child_first_name,
  child_last_name = excluded.child_last_name,
  child_date_of_birth = excluded.child_date_of_birth,
  child_gender = excluded.child_gender,
  child_nationality = excluded.child_nationality,
  parent_first_name = excluded.parent_first_name,
  parent_last_name = excluded.parent_last_name,
  relationship_type = excluded.relationship_type,
  phone = excluded.phone,
  email = excluded.email,
  address = excluded.address,
  application_stage = excluded.application_stage,
  application_date = excluded.application_date,
  decision_date = excluded.decision_date,
  decision_status = excluded.decision_status,
  decision_reason = excluded.decision_reason,
  next_action = excluded.next_action,
  next_action_at = excluded.next_action_at,
  responsible_staff_id = excluded.responsible_staff_id,
  converted_at = excluded.converted_at,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_admission_document_submissions (
  id,
  school_id,
  application_id,
  required_document_id,
  document_id,
  submitted_at,
  verification_status,
  reviewed_at,
  notes,
  status,
  metadata_json
)
select
  md5(sub.application_code || ':' || sub.document_key)::uuid,
  s.id,
  app.id,
  req.id,
  doc.id,
  sub.submitted_at::timestamptz,
  sub.verification_status,
  sub.reviewed_at::timestamptz,
  sub.notes,
  'active',
  sub.metadata_json
from public.angelcare360_schools s
join public.angelcare360_admission_applications app on app.school_id = s.id
join public.angelcare360_admission_required_documents req on req.school_id = s.id
join public.angelcare360_documents doc on doc.school_id = s.id
join (
  values
    ('DEMO-APP-002', 'DEMO-ADMDOC-BIRTH', 'DEMO-DOC-STU-002', '2026-07-03T11:00:00Z', 'complete', '2026-07-03T11:15:00Z', 'Birth certificate verified.', '{"demo":true}'::jsonb),
    ('DEMO-APP-002', 'DEMO-ADMDOC-VACCINE', 'DEMO-DOC-STU-001', '2026-07-03T11:05:00Z', 'complete', '2026-07-03T11:15:00Z', 'Vaccination record verified.', '{"demo":true}'::jsonb),
    ('DEMO-APP-001', 'DEMO-ADMDOC-PHOTO', 'DEMO-DOC-STU-001', '2026-07-01T10:00:00Z', 'pending', null, 'Awaiting the last photo upload.', '{"demo":true}'::jsonb)
) as sub(application_code, document_key, document_code, submitted_at, verification_status, reviewed_at, notes, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and app.application_code = sub.application_code
  and req.document_key = sub.document_key
  and doc.document_code = sub.document_code
on conflict (id) do update set
  document_id = excluded.document_id,
  submitted_at = excluded.submitted_at,
  verification_status = excluded.verification_status,
  reviewed_at = excluded.reviewed_at,
  notes = excluded.notes,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_attendance_sessions (
  id,
  school_id,
  academic_year_id,
  class_id,
  section_id,
  session_date,
  session_type,
  source,
  total_expected,
  total_present,
  total_absent,
  total_late,
  total_excused,
  notes,
  status,
  metadata_json
)
select
  md5(cls.class_code || ':' || sec.section_code || ':2026-07-09:daily')::uuid,
  s.id,
  y.id,
  cls.id,
  sec.id,
  '2026-07-09'::date,
  'daily',
  'manual',
  4,
  2,
  1,
  1,
  1,
  'Morning attendance for Grande Section A.',
  'open',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.class_code = 'DEMO-GS-A'
join public.angelcare360_sections sec on sec.class_id = cls.id and sec.section_code = 'DEMO-SEC-GS-A'
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  source = excluded.source,
  total_expected = excluded.total_expected,
  total_present = excluded.total_present,
  total_absent = excluded.total_absent,
  total_late = excluded.total_late,
  total_excused = excluded.total_excused,
  notes = excluded.notes,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_attendance_records (
  id,
  school_id,
  attendance_session_id,
  student_id,
  attendance_status,
  check_in_at,
  check_out_at,
  minutes_late,
  mark_source,
  note,
  justification_required,
  status,
  metadata_json
)
select
  ar.id::uuid,
  s.id,
  ses.id,
  stu.id,
  ar.attendance_status,
  ar.check_in_at::timestamptz,
  ar.check_out_at::timestamptz,
  ar.minutes_late::integer,
  'manual',
  ar.note,
  ar.justification_required::boolean,
  'active',
  ar.metadata_json
from public.angelcare360_schools s
join public.angelcare360_attendance_sessions ses on ses.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
join (
  values
    ('00000000-0000-0000-0000-000000000801', 'DEMO-STU-009', 'present', '2026-07-09T08:05:00Z', '2026-07-09T12:00:00Z', null, false, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000802', 'DEMO-STU-010', 'absent', null, null, null, true, '{"demo":true,"reason":"family_travel"}'::jsonb),
    ('00000000-0000-0000-0000-000000000803', 'DEMO-STU-011', 'late', '2026-07-09T08:20:00Z', null, 20, false, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000804', 'DEMO-STU-012', 'excused', null, null, null, true, '{"demo":true,"reason":"medical_note"}'::jsonb)
) as ar(id, student_code, attendance_status, check_in_at, check_out_at, minutes_late, justification_required, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and ses.class_id = (select id from public.angelcare360_classes where school_id = s.id and class_code = 'DEMO-GS-A')
  and stu.student_code = ar.student_code
  and ses.class_id = stu.current_class_id
on conflict (id) do update set
  attendance_status = excluded.attendance_status,
  check_in_at = excluded.check_in_at,
  check_out_at = excluded.check_out_at,
  minutes_late = excluded.minutes_late,
  mark_source = excluded.mark_source,
  note = excluded.note,
  justification_required = excluded.justification_required,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_attendance_justifications (
  id,
  school_id,
  attendance_record_id,
  justification_code,
  reason_category,
  description,
  submitted_at,
  decision,
  status,
  metadata_json
)
select
  md5('DEMO-JUST-001')::uuid,
  s.id,
  rec.id,
  'DEMO-JUST-001',
  'medical_note',
  'Justification for an excused absence provided by the parent.',
  '2026-07-09T09:15:00Z'::timestamptz,
  'accepted',
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_attendance_records rec on rec.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and rec.id = '00000000-0000-0000-0000-000000000804'
on conflict (id) do update set
  justification_code = excluded.justification_code,
  reason_category = excluded.reason_category,
  description = excluded.description,
  submitted_at = excluded.submitted_at,
  decision = excluded.decision,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_timetable_slots (
  school_id,
  academic_year_id,
  class_id,
  section_id,
  subject_id,
  staff_id,
  day_of_week,
  start_time,
  end_time,
  room,
  slot_type,
  status,
  metadata_json
)
select
  s.id,
  y.id,
  cls.id,
  sec.id,
  sub.id,
  st.id,
  slot.day_of_week::integer,
  slot.start_time::time,
  slot.end_time::time,
  slot.room,
  'regular',
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = y.id
join public.angelcare360_sections sec on sec.class_id = cls.id
join public.angelcare360_subjects sub on sub.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
join (
  values
    ('DEMO-PS-A', 'DEMO-SUB-LANGAGE', 'DEMO-STF-002', 1, '08:30', '09:15', 'Salle 101'),
    ('DEMO-MS-A', 'DEMO-SUB-MATH', 'DEMO-STF-003', 2, '09:30', '10:15', 'Salle 102'),
    ('DEMO-GS-A', 'DEMO-SUB-EVEIL', 'DEMO-STF-004', 3, '10:30', '11:15', 'Salle 103'),
    ('DEMO-PREP-A', 'DEMO-SUB-ARTS', 'DEMO-STF-005', 4, '11:30', '12:15', 'Salle 104')
) as slot(class_code, subject_code, staff_code, day_of_week, start_time, end_time, room) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and cls.class_code = slot.class_code
  and sec.class_id = cls.id
  and sub.subject_code = slot.subject_code
  and st.staff_code = slot.staff_code
on conflict do nothing;

insert into public.angelcare360_lessons (
  id,
  school_id,
  academic_year_id,
  class_id,
  section_id,
  subject_id,
  staff_id,
  lesson_code,
  lesson_date,
  topic,
  objectives,
  homework_summary,
  status,
  metadata_json
)
select
  md5(lesson.lesson_code)::uuid,
  s.id,
  y.id,
  cls.id,
  sec.id,
  sub.id,
  st.id,
  lesson.lesson_code,
  lesson.lesson_date::date,
  lesson.topic,
  lesson.objectives,
  lesson.homework_summary,
  'completed',
  lesson.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id
join public.angelcare360_sections sec on sec.class_id = cls.id
join public.angelcare360_subjects sub on sub.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
join (
  values
    ('DEMO-LESSON-001', 'DEMO-PS-A', 'DEMO-SEC-PS-A', 'DEMO-SUB-LANGAGE', 'DEMO-STF-002', '2026-07-08', 'Reconnaître les lettres de base', 'Travail sur les sons et les images', 'Revoir les sons à la maison', '{"demo":true}'::jsonb),
    ('DEMO-LESSON-002', 'DEMO-MS-A', 'DEMO-SEC-MS-A', 'DEMO-SUB-MATH', 'DEMO-STF-003', '2026-07-08', 'Compter jusqu’à 10', 'Reconnaître les chiffres', 'Compter les objets du quotidien', '{"demo":true}'::jsonb),
    ('DEMO-LESSON-003', 'DEMO-GS-A', 'DEMO-SEC-GS-A', 'DEMO-SUB-EVEIL', 'DEMO-STF-004', '2026-07-08', 'Observer le vivant', 'Découvrir les plantes', 'Dessiner une plante', '{"demo":true}'::jsonb),
    ('DEMO-LESSON-004', 'DEMO-PREP-A', 'DEMO-SEC-PREP-A', 'DEMO-SUB-ARTS', 'DEMO-STF-005', '2026-07-08', 'Créer une composition', 'Couleurs et formes', 'Apporter une image pour collage', '{"demo":true}'::jsonb)
) as lesson(lesson_code, class_code, section_code, subject_code, staff_code, lesson_date, topic, objectives, homework_summary, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and cls.class_code = lesson.class_code
  and sec.section_code = lesson.section_code
  and sub.subject_code = lesson.subject_code
  and st.staff_code = lesson.staff_code
on conflict (id) do update set
  class_id = excluded.class_id,
  section_id = excluded.section_id,
  subject_id = excluded.subject_id,
  staff_id = excluded.staff_id,
  lesson_date = excluded.lesson_date,
  topic = excluded.topic,
  objectives = excluded.objectives,
  homework_summary = excluded.homework_summary,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_assignments (
  id,
  school_id,
  academic_year_id,
  class_id,
  section_id,
  subject_id,
  created_by_staff_id,
  assignment_code,
  title,
  description,
  due_on,
  max_score,
  status,
  metadata_json
)
select
  md5(asg.assignment_code)::uuid,
  s.id,
  y.id,
  cls.id,
  sec.id,
  sub.id,
  st.id,
  asg.assignment_code,
  asg.title,
  asg.description,
  asg.due_on::date,
  asg.max_score::numeric,
  'published',
  asg.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id
join public.angelcare360_sections sec on sec.class_id = cls.id
join public.angelcare360_subjects sub on sub.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
join (
  values
    ('DEMO-ASSIGN-001', 'DEMO-PS-A', 'DEMO-SEC-PS-A', 'DEMO-SUB-LANGAGE', 'DEMO-STF-002', 'Découper et coller les lettres', 'Créer un alphabet visuel avec images.', '2026-07-11', 20, '{"demo":true}'::jsonb),
    ('DEMO-ASSIGN-002', 'DEMO-GS-A', 'DEMO-SEC-GS-A', 'DEMO-SUB-EVEIL', 'DEMO-STF-004', 'Identifier une plante', 'Dessiner une plante et nommer ses parties.', '2026-07-12', 20, '{"demo":true}'::jsonb)
) as asg(assignment_code, class_code, section_code, subject_code, staff_code, title, description, due_on, max_score, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and cls.class_code = asg.class_code
  and sec.section_code = asg.section_code
  and sub.subject_code = asg.subject_code
  and st.staff_code = asg.staff_code
on conflict (id) do update set
  class_id = excluded.class_id,
  section_id = excluded.section_id,
  subject_id = excluded.subject_id,
  created_by_staff_id = excluded.created_by_staff_id,
  title = excluded.title,
  description = excluded.description,
  due_on = excluded.due_on,
  max_score = excluded.max_score,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_exams (
  id,
  school_id,
  academic_year_id,
  class_id,
  section_id,
  subject_id,
  exam_code,
  title,
  exam_type,
  scheduled_on,
  duration_minutes,
  max_score,
  status,
  metadata_json
)
select
  md5(ex.exam_code)::uuid,
  s.id,
  y.id,
  cls.id,
  sec.id,
  sub.id,
  ex.exam_code,
  ex.title,
  ex.exam_type,
  ex.scheduled_on::date,
  ex.duration_minutes::integer,
  ex.max_score::numeric,
  'open',
  ex.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_classes cls on cls.school_id = s.id and cls.academic_year_id = y.id
join public.angelcare360_sections sec on sec.class_id = cls.id
join public.angelcare360_subjects sub on sub.school_id = s.id
join (
  values
    ('DEMO-EXAM-001', 'DEMO-PS-A', 'DEMO-SEC-PS-A', 'DEMO-SUB-LANGAGE', 'Évaluation langage PS', 'oral', '2026-07-09', 25, 20, '{"demo":true}'::jsonb),
    ('DEMO-EXAM-002', 'DEMO-MS-A', 'DEMO-SEC-MS-A', 'DEMO-SUB-MATH', 'Contrôle mathématiques MS', 'written', '2026-07-09', 25, 20, '{"demo":true}'::jsonb),
    ('DEMO-EXAM-003', 'DEMO-GS-A', 'DEMO-SEC-GS-A', 'DEMO-SUB-EVEIL', 'Évaluation éveil GS', 'project', '2026-07-09', 25, 20, '{"demo":true}'::jsonb),
    ('DEMO-EXAM-004', 'DEMO-PREP-A', 'DEMO-SEC-PREP-A', 'DEMO-SUB-ARTS', 'Évaluation arts Prépa', 'practical', '2026-07-09', 25, 20, '{"demo":true}'::jsonb)
) as ex(exam_code, class_code, section_code, subject_code, title, exam_type, scheduled_on, duration_minutes, max_score, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and cls.class_code = ex.class_code
  and sec.section_code = ex.section_code
  and sub.subject_code = ex.subject_code
on conflict (id) do update set
  academic_year_id = excluded.academic_year_id,
  class_id = excluded.class_id,
  section_id = excluded.section_id,
  subject_id = excluded.subject_id,
  title = excluded.title,
  exam_type = excluded.exam_type,
  scheduled_on = excluded.scheduled_on,
  duration_minutes = excluded.duration_minutes,
  max_score = excluded.max_score,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_exam_sessions (
  id,
  school_id,
  exam_id,
  session_code,
  room,
  starts_at,
  ends_at,
  invigilator_staff_id,
  status,
  metadata_json
)
select
  md5(ses.exam_code || ':' || ses.session_code)::uuid,
  s.id,
  exm.id,
  ses.session_code,
  ses.room,
  ses.starts_at::timestamptz,
  ses.ends_at::timestamptz,
  st.id,
  'open',
  ses.metadata_json
from public.angelcare360_schools s
join public.angelcare360_exams exm on exm.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
join (
  values
    ('DEMO-EXAM-001', 'AM-SESSION', 'Salle 201', '2026-07-09T08:30:00Z', '2026-07-09T09:00:00Z', 'DEMO-STF-002', '{"demo":true}'::jsonb),
    ('DEMO-EXAM-002', 'AM-SESSION', 'Salle 202', '2026-07-09T09:30:00Z', '2026-07-09T10:00:00Z', 'DEMO-STF-003', '{"demo":true}'::jsonb),
    ('DEMO-EXAM-003', 'AM-SESSION', 'Salle 203', '2026-07-09T10:30:00Z', '2026-07-09T11:00:00Z', 'DEMO-STF-004', '{"demo":true}'::jsonb),
    ('DEMO-EXAM-004', 'AM-SESSION', 'Salle 204', '2026-07-09T11:30:00Z', '2026-07-09T12:00:00Z', 'DEMO-STF-005', '{"demo":true}'::jsonb)
) as ses(exam_code, session_code, room, starts_at, ends_at, staff_code, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and exm.exam_code = ses.exam_code
  and st.staff_code = ses.staff_code
on conflict (id) do update set
  room = excluded.room,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  invigilator_staff_id = excluded.invigilator_staff_id,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_marks (
  id,
  school_id,
  academic_year_id,
  student_id,
  subject_id,
  exam_id,
  assignment_id,
  assessment_type,
  score,
  max_score,
  grade,
  recorded_by_staff_id,
  recorded_at,
  status,
  metadata_json
)
select
  m.id::uuid,
  s.id,
  y.id,
  stu.id,
  sub.id,
  exm.id,
  asg.id,
  m.assessment_type,
  m.score::numeric,
  m.max_score::numeric,
  m.grade,
  st.id,
  m.recorded_at::timestamptz,
  'active',
  m.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
join public.angelcare360_subjects sub on sub.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
left join public.angelcare360_exams exm on exm.school_id = s.id and exm.exam_code = m.exam_code
left join public.angelcare360_assignments asg on asg.school_id = s.id and asg.assignment_code = m.assignment_code
join (
  values
    ('00000000-0000-0000-0000-000000000901', 'DEMO-STU-009', 'DEMO-SUB-EVEIL', 'assignment', null, 'DEMO-ASSIGN-002', 18, 20, 'A', '2026-07-09T13:00:00Z', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000902', 'DEMO-STU-010', 'DEMO-SUB-EVEIL', 'assignment', null, 'DEMO-ASSIGN-002', 16, 20, 'B', '2026-07-09T13:05:00Z', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000903', 'DEMO-STU-013', 'DEMO-SUB-ARTS', 'exam', 'DEMO-EXAM-004', null, 17, 20, 'A', '2026-07-09T13:10:00Z', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000904', 'DEMO-STU-014', 'DEMO-SUB-ARTS', 'exam', 'DEMO-EXAM-004', null, 15, 20, 'B', '2026-07-09T13:10:00Z', '{"demo":true}'::jsonb)
) as m(id, student_code, subject_code, assessment_type, exam_code, assignment_code, score, max_score, grade, recorded_at, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and stu.student_code = m.student_code
  and sub.subject_code = m.subject_code
  and st.staff_code in ('DEMO-STF-004','DEMO-STF-005')
on conflict (id) do update set
  school_id = excluded.school_id,
  academic_year_id = excluded.academic_year_id,
  student_id = excluded.student_id,
  subject_id = excluded.subject_id,
  exam_id = excluded.exam_id,
  assignment_id = excluded.assignment_id,
  assessment_type = excluded.assessment_type,
  score = excluded.score,
  max_score = excluded.max_score,
  grade = excluded.grade,
  recorded_by_staff_id = excluded.recorded_by_staff_id,
  recorded_at = excluded.recorded_at,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_report_cards (
  id,
  school_id,
  academic_year_id,
  student_id,
  class_id,
  section_id,
  term_id,
  report_card_code,
  generated_on,
  overall_average,
  rank_position,
  attendance_summary,
  status,
  metadata_json
)
select
  md5('DEMO-RC-001')::uuid,
  s.id,
  y.id,
  stu.id,
  cls.id,
  sec.id,
  t.id,
  'DEMO-RC-001',
  '2026-07-09'::date,
  16.5::numeric,
  3::integer,
  '2 présents, 1 absent, 1 retard',
  'draft',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_terms t on t.academic_year_id = y.id
join public.angelcare360_students stu on stu.school_id = s.id and stu.student_code = 'DEMO-STU-009'
join public.angelcare360_classes cls on cls.id = stu.current_class_id
join public.angelcare360_sections sec on sec.id = stu.current_section_id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and t.term_code = 'DEMO-T1'
on conflict (id) do update set
  academic_year_id = excluded.academic_year_id,
  student_id = excluded.student_id,
  class_id = excluded.class_id,
  section_id = excluded.section_id,
  term_id = excluded.term_id,
  generated_on = excluded.generated_on,
  overall_average = excluded.overall_average,
  rank_position = excluded.rank_position,
  attendance_summary = excluded.attendance_summary,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_teacher_comments (
  school_id,
  academic_year_id,
  student_id,
  class_id,
  section_id,
  term_id,
  staff_id,
  comment_type,
  comment_text,
  rating,
  status,
  metadata_json
)
select
  s.id,
  y.id,
  stu.id,
  cls.id,
  sec.id,
  t.id,
  st.id,
  tc.comment_type,
  tc.comment_text,
  tc.rating::integer,
  'active',
  tc.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_terms t on t.academic_year_id = y.id and t.term_code = 'DEMO-T1'
join public.angelcare360_students stu on stu.school_id = s.id and stu.student_code = 'DEMO-STU-009'
join public.angelcare360_classes cls on cls.id = stu.current_class_id
join public.angelcare360_sections sec on sec.id = stu.current_section_id
join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = 'DEMO-STF-004'
join (
  values
    ('appreciation', 'Adam progresse bien dans les activités d’éveil et reste concentré.', 4, '{"demo":true}'::jsonb)
) as tc(comment_type, comment_text, rating, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict do nothing;

insert into public.angelcare360_report_card_lines (
  id,
  school_id,
  report_card_id,
  subject_id,
  teacher_comment_id,
  mark_average,
  coefficient,
  letter_grade,
  remarks,
  status,
  metadata_json
)
select
  line.id::uuid,
  s.id,
  rc.id,
  sub.id,
  tc.id,
  line.mark_average::numeric,
  line.coefficient::numeric,
  line.letter_grade,
  line.remarks,
  'active',
  line.metadata_json
from public.angelcare360_schools s
join public.angelcare360_report_cards rc on rc.school_id = s.id and rc.report_card_code = 'DEMO-RC-001'
join public.angelcare360_subjects sub on sub.school_id = s.id
left join public.angelcare360_teacher_comments tc on tc.school_id = s.id and tc.student_id = rc.student_id
join (
  values
    ('00000000-0000-0000-0000-000000000931', 'DEMO-SUB-LANGAGE', 16.5, 1, 'A', 'Très bonne participation', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000932', 'DEMO-SUB-MATH', 15.5, 1, 'B', 'Bonne maîtrise des comptines numériques', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000933', 'DEMO-SUB-EVEIL', 17.0, 1, 'A', 'Curieux et appliqué', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000934', 'DEMO-SUB-ARTS', 18.0, 1, 'A', 'Créatif et soigneux', '{"demo":true}'::jsonb)
) as line(id, subject_code, mark_average, coefficient, letter_grade, remarks, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and sub.subject_code = line.subject_code
on conflict (id) do update set
  school_id = excluded.school_id,
  report_card_id = excluded.report_card_id,
  subject_id = excluded.subject_id,
  teacher_comment_id = excluded.teacher_comment_id,
  mark_average = excluded.mark_average,
  coefficient = excluded.coefficient,
  letter_grade = excluded.letter_grade,
  remarks = excluded.remarks,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_fee_structures (
  id,
  school_id,
  academic_year_id,
  fee_code,
  label,
  description,
  due_day_of_month,
  currency,
  applies_to_level,
  status,
  metadata_json
)
select
  md5('DEMO-FEE-2026-2027')::uuid,
  s.id,
  y.id,
  'DEMO-FEE-2026-2027',
  'Frais de scolarité 2026-2027',
  'Fee catalog for the Casablanca preschool demo school.',
  5,
  'MAD',
  'Prescolaire',
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  academic_year_id = excluded.academic_year_id,
  label = excluded.label,
  description = excluded.description,
  due_day_of_month = excluded.due_day_of_month,
  currency = excluded.currency,
  applies_to_level = excluded.applies_to_level,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_fee_items (
  id,
  school_id,
  fee_structure_id,
  item_code,
  label,
  fee_type,
  amount,
  due_on,
  is_required,
  status,
  metadata_json
)
select
  md5(fs.fee_code || ':' || item.item_code)::uuid,
  s.id,
  fs.id,
  item.item_code,
  item.label,
  item.fee_type,
  item.amount::numeric,
  item.due_on::date,
  true,
  'active',
  item.metadata_json
from public.angelcare360_schools s
join public.angelcare360_fee_structures fs on fs.school_id = s.id
join (
  values
    ('DEMO-FEE-TUITION', 'Scolarité mensuelle', 'tuition', 2500, '2026-07-05', '{"demo":true}'::jsonb),
    ('DEMO-FEE-MATERIAL', 'Matériel pédagogique', 'material', 400, '2026-07-05', '{"demo":true}'::jsonb),
    ('DEMO-FEE-MEALS', 'Repas & goûter', 'meals', 600, '2026-07-05', '{"demo":true}'::jsonb)
) as item(item_code, label, fee_type, amount, due_on, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and fs.fee_code = 'DEMO-FEE-2026-2027'
on conflict (id) do update set
  label = excluded.label,
  fee_type = excluded.fee_type,
  amount = excluded.amount,
  due_on = excluded.due_on,
  is_required = excluded.is_required,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_student_fee_assignments (
  id,
  school_id,
  academic_year_id,
  student_id,
  fee_structure_id,
  class_id,
  section_id,
  assigned_on,
  status,
  metadata_json
)
select
  md5(stu.student_code || ':' || y.year_code || ':' || fs.fee_code)::uuid,
  s.id,
  y.id,
  stu.id,
  fs.id,
  cls.id,
  sec.id,
  '2026-07-01'::date,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_fee_structures fs on fs.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
join public.angelcare360_classes cls on cls.id = stu.current_class_id
join public.angelcare360_sections sec on sec.id = stu.current_section_id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and fs.fee_code = 'DEMO-FEE-2026-2027'
on conflict (id) do update set
  class_id = excluded.class_id,
  section_id = excluded.section_id,
  assigned_on = excluded.assigned_on,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_invoices (
  id,
  school_id,
  academic_year_id,
  student_id,
  invoice_number,
  invoice_type,
  invoice_date,
  due_date,
  currency,
  subtotal_amount,
  discount_total,
  tax_total,
  total_amount,
  amount_paid,
  status,
  metadata_json
)
select
  md5(inv.invoice_number)::uuid,
  s.id,
  y.id,
  inv.student_id,
  inv.invoice_number,
  'tuition',
  inv.invoice_date::date,
  inv.due_date::date,
  'MAD',
  inv.subtotal_amount::numeric,
  0,
  0,
  inv.total_amount::numeric,
  inv.amount_paid::numeric,
  inv.status,
  inv.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
join (
  values
    ('DEMO-STU-001', 'AC360-SCH-INV-DEMO-0001', '2026-05-15', '2026-05-22', 3500, 3500, 'paid', '{"demo":true}'::jsonb),
    ('DEMO-STU-005', 'AC360-SCH-INV-DEMO-0002', '2026-07-01', '2026-07-08', 3500, 0, 'issued', '{"demo":true}'::jsonb),
    ('DEMO-STU-009', 'AC360-SCH-INV-DEMO-0003', '2026-06-15', '2026-06-22', 3500, 0, 'overdue', '{"demo":true}'::jsonb)
) as inv(student_code, invoice_number, invoice_date, due_date, subtotal_amount, amount_paid, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and stu.student_code = inv.student_code
  and y.year_code = '2026-2027'
on conflict (id) do update set
  student_id = excluded.student_id,
  invoice_type = excluded.invoice_type,
  invoice_date = excluded.invoice_date,
  due_date = excluded.due_date,
  currency = excluded.currency,
  subtotal_amount = excluded.subtotal_amount,
  discount_total = excluded.discount_total,
  tax_total = excluded.tax_total,
  total_amount = excluded.total_amount,
  amount_paid = excluded.amount_paid,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_invoice_lines (
  id,
  school_id,
  invoice_id,
  fee_item_id,
  line_code,
  label,
  quantity,
  unit_amount,
  line_total,
  status,
  metadata_json
)
select
  line.id::uuid,
  s.id,
  inv.id,
  fi.id,
  line.line_code,
  line.label,
  line.quantity::numeric,
  line.unit_amount::numeric,
  line.line_total::numeric,
  'active',
  line.metadata_json
from public.angelcare360_schools s
join public.angelcare360_invoices inv on inv.school_id = s.id
join public.angelcare360_fee_items fi on fi.school_id = s.id
join (
  values
    ('00000000-0000-0000-0000-000000000911', 'AC360-SCH-INV-DEMO-0001', 'DEMO-FEE-TUITION', 'Scolarité mensuelle', 1, 2500, 2500, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000912', 'AC360-SCH-INV-DEMO-0002', 'DEMO-FEE-TUITION', 'Scolarité mensuelle', 1, 2500, 2500, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000000913', 'AC360-SCH-INV-DEMO-0003', 'DEMO-FEE-TUITION', 'Scolarité mensuelle', 1, 2500, 2500, '{"demo":true}'::jsonb)
) as line(id, invoice_number, item_code, label, quantity, unit_amount, line_total, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and inv.invoice_number = line.invoice_number
  and fi.item_code = line.item_code
on conflict (id) do update set
  school_id = excluded.school_id,
  invoice_id = excluded.invoice_id,
  fee_item_id = excluded.fee_item_id,
  line_code = excluded.line_code,
  label = excluded.label,
  quantity = excluded.quantity,
  unit_amount = excluded.unit_amount,
  line_total = excluded.line_total,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_payments (
  id,
  school_id,
  academic_year_id,
  invoice_id,
  student_id,
  payment_number,
  payment_date,
  method,
  amount,
  allocated_amount,
  reference,
  status,
  metadata_json
)
select
  md5(pay.payment_number)::uuid,
  s.id,
  y.id,
  inv.id,
  stu.id,
  pay.payment_number,
  pay.payment_date::date,
  pay.method,
  pay.amount::numeric,
  pay.allocated_amount::numeric,
  pay.reference,
  pay.status,
  pay.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_invoices inv on inv.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
join (
  values
    ('AC360-PAY-DEMO-0001', '2026-05-18', 'bank_transfer', 3500, 3500, 'VIR-20260518-001', 'confirmed', '{"demo":true}'::jsonb),
    ('AC360-PAY-DEMO-0002', '2026-07-03', 'manual', 1500, 1500, 'CASH-20260703-001', 'pending', '{"demo":true}'::jsonb)
) as pay(payment_number, payment_date, method, amount, allocated_amount, reference, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (inv.invoice_number = 'AC360-SCH-INV-DEMO-0001' and stu.student_code = 'DEMO-STU-001' and pay.payment_number = 'AC360-PAY-DEMO-0001')
    or (inv.invoice_number = 'AC360-SCH-INV-DEMO-0002' and stu.student_code = 'DEMO-STU-005' and pay.payment_number = 'AC360-PAY-DEMO-0002')
  )
on conflict (id) do update set
  invoice_id = excluded.invoice_id,
  student_id = excluded.student_id,
  payment_date = excluded.payment_date,
  method = excluded.method,
  amount = excluded.amount,
  allocated_amount = excluded.allocated_amount,
  reference = excluded.reference,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_receipts (
  id,
  school_id,
  payment_id,
  receipt_number,
  issued_at,
  status,
  metadata_json
)
select
  md5('AC360-REC-DEMO-0001')::uuid,
  s.id,
  pay.id,
  'AC360-REC-DEMO-0001',
  '2026-05-18T12:00:00Z'::timestamptz,
  'issued',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_payments pay on pay.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and pay.payment_number = 'AC360-PAY-DEMO-0001'
on conflict (id) do update set
  payment_id = excluded.payment_id,
  issued_at = excluded.issued_at,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_payment_reminders (
  id,
  school_id,
  invoice_id,
  student_id,
  reminder_code,
  reminder_type,
  scheduled_for,
  sent_at,
  channel,
  status,
  notes,
  metadata_json
)
select
  md5(inv.invoice_number || ':DEMO-REMINDER-001')::uuid,
  s.id,
  inv.id,
  stu.id,
  'DEMO-REMINDER-001',
  'overdue_notice',
  '2026-07-09T15:00:00Z'::timestamptz,
  null,
  'email',
  'scheduled',
  'Reminder queued for overdue invoice.',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_invoices inv on inv.school_id = s.id
join public.angelcare360_students stu on stu.school_id = s.id
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and inv.invoice_number = 'AC360-SCH-INV-DEMO-0003'
  and stu.student_code = 'DEMO-STU-009'
on conflict (id) do update set
  student_id = excluded.student_id,
  reminder_type = excluded.reminder_type,
  scheduled_for = excluded.scheduled_for,
  sent_at = excluded.sent_at,
  channel = excluded.channel,
  status = excluded.status,
  notes = excluded.notes,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_finance_accounts (
  id,
  school_id,
  account_code,
  label,
  account_type,
  currency,
  opening_balance,
  status,
  metadata_json
)
select
  md5(fa.account_code)::uuid,
  s.id,
  fa.account_code,
  fa.label,
  fa.account_type,
  'MAD',
  fa.opening_balance::numeric,
  'active',
  fa.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-FA-CASH', 'Caisse principale', 'cash', 1800, '{"demo":true}'::jsonb),
    ('DEMO-FA-BANK', 'Compte bancaire BMCI', 'bank', 24600, '{"demo":true}'::jsonb)
) as fa(account_code, label, account_type, opening_balance, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  label = excluded.label,
  account_type = excluded.account_type,
  currency = excluded.currency,
  opening_balance = excluded.opening_balance,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_expenses (
  id,
  school_id,
  academic_year_id,
  expense_code,
  expense_date,
  category,
  vendor_name,
  account_id,
  amount,
  currency,
  payment_method,
  status,
  notes,
  metadata_json
)
select
  md5('DEMO-EXP-001')::uuid,
  s.id,
  y.id,
  'DEMO-EXP-001',
  '2026-07-02'::date,
  'transport',
  'Station-service locale',
  fa.id,
  450::numeric,
  'MAD',
  'cash',
  'paid',
  'Fuel expense for the demo shuttle.',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_finance_accounts fa on fa.school_id = s.id and fa.account_code = 'DEMO-FA-CASH'
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  academic_year_id = excluded.academic_year_id,
  expense_date = excluded.expense_date,
  category = excluded.category,
  vendor_name = excluded.vendor_name,
  account_id = excluded.account_id,
  amount = excluded.amount,
  currency = excluded.currency,
  payment_method = excluded.payment_method,
  status = excluded.status,
  notes = excluded.notes,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_transport_routes (
  id,
  school_id,
  route_code,
  label,
  route_type,
  responsible_staff_id,
  status,
  metadata_json
)
select
  md5('DEMO-TR-001')::uuid,
  s.id,
  'DEMO-TR-001',
  'Casablanca Centre - Route Matin',
  'school_bus',
  st.id,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = 'DEMO-STF-002'
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  label = excluded.label,
  route_type = excluded.route_type,
  responsible_staff_id = excluded.responsible_staff_id,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_transport_stops (
  id,
  school_id,
  route_id,
  stop_code,
  label,
  order_index,
  latitude,
  longitude,
  planned_time,
  status,
  metadata_json
)
select
  md5(r.route_code || ':' || st.stop_code)::uuid,
  s.id,
  r.id,
  st.stop_code,
  st.label,
  st.order_index::integer,
  st.latitude::numeric,
  st.longitude::numeric,
  st.planned_time::time,
  'active',
  st.metadata_json
from public.angelcare360_schools s
join public.angelcare360_transport_routes r on r.school_id = s.id and r.route_code = 'DEMO-TR-001'
join (
  values
    ('DEMO-STOP-001', 'Place des Nations Unies', 1, 33.5931, -7.6188, '07:10', '{"demo":true}'::jsonb),
    ('DEMO-STOP-002', 'Boulevard Zerktouni', 2, 33.5835, -7.6240, '07:18', '{"demo":true}'::jsonb),
    ('DEMO-STOP-003', 'Quartier Gauthier', 3, 33.5890, -7.6322, '07:25', '{"demo":true}'::jsonb)
) as st(stop_code, label, order_index, latitude, longitude, planned_time, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  label = excluded.label,
  order_index = excluded.order_index,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  planned_time = excluded.planned_time,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_transport_vehicles (
  id,
  school_id,
  vehicle_code,
  plate_number,
  model,
  capacity_seats,
  assigned_driver_staff_id,
  insurance_expires_on,
  status,
  metadata_json
)
select
  md5('DEMO-BUS-001')::uuid,
  s.id,
  'DEMO-BUS-001',
  '12345-A-12',
  'Mercedes Sprinter',
  16::integer,
  st.id,
  '2027-06-30'::date,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = 'DEMO-STF-002'
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  plate_number = excluded.plate_number,
  model = excluded.model,
  capacity_seats = excluded.capacity_seats,
  assigned_driver_staff_id = excluded.assigned_driver_staff_id,
  insurance_expires_on = excluded.insurance_expires_on,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_transport_assignments (
  id,
  school_id,
  academic_year_id,
  route_id,
  student_id,
  vehicle_id,
  pickup_stop_id,
  dropoff_stop_id,
  assigned_on,
  status,
  metadata_json
)
select
  md5(stu.student_code || ':' || y.year_code)::uuid,
  s.id,
  y.id,
  r.id,
  stu.id,
  veh.id,
  pstop.id,
  dstop.id,
  '2026-07-01'::date,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join public.angelcare360_transport_routes r on r.school_id = s.id and r.route_code = 'DEMO-TR-001'
join public.angelcare360_transport_vehicles veh on veh.school_id = s.id and veh.vehicle_code = 'DEMO-BUS-001'
join public.angelcare360_transport_stops pstop on pstop.route_id = r.id and pstop.stop_code = 'DEMO-STOP-001'
join public.angelcare360_transport_stops dstop on dstop.route_id = r.id and dstop.stop_code = 'DEMO-STOP-003'
join public.angelcare360_students stu on stu.school_id = s.id and stu.student_code in ('DEMO-STU-001','DEMO-STU-002','DEMO-STU-009','DEMO-STU-010')
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  route_id = excluded.route_id,
  vehicle_id = excluded.vehicle_id,
  pickup_stop_id = excluded.pickup_stop_id,
  dropoff_stop_id = excluded.dropoff_stop_id,
  assigned_on = excluded.assigned_on,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_library_books (
  id,
  school_id,
  book_code,
  isbn,
  title,
  author,
  publisher,
  category,
  language,
  status,
  metadata_json
)
select
  md5(b.book_code)::uuid,
  s.id,
  b.book_code,
  b.isbn,
  b.title,
  b.author,
  b.publisher,
  b.category,
  'fr',
  'active',
  b.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-BOOK-001', '9789999990011', 'Les couleurs du monde', 'A. El Fassi', 'Demo Press', 'albums', '{"demo":true}'::jsonb),
    ('DEMO-BOOK-002', '9789999990028', 'Compter avec les animaux', 'S. Bennani', 'Demo Press', 'apprentissage', '{"demo":true}'::jsonb),
    ('DEMO-BOOK-003', '9789999990035', 'Petites histoires de Casablanca', 'H. Bekkali', 'Demo Press', 'contes', '{"demo":true}'::jsonb)
) as b(book_code, isbn, title, author, publisher, category, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  isbn = excluded.isbn,
  title = excluded.title,
  author = excluded.author,
  publisher = excluded.publisher,
  category = excluded.category,
  language = excluded.language,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_library_copies (
  id,
  school_id,
  book_id,
  copy_code,
  barcode,
  acquisition_date,
  shelf_location,
  condition,
  status,
  metadata_json
)
select
  md5(b.book_code || ':' || c.copy_code)::uuid,
  s.id,
  b.id,
  c.copy_code,
  c.barcode,
  c.acquisition_date::date,
  c.shelf_location,
  c.condition,
  c.status,
  c.metadata_json
from public.angelcare360_schools s
join public.angelcare360_library_books b on b.school_id = s.id
join (
  values
    ('DEMO-COPY-001', 'BAR-001', '2026-07-01', 'Rayon A1', 'good', 'available', '{"demo":true}'::jsonb),
    ('DEMO-COPY-002', 'BAR-002', '2026-07-01', 'Rayon A1', 'good', 'loaned', '{"demo":true}'::jsonb),
    ('DEMO-COPY-003', 'BAR-003', '2026-07-01', 'Rayon A2', 'good', 'available', '{"demo":true}'::jsonb)
) as c(copy_code, barcode, acquisition_date, shelf_location, condition, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (b.book_code = 'DEMO-BOOK-001' and c.copy_code = 'DEMO-COPY-001')
    or (b.book_code = 'DEMO-BOOK-002' and c.copy_code = 'DEMO-COPY-002')
    or (b.book_code = 'DEMO-BOOK-003' and c.copy_code = 'DEMO-COPY-003')
  )
on conflict (id) do update set
  book_id = excluded.book_id,
  barcode = excluded.barcode,
  acquisition_date = excluded.acquisition_date,
  shelf_location = excluded.shelf_location,
  condition = excluded.condition,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_library_loans (
  id,
  school_id,
  copy_id,
  borrower_type,
  borrower_student_id,
  borrower_staff_id,
  loaned_at,
  due_at,
  returned_at,
  fine_amount,
  status,
  metadata_json
)
select
  '00000000-0000-0000-0000-000000001001'::uuid,
  s.id,
  cp.id,
  'student',
  stu.id,
  null,
  '2026-07-02T10:00:00Z'::timestamptz,
  '2026-07-08T10:00:00Z'::timestamptz,
  null,
  15::numeric,
  'overdue',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_library_copies cp on cp.school_id = s.id and cp.copy_code = 'DEMO-COPY-002'
join public.angelcare360_students stu on stu.school_id = s.id and stu.student_code = 'DEMO-STU-013'
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  copy_id = excluded.copy_id,
  borrower_type = excluded.borrower_type,
  borrower_student_id = excluded.borrower_student_id,
  borrower_staff_id = excluded.borrower_staff_id,
  loaned_at = excluded.loaned_at,
  due_at = excluded.due_at,
  returned_at = excluded.returned_at,
  fine_amount = excluded.fine_amount,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_inventory_categories (
  id,
  school_id,
  category_code,
  label,
  description,
  status,
  metadata_json
)
select
  md5(cat.category_code)::uuid,
  s.id,
  cat.category_code,
  cat.label,
  cat.description,
  'active',
  cat.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-INV-CAT-STATIONERY', 'Fournitures', 'Stationery and classroom supplies', '{"demo":true}'::jsonb),
    ('DEMO-INV-CAT-MAINTENANCE', 'Maintenance', 'Cleaning and maintenance items', '{"demo":true}'::jsonb)
) as cat(category_code, label, description, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_inventory_items (
  id,
  school_id,
  category_id,
  item_code,
  label,
  unit_of_measure,
  barcode,
  current_stock,
  reorder_level,
  purchase_price,
  status,
  metadata_json
)
select
  md5(item.item_code)::uuid,
  s.id,
  cat.id,
  item.item_code,
  item.label,
  item.unit_of_measure,
  item.barcode,
  item.current_stock::numeric,
  item.reorder_level::numeric,
  item.purchase_price::numeric,
  item.status,
  item.metadata_json
from public.angelcare360_schools s
join public.angelcare360_inventory_categories cat on cat.school_id = s.id
join (
  values
    ('DEMO-INV-ITEM-001', 'Feutres lavables', 'box', 'BAR-INV-001', 14, 20, 55, 'low_stock', '{"demo":true}'::jsonb),
    ('DEMO-INV-ITEM-002', 'Gels hydroalcooliques', 'bottle', 'BAR-INV-002', 32, 10, 24, 'active', '{"demo":true}'::jsonb)
) as item(item_code, label, unit_of_measure, barcode, current_stock, reorder_level, purchase_price, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (cat.category_code = 'DEMO-INV-CAT-STATIONERY' and item.item_code = 'DEMO-INV-ITEM-001')
    or (cat.category_code = 'DEMO-INV-CAT-MAINTENANCE' and item.item_code = 'DEMO-INV-ITEM-002')
  )
on conflict (id) do update set
  category_id = excluded.category_id,
  label = excluded.label,
  unit_of_measure = excluded.unit_of_measure,
  barcode = excluded.barcode,
  current_stock = excluded.current_stock,
  reorder_level = excluded.reorder_level,
  purchase_price = excluded.purchase_price,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_inventory_movements (
  id,
  school_id,
  item_id,
  movement_code,
  movement_type,
  quantity,
  movement_date,
  reference_type,
  reference_id,
  notes,
  status,
  metadata_json
)
select
  md5(mv.movement_code)::uuid,
  s.id,
  item.id,
  mv.movement_code,
  mv.movement_type,
  mv.quantity::numeric,
  mv.movement_date::date,
  mv.reference_type,
  null,
  mv.notes,
  'active',
  mv.metadata_json
from public.angelcare360_schools s
join public.angelcare360_inventory_items item on item.school_id = s.id
join (
  values
    ('DEMO-INV-MOV-001', 'DEMO-INV-ITEM-001', 'in', 20, '2026-07-01', 'purchase_order', 'Stock added for the demo classroom supply item.', '{"demo":true}'::jsonb),
    ('DEMO-INV-MOV-002', 'DEMO-INV-ITEM-001', 'out', 6, '2026-07-09', 'class_use', 'Classroom distribution used in the morning activity.', '{"demo":true}'::jsonb)
) as mv(movement_code, item_code, movement_type, quantity, movement_date, reference_type, notes, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and item.item_code = mv.item_code
on conflict (id) do update set
  item_id = excluded.item_id,
  movement_type = excluded.movement_type,
  quantity = excluded.quantity,
  movement_date = excluded.movement_date,
  reference_type = excluded.reference_type,
  reference_id = excluded.reference_id,
  notes = excluded.notes,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

-- ---------------------------------------------------------------------------
-- Communication, notifications, claims
-- ---------------------------------------------------------------------------

insert into public.angelcare360_conversations (
  id,
  school_id,
  conversation_code,
  subject,
  conversation_type,
  status,
  last_message_at,
  metadata_json
)
select
  md5(conv.conversation_code)::uuid,
  s.id,
  conv.conversation_code,
  conv.subject,
  conv.conversation_type,
  conv.status,
  conv.last_message_at::timestamptz,
  conv.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-CONV-001', 'Suivi dossier Adam', 'parent_school', 'open', '2026-07-09T09:30:00Z', '{"demo":true,"family_code":"DEMO-FAM-01"}'::jsonb),
    ('DEMO-CONV-002', 'Relance paiement facture', 'billing_support', 'open', '2026-07-09T10:00:00Z', '{"demo":true,"billing":true}'::jsonb)
) as conv(conversation_code, subject, conversation_type, status, last_message_at, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  subject = excluded.subject,
  conversation_type = excluded.conversation_type,
  status = excluded.status,
  last_message_at = excluded.last_message_at,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_conversation_participants (
  school_id,
  conversation_id,
  participant_parent_id,
  participant_staff_id,
  participant_role,
  read_at,
  status,
  metadata_json
)
select
  s.id,
  c.id,
  par.id,
  st.id,
  part.participant_role,
  part.read_at::timestamptz,
  'active',
  part.metadata_json
from public.angelcare360_schools s
join public.angelcare360_conversations c on c.school_id = s.id
join public.angelcare360_parents par on par.school_id = s.id
join public.angelcare360_staff st on st.school_id = s.id
join (
  values
    ('DEMO-CONV-001', 'DEMO-PAR-001', 'DEMO-STF-001', 'parent', null, '{"demo":true}'::jsonb),
    ('DEMO-CONV-001', 'DEMO-PAR-001', 'DEMO-STF-006', 'staff', '2026-07-09T10:15:00Z', '{"demo":true,"read":true}'::jsonb),
    ('DEMO-CONV-002', 'DEMO-PAR-003', 'DEMO-STF-006', 'billing', null, '{"demo":true}'::jsonb)
) as part(conversation_code, parent_code, staff_code, participant_role, read_at, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and c.conversation_code = part.conversation_code
  and par.parent_code = part.parent_code
  and st.staff_code = part.staff_code
on conflict do nothing;

insert into public.angelcare360_message_templates (
  id,
  school_id,
  template_code,
  channel,
  name,
  content,
  audience_type,
  status,
  metadata_json
)
select
  md5(tpl.template_code)::uuid,
  s.id,
  tpl.template_code,
  tpl.channel,
  tpl.name,
  tpl.content,
  tpl.audience_type,
  tpl.status,
  tpl.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-MSG-TPL-001', 'email', 'Relance facture', 'Bonjour {{parent_name}}, la facture {{invoice_number}} est en attente.', 'parents', 'active', '{"demo":true,"purpose":"billing"}'::jsonb),
    ('DEMO-MSG-TPL-002', 'in_app', 'Annonce présence', 'La présence du jour a été enregistrée.', 'all', 'active', '{"demo":true,"purpose":"attendance"}'::jsonb)
) as tpl(template_code, channel, name, content, audience_type, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  channel = excluded.channel,
  name = excluded.name,
  content = excluded.content,
  audience_type = excluded.audience_type,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_messages (
  id,
  school_id,
  message_code,
  sender_app_user_id,
  sender_role,
  subject,
  body,
  message_type,
  sent_at,
  status,
  conversation_id,
  metadata_json
)
select
  md5(msg.message_code)::uuid,
  s.id,
  msg.message_code,
  null,
  msg.sender_role,
  msg.subject,
  msg.body,
  msg.message_type,
  msg.sent_at::timestamptz,
  msg.status,
  c.id,
  msg.metadata_json
from public.angelcare360_schools s
join public.angelcare360_conversations c on c.school_id = s.id
join (
  values
    ('DEMO-MSG-001', 'DEMO-CONV-001', 'staff', 'Re: dossier Adam', 'Merci pour les pièces. Le dossier est complet.', 'internal', '2026-07-09T09:40:00Z', 'sent_internal', '{"demo":true}'::jsonb),
    ('DEMO-MSG-002', 'DEMO-CONV-002', 'billing', 'Relance facture SaaS', 'La facture SaaS AngelCare 360 est en attente de règlement.', 'internal', '2026-07-09T10:05:00Z', 'sent_internal', '{"demo":true,"billing":true}'::jsonb)
) as msg(message_code, conversation_code, sender_role, subject, body, message_type, sent_at, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and c.conversation_code = msg.conversation_code
on conflict (id) do update set
  sender_app_user_id = excluded.sender_app_user_id,
  sender_role = excluded.sender_role,
  subject = excluded.subject,
  body = excluded.body,
  message_type = excluded.message_type,
  sent_at = excluded.sent_at,
  status = excluded.status,
  conversation_id = excluded.conversation_id,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_message_recipients (
  id,
  school_id,
  message_id,
  recipient_parent_id,
  recipient_staff_id,
  delivery_status,
  read_at,
  status,
  metadata_json
)
select
  rec.id::uuid,
  s.id,
  msg.id,
  par.id,
  st.id,
  rec.delivery_status,
  rec.read_at::timestamptz,
  'active',
  rec.metadata_json
from public.angelcare360_schools s
join public.angelcare360_messages msg on msg.school_id = s.id
join (
  values
    ('00000000-0000-0000-0000-000000001101', 'DEMO-MSG-001', 'DEMO-PAR-001', 'DEMO-STF-001', 'delivered_internal', '2026-07-09T09:42:00Z', '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000001102', 'DEMO-MSG-002', 'DEMO-PAR-003', 'DEMO-STF-006', 'delivered_internal', '2026-07-09T10:07:00Z', '{"demo":true}'::jsonb)
) as rec(id, message_code, parent_code, staff_code, delivery_status, read_at, metadata_json) on true
left join public.angelcare360_parents par on par.school_id = s.id and par.parent_code = rec.parent_code
left join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = rec.staff_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and msg.message_code = rec.message_code
on conflict (id) do update set
  school_id = excluded.school_id,
  message_id = excluded.message_id,
  recipient_parent_id = excluded.recipient_parent_id,
  recipient_staff_id = excluded.recipient_staff_id,
  delivery_status = excluded.delivery_status,
  read_at = excluded.read_at,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_notifications (
  id,
  school_id,
  notification_code,
  recipient_parent_id,
  recipient_staff_id,
  recipient_role,
  channel,
  title,
  body,
  action_href,
  scheduled_for,
  sent_at,
  read_at,
  status,
  metadata_json
)
select
  md5(note.notification_code)::uuid,
  s.id,
  note.notification_code,
  par.id,
  st.id,
  note.recipient_role,
  note.channel,
  note.title,
  note.body,
  note.action_href,
  note.scheduled_for::timestamptz,
  note.sent_at::timestamptz,
  note.read_at::timestamptz,
  note.status,
  note.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-NOTIF-001', 'DEMO-PAR-001', 'DEMO-STF-001', 'parent', 'email', 'Facture en attente', 'Votre facture AngelCare 360 est en attente de règlement.', '/angelcare-360-command-center/finance/invoices', '2026-07-09T10:10:00Z', '2026-07-09T10:10:00Z', null, 'sent', '{"demo":true,"billing":true}'::jsonb),
    ('DEMO-NOTIF-002', null, 'DEMO-STF-006', 'staff', 'in_app', 'Nouveau ticket finance', 'Un ticket de support finance a été ouvert.', '/angelcare-360-command-center/support', '2026-07-09T10:20:00Z', '2026-07-09T10:20:00Z', null, 'sent', '{"demo":true,"support":true}'::jsonb)
) as note(notification_code, parent_code, staff_code, recipient_role, channel, title, body, action_href, scheduled_for, sent_at, read_at, status, metadata_json) on true
left join public.angelcare360_parents par on par.school_id = s.id and par.parent_code = note.parent_code
left join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = note.staff_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (note.parent_code is null or par.parent_code = note.parent_code)
  and st.staff_code = note.staff_code
on conflict (id) do update set
  recipient_parent_id = excluded.recipient_parent_id,
  recipient_staff_id = excluded.recipient_staff_id,
  recipient_role = excluded.recipient_role,
  channel = excluded.channel,
  title = excluded.title,
  body = excluded.body,
  action_href = excluded.action_href,
  scheduled_for = excluded.scheduled_for,
  sent_at = excluded.sent_at,
  read_at = excluded.read_at,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_announcements (
  id,
  school_id,
  academic_year_id,
  announcement_code,
  title,
  body,
  audience,
  published_at,
  status,
  metadata_json
)
select
  md5(ann.announcement_code)::uuid,
  s.id,
  y.id,
  ann.announcement_code,
  ann.title,
  ann.body,
  ann.audience,
  ann.published_at::timestamptz,
  ann.status,
  ann.metadata_json
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
join (
  values
    ('DEMO-ANN-001', 'Rappel du jour', 'Merci de vérifier les sacs et le carnet de liaison.', 'parents', '2026-07-09T08:00:00Z', 'published', '{"demo":true}'::jsonb)
) as ann(announcement_code, title, body, audience, published_at, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and y.year_code = '2026-2027'
on conflict (id) do update set
  academic_year_id = excluded.academic_year_id,
  title = excluded.title,
  body = excluded.body,
  audience = excluded.audience,
  published_at = excluded.published_at,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_reclamations (
  id,
  school_id,
  reclamation_code,
  reporter_role,
  subject,
  description,
  related_entity_type,
  related_entity_id,
  priority,
  status,
  assigned_staff_id,
  category,
  submitted_by_parent_id,
  submitted_by_staff_id,
  resolution_summary,
  resolved_at,
  closed_at,
  assigned_at,
  internal_notes_json,
  status_history_json,
  metadata_json
)
select
  md5(rec.reclamation_code)::uuid,
  s.id,
  rec.reclamation_code,
  rec.reporter_role,
  rec.subject,
  rec.description,
  rec.related_entity_type,
  null,
  rec.priority,
  rec.status,
  st.id,
  rec.category,
  par.id,
  null,
  rec.resolution_summary,
  rec.resolved_at::timestamptz,
  rec.closed_at::timestamptz,
  rec.assigned_at::timestamptz,
  rec.internal_notes_json,
  rec.status_history_json,
  rec.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-REC-001', 'DEMO-PAR-001', 'DEMO-STF-001', 'parent', 'Question sur les horaires', 'Le parent demande la confirmation des horaires de dépôt.', 'general', 'high', 'open', 'attendance', null, null, '2026-07-09T10:25:00Z', '[]'::jsonb, '[{"status":"open","at":"2026-07-09T10:25:00Z"}]'::jsonb, '{"demo":true}'::jsonb),
    ('DEMO-REC-002', 'DEMO-PAR-003', 'DEMO-STF-006', 'parent', 'Incident cantine', 'Un incident de repas a été signalé puis résolu.', 'meals', 'medium', 'resolved', 'meals', 'Situation clarifiée avec la famille.', '2026-07-09T11:15:00Z', '2026-07-09T11:20:00Z', '[]'::jsonb, '[{"status":"resolved","at":"2026-07-09T11:15:00Z"}]'::jsonb, '{"demo":true}'::jsonb)
) as rec(reclamation_code, parent_code, staff_code, reporter_role, subject, description, category, priority, status, related_entity_type, resolution_summary, resolved_at, closed_at, assigned_at, internal_notes_json, status_history_json, metadata_json) on true
left join public.angelcare360_parents par on par.school_id = s.id and par.parent_code = rec.parent_code
left join public.angelcare360_staff st on st.school_id = s.id and st.staff_code = rec.staff_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and par.parent_code = rec.parent_code
  and st.staff_code = rec.staff_code
on conflict (id) do update set
  reporter_role = excluded.reporter_role,
  subject = excluded.subject,
  description = excluded.description,
  related_entity_type = excluded.related_entity_type,
  related_entity_id = excluded.related_entity_id,
  priority = excluded.priority,
  status = excluded.status,
  assigned_staff_id = excluded.assigned_staff_id,
  category = excluded.category,
  submitted_by_parent_id = excluded.submitted_by_parent_id,
  submitted_by_staff_id = excluded.submitted_by_staff_id,
  resolution_summary = excluded.resolution_summary,
  resolved_at = excluded.resolved_at,
  closed_at = excluded.closed_at,
  assigned_at = excluded.assigned_at,
  internal_notes_json = excluded.internal_notes_json,
  status_history_json = excluded.status_history_json,
  metadata_json = excluded.metadata_json;

-- ---------------------------------------------------------------------------
-- Reports, exports, PDF/A4 and document templates
-- ---------------------------------------------------------------------------

insert into public.angelcare360_reports (
  id,
  school_id,
  report_code,
  report_family,
  label,
  description,
  owner_role,
  status,
  config_json,
  metadata_json
)
select
  md5(rpt.report_code)::uuid,
  s.id,
  rpt.report_code,
  rpt.report_family,
  rpt.label,
  rpt.description,
  rpt.owner_role,
  rpt.status,
  rpt.config_json,
  rpt.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-REPORT-001', 'academics', 'Synthèse mensuelle des classes', 'Monthly academic and attendance summary for the command center.', 'direction', 'active', '{"demo":true,"scope":"academics"}'::jsonb, '{"demo":true}'::jsonb),
    ('DEMO-REPORT-002', 'finance', 'Situation facturation', 'Billing and payment collection overview for the customer school.', 'finance', 'active', '{"demo":true,"scope":"finance"}'::jsonb, '{"demo":true}'::jsonb)
) as rpt(report_code, report_family, label, description, owner_role, status, config_json, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  report_family = excluded.report_family,
  label = excluded.label,
  description = excluded.description,
  owner_role = excluded.owner_role,
  status = excluded.status,
  config_json = excluded.config_json,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_report_templates (
  id,
  school_id,
  report_id,
  template_code,
  label,
  module_key,
  report_family,
  output_format,
  description,
  config_json,
  status,
  metadata_json
)
select
  md5(tpl.template_code)::uuid,
  s.id,
  rpt.id,
  tpl.template_code,
  tpl.label,
  tpl.module_key,
  tpl.report_family,
  tpl.output_format,
  tpl.description,
  tpl.config_json,
  tpl.status,
  tpl.metadata_json
from public.angelcare360_schools s
join public.angelcare360_reports rpt on rpt.school_id = s.id
join (
  values
    ('DEMO-RPT-TPL-001', 'Synthèse mensuelle PDF/A4', 'reports', 'academics', 'pdf_a4', 'Template used to print the monthly academic summary.', '{"demo":true,"paper":"A4"}'::jsonb, 'active', '{"demo":true}'::jsonb),
    ('DEMO-RPT-TPL-002', 'Situation facturation PDF/A4', 'reports', 'finance', 'pdf_a4', 'Template used to print the billing statement.', '{"demo":true,"paper":"A4"}'::jsonb, 'active', '{"demo":true}'::jsonb)
) as tpl(template_code, label, module_key, report_family, output_format, description, config_json, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and (
    (rpt.report_code = 'DEMO-REPORT-001' and tpl.template_code = 'DEMO-RPT-TPL-001')
    or (rpt.report_code = 'DEMO-REPORT-002' and tpl.template_code = 'DEMO-RPT-TPL-002')
  )
on conflict (id) do update set
  report_id = excluded.report_id,
  label = excluded.label,
  module_key = excluded.module_key,
  report_family = excluded.report_family,
  output_format = excluded.output_format,
  description = excluded.description,
  config_json = excluded.config_json,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_report_exports (
  id,
  school_id,
  report_id,
  export_code,
  export_format,
  requested_at,
  completed_at,
  file_document_id,
  status,
  metadata_json
)
select
  md5(exp.export_code)::uuid,
  s.id,
  rpt.id,
  exp.export_code,
  exp.export_format,
  exp.requested_at::timestamptz,
  exp.completed_at::timestamptz,
  doc.id,
  exp.status,
  exp.metadata_json
from public.angelcare360_schools s
join public.angelcare360_reports rpt on rpt.school_id = s.id
join (
  values
    ('DEMO-REP-EXP-001', 'DEMO-REPORT-001', 'pdf', '2026-07-09T12:00:00Z', '2026-07-09T12:05:00Z', 'DEMO-DOC-SCHOOL-001', 'completed', '{"demo":true}'::jsonb),
    ('DEMO-REP-EXP-002', 'DEMO-REPORT-002', 'csv', '2026-07-09T12:10:00Z', '2026-07-09T12:11:00Z', null, 'completed', '{"demo":true}'::jsonb)
) as exp(export_code, report_code, export_format, requested_at, completed_at, document_code, status, metadata_json) on true
left join public.angelcare360_documents doc on doc.school_id = s.id and doc.document_code = exp.document_code
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and rpt.report_code = exp.report_code
on conflict (id) do update set
  report_id = excluded.report_id,
  export_format = excluded.export_format,
  requested_at = excluded.requested_at,
  completed_at = excluded.completed_at,
  file_document_id = excluded.file_document_id,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_report_requests (
  id,
  school_id,
  report_id,
  report_template_id,
  request_code,
  report_code,
  report_family,
  module_key,
  date_from,
  date_to,
  filters_json,
  status,
  requested_at,
  completed_at,
  result_export_id,
  result_document_id,
  error_message,
  metadata_json
)
select
  md5(req.request_code)::uuid,
  s.id,
  rpt.id,
  tpl.id,
  req.request_code,
  req.report_code,
  req.report_family,
  req.module_key,
  req.date_from::date,
  req.date_to::date,
  req.filters_json,
  req.status,
  req.requested_at::timestamptz,
  req.completed_at::timestamptz,
  exp.id,
  doc.id,
  req.error_message,
  req.metadata_json
from public.angelcare360_schools s
join public.angelcare360_reports rpt on rpt.school_id = s.id
join public.angelcare360_report_templates tpl on tpl.school_id = s.id and tpl.report_id = rpt.id
left join public.angelcare360_report_exports exp on exp.school_id = s.id and exp.report_id = rpt.id
left join public.angelcare360_documents doc on doc.school_id = s.id and doc.document_code = case when rpt.report_code = 'DEMO-REPORT-001' then 'DEMO-DOC-SCHOOL-001' else null end
join (
  values
    ('DEMO-RPT-REQ-001', 'DEMO-REPORT-001', 'academics', 'reports', '2026-06-01', '2026-07-09', '{"demo":true,"scope":"attendance"}'::jsonb, 'ready', '2026-07-09T12:00:00Z', '2026-07-09T12:05:00Z', null, '{"demo":true}'::jsonb),
    ('DEMO-RPT-REQ-002', 'DEMO-REPORT-002', 'finance', 'reports', '2026-06-01', '2026-07-09', '{"demo":true,"scope":"billing"}'::jsonb, 'ready', '2026-07-09T12:10:00Z', '2026-07-09T12:11:00Z', null, '{"demo":true}'::jsonb)
) as req(request_code, report_code, report_family, module_key, date_from, date_to, filters_json, status, requested_at, completed_at, error_message, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and rpt.report_code = req.report_code
  and tpl.template_code = case when req.report_code = 'DEMO-REPORT-001' then 'DEMO-RPT-TPL-001' else 'DEMO-RPT-TPL-002' end
on conflict (id) do update set
  report_id = excluded.report_id,
  report_template_id = excluded.report_template_id,
  report_code = excluded.report_code,
  report_family = excluded.report_family,
  module_key = excluded.module_key,
  date_from = excluded.date_from,
  date_to = excluded.date_to,
  filters_json = excluded.filters_json,
  status = excluded.status,
  requested_at = excluded.requested_at,
  completed_at = excluded.completed_at,
  result_export_id = excluded.result_export_id,
  result_document_id = excluded.result_document_id,
  error_message = excluded.error_message,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_export_files (
  id,
  school_id,
  report_export_id,
  export_code,
  file_code,
  file_name,
  file_path,
  storage_provider,
  mime_type,
  file_size_bytes,
  export_format,
  status,
  metadata_json
)
select
  md5(file.export_code || ':' || file.file_code)::uuid,
  s.id,
  exp.id,
  file.export_code,
  file.file_code,
  file.file_name,
  file.file_path,
  file.storage_provider,
  file.mime_type,
  file.file_size_bytes,
  file.export_format,
  file.status,
  file.metadata_json
from public.angelcare360_schools s
join public.angelcare360_report_exports exp on exp.school_id = s.id
join (
  values
    ('DEMO-EXP-FILE-001', 'DEMO-REP-EXP-001', 'DEMO-EXP-FILE-PDF', 'Synthese-mensuelle-A4.pdf', 'demo/exports/synthese-mensuelle-a4.pdf', 'supabase', 'application/pdf', 214000, 'pdf_a4', 'ready', '{"demo":true}'::jsonb),
    ('DEMO-EXP-FILE-002', 'DEMO-REP-EXP-002', 'DEMO-EXP-FILE-CSV', 'Situation-facturation.csv', 'demo/exports/situation-facturation.csv', 'supabase', 'text/csv', 9800, 'csv', 'ready', '{"demo":true}'::jsonb)
) as file(export_code, report_export_code, file_code, file_name, file_path, storage_provider, mime_type, file_size_bytes, export_format, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
  and exp.export_code = file.report_export_code
on conflict (id) do update set
  report_export_id = excluded.report_export_id,
  file_code = excluded.file_code,
  file_name = excluded.file_name,
  file_path = excluded.file_path,
  storage_provider = excluded.storage_provider,
  mime_type = excluded.mime_type,
  file_size_bytes = excluded.file_size_bytes,
  export_format = excluded.export_format,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_document_templates (
  id,
  school_id,
  template_code,
  label,
  document_type,
  output_format,
  description,
  retention_days,
  config_json,
  status,
  metadata_json
)
select
  md5(tpl.template_code)::uuid,
  s.id,
  tpl.template_code,
  tpl.label,
  tpl.document_type,
  tpl.output_format,
  tpl.description,
  tpl.retention_days,
  tpl.config_json,
  tpl.status,
  tpl.metadata_json
from public.angelcare360_schools s
join (
  values
    ('DEMO-DOC-TPL-001', 'A4 Summary PDF', 'report', 'pdf_a4', 'Template for A4 monthly summaries.', 365, '{"demo":true,"paper":"A4"}'::jsonb, 'ready', '{"demo":true}'::jsonb)
) as tpl(template_code, label, document_type, output_format, description, retention_days, config_json, status, metadata_json) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict (id) do update set
  label = excluded.label,
  document_type = excluded.document_type,
  output_format = excluded.output_format,
  description = excluded.description,
  retention_days = excluded.retention_days,
  config_json = excluded.config_json,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_audit_logs (
  id,
  school_id,
  actor_role,
  module,
  action,
  entity_type,
  entity_id,
  severity,
  before_data,
  after_data,
  metadata
)
select
  log.id::uuid,
  s.id,
  log.actor_role,
  log.module,
  log.action,
  log.entity_type,
  log.entity_id,
  log.severity,
  log.before_data,
  log.after_data,
  log.metadata
from public.angelcare360_schools s
join (
  values
    ('00000000-0000-0000-0000-000000001201', 'system', 'school_admin', 'client_created', 'school', null, 'info', '{}'::jsonb, '{"client_code":"AC360-DEMO-PE-CASA","status":"active"}'::jsonb, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000001202', 'finance', 'billing', 'invoice_issued', 'invoice', null, 'notice', '{}'::jsonb, '{"invoice_number":"AC360-INV-DEMO-0003","status":"overdue"}'::jsonb, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000001203', 'system', 'reports', 'report_exported', 'report', null, 'info', '{}'::jsonb, '{"report_code":"DEMO-REPORT-001","export_code":"DEMO-REP-EXP-001"}'::jsonb, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000001204', 'staff', 'communications', 'message_sent', 'message', null, 'info', '{}'::jsonb, '{"message_code":"DEMO-MSG-001"}'::jsonb, '{"demo":true}'::jsonb),
    ('00000000-0000-0000-0000-000000001205', 'staff', 'support', 'reclamation_opened', 'reclamation', null, 'warning', '{}'::jsonb, '{"reclamation_code":"DEMO-REC-001"}'::jsonb, '{"demo":true}'::jsonb)
) as log(id, actor_role, module, action, entity_type, entity_id, severity, before_data, after_data, metadata) on true
where s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL'
on conflict do nothing;

commit;
