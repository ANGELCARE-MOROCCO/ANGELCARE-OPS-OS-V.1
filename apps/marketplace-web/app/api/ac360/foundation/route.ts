import { NextResponse } from 'next/server'
import { getAc360FoundationSnapshot, computeAc360Readiness } from '@/lib/ac360/foundation'

export const dynamic = 'force-dynamic'

function noStore(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function GET() {
  try {
    const snapshot = await getAc360FoundationSnapshot()
    return noStore({ ok: snapshot.ok, data: snapshot, readiness: computeAc360Readiness(snapshot) }, { status: snapshot.ok ? 200 : 503 })
  } catch (error) {
    return noStore({ ok: false, error: error instanceof Error ? error.message : 'AC360 foundation snapshot failed.' }, { status: 500 })
  }
}
