import Link from 'next/link';
import type { Locale } from '../contracts';
import { integer,object } from '../validation';
import { teamIntent } from '../team-draft';
import { studioRows,studioSelection,studioSelectionLabels,workspaceDrafts,teamPage,teamReceipt,type DataRow } from '../server/repository';
import { studioSelectionParams,validSelectionIds } from '../studio-selection';
import { hiringCapability } from '../server/hiring-context';
import { TeamInvite,TeamMember,TeamInvitation } from '../client/TeamForms';
import { StudioPagination } from '../components/StudioPagination';
import { Empty,str } from '../components/Public';
import { w } from '../workforce-copy';
import { t,errorText } from '../i18n';
import { href } from '../routes';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
export async function HiringTeam({locale,organizationId,userId,search}:{locale:Locale;organizationId:string;userId:string;search:Params}){
 if(!await hiringCapability(organizationId,'team.manage'))return <Empty locale={locale} problem title={errorText(locale,'FORBIDDEN')}/>;
 let page=1;try{if(Array.isArray(search.page)||search.page&&!/^\d{1,5}$/.test(search.page))throw Error();page=integer(Number(search.page||1),'page',1,10000);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}
 const siteParams=studioSelectionParams('sites',organizationId,'team'),vacancyParams=studioSelectionParams('vacancies',organizationId);
 const invitations=search.tab==='invitations',result=await teamPage(organizationId,page,invitations),[sites,vacancies,own]=await Promise.all([studioSelection(siteParams),studioSelection(vacancyParams),studioRows('memberships',{organization_id:organizationId,user_id:userId})]),key='invite:'+organizationId,keys=[key,...result.items.map(row=>(invitations?'invitation:':'member:')+str(row,'id'))],drafts=await workspaceDrafts('team',keys);
 const recovered=await Promise.all(drafts.map(async draft=>{const intent=draft.body?teamIntent(object(draft.body).intent):null;return {key:str(draft,'draft_key'),receipt:intent?await teamReceipt(intent.action,intent.key):null};})),draftFor=(key:string)=>drafts.find(draft=>draft.draft_key===key)||null,receiptFor=(key:string)=>recovered.find(row=>row.key===key)?.receipt||null,params=new URLSearchParams({organization:organizationId}),isOwner=own.some(row=>row.role==='owner'&&row.active===true);
 function selectedIds(key:string,row:DataRow|null,field:'siteIds'|'vacancyIds'){const draft=draftFor(key),initial=!receiptFor(key)&&draft?.body?object(object(draft.body).fields||{}):{};return validSelectionIds(initial[field]||row?.[field==='siteIds'?'site_ids':'vacancy_ids']);}
 const selectedSites=[...selectedIds(key,null,'siteIds'),...(!invitations?result.items.flatMap(row=>selectedIds('member:'+str(row,'id'),row,'siteIds')):[])],selectedVacancies=[...selectedIds(key,null,'vacancyIds'),...(!invitations?result.items.flatMap(row=>selectedIds('member:'+str(row,'id'),row,'vacancyIds')):[])];
 const [siteLabels,vacancyLabels]=await Promise.all([studioSelectionLabels(siteParams,selectedSites),studioSelectionLabels(vacancyParams,selectedVacancies)]);
 const siteChoices=(key:string,row:DataRow|null)=>({...sites,selected:siteLabels.filter(record=>selectedIds(key,row,'siteIds').includes(record.id))}),vacancyChoices=(key:string,row:DataRow|null)=>({...vacancies,selected:vacancyLabels.filter(record=>selectedIds(key,row,'vacancyIds').includes(record.id))});
 return <div className={s.stack}><section className={s.panel}><h2>{w(locale,'role')}</h2><p>{w(locale,'teamHelp')}</p><nav className={s.inlineActions}><Link className={`${s.button} ${invitations?s.secondary:''}`} aria-current={!invitations?'page':undefined} href={href(locale,'hiring/team',params)}>{w(locale,'activeMember')}</Link><Link className={`${s.button} ${!invitations?s.secondary:''}`} aria-current={invitations?'page':undefined} href={href(locale,'hiring/team',new URLSearchParams({organization:organizationId,tab:'invitations'}))}>{w(locale,'invitations')}</Link></nav></section><TeamInvite key={organizationId} locale={locale} organizationId={organizationId} sites={siteChoices(key,null)} vacancies={vacancyChoices(key,null)} draft={draftFor(key)} receipt={receiptFor(key)}/>{result.items.map(row=>invitations?<TeamInvitation key={str(row,'id')+':'+row.version} locale={locale} row={row} draft={draftFor('invitation:'+str(row,'id'))} receipt={receiptFor('invitation:'+str(row,'id'))}/>:<TeamMember key={str(row,'id')+':'+row.version} locale={locale} organizationId={organizationId} row={row} sites={siteChoices('member:'+str(row,'id'),row)} vacancies={vacancyChoices('member:'+str(row,'id'),row)} canTransfer={isOwner&&row.user_id!==userId&&row.active===true&&Array.isArray(row.site_ids)&&!row.site_ids.length&&Array.isArray(row.vacancy_ids)&&!row.vacancy_ids.length} draft={draftFor('member:'+str(row,'id'))} receipt={receiptFor('member:'+str(row,'id'))}/>)}{!result.items.length?<Empty locale={locale} title={w(locale,invitations?'invitations':'activeMember')} description={w(locale,'teamHelp')}/>:null}<StudioPagination locale={locale} path="hiring/team" search={{...search,organization:organizationId}} result={result}/></div>;
}
