import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { replaceCanonicalSource } from "@/lib/market-os/content-command-headquarters/bridge"

export const dynamic = "force-dynamic"
export async function POST(request: NextRequest) {
  try {
    const actor = await requireContentHeadquartersUser("manage_sources")
    const form = await request.formData(); const dossierId = String(form.get("dossierId") || ""); const file = form.get("file")
    if (!dossierId) throw new Error("DOSSIER_ID_REQUIRED"); if (!(file instanceof File)) throw new Error("FILE_REQUIRED")
    const supabase = await createServiceClient() as any
    const dossier = await supabase.from("market_content_dossiers").select("id,content_code").eq("id", dossierId).single(); if (dossier.error) throw dossier.error
    const reason = String(form.get("replacementReason") || "").trim()
    const confirmation = String(form.get("confirmation") || "")
    if (!reason) throw new Error("REPLACEMENT_REASON_REQUIRED")
    const result = await replaceCanonicalSource({ actorId: actor.id, actorName: actor.name, dossierId, contentCode: dossier.data.content_code, reason, confirmation, file })
    return NextResponse.json({ ok: true, result })
  } catch (error) { return contentHeadquartersApiError(error) }
}
