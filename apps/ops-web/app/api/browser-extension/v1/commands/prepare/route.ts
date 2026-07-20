import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeExtensionCommand } from '@/lib/browser-extension/authorization'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'
export async function POST(req:NextRequest){
 const auth=await authenticateExtensionRequest(req); if(!auth.ok)return auth.response
 const body=await req.json().catch(()=>({})); const moduleKey=String(body.moduleKey||''); const commandKey=String(body.commandKey||''); const idempotencyKey=String(body.idempotencyKey||'')
 if(!moduleKey||!commandKey||!idempotencyKey)return NextResponse.json({ok:false,error:'moduleKey, commandKey and idempotencyKey are required.'},{status:400})
 const decision=await authorizeExtensionCommand(auth.db,auth.context.user.id,{moduleKey,commandKey,sourceAdapter:body.sourceAdapter||null}); if(!decision.ok)return NextResponse.json({ok:false,error:decision.error},{status:decision.status})
 const payload=body.payload&&typeof body.payload==='object'?body.payload:{}; const payloadHash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'); const approvalRequired=decision.mode==='MANAGER_APPROVAL'||Boolean(decision.approval)
 const row={idempotency_key:idempotencyKey,device_id:auth.context.device.id,user_id:auth.context.user.id,module_key:moduleKey,command_key:commandKey,source_adapter:body.sourceAdapter||null,source_origin:body.sourceOrigin||null,target_type:body.targetType||null,target_id:body.targetId||null,autonomy_mode:decision.mode,approval_status:approvalRequired?'required':'not_required',execution_status:approvalRequired?'approval_required':'prepared',payload_hash:payloadHash,payload}
 const {data,error}=await auth.db.from('browser_extension_command_requests').upsert(row,{onConflict:'user_id,idempotency_key',ignoreDuplicates:true}).select('*').maybeSingle()
 if(error)return NextResponse.json({ok:false,error:'Unable to prepare extension command.'},{status:500})
 const command=data||await auth.db.from('browser_extension_command_requests').select('*').eq('user_id',auth.context.user.id).eq('idempotency_key',idempotencyKey).maybeSingle().then((r:any)=>r.data)
 await writeExtensionAudit(auth.db,{actor:auth.context.user,deviceId:auth.context.device.id,eventType:'command_prepared',moduleKey,commandKey,targetType:body.targetType||null,targetId:body.targetId||null,result:'ok',sourceOrigin:body.sourceOrigin||null,metadata:{contractId:decision.contract.contractId,autonomy:decision.mode,approvalRequired,idempotencyKey}})
 return NextResponse.json({ok:true,command,authorization:{contractId:decision.contract.contractId,capability:decision.contract.permission,autonomy:decision.mode,approvalRequired}})
}
