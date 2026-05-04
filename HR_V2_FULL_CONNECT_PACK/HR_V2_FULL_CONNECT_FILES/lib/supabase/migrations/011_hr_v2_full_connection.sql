-- HR V2 Full Connection Layer
-- Run in Supabase SQL Editor after HR V2 base migration.
create extension if not exists pgcrypto;

create table if not exists public.hr_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  color text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  department text,
  family text,
  level text,
  permissions text[] default '{}',
  mission text,
  kpis text[] default '{}',
  default_shift text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  position text,
  department text,
  contract_type text,
  status text default 'active',
  manager_user_id uuid,
  start_date date,
  probation_end_date date,
  salary_base numeric,
  payroll_code text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.hr_rosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  shift_date date not null,
  start_time time,
  end_time time,
  role text,
  location text,
  status text default 'scheduled',
  duty_type text default 'standard',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending',
  coverage_impact text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_staff_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  document_type text,
  type text,
  status text default 'missing',
  file_url text,
  expires_at date,
  verified_by uuid,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  period text,
  score int,
  reliability int,
  behavior int,
  client_satisfaction int,
  mission_success int,
  compliance int,
  notes text,
  corrective_action text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  code text,
  level text,
  service_line text,
  status text default 'active',
  issued_at timestamptz default now(),
  valid_until date,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_disciplinary_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  reason text,
  severity text default 'medium',
  status text default 'open',
  created_by uuid,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.hr_staff_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text,
  message text not null,
  type text default 'memo',
  status text default 'active',
  read boolean default false,
  created_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,
  status text default 'pending',
  payload jsonb not null default '{}'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.hr_departments(name, code, color, description) values
('Executive Office','executive','#111827','Direction, governance, arbitration and cross-module command.'),
('Core Office Staff','office','#2563eb','Admin, finance, compliance, customer care and internal control.'),
('Care Operations','care_ops','#059669','Caregiver workforce, missions, field coverage, replacements and incidents.'),
('Revenue / Sales','revenue_sales','#7c3aed','Leads, partnerships, contracts, client activation and revenue execution.'),
('Marketing / Growth','marketing_growth','#db2777','Campaigns, content, ambassadors, market growth and partner network.'),
('Academy / Training','academy_training','#ea580c','Training, certification, onboarding, quality learning and placement readiness.')
on conflict(name) do update set code=excluded.code, color=excluded.color, description=excluded.description, updated_at=now();

