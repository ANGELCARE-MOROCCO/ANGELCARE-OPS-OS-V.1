import { MarketplaceError } from '../server/errors'

export type PayPalEnvironment = 'sandbox' | 'live'
export type PayPalCurrency = 'EUR'

type JsonRecord = Record<string, unknown>

type PayPalConfig = {
  environment: PayPalEnvironment
  baseUrl: string
  clientId: string
  clientSecret: string
  webhookId: string
  currency: PayPalCurrency
  dhPerUnit: number
  timeoutMs: number
}

type PayPalLink = { href?: string; rel?: string; method?: string }

type PayPalAmount = { value?: string; currency_code?: string }

type PayPalCapture = {
  id?: string
  status?: string
  amount?: PayPalAmount
  custom_id?: string
  supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } }
}

type PayPalPurchaseUnit = {
  custom_id?: string
  invoice_id?: string
  amount?: PayPalAmount
  payments?: { captures?: PayPalCapture[] }
}

type PayPalOrder = {
  id?: string
  status?: string
  purchase_units?: PayPalPurchaseUnit[]
  links?: PayPalLink[]
}

type PayPalRefund = {
  id?: string
  status?: string
  amount?: PayPalAmount
  links?: PayPalLink[]
}

export type PayPalOrderCreation = {
  orderId: string
  status: string
  approvalUrl: string
  providerAmount: string
  currency: PayPalCurrency
  dhPerUnit: number
  canonicalDhAmount: number
  raw: JsonRecord
}

export type PayPalCaptureResult = {
  orderId: string
  orderStatus: string
  captureId: string | null
  captureStatus: string
  providerAmount: string | null
  currency: string | null
  paymentIntentIdHint: string | null
  raw: JsonRecord
}

export type PayPalRefundResult = {
  refundId: string
  status: string
  providerAmount: string
  currency: string
  raw: JsonRecord
}

export type PayPalWebhookVerification = {
  eventId: string
  eventType: string
  orderId: string | null
  captureId: string | null
  refundId: string | null
  paymentIntentIdHint: string | null
  amount: string | null
  currency: string | null
  payload: JsonRecord
}

let tokenCache: { key: string; token: string; expiresAt: number } | null = null

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function finitePositive(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function providerError(message: string, cause?: unknown, retryable = true): MarketplaceError {
  return new MarketplaceError('DEPENDENCY_BLOCKED', message, { cause, retryable })
}

export function getPayPalConfig(options: { requireWebhook?: boolean } = {}): PayPalConfig {
  const provider = String(process.env.ANGELCARE_PAYMENT_PROVIDER || '').trim().toLowerCase()
  if (provider !== 'paypal') {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'ANGELCARE_PAYMENT_PROVIDER doit être défini à paypal pour activer PayPal.')
  }

  const environment = String(process.env.PAYPAL_ENV || 'live').trim().toLowerCase() as PayPalEnvironment
  if (!['live', 'sandbox'].includes(environment)) {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'PAYPAL_ENV doit être live ou sandbox.')
  }

  const clientId = String(process.env.PAYPAL_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || '').trim()
  const webhookId = String(process.env.PAYPAL_WEBHOOK_ID || '').trim()
  const currency = String(process.env.PAYPAL_CURRENCY || 'EUR').trim().toUpperCase() as PayPalCurrency
  const dhPerUnit = finitePositive(process.env.PAYPAL_DH_PER_PAYPAL_UNIT)
  const timeoutMs = Math.min(60_000, Math.max(5_000, Number(process.env.PAYPAL_TIMEOUT_MS || 15_000)))

  const missing: string[] = []
  if (!clientId) missing.push('PAYPAL_CLIENT_ID')
  if (!clientSecret) missing.push('PAYPAL_CLIENT_SECRET')
  if (!dhPerUnit) missing.push('PAYPAL_DH_PER_PAYPAL_UNIT')
  if (options.requireWebhook && !webhookId) missing.push('PAYPAL_WEBHOOK_ID')
  if (missing.length) {
    throw new MarketplaceError('CONFIGURATION_ERROR', `Configuration PayPal incomplète : ${missing.join(', ')}.`)
  }
  if (currency !== 'EUR') {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'PAYPAL_CURRENCY doit être EUR pour le Marketplace ANGELCARE.')
  }

  return {
    environment,
    baseUrl: environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    clientId,
    clientSecret,
    webhookId,
    currency,
    dhPerUnit,
    timeoutMs,
  }
}

export function paypalConfigured(): boolean {
  try {
    getPayPalConfig({ requireWebhook: true })
    return true
  } catch {
    return false
  }
}

