import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from "next/server"

import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { canSendHrEmployeeEmail } from "@/lib/hr-production/email-os-employee-communication"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value ?? "").trim()
}

async function GET__angelcareGovernedImpl(request: Request) {
  const user = await getCurrentAppUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: "Session expirée ou non authentifiée." }, { status: 401 })
  }
  if (!canSendHrEmployeeEmail(user)) {
    return NextResponse.json({ ok: false, error: "Vous ne disposez pas de l’accès au module RH." }, { status: 403 })
  }

  const operationId = clean(new URL(request.url).searchParams.get("operationId"))
  if (!operationId) {
    return NextResponse.json({ ok: false, error: "Identifiant d’opération manquant." }, { status: 400 })
  }

  const db = createEmailOSCoreDb()
  const { data, error } = await db
    .from("hr_employee_email_send_jobs")
    .select(
      "id,employee_id,employee_email,subject,stage,status,progress,mailbox_id,from_email,outbox_id,provider_message_id,error_code,error_message,diagnostics,created_at,updated_at,completed_at",
    )
    .eq("id", operationId)
    .eq("requested_by_user_id", String(user.id))
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: true,
        operationId,
        data: {
          stage: "preparing",
          status: "running",
          progress: 5,
          pendingPersistence: true,
        },
      },
      { status: 202 },
    )
  }

  return NextResponse.json({ ok: true, operationId, data })
}

export const GET = governRoute(
  {
    workloadClass: 'provider',
    operation: 'GET:/api/hr/employees/communications/send-email/status',
  },
  GET__angelcareGovernedImpl,
)
