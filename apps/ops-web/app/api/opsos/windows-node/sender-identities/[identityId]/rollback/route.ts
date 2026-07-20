import { actorFromSenderIdentityAuth, requireSenderIdentityAdmin, senderIdentityError, senderIdentityOk } from "@/app/api/opsos/windows-node/sender-identities/_shared"
import { rollbackSenderIdentity } from "@/lib/email-os-core/sender-identity"

export async function POST(request: Request, context: { params: Promise<{ identityId: string }> }) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const { identityId } = await context.params
    const body = await request.json().catch(() => ({}))
    const reason = String(body.reason || "").trim()
    const version = Number(body.version || body.targetVersion)
    if (!reason || !Number.isFinite(version) || version <= 0) return senderIdentityError(new Error("Target version and rollback reason are required."), 400)
    return senderIdentityOk(await rollbackSenderIdentity(identityId, version, actorFromSenderIdentityAuth(request, auth), reason))
  } catch (error) {
    return senderIdentityError(error, 400)
  }
}