export function paypalConfigurationStatus() {
  const provider = String(process.env.ANGELCARE_PAYMENT_PROVIDER || '').trim().toLowerCase()
  const environment = String(process.env.PAYPAL_ENV || 'live').trim().toLowerCase()
  const clientId = String(process.env.PAYPAL_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || '').trim()
  const webhookId = String(process.env.PAYPAL_WEBHOOK_ID || '').trim()
  const rate = finitePositive(process.env.PAYPAL_DH_PER_PAYPAL_UNIT)
  return {
    providerEnabled: provider === 'paypal', environment: environment === 'sandbox' || environment === 'live' ? environment : 'unknown',
    baseUrl: environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : environment === 'live' ? 'https://api-m.paypal.com' : null,
    clientIdPresent: Boolean(clientId), clientSecretPresent: Boolean(clientSecret), webhookIdPresent: Boolean(webhookId),
    conversionRatePresent: rate > 0, currency: String(process.env.PAYPAL_CURRENCY || 'EUR').trim().toUpperCase(),
    configured: paypalConfigured(), supportedCurrencies: ['EUR'], supportedJourneys: ['card', 'deposit', 'installment'],
  }
}

export async function testPayPalConnection() {
  const config = getPayPalConfig({ requireWebhook: true })
  const startedAt = Date.now()
  await accessToken(config, true)
  return { ok: true, environment: config.environment, baseUrl: config.baseUrl, latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString() }
}

export function dhToPayPalAmount(amountDh: number, dhPerUnit: number): string {
  if (!Number.isFinite(amountDh) || amountDh <= 0) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le montant externe PayPal doit être strictement positif.')
  }
  if (!Number.isFinite(dhPerUnit) || dhPerUnit <= 0) {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'Le taux Dh/PayPal est invalide.')
  }
  const converted = Math.round((amountDh / dhPerUnit) * 100) / 100
  if (converted < 0.01) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le montant converti PayPal est inférieur au minimum transactionnel.')
  }
  return converted.toFixed(2)
}

export function payPalAmountToDh(providerAmount: string | number, dhPerUnit: number): number {
  const amount = Number(providerAmount)
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(dhPerUnit) || dhPerUnit <= 0) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Conversion PayPal vers Dh impossible.')
  }
  return Math.round(amount * dhPerUnit * 100) / 100
}

function appendQuery(url: string, values: Record<string, string>): string {
  const parsed = new URL(url)
  for (const [key, value] of Object.entries(values)) parsed.searchParams.set(key, value)
  return parsed.toString()
}

async function accessToken(config: PayPalConfig, forceRefresh = false): Promise<string> {
  const key = `${config.environment}:${config.clientId}`
  if (!forceRefresh && tokenCache?.key === key && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
      signal: controller.signal,
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({})) as JsonRecord
    if (!response.ok || !text(payload.access_token)) {
      throw providerError('PayPal OAuth a refusé les identifiants serveur.', payload, response.status >= 500)
    }
    const expiresIn = Math.max(60, Number(payload.expires_in || 300))
    tokenCache = { key, token: text(payload.access_token), expiresAt: Date.now() + expiresIn * 1000 }
    return tokenCache.token
  } catch (error) {
    if (error instanceof MarketplaceError) throw error
    throw providerError('Connexion OAuth PayPal impossible.', error)
  } finally {
    clearTimeout(timeout)
  }
}

async function paypalRequest<T extends JsonRecord>(input: {
  path: string
  method?: 'GET' | 'POST' | 'PATCH'
  body?: JsonRecord
  requestId?: string
  preferRepresentation?: boolean
  requireWebhook?: boolean
}): Promise<T> {
  const config = getPayPalConfig({ requireWebhook: input.requireWebhook })

  const execute = async (forceRefresh = false) => {
    const token = await accessToken(config, forceRefresh)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs)
    try {
      const headers: Record<string, string> = {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
        'content-type': 'application/json',
      }
      if (input.requestId) headers['PayPal-Request-Id'] = input.requestId.slice(0, 108)
      if (input.preferRepresentation) headers.Prefer = 'return=representation'

      const response = await fetch(`${config.baseUrl}${input.path}`, {
        method: input.method || 'GET',
        headers,
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        signal: controller.signal,
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({})) as T
      return { response, payload }
    } finally {
      clearTimeout(timeout)
    }
  }

  let result: Awaited<ReturnType<typeof execute>>
  try {
    result = await execute(false)
    if (result.response.status === 401) {
      tokenCache = null
      result = await execute(true)
    }
  } catch (error) {
    if (error instanceof MarketplaceError) throw error
    throw providerError('Communication avec PayPal impossible.', error)
  }

  if (!result.response.ok) {
    const issue = text(result.payload.message) || text(result.payload.name) || `HTTP ${result.response.status}`
    const debugId = text(result.payload.debug_id)
    throw providerError(`PayPal a refusé l’opération : ${issue}${debugId ? ` (debug ${debugId})` : ''}.`, result.payload, result.response.status >= 500 || result.response.status === 429)
  }
  return result.payload
}

