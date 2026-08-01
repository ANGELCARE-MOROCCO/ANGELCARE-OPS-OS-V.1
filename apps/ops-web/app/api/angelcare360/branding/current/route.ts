
import { NextResponse } from 'next/server'
import { resolveCurrentUserBrandRuntime } from '@/lib/angelcare360/operator/branding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try { return NextResponse.json({ ok: true, runtime: await resolveCurrentUserBrandRuntime() }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Brand runtime indisponible.' }, { status: 500 }) }
}
