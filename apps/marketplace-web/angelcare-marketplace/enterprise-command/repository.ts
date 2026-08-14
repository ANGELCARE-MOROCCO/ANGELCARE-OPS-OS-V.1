import { createServiceClient } from '@/lib/supabase/server'
import type {
  BusinessPulseEvent, BusinessPulseSnapshot, CustomerMegaDossier, EnterpriseSearchHit,
  EnterpriseTimelineEvent, FulfillmentMissionSnapshot, LiveCommercePoint, LiveMarketplaceSnapshot, LiveVisitorPoint,
  OrderMegaDossier, SegmentPreview, DocumentTemplateRecord, DocumentTemplateKey,
} from './types'
import { enterpriseReference, orderPhaseReference } from './references'

// Enterprise command reads are deliberately tolerant of additive premium tables that may not yet
// exist in a maintenance-window database. Core records still render; optional panels degrade to [].
type Row = Record<string, any>
const rows=(v:any):Row[]=>Array.isArray(v)?v as Row[]:[]
const text=(v:any)=>String(v??'').trim()
const nullable=(v:any)=>{const t=text(v);return t||null}
const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0
const obj=(v:any):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{}
const ts=(v:any)=>{const d=new Date(text(v));return Number.isFinite(d.getTime())?d.toISOString():new Date(0).toISOString()}

async function optional<T>(work:()=>PromiseLike<any>, fallback:T):Promise<T>{
  try{const result=await work();if(result?.error)return fallback;return (result?.data??fallback) as T}catch{return fallback}
}
async function one(table:string,id:string){const db=await createServiceClient();return optional<Row|null>(()=>db.from(table).select('*').eq('id',id).maybeSingle(),null)}
async function many(table:string,column:string,value:string,limit=250){const db=await createServiceClient();return rows(await optional<any[]>(()=>db.from(table).select('*').eq(column,value).order('created_at',{ascending:false}).limit(limit),[]))}

async function registeredReference(input:{kind:EnterpriseSearchHit['objectType'];id:string;publicReference?:string|null;territoryCode?:string|null;createdAt?:string|null;phaseKey?:string|null;parentReference?:string|null}):Promise<string>{
  const generated=input.phaseKey&&input.parentReference?orderPhaseReference({orderReference:input.parentReference,phase:input.phaseKey,ordinal:1}):enterpriseReference({kind:input.kind,id:input.id,publicReference:input.publicReference,territoryCode:input.territoryCode,createdAt:input.createdAt})
  const db=await createServiceClient()
  const existing=await optional<Row|null>(()=>{let q:any=db.from('angelcare_marketplace_reference_register').select('*').eq('object_type',input.kind).eq('object_id',input.id);q=input.phaseKey?q.eq('phase_key',input.phaseKey):q.is('phase_key',null);return q.maybeSingle()},null)
  if(existing?.enterprise_reference)return text(existing.enterprise_reference)
  await optional<any>(()=>db.from('angelcare_marketplace_reference_register').insert({object_type:input.kind,object_id:input.id,enterprise_reference:generated,phase_key:input.phaseKey||null,parent_reference:input.parentReference||null,territory_code:input.territoryCode||null,metadata:{source:'enterprise-command'}}),null)
  return generated
}

const OBJECT_CONFIG:Array<{kind:EnterpriseSearchHit['objectType'];table:string;title:string;ref:string;status:string;route:(r:Row)=>string;subtitle:(r:Row)=>string;amount?:string;filterIn?:[string,string[]]}>=[
  {kind:'customer',table:'angelcare_marketplace_customer_accounts',title:'display_name',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/customers/${r.id}/command`,subtitle:r=>[r.email,r.phone].filter(Boolean).join(' · ')},
  {kind:'family',table:'angelcare_marketplace_family_accounts',title:'display_name',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/customers?family=${r.id}`,subtitle:r=>[r.email,r.phone,r.city].filter(Boolean).join(' · ')},
  {kind:'order',table:'angelcare_marketplace_journeys',title:'title',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/orders/${r.id}/command`,subtitle:r=>text(r.journey_type),amount:'financial_status'},
  {kind:'booking',table:'angelcare_marketplace_journeys',title:'title',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/bookings?booking=${r.id}`,subtitle:r=>text(r.journey_type),filterIn:['journey_type',['family_booking','recurring_service','academy_enrollment','service_booking']]},
  {kind:'payment',table:'angelcare_marketplace_payment_intents',title:'public_reference',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/payments/${r.id}/command`,subtitle:r=>`${num(r.expected_amount).toLocaleString('fr-FR')} ${text(r.currency_label)||'Dh'}`,amount:'expected_amount'},
  {kind:'invoice',table:'angelcare_marketplace_finance_invoices',title:'public_reference',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/finance/invoices?invoice=${r.id}`,subtitle:r=>text(r.customer_name)||'Facture',amount:'total_amount'},
  {kind:'receipt',table:'angelcare_marketplace_finance_receipts',title:'public_reference',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/finance/receipts?receipt=${r.id}`,subtitle:r=>'Reçu',amount:'amount'},
  {kind:'subscription',table:'angelcare_marketplace_customer_subscriptions',title:'public_reference',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/subscriptions?subscription=${r.id}`,subtitle:r=>`${text(r.billing_period)} · ${num(r.amount).toLocaleString('fr-FR')} ${text(r.currency_label)||'Dh'}`,amount:'amount'},
  {kind:'catalog_item',table:'angelcare_marketplace_catalog_items',title:'name_fr',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/catalog/items/${r.id}/overview`,subtitle:r=>text(r.sellable_type)||text(r.kind),amount:'price_amount'},
  {kind:'provider',table:'angelcare_marketplace_provider_profiles',title:'display_name',ref:'public_reference',status:'operational_status',route:r=>`/angelcare-marketplace/admin/providers/dossiers/${r.id}`,subtitle:r=>[r.provider_type,r.email,r.phone].filter(Boolean).join(' · ')},
  {kind:'vendor',table:'angelcare_marketplace_vendor_links',title:'display_name',ref:'vendor_reference',status:'status',route:r=>`/angelcare-marketplace/admin/vendors?object=${r.id}`,subtitle:r=>text(r.settlement_status)||'Vendor'},
  {kind:'supplier',table:'angelcare_marketplace_suppliers',title:'display_name',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/suppliers?supplier=${r.id}`,subtitle:r=>[r.supplier_code,r.legal_name,r.quality_status].filter(Boolean).join(' · ')},
  {kind:'inquiry',table:'angelcare_marketplace_public_inquiries',title:'contact_name',ref:'public_reference',status:'status',route:r=>`/angelcare-marketplace/admin/public-inquiries?inquiry=${r.id}`,subtitle:r=>text(r.email)||text(r.phone)},
  {kind:'crm_lead',table:'angelcare_marketplace_crm_leads',title:'name',ref:'public_reference',status:'status',route:r=>'/angelcare-marketplace/admin/commercial',subtitle:r=>text(r.organization_name)||text(r.email)},
  {kind:'crm_opportunity',table:'angelcare_marketplace_crm_opportunities',title:'name',ref:'public_reference',status:'stage',route:r=>'/angelcare-marketplace/admin/commercial/opportunities',subtitle:r=>text(r.next_action),amount:'estimated_value'},
  {kind:'crm_quote',table:'angelcare_marketplace_crm_quotes',title:'public_reference',ref:'public_reference',status:'quote_status',route:r=>'/angelcare-marketplace/admin/commercial/quotes',subtitle:r=>'Devis commercial',amount:'grand_total'},
]

