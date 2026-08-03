import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { processProductRealityQueue } from '@/lib/angelcare360/server/product-reality'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const secret = process.env.AUTONOMY_KERNEL_WORKER_SECRET || process.env.ANGELCARE360_PRODUCT_REALITY_WORKER_SECRET
  const value = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!secret || !value) return false
  const left = Buffer.from(secret)
  const right = Buffer.from(value)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Worker secret invalide.' }, { status: 401 })
  try {
    const body = (await request.json().catch(() => ({}))) as { limit?: number }
    return NextResponse.json(await processProductRealityQueue(Number(body.limit || 10)))
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Worker product reality indisponible.' }, { status: 500 })
  }
}
