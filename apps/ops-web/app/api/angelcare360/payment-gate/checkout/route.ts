import { NextRequest } from 'next/server'
import { getActiveCustomerPaymentGate, createOnlineCheckoutSessionForGate } from '@/lib/angelcare360/payment-gates/customer-gate'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const gate = await getActiveCustomerPaymentGate()
  if (!gate) {
    await recordAngelcare360AuditEventServer({
      category: 'finance',
      module: 'payment-gate',
      action: 'checkout_attempt.no_gate',
      entityType: 'angelcare360_operator_payment_gates',
      severity: 'notice',
      metadata: { reason: 'Aucun gate actif' },
    })
    return Response.json({ ok: false, locked: true, error: 'Aucun blocage de paiement actif.' }, { status: 409 })
  }

  const payload = await request.json().catch(() => ({}))
  const result = await createOnlineCheckoutSessionForGate({
    gateCode: String((payload as Record<string, unknown>).gateCode || gate.gate_code),
    amountDueMad: Number((payload as Record<string, unknown>).amountDueMad || gate.amount_due_mad || 0),
    currency: String((payload as Record<string, unknown>).currency || gate.currency || 'MAD'),
    returnUrl: typeof (payload as Record<string, unknown>).returnUrl === 'string' ? String((payload as Record<string, unknown>).returnUrl) : null,
  })

  await recordAngelcare360AuditEventServer({
    category: 'finance',
    module: 'payment-gate',
    action: result.ok ? 'checkout_attempt.requested' : 'checkout_attempt.locked',
    entityType: 'angelcare360_operator_payment_gates',
    entityId: gate.id,
    severity: result.ok ? 'notice' : 'warning',
    afterData: {
      gate_code: gate.gate_code,
      provider_locked: !result.ok,
      locked: Boolean((result as Record<string, unknown>).locked),
    },
    metadata: {
      reason: (result as Record<string, unknown>).error || null,
      provider: (result as Record<string, unknown>).provider || null,
    },
  })

  if (!result.ok) {
    return Response.json(result, { status: 409 })
  }

  return Response.json(result, { status: 200 })
}
