
import { evaluateEmailSla } from "@/lib/email-os/production/sla"
import { ok, fail, readJson } from "@/lib/email-os/production/response"

export async function POST(request: Request) {
  const body = await readJson<any>(request)
  if (!body?.rule || !body?.receivedAtIso) return fail("Missing rule or receivedAtIso", 400)
  return ok(evaluateEmailSla(body.rule, body.receivedAtIso))
}
