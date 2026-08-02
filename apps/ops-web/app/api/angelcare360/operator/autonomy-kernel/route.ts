import { NextRequest, NextResponse } from 'next/server'
import { executeAutonomyKernelOperation, getAutonomyKernelSnapshot } from '@/lib/angelcare360/operator/autonomy-kernel'
import type { AutonomyKernelOperation } from '@/types/angelcare360/operator/autonomy-kernel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur Autonomy Kernel inconnue.'
  const status = /accès opérateur|permission|accès/i.test(message) ? 403 : /obligatoire|invalide|inconnue|transition|compatibilité/i.test(message) ? 422 : 500
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET() {
  try {
    const snapshot = await getAutonomyKernelSnapshot()
    return NextResponse.json({ ok: true, snapshot }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { operation?: AutonomyKernelOperation; payload?: Record<string, unknown> }
    if (!body.operation) return NextResponse.json({ ok: false, error: 'L’opération Autonomy Kernel est obligatoire.' }, { status: 422 })
    const result = await executeAutonomyKernelOperation(body.operation, body.payload || {})
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}
