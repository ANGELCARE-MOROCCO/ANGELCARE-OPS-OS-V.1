import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 3000

async function bounded<T>(value: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(value),
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`readiness timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS) }),
    ])
  } finally { if (timer) clearTimeout(timer) }
}

export async function GET() {
  const started = Date.now()
  try {
    const db = await createClient()
    const result = await bounded(db.from('angelcare360_schools').select('id', { count: 'exact', head: true }).limit(1))
    if (result.error) throw new Error(result.error.message)
    return NextResponse.json({ status: 'ready', database: 'ready', latencyMs: Date.now() - started, observedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ status: 'unready', database: 'unready', latencyMs: Date.now() - started, reason: error instanceof Error ? error.message : 'dependency unavailable', observedAt: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
