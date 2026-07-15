import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { getAngelcare360PaymentProviderStatus, createAngelcare360CheckoutSession } from '@/lib/angelcare360/payments/provider'
import { createClient } from '@/lib/supabase/server'
import type { Angelcare360PaymentGateRecord } from '@/types/angelcare360/payment-gates'

export async function getActiveCustomerPaymentGate(options?: { schoolId?: string | null }) {
  const context = await getAngelcare360AccessContext(options)
  if (!context?.school) return null
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('angelcare360_operator_tenants')
    .select('id, client_id, school_id, tenant_slug, environment, status')
    .eq('school_id', context.school.id)
    .maybeSingle()

  if (!tenant) return null
  const [gateResult, clientResult, invoiceResult, subscriptionResult] = await Promise.all([
    supabase
    .from('angelcare360_operator_payment_gates')
    .select('*')
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'online_processing', 'manual_pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(),
    supabase.from('angelcare360_operator_clients').select('id, client_code, display_name, legal_name').eq('id', tenant.client_id).maybeSingle(),
    supabase.from('angelcare360_operator_invoices').select('id, invoice_number').eq('client_id', tenant.client_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('angelcare360_operator_subscriptions').select('id, subscription_code').eq('client_id', tenant.client_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!gateResult.data) return null
  const gate = gateResult.data as Angelcare360PaymentGateRecord
  const client = clientResult.data as Record<string, unknown> | null
  const invoice = invoiceResult.data as Record<string, unknown> | null
  const subscription = subscriptionResult.data as Record<string, unknown> | null
  return {
    ...gate,
    client_display_name: client ? String(client.display_name || client.legal_name || client.client_code || gate.client_id) : gate.client_id,
    school_name: client ? String(client.display_name || client.legal_name || client.client_code || gate.client_id) : null,
    tenant_slug: tenant.tenant_slug,
    invoice_number: invoice ? String(invoice.invoice_number || invoice.id) : null,
    subscription_code: subscription ? String(subscription.subscription_code || subscription.id) : null,
  }
}

export async function acknowledgePaymentInstructions() {
  return { ok: true, locked: true, reason: 'Paiement en cours de validation par AngelCare.' }
}

export async function createOnlineCheckoutSessionForGate(input: {
  gateCode: string
  amountDueMad: number
  currency?: string | null
  returnUrl?: string | null
}) {
  const provider = getAngelcare360PaymentProviderStatus()
  if (!provider.configured) {
    return {
      ok: false as const,
      locked: true as const,
      error: provider.reason,
      provider,
    }
  }
  return createAngelcare360CheckoutSession(input)
}
