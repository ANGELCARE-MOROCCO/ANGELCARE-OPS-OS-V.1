-- CARELINK P17 — Payments / Honoraires Disputes
-- Scope: mobile agent honoraires breakdown and payment dispute workflow.

alter table if exists public.carelink_payment_disputes
  add column if not exists dispute_type text not null default 'payment_correction',
  add column if not exists target_line_id text null,
  add column if not exists target_line_kind text null,
  add column if not exists amount_expected numeric null,
  add column if not exists amount_paid numeric null,
  add column if not exists evidence_url text null,
  add column if not exists agent_note text null,
  add column if not exists ops_review_status text not null default 'pending_ops_review',
  add column if not exists reviewed_by text null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists review_note text null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists carelink_payment_disputes_status_idx on public.carelink_payment_disputes (status, ops_review_status, created_at desc);
create index if not exists carelink_payment_disputes_target_line_idx on public.carelink_payment_disputes (target_line_id, target_line_kind);
create index if not exists carelink_payment_disputes_caregiver_mission_idx on public.carelink_payment_disputes (caregiver_id, mission_id, created_at desc);

alter table public.carelink_payment_disputes enable row level security;

drop policy if exists "carelink payment disputes caregiver read" on public.carelink_payment_disputes;
create policy "carelink payment disputes caregiver read"
  on public.carelink_payment_disputes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_payment_disputes.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink payment disputes caregiver insert" on public.carelink_payment_disputes;
create policy "carelink payment disputes caregiver insert"
  on public.carelink_payment_disputes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_payment_disputes.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink payment disputes authenticated write" on public.carelink_payment_disputes;
create policy "carelink payment disputes authenticated write"
  on public.carelink_payment_disputes
  for all
  to authenticated
  using (true)
  with check (true);
