import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type ProspectRow = {
  id: string
  name?: string | null
  city?: string | null
  stage?: string | null
  priority?: string | null
  value_mad?: number | null
  score?: number | null
  updated_at?: string | null
  data?: Record<string, any> | null
}

function normalize(row: ProspectRow) {
  const payload = row.data || {}
  const id = String(row.id || payload.id || "")
  return {
    id,
    name: String(row.name || payload.name || payload.company || "Unnamed prospect"),
    company: String(payload.company || row.name || payload.name || "Unnamed company"),
    city: String(row.city || payload.city || "Unassigned"),
    stage: String(row.stage || payload.stage || "new_lead"),
    priority: String(row.priority || payload.priority || "medium"),
    value_mad: Number(row.value_mad || payload.valueMad || payload.value || 0),
    score: Number(row.score || payload.score || 0),
    contactName: String(payload.contactName || payload.decisionMaker || "N/A"),
    owner: String(payload.owner || "BD Officer"),
    phone: String(payload.phone || ""),
    email: String(payload.email || ""),
    updated_at: row.updated_at || payload.updatedAt || null,
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") || "").trim().toLowerCase()

  const { data, error } = await supabase
    .from("revenue_prospects")
    .select("id,name,city,stage,priority,value_mad,score,updated_at,data")
    .order("updated_at", { ascending: false })
    .limit(Math.min(Number(searchParams.get("limit") || 2000), 5000))

  if (error) {
    return NextResponse.json(
      { ok: false, source: "revenue_prospects", error: error.message, prospects: [] },
      { status: 500 },
    )
  }

  let prospects = ((data || []) as ProspectRow[]).map(normalize).filter((p) => p.id)

  if (q) {
    prospects = prospects.filter((p) =>
      [p.id, p.name, p.company, p.city, p.stage, p.priority, p.contactName, p.owner, p.phone, p.email]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }

  return NextResponse.json({
    ok: true,
    source: "revenue_prospects",
    count: prospects.length,
    prospects,
    syncedAt: new Date().toISOString(),
  })
}
