-- AngelCare 360 Phase 1B Runtime Bridge
-- Ref: AC360-PH1B-RUNTIME-BRIDGE-2026-06-30
-- Scope: make Phase 1 alive after SQL foundation: bootstrap tenant/subscription, wallet, add-ons, credits, invoice generation and lifecycle reconciliation.
-- Safe to run multiple times after 20260630_ac360_phase1_foundation.sql.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Runtime bootstrap: first live organization + campus + owner + plan + wallet
-- -----------------------------------------------------------------------------
create or replace function public.ac360_bootstrap_foundation_org(
  p_org_code text default 'ANGELCARE360-INTERNAL',
  p_display_name text default 'AngelCare 360 Internal Command',
  p_owner_app_user_id uuid default null,
  p_owner_email text default null,
  p_plan_key text default 'command',
  p_city text default 'Temara',
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_org public.ac360_organizations%rowtype;
  v_campus public.ac360_campuses%rowtype;
  v_year public.ac360_academic_years%rowtype;
  v_plan record;
  v_sub public.ac360_subscriptions%rowtype;
  v_membership public.ac360_user_memberships%rowtype;
  v_role public.ac360_roles%rowtype;
  v_wallet public.ac360_credit_wallets%rowtype;
  v_allowance numeric := 0;
  v_period_end timestamptz := now() + interval '1 month';
  v_subscription_code text;
  v_normalized_org_code text;
begin
  v_normalized_org_code := upper(regexp_replace(coalesce(nullif(trim(p_org_code), ''), 'ANGELCARE360-INTERNAL'), '[^A-Za-z0-9_-]+', '-', 'g'));
  v_subscription_code := 'AC360-SUB-' || v_normalized_org_code;

  if coalesce(p_plan_key, '') not in ('start','pro','command') then
    raise exception 'Invalid AC360 plan key: %. Expected start, pro or command.', p_plan_key;
  end if;

  select p.id as plan_id, p.plan_key, p.commercial_name, p.public_monthly_price_mad, p.public_annual_price_mad,
         pv.id as plan_version_id, pv.version_code, pv.included_credits_json
    into v_plan
  from public.ac360_plans p
  join public.ac360_plan_versions pv on pv.plan_id = p.id and pv.status = 'active'
  where p.plan_key = p_plan_key
  order by pv.created_at desc
  limit 1;

  if v_plan.plan_id is null then
    raise exception 'AC360 plan/version seed missing for plan key: %', p_plan_key;
  end if;

  v_allowance := coalesce((v_plan.included_credits_json ->> 'automation_credit')::numeric, 0);

  insert into public.ac360_organizations(
    org_code, display_name, legal_name, org_type, lifecycle_status, status, country, city,
    billing_email, email, timezone, currency, preferred_language, owner_app_user_id, metadata_json, created_by
  ) values (
    v_normalized_org_code,
    coalesce(nullif(trim(p_display_name), ''), 'AngelCare 360 Internal Command'),
    coalesce(nullif(trim(p_display_name), ''), 'AngelCare 360 Internal Command'),
    'kindergarten_school',
    case when p_status = 'trial' then 'trial' else 'active' end,
    case when p_status in ('trial','active','grace','restricted','suspended','cancelled','archived') then p_status else 'active' end,
    'Morocco', coalesce(nullif(trim(p_city), ''), 'Temara'), p_owner_email, p_owner_email,
    'Africa/Casablanca', 'MAD', 'fr', p_owner_app_user_id,
    jsonb_build_object('source','ac360_phase1b_runtime_bridge','bootstrap','true'), p_owner_app_user_id
  )
  on conflict (org_code) do update set
    display_name = excluded.display_name,
    legal_name = coalesce(public.ac360_organizations.legal_name, excluded.legal_name),
    city = excluded.city,
    billing_email = coalesce(excluded.billing_email, public.ac360_organizations.billing_email),
    email = coalesce(excluded.email, public.ac360_organizations.email),
    owner_app_user_id = coalesce(excluded.owner_app_user_id, public.ac360_organizations.owner_app_user_id),
    status = case when public.ac360_organizations.status in ('archived','cancelled') then public.ac360_organizations.status else excluded.status end,
    lifecycle_status = case when public.ac360_organizations.lifecycle_status in ('archived','cancelled') then public.ac360_organizations.lifecycle_status else excluded.lifecycle_status end,
    metadata_json = public.ac360_organizations.metadata_json || excluded.metadata_json,
    updated_at = now()
  returning * into v_org;

  insert into public.ac360_campuses(org_id, campus_code, name, status, city, address, email, metadata_json)
  values (v_org.id, 'MAIN', 'Campus Principal', 'active', v_org.city, v_org.address, v_org.email, jsonb_build_object('bootstrap','phase1b'))
  on conflict (org_id, campus_code) do update set name = excluded.name, status = 'active', city = excluded.city, updated_at = now()
  returning * into v_campus;

  insert into public.ac360_legal_profiles(org_id, legal_name, trade_name, billing_address, billing_contact_email, currency, metadata_json)
  values (v_org.id, v_org.legal_name, v_org.display_name, v_org.address, v_org.billing_email, 'MAD', jsonb_build_object('bootstrap','phase1b'))
  on conflict (org_id) do update set
    legal_name = coalesce(public.ac360_legal_profiles.legal_name, excluded.legal_name),
    trade_name = coalesce(public.ac360_legal_profiles.trade_name, excluded.trade_name),
    billing_contact_email = coalesce(excluded.billing_contact_email, public.ac360_legal_profiles.billing_contact_email),
    updated_at = now();

  insert into public.ac360_academic_years(org_id, label, status, starts_on, ends_on, metadata_json)
  values (v_org.id, '2026-2027', 'active', date '2026-09-01', date '2027-08-31', jsonb_build_object('bootstrap','phase1b'))
  on conflict (org_id, label) do update set status = 'active', updated_at = now()
  returning * into v_year;

  update public.ac360_organizations set current_academic_year_id = v_year.id, updated_at = now() where id = v_org.id;

  if p_owner_app_user_id is not null or p_owner_email is not null then
    insert into public.ac360_user_memberships(
      org_id, campus_id, app_user_id, email, display_name, member_type, status, default_role_key, joined_at, metadata_json
    ) values (
      v_org.id, v_campus.id, p_owner_app_user_id, p_owner_email, coalesce(p_owner_email, 'AngelCare Owner'),
      'angelcare_internal', 'active', 'owner', now(), jsonb_build_object('bootstrap','phase1b')
    )
    on conflict (org_id, app_user_id) do update set
      campus_id = excluded.campus_id,
      email = coalesce(excluded.email, public.ac360_user_memberships.email),
      status = 'active',
      default_role_key = 'owner',
      joined_at = coalesce(public.ac360_user_memberships.joined_at, now()),
      updated_at = now()
    returning * into v_membership;
  end if;

  insert into public.ac360_roles(org_id, role_key, label, description, scope, is_template, is_system_locked, status, metadata_json)
  values (v_org.id, 'owner', 'Owner / Direction Générale', 'Full AC360 owner role created by runtime bridge.', 'organization', false, true, 'active', jsonb_build_object('bootstrap','phase1b'))
  on conflict (org_id, role_key) do update set label = excluded.label, is_system_locked = true, status = 'active', updated_at = now()
  returning * into v_role;

  insert into public.ac360_role_permissions(role_id, permission_key, effect)
  select v_role.id, p.permission_key, 'allow'
  from public.ac360_permissions p
  on conflict (role_id, permission_key) do update set effect = 'allow';

  if v_membership.id is not null then
    insert into public.ac360_user_role_assignments(membership_id, role_id, campus_id, assigned_by, status, metadata_json)
    values (v_membership.id, v_role.id, null, p_owner_app_user_id, 'active', jsonb_build_object('bootstrap','phase1b'))
    on conflict (membership_id, role_id, campus_id) do update set status = 'active', updated_at = now();
  end if;

  insert into public.ac360_subscriptions(
    org_id, plan_id, plan_version_id, subscription_code, status, billing_interval, currency,
    current_period_start, current_period_end, trial_ends_at, created_by, metadata_json
  ) values (
    v_org.id, v_plan.plan_id, v_plan.plan_version_id, v_subscription_code,
    case when p_status = 'trial' then 'trial' else 'active' end,
    'monthly', 'MAD', now(), v_period_end,
    case when p_status = 'trial' then now() + interval '30 days' else null end,
    p_owner_app_user_id,
    jsonb_build_object('source','phase1b_runtime_bridge','plan_key',p_plan_key)
  )
  on conflict (subscription_code) do update set
    plan_id = excluded.plan_id,
    plan_version_id = excluded.plan_version_id,
    status = case when public.ac360_subscriptions.status in ('cancelled','archived') then public.ac360_subscriptions.status else excluded.status end,
    current_period_end = coalesce(public.ac360_subscriptions.current_period_end, excluded.current_period_end),
    metadata_json = public.ac360_subscriptions.metadata_json || excluded.metadata_json,
    updated_at = now()
  returning * into v_sub;

  if not exists (select 1 from public.ac360_subscription_items where subscription_id = v_sub.id and item_type = 'base_plan' and status in ('active','cancel_pending')) then
    insert into public.ac360_subscription_items(subscription_id, org_id, item_type, item_key, label, quantity, unit_price_mad, billing_interval, status, current_period_end, metadata_json)
    values (v_sub.id, v_org.id, 'base_plan', 'plan:' || p_plan_key, v_plan.commercial_name, 1, v_plan.public_monthly_price_mad, 'monthly', 'active', v_sub.current_period_end, jsonb_build_object('plan_key',p_plan_key));
  end if;

  insert into public.ac360_credit_wallets(org_id, wallet_key, credit_type, status, balance, monthly_included_allowance, rollover_policy, metadata_json)
  values (v_org.id, 'main', 'angelcare_credits', 'active', v_allowance, v_allowance, 'no_rollover', jsonb_build_object('source','phase1b_runtime_bridge'))
  on conflict (org_id, wallet_key) do update set
    monthly_included_allowance = excluded.monthly_included_allowance,
    status = case when public.ac360_credit_wallets.status in ('archived','expired') then public.ac360_credit_wallets.status else 'active' end,
    updated_at = now()
  returning * into v_wallet;

  insert into public.ac360_credit_ledger(wallet_id, org_id, ledger_type, amount, balance_after, reason, idempotency_key, metadata_json)
  values (v_wallet.id, v_org.id, 'grant', v_allowance, v_wallet.balance, 'Initial included allowance from ' || p_plan_key || ' package', 'bootstrap:' || v_sub.id::text, jsonb_build_object('plan_key',p_plan_key))
  on conflict (wallet_id, idempotency_key) do nothing;

  perform public.ac360_record_audit(v_org.id, 'AC360-ENG-01', 'foundation.bootstrap.completed', 'org.bootstrap', 'organization', v_org.id, 'success', 'notice', p_owner_app_user_id, p_owner_email, jsonb_build_object('plan_key',p_plan_key,'subscription_id',v_sub.id,'wallet_id',v_wallet.id));

  return jsonb_build_object(
    'ok', true,
    'org', to_jsonb(v_org),
    'campus', to_jsonb(v_campus),
    'academicYear', to_jsonb(v_year),
    'subscription', to_jsonb(v_sub),
    'membership', case when v_membership.id is null then null else to_jsonb(v_membership) end,
    'wallet', to_jsonb(v_wallet),
    'planKey', p_plan_key
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Credit wallet operations
-- -----------------------------------------------------------------------------
create or replace function public.ac360_grant_credits(
  p_org_id uuid,
  p_amount numeric,
  p_reason text default 'Manual AC360 credit grant',
  p_actor_app_user_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_wallet public.ac360_credit_wallets%rowtype;
  v_key text := coalesce(p_idempotency_key, gen_random_uuid()::text);
  v_existing public.ac360_credit_ledger%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if coalesce(p_amount, 0) <= 0 then raise exception 'p_amount must be positive'; end if;

  insert into public.ac360_credit_wallets(org_id, wallet_key, credit_type, status, balance, monthly_included_allowance, rollover_policy)
  values (p_org_id, 'main', 'angelcare_credits', 'active', 0, 0, 'no_rollover')
  on conflict (org_id, wallet_key) do update set status = 'active', updated_at = now()
  returning * into v_wallet;

  select * into v_existing from public.ac360_credit_ledger where wallet_id = v_wallet.id and idempotency_key = v_key limit 1;
  if v_existing.id is not null then
    return jsonb_build_object('ok', true, 'idempotent', true, 'wallet', to_jsonb(v_wallet), 'ledger', to_jsonb(v_existing));
  end if;

  update public.ac360_credit_wallets
  set balance = balance + p_amount, status = 'active', updated_at = now()
  where id = v_wallet.id
  returning * into v_wallet;

  insert into public.ac360_credit_ledger(wallet_id, org_id, ledger_type, amount, balance_after, reason, idempotency_key, metadata_json)
  values (v_wallet.id, p_org_id, 'grant', p_amount, v_wallet.balance, p_reason, v_key, jsonb_build_object('actor_app_user_id',p_actor_app_user_id))
  returning * into v_existing;

  update public.ac360_restrictions
  set status = 'resolved', resolved_at = now(), updated_at = now()
  where org_id = p_org_id and status = 'active' and behavior = 'topup_required';

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-36', 'credits.granted', 'credits.grant', 'credit_wallet', v_wallet.id, 'success', 'notice', p_actor_app_user_id, null, jsonb_build_object('amount',p_amount,'reason',p_reason));

  return jsonb_build_object('ok', true, 'wallet', to_jsonb(v_wallet), 'ledger', to_jsonb(v_existing));
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Strict usage recording with wallet deduction + idempotency
-- -----------------------------------------------------------------------------
create or replace function public.ac360_record_usage(
  p_org_id uuid,
  p_meter_key text,
  p_quantity numeric default 1,
  p_feature_key text default null,
  p_action_key text default null,
  p_actor_app_user_id uuid default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_meter record;
  v_sub uuid;
  v_event uuid;
  v_existing uuid;
  v_period_start date := date_trunc('month', now())::date;
  v_period_end date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
  v_credits numeric := 0;
  v_amount numeric := 0;
  v_qty numeric := greatest(coalesce(p_quantity, 1), 0);
  v_wallet public.ac360_credit_wallets%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if p_meter_key is null then raise exception 'p_meter_key is required'; end if;

  select * into v_meter from public.ac360_usage_meters where meter_key = p_meter_key and status = 'active';
  if v_meter.meter_key is null then
    raise exception 'Unknown or inactive AC360 meter: %', p_meter_key;
  end if;

  if p_idempotency_key is not null then
    select id into v_existing
    from public.ac360_usage_events
    where org_id = p_org_id and meter_key = p_meter_key and idempotency_key = p_idempotency_key
    limit 1;
    if v_existing is not null then
      return v_existing;
    end if;
  end if;

  select id into v_sub
  from public.ac360_subscriptions
  where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
  order by case status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 else 4 end, created_at desc
  limit 1;

  v_credits := coalesce(v_meter.default_credit_cost, 0) * v_qty;
  v_amount := coalesce(v_meter.default_unit_price_mad, 0) * v_qty;

  if v_credits > 0 then
    insert into public.ac360_credit_wallets(org_id, wallet_key, credit_type, status, balance, monthly_included_allowance, rollover_policy)
    values (p_org_id, 'main', 'angelcare_credits', 'active', 0, 0, 'no_rollover')
    on conflict (org_id, wallet_key) do update set updated_at = now()
    returning * into v_wallet;

    if v_wallet.balance < v_credits then
      insert into public.ac360_restrictions(org_id, subscription_id, restriction_key, status, severity, restriction_type, target_feature_key, target_action_key, target_meter_key, behavior, reason, metadata_json)
      values (p_org_id, v_sub, 'credits_exhausted_' || p_meter_key, 'active', 'critical', 'usage', p_feature_key, p_action_key, p_meter_key, 'topup_required', 'Insufficient AngelCare Credits for ' || p_meter_key || '.', jsonb_build_object('required_credits',v_credits,'wallet_balance',v_wallet.balance))
      on conflict (org_id, restriction_key, target_feature_key, target_action_key, status) do update set reason = excluded.reason, metadata_json = excluded.metadata_json, updated_at = now();
      perform public.ac360_record_audit(p_org_id, 'AC360-ENG-37', 'usage.blocked.insufficient_credits', p_action_key, 'credit_wallet', v_wallet.id, 'blocked', 'critical', p_actor_app_user_id, null, jsonb_build_object('meter_key',p_meter_key,'required_credits',v_credits,'balance',v_wallet.balance));
      raise exception 'Insufficient AngelCare Credits: required %, available %', v_credits, v_wallet.balance;
    end if;
  end if;

  insert into public.ac360_usage_events(org_id, subscription_id, meter_key, feature_key, action_key, actor_app_user_id, quantity, credits_consumed, amount_mad, period_start, period_end, idempotency_key, metadata_json)
  values (p_org_id, v_sub, p_meter_key, p_feature_key, p_action_key, p_actor_app_user_id, v_qty, v_credits, v_amount, v_period_start, v_period_end, p_idempotency_key, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_event;

  insert into public.ac360_usage_summaries(org_id, subscription_id, meter_key, period_start, period_end, quantity, credits_consumed, amount_mad, updated_at)
  values (p_org_id, v_sub, p_meter_key, v_period_start, v_period_end, v_qty, v_credits, v_amount, now())
  on conflict (org_id, meter_key, period_start, period_end)
  do update set quantity = public.ac360_usage_summaries.quantity + excluded.quantity,
                credits_consumed = public.ac360_usage_summaries.credits_consumed + excluded.credits_consumed,
                amount_mad = public.ac360_usage_summaries.amount_mad + excluded.amount_mad,
                updated_at = now();

  if v_credits > 0 then
    update public.ac360_credit_wallets
    set balance = balance - v_credits,
        status = case when balance - v_credits <= 0 then 'exhausted' else 'active' end,
        updated_at = now()
    where id = v_wallet.id
    returning * into v_wallet;

    insert into public.ac360_credit_ledger(wallet_id, org_id, ledger_type, amount, balance_after, usage_event_id, reason, idempotency_key, metadata_json)
    values (v_wallet.id, p_org_id, 'consume', -v_credits, v_wallet.balance, v_event, 'Usage consumed by ' || p_meter_key, coalesce(p_idempotency_key, v_event::text), jsonb_build_object('meter_key',p_meter_key,'quantity',v_qty));
  end if;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-33', 'usage.recorded', p_action_key, 'usage_event', v_event, 'success', 'info', p_actor_app_user_id, null, jsonb_build_object('meter_key', p_meter_key, 'quantity', v_qty, 'credits', v_credits, 'amount_mad', v_amount));
  return v_event;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Add-on activation / cancellation with data-preservation status
-- -----------------------------------------------------------------------------
create or replace function public.ac360_activate_addon(
  p_org_id uuid,
  p_addon_key text,
  p_quantity numeric default 1,
  p_billing_interval text default 'monthly',
  p_actor_app_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sub public.ac360_subscriptions%rowtype;
  v_addon public.ac360_addons%rowtype;
  v_item public.ac360_subscription_items%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if p_addon_key is null then raise exception 'p_addon_key is required'; end if;

  select * into v_sub from public.ac360_subscriptions
  where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
  order by case status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 else 4 end, created_at desc
  limit 1;
  if v_sub.id is null then raise exception 'No active subscription found for organization %', p_org_id; end if;

  select * into v_addon from public.ac360_addons where addon_key = p_addon_key and status = 'active' limit 1;
  if v_addon.id is null then raise exception 'Unknown or inactive AC360 add-on: %', p_addon_key; end if;

  select * into v_item from public.ac360_subscription_items
  where org_id = p_org_id and subscription_id = v_sub.id and addon_key = p_addon_key and status in ('active','cancel_pending')
  order by created_at desc limit 1;

  if v_item.id is null then
    insert into public.ac360_subscription_items(subscription_id, org_id, item_type, item_key, label, addon_key, quantity, unit_price_mad, billing_interval, status, current_period_end, metadata_json)
    values (v_sub.id, p_org_id, 'addon', 'addon:' || p_addon_key, v_addon.label, p_addon_key, greatest(coalesce(p_quantity,1),1), v_addon.monthly_price_mad, p_billing_interval, 'active', v_sub.current_period_end, jsonb_build_object('activated_by','phase1b_runtime_bridge'))
    returning * into v_item;
  else
    update public.ac360_subscription_items
    set status = 'active', cancel_at_period_end = false, cancelled_at = null, quantity = greatest(coalesce(p_quantity, v_item.quantity),1), updated_at = now()
    where id = v_item.id returning * into v_item;
  end if;

  insert into public.ac360_recommendations(org_id, subscription_id, recommendation_key, status, priority, title, message, recommended_addon_key, trigger_json)
  values (p_org_id, v_sub.id, 'addon_activated_' || p_addon_key, 'accepted', 'medium', 'Add-on activated: ' || v_addon.label, 'Growth Menu module activated and governed by entitlements.', p_addon_key, jsonb_build_object('addon_key',p_addon_key))
  on conflict do nothing;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-29', 'addon.activated', 'addon.activate', 'subscription_item', v_item.id, 'success', 'notice', p_actor_app_user_id, null, jsonb_build_object('addon_key',p_addon_key,'price_mad',v_addon.monthly_price_mad));

  return jsonb_build_object('ok', true, 'item', to_jsonb(v_item), 'addon', to_jsonb(v_addon));
end;
$$;

create or replace function public.ac360_cancel_addon(
  p_org_id uuid,
  p_addon_key text,
  p_cancel_at_period_end boolean default true,
  p_actor_app_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item public.ac360_subscription_items%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  if p_addon_key is null then raise exception 'p_addon_key is required'; end if;

  select * into v_item from public.ac360_subscription_items
  where org_id = p_org_id and addon_key = p_addon_key and status in ('active','cancel_pending')
  order by created_at desc limit 1;
  if v_item.id is null then raise exception 'No active add-on subscription item found for %', p_addon_key; end if;

  update public.ac360_subscription_items
  set status = case when p_cancel_at_period_end then 'cancel_pending' else 'cancelled' end,
      cancel_at_period_end = p_cancel_at_period_end,
      cancelled_at = case when p_cancel_at_period_end then null else now() end,
      updated_at = now(),
      metadata_json = metadata_json || jsonb_build_object('data_preservation','enabled','cancel_reason','client_controlled_menu_cancellation')
  where id = v_item.id
  returning * into v_item;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-30', 'addon.cancelled_or_pending', 'addon.cancel', 'subscription_item', v_item.id, 'success', 'warning', p_actor_app_user_id, null, jsonb_build_object('addon_key',p_addon_key,'cancel_at_period_end',p_cancel_at_period_end,'data_preserved',true));

  return jsonb_build_object('ok', true, 'item', to_jsonb(v_item), 'dataPreserved', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Subscription invoice generation from live subscription items and usage
-- -----------------------------------------------------------------------------
create or replace function public.ac360_generate_subscription_invoice(
  p_org_id uuid,
  p_period_start date default date_trunc('month', now())::date,
  p_period_end date default (date_trunc('month', now()) + interval '1 month - 1 day')::date,
  p_status text default 'issued'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_org public.ac360_organizations%rowtype;
  v_sub public.ac360_subscriptions%rowtype;
  v_invoice public.ac360_invoices%rowtype;
  v_invoice_number text;
  v_total numeric := 0;
begin
  p_period_start := coalesce(p_period_start, date_trunc('month', now())::date);
  p_period_end := coalesce(p_period_end, (date_trunc('month', now()) + interval '1 month - 1 day')::date);

  select * into v_org from public.ac360_organizations where id = p_org_id;
  if v_org.id is null then raise exception 'Unknown AC360 org %', p_org_id; end if;

  select * into v_sub from public.ac360_subscriptions
  where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
  order by case status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 else 4 end, created_at desc limit 1;
  if v_sub.id is null then raise exception 'No active subscription found for organization %', p_org_id; end if;

  v_invoice_number := 'AC360-INV-' || to_char(p_period_start, 'YYYYMM') || '-' || upper(left(regexp_replace(v_org.org_code, '[^A-Za-z0-9]+', '', 'g'), 18));

  insert into public.ac360_invoices(org_id, subscription_id, invoice_number, status, currency, subtotal_mad, total_mad, issued_at, due_date, period_start, period_end, metadata_json)
  values (p_org_id, v_sub.id, v_invoice_number, case when p_status in ('draft','issued','sent') then p_status else 'issued' end, 'MAD', 0, 0, now(), current_date + 7, p_period_start, p_period_end, jsonb_build_object('generated_by','ac360_phase1b_runtime_bridge'))
  on conflict (invoice_number) do update set status = excluded.status, issued_at = excluded.issued_at, due_date = excluded.due_date, updated_at = now()
  returning * into v_invoice;

  delete from public.ac360_invoice_lines where invoice_id = v_invoice.id;

  insert into public.ac360_invoice_lines(invoice_id, org_id, line_type, item_key, label, description, quantity, unit_price_mad, amount_mad, period_start, period_end, metadata_json)
  select v_invoice.id, p_org_id,
         case when item_type = 'base_plan' then 'subscription' when item_type = 'serenite_bundle' then 'serenite' when item_type = 'addon' then 'addon' else item_type end,
         item_key, label, 'AC360 active subscription item', quantity, unit_price_mad, quantity * unit_price_mad, p_period_start, p_period_end, metadata_json
  from public.ac360_subscription_items
  where org_id = p_org_id and subscription_id = v_sub.id and status in ('active','cancel_pending') and billing_interval in ('monthly','annual','custom');

  insert into public.ac360_invoice_lines(invoice_id, org_id, line_type, item_key, label, description, quantity, unit_price_mad, amount_mad, period_start, period_end, metadata_json)
  select v_invoice.id, p_org_id, 'usage', meter_key, 'Usage: ' || meter_key, 'AC360 usage metering for the selected period', quantity,
         case when quantity = 0 then 0 else amount_mad / quantity end,
         amount_mad, p_period_start, p_period_end, jsonb_build_object('meter_key',meter_key,'credits_consumed',credits_consumed)
  from public.ac360_usage_summaries
  where org_id = p_org_id and period_start = p_period_start and period_end = p_period_end and amount_mad > 0;

  select coalesce(sum(amount_mad),0) into v_total from public.ac360_invoice_lines where invoice_id = v_invoice.id;

  update public.ac360_invoices
  set subtotal_mad = v_total, total_mad = v_total, updated_at = now()
  where id = v_invoice.id
  returning * into v_invoice;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-17', 'invoice.generated', 'invoice.generate', 'invoice', v_invoice.id, 'success', 'notice', null, null, jsonb_build_object('period_start',p_period_start,'period_end',p_period_end,'total_mad',v_total));

  return jsonb_build_object('ok', true, 'invoice', to_jsonb(v_invoice), 'totalMad', v_total);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Lifecycle reconciliation: payment/credit warnings, recommendations, restrictions
-- -----------------------------------------------------------------------------
create or replace function public.ac360_reconcile_lifecycle(p_org_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sub public.ac360_subscriptions%rowtype;
  v_wallet public.ac360_credit_wallets%rowtype;
  v_overdue_count integer := 0;
  v_open_recommendations integer := 0;
begin
  select * into v_sub from public.ac360_subscriptions
  where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
  order by case status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 else 4 end, created_at desc limit 1;

  select * into v_wallet from public.ac360_credit_wallets where org_id = p_org_id and wallet_key = 'main' limit 1;

  select count(*) into v_overdue_count
  from public.ac360_invoices
  where org_id = p_org_id and status in ('issued','sent','partial','overdue') and amount_due_mad > 0 and due_date < current_date;

  if v_overdue_count > 0 then
    insert into public.ac360_restrictions(org_id, subscription_id, restriction_key, status, severity, restriction_type, behavior, reason, metadata_json)
    values (p_org_id, v_sub.id, 'payment_overdue', 'active', 'critical', 'billing', 'admin_only', 'Invoice overdue. Account should be restricted to admin/billing actions until payment is resolved.', jsonb_build_object('overdue_count',v_overdue_count))
    on conflict (org_id, restriction_key, target_feature_key, target_action_key, status) do update set reason = excluded.reason, metadata_json = excluded.metadata_json, updated_at = now();
  end if;

  if v_wallet.id is not null and v_wallet.monthly_included_allowance > 0 and v_wallet.balance <= v_wallet.monthly_included_allowance * 0.30 then
    insert into public.ac360_recommendations(org_id, subscription_id, recommendation_key, status, priority, title, message, recommended_bundle_key, trigger_json)
    values (p_org_id, v_sub.id, 'credits_low_serenite_plus', 'open', case when v_wallet.balance <= 0 then 'critical' else 'high' end,
            'AngelCare Credits are low', 'Usage is approaching the package allowance. Recommend a top-up or Sérénité bundle for predictable monthly comfort.', 'serenite_plus', jsonb_build_object('balance',v_wallet.balance,'allowance',v_wallet.monthly_included_allowance))
    on conflict do nothing;
  end if;

  select count(*) into v_open_recommendations from public.ac360_recommendations where org_id = p_org_id and status = 'open';

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-41', 'lifecycle.reconciled', 'lifecycle.reconcile', 'organization', p_org_id, 'success', 'info', null, null, jsonb_build_object('overdue_count',v_overdue_count,'open_recommendations',v_open_recommendations,'wallet_balance',coalesce(v_wallet.balance,0)));

  return jsonb_build_object('ok', true, 'overdueCount', v_overdue_count, 'openRecommendations', v_open_recommendations, 'walletBalance', coalesce(v_wallet.balance,0));
end;
$$;

-- Mark Phase 1B runtime bridge status in engine registry.
update public.ac360_foundation_engines
set implementation_status = 'implemented',
    metadata_json = metadata_json || jsonb_build_object('phase1b_runtime_bridge', true, 'updated_at', now())
where engine_code in ('AC360-ENG-01','AC360-ENG-15','AC360-ENG-16','AC360-ENG-17','AC360-ENG-23','AC360-ENG-29','AC360-ENG-30','AC360-ENG-33','AC360-ENG-35','AC360-ENG-36','AC360-ENG-37','AC360-ENG-41');

