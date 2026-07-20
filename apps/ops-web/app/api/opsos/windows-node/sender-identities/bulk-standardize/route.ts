import { actorFromSenderIdentityAuth, requireSenderIdentityAdmin, senderIdentityError, senderIdentityOk } from "@/app/api/opsos/windows-node/sender-identities/_shared"
import { bulkStandardizeSenderIdentities } from "@/lib/email-os-core/sender-identity"

export async function POST(request: Request) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const body = await request.json().catch(() => ({}))
    const apply = body.apply === true
    const reason = String(body.reason || "").trim()
    if (apply && !reason) return senderIdentityError(new Error("A reason is required before applying bulk standardization."), 400)
    return senderIdentityOk(await bulkStandardizeSenderIdentities(actorFromSenderIdentityAuth(request, auth), apply, reason || "Preview ANGELCARE sender identity standard"))
  } catch (error) {
    return senderIdentityError(error, 400)
  }
}
