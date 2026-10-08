import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, requireAngelcare360Permission } from '@/lib/angelcare360/server'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import { executeProductRealityCommand } from '@/lib/angelcare360/server/product-reality'
import type { AcademicAuthorityEntity } from '@/types/angelcare360/customer-academic-authority'

export const runtime = 'nodejs'
type Body={entity?:AcademicAuthorityEntity;operation?:'create'|'resolve';id?:string;payload?:Record<string,unknown>}
const TABLES:Record<AcademicAuthorityEntity,string>={
  'attendance-correction':'angelcare360_attendance_correction_requests','day-closure':'angelcare360_attendance_day_closures','timetable-publication':'angelcare360_timetable_publication_runs','grade-correction':'angelcare360_grade_correction_requests','academic-validation':'angelcare360_academic_validation_batches','report-card-publication':'angelcare360_report_card_publication_runs',
}
const RESOLVE_OPERATIONS:Record<AcademicAuthorityEntity,string>={
  'attendance-correction':'attendance.correction.approve',
  'day-closure':'attendance.close',
  'timetable-publication':'timetable.publish',
  'grade-correction':'grade.correction.approve',
  'academic-validation':'academic.validation.complete',
  'report-card-publication':'report_card.publish',
}
function string(payload:Record<string,unknown>,key:string){const value=payload[key];return value===null||value===undefined?null:String(value)}
function permission(entity:AcademicAuthorityEntity){if(entity==='attendance-correction'||entity==='day-closure')return 'attendance.update';if(entity==='timetable-publication')return 'emploi_du_temps.update';return 'academics.update'}

export async function POST(request:NextRequest){
  try{
    const body=(await request.json().catch(()=>null)) as Body|null
    if(!body?.entity||!body.operation||!TABLES[body.entity])return NextResponse.json({ok:false,error:'La demande académique est incomplète.'},{status:422})
    const context=await requireAngelcare360Permission(permission(body.entity))
    if(!context.school)return NextResponse.json({ok:false,error:'Établissement actif introuvable.'},{status:403})
    const client=await createServiceClient()
    const table=TABLES[body.entity]
    const payload=body.payload||{}
    if(body.operation==='create'){
      const title=string(payload,'title')?.trim()
      if(!title)return NextResponse.json({ok:false,error:'Le titre est requis.'},{status:422})
      const record={school_id:context.school.id,title,detail:string(payload,'detail'),status:'open',severity:string(payload,'severity')||'info',requested_by:context.user.id,created_by:context.user.id,metadata_json:{...payload,source:'customer-academic-authority'}}
      const {data,error}=await client.from(table).insert(record).select('*').single()
      if(error)throw new Error(error.message)
      await recordAngelcare360AuditEventServer({category:'academic',module:body.entity.startsWith('attendance')||body.entity==='day-closure'?'attendance':'academics',action:`${body.entity}.created`,schoolId:context.school.id,entityType:body.entity,entityId:String(data.id),severity:'info',afterData:data as Record<string,unknown>})
      return NextResponse.json({ok:true,message:'Demande enregistrée et auditée.',record:data})
    }
    const {data:sourceRequest,error:sourceError}=await client.from(table).select('*').eq('school_id',context.school.id).eq('id',body.id||'').single()
    if(sourceError)throw new Error(sourceError.message)
    const source=sourceRequest as Record<string,unknown>
    const storedMetadata=(source.metadata_json&&typeof source.metadata_json==='object'&&!Array.isArray(source.metadata_json)?source.metadata_json:{}) as Record<string,unknown>
    const operationPayload:Record<string,unknown>={...storedMetadata,...payload,requestId:body.id}
    if(!operationPayload.academicYearId&&source.academic_year_id)operationPayload.academicYearId=source.academic_year_id
    if(!operationPayload.sessionDate&&source.closure_date)operationPayload.sessionDate=source.closure_date
    if(!operationPayload.classId&&source.class_id)operationPayload.classId=source.class_id
    const operationKey=RESOLVE_OPERATIONS[body.entity]
    const operationalEntityId=body.entity==='attendance-correction'||body.entity==='grade-correction'||body.entity==='academic-validation'
      ? body.id||null
      : body.entity==='report-card-publication'
        ? string(operationPayload,'reportCardId')
        : null
    if(body.entity==='report-card-publication'&&!operationalEntityId)return NextResponse.json({ok:false,error:'Le bulletin à publier est requis.'},{status:422})
    const execution=await executeProductRealityCommand({
      operationKey,
      entityId:operationalEntityId,
      idempotencyKey:`${body.entity}:${body.id}:resolve`,
      reason:string(payload,'reason')||`Résolution ${body.entity}`,
      payload:operationPayload,
    })
    const {error}=await client.from(table).update({status:execution.ok?'resolved':'failed',execution_result:execution,resolved_at:new Date().toISOString(),resolved_by:context.user.id}).eq('school_id',context.school.id).eq('id',body.id||'')
    if(error)throw new Error(error.message)
    return NextResponse.json({ok:execution.ok,message:execution.message,execution},{status:execution.ok?200:409})
  }catch(error){
    if(error instanceof Angelcare360AccessError)return NextResponse.json({ok:false,error:error.message},{status:error.status})
    return NextResponse.json({ok:false,error:publicAngelcare360Error(error)},{status:500})
  }
}
