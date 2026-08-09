import type { AcCapitalSupabaseConfig } from "./types";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getSupabaseServerConfig(): AcCapitalSupabaseConfig {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.AC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.AC_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return {
      enabled: false,
      reason: "Supabase URL/key environment variables are not configured.",
    };
  }

  return {
    enabled: true,
    url: trimTrailingSlash(url),
    key,
  };
}

export async function supabaseRestSelect(table: string, params?: Record<string, string | number | boolean>) {
  const config = getSupabaseServerConfig();
  if (!config.enabled || !config.url || !config.key) {
    return { ok: false, rows: [], warning: config.reason || "Supabase not configured" };
  }

  const url = new URL(`${config.url}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", String(params?.limit ?? 25));

  for (const [key, value] of Object.entries(params || {})) {
    if (key !== "limit") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, rows: [], warning: `Supabase select failed for ${table}: ${response.status} ${text}` };
  }

  const rows = (await response.json()) as unknown[];
  return { ok: true, rows, warning: undefined };
}

export async function supabaseRestInsert(table: string, record: Record<string, unknown>) {
  const config = getSupabaseServerConfig();
  if (!config.enabled || !config.url || !config.key) {
    return { ok: false, record: null, warning: config.reason || "Supabase not configured" };
  }

  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, record: null, warning: `Supabase insert failed for ${table}: ${response.status} ${text}` };
  }

  const data = (await response.json()) as unknown[];
  return { ok: true, record: data[0] ?? null, warning: undefined };
}

export async function supabaseStorageUpload(bucket: string, objectPath: string, file: ArrayBuffer, contentType: string) {
  const config = getSupabaseServerConfig();
  if (!config.enabled || !config.url || !config.key) {
    return { ok: false, storagePath: null, warning: "storage_not_configured" };
  }

  const response = await fetch(`${config.url}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: file,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, storagePath: null, warning: `storage_not_configured: ${response.status} ${text}` };
  }

  return { ok: true, storagePath: `${bucket}/${objectPath}`, warning: undefined };
}
