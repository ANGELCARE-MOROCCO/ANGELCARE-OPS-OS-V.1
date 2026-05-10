export function emailOSAIEnvStatus() {
  return {
    openaiApiKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.EMAIL_OS_AI_MODEL || "gpt-4.1-mini",
    enabled: Boolean(process.env.OPENAI_API_KEY)
  }
}

export function buildSafeAISuggestion(input: {
  subject?: string
  body?: string
  riskLevel?: string
}) {
  const subject = input.subject || "Untitled"
  const riskLevel = input.riskLevel || "normal"

  const requiresApproval = ["high", "critical"].includes(riskLevel)

  return {
    subject: `Re: ${subject}`,
    body:
      "Hello,\n\nThank you for your message. We have received your request and our team is reviewing it carefully. We will follow up with the next step shortly.\n\nBest regards,\nAngelCare Operations",
    requiresApproval,
    confidence: requiresApproval ? 0.72 : 0.84,
    guardReason: requiresApproval ? "High-risk AI output requires human approval." : "Standard AI suggestion."
  }
}
