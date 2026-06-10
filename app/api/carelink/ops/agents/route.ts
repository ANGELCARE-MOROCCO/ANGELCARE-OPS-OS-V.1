import { NextResponse } from 'next/server'
import { getCareLinkOpsDashboard } from '@/lib/carelink/repository'
export const dynamic = 'force-dynamic'
export async function GET(){ const data = await getCareLinkOpsDashboard(); return NextResponse.json({ ok:true, section:'agents', data }) }
