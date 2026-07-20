import { actorFromSenderIdentityAuth, requireSenderIdentityAdmin, senderIdentityError, senderIdentityOk } from "@/app/api/opsos/windows-node/sender-identities/_shared"
import { getSenderIdentityDossier, markSenderIdentityTestResult } from "@/lib/email-os-core/sender-identity"
import { sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value ?? "").trim()
}

export async function POST(request: Request, context: { params: Promise<{ identityId: string }> }) {
  const auth = await requireSenderIdentityAdmin(request)
  if (!auth.ok) return auth.response
  const { identityId } = await context.params
  const actor = actorFromSenderIdentityAuth(request, auth)
  const body = await request.json().catch(() => ({}))
  const recipient = clean(body.recipient || body.toEmail)
  const reason = clean(body.reason)
  if (!recipient || !reason) return senderIdentityError(new Error("Test recipient and reason are required."), 400)

  try {
    const dossier = await getSenderIdentityDossier(identityId)
    const identity = dossier.identity
    const subject = clean(body.subject) || `Test identité d’expéditeur — ${identity.external_display_name}`
    const content = clean(body.text) || [
      `Bonjour,`,
      ``,
      `Ceci est un test de l’identité d’expéditeur Email OS.`,
      `Nom commercial : ${identity.external_display_name}`,
      `Adresse : ${identity.from_address}`,
      `Reply-To : ${identity.reply_to_name || "—"} <${identity.reply_to_address || identity.from_address}>`,
      `Version : ${identity.version}`,
      ``,
      `Motif du test : ${reason}`,
      ``,
      `ANGELCARE Email OS`,
    ].join("\n")

    const { info } = await sendEmailOSDirect({
      mailboxId: identity.mailbox_id,
      fromEmail: identity.from_address,
      toEmail: recipient,
      subject,
      body: content,
      bodyText: content,
      bodyHtml: content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />"),
      senderIdentityOverride: {
        identityId: identity.id,
        version: identity.version,
        externalDisplayName: identity.external_display_name,
        fromAddress: identity.from_address,
        replyToName: identity.reply_to_name,
        replyToAddress: identity.reply_to_address || identity.from_address,
        identityMode: identity.identity_mode,
      },
      headers: {
        "X-AngelCare-Operator-Name": actor.name,
        "X-AngelCare-Sender-Identity-Proof": "true",
      },
    })

    const updated = await markSenderIdentityTestResult(identityId, actor, { success: true, recipient, messageId: info.messageId, reason })
    return senderIdentityOk({ identity: updated, proof: { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, bridge: info.bridge, senderIdentity: info.senderIdentity } })
  } catch (error) {
    await markSenderIdentityTestResult(identityId, actor, { success: false, recipient, error: error instanceof Error ? error.message : String(error), reason }).catch(() => null)
    return senderIdentityError(error, 502)
  }
}