export async function enterpriseSearch(query:string):Promise<EnterpriseSearchHit[]>{
  const q=text(query).replaceAll(',',' ').slice(0,120);if(q.length<2)return[]
  const db=await createServiceClient()
  const results=await Promise.all(OBJECT_CONFIG.map(async c=>{
    const cols=[c.title,c.ref,'id'].filter(Boolean);const or=cols.map(k=>`${k}.ilike.%${q}%`).join(',')
    const data=rows(await optional<any[]>(()=>{let query:any=db.from(c.table).select('*').or(or);if(c.filterIn)query=query.in(c.filterIn[0],c.filterIn[1]);return query.limit(8)},[]))
    return data.map(r=>({objectType:c.kind,id:text(r.id),reference:text(r[c.ref])||enterpriseReference({kind:c.kind,id:text(r.id),publicReference:text(r[c.ref]),territoryCode:nullable(r.territory_code),createdAt:nullable(r.created_at)}),title:text(r[c.title])||text(r[c.ref]),subtitle:c.subtitle(r),status:text(r[c.status]),route:c.route(r),updatedAt:nullable(r.updated_at||r.created_at),amount:c.amount&&typeof r[c.amount]!=='object'?num(r[c.amount]):null,currencyLabel:text(r.currency_label)||'Dh'} satisfies EnterpriseSearchHit))
  }))
  return results.flat().sort((a,b)=>text(b.updatedAt).localeCompare(text(a.updatedAt))).slice(0,40)
}

function timelineFrom(source:EnterpriseTimelineEvent['source'],data:Row[],title:(r:Row)=>string,dateKey='created_at'):EnterpriseTimelineEvent[]{
  return data.map((r,i)=>({id:text(r.id)||`${source}-${i}`,source,key:text(r.event_type||r.action||r.status||source),title:title(r),description:nullable(r.description||r.reason||r.message),status:nullable(r.status),occurredAt:ts(r[dateKey]||r.updated_at),evidence:obj(r.metadata||r.payload||r.provider_evidence)}))
}

export async function customerMegaDossier(customerId:string):Promise<CustomerMegaDossier>{
  const customer=await one('angelcare_marketplace_customer_accounts',customerId);if(!customer)throw new Error('Client introuvable.')
  const familyId=text(customer.family_account_id)
  const email=text(customer.email);const phone=text(customer.phone)
  const db=await createServiceClient()
  const [family,guardians,children,addresses,orders,payments,invoices,receipts,walletAccount,subscriptions,inquiries,familyRequests,supportTickets,recentlyViewed,savedItems,crmLead,crmAccount,comments,relations,documentExports]=await Promise.all([
    familyId?one('angelcare_marketplace_family_accounts',familyId):Promise.resolve(null),familyId?many('angelcare_marketplace_family_guardians','family_account_id',familyId):[],familyId?many('angelcare_marketplace_family_children','family_account_id',familyId):[],many('angelcare_marketplace_customer_addresses','customer_account_id',customerId),many('angelcare_marketplace_journeys','customer_account_id',customerId),many('angelcare_marketplace_payment_intents','customer_account_id',customerId),many('angelcare_marketplace_finance_invoices','customer_account_id',customerId),many('angelcare_marketplace_finance_receipts','customer_account_id',customerId),optional<Row|null>(()=>db.from('angelcare_marketplace_wallet_accounts').select('*').eq('customer_account_id',customerId).maybeSingle(),null),many('angelcare_marketplace_customer_subscriptions','customer_account_id',customerId),
    email?optional<Row[]>(()=>db.from('angelcare_marketplace_public_inquiries').select('*').or(`email.eq.${email}${phone?`,phone.eq.${phone}`:''}`).order('created_at',{ascending:false}).limit(100),[]):[],
    email?optional<Row[]>(()=>db.from('angelcare_marketplace_family_quote_requests').select('*').eq('contact_email',email).order('created_at',{ascending:false}).limit(100),[]):[],familyId?many('angelcare_marketplace_family_support_tickets','family_account_id',familyId):[],many('angelcare_marketplace_recently_viewed','customer_account_id',customerId),many('angelcare_marketplace_homepage_visitor_selections','customer_account_id',customerId),
    email?optional<Row|null>(()=>db.from('angelcare_marketplace_crm_leads').select('*').eq('email',email).order('updated_at',{ascending:false}).limit(1).maybeSingle(),null):null,
    customer.crm_account_id?one('angelcare_marketplace_crm_accounts',text(customer.crm_account_id)):Promise.resolve(null),many('angelcare_marketplace_admin_comments','object_id',customerId),many('angelcare_marketplace_admin_object_relations','source_object_id',customerId),optional<Row[]>(()=>db.from('angelcare_marketplace_document_exports').select('*').eq('object_type','customer').eq('object_id',customerId).order('generated_at',{ascending:false}).limit(100),[]),
  ])
  const paymentIds=payments.map(r=>text(r.id)).filter(Boolean);const orderIds=orders.map(r=>text(r.id)).filter(Boolean)
  const refunds=paymentIds.length?rows(await optional<any[]>(()=>db.from('angelcare_marketplace_payment_refunds').select('*').in('payment_intent_id',paymentIds).order('created_at',{ascending:false}),[])):[]
  const walletBuckets=walletAccount?await many('angelcare_marketplace_wallet_buckets','wallet_account_id',text(walletAccount.id)):[]
  const walletLedger=walletAccount?await many('angelcare_marketplace_wallet_ledger_entries','wallet_account_id',text(walletAccount.id),500):[]
  const crmOpportunities=crmAccount?await many('angelcare_marketplace_crm_opportunities','account_id',text(crmAccount.id)):crmLead?await many('angelcare_marketplace_crm_opportunities','lead_id',text(crmLead.id)):[]
  const oppIds=crmOpportunities.map(r=>text(r.id)).filter(Boolean);const crmQuotes=oppIds.length?rows(await optional<any[]>(()=>db.from('angelcare_marketplace_crm_quotes').select('*').in('opportunity_id',oppIds).order('created_at',{ascending:false}),[])):[]
  const bookings=orders.filter(r=>['family_booking','recurring_service','academy_enrollment','service_booking'].includes(text(r.journey_type)))
  const events=orderIds.length?rows(await optional<any[]>(()=>db.from('angelcare_marketplace_journey_events').select('*').in('journey_id',orderIds).order('created_at',{ascending:false}).limit(500),[])):[]
  const audit=rows(await optional<any[]>(()=>db.from('angelcare_marketplace_audit_events').select('*').eq('object_id',customerId).order('created_at',{ascending:false}).limit(250),[]))
  const auditTimeline:EnterpriseTimelineEvent[]=audit.map((r,i)=>({id:text(r.id)||`audit-${i}`,source:'audit',key:text(r.action),title:text(r.action).replaceAll('.',' · '),description:nullable(r.reason),status:nullable(r.result),occurredAt:ts(r.created_at),before:obj(r.before_value),after:obj(r.after_value),evidence:{severity:r.severity,source:r.source,request_id:r.request_id}}))
  const timeline=[...timelineFrom('journey',events,r=>text(r.label)||text(r.event_type)||'Événement commande'),...auditTimeline,...timelineFrom('payment',payments,r=>`Paiement ${text(r.status)}`),...timelineFrom('payment',refunds,r=>'Remboursement'),...timelineFrom('inquiry',inquiries,r=>'Demande publique'),...timelineFrom('wallet',walletLedger,r=>`AngelCare Credit · ${text(r.entry_type||r.reason)}`),...timelineFrom('crm',crmOpportunities,r=>`CRM · ${text(r.name)}`,'updated_at'),...timelineFrom('customer',comments,r=>`Note interne · ${text(r.comment_type||r.body||r.content)||'Commentaire'}`),...timelineFrom('document',rows(documentExports),r=>`Document · ${text(r.template_key)||text(r.file_name)||'Export'}`,'generated_at'),...timelineFrom('customer',[customer],r=>'Profil client créé')].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)).slice(0,500)
  const capturedRevenue=payments.reduce((sum,row)=>sum+num(row.captured_amount),0);const refundedRevenue=refunds.reduce((sum,row)=>sum+num(row.amount),0)
  const interestItemIds=[...recentlyViewed,...savedItems].map(row=>text(row.catalog_item_id||row.item_id||row.canonical_object_id)).filter(Boolean)
  const categoryCounts=new Map<string,number>();const categoryLabels=new Map<string,string>()
  if(interestItemIds.length){
    const mappings=rows(await optional<any[]>(()=>db.from('angelcare_marketplace_catalog_item_categories').select('catalog_item_id,category_id').in('catalog_item_id',[...new Set(interestItemIds)]),[]))
    const categoryIds=[...new Set(mappings.map(row=>text(row.category_id)).filter(Boolean))]
    const categories=categoryIds.length?rows(await optional<any[]>(()=>db.from('angelcare_marketplace_catalog_categories').select('id,category_key,name_fr,title_fr').in('id',categoryIds),[])):[]
    for(const category of categories){categoryLabels.set(text(category.id),text(category.name_fr||category.title_fr||category.category_key));categoryCounts.set(text(category.id),0)}
    for(const mapping of mappings){const id=text(mapping.category_id);categoryCounts.set(id,(categoryCounts.get(id)||0)+1)}
  }
  const favoriteCategories:CustomerMegaDossier['intelligence']['favoriteCategories']=[...categoryCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([key,count])=>({key,label:categoryLabels.get(key)||key,count}))
  const sourceCounts=new Map<string,number>();const addSource=(value:unknown)=>{const source=text(value);if(source)sourceCounts.set(source,(sourceCounts.get(source)||0)+1)}
  addSource(customer.acquisition_source||obj(customer.metadata).acquisition_source||obj(customer.metadata).source)
  for(const order of orders)addSource(order.creation_source||obj(order.metadata).source||obj(order.customer_context).source)
  for(const inquiry of inquiries)addSource(inquiry.source_route||inquiry.source||obj(inquiry.source_metadata).campaign)
  const acquisitionSources=[...sourceCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([source,count])=>({source,count}))
  return {customer,family,guardians,children,addresses,orders,payments,refunds,invoices,receipts,walletAccount,walletBuckets,walletLedger,subscriptions,bookings,inquiries,familyRequests,supportTickets,recentlyViewed,savedItems,crmLead,crmAccount,crmOpportunities,crmQuotes,comments,relations,timeline,intelligence:{lifetimeRevenue:Math.max(0,capturedRevenue-refundedRevenue),capturedRevenue,refundedRevenue,averageOrderValue:orders.length?capturedRevenue/orders.length:0,orderCount:orders.length,activeOrderCount:orders.filter(r=>!['completed','closed','cancelled'].includes(text(r.status))).length,paymentCount:payments.length,invoiceCount:invoices.length,bookingCount:bookings.length,subscriptionCount:subscriptions.length,inquiryCount:inquiries.length,savedCount:savedItems.length,recentlyViewedCount:recentlyViewed.length,lastOrderAt:orders[0]?nullable(orders[0].created_at):null,lastActivityAt:timeline[0]?.occurredAt||nullable(customer.updated_at),favoriteCategories,acquisitionSources},enterpriseReference:await registeredReference({kind:'customer',id:text(customer.id),publicReference:nullable(customer.public_reference),createdAt:nullable(customer.created_at)}),generatedAt:new Date().toISOString()}
}

