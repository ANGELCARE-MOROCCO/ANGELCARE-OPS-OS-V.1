import { actorFromSenderIdentityAuth, requireSenderIdentityAdmin, senderIdentityError, senderIdentityOk } from "@/app/api/opsos/windows-node/sender-identities/_shared"
import { getSenderIdentityDossier, saveSenderIdentityDraft } from "@/lib/email-os-core/sender-identity"

export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ identityId: string }> }) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const { identityId } = await context.params
    return senderIdentityOk(await getSenderIdentityDossier(identityId))
  } catch (error) {
    return senderIdentityError(error, 404)
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ identityId: string }> }) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const { identityId } = await context.params
    const body = await request.json().catch(() => ({}))
    const reason = String(body.reason || "").trim()
    if (!reason) return senderIdentityError(new Error("A reason is required to edit a sender identity."), 400)
    const actor = actorFromSenderIdentityAuth(request, auth)
    return senderIdentityOk(await saveSenderIdentityDraft({ ...body, id: identityId }, actor))
  } catch (error) {
    return senderIdentityError(error, 400)
  }
}
