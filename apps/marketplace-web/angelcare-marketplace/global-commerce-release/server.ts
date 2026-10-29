import { createServiceClient } from '@/lib/supabase/server'
import { paypalConfigurationStatus } from '../customer-commerce/paypal'

type Status = 'verified' | 'blocked' | 'evidence_required'
export type Gate = {id:string;name:string;status:Status;detail:string;href:string}
export async function releaseSnapshot() {
 const db=await createServiceClient()
 const [countries,rates,config,suppliers,offers,items,orders,shipments,payments] = await Promise.all([
  db.from('ac_owc_countries').select('code,name,currency,enabled').limit(500),
  db.from('ac_owc_rates').select('currency,observed_on').eq('status','active').limit(300),
  db.from('ac_owc_configuration').select('mode').eq('id',1).maybeSingle(),
  db.from('angelcare_marketplace_suppliers').select('id,status,quality_status').in('status',['approved','active']).limit(1000),
  db.from('angelcare_marketplace_supplier_offers').select('id,status').in('status',['approved','active']).limit(1000),
  db.from('angelcare_marketplace_catalog_items').select('id,status,availability_status,price_mode').eq('status','published').limit(1000),
  db.from('ac_sc_purchase_orders').select('id',{head:true,count:'exact'}),
  db.from('ac_sc_shipments').select('id',{head:true,count:'exact'}),
  db.from('angelcare_marketplace_payment_intents').select('id',{head:true,count:'exact'}),
 ])
 const faults = {countries:countries.error?.message||null,rates:rates.error?.message||null,config:config.error?.message||null,suppliers:suppliers.error?.message||null,offers:offers.error?.message||null,items:items.error?.message||null,orders:orders.error?.message||null,shipments:shipments.error?.message||null,payments:payments.error?.message||null}
 const availableRates = new Map((rates.data||[]).map(r=>[String(r.currency), String(r.observed_on)]))
 const marketRows = (countries.data||[]).map(c=>{
  const currency=String(c.currency),last=availableRates.get(currency)
  const age=last?Math.floor((Date.now()-Date.parse(last+'T00:00:00Z'))/86400000):null
  const fxReady=currency==='USD'||(age!==null&&age>=0&&age<=7)
  return {code:String(c.code),name:String(c.name),currency,enabled:Boolean(c.enabled),fxReady,ageDays:age,commercialReady:false}
 })
 const goodSuppliers=(suppliers.data||[]).filter(s=>['approved','conditional'].includes(String(s.quality_status))).length
 const validItems=(items.data||[]).filter(x=>x.availability_status==='available').length
 const paypal=paypalConfigurationStatus()
 const gates:Gate[]=[
  {id:'schema',name:'Canonical database',status:Object.values(faults).some(Boolean)?'blocked':'verified',detail:Object.entries(faults).filter(([,v])=>Boolean(v)).map(([k,v])=>k+': '+v).join('; ')||'All nine queried authorities readable',href:'/angelcare-marketplace/admin/security'},
  {id:'fx',name:'Approved FX coverage',status:marketRows.some(m=>m.enabled&&m.fxReady)?'verified':'blocked',detail:marketRows.filter(m=>m.enabled&&m.fxReady).length+' enabled countries have current reference FX',href:'/angelcare-marketplace/admin/one-world-currency'},
  {id:'supplier',name:'Qualified suppliers',status:goodSuppliers?'verified':'blocked',detail:goodSuppliers+' qualifying supplier records found',href:'/angelcare-marketplace/admin/supplier-command-360'},
  {id:'offers',name:'Supplier offers',status:(offers.data||[]).length?'verified':'blocked',detail:(offers.data||[]).length+' approved/active offers found',href:'/angelcare-marketplace/admin/supplier-command-360'},
  {id:'catalog',name:'Public catalogue',status:validItems?'evidence_required':'blocked',detail:validItems+' published and available items; paid destination-level purchases unverified',href:'/angelcare-marketplace/admin/catalog/items'},
  {id:'currency',name:'ONE WORLD public activation',status:'blocked',detail:'Repository still implements a simulation boundary, not country-aware customer charge authorization',href:'/angelcare-marketplace/admin/one-world-currency'},
  {id:'checkout',name:'Global paid checkout',status:'blocked',detail:'Current supplier launch flow is quotation-only; end-to-end ONE WORLD payment integration missing',href:'/angelcare-marketplace/admin/orders'},
  {id:'payments',name:'Payment capture & refunds',status:paypal.configured?'evidence_required':'blocked',detail:paypal.configured?'PayPal credentials configured; verified sandbox/live capture and refunds still required':'Payment provider not configured',href:'/angelcare-marketplace/admin/configuration/integrations/payments/paypal'},
  {id:'procurement',name:'Supplier purchasing',status:orders.error?'blocked':'evidence_required',detail:orders.error?.message||'Purchase-order table readable; real purchase workflow not certified',href:'/angelcare-marketplace/admin/supplier-command-360'},
  {id:'logistics',name:'International shipping',status:shipments.error?'blocked':'evidence_required',detail:shipments.error?.message||'Shipment table readable; customs, carrier and delivery proof not certified',href:'/angelcare-marketplace/admin/orders-fulfillment'},
  {id:'reconciliation',name:'Settlement & finance',status:payments.error?'blocked':'evidence_required',detail:payments.error?.message||'Payment intent table readable; external settlement proof required',href:'/angelcare-marketplace/admin/finance'},
  {id:'legal',name:'Country legal compliance',status:'evidence_required',detail:'No evidence of market-specific merchant, tax, product safety and consumer protection approvals',href:'/angelcare-marketplace/admin/trust/compliance'},
  {id:'seo',name:'Search visibility',status:'evidence_required',detail:'SEO POWER crawl, robot rules, indexing and conversion require live validation',href:'/angelcare-marketplace/admin/seo-power'},
 ]
 return {checkedAt:new Date().toISOString(),globalCommercialReleaseAuthorized:false,currencyMode:config.data?.mode||'unknown',paypal:{configured:paypal.configured,environment:paypal.environment,currency:paypal.currency},counts:{suppliers:goodSuppliers,offers:(offers.data||[]).length,availableProducts:validItems,purchases:orders.count??null,shipments:shipments.count??null,payments:payments.count??null},gates,markets:marketRows}
}
