import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const payload = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, ...payload }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Unknown CareLink dashboard error')
  }
}
