import { NextResponse } from 'next/server'
import { executeApiOperation } from '../../../../../lib/saas-factory/apis-runtime'
export const dynamic = 'force-dynamic'
export async function POST(request:Request){try{return NextResponse.json(await executeApiOperation(await request.json()))}catch(error){return NextResponse.json({ok:false,message:error instanceof Error?error.message:'API operation failed.'},{status:200})}}
