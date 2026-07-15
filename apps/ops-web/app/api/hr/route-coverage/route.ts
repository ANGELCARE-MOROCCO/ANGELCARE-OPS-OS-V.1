import { NextResponse } from 'next/server'
import { getHRRouteCoverage } from '@/lib/hr-production/route-coverage'
export async function GET(){ return NextResponse.json({ routes: getHRRouteCoverage(), checkedAt: new Date().toISOString() }) }
