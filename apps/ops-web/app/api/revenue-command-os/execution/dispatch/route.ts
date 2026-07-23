import { createHmac, timingSafeEqual } from 'node:crypto'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import { executeOneAction } from '@/lib/revenue-command-os/execution-autopilot/service'
import { loadAction } from '@/lib/revenue-command-os/execution-autopilot/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verifySignature(secret: string, timestamp: string, rawBody: string, signature: string) {
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(signature)
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer)
}

export async function POST(request: Request) {
  try {
    const secret = process.env.REVENUE_OS_WORKER_SECRET || process.env.CRON_SECRET
    if (!secret) {
      throw new RevenueOsError('REVENUE_OS_NOT_CONFIGURED', 'Secret worker Revenue OS manquant.', { status: 503 })
    }

    const timestamp = request.headers.get('x-revenue-timestamp') || ''
    const signature = request.headers.get('x-revenue-signature') || ''
    const workerId = request.headers.get('x-revenue-worker-id') || ''
    const rawBody = await request.text()
    const timestampMs = Date.parse(timestamp)

    if (!timestamp || !signature || !workerId || !Number.isFinite(timestampMs)) {
      throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Signature worker incomplète.', { status: 401 })
    }
    if (Math.abs(Date.now() - timestampMs) > 5 * 60_000) {
      throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Signature worker expirée.', { status: 401 })
    }
    if (!verifySignature(secret, timestamp, rawBody, signature)) {
      throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Signature worker invalide.', { status: 401 })
    }

    const body = JSON.parse(rawBody) as {
      tenantId?: string
      actionId?: string
      idempotencyKey?: string
      leaseId?: string
    }

    if (!body.tenantId || !body.actionId || !body.idempotencyKey || !body.leaseId) {
      throw new RevenueOsError(
        'REVENUE_OS_INVALID_INPUT',
        'tenantId, actionId, idempotencyKey et leaseId sont obligatoires.',
        { status: 422, recoverable: true },
      )
    }

    const action = await loadAction(body.tenantId, body.actionId)
    const result = await executeOneAction(action)
    return revenueOsSuccess(result, {
      meta: { workerId, leaseId: body.leaseId, idempotencyKey: body.idempotencyKey },
    })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
