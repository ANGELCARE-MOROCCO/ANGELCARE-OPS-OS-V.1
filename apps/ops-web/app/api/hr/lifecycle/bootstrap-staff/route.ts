import { NextResponse } from 'next/server'
import { createStaffLifecycleBundle } from '@/lib/hr-production/lifecycle'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const result = await createStaffLifecycleBundle(body)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
