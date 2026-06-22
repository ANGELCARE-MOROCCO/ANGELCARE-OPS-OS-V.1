
import { createClient } from "@supabase/supabase-js"

export function getContentCommandServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export function toCamelTemplate(row: any) {
  return {
    id: row.id,
    name: row.name,
    family: row.family,
    familyId: row.family_id,
    category: row.category,
    subcategory: row.subcategory,
    modalScope: row.modal_scope,
    output: row.output,
    channel: row.channel,
    owner: row.owner,
    status: row.status,
    usage: row.usage_count ?? 0,
    readiness: row.readiness ?? 72,
    lastUpdated: row.updated_at ? new Date(row.updated_at).toLocaleString() : "Just now",
    tone: row.tone || "violet",
    icon: row.icon_key || "LayoutTemplate",
    rules: row.rules || [],
    matchedParams: row.matched_params || [],
  }
}

export function fromCamelTemplate(template: any) {
  return {
    id: template.id,
    name: template.name,
    family: template.family,
    family_id: template.familyId || template.family_id || "templates",
    category: template.category,
    subcategory: template.subcategory,
    modal_scope: template.modalScope || template.modal_scope || `${template.family} Create Modal`,
    output: template.output || template.category,
    channel: template.channel || "Content Library",
    owner: template.owner || "Marketing Team",
    status: template.status || "Draft",
    usage_count: template.usage ?? template.usage_count ?? 0,
    readiness: template.readiness ?? 72,
    tone: typeof template.tone === "string" ? template.tone : "violet",
    icon_key: typeof template.icon === "string" ? template.icon : "LayoutTemplate",
    rules: template.rules || [],
    matched_params: template.matchedParams || template.matched_params || [],
  }
}

export function normalizeRecord(input: any, defaults: Record<string, any> = {}) {
  return {
    id: input.id || `${defaults.prefix || "record"}-${Date.now()}`,
    ...defaults,
    ...input,
  }
}
