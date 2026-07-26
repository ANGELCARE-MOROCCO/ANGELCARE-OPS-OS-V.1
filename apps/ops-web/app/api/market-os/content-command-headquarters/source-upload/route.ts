import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { storeInitialCanonicalSource, storeProgressEvidence } from "@/lib/market-os/content-command-headquarters/bridge"

export const dynamic = "force-dynamic"
export async function POST(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") || "evidence"
    const actor = await requireContentHeadquartersUser(mode === "source" ? "manage_sources" : "operate")
    const form = await request.formData(); const dossierId = String(form.get("dossierId") || ""); const file = form.get("file")
    if (!dossierId) throw new Error("DOSSIER_ID_REQUIRED"); if (!(file instanceof File)) throw new Error("FILE_REQUIRED")
    if (mode === "source") {
      const supabase = await createServiceClient() as any
      const dossier = await supabase.from("market_content_dossiers").select("id,content_code,status").eq("id", dossierId).single()
      if (dossier.error) throw dossier.error
      if (!["validated", "source_required", "source_secured", "classified", "ready_distribution"].includes(dossier.data.status)) throw new Error("SOURCE_GATE_NOT_READY")
      const result = await storeInitialCanonicalSource({ actorId: actor.id, actorName: actor.name, dossierId, contentCode: dossier.data.content_code, reason: String(form.get("reason") || "Initial canonical source after validation"), file })
      return NextResponse.json({ ok: true, result })
    }
    const result = await storeProgressEvidence({ actorId: actor.id, actorName: actor.name, dossierId, missionId: String(form.get("missionId") || "") || null, taskId: String(form.get("taskId") || "") || null, checkpointId: String(form.get("checkpointId") || "") || null, evidenceType: String(form.get("evidenceType") || "progress_screenshot"), title: String(form.get("title") || file.name), note: String(form.get("note") || ""), progressPercent: Number(form.get("progressPercent") || 0), file })
    return NextResponse.json({ ok: true, result })
  } catch (error) { return contentHeadquartersApiError(error) }
}
