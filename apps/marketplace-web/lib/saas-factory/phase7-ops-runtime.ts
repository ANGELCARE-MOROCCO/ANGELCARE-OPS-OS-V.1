import { NextResponse } from "next/server";

export type ProbeStatus = "healthy" | "warning" | "critical";
export type JsonRecord = Record<string, unknown>;

export function jsonOk(data: JsonRecord = {}, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(error: unknown, status = 500, data: JsonRecord = {}) {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : String(error), ...data },
    { status }
  );
}

export async function readBody<T extends JsonRecord = JsonRecord>(request: Request): Promise<T> {
  try {
    const json = await request.json();
    return json && typeof json === "object" ? (json as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function slug(value: unknown, fallback = "item") {
  const raw = String(value ?? "").trim();
  const result = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return result || fallback;
}

export function getRestConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key, configured: Boolean(url && key) };
}

export async function rest(
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  payload?: unknown,
  query = ""
) {
  const { url, key, configured } = getRestConfig();

  if (!configured || !url || !key) {
    return {
      ok: true,
      dryRun: true,
      table,
      method,
      query,
      payload,
      reason: "Supabase REST env not configured in this runtime.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}${query}`;
  const response = await fetch(endpoint, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
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
    throw new Error(`REST ${method} ${table}${query} failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return { ok: true, data };
}

export function routeToKey(route: string, method = "GET") {
  return slug(`${route}_${method}`, "route");
}

export async function audit(event: string, metadata: JsonRecord = {}) {
  const row = {
    event,
    event_key: event,
    action: metadata.action ?? event,
    module_key: metadata.module_key ?? "saas_factory_command",
    entity_type: metadata.entity_type ?? "ops_event",
    entity_id: metadata.entity_id ? String(metadata.entity_id) : null,
    severity: metadata.severity ?? "info",
    status: metadata.status ?? "success",
    message: metadata.message ?? event,
    actor: metadata.actor ?? "system",
    metadata_json: metadata,
    before_json: metadata.before_json ?? {},
    after_json: metadata.after_json ?? {},
    created_at: new Date().toISOString(),
  };

  try {
    return await rest("saas_factory_audit_events", "POST", [row]);
  } catch (error) {
    return { ok: false, auditFailed: true, error: String(error), row };
  }
}

export async function saveProbeResult(input: {
  key?: string;
  probe_type: string;
  target: string;
  module_key?: string;
  status: ProbeStatus;
  latency_ms?: number;
  error?: string | null;
  metadata_json?: JsonRecord;
}) {
  const row = {
    key: input.key ?? slug(`${input.probe_type}_${input.target}`, "probe"),
    probe_type: input.probe_type,
    target: input.target,
    module_key: input.module_key ?? "saas_factory_command",
    status: input.status,
    latency_ms: input.latency_ms ?? 0,
    error: input.error ?? null,
    metadata_json: input.metadata_json ?? {},
    checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await rest(
    "saas_factory_probe_results",
    "GET",
    undefined,
    `?key=eq.${encodeURIComponent(row.key)}&select=id`
  ).catch(() => ({ ok: true, data: [] }));

  const rows = Array.isArray((existing as any).data) ? (existing as any).data : [];

  if (rows[0]?.id) {
    return rest("saas_factory_probe_results", "PATCH", row, `?id=eq.${rows[0].id}`);
  }

  return rest("saas_factory_probe_results", "POST", [row]);
}

export async function enqueueJob(input: {
  queue_name: string;
  job_type: string;
  priority?: string;
  payload_json?: JsonRecord;
  module_key?: string;
}) {
  const key = slug(`${input.queue_name}_${input.job_type}_${Date.now()}`, "queue_job");
  const row = {
    key,
    queue_name: input.queue_name,
    job_type: input.job_type,
    module_key: input.module_key ?? "saas_factory_command",
    status: "queued",
    priority: input.priority ?? "normal",
    attempts: 0,
    max_attempts: 3,
    payload_json: input.payload_json ?? {},
    result_json: {},
    scheduled_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await audit("saas_factory.queue.enqueued", {
    action: "queue_enqueue",
    entity_type: "queue_job",
    entity_id: key,
    message: `Queued ${input.job_type} in ${input.queue_name}`,
    after_json: row,
  });

  return rest("saas_factory_queue_jobs", "POST", [row]);
}

export async function createIncident(input: {
  title: string;
  severity?: string;
  module_key?: string;
  description?: string | null;
  source?: string;
  metadata_json?: JsonRecord;
}) {
  const key = slug(`${input.module_key ?? "factory"}_${input.title}_${Date.now()}`, "incident");
  const row = {
    key,
    title: input.title,
    description: input.description ?? null,
    severity: input.severity ?? "warning",
    status: "investigating",
    module_key: input.module_key ?? "saas_factory_command",
    source: input.source ?? "phase7_ops",
    metadata_json: input.metadata_json ?? {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await audit("saas_factory.incident.created_from_ops", {
    action: "incident_create",
    entity_type: "incident",
    entity_id: key,
    severity: row.severity,
    message: row.title,
    after_json: row,
  });

  return rest("saas_factory_incidents", "POST", [row]);
}

export const DEFAULT_PHASE7_PROBES = [
  { probe_type: "api", target: "/api/saas-factory/overview", method: "GET", module_key: "saas_factory_command" },
  { probe_type: "api", target: "/api/saas-factory/live-options?group=cities", method: "GET", module_key: "saas_factory_command" },
  { probe_type: "api", target: "/api/saas-factory/phase6/health", method: "GET", module_key: "saas_factory_command" },
  { probe_type: "api", target: "/api/saas-factory/adoption/plan", method: "GET", module_key: "saas_factory_command" },
  { probe_type: "api", target: "/api/saas-factory/discovery/apis", method: "GET", module_key: "saas_factory_command" },
] as const;

export async function runLocalProbe(origin: string, probe: { target: string; method?: string; module_key?: string; probe_type?: string }) {
  const started = Date.now();
  let status: ProbeStatus = "healthy";
  let error: string | null = null;
  let httpStatus: number | null = null;

  try {
    const url = probe.target.startsWith("http") ? probe.target : `${origin}${probe.target}`;
    const response = await fetch(url, {
      method: probe.method ?? "GET",
      cache: "no-store",
    });
    httpStatus = response.status;

    if (response.status >= 500) status = "critical";
    else if (response.status >= 400) status = "warning";
  } catch (err) {
    status = "critical";
    error = err instanceof Error ? err.message : String(err);
  }

  const latency = Date.now() - started;

  await saveProbeResult({
    key: routeToKey(probe.target, probe.method ?? "GET"),
    probe_type: probe.probe_type ?? "api",
    target: probe.target,
    module_key: probe.module_key ?? "saas_factory_command",
    status,
    latency_ms: latency,
    error,
    metadata_json: { httpStatus, method: probe.method ?? "GET" },
  });

  if (status === "critical") {
    await createIncident({
      title: `Critical probe failed: ${probe.target}`,
      severity: "critical",
      module_key: probe.module_key ?? "saas_factory_command",
      description: error ?? `HTTP status ${httpStatus}`,
      source: "phase7_probe",
      metadata_json: { target: probe.target, httpStatus, latency },
    });
  }

  return {
    target: probe.target,
    status,
    latency_ms: latency,
    httpStatus,
    error,
  };
}