insert into public.hr_positions(title, department, family, level, default_shift, mission, kpis) values
('CEO / General Manager','Executive Office','Core Office Staff','Executive','Leadership availability','Own company command, priorities, risk, performance and final approvals.',array['Company readiness','Revenue protection','Operational continuity']),
('Operations Manager','Core Office Staff','Core Office Staff','Manager','10:00-18:00','Coordinate daily operations, coverage, dispatching and service reliability.',array['Mission coverage','SLA compliance','Replacement speed']),
('HR Manager','Core Office Staff','Core Office Staff','Manager','10:00-18:00','Manage workforce policy, staff readiness, attendance, hiring and HR approvals.',array['Attendance compliance','Roster coverage','Staff readiness']),
('HR Officer','Core Office Staff','Core Office Staff','Officer','10:00-18:00','Operate staff files, attendance, memos, leave requests and HR follow-up.',array['Resolved HR tickets','Document completeness','Leave processing']),
('Admin Officer','Core Office Staff','Core Office Staff','Officer','10:00-18:00','Maintain administrative files, office records, contracts and internal coordination.',array['File accuracy','Admin turnaround','Document validity']),
('Finance / Billing Officer','Core Office Staff','Core Office Staff','Officer','10:00-18:00','Prepare billing, payroll inputs, contract payment checks and cost control.',array['Billing accuracy','Payroll readiness','Payment follow-up']),
('Compliance Officer','Core Office Staff','Core Office Staff','Officer','10:00-18:00','Track compliance, incidents, document validity and operational risk.',array['Compliance score','Incident closure','Audit readiness']),
('Customer Care Officer','Core Office Staff','Core Office Staff','Agent','10:00-18:00','Handle family requests, service updates, complaints and satisfaction signals.',array['Response time','Client satisfaction','Escalation quality']),
('Voice Center Agent','Core Office Staff','Core Office Staff','Agent','10:00-18:00','Operate phone support, call logging, client follow-ups and urgent routing.',array['Calls handled','Resolution rate','Follow-up completion']),
('Caregiver','Care Operations','Care Operations','Field','Roster-based','Deliver assigned care missions safely and report completion, issues and notes.',array['Mission attendance','Client feedback','Incident-free shifts']),
('Senior Caregiver','Care Operations','Care Operations','Field','Roster-based','Deliver care and support junior caregivers with standards and field feedback.',array['Quality score','Coverage reliability','Mentoring actions']),
('Care Coordinator','Care Operations','Care Operations','Officer','10:00-18:00','Coordinate caregivers, client needs, mission details and daily confirmations.',array['Coverage rate','Confirmation rate','Client updates']),
('Mission Dispatcher','Care Operations','Care Operations','Officer','10:00-18:00','Dispatch workers, monitor live mission risks and resolve assignment conflicts.',array['Dispatch speed','Uncovered missions','Late-risk reduction']),
('Roster Planner','Care Operations','Care Operations','Officer','10:00-18:00','Build monthly roster, shift patterns, capacity plans and duty coverage.',array['Roster completeness','Capacity balance','Overtime control']),
('Replacement Coordinator','Care Operations','Care Operations','Officer','10:00-18:00','Find and deploy replacement staff when absences or conflicts happen.',array['Replacement speed','Failed coverage','Escalation closure']),
('Field Supervisor','Care Operations','Care Operations','Manager','Field schedule','Supervise field quality, spot checks, caregiver coaching and urgent incidents.',array['Field checks','Quality issues closed','Caregiver readiness']),
('Quality Controller','Care Operations','Care Operations','Officer','10:00-18:00','Audit mission quality, client feedback, care standards and corrective actions.',array['Quality audits','Corrective actions','Repeat issue reduction']),
('Incident Response Officer','Care Operations','Care Operations','Officer','Rotating','Triage incidents, assign severity, coordinate response and close learning loops.',array['Response time','Closure time','Risk prevention']),
('Sales Agent','Revenue / Sales','Revenue / Sales','Agent','10:00-18:00','Handle prospects, follow-ups, quotes and conversion tasks.',array['Qualified leads','Conversion rate','Follow-up completion']),
('SDR Agent','Revenue / Sales','Revenue / Sales','Agent','10:00-18:00','Prospect, qualify leads, book meetings and maintain pipeline hygiene.',array['Meetings booked','Lead quality','Pipeline activity']),
('Sales Manager','Revenue / Sales','Revenue / Sales','Manager','10:00-18:00','Drive sales team performance, pipeline control and commercial decisions.',array['Revenue forecast','Team productivity','Close rate']),
('Partnership Officer','Revenue / Sales','Revenue / Sales','Officer','10:00-18:00','Develop partner channels, referral relationships and commercial alliances.',array['Partner leads','Active partners','Referral conversion']),
('Business Development Officer','Revenue / Sales','Revenue / Sales','Officer','10:00-18:00','Open new markets, B2B accounts, referral systems and strategic opportunities.',array['New accounts','Expansion pipeline','Opportunity value']),
('Client Success Officer','Revenue / Sales','Revenue / Sales','Officer','10:00-18:00','Support active clients, retention, renewals and satisfaction recovery.',array['Retention','Client health','Renewal actions']),
('Contract Activation Officer','Revenue / Sales','Revenue / Sales','Officer','10:00-18:00','Move signed deals into active service, billing, staffing and mission setup.',array['Activation speed','Contract completeness','Billing handoff']),
('Marketing Manager','Marketing / Growth','Marketing / Growth','Manager','10:00-18:00','Lead marketing strategy, campaigns, content systems and growth performance.',array['Campaign ROI','Content velocity','Lead contribution']),
('Campaign Officer','Marketing / Growth','Marketing / Growth','Officer','10:00-18:00','Operate campaigns, calendars, briefs, approvals and performance follow-up.',array['Campaign delivery','Approval speed','Performance actions']),
('Content Officer','Marketing / Growth','Marketing / Growth','Officer','10:00-18:00','Produce newsletters, posts, landing copy, brochures and content assets.',array['Assets produced','Quality approval','Publishing cadence']),
('SEO Officer','Marketing / Growth','Marketing / Growth','Officer','10:00-18:00','Manage SEO content, meta data, blog planning and search visibility.',array['SEO tasks closed','Pages optimized','Content ranking signals']),
('Social Media Officer','Marketing / Growth','Marketing / Growth','Officer','10:00-18:00','Plan, publish, monitor and improve Meta/social content operations.',array['Posts scheduled','Engagement actions','Response quality']),
('Ambassador Program Manager','Marketing / Growth','Marketing / Growth','Manager','10:00-18:00','Manage ambassadors, programs, incentives, territories and reporting.',array['Active ambassadors','Referral volume','Program compliance']),
('Partner Network Manager','Marketing / Growth','Marketing / Growth','Manager','10:00-18:00','Grow and manage partner network, co-marketing and business ecosystems.',array['Partner activation','Co-marketing output','Network value']),
('Brand / PR Officer','Marketing / Growth','Marketing / Growth','Officer','10:00-18:00','Protect brand quality, messaging, public materials and reputation signals.',array['Brand assets','PR actions','Visual compliance']),
('Training Manager','Academy / Training','Academy / Training','Manager','10:00-18:00','Own academy programs, training plans, readiness, certification and quality.',array['Training completion','Certification readiness','Placement quality']),
('Trainer','Academy / Training','Academy / Training','Training','Training schedule','Deliver training sessions, evaluate learners and report progress.',array['Sessions delivered','Learner progress','Evaluation quality']),
('Trainee','Academy / Training','Academy / Training','Training','Training schedule','Complete onboarding/training pathway and become placement-ready.',array['Attendance','Assessment score','Readiness progress']),
('Certification Officer','Academy / Training','Academy / Training','Officer','10:00-18:00','Validate certifications, expiry dates, documents and compliance checkpoints.',array['Valid certifications','Expired docs reduced','Audit readiness']),
('Placement Officer','Academy / Training','Academy / Training','Officer','10:00-18:00','Move trained staff into appropriate missions, roles and readiness pools.',array['Placement speed','Fit score','Post-placement quality']),
('Quality Training Auditor','Academy / Training','Academy / Training','Officer','10:00-18:00','Audit training quality, curriculum gaps, assessments and improvement loops.',array['Audit findings','Curriculum fixes','Quality score'])
on conflict(title) do update set department=excluded.department, family=excluded.family, level=excluded.level, default_shift=excluded.default_shift, mission=excluded.mission, kpis=excluded.kpis, updated_at=now();
