import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApproval, decideApproval } from '@/lib/hr-production/action-completion'

export const dynamic = 'force-dynamic'

const attempts = ['hr_approval_requests', 'hr_approvals', 'approval_requests']

export async function GET() {
  const supabase = await createClient()
  const errors: string[] = []
  for (const table of attempts) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(300)
      if (!error) return NextResponse.json({ ok: true, table, approvals: data || [] })
      errors.push(`${table}: ${error.message}`)
    } catch (err: any) { errors.push(`${table}: ${err?.message || String(err)}`) }
  }
  return NextResponse.json({ ok: true, table: null, approvals: [], warnings: errors })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const decision = body.decision || body.status
    const result = body.id || body.approval_id || decision ? await decideApproval(body) : await createApproval(body)
    return NextResponse.json({ ok: Boolean(result.ok), result }, { status: result.ok ? 200 : 500 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Approval action failed' }, { status: 500 })
  }
}
