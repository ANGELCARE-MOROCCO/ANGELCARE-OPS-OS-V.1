import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { executeB2BExecutionCommand } from './service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function handleB2BExecutionRoute(req:NextRequest,commandKey:string,payloadOverride?:Record<string,unknown>){
  const auth=await authenticateExtensionRequest(req)
  if(!auth.ok)return auth.response
  const body=req.method==='GET'?Object.fromEntries(new URL(req.url).searchParams.entries()):await req.json().catch(()=>({}))
  const payload={...(body?.payload&&typeof body.payload==='object'?body.payload:body),...(payloadOverride||{})}
  const sourceAdapter=body?.sourceAdapter?String(body.sourceAdapter):null
  const decision=await authorizeB2BIntelligenceCommand(auth.db,auth.context.user.id,{commandKey,sourceAdapter})
  if(!decision.ok)return NextResponse.json({ok:false,error:decision.error},{status:decision.status})
  if(decision.mode==='MANAGER_APPROVAL'||decision.approval)return NextResponse.json({ok:true,approvalRequired:true,commandKey},{status:202})
  try{
    const result=await executeB2BExecutionCommand({db:auth.db,actor:auth.context.user,device:auth.context.device,access:decision.access,commandKey,payload})
    await writeExtensionAudit(auth.db,{actor:auth.context.user,deviceId:auth.context.device.id,eventType:'domain_route_executed',moduleKey:'revenue_b2b',commandKey,result:'ok',sourceOrigin:body?.sourceOrigin||null,metadata:{acceptanceId:decision.definition.acceptanceId}})
    return NextResponse.json({ok:true,result})
  }catch(error:any){return NextResponse.json({ok:false,error:String(error?.message||'EXECUTION_FAILED'),details:error?.details||null},{status:Number(error?.status||500)})}
}
