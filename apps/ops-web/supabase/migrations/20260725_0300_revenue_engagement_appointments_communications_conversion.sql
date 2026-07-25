-- ANGELCARE Revenue Command Excellence v5 / Mega ZIP 5
-- Communications, Appointments, Meetings & Commercial Conversion Control Plane.
-- Production compatibility: public.revenue_prospects.id remains TEXT.
-- Additive, transactional and safe for the accepted Phase 2 + Phase 4 schema.

begin;
create extension if not exists pgcrypto;

-- Hard safety contract.
do $$
declare
  missing_table text;
  prospect_type text;
  appointment_type text;
  task_type text;
begin
  foreach missing_table in array array['revenue_prospects','revenue_accounts','revenue_contacts','revenue_opportunities','revenue_appointments','revenue_tasks','revenue_activities','revenue_command_action_logs'] loop
    if to_regclass('public.'||missing_table) is null then
      raise exception 'Mega ZIP 5 preflight failed: required table public.% is missing.',missing_table;
    end if;
  end loop;
  select udt_name into prospect_type from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id';
  select udt_name into appointment_type from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='id';
  select udt_name into task_type from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id';
  if prospect_type <> 'text' then raise exception 'Mega ZIP 5 expects public.revenue_prospects.id TEXT; actual type is %.',prospect_type; end if;
  if appointment_type <> 'uuid' then raise exception 'Mega ZIP 5 expects public.revenue_appointments.id UUID; actual type is %.',appointment_type; end if;
  if task_type <> 'uuid' then raise exception 'Mega ZIP 5 expects public.revenue_tasks.id UUID; actual type is %.',task_type; end if;
end $$;

alter table public.revenue_appointments
  add column if not exists account_id uuid references public.revenue_accounts(id) on delete set null,
  add column if not exists contact_id uuid references public.revenue_contacts(id) on delete set null,
  add column if not exists opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  add column if not exists timezone text not null default 'Africa/Casablanca',
  add column if not exists confirmation_status text not null default 'pending',
  add column if not exists preparation_status text not null default 'not_started',
  add column if not exists confirmed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists no_show_risk integer not null default 0,
  add column if not exists commercial_value_mad numeric not null default 0,
  add column if not exists outcome_code text,
  add column if not exists version integer not null default 1,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

alter table public.revenue_appointments drop constraint if exists revenue_appointments_no_show_risk_check;
alter table public.revenue_appointments add constraint revenue_appointments_no_show_risk_check check (no_show_risk between 0 and 100) not valid;
alter table public.revenue_appointments validate constraint revenue_appointments_no_show_risk_check;

