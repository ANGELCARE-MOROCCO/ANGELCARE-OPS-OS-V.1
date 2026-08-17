import {createServiceClient} from '@/lib/supabase/server'
import type {MarketplaceRequestContext} from '../domain/types'
import type {
 AvailabilityNetworkRecord,AssignmentNetworkRecord,CapabilityCapacityRecord,NetworkCapacitySnapshot,NetworkMetrics,NetworkMovement,
 NetworkSeverity,PartnerNetworkRecord,ProviderNetworkRecord,QualitySignal,SupplierNetworkRecord,TerritoryCapacityRecord,TerritoryOption,
 VendorNetworkRecord
} from './types'

type R=Record<string,unknown>
const rows=(v:unknown):R[]=>Array.isArray(v)?v as R[]:[]
const text=(v:unknown)=>v===null||v===undefined?'':String(v)
const nullable=(v:unknown)=>v===null||v===undefined||String(v).trim()===''?null:String(v)
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0}
const arr=(v:unknown)=>Array.isArray(v)?v.map(String):[]
const bool=(v:unknown)=>Boolean(v)
const iso=(v:unknown)=>nullable(v)
const sevRank:Record<NetworkSeverity,number>={healthy:0,watch:1,attention:2,critical:3}
function hoursBetween(a:string|null,b:string|null){if(!a||!b)return 0;const x=new Date(a).getTime(),y=new Date(b).getTime();return Number.isFinite(x)&&Number.isFinite(y)?Math.max(0,(y-x)/3600000):0}
function minutesBetween(a:string|null,b:string|null){return Math.round(hoursBetween(a,b)*60)}
function currentCasablancaClock(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Casablanca',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date())
 const wd=parts.find(p=>p.type==='weekday')?.value||'Mon'
 const map:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}
 const hh=Number(parts.find(p=>p.type==='hour')?.value||0),mm=Number(parts.find(p=>p.type==='minute')?.value||0)
 return{weekday:map[wd]??1,minute:hh*60+mm}
}
function timeMinute(v:string){const [h,m]=v.split(':').map(Number);return (Number.isFinite(h)?h:0)*60+(Number.isFinite(m)?m:0)}
function severityFromGap(gap:number,demand:number):NetworkSeverity{if(gap<=0)return'healthy';if(demand>0&&gap/demand>=.4)return'critical';if(gap>=3)return'attention';return'watch'}
function providerActiveStatus(status:string){return['active','restricted','temporarily_blocked'].includes(status)}
function eligibleStatus(status:string){return['eligible','eligible_with_restrictions'].includes(status)}
function scopeQuery<T>(q:T,context:MarketplaceRequestContext):T{
 let x:any=q
 if(context.tenantId)x=x.eq('tenant_id',context.tenantId)
 else if(context.territoryId)x=x.eq('territory_id',context.territoryId)
 return x as T
}

