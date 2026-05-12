import { NextResponse } from 'next/server'
import { generatePayrollInput } from '@/lib/hr-erp/payroll'
export async function POST(req: Request){
  const body = await req.json()
  const rows = await generatePayrollInput(body.periodStart, body.periodEnd)
  return NextResponse.json({ ok: true, rows })
}
