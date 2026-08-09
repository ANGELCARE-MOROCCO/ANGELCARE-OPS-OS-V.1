import { createHmac, timingSafeEqual } from 'node:crypto'
import { MarketplaceError } from '../server/errors'
import {
  createPayPalOrder,
  paypalConfigured,
  refundPayPalCapture,
  verifyPayPalWebhook,
} from './paypal'
import type { PaymentMethodKind, PaymentProviderRequest, PaymentProviderResult } from './types'

export type VerifiedPaymentWebhook = {
  eventId: string
  eventType: string
  providerReference: string | null
  paymentIntentIdHint?: string | null
  captureReference?: string | null
  refundReference?: string | null
  providerAmount?: string | null
  currency?: string | null
  payload: Record<string, unknown>
}

export interface PaymentProviderAdapter {
  key: string
  methods: PaymentMethodKind[]
  configured(): boolean
  create(input: PaymentProviderRequest): Promise<PaymentProviderResult>
  refund?(input: {
    providerReference: string
    amount: number
    idempotencyKey: string
    providerAmount?: string | null
    currency?: string | null
    note?: string | null
  }): Promise<PaymentProviderResult>
  verifyWebhook?(request: Request): Promise<VerifiedPaymentWebhook>
}

const pendingAdapter = (key: string, methods: PaymentMethodKind[], message: string): PaymentProviderAdapter => ({
  key,
  methods,
  configured: () => true,
  async create(input) {
    return {
      status: 'pending',
      providerKey: key,
      providerReference: `${key}:${input.intent.public_reference}`,
      customerActionUrl: null,
      customerMessage: message,
      evidence: { method: input.method, createdAt: new Date().toISOString() },
    }
  },
})

const bankTransfer = pendingAdapter('bank_transfer', ['bank_transfer'], 'Les coordonnées et la référence de virement sont disponibles. La commande reste en attente de validation Finance.')
const invoice = pendingAdapter('invoice', ['invoice'], 'L’obligation de paiement sur facture a été créée selon les conditions du compte organisationnel.')
const payAtLocation = pendingAdapter('pay_at_location', ['pay_at_location', 'cash_on_delivery'], 'Le paiement sera contrôlé au point de service ou à la livraison selon la politique applicable.')
const manualVerified = pendingAdapter('manual_verified', ['manual_verified'], 'Le paiement attend une vérification Finance accompagnée d’une preuve.')

const paypalAdapter: PaymentProviderAdapter = {
  key: 'paypal',
  methods: ['card', 'deposit', 'installment'],
  configured: () => paypalConfigured(),
  async create(input) {
    if (!this.configured()) {
      throw new MarketplaceError('CONFIGURATION_ERROR', 'PayPal n’est pas complètement configuré : identifiants, webhook et taux Dh/EUR sont requis.')
    }
    const externalDh = input.intent.external_contribution > 0
      ? input.intent.external_contribution
      : input.intent.due_now_amount
    const order = await createPayPalOrder({
      paymentIntentId: input.intent.id,
      paymentReference: input.intent.public_reference,
      idempotencyKey: input.intent.idempotency_key,
      amountDh: externalDh,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      customerEmail: input.customer?.email || null,
    })
    return {
      status: 'requires_customer_action',
      providerKey: 'paypal',
      providerReference: order.orderId,
      customerActionUrl: order.approvalUrl,
      customerMessage: 'Redirection sécurisée vers PayPal pour approbation. La commande ANGELCARE ne sera capturée qu’après validation serveur.',
      evidence: {
        paypal: {
          environment: String(process.env.PAYPAL_ENV || 'live'),
          orderId: order.orderId,
          orderStatus: order.status,
          currency: order.currency,
          providerAmount: order.providerAmount,
          canonicalDhAmount: order.canonicalDhAmount,
          dhPerUnit: order.dhPerUnit,
          createdAt: new Date().toISOString(),
        },
      },
    }
  },
  async refund(input) {
    if (!this.configured()) throw new MarketplaceError('CONFIGURATION_ERROR', 'PayPal n’est pas configuré.')
    if (!input.providerAmount || !input.currency) {
      throw new MarketplaceError('CONFIGURATION_ERROR', 'Le remboursement PayPal exige le montant prestataire et la devise verrouillés lors de la capture.')
    }
    const refund = await refundPayPalCapture({
      captureId: input.providerReference,
      providerAmount: input.providerAmount,
      currency: input.currency,
      idempotencyKey: input.idempotencyKey,
      note: input.note || undefined,
    })
    const completed = refund.status.toUpperCase() === 'COMPLETED'
    return {
      status: completed ? 'refunded' : 'reconciliation_pending',
      providerKey: 'paypal',
      providerReference: refund.refundId,
      customerActionUrl: null,
      customerMessage: completed
        ? 'Remboursement PayPal confirmé.'
        : 'Remboursement PayPal accepté et en attente de confirmation finale.',
      evidence: {
        paypal: {
          refundId: refund.refundId,
          refundStatus: refund.status,
          providerAmount: refund.providerAmount,
          currency: refund.currency,
          requestedDhAmount: input.amount,
          createdAt: new Date().toISOString(),
        },
      },
    }
  },
  async verifyWebhook(request) {
    const verified = await verifyPayPalWebhook(request)
    return {
      eventId: verified.eventId,
      eventType: verified.eventType,
      providerReference: verified.orderId,
      paymentIntentIdHint: verified.paymentIntentIdHint,
      captureReference: verified.captureId,
      refundReference: verified.refundId,
      providerAmount: verified.amount,
      currency: verified.currency,
      payload: verified.payload,
    }
  },
}

