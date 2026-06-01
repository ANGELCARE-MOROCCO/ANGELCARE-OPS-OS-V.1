import { NextResponse } from 'next/server'
import { listFactoryIncidents, saveFactoryIncident } from '@/lib/saas-factory/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const result = await listFactoryIncidents()
    return NextResponse.json({ ok: true, incidents: result.data, source: result.source, error: result.error })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory API error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await saveFactoryIncident(body)
    return NextResponse.json(result, { status: result.ok === false ? 500 : 200 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory save error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  return POST(request)
}
