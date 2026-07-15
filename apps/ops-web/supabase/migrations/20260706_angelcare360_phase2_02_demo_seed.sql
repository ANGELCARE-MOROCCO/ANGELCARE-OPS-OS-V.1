-- AngelCare 360 Phase 2 Demo Seed
-- Development-only demo data for the database foundation.

insert into public.angelcare360_schools (
  school_code,
  name,
  legal_name,
  school_type,
  country,
  city,
  address,
  phone,
  email,
  language,
  currency,
  timezone,
  status,
  metadata_json
)
values (
  'demo-angelcare-360',
  'École Demo AngelCare 360',
  'École Demo AngelCare 360 SARL',
  'ecole',
  'Maroc',
  'Casablanca',
  'Casablanca, Maroc',
  '+212600000000',
  'demo@angelcare360.test',
  'fr',
  'MAD',
  'Africa/Casablanca',
  'active',
  '{"demo":true,"seed":"phase_2"}'::jsonb
)
on conflict (school_code) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  school_type = excluded.school_type,
  country = excluded.country,
  city = excluded.city,
  address = excluded.address,
  phone = excluded.phone,
  email = excluded.email,
  language = excluded.language,
  currency = excluded.currency,
  timezone = excluded.timezone,
  status = excluded.status,
  metadata_json = excluded.metadata_json
returning id;

