import { NextResponse } from 'next/server'
import { repairHRSyncIssue } from '@/lib/hr-production/sync-repair'
export async function POST(req: Request) { const issue = await req.json().catch(() => null); if (!issue) return NextResponse.json({ ok:false,error:'issue payload required' }, { status:400 }); const result = await repairHRSyncIssue(issue); return NextResponse.json(result, { status: result.ok ? 200 : 400 }) }