create table if not exists public.revenue_appointment_participants (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  participant_type text not null default 'external',
  user_id uuid,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  name text not null,
  email text,
  phone text,
  role text not null default 'Participant',
  decision_role text not null default 'participant',
  is_required boolean not null default true,
  confirmation_status text not null default 'pending',
  confirmation_channel text,
  confirmed_at timestamptz,
  attendance_status text not null default 'pending',
  created_by uuid,
  updated_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid,
  metadata jsonb not null default '{}',
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  title text not null,
  description text,
  objective text,
  duration_minutes integer not null default 10,
  position integer not null default 0,
  status text not null default 'open',
  owner_name text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid,
  created_by uuid,
  updated_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_preparation_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  title text not null,
  description text,
  item_type text not null default 'briefing',
  status text not null default 'open',
  position integer not null default 0,
  owner_name text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid,
  created_by uuid,
  updated_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_attendance (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  participant_id uuid references public.revenue_appointment_participants(id) on delete set null,
  participant_name text not null,
  attendance_status text not null default 'present',
  arrived_at timestamptz,
  left_at timestamptz,
  late_minutes integer not null default 0,
  recorded_by uuid,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(appointment_id,participant_id)
);

create table if not exists public.revenue_meeting_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  note_type text not null default 'live',
  body text not null,
  is_private boolean not null default false,
  author_id uuid,
  author_name text,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_objections (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  category text not null default 'commercial',
  objection text not null,
  response text,
  status text not null default 'open',
  severity text not null default 'medium',
  raised_by_name text,
  owner_id uuid,
  owner_name text,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_decisions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  decision text not null,
  decision_type text not null default 'commercial',
  status text not null default 'confirmed',
  decided_by_name text,
  business_impact text,
  effective_at timestamptz,
  recorded_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_commitments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  task_id uuid references public.revenue_tasks(id) on delete set null,
  title text not null,
  description text,
  owner_type text not null default 'internal',
  owner_id uuid,
  owner_name text,
  due_at timestamptz,
  status text not null default 'open',
  commercial_impact text,
  completed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_outcomes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  outcome_code text not null,
  summary text not null,
  interest_level text not null default 'medium',
  qualification_change text not null default 'unchanged',
  commercial_value_mad numeric not null default 0,
  probability numeric not null default 0,
  opportunity_stage_recommendation text,
  proposal_required boolean not null default false,
  negotiation_required boolean not null default false,
  follow_up_required boolean not null default true,
  escalation_required boolean not null default false,
  loss_reason text,
  next_meeting_required boolean not null default false,
  recorded_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_meeting_follow_ups (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  task_id uuid references public.revenue_tasks(id) on delete set null,
  title text not null,
  description text,
  channel text not null default 'internal',
  owner_id uuid,
  owner_name text,
  due_at timestamptz,
  status text not null default 'open',
  completed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_appointment_no_shows (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  no_show_party text not null default 'external',
  reason text not null,
  category text not null default 'unconfirmed',
  occurred_at timestamptz not null default now(),
  confirmation_attempts integer not null default 0,
  commercial_impact_mad numeric not null default 0,
  recovery_required boolean not null default true,
  recorded_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_appointment_recovery_attempts (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.revenue_appointments(id) on delete cascade,
  channel text not null default 'phone',
  attempt_type text not null default 'reconnect',
  status text not null default 'attempted',
  outcome text,
  contacted_at timestamptz not null default now(),
  next_attempt_at timestamptz,
  new_appointment_at timestamptz,
  owner_id uuid,
  owner_name text,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.revenue_communication_threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null default 'Conversation commerciale',
  channel_scope text not null default 'mixed',
  status text not null default 'open',
  prospect_id text references public.revenue_prospects(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  appointment_id uuid references public.revenue_appointments(id) on delete set null,
  owner_id uuid,
  owner_name text,
  waiting_since timestamptz,
  next_follow_up_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_communication_events (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.revenue_communication_threads(id) on delete cascade,
  appointment_id uuid references public.revenue_appointments(id) on delete set null,
  prospect_id text references public.revenue_prospects(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  direction text not null default 'outbound',
  channel text not null,
  provider text not null default 'manual',
  provider_message_id text,
  provider_thread_id text,
  sender text,
  recipients jsonb not null default '[]',
  subject text,
  body_summary text,
  content jsonb not null default '{}',
  attachments jsonb not null default '[]',
  occurred_at timestamptz not null default now(),
  status text not null default 'recorded',
  outcome text,
  follow_up_at timestamptz,
  owner_id uuid,
  owner_name text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_communication_delivery_events (
  id uuid primary key default gen_random_uuid(),
  communication_event_id uuid not null references public.revenue_communication_events(id) on delete cascade,
  event_type text not null,
  provider text not null default 'manual',
  provider_event_id text,
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Atomic commercial outcome command: result, appointment, follow-ups, tasks and optional opportunity progression.
create or replace function public.revenue_apply_meeting_outcome(
  p_appointment_id uuid,
  p_payload jsonb,
  p_actor uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.revenue_appointments%rowtype;
  v_outcome public.revenue_meeting_outcomes%rowtype;
  v_updated public.revenue_appointments%rowtype;
  v_summary text := nullif(trim(coalesce(p_payload->>'summary',p_payload->>'outcome','')),'');
  v_outcome_code text := coalesce(nullif(p_payload->>'outcomeCode',''),'follow_up');
  v_target_status text;
  v_follow_up_required boolean := coalesce((p_payload->>'followUpRequired')::boolean,true);
  v_proposal_required boolean := coalesce((p_payload->>'proposalRequired')::boolean,false);
  v_task_id uuid;
  v_task_ids uuid[] := array[]::uuid[];
  v_follow_up_title text := coalesce(nullif(p_payload->>'followUpTitle',''),'Suivi post-rendez-vous');
  v_follow_up_objective text := coalesce(nullif(p_payload->>'followUpObjective',''),'Exécuter les engagements et faire progresser l’opportunité.');
  v_follow_up_owner text;
  v_follow_up_at timestamptz := nullif(p_payload->>'followUpAt','')::timestamptz;
  v_value numeric;
  v_probability numeric;
begin
  select * into v_appointment from public.revenue_appointments where id=p_appointment_id for update;
  if not found then raise exception 'Rendez-vous introuvable.'; end if;
  if v_summary is null then raise exception 'Le résumé du résultat est requis.'; end if;

  v_value := greatest(0,coalesce(nullif(p_payload->>'commercialValueMad','')::numeric,v_appointment.commercial_value_mad,0));
  v_probability := greatest(0,least(100,coalesce(nullif(p_payload->>'probability','')::numeric,0)));
  v_follow_up_owner := coalesce(nullif(p_payload->>'followUpOwner',''),v_appointment.owner,'BD Officer');
  v_target_status := case
    when v_outcome_code like '%converted%' then 'converted'
    when v_outcome_code like '%lost%' then 'lost'
    when v_follow_up_required then 'follow_up'
    else 'completed'
  end;

  insert into public.revenue_meeting_outcomes(
    appointment_id,outcome_code,summary,interest_level,qualification_change,commercial_value_mad,
    probability,opportunity_stage_recommendation,proposal_required,negotiation_required,
    follow_up_required,escalation_required,loss_reason,next_meeting_required,recorded_by,metadata
  ) values (
    v_appointment.id,v_outcome_code,v_summary,coalesce(nullif(p_payload->>'interestLevel',''),'medium'),
    coalesce(nullif(p_payload->>'qualificationChange',''),'unchanged'),v_value,v_probability,
    nullif(p_payload->>'opportunityStageRecommendation',''),v_proposal_required,
    coalesce((p_payload->>'negotiationRequired')::boolean,false),v_follow_up_required,
    coalesce((p_payload->>'escalationRequired')::boolean,false),nullif(p_payload->>'lossReason',''),
    coalesce((p_payload->>'nextMeetingRequired')::boolean,false),p_actor,coalesce(p_payload->'metadata','{}'::jsonb)
  ) returning * into v_outcome;

  update public.revenue_appointments set
    status=v_target_status,outcome=v_summary,outcome_code=v_outcome_code,commercial_value_mad=v_value,
    completed_at=now(),updated_at=now(),updated_by=p_actor,version=coalesce(version,0)+1
  where id=v_appointment.id returning * into v_updated;

  if v_follow_up_required then
    insert into public.revenue_tasks(
      entity_type,entity_id,prospect_id,title,description,owner,priority,status,due_at,expected_outcome,metadata
    ) values (
      'appointment',v_updated.id::text,v_updated.prospect_id,v_follow_up_title,v_follow_up_objective,
      v_follow_up_owner,coalesce(v_updated.priority,'medium'),'open',v_follow_up_at,v_follow_up_objective,
      jsonb_build_object('appointment_id',v_updated.id,'account_id',v_updated.account_id,'opportunity_id',v_updated.opportunity_id,'outcome_id',v_outcome.id)
    ) returning id into v_task_id;
    v_task_ids:=array_append(v_task_ids,v_task_id);
    insert into public.revenue_meeting_follow_ups(appointment_id,task_id,title,description,channel,owner_name,due_at,status,created_by,updated_by,metadata)
    values(v_updated.id,v_task_id,v_follow_up_title,v_follow_up_objective,coalesce(nullif(p_payload->>'followUpChannel',''),'internal'),v_follow_up_owner,v_follow_up_at,'open',p_actor,p_actor,jsonb_build_object('outcome_id',v_outcome.id));
  end if;

  if v_proposal_required then
    insert into public.revenue_tasks(
      entity_type,entity_id,prospect_id,title,description,owner,priority,status,due_at,expected_outcome,metadata
    ) values (
      'appointment',v_updated.id::text,v_updated.prospect_id,'Préparer la proposition commerciale',
      'Préparer une proposition conforme au résultat de la réunion.',coalesce(nullif(p_payload->>'proposalOwner',''),v_updated.owner,'Revenue Manager'),
      'high','open',nullif(p_payload->>'proposalDueAt','')::timestamptz,'Produire une proposition gouvernée et prête à validation.',
      jsonb_build_object('appointment_id',v_updated.id,'account_id',v_updated.account_id,'opportunity_id',v_updated.opportunity_id,'outcome_id',v_outcome.id,'proposal_required',true)
    ) returning id into v_task_id;
    v_task_ids:=array_append(v_task_ids,v_task_id);
  end if;

  if v_updated.opportunity_id is not null and coalesce((p_payload->>'applyOpportunity')::boolean,false) then
    update public.revenue_opportunities set
      updated_at=now(),last_activity_at=now(),
      value_mad=case when v_value>0 then v_value else value_mad end,
      probability=case when v_probability>0 then v_probability else probability end,
      stage=coalesce(nullif(p_payload->>'opportunityStageRecommendation',''),stage)
    where id=v_updated.opportunity_id;
  end if;

  return jsonb_build_object('outcome',to_jsonb(v_outcome),'appointment',to_jsonb(v_updated),'taskIds',to_jsonb(v_task_ids));
end $$;

revoke all on function public.revenue_apply_meeting_outcome(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.revenue_apply_meeting_outcome(uuid,jsonb,uuid) to service_role;

create or replace function public.revenue_engagement_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

create or replace function public.revenue_capture_appointment_status_history()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status is distinct from old.status then
    insert into public.revenue_appointment_status_history(appointment_id,from_status,to_status,reason,changed_by,metadata)
    values(new.id,old.status,new.status,'Transition Revenue Command',new.updated_by,jsonb_build_object('version',new.version));
  end if;
  return new;
end $$;

drop trigger if exists trg_revenue_appointment_status_history on public.revenue_appointments;
create trigger trg_revenue_appointment_status_history after update of status on public.revenue_appointments for each row execute function public.revenue_capture_appointment_status_history();

do $$ declare t text; begin
  foreach t in array array[
    'revenue_appointment_participants','revenue_meeting_agenda_items','revenue_meeting_preparation_items','revenue_meeting_attendance',
    'revenue_meeting_notes','revenue_meeting_objections','revenue_meeting_decisions','revenue_meeting_commitments','revenue_meeting_outcomes',
    'revenue_meeting_follow_ups','revenue_appointment_recovery_attempts','revenue_communication_threads','revenue_communication_events'
  ] loop
    execute format('drop trigger if exists %I on public.%I','trg_'||t||'_touch',t);
    execute format('create trigger %I before update on public.%I for each row execute function public.revenue_engagement_touch_updated_at()','trg_'||t||'_touch',t);
  end loop;
end $$;

create index if not exists revenue_appointments_engagement_status_idx on public.revenue_appointments(status,appointment_at);
create index if not exists revenue_appointments_engagement_owner_idx on public.revenue_appointments(owner,appointment_at);
create index if not exists revenue_appointments_engagement_prospect_idx on public.revenue_appointments(prospect_id,appointment_at desc);
create index if not exists revenue_appointments_engagement_account_idx on public.revenue_appointments(account_id,appointment_at desc);
create index if not exists revenue_appointments_engagement_opportunity_idx on public.revenue_appointments(opportunity_id,appointment_at desc);
create index if not exists revenue_appointment_participants_appointment_idx on public.revenue_appointment_participants(appointment_id,confirmation_status);
create index if not exists revenue_appointment_status_history_appointment_idx on public.revenue_appointment_status_history(appointment_id,changed_at desc);
create index if not exists revenue_meeting_preparation_appointment_idx on public.revenue_meeting_preparation_items(appointment_id,status,position);
create index if not exists revenue_meeting_agenda_appointment_idx on public.revenue_meeting_agenda_items(appointment_id,position);
create index if not exists revenue_meeting_commitments_appointment_idx on public.revenue_meeting_commitments(appointment_id,status,due_at);
create index if not exists revenue_meeting_followups_appointment_idx on public.revenue_meeting_follow_ups(appointment_id,status,due_at);
create index if not exists revenue_appointment_recovery_idx on public.revenue_appointment_recovery_attempts(appointment_id,status,next_attempt_at);
create index if not exists revenue_communication_threads_context_idx on public.revenue_communication_threads(prospect_id,account_id,opportunity_id,appointment_id,updated_at desc);
create index if not exists revenue_communication_events_thread_idx on public.revenue_communication_events(thread_id,occurred_at desc);
create index if not exists revenue_communication_events_context_idx on public.revenue_communication_events(appointment_id,prospect_id,account_id,opportunity_id,occurred_at desc);
create index if not exists revenue_communication_delivery_event_idx on public.revenue_communication_delivery_events(communication_event_id,occurred_at desc);

-- Dynamic view prevents duplicate legacy columns such as entity_name.
do $$
declare
  appointment_columns text;
  statement text;
begin
  select string_agg(format('a.%I',column_name),', ' order by ordinal_position)
    into appointment_columns
  from information_schema.columns
  where table_schema='public' and table_name='revenue_appointments'
    and column_name not in (
      'entity_name','account_name','opportunity_title','primary_contact_name','primary_contact_email','primary_contact_phone',
      'entity_city','entity_stage','entity_priority','participant_count','confirmed_participant_count','preparation_done_count',
      'preparation_total_count','objection_count','commitment_count','open_commitment_count','communication_count','recovery_attempt_count'
    );
  statement := format($view$
    create or replace view public.revenue_engagement_appointment_view as
    select %s,
      coalesce(ac.account_name,p.name,o.title,'Dossier commercial') as entity_name,
      ac.account_name,
      o.title as opportunity_title,
      c.full_name as primary_contact_name,
      c.email as primary_contact_email,
      c.phone as primary_contact_phone,
      coalesce(ac.city,p.city) as entity_city,
      coalesce(o.stage,p.stage) as entity_stage,
      coalesce(o.priority,p.priority,a.priority) as entity_priority,
      (select count(*) from public.revenue_appointment_participants ap where ap.appointment_id=a.id) as participant_count,
      (select count(*) from public.revenue_appointment_participants ap where ap.appointment_id=a.id and ap.confirmation_status='confirmed') as confirmed_participant_count,
      (select count(*) from public.revenue_meeting_preparation_items pi where pi.appointment_id=a.id and pi.status='completed') as preparation_done_count,
      (select count(*) from public.revenue_meeting_preparation_items pi where pi.appointment_id=a.id) as preparation_total_count,
      (select count(*) from public.revenue_meeting_objections mo where mo.appointment_id=a.id) as objection_count,
      (select count(*) from public.revenue_meeting_commitments mc where mc.appointment_id=a.id) as commitment_count,
      (select count(*) from public.revenue_meeting_commitments mc where mc.appointment_id=a.id and mc.status not in ('completed','cancelled')) as open_commitment_count,
      (select count(*) from public.revenue_communication_events ce where ce.appointment_id=a.id) as communication_count,
      (select count(*) from public.revenue_appointment_recovery_attempts ra where ra.appointment_id=a.id) as recovery_attempt_count
    from public.revenue_appointments a
    left join public.revenue_prospects p on p.id=coalesce(a.prospect_id,a.entity_id)
    left join public.revenue_accounts ac on ac.id=a.account_id
    left join public.revenue_opportunities o on o.id=a.opportunity_id
    left join public.revenue_contacts c on c.id=a.contact_id
  $view$,appointment_columns);
  execute statement;
end $$;

create or replace view public.revenue_communication_thread_view as
select t.*,
  (select count(*) from public.revenue_communication_events e where e.thread_id=t.id) as event_count,
  (select max(e.occurred_at) from public.revenue_communication_events e where e.thread_id=t.id) as last_event_at,
  (select e.channel from public.revenue_communication_events e where e.thread_id=t.id order by e.occurred_at desc limit 1) as last_channel,
  (select e.body_summary from public.revenue_communication_events e where e.thread_id=t.id order by e.occurred_at desc limit 1) as last_summary
from public.revenue_communication_threads t;

create or replace view public.revenue_appointment_workload_view as
select owner,
  count(*) as total_appointments,
  count(*) filter(where status in ('scheduled','confirmation_pending','confirmed','prepared','live')) as active_appointments,
  count(*) filter(where status='no_show') as no_shows,
  count(*) filter(where status='converted') as converted_appointments,
  count(*) filter(where confirmation_status<>'confirmed') as confirmation_pending,
  coalesce(sum(commercial_value_mad),0) as commercial_value_mad
from public.revenue_appointments
group by owner;

-- Support tables are readable to authenticated application users; writes stay behind protected server commands.
do $$ declare t text; begin
  foreach t in array array[
    'revenue_appointment_participants','revenue_appointment_status_history','revenue_meeting_agenda_items','revenue_meeting_preparation_items',
    'revenue_meeting_attendance','revenue_meeting_notes','revenue_meeting_objections','revenue_meeting_decisions','revenue_meeting_commitments',
    'revenue_meeting_outcomes','revenue_meeting_follow_ups','revenue_appointment_no_shows','revenue_appointment_recovery_attempts',
    'revenue_communication_threads','revenue_communication_events','revenue_communication_delivery_events'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists revenue_engagement_authenticated_read on public.%I',t);
    execute format('create policy revenue_engagement_authenticated_read on public.%I for select to authenticated using (true)',t);
    execute format('revoke all privileges on table public.%I from anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('grant all privileges on table public.%I to service_role',t);
  end loop;
end $$;

revoke all privileges on table public.revenue_engagement_appointment_view,public.revenue_communication_thread_view,public.revenue_appointment_workload_view from anon;
grant select on table public.revenue_engagement_appointment_view,public.revenue_communication_thread_view,public.revenue_appointment_workload_view to authenticated,service_role;

comment on view public.revenue_engagement_appointment_view is 'Canonical read model for ANGELCARE Revenue Command communications, appointments, meetings and conversion.';
comment on table public.revenue_communication_events is 'Canonical commercial communication event ledger; provider delivery facts must only be recorded when actually available.';
comment on table public.revenue_meeting_outcomes is 'Commercial meeting conclusion with proposal, negotiation, follow-up and stage recommendations.';

notify pgrst,'reload schema';
commit;
