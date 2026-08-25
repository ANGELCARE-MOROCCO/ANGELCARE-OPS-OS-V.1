import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { getTrustResolutionSnapshot, trustResolutionMutation } from '@/lib/angelcare360/server/trust-resolution-command'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getTrustResolutionSnapshot({ schoolId: request.nextUrl.searchParams.get('schoolId') })
    return response({ ok:true, snapshot })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return response({ ok:false, error:error.message }, error.status)
    return response({ ok:false, error:error instanceof Error ? error.message : 'Erreur Trust Resolution.' }, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') return response({ ok:false, error:'Payload Trust Resolution invalide.' }, 422)
    const result = await trustResolutionMutation(payload as Record<string,unknown>)
    return response(result, result.ok ? 200 : 422)
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return response({ ok:false, error:error.message }, error.status)
    return response({ ok:false, error:error instanceof Error ? error.message : 'Erreur Trust Resolution.' }, 500)
  }
}