export async function orderMegaDossier(orderId:string):Promise<OrderMegaDossier>{
  const order=await one('angelcare_marketplace_journeys',orderId);if(!order)throw new Error('Commande introuvable.')
  const db=await createServiceClient();const customerId=text(order.customer_account_id)
  const [lines,customer,payments,participants,events,actions,documents,notifications,comments,relations,documentExports]=await Promise.all([many('angelcare_marketplace_order_lines','journey_id',orderId),customerId?one('angelcare_marketplace_customer_accounts',customerId):Promise.resolve(null),many('angelcare_marketplace_payment_intents','canonical_object_id',orderId),many('angelcare_marketplace_journey_participants','journey_id',orderId),many('angelcare_marketplace_journey_events','journey_id',orderId,500),many('angelcare_marketplace_journey_actions','journey_id',orderId,500),many('angelcare_marketplace_journey_documents','journey_id',orderId,500),many('angelcare_marketplace_journey_notifications','journey_id',orderId,500),many('angelcare_marketplace_admin_comments','object_id',orderId),many('angelcare_marketplace_admin_object_relations','source_object_id',orderId),optional<Row[]>(()=>db.from('angelcare_marketplace_document_exports').select('*').eq('object_type','order').eq('object_id',orderId).order('generated_at',{ascending:false}).limit(100),[])])
  const family=customer?.family_account_id?await one('angelcare_marketplace_family_accounts',text(customer.family_account_id)):null
  const paymentIds=payments.map(r=>text(r.id)).filter(Boolean);const refunds=paymentIds.length?rows(await optional<any[]>(()=>db.from('angelcare_marketplace_payment_refunds').select('*').in('payment_intent_id',paymentIds).order('created_at',{ascending:false}),[])):[]
  const invoices=await many('angelcare_marketplace_finance_invoices','journey_id',orderId);const invoiceIds=invoices.map(r=>text(r.id)).filter(Boolean);const receipts=invoiceIds.length?rows(await optional<any[]>(()=>db.from('angelcare_marketplace_finance_receipts').select('*').in('invoice_id',invoiceIds).order('created_at',{ascending:false}),[])):[]
  const audit=rows(await optional<any[]>(()=>db.from('angelcare_marketplace_audit_events').select('*').eq('object_id',orderId).order('created_at',{ascending:false}).limit(250),[]));const auditTimeline:EnterpriseTimelineEvent[]=audit.map((r,i)=>({id:text(r.id)||`audit-${i}`,source:'audit',key:text(r.action),title:text(r.action).replaceAll('.',' · '),description:nullable(r.reason),status:nullable(r.result),occurredAt:ts(r.created_at),before:obj(r.before_value),after:obj(r.after_value),evidence:{severity:r.severity,source:r.source,request_id:r.request_id}}));const timeline=[...timelineFrom('journey',events,r=>text(r.label)||text(r.event_type)||'Événement commande'),...auditTimeline,...timelineFrom('journey',actions,r=>`Action · ${text(r.action_type||r.action_key)}`),...timelineFrom('payment',payments,r=>`Paiement · ${text(r.status)}`),...timelineFrom('payment',refunds,r=>'Remboursement'),...timelineFrom('document',documents,r=>text(r.document_type)||'Document'),...timelineFrom('document',rows(documentExports),r=>`Export · ${text(r.template_key)||text(r.file_name)||'Document'}`,'generated_at'),...timelineFrom('journey',notifications,r=>`Communication · ${text(r.channel||r.notification_type||r.status)}`)].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))
  const phasePlan=[
    {phase:'created',label:'Created',statuses:['draft','created','new']},
    {phase:'payment',label:'Payment',statuses:['payment','awaiting_payment','payment_pending','pending_payment','payment_authorized']},
    {phase:'confirmed',label:'Confirmed',statuses:['confirmed','paid','ready']},
    {phase:'preparation',label:'Preparation',statuses:['preparation','in_preparation']},
    {phase:'assigned',label:'Assigned',statuses:['assigned']},
    {phase:'execution',label:'Execution',statuses:['execution','in_progress','started']},
    {phase:'completed',label:'Completed',statuses:['completed']},
    {phase:'closed',label:'Closed',statuses:['closed']},
  ]
  const current=text(order.status).toLowerCase();let idx=phasePlan.findIndex(plan=>plan.statuses.includes(current));if(idx<0)idx=Math.max(0,phasePlan.findIndex(plan=>plan.phase==='created'))
  const exceptional=current==='recovery'||current==='blocked'||current==='cancelled'
  const rootReference=await registeredReference({kind:'order',id:text(order.id),publicReference:nullable(order.public_reference),createdAt:nullable(order.created_at)})
  const phaseReferences=[] as OrderMegaDossier['phaseReferences']
  for(let i=0;i<phasePlan.length;i+=1){const plan=phasePlan[i];phaseReferences.push({phase:plan.phase,reference:await registeredReference({kind:'order',id:`${orderId}:${plan.phase}`,phaseKey:plan.phase,parentReference:rootReference}),label:plan.label,status:exceptional?(i<Math.min(idx,phasePlan.length)?'completed':'pending'):i<idx?'completed':i===idx?'current':'pending'})}
  for(const special of [{phase:'recovery',label:'Recovery'},{phase:'cancelled',label:'Cancelled'}])phaseReferences.push({phase:special.phase,reference:await registeredReference({kind:'order',id:`${orderId}:${special.phase}`,phaseKey:special.phase,parentReference:rootReference}),label:special.label,status:(special.phase==='recovery'&&(current==='recovery'||current==='blocked'))||(special.phase==='cancelled'&&current==='cancelled')?'current':'pending'})
  return {order,lines,customer,family,payments,refunds,invoices,receipts,participants,events,actions,documents,notifications,relations,comments,timeline,phaseReferences,enterpriseReference:rootReference,generatedAt:new Date().toISOString()}
}

