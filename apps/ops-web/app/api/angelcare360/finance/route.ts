import { NextRequest, NextResponse } from 'next/server'
import {
  allocateAngelcare360PaymentToInvoice,
  blockAngelcare360FinanceExport as blockFinanceExport,
  applyAngelcare360Discount,
  cancelAngelcare360Invoice,
  cancelAngelcare360Payment,
  cancelAngelcare360Receipt,
  createAngelcare360Discount,
  createAngelcare360Expense,
  createAngelcare360FeeStructure,
  createAngelcare360FeeItem,
  createAngelcare360Invoice,
  createAngelcare360InvoiceLine,
  createAngelcare360PaymentReminder,
  createAngelcare360ReceiptFromPayment,
  createAngelcare360StudentFeeAssignment,
  decideAngelcare360Discount,
  getAngelcare360FinanceOverview,
  issueAngelcare360Invoice,
  markAngelcare360ReminderBlocked,
  recordAngelcare360Payment,
  rejectAngelcare360Payment,
  recalculateAngelcare360InvoiceTotals,
  updateAngelcare360Expense,
  updateAngelcare360FeeItem,
  updateAngelcare360FeeStructure,
  updateAngelcare360Invoice,
  updateAngelcare360InvoiceLine,
  updateAngelcare360StudentFeeAssignmentStatus,
  confirmAngelcare360Payment,
} from '@/lib/angelcare360/server/finance'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type FinanceMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: FinanceMutationBody): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const overview = await getAngelcare360FinanceOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as FinanceMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête finance est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'fee-structure') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360FeeStructure(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360FeeStructure(payload), { status: 200 })
    }

    if (body.entity === 'fee-item') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360FeeItem(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360FeeItem(payload), { status: 200 })
    }

    if (body.entity === 'student-fee-assignment') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360StudentFeeAssignment(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await updateAngelcare360StudentFeeAssignmentStatus({
        schoolId: String(payload.schoolId || ''),
        id: String(payload.id || ''),
        status: String(payload.status || 'active') as 'active' | 'inactive' | 'archived',
      }), { status: 200 })
    }

    if (body.entity === 'invoice') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Invoice(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Invoice(payload), { status: 200 })
      if (body.operation === 'issue') return NextResponse.json(await issueAngelcare360Invoice(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360Invoice(payload), { status: 200 })
      if (body.operation === 'recalculate') return NextResponse.json(await recalculateAngelcare360InvoiceTotals({ schoolId: String(payload.schoolId || ''), invoiceId: String(payload.id || '') }), { status: 200 })
    }

    if (body.entity === 'invoice-line') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360InvoiceLine(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360InvoiceLine(payload), { status: 200 })
    }

    if (body.entity === 'payment') {
      if (body.operation === 'record') return NextResponse.json(await recordAngelcare360Payment(payload), { status: 200 })
      if (body.operation === 'confirm') return NextResponse.json(await confirmAngelcare360Payment(payload), { status: 200 })
      if (body.operation === 'reject') return NextResponse.json(await rejectAngelcare360Payment(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360Payment(payload), { status: 200 })
      if (body.operation === 'allocate') {
        return NextResponse.json(
          await allocateAngelcare360PaymentToInvoice({
            schoolId: String(payload.schoolId || ''),
            paymentId: String(payload.paymentId || payload.id || ''),
            invoiceId: String(payload.invoiceId || ''),
            amount: typeof payload.amount === 'number' ? payload.amount : undefined,
          }),
          { status: 200 },
        )
      }
    }

    if (body.entity === 'receipt') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360ReceiptFromPayment(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360Receipt(payload), { status: 200 })
    }

    if (body.entity === 'discount') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Discount(payload), { status: 200 })
      if (body.operation === 'decision') return NextResponse.json(await decideAngelcare360Discount(payload), { status: 200 })
      if (body.operation === 'apply') return NextResponse.json(await applyAngelcare360Discount(payload), { status: 200 })
    }

    if (body.entity === 'reminder') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360PaymentReminder(payload), { status: 200 })
      if (body.operation === 'blocked') return NextResponse.json(await markAngelcare360ReminderBlocked(payload), { status: 200 })
    }

    if (body.entity === 'expense') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Expense(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Expense(payload), { status: 200 })
    }

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(await blockFinanceExport({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
        entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
      }), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité finance inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
