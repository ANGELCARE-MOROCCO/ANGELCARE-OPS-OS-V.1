import { NextResponse } from 'next/server'
import { listServiceOSRules, upsertServiceOSRecord } from '@/lib/service-os/production/repository'
export async function GET() { return NextResponse.json({ data: await listServiceOSRules() }) }
export async function POST(request: Request) { return NextResponse.json({ data: await upsertServiceOSRecord('serviceos_rules', await request.json()) }) }
