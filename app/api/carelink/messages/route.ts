import { NextResponse } from 'next/server'
import { getCareLinkThreads } from '@/lib/carelink/repository'
export const dynamic = 'force-dynamic'
export async function GET(){ return NextResponse.json({ ok:true, data: await getCareLinkThreads() }) }
export async function POST(request: Request){ const body = await request.json().catch(()=>({})); return NextResponse.json({ ok:true, data:{ id:`msg-${Date.now()}`, ...body } }) }
