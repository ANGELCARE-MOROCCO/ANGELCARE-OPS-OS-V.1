import {NextRequest,NextResponse} from 'next/server'
import crypto from 'node:crypto'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError,tenantOf} from '@/lib/revenue-command-os/ai/api-access'
import {runGeminiStrategyAssembly} from '@/lib/revenue-command-os/strategy-brain/ai-orchestration'
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=300
export async function POST(request:NextRequest){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).generate)return apiError('FORBIDDEN','Permission de génération stratégique requise.',403);try{const body=await request.json();const objective={...body.objective,tenantId:tenantOf(user,body.objective),requestedBy:String(user.id||user.email||'current-user'),id:body.objective?.id||crypto.randomUUID(),status:'ready_for_assembly'};const data=await runGeminiStrategyAssembly({objective,userId:String(user.id||user.email||'current-user'),idempotencyKey:request.headers.get('idempotency-key')||body.idempotencyKey});return NextResponse.json({ok:true,data,mode:'shadow',externalActions:false},{status:201})}catch(error){const anyError=error as {status?:number;message?:string};return apiError('STRATEGY_GENERATION_FAILED',String(anyError.message||error),Number(anyError.status||500))}}
