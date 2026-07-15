import { NextResponse } from 'next/server'
import { getApisSummary } from '../../../../../lib/saas-factory/apis-runtime'
export const dynamic = 'force-dynamic'
export async function GET(){try{return NextResponse.json(await getApisSummary())}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'APIs summary failed'},{status:200})}}
