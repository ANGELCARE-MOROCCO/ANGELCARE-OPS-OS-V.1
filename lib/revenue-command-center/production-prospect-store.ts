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
  score?: number
  updatedAt?: string
  createdAt?: string
}

function normalizeForRow(prospect: ProspectLike) {
  const now = new Date().toISOString()
  return {
    id: String(prospect.id),
    name: String(prospect.name || prospect.company || "Unnamed prospect"),
    city: String(prospect.city || "Unassigned"),
    stage: String(prospect.stage || "new_lead"),
    priority: String(prospect.priority || "medium"),
    value_mad: Number(prospect.valueMad || 0),
    score: Number(prospect.score || 0),
    data: {
      ...prospect,
      id: String(prospect.id),
      updatedAt: prospect.updatedAt || now,
      createdAt: prospect.createdAt || now,
    },
    updated_at: now,
  }
}

export async function loadProductionProspects<T = ProspectLike>(): Promise<T[]> {
  const { data, error } = await supabase
    .from("revenue_prospects")
    .select("data")
    .order("updated_at", { ascending: false })

  if (error) throw error
  return (data || []).map((row: { data: T }) => row.data).filter(Boolean)
}

export async function saveProductionProspect<T extends ProspectLike>(prospect: T) {
  const row = normalizeForRow(prospect)
  const { data, error } = await supabase
    .from("revenue_prospects")
    .upsert(row, { onConflict: "id" })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveProductionProspectsBulk<T extends ProspectLike>(prospects: T[]) {
  if (!prospects.length) return []
  const rows = prospects.map(normalizeForRow)
  const { data, error } = await supabase
    .from("revenue_prospects")
    .upsert(rows, { onConflict: "id" })
    .select("id")

  if (error) throw error
  return data || []
}

export async function deleteProductionProspect(id: string) {
  const { error } = await supabase.from("revenue_prospects").delete().eq("id", id)
  if (error) throw error
}

export async function migrateBrowserProspectsToProduction<T extends ProspectLike>(prospects: T[]) {
  const result = await saveProductionProspectsBulk(prospects)
  return { count: result.length }
}
