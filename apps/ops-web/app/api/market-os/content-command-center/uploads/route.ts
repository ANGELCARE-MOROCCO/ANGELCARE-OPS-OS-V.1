import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { storeInitialCanonicalSource, storeProgressEvidence } from "@/lib/market-os/content-command-headquarters/bridge"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const dossierId = String(form.get("dossierId") || form.get("entity_id") || "")
    const file = form.get("file")
    const requestedMode = String(form.get("mode") || form.get("upload_mode") || "evidence")
    const mode = requestedMode === "source" ? "source" : "evidence"
    if (!dossierId) throw new Error("DOSSIER_ID_REQUIRED")
    if (!(file instanceof File)) throw new Error("FILE_REQUIRED")
    const actor = await requireContentHeadquartersUser(mode === "source" ? "manage_sources" : "operate")

    if (mode === "source") {
      const supabase = await createServiceClient() as any
      const dossier = await supabase.from("market_content_dossiers").select("id,content_code,status").eq("id", dossierId).single()
      if (dossier.error) throw dossier.error
      if (!["validated", "source_required", "source_secured", "classified", "ready_distribution"].includes(dossier.data.status)) throw new Error("SOURCE_GATE_NOT_READY")
      const result = await storeInitialCanonicalSource({
        actorId: actor.id,
        actorName: actor.name,
        dossierId,
        contentCode: dossier.data.content_code,
        reason: String(form.get("reason") || "Canonical source uploaded through compatibility route"),
        file,
      })
      return NextResponse.json({ ok: true, upload: result, result, persisted: true, source: "market_content_source_objects" })
    }

    const result = await storeProgressEvidence({
      actorId: actor.id,
      actorName: actor.name,
      dossierId,
      missionId: String(form.get("missionId") || form.get("mission_id") || "") || null,
      taskId: String(form.get("taskId") || form.get("task_id") || "") || null,
      checkpointId: String(form.get("checkpointId") || form.get("checkpoint_id") || "") || null,
      evidenceType: String(form.get("evidenceType") || form.get("entity_type") || "creative_asset"),
      title: String(form.get("title") || file.name),
      note: String(form.get("note") || "Uploaded through canonical compatibility route"),
      progressPercent: Number(form.get("progressPercent") || 0),
      file,
    })
    return NextResponse.json({ ok: true, upload: result, result, persisted: true, source: "market_content_evidence" })
  } catch (error) {
    return contentHeadquartersApiError(error)
  }
}
