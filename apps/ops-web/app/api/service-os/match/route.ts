import { NextResponse } from 'next/server'
import { listServiceOSBlueprints, listServiceOSCityDeployments } from '@/lib/service-os/production/repository'
import { rankServiceOSBlueprints } from '@/lib/service-os/production/matching-engine'
export async function POST(request: Request) { const body = await request.json(); return NextResponse.json({ data: rankServiceOSBlueprints(body, await listServiceOSBlueprints(), await listServiceOSCityDeployments()) }) }
