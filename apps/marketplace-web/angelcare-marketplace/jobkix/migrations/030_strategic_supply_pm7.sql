-- JOBKIX Strategic Supply PM7: additive staging, audit, and external-listing publication.
-- REVIEW AND RUN MANUALLY. Never inserts external records into native employer vacancy tables.
begin;
create extension if not exists pgcrypto;
create table if not exists public.jobkix_supply_sources (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 3 and 120), kind text not null check(kind in ('api','scrapy','jobspy')),
 country char(2) not null, endpoint text not null default '', config jsonb not null default '{}'::jsonb,
 credential_cipher text, credential_header text, approved boolean not null default false, enabled boolean not null default false,
 publication_mode text not null default 'none' check(publication_mode in ('full','metadata','none')),
 version integer not null default 1, created_by uuid, updated_by uuid, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.jobkix_supply_missions (
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.jobkix_supply_sources(id) on delete restrict,
 state text not null default 'queued' check(state in ('queued','running','completed','failed','cancelled')),
 country char(2) not null, config_snapshot jsonb not null, source_version integer not null, worker_id text,
 lease_until timestamptz, attempts integer not null default 0, started_at timestamptz, ended_at timestamptz, processed integer not null default 0,
 accepted integer not null default 0, rejected integer not null default 0, error_message text,
 created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists jobkix_supply_missions_queue_idx on public.jobkix_supply_missions(state,created_at);
create table if not exists public.jobkix_supply_vacancies (
 id uuid primary key default gen_random_uuid(),source_id uuid not null references public.jobkix_supply_sources(id) on delete restrict,
 mission_id uuid references public.jobkix_supply_missions(id) on delete set null, fingerprint text not null unique,
 external_ref text,title text not null,company text not null default '',country char(2) not null,city text not null default '',
 canonical_url text not null,description text not null default '',salary_text text not null default '',work_mode text not null default '',posted_at text,
 raw jsonb not null default '{}'::jsonb, normalized jsonb not null default '{}'::jsonb, review_notes text not null default '', state text not null default 'new' check(state in ('new','ready','needs_review','approved','published','rejected','withdrawn')),
 quality_score integer not null default 0 check(quality_score between 0 and 100),
 version integer not null default 1, first_seen timestamptz not null default now(),last_seen timestamptz not null default now(),
 approved_by uuid,published_by uuid,published_at timestamptz,updated_at timestamptz not null default now()
);
create index if not exists jobkix_supply_vacancies_public_idx on public.jobkix_supply_vacancies(state,country,published_at desc) where state='published';
create index if not exists jobkix_supply_vacancies_review_idx on public.jobkix_supply_vacancies(state,first_seen desc);
create table if not exists public.jobkix_supply_events (
 id bigint generated always as identity primary key, actor text not null, action text not null,source_id uuid,mission_id uuid,vacancy_id uuid,
 data jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index if not exists jobkix_supply_events_created_idx on public.jobkix_supply_events(created_at desc);
alter table public.jobkix_supply_sources enable row level security;
alter table public.jobkix_supply_missions enable row level security;
alter table public.jobkix_supply_vacancies enable row level security;
alter table public.jobkix_supply_events enable row level security;
revoke all on public.jobkix_supply_sources, public.jobkix_supply_missions, public.jobkix_supply_vacancies,public.jobkix_supply_events from anon, authenticated;
grant all on public.jobkix_supply_sources, public.jobkix_supply_missions, public.jobkix_supply_vacancies,public.jobkix_supply_events to service_role;
grant usage,select on sequence public.jobkix_supply_events_id_seq to service_role;
-- Atomic SKIP LOCKED claim. Worker endpoint must authenticate before calling RPC.
create or replace function public.jobkix_supply_claim(p_worker text)
returns setof public.jobkix_supply_missions language plpgsql security definer set search_path=public as $$
declare row_id uuid;
begin
 if length(p_worker)<4 or length(p_worker)>128 then raise exception 'INVALID_WORKER';end if;
 update public.jobkix_supply_missions set state='failed',ended_at=now(),error_message='Worker lease exhausted after 3 attempts',updated_at=now() where state='running' and lease_until<now() and attempts>=3;
 select id into row_id from public.jobkix_supply_missions where (state='queued' or (state='running' and lease_until<now() and attempts<3)) order by created_at asc for update skip locked limit 1;
 if row_id is null then return;end if;
 return query update public.jobkix_supply_missions set state='running',worker_id=p_worker,started_at=now(),updated_at=now(),attempts=attempts+1,lease_until=now()+interval '15 minutes' where id=row_id returning *;
end;$$;
revoke all on function public.jobkix_supply_claim(text) from public,anon,authenticated;
grant execute on function public.jobkix_supply_claim(text) to service_role;
commit;
