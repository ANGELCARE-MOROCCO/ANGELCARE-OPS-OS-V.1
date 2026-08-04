import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executePayrollSovereignCommand, getPayrollSovereignSnapshot } from '@/lib/angelcare360/server/payroll-sovereign'
import type { PayrollCommandRequest, PayrollSovereignScene } from '@/types/angelcare360/payroll-sovereign'
export const runtime='nodejs';export const dynamic='force-dynamic'
const scenes=new Set(['command','workforce','compensation','inputs','production','delivery','compliance'])
export async function GET(request:NextRequest){try{const raw=request.nextUrl.searchParams.get('scene')||'command';const scene=(scenes.has(raw)?raw:'command') as PayrollSovereignScene;const snapshot=await getPayrollSovereignSnapshot(scene);return NextResponse.json({ok:Boolean(snapshot),snapshot},{status:snapshot?200:404})}catch(error){const status=error instanceof Angelcare360AccessError?error.status:500;return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Erreur paie.'},{status})}}
export async function POST(request:NextRequest){try{const body=await request.json() as PayrollCommandRequest;if(!body?.operationKey)return NextResponse.json({ok:false,error:'operationKey est requis.'},{status:422});const result=await executePayrollSovereignCommand(body);return NextResponse.json(result,{status:result.ok?200:409})}catch(error){const status=error instanceof Angelcare360AccessError?error.status:500;return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Erreur paie.'},{status})}}
