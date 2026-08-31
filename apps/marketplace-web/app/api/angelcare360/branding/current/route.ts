import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'

import { NextResponse } from 'next/server'
import { resolveCurrentUserBrandRuntime } from '@/lib/angelcare360/operator/branding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try { return NextResponse.json({ ok: true, runtime: await resolveCurrentUserBrandRuntime() }) }
  catch (error) { return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 }) }
}
