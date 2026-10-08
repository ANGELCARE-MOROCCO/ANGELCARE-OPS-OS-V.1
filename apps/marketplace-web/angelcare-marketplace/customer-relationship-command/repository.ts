import { createServiceClient } from '@/lib/supabase/server'
import type {
  CrmRelationshipOpportunity, CustomerCaseRecord, CustomerRelationshipOverview, FamilyRelationship,
  RelationshipAttention, RelationshipCustomer, RelationshipEvent, RelationshipMovement, RelationshipSegment,
} from './types'

type Row = Record<string, unknown>
const text = (value: unknown) => value === null || value === undefined ? '' : String(value)
const num = (value: unknown) => { const n = Number(value); return Number.isFinite(n) ? n : 0 }
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter(Boolean) as Row[] : []
const iso = (value: unknown) => { const d = new Date(text(value)); return Number.isNaN(d.getTime()) ? null : d.toISOString() }
const days = (value: unknown) => { const t = new Date(text(value)).getTime(); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : 0 }
const activeOrderStatuses = new Set(['registered','awaiting_customer','awaiting_angelcare','qualified','scheduled','in_preparation','in_progress','blocked','recovery'])
const capturedStatuses = new Set(['captured','partially_captured','partially_refunded','refunded','reconciled'])
const waitingPaymentStatuses = new Set(['created','requires_method','requires_customer_action','pending','authorized','partially_captured','reconciliation_pending'])
const openSubscriptionStatuses = new Set(['trial','active','paused','past_due'])
const openCaseStatuses = new Set(['open','intake','validation','qualified','ready','in_progress','evidence_pending','approval_pending','blocked','recovery','reconciled'])
const criticalWords = new Set(['critical','urgent','high'])

async function optional<T>(fn: () => PromiseLike<{ data?: unknown; error?: unknown }> | Promise<{ data?: unknown; error?: unknown }>, fallback: T): Promise<T> {
  try { const result = await fn(); if (result && 'error' in result && result.error) return fallback; return ((result as { data?: unknown })?.data ?? fallback) as T } catch { return fallback }
}

function amountFromJourney(row: Row) {
  const financial = row.financial_status && typeof row.financial_status === 'object' ? row.financial_status as Row : {}
  return num(financial.grand_total || financial.total || financial.amount || financial.order_total)
}

