import { actorFromSenderIdentityAuth, requireSenderIdentityAdmin, senderIdentityError, senderIdentityOk } from "@/app/api/opsos/windows-node/sender-identities/_shared"
import { listSenderIdentityRegistry, saveSenderIdentityDraft } from "@/lib/email-os-core/sender-identity"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    return senderIdentityOk(await listSenderIdentityRegistry())
  } catch (error) {
    return senderIdentityError(error)
  }
}

export async function POST(request: Request) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const body = await request.json().catch(() => ({}))
    const reason = String(body.reason || "").trim()
    if (!reason) return senderIdentityError(new Error("A reason is required to create a sender identity draft."), 400)
    const actor = actorFromSenderIdentityAuth(request, auth)
    const identity = await saveSenderIdentityDraft(body, actor)
    return senderIdentityOk(identity, 201)
  } catch (error) {
    return senderIdentityError(error, 400)
  }
}
