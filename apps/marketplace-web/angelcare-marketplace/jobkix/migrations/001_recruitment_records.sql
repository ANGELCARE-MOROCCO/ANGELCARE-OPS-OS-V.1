-- JOBKIX execution contract §§21–25. Additive authoring only; never auto-run by installer.
-- Required existing authority: Supabase auth.users/auth.uid(), anon/authenticated/service_role.
begin;
do $$ begin
  if to_regclass('auth.users') is null then raise exception 'JOBKIX_REQUIRES_SUPABASE_AUTH'; end if;
  if to_regclass('public.jobkix_accounts') is not null then raise exception 'JOBKIX_SCHEMA_COLLISION'; end if;
end $$;

create table public.jobkix_schema_versions(version integer primary key, installed_at timestamptz not null default now());
create table public.jobkix_accounts(
  user_id uuid primary key references auth.users(id),
  display_name text not null default '' check(length(display_name)<=180),
  status text not null default 'active' check(status in ('active','restricted','closed')),
  preferred_locale text not null default 'en' check(preferred_locale in ('en','fr','es','hi','tl','id','ar')),
  timezone text not null default 'UTC', adult_confirmed_at timestamptz,
  notifications_email boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1 check(version>0)
);
create table public.jobkix_candidates(
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.jobkix_accounts(user_id),
  display_name text not null check(length(display_name) between 1 and 180), headline text not null default '' check(length(headline)<=240),
  summary text not null default '' check(length(summary)<=12000), country text check(country ~ '^[A-Z]{2}$'),
  skills text[] not null default '{}', occupations text[] not null default '{}', languages text[] not null default '{}',
  experience jsonb not null default '[]' check(jsonb_typeof(experience)='array'), education jsonb not null default '[]' check(jsonb_typeof(education)='array'),
  preferences jsonb not null default '{}' check(jsonb_typeof(preferences)='object'),
  discoverable boolean not null default false, discoverability_consented_at timestamptz,
  version integer not null default 1 check(version>0), updated_at timestamptz not null default now(),
  check(not discoverable or discoverability_consented_at is not null)
);
create table public.jobkix_organizations(
  id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('household','institution','healthcare','hospitality','ngo','public','multi_site')),
  public_name text not null check(length(public_name) between 2 and 180), country text not null check(country ~ '^[A-Z]{2}$'),
  original_locale text not null default 'en' check(original_locale in ('en','fr','es','hi','tl','id','ar')),
  city text not null default '' check(length(city)<=180), public_description text not null default '' check(length(public_description)<=24000),
  public_media jsonb not null default '[]' check(jsonb_typeof(public_media)='array'),
  status text not null default 'active' check(status in ('active','suspended','closed')),
  identity_reviewed_until timestamptz, identity_review_reference text, public_profile_approved_at timestamptz,
  created_by uuid not null references auth.users(id), version integer not null default 1 check(version>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.jobkix_organization_private(
  organization_id uuid primary key references public.jobkix_organizations(id), legal_name text not null default '',
  contact_email text not null default '', contact_phone text not null default '', private_address text not null default '',
  updated_at timestamptz not null default now()
);
create table public.jobkix_sites(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.jobkix_organizations(id),
  label text not null check(length(label) between 1 and 180), country text not null check(country ~ '^[A-Z]{2}$'),
  region text not null default '', city text not null default '', timezone text not null default 'UTC',
  active boolean not null default true, version integer not null default 1 check(version>0),
  unique(id,organization_id)
);
create table public.jobkix_memberships(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.jobkix_organizations(id),
  user_id uuid not null references auth.users(id), role text not null check(role in ('owner','admin','recruiter','hiring_manager','interviewer','viewer')),
  site_ids uuid[] not null default '{}', vacancy_ids uuid[] not null default '{}',
  active boolean not null default true, expires_at timestamptz, version integer not null default 1 check(version>0),
  created_at timestamptz not null default now(), unique(organization_id,user_id)
);
create table public.jobkix_invitations(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.jobkix_organizations(id),
  email text not null, token_hash text not null unique, role text not null check(role in ('admin','recruiter','hiring_manager','interviewer','viewer')),
  site_ids uuid[] not null default '{}', vacancy_ids uuid[] not null default '{}', invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null, accepted_by uuid references auth.users(id), accepted_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.jobkix_candidate_blocks(
  candidate_user_id uuid not null references public.jobkix_accounts(user_id), organization_id uuid not null references public.jobkix_organizations(id),
  created_at timestamptz not null default now(), primary key(candidate_user_id,organization_id)
);
create table public.jobkix_taxonomy(
  kind text not null check(kind in ('setting','occupation','skill','age_cohort','collection')),
  key text not null check(key ~ '^[a-z0-9][a-z0-9-]{1,100}$'), source_name_en text not null,
  localized_names jsonb not null default '{}', synonyms text[] not null default '{}',
  status text not null default 'draft' check(status in ('draft','published','archived')), sort_order integer not null default 0,
  version integer not null default 1 check(version>0), primary key(kind,key)
);
create table public.jobkix_vacancies(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.jobkix_organizations(id),
  site_id uuid, title text not null check(length(title) between 3 and 240), setting_id text not null, occupation_id text not null,
  state text not null default 'draft' check(state in ('draft','pending_review','published','paused','expired','filled','closed','archived','suspended')),
  original_locale text not null check(original_locale in ('en','fr','es','hi','tl','id','ar')),
  country text not null check(country ~ '^[A-Z]{2}$'), region text not null default '', city text not null,
  description text not null check(length(description)<=40000), duties text[] not null default '{}', requirements text[] not null default '{}', benefits text[] not null default '{}',
  public_snapshot jsonb,published_version integer,
  work_schedule text not null check(work_schedule in ('full_time','part_time','flexible')),
  contract_type text not null check(contract_type in ('permanent','fixed_term','temporary','seasonal','internship','other')),
  work_location text not null check(work_location in ('on_site','remote','hybrid')), live_in boolean not null default false,
  hours_per_week numeric check(hours_per_week between 0 and 168), languages text[] not null default '{}', age_cohorts text[] not null default '{}',
  compensation_min numeric check(compensation_min between 0 and 1000000000), compensation_max numeric check(compensation_max between 0 and 1000000000),
  currency text check(currency ~ '^[A-Z]{3}$'), compensation_unit text check(compensation_unit in ('hour','day','week','month','year')),
  overseas_applicants text not null default 'unknown' check(overseas_applicants in ('yes','no','unknown')),
  sponsorship text not null default 'unknown' check(sponsorship in ('yes','no','unknown')), relocation text not null default 'unknown' check(relocation in ('yes','no','unknown')),
  required_document boolean not null default true, published_at timestamptz, expires_at timestamptz,
  version integer not null default 1 check(version>0), reviewed_version integer, reviewed_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(site_id,organization_id) references public.jobkix_sites(id,organization_id),
  check(compensation_min is null or compensation_max is null or compensation_min<=compensation_max),
  check((compensation_min is null and compensation_max is null) or (currency is not null and compensation_unit is not null)),
  check(expires_at is null or published_at is null or expires_at>published_at)
);
create index jobkix_vacancies_discovery on public.jobkix_vacancies(state,country,setting_id,published_at desc);
create index jobkix_vacancies_org on public.jobkix_vacancies(organization_id,site_id,state);
create table public.jobkix_vacancy_revisions(
  vacancy_id uuid not null references public.jobkix_vacancies(id), version integer not null, snapshot jsonb not null,
  edited_by uuid not null references auth.users(id), created_at timestamptz not null default now(), primary key(vacancy_id,version)
);
create table public.jobkix_screening_questions(
  id uuid primary key default gen_random_uuid(), vacancy_id uuid not null references public.jobkix_vacancies(id),
  label text not null check(length(label) between 1 and 500), kind text not null check(kind in ('text','yes_no')),
  required boolean not null default true, max_length integer not null default 2000 check(max_length between 1 and 10000),
  position integer not null check(position>=0), unique(vacancy_id,position)
);
create table public.jobkix_files(
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id), organization_id uuid references public.jobkix_organizations(id),
  purpose text not null check(purpose in ('cv','credential','portfolio','verification','report','message')),
  object_key text not null unique, filename text not null check(length(filename) between 1 and 240),
  mime text not null check(mime in ('application/pdf','image/jpeg','image/png','image/webp')),
  expected_bytes bigint not null check(expected_bytes between 1 and 20971520), actual_bytes bigint,
  sha256 text check(sha256 ~ '^[a-f0-9]{64}$'), revision integer not null default 1 check(revision>0),
  state text not null default 'uploading' check(state in ('uploading','quarantined','ready','rejected','deleted')),
  scanner_reference text, created_at timestamptz not null default now(),
  check(state<>'ready' or (actual_bytes=expected_bytes and sha256 is not null and scanner_reference is not null))
);
create table public.jobkix_applications(
  id uuid primary key default gen_random_uuid(), vacancy_id uuid not null references public.jobkix_vacancies(id),
  candidate_user_id uuid not null references public.jobkix_accounts(user_id), organization_id uuid not null references public.jobkix_organizations(id),
  state text not null default 'submitted' check(state in ('submitted','acknowledged','under_review','shortlisted','interview','offer','hired','declined','withdrawn','on_hold','closed_due_to_vacancy')),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'), file_id uuid references public.jobkix_files(id),
  receipt text not null unique, version integer not null default 1 check(version>0),
  submitted_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(vacancy_id,candidate_user_id)
);
create index jobkix_applications_org on public.jobkix_applications(organization_id,vacancy_id,state);
create table public.jobkix_application_events(
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.jobkix_applications(id),
  type text not null, public_detail jsonb not null default '{}' check(jsonb_typeof(public_detail)='object'),
  actor_user_id uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.jobkix_threads(
  id uuid primary key default gen_random_uuid(), application_id uuid not null unique references public.jobkix_applications(id),
  created_at timestamptz not null default now()
);
create table public.jobkix_messages(
  id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.jobkix_threads(id),
  sender_user_id uuid not null references auth.users(id), body text not null check(length(body) between 1 and 12000),
  original_locale text not null check(original_locale in ('en','fr','es','hi','tl','id','ar')),
  attachment_id uuid references public.jobkix_files(id), created_at timestamptz not null default now()
);
create table public.jobkix_interviews(
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.jobkix_applications(id),
  organization_id uuid not null references public.jobkix_organizations(id), candidate_user_id uuid not null references auth.users(id),
  starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null,
  format text not null check(format in ('video','phone','in_person')), location text not null,
  state text not null default 'proposed' check(state in ('proposed','scheduled','completed','cancelled','declined')),
  candidate_response text not null default 'pending' check(candidate_response in ('pending','accepted','declined','reschedule_requested')),
  version integer not null default 1 check(version>0), created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(), check(ends_at>=starts_at+interval '5 minutes' and ends_at<=starts_at+interval '8 hours')
);
create table public.jobkix_interview_panels(
  interview_id uuid not null references public.jobkix_interviews(id), member_user_id uuid not null references auth.users(id),
  response text not null default 'pending' check(response in ('pending','accepted','declined')),
  primary key(interview_id,member_user_id)
);
create table public.jobkix_evaluations(
  id uuid primary key default gen_random_uuid(), interview_id uuid not null references public.jobkix_interviews(id),
  evaluator_user_id uuid not null references auth.users(id), professional_criteria jsonb not null check(jsonb_typeof(professional_criteria)='object'),
  confidential_notes text not null check(length(confidential_notes)<=12000), version integer not null default 1 check(version>0),
  updated_at timestamptz not null default now(), unique(interview_id,evaluator_user_id)
);
create table public.jobkix_offers(
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.jobkix_applications(id),
  organization_id uuid not null references public.jobkix_organizations(id), candidate_user_id uuid not null references auth.users(id),
  state text not null default 'draft' check(state in ('draft','sent','accepted','declined','withdrawn','expired')),
  title text not null check(length(title) between 1 and 240), terms text not null check(length(terms) between 1 and 30000),
  compensation jsonb, starts_at timestamptz, response_deadline timestamptz,
  version integer not null default 1 check(version>0), sent_at timestamptz, responded_at timestamptz,
  created_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create unique index jobkix_offers_one_open on public.jobkix_offers(application_id) where state in ('draft','sent');
create table public.jobkix_offer_revisions(
  offer_id uuid not null references public.jobkix_offers(id), version integer not null,
  snapshot jsonb not null, created_at timestamptz not null default now(), primary key(offer_id,version)
);
create table public.jobkix_interview_revisions(
  interview_id uuid not null references public.jobkix_interviews(id), version integer not null,
  snapshot jsonb not null, created_at timestamptz not null default now(), primary key(interview_id,version)
);
create table public.jobkix_saved_jobs(
  user_id uuid not null references auth.users(id), vacancy_id uuid not null references public.jobkix_vacancies(id),
  collection text not null default 'default' check(length(collection)<=180), saved_at timestamptz not null default now(), primary key(user_id,vacancy_id)
);
create table public.jobkix_saved_searches(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  name text not null check(length(name) between 1 and 180), filters jsonb not null check(jsonb_typeof(filters)='object'),
  frequency text not null default 'off' check(frequency in ('off','daily','weekly')), enabled boolean not null default false,
  last_run_at timestamptz, version integer not null default 1 check(version>0), created_at timestamptz not null default now()
);
create table public.jobkix_talent_pools(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.jobkix_organizations(id),
  name text not null check(length(name) between 1 and 180), created_by uuid not null references auth.users(id), version integer not null default 1 check(version>0)
);
create table public.jobkix_talent_pool_members(
  pool_id uuid not null references public.jobkix_talent_pools(id), candidate_user_id uuid not null references auth.users(id),
  added_by uuid not null references auth.users(id), expires_at timestamptz not null, primary key(pool_id,candidate_user_id)
);
create table public.jobkix_drafts(
  user_id uuid not null references auth.users(id), kind text not null check(kind in ('application','vacancy','message','profile','organization','hiring','case')),
  draft_key text not null check(length(draft_key) between 1 and 180), body jsonb not null check(jsonb_typeof(body)='object'),
  version integer not null default 1 check(version>0), updated_at timestamptz not null default now(), primary key(user_id,kind,draft_key)
);
create table public.jobkix_cases(
  id uuid primary key default gen_random_uuid(), public_reference text not null unique,
  kind text not null check(kind in ('report','support','appeal','privacy_export','privacy_deletion','verification')),
  reporter_user_id uuid references auth.users(id), guest_receipt_hash text,
  organization_id uuid references public.jobkix_organizations(id), vacancy_id uuid references public.jobkix_vacancies(id),
  category text not null, description text not null check(length(description) between 10 and 16000),
  private_contact jsonb not null default '{}', evidence_file_id uuid references public.jobkix_files(id),
  state text not null default 'reported' check(state in ('reported','triaged','under_review','needs_information','action','no_action','appealed','resolved')),
  parent_case_id uuid references public.jobkix_cases(id), assigned_admin_id uuid,
  version integer not null default 1 check(version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.jobkix_case_events(
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.jobkix_cases(id),
  admin_actor_id uuid, user_actor_id uuid references auth.users(id), visibility text not null check(visibility in ('reporter','internal')),
  detail text not null, created_at timestamptz not null default now()
);
create table public.jobkix_reputation(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.jobkix_organizations(id),
  contributor_user_id uuid not null references auth.users(id), kind text not null check(kind in ('review','salary')),
  original_locale text not null check(original_locale in ('en','fr','es','hi','tl','id','ar')),
  body text not null check(length(body) between 20 and 12000), evidence jsonb not null default '{}',
  amount numeric, currency text, unit text, profession_id text, country text,
  state text not null default 'submitted' check(state in ('submitted','under_review','published','rejected','withdrawn')),
  methodology_revision text, reviewed_at timestamptz, version integer not null default 1 check(version>0), created_at timestamptz not null default now()
);
create table public.jobkix_editorial_documents(
  id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9/-]{1,180}$'),
  kind text not null check(kind in ('front','guide','help','legal','sector','profession','country','city','trust')),
  source_revision integer not null default 1 check(source_revision>0), source_hash text,
  created_at timestamptz not null default now()
);
create table public.jobkix_editorial_editions(
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.jobkix_editorial_documents(id),
  locale text not null check(locale in ('en','fr','es','hi','tl','id','ar')),
  title text not null, summary text not null default '', sections jsonb not null check(jsonb_typeof(sections)='array'),
  source_revision integer not null check(source_revision>0), source_hash text not null, content_hash text not null,
  status text not null default 'draft' check(status in ('draft','reviewed','published','retired')),
  translator_provenance text not null default 'authored', reviewed_hash text, reviewed_by uuid, published_by uuid,
  author_name text not null, review_note text not null default '', version integer not null default 1 check(version>0),
  published_at timestamptz, updated_at timestamptz not null default now(), unique(document_id,locale,version),
  check(status<>'published' or (reviewed_hash=content_hash and reviewed_by is not null and published_at is not null))
);
create unique index jobkix_editorial_one_published on public.jobkix_editorial_editions(document_id,locale) where status='published';
create table public.jobkix_account_consents(
 user_id uuid not null references public.jobkix_accounts(user_id), revision text not null,
 locale text not null check(locale in ('en','fr','es','hi','tl','id','ar')),
 terms_snapshot jsonb not null, privacy_snapshot jsonb not null, accepted_at timestamptz not null default now(),
 primary key(user_id,revision)
);
create table public.jobkix_events(
  id uuid primary key default gen_random_uuid(), type text not null, object_id uuid not null,
  actor_user_id uuid references auth.users(id), admin_actor_id uuid,
  detail jsonb not null default '{}', occurred_at timestamptz not null default now()
);
create table public.jobkix_outbox(
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.jobkix_events(id),
  recipient_user_id uuid references auth.users(id), recipient_email text, channel text not null check(channel in ('in_app','email')),
  template_key text not null, locale text not null check(locale in ('en','fr','es','hi','tl','id','ar')),
  data jsonb not null default '{}', state text not null default 'pending' check(state in ('pending','processing','sent','provider_accepted','failed','delivery_unknown','cancelled')),
  attempts integer not null default 0, available_at timestamptz not null default now(), locked_until timestamptz, lock_token uuid,
  transport_reference text, last_error_code text, read_at timestamptz, created_at timestamptz not null default now(),
  check(recipient_user_id is not null or (channel='email' and recipient_email is not null)),
  unique(event_id,recipient_user_id,channel)
);
create index jobkix_outbox_due on public.jobkix_outbox(state,available_at);
create unique index jobkix_outbox_guest_dedupe on public.jobkix_outbox(event_id,recipient_email,channel) where recipient_email is not null;
create table public.jobkix_command_receipts(
  actor_user_id uuid not null references auth.users(id), idempotency_key text not null check(length(idempotency_key) between 16 and 180),
  action text not null, request_hash text not null, result jsonb not null, created_at timestamptz not null default now(), primary key(actor_user_id,idempotency_key)
);
create table public.jobkix_admin_receipts(
  admin_actor_id uuid not null, idempotency_key text not null, request_hash text not null,
  result jsonb not null, created_at timestamptz not null default now(), primary key(admin_actor_id,idempotency_key)
);

-- Immutable historical snapshots: later profile, CV and vacancy edits cannot rewrite submissions.
create function public.jobkix_application_snapshot_immutable() returns trigger language plpgsql set search_path=pg_catalog,public as $$ begin
  if new.snapshot is distinct from old.snapshot or new.candidate_user_id<>old.candidate_user_id or new.vacancy_id<>old.vacancy_id or new.organization_id<>old.organization_id or new.file_id is distinct from old.file_id then
    raise exception 'IMMUTABLE_APPLICATION_SNAPSHOT';
  end if;
  return new;
end $$;
create trigger jobkix_application_snapshot_guard before update on public.jobkix_applications for each row execute function public.jobkix_application_snapshot_immutable();

-- Default-deny every new table. Grants/policies are enumerated in 002; no global schema grants.
do $$ declare n text; begin
  for n in select tablename from pg_tables where schemaname='public' and tablename like 'jobkix\_%' escape '\' loop
    execute format('alter table public.%I enable row level security',n);
    execute format('revoke all on public.%I from public, anon, authenticated',n);
  end loop;
end $$;
revoke all on function public.jobkix_application_snapshot_immutable() from public,anon,authenticated;
insert into public.jobkix_schema_versions(version) values(1);
commit;
