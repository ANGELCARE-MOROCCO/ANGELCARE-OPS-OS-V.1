-- AngelCare 360 Phase 1C - Production Guard Wiring
-- Ref: AC360-PH1C-GUARD-WIRING-2026-06-30
-- Scope: strict action guard chain for production buttons/actions.
-- Safe to run multiple times on Supabase Postgres.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Guard decision ledger: every production action check leaves a trace.
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_guard_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  action_key text not null,
  feature_key text,
  meter_key text,
  actor_app_user_id uuid,
  requested_quantity numeric not null default 1,
  allowed boolean not null default false,
  decision text not null,
  reason text not null,
  source text not null default 'guard',
  guard_stage text not null,
  access_mode text,
  capacity_key text,
  capacity_current numeric,
  capacity_limit numeric,
  credits_required numeric not null default 0,
  wallet_balance_before numeric,
  usage_event_id uuid references public.ac360_usage_events(id) on delete set null,
  idempotency_key text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ac360_guard_decisions_org_created on public.ac360_guard_decisions(org_id, created_at desc);
create index if not exists idx_ac360_guard_decisions_action on public.ac360_guard_decisions(action_key, allowed, created_at desc);
create index if not exists idx_ac360_guard_decisions_stage on public.ac360_guard_decisions(guard_stage, decision, created_at desc);
create unique index if not exists idx_ac360_guard_decisions_idempotent
  on public.ac360_guard_decisions(org_id, action_key, idempotency_key)
  where idempotency_key is not null;

alter table public.ac360_guard_decisions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ac360_guard_decisions' and policyname='ac360_guard_decisions_service_role_all'
  ) then
    create policy ac360_guard_decisions_service_role_all on public.ac360_guard_decisions
      for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Capacity measurement function.