const CENTROIDS:Record<string,[number,number]>={casablanca:[33.5731,-7.5898],rabat:[34.0209,-6.8416],kenitra:[34.261,-6.5802],kénitra:[34.261,-6.5802],marrakech:[31.6295,-7.9811],tanger:[35.7595,-5.834],tangier:[35.7595,-5.834],fes:[34.0181,-5.0078],fès:[34.0181,-5.0078],agadir:[30.4278,-9.5981],temara:[33.9287,-6.9066]}
function sessionPoint(r:Row,now:number):LiveVisitorPoint|null{const meta=obj(r.metadata);const identity=obj(r.identity_context);const conf=obj(r.configuration);const geo=obj(meta.geo);let lat=num(geo.lat||conf.latitude);let lng=num(geo.lng||conf.longitude);let precision:LiveVisitorPoint['precision']='event';const city=text(identity.city||conf.city||meta.city).toLowerCase();if((!lat||!lng)&&CENTROIDS[city]){[lat,lng]=CENTROIDS[city];precision='city_centroid'}if(!lat||!lng)return null;return{id:text(r.id),reference:text(r.public_reference)||text(r.session_key),source:'conversion_session',lat,lng,precision,city:city||null,territory:nullable(r.territory_id),route:nullable(r.source_route),intent:nullable(r.journey),state:text(r.status)||'active',locale:text(r.locale)||'fr',catalogItemId:nullable(r.catalog_item_id),catalogItemName:null,customerAccountId:nullable(r.customer_account_id),customerName:null,ageSeconds:Math.max(0,Math.round((now-new Date(r.last_activity_at||r.updated_at||r.created_at).getTime())/1000)),occurredAt:ts(r.last_activity_at||r.updated_at||r.created_at)}}

