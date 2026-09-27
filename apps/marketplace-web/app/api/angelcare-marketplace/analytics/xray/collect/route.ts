import { NextResponse } from 'next/server'
import { recordXrayBatch } from '@/angelcare-marketplace/store-xray/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ recorded: 0 }, { status: 400 })
    const result = await recordXrayBatch(body as Record<string, unknown>, request)
    return NextResponse.json(result, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telemetry rejected.'
    return NextResponse.json({ recorded: 0, error: message }, { status: 400, headers: { 'cache-control': 'no-store' } })
  }
}
