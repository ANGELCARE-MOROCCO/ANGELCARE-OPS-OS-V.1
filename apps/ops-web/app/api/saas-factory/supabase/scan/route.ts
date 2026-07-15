import { NextResponse } from 'next/server'
import { executeSupabaseOperation } from '../../../../../lib/saas-factory/supabase-runtime'
export const dynamic = 'force-dynamic'
export async function POST(){return NextResponse.json(await executeSupabaseOperation({operation:'live_scan'}))}