export async function liveMarketplaceSnapshot(minutes=30):Promise<LiveMarketplaceSnapshot>{
  const db=await createServiceClient();const safeMinutes=Math.max(5,Math.min(1440,minutes));const since=new Date(Date.now()-safeMinutes*60000).toISOString()
  const [sessionsRaw,ordersRaw,paymentsRaw,inquiriesRaw,providersRaw,fulfillmentRaw]=await Promise.all([
    optional<Row[]>(()=>db.from('angelcare_marketplace_conversion_sessions').select('*').gte('last_activity_at',since).order('last_activity_at',{ascending:false}).limit(1500),[]),
    optional<Row[]>(()=>db.from('angelcare_marketplace_journeys').select('*').gte('updated_at',since).order('updated_at',{ascending:false}).limit(800),[]),
    optional<Row[]>(()=>db.from('angelcare_marketplace_payment_intents').select('*').gte('updated_at',since).order('updated_at',{ascending:false}).limit(800),[]),
    optional<Row[]>(()=>db.from('angelcare_marketplace_public_inquiries').select('*').gte('created_at',since).order('created_at',{ascending:false}).limit(500),[]),
    optional<Row[]>(()=>db.from('angelcare_marketplace_provider_links').select('*').eq('status','active').order('updated_at',{ascending:false}).limit(500),[]),
    optional<Row[]>(()=>db.from('angelcare_marketplace_fulfillment_cases').select('*').in('status',['pending','preparing','assigned','in_progress','blocked','recovery','exception']).order('updated_at',{ascending:false}).limit(500),[]),
  ])
  const sessions=rows(sessionsRaw),orders=rows(ordersRaw),payments=rows(paymentsRaw),inquiries=rows(inquiriesRaw),providers=rows(providersRaw),fulfillment=rows(fulfillmentRaw)
  const customerIds=[...new Set([...sessions.map(r=>text(r.customer_account_id)),...orders.map(r=>text(r.customer_account_id)),...payments.map(r=>text(r.customer_account_id)),...inquiries.map(r=>text(r.linked_customer_account_id))].filter(Boolean))]
  const territoryIds=[...new Set([...sessions.map(r=>text(r.territory_id)),...orders.map(r=>text(r.territory_id)),...fulfillment.map(r=>text(r.territory_id)),...providers.flatMap(r=>Array.isArray(r.territory_ids)?r.territory_ids.map(text):[])].filter(Boolean))]
  const itemIds=[...new Set(sessions.map(r=>text(r.catalog_item_id)).filter(Boolean))]
  const [addresses,customers,territories,items]=await Promise.all([
    customerIds.length?optional<Row[]>(()=>db.from('angelcare_marketplace_customer_addresses').select('*').in('customer_account_id',customerIds).eq('status','active').order('is_default',{ascending:false}),[]):[],
    customerIds.length?optional<Row[]>(()=>db.from('angelcare_marketplace_customer_accounts').select('id,display_name').in('id',customerIds),[]):[],
    territoryIds.length?optional<Row[]>(()=>db.from('angelcare_marketplace_territories').select('id,name,territory_code,metadata').in('id',territoryIds),[]):[],
    itemIds.length?optional<Row[]>(()=>db.from('angelcare_marketplace_catalog_items').select('id,name_fr').in('id',itemIds),[]):[],
  ])
  const addressByCustomer=new Map<string,Row>();for(const a of rows(addresses))if(!addressByCustomer.has(text(a.customer_account_id)))addressByCustomer.set(text(a.customer_account_id),a)
  const customerById=new Map(rows(customers).map(r=>[text(r.id),r]));const territoryById=new Map(rows(territories).map(r=>[text(r.id),r]));const itemById=new Map(rows(items).map(r=>[text(r.id),r]));const now=Date.now()
  const locate=(customerId:string,territoryId:string,metadata:Row={}):{lat:number;lng:number;precision:LiveVisitorPoint['precision'];city:string|null;territory:string|null}|null=>{
    const direct=obj(metadata.geo);let lat=num(direct.lat||metadata.latitude||metadata.lat),lng=num(direct.lng||metadata.longitude||metadata.lng);if(lat&&lng)return{lat,lng,precision:'event',city:nullable(metadata.city),territory:nullable(territoryById.get(territoryId)?.name)}
    const address=addressByCustomer.get(customerId);if(address&&num(address.latitude)&&num(address.longitude))return{lat:num(address.latitude),lng:num(address.longitude),precision:'address',city:nullable(address.city),territory:nullable(territoryById.get(territoryId)?.name)}
    const territory=territoryById.get(territoryId);if(territory){const meta=obj(territory.metadata);lat=num(meta.latitude||meta.lat);lng=num(meta.longitude||meta.lng);const centroid=CENTROIDS[text(territory.name).toLowerCase()];if(lat&&lng)return{lat,lng,precision:'territory_centroid',city:nullable(territory.name),territory:nullable(territory.name)};if(centroid)return{lat:centroid[0],lng:centroid[1],precision:'territory_centroid',city:nullable(territory.name),territory:nullable(territory.name)}}
    const city=text(metadata.city).toLowerCase();if(city&&CENTROIDS[city])return{lat:CENTROIDS[city][0],lng:CENTROIDS[city][1],precision:'city_centroid',city,territory:null}
    return null
  }
  const points:LiveVisitorPoint[]=[]
  for(const r of sessions){let point=sessionPoint(r,now);const customerId=text(r.customer_account_id),territoryId=text(r.territory_id);if(!point){const place=locate(customerId,territoryId,obj(r.metadata));if(place)point={id:text(r.id),reference:text(r.public_reference)||text(r.session_key),source:'conversion_session',...place,route:nullable(r.source_route),intent:nullable(r.journey),state:text(r.status)||'active',locale:text(r.locale)||'fr',catalogItemId:nullable(r.catalog_item_id),catalogItemName:nullable(itemById.get(text(r.catalog_item_id))?.name_fr),customerAccountId:nullable(r.customer_account_id),customerName:nullable(customerById.get(customerId)?.display_name),ageSeconds:Math.max(0,Math.round((now-new Date(r.last_activity_at||r.updated_at||r.created_at).getTime())/1000)),occurredAt:ts(r.last_activity_at||r.updated_at||r.created_at)}}if(point){point.customerName=point.customerName||nullable(customerById.get(customerId)?.display_name);point.catalogItemName=point.catalogItemName||nullable(itemById.get(text(r.catalog_item_id))?.name_fr);points.push(point)}}
  const commercePoints:LiveCommercePoint[]=[]
  const add=(row:Row,kind:LiveCommercePoint['kind'],input:{customerId?:string;territoryId?:string;reference?:string;title?:string;status?:string;amount?:number|null;route:string;at?:unknown;metadata?:Row})=>{const place=locate(input.customerId||'',input.territoryId||'',input.metadata||obj(row.metadata));if(!place)return;commercePoints.push({id:`${kind}:${text(row.id)}`,kind,reference:input.reference||text(row.public_reference)||text(row.id),title:input.title||kind,status:input.status||text(row.status),lat:place.lat,lng:place.lng,precision:place.precision,occurredAt:ts(input.at||row.updated_at||row.created_at),customerName:input.customerId?nullable(customerById.get(input.customerId)?.display_name):null,amount:input.amount??null,route:input.route,territory:place.territory})}
  for(const r of orders){const f=obj(r.financial_status);add(r,'order',{customerId:text(r.customer_account_id),territoryId:text(r.territory_id),title:text(r.title)||'Commande',amount:num(f.grand_total||f.total),route:`/angelcare-marketplace/admin/orders/${r.id}/command`,at:r.updated_at})}
  for(const r of payments.filter(r=>num(r.captured_amount)>0)){add(r,'revenue',{customerId:text(r.customer_account_id),reference:text(r.public_reference),title:'Revenue capturé',amount:num(r.captured_amount),route:`/angelcare-marketplace/admin/payments/${r.id}/command`,at:r.updated_at})}
  for(const r of inquiries){add(r,'inquiry',{customerId:text(r.linked_customer_account_id),territoryId:text(r.territory_id),title:text(r.subject)||text(r.contact_name)||'Inquiry',route:'/angelcare-marketplace/admin/public-inquiries',at:r.created_at,metadata:obj(r.source_metadata)})}
  for(const r of providers){const tids=Array.isArray(r.territory_ids)?r.territory_ids.map(text).filter(Boolean):[];const tid=tids[0]||'';add(r,'provider',{territoryId:tid,reference:text(r.provider_id),title:text(r.display_name)||'Provider',status:text(r.status),route:'/angelcare-marketplace/admin/providers',at:r.updated_at})}
  for(const r of fulfillment){add(r,'fulfillment',{territoryId:text(r.territory_id),reference:text(r.public_reference),title:text(r.title)||'Fulfillment',status:text(r.status),route:`/angelcare-marketplace/admin/operations/fulfillment/${r.id}`,at:r.updated_at})}
  const byIntent:Record<string,number>={},byCity:Record<string,number>={};for(const p of points){const i=p.intent||'unknown';byIntent[i]=(byIntent[i]||0)+1;const c=p.city||'unlocated';byCity[c]=(byCity[c]||0)+1}
  return{generatedAt:new Date().toISOString(),activeWindowMinutes:safeMinutes,totalActive:sessions.length,byIntent,byCity,checkoutActive:sessions.filter(r=>/checkout/i.test(text(r.status)+text(r.source_route))).length,cartsActive:sessions.filter(r=>/basket|cart/i.test(text(r.status)+text(r.journey))).length,anonymous:sessions.filter(r=>!r.customer_account_id).length,knownCustomers:sessions.filter(r=>r.customer_account_id).length,ordersInWindow:orders.length,revenueInWindow:payments.reduce((sum,r)=>sum+num(r.captured_amount),0),inquiriesInWindow:inquiries.length,providersMapped:commercePoints.filter(p=>p.kind==='provider').length,fulfillmentOpen:fulfillment.length,points,commercePoints}
}

export async function businessPulseSnapshot(minutes=60):Promise<BusinessPulseSnapshot>{const db=await createServiceClient();const since=new Date(Date.now()-minutes*60000).toISOString();const [orders,payments,inquiries]=await Promise.all([optional<Row[]>(()=>db.from('angelcare_marketplace_journeys').select('*').gte('created_at',since).order('created_at',{ascending:false}).limit(100),[]),optional<Row[]>(()=>db.from('angelcare_marketplace_payment_intents').select('*').gte('updated_at',since).order('updated_at',{ascending:false}).limit(100),[]),optional<Row[]>(()=>db.from('angelcare_marketplace_public_inquiries').select('*').gte('created_at',since).order('created_at',{ascending:false}).limit(100),[])]);const events:BusinessPulseEvent[]=[...rows(orders).map(r=>({id:text(r.id),kind:'order' as const,reference:text(r.public_reference),title:text(r.title)||'Nouvelle commande',subtitle:text(r.journey_type),status:text(r.status),route:`/angelcare-marketplace/admin/orders/${r.id}/command`,occurredAt:ts(r.created_at),amount:num(obj(r.financial_status).grand_total||obj(r.financial_status).total),currencyLabel:'Dh'})),...rows(payments).map(r=>({id:text(r.id),kind:'payment' as const,reference:text(r.public_reference),title:`Paiement ${text(r.status)}`,subtitle:text(r.provider_key)||'Paiement',status:text(r.status),route:`/angelcare-marketplace/admin/payments/${r.id}/command`,occurredAt:ts(r.updated_at),amount:num(r.captured_amount||r.expected_amount),currencyLabel:text(r.currency_label)||'Dh'})),...rows(inquiries).map(r=>({id:text(r.id),kind:'inquiry' as const,reference:text(r.public_reference),title:text(r.contact_name)||'Nouvelle demande',subtitle:text(r.subject||r.audience),status:text(r.status),route:'/angelcare-marketplace/admin/public-inquiries',occurredAt:ts(r.created_at)}))].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));return{generatedAt:new Date().toISOString(),events:events.slice(0,120),newOrders:rows(orders).length,capturedPayments:rows(payments).filter(r=>['captured','reconciled','partially_refunded'].includes(text(r.status))).length,newInquiries:rows(inquiries).length,activeFulfillment:rows(orders).filter(r=>['confirmed','preparation','assigned','execution','in_progress'].includes(text(r.status))).length}}

