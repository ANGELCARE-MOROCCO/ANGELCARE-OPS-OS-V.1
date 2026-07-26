import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { generateDossierSample } from "@/lib/market-os/content-command-headquarters/ai-supervision"

export const dynamic = "force-dynamic"
export async function POST(request: NextRequest) {
  try {
    const actor = await requireContentHeadquartersUser("operate")
    const body = await request.json() as Record<string, unknown>; const dossierId = String(body.dossierId || "")
    if (!dossierId) throw new Error("DOSSIER_ID_REQUIRED")
    const supabase = await createServiceClient() as any
    const dossier = await supabase.from("market_content_dossiers").select("*").eq("id", dossierId).single(); if (dossier.error) throw dossier.error
    const result = await generateDossierSample({ actorId: actor.id, actorName: actor.name, dossierId, missionId: dossier.data.mission_id, purpose: String(body.purpose || dossier.data.objective || "Visual direction"), direction: String(body.direction || "Premium corporate ANGELCARE visual concept"), format: String(body.format || "social portrait"), message: String(body.message || dossier.data.message_pillar || ""), constraints: Array.isArray(body.constraints) ? body.constraints.map(String) : ["No invented logo", "No fabricated claim", "Concept reference only"], dossierContext: dossier.data })
    return NextResponse.json({ ok: true, result })
  } catch (error) { return contentHeadquartersApiError(error) }
}
