import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { executeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

function resultTargetId(result:any,fallback:any){
 const keys=['partner','handoff','activation','issue','renewal','tender','opportunity','prospect','context','followup','meeting','recommendation','assessment','forecast','override','risk','intervention','qualityAssessment','pattern','coaching','snapshot','report','automation','approval','run','killSwitch']
 for(const key of keys) if(result?.[key]?.id)return result[key].id
 return fallback||null
}

export async function POST(req:NextRequest){
 const auth=await authenticateExtensionRequest(req); if(!auth.ok)return auth.response
 const body=await req.json().catch(()=>({})); const commandKey=String(body.commandKey||''); const idempotencyKey=String(body.idempotencyKey||''); const sourceAdapter=body.sourceAdapter?String(body.sourceAdapter):null
 if(!commandKey||!idempotencyKey)return NextResponse.json({ok:false,error:'commandKey and idempotencyKey are required.'},{status:400})
 const decision=await authorizeB2BIntelligenceCommand(auth.db,auth.context.user.id,{commandKey,sourceAdapter}); if(!decision.ok)return NextResponse.json({ok:false,error:decision.error},{status:decision.status})
 const existing=await auth.db.from('browser_extension_command_requests').select('*,result:browser_extension_command_results(*)').eq('user_id',auth.context.user.id).eq('idempotency_key',idempotencyKey).maybeSingle()
 if(existing.data?.execution_status==='executed')return NextResponse.json({ok:true,replayed:true,command:existing.data,result:existing.data.result?.[0]?.result_payload||{}})
 const payload=body.payload&&typeof body.payload==='object'?body.payload:{}; const payloadHash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'); const approvalRequired=decision.mode==='MANAGER_APPROVAL'||Boolean(decision.approval)
 const row={idempotency_key:idempotencyKey,device_id:auth.context.device.id,user_id:auth.context.user.id,module_key:'revenue_b2b',command_key:commandKey,source_adapter:sourceAdapter,source_origin:body.sourceOrigin||null,target_type:body.targetType||null,target_id:body.targetId||null,autonomy_mode:decision.mode,approval_status:approvalRequired?'required':'not_required',execution_status:approvalRequired?'approval_required':'executing',payload_hash:payloadHash,payload}
 const {data:command,error:prepareError}=await auth.db.from('browser_extension_command_requests').upsert(row,{onConflict:'user_id,idempotency_key'}).select('*').single()
 if(prepareError)return NextResponse.json({ok:false,error:'Unable to register extension command.'},{status:500})
 if(approvalRequired){await writeExtensionAudit(auth.db,{actor:auth.context.user,deviceId:auth.context.device.id,eventType:'command_approval_required',moduleKey:'revenue_b2b',commandKey,result:'pending',sourceOrigin:body.sourceOrigin||null,metadata:{commandId:command.id}});return NextResponse.json({ok:true,approvalRequired:true,command},{status:202})}
 try{
  const result=await executeB2BIntelligenceCommand({db:auth.db,actor:auth.context.user,device:auth.context.device,access:decision.access,commandKey,payload})
  await auth.db.from('browser_extension_command_requests').update({execution_status:'executed',executed_at:new Date().toISOString(),target_id:resultTargetId(result,body.targetId)}).eq('id',command.id)
  await auth.db.from('browser_extension_command_results').insert({command_request_id:command.id,result:'success',result_payload:result})
  await writeExtensionAudit(auth.db,{actor:auth.context.user,deviceId:auth.context.device.id,eventType:'command_executed',moduleKey:'revenue_b2b',commandKey,targetType:body.targetType||null,targetId:resultTargetId(result,body.targetId),result:'ok',sourceOrigin:body.sourceOrigin||null,metadata:{commandId:command.id,acceptanceId:decision.definition.acceptanceId,autonomy:decision.mode}})
  return NextResponse.json({ok:true,command:{...command,execution_status:'executed'},result})
 }catch(e:any){const status=Number(e?.status||500);await auth.db.from('browser_extension_command_requests').update({execution_status:'failed',executed_at:new Date().toISOString()}).eq('id',command.id);await auth.db.from('browser_extension_command_results').insert({command_request_id:command.id,result:'failed',error_code:String(e?.message||'EXECUTION_FAILED'),result_payload:{details:e?.details||null}});await writeExtensionAudit(auth.db,{actor:auth.context.user,deviceId:auth.context.device.id,eventType:'command_failed',moduleKey:'revenue_b2b',commandKey,result:'error',severity:status>=500?'error':'warning',sourceOrigin:body.sourceOrigin||null,metadata:{commandId:command.id,error:String(e?.message||e),details:e?.details||null}});return NextResponse.json({ok:false,error:String(e?.message||'EXECUTION_FAILED'),details:e?.details||null},{status})}
}
