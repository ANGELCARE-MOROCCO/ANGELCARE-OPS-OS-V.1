import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { actorOf, canApproveClass, studioError, studioRights, tenantOf } from './api-access'
import { studioActionSchema } from './schemas'
import { executeStudioAction } from './service'
import type { ApprovalCondition, StudioAction } from './types'

export async function handleStudioAction(request:NextRequest,expectedAction:StudioAction){
  const user=await getCurrentUser();if(!user)return studioError('UNAUTHENTICATED','Authentification requise.',401)
  const rights=studioRights(user);if(!rights.review)return studioError('FORBIDDEN','Permission Strategy Studio requise.',403)
  try{
    const raw=await request.json();const parsed=studioActionSchema.safeParse({...raw,action:expectedAction});if(!parsed.success)return studioError('INVALID_STUDIO_ACTION',parsed.error.message,422)
    if(expectedAction==='approve'&&!canApproveClass(user,parsed.data.approvalClass||'standard'))return studioError('APPROVAL_AUTHORITY_INSUFFICIENT','Autorité d’approbation insuffisante.',403)
    if(expectedAction==='change_approval_class'&&!rights.manageClass)return studioError('FORBIDDEN','Gestion de classe d’approbation interdite.',403)
    if(expectedAction==='export_memo'&&!rights.exportMemo)return studioError('FORBIDDEN','Export de note interdit.',403)
    const tenantId=tenantOf(user,raw);const conditions:ApprovalCondition[]|undefined=parsed.data.conditions?.map(condition=>({...condition,id:condition.id??crypto.randomUUID()}));const data=await executeStudioAction({tenantId,actor:actorOf(user),...parsed.data,conditions,idempotencyKey:request.headers.get('idempotency-key')||raw.idempotencyKey||crypto.randomUUID()})
    return NextResponse.json({ok:true,data,mode:'shadow',externalActions:0},{status:201})
  }catch(error){return studioError('STRATEGY_STUDIO_ACTION_FAILED',error instanceof Error?error.message:String(error),500)}
}
