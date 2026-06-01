import { NextResponse } from "next/server";

export type FactoryCommandStatus = "success" | "warning" | "error";

export type FactoryJson = Record<string, unknown>;

export function jsonOk(data: FactoryJson = {}, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(message: string, status = 500, data: FactoryJson = {}) {
  return NextResponse.json({ ok: false, error: message, ...data }, { status });
}

export async function parseJsonBody<T extends FactoryJson = FactoryJson>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return (body && typeof body === "object" ? body : {}) as T;
  } catch {
    return {} as T;
  }
}

export function slugify(input: unknown, fallback = "item") {
  const raw = String(input ?? "").trim();
  const value = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return value || fallback;
}

export function nowIso() {
  return new Date().toISOString();
}

/**
 * Safe database bridge:
 * - Uses Supabase REST when NEXT_PUBLIC_SUPABASE_URL + service role/anon key exist.
 * - Falls back to a successful dry-run payload when env is missing, so dev UI does not crash.
 * This keeps the app stable while still writing to real Supabase when configured.
 */
export async function supabaseRest(
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  payload?: unknown,
  query = ""
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      ok: true,
      dryRun: true,
      table,
      method,
      query,
      payload,
      reason: "Supabase env keys are not available in this runtime.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}${query}`;
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation,resolution=merge-duplicates",
  };

  const response = await fetch(endpoint, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(payload ?? {}),
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase REST ${method} ${table} failed: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return { ok: true, table, method, query, data };
}

export async function auditEvent(event: string, data: FactoryJson = {}) {
  const row = {
    event,
    event_key: event,
    action: data.action ?? event,
    module_key: data.module_key ?? "saas_factory_command",
    entity_type: data.entity_type ?? "factory_command",
    entity_id: data.entity_id ? String(data.entity_id) : null,
    severity: data.severity ?? "info",
    status: data.status ?? "success",
    message: data.message ?? event,
    actor: data.actor ?? "system",
    metadata_json: data.metadata_json ?? data,
    before_json: data.before_json ?? {},
    after_json: data.after_json ?? {},
    created_at: nowIso(),
  };

  try {
    return await supabaseRest("saas_factory_audit_events", "POST", row, "?on_conflict=id");
  } catch (error) {
    return { ok: false, auditWriteFailed: true, error: String(error), row };
  }
}

export async function upsertFactoryOption(input: FactoryJson) {
  const groupKey = slugify(input.group_key ?? input.group ?? "cities", "cities");
  const label = String(input.label ?? input.name ?? input.value ?? "Untitled option");
  const value = slugify(input.value ?? label, "option");

  await supabaseRest(
    "saas_factory_option_groups",
    "POST",
    {
      key: groupKey,
      label: String(input.group_label ?? groupKey.replace(/_/g, " ")),
      description: input.group_description ?? "Managed by SaaS Factory Command",
      is_global: true,
      is_enabled: true,
      updated_at: nowIso(),
    },
    "?on_conflict=key"
  );

  const row = {
    group_key: groupKey,
    value,
    label,
    description: input.description ?? null,
    sort_order: Number(input.sort_order ?? 100),
    color: input.color ?? null,
    icon: input.icon ?? null,
    metadata_json: input.metadata_json ?? input.metadata ?? {},
    availability_scope: Array.isArray(input.availability_scope)
      ? input.availability_scope
      : Array.isArray(input.modules)
        ? input.modules
        : [],
    is_default: Boolean(input.is_default ?? false),
    is_enabled: input.is_enabled ?? true,
    updated_at: nowIso(),
  };

  const result = await supabaseRest(
    "saas_factory_options",
    "POST",
    row,
    "?on_conflict=group_key,value"
  );

  await auditEvent("saas_factory.option.upserted", {
    action: "option_upsert",
    entity_type: "option",
    entity_id: `${groupKey}:${value}`,
    message: `Option ${label} upserted in ${groupKey}`,
    after_json: row,
  });

  return result;
}

export async function controlModule(input: FactoryJson) {
  const key = slugify(input.module_key ?? input.key ?? input.module ?? "saas_factory_command");
  const action = slugify(input.action ?? "update", "update");

  const patch: FactoryJson = {
    key,
    label: input.label ?? key.replace(/_/g, " "),
    description: input.description ?? "Controlled by SaaS Factory Command",
    status:
      action.includes("disable") ? "disabled" :
      action.includes("maintenance") ? "maintenance" :
      action.includes("enable") ? "active" :
      input.status ?? "active",
    visibility:
      action.includes("hide") ? "hidden" :
      action.includes("show") ? "visible" :
      input.visibility ?? "visible",
    rollout_stage: input.rollout_stage ?? "production",
    owner_team: input.owner_team ?? "Engineering",
    metadata_json: input.metadata_json ?? { last_action: action },
    updated_at: nowIso(),
  };

  const result = await supabaseRest("saas_factory_modules", "POST", patch, "?on_conflict=key");

  await auditEvent("saas_factory.module.controlled", {
    action,
    entity_type: "module",
    entity_id: key,
    message: `Module ${key} command executed: ${action}`,
    after_json: patch,
  });

  return result;
}

