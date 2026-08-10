import { NextRequest, NextResponse } from 'next/server'
import { processAutonomyKernelProvisioningBatch } from '@/lib/angelcare360/operator/autonomy-kernel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const expected = process.env.AUTONOMY_KERNEL_WORKER_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-autonomy-worker-secret') || ''
  return Boolean(expected && supplied && supplied === expected)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Worker Autonomy Kernel non autorisé.' }, { status: 401 })
  try {
    const body = await request.json().catch(() => ({})) as { limit?: number }
    const result = await processAutonomyKernelProvisioningBatch(Number(body.limit || 10))
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur worker Autonomy Kernel.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
