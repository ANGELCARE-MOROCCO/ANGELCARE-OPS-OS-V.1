import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/getUser'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse } from '@/lib/revenue-command-os/http'
import { actorOf, tenantOf } from '@/lib/revenue-command-os/strategy-studio/api-access'
import { executeStudioAction } from '@/lib/revenue-command-os/strategy-studio/service'
import type { StudioAction } from '@/lib/revenue-command-os/strategy-studio/types'
export const runtime='nodejs';export const dynamic='force-dynamic'
const schema=z.object({action:z.enum(['approve','request_correction','reject']),strategyVersion:z.string().min(1),reason:z.string().min(1).max(4000),conditionsText:z.string().max(4000).optional(),approvalClass:z.string().optional()})
export async function POST(request:NextRequest,{params}:{params:Promise<{strategyId:string}>}){
 const user=await getCurrentUser();if(!user)return revenueOsErrorResponse(new RevenueOsError('UNAUTHENTICATED','Authentification requise.',{status:401}))
 try{const{strategyId}=await params;const parsed=schema.safeParse(await request.json());if(!parsed.success)throw new RevenueOsError('INVALID_DIRECT_DECISION',parsed.error.message,{status:422,recoverable:true})
 const action:StudioAction=parsed.data.action==='request_correction'?'amend':parsed.data.action
 const result=await executeStudioAction({tenantId:tenantOf(user),actor:actorOf(user),action,strategyId,strategyVersion:parsed.data.strategyVersion,reason:parsed.data.reason,approvalClass:'standard',conditions:[],amendment:parsed.data.action==='request_correction'?{requestedCorrection:parsed.data.conditionsText||parsed.data.reason}:undefined,idempotencyKey:request.headers.get('idempotency-key')||crypto.randomUUID()})
 return NextResponse.json({ok:true,data:result,traceId:`direct-decision:${strategyId}:${result.newStatus}`,mode:'live',externalActions:true})
 }catch(error){return revenueOsErrorResponse(error instanceof RevenueOsError?error:new RevenueOsError('DIRECT_DECISION_FAILED','La décision directe n’a pas pu être appliquée.',{status:500,recoverable:true,cause:error}))}
}
