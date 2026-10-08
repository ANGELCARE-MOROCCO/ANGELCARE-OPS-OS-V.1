import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { getTransportMobilitySnapshot, transportMutation } from '@/lib/angelcare360/server/transport-mobility-command'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest) {
  try {
    const schoolId = request.nextUrl.searchParams.get('schoolId')
    const snapshot = await getTransportMobilitySnapshot({ schoolId })
    return response({ ok: true, snapshot })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return response({ ok: false, error: error.message }, error.status)
    return response({ ok: false, error: publicAngelcare360Error(error) }, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') return response({ ok: false, error: 'Payload Transport invalide.' }, 422)
    const result = await transportMutation(payload as Record<string, unknown>)
    return response(result, result.ok ? 200 : result.locked ? 409 : 422)
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return response({ ok: false, error: error.message }, error.status)
    return response({ ok: false, error: publicAngelcare360Error(error) }, 500)
  }
}
