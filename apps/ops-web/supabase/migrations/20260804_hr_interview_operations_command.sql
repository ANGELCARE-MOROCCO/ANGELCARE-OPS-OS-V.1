-- ANGELCARE HR — Interview Operations Command
-- Additive, idempotent, production-safe migration.
-- It preserves existing candidate tables and introduces one canonical multi-round interview authority.

begin;

create extension if not exists pgcrypto;

create table if not exists public.hr_interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  opening_id uuid,
  candidate_name text not null default '',
  candidate_email text,
  candidate_phone text,
  city text,
  position_title text,
  interview_type text not null default 'hr_interview',
  status text not null default 'scheduled',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  timezone text not null default 'Africa/Casablanca',
  mode text not null default 'video',
  location text,
  meeting_url text,
  lead_interviewer text not null default '',
  lead_interviewer_id text,
  panel_members jsonb not null default '[]'::jsonb,
  coordinator text,
  priority text not null default 'normal',
  pipeline_stage_after text default 'interview',
  decision text not null default 'pending',
  score numeric,
  scorecard jsonb not null default '{}'::jsonb,
  notes text,
  feedback_status text not null default 'pending',
  feedback_due_at timestamptz,
  feedback_completed_at timestamptz,
  cancellation_reason text,
  candidate_notification_status text default 'not_requested',
  version integer not null default 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hr_interviews add column if not exists candidate_id uuid;
alter table public.hr_interviews add column if not exists opening_id uuid;
alter table public.hr_interviews add column if not exists candidate_name text default '';
alter table public.hr_interviews add column if not exists candidate_email text;
alter table public.hr_interviews add column if not exists candidate_phone text;
alter table public.hr_interviews add column if not exists city text;
alter table public.hr_interviews add column if not exists position_title text;
alter table public.hr_interviews add column if not exists interview_type text default 'hr_interview';
alter table public.hr_interviews add column if not exists status text default 'scheduled';
alter table public.hr_interviews add column if not exists scheduled_at timestamptz;
alter table public.hr_interviews add column if not exists duration_minutes integer default 60;
alter table public.hr_interviews add column if not exists timezone text default 'Africa/Casablanca';
alter table public.hr_interviews add column if not exists mode text default 'video';
alter table public.hr_interviews add column if not exists location text;
alter table public.hr_interviews add column if not exists meeting_url text;
alter table public.hr_interviews add column if not exists lead_interviewer text default '';
alter table public.hr_interviews add column if not exists lead_interviewer_id text;
alter table public.hr_interviews add column if not exists panel_members jsonb default '[]'::jsonb;
alter table public.hr_interviews add column if not exists coordinator text;
alter table public.hr_interviews add column if not exists priority text default 'normal';
alter table public.hr_interviews add column if not exists pipeline_stage_after text default 'interview';
alter table public.hr_interviews add column if not exists decision text default 'pending';
alter table public.hr_interviews add column if not exists score numeric;
alter table public.hr_interviews add column if not exists scorecard jsonb default '{}'::jsonb;
alter table public.hr_interviews add column if not exists notes text;
alter table public.hr_interviews add column if not exists feedback_status text default 'pending';
alter table public.hr_interviews add column if not exists feedback_due_at timestamptz;
alter table public.hr_interviews add column if not exists feedback_completed_at timestamptz;
alter table public.hr_interviews add column if not exists cancellation_reason text;
alter table public.hr_interviews add column if not exists candidate_notification_status text default 'not_requested';
alter table public.hr_interviews add column if not exists version integer default 1;
alter table public.hr_interviews add column if not exists created_by uuid;
alter table public.hr_interviews add column if not exists updated_by uuid;
alter table public.hr_interviews add column if not exists created_at timestamptz default now();
alter table public.hr_interviews add column if not exists updated_at timestamptz default now();

update public.hr_interviews
set
  candidate_name = coalesce(nullif(candidate_name, ''), 'Candidat'),
  interview_type = coalesce(nullif(interview_type, ''), 'hr_interview'),
  status = coalesce(nullif(status, ''), 'scheduled'),
  duration_minutes = greatest(15, coalesce(duration_minutes, 60)),
  timezone = coalesce(nullif(timezone, ''), 'Africa/Casablanca'),
  mode = coalesce(nullif(mode, ''), 'video'),
  lead_interviewer = coalesce(nullif(lead_interviewer, ''), nullif(to_jsonb(hr_interviews)->>'interviewer', ''), 'Équipe RH'),
  panel_members = coalesce(panel_members, '[]'::jsonb),
  priority = coalesce(nullif(priority, ''), 'normal'),
  decision = coalesce(nullif(decision, ''), 'pending'),
  scorecard = coalesce(scorecard, '{}'::jsonb),
  feedback_status = coalesce(nullif(feedback_status, ''), 'pending'),
  candidate_notification_status = coalesce(nullif(candidate_notification_status, ''), 'not_requested'),
  version = greatest(1, coalesce(version, 1)),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

