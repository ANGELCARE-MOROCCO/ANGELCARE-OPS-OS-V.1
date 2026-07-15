import { NextRequest } from 'next/server'
import { completeOperatorDunningAction, confirmOperatorPayment, createOperatorBillingAccount, createOperatorDunningAction, createOperatorInvoice, cancelOperatorInvoice, rejectOperatorPayment, issueOperatorInvoice, listOperatorBillingAccounts, listOperatorDunningActions, listOperatorInvoices, listOperatorPayments, recordOperatorPayment, updateOperatorBillingAccount } from '@/lib/angelcare360/operator/billing'
import { getOperatorClientBalanceSummary } from '@/lib/angelcare360/operator/billing'
import { sendOperatorInvoiceEmail, sendOperatorManualReminderEmail, sendOperatorReceiptEmail } from '@/lib/angelcare360/operator/email'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'overview'
    if (mode === 'accounts') return operatorJson({ ok: true, accounts: await listOperatorBillingAccounts() })
    if (mode === 'invoices') return operatorJson({ ok: true, invoices: await listOperatorInvoices() })
    if (mode === 'payments') return operatorJson({ ok: true, payments: await listOperatorPayments() })
    if (mode === 'dunning') return operatorJson({ ok: true, dunning: await listOperatorDunningActions() })
    if (mode === 'balance') {
      const clientId = request.nextUrl.searchParams.get('clientId')
      return operatorJson({ ok: true, balance: await getOperatorClientBalanceSummary(clientId) })
    }
    if (mode === 'payment-gates') {
      const { listOperatorPaymentGates, getAngelcare360OperatorPaymentGateOverview } = await import('@/lib/angelcare360/operator/payment-gates')
      return operatorJson({ ok: true, overview: await getAngelcare360OperatorPaymentGateOverview(), paymentGates: await listOperatorPaymentGates() })
    }
    const invoices = await listOperatorInvoices()
    const payments = await listOperatorPayments()
    const dunning = await listOperatorDunningActions()
    return operatorJson({ ok: true, overview: { invoices, payments, dunning } })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ entity?: string; operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.entity || !body.operation) return operatorJson({ ok: false, error: 'La requête facturation est incomplète.' }, 422)
    if (body.entity === 'account') {
      if (body.operation === 'create') return operatorJson(await createOperatorBillingAccount(body.payload || {}))
      if (body.operation === 'update') return operatorJson(await updateOperatorBillingAccount(body.payload || {}))
    }
    if (body.entity === 'invoice') {
      if (body.operation === 'create') return operatorJson(await createOperatorInvoice(body.payload || {}))
      if (body.operation === 'issue') return operatorJson(await issueOperatorInvoice(body.payload || {}))
      if (body.operation === 'cancel') return operatorJson(await cancelOperatorInvoice(body.payload || {}))
    }
    if (body.entity === 'payment') {
      if (body.operation === 'record') return operatorJson(await recordOperatorPayment(body.payload || {}))
      if (body.operation === 'confirm') return operatorJson(await confirmOperatorPayment(body.payload || {}))
      if (body.operation === 'reject') return operatorJson(await rejectOperatorPayment(body.payload || {}))
    }
    if (body.entity === 'dunning') {
      if (body.operation === 'create') return operatorJson(await createOperatorDunningAction(body.payload || {}))
      if (body.operation === 'complete') return operatorJson(await completeOperatorDunningAction(body.payload || {}))
    }
    if (body.entity === 'email') {
      if (body.operation === 'invoice') return operatorJson(await sendOperatorInvoiceEmail(body.payload || {}))
      if (body.operation === 'receipt') return operatorJson(await sendOperatorReceiptEmail(body.payload || {}))
      if (body.operation === 'reminder') return operatorJson(await sendOperatorManualReminderEmail(body.payload || {}))
    }
    return operatorJson({ ok: false, error: 'Opération facturation inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
