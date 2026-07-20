import { actorFromSenderIdentityAuth, requireSenderIdentityAdmin, senderIdentityError, senderIdentityOk } from "@/app/api/opsos/windows-node/sender-identities/_shared"
import { activateSenderIdentity } from "@/lib/email-os-core/sender-identity"

export async function POST(request: Request, context: { params: Promise<{ identityId: string }> }) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const { identityId } = await context.params
    const body = await request.json().catch(() => ({}))
    const reason = String(body.reason || "").trim()
    if (!reason) return senderIdentityError(new Error("Activation reason is required."), 400)
    return senderIdentityOk(await activateSenderIdentity(identityId, actorFromSenderIdentityAuth(request, auth), reason))
  } catch (error) {
    return senderIdentityError(error, 400)
  }
}