create table if not exists public.hr_interview_activity (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null,
  candidate_id uuid,
  activity_type text not null,
  actor_id uuid,
  actor_label text,
  title text not null,
  detail text,
  visibility text not null default 'internal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.hr_interview_activity add column if not exists interview_id uuid;
alter table public.hr_interview_activity add column if not exists candidate_id uuid;
alter table public.hr_interview_activity add column if not exists activity_type text;
alter table public.hr_interview_activity add column if not exists actor_id uuid;
alter table public.hr_interview_activity add column if not exists actor_label text;
alter table public.hr_interview_activity add column if not exists title text;
alter table public.hr_interview_activity add column if not exists detail text;
alter table public.hr_interview_activity add column if not exists visibility text default 'internal';
alter table public.hr_interview_activity add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.hr_interview_activity add column if not exists created_at timestamptz default now();

-- Candidate snapshot compatibility. These columns keep the existing recruitment root,
-- candidates and Kanban pages synchronized while the canonical table retains all rounds.
do $candidate_columns$
declare
  candidate_table text;
begin
  foreach candidate_table in array array['hr_candidates', 'hr_recruitment_candidates']
  loop
    if to_regclass('public.' || candidate_table) is not null then
      execute format('alter table public.%I add column if not exists next_interview_id uuid', candidate_table);
      execute format('alter table public.%I add column if not exists interview_date date', candidate_table);
      execute format('alter table public.%I add column if not exists interview_time time', candidate_table);
      execute format('alter table public.%I add column if not exists interview_datetime timestamptz', candidate_table);
      execute format('alter table public.%I add column if not exists scheduled_at timestamptz', candidate_table);
      execute format('alter table public.%I add column if not exists interviewer text', candidate_table);
      execute format('alter table public.%I add column if not exists meeting_url text', candidate_table);
      execute format('alter table public.%I add column if not exists interview_status text', candidate_table);
      execute format('alter table public.%I add column if not exists interview_type text', candidate_table);
      execute format('alter table public.%I add column if not exists feedback_status text', candidate_table);
    end if;
  end loop;
end;
$candidate_columns$;

create or replace function public.hr_interview_set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists trg_hr_interviews_updated_at on public.hr_interviews;
create trigger trg_hr_interviews_updated_at
before update on public.hr_interviews
for each row execute function public.hr_interview_set_updated_at();

-- Idempotent legacy backfill from whichever candidate tables exist.
create or replace function public.hr_interview_safe_scheduled_at(candidate_json jsonb)
returns timestamptz
language plpgsql
stable
as $function$
declare
  raw_datetime text;
  raw_date text;
  raw_time text;
begin
  raw_datetime := coalesce(nullif(candidate_json->>'interview_datetime', ''), nullif(candidate_json->>'scheduled_at', ''));
  if raw_datetime is not null and raw_datetime ~ '^\d{4}-\d{2}-\d{2}' then
    begin
      return raw_datetime::timestamptz;
    exception when others then
      null;
    end;
  end if;

  raw_date := nullif(candidate_json->>'interview_date', '');
  raw_time := coalesce(nullif(candidate_json->>'interview_time', ''), '09:00');
  if raw_date is not null and raw_date ~ '^\d{4}-\d{2}-\d{2}$' then
    begin
      return (raw_date || ' ' || raw_time)::timestamp at time zone 'Africa/Casablanca';
    exception when others then
      return null;
    end;
  end if;
  return null;
end;
$function$;

do $backfill$
declare
  candidate_table text;
begin
  foreach candidate_table in array array['hr_candidates', 'hr_recruitment_candidates']
  loop
    if to_regclass('public.' || candidate_table) is not null then
      execute format($sql$
        insert into public.hr_interviews (
          candidate_id,
          opening_id,
          candidate_name,
          candidate_email,
          candidate_phone,
          city,
          position_title,
          interview_type,
          status,
          scheduled_at,
          duration_minutes,
          timezone,
          mode,
          meeting_url,
          lead_interviewer,
          priority,
          pipeline_stage_after,
          decision,
          score,
          notes,
          feedback_status,
          feedback_due_at,
          version,
          created_at,
          updated_at
        )
        select
          c.id,
          case when coalesce(to_jsonb(c)->>'opening_id', '') ~* '^[0-9a-f-]{36}$' then (to_jsonb(c)->>'opening_id')::uuid else null end,
          coalesce(nullif(to_jsonb(c)->>'full_name', ''), nullif(to_jsonb(c)->>'name', ''), 'Candidat'),
          nullif(to_jsonb(c)->>'email', ''),
          nullif(to_jsonb(c)->>'phone', ''),
          coalesce(nullif(to_jsonb(c)->>'city', ''), nullif(to_jsonb(c)->>'location', '')),
          coalesce(nullif(to_jsonb(c)->>'desired_position', ''), nullif(to_jsonb(c)->>'job_title', ''), nullif(to_jsonb(c)->>'position', '')),
          coalesce(nullif(to_jsonb(c)->>'interview_type', ''), nullif(to_jsonb(c)->>'source', ''), 'hr_interview'),
          coalesce(nullif(to_jsonb(c)->>'interview_status', ''), 'scheduled'),
          public.hr_interview_safe_scheduled_at(to_jsonb(c)),
          60,
          'Africa/Casablanca',
          case when coalesce(nullif(to_jsonb(c)->>'meeting_url', ''), nullif(to_jsonb(c)->>'video_url', '')) is null then 'onsite' else 'video' end,
          coalesce(nullif(to_jsonb(c)->>'meeting_url', ''), nullif(to_jsonb(c)->>'video_url', '')),
          coalesce(nullif(to_jsonb(c)->>'interviewer', ''), nullif(to_jsonb(c)->>'owner', ''), 'Équipe RH'),
          'normal',
          coalesce(nullif(to_jsonb(c)->>'pipeline_stage', ''), nullif(to_jsonb(c)->>'stage', ''), 'interview'),
          coalesce(nullif(to_jsonb(c)->>'decision', ''), 'pending'),
          case when coalesce(to_jsonb(c)->>'score', '') ~ '^-?\d+(\.\d+)?$' then (to_jsonb(c)->>'score')::numeric else null end,
          nullif(to_jsonb(c)->>'notes', ''),
          coalesce(nullif(to_jsonb(c)->>'feedback_status', ''), 'pending'),
          public.hr_interview_safe_scheduled_at(to_jsonb(c)) + interval '24 hours',
          1,
          coalesce(case when coalesce(to_jsonb(c)->>'created_at', '') ~ '^\d{4}-\d{2}-\d{2}' then (to_jsonb(c)->>'created_at')::timestamptz end, now()),
          now()
        from public.%I c
        where public.hr_interview_safe_scheduled_at(to_jsonb(c)) is not null
          and not exists (
            select 1
            from public.hr_interviews i
            where i.candidate_id = c.id
              and abs(extract(epoch from (i.scheduled_at - public.hr_interview_safe_scheduled_at(to_jsonb(c))))) < 60
          );
      $sql$, candidate_table);
    end if;
  end loop;
end;
$backfill$;

-- Synchronize candidate snapshots from the most recent active interview.
do $snapshot$
declare
  candidate_table text;
begin
  foreach candidate_table in array array['hr_candidates', 'hr_recruitment_candidates']
  loop
    if to_regclass('public.' || candidate_table) is not null then
      execute format($sql$
        update public.%I c
        set
          next_interview_id = latest.id,
          interview_date = (latest.scheduled_at at time zone 'Africa/Casablanca')::date,
          interview_time = (latest.scheduled_at at time zone 'Africa/Casablanca')::time,
          interview_datetime = latest.scheduled_at,
          scheduled_at = latest.scheduled_at,
          interviewer = latest.lead_interviewer,
          meeting_url = latest.meeting_url,
          interview_status = latest.status,
          interview_type = latest.interview_type,
          feedback_status = latest.feedback_status,
          updated_at = now()
        from (
          select distinct on (i.candidate_id) i.*
          from public.hr_interviews i
          where i.status in ('scheduled', 'confirmed', 'in_progress')
          order by i.candidate_id, i.scheduled_at asc
        ) latest
        where latest.candidate_id = c.id;
      $sql$, candidate_table);
    end if;
  end loop;
end;
$snapshot$;

create index if not exists idx_hr_interviews_scheduled_at on public.hr_interviews(scheduled_at);
create index if not exists idx_hr_interviews_candidate on public.hr_interviews(candidate_id, scheduled_at desc);
create index if not exists idx_hr_interviews_status on public.hr_interviews(status, scheduled_at);
create index if not exists idx_hr_interviews_interviewer on public.hr_interviews(lead_interviewer, scheduled_at);
create index if not exists idx_hr_interviews_feedback on public.hr_interviews(feedback_status, feedback_due_at);
create index if not exists idx_hr_interview_activity_interview on public.hr_interview_activity(interview_id, created_at desc);
create index if not exists idx_hr_interview_activity_candidate on public.hr_interview_activity(candidate_id, created_at desc);

comment on table public.hr_interviews is 'Canonical multi-round HR recruitment interview authority.';
comment on table public.hr_interview_activity is 'Immutable operational evidence for HR interview workflows.';

grant select, insert, update on public.hr_interviews to authenticated;
grant select, insert on public.hr_interview_activity to authenticated;
grant all on public.hr_interviews to service_role;
grant all on public.hr_interview_activity to service_role;

commit;
