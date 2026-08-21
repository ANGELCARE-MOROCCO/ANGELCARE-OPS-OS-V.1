import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from "next/server"

import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { getEmailOSBridgeFailureDiagnostics, sendEmailOSDirect } from "@/lib/email-os-core/send-mail"
import { emailOSOperatorSnapshot, resolveEmailOSOperatorIdentity } from "@/lib/email-os-core/operator-identity"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import {
  canSendHrEmployeeEmail,
  resolveCanonicalRhEmailOSMailbox,
  resolveHrEmployeeRecipient,
  safeEmailErrorMessage,
  type HrEmployeeEmailJobStatus,
  type HrEmployeeEmailStage,
} from "@/lib/hr-production/email-os-employee-communication"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OPERATION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function requestContext(request: Request) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    userAgent: request.headers.get("user-agent") || null,
  }
}

async function POST__angelcareGovernedImpl(request: Request) {
  const db = createEmailOSCoreDb()
  const body = await request.json().catch(() => ({}))
  const user = await getCurrentAppUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: "Session expirée ou non authentifiée." }, { status: 401 })
  }

  if (!canSendHrEmployeeEmail(user)) {
    return NextResponse.json({ ok: false, error: "Vous ne disposez pas de l’accès au module RH." }, { status: 403 })
  }

  const requestedOperationId = clean(body.operationId || body.operation_id)
  const operationId = OPERATION_ID_RE.test(requestedOperationId) ? requestedOperationId : makeEmailOSId()
  const subject = clean(body.subject)
  const message = clean(body.message || body.body || body.bodyText)
  const employeeId = clean(body.employeeId || body.employee_id)
  const requestedEmail = clean(body.employeeEmail || body.employee_email || body.toEmail)
  const categoryKey = clean(body.categoryKey || body.category_key)
  const templateId = clean(body.templateId || body.template_id)
  const templateTitle = clean(body.templateTitle || body.template_title)
  const context = requestContext(request)

  if (!subject) {
    return NextResponse.json({ ok: false, operationId, error: "L’objet de l’email est obligatoire." }, { status: 400 })
  }
  if (!message) {
    return NextResponse.json({ ok: false, operationId, error: "Le message email est vide." }, { status: 400 })
  }
  if (!employeeId && !requestedEmail) {
    return NextResponse.json({ ok: false, operationId, error: "Le collaborateur destinataire est obligatoire." }, { status: 400 })
  }

  let outboxId = ""
  let jobCreated = false

  const updateJob = async (input: {
    stage: HrEmployeeEmailStage
    progress: number
    status?: HrEmployeeEmailJobStatus
    mailboxId?: string | null
    fromEmail?: string | null
    employeeId?: string | null
    employeeEmail?: string | null
    outboxId?: string | null
    providerMessageId?: string | null
    errorCode?: string | null
    errorMessage?: string | null
    diagnostics?: Record<string, unknown>
    completed?: boolean
  }) => {
    const now = nowIso()
    const { error } = await db
      .from("hr_employee_email_send_jobs")
      .update({
        stage: input.stage,
        progress: Math.max(0, Math.min(100, Math.round(input.progress))),
        status: input.status || "running",
        mailbox_id: input.mailboxId ?? undefined,
        from_email: input.fromEmail ?? undefined,
        employee_id: input.employeeId ?? undefined,
        employee_email: input.employeeEmail ?? undefined,
        outbox_id: input.outboxId ?? undefined,
        provider_message_id: input.providerMessageId ?? undefined,
        error_code: input.errorCode ?? undefined,
        error_message: input.errorMessage ?? undefined,
        diagnostics: input.diagnostics || {},
        updated_at: now,
        completed_at: input.completed ? now : null,
      })
      .eq("id", operationId)
      .eq("requested_by_user_id", String(user.id))

    if (error) throw new Error(`Impossible de mettre à jour la progression d’envoi: ${error.message}`)
  }

  try {
    const existing = await db
      .from("hr_employee_email_send_jobs")
      .select("id,requested_by_user_id,status,stage,progress,outbox_id,provider_message_id,error_message")
      .eq("id", operationId)
      .maybeSingle()

    if (existing.data) {
      if (clean(existing.data.requested_by_user_id) && clean(existing.data.requested_by_user_id) !== String(user.id)) {
        return NextResponse.json({ ok: false, error: "Identifiant d’opération déjà utilisé." }, { status: 409 })
      }
      return NextResponse.json({ ok: true, operationId, data: existing.data }, { status: 202 })
    }

    const createdAt = nowIso()
    const { error: jobInsertError } = await db.from("hr_employee_email_send_jobs").insert({
      id: operationId,
      requested_by_user_id: String(user.id),
      employee_id: employeeId || null,
      employee_email: requestedEmail || null,
      subject,
      stage: "preparing",
      status: "running",
      progress: 8,
      diagnostics: {
        source: "hr.employee.communication.command",
        route: "api.hr.employees.communications.send-email",
        categoryKey: categoryKey || null,
        templateId: templateId || null,
        templateTitle: templateTitle || null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      created_at: createdAt,
      updated_at: createdAt,
      completed_at: null,
    })

    if (jobInsertError) {
      throw new Error(`Le journal de progression email n’est pas disponible: ${jobInsertError.message}`)
    }
    jobCreated = true

    await updateJob({
      stage: "validating_employee",
      progress: 22,
      employeeId: employeeId || null,
      employeeEmail: requestedEmail || null,
      diagnostics: { categoryKey, templateId, templateTitle },
    })

    const employee = await resolveHrEmployeeRecipient({ employeeId, requestedEmail })

    await updateJob({
      stage: "resolving_rh_mailbox",
      progress: 38,
      employeeId: employee.id,
      employeeEmail: employee.email,
      diagnostics: { employeeName: employee.fullName, employeeSource: employee.sourceTable },
    })

    const mailbox = await resolveCanonicalRhEmailOSMailbox()
    const operatorIdentity = await resolveEmailOSOperatorIdentity(db, user.id, {
      id: String(user.id),
      name: clean(user.name || user.full_name) || undefined,
      email: clean(user.email) || undefined,
      role: clean(user.role) || undefined,
    })
    const operatorSnapshot = emailOSOperatorSnapshot(operatorIdentity)

    outboxId = makeEmailOSId()
    const outboxCreatedAt = nowIso()
    const outboxDiagnostics = {
      route: "hr/employees/communications/send-email",
      source: "hr_employee_communication_command",
      transport: process.env.EMAIL_OS_BRIDGE_URL ? "angelcare-windows-email-bridge" : "central-send-mail",
      stage: "recording_outbox",
      operationId,
      categoryKey: categoryKey || null,
      templateId: templateId || null,
      templateTitle: templateTitle || null,
      employee: {
        id: employee.id,
        name: employee.fullName,
        sourceTable: employee.sourceTable,
      },
      operator: operatorSnapshot,
    }

    const { error: outboxInsertError } = await db.from("email_os_core_outbox").insert({
      id: outboxId,
      mailbox_id: mailbox.mailboxId,
      from_email: mailbox.email,
      to_email: employee.email,
      cc_email: null,
      bcc_email: null,
      subject,
      body: message,
      status: "sending",
      priority: "normal",
      provider_message_id: null,
      queue_id: null,
      tracking_id: null,
      tracking_enabled: false,
      sent_by_user_id: operatorSnapshot.userId,
      sent_by_name: operatorSnapshot.name,
      sent_by_email: operatorSnapshot.email,
      sent_by_role: operatorSnapshot.role,
      sent_by_department: operatorSnapshot.department,
      sent_by_title: operatorSnapshot.title,
      first_opened_at: null,
      last_opened_at: null,
      open_count: 0,
      diagnostics: outboxDiagnostics,
      created_at: outboxCreatedAt,
      updated_at: outboxCreatedAt,
      sent_at: null,
      last_error: null,
    })

    if (outboxInsertError) {
      throw new Error(`Email OS n’a pas pu créer l’envoi RH: ${outboxInsertError.message}`)
    }

    await updateJob({
      stage: "recording_outbox",
      progress: 52,
      mailboxId: mailbox.mailboxId,
      fromEmail: mailbox.email,
      employeeId: employee.id,
      employeeEmail: employee.email,
      outboxId,
      diagnostics: { employeeName: employee.fullName, mailboxKey: mailbox.key },
    })

    await db
      .from("email_os_core_outbox")
      .update({
        diagnostics: { ...outboxDiagnostics, stage: "sending_to_bridge" },
        updated_at: nowIso(),
      })
      .eq("id", outboxId)

    await updateJob({
      stage: "sending_to_bridge",
      progress: 72,
      mailboxId: mailbox.mailboxId,
      fromEmail: mailbox.email,
      employeeId: employee.id,
      employeeEmail: employee.email,
      outboxId,
      diagnostics: { employeeName: employee.fullName, mailboxKey: mailbox.key },
    })

    const { identity, info } = await sendEmailOSDirect({
      mailboxId: mailbox.mailboxId,
      fromEmail: mailbox.email,
      fromDisplayName: mailbox.label,
      toEmail: employee.email,
      subject,
      body: message,
      bodyText: message,
      headers: {
        "X-AngelCare-Source": "HR-Employee-Communication-Command",
        "X-AngelCare-HR-Operation-ID": operationId,
        "X-AngelCare-Employee-ID": employee.id,
        "X-AngelCare-Operator-ID": operatorIdentity.id,
        "X-AngelCare-Operator-Name": operatorIdentity.fullName,
        "X-AngelCare-Operator-Role": operatorIdentity.role,
      },
    })

    await updateJob({
      stage: "provider_accepted",
      progress: 92,
      mailboxId: identity.mailboxId,
      fromEmail: info.senderIdentity.fromAddress,
      employeeId: employee.id,
      employeeEmail: employee.email,
      outboxId,
      providerMessageId: info.messageId,
      diagnostics: {
        accepted: info.accepted,
        rejected: info.rejected,
        bridge: info.bridge,
        senderIdentity: info.senderIdentity,
      },
    })

    const sentAt = nowIso()
    const finalDiagnostics = {
      ...outboxDiagnostics,
      stage: "sent",
      resolvedMailboxKey: identity.key,
      resolvedMailboxId: identity.mailboxId,
      senderIdentity: info.senderIdentity,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      bridge: info.bridge,
      operationId,
    }

    const { error: sentUpdateError } = await db
      .from("email_os_core_outbox")
      .update({
        mailbox_id: identity.mailboxId,
        from_email: info.senderIdentity.fromAddress,
        sender_identity_id: info.senderIdentity.identityId,
        sender_identity_version: info.senderIdentity.version,
        resolved_from_name: info.senderIdentity.fromName,
        resolved_reply_to_name: info.senderIdentity.replyToName,
        resolved_reply_to_address: info.senderIdentity.replyToAddress,
        status: "sent",
        provider_message_id: info.messageId || null,
        sent_at: sentAt,
        updated_at: sentAt,
        last_error: null,
        diagnostics: finalDiagnostics,
      })
      .eq("id", outboxId)

    if (sentUpdateError) {
      throw new Error(`Le message a été accepté, mais Email OS n’a pas pu confirmer l’outbox: ${sentUpdateError.message}`)
    }

    await db.from("email_os_core_audit").insert({
      id: makeEmailOSId(),
      action: "hr_employee_email_sent",
      target_type: "email_outbox",
      target_id: outboxId,
      severity: "info",
      details: {
        operationId,
        employeeId: employee.id,
        employeeEmail: employee.email,
        employeeName: employee.fullName,
        mailboxId: identity.mailboxId,
        from: info.senderIdentity.fromAddress,
        fromName: info.senderIdentity.fromName,
        messageId: info.messageId || null,
        categoryKey: categoryKey || null,
        templateId: templateId || null,
        templateTitle: templateTitle || null,
        operator: operatorSnapshot,
      },
      created_at: sentAt,
    }).then(() => null, () => null)

    await updateJob({
      stage: "sent",
      progress: 100,
      status: "sent",
      mailboxId: identity.mailboxId,
      fromEmail: info.senderIdentity.fromAddress,
      employeeId: employee.id,
      employeeEmail: employee.email,
      outboxId,
      providerMessageId: info.messageId,
      diagnostics: {
        employeeName: employee.fullName,
        fromName: info.senderIdentity.fromName,
        accepted: info.accepted,
        rejected: info.rejected,
        bridge: info.bridge,
      },
      completed: true,
    })

    return NextResponse.json({
      ok: true,
      operationId,
      data: {
        stage: "sent",
        status: "sent",
        progress: 100,
        employeeId: employee.id,
        employeeName: employee.fullName,
        employeeEmail: employee.email,
        mailboxId: identity.mailboxId,
        fromEmail: info.senderIdentity.fromAddress,
        fromName: info.senderIdentity.fromName,
        outboxId,
        providerMessageId: info.messageId || null,
      },
    })
  } catch (error) {
    const bridgeDiagnostics = getEmailOSBridgeFailureDiagnostics(error)
    const errorMessage = safeEmailErrorMessage(error)
    const errorCode = bridgeDiagnostics ? "EMAIL_OS_BRIDGE_FAILURE" : "HR_EMAIL_SEND_FAILURE"

    if (outboxId) {
      await db
        .from("email_os_core_outbox")
        .update({
          status: "failed",
          updated_at: nowIso(),
          last_error: errorMessage,
          diagnostics: {
            route: "hr/employees/communications/send-email",
            source: "hr_employee_communication_command",
            stage: "failed",
            operationId,
            ...(bridgeDiagnostics || {}),
          },
        })
        .eq("id", outboxId)
        .then(() => null, () => null)
    }

    if (jobCreated) {
      await updateJob({
        stage: "failed",
        progress: 100,
        status: "failed",
        outboxId: outboxId || null,
        errorCode,
        errorMessage,
        diagnostics: bridgeDiagnostics || {},
        completed: true,
      }).catch(() => null)
    }

    return NextResponse.json(
      {
        ok: false,
        operationId,
        error: errorMessage,
        errorCode,
        ...(bridgeDiagnostics || {}),
      },
      { status: bridgeDiagnostics ? 502 : 500 },
    )
  }
}

export const POST = governRoute(
  {
    workloadClass: 'provider',
    operation: 'POST:/api/hr/employees/communications/send-email',
  },
  POST__angelcareGovernedImpl,
)
