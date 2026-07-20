import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { normalizeRevenueOsError, RevenueOsError } from '@/lib/revenue-command-os/errors'
import {
  createRevenueSignalContext, ingestRevenueSignal, persistRevenueSignalValidation, readRevenueSignalFabric,
  runAllRevenueSignalScans, runRevenueSignalSourceScan, updateRevenueSignalSourceStatus,
  updateRevenueSignalStatus, updateRevenueSignalValidationStatus,
} from '@/lib/revenue-command-os/signal-fabric/repository'
import type { RevenueSignalContextSnapshot, RevenueSignalIngestionInput, RevenueSignalSource, RevenueSignalValidationIssue } from '@/lib/revenue-command-os/types'

export const dynamic='force-dynamic'
export const runtime='nodejs'

function permissions(user:any) {
  const role=String(user?.role||user?.role_key||'').toLowerCase()
  const list=Array.isArray(user?.permissions)?user.permissions.map(String):[]
  const all=['ceo','direction','admin'].includes(role)||list.includes('*')
  return {
    read:all||list.includes('revenue_os.view')||list.includes('revenue.view')||list.includes('revenue_os.signals.manage'),
    manage:all||list.includes('revenue_os.signals.manage')||list.includes('revenue_os.manage'),
    ingest:all||list.includes('revenue_os.signals.ingest')||list.includes('revenue_os.signals.manage'),
    audit:all||list.includes('revenue_os.signals.audit')||list.includes('revenue_os.audit.view'),
  }
}
function actor(user:any){return{id:String(user?.id||''),label:String(user?.name||user?.full_name||user?.email||'Direction Revenue'),role:String(user?.role||'')}}
function errorResponse(error:unknown){const e=normalizeRevenueOsError(error);return NextResponse.json({ok:false,error:{code:e.code,message:e.message,recoverable:e.recoverable}},{status:e.status})}

export async function GET(){
  try { const user=await getCurrentUser(); if(!user)return NextResponse.json({ok:false,error:{code:'UNAUTHENTICATED',message:'Authentification requise.'}},{status:401}); if(!permissions(user).read)return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Accès Signal Fabric refusé.'}},{status:403}); const {bootstrap,warnings}=await readRevenueSignalFabric(); return NextResponse.json({ok:true,data:bootstrap,warnings},{headers:{'Cache-Control':'no-store'}}) } catch(error){return errorResponse(error)}
}

export async function POST(request:NextRequest){
  try {
    const user=await getCurrentUser(); if(!user)return NextResponse.json({ok:false,error:{code:'UNAUTHENTICATED',message:'Authentification requise.'}},{status:401})
    const rights=permissions(user); const body=await request.json(); const action=String(body?.action||'')
    if(action==='ingest_event') {
      if(!rights.ingest)return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Permission d’ingestion requise.'}},{status:403})
      const payload=body?.payload||{}; const input:RevenueSignalIngestionInput={sourceCode:String(payload.sourceCode||''),sourceRecordId:payload.sourceRecordId?String(payload.sourceRecordId):undefined,eventType:String(payload.eventType||''),occurredAt:payload.occurredAt?String(payload.occurredAt):undefined,payload:payload.data&&typeof payload.data==='object'?payload.data:{},correlationId:payload.correlationId?String(payload.correlationId):undefined}
      return NextResponse.json({ok:true,data:await ingestRevenueSignal(input,actor(user))},{status:201})
    }
    if(!rights.manage)return NextResponse.json({ok:false,error:{code:'FORBIDDEN',message:'Permission de gestion Signal Fabric requise.'}},{status:403})
    if(action==='run_source_scan'){const sourceCode=String(body?.payload?.sourceCode||'');if(!sourceCode)throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT','Source requise.',{status:400});return NextResponse.json({ok:true,data:await runRevenueSignalSourceScan(sourceCode,actor(user))})}
    if(action==='run_all_scans')return NextResponse.json({ok:true,data:await runAllRevenueSignalScans(actor(user))})
    if(action==='update_signal_status'){const id=String(body?.payload?.id||'');const status=String(body?.payload?.status||'') as any;if(!id)throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT','Signal requis.',{status:400});return NextResponse.json({ok:true,data:await updateRevenueSignalStatus(id,status,actor(user))})}
    if(action==='build_context'){const id=String(body?.payload?.signalId||'');const audienceRole=String(body?.payload?.audienceRole||'Direction Revenue');const visibilityProfile=String(body?.payload?.visibilityProfile||'revenue-manager') as RevenueSignalContextSnapshot['visibilityProfile'];if(!id)throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT','Signal requis.',{status:400});return NextResponse.json({ok:true,data:await createRevenueSignalContext(id,audienceRole,visibilityProfile,actor(user))},{status:201})}
    if(action==='run_validation')return NextResponse.json({ok:true,data:await persistRevenueSignalValidation(actor(user))})
    if(action==='update_validation_status'){const id=String(body?.payload?.id||'');const status=String(body?.payload?.status||'') as RevenueSignalValidationIssue['status'];if(!id)throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT','Point de validation requis.',{status:400});return NextResponse.json({ok:true,data:await updateRevenueSignalValidationStatus(id,status,actor(user))})}
    if(action==='update_source_status'){const id=String(body?.payload?.id||'');const status=String(body?.payload?.status||'') as RevenueSignalSource['status'];if(!id)throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT','Source requise.',{status:400});return NextResponse.json({ok:true,data:await updateRevenueSignalSourceStatus(id,status,actor(user))})}
    throw new RevenueOsError('REVENUE_SIGNAL_ACTION_NOT_ALLOWED','Action Signal Fabric non supportée.',{status:400})
  } catch(error){return errorResponse(error)}
}