const genericCardAdapter: PaymentProviderAdapter = {
  key: 'configured_card_provider',
  methods: ['card', 'deposit', 'installment'],
  configured: () => {
    const provider = String(process.env.ANGELCARE_PAYMENT_PROVIDER || '').trim().toLowerCase()
    return Boolean(provider && provider !== 'paypal' && process.env.ANGELCARE_PAYMENT_PROVIDER_SECRET)
  },
  async create(input) {
    if (!this.configured()) throw new MarketplaceError('CONFIGURATION_ERROR', 'Le prestataire de carte n’est pas encore activé. Choisissez un autre moyen ou configurez l’adaptateur de paiement.')
    return {
      status: 'requires_customer_action',
      providerKey: String(process.env.ANGELCARE_PAYMENT_PROVIDER),
      providerReference: null,
      customerActionUrl: null,
      customerMessage: 'Le prestataire activé doit retourner une action client tokenisée.',
      evidence: { adapterBoundary: true, amount: input.intent.external_contribution || input.intent.due_now_amount },
    }
  },
  async refund(input) {
    if (!this.configured()) throw new MarketplaceError('CONFIGURATION_ERROR', 'Prestataire carte non configuré.')
    return {
      status: 'reconciliation_pending',
      providerKey: String(process.env.ANGELCARE_PAYMENT_PROVIDER),
      providerReference: input.providerReference,
      customerActionUrl: null,
      customerMessage: 'Remboursement transmis au prestataire configuré; confirmation webhook requise.',
      evidence: { amount: input.amount, idempotencyKey: input.idempotencyKey },
    }
  },
  async verifyWebhook(request) {
    const secret = process.env.ANGELCARE_PAYMENT_WEBHOOK_SECRET
    if (!secret) throw new MarketplaceError('CONFIGURATION_ERROR', 'Secret webhook absent.')
    const raw = await request.text()
    const signature = request.headers.get('x-angelcare-payment-signature') || ''
    const expected = createHmac('sha256', secret).update(raw).digest('hex')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new MarketplaceError('PERMISSION_DENIED', 'Signature webhook invalide.')
    const payload = JSON.parse(raw) as Record<string, unknown>
    return {
      eventId: String(payload.event_id || payload.id || ''),
      eventType: String(payload.event_type || payload.type || 'unknown'),
      providerReference: payload.provider_reference ? String(payload.provider_reference) : null,
      payload,
    }
  },
}

const nonCardAdapters: PaymentProviderAdapter[] = [bankTransfer, invoice, payAtLocation, manualVerified]

function cardAdapter(): PaymentProviderAdapter {
  return String(process.env.ANGELCARE_PAYMENT_PROVIDER || '').trim().toLowerCase() === 'paypal'
    ? paypalAdapter
    : genericCardAdapter
}

export function paymentAdapter(method: PaymentMethodKind): PaymentProviderAdapter {
  const card = cardAdapter()
  if (card.methods.includes(method)) return card
  const adapter = nonCardAdapters.find((candidate) => candidate.methods.includes(method))
  if (!adapter) throw new MarketplaceError('CONFIGURATION_ERROR', `Aucun adaptateur n’est disponible pour ${method}.`)
  return adapter
}

export function paymentProviderReadiness(): Array<{ key: string; methods: PaymentMethodKind[]; configured: boolean }> {
  const card = cardAdapter()
  return [card, ...nonCardAdapters].map((adapter) => ({
    key: adapter.key,
    methods: adapter.methods,
    configured: adapter.configured(),
  }))
}