export async function upsertFeatureFlag(input: FactoryJson) {
  const key = slugify(input.key ?? input.flag_key ?? input.name ?? "new_flag", "flag");
  const moduleKey = slugify(input.module_key ?? input.module ?? "saas_factory_command");

  const row = {
    key,
    module_key: moduleKey,
    label: input.label ?? key.replace(/_/g, " "),
    description: input.description ?? "Managed by SaaS Factory Command",
    is_enabled: Boolean(input.is_enabled ?? input.enabled ?? true),
    rollout_stage: input.rollout_stage ?? "production",
    rollout_percent: Number(input.rollout_percent ?? 100),
    metadata_json: input.metadata_json ?? {},
    updated_at: nowIso(),
  };

  const result = await supabaseRest("saas_factory_feature_flags", "POST", row, "?on_conflict=key");

  await auditEvent("saas_factory.feature_flag.upserted", {
    action: "feature_flag_upsert",
    entity_type: "feature_flag",
    entity_id: key,
    message: `Feature flag ${key} upserted`,
    after_json: row,
  });

  return result;
}

export async function createIncident(input: FactoryJson) {
  const title = String(input.title ?? input.message ?? "Factory incident");
  const severity = String(input.severity ?? "warning");
  const incidentKey = slugify(input.key ?? title, "incident");

  const row = {
    key: incidentKey,
    title,
    description: input.description ?? input.message ?? null,
    severity,
    status: input.status ?? "investigating",
    module_key: input.module_key ?? "saas_factory_command",
    assigned_to: input.assigned_to ?? null,
    metadata_json: input.metadata_json ?? {},
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const result = await supabaseRest("saas_factory_incidents", "POST", row, "?on_conflict=key");

  await auditEvent("saas_factory.incident.created", {
    action: "incident_create",
    entity_type: "incident",
    entity_id: incidentKey,
    severity,
    message: title,
    after_json: row,
  });

  return result;
}

export async function registerAction(input: FactoryJson) {
  const moduleKey = slugify(input.module_key ?? input.module ?? "saas_factory_command");
  const pagePath = String(input.page_path ?? input.path ?? "/saas-factory-command");
  const actionKey = slugify(input.action_key ?? input.key ?? input.label ?? "command_action");

  const row = {
    module_key: moduleKey,
    page_path: pagePath,
    component_name: input.component_name ?? "SaasFactoryCommandCenter",
    action_key: actionKey,
    action_label: input.action_label ?? input.label ?? actionKey.replace(/_/g, " "),
    action_type: input.action_type ?? "command",
    target_api: input.target_api ?? "/api/saas-factory/command",
    target_table: input.target_table ?? null,
    permission_required: input.permission_required ?? "saas_factory.manage",
    status: input.status ?? "live",
    is_critical: Boolean(input.is_critical ?? false),
    last_tested_at: nowIso(),
    last_result: input.last_result ?? { ok: true, source: "phase3" },
    last_error: input.last_error ?? null,
    updated_at: nowIso(),
  };

  const result = await supabaseRest(
    "saas_factory_action_registry",
    "POST",
    row,
    "?on_conflict=module_key,page_path,action_key"
  );

  await auditEvent("saas_factory.action.registered", {
    action: "action_register",
    entity_type: "action",
    entity_id: `${moduleKey}:${actionKey}`,
    message: `Action ${actionKey} registered`,
    after_json: row,
  });

  return result;
}

export async function registerApi(input: FactoryJson) {
  const endpoint = String(input.endpoint ?? input.path ?? "/api/saas-factory/overview");
  const key = slugify(endpoint, "api_endpoint");

  const row = {
    key,
    endpoint,
    method: String(input.method ?? "GET").toUpperCase(),
    module_key: slugify(input.module_key ?? input.module ?? "saas_factory_command"),
    status: input.status ?? "healthy",
    avg_response_ms: Number(input.avg_response_ms ?? 0),
    error_rate: Number(input.error_rate ?? 0),
    metadata_json: input.metadata_json ?? {},
    last_checked_at: nowIso(),
    updated_at: nowIso(),
  };

  const result = await supabaseRest("saas_factory_api_registry", "POST", row, "?on_conflict=key");

  await auditEvent("saas_factory.api.registered", {
    action: "api_register",
    entity_type: "api",
    entity_id: key,
    message: `API endpoint ${endpoint} registered`,
    after_json: row,
  });

  return result;
}
