import { NextResponse } from 'next/server'
import { executeOneAction } from '@/lib/revenue-command-os/execution-autopilot/service'
import { loadAction } from '@/lib/revenue-command-os/execution-autopilot/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const secret=request.headers.get('authorization')?.replace(/^Bearer\s+/,'');if(!process.env.CRON_SECRET||secret!==process.env.CRON_SECRET)return NextResponse.json({ok:false,error:'UNAUTHORIZED'},{status:401});const body=await request.json() as {tenantId?:string;actionId?:string};if(!body.actionId)return NextResponse.json({ok:false,error:'ACTION_ID_REQUIRED'},{status:400});const action=await loadAction(String(body.tenantId||'angelcare'),body.actionId);const result=await executeOneAction(action);return NextResponse.json({ok:true,data:result})}
