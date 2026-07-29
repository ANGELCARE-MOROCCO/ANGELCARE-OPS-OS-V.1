import { getCurrentAppUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export async function requireCapitalApiActor() {
  const user = await getCurrentAppUser();
  if (!user) throw Object.assign(new Error("AUTH_REQUIRED"), { status: 401 });
  const row = user as Row;
  return {
    id: String(row.id || ""),
    name: String(row.full_name || row.name || row.email || "Authenticated user"),
    email: String(row.email || ""),
    role: String(row.role || "read_only").toLowerCase(),
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : [],
  };
}

export function isFounder(actor: Awaited<ReturnType<typeof requireCapitalApiActor>>) {
  return ["ceo", "owner", "super_admin", "root", "root_admin", "direction", "founder", "managing_director"].includes(actor.role) || actor.permissions.includes("*") || actor.permissions.includes("ac_capital.approve");
}

export function isWriter(actor: Awaited<ReturnType<typeof requireCapitalApiActor>>) {
  return !["viewer", "read_only", "readonly"].includes(actor.role) || actor.permissions.includes("*") || actor.permissions.includes("ac_capital.write");
}

export async function readTable(table: string, limit = 100, orderColumn = "created_at") {
  const supabase = await createServiceClient();
  let query = supabase.from(table).select("*").limit(limit);
  const ordered = await query.order(orderColumn, { ascending: false });
  if (!ordered.error) return (ordered.data || []) as Row[];
  const fallback = await supabase.from(table).select("*").limit(limit);
  if (fallback.error) throw fallback.error;
  return (fallback.data || []) as Row[];
}

export async function insertRow(table: string, payload: Row) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from(table).insert(payload).select("*").single();
  if (error) throw error;
  return data as Row;
}

export async function updateRow(table: string, id: string, payload: Row) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from(table).update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Row;
}

export async function insertAudit(input: { actor: string; action: string; objectType: string; objectId?: string; before?: unknown; after?: unknown; reason?: string; risk?: string; approval?: string }) {
  try {
    return await insertRow("ac_capital_strategy_audit_events", {
      actor: input.actor,
      action: input.action,
      object_type: input.objectType,
      object_id: input.objectId || null,
      before_state: input.before || null,
      after_state: input.after || null,
      reason: input.reason || null,
      risk_level: input.risk || "Medium",
      approval_requirement: input.approval || "Human review",
    });
  } catch {
    return null;
  }
}

export function envelope(groups: Record<string, Row[]>, warning?: string) {
  const count = Object.values(groups).reduce((total, rows) => total + rows.length, 0);
  return {
    ok: true,
    dataMode: count > 0 ? "supabase-live" : "seeded-fallback",
    source: count > 0 ? "supabase" : "seeded",
    warning: warning || (count > 0 ? undefined : "No live records exist for this workspace yet. The interface is operating in an honest empty/fallback state."),
    data: { groups: Object.fromEntries(Object.entries(groups).map(([label, rows]) => [label, { rows, summary: { count: rows.length, hasData: rows.length > 0 } }])) },
  } as const;
}

export function success(data: unknown, warning?: string) {
  return { ok: true, dataMode: "supabase-live", source: "supabase", warning, data } as const;
}

export function apiError(reason: unknown) {
  const error = reason as { message?: string; status?: number; code?: string };
  const status = Number(error?.status || 500);
  return Response.json({ ok: false, dataMode: "disabled", source: "none", code: error?.code || error?.message || "AC_CAPITAL_API_ERROR", warning: error?.message || "The controlled action failed.", data: null }, { status });
}

export function requiredString(value: unknown, label: string) {
  const text = String(value || "").trim();
  if (!text) throw Object.assign(new Error(`${label} is required.`), { status: 400 });
  return text;
}
