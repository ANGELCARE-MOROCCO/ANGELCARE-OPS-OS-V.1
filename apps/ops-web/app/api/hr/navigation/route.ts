import { NextResponse } from 'next/server'
import { getHRNavigationForRole, type HRRole } from '@/lib/hr-production/permissions-navigation'
export async function GET(req: Request) { const role = (new URL(req.url).searchParams.get('role') || 'hr_admin') as HRRole; return NextResponse.json({ ok: true, role, items: getHRNavigationForRole(role) }) }
