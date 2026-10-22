import 'server-only';
import { cache } from 'react';
import { createUserClient } from '@/lib/supabase/server';
import type { RecruitmentAction } from '../recruitment-draft';
import { JobkixFault,LOCALES, type Locale } from '../contracts';
import { filtersParams,readFilters,type SearchFilters } from '../discovery';
import { object, uuid,integer,text } from '../validation';
import { dependencyError } from './http';
import { requireJobkixSession,getJobkixSession } from './identity';
import { WORKSPACE_ACTIONS } from './command-input';
import { resolveEditorialImages } from './editorial-media';
import { DOCUMENT_SELECTION_PAGE_SIZE,documentSelectionQuery,selectableDocumentRow,caseDocumentQuery,selectableEvidenceRow,type DocumentSelectionResult } from '../document-selection';
import { studioSelectionRequest,studioSelectionResult,studioRecord,type StudioSelectionRequest,type StudioSelectionRecord,type StudioSelectionResult } from '../studio-selection';
import { panelSelectionRequest } from '../panel-selection';
import { poolMembershipQuery } from '../pool-membership';

export type DataRow=Record<string,unknown>;
export async function panelSelection(params:URLSearchParams):Promise<StudioSelectionResult>{
 await requireJobkixSession();const request=panelSelectionRequest(params);
 return studioSelectionResult(await rpc('jobkix_panel_options',{p_application:request.application,p_page:request.page,p_query:request.q,p_selected:request.selected}));
}
export async function poolMembership(params:URLSearchParams):Promise<{present:boolean}>{
 await requireJobkixSession();const request=poolMembershipQuery(params);
 if(await rpc('jobkix_can_act',{p_org:request.organization,p_capability:'talent.search',p_site:null,p_vacancy:null})!==true)throw new JobkixFault('FORBIDDEN');
 const db=await createUserClient(),pool=await db.from('jobkix_talent_pools').select('id').eq('id',request.pool).eq('organization_id',request.organization).maybeSingle();
 if(pool.error)throw dependencyError(pool.error);if(!pool.data)throw new JobkixFault('FORBIDDEN');
 if(await rpc('jobkix_candidate_discoverable',{p_candidate:request.candidate,p_org:request.organization})!==true)throw new JobkixFault('FORBIDDEN');
 const binding=await db.from('jobkix_talent_pool_members').select('pool_id').eq('pool_id',request.pool).eq('candidate_user_id',request.candidate).maybeSingle();
 if(binding.error)throw dependencyError(binding.error);return {present:Boolean(binding.data)};
}
const LOOKUPS={organizations:{table:'jobkix_organizations',label:'public_name'},sites:{table:'jobkix_sites',label:'label'},vacancies:{table:'jobkix_vacancies',label:'title'},pools:{table:'jobkix_talent_pools',label:'name'}} as const;
async function authorizeLookup(request:StudioSelectionRequest){
 await requireJobkixSession();
 const capability=request.kind==='pools'?'talent.search':request.kind==='vacancies'||request.kind==='sites'&&request.purpose==='team'?'team.manage':null;
 if(capability&&await rpc('jobkix_can_act',{p_org:request.organization,p_capability:capability,p_site:null,p_vacancy:null})!==true)throw new JobkixFault('FORBIDDEN');
}
function lookupQuery(db:Awaited<ReturnType<typeof createUserClient>>,request:StudioSelectionRequest,count=false){
 const config=LOOKUPS[request.kind];let query=db.from(config.table).select('id,'+config.label+(request.kind==='sites'?',active':''),count?{count:'exact'}:{});
 if(request.organization)query=query.eq('organization_id',request.organization);return query;
}
function lookupRecord(row:DataRow,request:StudioSelectionRequest):StudioSelectionRecord{return studioRecord({id:row.id,label:row[LOOKUPS[request.kind].label],available:request.kind!=='sites'||row.active===true});}
export async function studioSelection(params:URLSearchParams):Promise<StudioSelectionResult>{
 const request=studioSelectionRequest(params);await authorizeLookup(request);const db=await createUserClient();let query=lookupQuery(db,request,true).order(LOOKUPS[request.kind].label,{ascending:true}).order('id',{ascending:true});
 if(request.kind==='sites')query=query.eq('active',true);if(request.q)query=query.ilike(LOOKUPS[request.kind].label,'%'+request.q.replace(/[\\%_]/g,value=>'\\'+value)+'%');
 const [result,selected]=await Promise.all([query.range((request.page-1)*24,request.page*24-1),request.selected.length?lookupQuery(db,request).in('id',request.selected):Promise.resolve({data:[],error:null})]);
 if(result.error)throw dependencyError(result.error);if(selected.error)throw dependencyError(selected.error);if(!Array.isArray(result.data)||typeof result.count!=='number'||!Array.isArray(selected.data))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {items:result.data.map(row=>lookupRecord(object(row),request)),selected:selected.data.map(row=>lookupRecord(object(row),request)),total:result.count,page:request.page,pageSize:24};
}
/** Resolve only retained labels, in bounded RLS queries; never load a collection wholesale. */
export async function studioSelectionLabels(params:URLSearchParams,ids:string[]):Promise<StudioSelectionRecord[]>{
 const request=studioSelectionRequest(params);await authorizeLookup(request);if(ids.length>2500)throw new JobkixFault('INVALID_INPUT');const unique=Array.from(new Set(ids.map(id=>uuid(id)))),db=await createUserClient(),rows:StudioSelectionRecord[]=[];
 for(let offset=0;offset<unique.length;offset+=400){const groups=[];for(let start=offset;start<Math.min(offset+400,unique.length);start+=100)groups.push(unique.slice(start,start+100));const results=await Promise.all(groups.map(group=>lookupQuery(db,request).in('id',group)));for(const result of results){if(result.error)throw dependencyError(result.error);if(!Array.isArray(result.data))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');rows.push(...result.data.map(row=>lookupRecord(object(row),request)));}}
 return rows;
}
export async function applicationDocuments(params:URLSearchParams):Promise<DocumentSelectionResult>{
 const session=await requireJobkixSession(),{page,q,selected}=documentSelectionQuery(params),db=await createUserClient();
 const columns='id,filename,purpose,state,revision,library_archived_at';
 let query=db.from('jobkix_files').select(columns,{count:'exact'}).eq('owner_user_id',session.userId).eq('purpose','cv').eq('state','ready').is('library_archived_at',null).order('filename',{ascending:true}).order('id',{ascending:true});
 if(q)query=query.ilike('filename','%'+q.replace(/[\\%_]/g,value=>'\\'+value)+'%');
 const [result,selection]=await Promise.all([query.range((page-1)*DOCUMENT_SELECTION_PAGE_SIZE,page*DOCUMENT_SELECTION_PAGE_SIZE-1),selected?db.from('jobkix_files').select(columns).eq('id',selected).eq('owner_user_id',session.userId).eq('purpose','cv').eq('state','ready').maybeSingle():Promise.resolve({data:null,error:null})]);
 if(result.error)throw dependencyError(result.error);if(selection.error)throw dependencyError(selection.error);
 if(!Array.isArray(result.data)||typeof result.count!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {items:result.data.map(selectableDocumentRow),selected:selection.data?selectableDocumentRow(selection.data):null,total:result.count,page,pageSize:DOCUMENT_SELECTION_PAGE_SIZE};
}
export async function caseDocuments(params:URLSearchParams):Promise<DocumentSelectionResult>{
 const session=await requireJobkixSession(),request=caseDocumentQuery(params),db=await createUserClient();
 if(request.context==='verification'&&await rpc('jobkix_can_act',{p_org:request.organization,p_capability:'organization.manage',p_site:null,p_vacancy:null})!==true)throw new JobkixFault('FORBIDDEN');
 function owned(count=false){let query=db.from('jobkix_files').select('id,filename,purpose,state,revision,library_archived_at',count?{count:'exact'}:{}).eq('owner_user_id',session.userId).eq('state','ready');if(request.context==='verification')query=query.eq('purpose','verification').eq('organization_id',request.organization);return query;}
 let query=owned(true).is('library_archived_at',null).order('filename',{ascending:true}).order('id',{ascending:true});if(request.q)query=query.ilike('filename','%'+request.q.replace(/[\\%_]/g,value=>'\\'+value)+'%');
 const [result,selection]=await Promise.all([query.range((request.page-1)*24,request.page*24-1),request.selected?owned().eq('id',request.selected).maybeSingle():Promise.resolve({data:null,error:null})]);
 if(result.error)throw dependencyError(result.error);if(selection.error)throw dependencyError(selection.error);if(!Array.isArray(result.data)||typeof result.count!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {items:result.data.map(selectableEvidenceRow),selected:selection.data?selectableEvidenceRow(selection.data):null,total:result.count,page:request.page,pageSize:24};
}
export async function rpc(name:string,args:Record<string,unknown>):Promise<unknown> {
 // Names are internal constants at call sites. Never accept an RPC name from HTTP input.
 try {const db=await createUserClient(),result=await db.rpc(name,args);if(result.error)throw result.error;return result.data;}
 catch(error){throw dependencyError(error);}
}
export interface SearchResult {items:DataRow[];total:number;page:number;pageSize:number}
const readPublicSearch=cache(async(query:string):Promise<SearchResult>=>{
 const filters=readFilters(new URLSearchParams(query));
 const result=object(await rpc('jobkix_search',{p_filters:filters}));
 if(!Array.isArray(result.items)||typeof result.total!=='number'||typeof result.page!=='number'||typeof result.pageSize!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {items:result.items.map(object),total:result.total,page:result.page,pageSize:result.pageSize};
});
export async function searchVacancies(filters:SearchFilters):Promise<SearchResult>{return readPublicSearch(filtersParams(filters).toString());}
export const publicVacancy=cache(async(id:string):Promise<DataRow|null>=>{const value=await rpc('jobkix_public_vacancy',{p_vacancy:uuid(id),p_allow_closed:true});return value===null?null:object(value);});
export async function publicEmployers(country:string|null=null,q='',page=1):Promise<DataRow[]>{
 const result=object(await rpc('jobkix_public_employers',{p_country:country,p_query:q,p_page:page}));
 if(!Array.isArray(result.items))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return result.items.map(object);
}
export async function publicGeography(country:string|null=null,city:string|null=null,q='',page=1,origin:string|null=null,abroad=false):Promise<{countries:DataRow[];cities:SearchResult}>{const value=object(await rpc('jobkix_public_geography',{p_country:country,p_city:city,p_query:q,p_page:page,p_origin:origin,p_abroad:abroad}));if(!Array.isArray(value.countries)||!Array.isArray(value.cities))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return {countries:value.countries.map(object),cities:pagedResult({items:value.cities,total:value.cityTotal,page:value.cityPage,pageSize:value.cityPageSize})};}
export async function employerSearch(filters:Record<string,string>,page=1):Promise<SearchResult>{return pagedResult(await rpc('jobkix_employers_page',{p_filters:filters,p_page:page}));}
export async function reputationMethodologies():Promise<Partial<Record<Locale,string>>>{const value=object(await rpc('jobkix_reputation_methodologies',{})),result:Partial<Record<Locale,string>>={};for(const locale of LOCALES)if(typeof value[locale]==='string'&&/^[a-f0-9]{64}$/.test(value[locale]))result[locale]=value[locale];return result;}
export async function publicReputation(kind:'review'|'salary',locale:Locale,filters:Record<string,string>,page=1):Promise<SearchResult&{statistics:DataRow|null;methodology:DataRow|null}>{const value=object(await rpc('jobkix_public_reputation',{p_kind:kind,p_locale:locale,p_filters:filters,p_page:page}));return {...pagedResult(value),statistics:value.statistics?object(value.statistics):null,methodology:value.methodology?object(value.methodology):null};}
export async function myReputation(page=1,id:string|null=null):Promise<SearchResult>{return pagedResult(await rpc('jobkix_my_reputation',{p_page:page,p_id:id?uuid(id):null}));}
export async function reputationReceipt(action:import('../reputation-draft').ReputationAction,key:string):Promise<DataRow|null>{const value=await rpc('jobkix_reputation_receipt',{p_action:action,p_key:key});return value===null?null:object(value);}
export async function employerSavedSearch(id:string):Promise<DataRow|null>{const value=await rpc('jobkix_employer_saved_search',{p_org:uuid(id)});return value===null?null:object(value);}
export async function publicEmployer(id:string):Promise<DataRow|null>{const value=await rpc('jobkix_public_employer',{p_id:uuid(id)});return value===null?null:object(value);}
export async function publicEmployerPage(country:string|null=null,q='',page=1):Promise<SearchResult>{return pagedResult(await rpc('jobkix_public_employers',{p_country:country,p_query:q,p_page:page}));}
export async function blockedOrganizations():Promise<DataRow[]>{const value=await rpc('jobkix_blocked_organizations',{});if(!Array.isArray(value))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return value.map(object);}
export type CaseAction='case.create'|'case.reply'|'case.appeal'|'privacy.request'|'verification.submit';
export async function caseReceipt(action:CaseAction,key:string):Promise<DataRow|null>{const value=await rpc('jobkix_case_receipt',{p_action:action,p_key:key});return value===null?null:object(value);}
export const publicEdition=cache(async(slug:string,locale:Locale):Promise<DataRow|null>=>{
 const value=await rpc('jobkix_public_editorial',{p_slug:slug,p_locale:locale});return value===null?null:resolveEditorialImages(object(value));
});
export async function accountTerms(locale:Locale):Promise<DataRow|null>{const value=await rpc('jobkix_account_terms',{p_locale:locale});return value===null?null:object(value);}
export async function invitationPreview(id:string,token:string):Promise<DataRow>{return object(await rpc('jobkix_invitation_preview',{p_id:uuid(id),p_token:text(token,'token',64,64)}));}
export async function notificationsPage(page=1):Promise<SearchResult>{return pagedResult(await rpc('jobkix_notifications_page',{p_page:page}));}
export async function talentPage(organizationId:string,filters:Record<string,string>,page=1,poolId:string|null=null):Promise<SearchResult>{return pagedResult(await rpc('jobkix_talent_page',{p_org:uuid(organizationId),p_filters:filters,p_page:page,p_pool:poolId?uuid(poolId):null}));}
export async function teamPage(organizationId:string,page=1,invitations=false):Promise<SearchResult>{return pagedResult(await rpc('jobkix_team_page',{p_org:uuid(organizationId),p_page:page,p_invitations:invitations}));}
export async function teamReceipt(action:import('../team-draft').TeamDraftAction,key:string):Promise<DataRow|null>{const value=await rpc('jobkix_team_receipt',{p_action:action,p_key:key});return value===null?null:object(value);}
export async function talentReceipt(action:import('../talent-draft').TalentDraftAction,key:string):Promise<DataRow|null>{const value=await rpc('jobkix_talent_receipt',{p_action:action,p_key:key});return value===null?null:object(value);}
export async function workspaceDrafts(kind:'team'|'talent',keys:string[]):Promise<DataRow[]>{const session=await requireJobkixSession();if(keys.length>50)throw new JobkixFault('INVALID_INPUT');if(!keys.length)return [];const db=await createUserClient(),result=await db.from('jobkix_drafts').select('*').eq('user_id',session.userId).eq('kind',kind).in('draft_key',keys);if(result.error)throw dependencyError(result.error);if(!Array.isArray(result.data))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return result.data.map(object);}
export async function hiringAnalytics(organizationId:string,from:string,until:string):Promise<DataRow>{return object(await rpc('jobkix_hiring_analytics',{p_org:uuid(organizationId),p_from:from,p_until:until}));}
export type HiringReceiptAction='organization.create'|'vacancy.create'|'vacancy.save'|'site.create'|'site.save'|'vacancy.submit_review'|'vacancy.publish'|'vacancy.pause'|'vacancy.close'|'vacancy.archive'|'vacancy.reopen'|'vacancy.duplicate';
export async function hiringReceipt(action:HiringReceiptAction,key:string):Promise<DataRow|null>{await requireJobkixSession();const value=await rpc('jobkix_hiring_receipt',{p_action:action,p_key:key});return value===null?null:object(value);}
export async function recruitmentReceipt(action:RecruitmentAction,key:string):Promise<DataRow|null>{await requireJobkixSession();const value=await rpc('jobkix_recruitment_receipt',{p_action:action,p_key:key});return value===null?null:object(value);}
export async function applicationCapabilities(id:string):Promise<{decide:boolean;message:boolean;interview:boolean;offer:boolean;evaluate:boolean}>{const value=object(await rpc('jobkix_application_capabilities',{p_application:uuid(id)}));if(['decide','message','interview','offer','evaluate'].some(key=>typeof value[key]!=='boolean'))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return {decide:value.decide===true,message:value.message===true,interview:value.interview===true,offer:value.offer===true,evaluate:value.evaluate===true};}
export async function applicationsByIds(ids:string[]):Promise<DataRow[]>{await requireJobkixSession();if(ids.length>48)throw new JobkixFault('INVALID_INPUT');if(!ids.length)return [];const db=await createUserClient(),result=await db.from('jobkix_applications').select('*').in('id',ids.map(id=>uuid(id)));if(result.error)throw dependencyError(result.error);if(!Array.isArray(result.data))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return result.data.map(object);}
export type PublicTaxonomyKind='setting'|'occupation'|'skill'|'age_cohort'|'collection';
export interface TaxonomyResult extends SearchResult {letters:string[]}
function pagedResult(value:unknown):SearchResult{const result=object(value);if(!Array.isArray(result.items)||typeof result.total!=='number'||typeof result.page!=='number'||typeof result.pageSize!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return {items:result.items.map(object),total:result.total,page:result.page,pageSize:result.pageSize};}
export const publicTaxonomy=cache(async(kind:PublicTaxonomyKind,locale:Locale,q='',letter='',page=1):Promise<TaxonomyResult>=>{const value=object(await rpc('jobkix_public_taxonomy',{p_kind:kind,p_locale:locale,p_query:q,p_letter:letter,p_page:page}));return {...pagedResult(value),letters:Array.isArray(value.letters)?value.letters.filter((item):item is string=>typeof item==='string'):[]};});
export const publicTaxon=cache(async(kind:PublicTaxonomyKind,key:string,locale:Locale):Promise<DataRow|null>=>{const value=await rpc('jobkix_public_taxon',{p_kind:kind,p_key:key,p_locale:locale});return value===null?null:object(value);});
export const relatedTaxonomy=cache(async(kind:'setting'|'occupation',key:string,locale:Locale):Promise<DataRow[]>=>{const value=await rpc('jobkix_related_taxonomy',{p_kind:kind,p_key:key,p_locale:locale});if(!Array.isArray(value))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return value.map(object);});
export type EditorialKind='front'|'guide'|'help'|'legal'|'sector'|'profession'|'country'|'city'|'trust';
export const publicEditorialList=cache(async(kind:EditorialKind,locale:Locale,prefix='',q='',page=1):Promise<SearchResult>=>{const result=pagedResult(await rpc('jobkix_public_editorial_list',{p_kind:kind,p_locale:locale,p_prefix:prefix,p_query:q,p_page:page}));const resolved=await resolveEditorialImages({sections:result.items.map(item=>({id:item.id,media:item.openingMedia}))});const sections=Array.isArray(resolved.sections)?resolved.sections.map(object):[];return {...result,items:result.items.map((item,index)=>({...item,_image:sections[index]?._image||null}))};});
export async function savedCollection(locale:Locale,kind:'all'|'job'|'resource',collection:string,q:string,page:number):Promise<SearchResult&{collections:string[]}>{const value=object(await rpc('jobkix_saved_collection',{p_locale:locale,p_kind:kind,p_collection:collection,p_query:q,p_page:page}));return {...pagedResult(value),collections:Array.isArray(value.collections)?value.collections.filter((value):value is string=>typeof value==='string'):[]};}
const TABLES={
 profile:'jobkix_candidates',files:'jobkix_files',memberships:'jobkix_memberships',organizations:'jobkix_organizations',organizationPrivate:'jobkix_organization_private',sites:'jobkix_sites',
 vacancies:'jobkix_vacancies',questions:'jobkix_screening_questions',vacancyRevisions:'jobkix_vacancy_revisions',applications:'jobkix_applications',history:'jobkix_application_events',threads:'jobkix_threads',messages:'jobkix_messages',
 interviews:'jobkix_interviews',panels:'jobkix_interview_panels',interviewRevisions:'jobkix_interview_revisions',offerRevisions:'jobkix_offer_revisions',offers:'jobkix_offers',saved:'jobkix_saved_jobs',savedResources:'jobkix_saved_resources',alerts:'jobkix_saved_searches',drafts:'jobkix_drafts',
 pools:'jobkix_talent_pools',poolMembers:'jobkix_talent_pool_members',cases:'jobkix_cases',caseEvents:'jobkix_case_events',notifications:'jobkix_outbox',evaluations:'jobkix_evaluations',
} as const;
export type Collection=keyof typeof TABLES;
/** The user-scoped client and database RLS remain the read authority, including every organization context. */
export async function studioRows(collection:Collection,filters:Record<string,string>={}):Promise<DataRow[]> {
 await requireJobkixSession();const db=await createUserClient();let query=db.from(TABLES[collection]).select('*').limit(200);
 const allowed=['id','user_id','owner_user_id','organization_id','vacancy_id','document_id','application_id','interview_id','offer_id','thread_id','candidate_user_id','evaluator_user_id','reporter_user_id','case_id','purpose','state','kind','draft_key'];
 for(const [key,value] of Object.entries(filters)){if(!allowed.includes(key))throw new JobkixFault('INVALID_INPUT');query=query.eq(key,value);}
 if(collection==='questions')query=query.order('position',{ascending:true});
 const result=await query;if(result.error)throw dependencyError(result.error);
 if(!Array.isArray(result.data))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return result.data.map(object);
}
const PAGE_ORDERS={history:'created_at',interviewRevisions:'version',offerRevisions:'version',sites:'label',applications:'submitted_at',files:'created_at',messages:'created_at',interviews:'starts_at',offers:'updated_at',vacancies:'updated_at',vacancyRevisions:'version',alerts:'created_at',cases:'updated_at',caseEvents:'created_at',notifications:'created_at'} as const;
export async function studioPage(collection:keyof typeof PAGE_ORDERS,filters:Record<string,string>,page=1,options:{q?:string;upcoming?:boolean;vacancyState?:string;archived?:boolean}={}):Promise<SearchResult>{
 await requireJobkixSession();integer(page,'page',1,10000);const db=await createUserClient(),pageSize=24;
 let query=db.from(TABLES[collection]).select('*',{count:'exact'}).order(PAGE_ORDERS[collection],{ascending:collection==='interviews'});
 if(!['vacancyRevisions','interviewRevisions','offerRevisions'].includes(collection))query=query.order('id',{ascending:false});
 const allowedFilters=['id','owner_user_id','organization_id','vacancy_id','application_id','thread_id','candidate_user_id','user_id','reporter_user_id','case_id','state','kind','purpose'];
 if(collection==='interviewRevisions')allowedFilters.push('interview_id');
 if(collection==='offerRevisions')allowedFilters.push('offer_id');
 for(const [key,value] of Object.entries(filters)){if(!allowedFilters.includes(key))throw new JobkixFault('INVALID_INPUT');query=query.eq(key,value);}
 if(options.q){if(collection!=='applications'&&collection!=='vacancies')throw new JobkixFault('INVALID_INPUT');const q=text(options.q,'q',1,300).replace(/[\\%_]/g,value=>'\\'+value);query=query.ilike(collection==='vacancies'?'title':'snapshot->vacancy->>title','%'+q+'%');}
 if(options.vacancyState){if(collection!=='vacancies'||!['draft','pending_review','published','paused','expired','filled','closed','archived','suspended'].includes(options.vacancyState))throw new JobkixFault('INVALID_INPUT');const now=new Date().toISOString();if(options.vacancyState==='expired')query=query.or('state.eq.expired,and(state.eq.published,expires_at.lte.'+now+')');else{query=query.eq('state',options.vacancyState);if(options.vacancyState==='published')query=query.gt('expires_at',now);}}
 if(options.archived!==undefined){if(collection!=='files')throw new JobkixFault('INVALID_INPUT');query=options.archived?query.not('library_archived_at','is',null):query.is('library_archived_at',null);}
 if(options.upcoming){if(collection!=='interviews')throw new JobkixFault('INVALID_INPUT');query=query.gte('starts_at',new Date().toISOString()).in('state',['proposed','scheduled']);}
 const result=await query.range((page-1)*pageSize,page*pageSize-1);if(result.error)throw dependencyError(result.error);if(!Array.isArray(result.data)||typeof result.count!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {items:result.data.map(object),total:result.count,page,pageSize};
}
export async function executeCommand(action:string,payload:Record<string,unknown>,version:number,key:string):Promise<DataRow>{
 if(['case.create','case.reply','case.appeal','privacy.request','draft.save','draft.remove'].includes(action)){
  const session=await getJobkixSession();if(session.state==='restricted'||session.state==='onboarding'){
   if(action.startsWith('draft.')&&payload.kind!=='case')throw new JobkixFault('ACCOUNT_RESTRICTED');
   return object(await rpc('jobkix_restricted_case_command',{p_action:action,p_payload:payload,p_expected_version:version,p_idempotency_key:key}));
  }
 }
 if(action!=='account.initialize')await requireJobkixSession();
 if(action==='resource.save')return object(await rpc('jobkix_save_resource',{p_document:payload.documentId,p_locale:payload.locale,p_saved:payload.saved,p_collection:payload.collection,p_expected_version:version,p_idempotency_key:key}));
 return object(await rpc(WORKSPACE_ACTIONS.has(action)?'jobkix_workspace_command':'jobkix_command',{p_action:action,p_payload:payload,p_expected_version:version,p_idempotency_key:key}));
}

export async function pipelineReceipt(key:string):Promise<DataRow|null>{await requireJobkixSession();const value=await rpc('jobkix_pipeline_receipt',{p_key:key});return value===null?null:object(value);}

export async function restrictedCases(id:string|null,page:number):Promise<SearchResult&{case:DataRow|null;draft:DataRow|null}>{const value=object(await rpc('jobkix_restricted_cases',{p_id:id?uuid(id):null,p_page:integer(page,'page',1,10000)}));return {...pagedResult(value),case:value.case?object(value.case):null,draft:value.draft?object(value.draft):null};}
