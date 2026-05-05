import { NextRequest, NextResponse } from 'next/server'
import { classifyEmail } from '@/lib/email-os/email-os-engine'
export async function POST(req: NextRequest) { const body = await req.json().catch(()=>({})); return NextResponse.json({ ok:true, classification: classifyEmail(body) }) }