export async function fulfillmentMissionSnapshot():Promise<FulfillmentMissionSnapshot>{
  const db=await createServiceClient()
  const data=rows(await optional<any[]>(()=>db.from('angelcare_marketplace_journeys').select('*').in('status',['confirmed','preparation','assigned','scheduled','execution','in_progress','blocked','recovery','completed']).order('updated_at',{ascending:false}).limit(500),[]))
  const ids=data.map(r=>text(r.id)).filter(Boolean)
  const [opsMissions,fulfillmentCases]=await Promise.all([
    ids.length?optional<Row[]>(()=>db.from('angelcare_marketplace_operations_missions').select('*').in('source_id',ids).order('updated_at',{ascending:false}),[]):[],
    ids.length?optional<Row[]>(()=>db.from('angelcare_marketplace_fulfillment_cases').select('*').in('journey_id',ids).order('updated_at',{ascending:false}),[]):[],
  ])
  const opsBySource=new Map<string,Row>();for(const row of rows(opsMissions))if(row.source_id&&!opsBySource.has(text(row.source_id)))opsBySource.set(text(row.source_id),row)
  const caseByJourney=new Map<string,Row>();for(const row of rows(fulfillmentCases))if(row.journey_id&&!caseByJourney.has(text(row.journey_id)))caseByJourney.set(text(row.journey_id),row)
  const today=new Date().toISOString().slice(0,10)
  const missions=data.map(r=>{
    const scheduling=obj(r.scheduling),customer=obj(r.customer_context),financial=obj(r.financial_status),fulfillment=obj(r.fulfillment_status),ops=opsBySource.get(text(r.id)),caseRow=caseByJourney.get(text(r.id))
    return {id:text(r.id),reference:text(r.public_reference),title:text(r.title),status:text(r.status),phase:text(r.status),customer:text(customer.display_name||customer.name)||'Client',customerAccountId:nullable(r.customer_account_id),familyAccountId:nullable(r.family_account_id),territory:nullable(r.territory_id),scheduledAt:nullable(r.scheduled_start_at||scheduling.starts_at||scheduling.scheduled_at),scheduledEndAt:nullable(r.scheduled_end_at||scheduling.ends_at),provider:nullable(fulfillment.provider_name),providerId:nullable(fulfillment.provider_id),amount:num(financial.grand_total||financial.total),paymentStatus:text(financial.payment_status),nextAction:nullable(r.next_action_label),journeyType:text(r.journey_type)||'service',operationsMissionId:ops?text(ops.id):null,operationsMissionStatus:ops?text(ops.status):null,fulfillmentCaseId:caseRow?text(caseRow.id):null,riskLevel:nullable(ops?.risk_level||caseRow?.risk_level),route:`/angelcare-marketplace/admin/orders/${r.id}/command`}
  })
  return{generatedAt:new Date().toISOString(),missions,pending:missions.filter(m=>['confirmed','preparation','assigned','scheduled'].includes(m.status)).length,active:missions.filter(m=>['execution','in_progress'].includes(m.status)).length,blocked:missions.filter(m=>['blocked','recovery'].includes(m.status)).length,completedToday:data.filter(r=>text(r.status)==='completed'&&text(r.updated_at).startsWith(today)).length}
}

type SegmentRuleInput={field:string;operator:string;value:unknown}
type SegmentRuleGroup={operator:'and'|'or';rules:SegmentRuleInput[]}
function segmentRuleMatch(profile:Record<string,unknown>,rule:SegmentRuleInput){
  const left=profile[rule.field],op=text(rule.operator)||'eq',right=rule.value
  const leftText=text(left).toLowerCase(),rightText=text(right).toLowerCase(),leftNum=num(left),rightNum=num(right)
  if(op==='eq')return Array.isArray(left)?left.map(text).some(v=>v.toLowerCase()===rightText):leftText===rightText
  if(op==='neq')return Array.isArray(left)?!left.map(text).some(v=>v.toLowerCase()===rightText):leftText!==rightText
  if(op==='contains')return Array.isArray(left)?left.map(text).some(v=>v.toLowerCase().includes(rightText)):leftText.includes(rightText)
  if(op==='gte')return leftNum>=rightNum
  if(op==='lte')return leftNum<=rightNum
  if(op==='gt')return leftNum>rightNum
  if(op==='lt')return leftNum<rightNum
  if(op==='true')return left===true
  if(op==='false')return left===false
  return true
}
function segmentGroupsMatch(profile:Record<string,unknown>,filters:Record<string,unknown>){
  const raw=Array.isArray(filters.groups)?filters.groups:[]
  const groups:SegmentRuleGroup[]=raw.map((group:any)=>({operator:text(group?.operator)==='or'?'or':'and',rules:(Array.isArray(group?.rules)?group.rules:[]).map((rule:any)=>({field:text(rule?.field),operator:text(rule?.operator)||'eq',value:rule?.value})).filter((rule:SegmentRuleInput)=>rule.field)})).filter(group=>group.rules.length)
  if(!groups.length)return true
  const outcomes=groups.map(group=>group.operator==='or'?group.rules.some(rule=>segmentRuleMatch(profile,rule)):group.rules.every(rule=>segmentRuleMatch(profile,rule)))
  return text(filters.groupOperator)==='or'?outcomes.some(Boolean):outcomes.every(Boolean)
}

