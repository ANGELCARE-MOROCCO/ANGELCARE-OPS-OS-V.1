import { createServiceClient } from "@/lib/supabase/server";
import { executeExternalResearchAgent } from "./free-provider-runtime";
import { persistExternalResearchExecution } from "./free-provider-persistence";
import type { AcCapitalAiControlSnapshot, JsonRecord } from "./free-provider-types";

type SupabaseAny = any;
type Actor = { id: string; name: string; email?: string; role?: string };

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const stringArray = (value: unknown) => Array.isArray(value) ? value.map((item) => clean(item)).filter(Boolean) : [];
const number = (value: unknown, fallback = 0) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };
const bool = (value: unknown, fallback = false) => value == null ? fallback : Boolean(value);

async function admin() { return await createServiceClient() as SupabaseAny; }

async function tableRows(supabase: SupabaseAny, table: string, order = "created_at", limit = 500) {
  const result = await supabase.from(table).select("*").order(order, { ascending: false }).limit(limit);
  if (result.error) throw new Error(result.error.message);
  return (result.data || []) as JsonRecord[];
}

async function audit(supabase: SupabaseAny, actor: Actor, action: string, entityType: string, entityId: string | null, before: unknown, after: unknown, reason?: string) {
  const result = await supabase.from("ac_capital_ai_configuration_audit").insert({
    actor_id: actor.id || null,
    actor_name: actor.name,
    action_key: action,
    entity_type: entityType,
    entity_id: entityId,
    before_state: before || null,
    after_state: after || null,
    reason: reason || null,
  });
  if (result.error) console.error("AC_CAPITAL_AI_AUDIT_FAILED", result.error.message);
}

function dayStart() { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }
function monthStart() { const date = dayStart(); date.setDate(1); return date; }

export async function loadAcCapitalAiControlSnapshot(): Promise<AcCapitalAiControlSnapshot> {
  const supabase = await admin();
  const [stateResult, providers, agents, profiles, runs, usage, incidents, audits, dossiers, credentials] = await Promise.all([
    supabase.from("ac_capital_ai_runtime_state").select("*").eq("state_key", "primary").maybeSingle(),
    tableRows(supabase, "ac_capital_ai_provider_configs", "created_at", 20),
    tableRows(supabase, "ac_capital_ai_agents", "created_at", 100),
    tableRows(supabase, "ac_capital_ai_operating_profiles", "created_at", 50),
    tableRows(supabase, "ac_capital_ai_agent_runs", "created_at", 150),
    tableRows(supabase, "ac_capital_ai_usage_ledger", "occurred_at", 500),
    tableRows(supabase, "ac_capital_ai_runtime_incidents", "created_at", 100),
    tableRows(supabase, "ac_capital_ai_configuration_audit", "created_at", 150),
    tableRows(supabase, "ai_provider_dossiers", "created_at", 100),
    tableRows(supabase, "ai_provider_credentials", "created_at", 100),
  ]);
  if (stateResult.error) throw new Error(stateResult.error.message);
  const today = dayStart();
  const month = monthStart();
  const todayRuns = runs.filter((row) => new Date(clean(row.created_at)) >= today);
  const todayUsage = usage.filter((row) => new Date(clean(row.occurred_at)) >= today);
  const monthUsage = usage.filter((row) => new Date(clean(row.occurred_at)) >= month);
  return {
    generatedAt: now(),
    runtimeState: stateResult.data || null,
    providers: providers as any,
    agents: agents as any,
    profiles,
    runs,
    usage,
    incidents,
    audits,
    providerDossiers: dossiers.filter((row) => ["tavily", "openrouter"].includes(clean(row.provider_type).toLowerCase())),
    providerCredentials: credentials.filter((row) => dossiers.some((dossier) => String(dossier.id) === String(row.dossier_id) && ["tavily", "openrouter"].includes(clean(dossier.provider_type).toLowerCase()))).map((row) => ({ ...row, secret_value: undefined })),
    rollups: {
      activeAgents: agents.filter((row) => row.status === "active").length,
      pausedAgents: agents.filter((row) => row.status === "paused").length,
      completedToday: todayRuns.filter((row) => ["completed", "completed-with-warnings"].includes(clean(row.status))).length,
      failedToday: todayRuns.filter((row) => ["failed", "blocked"].includes(clean(row.status))).length,
      tavilyCreditsToday: todayUsage.filter((row) => row.provider_key === "tavily").reduce((sum, row) => sum + number(row.credits_consumed), 0),
      tavilyCreditsMonth: monthUsage.filter((row) => row.provider_key === "tavily").reduce((sum, row) => sum + number(row.credits_consumed), 0),
      openRouterRequestsToday: todayUsage.filter((row) => row.provider_key === "openrouter").reduce((sum, row) => sum + number(row.request_count), 0),
      openRouterRequestsMonth: monthUsage.filter((row) => row.provider_key === "openrouter").reduce((sum, row) => sum + number(row.request_count), 0),
    },
  };
}

