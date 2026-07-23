import crypto from 'node:crypto'
import { RevenueOsError } from '../errors'
import { hashPayload, secureEqual, stableId } from './crypto'
import { saveWebhookEvent } from './repository'
import { WhatsAppAdapter } from './adapters/whatsapp-adapter'
import type { AdapterCode, ExecutionWebhookEvent } from './types'

function hmacValid(raw: string, signature: string, secret: string | undefined) {
  if (!secret || !signature) return false
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`
  return secureEqual(expected, signature)
}

export async function receiveWebhook(input: {
  adapterCode: AdapterCode
  raw: string
  headers: Headers
  tenantId?: string
}) {
  const tenantId = String(input.tenantId ?? input.headers.get('x-revenue-tenant-id') ?? '').trim()
  if (!tenantId) {
    throw new RevenueOsError('REVENUE_OS_TENANT_MISSING', 'Le webhook doit déclarer un tenant explicite.', {
      status: 400,
      recoverable: false,
    })
  }

  const internalSignature = input.headers.get('x-revenue-tenant-signature') ?? ''
  const internalSecret = process.env.REVENUE_OS_WEBHOOK_TENANT_SECRET ?? process.env.REVENUE_OS_WEBHOOK_SECRET
  const tenantSignatureValid = hmacValid(
    `${tenantId}.${input.raw}`,
    internalSignature,
    internalSecret,
  )

  let providerSignatureValid = false
  let payload: Record<string, unknown> = {}
  try {
    payload = JSON.parse(input.raw)
  } catch {
    payload = { raw: input.raw.slice(0, 4000) }
  }

  if (input.adapterCode === 'whatsapp') {
    providerSignatureValid = WhatsAppAdapter.verifySignature(
      input.raw,
      input.headers.get('x-hub-signature-256') ?? '',
    )
  } else if (input.adapterCode === 'gmail') {
    providerSignatureValid =
      Boolean(input.headers.get('authorization')) ||
      input.headers.get('x-goog-channel-token') === process.env.GOOGLE_WEBHOOK_CHANNEL_TOKEN
  } else if (input.adapterCode === 'calendar') {
    providerSignatureValid =
      input.headers.get('x-goog-channel-token') === process.env.GOOGLE_WEBHOOK_CHANNEL_TOKEN
  } else {
    providerSignatureValid = hmacValid(
      input.raw,
      input.headers.get('x-revenue-os-signature') ?? '',
      process.env.REVENUE_OS_WEBHOOK_SECRET,
    )
  }

  const signatureValid = providerSignatureValid && tenantSignatureValid
  const providerEventId = String(
    (payload as any)?.id ||
      (payload as any)?.entry?.[0]?.id ||
      input.headers.get('x-goog-message-number') ||
      hashPayload(payload),
  )
  const event: ExecutionWebhookEvent = {
    id: stableId('mz14-webhook', tenantId, input.adapterCode, providerEventId),
    tenantId,
    adapterCode: input.adapterCode,
    providerEventId,
    eventType: String(
      (payload as any)?.type ||
        (payload as any)?.event ||
        input.headers.get('x-goog-resource-state') ||
        'unknown',
    ),
    externalReference: String(
      (payload as any)?.messageId ||
        (payload as any)?.resourceId ||
        input.headers.get('x-goog-resource-id') ||
        '',
    ),
    payloadHash: hashPayload(payload),
    payload,
    signatureValid,
    replayed: false,
    status: signatureValid ? 'received' : 'ignored',
    receivedAt: new Date().toISOString(),
  }
  await saveWebhookEvent(event)
  return event
}
