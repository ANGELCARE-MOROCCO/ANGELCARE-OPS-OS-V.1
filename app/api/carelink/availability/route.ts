import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(){ return NextResponse.json({ ok:true, data:{ status:'available', blocks:[{ day:'today', start:'08:00', end:'19:30' }] } }) }
export async function POST(request: Request){ const body=await request.json().catch(()=>({})); return NextResponse.json({ ok:true, data:{ saved:true, ...body } }) }
