import { NextResponse } from 'next/server'
import { getActionsSummary } from '../../../../../lib/saas-factory/actions-runtime'
export const dynamic = 'force-dynamic'
export async function GET(){try{return NextResponse.json(await getActionsSummary())}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Actions summary failed'},{status:200})}}
