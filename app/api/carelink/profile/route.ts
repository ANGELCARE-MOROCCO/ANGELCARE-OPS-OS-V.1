import { NextResponse } from 'next/server'
import { getCareLinkAgent } from '@/lib/carelink/repository'
export const dynamic = 'force-dynamic'
export async function GET(){ return NextResponse.json({ ok:true, data: await getCareLinkAgent() }) }
