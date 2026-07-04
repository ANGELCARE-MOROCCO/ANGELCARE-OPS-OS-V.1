import { NextRequest, NextResponse } from 'next/server'
import { listPacks } from '@/lib/b2b-marketplace/repository'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  return NextResponse.json({ ok: true, data: await listPacks({ query: searchParams.get('q') || undefined }) })
}
