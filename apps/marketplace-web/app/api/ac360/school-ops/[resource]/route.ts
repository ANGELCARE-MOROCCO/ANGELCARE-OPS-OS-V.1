import { NextResponse } from 'next/server'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction, estimateStorageGbFromBytes } from '@/lib/ac360/action-wiring'
import { createAc360SchoolOpsRecord, getAc360SchoolCapacity, listAc360SchoolOpsRecords, resolveAc360SchoolOpsResource, resolveAc360SchoolOpsContext } from '@/lib/ac360/school-ops'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ resource: string }> | { resource: string } }

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

async function resolveResource(context: Ctx) {
  const params = await context.params
  return String(params?.resource || '').trim()
}

function quantityFor(resource: string, body: Record<string, unknown>) {
  if (resource === 'documents') return estimateStorageGbFromBytes(body.fileSizeBytes || body.file_size_bytes || 0)
  if (resource === 'messages') return Math.max(1, Number(body.recipientCount || body.recipient_count || 1) || 1)
  return 1
}

export async function GET(request: Request, context: Ctx) {
  const resourceKey = await resolveResource(context)
  const config = resolveAc360SchoolOpsResource(resourceKey)
  if (!config) return json({ ok: false, error: `Unknown AC360 school operations resource: ${resourceKey}` }, { status: 404 })

  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId') || undefined
  const limit = Number(url.searchParams.get('limit') || 100)
  const result = await listAc360SchoolOpsRecords(config.resource, orgId, limit)
  return json(result, { status: result.ok ? 200 : (result as any).status || 500 })
}

export async function POST(request: Request, context: Ctx) {
  const resourceKey = await resolveResource(context)
  const config = resolveAc360SchoolOpsResource(resourceKey)
  if (!config?.wiringKey) return json({ ok: false, error: `Unknown or unwired AC360 school operations resource: ${resourceKey}` }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const resolved = await resolveAc360SchoolOpsContext(body.orgId || body.org_id)
  if (!resolved.ok) return json(resolved, { status: resolved.status || 400 })

  const quantity = quantityFor(config.resource, body)
  const currentCapacity = await getAc360SchoolCapacity(resolved.orgId, config.capacityKey)
  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${config.resource}:${body.studentCode || body.staffCode || body.classCode || body.documentCode || body.messageCode || body.reportCode || body.taskCode || Date.now()}`

  const guarded = await runAc360WiredAction(config.wiringKey as any, async () => {
    return createAc360SchoolOpsRecord(config.resource, body, resolved.orgId)
  }, {
    orgId: resolved.orgId,
    quantity,
    currentCapacity,
    idempotencyKey: buildAc360IdempotencyKey(config.wiringKey, idempotencySeed),
    metadata: {
      source: 'api.ac360.school_ops.resource.POST',
      phase: 'phase_2a_core_school_ops_skeleton',
      resource: config.resource,
      capacityKey: config.capacityKey || null,
      table: config.table,
    },
  })

  if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
  return json({ ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }, { status: (guarded.data as any)?.ok ? 200 : (guarded.data as any)?.status || 500 })
}
