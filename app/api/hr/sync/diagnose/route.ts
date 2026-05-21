import { NextResponse } from 'next/server'
import { diagnoseHRSync } from '@/lib/hr-production/sync-repair'
export async function GET() { return NextResponse.json(await diagnoseHRSync()) }
