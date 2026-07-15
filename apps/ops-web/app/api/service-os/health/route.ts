import { NextResponse } from 'next/server'
import { getServiceOSHealthCheck } from '@/lib/service-os/production/health-check'
export async function GET() { return NextResponse.json({ data: await getServiceOSHealthCheck() }) }
