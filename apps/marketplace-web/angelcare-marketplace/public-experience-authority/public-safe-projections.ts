import 'server-only'
import {createServiceClient} from '@/lib/supabase/server'

const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{ }
const arr=(v:unknown)=>Array.isArray(v)?v:[]
const text=(v:unknown)=>typeof v==='string'?v.trim():v==null?'':String(v)
const uniq=(rows:string[])=>[...new Set(rows.filter(Boolean))]

/** Public-safe provider projection. No email, phone, pay, internal risk, or private documents leave this boundary. */
export async function loadPublicSafeProviders(input:{preferredProviderIds:unknown;doctrineKey:string;territoryId:string|null}){
 const preferred=uniq(arr(input.preferredProviderIds).map(text)).slice(0,24);if(!preferred.length)return[]
 const db=await createServiceClient()
 const elig=await db.from('angelcare_marketplace_provider_operational_eligibility').select('provider_id,status,eligible_services,eligible_territories,restrictions').in('provider_id',preferred).in('status',['eligible','eligible_with_restrictions']).limit(50)
 if(elig.error)return[]
 const eligible=(elig.data||[]).filter((row:any)=>{
  const services=arr(row.eligible_services).map(text),territories=arr(row.eligible_territories).map(text)
  const serviceOk=!services.length||services.includes(input.doctrineKey)
  const territoryOk=!input.territoryId||!territories.length||territories.includes(input.territoryId)
  return serviceOk&&territoryOk
 })
 const ids=eligible.map((row:any)=>text(row.provider_id)).filter(Boolean);if(!ids.length)return[]
 const [profiles,certifications]=await Promise.all([
  db.from('angelcare_marketplace_provider_profiles').select('id,public_reference,provider_type,display_name,service_categories,age_group_competencies,languages,operational_zones,operational_status').in('id',ids).eq('operational_status','active').limit(50),
  db.from('angelcare_marketplace_provider_certifications').select('provider_id,certification_key,status,expires_at').in('provider_id',ids).in('status',['active','issued','valid']).limit(250),
 ])
 if(profiles.error)return[]
 const certBy=new Map<string,Array<{key:string;status:string;expiresAt:string|null}>>()
 for(const row of certifications.data||[]){const id=text((row as any).provider_id),list=certBy.get(id)||[];list.push({key:text((row as any).certification_key),status:text((row as any).status),expiresAt:(row as any).expires_at?text((row as any).expires_at):null});certBy.set(id,list)}
 return(profiles.data||[]).map((row:any)=>({id:text(row.id),publicReference:text(row.public_reference),providerType:text(row.provider_type),displayName:text(row.display_name),serviceCategories:arr(row.service_categories).map(text),ageGroups:arr(row.age_group_competencies).map(text),languages:arr(row.languages).map(text),zones:arr(row.operational_zones).map(text),certifications:certBy.get(text(row.id))||[]}))
}

/** Academy public projection bound by catalog_item_id, never by display-name guessing. */
export async function loadAcademyPublicProjection(catalogItemId:string){
 const db=await createServiceClient();const course=await db.from('angelcare_marketplace_academy_courses').select('id,program_id,code,slug,title_fr,description_fr,duration_minutes,delivery_mode,prerequisite_rules,attendance_threshold,passing_score,certificate_type,certificate_validity_days,status').eq('catalog_item_id',catalogItemId).eq('status','published').maybeSingle();if(course.error||!course.data)return null
 const c=course.data as any
 const [program,cohorts]=await Promise.all([
  db.from('angelcare_marketplace_academy_programs').select('id,public_reference,code,title_fr,description_fr,target_audience,competency_framework,status,published_at').eq('id',String(c.program_id)).eq('status','published').maybeSingle(),
  db.from('angelcare_marketplace_academy_cohorts').select('id,public_reference,name,status,capacity,enrolled_count,waitlist_count,starts_at,ends_at,enrollment_opens_at,enrollment_closes_at,trainer_id,site_reference,territory_id').eq('course_id',String(c.id)).in('status',['enrollment_open','scheduled','active']).order('starts_at',{ascending:true}).limit(12),
 ])
 const cohortRows=(cohorts.data||[]) as any[],trainerIds=uniq(cohortRows.map(row=>text(row.trainer_id))).slice(0,24)
 const trainers=trainerIds.length?await db.from('angelcare_marketplace_provider_profiles').select('id,public_reference,display_name,provider_type,languages,service_categories,operational_zones,operational_status').in('id',trainerIds).eq('operational_status','active').limit(24):({data:[],error:null} as any)
 const trainerBy=new Map((trainers.data||[]).map((row:any)=>[text(row.id),{id:text(row.id),publicReference:text(row.public_reference),displayName:text(row.display_name),providerType:text(row.provider_type),languages:arr(row.languages).map(text),serviceCategories:arr(row.service_categories).map(text),zones:arr(row.operational_zones).map(text)}]))
 return{course:{id:text(c.id),code:text(c.code),slug:text(c.slug),title:text(c.title_fr),description:text(c.description_fr),durationMinutes:Number(c.duration_minutes||0),deliveryMode:text(c.delivery_mode),prerequisiteRules:obj(c.prerequisite_rules),attendanceThreshold:Number(c.attendance_threshold||0),passingScore:Number(c.passing_score||0),certificateType:text(c.certificate_type)||null,certificateValidityDays:c.certificate_validity_days==null?null:Number(c.certificate_validity_days)},program:program.data?{id:text((program.data as any).id),publicReference:text((program.data as any).public_reference),code:text((program.data as any).code),title:text((program.data as any).title_fr),description:text((program.data as any).description_fr),targetAudience:arr((program.data as any).target_audience).map(text),competencyFramework:obj((program.data as any).competency_framework),publishedAt:text((program.data as any).published_at)||null}:null,cohorts:cohortRows.map(row=>({id:text(row.id),publicReference:text(row.public_reference),name:text(row.name),status:text(row.status),capacity:Number(row.capacity||0),enrolledCount:Number(row.enrolled_count||0),waitlistCount:Number(row.waitlist_count||0),startsAt:text(row.starts_at)||null,endsAt:text(row.ends_at)||null,enrollmentOpensAt:text(row.enrollment_opens_at)||null,enrollmentClosesAt:text(row.enrollment_closes_at)||null,siteReference:text(row.site_reference)||null,territoryId:text(row.territory_id)||null,trainer:trainerBy.get(text(row.trainer_id))||null})),trainers:[...trainerBy.values()]}
}
