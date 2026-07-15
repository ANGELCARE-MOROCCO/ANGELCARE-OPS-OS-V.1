import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { updateAmbassadorEntity } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  const body = await readBody(request)
  const id = String(body.id || body.conversion_id || "")
  if (!id) return ambassadorJson({ ok: false, source: "ambassador-validation", error: "Missing conversion id" })
  const status = String(body.status || body.validation_decision || "validated")
  return ambassadorJson(await updateAmbassadorEntity("conversions", id, {
    status,
    validation_decision: body.validation_decision || status,
    validation_note: body.validation_note || body.notes || null,
    validated_by: body.validated_by || "AngelCare Operator",
  }))
}
