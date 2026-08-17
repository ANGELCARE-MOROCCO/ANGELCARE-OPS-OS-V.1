import { createServiceClient } from '@/lib/supabase/server'
import { businessPulseSnapshot, liveMarketplaceSnapshot, fulfillmentMissionSnapshot } from './repository'
import type {
  CommandCenterEvent, CommandCenterSnapshot, CommandMetric, CommandSeverity, ExecutiveSignal,
  MoneyMotion, OperatingMove, PressureRow, RunwayItem, TerritoryPulse,
} from './command-center-types'

type Row=Record<string,unknown>
const text=(value:unknown)=>value===null||value===undefined?'':String(value)
const num=(value:unknown)=>{const n=Number(value);return Number.isFinite(n)?n:0}
const obj=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}
const rows=(value:unknown):Row[]=>Array.isArray(value)?value.filter(Boolean) as Row[]:[]
const iso=(value:unknown)=>{const d=new Date(text(value));return Number.isNaN(d.getTime())?new Date(0).toISOString():d.toISOString()}
const ageMinutes=(value:unknown)=>{const t=new Date(text(value)).getTime();return Number.isFinite(t)?Math.max(0,Math.round((Date.now()-t)/60000)):null}
const money=(value:number)=>`${Math.round(value).toLocaleString('fr-FR')} Dh`
const status=(row:Row)=>text(row.status).toLowerCase()

async function optional<T>(fn:()=>PromiseLike<{data?:unknown;error?:unknown}>|Promise<{data?:unknown;error?:unknown}>,fallback:T):Promise<T>{
 try{const result=await fn();if(result&&'error'in result&&result.error)return fallback;return ((result as {data?:unknown})?.data??fallback) as T}catch{return fallback}
}

function orderAmount(row:Row){
 const financial=obj(row.financial_status)
 const commercial=obj(row.commercial_snapshot)
 return num(financial.grand_total||financial.total||financial.amount||commercial.total||commercial.amount||row.total_amount||row.amount)
}

function orderCustomer(row:Row){
 const identity=obj(row.customer_snapshot)
 return text(identity.display_name||identity.name||row.customer_name)||null
}

function orderTerritory(row:Row){return text(row.territory_id||obj(row.fulfillment_status).territory_id)||null}
function providerName(row:Row){return text(row.display_name||row.legal_name||row.public_reference||row.id)}

function severityFromCounts(critical:number,attention:number):CommandSeverity{
 if(critical>0)return 'critical'
 if(attention>0)return 'attention'
 return 'healthy'
}

function runwaySort(a:RunwayItem,b:RunwayItem){
 const rank:Record<RunwayItem['severity'],number>={critical:3,attention:2,watch:1}
 const diff=rank[b.severity]-rank[a.severity]
 if(diff)return diff
 return (b.amount||0)-(a.amount||0)
}

