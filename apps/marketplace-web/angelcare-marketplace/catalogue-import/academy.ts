import type { MarketplaceRequestContext } from '../domain/types'
import { parseCohortInput } from '../academy-engine/validation'
import { text,present,type Row } from '../catalogue-population/model'
const tableNames={program:'angelcare_marketplace_academy_programs',course:'angelcare_marketplace_academy_courses',module:'angelcare_marketplace_academy_course_modules',cohort:'angelcare_marketplace_academy_cohorts'}
/** Produces draft entities, with explicit native parent links. This does not open
 * enrolment, assign a trainer or issue a certificate. Those retain their authorities. */
export async function planAcademy(db:any,context:MarketplaceRequestContext,itemId:string,inputs:Row[]){
 const byIdentity=new Map<string,Row>(),entries:Row[]=[],notes:string[]=[]
 async function exact(table:string,column:string,key:string){const r=await db.from(table).select('*').eq(column,key).limit(2);if(r.error)throw r.error;if((r.data||[]).length>1)throw Error('Référence Academy ambiguë : '+key);const found=r.data?.[0]||null;if(found&&(context.territoryId&&found.territory_id&&found.territory_id!==context.territoryId||context.tenantId&&found.tenant_id&&found.tenant_id!==context.tenantId))throw Error('Entité Academy hors périmètre.');return found}
 async function parent(kind:'program'|'course',key:string){const own=byIdentity.get(kind+'|'+key);if(own)return own;const found=await exact(tableNames[kind],'code',key);if(!found)throw Error('Parent Academy absent : '+kind+'/'+key);return found}
 for(const kind of ['program','course','module','cohort'] as const)for(const input of inputs.filter(r=>r.entity===kind)){
  const key=text(input.key),table=tableNames[kind],base={territory_id:context.territoryId,tenant_id:context.tenantId,created_by:context.actor.id,updated_by:context.actor.id,updated_at:new Date().toISOString()}
  let existing:Row|null=null,payload:Row
  if(kind==='program'){
   existing=await exact(table,'code',key)
   if(existing){byIdentity.set(kind+'|'+key,existing);notes.push(`Programme ${key} existant : rattaché sans écraser son contenu.`);continue}
   payload={...base,id:crypto.randomUUID(),code:key,title_fr:input.title_fr,description_fr:text(input.description_fr)||null,target_audience:text(input.target_audience).split('|').filter(Boolean),status:'draft'}
  }else if(kind==='course'){
   const programme=await parent('program',text(input.parent_key));existing=await exact(table,'code',key)
   if(existing&&(existing.catalog_item_id!==itemId||existing.status!=='draft'))throw Error('Le cours existant doit être le brouillon lié à cette offre.')
   const attendance=present(input.attendance_threshold)?Number(input.attendance_threshold):existing?.attendance_threshold??80,score=present(input.passing_score)?Number(input.passing_score):existing?.passing_score??70
   if(attendance<0||attendance>100||score<0||score>100)throw Error('Seuils Academy entre 0 et 100 requis.')
   payload={...(existing||base),id:existing?.id||crypto.randomUUID(),program_id:programme.id,catalog_item_id:itemId,code:key,slug:existing?.slug||key,title_fr:input.title_fr,description_fr:text(input.description_fr)||existing?.description_fr||null,duration_minutes:Number(input.duration_minutes),delivery_mode:input.delivery_mode,attendance_threshold:attendance,passing_score:score,certificate_type:text(input.certificate_type)||existing?.certificate_type||null,certificate_validity_days:present(input.certificate_validity_days)?Number(input.certificate_validity_days):existing?.certificate_validity_days||null,status:'draft',updated_by:context.actor.id,updated_at:new Date().toISOString()}
  }else if(kind==='module'){
   const course=await parent('course',text(input.parent_key));if(course.catalog_item_id!==itemId||course.status!=='draft')throw Error('Les modules visent le cours brouillon lié à cette offre.')
   const r=await db.from(table).select('*').eq('course_id',course.id).eq('module_key',key).maybeSingle();if(r.error)throw r.error;existing=r.data||null
   payload={...(existing||{}),id:existing?.id||crypto.randomUUID(),course_id:course.id,module_key:key,title_fr:input.title_fr,learning_objectives:input.learning_objectives||existing?.learning_objectives||[],content_reference:text(input.content_reference)||existing?.content_reference||null,duration_minutes:Number(input.duration_minutes)||existing?.duration_minutes||0,sort_order:Number(input.sort_order)||0,status:'draft'}
  }else{
   const course=await parent('course',text(input.parent_key));if(course.catalog_item_id!==itemId)throw Error('La cohorte doit viser le cours lié à cette offre.')
   existing=await exact(table,'public_reference','COH-IMPORT-'+key)
   if(existing&&(existing.course_id!==course.id||existing.status!=='draft'||Number(existing.enrolled_count)>0||Number(existing.waitlist_count)>0))throw Error('Une cohorte opérationnelle ou occupée ne peut pas être modifiée par cet import.')
   const native=parseCohortInput({courseId:course.id,name:input.title_fr,capacity:input.capacity,startsAt:input.starts_at||existing?.starts_at,endsAt:input.ends_at||existing?.ends_at})
   payload={...(existing||base),id:existing?.id||crypto.randomUUID(),public_reference:'COH-IMPORT-'+key,course_id:native.courseId,name:native.name,capacity:native.capacity,starts_at:native.startsAt,ends_at:native.endsAt,status:'draft',updated_by:context.actor.id,updated_at:new Date().toISOString()}
  }
  byIdentity.set(kind+'|'+key,payload);entries.push({table,before:existing,after:payload})
 }
 return{entries,summary:{programs:entries.filter(e=>e.table===tableNames.program).length,courses:entries.filter(e=>e.table===tableNames.course).length,modules:entries.filter(e=>e.table===tableNames.module).length,cohorts:entries.filter(e=>e.table===tableNames.cohort).length,notes}}
}
