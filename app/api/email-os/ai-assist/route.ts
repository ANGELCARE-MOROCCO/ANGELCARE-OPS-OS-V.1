import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const subject = body.subject || "Untitled"
  const tone = body.tone || "professional"

  const suggestion = {
    suggestedSubject: `[Reviewed] ${subject}`,
    suggestedReply: `Hello,\n\nThis is an AI-assisted ${tone} response draft prepared for operational review.\n\nBest regards,\nAngelCare Operations`,
    suggestedTags: ["priority-review", "customer-followup"],
    confidence: 0.84
  }

  return NextResponse.json({
    ok: true,
    data: suggestion
  })
}
