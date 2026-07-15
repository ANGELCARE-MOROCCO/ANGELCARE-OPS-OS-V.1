import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { listEmailOSMultiMailboxes } from '@/lib/email-os-core/multi-mailbox-resolver'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { isUuid } from '@/lib/pacojaco-ops/validation'
import { generatePacojacoDocumentPdfBytes, getPacojacoDocumentPdfFilename } from '@/lib/pacojaco-ops/pdf'
import { loadPacojacoDocumentRelations } from '@/lib/pacojaco-ops/server'
import { recordPacojacoDispatch } from '@/lib/pacojaco-ops/dispatch'
import { pacojacoDocumentDocumentLabel } from '@/lib/pacojaco-ops/presentation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

async function resolveId(context: Ctx) {
  const params = await context.params
  return String(params?.id || '').trim()
}

function buildEmailBody(params: {
  clientName: string
  documentTypeLabel: string
  documentNumber: string
  totalTtc: string
  remainingAmount: string
  currency: string
}) {
  return [
    `Dear ${params.clientName},`,
    '',
    `Please find attached your ${params.documentTypeLabel.toLowerCase()} ${params.documentNumber} from Angel Care.`,
    '',
    'Document summary:',
    `Total amount: ${params.totalTtc} ${params.currency}`,
    `Remaining amount: ${params.remainingAmount} ${params.currency}`,
    '',
    'If you have any questions, please feel free to contact us.',
    '',
    'Kind regards,',
    'Angel Care Operations',
  ].join('\n')
}

function buildEmailHtml(body: string) {
  return body
    .split('\n')
    .map((line) => (line ? `<p style="margin:0 0 12px;line-height:1.6">${line.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch] || ch))}</p>` : '<div style="height:12px"></div>'))
    .join('')
}

function resolveSmtpIdentity() {
  const mailboxes = listEmailOSMultiMailboxes()
  const preferredKeys = ['OPS', 'COMMERCIAL', 'SUPPORTS', 'IT_SUPPORT']
  for (const key of preferredKeys) {
    const preferred = mailboxes.find((box) => box.key === key && Boolean(box.smtp?.host && box.smtp?.port && box.smtp?.user && box.smtp?.pass))
    if (preferred) return preferred
  }
  return mailboxes.find((box) => Boolean(box.smtp?.host && box.smtp?.port && box.smtp?.user && box.smtp?.pass)) || null
}

export async function POST(_request: Request, context: Ctx) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  let document: Awaited<ReturnType<typeof loadPacojacoDocumentRelations>> | null = null
  let recipient = ''
  let actorEmail: string | null = null
  let createdBy: string | null = null
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)
    actorEmail = user?.email || user?.username || null
    createdBy = user?.id || null

    supabase = await createClient()
    document = await loadPacojacoDocumentRelations(supabase, id)
    if (!document) return jsonError('Document not found.', 404)

    recipient = String(document.client_email || '').trim()
    if (!recipient) {
      await recordPacojacoDispatch(supabase, {
        documentId: id,
        channel: 'email',
        recipient: null,
        status: 'failed',
        error: 'Client email is missing.',
        payload: {
          document_number: document.document_number,
          document_type: document.document_type,
        },
        createdBy,
        actorEmail,
      })
      return jsonError('Client email is missing.', 400)
    }

    const identity = resolveSmtpIdentity()
    if (!identity) {
      await recordPacojacoDispatch(supabase, {
        documentId: id,
        channel: 'email',
        recipient,
        status: 'failed',
        error: 'Email sending is not configured yet.',
        payload: {
          document_number: document.document_number,
          document_type: document.document_type,
        },
        createdBy,
        actorEmail,
      })
      return jsonError('Email sending is not configured yet. PDF generated endpoint is available.', 501)
    }

    const pdf = await generatePacojacoDocumentPdfBytes(document)
    const filename = getPacojacoDocumentPdfFilename(document.document_number)
    const documentTypeLabel = pacojacoDocumentDocumentLabel(document.document_type)
    const subject = `${documentTypeLabel} ${document.document_number} - Angel Care`
    const body = buildEmailBody({
      clientName: document.client_name || 'Client',
      documentTypeLabel,
      documentNumber: document.document_number,
      totalTtc: Number(document.total_ttc || 0).toFixed(2),
      remainingAmount: Number(document.remaining_amount || 0).toFixed(2),
      currency: document.currency || 'MAD',
    })

    const transporter = nodemailer.createTransport({
      host: identity.smtp.host,
      port: identity.smtp.port,
      secure: identity.smtp.secure,
      auth: {
        user: identity.smtp.user,
        pass: identity.smtp.pass,
      },
      pool: false,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 45000,
    } as any)

    try {
      await transporter.sendMail({
        from: identity.smtp.from || identity.smtp.user,
        to: recipient,
        subject,
        text: body,
        html: buildEmailHtml(body),
        attachments: [
          {
            filename,
            content: Buffer.from(pdf),
            contentType: 'application/pdf',
          },
        ],
        headers: {
          'X-AngelCare-Module': 'PACOJACO-OPS',
          'X-AngelCare-Document-Id': document.id,
          'X-AngelCare-Document-Number': document.document_number,
        },
      })
    } finally {
      transporter.close()
    }

    const dispatch = await recordPacojacoDispatch(supabase, {
      documentId: id,
      channel: 'email',
      recipient,
      status: 'sent',
      message: subject,
      payload: {
        document_number: document.document_number,
        document_type: document.document_type,
        attachment: filename,
        smtp_mailbox: identity.key,
      },
      createdBy,
      actorEmail,
    })

    return NextResponse.json({
      ok: true,
      message: 'Email sent successfully.',
      dispatch,
    })
  } catch (error) {
    if (supabase && document) {
      await recordPacojacoDispatch(supabase, {
        documentId: document.id,
        channel: 'email',
        recipient: recipient || document.client_email || null,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unable to send email.',
        payload: {
          document_number: document.document_number,
          document_type: document.document_type,
        },
        createdBy,
        actorEmail,
      }).catch(() => null)
    }

    return jsonError(error instanceof Error ? error.message : 'Unable to send email.', 500)
  }
}
