"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type ProspectLike = {
  id: string
  name?: string
  company?: string
  city?: string
  stage?: string
  priority?: string
  valueMad?: number
  value_mad?: number
  score?: number
  probability?: number
  owner?: string
  contactName?: string
  contact_name?: string
  email?: string
  phone?: string
  source?: string
  segment?: string
  status?: string
  metadata?: Record<string, unknown>
  updatedAt?: string
  createdAt?: string
  [key: string]: unknown
}

function rowToProspect<T = ProspectLike>(row: any): T | null {
  if (!row) return null
  const data = row.data && typeof row.data === "object" ? row.data : {}
  const merged = {
    ...data,
    id: String(row.id || data.id || ""),
    name: String(row.name || data.name || data.company || "Unnamed prospect"),
    company: String(row.company || data.company || row.name || data.name || ""),
    city: String(row.city || data.city || "Unassigned"),
    source: String(row.source || data.source || "manual"),
    segment: String(row.segment || data.segment || data.type || "b2b"),
    stage: String(row.stage || data.stage || "new_lead"),
    priority: String(row.priority || data.priority || "medium"),
    valueMad: Number(row.value_mad ?? data.valueMad ?? data.value ?? 0),
    score: Number(row.score ?? data.score ?? 0),
    probability: Number(row.probability ?? data.probability ?? 0),
    owner: String(row.owner || data.owner || "BD Officer"),
    contactName: String(row.contact_name || data.contactName || data.decisionMaker || ""),
    email: String(row.email || data.email || ""),
    phone: String(row.phone || data.phone || ""),
    status: String(row.status || data.status || "active"),
    createdAt: String(row.created_at || data.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || data.updatedAt || new Date().toISOString()),
  }
  return merged.id ? (merged as T) : null
}

function normalizeForRow(prospect: ProspectLike) {
  const now = new Date().toISOString()
  const valueMad = Number(prospect.valueMad ?? prospect.value_mad ?? prospect.value ?? 0)
  const score = Number(prospect.score || 0)
  const name = String(prospect.name || prospect.company || "Unnamed prospect")
  const company = String(prospect.company || prospect.name || "")
  const contactName = String(prospect.contactName || prospect.contact_name || prospect.decisionMaker || "")

  return {
    id: String(prospect.id),
    name,
    company,
    city: String(prospect.city || "Unassigned"),
    source: String(prospect.source || "manual"),
    segment: String(prospect.segment || prospect.type || "b2b"),
    stage: String(prospect.stage || "new_lead"),
    priority: String(prospect.priority || "medium"),
    value_mad: Number.isFinite(valueMad) ? valueMad : 0,
    score: Number.isFinite(score) ? score : 0,
    probability: Number(prospect.probability || 0),
    owner: String(prospect.owner || "BD Officer"),
    contact_name: contactName,
    email: String(prospect.email || ""),
    phone: String(prospect.phone || ""),
    status: String(prospect.status || "active"),
    data: {
      ...prospect,
      id: String(prospect.id),
      name,
      company,
      contactName,
      valueMad: Number.isFinite(valueMad) ? valueMad : 0,
      updatedAt: prospect.updatedAt || now,
      createdAt: prospect.createdAt || now,
    },
    metadata: {
      ...(prospect.metadata || {}),
      source_of_truth: "revenue_prospects",
    },
    updated_at: now,
  }
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.ok === false) throw new Error(payload.error || `Request failed: ${response.status}`)
  return payload
}

export async function loadProductionProspects<T = ProspectLike>(): Promise<T[]> {
  const { data, error } = await supabase
    .from("revenue_prospects")
    .select("*")
    .neq("status", "archived")
    .order("updated_at", { ascending: false })

  if (error) throw error
  return (data || []).map(rowToProspect<T>).filter(Boolean) as T[]
}

export async function loadProductionProspect<T = ProspectLike>(id: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("revenue_prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return rowToProspect<T>(data)
}

export async function ensureProductionProspect<T extends ProspectLike>(prospect: T) {
  const payload = await fetchJson("/api/revenue-command-center/prospects/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: prospect.id, snapshot: prospect }),
  })
  return payload.prospect
}

export async function saveProductionProspect<T extends ProspectLike>(prospect: T) {
  const row = normalizeForRow(prospect)
  const { data, error } = await supabase
    .from("revenue_prospects")
    .upsert(row, { onConflict: "id" })
    .select()
    .single()

  if (!error) return data

  // Fallback for the earlier minimal revenue_prospects schema.
  const minimalRow = {
    id: row.id,
    name: row.name,
    city: row.city,
    stage: row.stage,
    priority: row.priority,
    value_mad: row.value_mad,
    score: row.score,
    data: row.data,
    updated_at: row.updated_at,
  }
  const fallback = await supabase
    .from("revenue_prospects")
    .upsert(minimalRow, { onConflict: "id" })
    .select()
    .single()

  if (fallback.error) throw fallback.error
  return fallback.data
}

export async function saveProductionProspectsBulk<T extends ProspectLike>(prospects: T[]) {
  if (!prospects.length) return []
  const results = []
  for (const prospect of prospects) {
    results.push(await saveProductionProspect(prospect))
  }
  return results
}

export async function deleteProductionProspect(id: string) {
  const { error } = await supabase
    .from("revenue_prospects")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function migrateBrowserProspectsToProduction<T extends ProspectLike>(prospects: T[]) {
  const result = await saveProductionProspectsBulk(prospects)
  return { count: result.length }
}
