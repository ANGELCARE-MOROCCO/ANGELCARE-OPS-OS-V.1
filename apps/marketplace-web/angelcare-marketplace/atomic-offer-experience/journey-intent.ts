import type { ExperienceSchemaBlueprint } from '../category-native/types'

const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const text=(v:unknown,max=200)=>typeof v==='string'?v.trim().slice(0,max):''
const date=(v:unknown)=>{const s=text(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';const d=new Date(`${s}T12:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:''}
export const ATOMIC_INTENT_KEYS=['requestedDate','requestedTime','duration','city','cohortId','quantity'] as const
/** This extends customer intent only. Schema fields, imports, price and capacity stay authoritative. */
export function atomicJourneyIntent(schema:ExperienceSchemaBlueprint,configuration:Record<string,unknown>):Record<string,unknown>{
  const out:Record<string,unknown>={}
  const quantity=configuration.quantity
  if(typeof quantity==='number'&&Number.isInteger(quantity)&&quantity>=1&&quantity<=99)out.quantity=quantity
  if(schema.segment_key==='b2c_family'&&schema.configuration.base_family==='service'){
    const requestedDate=date(configuration.requestedDate),rawTime=text(configuration.requestedTime,5),requestedTime=/^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime)?rawTime:'',city=text(configuration.city,100),duration=text(configuration.duration,100)
    if(requestedDate)out.requestedDate=requestedDate
    if(requestedTime)out.requestedTime=requestedTime
    if(city)out.city=city
    if(duration)out.duration=duration
    // Preserve selected schema-native recurrence and published day preferences in the operational handover.
    const source=obj(configuration.schedule),nativeDays=Array.isArray(configuration.available_days)?configuration.available_days:source.days
    const days=Array.isArray(nativeDays)?nativeDays.filter((v):v is string=>typeof v==='string'&&v.length<=40).slice(0,7):[]
    const recurrence=Array.isArray(configuration.recurrence_types)?configuration.recurrence_types.filter((v):v is string=>typeof v==='string'&&v.length<=40).slice(0,4):[]
    if(requestedTime||days.length||recurrence.length)out.schedule={...(requestedTime?{time:requestedTime}:{}),...(days.length?{days}:{}),...(recurrence.length?{recurrence}:{})}
  }
  if(['course_enrollment','cohort_enrollment','pathway_enrollment','event_enrollment'].includes(schema.conversion_template)){
    const id=text(configuration.cohortId,36)
    if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))out.cohortId=id
  }
  return out
}

export async function assertAtomicCohortBelongsToOffer(intent:Record<string,unknown>,catalogItemId:string,load:(id:string)=>Promise<unknown>):Promise<void>{
  if(!intent.cohortId)return
  const academy=obj(await load(catalogItemId)),cohorts=Array.isArray(academy.cohorts)?academy.cohorts:[]
  if(!cohorts.some(c=>{const r=obj(c);if(r.id!==intent.cohortId||r.status!=='enrollment_open')return false;if(typeof r.capacity==='number'&&typeof r.enrolledCount==='number'&&r.enrolledCount>=r.capacity)return false;const now=Date.now(),opens=typeof r.enrollmentOpensAt==='string'?Date.parse(r.enrollmentOpensAt):NaN,closes=typeof r.enrollmentClosesAt==='string'?Date.parse(r.enrollmentClosesAt):NaN;return (!Number.isFinite(opens)||opens<=now)&&(!Number.isFinite(closes)||closes>now)}))throw Error('ATOMIC_COHORT_NOT_ELIGIBLE')
}
