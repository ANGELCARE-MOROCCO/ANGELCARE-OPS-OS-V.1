import { NextResponse } from "next/server"
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from "@/lib/ac360/action-wiring"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const guarded = await runAc360WiredAction('email_os.ai_assist', async () => {
    const subject = body.subject || "Untitled"
    const tone = body.tone || "professional"

    return {
      suggestedSubject: `[Reviewed] ${subject}`,
      suggestedReply: `Hello,\n\nThis is an AI-assisted ${tone} response draft prepared for operational review.\n\nBest regards,\nAngelCare Operations`,
      suggestedTags: ["priority-review", "customer-followup"],
      confidence: 0.84
    }
  }, {
    orgId: body.orgId || body.org_id,
    quantity: 1,
    idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('email.ai-assist', `${body.subject || 'untitled'}:${body.tone || 'professional'}`),
    metadata: { subject: body.subject || null, tone: body.tone || 'professional', source: 'api.email-os.ai-assist.POST' },
  })

  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)

  return NextResponse.json({ ok: true, data: guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } })
}
