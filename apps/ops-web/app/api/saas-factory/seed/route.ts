import { NextResponse } from 'next/server'
import { seedFactoryCatalog } from '@/lib/saas-factory/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await seedFactoryCatalog()
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to seed SaaS Factory catalog' }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
