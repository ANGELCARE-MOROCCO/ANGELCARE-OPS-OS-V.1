
import { ok, fail, readJson } from "@/lib/email-os/production/response"
import { resolveEmailOSAuthContext } from "@/lib/email-os/runtime/auth-context"
import { assertMailboxAccess } from "@/lib/email-os/runtime/mailbox-guard"

export async function POST(request: Request) {
  try {
    const body = await readJson<any>(request)
    if (!body?.mailboxId || !body?.permission) {
      return fail("Missing mailboxId or permission", 400)
    }

    const context = await resolveEmailOSAuthContext(request)
    await assertMailboxAccess(context, body.mailboxId, body.permission)

    return ok({ allowed: true, context })
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Mailbox access failed", 403)
  }
}
