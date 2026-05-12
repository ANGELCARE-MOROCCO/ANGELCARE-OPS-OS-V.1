import { NextResponse } from 'next/server'
import { listServiceOSBlueprints, upsertServiceOSRecord } from '@/lib/service-os/production/repository'

export async function GET() { return NextResponse.json({ data: await listServiceOSBlueprints() }) }
export async function POST(request: Request) {
  const body = await request.json()
  const saved = await upsertServiceOSRecord('serviceos_blueprints', body)
  return NextResponse.json({ data: saved })
}
