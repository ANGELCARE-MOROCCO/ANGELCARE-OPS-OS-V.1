import { NextRequest, NextResponse } from 'next/server'
import { runDuePublicationJobs } from '@/angelcare-marketplace/experience-builder/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const provided = request.headers.get('x-marketplace-experience-worker-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  const allowed = [process.env.MARKETPLACE_EXPERIENCE_WORKER_TOKEN, process.env.CRON_SECRET].map(value => String(value || '')).filter(Boolean)
  return allowed.some(expected => provided.length === expected.length && provided === expected)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Worker Experience non autorisé.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  try {
    const body = await request.json().catch(() => ({})) as { limit?: number; worker?: string }
    const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100)
    const worker = String(body.worker || 'marketplace-experience-worker').slice(0, 120)
    const result = await runDuePublicationJobs(worker, limit)
    return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Le worker Experience a échoué.'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Scheduler Experience non autorisé.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  try {
    const result = await runDuePublicationJobs('scheduler:marketplace-experience', 50)
    return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Le scheduler Experience a échoué.'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
