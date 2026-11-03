/**
 * Governed, at-most-once CJ SANDBOX order bridge for existing AngelCare purchase orders.
 * Source of truth: issued/approved AC purchase, its customer journeys, canonical address,
 * payment authority, selected CJ variants. Never accept free-form customer addresses or amounts.
 * CQ: https://developers.cjdropshipping.com/en/api/api2/api/shopping.html
 */
import 'server-only'
import { createHash } from 'node:crypto'
import { MarketplaceError } from '../server/errors'
import { cjCall, cjFreight, cjConfiguration } from './cj-native'
import type { MarketplaceRequestContext } from '../domain/types'

type Row=Record<string,any>
const txt=(x:unknown,max=200)=>String(x??'').trim().slice(0,max)
const uuid=(x:unknown)=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(txt(x))
const two=(x:unknown)=>{const value=txt(x,2).toUpperCase();if(!/^[A-Z]{2}$/.test(value))throw new MarketplaceError('VALIDATION_ERROR','ISO country code required');return value}
const sha=(value:string)=>createHash('sha256').update(value).digest('hex')
const fail=(error:Row|null,area:string):never=>{throw new MarketplaceError('DEPENDENCY_BLOCKED',`CJ bridge ${area}: database prerequisite or authority failed: ${txt(error?.code,20)||'query failed'}`)}
const isProviderReady=()=>{const c=cjConfiguration();if(!c.ordersEnabled||c.orderMode!=='sandbox')throw new MarketplaceError('DEPENDENCY_BLOCKED','CJ sandbox must be enabled in server configuration; live payments are never used')}
const publicState=(x:Row)=>({id:x.id,purchaseId:x.purchase_id,orderNumber:x.order_number,status:x.status,mode:x.mode,cjOrderId:x.cj_order_id||null,providerStatus:x.provider_status||null,carrier:x.provider_carrier||null,tracking:x.provider_tracking||null,attemptCount:x.attempt_count,lastCheckedAt:x.last_checked_at,submittedAt:x.submitted_at,errorCode:x.error_code||null})
function validateBody(body:Row){
 const purchaseId=txt(body.purchaseId),addressId=txt(body.addressId)
 if(!uuid(purchaseId)||!uuid(addressId))throw new MarketplaceError('VALIDATION_ERROR','Purchase order and canonical customer address UUID required')
 const countryCode=two(body.countryCode),fromCountryCode=two(body.fromCountryCode)
 const province=txt(body.province,50),logisticsName=txt(body.logisticsName,50)
 if(!province||!logisticsName)throw new MarketplaceError('VALIDATION_ERROR','Province and actual CJ shipping-method name required')
 if(!body.verifiedShippingConsent||!txt(body.consentEvidence,500))throw new MarketplaceError('DEPENDENCY_BLOCKED','Approved customer-data transfer evidence is required for CJ sandbox testing')
 const variantMap=body.variantMap
 if(!variantMap||typeof variantMap!=='object'||Array.isArray(variantMap)||Object.keys(variantMap).length>20)throw new MarketplaceError('VALIDATION_ERROR','Map each PO line UUID to its verified CJ variant ID (maximum 20)')
 return {purchaseId,addressId,countryCode,fromCountryCode,province,logisticsName,variantMap:variantMap as Record<string,unknown>}
}
async function audited(db:any,bridge:Row,actor:string,action:string,details:Row={}){
 // Audit never contains customer PII, access tokens, shipping addresses or order payloads.
 const allowed:Row={}
 for(const key of ['providerStatus','cjOrderId','errorCode','trackingPresent','verified'] as const)if(key in details)allowed[key]=details[key]
 const r=await db.from('ac_som_cj_order_events').insert({bridge_id:bridge.id,actor_id:actor,action,request_sha256:bridge.request_sha256,details:allowed})
 if(r.error)fail(r.error,'audit')
}
async function canonicalOrder(db:any,input:ReturnType<typeof validateBody>){
 const po=await db.from('ac_sc_purchase_orders').select('id,reference,status,supplier_id,approved_by,approved_at').eq('id',input.purchaseId).single()
 if(po.error||!po.data)throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical purchase order does not exist')
 if(!['issued','accepted'].includes(po.data.status)||!po.data.approved_by||!po.data.approved_at)throw new MarketplaceError('DEPENDENCY_BLOCKED','Purchase order must be formally approved and issued before CJ sandbox staging')
 const lines=await db.from('ac_sc_purchase_lines').select('id,supplier_offer_id,journey_id,quantity').eq('purchase_id',po.data.id)
 if(lines.error)fail(lines.error,'purchase lines')
 if(!lines.data?.length||lines.data.length>20||lines.data.some((l:Row)=>!uuid(l.journey_id)))throw new MarketplaceError('DEPENDENCY_BLOCKED','1–20 purchase lines, each linked to a real customer journey, required')
 const journeyIds=[...new Set(lines.data.map((l:Row)=>txt(l.journey_id)))]
 if(journeyIds.length!==1)throw new MarketplaceError('DEPENDENCY_BLOCKED','One verified customer journey per CJ shipping order; split multi-customer purchase orders first')
 const journey=await db.from('angelcare_marketplace_journeys').select('id,customer_account_id').eq('id',journeyIds[0]).single()
 if(journey.error||!uuid(journey.data?.customer_account_id))throw new MarketplaceError('DEPENDENCY_BLOCKED','Purchase must reference a verified canonical customer account')
 const payments=await db.from('angelcare_marketplace_payment_intents').select('id,status,captured_amount').eq('canonical_object_id',journeyIds[0]).in('status',['captured','reconciled']).limit(4)
 if(payments.error)fail(payments.error,'payment authority')
 if(!payments.data?.some((p:Row)=>Number(p.captured_amount)>0))throw new MarketplaceError('DEPENDENCY_BLOCKED','Canonical paid customer order/payment evidence required; no fabricated checkout allocation')
 const addr=await db.from('angelcare_marketplace_customer_addresses').select('id,customer_account_id,recipient_name,phone,address_line,city,postal_code,status').eq('id',input.addressId).eq('customer_account_id',journey.data.customer_account_id).eq('status','active').maybeSingle()
 if(addr.error)fail(addr.error,'canonical customer address')
 if(!addr.data||!addr.data.recipient_name||!addr.data.address_line||!addr.data.city||!addr.data.phone)throw new MarketplaceError('DEPENDENCY_BLOCKED','Verified recipient, street, city and phone required in canonical customer address')
 const productLines=[] as {vid:string;quantity:number;storeLineItemId:string}[]
 if(Object.keys(input.variantMap).length!==lines.data.length)throw new MarketplaceError('VALIDATION_ERROR','Exactly one mapped CJ variant per purchase line')
 for(const line of lines.data as Row[]){
  const vid=txt(input.variantMap[line.id],50)
  if(!vid||!uuid(line.id))throw new MarketplaceError('VALIDATION_ERROR','Missing validated CJ variant mapping for a purchase line')
  const selection=await db.from('ac_som_selections').select('id,provider,canonical_supplier_id,selected_variant_ids,normalized').eq('supplier_offer_id',line.supplier_offer_id).eq('provider','cj').limit(2)
  if(selection.error)fail(selection.error,'canonical supplier selection')
  if(selection.data?.length!==1||selection.data[0].canonical_supplier_id!==po.data.supplier_id)throw new MarketplaceError('DEPENDENCY_BLOCKED','Ambiguous or mismatched CJ supplier offer mapping')
  const src=selection.data[0]
  if(!Array.isArray(src.selected_variant_ids)||!src.selected_variant_ids.includes(vid)||!src.normalized?.variants?.some((v:Row)=>v.id===vid))throw new MarketplaceError('DEPENDENCY_BLOCKED','Variant is not approved in the canonical supplier selection')
  const qty=Number(line.quantity)
  if(!Number.isSafeInteger(qty)||qty<1||qty>1000)throw new MarketplaceError('VALIDATION_ERROR','CJ physical order quantity must be an integer 1–1000')
  productLines.push({vid,quantity:qty,storeLineItemId:line.id})
 }
 const countryName=new Intl.DisplayNames(['en'],{type:'region'}).of(input.countryCode)
 if(!countryName||countryName===input.countryCode)throw new MarketplaceError('VALIDATION_ERROR','Unknown destination country')
 const orderNumber='ACS'+po.data.id.replaceAll('-','').slice(0,30).toUpperCase()
 const request={orderNumber,shippingZip:txt(addr.data.postal_code,20),shippingCountryCode:input.countryCode,shippingCountry:countryName,
  shippingProvince:input.province,shippingCity:txt(addr.data.city,50),shippingAddress:txt(addr.data.address_line,500),
  shippingCustomerName:txt(addr.data.recipient_name,50),shippingPhone:txt(addr.data.phone,20),
  logisticName:input.logisticsName,fromCountryCode:input.fromCountryCode,orderFlow:1,payType:3,isSandbox:1,products:productLines}
 // Stable fingerprint binds the request to the exact PO, address and variants without storing PII in the bridge table.
 const digest=sha(JSON.stringify(request))
 return {request,digest,orderNumber,po,products:productLines}
}
export async function previewCjSandbox(ctx:MarketplaceRequestContext,db:any,raw:Row){
 isProviderReady()
 const input=validateBody(raw),data=await canonicalOrder(db,input)
 // Never send PII to browser; only logistics and line identity are shown.
 return {purchaseId:input.purchaseId,orderNumber:data.orderNumber,sandbox:true,paymentTriggered:false,productCount:data.products.length,
  variants:data.products.map(({vid,quantity,storeLineItemId})=>({vid,quantity,storeLineItemId})),
  destinationCountryCode:input.countryCode,logisticsName:input.logisticsName,requestSha256:data.digest,
  consentReviewed:true,claimRequired:true}
}
export async function prepareCjSandbox(ctx:MarketplaceRequestContext,db:any,raw:Row){
 isProviderReady()
 const input=validateBody(raw),data=await canonicalOrder(db,input)
 const consentDigest=sha(txt(raw.consentEvidence,500))
 if(raw.confirm!==`PREPARE SANDBOX ${input.purchaseId}`)throw new MarketplaceError('VALIDATION_ERROR','Explicit PREPARE SANDBOX <PO UUID> confirmation required')
 const existing=await db.from('ac_som_cj_order_bridges').select('*').eq('purchase_id',input.purchaseId).maybeSingle()
 if(existing.error)fail(existing.error,'bridge deduplication')
 if(existing.data){if(existing.data.request_sha256!==data.digest)throw new MarketplaceError('DEPENDENCY_BLOCKED','Purchase has an existing CJ bridge with different request; manual reconciliation required')
  return {bridge:publicState(existing.data),created:false}}
 // Operator supplies a verified CJ logistics method. We do not synthesize shipping quotes, rates or stock.
 for(const product of data.products){
  const freight=await cjFreight({variantId:product.vid,origin:input.fromCountryCode,destination:input.countryCode,quantity:product.quantity})
  if(!freight.methods.some((m:Row)=>m.name===input.logisticsName&&m.price!==null))throw new MarketplaceError('DEPENDENCY_BLOCKED',`Verified CJ freight option ${input.logisticsName} unavailable for one of the selected variants`)
 }
 const saved=await db.from('ac_som_cj_order_bridges').insert({purchase_id:input.purchaseId,order_number:data.orderNumber,mode:'sandbox',status:'prepared',
  request_sha256:data.digest,consent_evidence_sha256:consentDigest,consent_attested_at:new Date().toISOString(),shipping_address_id:input.addressId,shipping_country_code:input.countryCode,shipping_province:input.province,
  from_country_code:input.fromCountryCode,logistics_name:input.logisticsName,variant_map:input.variantMap,
  approved_by:ctx.actor.id,created_by:ctx.actor.id}).select('*').single()
 if(saved.error){const duplicate=await db.from('ac_som_cj_order_bridges').select('*').eq('purchase_id',input.purchaseId).maybeSingle()
  if(!duplicate.error&&duplicate.data&&duplicate.data.request_sha256===data.digest)return {bridge:publicState(duplicate.data),created:false}
  fail(saved.error,'sandbox preparation')}
 await audited(db,saved.data,ctx.actor.id,'cj.sandbox_prepared')
 return {bridge:publicState(saved.data),created:true,providerWritePerformed:false}
}
export async function submitCjSandbox(ctx:MarketplaceRequestContext,db:any,raw:Row){
 isProviderReady()
 const bridgeId=txt(raw.bridgeId)
 if(!uuid(bridgeId))throw new MarketplaceError('VALIDATION_ERROR','Bridge UUID required')
 if(raw.confirm!==`SUBMIT SANDBOX ${bridgeId}`)throw new MarketplaceError('VALIDATION_ERROR','Type SUBMIT SANDBOX <bridge UUID> to authorize a single sandbox provider write')
 const saved=await db.from('ac_som_cj_order_bridges').select('*').eq('id',bridgeId).single()
 if(saved.error||!saved.data)throw new MarketplaceError('NOT_FOUND','CJ bridge not found')
 if(saved.data.status==='submitted'||saved.data.status==='reconciled')return {bridge:publicState(saved.data),duplicatePrevented:true}
 if(!saved.data.consent_evidence_sha256||!saved.data.consent_attested_at)throw new MarketplaceError('DEPENDENCY_BLOCKED','Verified consent attestation is not present on the bridge')
 if(saved.data.status!=='prepared'||saved.data.attempt_count!==0)throw new MarketplaceError('DEPENDENCY_BLOCKED','No repeat submit allowed; reconcile ambiguous/processing order first')
 const input={purchaseId:saved.data.purchase_id,addressId:saved.data.shipping_address_id,countryCode:saved.data.shipping_country_code,
  fromCountryCode:saved.data.from_country_code,province:saved.data.shipping_province,logisticsName:saved.data.logistics_name,
  variantMap:saved.data.variant_map,verifiedShippingConsent:true,consentEvidence:'prior approved preparation'}
 const data=await canonicalOrder(db,validateBody(input))
 if(data.digest!==saved.data.request_sha256)throw new MarketplaceError('DEPENDENCY_BLOCKED','Purchase, address, variant, or shipping payload changed after approval; recreate under controlled reconciliation')
 // Atomic SQL claim serializes simultaneous workers and permanently prohibits duplicate provider writes.
 const claim=await db.rpc('ac_som_claim_cj_sandbox_order',{p_bridge:bridgeId,p_request_sha256:data.digest,p_actor:ctx.actor.id})
 if(claim.error||claim.data!==bridgeId)throw new MarketplaceError('DEPENDENCY_BLOCKED','Concurrent submission blocked by atomic CJ order claim')
 try{
  const response=await cjCall('createOrder',{},data.request)
  const orderId=txt(response.data?.orderId,100)
  if(!orderId)throw Error('CJ returned an ambiguous success without a stable orderId')
  const updated=await db.from('ac_som_cj_order_bridges').update({status:'submitted',cj_order_id:orderId,provider_status:txt(response.data?.orderStatus,60)||'CREATED',
   submitted_at:new Date().toISOString(),last_checked_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',bridgeId).eq('status','submitting').select('*').single()
  if(updated.error||!updated.data)throw Error('CJ accepted order but local confirmation could not be persisted')
  await audited(db,updated.data,ctx.actor.id,'cj.sandbox_submitted',{cjOrderId:orderId})
  return {bridge:publicState(updated.data),paymentTriggered:false}
 }catch{
  // The request may have reached CJ. NEVER retry creating the order after a timeout.
  await db.from('ac_som_cj_order_bridges').update({status:'ambiguous',error_code:'RECONCILIATION_REQUIRED',updated_at:new Date().toISOString()}).eq('id',bridgeId).eq('status','submitting')
  throw new MarketplaceError('DEPENDENCY_BLOCKED','CJ order submission is uncertain; use read-only reconciliation; NEVER resubmit this purchase order')
 }
}
export async function reconcileCjSandbox(ctx:MarketplaceRequestContext,db:any,raw:Row){
 isProviderReady()
 const bridgeId=txt(raw.bridgeId)
 if(!uuid(bridgeId))throw new MarketplaceError('VALIDATION_ERROR','Bridge UUID required')
 const r=await db.from('ac_som_cj_order_bridges').select('*').eq('id',bridgeId).single()
 if(r.error||!r.data)throw new MarketplaceError('NOT_FOUND','CJ bridge not found')
 const bridge=r.data
 if(bridge.status==='prepared')return {bridge:publicState(bridge),providerReadPerformed:false}
 let result:Row
 try{result=await cjCall('order',{orderId:txt(bridge.cj_order_id)||txt(bridge.order_number)})}
 catch{return {bridge:publicState(bridge),reconciled:false,reason:'CJ read-only order query unavailable; no repeat submit permitted'}}
 const order=result.data
 if(!order||!['orderNum','orderNumber'].some(k=>txt(order[k])===bridge.order_number))return {bridge:publicState(bridge),reconciled:false,reason:'Provider result did not independently match the original order number'}
 if(order.isSandbox!==1&&order.isSandbox!==true)throw new MarketplaceError('DEPENDENCY_BLOCKED','Provider record not marked sandbox; manual investigation required')
 const orderId=txt(order.orderId)||txt(bridge.cj_order_id)
 if(!orderId)return {bridge:publicState(bridge),reconciled:false,reason:'Provider omitted stable orderId'}
 const updated=await db.from('ac_som_cj_order_bridges').update({status:'reconciled',cj_order_id:orderId,provider_status:txt(order.orderStatus,60),
  provider_tracking:txt(order.trackNumber,100)||null,provider_carrier:txt(order.trackingProvider,100)||null,
  error_code:null,last_checked_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',bridgeId).select('*').single()
 if(updated.error)fail(updated.error,'read-only reconciliation')
 await audited(db,updated.data,ctx.actor.id,'cj.sandbox_reconciled',{cjOrderId:orderId,providerStatus:txt(order.orderStatus,60),trackingPresent:!!order.trackNumber,verified:true})
 return {bridge:publicState(updated.data),reconciled:true}
}
export async function listCjBridges(db:any){
 const data=await db.from('ac_som_cj_order_bridges').select('id,purchase_id,order_number,mode,status,cj_order_id,provider_status,provider_tracking,provider_carrier,attempt_count,last_checked_at,submitted_at,error_code').order('updated_at',{ascending:false}).limit(100)
 if(data.error)fail(data.error,'bridge list')
 return (data.data||[]).map(publicState)
}