async function segmentPreviewLegacy(filters:Record<string,unknown>):Promise<SegmentPreview>{
  const db=await createServiceClient();const hardLimit=Math.max(100,Math.min(10000,num(filters.limit)||5000))
  let q:any=db.from('angelcare_marketplace_customer_accounts').select('*').order('updated_at',{ascending:false}).limit(hardLimit)
  if(text(filters.status))q=q.eq('status',text(filters.status));if(text(filters.accountKind))q=q.eq('account_kind',text(filters.accountKind));if(filters.premium===true)q=q.eq('premium_status',true)
  const customers=rows(await optional<any[]>(()=>q,[])),ids=customers.map(c=>text(c.id)).filter(Boolean)
  const chunks=<T,>(values:T[],size=400)=>Array.from({length:Math.ceil(values.length/size)},(_,i)=>values.slice(i*size,(i+1)*size))
  const fetchIn=async(table:string,column:string,values:string[],select='*')=>{const out:Row[]=[];for(const part of chunks(values)){const result=await optional<Row[]>(()=>db.from(table).select(select).in(column,part),[]);out.push(...rows(result))}return out}
  const [orders,payments,wallets,subscriptions]=await Promise.all([
    fetchIn('angelcare_marketplace_journeys','customer_account_id',ids),fetchIn('angelcare_marketplace_payment_intents','customer_account_id',ids),fetchIn('angelcare_marketplace_wallet_accounts','customer_account_id',ids),fetchIn('angelcare_marketplace_customer_subscriptions','customer_account_id',ids),
  ])
  const orderIds=orders.map(o=>text(o.id)).filter(Boolean);const orderLines=orderIds.length?await fetchIn('angelcare_marketplace_order_lines','journey_id',orderIds):[]
  const ordersByCustomer=new Map<string,Row[]>(),paymentsByCustomer=new Map<string,Row[]>(),walletByCustomer=new Map<string,Row>(),subscriptionsByCustomer=new Map<string,Row[]>(),linesByOrder=new Map<string,Row[]>()
  for(const row of orders){const k=text(row.customer_account_id),list=ordersByCustomer.get(k)||[];list.push(row);ordersByCustomer.set(k,list)}
  for(const row of payments){const k=text(row.customer_account_id),list=paymentsByCustomer.get(k)||[];list.push(row);paymentsByCustomer.set(k,list)}
  for(const row of wallets)walletByCustomer.set(text(row.customer_account_id),row)
  for(const row of subscriptions){const k=text(row.customer_account_id),list=subscriptionsByCustomer.get(k)||[];list.push(row);subscriptionsByCustomer.set(k,list)}
  for(const row of orderLines){const k=text(row.journey_id),list=linesByOrder.get(k)||[];list.push(row);linesByOrder.set(k,list)}
  const out=[] as SegmentPreview['customers'];const cityFilter=text(filters.city).toLowerCase(),minOrders=num(filters.minOrders),minRevenue=num(filters.minRevenue),minAov=num(filters.minAov),minWallet=num(filters.minWallet),inactiveDays=num(filters.inactiveDays),productId=text(filters.productId),bookingStatus=text(filters.bookingStatus),subscriptionStatus=text(filters.subscriptionStatus),acquisitionSource=text(filters.acquisitionSource).toLowerCase()
  for(const c of customers){const customerId=text(c.id),city=text(obj(c.metadata).city||c.city).toLowerCase();if(cityFilter&&city!==cityFilter)continue;const customerOrders=(ordersByCustomer.get(customerId)||[]).sort((a,b)=>text(b.created_at).localeCompare(text(a.created_at))),customerPayments=paymentsByCustomer.get(customerId)||[],wallet=walletByCustomer.get(customerId),customerSubscriptions=subscriptionsByCustomer.get(customerId)||[];const revenue=customerPayments.reduce((sum,row)=>sum+num(row.captured_amount),0),walletBalance=num(wallet?.available_balance||wallet?.balance),lastOrderAt=customerOrders[0]?nullable(customerOrders[0].created_at):null,aov=customerOrders.length?revenue/customerOrders.length:0,bookings=customerOrders.filter(o=>/booking|service/i.test(text(o.journey_type))),sources=[...new Set(customerOrders.map(o=>text(o.creation_source)).filter(Boolean))]
    if(customerOrders.length<minOrders||revenue<minRevenue||aov<minAov||walletBalance<minWallet)continue
    if(inactiveDays>0&&lastOrderAt){const age=(Date.now()-new Date(lastOrderAt).getTime())/86400000;if(age<inactiveDays)continue}
    if(productId&&!customerOrders.some(o=>(linesByOrder.get(text(o.id))||[]).some(line=>text(line.catalog_item_id)===productId)))continue
    if(bookingStatus&&!bookings.some(o=>text(o.status)===bookingStatus))continue
    if(subscriptionStatus&&!customerSubscriptions.some(sub=>text(sub.status)===subscriptionStatus))continue
    if(acquisitionSource&&!sources.some(source=>source.toLowerCase().includes(acquisitionSource)))continue
    const activeSubscriptions=customerSubscriptions.filter(s=>text(s.status)==='active').length
    const inactivityDays=lastOrderAt?Math.max(0,Math.floor((Date.now()-new Date(lastOrderAt).getTime())/86400000)):99999
    const purchasedProductIds=[...new Set(customerOrders.flatMap(o=>(linesByOrder.get(text(o.id))||[]).map(line=>text(line.catalog_item_id)).filter(Boolean)))]
    const profile:Record<string,unknown>={city,orderCount:customerOrders.length,capturedRevenue:revenue,averageOrderValue:aov,walletBalance,activeSubscriptions,bookingCount:bookings.length,inactivityDays,acquisitionSources:sources,purchasedProductIds,premium:Boolean(c.premium_status),status:text(c.status),accountKind:text(c.account_kind)}
    if(!segmentGroupsMatch(profile,filters))continue
    out.push({id:customerId,reference:text(c.public_reference),name:text(c.display_name),email:nullable(c.email),city:city||null,orderCount:customerOrders.length,capturedRevenue:revenue,averageOrderValue:aov,walletBalance,lastOrderAt,activeSubscriptions,bookingCount:bookings.length,acquisitionSources:sources})
  }
  return{generatedAt:new Date().toISOString(),filters,customers:out,total:out.length,evaluated:customers.length,truncated:customers.length>=hardLimit}
}

export async function segmentPreview(filters:Record<string,unknown>):Promise<SegmentPreview>{
  const db=await createServiceClient()
  const hardLimit=Math.max(100,Math.min(50000,num(filters.limit)||10000))
  let query:any=db.from('angelcare_marketplace_customer_segment_metrics').select('*').order('updated_at',{ascending:false}).limit(hardLimit)
  if(text(filters.status))query=query.eq('status',text(filters.status))
  if(text(filters.accountKind))query=query.eq('account_kind',text(filters.accountKind))
  if(filters.premium===true)query=query.eq('premium_status',true)
  if(text(filters.city))query=query.ilike('city',text(filters.city))
  if(num(filters.minOrders)>0)query=query.gte('order_count',num(filters.minOrders))
  if(num(filters.minRevenue)>0)query=query.gte('captured_revenue',num(filters.minRevenue))
  if(num(filters.minAov)>0)query=query.gte('average_order_value',num(filters.minAov))
  if(num(filters.minWallet)>0)query=query.gte('wallet_balance',num(filters.minWallet))
  if(num(filters.inactiveDays)>0){const cutoff=new Date(Date.now()-num(filters.inactiveDays)*86400000).toISOString();query=query.or(`last_order_at.is.null,last_order_at.lte.${cutoff}`)}
  if(text(filters.productId))query=query.contains('purchased_product_ids',[text(filters.productId)])
  if(text(filters.bookingStatus))query=query.contains('booking_statuses',[text(filters.bookingStatus)])
  if(text(filters.subscriptionStatus))query=query.contains('subscription_statuses',[text(filters.subscriptionStatus)])
  const result=await query
  if(result.error)return segmentPreviewLegacy(filters)
  const acquisition=text(filters.acquisitionSource).toLowerCase()
  const sourceRows=rows(result.data)
  const out:SegmentPreview['customers']=[]
  for(const row of sourceRows){
    const sources=Array.isArray(row.acquisition_sources)?row.acquisition_sources.map(text).filter(Boolean):[]
    if(acquisition&&!sources.some(source=>source.toLowerCase().includes(acquisition)))continue
    const lastOrderAt=nullable(row.last_order_at)
    const inactivityDays=lastOrderAt?Math.max(0,Math.floor((Date.now()-new Date(lastOrderAt).getTime())/86400000)):99999
    const profile:Record<string,unknown>={city:text(row.city).toLowerCase(),orderCount:num(row.order_count),capturedRevenue:num(row.captured_revenue),averageOrderValue:num(row.average_order_value),walletBalance:num(row.wallet_balance),activeSubscriptions:num(row.active_subscriptions),bookingCount:num(row.booking_count),inactivityDays,acquisitionSources:sources,purchasedProductIds:Array.isArray(row.purchased_product_ids)?row.purchased_product_ids.map(text):[],premium:Boolean(row.premium_status),status:text(row.status),accountKind:text(row.account_kind)}
    if(!segmentGroupsMatch(profile,filters))continue
    out.push({id:text(row.customer_account_id),reference:text(row.public_reference),name:text(row.display_name),email:nullable(row.email),city:nullable(row.city),orderCount:num(row.order_count),capturedRevenue:num(row.captured_revenue),averageOrderValue:num(row.average_order_value),walletBalance:num(row.wallet_balance),lastOrderAt,activeSubscriptions:num(row.active_subscriptions),bookingCount:num(row.booking_count),acquisitionSources:sources})
  }
  return{generatedAt:new Date().toISOString(),filters,customers:out,total:out.length,evaluated:sourceRows.length,truncated:sourceRows.length>=hardLimit}
}


