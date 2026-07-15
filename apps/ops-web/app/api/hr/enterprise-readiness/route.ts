import { NextResponse } from 'next/server'
import { getHREnterpriseReadiness } from '@/lib/hr-enterprise/readiness'
export async function GET(){ return NextResponse.json(await getHREnterpriseReadiness()) }
