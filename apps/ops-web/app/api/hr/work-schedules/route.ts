import { NextRequest, NextResponse } from 'next/server'
import { getWorkSchedulesCommandData } from '@/lib/hr-production/work-schedules-command'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const data = await getWorkSchedulesCommandData({
    date: searchParams.get('date'),
    view: searchParams.get('view') || 'week',
  })

  return NextResponse.json({ ok: true, live: true, module: 'hr-work-schedules', data })
}
