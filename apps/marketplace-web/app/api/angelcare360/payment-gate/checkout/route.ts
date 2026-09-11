import { NextRequest } from 'next/server'
import { getActiveCustomerPaymentGate, createOnlineCheckoutSessionForGate } from '@/lib/angelcare360/payment-gates/customer-gate'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'

export const runtime = 'nodejs'

function safeReturnUrl(request: NextRequest, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const target = new URL(value, request.nextUrl.origin)
    return target.origin === request.nextUrl.origin ? target.toString() : null
  } catch { return null }
}

export async function POST(request: NextRequest) {
  const gate = await getActiveCustomerPaymentGate()
  if (!gate) {
    await recordAngelcare360AuditEventServer({ category: 'finance', module: 'payment-gate', action: 'checkout_attempt.no_gate', entityType: 'angelcare360_operator_payment_gates', severity: 'notice', metadata: { reason: 'Aucun gate actif' } })
    return Response.json({ ok: false, locked: true, error: 'Aucun blocage de paiement actif.' }, { status: 409 })
  }

  const payload = await request.json().catch(() => ({})) as Record<string, unknown>
  const result = await createOnlineCheckoutSessionForGate({
    gateCode: String(gate.gate_code),
    amountDueMad: Number(gate.amount_due_mad || 0),
    currency: String(gate.currency || 'MAD'),
    returnUrl: safeReturnUrl(request, payload.returnUrl),
  })

  await recordAngelcare360AuditEventServer({
    category: 'finance', module: 'payment-gate', action: result.ok ? 'checkout_attempt.requested' : 'checkout_attempt.locked', entityType: 'angelcare360_operator_payment_gates', entityId: gate.id, severity: result.ok ? 'notice' : 'warning',
    afterData: { gate_code: gate.gate_code, amount_due_mad: gate.amount_due_mad, currency: gate.currency, provider_locked: !result.ok, locked: Boolean((result as Record<string, unknown>).locked) },
    metadata: { reason: (result as Record<string, unknown>).error || null, provider: (result as Record<string, unknown>).provider || null },
  })
  return Response.json(result, { status: result.ok ? 200 : 409 })
}
