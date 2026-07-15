import { NextResponse } from 'next/server'
import { listServiceOSModules, upsertServiceOSRecord } from '@/lib/service-os/production/repository'
export async function GET() { return NextResponse.json({ data: await listServiceOSModules() }) }
export async function POST(request: Request) { return NextResponse.json({ data: await upsertServiceOSRecord('serviceos_modules', await request.json()) }) }
