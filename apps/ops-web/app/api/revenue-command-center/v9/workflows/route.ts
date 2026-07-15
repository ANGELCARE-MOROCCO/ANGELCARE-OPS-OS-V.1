import { NextRequest, NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ ok: true, workflows: ['intake_owner_sla', 'risk_escalation', 'manager_approval', 'followup_recovery', 'automation_audit'] }) }
export async function POST(req: NextRequest) { const payload = await req.json().catch(()=>({})); return NextResponse.json({ ok: true, workflow: { id: `workflow-${Date.now()}`, ...payload } }) }
