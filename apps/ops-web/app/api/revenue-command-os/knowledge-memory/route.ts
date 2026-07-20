import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { normalizeRevenueOsError, RevenueOsError } from '@/lib/revenue-command-os/errors'
import {
  decideKnowledgeApproval,
  mutateRevenueDoctrine,
  persistKnowledgeValidation,
  queueKnowledgeIndexJob,
  readRevenueKnowledgeMemory,
  resolveKnowledgeConflict,
  updateKnowledgeValidationStatus,
} from '@/lib/revenue-command-os/knowledge-memory/repository'
import type {
  RevenueDoctrineMutationInput,
  RevenueKnowledgeApprovalDecision,
  RevenueKnowledgeConflictStatus,
  RevenueKnowledgeValidationIssue,
} from '@/lib/revenue-command-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function permissions(user: any) {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  const entries = Array.isArray(user?.permissions) ? user.permissions.map(String) : []
  const all = ['ceo','direction','admin'].includes(role) || entries.includes('*')
  return {
    read: all || entries.includes('revenue_os.view') || entries.includes('revenue.view') || entries.includes('revenue_os.knowledge.manage'),
    manage: all || entries.includes('revenue_os.knowledge.manage') || entries.includes('revenue_os.manage'),
    approve: all || entries.includes('revenue_os.knowledge.approve') || entries.includes('revenue_os.approvals.manage'),
  }
}
function actor(user: any) { return { id:String(user?.id || ''), label:String(user?.name || user?.full_name || user?.email || 'Direction Revenue') } }
function errorResponse(error: unknown) { const e=normalizeRevenueOsError(error); return NextResponse.json({ok:false,error:{code:e.code,message:e.message,recoverable:e.recoverable}},{status:e.status}) }

export async function GET() {
  try {
    const user=await getCurrentUser(); if(!user) return NextResponse.json({ok:false,error:{code:'UNAUTHENTICATED',message:'Authentification requise.'}},{status:401})
    if(!permissions(user).read) return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Accès Doctrine & mémoire refusé.'}},{status:403})
    const {bootstrap,warnings}=await readRevenueKnowledgeMemory()
    return NextResponse.json({ok:true,data:bootstrap,warnings},{headers:{'Cache-Control':'no-store'}})
  } catch(error) { return errorResponse(error) }
}

export async function POST(request: NextRequest) {
  try {
    const user=await getCurrentUser(); if(!user) return NextResponse.json({ok:false,error:{code:'UNAUTHENTICATED',message:'Authentification requise.'}},{status:401})
    const rights=permissions(user); const body=await request.json(); const action=String(body?.action || '')
    if(!rights.manage) return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Permission de gestion Doctrine & mémoire requise.'}},{status:403})

    if(action==='mutate_doctrine') {
      const payload=body?.payload || {}
      const input: RevenueDoctrineMutationInput={operation:payload.operation,id:typeof payload.id==='string'?payload.id:undefined,payload:payload.data && typeof payload.data==='object'?payload.data:{}}
      if(['approve','reject','activate','suspend','retire'].includes(input.operation) && !rights.approve) return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Permission d’approbation doctrinale requise.'}},{status:403})
      const data=await mutateRevenueDoctrine(input,actor(user)); return NextResponse.json({ok:true,data},{status:input.operation==='create'?201:200})
    }
    if(action==='decide_approval') {
      if(!rights.approve) return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Permission d’approbation requise.'}},{status:403})
      const id=String(body?.payload?.id || ''); const decision=body?.payload?.decision as RevenueKnowledgeApprovalDecision; const rationale=String(body?.payload?.rationale || '')
      if(!id) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Dossier d’approbation requis.',{status:400})
      return NextResponse.json({ok:true,data:await decideKnowledgeApproval(id,decision,rationale,actor(user))})
    }
    if(action==='resolve_conflict') {
      if(!rights.approve) return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Permission de résolution requise.'}},{status:403})
      const id=String(body?.payload?.id || ''); const status=body?.payload?.status as RevenueKnowledgeConflictStatus; const resolution=String(body?.payload?.resolution || '')
      if(!id) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Conflit requis.',{status:400})
      return NextResponse.json({ok:true,data:await resolveKnowledgeConflict(id,status,resolution,actor(user))})
    }
    if(action==='queue_index') {
      const assetId=String(body?.payload?.assetId || ''); if(!assetId) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Actif requis.',{status:400})
      return NextResponse.json({ok:true,data:await queueKnowledgeIndexJob(assetId,actor(user))},{status:201})
    }
    if(action==='run_validation') return NextResponse.json({ok:true,data:await persistKnowledgeValidation(actor(user))})
    if(action==='update_validation_status') {
      const id=String(body?.payload?.id || ''); const status=body?.payload?.status as RevenueKnowledgeValidationIssue['status']; if(!id) throw new RevenueOsError('REVENUE_KNOWLEDGE_INVALID_INPUT','Point de validation requis.',{status:400})
      return NextResponse.json({ok:true,data:await updateKnowledgeValidationStatus(id,status,actor(user))})
    }
    throw new RevenueOsError('REVENUE_KNOWLEDGE_ACTION_NOT_ALLOWED','Action Doctrine & mémoire non supportée.',{status:400})
  } catch(error) { return errorResponse(error) }
}
