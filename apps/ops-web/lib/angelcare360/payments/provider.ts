import type { Angelcare360PaymentProviderStatus } from '@/types/angelcare360/payment-gates'

const DEFAULT_LOCK = 'Passerelle de paiement en ligne non configurée.'

export function getAngelcare360PaymentProviderStatus(): Angelcare360PaymentProviderStatus {
  const providerKey = String(process.env.ANGELCARE360_PAYMENT_PROVIDER_KEY || process.env.PAYMENT_PROVIDER_KEY || '').trim() || null
  const enabled = String(process.env.ANGELCARE360_PAYMENT_PROVIDER_ENABLED || '').trim().toLowerCase()
  const configured = Boolean(providerKey && ['true', '1', 'yes', 'enabled'].includes(enabled)) || Boolean(providerKey && enabled === '')

  return {
    configured,
    providerKey,
    locked: !configured,
    reason: configured ? 'Passerelle de paiement en ligne active.' : DEFAULT_LOCK,
  }
}

export async function createAngelcare360CheckoutSession(input: {
  gateCode: string
  amountDueMad: number
  currency?: string | null
  returnUrl?: string | null
}) {
  const status = getAngelcare360PaymentProviderStatus()
  if (!status.configured || !status.providerKey) {
    return {
      ok: false as const,
      locked: true as const,
      error: DEFAULT_LOCK,
      status,
    }
  }

  return {
    ok: false as const,
    locked: true as const,
    error: 'Le fournisseur de paiement réel n’est pas branché dans cette couche.',
    status,
    input,
  }
}

