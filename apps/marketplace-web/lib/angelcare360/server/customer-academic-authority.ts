import { createServiceClient } from '@/lib/supabase/server'
import type { AcademicAuthorityQueueRecord, AcademicAuthoritySignals, AcademicAuthorityEntity } from '@/types/angelcare360/customer-academic-authority'

type Row=Record<string,unknown>
function text(value:unknown){return value===null||value===undefined?'':String(value)}
function map(row:Row,entity:AcademicAuthorityEntity):AcademicAuthorityQueueRecord{return {id:text(row.id),entity,title:text(row.title||row.request_title||row.batch_code||row.publication_code||entity),detail:row.detail||row.reason||row.notes?text(row.detail||row.reason||row.notes):null,status:text(row.status||'open'),severity:(['info','warning','critical','success'].includes(text(row.severity))?text(row.severity):'info') as AcademicAuthorityQueueRecord['severity'],created_at:text(row.created_at||new Date(0).toISOString()),effective_at:row.effective_at?text(row.effective_at):null,metadata:(row.metadata_json||row.metadata||{}) as Record<string,unknown>}}
async function safeRows(client:Awaited<ReturnType<typeof createServiceClient>>,table:string,schoolId:string,entity:AcademicAuthorityEntity,warnings:string[]){try{const {data,error}=await client.from(table).select('*').eq('school_id',schoolId).order('created_at',{ascending:false}).limit(12);if(error){warnings.push(`${table}: ${error.message}`);return []}return ((data||[]) as Row[]).map(row=>map(row,entity))}catch(error){warnings.push(`${table}: ${error instanceof Error?error.message:'indisponible'}`);return []}}
export async function getAcademicAuthoritySignals(schoolId:string):Promise<AcademicAuthoritySignals>{const client=await createServiceClient();const warnings:string[]=[];const [corrections,closures,timetablePublications,gradeCorrections,validations,reportCardPublications]=await Promise.all([
 safeRows(client,'angelcare360_attendance_correction_requests',schoolId,'attendance-correction',warnings),
 safeRows(client,'angelcare360_attendance_day_closures',schoolId,'day-closure',warnings),
 safeRows(client,'angelcare360_timetable_publication_runs',schoolId,'timetable-publication',warnings),
 safeRows(client,'angelcare360_grade_correction_requests',schoolId,'grade-correction',warnings),
 safeRows(client,'angelcare360_academic_validation_batches',schoolId,'academic-validation',warnings),
 safeRows(client,'angelcare360_report_card_publication_runs',schoolId,'report-card-publication',warnings),
]);return {corrections,closures,timetablePublications,gradeCorrections,validations,reportCardPublications,warnings}}