export async function customerRelationshipOverview(): Promise<CustomerRelationshipOverview> {
  const db = await createServiceClient()
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
  const activitySince = new Date(Date.now() - 30 * 86400000).toISOString()

  const [customersRaw, addressesRaw, journeysRaw, paymentsRaw, refundsRaw, walletsRaw, subscriptionsRaw, invoicesRaw, casesRaw, familySupportRaw, familiesRaw, guardiansRaw, childrenRaw, familyRequestsRaw, familyMissionsRaw, opportunitiesRaw, leadsRaw, inquiriesRaw] = await Promise.all([
    optional<Row[]>(() => db.from('angelcare_marketplace_customer_accounts').select('id,public_reference,account_kind,status,display_name,email,phone,preferred_locale,family_account_id,crm_account_id,premium_status,created_at,updated_at,metadata').order('updated_at',{ascending:false}).limit(500), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_customer_addresses').select('id,customer_account_id,label,city,address_line,is_default,status,updated_at').eq('status','active').limit(1500), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_journeys').select('id,public_reference,journey_type,status,title,customer_account_id,family_account_id,scheduled_start_at,scheduled_end_at,financial_status,risk_level,created_at,updated_at').order('updated_at',{ascending:false}).limit(3000), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_payment_intents').select('id,public_reference,customer_account_id,status,expected_amount,captured_amount,refunded_amount,wallet_contribution,created_at,updated_at').order('updated_at',{ascending:false}).limit(3000), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_payment_refunds').select('id,payment_intent_id,requested_amount,external_refund_amount,wallet_restore_amount,status,created_at').gte('created_at',activitySince).limit(1500), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_wallet_accounts').select('id,customer_account_id,status,available_balance,lifetime_spent,updated_at').limit(1000), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_customer_subscriptions').select('id,public_reference,customer_account_id,status,amount,created_at,updated_at').limit(1500), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_finance_invoices').select('id,public_reference,customer_account_id,status,total_amount,paid_amount,balance_due,due_at,updated_at').limit(2000), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_operating_cases').select('id,public_reference,workspace_key,customer_id,title,status,priority,risk_level,next_action,due_at,financial_exposure,currency_label,source_reference,updated_at').in('status',[...openCaseStatuses]).order('updated_at',{ascending:false}).limit(1000), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_family_support_tickets').select('id,public_reference,family_account_id,status,priority,subject,updated_at').not('status','in','("resolved","closed")').limit(1000), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_family_accounts').select('id,public_reference,display_name,city,status,created_at,updated_at').limit(600), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_family_guardians').select('id,public_reference,family_account_id,customer_account_id,full_name,relationship,email,phone,is_primary,status').neq('status','archived').limit(1600), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_family_children').select('id,public_reference,family_account_id,first_name,birth_date,school_level,status').neq('status','archived').limit(1600), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_family_quote_requests').select('id,family_account_id,status,updated_at').not('status','in','("accepted","declined","cancelled")').limit(1200), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_family_missions').select('id,family_account_id,status,updated_at').not('status','in','("completed","cancelled")').limit(1200), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_crm_opportunities').select('id,public_reference,account_id,lead_id,name,stage,estimated_value,probability,expected_close_at,next_action,next_action_at,updated_at').order('updated_at',{ascending:false}).limit(600), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_crm_leads').select('id,public_reference,name,email,phone,status,source,updated_at').order('updated_at',{ascending:false}).limit(600), []),
    optional<Row[]>(() => db.from('angelcare_marketplace_public_inquiries').select('id,public_reference,linked_customer_account_id,full_name,status,created_at,updated_at').gte('updated_at',activitySince).order('updated_at',{ascending:false}).limit(1000), []),
  ])

  const customers = rows(customersRaw), addresses = rows(addressesRaw), journeys = rows(journeysRaw), payments = rows(paymentsRaw), refunds = rows(refundsRaw), wallets = rows(walletsRaw), subscriptions = rows(subscriptionsRaw), invoices = rows(invoicesRaw), cases = rows(casesRaw), families = rows(familiesRaw), guardians = rows(guardiansRaw), children = rows(childrenRaw), familyRequests = rows(familyRequestsRaw), familyMissions = rows(familyMissionsRaw), opportunities = rows(opportunitiesRaw), inquiries = rows(inquiriesRaw)
  const paymentById = new Map(payments.map(row => [text(row.id), row]))
  const customerNameById = new Map(customers.map(row => [text(row.id), text(row.display_name)]))
  const familyToCustomer = new Map(customers.filter(row => row.family_account_id).map(row => [text(row.family_account_id), text(row.id)]))
  const addressesByCustomer = new Map<string, Row[]>()
  for (const row of addresses) { const key = text(row.customer_account_id); addressesByCustomer.set(key,[...(addressesByCustomer.get(key)||[]),row]) }
  const journeysByCustomer = new Map<string, Row[]>(), paymentsByCustomer = new Map<string, Row[]>(), walletsByCustomer = new Map<string, Row[]>(), subsByCustomer = new Map<string, Row[]>(), invoicesByCustomer = new Map<string, Row[]>(), casesByCustomer = new Map<string, Row[]>()
  const push = (map: Map<string,Row[]>, key: string, row: Row) => { if (!key) return; map.set(key,[...(map.get(key)||[]),row]) }
  for (const row of journeys) push(journeysByCustomer,text(row.customer_account_id),row)
  for (const row of payments) push(paymentsByCustomer,text(row.customer_account_id),row)
  for (const row of wallets) push(walletsByCustomer,text(row.customer_account_id),row)
  for (const row of subscriptions) push(subsByCustomer,text(row.customer_account_id),row)
  for (const row of invoices) push(invoicesByCustomer,text(row.customer_account_id),row)
  for (const row of cases) push(casesByCustomer,text(row.customer_id),row)
  for (const row of rows(familySupportRaw)) { const customerId = familyToCustomer.get(text(row.family_account_id)) || ''; if (customerId) push(casesByCustomer,customerId,{...row,title:row.subject,financial_exposure:0,risk_level:row.priority}) }

  const relationshipCustomers: RelationshipCustomer[] = customers.map(row => {
    const id = text(row.id), orderRows = journeysByCustomer.get(id)||[], paymentRows = paymentsByCustomer.get(id)||[], wallet = (walletsByCustomer.get(id)||[])[0], subRows = subsByCustomer.get(id)||[], invoiceRows = invoicesByCustomer.get(id)||[], caseRows = casesByCustomer.get(id)||[]
    const capturedRevenue = paymentRows.filter(p => capturedStatuses.has(text(p.status))).reduce((s,p)=>s+num(p.captured_amount),0)
    const refundTotal = refunds.filter(r => text(paymentById.get(text(r.payment_intent_id))?.customer_account_id)===id).reduce((s,r)=>s+num(r.requested_amount||r.external_refund_amount||r.wallet_restore_amount),0)
    const outstandingPayments = paymentRows.filter(p => waitingPaymentStatuses.has(text(p.status))).reduce((s,p)=>s+Math.max(0,num(p.expected_amount)-num(p.captured_amount)-num(p.refunded_amount)),0)
    const invoiceOutstanding = invoiceRows.filter(i => !['paid','cancelled','credited'].includes(text(i.status))).reduce((s,i)=>s+num(i.balance_due),0)
    const orderDates = orderRows.map(o=>iso(o.created_at)).filter(Boolean) as string[]
    const lastOrderAt = orderDates.sort().at(-1)||null
    const lastActivityCandidates = [iso(row.updated_at),lastOrderAt,...paymentRows.map(p=>iso(p.updated_at)),...caseRows.map(c=>iso(c.updated_at))].filter(Boolean) as string[]
    const lastActivityAt = lastActivityCandidates.sort().at(-1)||null
    const criticalCases = caseRows.filter(c=>criticalWords.has(text(c.priority).toLowerCase())||criticalWords.has(text(c.risk_level).toLowerCase())).length
    const riskReasons: string[] = []
    if (criticalCases) riskReasons.push(`${criticalCases} case(s) critique(s)`)
    if (outstandingPayments + invoiceOutstanding > 0) riskReasons.push('Exposition financière ouverte')
    if (lastOrderAt && days(lastOrderAt)>90 && orderRows.length>1) riskReasons.push(`Inactif depuis ${days(lastOrderAt)} jours`)
    if (paymentRows.some(p=>['failed','chargeback','disputed'].includes(text(p.status)))) riskReasons.push('Incident de paiement')
    const risk: RelationshipCustomer['risk'] = criticalCases > 0 ? 'critical' : riskReasons.length > 0 ? 'attention' : 'healthy'
    const defaultAddress = (addressesByCustomer.get(id)||[]).find(a=>a.is_default) || (addressesByCustomer.get(id)||[])[0]
    return {
      id, reference:text(row.public_reference), name:text(row.display_name), email:text(row.email)||null, phone:text(row.phone)||null,
      accountKind:text(row.account_kind), status:text(row.status), premium:Boolean(row.premium_status), locale:text(row.preferred_locale)||'fr', city:text(defaultAddress?.city || (row.metadata as Row | undefined)?.city)||null,
      createdAt:text(row.created_at), updatedAt:text(row.updated_at), orderCount:orderRows.length, activeOrders:orderRows.filter(o=>activeOrderStatuses.has(text(o.status))).length,
      bookingCount:orderRows.filter(o=>text(o.journey_type)==='family_booking').length, activeSubscriptions:subRows.filter(s=>openSubscriptionStatuses.has(text(s.status))).length,
      capturedRevenue, averageOrderValue:orderRows.length ? capturedRevenue/orderRows.length : 0, outstanding:Math.max(outstandingPayments,invoiceOutstanding), walletBalance:num(wallet?.available_balance), refundTotal,
      openCases:caseRows.length, criticalCases, lastOrderAt, lastActivityAt, relationshipDays:days(row.created_at), risk, riskReasons,
    }
  }).sort((a,b)=>b.capturedRevenue-a.capturedRevenue)

  const active = relationshipCustomers.filter(c=>c.status==='active').length
  const premium = relationshipCustomers.filter(c=>c.premium).length
  const newThisMonth = relationshipCustomers.filter(c=>new Date(c.createdAt).getTime()>=monthStart.getTime()).length
  const atRisk = relationshipCustomers.filter(c=>c.risk!=='healthy').length
  const openOrders = relationshipCustomers.reduce((s,c)=>s+c.activeOrders,0)
  const openBookings = relationshipCustomers.reduce((s,c)=>s+(c.activeOrders ? (journeysByCustomer.get(c.id)||[]).filter(o=>text(o.journey_type)==='family_booking'&&activeOrderStatuses.has(text(o.status))).length:0),0)
  const customerValue = relationshipCustomers.reduce((s,c)=>s+c.capturedRevenue,0)
  const outstanding = relationshipCustomers.reduce((s,c)=>s+c.outstanding,0)
  const creditBalance = relationshipCustomers.reduce((s,c)=>s+c.walletBalance,0)

  const movements: RelationshipMovement[] = []
  for (const c of relationshipCustomers.slice(0,150)) {
    if (new Date(c.createdAt).getTime() >= monthStart.getTime()) movements.push({id:`new:${c.id}`,kind:'new',customerId:c.id,reference:c.reference,title:c.name,subtitle:'Nouvelle relation client',occurredAt:c.createdAt,severity:'healthy'})
    if (c.premium) movements.push({id:`premium:${c.id}`,kind:'premium',customerId:c.id,reference:c.reference,title:c.name,subtitle:'Relation premium',occurredAt:c.updatedAt,value:c.capturedRevenue,severity:'healthy'})
    if (c.capturedRevenue>=50000) movements.push({id:`value:${c.id}`,kind:'high_value',customerId:c.id,reference:c.reference,title:c.name,subtitle:'Relation à forte valeur',occurredAt:c.lastActivityAt||c.updatedAt,value:c.capturedRevenue,severity:'healthy'})
    if (c.risk!=='healthy') movements.push({id:`risk:${c.id}`,kind:'at_risk',customerId:c.id,reference:c.reference,title:c.name,subtitle:c.riskReasons[0]||'Attention relation',occurredAt:c.lastActivityAt||c.updatedAt,value:c.outstanding,severity:c.risk})
  }
  movements.sort((a,b)=>new Date(b.occurredAt).getTime()-new Date(a.occurredAt).getTime())

  const attention: RelationshipAttention[] = relationshipCustomers.filter(c=>c.risk!=='healthy'||c.outstanding>0).map((c): RelationshipAttention=>({
    id:`attention:${c.id}`,customerId:c.id,reference:c.reference,customerName:c.name,customerValue:c.capturedRevenue,premium:c.premium,
    reason:c.riskReasons[0]||'Exposition relation',detail:[c.openCases?`${c.openCases} case(s) ouvert(s)`:null,c.outstanding?`${Math.round(c.outstanding).toLocaleString('fr-FR')} Dh exposés`:null,c.lastOrderAt&&days(c.lastOrderAt)>90?`${days(c.lastOrderAt)} jours depuis dernière commande`:null].filter(Boolean).join(' · '),
    exposure:c.outstanding,severity:c.risk,action:c.criticalCases?'resolve':c.outstanding?'recover':'contact',
  })).sort((a,b)=>(b.severity==='critical'?2:1)-(a.severity==='critical'?2:1)||b.exposure-a.exposure)

  const makeSegment = (key:string,label:string,list:RelationshipCustomer[],description:string,severity:'healthy'|'attention'|'critical'='healthy'):RelationshipSegment=>({key,label,count:list.length,value:list.reduce((s,c)=>s+c.capturedRevenue,0),description,severity})
  const segments:RelationshipSegment[]=[
    makeSegment('high_value','High value',relationshipCustomers.filter(c=>c.capturedRevenue>=20000),'Relations à forte contribution'),
    makeSegment('premium','Premium',relationshipCustomers.filter(c=>c.premium),'Familles et comptes premium'),
    makeSegment('new','New',relationshipCustomers.filter(c=>new Date(c.createdAt).getTime()>=monthStart.getTime()),'Nouvelles relations du mois'),
    makeSegment('at_risk','At risk',relationshipCustomers.filter(c=>c.risk!=='healthy'),'Relation ou revenu à protéger','attention'),
    makeSegment('dormant','Dormant',relationshipCustomers.filter(c=>Boolean(c.lastOrderAt)&&days(c.lastOrderAt)>90),'Clients ayant déjà acheté mais actuellement dormants','attention'),
    makeSegment('outstanding','Outstanding',relationshipCustomers.filter(c=>c.outstanding>0),'Exposition financière client','attention'),
    makeSegment('credit','Credit active',relationshipCustomers.filter(c=>c.walletBalance>0),'AngelCare Credit disponible'),
    makeSegment('repeat','Repeat',relationshipCustomers.filter(c=>c.orderCount>=3),'Relations récurrentes'),
  ]

  const familyRecords:FamilyRelationship[] = families.map(f=>{
    const familyId=text(f.id), customerId=familyToCustomer.get(familyId)||null
    return {id:familyId,reference:text(f.public_reference),displayName:text(f.display_name)||customerNameById.get(customerId||'')||'Famille',customerId,customerName:customerId?customerNameById.get(customerId)||null:null,
      guardians:guardians.filter(g=>text(g.family_account_id)===familyId).map(g=>({id:text(g.id),reference:text(g.public_reference),name:text(g.full_name),relationship:text(g.relationship),email:text(g.email)||null,phone:text(g.phone)||null,primary:Boolean(g.is_primary),status:text(g.status)})),
      children:children.filter(c=>text(c.family_account_id)===familyId).map(c=>({id:text(c.id),reference:text(c.public_reference),name:text(c.first_name),birthDate:iso(c.birth_date),schoolLevel:text(c.school_level)||null,status:text(c.status)})),
      addresses:customerId?(addressesByCustomer.get(customerId)||[]).map(a=>({id:text(a.id),label:text(a.label)||'Adresse',city:text(a.city),line:text(a.address_line),isDefault:Boolean(a.is_default),status:text(a.status)})):[],
      supportOpen:rows(familySupportRaw).filter(t=>text(t.family_account_id)===familyId).length,requestOpen:familyRequests.filter(r=>text(r.family_account_id)===familyId).length,missionOpen:familyMissions.filter(m=>text(m.family_account_id)===familyId).length}
  }).sort((a,b)=>(b.supportOpen+b.requestOpen+b.missionOpen)-(a.supportOpen+a.requestOpen+a.missionOpen))

  const crmOpportunities:CrmRelationshipOpportunity[]=opportunities.map(o=>({id:text(o.id),reference:text(o.public_reference),name:text(o.name),stage:text(o.stage),estimatedValue:num(o.estimated_value),probability:num(o.probability),expectedCloseAt:iso(o.expected_close_at),nextAction:text(o.next_action)||null,nextActionAt:iso(o.next_action_at),accountId:text(o.account_id)||null,leadId:text(o.lead_id)||null,updatedAt:text(o.updated_at)}))
  const caseRecords:CustomerCaseRecord[]=cases.map(c=>({id:text(c.id),reference:text(c.public_reference),customerId:text(c.customer_id)||null,customerName:customerNameById.get(text(c.customer_id))||null,title:text(c.title),status:text(c.status),priority:text(c.priority),riskLevel:text(c.risk_level),nextAction:text(c.next_action)||null,dueAt:iso(c.due_at),exposure:num(c.financial_exposure),currency:text(c.currency_label)||'Dh',updatedAt:text(c.updated_at),workspaceKey:text(c.workspace_key),sourceReference:text(c.source_reference)||null}))

  const activity:RelationshipEvent[] = []
  for(const c of relationshipCustomers.filter(c=>new Date(c.updatedAt).getTime()>=new Date(activitySince).getTime()).slice(0,100)) activity.push({id:`customer:${c.id}:${c.updatedAt}`,kind:'customer',reference:c.reference,title:c.name,subtitle:'Relation mise à jour',occurredAt:c.updatedAt,customerId:c.id,status:c.status})
  for(const o of journeys.filter(o=>new Date(text(o.updated_at)).getTime()>=new Date(activitySince).getTime()).slice(0,160)) activity.push({id:`order:${text(o.id)}`,kind:text(o.journey_type)==='family_booking'?'booking':'order',reference:text(o.public_reference),title:text(o.title),subtitle:text(o.status),occurredAt:text(o.updated_at),customerId:text(o.customer_account_id)||null,amount:amountFromJourney(o),status:text(o.status)})
  for(const p of payments.filter(p=>new Date(text(p.updated_at)).getTime()>=new Date(activitySince).getTime()).slice(0,160)) activity.push({id:`payment:${text(p.id)}`,kind:'payment',reference:text(p.public_reference),title:'Paiement Marketplace',subtitle:text(p.status),occurredAt:text(p.updated_at),customerId:text(p.customer_account_id)||null,amount:num(p.captured_amount||p.expected_amount),status:text(p.status)})
  for(const c of caseRecords.slice(0,100)) activity.push({id:`case:${c.id}`,kind:'case',reference:c.reference,title:c.title,subtitle:`${c.status} · ${c.priority}`,occurredAt:c.updatedAt,customerId:c.customerId,amount:c.exposure,status:c.status})
  for(const i of inquiries.slice(0,100)) activity.push({id:`inquiry:${text(i.id)}`,kind:'inquiry',reference:text(i.public_reference),title:text(i.full_name),subtitle:`Inquiry · ${text(i.status)}`,occurredAt:text(i.updated_at),customerId:text(i.linked_customer_account_id)||null,status:text(i.status)})
  for(const o of crmOpportunities.slice(0,100)) activity.push({id:`crm:${o.id}`,kind:'crm',reference:o.reference,title:o.name,subtitle:`${o.stage} · ${o.probability}%`,occurredAt:o.updatedAt,amount:o.estimatedValue,status:o.stage})
  activity.sort((a,b)=>new Date(b.occurredAt).getTime()-new Date(a.occurredAt).getTime())

  const nextMoves = [
    attention.filter(a=>a.severity==='critical').length ? {id:'critical',rank:1,title:`Résoudre ${attention.filter(a=>a.severity==='critical').length} relation(s) critique(s)`,detail:'Cases critiques et impacts clients prioritaires',actionLabel:'OPEN RECOVERY',targetCustomerId:attention.find(a=>a.severity==='critical')?.customerId,severity:'critical' as const}:null,
    outstanding>0 ? {id:'payments',rank:2,title:'Récupérer les expositions financières ouvertes',detail:`${Math.round(outstanding).toLocaleString('fr-FR')} Dh à sécuriser`,actionLabel:'OPEN CUSTOMERS',targetCustomerId:attention.find(a=>a.exposure>0)?.customerId,severity:'attention' as const}:null,
    relationshipCustomers.some(c=>Boolean(c.lastOrderAt)&&days(c.lastOrderAt)>90) ? {id:'dormant',rank:3,title:'Réactiver les relations dormantes',detail:'Clients historiques sans commande récente',actionLabel:'VIEW SEGMENT',severity:'attention' as const}:null,
    crmOpportunities.filter(o=>!['won','lost'].includes(o.stage)).length ? {id:'crm',rank:4,title:'Faire avancer le pipeline relationnel',detail:`${crmOpportunities.filter(o=>!['won','lost'].includes(o.stage)).length} opportunité(s) ouvertes`,actionLabel:'OPEN CRM',severity:'healthy' as const}:null,
  ].filter(Boolean) as CustomerRelationshipOverview['nextMoves']

  return {generatedAt:new Date().toISOString(),metrics:{active,premium,newThisMonth,atRisk,openOrders,openBookings,customerValue,outstanding,creditBalance},customers:relationshipCustomers,movements:movements.slice(0,60),attention:attention.slice(0,60),segments,nextMoves,activity:activity.slice(0,200),families:familyRecords.slice(0,300),opportunities:crmOpportunities,cases:caseRecords}
}
