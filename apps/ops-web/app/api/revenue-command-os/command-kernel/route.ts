import type { NextRequest } from 'next/server'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse,revenueOsSuccess } from '@/lib/revenue-command-os/http'
import { executeRevenueCommandSituation,persistKernelValidation,readRevenueCommandKernel } from '@/lib/revenue-command-os/command-kernel/repository'
import type { RevenueCommandContextValue,RevenueCommandSituation } from '@/lib/revenue-command-os/command-kernel/types'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function GET(){try{const actor=await resolveRevenueOsActor();const result=await readRevenueCommandKernel(actor.tenantId);return revenueOsSuccess(result.bootstrap,{meta:{warnings:result.warnings,mode:'live'}})}catch(error){return revenueOsErrorResponse(error)}}
function contextValues(payload:any):RevenueCommandContextValue[]{
 const now=new Date().toISOString();const raw=Array.isArray(payload.context)?payload.context:[]
 return raw.filter((item:any)=>item&&typeof item==='object'&&item.key).map((item:any)=>({key:String(item.key),state:item.state==='missing'||item.state==='stale'||item.state==='conflicting'?item.state:'available',value:item.value,observedAt:String(item.observedAt||now),source:String(item.source||'operator-input'),reasons:Array.isArray(item.reasons)?item.reasons.map(String):['Contexte fourni par l’opérateur']}))
}
export async function POST(request:NextRequest){try{const body=await request.json().catch(()=>({}));const action=String(body?.action||'execute');const payload=body?.payload||body;const actor=await resolveRevenueOsActor(undefined,{payload});if(action==='execute'||action==='run'||action==='simulate'){
 const requestedCommandCode=String(payload.commandCode||payload.requestedCommandCode||'').trim();if(!requestedCommandCode)throw new RevenueOsError('COMMAND_CODE_REQUIRED','Sélectionnez la commande exacte à exécuter.',{status:422,recoverable:true})
 const context=contextValues(payload);if(!context.length)throw new RevenueOsError('REAL_CONTEXT_REQUIRED','Ajoutez au moins un contexte réel ou vérifié avant exécution.',{status:422,recoverable:true})
 const situation:RevenueCommandSituation={id:String(payload.id||`situation-${Date.now()}`),tenantId:actor.tenantId,organizationId:actor.tenantId,businessUnit:String(payload.businessUnit||'ANGELCARE'),segment:payload.segment?String(payload.segment):undefined,territory:payload.territory?String(payload.territory):undefined,commercialStage:payload.commercialStage?String(payload.commercialStage):undefined,signalType:String(payload.signalType||'manual.live.command'),urgency:Number(payload.urgency||5),opportunityValueDh:Number(payload.opportunityValueDh||0),accountPriority:Number(payload.accountPriority||5),actorId:actor.id,actorRole:actor.role,permissions:['*'],executionMode:'live',context,metadata:{...(payload.metadata||{}),requestedCommandCode,operatorProvidedContext:true}}
 return revenueOsSuccess(await executeRevenueCommandSituation(situation),{status:201,meta:{mode:'live',requestedCommandCode}})
 }
 if(action==='validate')return revenueOsSuccess(await persistKernelValidation(actor.tenantId,actor.id),{status:201,meta:{mode:'live'}})
 throw new RevenueOsError('COMMAND_ACTION_NOT_SUPPORTED','Action Command Kernel non supportée.',{status:405,context:{action}})
 }catch(error){return revenueOsErrorResponse(error)}}