function approvalUrl(order: PayPalOrder): string {
  const link = (order.links || []).find((candidate) => candidate.rel === 'approve' || candidate.rel === 'payer-action')
  return String(link?.href || '')
}

function firstCapture(order: PayPalOrder): PayPalCapture | null {
  for (const unit of order.purchase_units || []) {
    const capture = unit.payments?.captures?.[0]
    if (capture) return capture
  }
  return null
}

export async function createPayPalOrder(input: {
  paymentIntentId: string
  paymentReference: string
  idempotencyKey: string
  amountDh: number
  returnUrl: string
  cancelUrl: string
  customerEmail?: string | null
}): Promise<PayPalOrderCreation> {
  const config = getPayPalConfig({ requireWebhook: true })
  const providerAmount = dhToPayPalAmount(input.amountDh, config.dhPerUnit)
  const returnUrl = appendQuery(input.returnUrl, { paymentIntentId: input.paymentIntentId })
  const cancelUrl = appendQuery(input.cancelUrl, { paymentIntentId: input.paymentIntentId })

  const payload = await paypalRequest<PayPalOrder & JsonRecord>({
    path: '/v2/checkout/orders',
    method: 'POST',
    requestId: `ac-create-${input.paymentIntentId}`,
    preferRepresentation: true,
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: input.paymentIntentId,
        description: `ANGELCARE ${input.paymentReference}`.slice(0, 127),
        amount: { currency_code: config.currency, value: providerAmount },
      }],
      payment_source: {
        paypal: {
          ...(input.customerEmail ? { email_address: input.customerEmail } : {}),
          experience_context: {
            brand_name: 'ANGELCARE',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    },
  })

  const orderId = text(payload.id)
  const action = approvalUrl(payload)
  if (!orderId || !action) {
    throw providerError('PayPal n’a pas retourné de référence de commande ou d’URL d’approbation.', payload, false)
  }

  return {
    orderId,
    status: text(payload.status) || 'CREATED',
    approvalUrl: action,
    providerAmount,
    currency: config.currency,
    dhPerUnit: config.dhPerUnit,
    canonicalDhAmount: input.amountDh,
    raw: payload,
  }
}

export async function showPayPalOrder(orderId: string): Promise<PayPalOrder & JsonRecord> {
  if (!/^[A-Z0-9]+$/i.test(orderId)) throw new MarketplaceError('VALIDATION_ERROR', 'Référence de commande PayPal invalide.')
  return paypalRequest<PayPalOrder & JsonRecord>({ path: `/v2/checkout/orders/${encodeURIComponent(orderId)}` })
}