-- -----------------------------------------------------------------------------
create or replace function public.ac360_measure_capacity(
  p_org_id uuid,
  p_capacity_key text,
  p_current_value numeric default null,
  p_source_table text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sub public.ac360_subscriptions%rowtype;
  v_current numeric := greatest(coalesce(p_current_value, 0), 0);
  v_limit numeric;
  v_limit_count integer := 0;
  v_snapshot public.ac360_capacity_snapshots%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if p_capacity_key is null or length(trim(p_capacity_key)) = 0 then raise exception 'p_capacity_key is required'; end if;

  select * into v_sub
  from public.ac360_subscriptions
  where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
  order by case status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 when 'past_due' then 4 else 5 end, created_at desc
  limit 1;

  if p_current_value is null then
    select current_value into v_current
    from public.ac360_capacity_snapshots
    where org_id = p_org_id and capacity_key = p_capacity_key
    order by measured_at desc
    limit 1;
    v_current := greatest(coalesce(v_current, 0), 0);
  end if;

  if v_sub.id is not null then
    select sum(limit_value), count(limit_value)
      into v_limit, v_limit_count
    from (
      select pe.limit_value
      from public.ac360_plan_entitlements pe
      where pe.plan_version_id = v_sub.plan_version_id
        and pe.limit_key = p_capacity_key
        and pe.access_mode in ('included','limited','metered')
        and pe.limit_value is not null
      union all
      select ae.limit_value
      from public.ac360_subscription_items si
      join public.ac360_addon_entitlements ae on ae.addon_key = si.addon_key
      where si.org_id = p_org_id
        and si.subscription_id = v_sub.id
        and si.status in ('active','cancel_pending')
        and ae.limit_key = p_capacity_key
        and ae.access_mode in ('included','limited','metered')
        and ae.limit_value is not null
    ) limits;
  end if;

  if v_limit_count = 0 then
    v_limit := null;
  end if;

  insert into public.ac360_capacity_snapshots(org_id, subscription_id, capacity_key, current_value, limit_value, source_table, metadata_json)
  values (p_org_id, v_sub.id, p_capacity_key, v_current, v_limit, p_source_table, coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('source','phase1c_guard_wiring'))
  returning * into v_snapshot;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-25', 'capacity.measured', 'capacity.measure', 'capacity_snapshot', v_snapshot.id, 'success', 'info', null, null, jsonb_build_object('capacity_key',p_capacity_key,'current',v_current,'limit',v_limit));

  return jsonb_build_object(
    'ok', true,
    'capacityKey', p_capacity_key,
    'currentValue', v_current,
    'limitValue', v_limit,
    'subscriptionId', v_sub.id,
    'snapshot', to_jsonb(v_snapshot)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Strict production action guard.
-- -----------------------------------------------------------------------------
create or replace function public.ac360_guard_action(
  p_org_id uuid,
  p_action_key text,
  p_quantity numeric default 1,
  p_actor_app_user_id uuid default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_record_usage boolean default false,
  p_current_capacity numeric default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_existing public.ac360_guard_decisions%rowtype;
  v_action record;
  v_org public.ac360_organizations%rowtype;
  v_sub public.ac360_subscriptions%rowtype;
  v_restriction public.ac360_restrictions%rowtype;
  v_feature_key text;
  v_meter_key text;
  v_access_type text := 'write';
  v_capacity_key text;
  v_suggested_addon_key text;
  v_allowed boolean := true;
  v_decision text := 'allowed';
  v_reason text := 'Action allowed by AC360 guard.';
  v_source text := 'guard';
  v_stage text := 'ready';
  v_access_mode text;
  v_capacity_current numeric;
  v_capacity_limit numeric;
  v_limit_count integer := 0;
  v_required_credits numeric := 0;
  v_credit_cost numeric := 0;
  v_wallet public.ac360_credit_wallets%rowtype;
  v_usage_event_id uuid;
  v_has record;
  v_guard_id uuid;
  v_qty numeric := greatest(coalesce(p_quantity, 1), 0);
  v_result text;
  v_severity text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if p_action_key is null or length(trim(p_action_key)) = 0 then raise exception 'p_action_key is required'; end if;

  if p_idempotency_key is not null then
    select * into v_existing
    from public.ac360_guard_decisions
    where org_id = p_org_id and action_key = p_action_key and idempotency_key = p_idempotency_key
    limit 1;
    if v_existing.id is not null then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'allowed', v_existing.allowed,
        'decision', v_existing.decision,
        'reason', v_existing.reason,
        'source', v_existing.source,
        'guardStage', v_existing.guard_stage,
        'guardDecisionId', v_existing.id,
        'usageEventId', v_existing.usage_event_id,
        'actionKey', p_action_key,
        'featureKey', v_existing.feature_key,
        'meterKey', v_existing.meter_key
      );
    end if;
  end if;

  select ar.*, fr.default_meter_key, fr.default_credit_cost as feature_default_credit_cost
    into v_action
  from public.ac360_action_registry ar
  join public.ac360_feature_registry fr on fr.feature_key = ar.feature_key
  where ar.action_key = p_action_key
  limit 1;

  if not found then
    v_allowed := false;
    v_decision := 'unknown_action';
    v_reason := 'Action is not registered in ac360_action_registry.';
    v_stage := 'action_registry';
  else
    v_feature_key := v_action.feature_key;
    v_meter_key := coalesce(v_action.meter_key, v_action.default_meter_key);
    v_access_type := coalesce(v_action.metadata_json->>'access_type', 'write');
    v_capacity_key := nullif(v_action.metadata_json->>'capacity_key', '');
    v_suggested_addon_key := nullif(v_action.metadata_json->>'suggested_addon_key', '');
    v_credit_cost := coalesce(nullif(v_action.credit_cost, 0), v_action.feature_default_credit_cost, 0);
  end if;

  if v_allowed then
    select * into v_org from public.ac360_organizations where id = p_org_id limit 1;
    if v_org.id is null then
      v_allowed := false;
      v_decision := 'organization_not_found';
      v_reason := 'No AC360 organization exists for this action.';
      v_stage := 'organization';
    elsif v_org.status in ('suspended','cancelled','archived') or v_org.lifecycle_status in ('suspended','cancelled','archived') then
      v_allowed := false;
      v_decision := 'organization_restricted';
      v_reason := 'Organization status does not allow production actions: ' || v_org.status || ' / ' || v_org.lifecycle_status;
      v_stage := 'organization_status';
    end if;
  end if;

  if v_allowed then
    select * into v_sub
    from public.ac360_subscriptions
    where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
    order by case status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 when 'past_due' then 4 else 5 end, created_at desc
    limit 1;

    if v_sub.id is null then
      v_allowed := false;
      v_decision := 'no_subscription';
      v_reason := 'No active, trial, grace, past_due or restricted subscription found.';
      v_stage := 'subscription';
    end if;
  end if;

  if v_allowed then
    select * into v_restriction
    from public.ac360_restrictions r
    where r.org_id = p_org_id
      and r.status = 'active'
      and (r.ends_at is null or r.ends_at > now())
      and (
        r.target_action_key is null or r.target_action_key = p_action_key
        or r.target_feature_key is null or r.target_feature_key = v_feature_key
        or (v_meter_key is not null and (r.target_meter_key is null or r.target_meter_key = v_meter_key))
      )
      and r.behavior in ('block','read_only','suspend_non_admin','admin_only','topup_required','upgrade_required')
    order by case r.behavior when 'block' then 1 when 'suspend_non_admin' then 2 when 'admin_only' then 3 when 'topup_required' then 4 when 'upgrade_required' then 5 when 'read_only' then 6 else 9 end, r.created_at desc
    limit 1;

    if v_restriction.id is not null then
      if v_restriction.behavior = 'read_only' and v_access_type = 'read' then
        v_stage := 'restriction_read_only_allowed';
      elsif v_restriction.behavior = 'admin_only' and lower(coalesce(p_metadata->>'is_admin','false')) in ('true','1','yes') then
        v_stage := 'restriction_admin_override';
      else
        v_allowed := false;
        v_decision := case v_restriction.behavior when 'topup_required' then 'topup_required' when 'upgrade_required' then 'upgrade_required' else 'blocked' end;
        v_reason := coalesce(v_restriction.reason, 'Action blocked by active AC360 restriction.');
        v_stage := 'restriction';
        v_access_mode := v_restriction.behavior;
      end if;
    end if;
  end if;

  if v_allowed then
    select * into v_has from public.ac360_has_feature(p_org_id, v_feature_key, p_action_key, v_qty) limit 1;
    v_access_mode := v_has.access_mode;
    if coalesce(v_has.allowed, false) = false then
      if v_has.decision = 'read_only' and v_access_type = 'read' then
        v_stage := 'entitlement_read_only_allowed';
      else
        v_allowed := false;
        v_decision := coalesce(v_has.decision, 'upgrade_required');
        v_reason := coalesce(v_has.reason, 'Feature/action is not included in the current package or active add-ons.');
        v_source := coalesce(v_has.source, 'entitlement');
        v_stage := 'entitlement';
      end if;
    end if;
  end if;

  if v_allowed and v_capacity_key is not null then
    if p_current_capacity is not null then
      v_capacity_current := greatest(p_current_capacity, 0);
    else
      select current_value into v_capacity_current
      from public.ac360_capacity_snapshots
      where org_id = p_org_id and capacity_key = v_capacity_key
      order by measured_at desc
      limit 1;
      v_capacity_current := greatest(coalesce(v_capacity_current, 0), 0);
    end if;

    select sum(limit_value), count(limit_value)
      into v_capacity_limit, v_limit_count
    from (
      select pe.limit_value
      from public.ac360_plan_entitlements pe
      where pe.plan_version_id = v_sub.plan_version_id
        and pe.limit_key = v_capacity_key
        and pe.access_mode in ('included','limited','metered')
        and pe.limit_value is not null
      union all
      select ae.limit_value
      from public.ac360_subscription_items si
      join public.ac360_addon_entitlements ae on ae.addon_key = si.addon_key
      where si.org_id = p_org_id
        and si.subscription_id = v_sub.id
        and si.status in ('active','cancel_pending')
        and ae.limit_key = v_capacity_key
        and ae.access_mode in ('included','limited','metered')
        and ae.limit_value is not null
    ) capacity_limits;

    if v_limit_count = 0 then v_capacity_limit := null; end if;

    if v_capacity_limit is not null and (v_capacity_current + v_qty) > v_capacity_limit then
      v_allowed := false;
      v_decision := 'upgrade_required';
      v_reason := 'Capacity limit reached for ' || v_capacity_key || ': current ' || v_capacity_current || ', requested +' || v_qty || ', limit ' || v_capacity_limit || '.';
      v_stage := 'capacity_limit';

      insert into public.ac360_restrictions(org_id, subscription_id, restriction_key, status, severity, restriction_type, target_feature_key, target_action_key, target_meter_key, behavior, reason, metadata_json)
      values (p_org_id, v_sub.id, 'capacity_reached_' || replace(v_capacity_key, ' ', '_'), 'active', 'warning', 'capacity', v_feature_key, p_action_key, null, 'upgrade_required', v_reason, jsonb_build_object('capacity_key',v_capacity_key,'current',v_capacity_current,'limit',v_capacity_limit,'suggested_addon_key',v_suggested_addon_key))
      on conflict (org_id, restriction_key, target_feature_key, target_action_key, status) do update set reason = excluded.reason, metadata_json = excluded.metadata_json, updated_at = now();

      if v_suggested_addon_key is not null then
        insert into public.ac360_recommendations(org_id, subscription_id, recommendation_key, status, priority, title, message, recommended_addon_key, trigger_json, metadata_json)
        select p_org_id, v_sub.id, 'upgrade_' || v_capacity_key || '_' || v_suggested_addon_key, 'open', 'high',
               'Capacity limit reached',
               'Activate ' || v_suggested_addon_key || ' or upgrade the package before continuing this action.',
               v_suggested_addon_key,
               jsonb_build_object('action_key',p_action_key,'capacity_key',v_capacity_key,'current',v_capacity_current,'limit',v_capacity_limit),
               jsonb_build_object('source','phase1c_guard_wiring')
        where not exists (
          select 1 from public.ac360_recommendations rr
          where rr.org_id = p_org_id and rr.recommendation_key = 'upgrade_' || v_capacity_key || '_' || v_suggested_addon_key and rr.status = 'open'
        );
      end if;
    end if;
  end if;

  if v_allowed and v_meter_key is not null then
    v_required_credits := greatest(v_credit_cost * v_qty, 0);
    if v_required_credits > 0 then
      insert into public.ac360_credit_wallets(org_id, wallet_key, credit_type, status, balance, monthly_included_allowance, rollover_policy)
      values (p_org_id, 'main', 'angelcare_credits', 'active', 0, 0, 'no_rollover')
      on conflict (org_id, wallet_key) do update set updated_at = now()
      returning * into v_wallet;

      if v_wallet.balance < v_required_credits then
        v_allowed := false;
        v_decision := 'topup_required';
        v_reason := 'Insufficient AngelCare Credits for ' || p_action_key || ': required ' || v_required_credits || ', available ' || v_wallet.balance || '.';
        v_stage := 'credits';
        v_access_mode := 'topup_required';

        insert into public.ac360_restrictions(org_id, subscription_id, restriction_key, status, severity, restriction_type, target_feature_key, target_action_key, target_meter_key, behavior, reason, metadata_json)
        values (p_org_id, v_sub.id, 'credits_required_' || coalesce(v_meter_key,'unknown'), 'active', 'critical', 'usage', v_feature_key, p_action_key, v_meter_key, 'topup_required', v_reason, jsonb_build_object('required_credits',v_required_credits,'wallet_balance',v_wallet.balance,'action_key',p_action_key))
        on conflict (org_id, restriction_key, target_feature_key, target_action_key, status) do update set reason = excluded.reason, metadata_json = excluded.metadata_json, updated_at = now();

        insert into public.ac360_recommendations(org_id, subscription_id, recommendation_key, status, priority, title, message, recommended_addon_key, recommended_bundle_key, trigger_json, metadata_json)
        select p_org_id, v_sub.id, 'topup_required_' || coalesce(v_meter_key,'credits'), 'open', 'critical',
               'AngelCare Credits top-up required',
               'Buy a credit pack or switch to Sérénité to avoid action interruptions.',
               'credits_5000', 'serenite_plus',
               jsonb_build_object('meter_key',v_meter_key,'required_credits',v_required_credits,'wallet_balance',v_wallet.balance),
               jsonb_build_object('source','phase1c_guard_wiring')
        where not exists (
          select 1 from public.ac360_recommendations rr
          where rr.org_id = p_org_id and rr.recommendation_key = 'topup_required_' || coalesce(v_meter_key,'credits') and rr.status = 'open'
        );
      end if;
    else
      select * into v_wallet from public.ac360_credit_wallets where org_id = p_org_id and wallet_key = 'main' limit 1;
    end if;
  end if;

  if v_allowed and p_record_usage and v_meter_key is not null then
    v_usage_event_id := public.ac360_record_usage(
      p_org_id,
      v_meter_key,
      v_qty,
      v_feature_key,
      p_action_key,
      p_actor_app_user_id,
      p_idempotency_key,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('guarded',true,'phase','phase1c')
    );
    v_stage := 'usage_recorded';
  elsif v_allowed then
    v_stage := case when v_stage = 'ready' then 'allowed' else v_stage end;
  end if;

  v_result := case when v_allowed then 'success' else 'blocked' end;
  v_severity := case when v_allowed then 'info' when v_decision in ('topup_required','blocked','organization_restricted') then 'critical' else 'warning' end;

  insert into public.ac360_guard_decisions(
    org_id, subscription_id, action_key, feature_key, meter_key, actor_app_user_id, requested_quantity,
    allowed, decision, reason, source, guard_stage, access_mode, capacity_key, capacity_current,
    capacity_limit, credits_required, wallet_balance_before, usage_event_id, idempotency_key, metadata_json
  ) values (
    p_org_id, v_sub.id, p_action_key, v_feature_key, v_meter_key, p_actor_app_user_id, v_qty,
    v_allowed, v_decision, v_reason, v_source, v_stage, v_access_mode, v_capacity_key, v_capacity_current,
    v_capacity_limit, v_required_credits, v_wallet.balance, v_usage_event_id, p_idempotency_key,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('record_usage_requested',p_record_usage,'phase','phase1c_guard_wiring')
  ) returning id into v_guard_id;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-26', 'guard.action.' || v_decision, p_action_key, 'guard_decision', v_guard_id, v_result, v_severity, p_actor_app_user_id, null, jsonb_build_object('allowed',v_allowed,'stage',v_stage,'feature_key',v_feature_key,'meter_key',v_meter_key,'usage_event_id',v_usage_event_id));

  return jsonb_build_object(
    'ok', true,
    'allowed', v_allowed,
    'decision', v_decision,
    'reason', v_reason,
    'source', v_source,
    'guardStage', v_stage,
    'guardDecisionId', v_guard_id,
    'actionKey', p_action_key,
    'featureKey', v_feature_key,
    'meterKey', v_meter_key,
    'subscriptionId', v_sub.id,
    'usageEventId', v_usage_event_id,
    'accessMode', v_access_mode,
    'capacity', jsonb_build_object('capacityKey',v_capacity_key,'current',v_capacity_current,'limit',v_capacity_limit),
    'credits', jsonb_build_object('required',v_required_credits,'walletBalance',v_wallet.balance),
    'recordUsage', p_record_usage
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Phase 1C production action registry expansion.
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('org.update','institution_profile','AC360-ENG-01','Update organization profile','Update institution profile and account identity.','foundation.org.update',null,0,'block','{"access_type":"write"}'::jsonb),
('campus.create','campus_management','AC360-ENG-25','Create campus','Add a campus/site with capacity guard.','capacity.campus','campus_capacity',0,'require_upgrade','{"access_type":"write","capacity_key":"campuses","suggested_addon_key":"extra_campus"}'::jsonb),
('campus.update','campus_management','AC360-ENG-02','Update campus','Update campus/site details.','capacity.campus.update',null,0,'block','{"access_type":"write"}'::jsonb),
('user.invite','staff_core','AC360-ENG-09','Invite user','Invite school staff or internal user with staff capacity guard.','capacity.staff_users','staff_user_capacity',0,'require_upgrade','{"access_type":"write","capacity_key":"staff_users","suggested_addon_key":"extra_5_staff"}'::jsonb),
('user.suspend','staff_core','AC360-ENG-09','Suspend user','Suspend or restrict a user while preserving history.','users.suspend',null,0,'block','{"access_type":"write"}'::jsonb),
('role.assign','rbac_basic','AC360-ENG-07','Assign role','Assign RBAC role to a membership.','rbac.assign',null,0,'block','{"access_type":"write"}'::jsonb),
('permission.customize','rbac_advanced','AC360-ENG-08','Customize permissions','Create or edit advanced role permissions.','rbac.advanced.customize',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"enterprise_security"}'::jsonb),
('billing.view','billing_center','AC360-ENG-17','View billing center','Open billing center, invoices, usage and active package.','billing.view',null,0,'block','{"access_type":"read"}'::jsonb),
('subscription.change_plan','billing_center','AC360-ENG-15','Change package','Upgrade or downgrade base package.','subscription.change_plan',null,0,'block','{"access_type":"write"}'::jsonb),
('addon.activate','billing_center','AC360-ENG-29','Activate add-on','Activate Growth Menu add-on.','addons.activate',null,0,'block','{"access_type":"write"}'::jsonb),
('addon.cancel','billing_center','AC360-ENG-30','Cancel add-on','Cancel Growth Menu add-on while preserving data.','addons.cancel',null,0,'block','{"access_type":"write","data_preservation":"read_only_after_period"}'::jsonb),
('invoice.generate','finance_basic','AC360-ENG-17','Generate invoice','Generate school invoice and billable PDF/report output.','finance.invoice.generate','report_generation',10,'require_topup','{"access_type":"write"}'::jsonb),
('payment.record','finance_basic','AC360-ENG-19','Record payment','Record cash, transfer, cheque or manual payment.','finance.payment.record',null,0,'block','{"access_type":"write"}'::jsonb),
('credits.topup','credit_wallet','AC360-ENG-36','Top up credits','Add AngelCare Credits to the wallet.','credits.topup',null,0,'block','{"access_type":"write"}'::jsonb),
('student.create','student_core','AC360-ENG-25','Create student','Add active student with capacity guard.','capacity.students','student_capacity',0,'require_upgrade','{"access_type":"write","capacity_key":"students","suggested_addon_key":"extra_50_students"}'::jsonb),
('student.archive','student_core','AC360-ENG-45','Archive student','Archive student while preserving history.','students.archive',null,0,'block','{"access_type":"write","data_preservation":"archive_not_delete"}'::jsonb),
('parent.invite','parent_portal_basic','AC360-ENG-46','Invite parent','Invite parent/guardian to portal.','parents.invite','email_message',1,'require_topup','{"access_type":"write"}'::jsonb),
('classroom.create','classroom_core','AC360-ENG-47','Create classroom','Create classroom/level/group.','capacity.classes',null,0,'require_upgrade','{"access_type":"write","capacity_key":"classes"}'::jsonb),
('attendance.record','attendance_basic','AC360-ENG-48','Record attendance','Record student or staff presence.','attendance.record',null,0,'block','{"access_type":"write"}'::jsonb),
('attendance.correct','attendance_advanced','AC360-ENG-48','Correct attendance','Correct attendance with governance approval.','attendance.correct',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"workflow_builder"}'::jsonb),
('finance.payment_reminder','communication_whatsapp','AC360-ENG-33','Send payment reminder','Send WhatsApp payment reminder.','communication.reminder.send','whatsapp_message',3,'require_topup','{"access_type":"write","suggested_addon_key":"communication_omnichannel"}'::jsonb),
('communication.announcement_send','communication_basic','AC360-ENG-33','Send announcement','Send parent/staff announcement.','communication.announcement.send','email_message',1,'require_topup','{"access_type":"write"}'::jsonb),
('communication.whatsapp_send','communication_whatsapp','AC360-ENG-33','Send WhatsApp','Send WhatsApp notification or campaign.','communication.whatsapp.send','whatsapp_message',3,'require_topup','{"access_type":"write","suggested_addon_key":"communication_omnichannel"}'::jsonb),
('communication.sms_send','communication_sms','AC360-ENG-33','Send SMS','Send SMS notification or emergency alert.','communication.sms.send','sms_message',5,'require_topup','{"access_type":"write","suggested_addon_key":"communication_omnichannel"}'::jsonb),
('automation.run','automation_limited','AC360-ENG-33','Run automation','Execute included automation workflow.','automation.run','automation_credit',1,'require_topup','{"access_type":"write"}'::jsonb),
('automation.create_custom','automation_builder','AC360-ENG-33','Create custom workflow','Create custom workflow builder rule.','automation.builder.create',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"workflow_builder"}'::jsonb),
('report.generate_pdf','reports_basic','AC360-ENG-51','Generate PDF report','Generate PDF/export/report.','reports.generate','report_generation',10,'require_topup','{"access_type":"write"}'::jsonb),
('report.executive_generate','reports_executive','AC360-ENG-51','Generate executive report','Generate advanced owner/director report.','reports.executive.generate','report_generation',10,'require_topup','{"access_type":"write"}'::jsonb),
('document.upload','documents_storage','AC360-ENG-50','Upload document','Upload document/file with storage guard.','documents.upload','storage_gb',0,'require_upgrade','{"access_type":"write","capacity_key":"storage_gb","suggested_addon_key":"storage_25gb"}'::jsonb),
('admissions.lead_create','admissions_basic','AC360-ENG-45','Create admissions lead','Create a prospect or waiting-list child.','admissions.lead.create',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"advanced_admissions"}'::jsonb),
('admissions.campaign_send','admissions_advanced','AC360-ENG-33','Send admissions campaign','Bulk admissions WhatsApp/email campaign.','admissions.campaign.send','whatsapp_message',3,'require_topup','{"access_type":"write","suggested_addon_key":"advanced_admissions"}'::jsonb),
('parenttrust.survey_send','parenttrust','AC360-ENG-33','Send ParentTrust survey','Send satisfaction survey to parents.','parenttrust.survey.send','email_message',1,'require_topup','{"access_type":"write","suggested_addon_key":"parenttrust"}'::jsonb),
('parenttrust.ticket_create','parenttrust','AC360-ENG-52','Create parent ticket','Create complaint/ticket case.','parenttrust.ticket.create',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"parenttrust"}'::jsonb),
('hr.recruitment_create','hr_staffing','AC360-ENG-52','Create recruitment case','Create HR/recruitment pipeline case.','hr.recruitment.create',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"hr_staffing"}'::jsonb),
('academy.certificate_generate','academy_training','AC360-ENG-51','Generate certificate','Generate training certificate.','academy.certificate.generate','report_generation',10,'require_topup','{"access_type":"write","suggested_addon_key":"academy_training"}'::jsonb),
('transport.route_create','transport_module','AC360-ENG-52','Create transport route','Create route/vehicle/driver workflow.','transport.route.create',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"transport_module"}'::jsonb),
('ai.message_generate','ai_assistant','AC360-ENG-33','Generate AI message','Generate AI-assisted parent/staff message.','ai.message.generate','ai_credit',10,'require_topup','{"access_type":"write","suggested_addon_key":"ai_assistant"}'::jsonb),
('ai.report_generate','ai_assistant','AC360-ENG-33','Generate AI report','Generate AI-assisted report/summary.','ai.report.generate','ai_credit',30,'require_topup','{"access_type":"write","suggested_addon_key":"ai_assistant"}'::jsonb),
('branding.update','white_label_branding','AC360-ENG-32','Update branding','Update branded portal/documents/domain.','branding.update',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"white_label_branding"}'::jsonb),
('api.webhook_call','api_webhooks','AC360-ENG-33','Webhook/API call','Execute external API/webhook call.','api.webhook.call','automation_credit',1,'require_upgrade','{"access_type":"write","suggested_addon_key":"api_webhooks"}'::jsonb),
('audit.view','audit_logs','AC360-ENG-10','View audit logs','View sensitive audit history.','audit.view',null,0,'require_upgrade','{"access_type":"read"}'::jsonb),
('data.export','billing_center','AC360-ENG-44','Export data','Export account data without deleting source records.','data.export','report_generation',10,'require_topup','{"access_type":"write","data_preservation":"export_copy"}'::jsonb),
('lifecycle.reconcile','billing_center','AC360-ENG-41','Reconcile lifecycle','Run trial/grace/overdue/restriction reconciliation.','lifecycle.reconcile',null,0,'block','{"access_type":"write"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 5. Automation rule seeds for Phase 1C guard events.
-- -----------------------------------------------------------------------------
insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase1c.guard.every_action_audited','Every guarded action is audited','Entitlement & Feature Control System','guard.action.*','{"required":true}'::jsonb,'{"write_audit":true,"write_guard_decision":true}'::jsonb,80,'active','phase_1c_guard_wiring'),
('phase1c.guard.capacity_upgrade_required','Capacity guard creates upgrade recommendation','Entitlement & Feature Control System','guard.capacity_limit','{"decision":"upgrade_required"}'::jsonb,'{"create_restriction":true,"recommend_addon":true}'::jsonb,81,'active','phase_1c_guard_wiring'),
('phase1c.guard.credits_topup_required','Credit guard creates top-up recommendation','Usage, Credits & Metering System','guard.credits','{"decision":"topup_required"}'::jsonb,'{"create_restriction":true,"recommend_credit_pack":"credits_5000","recommend_bundle":"serenite_plus"}'::jsonb,82,'active','phase_1c_guard_wiring'),
('phase1c.guard.execute_after_allow','Usage records only after allowed execution','Usage, Credits & Metering System','guard.usage_recorded','{"allowed":true,"record_usage":true}'::jsonb,'{"record_usage_event":true,"deduct_wallet":true}'::jsonb,83,'active','phase_1c_guard_wiring')
on conflict (rule_key) do update set label=excluded.label, condition_json=excluded.condition_json, action_json=excluded.action_json, sort_order=excluded.sort_order, status=excluded.status, phase=excluded.phase, updated_at=now();

-- -----------------------------------------------------------------------------
-- 6. Permissions for guard management.
-- -----------------------------------------------------------------------------
insert into public.ac360_permissions(permission_key, category, label, description, risk_level, is_system_locked) values
('ac360.guard.check','AC360 Guard','Check guarded action','Allows checking AC360 production action access.', 'medium', true),
('ac360.guard.execute','AC360 Guard','Execute guarded action','Allows executing AC360 guarded action with usage metering.', 'high', true),
('ac360.capacity.measure','AC360 Guard','Measure capacity','Allows writing AC360 capacity snapshots.', 'medium', true),
('ac360.guard.view','AC360 Guard','View guardrails','Allows viewing AC360 guard decisions and guardrails.', 'medium', true)
on conflict (permission_key) do update set label=excluded.label, description=excluded.description, risk_level=excluded.risk_level, updated_at=now();
