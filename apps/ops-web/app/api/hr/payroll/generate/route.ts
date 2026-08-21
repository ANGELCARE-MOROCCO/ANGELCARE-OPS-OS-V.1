import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { generatePayrollInput } from '@/lib/hr-erp/payroll'
async function POST__angelcareGovernedImpl(req: Request){
  const body = await req.json()
  const rows = await generatePayrollInput(body.periodStart, body.periodEnd)
  return NextResponse.json({ ok: true, rows })
}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/hr/payroll/generate',
  },
  POST__angelcareGovernedImpl,
)