export async function capturePayPalOrder(orderId: string, idempotencyKey: string): Promise<PayPalCaptureResult> {
  let order = await showPayPalOrder(orderId)
  const currentStatus = text(order.status).toUpperCase()
  if (currentStatus !== 'COMPLETED') {
    if (currentStatus !== 'APPROVED') {
      throw new MarketplaceError('DEPENDENCY_BLOCKED', `La commande PayPal n’est pas capturable dans son état ${currentStatus || 'inconnu'}.`)
    }
    order = await paypalRequest<PayPalOrder & JsonRecord>({
      path: `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      method: 'POST',
      body: {},
      requestId: `ac-capture-${idempotencyKey}`,
      preferRepresentation: true,
    })
  }

  const capture = firstCapture(order)
  const purchaseUnit = order.purchase_units?.[0]
  return {
    orderId: text(order.id) || orderId,
    orderStatus: text(order.status),
    captureId: capture?.id ? String(capture.id) : null,
    captureStatus: text(capture?.status) || text(order.status),
    providerAmount: capture?.amount?.value ? String(capture.amount.value) : purchaseUnit?.amount?.value ? String(purchaseUnit.amount.value) : null,
    currency: capture?.amount?.currency_code ? String(capture.amount.currency_code) : purchaseUnit?.amount?.currency_code ? String(purchaseUnit.amount.currency_code) : null,
    paymentIntentIdHint: purchaseUnit?.custom_id ? String(purchaseUnit.custom_id) : capture?.custom_id ? String(capture.custom_id) : null,
    raw: order,
  }
}

export async function refundPayPalCapture(input: {
  captureId: string
  providerAmount: string
  currency: string
  idempotencyKey: string
  note?: string
}): Promise<PayPalRefundResult> {
  if (!input.captureId) throw new MarketplaceError('VALIDATION_ERROR', 'Référence de capture PayPal absente.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.providerAmount)) throw new MarketplaceError('VALIDATION_ERROR', 'Montant de remboursement PayPal invalide.')
  const payload = await paypalRequest<PayPalRefund & JsonRecord>({
    path: `/v2/payments/captures/${encodeURIComponent(input.captureId)}/refund`,
    method: 'POST',
    requestId: `ac-refund-${input.idempotencyKey}`,
    preferRepresentation: true,
    body: {
      amount: { value: input.providerAmount, currency_code: input.currency },
      ...(input.note ? { note_to_payer: input.note.slice(0, 255) } : {}),
    },
  })
  const refundId = text(payload.id)
  if (!refundId) throw providerError('PayPal n’a pas retourné de référence de remboursement.', payload, false)
  return {
    refundId,
    status: text(payload.status) || 'PENDING',
    providerAmount: text(payload.amount?.value) || input.providerAmount,
    currency: text(payload.amount?.currency_code) || input.currency,
    raw: payload,
  }
}

export async function showPayPalRefund(refundId: string): Promise<PayPalRefundResult> {
  if (!/^[A-Z0-9]+$/i.test(refundId)) throw new MarketplaceError('VALIDATION_ERROR', 'Référence de remboursement PayPal invalide.')
  const payload = await paypalRequest<PayPalRefund & JsonRecord>({
    path: `/v2/payments/refunds/${encodeURIComponent(refundId)}`,
  })
  return {
    refundId: text(payload.id) || refundId,
    status: text(payload.status) || 'UNKNOWN',
    providerAmount: text(payload.amount?.value) || '0.00',
    currency: text(payload.amount?.currency_code),
    raw: payload,
  }
}

function header(request: Request, name: string): string {
  return String(request.headers.get(name) || '').trim()
}

function webhookResource(payload: JsonRecord): JsonRecord {
  return record(payload.resource)
}

function purchaseUnitFromWebhook(resource: JsonRecord): JsonRecord {
  const units = Array.isArray(resource.purchase_units) ? resource.purchase_units : []
  return record(units[0])
}

export async function verifyPayPalWebhook(request: Request): Promise<PayPalWebhookVerification> {
  const config = getPayPalConfig({ requireWebhook: true })
  const raw = await request.text()
  let payload: JsonRecord
  try {
    payload = JSON.parse(raw) as JsonRecord
  } catch (error) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Payload webhook PayPal JSON invalide.', { cause: error })
  }

  const transmissionId = header(request, 'paypal-transmission-id')
  const transmissionTime = header(request, 'paypal-transmission-time')
  const transmissionSig = header(request, 'paypal-transmission-sig')
  const certUrl = header(request, 'paypal-cert-url')
  const authAlgo = header(request, 'paypal-auth-algo')
  if (![transmissionId, transmissionTime, transmissionSig, certUrl, authAlgo].every(Boolean)) {
    throw new MarketplaceError('PERMISSION_DENIED', 'En-têtes de signature webhook PayPal incomplets.')
  }

  const verification = await paypalRequest<JsonRecord>({
    path: '/v1/notifications/verify-webhook-signature',
    method: 'POST',
    requireWebhook: true,
    body: {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: config.webhookId,
      webhook_event: payload,
    },
  })
  if (text(verification.verification_status).toUpperCase() !== 'SUCCESS') {
    throw new MarketplaceError('PERMISSION_DENIED', 'Signature webhook PayPal invalide.')
  }

  const eventId = text(payload.id)
  const eventType = text(payload.event_type)
  if (!eventId || !eventType) throw new MarketplaceError('VALIDATION_ERROR', 'Webhook PayPal sans identifiant ou type d’événement.')

  const resource = webhookResource(payload)
  const unit = purchaseUnitFromWebhook(resource)
  const supplementary = record(resource.supplementary_data)
  const relatedIds = record(supplementary.related_ids)
  const amount = record(resource.amount)
  const unitAmount = record(unit.amount)

  const captureId = eventType.startsWith('PAYMENT.CAPTURE.') ? text(resource.id) || null : text(relatedIds.capture_id) || null
  const refundId = eventType.startsWith('PAYMENT.REFUND.') ? text(resource.id) || null : null
  const orderId = eventType.startsWith('CHECKOUT.ORDER.') || eventType === 'CHECKOUT.PAYMENT-APPROVAL.REVERSED'
    ? text(resource.id) || null
    : text(relatedIds.order_id) || null
  const paymentIntentIdHint = text(resource.custom_id) || text(unit.custom_id) || null

  return {
    eventId,
    eventType,
    orderId,
    captureId,
    refundId,
    paymentIntentIdHint,
    amount: text(amount.value) || text(unitAmount.value) || null,
    currency: text(amount.currency_code) || text(unitAmount.currency_code) || null,
    payload,
  }
}
