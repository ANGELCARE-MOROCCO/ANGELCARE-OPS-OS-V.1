
import { ok, fail } from "@/lib/email-os/production/response"
import { createEmailOSTransporter } from "@/lib/email-os/production/smtp-service"
import { testEmailOSImapConnection } from "@/lib/email-os/production/imap-service"

export async function GET() {
  const result: Record<string, unknown> = {}

  try {
    const transporter = createEmailOSTransporter()
    await transporter.verify()
    result.smtp = { ok: true }
  } catch (error) {
    result.smtp = { ok: false, error: error instanceof Error ? error.message : "SMTP error" }
  }

  try {
    result.imap = await testEmailOSImapConnection()
  } catch (error) {
    result.imap = { ok: false, error: error instanceof Error ? error.message : "IMAP error" }
  }

  const healthy = Boolean((result.smtp as any)?.ok && (result.imap as any)?.ok)
  return healthy ? ok(result) : fail("Provider health check failed", 424, result)
}