const DEFAULT_TEMPLATE_DESCRIPTORS:Array<{key:DocumentTemplateKey;name:string;sections:string[]}>= [
  {key:'customer_dossier',name:'Dossier Client 360',sections:['identity','family','commerce','finance','crm','timeline']},
  {key:'family_dossier',name:'Dossier Famille',sections:['identity','guardians','children','addresses']},
  {key:'order_summary',name:'Order Command Pack',sections:['summary','lines','payment','fulfillment','timeline']},
  {key:'booking_confirmation',name:'Confirmation de réservation',sections:['customer','service','schedule','conditions']},
  {key:'fulfillment_sheet',name:'Fiche Fulfillment',sections:['order','provider','schedule','evidence']},
  {key:'quote',name:'Devis',sections:['customer','lines','commercial','terms']},
  {key:'proforma',name:'Proforma',sections:['customer','lines','commercial','terms']},
  {key:'invoice',name:'Facture',sections:['customer','lines','totals','payment']},
  {key:'receipt',name:'Reçu',sections:['customer','payment','reference']},
  {key:'refund_confirmation',name:'Confirmation remboursement',sections:['customer','payment','refund']},
  {key:'wallet_statement',name:'Relevé AngelCare Credit',sections:['customer','balance','ledger']},
  {key:'subscription_summary',name:'Résumé abonnement',sections:['customer','plan','billing','history']},
  {key:'provider_mission',name:'Mission Provider',sections:['provider','customer','service','schedule']},
  {key:'quality_report',name:'Rapport Qualité',sections:['scope','evidence','findings','actions']},
  {key:'incident_report',name:'Rapport Incident',sections:['context','facts','actions','evidence']},
  {key:'product_sheet',name:'Fiche Produit / Service',sections:['identity','commercial','media','fulfillment']},
  {key:'b2b_proposal',name:'Proposition B2B',sections:['account','scope','commercial','deliverables']},
]
const DEFAULT_TEMPLATES:DocumentTemplateRecord[]=DEFAULT_TEMPLATE_DESCRIPTORS.map((r,i)=>({id:`default-${i}`,template_key:r.key,name:r.name,locale:'fr',page_size:'A4',orientation:'portrait',header_title:'ANGELCARE',header_subtitle:'Marketplace Enterprise Command',footer_text:'ANGELCARE · Document généré depuis le Marketplace Admin',legal_text:null,logo_path:'/logo.png',accent:'navy',sections:r.sections,settings:{showReference:true,showGeneratedAt:true},status:'active',updated_at:new Date(0).toISOString()}))
export async function listDocumentTemplates():Promise<DocumentTemplateRecord[]>{const db=await createServiceClient();const data=await optional<Row[]>(()=>db.from('angelcare_marketplace_document_templates').select('*').eq('status','active').order('name'),[]);return rows(data).length?rows(data) as DocumentTemplateRecord[]:DEFAULT_TEMPLATES}
export async function saveDocumentTemplate(input:Partial<DocumentTemplateRecord>&{template_key:DocumentTemplateKey;name:string}):Promise<DocumentTemplateRecord>{const db=await createServiceClient();const record={template_key:input.template_key,name:input.name,locale:input.locale||'fr',page_size:input.page_size||'A4',orientation:input.orientation||'portrait',header_title:input.header_title||'ANGELCARE',header_subtitle:input.header_subtitle||null,footer_text:input.footer_text||null,legal_text:input.legal_text||null,logo_path:input.logo_path||'/logo.png',accent:input.accent||'navy',sections:input.sections||[],settings:input.settings||{},status:input.status||'active',updated_at:new Date().toISOString()};const result=await db.from('angelcare_marketplace_document_templates').upsert(record,{onConflict:'template_key,locale'}).select('*').single();if(result.error||!result.data)throw new Error('Template document indisponible tant que la migration Enterprise Command n’est pas appliquée.');try{const versions=await db.from('angelcare_marketplace_document_template_versions').select('version_number').eq('template_key',input.template_key).order('version_number',{ascending:false}).limit(1);const version=Number(versions.data?.[0]?.version_number||0)+1;await db.from('angelcare_marketplace_document_template_versions').insert({template_id:result.data.id,template_key:input.template_key,version_number:version,snapshot:result.data})}catch{/* additive compatibility until Sovereign migration */}return result.data as DocumentTemplateRecord}

export async function listDocumentTemplateVersions(templateKey:DocumentTemplateKey){const db=await createServiceClient();return rows(await optional<Row[]>(()=>db.from('angelcare_marketplace_document_template_versions').select('*').eq('template_key',templateKey).order('version_number',{ascending:false}).limit(60),[]))}
export async function restoreDocumentTemplateVersion(input:{templateKey:DocumentTemplateKey;versionNumber:number}){const db=await createServiceClient();const version=await optional<Row|null>(()=>db.from('angelcare_marketplace_document_template_versions').select('*').eq('template_key',input.templateKey).eq('version_number',input.versionNumber).maybeSingle(),null);if(!version)throw new Error('Version de template introuvable.');const snapshot=obj(version.snapshot);return saveDocumentTemplate({...snapshot,template_key:input.templateKey,name:text(snapshot.name)||input.templateKey} as Partial<DocumentTemplateRecord>&{template_key:DocumentTemplateKey;name:string})}


const GENERIC_DOCUMENT_TABLES:Record<string,{table:string;title:string;reference:string}>={
  payment:{table:'angelcare_marketplace_payment_intents',title:'Paiement',reference:'public_reference'},invoice:{table:'angelcare_marketplace_finance_invoices',title:'Facture',reference:'public_reference'},receipt:{table:'angelcare_marketplace_finance_receipts',title:'Reçu',reference:'public_reference'},booking:{table:'angelcare_marketplace_journeys',title:'Réservation / Service',reference:'public_reference'},subscription:{table:'angelcare_marketplace_customer_subscriptions',title:'Abonnement',reference:'public_reference'},product:{table:'angelcare_marketplace_catalog_items',title:'Produit / Service',reference:'public_reference'},provider:{table:'angelcare_marketplace_provider_profiles',title:'Provider',reference:'public_reference'},supplier:{table:'angelcare_marketplace_suppliers',title:'Supplier',reference:'public_reference'},inquiry:{table:'angelcare_marketplace_public_inquiries',title:'Inquiry',reference:'public_reference'},
}
export async function genericDocumentSnapshot(objectType:string,objectId:string):Promise<{reference:string;title:string;subtitle:string;sections:Array<{title:string;rows:Array<[string,unknown]>}>}>{
  const config=GENERIC_DOCUMENT_TABLES[objectType];if(!config)throw new Error('Type de document non pris en charge.')
  const record=await one(config.table,objectId);if(!record)throw new Error(`${config.title} introuvable.`)
  const reference=text(record[config.reference])||enterpriseReference({kind:(objectType==='product'?'catalog_item':objectType==='booking'?'booking':objectType==='subscription'?'subscription':objectType==='supplier'?'supplier':objectType==='provider'?'provider':objectType==='inquiry'?'inquiry':objectType) as EnterpriseSearchHit['objectType'],id:objectId,publicReference:nullable(record[config.reference]),createdAt:nullable(record.created_at)})
  const preferred=['display_name','name','name_fr','title','email','phone','status','kind','sellable_type','journey_type','amount','expected_amount','captured_amount','total_amount','currency_label','provider_key','selected_method','starts_at','ends_at','updated_at','created_at']
  const primary:Array<[string,unknown]>=preferred.filter(k=>record[k]!==undefined&&record[k]!==null&&record[k]!=='').map(k=>[k.replaceAll('_',' '),record[k]])
  const metadata=Object.entries(obj(record.metadata||record.commercial_metadata||record.financial_status)).filter(([,v])=>['string','number','boolean'].includes(typeof v)).slice(0,25) as Array<[string,unknown]>
  return{reference,title:`${config.title} · ${text(record.name||record.name_fr||record.title||record.display_name||reference)}`,subtitle:text(record.status),sections:[{title:'Données principales',rows:primary},{title:'Contexte',rows:metadata}]}
}

export async function listBulkOperationJobs():Promise<Row[]>{const db=await createServiceClient();return rows(await optional<any[]>(()=>db.from('angelcare_marketplace_bulk_operation_jobs').select('*').order('created_at',{ascending:false}).limit(150),[]))}