async function ensureProviderDossier(supabase: SupabaseAny, providerKey: "tavily" | "openrouter", actor: Actor) {
  const code = providerKey === "tavily" ? "TAVILY_AC_CAPITAL_FREE" : "OPENROUTER_AC_CAPITAL_FREE";
  const name = providerKey === "tavily" ? "Tavily AC Capital Free Search" : "OpenRouter AC Capital Free Analysis";
  let dossierResult = await supabase.from("ai_provider_dossiers").select("*").eq("code", code).maybeSingle();
  if (dossierResult.error) throw new Error(dossierResult.error.message);
  let dossier = dossierResult.data;
  if (!dossier) {
    dossierResult = await supabase.from("ai_provider_dossiers").insert({
      code,
      name,
      provider_type: providerKey,
      status: "draft",
      environment: "production",
      account_label: "AC Capital public external research",
      billing_tier: "free",
      reconciliation_state: "not_reconciled",
      is_enabled: true,
      metadata: { moduleKey: "ac_capital_os", externalPublicDataOnly: true, externalActions: false, source: "AC_CAPITAL_FREE_PROVIDER_OPERATIONS_05" },
      created_by: actor.id,
      updated_by: actor.id,
    }).select("*").single();
    if (dossierResult.error) throw new Error(dossierResult.error.message);
    dossier = dossierResult.data;
  }
  let poolResult = await supabase.from("ai_provider_capacity_pools").select("*").eq("dossier_id", dossier.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (poolResult.error) throw new Error(poolResult.error.message);
  let pool = poolResult.data;
  if (!pool) {
    poolResult = await supabase.from("ai_provider_capacity_pools").insert({
      dossier_id: dossier.id,
      pool_key: `${code}_PRIMARY`,
      project_name: name,
      billing_tier: "free",
      status: "draft",
      provider_rpd: providerKey === "openrouter" ? 50 : null,
      metadata: { moduleKey: "ac_capital_os", externalPublicDataOnly: true, source: "AC_CAPITAL_FREE_PROVIDER_OPERATIONS_05" },
      created_by: actor.id,
      updated_by: actor.id,
    }).select("*").single();
    if (poolResult.error) throw new Error(poolResult.error.message);
    pool = poolResult.data;
  }
  return { dossier, pool };
}

async function resolveSecret(supabase: SupabaseAny, credentialId: string) {
  const result = await supabase.rpc("ai_provider_resolve_secret", { p_credential_id: credentialId });
  if (result.error) throw new Error(result.error.message);
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  const secret = clean(row?.decrypted_secret || row);
  if (!secret) throw new Error("CREDENTIAL_SECRET_UNAVAILABLE");
  return secret;
}

async function providerRow(supabase: SupabaseAny, providerKey: string) {
  const result = await supabase.from("ac_capital_ai_provider_configs").select("*").eq("provider_key", providerKey).single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

async function syncProviderUsage(supabase: SupabaseAny, providerKey: "tavily" | "openrouter", secret: string) {
  const provider = await providerRow(supabase, providerKey);
  const started = Date.now();
  if (providerKey === "tavily") {
    const response = await fetch("https://api.tavily.com/usage", { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(clean(object(object(payload).detail).error || object(payload).message || `TAVILY_USAGE_${response.status}`)), { status: response.status });
    return { providerUsage: object(payload), healthStatus: "healthy", healthMessage: `Tavily usage synchronized in ${Date.now() - started} ms`, latencyMs: Date.now() - started };
  }
  const response = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(clean(object(payload).error || object(payload).message || `OPENROUTER_KEY_${response.status}`)), { status: response.status });
  return { providerUsage: object(payload), healthStatus: "healthy", healthMessage: `OpenRouter key synchronized in ${Date.now() - started} ms`, latencyMs: Date.now() - started };
}

function nextRun(agent: JsonRecord, frequencyMultiplier = 1) {
  const schedule = object(agent.schedule);
  const frequency = clean(agent.frequency_key || "daily");
  const next = new Date();
  const multiplier = Math.max(0.1, number(frequencyMultiplier, 1));
  if (multiplier !== 1) {
    const baseMinutes = frequency === "hourly" ? Math.max(60, number(schedule.intervalHours, 1) * 60)
      : frequency === "daily" ? 1440
      : frequency === "weekly" ? 10080
      : frequency === "monthly" ? 43200
      : Math.max(15, number(schedule.intervalMinutes, 1440));
    return new Date(Date.now() + Math.max(15, Math.round(baseMinutes / multiplier)) * 60 * 1000).toISOString();
  }
  const hour = Math.max(0, Math.min(23, number(schedule.hour, 8)));
  const minute = Math.max(0, Math.min(59, number(schedule.minute, 0)));
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);
  if (frequency === "hourly") {
    next.setTime(Date.now() + Math.max(1, number(schedule.intervalHours, 1)) * 60 * 60 * 1000);
  } else if (frequency === "daily") {
    if (next <= new Date()) next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    const days = stringArray(schedule.days).map(Number).filter((day) => day >= 1 && day <= 7);
    const allowed = days.length ? days : [1];
    for (let step = 0; step <= 8; step += 1) {
      const candidate = new Date(next);
      candidate.setDate(candidate.getDate() + step);
      const isoDay = candidate.getDay() === 0 ? 7 : candidate.getDay();
      if (allowed.includes(isoDay) && candidate > new Date()) return candidate.toISOString();
    }
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    const day = Math.max(1, Math.min(28, number(schedule.dayOfMonth, 1)));
    next.setDate(day);
    if (next <= new Date()) next.setMonth(next.getMonth() + 1);
  } else {
    next.setTime(Date.now() + Math.max(15, number(schedule.intervalMinutes, 1440)) * 60 * 1000);
  }
  return next.toISOString();
}

export async function executeAcCapitalAiControlAction(action: string, payload: JsonRecord, actor: Actor) {
  const supabase = await admin();

  if (action === "save_provider_config") {
    const providerKey = clean(payload.providerKey);
    if (!["tavily", "openrouter"].includes(providerKey)) throw new Error("INVALID_PROVIDER_KEY");
    const before = await providerRow(supabase, providerKey);
    const update: JsonRecord = { updated_by: actor.id, updated_at: now() };
    if (payload.enabled !== undefined) update.enabled = bool(payload.enabled);
    if (payload.paused !== undefined) update.paused = bool(payload.paused);
    if (payload.endpoint !== undefined) update.endpoint = clean(payload.endpoint);
    if (payload.modelCode !== undefined) update.model_code = clean(payload.modelCode) || null;
    if (payload.config !== undefined) update.config = { ...object(before.config), ...object(payload.config) };
    if (payload.internalLimits !== undefined) update.internal_limits = { ...object(before.internal_limits), ...object(payload.internalLimits) };
    const result = await supabase.from("ac_capital_ai_provider_configs").update(update).eq("provider_key", providerKey).select("*").single();
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "provider", providerKey, before, result.data, clean(payload.reason));
    return result.data;
  }

  if (action === "store_provider_credential") {
    const providerKey = clean(payload.providerKey) as "tavily" | "openrouter";
    const secret = clean(payload.secret);
    if (!["tavily", "openrouter"].includes(providerKey) || !secret) throw new Error("PROVIDER_AND_SECRET_REQUIRED");
    const { dossier, pool } = await ensureProviderDossier(supabase, providerKey, actor);
    const stored = await supabase.rpc("ai_provider_store_credential", {
      p_dossier_id: dossier.id,
      p_capacity_pool_id: pool.id,
      p_secret: secret,
      p_key_type: "api_key",
      p_actor_id: actor.id,
    });
    if (stored.error) throw new Error(stored.error.message);
    const row = Array.isArray(stored.data) ? stored.data[0] : stored.data;
    const credentialId = clean(row?.credential_id);
    if (!credentialId) throw new Error("PROVIDER_CREDENTIAL_STORE_FAILED");
    const before = await providerRow(supabase, providerKey);
    const update = await supabase.from("ac_capital_ai_provider_configs").update({
      dossier_id: dossier.id,
      capacity_pool_id: pool.id,
      credential_id: credentialId,
      enabled: false,
      health_status: "stored-not-tested",
      health_message: "Credential stored securely. Test and activate it before running agents.",
      updated_by: actor.id,
      updated_at: now(),
    }).eq("provider_key", providerKey).select("*").single();
    if (update.error) throw new Error(update.error.message);
    await audit(supabase, actor, action, "provider_credential", providerKey, { ...before, credential_id: before.credential_id ? "configured" : null }, { ...update.data, credential_id: "configured" });
    return { provider: update.data, credential: { id: credentialId, suffix: row?.secret_suffix || null } };
  }

  if (action === "test_provider" || action === "sync_provider_usage") {
    const providerKey = clean(payload.providerKey) as "tavily" | "openrouter";
    if (!["tavily", "openrouter"].includes(providerKey)) throw new Error("INVALID_PROVIDER_KEY");
    const before = await providerRow(supabase, providerKey);
    const credentialId = clean(before.credential_id);
    if (!credentialId) throw new Error("PROVIDER_CREDENTIAL_REQUIRED");
    const secret = await resolveSecret(supabase, credentialId);
    try {
      const health = await syncProviderUsage(supabase, providerKey, secret);
      await supabase.from("ai_provider_credentials").update({ status: "active", validated_at: now(), activated_at: now(), last_success_at: now(), failure_code: null, updated_at: now() }).eq("id", credentialId);
      await supabase.from("ai_provider_dossiers").update({ status: "operating", is_enabled: true, updated_by: actor.id, updated_at: now() }).eq("id", before.dossier_id);
      await supabase.from("ai_provider_capacity_pools").update({ status: "operating", updated_by: actor.id, updated_at: now() }).eq("id", before.capacity_pool_id);
      const update = await supabase.from("ac_capital_ai_provider_configs").update({
        enabled: true,
        paused: false,
        provider_usage: health.providerUsage,
        health_status: health.healthStatus,
        health_message: health.healthMessage,
        last_health_check_at: now(),
        last_usage_sync_at: now(),
        updated_by: actor.id,
        updated_at: now(),
      }).eq("provider_key", providerKey).select("*").single();
      if (update.error) throw new Error(update.error.message);
      await audit(supabase, actor, action, "provider", providerKey, before, update.data);
      return { provider: update.data, health };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase.from("ai_provider_credentials").update({ status: "failed", last_failure_at: now(), failure_code: message.slice(0, 160), updated_at: now() }).eq("id", credentialId);
      await supabase.from("ac_capital_ai_provider_configs").update({ enabled: false, health_status: "failed", health_message: message.slice(0, 2000), last_health_check_at: now(), updated_by: actor.id, updated_at: now() }).eq("provider_key", providerKey);
      throw error;
    }
  }

  if (action === "save_agent") {
    const agentKey = clean(payload.agentKey);
    if (!agentKey) throw new Error("AGENT_KEY_REQUIRED");
    const beforeResult = await supabase.from("ac_capital_ai_agents").select("*").eq("agent_key", agentKey).maybeSingle();
    if (beforeResult.error) throw new Error(beforeResult.error.message);
    const before = beforeResult.data || null;
    const row: JsonRecord = {
      agent_key: agentKey,
      name: clean(payload.name || before?.name || agentKey),
      description: clean(payload.description || before?.description) || null,
      category: clean(payload.category || before?.category || "external-research"),
      status: clean(payload.status || before?.status || "paused"),
      search_provider_key: "tavily",
      analysis_provider_key: "openrouter",
      trigger_mode: clean(payload.triggerMode || before?.trigger_mode || "manual"),
      frequency_key: clean(payload.frequencyKey || before?.frequency_key || "daily"),
      schedule: payload.schedule !== undefined ? object(payload.schedule) : object(before?.schedule),
      search_config: payload.searchConfig !== undefined ? object(payload.searchConfig) : object(before?.search_config),
      analysis_config: payload.analysisConfig !== undefined ? object(payload.analysisConfig) : object(before?.analysis_config),
      quota_config: payload.quotaConfig !== undefined ? object(payload.quotaConfig) : object(before?.quota_config),
      action_permissions: { ...(object(before?.action_permissions)), ...(object(payload.actionPermissions)), externalActions: false },
      prompt_doctrine: clean(payload.promptDoctrine || before?.prompt_doctrine),
      failure_policy: payload.failurePolicy !== undefined ? object(payload.failurePolicy) : object(before?.failure_policy),
      next_run_at: nextRun({ ...before, ...payload, schedule: payload.schedule ?? before?.schedule, frequency_key: payload.frequencyKey ?? before?.frequency_key }),
      updated_by: actor.id,
      updated_at: now(),
    };
    const result = await supabase.from("ac_capital_ai_agents").upsert(row, { onConflict: "agent_key" }).select("*").single();
    if (result.error) throw new Error(result.error.message);
    if (clean(result.data.category) !== "external-research") {
      const scheduleSync = await supabase.from("ac_capital_agent_schedules").upsert({
        agent_key: agentKey,
        enabled: clean(result.data.status) === "active" && ["scheduled", "both"].includes(clean(result.data.trigger_mode)),
        frequency_key: clean(result.data.frequency_key || "daily"),
        timezone: clean(object(result.data.schedule).timezone || "Africa/Casablanca"),
        schedule: object(result.data.schedule),
        next_run_at: result.data.next_run_at || null,
        updated_at: now(),
      }, { onConflict: "agent_key" });
      if (scheduleSync.error) throw new Error(scheduleSync.error.message);
    }
    await audit(supabase, actor, action, "agent", agentKey, before, result.data, clean(payload.reason));
    return result.data;
  }

  if (action === "set_agent_status") {
    const agentKey = clean(payload.agentKey);
    const status = clean(payload.status);
    if (!agentKey || !["active", "paused", "disabled"].includes(status)) throw new Error("VALID_AGENT_STATUS_REQUIRED");
    const beforeResult = await supabase.from("ac_capital_ai_agents").select("*").eq("agent_key", agentKey).single();
    if (beforeResult.error) throw new Error(beforeResult.error.message);
    const result = await supabase.from("ac_capital_ai_agents").update({ status, next_run_at: status === "active" ? nextRun(beforeResult.data) : null, updated_by: actor.id, updated_at: now() }).eq("agent_key", agentKey).select("*").single();
    if (result.error) throw new Error(result.error.message);
    if (clean(result.data.category) !== "external-research") {
      const scheduleSync = await supabase.from("ac_capital_agent_schedules").update({ enabled: status === "active" && ["scheduled", "both"].includes(clean(result.data.trigger_mode)), next_run_at: status === "active" ? result.data.next_run_at : null, updated_at: now() }).eq("agent_key", agentKey);
      if (scheduleSync.error) throw new Error(scheduleSync.error.message);
      await supabase.from("ac_capital_agent_registry").update({ enabled: status === "active", updated_at: now() }).eq("agent_key", agentKey);
    }
    await audit(supabase, actor, action, "agent", agentKey, beforeResult.data, result.data);
    return result.data;
  }

  if (action === "duplicate_agent") {
    const agentKey = clean(payload.agentKey);
    const newKey = clean(payload.newAgentKey).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!agentKey || !newKey) throw new Error("SOURCE_AND_NEW_AGENT_KEY_REQUIRED");
    const sourceResult = await supabase.from("ac_capital_ai_agents").select("*").eq("agent_key", agentKey).single();
    if (sourceResult.error) throw new Error(sourceResult.error.message);
    const { id, created_at, updated_at, ...source } = sourceResult.data;
    const result = await supabase.from("ac_capital_ai_agents").insert({ ...source, agent_key: newKey, name: clean(payload.name || `${source.name} Copy`), status: "paused", last_run_at: null, next_run_at: null, last_success_at: null, last_failure_at: null, consecutive_failures: 0, created_by: actor.id, updated_by: actor.id }).select("*").single();
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "agent", newKey, null, result.data);
    return result.data;
  }

  if (action === "delete_agent") {
    const agentKey = clean(payload.agentKey);
    if (!agentKey) throw new Error("AGENT_KEY_REQUIRED");
    const beforeResult = await supabase.from("ac_capital_ai_agents").select("*").eq("agent_key", agentKey).single();
    if (beforeResult.error) throw new Error(beforeResult.error.message);
    const result = await supabase.from("ac_capital_ai_agents").delete().eq("agent_key", agentKey);
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "agent", agentKey, beforeResult.data, null);
    return { deleted: true, agentKey };
  }

  if (action === "save_profile") {
    const profileKey = clean(payload.profileKey).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!profileKey) throw new Error("PROFILE_KEY_REQUIRED");
    const beforeResult = await supabase.from("ac_capital_ai_operating_profiles").select("*").eq("profile_key", profileKey).maybeSingle();
    if (beforeResult.error) throw new Error(beforeResult.error.message);
    const row = {
      profile_key: profileKey,
      label: clean(payload.label || beforeResult.data?.label || profileKey),
      description: clean(payload.description || beforeResult.data?.description) || null,
      active: bool(beforeResult.data?.active, false),
      configuration: object(payload.configuration || beforeResult.data?.configuration),
      updated_by: actor.id,
      updated_at: now(),
    };
    const result = await supabase.from("ac_capital_ai_operating_profiles").upsert(row, { onConflict: "profile_key" }).select("*").single();
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "profile", profileKey, beforeResult.data, result.data);
    return result.data;
  }

  if (action === "activate_profile") {
    const profileKey = clean(payload.profileKey);
    const profileResult = await supabase.from("ac_capital_ai_operating_profiles").select("*").eq("profile_key", profileKey).single();
    if (profileResult.error) throw new Error(profileResult.error.message);
    const profile = profileResult.data;
    const config = object(profile.configuration);
    const activeAgentKeys = new Set(stringArray(config.activeAgentKeys));
    const agentsResult = await supabase.from("ac_capital_ai_agents").select("*");
    if (agentsResult.error) throw new Error(agentsResult.error.message);
    for (const agent of agentsResult.data || []) {
      if (agent.status === "disabled") continue;
      const status = activeAgentKeys.has(clean(agent.agent_key)) ? "active" : "paused";
      const update = await supabase.from("ac_capital_ai_agents").update({ status, next_run_at: status === "active" ? nextRun(agent, number(config.frequencyMultiplier, 1)) : null, updated_by: actor.id, updated_at: now() }).eq("id", agent.id);
      if (update.error) throw new Error(update.error.message);
    }
    await supabase.from("ac_capital_ai_operating_profiles").update({ active: false, updated_by: actor.id, updated_at: now() }).neq("profile_key", profileKey);
    const activeResult = await supabase.from("ac_capital_ai_operating_profiles").update({ active: true, updated_by: actor.id, updated_at: now() }).eq("profile_key", profileKey).select("*").single();
    if (activeResult.error) throw new Error(activeResult.error.message);
    const stateBefore = await supabase.from("ac_capital_ai_runtime_state").select("*").eq("state_key", "primary").single();
    const stateUpdate = await supabase.from("ac_capital_ai_runtime_state").update({
      active_profile_key: profileKey,
      global_pause: profileKey === "paused",
      max_parallel_runs: Math.max(1, number(config.maxParallelRuns, 1)),
      metadata: { ...object(stateBefore.data?.metadata), profileConfiguration: config },
      updated_by: actor.id,
      updated_at: now(),
    }).eq("state_key", "primary").select("*").single();
    if (stateUpdate.error) throw new Error(stateUpdate.error.message);
    const tavily = await providerRow(supabase, "tavily");
    const openrouter = await providerRow(supabase, "openrouter");
    await supabase.from("ac_capital_ai_provider_configs").update({ internal_limits: { ...object(tavily.internal_limits), maxCreditsPerDay: number(config.tavilyCreditsPerDay, number(object(tavily.internal_limits).maxCreditsPerDay, 40)) }, updated_by: actor.id, updated_at: now() }).eq("provider_key", "tavily");
    await supabase.from("ac_capital_ai_provider_configs").update({ internal_limits: { ...object(openrouter.internal_limits), maxRequestsPerDay: number(config.openrouterRequestsPerDay, number(object(openrouter.internal_limits).maxRequestsPerDay, 40)) }, updated_by: actor.id, updated_at: now() }).eq("provider_key", "openrouter");
    await audit(supabase, actor, action, "profile", profileKey, stateBefore.data, { profile: activeResult.data, runtimeState: stateUpdate.data });
    return { profile: activeResult.data, runtimeState: stateUpdate.data, activeAgentKeys: [...activeAgentKeys] };
  }

  if (action === "save_runtime_state") {
    const beforeResult = await supabase.from("ac_capital_ai_runtime_state").select("*").eq("state_key", "primary").single();
    if (beforeResult.error) throw new Error(beforeResult.error.message);
    const row = {
      scheduler_enabled: payload.schedulerEnabled !== undefined ? bool(payload.schedulerEnabled) : beforeResult.data.scheduler_enabled,
      scheduler_poll_minutes: payload.schedulerPollMinutes !== undefined ? Math.max(1, Math.min(1440, number(payload.schedulerPollMinutes, 15))) : beforeResult.data.scheduler_poll_minutes,
      internal_automation_enabled: payload.internalAutomationEnabled !== undefined ? bool(payload.internalAutomationEnabled) : beforeResult.data.internal_automation_enabled,
      external_actions_locked: true,
      global_pause: payload.globalPause !== undefined ? bool(payload.globalPause) : beforeResult.data.global_pause,
      max_parallel_runs: payload.maxParallelRuns !== undefined ? Math.max(1, Math.min(20, number(payload.maxParallelRuns, 1))) : beforeResult.data.max_parallel_runs,
      timezone: clean(payload.timezone || beforeResult.data.timezone || "Africa/Casablanca"),
      updated_by: actor.id,
      updated_at: now(),
    };
    const result = await supabase.from("ac_capital_ai_runtime_state").update(row).eq("state_key", "primary").select("*").single();
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "runtime_state", "primary", beforeResult.data, result.data);
    return result.data;
  }

  if (action === "run_agent") {
    const agentKey = clean(payload.agentKey);
    const query = clean(payload.query);
    if (!agentKey || !query) throw new Error("AGENT_AND_QUERY_REQUIRED");
    const execution = await executeExternalResearchAgent({ agentKey, query, triggerType: "manual", actorId: actor.id });
    const persistence = await persistExternalResearchExecution(execution, { actorId: actor.id });
    return { execution, persistence };
  }

  if (action === "cancel_run") {
    const runId = clean(payload.runId);
    if (!runId) throw new Error("RUN_ID_REQUIRED");
    const result = await supabase.from("ac_capital_ai_agent_runs").update({ cancel_requested: true, status: "cancelled", phase: "cancelled", finished_at: now(), updated_at: now() }).eq("id", runId).in("status", ["queued", "running"]).select("*").maybeSingle();
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "run", runId, null, result.data);
    return result.data || { runId, cancelled: false };
  }

  if (action === "resolve_incident") {
    const incidentId = clean(payload.incidentId);
    if (!incidentId) throw new Error("INCIDENT_ID_REQUIRED");
    const result = await supabase.from("ac_capital_ai_runtime_incidents").update({ status: "resolved", resolved_at: now(), updated_at: now() }).eq("id", incidentId).select("*").single();
    if (result.error) throw new Error(result.error.message);
    await audit(supabase, actor, action, "incident", incidentId, null, result.data);
    return result.data;
  }

  throw new Error("INVALID_AC_CAPITAL_AI_CONTROL_ACTION");
}

