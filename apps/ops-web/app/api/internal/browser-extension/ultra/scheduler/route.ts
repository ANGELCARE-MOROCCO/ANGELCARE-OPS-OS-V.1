import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { extensionDb } from '@/lib/browser-extension/runtime'
import { executeB2BUltraCommand } from '@/lib/browser-extension/b2b-ultra/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEqual(actual: string, expected: string) {
  if (!actual || !expected) return false
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function boundedWorkerId(value: unknown) {
  const worker = String(value || 'browser-ultra-production-worker').trim().slice(0, 160)
  return /^[a-z0-9:_-]+$/i.test(worker) ? worker : 'browser-ultra-production-worker'
}

export async function POST(request: NextRequest) {
  if (String(process.env.BROWSER_ULTRA_SCHEDULER_KILL_SWITCH || '').toLowerCase() === 'true') {
    return NextResponse.json({ ok: false, error: 'SCHEDULER_ENV_KILL_SWITCH_ACTIVE' }, { status: 503 })
  }
  const secret = String(process.env.BROWSER_ULTRA_SCHEDULER_SECRET || '')
  const actual = String(request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!secret || !safeEqual(actual, secret)) return NextResponse.json({ ok: false, error: 'SCHEDULER_AUTH_REQUIRED' }, { status: 401 })
  const actorId = String(process.env.BROWSER_ULTRA_SCHEDULER_ACTOR_ID || '')
  if (!/^[0-9a-f-]{36}$/i.test(actorId)) return NextResponse.json({ ok: false, error: 'SCHEDULER_ACTOR_NOT_CONFIGURED' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const limit = Math.max(1, Math.min(Number(body?.limit || 25), 100))
  const workerId = boundedWorkerId(body?.workerId)
  const db = await extensionDb()
  const { data: actor } = await db.from('app_users').select('*').eq('id', actorId).eq('status', 'active').maybeSingle()
  if (!actor) return NextResponse.json({ ok: false, error: 'SCHEDULER_ACTOR_NOT_FOUND' }, { status: 503 })
  try {
    const result = await executeB2BUltraCommand({
      db,
      actor,
      device: { id: actorId, kind: 'server_scheduler' },
      access: { scopes: [{ scope_type: 'all' }] },
      commandKey: 'b2b.ultra.scheduler.tick',
      payload: { limit, workerId },
    })
    const schedulerResult = result && typeof result === 'object' && 'blocked' in result ? result : null
    await writeExtensionAudit(db, {
      actor,
      eventType: 'ultra_scheduler_tick',
      moduleKey: 'revenue_b2b',
      commandKey: 'b2b.ultra.scheduler.tick',
      targetType: 'scheduler_worker',
      targetId: null,
      result: schedulerResult?.blocked ? 'blocked' : 'ok',
      severity: schedulerResult?.blocked ? 'warning' : 'info',
      metadata: { workerId, limit, claimed: schedulerResult?.claimed || 0, enqueued: schedulerResult?.enqueued || 0, blocked: Boolean(schedulerResult?.blocked) },
    })
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    await writeExtensionAudit(db, {
      actor,
      eventType: 'ultra_scheduler_tick_failed',
      moduleKey: 'revenue_b2b',
      commandKey: 'b2b.ultra.scheduler.tick',
      targetType: 'scheduler_worker',
      result: 'error',
      severity: 'error',
      metadata: { workerId, limit, error: String(error?.message || 'SCHEDULER_TICK_FAILED') },
    })
    return NextResponse.json({ ok: false, error: String(error?.message || 'SCHEDULER_TICK_FAILED'), details: error?.details || null }, { status: Number(error?.status || 500) })
  }
}