export async function networkCapacitySnapshot(context:MarketplaceRequestContext):Promise<NetworkCapacitySnapshot>{
 const db=await createServiceClient()
 const now=new Date(),nowIso=now.toISOString(),fourHours=new Date(now.getTime()+4*3600000).toISOString(),todayEnd=new Date(now);todayEnd.setHours(23,59,59,999)
 const providerQ=scopeQuery(db.from('angelcare_marketplace_provider_profiles').select('*').order('updated_at',{ascending:false}).limit(1800),context)
 const missionQ=scopeQuery(db.from('angelcare_marketplace_operations_missions').select('*').order('updated_at',{ascending:false}).limit(3000),context)
 const [providersRes,eligRes,rulesRes,exceptionsRes,qualRes,assignRes,missionsRes,proposalsRes,docsRes,certsRes,perfRes,incidentsRes,territoriesRes,suppliersRes,vendorsRes,vContractsRes,vOrdersRes,vQualityRes,vPerfRes,partnersRes]=await Promise.all([
  providerQ,
  scopeQuery(db.from('angelcare_marketplace_provider_operational_eligibility').select('*').order('calculated_at',{ascending:false}).limit(3500),context),
  db.from('angelcare_marketplace_provider_availability_rules').select('*').eq('active',true).limit(5000),
  db.from('angelcare_marketplace_provider_availability_exceptions').select('*').gte('ends_at',nowIso).limit(2500),
  db.from('angelcare_marketplace_provider_service_qualifications').select('*').limit(5000),
  scopeQuery(db.from('angelcare_marketplace_provider_assignments').select('*').order('updated_at',{ascending:false}).limit(4000),context),
  missionQ,
  db.from('angelcare_marketplace_operations_assignment_proposals').select('*').in('status',['proposed','selected']).order('score',{ascending:false}).limit(4000),
  db.from('angelcare_marketplace_provider_documents').select('*').neq('status','archived').limit(5000),
  db.from('angelcare_marketplace_provider_certifications').select('*').limit(5000),
  db.from('angelcare_marketplace_provider_performance_events').select('*').gte('created_at',new Date(now.getTime()-120*86400000).toISOString()).limit(5000),
  scopeQuery(db.from('angelcare_marketplace_operations_incidents').select('*').not('status','in','("closed","resolved")').limit(2500),context),
  db.from('angelcare_marketplace_territories').select('*').neq('status','archived').order('name').limit(500),
  db.from('angelcare_marketplace_suppliers').select('*,offers:angelcare_marketplace_supplier_offers(id)').neq('status','archived').order('updated_at',{ascending:false}).limit(1200),
  scopeQuery(db.from('angelcare_marketplace_vendor_links').select('*').order('updated_at',{ascending:false}).limit(1200),context),
  db.from('angelcare_marketplace_vendor_contracts').select('*').limit(2500),
  scopeQuery(db.from('angelcare_marketplace_vendor_orders').select('*').order('updated_at',{ascending:false}).limit(2500),context),
  db.from('angelcare_marketplace_vendor_quality_reviews').select('*').limit(2500),
  db.from('angelcare_marketplace_vendor_performance_events').select('*').gte('created_at',new Date(now.getTime()-120*86400000).toISOString()).limit(3000),
  scopeQuery(db.from('angelcare_marketplace_partner_tenants').select('*').neq('status','archived').order('updated_at',{ascending:false}).limit(1200),context),
 ])
 for(const r of [providersRes,eligRes,rulesRes,exceptionsRes,qualRes,assignRes,missionsRes,proposalsRes,docsRes,certsRes,perfRes,incidentsRes,territoriesRes,suppliersRes,vendorsRes,vContractsRes,vOrdersRes,vQualityRes,vPerfRes,partnersRes]){
  if(r.error)throw r.error
 }
 const rawProviders=rows(providersRes.data),elig=rows(eligRes.data),rules=rows(rulesRes.data),exceptions=rows(exceptionsRes.data),quals=rows(qualRes.data),
 assignmentsRaw=rows(assignRes.data),missions=rows(missionsRes.data),proposals=rows(proposalsRes.data),docs=rows(docsRes.data),certs=rows(certsRes.data),perf=rows(perfRes.data),
 incidents=rows(incidentsRes.data),territoriesRaw=rows(territoriesRes.data),suppliersRaw=rows(suppliersRes.data),vendorsRaw=rows(vendorsRes.data),
 vendorContracts=rows(vContractsRes.data),vendorOrders=rows(vOrdersRes.data),vendorQuality=rows(vQualityRes.data),vendorPerf=rows(vPerfRes.data),partnersRaw=rows(partnersRes.data)

 const territoryMap=new Map(territoriesRaw.map(t=>[text(t.id),text(t.name)||text(t.territory_code)]))
 const territoryOptions:TerritoryOption[]=territoriesRaw.map(t=>({id:text(t.id),reference:text(t.public_reference),code:text(t.territory_code),name:text(t.name),status:text(t.status)}))
 const latestEligibility=new Map<string,R>()
 for(const e of elig){const id=text(e.provider_id);if(id&&!latestEligibility.has(id))latestEligibility.set(id,e)}
 const rulesByProvider=new Map<string,R[]>(),exceptionsByProvider=new Map<string,R[]>(),qualsByProvider=new Map<string,R[]>(),assignByProvider=new Map<string,R[]>(),docsByProvider=new Map<string,R[]>(),certsByProvider=new Map<string,R[]>(),perfByProvider=new Map<string,R[]>()
 for(const [list,map,key] of [[rules,rulesByProvider,'provider_id'],[exceptions,exceptionsByProvider,'provider_id'],[quals,qualsByProvider,'provider_id'],[assignmentsRaw,assignByProvider,'provider_id'],[docs,docsByProvider,'provider_id'],[certs,certsByProvider,'provider_id'],[perf,perfByProvider,'provider_id']] as Array<[R[],Map<string,R[]>,string]>){
  for(const x of list){const id=text(x[key]);if(!id)continue;const a=map.get(id)||[];a.push(x);map.set(id,a)}
 }
 const missionMap=new Map(missions.map(m=>[text(m.id),m]))
 const providerMissionMap=new Map<string,R[]>()
 for(const m of missions){const pid=text(m.assigned_provider_id);if(!pid)continue;const a=providerMissionMap.get(pid)||[];a.push(m);providerMissionMap.set(pid,a)}
 const incidentProviderCount=new Map<string,number>()
 for(const i of incidents){const m=missionMap.get(text(i.mission_id));const pid=m?text(m.assigned_provider_id):'';if(pid)incidentProviderCount.set(pid,(incidentProviderCount.get(pid)||0)+1)}
 const clock=currentCasablancaClock()
 function availabilityState(p:R):ProviderNetworkRecord['availabilityState']{
  const id=text(p.id),status=text(p.operational_status),e=latestEligibility.get(id),eStatus=text(e?.status)
  if(!providerActiveStatus(status)||!eligibleStatus(eStatus))return'restricted'
  const activeException=(exceptionsByProvider.get(id)||[]).find(x=>{const a=new Date(text(x.starts_at)).getTime(),b=new Date(text(x.ends_at)).getTime();return a<=now.getTime()&&b>=now.getTime()})
  if(activeException){return text(activeException.availability_status)==='available'||text(activeException.availability_status)==='emergency_available'?'available':'unavailable'}
  const todays=(rulesByProvider.get(id)||[]).filter(x=>Number(x.weekday)===clock.weekday&&bool(x.active))
  const within=todays.some(x=>clock.minute>=timeMinute(text(x.starts_at))&&clock.minute<timeMinute(text(x.ends_at)))
  if(!within)return'offline'
  const active=(providerMissionMap.get(id)||[]).some(m=>['accepted','brief_acknowledged','travel_ready','check_in_pending','in_progress','incident_open','check_out_pending'].includes(text(m.status)))
  return active?'assigned':'available'
 }
 const providers:ProviderNetworkRecord[]=rawProviders.map(p=>{
  const id=text(p.id),e=latestEligibility.get(id),pm=providerMissionMap.get(id)||[],pd=docsByProvider.get(id)||[],pc=certsByProvider.get(id)||[],pe=perfByProvider.get(id)||[]
  const activeMissions=pm.filter(m=>!['closed','cancelled'].includes(text(m.status))).length
  const upcomingMissions=pm.filter(m=>{const s=new Date(text(m.scheduled_start_at)).getTime();return s>=now.getTime()&&s<=todayEnd.getTime()&&!['closed','cancelled'].includes(text(m.status))}).length
  const scheduledMinutesToday=pm.filter(m=>{const s=new Date(text(m.scheduled_start_at)).getTime();return s>=new Date(now.toDateString()).getTime()&&s<=todayEnd.getTime()}).reduce((sum,m)=>sum+minutesBetween(iso(m.scheduled_start_at),iso(m.scheduled_end_at)),0)
  const perfScores=pe.map(x=>num(x.score)).filter(x=>x>0)
  return{id,reference:text(p.public_reference)||`PROV-${id.slice(0,8)}`,name:text(p.display_name)||'Provider',providerType:text(p.provider_type),email:nullable(p.email),phone:nullable(p.phone),
   territoryId:nullable(p.territory_id),territoryName:territoryMap.get(text(p.territory_id))||'Non affecté',onboardingStatus:text(p.onboarding_status),operationalStatus:text(p.operational_status),
   riskLevel:text(p.risk_level),services:arr(p.service_categories),ageGroups:arr(p.age_group_competencies),languages:arr(p.languages),zones:arr(p.operational_zones),
   eligibilityStatus:text(e?.status)||'not_started',eligibilityScore:e&&e.score!==null&&e.score!==undefined?num(e.score):null,eligibilityBlockers:arr(e?.blockers),availabilityState:availabilityState(p),
   activeMissions,upcomingMissions,scheduledMinutesToday,assignmentCount:(assignByProvider.get(id)||[]).length,documentValid:pd.filter(x=>text(x.status)==='valid').length,
   documentAttention:pd.filter(x=>['requested','rejected','expiring','expired'].includes(text(x.status))).length,certificationActive:pc.filter(x=>text(x.status)==='active').length,
   certificationAttention:pc.filter(x=>['pending','expiring','expired','suspended','revoked'].includes(text(x.status))).length,performanceCount:pe.length,
   performanceAverage:perfScores.length?Math.round(perfScores.reduce((a,b)=>a+b,0)/perfScores.length*10)/10:null,openIncidents:incidentProviderCount.get(id)||0,updatedAt:text(p.updated_at)}
 }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
 const providerMap=new Map(providers.map(p=>[p.id,p]))
 const proposalCountByMission=new Map<string,number>(),proposalConflictsByMission=new Map<string,string[]>()
 for(const p of proposals){const mid=text(p.mission_id);proposalCountByMission.set(mid,(proposalCountByMission.get(mid)||0)+1);const conflicts=arr(p.conflicts);if(conflicts.length)proposalConflictsByMission.set(mid,[...(proposalConflictsByMission.get(mid)||[]),...conflicts])}
 const assignments:AssignmentNetworkRecord[]=missions.filter(m=>!['closed','cancelled'].includes(text(m.status))).map(m=>{
  const pid=nullable(m.assigned_provider_id),provider=pid?providerMap.get(pid):null,mid=text(m.id),a=assignmentsRaw.find(x=>text(x.mission_id)===mid&&text(x.provider_id)===pid)
  return{id:text(a?.id)||mid,missionId:mid,missionReference:text(m.public_reference)||`MSN-${mid.slice(0,8)}`,missionTitle:text(m.title),providerId:pid,providerReference:provider?.reference||'',providerName:provider?.name||'Unassigned',
   roleKey:text(a?.role_key)||'primary',status:text(m.status),serviceType:text(m.service_type),territoryId:nullable(m.territory_id),territoryName:territoryMap.get(text(m.territory_id))||'Non affecté',
   scheduledStart:iso(m.scheduled_start_at),scheduledEnd:iso(m.scheduled_end_at),conflicts:[...new Set(proposalConflictsByMission.get(mid)||[])],proposalCount:proposalCountByMission.get(mid)||0,updatedAt:text(m.updated_at)}
 }).sort((a,b)=>(a.scheduledStart||'9999').localeCompare(b.scheduledStart||'9999'))
 const availability:AvailabilityNetworkRecord[]=rules.map(r=>{const p=providerMap.get(text(r.provider_id));return{id:text(r.id),providerId:text(r.provider_id),providerReference:p?.reference||'',providerName:p?.name||'Provider',weekday:num(r.weekday),startsAt:text(r.starts_at),endsAt:text(r.ends_at),zones:arr(r.zones),services:arr(r.service_categories),maxDailyMinutes:num(r.max_daily_minutes),maxWeeklyMinutes:num(r.max_weekly_minutes),active:bool(r.active),state:p?.availabilityState||'offline'}})
 const next4hMissions=missions.filter(m=>{const s=new Date(text(m.scheduled_start_at)).getTime();return s>=now.getTime()&&s<=new Date(fourHours).getTime()&&!['closed','cancelled'].includes(text(m.status))})
 const allCapabilities=[...new Set([...providers.flatMap(p=>p.services),...missions.map(m=>text(m.service_type)).filter(Boolean)])].sort()
 const capabilities:CapabilityCapacityRecord[]=allCapabilities.map(key=>{
  const demand=next4hMissions.filter(m=>text(m.service_type)===key).length
  const qualified=providers.filter(p=>p.services.includes(key)&&eligibleStatus(p.eligibilityStatus)&&providerActiveStatus(p.operationalStatus)).length
  const available=providers.filter(p=>p.services.includes(key)&&p.availabilityState==='available').length
  const assigned=providers.filter(p=>p.services.includes(key)&&p.availabilityState==='assigned').length
  const deficit=Math.max(0,demand-available),coverageRate=demand?Math.round(available/demand*100):available?100:0
  return{key,label:key.replace(/_/g,' '),demand,qualified,available,assigned,deficit,coverageRate,severity:severityFromGap(deficit,demand)}
 }).sort((a,b)=>sevRank[b.severity]-sevRank[a.severity]||b.demand-a.demand)
 const quality:QualitySignal[]=[]
 for(const p of providers){
  if(p.documentAttention)quality.push({id:`doc-${p.id}`,kind:'document',reference:p.reference,title:'Provider document readiness',detail:`${p.documentAttention} document(s) require review, renewal or replacement`,severity:p.documentAttention>=3?'critical':'attention',providerId:p.id,relatedId:p.id,territoryName:p.territoryName,createdAt:p.updatedAt})
  if(p.certificationAttention)quality.push({id:`cert-${p.id}`,kind:'certification',reference:p.reference,title:'Certification readiness',detail:`${p.certificationAttention} certification(s) pending, expiring or restricted`,severity:p.certificationAttention>=2?'attention':'watch',providerId:p.id,relatedId:p.id,territoryName:p.territoryName,createdAt:p.updatedAt})
  if(p.openIncidents)quality.push({id:`inc-${p.id}`,kind:'incident',reference:p.reference,title:'Open mission incident',detail:`${p.openIncidents} unresolved incident(s) linked to current provider missions`,severity:p.openIncidents>=2?'critical':'attention',providerId:p.id,relatedId:p.id,territoryName:p.territoryName,createdAt:p.updatedAt})
 }
 for(const v of vendorQuality){if(!['approved','closed'].includes(text(v.status)))quality.push({id:`vq-${text(v.id)}`,kind:'vendor_quality',reference:text(v.id).slice(0,8).toUpperCase(),title:'Vendor quality review',detail:`${text(v.status)} · ${text(v.review_type)}`,severity:text(v.status)==='failed'?'critical':'attention',providerId:null,relatedId:text(v.vendor_id),territoryName:territoryMap.get(text(v.territory_id))||'',createdAt:text(v.updated_at)||text(v.created_at)})}
 for(const s of suppliersRaw){if(!['approved'].includes(text(s.quality_status)))quality.push({id:`sq-${text(s.id)}`,kind:'supplier_quality',reference:text(s.public_reference),title:'Supplier quality attention',detail:`${text(s.display_name)} · ${text(s.quality_status)}`,severity:text(s.quality_status)==='rejected'||text(s.quality_status)==='expired'?'critical':'watch',providerId:null,relatedId:text(s.id),territoryName:territoryMap.get(text(s.territory_id))||'',createdAt:text(s.updated_at)})}
 for(const p of partnersRaw){if(['at_risk','critical'].includes(text(p.health_status)))quality.push({id:`ph-${text(p.id)}`,kind:'partner_health',reference:text(p.public_reference),title:'Partner health attention',detail:`${text(p.display_name)} · ${text(p.health_status)}`,severity:text(p.health_status)==='critical'?'critical':'attention',providerId:null,relatedId:text(p.id),territoryName:territoryMap.get(text(p.territory_id))||'',createdAt:text(p.updated_at)})}
 quality.sort((a,b)=>sevRank[b.severity]-sevRank[a.severity]||b.createdAt.localeCompare(a.createdAt))
 const territories:TerritoryCapacityRecord[]=territoriesRaw.map(t=>{
  const id=text(t.id),tp=providers.filter(p=>p.territoryId===id),tm=missions.filter(m=>text(m.territory_id)===id&&!['closed','cancelled'].includes(text(m.status))),demand=next4hMissions.filter(m=>text(m.territory_id)===id).length
  const available=tp.filter(p=>p.availabilityState==='available').length,eligible=tp.filter(p=>eligibleStatus(p.eligibilityStatus)).length,assigned=tp.filter(p=>p.availabilityState==='assigned').length,gap=Math.max(0,demand-available)
  const capabilityKeys=new Set(next4hMissions.filter(m=>text(m.territory_id)===id).map(m=>text(m.service_type)))
  let criticalCapabilities=0
  for(const key of capabilityKeys){const d=next4hMissions.filter(m=>text(m.territory_id)===id&&text(m.service_type)===key).length,a=tp.filter(p=>p.services.includes(key)&&p.availabilityState==='available').length;if(d>a)criticalCapabilities++}
  return{id,reference:text(t.public_reference),name:text(t.name),status:text(t.status),providers:tp.length,eligible,available,assigned,demandNext4h:demand,activeMissions:tm.length,capacityGap:gap,coverageRate:demand?Math.round(available/demand*100):available?100:0,criticalCapabilities,qualitySignals:quality.filter(q=>q.territoryName===text(t.name)).length}
 }).sort((a,b)=>b.capacityGap-a.capacityGap||b.demandNext4h-a.demandNext4h)
 const suppliers:SupplierNetworkRecord[]=suppliersRaw.map(s=>({id:text(s.id),reference:text(s.public_reference),code:text(s.supplier_code),legalName:text(s.legal_name),name:text(s.display_name),status:text(s.status),qualityStatus:text(s.quality_status),territoryId:nullable(s.territory_id),territoryName:territoryMap.get(text(s.territory_id))||'Global',paymentTerms:nullable(s.payment_terms),offerCount:Array.isArray(s.offers)?s.offers.length:0,updatedAt:text(s.updated_at)}))
 const contractsByVendor=new Map<string,R[]>(),ordersByVendor=new Map<string,R[]>(),qualityByVendor=new Map<string,R[]>(),perfByVendor=new Map<string,R[]>()
 for(const [list,map] of [[vendorContracts,contractsByVendor],[vendorOrders,ordersByVendor],[vendorQuality,qualityByVendor],[vendorPerf,perfByVendor]] as Array<[R[],Map<string,R[]>]>){for(const x of list){const id=text(x.vendor_id);const a=map.get(id)||[];a.push(x);map.set(id,a)}}
 const vendors:VendorNetworkRecord[]=vendorsRaw.map(v=>{const id=text(v.id),vp=perfByVendor.get(id)||[],scores=vp.map(x=>num(x.score)).filter(x=>x>0);return{id,reference:text(v.vendor_reference),name:text(v.display_name),status:text(v.status),territoryIds:arr(v.territory_ids),catalogCount:arr(v.catalog_item_ids).length,contractReference:nullable(v.contract_reference),settlementStatus:text(v.settlement_status),activeContracts:(contractsByVendor.get(id)||[]).filter(x=>['active','approved'].includes(text(x.status))).length,openOrders:(ordersByVendor.get(id)||[]).filter(x=>!['closed','cancelled','rejected'].includes(text(x.status))).length,qualityOpen:(qualityByVendor.get(id)||[]).filter(x=>!['closed','approved'].includes(text(x.status))).length,performanceAverage:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:null,updatedAt:text(v.updated_at)}})
 const partners:PartnerNetworkRecord[]=partnersRaw.map(p=>({id:text(p.id),reference:text(p.public_reference),code:text(p.tenant_code),legalName:text(p.legal_name),name:text(p.display_name),tenantType:text(p.tenant_type),territoryId:nullable(p.territory_id),territoryName:territoryMap.get(text(p.territory_id))||'Global',status:text(p.status),onboardingScore:num(p.onboarding_score),healthStatus:text(p.health_status),updatedAt:text(p.updated_at)}))
 const movement:NetworkMovement[]=[
  ...providers.slice(0,6).map(p=>({id:`p-${p.id}`,kind:'PROVIDER',title:p.name,detail:`${p.operationalStatus} · ${p.eligibilityStatus} · ${p.territoryName}`,reference:p.reference,when:p.updatedAt,drawerKind:'provider' as const,drawerId:p.id})),
  ...assignments.slice(0,6).map(a=>({id:`a-${a.id}`,kind:'ASSIGNMENT',title:a.missionTitle,detail:`${a.providerName} · ${a.status}`,reference:a.missionReference,when:a.updatedAt,drawerKind:'assignment' as const,drawerId:a.missionId})),
  ...vendors.slice(0,3).map(v=>({id:`v-${v.id}`,kind:'VENDOR',title:v.name,detail:`${v.status} · ${v.openOrders} open order(s)`,reference:v.reference,when:v.updatedAt,drawerKind:'vendor' as const,drawerId:v.id})),
  ...partners.slice(0,3).map(p=>({id:`pt-${p.id}`,kind:'PARTNER',title:p.name,detail:`${p.status} · ${p.healthStatus}`,reference:p.reference,when:p.updatedAt,drawerKind:'partner' as const,drawerId:p.id}))
 ].sort((a,b)=>b.when.localeCompare(a.when)).slice(0,14)
 const availableNow=providers.filter(p=>p.availabilityState==='available').length,assigned=providers.filter(p=>p.availabilityState==='assigned').length,unavailable=providers.filter(p=>['unavailable','offline','restricted'].includes(p.availabilityState)).length
 const activeProviderIds=providers.filter(p=>p.scheduledMinutesToday>=420).length,openMissions=assignments.length,unassignedMissions=assignments.filter(a=>!a.providerId).length
 const criticalTerritories=territories.filter(t=>t.capacityGap>0&&t.coverageRate<75).length,qualifiedCapabilities=quals.filter(q=>['active','approved','qualified'].includes(text(q.status))).length
 const totalDemand=capabilities.reduce((s,c)=>s+c.demand,0),totalAvailable=capabilities.reduce((s,c)=>s+c.available,0)
 const metrics:NetworkMetrics={providers:providers.length,availableNow,assigned,atCapacity:activeProviderIds,unavailable,openMissions,unassignedMissions,criticalTerritories,qualifiedCapabilities,coverageRate:totalDemand?Math.round(totalAvailable/totalDemand*100):100,providerCases:providers.filter(p=>p.openIncidents>0).length,documentsAttention:providers.reduce((s,p)=>s+p.documentAttention+p.certificationAttention,0),qualityAttention:quality.filter(q=>q.severity==='attention'||q.severity==='critical').length}
 return{generatedAt:new Date().toISOString(),metrics,providers,availability,assignments,territories,capabilities,suppliers,vendors,partners,quality,movement,territoryOptions}
}