// FINAL_09: this legacy scheduler is restricted to true external-research agents.
export async function runDueAcCapitalAgents(actor: Actor) {
  const supabase = await admin();
  const stateResult = await supabase.from("ac_capital_ai_runtime_state").select("*").eq("state_key", "primary").single();
  if (stateResult.error) throw new Error(stateResult.error.message);
  const state = stateResult.data;
  if (!state.scheduler_enabled || state.global_pause || !state.internal_automation_enabled) return { executed: [], skipped: "scheduler-disabled-or-paused" };
  const agentsResult = await supabase.from("ac_capital_ai_agents").select("*").eq("status", "active").eq("category", "external-research").in("trigger_mode", ["scheduled", "both"]).order("next_run_at", { ascending: true, nullsFirst: true }).limit(100);
  if (agentsResult.error) throw new Error(agentsResult.error.message);
  const dueAgents = (agentsResult.data || []).filter((agent: JsonRecord) => !agent.next_run_at || new Date(clean(agent.next_run_at)).getTime() <= Date.now()).slice(0, Math.max(1, Number(state.max_parallel_runs || 1)));
  const profileConfig = object(object(state.metadata).profileConfiguration);
  const frequencyMultiplier = number(profileConfig.frequencyMultiplier, 1);
  const executed = await Promise.all(dueAgents.map(async (agent: JsonRecord) => {
    const query = clean(object(agent.search_config).scheduledQuery || `${agent.name}: find current public external intelligence relevant to AngelCare according to the configured doctrine.`);
    try {
      const execution = await executeExternalResearchAgent({ agentKey: clean(agent.agent_key), query, triggerType: "scheduled", actorId: actor.id });
      const persistence = await persistExternalResearchExecution(execution, { actorId: actor.id });
      return { agentKey: clean(agent.agent_key), runId: execution.runId, status: "completed", persistence };
    } catch (error) {
      return { agentKey: clean(agent.agent_key), status: "failed", error: error instanceof Error ? error.message : String(error) };
    } finally {
      await supabase.from("ac_capital_ai_agents").update({ next_run_at: nextRun(agent, frequencyMultiplier), updated_at: now() }).eq("id", agent.id);
    }
  }));
  return { executed };
}
