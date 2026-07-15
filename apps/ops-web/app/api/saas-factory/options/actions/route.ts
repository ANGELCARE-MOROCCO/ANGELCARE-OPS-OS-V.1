import { NextResponse } from 'next/server'
import { runOptionsAction } from '../../../../../lib/saas-factory/options-runtime'
export const dynamic = 'force-dynamic'
export async function POST(request:Request){try{return NextResponse.json(await runOptionsAction(await request.json()))}catch(error){return NextResponse.json({ok:false,message:error instanceof Error?error.message:'Action failed'},{status:200})}}
