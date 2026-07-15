import { NextResponse } from 'next/server'
import { getHRProductionReadiness } from '@/lib/hr-production/production-readiness'
export async function GET() { return NextResponse.json(await getHRProductionReadiness()) }
