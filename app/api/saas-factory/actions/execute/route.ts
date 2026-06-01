import { NextResponse } from 'next/server'
import { executeFactoryAction } from '../../../../../lib/saas-factory/actions-runtime'
export const dynamic = 'force-dynamic'
export async function POST(request:Request){try{return NextResponse.json(await executeFactoryAction(await request.json()))}catch(error){return NextResponse.json({ok:false,message:error instanceof Error?error.message:'Action execution failed.'},{status:200})}}