export async function marketplaceCommandCenterSnapshot():Promise<CommandCenterSnapshot>{
 const db=await createServiceClient()
 const since=new Date(Date.now()-24*3600_000).toISOString()
 const recentSince=new Date(Date.now()-2*3600_000).toISOString()
 const [ordersRaw,paymentsRaw,refundsRaw,invoicesRaw,missionsRaw,casesRaw,supportRaw,providersRaw,territoriesRaw,pulse,live,missionSummary]=await Promise.all([
  optional<Row[]>(()=>db.from('angelcare_marketplace_journeys').select('*').gte('created_at',since).order('created_at',{ascending:false}).limit(500),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_payment_intents').select('*').gte('updated_at',since).order('updated_at',{ascending:false}).limit(500),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_payment_refunds').select('*').gte('created_at',since).order('created_at',{ascending:false}).limit(500),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_finance_invoices').select('*').in('status',['draft','issued','partially_paid','overdue']).order('updated_at',{ascending:false}).limit(500),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_operations_missions').select('*').gte('scheduled_start',new Date(Date.now()-12*3600_000).toISOString()).order('scheduled_start',{ascending:true}).limit(500),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_operating_cases').select('*').not('status','in','("closed","cancelled")').order('updated_at',{ascending:false}).limit(300),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_family_support_tickets').select('*').not('status','in','("resolved","closed")').order('updated_at',{ascending:false}).limit(200),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_provider_profiles').select('id,public_reference,display_name,operational_status,territory_id,service_categories,next_action,updated_at').limit(1000),[]),
  optional<Row[]>(()=>db.from('angelcare_marketplace_territories').select('id,territory_code,name,status,currency_label,health_status').eq('status','active').order('name').limit(200),[]),
  businessPulseSnapshot(180).catch(()=>({generatedAt:new Date().toISOString(),events:[],newOrders:0,capturedPayments:0,newInquiries:0,activeFulfillment:0})),
  liveMarketplaceSnapshot(60).catch(()=>({generatedAt:new Date().toISOString(),activeWindowMinutes:60,totalActive:0,byIntent:{},byCity:{},checkoutActive:0,cartsActive:0,anonymous:0,knownCustomers:0,ordersInWindow:0,revenueInWindow:0,inquiriesInWindow:0,providersMapped:0,fulfillmentOpen:0,points:[],commercePoints:[]})),
  fulfillmentMissionSnapshot().catch(()=>({generatedAt:new Date().toISOString(),missions:[],pending:0,active:0,blocked:0,completedToday:0})),
 ])
 const orders=rows(ordersRaw),payments=rows(paymentsRaw),refunds=rows(refundsRaw),invoices=rows(invoicesRaw),missions=rows(missionsRaw),cases=rows(casesRaw),support=rows(supportRaw),providers=rows(providersRaw),territories=rows(territoriesRaw)
 const territoryById=new Map(territories.map(row=>[text(row.id),text(row.name)||text(row.territory_code)||text(row.id)]))
 const providerById=new Map(providers.map(row=>[text(row.id),providerName(row)]))
 const capturedStatuses=new Set(['captured','reconciled','partially_refunded','refunded'])
 const waitingStatuses=new Set(['pending','requires_method','requires_action','authorized','processing','reconciliation_pending'])
 const failedStatuses=new Set(['failed','cancelled'])
 const captured=payments.filter(row=>capturedStatuses.has(status(row)))
 const paymentWaiting=payments.filter(row=>waitingStatuses.has(status(row)))
 const paymentFailed=payments.filter(row=>failedStatuses.has(status(row)))
 const capturedRevenue=captured.reduce((sum,row)=>sum+num(row.captured_amount||row.authorized_amount),0)
 const expectedRevenue=payments.reduce((sum,row)=>sum+num(row.expected_amount),0)
 const outstanding=Math.max(0,paymentWaiting.reduce((sum,row)=>sum+Math.max(0,num(row.expected_amount)-num(row.captured_amount)-num(row.refunded_amount)),0))
 const refunded=refunds.reduce((sum,row)=>sum+num(row.requested_amount||row.external_refund_amount||row.wallet_restore_amount),0)
 const wallet=payments.reduce((sum,row)=>sum+num(row.wallet_contribution),0)
 const offline=payments.filter(row=>['manual_verified','bank_transfer','cash','offline'].includes(text(row.selected_method))).reduce((sum,row)=>sum+num(row.captured_amount||row.expected_amount),0)
 const invoicesDue=invoices.reduce((sum,row)=>sum+Math.max(0,num(row.total_amount)-num(row.paid_amount)),0)
 const reconciliation=payments.filter(row=>status(row)==='reconciliation_pending').reduce((sum,row)=>sum+num(row.captured_amount||row.expected_amount),0)
 const executingMissionStatuses=new Set(['accepted','brief_acknowledged','travel_ready','check_in_pending','in_progress','check_out_pending','report_pending','validation_pending'])
 const blockedMissionStatuses=new Set(['incident_open','correction_required','suspended'])
 const executing=missions.filter(row=>executingMissionStatuses.has(status(row)))
 const blockedMissions=missions.filter(row=>blockedMissionStatuses.has(status(row))||['critical','high'].includes(text(row.risk_level).toLowerCase()))
 const providerReady=providers.filter(row=>status(row)==='active'||text(row.operational_status).toLowerCase()==='active')
 const providerScarce=Math.max(0,Math.min(providerReady.length,blockedMissions.length+missionSummary.pending-Math.max(0,providerReady.length-executing.length)))
 const activeCases=[...cases,...support]
 const criticalCases=activeCases.filter(row=>['critical','urgent','emergency','high'].includes(text(row.priority||row.risk_level).toLowerCase()))
 const conversion=live.totalActive>0?Math.min(100,(live.ordersInWindow/live.totalActive)*100):0
 const capacity=providerReady.length>0?Math.max(0,Math.min(100,100-((missionSummary.pending+blockedMissions.length)/providerReady.length)*100)):null

 const metrics:CommandMetric[]=[
  {key:'revenue',label:'Revenue captured',value:capturedRevenue,display:money(capturedRevenue),deltaLabel:null,severity:'healthy',detail:`${captured.length} paiements capturés / réconciliés`,drawer:'executive'},
  {key:'orders',label:'Orders',value:orders.length,display:String(orders.length),deltaLabel:null,severity:orders.length?'healthy':'watch',detail:'Créées sur les dernières 24 h',drawer:'runway'},
  {key:'executing',label:'Executing',value:executing.length,display:String(executing.length),deltaLabel:null,severity:'healthy',detail:`${missionSummary.pending} à préparer`,drawer:'supply'},
  {key:'payment_waiting',label:'Payment waiting',value:paymentWaiting.length,display:String(paymentWaiting.length),deltaLabel:outstanding?`${money(outstanding)} exposés`:null,severity:severityFromCounts(paymentFailed.length,paymentWaiting.length),detail:`${paymentFailed.length} échec(s)`,drawer:'payment'},
  {key:'blocked',label:'Blocked',value:blockedMissions.length,display:String(blockedMissions.length),deltaLabel:blockedMissions.length?`${blockedMissions.filter(row=>text(row.risk_level).toLowerCase()==='critical').length} critiques`:null,severity:blockedMissions.length?'critical':'healthy',detail:'Missions / incidents',drawer:'supply'},
  {key:'customer_cases',label:'Customer cases',value:activeCases.length,display:String(activeCases.length),deltaLabel:criticalCases.length?`${criticalCases.length} critiques`:null,severity:severityFromCounts(criticalCases.length,activeCases.length-criticalCases.length),detail:'Cases + support ouverts',drawer:'customer-case'},
  {key:'providers',label:'Providers ready',value:providerReady.length,display:String(providerReady.length),deltaLabel:providerScarce?`${providerScarce} sous pression`:null,severity:providerScarce?'attention':'healthy',detail:`${providers.length} profiles réseau`,drawer:'supply'},
  {key:'conversion',label:'Live conversion',value:conversion,display:`${conversion.toFixed(1)}%`,deltaLabel:null,severity:conversion&&conversion<2?'attention':'healthy',detail:`${live.ordersInWindow} order(s) / ${live.totalActive} session(s)`,drawer:'executive'},
  {key:'refunds',label:'Refunds',value:refunded,display:money(refunded),deltaLabel:refunds.length?`${refunds.length} mouvement(s)`:null,severity:refunds.length>5?'attention':'healthy',detail:'Demandés sur 24 h',drawer:'payment'},
  {key:'capacity',label:'Capacity',value:capacity??0,display:capacity===null?'N/A':`${Math.round(capacity)}%`,deltaLabel:null,severity:capacity!==null&&capacity<75?'attention':'healthy',detail:capacity===null?'Signal indisponible':'Readiness providers vs pression missions',drawer:'supply'},
 ]

 const runway:RunwayItem[]=[]
 for(const row of blockedMissions.slice(0,20)){
  const sourceId=text(row.source_id)
  runway.push({id:`mission:${row.id}`,kind:'mission',severity:text(row.risk_level).toLowerCase()==='critical'?'critical':'attention',reference:text(row.public_reference)||`MISSION-${text(row.id).slice(0,8)}`,title:text(row.title)||'Mission bloquée',subtitle:`${text(row.status)} · ${text(row.next_action)||'Recovery requise'}`,amount:null,currencyLabel:'Dh',ageMinutes:ageMinutes(row.updated_at||row.scheduled_start),territory:territoryById.get(text(row.territory_id))||text(row.operational_zone)||null,customerName:text(obj(row.location).customer)||null,customerId:null,orderId:sourceId||null,paymentId:null,missionId:text(row.id)||null,caseId:null,route:sourceId?`/angelcare-marketplace/admin/orders/${sourceId}/command`:`/angelcare-marketplace/admin/operations/missions/${row.id}`,recommendedAction:'Générer / réévaluer les providers éligibles',recommendedActionKey:'generate_replacements',payload:{missionStatus:row.status,riskLevel:row.risk_level,scheduledStart:row.scheduled_start,providerId:row.assigned_provider_id}})
 }
 for(const row of paymentFailed.slice(0,14)){
  const due=Math.max(0,num(row.expected_amount)-num(row.captured_amount)-num(row.refunded_amount))
  runway.push({id:`payment:${row.id}`,kind:'payment',severity:'critical',reference:text(row.public_reference)||`PAY-${text(row.id).slice(0,8)}`,title:'Paiement en échec',subtitle:`${text(row.failure_code||row.status)} · ${text(row.selected_method||row.provider_key)||'méthode inconnue'}`,amount:due||num(row.expected_amount),currencyLabel:text(row.currency_label)||'Dh',ageMinutes:ageMinutes(row.updated_at),territory:null,customerName:null,customerId:text(row.customer_account_id)||null,orderId:text(row.canonical_object_id)||null,paymentId:text(row.id),missionId:null,caseId:null,route:`/angelcare-marketplace/admin/payments/${row.id}/command`,recommendedAction:'Ouvrir le dossier et choisir une recovery financière',recommendedActionKey:'payment_recovery',payload:{status:row.status,expected:row.expected_amount,captured:row.captured_amount,refunded:row.refunded_amount,method:row.selected_method,providerReference:row.provider_reference}})
 }
 for(const row of criticalCases.slice(0,12)){
  runway.push({id:`case:${row.id}`,kind:'case',severity:'critical',reference:text(row.public_reference)||`CASE-${text(row.id).slice(0,8)}`,title:text(row.title||row.subject)||'Case client critique',subtitle:text(row.next_action||row.category||row.status),amount:num(row.financial_exposure)||null,currencyLabel:text(row.currency_label)||'Dh',ageMinutes:ageMinutes(row.updated_at||row.created_at),territory:territoryById.get(text(row.territory_id))||null,customerName:text(row.customer_name)||null,customerId:text(row.customer_id)||null,orderId:text(row.entity_type)==='marketplace_journey'?text(row.entity_id)||null:null,paymentId:null,missionId:null,caseId:text(row.id),route:text(row.id)?`/angelcare-marketplace/admin/operating/cases/${row.id}`:null,recommendedAction:'Trier la cause et appliquer une résolution structurée',recommendedActionKey:'case_resolution',payload:{status:row.status,priority:row.priority,riskLevel:row.risk_level,blockers:row.blockers,sourceReference:row.source_reference}})
 }
 for(const row of paymentWaiting.slice(0,12)){
  if(paymentFailed.some(x=>text(x.id)===text(row.id)))continue
  const due=Math.max(0,num(row.expected_amount)-num(row.captured_amount)-num(row.refunded_amount))
  if(due<=0)continue
  runway.push({id:`payment-wait:${row.id}`,kind:'payment',severity:'attention',reference:text(row.public_reference)||`PAY-${text(row.id).slice(0,8)}`,title:'Paiement en attente',subtitle:`${text(row.status)} · ${text(row.selected_method||row.provider_key)||'méthode à définir'}`,amount:due,currencyLabel:text(row.currency_label)||'Dh',ageMinutes:ageMinutes(row.updated_at),territory:null,customerName:null,customerId:text(row.customer_account_id)||null,orderId:text(row.canonical_object_id)||null,paymentId:text(row.id),missionId:null,caseId:null,route:`/angelcare-marketplace/admin/payments/${row.id}/command`,recommendedAction:'Confirmer, relancer ou enregistrer un paiement vérifié',recommendedActionKey:'payment_attention',payload:{status:row.status,expected:row.expected_amount,captured:row.captured_amount,refunded:row.refunded_amount,method:row.selected_method}})
 }
 const unassigned=missions.filter(row=>!text(row.assigned_provider_id)&&!['closed','cancelled','validated'].includes(status(row))).slice(0,12)
 for(const row of unassigned){
  runway.push({id:`unassigned:${row.id}`,kind:'mission',severity:'attention',reference:text(row.public_reference)||`MISSION-${text(row.id).slice(0,8)}`,title:text(row.title)||'Mission non assignée',subtitle:`${new Date(text(row.scheduled_start)).toLocaleString('fr-FR')} · ${text(row.service_type)}`,amount:null,currencyLabel:'Dh',ageMinutes:ageMinutes(row.updated_at||row.created_at),territory:territoryById.get(text(row.territory_id))||text(row.operational_zone)||null,customerName:text(obj(row.location).customer)||null,customerId:null,orderId:text(row.source_id)||null,paymentId:null,missionId:text(row.id),caseId:null,route:text(row.source_id)?`/angelcare-marketplace/admin/orders/${row.source_id}/command`:`/angelcare-marketplace/admin/operations/missions/${row.id}`,recommendedAction:'Scorer les providers et assigner',recommendedActionKey:'generate_assignments',payload:{scheduledStart:row.scheduled_start,scheduledEnd:row.scheduled_end,serviceType:row.service_type}})
 }
 const triageStatuses=new Set(['draft','created','pending','initiated','confirmed','payment_pending'])
 const recentOrders=orders.filter(row=>triageStatuses.has(status(row))||ageMinutes(row.created_at)!==null&&Number(ageMinutes(row.created_at))<=120).slice(0,10)
 for(const row of recentOrders){
  runway.push({id:`order:${row.id}`,kind:'order',severity:status(row)==='confirmed'?'watch':'attention',reference:text(row.public_reference)||`ORD-${text(row.id).slice(0,8)}`,title:text(row.title)||'Incoming order',subtitle:`${text(row.journey_type)||'marketplace'} · ${text(row.status)||'created'}`,amount:orderAmount(row)||null,currencyLabel:'Dh',ageMinutes:ageMinutes(row.created_at),territory:territoryById.get(orderTerritory(row)||'')||orderTerritory(row),customerName:orderCustomer(row),customerId:text(row.customer_account_id)||null,orderId:text(row.id),paymentId:null,missionId:null,caseId:null,route:`/angelcare-marketplace/admin/orders/${row.id}/command`,recommendedAction:'Trier la commande, confirmer le contexte et matérialiser la prochaine action',recommendedActionKey:'order_triage',payload:{journeyType:row.journey_type,status:row.status,financialStatus:row.financial_status,fulfillmentStatus:row.fulfillment_status,scheduledStartAt:row.scheduled_start_at,scheduledEndAt:row.scheduled_end_at}})
 }
 runway.sort(runwaySort)

 const events:CommandCenterEvent[]=pulse.events.slice(0,80).map(event=>({id:event.id,kind:event.kind,reference:event.reference,title:event.title,subtitle:event.subtitle,status:event.status,route:event.route,occurredAt:event.occurredAt,amount:event.amount??null,currencyLabel:event.currencyLabel??null,territory:null}))

 const pressure:PressureRow[]=[
  {key:'orders',label:'Orders',healthy:Math.max(0,orders.length-unassigned.length-blockedMissions.length),attention:unassigned.length,critical:blockedMissions.length,trend:orders.length>0?'up':'flat',exposure:orders.reduce((s,r)=>s+orderAmount(r),0),exposureLabel:money(orders.reduce((s,r)=>s+orderAmount(r),0)),drawer:'runway'},
  {key:'payments',label:'Payments',healthy:captured.length,attention:paymentWaiting.length,critical:paymentFailed.length,trend:paymentFailed.length?'down':captured.length?'up':'flat',exposure:outstanding,exposureLabel:money(outstanding),drawer:'payment'},
  {key:'fulfillment',label:'Fulfillment',healthy:Math.max(0,missions.length-blockedMissions.length-unassigned.length),attention:unassigned.length,critical:blockedMissions.length,trend:blockedMissions.length?'down':'flat',exposure:null,exposureLabel:`${missionSummary.pending} à préparer`,drawer:'supply'},
  {key:'providers',label:'Providers',healthy:providerReady.length,attention:providerScarce,critical:providers.filter(r=>['blocked','suspended'].includes(text(r.operational_status).toLowerCase())).length,trend:providerScarce?'down':'flat',exposure:null,exposureLabel:`${providerReady.length} ready`,drawer:'supply'},
  {key:'customers',label:'Customer Care',healthy:0,attention:Math.max(0,activeCases.length-criticalCases.length),critical:criticalCases.length,trend:criticalCases.length?'down':'flat',exposure:criticalCases.reduce((s,r)=>s+num(r.financial_exposure),0),exposureLabel:criticalCases.length?`${criticalCases.length} critiques`:'Aucun critique',drawer:'customer-case'},
  {key:'capacity',label:'Capacity',healthy:capacity===null?0:Math.round(capacity),attention:capacity!==null&&capacity<80?1:0,critical:capacity!==null&&capacity<60?1:0,trend:capacity!==null&&capacity<75?'down':'flat',exposure:null,exposureLabel:capacity===null?'Signal indisponible':`${Math.round(capacity)}%`,drawer:'supply'},
 ]

 const orderByTerritory=new Map<string,{count:number;revenue:number}>()
 for(const order of orders){const key=orderTerritory(order);if(!key)continue;const current=orderByTerritory.get(key)||{count:0,revenue:0};current.count+=1;current.revenue+=orderAmount(order);orderByTerritory.set(key,current)}
 const missionByTerritory=new Map<string,number>()
 for(const mission of missions){const key=text(mission.territory_id);if(!key)continue;missionByTerritory.set(key,(missionByTerritory.get(key)||0)+1)}
 const providerByTerritory=new Map<string,number>()
 for(const provider of providerReady){const key=text(provider.territory_id);if(!key)continue;providerByTerritory.set(key,(providerByTerritory.get(key)||0)+1)}
 const casesByTerritory=new Map<string,number>()
 for(const item of activeCases){const key=text(item.territory_id);if(!key)continue;casesByTerritory.set(key,(casesByTerritory.get(key)||0)+1)}
 const territoriesPulse:TerritoryPulse[]=territories.map(row=>{
  const id=text(row.id);const demand=(orderByTerritory.get(id)?.count||0)+Object.entries(live.byCity).filter(([city])=>text(row.name).toLowerCase().includes(city.toLowerCase())||city.toLowerCase().includes(text(row.name).toLowerCase())).reduce((s,[,count])=>s+Number(count||0),0)
  const supply=providerByTerritory.get(id)||0;const capacityPercent=supply>0?Math.max(0,Math.min(100,100-(Math.max(0,demand-supply)/supply)*100)):null;const shortage=Math.max(0,demand-supply);const severity:CommandSeverity=shortage>5?'critical':shortage>0?'attention':'healthy'
  return{id,name:text(row.name)||text(row.territory_code)||id,code:text(row.territory_code)||null,demand,supply,capacityPercent,openOrders:orderByTerritory.get(id)?.count||0,activeMissions:missionByTerritory.get(id)||0,revenue:orderByTerritory.get(id)?.revenue||0,conversion:null,providerShortage:shortage,customerCases:casesByTerritory.get(id)||0,severity}
 }).sort((a,b)=>b.providerShortage-a.providerShortage||b.revenue-a.revenue).slice(0,8)

 const moneyMotion:MoneyMotion={ordered:orders.reduce((s,r)=>s+orderAmount(r),0)||expectedRevenue,authorized:payments.reduce((s,r)=>s+num(r.authorized_amount),0),captured:capturedRevenue,outstanding,refunded,wallet,offline,invoicesDue,reconciliation}
 const operatingMoves:OperatingMove[]=[]
 if(blockedMissions.length)operatingMoves.push({id:'blocked-missions',rank:1,title:`Résoudre ${blockedMissions.length} mission(s) bloquée(s)`,impact:`${blockedMissions.filter(r=>text(r.risk_level).toLowerCase()==='critical').length} critique(s) · continuité service`,actionLabel:'OPEN RECOVERY QUEUE',drawer:'supply',severity:'critical',targetId:text(blockedMissions[0]?.id)||null})
 if(unassigned.length)operatingMoves.push({id:'assignments',rank:2,title:`Assigner ${unassigned.length} mission(s) non staffée(s)`,impact:'Éligibilité, territoire, disponibilité et conflits disponibles',actionLabel:'GENERATE ASSIGNMENTS',drawer:'supply',severity:'attention',targetId:text(unassigned[0]?.id)||null})
 if(paymentWaiting.length)operatingMoves.push({id:'payment-recovery',rank:3,title:`Traiter ${paymentWaiting.length} paiement(s) en attente`,impact:`Exposition ${money(outstanding)}`,actionLabel:'OPEN PAYMENT RECOVERY',drawer:'payment',severity:paymentFailed.length?'critical':'attention',targetId:text((paymentFailed[0]||paymentWaiting[0])?.id)||null})
 const pressuredTerritory=territoriesPulse.find(t=>t.providerShortage>0)
 if(pressuredTerritory)operatingMoves.push({id:'territory-pressure',rank:4,title:`Pression capacité · ${pressuredTerritory.name}`,impact:`Demande ${pressuredTerritory.demand} · Supply ${pressuredTerritory.supply} · déficit ${pressuredTerritory.providerShortage}`,actionLabel:'OPEN TERRITORY',drawer:'territory',severity:pressuredTerritory.severity==='critical'?'critical':'attention',targetId:pressuredTerritory.id})
 if(criticalCases.length)operatingMoves.push({id:'customer-cases',rank:5,title:`Prendre en charge ${criticalCases.length} case(s) client critique(s)`,impact:'Expérience client et valeur relationnelle à protéger',actionLabel:'OPEN CASE QUEUE',drawer:'customer-case',severity:'critical',targetId:text(criticalCases[0]?.id)||null})
 operatingMoves.sort((a,b)=>a.rank-b.rank)

 const watch:ExecutiveSignal[]=[
  {id:'revenue',label:'Revenue captured · 24h',value:money(capturedRevenue),direction:capturedRevenue?'up':'flat',severity:'healthy',detail:`${captured.length} paiements capturés`,drawer:'executive'},
  {id:'conversion',label:'Conversion live · 60m',value:`${conversion.toFixed(1)}%`,direction:conversion>=3?'up':conversion>0?'flat':'down',severity:conversion&&conversion<2?'attention':'healthy',detail:`${live.totalActive} sessions actives · ${live.ordersInWindow} orders`,drawer:'executive'},
  {id:'capacity',label:'Capacity réseau',value:capacity===null?'N/A':`${Math.round(capacity)}%`,direction:capacity!==null&&capacity<75?'down':'flat',severity:capacity!==null&&capacity<60?'critical':capacity!==null&&capacity<80?'attention':'healthy',detail:`${providerReady.length} providers actifs · ${missionSummary.pending} missions à préparer`,drawer:'supply'},
  {id:'customer',label:'Customer cases critiques',value:String(criticalCases.length),direction:criticalCases.length?'down':'flat',severity:criticalCases.length?'critical':'healthy',detail:`${activeCases.length} case(s) ouverts`,drawer:'customer-case'},
  {id:'refunds',label:'Refunds · 24h',value:money(refunded),direction:refunds.length?'down':'flat',severity:refunds.length>5?'attention':'healthy',detail:`${refunds.length} remboursement(s)`,drawer:'payment'},
 ]
 const unavailableSignals:string[]=[]
 if(!territories.length)unavailableSignals.push('Territory master data')
 if(!providers.length)unavailableSignals.push('Provider network readiness')
 if(!payments.length&&!orders.length)unavailableSignals.push('24h commerce volume')
 if(!live.totalActive)unavailableSignals.push('Live conversion denominator')
 return{generatedAt:new Date().toISOString(),windowLabel:'24H · live 60m',metrics,runway:runway.slice(0,30),events,pressure,territories:territoriesPulse,money:moneyMotion,operatingMoves:operatingMoves.slice(0,6),executiveWatch:watch,counts:{orders:orders.length,payments:payments.length,missions:missions.length,cases:activeCases.length,providers:providers.length,territories:territories.length},health:{unavailableSignals}}
}
