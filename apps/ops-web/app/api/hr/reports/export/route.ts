import { governRoute } from '@/lib/runtime/governor/route'
import { NextRequest, NextResponse } from 'next/server'
import { buildHRExport } from '@/lib/hr-production/export'

export const dynamic = 'force-dynamic'

async function GET__angelcareGovernedImpl(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'staff'
  const csv = await buildHRExport(type)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="angelcare-hr-${type}.csv"`,
    },
  })
}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/hr/reports/export',
  },
  GET__angelcareGovernedImpl,
)
