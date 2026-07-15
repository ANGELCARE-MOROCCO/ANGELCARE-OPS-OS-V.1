
-- AngelCare ERP 2026 Foundation Tables

create table if not exists public.branches (
  id bigint generated always as identity primary key,
  branch_name text not null,
  city text not null,
  zones text,
  status text default 'active',
  created_at timestamp default now()
);

create table if not exists public.service_catalog (
  id bigint generated always as identity primary key,
  service_code text unique,
  service_name text not null,
  service_family text,
  client_type text,
  pricing_model text,
  base_price numeric default 0,
  duration_options text,
  city_rules text,
  skill_requirements text,
  internal_checklist text,
  status text default 'active',
  created_at timestamp default now()
);

create table if not exists public.document_templates (
  id bigint generated always as identity primary key,
  template_key text unique not null,
  template_name text not null,
  category text,
  description text,
  status text default 'active',
  created_at timestamp default now()
);

create table if not exists public.sales_opportunities (
  id bigint generated always as identity primary key,
  lead_id bigint references public.leads(id) on delete set null,
  family_id bigint references public.families(id) on delete set null,
  client_type text,
  city text,
  stage text default 'new_lead',
  deal_value numeric default 0,
  campaign_source text,
  lost_reason text,
  next_follow_up_at timestamp,
  notes text,
  status text default 'open',
  created_at timestamp default now()
);

insert into public.branches (branch_name, city, zones)
values
  ('AngelCare Casablanca', 'Casablanca', 'Casa Centre, Maarif, Anfa, Bouskoura, Californie'),
  ('AngelCare Rabat', 'Rabat', 'Agdal, Hay Riad, Souissi, Centre'),
  ('AngelCare Kénitra', 'Kénitra', 'Centre, Maamora, Bir Rami'),
  ('AngelCare Témara / Salé', 'Témara / Salé', 'Témara, Harhoura, Salé')
on conflict do nothing;

insert into public.service_catalog (service_code, service_name, service_family, client_type, pricing_model, duration_options, skill_requirements, internal_checklist, status)
values
  ('#H.S', 'Garde et accompagnement d''enfants à domicile', 'Home care', 'B2C Families', 'duration_city_pricing', '3h,5h,6h,8h,10h,12h,24h', 'childcare_standard', 'family briefing, safety confirmation, mission notes', 'active'),
  ('#S.K', 'Garde et accompagnement d''enfant spécial à domicile', 'Special needs', 'B2C Families', 'premium_skill_pricing', '3h,5h,6h,8h,10h,12h', 'special_needs_home', 'needs profile, parent instructions, incident escalation', 'active'),
  ('#S.H', 'Garde et accompagnement d''enfant spécial hybride', 'Special needs hybrid', 'B2C/B2B Hybrid', 'hybrid_pricing', 'school+home', 'special_needs_hybrid', 'school coordination, family handover, daily report', 'active'),
  ('#A.B', 'Animation anniversaire', 'Events', 'B2C/B2B Events', 'package_pricing', 'event blocks', 'animation_event', 'materials, group size, schedule, safety', 'active'),
  ('#P.P', 'Garde et accompagnement bébé post accouchement', 'Postpartum', 'B2C Families', 'premium_duration_pricing', '3h,5h,8h,12h,24h', 'baby_postpartum', 'baby routine, mother support, hygiene, rest support', 'active'),
  ('#E.X', 'Excursion', 'Mobility', 'B2C/B2B', 'custom_pricing', 'half-day, full-day', 'transport_safety', 'authorization, itinerary, emergency contacts', 'active'),
  ('#S.S', 'Garde et accompagnement d''enfant spécial à l’école', 'School support', 'B2B/B2C School', 'school_day_pricing', 'school schedule', 'special_needs_school', 'school rules, handover, daily reporting', 'active'),
  ('#S.L', 'Animation et accompagnement ludique avancé à domicile', 'Education', 'B2C Families', 'program_pricing', 'sessions', 'educational_play', 'activity plan, materials, parent feedback', 'active'),
  ('#K.P', 'Animation fêtes', 'Events', 'B2C/B2B Events', 'package_pricing', 'event blocks', 'party_animation', 'program, group, equipment, setup', 'active'),
  ('#A.A', 'AngelCare Academy', 'Training', 'Academy Learners/B2B', 'program_pricing', 'program duration', 'training_delivery', 'attendance, assessment, certificate', 'active')
on conflict (service_code) do nothing;

insert into public.document_templates (template_key, template_name, category, description)
values
  ('client_contract','Client Contract','contracts','Contract template for client service agreement.'),
  ('mission_order','Mission Order','operations','Order of mission for field execution.'),
  ('caregiver_assignment','Caregiver Assignment Sheet','workforce','Assignment sheet for caregiver mission.'),
  ('daily_planning','Daily Planning Sheet','operations','Daily planning printable board.'),
  ('incident_report','Incident Report','quality','Incident report with severity and actions.'),
  ('quotation','Quotation / Devis','sales','Commercial quotation template.'),
  ('invoice_ready_summary','Invoice-ready Summary','billing','Billing preparation summary.'),
  ('family_profile','Family Profile Sheet','crm','Family profile printable sheet.'),
  ('caregiver_profile','Caregiver Profile Sheet','workforce','Caregiver profile printable sheet.'),
  ('monthly_service_report','Monthly Service Report','contracts','Monthly report for service package.'),
  ('pointage_report','Pointage Report','pointage','Attendance report.'),
  ('training_certificate','Training Certificate','academy','Training certificate template.'),
  ('service_proposal','Service Proposal PDF','sales','Premium service proposal template.')
on conflict (template_key) do nothing;