insert into public.angelcare360_school_settings (
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
  s.id,
  'fr',
  'MAD',
  'Africa/Casablanca',
  9,
  1,
  '0-20',
  10,
  true,
  true,
  'AngelCare 360',
  'YYYY-YYYY+1',
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
where s.school_code = 'demo-angelcare-360'
on conflict (school_id) do update set
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
  s.id,
  '2025-2026',
  '2025-2026',
  '2025-09-01',
  '2026-06-30',
  true,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
where s.school_code = 'demo-angelcare-360'
on conflict (school_id, year_code) do update set
  label = excluded.label,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_current = excluded.is_current,
  status = excluded.status,
  metadata_json = excluded.metadata_json
returning id;

insert into public.angelcare360_terms (
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
  s.id,
  y.id,
  'T1',
  'Premier trimestre',
  '2025-09-01',
  '2025-12-20',
  1,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
where s.school_code = 'demo-angelcare-360'
  and y.year_code = '2025-2026'
on conflict (academic_year_id, term_code) do update set
  label = excluded.label,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  order_index = excluded.order_index,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_terms (
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
  s.id,
  y.id,
  'T2',
  'Deuxième trimestre',
  '2026-01-05',
  '2026-06-30',
  2,
  'planned',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join public.angelcare360_academic_years y on y.school_id = s.id
where s.school_code = 'demo-angelcare-360'
  and y.year_code = '2025-2026'
on conflict (academic_year_id, term_code) do update set
  label = excluded.label,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  order_index = excluded.order_index,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_permissions (
  permission_key,
  domain_key,
  action_key,
  label,
  description,
  risk_level,
  status,
  metadata_json
)
select
  domain_key || '.' || action_key,
  domain_key,
  action_key,
  public.angelcare360_permission_label(domain_key, action_key),
  'Permission AngelCare 360 pour ' || public.angelcare360_permission_label(domain_key, action_key),
  case
    when domain_key in ('finance', 'paie', 'audit', 'securite') or action_key in ('delete', 'configure') then 'high'
    when action_key in ('approve', 'export', 'audit') then 'medium'
    else 'low'
  end,
  'active',
  '{"demo":true}'::jsonb
from unnest(array[
  'direction','admissions','eleves','parents','enseignants','personnel','classes','matieres','annees_scolaires','presences','emploi_du_temps','academics','examens','bulletins','finance','paiements','paie','transport','bibliotheque','inventaire','messagerie','notifications','reclamations','documents','rapports','parametres','audit','securite'
]::text[]) as domain_key
cross join unnest(array['view','create','update','delete','approve','export','assign','notify','configure','audit']::text[]) as action_key
on conflict (permission_key) do update set
  domain_key = excluded.domain_key,
  action_key = excluded.action_key,
  label = excluded.label,
  description = excluded.description,
  risk_level = excluded.risk_level,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_roles (
  school_id,
  role_key,
  label,
  description,
  scope,
  is_system_locked,
  status,
  metadata_json
)
select
  s.id,
  role_key,
  label,
  description,
  scope,
  is_system_locked,
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join (
  values
    ('super_admin', 'Super Admin', 'Administration de la plateforme', 'platform', true),
    ('direction_generale', 'Direction Générale', 'Direction générale du réseau', 'school', true),
    ('direction_etablissement', 'Direction d’Établissement', 'Pilotage d’établissement', 'school', true),
    ('administration', 'Administration', 'Administration scolaire', 'school', true),
    ('reception', 'Réception', 'Accueil et admissions', 'school', true),
    ('enseignant', 'Enseignant', 'Gestion pédagogique', 'school', true),
    ('parent', 'Parent', 'Accès famille', 'family', true),
    ('eleve', 'Élève', 'Accès apprenant', 'family', true),
    ('comptabilite', 'Comptabilité', 'Gestion financière', 'school', true),
    ('rh', 'RH / Paie', 'Ressources humaines et paie', 'school', true),
    ('transport', 'Responsable Transport', 'Transport scolaire', 'school', true),
    ('bibliotheque', 'Bibliothécaire', 'Gestion documentaire', 'school', true),
    ('qualite', 'Responsable Qualité', 'Audit et qualité', 'school', true),
    ('support', 'Support Technique', 'Assistance et sécurité', 'school', true)
) as r(role_key, label, description, scope, is_system_locked) on true
where s.school_code = 'demo-angelcare-360'
on conflict (school_id, role_key) do update set
  label = excluded.label,
  description = excluded.description,
  scope = excluded.scope,
  is_system_locked = excluded.is_system_locked,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_access_scopes (
  school_id,
  scope_key,
  scope_type,
  module_key,
  route_path,
  action_key,
  entity_type,
  label,
  status,
  metadata_json
)
select
  s.id,
  'module:' || module_key,
  'module',
  module_key,
  case
    when module_key = 'direction' then '/angelcare-360-command-center/direction'
    else null
  end,
  'view',
  'module',
  public.angelcare360_domain_label(module_key),
  'active',
  '{"demo":true}'::jsonb
from public.angelcare360_schools s
join unnest(array[
  'direction','admissions','eleves','parents','enseignants','personnel','classes','matieres','annees_scolaires','presences','emploi_du_temps','academics','examens','bulletins','finance','paiements','paie','transport','bibliotheque','inventaire','messagerie','notifications','reclamations','documents','rapports','parametres','audit','securite'
]::text[]) as module_key on true
where s.school_code = 'demo-angelcare-360'
on conflict (school_id, scope_key) do update set
  scope_type = excluded.scope_type,
  module_key = excluded.module_key,
  route_path = excluded.route_path,
  action_key = excluded.action_key,
  entity_type = excluded.entity_type,
  label = excluded.label,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_role_permissions (role_id, permission_key, effect, metadata_json)
select r.id, p.permission_key, 'allow', '{"demo":true}'::jsonb
from public.angelcare360_roles r
join public.angelcare360_permissions p
  on public.angelcare360_role_permission_allowed(r.role_key, p.domain_key, p.action_key)
where r.school_id = (select id from public.angelcare360_schools where school_code = 'demo-angelcare-360')
on conflict (role_id, permission_key) do update set
  effect = excluded.effect,
  metadata_json = excluded.metadata_json;

do $$
declare
  v_school_id uuid;
  v_year_id uuid;
  v_term1_id uuid;
  v_term2_id uuid;
  v_class_id uuid;
  v_section_id uuid;
  v_subject_math_id uuid;
  v_subject_french_id uuid;
  v_parent_id uuid;
  v_student_id uuid;
  v_staff_id uuid;
  v_teacher_comment_id uuid;
  v_lead_id uuid;
  v_application_id uuid;
  v_required_doc_id uuid;
  v_doc_id uuid;
  v_attendance_session_id uuid;
  v_attendance_record_id uuid;
  v_assignment_id uuid;
  v_exam_id uuid;
  v_mark_id uuid;
  v_report_card_id uuid;
  v_fee_structure_id uuid;
  v_fee_item_id uuid;
  v_invoice_id uuid;
  v_payment_id uuid;
  v_receipt_id uuid;
  v_payroll_period_id uuid;
  v_payroll_record_id uuid;
  v_route_id uuid;
  v_stop_id uuid;
  v_vehicle_id uuid;
  v_book_id uuid;
  v_copy_id uuid;
  v_category_id uuid;
  v_item_id uuid;
  v_message_id uuid;
  v_notification_id uuid;
  v_announcement_id uuid;
  v_reclamation_id uuid;
  v_report_id uuid;
  v_demo_user_id uuid;
begin
  select id into v_school_id from public.angelcare360_schools where school_code = 'demo-angelcare-360' limit 1;
  select id into v_year_id from public.angelcare360_academic_years where school_id = v_school_id and year_code = '2025-2026' limit 1;
  select id into v_term1_id from public.angelcare360_terms where academic_year_id = v_year_id and term_code = 'T1' limit 1;
  select id into v_term2_id from public.angelcare360_terms where academic_year_id = v_year_id and term_code = 'T2' limit 1;
  select id into v_demo_user_id from public.app_users limit 1;

  insert into public.angelcare360_classes (
    school_id, academic_year_id, class_code, name, level, capacity, order_index, status, metadata_json
  ) values (
    v_school_id, v_year_id, 'CP1', 'CP 1', 'Primaire', 28, 1, 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, academic_year_id, class_code) do update set
    name = excluded.name,
    level = excluded.level,
    capacity = excluded.capacity,
    order_index = excluded.order_index,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_class_id;

  insert into public.angelcare360_sections (
    school_id, academic_year_id, class_id, section_code, name, capacity, room, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_class_id, 'A', 'Section A', 28, 'Salle 101', 'active', '{"demo":true}'::jsonb
  )
  on conflict (class_id, section_code) do update set
    name = excluded.name,
    capacity = excluded.capacity,
    room = excluded.room,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_section_id;

  update public.angelcare360_students
    set current_class_id = v_class_id,
        current_section_id = v_section_id
  where school_id = v_school_id and student_code = 'STU-001';

  insert into public.angelcare360_subjects (
    school_id, subject_code, name, short_name, department, credit_hours, status, metadata_json
  ) values
    (v_school_id, 'MAT', 'Mathématiques', 'Maths', 'Sciences', 3, 'active', '{"demo":true}'::jsonb),
    (v_school_id, 'FRA', 'Français', 'Fr', 'Langues', 3, 'active', '{"demo":true}'::jsonb)
  on conflict (school_id, subject_code) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    department = excluded.department,
    credit_hours = excluded.credit_hours,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  select id into v_subject_math_id from public.angelcare360_subjects where school_id = v_school_id and subject_code = 'MAT' limit 1;
  select id into v_subject_french_id from public.angelcare360_subjects where school_id = v_school_id and subject_code = 'FRA' limit 1;

  insert into public.angelcare360_staff (
    school_id, staff_code, staff_type, first_name, last_name, full_name, email, phone, hire_date, department, status, metadata_json
  ) values (
    v_school_id, 'STF-001', 'enseignant', 'Amina', 'El Fassi', 'Amina El Fassi', 'amina.el-fassi@demo.test', '+212600000001', '2024-09-01', 'Pédagogie', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, staff_code) do update set
    staff_type = excluded.staff_type,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    hire_date = excluded.hire_date,
    department = excluded.department,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_staff_id;

  insert into public.angelcare360_staff_contracts (
    school_id, staff_id, contract_number, contract_type, starts_on, employment_type, salary_amount, currency, workload_percent, status, metadata_json
  ) values (
    v_school_id, v_staff_id, 'CTR-001', 'CDI', '2024-09-01', 'full_time', 6500, 'MAD', 100, 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, contract_number) do update set
    contract_type = excluded.contract_type,
    starts_on = excluded.starts_on,
    employment_type = excluded.employment_type,
    salary_amount = excluded.salary_amount,
    currency = excluded.currency,
    workload_percent = excluded.workload_percent,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_teacher_assignments (
    school_id, academic_year_id, staff_id, class_id, section_id, subject_id, assignment_role, weekly_hours, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_staff_id, v_class_id, v_section_id, v_subject_math_id, 'teacher', 12, 'active', '{"demo":true}'::jsonb
  )
  on conflict (staff_id, academic_year_id, class_id, subject_id) do update set
    section_id = excluded.section_id,
    assignment_role = excluded.assignment_role,
    weekly_hours = excluded.weekly_hours,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_parents (
    school_id, parent_code, first_name, last_name, full_name, email, phone, whatsapp, preferred_language, status, metadata_json
  ) values (
    v_school_id, 'PAR-001', 'Hassan', 'Benali', 'Hassan Benali', 'hassan.benali@demo.test', '+212600000002', '+212600000002', 'fr', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, parent_code) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    preferred_language = excluded.preferred_language,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_parent_id;

  insert into public.angelcare360_students (
    school_id, student_code, first_name, last_name, full_name, date_of_birth, admission_status, status, admission_date, transport_required, metadata_json
  ) values (
    v_school_id, 'STU-001', 'Yasmine', 'Benali', 'Yasmine Benali', '2015-04-18', 'enrolled', 'active', '2025-09-01', false, '{"demo":true}'::jsonb
  )
  on conflict (school_id, student_code) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    full_name = excluded.full_name,
    date_of_birth = excluded.date_of_birth,
    admission_status = excluded.admission_status,
    status = excluded.status,
    admission_date = excluded.admission_date,
    transport_required = excluded.transport_required,
    metadata_json = excluded.metadata_json
  returning id into v_student_id;

  update public.angelcare360_students
    set current_class_id = v_class_id,
        current_section_id = v_section_id
  where id = v_student_id;

  insert into public.angelcare360_student_parent_links (
    school_id, student_id, parent_id, relationship_type, is_primary, is_guardian, can_pickup, can_receive_messages, can_pay_fees, status, metadata_json
  ) values (
    v_school_id, v_student_id, v_parent_id, 'père', true, true, true, true, true, 'active', '{"demo":true}'::jsonb
  )
  on conflict (student_id, parent_id) do update set
    relationship_type = excluded.relationship_type,
    is_primary = excluded.is_primary,
    is_guardian = excluded.is_guardian,
    can_pickup = excluded.can_pickup,
    can_receive_messages = excluded.can_receive_messages,
    can_pay_fees = excluded.can_pay_fees,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_emergency_contacts (
    school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, priority, status, metadata_json
  ) values (
    v_school_id, 'student', v_student_id, 'Hassan Benali', 'père', '+212600000002', 'hassan.benali@demo.test', 1, 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_class_subjects (
    school_id, academic_year_id, class_id, subject_id, teacher_id, coefficient, is_required, status, metadata_json
  ) values
    (v_school_id, v_year_id, v_class_id, v_subject_math_id, v_staff_id, 2, true, 'active', '{"demo":true}'::jsonb),
    (v_school_id, v_year_id, v_class_id, v_subject_french_id, v_staff_id, 2, true, 'active', '{"demo":true}'::jsonb)
  on conflict (class_id, subject_id, academic_year_id) do update set
    teacher_id = excluded.teacher_id,
    coefficient = excluded.coefficient,
    is_required = excluded.is_required,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_admission_leads (
    school_id, lead_code, parent_name, parent_phone, parent_email, student_full_name, desired_level, source_channel, assigned_staff_id, contacted_at, status, metadata_json
  ) values (
    v_school_id, 'LEAD-001', 'Hassan Benali', '+212600000002', 'hassan.benali@demo.test', 'Yasmine Benali', 'CP1', 'formulaire', v_staff_id, now(), 'contacted', '{"demo":true}'::jsonb
  )
  on conflict (school_id, lead_code) do update set
    parent_name = excluded.parent_name,
    parent_phone = excluded.parent_phone,
    parent_email = excluded.parent_email,
    student_full_name = excluded.student_full_name,
    desired_level = excluded.desired_level,
    source_channel = excluded.source_channel,
    assigned_staff_id = excluded.assigned_staff_id,
    contacted_at = excluded.contacted_at,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_lead_id;

  insert into public.angelcare360_admission_required_documents (
    school_id, academic_year_id, document_key, title, description, required_for_stage, sort_order, status, metadata_json
  ) values
    (v_school_id, v_year_id, 'acte-naissance', 'Acte de naissance', 'Copie de l’acte de naissance', 'documents', 1, 'active', '{"demo":true}'::jsonb),
    (v_school_id, v_year_id, 'photo-identite', 'Photo d’identité', 'Photo de l’élève', 'documents', 2, 'active', '{"demo":true}'::jsonb)
  on conflict (school_id, document_key) do update set
    title = excluded.title,
    description = excluded.description,
    required_for_stage = excluded.required_for_stage,
    sort_order = excluded.sort_order,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  select id into v_required_doc_id from public.angelcare360_admission_required_documents where school_id = v_school_id and document_key = 'acte-naissance' limit 1;

  insert into public.angelcare360_documents (
    school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, uploaded_by, metadata_json
  ) values (
    v_school_id, 'DOC-001', 'admission_application', v_lead_id, 'admission', 'Acte de naissance - Démo', 'acte-naissance-demo.pdf', 'demo/angelcare360/acte-naissance-demo.pdf', 'supabase', 'application/pdf', 102400, 'school', 'active', null, '{"demo":true}'::jsonb
  )
  on conflict (school_id, document_code) do update set
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
    metadata_json = excluded.metadata_json
  returning id into v_doc_id;

  insert into public.angelcare360_admission_applications (
    school_id, application_code, lead_id, parent_id, student_id, academic_year_id, class_id, section_id, application_stage, application_date, status, metadata_json
  ) values (
    v_school_id, 'APP-001', v_lead_id, v_parent_id, v_student_id, v_year_id, v_class_id, v_section_id, 'documents_collecting', current_date, 'in_review', '{"demo":true}'::jsonb
  )
  on conflict (school_id, application_code) do update set
    lead_id = excluded.lead_id,
    parent_id = excluded.parent_id,
    student_id = excluded.student_id,
    academic_year_id = excluded.academic_year_id,
    class_id = excluded.class_id,
    section_id = excluded.section_id,
    application_stage = excluded.application_stage,
    application_date = excluded.application_date,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_application_id;

  insert into public.angelcare360_admission_status_history (
    school_id, application_id, from_status, to_status, note, changed_at, metadata_json
  ) values (
    v_school_id, v_application_id, 'draft', 'in_review', 'Dossier reçu par la réception', now(), '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_admission_document_submissions (
    school_id, application_id, required_document_id, document_id, submitted_at, verification_status, status, metadata_json
  ) values (
    v_school_id, v_application_id, v_required_doc_id, v_doc_id, now(), 'complete', 'active', '{"demo":true}'::jsonb
  )
  on conflict (application_id, required_document_id) do update set
    document_id = excluded.document_id,
    submitted_at = excluded.submitted_at,
    verification_status = excluded.verification_status,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_attendance_sessions (
    school_id, academic_year_id, class_id, section_id, session_date, session_type, taken_by, source, total_expected, total_present, total_absent, total_late, total_excused, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_class_id, v_section_id, current_date, 'daily', null, 'manual', 1, 1, 0, 0, 0, 'open', '{"demo":true}'::jsonb
  )
  on conflict (class_id, section_id, session_date, session_type) do update set
    total_expected = excluded.total_expected,
    total_present = excluded.total_present,
    total_absent = excluded.total_absent,
    total_late = excluded.total_late,
    total_excused = excluded.total_excused,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_attendance_session_id;

  insert into public.angelcare360_attendance_records (
    school_id, attendance_session_id, student_id, attendance_status, mark_source, status, metadata_json
  ) values (
    v_school_id, v_attendance_session_id, v_student_id, 'present', 'manual', 'active', '{"demo":true}'::jsonb
  )
  on conflict (attendance_session_id, student_id) do update set
    attendance_status = excluded.attendance_status,
    mark_source = excluded.mark_source,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_attendance_record_id;

  insert into public.angelcare360_attendance_status_history (
    school_id, attendance_record_id, from_status, to_status, changed_at, note, metadata_json
  ) values (
    v_school_id, v_attendance_record_id, 'unknown', 'present', now(), 'Présence démo enregistrée', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_attendance_justifications (
    school_id, attendance_record_id, justification_code, reason_category, description, submitted_at, decision, status, metadata_json
  ) values (
    v_school_id, v_attendance_record_id, 'JUST-001', 'aucune', 'Aucune justification nécessaire pour la séance démo', now(), 'pending', 'active', '{"demo":true}'::jsonb
  )
  on conflict (attendance_record_id) do update set
    justification_code = excluded.justification_code,
    reason_category = excluded.reason_category,
    description = excluded.description,
    submitted_at = excluded.submitted_at,
    decision = excluded.decision,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_timetable_slots (
    school_id, academic_year_id, class_id, section_id, subject_id, staff_id, day_of_week, start_time, end_time, room, slot_type, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_class_id, v_section_id, v_subject_math_id, v_staff_id, 1, '08:30', '09:30', 'Salle 101', 'regular', 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_school_calendar_events (
    school_id, academic_year_id, event_code, title, description, event_type, starts_on, ends_on, all_day, audience, status, metadata_json
  ) values (
    v_school_id, v_year_id, 'CAL-OPEN-001', 'Rentrée scolaire', 'Ouverture de l’année démo', 'school_event', '2025-09-01', '2025-09-01', true, 'all', 'published', '{"demo":true}'::jsonb
  )
  on conflict (school_id, event_code) do update set
    title = excluded.title,
    description = excluded.description,
    event_type = excluded.event_type,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    all_day = excluded.all_day,
    audience = excluded.audience,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_lessons (
    school_id, academic_year_id, class_id, section_id, subject_id, staff_id, lesson_code, lesson_date, topic, objectives, homework_summary, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_class_id, v_section_id, v_subject_math_id, v_staff_id, 'LES-001', current_date, 'Nombres et calcul', 'Comprendre les nombres', 'Exercices de base', 'completed', '{"demo":true}'::jsonb
  )
  on conflict (school_id, lesson_code) do update set
    lesson_date = excluded.lesson_date,
    topic = excluded.topic,
    objectives = excluded.objectives,
    homework_summary = excluded.homework_summary,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_assignments (
    school_id, academic_year_id, class_id, section_id, subject_id, created_by_staff_id, assignment_code, title, description, due_on, max_score, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_class_id, v_section_id, v_subject_math_id, v_staff_id, 'HW-001', 'Devoir de calcul', 'Révision des additions', current_date + interval '7 days', 20, 'published', '{"demo":true}'::jsonb
  )
  on conflict (school_id, assignment_code) do update set
    title = excluded.title,
    description = excluded.description,
    due_on = excluded.due_on,
    max_score = excluded.max_score,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_assignment_id;

  insert into public.angelcare360_assignment_submissions (
    school_id, assignment_id, student_id, submitted_at, score, feedback, status, metadata_json
  ) values (
    v_school_id, v_assignment_id, v_student_id, now(), 18, 'Travail correct', 'graded', '{"demo":true}'::jsonb
  )
  on conflict (assignment_id, student_id) do update set
    submitted_at = excluded.submitted_at,
    score = excluded.score,
    feedback = excluded.feedback,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_exams (
    school_id, academic_year_id, class_id, section_id, subject_id, exam_code, title, exam_type, scheduled_on, duration_minutes, max_score, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_class_id, v_section_id, v_subject_math_id, 'EX-001', 'Contrôle de mathématiques', 'interro', current_date + interval '14 days', 60, 20, 'planned', '{"demo":true}'::jsonb
  )
  on conflict (school_id, exam_code) do update set
    title = excluded.title,
    exam_type = excluded.exam_type,
    scheduled_on = excluded.scheduled_on,
    duration_minutes = excluded.duration_minutes,
    max_score = excluded.max_score,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_exam_id;

  insert into public.angelcare360_exam_sessions (
    school_id, exam_id, session_code, room, starts_at, ends_at, invigilator_staff_id, status, metadata_json
  ) values (
    v_school_id, v_exam_id, 'EXS-001', 'Salle 101', now() + interval '14 days', now() + interval '14 days' + interval '1 hour', v_staff_id, 'planned', '{"demo":true}'::jsonb
  )
  on conflict (exam_id, session_code) do update set
    room = excluded.room,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    invigilator_staff_id = excluded.invigilator_staff_id,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_marks (
    school_id, academic_year_id, student_id, subject_id, exam_id, assessment_type, score, max_score, grade, recorded_by_staff_id, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_student_id, v_subject_math_id, v_exam_id, 'exam', 17, 20, 'A', v_staff_id, 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing
  returning id into v_mark_id;

  insert into public.angelcare360_teacher_comments (
    school_id, academic_year_id, student_id, class_id, section_id, term_id, staff_id, comment_type, comment_text, rating, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_student_id, v_class_id, v_section_id, v_term1_id, v_staff_id, 'appreciation', 'Très bon niveau et participation sérieuse.', 5, 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing
  returning id into v_teacher_comment_id;

  insert into public.angelcare360_report_cards (
    school_id, academic_year_id, student_id, class_id, section_id, term_id, report_card_code, generated_on, overall_average, rank_position, attendance_summary, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_student_id, v_class_id, v_section_id, v_term1_id, 'RPT-001', current_date, 17.5, 1, '1 présence sur 1 séance', 'published', '{"demo":true}'::jsonb
  )
  on conflict (school_id, report_card_code) do update set
    generated_on = excluded.generated_on,
    overall_average = excluded.overall_average,
    rank_position = excluded.rank_position,
    attendance_summary = excluded.attendance_summary,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_report_card_id;

  insert into public.angelcare360_report_card_lines (
    school_id, report_card_id, subject_id, teacher_comment_id, mark_average, coefficient, letter_grade, remarks, status, metadata_json
  ) values (
    v_school_id, v_report_card_id, v_subject_math_id, v_teacher_comment_id, 17.5, 2, 'A', 'Excellent', 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_fee_structures (
    school_id, academic_year_id, fee_code, label, description, due_day_of_month, currency, applies_to_level, status, metadata_json
  ) values (
    v_school_id, v_year_id, 'FEE-PRIMAIRE', 'Frais primaire', 'Structure de frais primaire', 5, 'MAD', 'Primaire', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, fee_code) do update set
    label = excluded.label,
    description = excluded.description,
    due_day_of_month = excluded.due_day_of_month,
    currency = excluded.currency,
    applies_to_level = excluded.applies_to_level,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_fee_structure_id;

  insert into public.angelcare360_fee_items (
    school_id, fee_structure_id, item_code, label, fee_type, amount, due_on, is_required, status, metadata_json
  ) values (
    v_school_id, v_fee_structure_id, 'TUITION', 'Scolarité', 'tuition', 2500, '2025-09-05', true, 'active', '{"demo":true}'::jsonb
  )
  on conflict (fee_structure_id, item_code) do update set
    label = excluded.label,
    fee_type = excluded.fee_type,
    amount = excluded.amount,
    due_on = excluded.due_on,
    is_required = excluded.is_required,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_fee_item_id;

  insert into public.angelcare360_student_fee_assignments (
    school_id, academic_year_id, student_id, fee_structure_id, assigned_on, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_student_id, v_fee_structure_id, current_date, 'active', '{"demo":true}'::jsonb
  )
  on conflict (student_id, academic_year_id, fee_structure_id) do update set
    assigned_on = excluded.assigned_on,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_invoices (
    school_id, academic_year_id, student_id, invoice_number, invoice_type, invoice_date, due_date, currency, subtotal_amount, discount_total, tax_total, total_amount, amount_paid, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_student_id, 'INV-0001', 'tuition', current_date, current_date + 15, 'MAD', 2500, 0, 0, 2500, 0, 'issued', '{"demo":true}'::jsonb
  )
  on conflict (school_id, invoice_number) do update set
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
    metadata_json = excluded.metadata_json
  returning id into v_invoice_id;

  insert into public.angelcare360_invoice_lines (
    school_id, invoice_id, fee_item_id, line_code, label, quantity, unit_amount, line_total, status, metadata_json
  ) values (
    v_school_id, v_invoice_id, v_fee_item_id, 'LINE-001', 'Scolarité', 1, 2500, 2500, 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_payments (
    school_id, academic_year_id, invoice_id, student_id, payment_number, payment_date, method, amount, allocated_amount, reference, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_invoice_id, v_student_id, 'PAY-0001', current_date, 'cash', 2500, 2500, 'RCPT-0001', 'confirmed', '{"demo":true}'::jsonb
  )
  on conflict (school_id, payment_number) do update set
    payment_date = excluded.payment_date,
    method = excluded.method,
    amount = excluded.amount,
    allocated_amount = excluded.allocated_amount,
    reference = excluded.reference,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_payment_id;

  insert into public.angelcare360_receipts (
    school_id, payment_id, receipt_number, issued_at, status, metadata_json
  ) values (
    v_school_id, v_payment_id, 'RCPT-0001', now(), 'issued', '{"demo":true}'::jsonb
  )
  on conflict (school_id, receipt_number) do update set
    issued_at = excluded.issued_at,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_receipt_id;

  insert into public.angelcare360_discounts (
    school_id, academic_year_id, student_id, invoice_id, discount_code, discount_type, amount, reason, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_student_id, v_invoice_id, 'DISC-001', 'remise fratrie', 0, 'Démo', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, discount_code) do update set
    academic_year_id = excluded.academic_year_id,
    student_id = excluded.student_id,
    invoice_id = excluded.invoice_id,
    discount_type = excluded.discount_type,
    amount = excluded.amount,
    reason = excluded.reason,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_payment_reminders (
    school_id, invoice_id, student_id, reminder_code, reminder_type, scheduled_for, channel, status, metadata_json
  ) values (
    v_school_id, v_invoice_id, v_student_id, 'REM-001', 'relance_echeance', now() + interval '5 days', 'email', 'scheduled', '{"demo":true}'::jsonb
  )
  on conflict (invoice_id, reminder_code) do update set
    student_id = excluded.student_id,
    reminder_type = excluded.reminder_type,
    scheduled_for = excluded.scheduled_for,
    channel = excluded.channel,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_finance_accounts (
    school_id, account_code, label, account_type, currency, opening_balance, status, metadata_json
  ) values (
    v_school_id, 'CASH-001', 'Caisse principale', 'asset', 'MAD', 0, 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, account_code) do update set
    label = excluded.label,
    account_type = excluded.account_type,
    currency = excluded.currency,
    opening_balance = excluded.opening_balance,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_expenses (
    school_id, academic_year_id, expense_code, expense_date, category, vendor_name, amount, currency, payment_method, status, notes, metadata_json
  ) values (
    v_school_id, v_year_id, 'EXP-001', current_date, 'fournitures', 'Papeterie Démo', 120, 'MAD', 'cash', 'approved', 'Achat de fournitures', '{"demo":true}'::jsonb
  )
  on conflict (school_id, expense_code) do update set
    academic_year_id = excluded.academic_year_id,
    expense_date = excluded.expense_date,
    category = excluded.category,
    vendor_name = excluded.vendor_name,
    amount = excluded.amount,
    currency = excluded.currency,
    payment_method = excluded.payment_method,
    status = excluded.status,
    notes = excluded.notes,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_payroll_periods (
    school_id, academic_year_id, period_code, label, starts_on, ends_on, payment_date, status, metadata_json
  ) values (
    v_school_id, v_year_id, 'P-2025-09', 'Septembre 2025', '2025-09-01', '2025-09-30', '2025-10-05', 'open', '{"demo":true}'::jsonb
  )
  on conflict (school_id, period_code) do update set
    label = excluded.label,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    payment_date = excluded.payment_date,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_payroll_period_id;

  insert into public.angelcare360_payroll_records (
    school_id, payroll_period_id, staff_id, payroll_number, base_salary, gross_amount, deductions_total, bonuses_total, net_amount, payment_status, status, metadata_json
  ) values (
    v_school_id, v_payroll_period_id, v_staff_id, 'PAYR-0001', 6500, 6650, 150, 300, 6500, 'pending', 'approved', '{"demo":true}'::jsonb
  )
  on conflict (school_id, payroll_number) do update set
    payroll_period_id = excluded.payroll_period_id,
    base_salary = excluded.base_salary,
    gross_amount = excluded.gross_amount,
    deductions_total = excluded.deductions_total,
    bonuses_total = excluded.bonuses_total,
    net_amount = excluded.net_amount,
    payment_status = excluded.payment_status,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_payroll_record_id;

  insert into public.angelcare360_payroll_items (
    school_id, payroll_record_id, item_code, item_type, label, amount, notes, status, metadata_json
  ) values
    (v_school_id, v_payroll_record_id, 'BONUS-001', 'bonus', 'Prime mensuelle', 300, 'Démo', 'active', '{"demo":true}'::jsonb),
    (v_school_id, v_payroll_record_id, 'DED-001', 'deduction', 'Absence', 150, 'Démo', 'active', '{"demo":true}'::jsonb)
  on conflict (payroll_record_id, item_code) do update set
    item_type = excluded.item_type,
    label = excluded.label,
    amount = excluded.amount,
    notes = excluded.notes,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_transport_routes (
    school_id, route_code, label, route_type, status, metadata_json
  ) values (
    v_school_id, 'BUS-001', 'Circuit Centre-Ville', 'school_bus', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, route_code) do update set
    label = excluded.label,
    route_type = excluded.route_type,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_route_id;

  insert into public.angelcare360_transport_stops (
    school_id, route_id, stop_code, label, order_index, planned_time, status, metadata_json
  ) values (
    v_school_id, v_route_id, 'STOP-001', 'Arrêt Centre', 1, '07:45', 'active', '{"demo":true}'::jsonb
  )
  on conflict (route_id, stop_code) do update set
    label = excluded.label,
    order_index = excluded.order_index,
    planned_time = excluded.planned_time,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_stop_id;

  insert into public.angelcare360_transport_vehicles (
    school_id, vehicle_code, plate_number, model, capacity_seats, assigned_driver_staff_id, status, metadata_json
  ) values (
    v_school_id, 'VEH-001', 'AA-000-BB', 'Mercedes Sprinter', 20, v_staff_id, 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, vehicle_code) do update set
    plate_number = excluded.plate_number,
    model = excluded.model,
    capacity_seats = excluded.capacity_seats,
    assigned_driver_staff_id = excluded.assigned_driver_staff_id,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_vehicle_id;

  insert into public.angelcare360_transport_assignments (
    school_id, academic_year_id, route_id, student_id, vehicle_id, pickup_stop_id, assigned_on, status, metadata_json
  ) values (
    v_school_id, v_year_id, v_route_id, v_student_id, v_vehicle_id, v_stop_id, current_date, 'active', '{"demo":true}'::jsonb
  )
  on conflict (student_id, academic_year_id) do update set
    route_id = excluded.route_id,
    vehicle_id = excluded.vehicle_id,
    pickup_stop_id = excluded.pickup_stop_id,
    assigned_on = excluded.assigned_on,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_library_books (
    school_id, book_code, isbn, title, author, publisher, category, language, status, metadata_json
  ) values (
    v_school_id, 'BOOK-001', '9780000000001', 'Maths Faciles', 'Équipe pédagogique', 'AngelCare Press', 'maths', 'fr', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, book_code) do update set
    isbn = excluded.isbn,
    title = excluded.title,
    author = excluded.author,
    publisher = excluded.publisher,
    category = excluded.category,
    language = excluded.language,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_book_id;

  insert into public.angelcare360_library_copies (
    school_id, book_id, copy_code, barcode, acquisition_date, shelf_location, condition, status, metadata_json
  ) values (
    v_school_id, v_book_id, 'COPY-001', 'BAR-001', current_date, 'Rayon A1', 'good', 'available', '{"demo":true}'::jsonb
  )
  on conflict (school_id, copy_code) do update set
    barcode = excluded.barcode,
    acquisition_date = excluded.acquisition_date,
    shelf_location = excluded.shelf_location,
    condition = excluded.condition,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_copy_id;

  insert into public.angelcare360_library_loans (
    school_id, copy_id, borrower_type, borrower_student_id, due_at, status, metadata_json
  ) values (
    v_school_id, v_copy_id, 'student', v_student_id, now() + interval '14 days', 'open', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_inventory_categories (
    school_id, category_code, label, description, status, metadata_json
  ) values (
    v_school_id, 'CAT-001', 'Fournitures scolaires', 'Papeterie et fournitures', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, category_code) do update set
    label = excluded.label,
    description = excluded.description,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_category_id;

  insert into public.angelcare360_inventory_items (
    school_id, category_id, item_code, label, unit_of_measure, current_stock, reorder_level, purchase_price, status, metadata_json
  ) values (
    v_school_id, v_category_id, 'ITEM-001', 'Cahiers', 'pièce', 120, 20, 3.5, 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, item_code) do update set
    category_id = excluded.category_id,
    label = excluded.label,
    unit_of_measure = excluded.unit_of_measure,
    current_stock = excluded.current_stock,
    reorder_level = excluded.reorder_level,
    purchase_price = excluded.purchase_price,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_item_id;

  insert into public.angelcare360_inventory_movements (
    school_id, item_id, movement_code, movement_type, quantity, movement_date, performed_by, notes, status, metadata_json
  ) values (
    v_school_id, v_item_id, 'MOV-001', 'in', 120, current_date, v_demo_user_id, 'Réassort démo', 'active', '{"demo":true}'::jsonb
  )
  on conflict (school_id, movement_code) do update set
    movement_type = excluded.movement_type,
    quantity = excluded.quantity,
    movement_date = excluded.movement_date,
    performed_by = excluded.performed_by,
    notes = excluded.notes,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_messages (
    school_id, message_code, sender_app_user_id, sender_role, subject, body, message_type, sent_at, status, metadata_json
  ) values (
    v_school_id, 'MSG-001', null, 'administration', 'Bienvenue dans AngelCare 360', 'Message de démonstration pour la messagerie interne.', 'internal', now(), 'sent', '{"demo":true}'::jsonb
  )
  on conflict (school_id, message_code) do update set
    subject = excluded.subject,
    body = excluded.body,
    message_type = excluded.message_type,
    sent_at = excluded.sent_at,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_message_id;

  insert into public.angelcare360_message_recipients (
    school_id, message_id, recipient_student_id, delivery_status, status, metadata_json
  ) values (
    v_school_id, v_message_id, v_student_id, 'delivered', 'active', '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  insert into public.angelcare360_notifications (
    school_id, notification_code, recipient_app_user_id, recipient_role, channel, title, body, scheduled_for, sent_at, status, metadata_json
  ) values (
    v_school_id, 'NOTIF-001', null, 'parent', 'in_app', 'Rappel de paiement', 'Votre facture démo est prête.', now(), now(), 'sent', '{"demo":true}'::jsonb
  )
  on conflict (school_id, notification_code) do update set
    recipient_role = excluded.recipient_role,
    channel = excluded.channel,
    title = excluded.title,
    body = excluded.body,
    scheduled_for = excluded.scheduled_for,
    sent_at = excluded.sent_at,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_notification_id;

  insert into public.angelcare360_announcements (
    school_id, academic_year_id, announcement_code, title, body, audience, published_at, status, metadata_json
  ) values (
    v_school_id, v_year_id, 'ANN-001', 'Rentrée 2025-2026', 'Bienvenue à toutes les familles.', 'all', now(), 'published', '{"demo":true}'::jsonb
  )
  on conflict (school_id, announcement_code) do update set
    academic_year_id = excluded.academic_year_id,
    title = excluded.title,
    body = excluded.body,
    audience = excluded.audience,
    published_at = excluded.published_at,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_announcement_id;

  insert into public.angelcare360_reclamations (
    school_id, reclamation_code, submitted_by_app_user_id, reporter_role, subject, description, priority, status, metadata_json
  ) values (
    v_school_id, 'REC-001', null, 'parent', 'Question sur la facture', 'Réclamation démo de suivi client.', 'medium', 'open', '{"demo":true}'::jsonb
  )
  on conflict (school_id, reclamation_code) do update set
    reporter_role = excluded.reporter_role,
    subject = excluded.subject,
    description = excluded.description,
    priority = excluded.priority,
    status = excluded.status,
    metadata_json = excluded.metadata_json
  returning id into v_reclamation_id;

  insert into public.angelcare360_reports (
    school_id, report_code, report_family, label, description, owner_role, status, config_json, metadata_json
  ) values (
    v_school_id, 'RPT-COMMAND', 'pilotage', 'Rapport de pilotage', 'Rapport de synthèse phase 2', 'direction_generale', 'active', '{"demo":true}'::jsonb, '{"demo":true}'::jsonb
  )
  on conflict (school_id, report_code) do update set
    report_family = excluded.report_family,
    label = excluded.label,
    description = excluded.description,
    owner_role = excluded.owner_role,
    status = excluded.status,
    config_json = excluded.config_json,
    metadata_json = excluded.metadata_json
  returning id into v_report_id;

  insert into public.angelcare360_report_exports (
    school_id, report_id, export_code, export_format, requested_at, status, metadata_json
  ) values (
    v_school_id, v_report_id, 'EXP-RPT-001', 'pdf', now(), 'requested', '{"demo":true}'::jsonb
  )
  on conflict (school_id, export_code) do update set
    report_id = excluded.report_id,
    export_format = excluded.export_format,
    requested_at = excluded.requested_at,
    status = excluded.status,
    metadata_json = excluded.metadata_json;

  insert into public.angelcare360_audit_logs (
    school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata
  ) values (
    v_school_id, null, 'super_admin', 'bootstrap', 'seed_demo_data', 'school', v_school_id, 'notice', '127.0.0.1', 'demo-seed', 'seed-phase2', '{}'::jsonb, '{"seeded":true}'::jsonb, '{"demo":true}'::jsonb
  )
  on conflict do nothing;

  select id into v_demo_user_id from public.app_users limit 1;
  if v_demo_user_id is not null then
    insert into public.angelcare360_user_roles (
      school_id, app_user_id, role_id, status, metadata_json
    )
    select
      v_school_id,
      v_demo_user_id,
      r.id,
      'active',
      '{"demo":true}'::jsonb
    from public.angelcare360_roles r
    where r.school_id = v_school_id
      and r.role_key in ('super_admin', 'direction_generale')
    on conflict (school_id, app_user_id, role_id) do update set
      status = excluded.status,
      metadata_json = excluded.metadata_json;
  end if;
end $$;
