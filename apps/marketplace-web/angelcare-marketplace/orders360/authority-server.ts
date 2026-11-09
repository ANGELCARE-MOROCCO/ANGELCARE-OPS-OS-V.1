import { createServiceClient } from '@/lib/supabase/server'
import { hasMarketplacePermission, hasMarketplaceWorkspaceAccess } from '../auth/context'
import type { MarketplaceRequestContext, MarketplacePermission } from '../domain/types'
import { readAllPages, readIdBatches } from '../operational-intake/pagination'
import { MarketplaceError } from '../server/errors'
import { ALL_OPERATING_WORKSPACES } from '../admin-operating/workspace-registry'
import { object, text, type Row } from './model'
import type { AuthorityArea, AuthorityData } from './authority-model'

const permissions:MarketplacePermission[]=['marketplace.operations.view','marketplace.finance.view','marketplace.finance.manage','marketplace.finance.exceptions.approve','marketplace.finance.reconciliation.manage','marketplace.operations.incidents.manage','marketplace.operations.returns.manage','marketplace.operations.disputes.manage','marketplace.operations.recovery.manage','marketplace.operations.reconciliation.approve','marketplace.operations.evidence.manage','marketplace.operating_kernel.view','marketplace.operating_kernel.manage','marketplace.operating_kernel.approve','marketplace.operations.closure.approve','marketplace.operations.missions.manage','marketplace.admin.access','marketplace.audit.view']
export function scopeQuery<T extends {eq:(column:string,value:string)=>T}>(query:T,context:MarketplaceRequestContext):T{let q=query;if(context.tenantId)q=q.eq('tenant_id',context.tenantId);if(context.territoryId)q=q.eq('territory_id',context.territoryId);return q}
export async function scopedOrder(orderId:string,context:MarketplaceRequestContext){const db=await createServiceClient();const result=await scopeQuery(db.from('angelcare_marketplace_journeys').select('*').eq('id',orderId),context).maybeSingle();if(result.error)throw new MarketplaceError('INTERNAL_ERROR','Lecture de la commande interrompue.');if(!result.data)throw new MarketplaceError('NOT_FOUND','Commande absente de votre périmètre.');return result.data as Row}
export function requireRight(context:MarketplaceRequestContext,permission:MarketplacePermission){if(!hasMarketplacePermission(context,permission))throw new MarketplaceError('FORBIDDEN','Autorisation requise : '+permission)}
export async function authoritySnapshot(area:AuthorityArea,context:MarketplaceRequestContext):Promise<AuthorityData>{
 requireRight(context,area==='finance'?'marketplace.finance.view':'marketplace.operations.view')
 if(area==='controle')requireRight(context,'marketplace.operating_kernel.view')
 const db=await createServiceClient()
 const orders=await readAllPages<Row>(()=>scopeQuery(db.from('angelcare_marketplace_journeys').select('id,public_reference,title,customer_account_id,tenant_id,territory_id,financial_status').order('id'),context))
 const ids=orders.map(o=>text(o.id));const collections:Record<string,Row[]>={},errors:Record<string,string>={}
 const load=async(key:string,work:()=>Promise<Row[]>)=>{try{collections[key]=await work()}catch{errors[key]='Source indisponible ou lecture interrompue. Réessayez ; aucun total complet n’est déduit de cette source.'}}
 const direct=(table:string,column:string,parentIds=ids,extra?:{column:string;value:string})=>readIdBatches<Row>(parentIds,batch=>{let q=db.from(table).select('*').in(column,batch).order('id');if(extra)q=q.eq(extra.column,extra.value);return q})
 const attach=(records:Row[],column:string,parents?:Row[],parentColumn='_orderId')=>records.map(r=>({...r,_orderId:parents?parents.find(p=>p.id===r[column])?.[parentColumn]:r[column]}))
 const linked=async(key:string,table:string,column:string,parents?:Row[])=>{if(parents===undefined&&column!=='journey_id'&&column!=='canonical_object_id'&&column!=='object_id'&&column!=='source_object_id'&&column!=='entity_id'){errors[key]='La source parente est indisponible ; rechargez avant toute décision.';return}await load(key,async()=>attach(await direct(table,column,parents?parents.map(p=>text(p.id)):ids),column,parents))}
 await Promise.all([
  linked('fulfillment','angelcare_marketplace_fulfillment_cases','journey_id'),
  load('missions',async()=>attach(await direct('angelcare_marketplace_operations_missions','source_id'), 'source_id')),
 ])
 if(area==='finance'){
  await Promise.all([linked('payments','angelcare_marketplace_payment_intents','canonical_object_id'),linked('invoices','angelcare_marketplace_finance_invoices','journey_id'),linked('invoiceReadiness','angelcare_marketplace_finance_invoice_readiness','source_object_id')])
  await Promise.all([linked('refunds','angelcare_marketplace_payment_refunds','payment_intent_id',collections.payments),linked('attempts','angelcare_marketplace_payment_attempts','payment_intent_id',collections.payments),linked('receipts','angelcare_marketplace_finance_receipts','payment_intent_id',collections.payments),linked('invoiceLines','angelcare_marketplace_finance_invoice_lines','invoice_id',collections.invoices),linked('reconciliations','angelcare_marketplace_reconciliation_cases','fulfillment_case_id',collections.fulfillment),linked('settlements','angelcare_marketplace_settlement_readiness','fulfillment_case_id',collections.fulfillment)])
  await linked('reconciliationLines','angelcare_marketplace_reconciliation_lines','reconciliation_case_id',collections.reconciliations)
 }
 if(area==='sav')await Promise.all([linked('incidents','angelcare_marketplace_operations_incidents','mission_id',collections.missions),linked('returns','angelcare_marketplace_return_cases','fulfillment_case_id',collections.fulfillment),linked('replacements','angelcare_marketplace_replacement_cases','fulfillment_case_id',collections.fulfillment),linked('disputes','angelcare_marketplace_disputes','fulfillment_case_id',collections.fulfillment),linked('recoveries','angelcare_marketplace_recovery_plans','fulfillment_case_id',collections.fulfillment),linked('exceptions','angelcare_marketplace_operational_exceptions','fulfillment_case_id',collections.fulfillment)])
 if(area==='documents'){
  await Promise.all([linked('documents','angelcare_marketplace_journey_documents','journey_id'),linked('notifications','angelcare_marketplace_journey_notifications','journey_id'),load('exports',async()=>attach(await direct('angelcare_marketplace_document_exports','object_id',ids,{column:'object_type',value:'order'}),'object_id'))])
  if(hasMarketplacePermission(context,'marketplace.admin.access'))await load('templates',()=>readAllPages<Row>(()=>db.from('angelcare_marketplace_document_templates').select('*').order('id')))
 }
 if(area==='controle'){
  if(hasMarketplacePermission(context,'marketplace.operating_kernel.manage')){await load('assignees',()=>readAllPages<Row>(()=>scopeQuery(db.from('app_users').select('id,email').order('id'),context)));if(!collections.assignees)collections.assignees=[{id:context.actor.id,email:context.actor.email||context.actor.displayName}]}
  await Promise.all([linked('events','angelcare_marketplace_journey_events','journey_id'),linked('actions','angelcare_marketplace_journey_actions','journey_id'),load('comments',async()=>attach(await direct('angelcare_marketplace_admin_comments','object_id',ids,{column:'object_type',value:'marketplace_journey'}),'object_id')),load('relations',async()=>attach(await direct('angelcare_marketplace_object_relations','source_object_id',ids),'source_object_id')),load('cases',async()=>attach((await direct('angelcare_marketplace_operating_cases','entity_id')).filter(r=>hasMarketplaceWorkspaceAccess(context,text(r.workspace_key))),'entity_id'))])
  if(hasMarketplacePermission(context,'marketplace.finance.view'))await Promise.all([linked('relatedPayments','angelcare_marketplace_payment_intents','canonical_object_id'),linked('relatedInvoices','angelcare_marketplace_finance_invoices','journey_id')])
  if(hasMarketplacePermission(context,'marketplace.audit.view')||hasMarketplacePermission(context,'marketplace.admin.access'))await linked('audit','angelcare_marketplace_audit_events','object_id')
  await Promise.all([['approvals','angelcare_marketplace_operating_approvals'],['evidence','angelcare_marketplace_operating_evidence'],['caseEvents','angelcare_marketplace_operating_timeline'],['caseComments','angelcare_marketplace_operating_comments'],['caseExceptions','angelcare_marketplace_operating_exceptions'],['caseRecoveries','angelcare_marketplace_operating_recovery_actions'],['assignments','angelcare_marketplace_operating_assignments']].map(([key,table])=>linked(key,table,'case_id',collections.cases)))
 }
 // Link choices are canonical authorized records; no customer or identity UUID entry is required.
 collections.orders=orders.map(o=>({id:o.id,public_reference:o.public_reference,title:o.title,_orderId:o.id,customer_account_id:o.customer_account_id,currency_label:object(o.financial_status).currency_label||object(o.financial_status).currency||'MAD'}))
 return {generatedAt:new Date().toISOString(),collections,errors,rights:Object.fromEntries(permissions.map(p=>[p,hasMarketplacePermission(context,p)])),actorId:context.actor.id,workspaces:ALL_OPERATING_WORKSPACES.filter(w=>w.key==='orders.command'&&hasMarketplaceWorkspaceAccess(context,w.key)).map(w=>({key:w.key,label:w.mission,lifecycle:w.lifecycle}))}
}
