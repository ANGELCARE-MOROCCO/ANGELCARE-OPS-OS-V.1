import { NextResponse } from 'next/server'
import { executeAc360OperationsCommand } from '@/lib/ac360/customer-operations-source'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await executeAc360OperationsCommand({ ...body, operation: 'capacity.snapshot' })
  return NextResponse.json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
