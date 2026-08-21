import { governRoute } from '@/lib/runtime/governor/route'
import {NextRequest,NextResponse} from 'next/server'
import crypto from 'node:crypto'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError,tenantOf} from '@/lib/revenue-command-os/ai/api-access'
import {runGeminiStrategyAssembly} from '@/lib/revenue-command-os/strategy-brain/ai-orchestration'
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=300
async function POST__angelcareGovernedImpl(request:NextRequest){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);try{const body=await request.json();const objective={...body.objective,tenantId:tenantOf(user,body.objective),requestedBy:String(user.id||user.email||'current-user'),id:body.objective?.id||crypto.randomUUID(),status:'active'};const data=await runGeminiStrategyAssembly({objective,userId:String(user.id||user.email||'current-user'),idempotencyKey:request.headers.get('idempotency-key')||body.idempotencyKey});return NextResponse.json({ok:true,data,mode:'live',externalActions:true},{status:201})}catch(error){const anyError=error as {status?:number;message?:string};return apiError('STRATEGY_GENERATION_FAILED',String(anyError.message||error),Number(anyError.status||500))}}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/revenue-command-os/strategy-engine/generate',
  },
  POST__angelcareGovernedImpl,
)
