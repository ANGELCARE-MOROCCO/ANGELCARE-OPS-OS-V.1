import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRevenueOsError, RevenueOsError } from '@/lib/revenue-command-os/errors'
import { ingestRevenueSignal } from '@/lib/revenue-command-os/signal-fabric/repository'
import type { RevenueSignalIngestionInput } from '@/lib/revenue-command-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left, 'utf8')
  const b = Buffer.from(right, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest, context: { params: Promise<{ sourceCode: string }> }) {
  const receiptId = `WH-${randomUUID()}`
  const receivedAt = new Date()
  const rawBody = await request.text()
  const bodyHash = createHash('sha256').update(rawBody).digest('hex')
  const signature = request.headers.get('x-revenue-signal-signature') || ''
  const timestamp = request.headers.get('x-revenue-signal-timestamp') || ''
  const secret = process.env.REVENUE_OS_SIGNAL_WEBHOOK_SECRET || ''
  const { sourceCode } = await context.params
  const supabase = await createServiceClient()

  const reject = async (reason: string, status: number) => {
    await supabase.from('revenue_os_signal_webhook_receipts').insert({ receipt_id: receiptId, source_code: sourceCode, signature_valid: false, body_hash: bodyHash, status: 'rejected', rejection_reason: reason, received_at: receivedAt.toISOString(), metadata: { shadowOnly: true } })
    return NextResponse.json({ ok: false, error: { code: 'REVENUE_SIGNAL_WEBHOOK_REJECTED', message: reason }, receiptId }, { status })
  }

  if (!secret) return reject('Secret webhook non configuré.', 503)
  const timestampMs = Number(timestamp) * 1000
  if (!timestamp || !Number.isFinite(timestampMs) || Math.abs(receivedAt.getTime() - timestampMs) > 5 * 60 * 1000) return reject('Horodatage webhook absent, invalide ou expiré.', 401)
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  if (!signature || !secureEqual(signature, expected)) return reject('Signature webhook invalide.', 401)

  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>
    const eventType = String(parsed.eventType || parsed.type || '')
    const payload = parsed.payload && typeof parsed.payload === 'object' ? parsed.payload as Record<string, unknown> : parsed
    if (!eventType) throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT', 'eventType est requis.', { status: 400 })
    const input: RevenueSignalIngestionInput = {
      sourceCode,
      sourceRecordId: parsed.sourceRecordId ? String(parsed.sourceRecordId) : undefined,
      eventType,
      occurredAt: parsed.occurredAt ? String(parsed.occurredAt) : undefined,
      payload,
      correlationId: parsed.correlationId ? String(parsed.correlationId) : receiptId,
    }
    const result = await ingestRevenueSignal(input, { id: '', label: `Webhook ${sourceCode}`, role: 'system' })
    await supabase.from('revenue_os_signal_webhook_receipts').insert({ receipt_id: receiptId, source_code: sourceCode, signature_valid: true, body_hash: bodyHash, status: result.duplicate ? 'duplicate' : 'accepted', received_at: receivedAt.toISOString(), metadata: { eventType, shadowOnly: true } })
    return NextResponse.json({ ok: true, receiptId, duplicate: result.duplicate, data: result }, { status: result.duplicate ? 200 : 202 })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    await supabase.from('revenue_os_signal_webhook_receipts').insert({ receipt_id: receiptId, source_code: sourceCode, signature_valid: true, body_hash: bodyHash, status: 'failed', rejection_reason: normalized.message, received_at: receivedAt.toISOString(), metadata: { shadowOnly: true } })
    return NextResponse.json({ ok: false, receiptId, error: { code: normalized.code, message: normalized.message, recoverable: normalized.recoverable } }, { status: normalized.status })
  }
}
