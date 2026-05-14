import { NextResponse } from 'next/server'
import { recoveredLocalStorageSeed } from '@/lib/revenue-command-center/recoveredLocalStorageSeed'

export async function GET() {
  return NextResponse.json({ ok: true, source: 'embedded_staff_browser_recovery_20260514', payload: recoveredLocalStorageSeed })
}
