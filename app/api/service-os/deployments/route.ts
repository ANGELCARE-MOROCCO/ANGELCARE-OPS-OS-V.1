import { NextResponse } from 'next/server'
import { listServiceOSCityDeployments, upsertServiceOSRecord } from '@/lib/service-os/production/repository'
export async function GET() { return NextResponse.json({ data: await listServiceOSCityDeployments() }) }
export async function POST(request: Request) { return NextResponse.json({ data: await upsertServiceOSRecord('serviceos_city_deployments', await request.json()) }) }
