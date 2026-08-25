import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { createServiceClient } from '@/lib/supabase/server'
import { createCommerceResource, updateCommerceResource } from '../commerce-studio/repository'
import { validateProductImportRows } from './product-doctrine'
import { businessPulseSnapshot, customerMegaDossier, enterpriseSearch, fulfillmentMissionSnapshot, genericDocumentSnapshot, liveMarketplaceSnapshot, listBulkOperationJobs, listDocumentTemplates, listDocumentTemplateVersions, orderMegaDossier, restoreDocumentTemplateVersion, saveDocumentTemplate, segmentPreview } from './repository'
import { buildEnterprisePdf } from './document-factory'
import type { DocumentTemplateKey } from './types'

const text=(v:unknown)=>String(v??'').trim(); const rows=(v:unknown)=>Array.isArray(v)?v as Record<string,unknown>[]:[]
const pairRows=(data:Record<string,unknown>[],mapper:(row:Record<string,unknown>,index:number)=>[string,unknown]):Array<[string,unknown]>=>data.map(mapper)
export async function handleEnterpriseSearch(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();const q=new URL(request.url).searchParams.get('q')||'';return apiSuccess(await enterpriseSearch(q),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleCustomerMega(request:Request,customerId:string){const id=requestId(request);try{await requireMarketplaceApiContext();return apiSuccess(await customerMegaDossier(customerId),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleOrderMega(request:Request,orderId:string){const id=requestId(request);try{await requireMarketplaceApiContext();return apiSuccess(await orderMegaDossier(orderId),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleLiveMap(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();const minutes=Number(new URL(request.url).searchParams.get('minutes')||30);return apiSuccess(await liveMarketplaceSnapshot(minutes),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleBusinessPulse(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();return apiSuccess(await businessPulseSnapshot(),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleMissions(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();return apiSuccess(await fulfillmentMissionSnapshot(),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleSegments(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();const body=request.method==='POST'?await parseJsonObject(request):{};return apiSuccess(await segmentPreview(body),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleTemplates(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();if(request.method==='GET')return apiSuccess(await listDocumentTemplates(),{requestId:id});const body=await parseJsonObject(request);return apiSuccess(await saveDocumentTemplate(body as any),{requestId:id})}catch(e){return apiFailure(e,id)}}
export async function handleTemplateVersions(request:Request,templateKey:DocumentTemplateKey){const id=requestId(request);try{await requireMarketplaceApiContext();if(request.method==='GET')return apiSuccess(await listDocumentTemplateVersions(templateKey),{requestId:id});if(request.method==='POST'){const body=await parseJsonObject(request);return apiSuccess(await restoreDocumentTemplateVersion({templateKey,versionNumber:Number(body.versionNumber)}),{requestId:id})}throw new Error('Méthode non prise en charge.')}catch(e){return apiFailure(e,id)}}
async function existingCatalogKeys(db:any,inputRows:Record<string,unknown>[]){
  const keys=[...new Set(inputRows.map(r=>text(r.item_key)).filter(Boolean))]
  const existing=new Set<string>()
  for(let i=0;i<keys.length;i+=400){
    const result=await db.from('angelcare_marketplace_catalog_items').select('item_key').in('item_key',keys.slice(i,i+400))
    if(result.error)throw result.error
    for(const row of result.data||[])existing.add(String(row.item_key))
  }
  return existing
}

function importReference(id:string){const date=new Date().toISOString().slice(0,10).replaceAll('-','');return `AC-IMP-${date}-${id.replaceAll('-','').slice(0,8).toUpperCase()}`}

async function processProductImportRow(input:{db:any;context:any;doctrineKey:string;row:any}){
  const {db,context,doctrineKey,row}=input
  const n=(row.normalized_payload||{}) as Record<string,unknown>
  const categoryKeys=text(n.category_keys).split(/[|,;]/).map(v=>v.trim()).filter(Boolean)
  const territoryCodes=text(n.territory_codes).split(/[|,;]/).map(v=>v.trim()).filter(Boolean)
  const payload:any={
    item_key:n.item_key,slug:n.slug,kind:n.kind,sellable_type:n.sellable_type,name_fr:n.name_fr,
    short_description_fr:n.short_description_fr||null,description_fr:n.description_fr||null,
    price_mode:n.price_mode,price_amount:n.price_amount||null,currency_label:n.currency_label,
    availability_status:n.availability_status,status:n.status,
    commercial_metadata:{doctrine:doctrineKey,imported_fields:Object.fromEntries(Object.entries(n).filter(([k])=>!['category_keys','territory_codes'].includes(k)))},
    attributes:{doctrine:doctrineKey},seo_metadata:{},
  }
  let item:any
  if(row.action==='update'){
    const found=await db.from('angelcare_marketplace_catalog_items').select('id').eq('item_key',text(n.item_key)).maybeSingle()
    if(found.error)throw found.error
    if(found.data)item=(await updateCommerceResource({resource:'catalog-items',id:String(found.data.id),payload,context})).record
    else item=(await createCommerceResource({resource:'catalog-items',payload,context})).record
  }else item=(await createCommerceResource({resource:'catalog-items',payload,context})).record
  if(item?.id&&categoryKeys.length){
    const cats=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key').in('category_key',categoryKeys)
    if(cats.error)throw cats.error
    const del=await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('catalog_item_id',item.id)
    if(del.error)throw del.error
    if(cats.data?.length){const ins=await db.from('angelcare_marketplace_catalog_item_categories').insert(cats.data.map((c:any)=>({catalog_item_id:item.id,category_id:c.id})));if(ins.error)throw ins.error}
  }
  if(item?.id&&territoryCodes.length){
    const territories=await db.from('angelcare_marketplace_territories').select('id,territory_code').in('territory_code',territoryCodes)
    if(territories.error)throw territories.error
    if(territories.data?.length){const up=await db.from('angelcare_marketplace_catalog_availability').upsert(territories.data.map((t:any)=>({catalog_item_id:item.id,territory_id:t.id,status:'available'})),{onConflict:'catalog_item_id,territory_id'});if(up.error)throw up.error}
  }
  return{row:row.row_number,id:item?.id||null,key:text(n.item_key),action:row.action}
}

async function importJobSnapshot(db:any,jobId:string,options?:{page?:number;pageSize?:number;failedOnly?:boolean}){
  const jobResult=await db.from('angelcare_marketplace_bulk_operation_jobs').select('*').eq('id',jobId).maybeSingle()
  if(jobResult.error)throw jobResult.error
  if(!jobResult.data)throw new Error('Job import introuvable.')
  const page=Math.max(1,Number(options?.page||1)),pageSize=Math.max(1,Math.min(500,Number(options?.pageSize||100)))
  let query=db.from('angelcare_marketplace_bulk_operation_rows').select('*',{count:'exact'}).eq('job_id',jobId).order('row_number').range((page-1)*pageSize,page*pageSize-1)
  if(options?.failedOnly)query=query.in('status',['failed','rejected'])
  const rowsResult=await query
  if(rowsResult.error)throw rowsResult.error
  return{job:jobResult.data,rows:rowsResult.data||[],rowCount:rowsResult.count||0,page,pageSize}
}

async function refreshImportJob(db:any,jobId:string){
  const result=await db.from('angelcare_marketplace_bulk_operation_rows').select('status').eq('job_id',jobId)
  if(result.error)throw result.error
  const statuses=(result.data||[]).map((r:any)=>String(r.status))
  const total=statuses.length,completed=statuses.filter((s:string)=>s==='completed').length,failed=statuses.filter((s:string)=>s==='failed').length,rejected=statuses.filter((s:string)=>s==='rejected').length,processing=statuses.filter((s:string)=>s==='processing').length,pending=statuses.filter((s:string)=>s==='pending').length
  const processed=completed+failed+rejected
  const done=pending===0&&processing===0
  const status=done?(failed?'completed_with_errors':'completed'):(processing?'running':'queued')
  const progress=total?Number(((processed/total)*100).toFixed(2)):100
  const update:any={status,processed_rows:processed,failed_rows:failed,rejected_rows:rejected,progress_percent:progress,updated_at:new Date().toISOString(),result:{completed,failed,rejected,total}}
  if(done){update.completed_at=new Date().toISOString();update.result_file_name=`AC-IMPORT-${jobId.replaceAll('-','').slice(0,8).toUpperCase()}-RESULT.csv`}
  const updated=await db.from('angelcare_marketplace_bulk_operation_jobs').update(update).eq('id',jobId).select('*').single()
  if(updated.error)throw updated.error
  return updated.data
}

export async function handleProductImportPreview(request:Request){
  const id=requestId(request)
  try{
    const context=await requireMarketplaceApiContext();const body=await parseJsonObject(request);const doctrineKey=text(body.doctrineKey);const inputRows=rows(body.rows);const db=await createServiceClient();const existing=await existingCatalogKeys(db,inputRows)
    const preview=validateProductImportRows({doctrineKey,rows:inputRows,existingKeys:existing})
    return apiSuccess(preview,{requestId:id})
  }catch(e){return apiFailure(e,id)}
}

// Compatibility endpoint: creates a resumable industrial job instead of blocking one request for every row.
export async function handleProductImportCommit(request:Request){return handleProductImportJobCreate(request)}

export async function handleProductImportJobCreate(request:Request){
  const id=requestId(request)
  try{
    const context=await requireMarketplaceApiContext();const body=await parseJsonObject(request);const doctrineKey=text(body.doctrineKey);const inputRows=rows(body.rows);const idempotencyKey=text(body.idempotencyKey)||`product-import:${crypto.randomUUID()}`;const db=await createServiceClient()
    const existingJob=await db.from('angelcare_marketplace_bulk_operation_jobs').select('*').eq('idempotency_key',idempotencyKey).maybeSingle()
    if(existingJob.error)throw existingJob.error
    if(existingJob.data)return apiSuccess(await importJobSnapshot(db,String(existingJob.data.id)),{requestId:id})
    const existing=await existingCatalogKeys(db,inputRows);const preview=validateProductImportRows({doctrineKey,rows:inputRows,existingKeys:existing})
    const created=await db.from('angelcare_marketplace_bulk_operation_jobs').insert({operation_type:'product_doctrine_import',doctrine_key:doctrineKey,resource_type:'catalog-items',status:preview.valid?'queued':'completed',dry_run:preview,total_rows:inputRows.length,valid_rows:preview.valid,rejected_rows:preview.rejected,processed_rows:preview.rejected,failed_rows:0,progress_percent:inputRows.length?Number(((preview.rejected/inputRows.length)*100).toFixed(2)):100,idempotency_key:idempotencyKey,created_by:context.actor.id,metadata:{source:'doctrine-import-studio',resumable:true}}).select('*').single()
    if(created.error||!created.data)throw created.error||new Error('Création du job impossible.')
    const jobId=String(created.data.id),publicReference=importReference(jobId)
    const updateRef=await db.from('angelcare_marketplace_bulk_operation_jobs').update({public_reference:publicReference,updated_at:new Date().toISOString()}).eq('id',jobId)
    if(updateRef.error)throw updateRef.error
    const payloadRows=preview.rows.map((row,index)=>({job_id:jobId,row_number:row.row,source_payload:inputRows[index]||{},normalized_payload:row.normalized,action:row.action,status:row.valid?'pending':'rejected',errors:row.errors,warnings:row.warnings,attempts:0}))
    for(let i=0;i<payloadRows.length;i+=400){const ins=await db.from('angelcare_marketplace_bulk_operation_rows').insert(payloadRows.slice(i,i+400));if(ins.error)throw ins.error}
    return apiSuccess(await importJobSnapshot(db,jobId),{requestId:id})
  }catch(e){return apiFailure(e,id)}
}

export async function handleProductImportJob(request:Request,jobId:string){
  const id=requestId(request)
  try{
    await requireMarketplaceApiContext();const url=new URL(request.url);const db=await createServiceClient()
    return apiSuccess(await importJobSnapshot(db,jobId,{page:Number(url.searchParams.get('page')||1),pageSize:Number(url.searchParams.get('pageSize')||100),failedOnly:url.searchParams.get('failedOnly')==='1'}),{requestId:id})
  }catch(e){return apiFailure(e,id)}
}

export async function handleProductImportJobRun(request:Request,jobId:string){
  const id=requestId(request)
  try{
    const context=await requireMarketplaceApiContext();const body=await parseJsonObject(request);const db=await createServiceClient();const batchSize=Math.max(1,Math.min(100,Number(body.batchSize||25)))
    const jobResult=await db.from('angelcare_marketplace_bulk_operation_jobs').select('*').eq('id',jobId).maybeSingle();if(jobResult.error)throw jobResult.error;if(!jobResult.data)throw new Error('Job import introuvable.')
    if(['completed','completed_with_errors'].includes(String(jobResult.data.status)))return apiSuccess(await importJobSnapshot(db,jobId),{requestId:id})
    const staleBefore=new Date(Date.now()-10*60*1000).toISOString();await db.from('angelcare_marketplace_bulk_operation_rows').update({status:'pending',updated_at:new Date().toISOString()}).eq('job_id',jobId).eq('status','processing').lt('updated_at',staleBefore)
    const pending=await db.from('angelcare_marketplace_bulk_operation_rows').select('*').eq('job_id',jobId).eq('status','pending').order('row_number').limit(batchSize);if(pending.error)throw pending.error
    const selected=pending.data||[]
    if(!selected.length){await refreshImportJob(db,jobId);return apiSuccess(await importJobSnapshot(db,jobId),{requestId:id})}
    const ids=selected.map((r:any)=>r.id)
    const claimed=await db.from('angelcare_marketplace_bulk_operation_rows').update({status:'processing',updated_at:new Date().toISOString()}).in('id',ids).eq('status','pending');if(claimed.error)throw claimed.error
    await db.from('angelcare_marketplace_bulk_operation_jobs').update({status:'running',started_at:jobResult.data.started_at||new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',jobId)
    for(const row of selected){
      try{
        const result=await processProductImportRow({db,context,doctrineKey:String(jobResult.data.doctrine_key||''),row})
        const up=await db.from('angelcare_marketplace_bulk_operation_rows').update({status:'completed',object_type:'catalog_item',object_id:result.id||null,result,attempts:Number(row.attempts||0)+1,processed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',row.id);if(up.error)throw up.error
      }catch(error){
        const message=error instanceof Error?error.message:String(error)
        await db.from('angelcare_marketplace_bulk_operation_rows').update({status:'failed',errors:[...((Array.isArray(row.errors)?row.errors:[])),message],attempts:Number(row.attempts||0)+1,processed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',row.id)
      }
    }
    await refreshImportJob(db,jobId)
    return apiSuccess(await importJobSnapshot(db,jobId),{requestId:id})
  }catch(e){return apiFailure(e,id)}
}

export async function handleProductImportJobResult(request:Request,jobId:string){
  const id=requestId(request)
  try{
    await requireMarketplaceApiContext();const db=await createServiceClient()
    const jobResult=await db.from('angelcare_marketplace_bulk_operation_jobs').select('*').eq('id',jobId).maybeSingle();if(jobResult.error)throw jobResult.error;if(!jobResult.data)throw new Error('Job import introuvable.')
    const result=await db.from('angelcare_marketplace_bulk_operation_rows').select('row_number,status,action,object_id,normalized_payload,errors,warnings,attempts,processed_at').eq('job_id',jobId).order('row_number');if(result.error)throw result.error
    const quote=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
    const headers=['row_number','status','action','item_key','object_id','attempts','errors','warnings','processed_at']
    const lines=[headers.join(','),...(result.data||[]).map((row:any)=>[row.row_number,row.status,row.action,row.normalized_payload?.item_key,row.object_id,row.attempts,(row.errors||[]).join(' | '),(row.warnings||[]).join(' | '),row.processed_at].map(quote).join(','))]
    const name=`${String(jobResult.data.public_reference||'ANGELCARE_IMPORT')}_RESULT.csv`
    await db.from('angelcare_marketplace_bulk_operation_jobs').update({result_file_name:name,updated_at:new Date().toISOString()}).eq('id',jobId)
    return new Response(lines.join('\n'),{status:200,headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="${name}"`,'x-request-id':id}})
  }catch(e){return apiFailure(e,id)}
}

export async function handleProductImportJobRetry(request:Request,jobId:string){
  const id=requestId(request)
  try{
    await requireMarketplaceApiContext();const db=await createServiceClient()
    const reset=await db.from('angelcare_marketplace_bulk_operation_rows').update({status:'pending',processed_at:null,updated_at:new Date().toISOString()}).eq('job_id',jobId).eq('status','failed');if(reset.error)throw reset.error
    const job=await db.from('angelcare_marketplace_bulk_operation_jobs').update({status:'queued',failed_rows:0,last_error:null,completed_at:null,updated_at:new Date().toISOString()}).eq('id',jobId);if(job.error)throw job.error
    await refreshImportJob(db,jobId)
    return apiSuccess(await importJobSnapshot(db,jobId,{failedOnly:false}),{requestId:id})
  }catch(e){return apiFailure(e,id)}
}

export async function handleDocumentExport(request:Request){
  const id=requestId(request)
  try{
    const context=await requireMarketplaceApiContext()
    const body=await parseJsonObject(request)
    const type=text(body.objectType)
    const objectId=text(body.objectId)
    const templateKey=(text(body.templateKey)||(type==='customer'?'customer_dossier':type==='order'?'order_summary':type==='invoice'?'invoice':type==='receipt'?'receipt':type==='subscription'?'subscription_summary':type==='provider'?'provider_mission':type==='product'?'product_sheet':'order_summary')) as DocumentTemplateKey
    const templates=await listDocumentTemplates()
    const template=templates.find(t=>t.template_key===templateKey)||templates[0]
    if(!template)throw new Error('Aucun template document disponible.')
    let reference='',title='',subtitle='',sections:Array<{key?:string;title:string;rows:Array<[string,unknown]>}>=[]

    if(type==='customer'){
      const d=await customerMegaDossier(objectId)
      reference=d.enterpriseReference
      title=text(d.customer.display_name)||'Dossier Client'
      subtitle=[d.customer.email,d.customer.phone].filter(Boolean).join(' · ')
      if(templateKey==='family_dossier'){
        sections=[
          {key:'identity',title:'Famille',rows:[['Référence client',reference],['Client',d.customer.display_name],['Référence famille',d.family?.public_reference],['Statut famille',d.family?.status]]},
          {key:'family',title:'Gardiens',rows:pairRows(d.guardians.slice(0,20),(g,i)=>[`Gardien ${i+1}`,`${text(g.display_name||g.full_name||g.name)} · ${text(g.relationship_kind||g.relationship||'')}`])},
          {key:'family',title:'Enfants',rows:pairRows(d.children.slice(0,30),(c,i)=>[`Enfant ${i+1}`,`${text(c.display_name||c.full_name||c.first_name||c.name)} · ${text(c.birth_date||c.age_band||'')}`])},
          {key:'family',title:'Adresses',rows:pairRows(d.addresses.slice(0,20),(a,i)=>[`Adresse ${i+1}`,`${text(a.label||a.city||'Adresse')} · ${text(a.address_line1||a.address||'')}`])},
        ]
      }else if(templateKey==='wallet_statement'){
        sections=[
          {key:'customer',title:'Client',rows:[['Référence',reference],['Nom',d.customer.display_name],['Email',d.customer.email],['Téléphone',d.customer.phone]]},
          {key:'balance',title:'AngelCare Credit',rows:[['Solde disponible',d.walletAccount?.available_balance||d.walletAccount?.balance||0],['Buckets',d.walletBuckets.length],['Écritures',d.walletLedger.length]]},
          {key:'ledger',title:'Dernières écritures',rows:pairRows(d.walletLedger.slice(0,40),(entry,i)=>[`Écriture ${i+1}`,`${text(entry.direction||entry.entry_type||entry.kind)} · ${text(entry.amount||entry.delta_amount||entry.balance_delta)} · ${text(entry.reason||entry.description||entry.created_at)}`])},
        ]
      }else{
        sections=[
          {key:'identity',title:'Identité',rows:[['Référence',reference],['Nom',d.customer.display_name],['Email',d.customer.email],['Téléphone',d.customer.phone],['Statut',d.customer.status],['Locale',d.customer.preferred_locale]]},
          {key:'family',title:'Famille',rows:[['Référence famille',d.family?.public_reference],['Gardiens',d.guardians.length],['Enfants',d.children.length],['Adresses',d.addresses.length]]},
          {key:'commerce',title:'Commerce',rows:[['Commandes',d.intelligence.orderCount],['Commandes actives',d.intelligence.activeOrderCount],['Bookings',d.intelligence.bookingCount],['Abonnements',d.intelligence.subscriptionCount],['Panier moyen',d.intelligence.averageOrderValue]]},
          {key:'finance',title:'Finance',rows:[['Revenu capturé',d.intelligence.capturedRevenue],['Remboursé',d.intelligence.refundedRevenue],['Valeur nette',d.intelligence.lifetimeRevenue],['Paiements',d.intelligence.paymentCount],['Factures',d.intelligence.invoiceCount],['AngelCare Credit',d.walletAccount?.available_balance||d.walletAccount?.balance||0]]},
          {key:'crm',title:'CRM & relation',rows:[['Demandes',d.inquiries.length],['Opportunités',d.crmOpportunities.length],['Devis',d.crmQuotes.length],['Support',d.supportTickets.length],['Saved',d.savedItems.length],['Récemment consulté',d.recentlyViewed.length]]},
          {key:'timeline',title:'Activité récente',rows:d.timeline.slice(0,30).map((event,i):[string,unknown]=>[`#${i+1} ${event.title}`,`${event.occurredAt} · ${event.status||event.source} · ${event.description||''}`])},
        ]
      }
    }else if(type==='order'){
      const d=await orderMegaDossier(objectId)
      reference=d.enterpriseReference
      title=text(d.order.title)||'Order Command Pack'
      subtitle=text(d.customer?.display_name)
      sections=[
        {key:'summary',title:'Commande',rows:[['Référence',reference],['Statut',d.order.status],['Type',d.order.journey_type],['Client',d.customer?.display_name],['Lignes',d.lines.length],['Créée le',d.order.created_at]]},
        {key:'lines',title:'Lignes',rows:pairRows(d.lines.slice(0,40),(line,i)=>[`Ligne ${i+1}`,`${text(line.title||line.name||line.catalog_item_name)} · ${text(line.quantity||1)} × ${text(line.unit_price||line.amount||'')}`])},
        {key:'payment',title:'Finance',rows:[['Paiements',d.payments.length],['Remboursements',d.refunds.length],['Factures',d.invoices.length],['Reçus',d.receipts.length]]},
        {key:'fulfillment',title:'Fulfillment',rows:d.phaseReferences.map((p):[string,unknown]=>[p.label,`${p.reference} · ${p.status}`])},
        {key:'timeline',title:'Timeline',rows:d.timeline.slice(0,30).map((event,i):[string,unknown]=>[`#${i+1} ${event.title}`,`${event.occurredAt} · ${event.status||event.source}`])},
      ]
    }else{
      const g=await genericDocumentSnapshot(type,objectId)
      reference=g.reference;title=g.title;subtitle=g.subtitle;sections=g.sections.map((section)=>({key:'summary',...section}))
    }

    const bytes=await buildEnterprisePdf({template,reference,title,subtitle,sections})
    const db=await createServiceClient()
    await db.from('angelcare_marketplace_document_exports').insert({template_key:template.template_key,object_type:type,object_id:objectId,object_reference:reference,file_name:`${reference||'ANGELCARE'}.pdf`,snapshot:{title,subtitle,sections},generated_by:context.actor.id}).then(()=>null,()=>null)
    return new Response(Buffer.from(bytes),{status:200,headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="${reference||'ANGELCARE'}.pdf"`,'x-request-id':id}})
  }catch(e){return apiFailure(e,id)}
}


export async function handleBulkOperations(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext();return apiSuccess(await listBulkOperationJobs(),{requestId:id})}catch(e){return apiFailure(e,id)}}
