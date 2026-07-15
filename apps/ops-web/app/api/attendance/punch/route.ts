import { NextRequest, NextResponse } from 'next/server'
import { POST as hrAttendancePunchPost } from '../../hr/attendance/punch/route'

export const dynamic = 'force-dynamic'

// Compatibility route used by the overhead ERP panel.
// The production write path remains /api/hr/attendance/punch.
export async function POST(request: NextRequest) {
  return hrAttendancePunchPost(request)
}

// Keep GET available so legacy status checks and build-time route scans do not fail.
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/attendance/punch',
    compatibility: true,
    source: '/api/hr/attendance/punch',
    methods: ['GET', 'POST'],
    timestamp: new Date().toISOString(),
  })
}
