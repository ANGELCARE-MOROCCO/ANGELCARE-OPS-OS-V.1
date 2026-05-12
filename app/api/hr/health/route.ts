import { NextResponse } from 'next/server'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRProductionMetrics, getHRProductionScore } from '@/lib/hr-production/metrics'

export async function GET() {
  const data = await getHRDashboardData()
  return NextResponse.json({
    ok: true,
    score: getHRProductionScore(data),
    metrics: getHRProductionMetrics(data),
    errors: data.errors,
    checkedAt: new Date().toISOString(),
  })
}
