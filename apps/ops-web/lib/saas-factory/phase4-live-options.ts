import { NextResponse } from "next/server";

export type FactoryOption = {
  id?: string;
  group_key: string;
  value: string;
  label: string;
  description?: string | null;
  sort_order?: number;
  color?: string | null;
  icon?: string | null;
  metadata_json?: Record<string, unknown>;
  availability_scope?: string[];
  is_default?: boolean;
  is_enabled?: boolean;
};

export type FactoryOptionGroup = {
  key: string;
  label: string;
  description?: string;
  module_scope?: string[];
  is_global?: boolean;
  is_enabled?: boolean;
};

export function factoryJsonOk(data: Record<string, unknown> = {}, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function factoryJsonError(message: string, status = 500, data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...data }, { status });
}

export async function parseFactoryBody<T extends Record<string, unknown> = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    const json = await request.json();
    return json && typeof json === "object" ? (json as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function factorySlug(value: unknown, fallback = "option") {
  const raw = String(value ?? "").trim();
  const slug = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || fallback;
}

export function getSupabaseRestConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key, configured: Boolean(url && key) };
}

export async function factoryRest(
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  payload?: unknown,
  query = ""
) {
  const { url, key, configured } = getSupabaseRestConfig();

  if (!configured || !url || !key) {
    return {
      ok: true,
      dryRun: true,
      table,
      method,
      query,
      payload,
      reason: "Supabase REST env is not configured in this runtime.",
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
    throw new Error(`Supabase REST ${method} ${table}${query} failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return { ok: true, data };
}

export async function getLiveFactoryOptions(group: string, moduleKey?: string) {
  const groupKey = factorySlug(group, "general");
  const query =
    `?group_key=eq.${encodeURIComponent(groupKey)}` +
    `&is_enabled=eq.true` +
    `&order=sort_order.asc,label.asc` +
    `&select=*`;

  const result = await factoryRest("saas_factory_options", "GET", undefined, query);
  const data = Array.isArray((result as any).data) ? ((result as any).data as FactoryOption[]) : [];

  const filtered = moduleKey
    ? data.filter((option) => {
        const scope = option.availability_scope ?? [];
        return scope.length === 0 || scope.includes(moduleKey);
      })
    : data;

  return {
    group: groupKey,
    moduleKey: moduleKey ?? null,
    options: filtered,
    dryRun: Boolean((result as any).dryRun),
  };
}

export async function saveLiveFactoryOption(input: Partial<FactoryOption> & { group?: string; modules?: string[] }) {
  const groupKey = factorySlug(input.group_key ?? input.group ?? "general", "general");
  const label = String(input.label ?? input.value ?? "Untitled option").trim();
  const value = factorySlug(input.value ?? label, "option");

  const groupRow = {
    key: groupKey,
    label: groupKey.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
    description: "Managed by AngelCare SaaS Factory Command",
    is_global: true,
    is_enabled: true,
    updated_at: new Date().toISOString(),
  };

  await factoryRest("saas_factory_option_groups", "POST", [groupRow]);

  const row = {
    group_key: groupKey,
    value,
    label,
    description: input.description ?? null,
    sort_order: Number(input.sort_order ?? 100),
    color: input.color ?? null,
    icon: input.icon ?? null,
    metadata_json: input.metadata_json ?? {},
    availability_scope: input.availability_scope ?? input.modules ?? [],
    is_default: Boolean(input.is_default ?? false),
    is_enabled: input.is_enabled ?? true,
    updated_at: new Date().toISOString(),
  };

  const result = await factoryRest("saas_factory_options", "POST", [row]);
  return { row, result };
}

export const FACTORY_OPTION_GROUPS = {
  cities: "cities",
  regions: "regions",
  departments: "departments",
  positions: "positions",
  serviceCategories: "service_categories",
  leadSources: "lead_sources",
  partnerTypes: "partner_types",
  taskPriorities: "task_priorities",
  taskStatuses: "task_statuses",
  academyLocations: "academy_locations",
  academyCourseCategories: "academy_course_categories",
  hrShiftTypes: "hr_shift_types",
  revenuePipelineStages: "revenue_pipeline_stages",
  marketChannels: "market_channels",
  documentTypes: "document_types",
  incidentTypes: "incident_types",
} as const;

export const FACTORY_MODULE_KEYS = {
  revenue: "revenue_command_center",
  market: "market_os",
  academy: "academy",
  hr: "hr",
  service: "service_os",
  email: "email_os",
  connect: "connect",
  contracts: "contracts",
  missions: "missions",
  saasFactory: "saas_factory_command",
} as const;
