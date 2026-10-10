import {createServiceClient} from '@/lib/supabase/server'
import {hasMarketplacePermission} from '../auth/context'
import type {MarketplaceRequestContext,MarketplacePermission} from '../domain/types'
import {MarketplaceError} from '../server/errors'
import {transitionEnterpriseOrder} from '../customer-commerce/admin-repository'
import {qualifyRequest} from '../family-experience/repository'
import {updatePublicInquiry} from '../total-commerce-control/repository'
import {validAction,type IntakeRow,type IntakeSource,type IntakeSnapshot} from './contracts'
const permissions:Record<IntakeSource,MarketplacePermission>={journey:'marketplace.operations.view',b2b:'marketplace.b2b.view',inquiry:'marketplace.public.inquiries.view',family:'marketplace.family.admin.view'}
const mutations:Record<IntakeSource,MarketplacePermission>={journey:'marketplace.operations.missions.manage',b2b:'marketplace.b2b.manage',inquiry:'marketplace.public.inquiries.manage',family:'marketplace.family.admin.manage'}
export const allowedSources=(context:MarketplaceRequestContext)=>(Object.keys(permissions) as IntakeSource[]).filter(s=>hasMarketplacePermission(context,permissions[s]))
function failure(error:{code?:string;message?:string}){return new MarketplaceError(error.code==='42P01'||error.code==='PGRST202'?'CONFIGURATION_ERROR':'INTERNAL_ERROR','Impossible de lire le registre de réception. Vérifiez la migration Operational Reception R1.',{cause:error})}
function scoped(query:any,context:MarketplaceRequestContext){if(context.tenantId)query=query.eq('tenant_id',context.tenantId);if(context.territoryId)query=query.or(`territory_id.is.null,territory_id.eq.${context.territoryId}`);return query}
export async function intakeSnapshot(context:MarketplaceRequestContext,filters:Record<string,string|undefined>={}):Promise<IntakeSnapshot>{
 const sources=allowedSources(context);if(!sources.length)throw new MarketplaceError('PERMISSION_DENIED','Aucun registre autorisé.')
 const source=sources.includes(filters.source as IntakeSource)?filters.source as IntakeSource:null;
 const db=await createServiceClient();const page=Math.max(1,Math.min(100000,Math.trunc(Number(filters.page))||1)),pageSize=30;
 let query=scoped(db.from('angelcare_marketplace_operational_intake_v').select('*',{count:'exact'}).in('source_type',source?[source]:sources),context)
 if(filters.status==='open'||!filters.status)query=query.not('status','in','(completed,cancelled,closed,spam,archived,rejected,declined,converted)')
 else if(filters.status!=='all')query=query.eq('status',filters.status)
 if(filters.owner==='mine')query=query.eq('owner_id',context.actor.id);else if(filters.owner==='unassigned')query=query.is('owner_id',null)
 if(filters.q){const q=filters.q.slice(0,160).replace(/[%_(),"'\.*]/g,' ').trim();if(q)query=query.or(`title.ilike.%${q}%,reference.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`)}
 const {data,error,count}=await query.order('created_at',{ascending:false}).order('source_id').range((page-1)*pageSize,page*pageSize-1);if(error)throw failure(error)
 return {rows:(data||[]) as IntakeRow[],total:count||0,page,pageSize,generatedAt:new Date().toISOString(),sources,canManage:Object.fromEntries(sources.map(s=>[s,hasMarketplacePermission(context,mutations[s])])),canConvertB2b:hasMarketplacePermission(context,'marketplace.b2b.diagnostics.qualify')&&hasMarketplacePermission(context,'marketplace.b2b.manage'),canCreateOrder:hasMarketplacePermission(context,'marketplace.operations.missions.create')}
}
export async function intakeDossier(context:MarketplaceRequestContext,source:IntakeSource,id:string){
 if(!allowedSources(context).includes(source))throw new MarketplaceError('PERMISSION_DENIED','Registre non autorisé.')
 const db=await createServiceClient();const {data,error}=await scoped(db.from('angelcare_marketplace_operational_intake_v').select('*').eq('source_type',source).eq('source_id',id),context).maybeSingle();if(error)throw failure(error);if(!data)throw new MarketplaceError('NOT_FOUND','Dossier introuvable dans votre périmètre.')
 const events=await db.from('angelcare_marketplace_intake_events').select('id,action,reason,actor_id,created_at,evidence').eq('source_type',source).eq('source_id',id).order('created_at',{ascending:false}).limit(100);if(events.error)throw failure(events.error)
 return {row:data as IntakeRow,events:events.data||[]}
}
export async function operateIntake(input:{context:MarketplaceRequestContext;source:IntakeSource;id:string;action:string;reason:string;request:Request;requestId:string}){
 const {context,source,id,action,reason}=input;const dossier=await intakeDossier(context,source,id)
 if(!hasMarketplacePermission(context,mutations[source]))throw new MarketplaceError('PERMISSION_DENIED','Action non autorisée.')
 if(reason.trim().length<3||reason.length>2000||!validAction(source,dossier.row.status,action))throw new MarketplaceError('VALIDATION_ERROR','Action ou motif invalide pour cet état.')
 const db=await createServiceClient()
 if(source==='b2b'){
  if(['diagnostic','crm'].includes(action)&&!hasMarketplacePermission(context,'marketplace.b2b.diagnostics.qualify'))throw new MarketplaceError('PERMISSION_DENIED','Qualification B2B requise.')
  const r=await db.rpc('angelcare_marketplace_b2b_intake_action',{p_id:id,p_action:action,p_reason:reason,p_actor:context.actor.id,p_territory:context.territoryId,p_tenant:context.tenantId});if(r.error)throw new MarketplaceError('CONFLICT',r.error.message,{cause:r.error})
 }else if(source==='journey'&&['qualify','cancel'].includes(action))await transitionEnterpriseOrder({orderId:id,status:action==='qualify'?'qualified':'cancelled',reason,context,requestId:input.requestId,request:input.request})
 else if(source==='family'&&['qualify','proposal','reject'].includes(action))await qualifyRequest({id,status:action==='qualify'?'qualified':action==='proposal'?'proposal_ready':'declined',notes:reason,nextAction:action==='reject'?'Demande déclinée':'Préparer le parcours de réservation',context,requestId:input.requestId})
 else if(source==='inquiry'&&['qualify','close'].includes(action))await updatePublicInquiry({inquiryId:id,body:{status:action==='close'?'closed':'qualified',admin_notes:reason},context,requestId:input.requestId,request:input.request})
 else if(action==='claim'){
  const table=source==='journey'?'angelcare_marketplace_journeys':source==='inquiry'?'angelcare_marketplace_public_inquiries':'angelcare_marketplace_family_quote_requests';const owner=source==='family'?'owner_id':'intake_owner_id';const r=await db.from(table).update({[owner]:context.actor.id,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw failure(r.error)
 }
 if(source!=='b2b'){const log=await db.from('angelcare_marketplace_intake_events').insert({source_type:source,source_id:id,action,actor_id:context.actor.id,reason});if(log.error)throw failure(log.error)}
 return intakeDossier(context,source,id)
}
