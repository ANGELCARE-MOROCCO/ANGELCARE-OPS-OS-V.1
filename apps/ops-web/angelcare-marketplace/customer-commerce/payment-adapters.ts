import { createHmac, timingSafeEqual } from 'node:crypto'
import { MarketplaceError } from '../server/errors'
import type { PaymentMethodKind, PaymentProviderRequest, PaymentProviderResult } from './types'

export interface PaymentProviderAdapter {
  key: string
  methods: PaymentMethodKind[]
  configured(): boolean
  create(input: PaymentProviderRequest): Promise<PaymentProviderResult>
  refund?(input: { providerReference: string; amount: number; idempotencyKey: string }): Promise<PaymentProviderResult>
  verifyWebhook?(request: Request): Promise<{ eventId: string; eventType: string; providerReference: string | null; payload: Record<string, unknown> }>
}

const pendingAdapter = (key: string, methods: PaymentMethodKind[], message: string): PaymentProviderAdapter => ({
  key, methods, configured: () => true,
  async create(input) {
    return { status: 'pending', providerKey: key, providerReference: `${key}:${input.intent.public_reference}`,
      customerActionUrl: null, customerMessage: message, evidence: { method: input.method, createdAt: new Date().toISOString() } }
  },
})

const bankTransfer = pendingAdapter('bank_transfer', ['bank_transfer'], 'Les coordonnées et la référence de virement sont disponibles. La commande reste en attente de validation Finance.')
const invoice = pendingAdapter('invoice', ['invoice'], 'L’obligation de paiement sur facture a été créée selon les conditions du compte organisationnel.')
const payAtLocation = pendingAdapter('pay_at_location', ['pay_at_location','cash_on_delivery'], 'Le paiement sera contrôlé au point de service ou à la livraison selon la politique applicable.')
const manualVerified = pendingAdapter('manual_verified', ['manual_verified'], 'Le paiement attend une vérification Finance accompagnée d’une preuve.')

const cardAdapter: PaymentProviderAdapter = {
  key: 'configured_card_provider', methods: ['card','deposit','installment'],
  configured: () => Boolean(process.env.ANGELCARE_PAYMENT_PROVIDER && process.env.ANGELCARE_PAYMENT_PROVIDER_SECRET),
  async create(input) {
    if (!this.configured()) throw new MarketplaceError('CONFIGURATION_ERROR', 'Le prestataire de carte n’est pas encore activé. Choisissez un autre moyen ou configurez l’adaptateur de paiement.')
    // Provider-specific code is intentionally isolated behind this adapter contract.
    return { status: 'requires_customer_action', providerKey: String(process.env.ANGELCARE_PAYMENT_PROVIDER),
      providerReference: null, customerActionUrl: null,
      customerMessage: 'Le prestataire activé doit retourner une action client tokenisée.', evidence: { adapterBoundary: true, amount: input.intent.due_now_amount } }
  },
  async refund(input){if(!this.configured())throw new MarketplaceError('CONFIGURATION_ERROR','Prestataire carte non configuré.');return{status:'reconciliation_pending',providerKey:String(process.env.ANGELCARE_PAYMENT_PROVIDER),providerReference:input.providerReference,customerActionUrl:null,customerMessage:'Remboursement transmis au prestataire configuré; confirmation webhook requise.',evidence:{amount:input.amount,idempotencyKey:input.idempotencyKey}}},
  async verifyWebhook(request){const secret=process.env.ANGELCARE_PAYMENT_WEBHOOK_SECRET;if(!secret)throw new MarketplaceError('CONFIGURATION_ERROR','Secret webhook absent.');const raw=await request.text();const signature=request.headers.get('x-angelcare-payment-signature')||'';const expected=createHmac('sha256',secret).update(raw).digest('hex');const a=Buffer.from(signature);const b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))throw new MarketplaceError('PERMISSION_DENIED','Signature webhook invalide.');const payload=JSON.parse(raw) as Record<string,unknown>;return{eventId:String(payload.event_id||payload.id||''),eventType:String(payload.event_type||payload.type||'unknown'),providerReference:payload.provider_reference?String(payload.provider_reference):null,payload}}
}

const adapters: PaymentProviderAdapter[] = [cardAdapter, bankTransfer, invoice, payAtLocation, manualVerified]

export function paymentAdapter(method: PaymentMethodKind): PaymentProviderAdapter {
  const adapter = adapters.find((candidate) => candidate.methods.includes(method))
  if (!adapter) throw new MarketplaceError('CONFIGURATION_ERROR', `Aucun adaptateur n’est disponible pour ${method}.`)
  return adapter
}

export function paymentProviderReadiness(): Array<{ key: string; methods: PaymentMethodKind[]; configured: boolean }> {
  return adapters.map((adapter) => ({ key: adapter.key, methods: adapter.methods, configured: adapter.configured() }))
}
