import { NextRequest, NextResponse } from 'next/server'
import { getAc360ActiveRestrictions } from '@/lib/ac360/foundation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId') || undefined
    const result = await getAc360ActiveRestrictions(orgId)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'AC360 restrictions unavailable.' }, { status: 500 })
  }
}
