import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Locale } from '../contracts';
import { studioSession } from '../server/studio-session';
import { pathwayNotice } from '../pathway-notice';
import { hiringContext,hiringCapability } from '../server/hiring-context';
import { studioRows,studioPage,hiringReceipt,type DataRow } from '../server/repository';
import { dependencyError } from '../server/http';
import { Notifications } from '../components/Notifications';
import { integer,uuid,object } from '../validation';
import { siteIntent } from '../site-draft';
import { StudioPagination } from '../components/StudioPagination';
import { StudioShell } from '../components/StudioShell';
import { OrganizationEditor } from '../client/OrganizationEditor';
import { HiringAccount } from './HiringAccount';
import { HiringTeam } from './HiringTeam';
import { HiringTalent } from './HiringTalent';
import { HiringOperations } from './HiringOperations';
import { HiringApplications } from './HiringApplications';
import { VacancyList,NewVacancy,VacancyManagement,VacancyRow } from './Vacancies';
import { SiteEditor } from '../client/SiteEditor';
import { StudioFormSelection } from '../client/StudioRecordPicker';
import { Empty,str,SectionHeading } from '../components/Public';
import { t,errorText,formatDate } from '../i18n';
import { h } from '../hiring-copy';
import { screenName } from '../screen-copy';
import { SCREENS,href } from '../routes';
import { w } from '../workforce-copy';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
export async function HirerPage({locale,screen,id,search}:{locale:Locale;screen:string;id?:string;search:Params}){
 const definition=SCREENS.find(row=>row.id===screen&&row.audience==='hirer');if(!definition)notFound();const path=definition.path.replace(':id',encodeURIComponent(id||'')),params=new URLSearchParams();for(const [key,value] of Object.entries(search))if(typeof value==='string')params.set(key,value);
 const session=await studioSession(locale,'hirer',href(locale,path,params));
 let context;try{context=await hiringContext(session.userId,typeof search.organization==='string'?search.organization:null);}catch(error){return <StudioShell locale={locale} mode="hirer" screenId={screen} title={screenName(screen,locale)}><Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/></StudioShell>;}
 const org=search.new==='1'&&screen==='H13'?null:context.organization,organizationId=org?str(org,'id'):null;
 const navParams=organizationId?new URLSearchParams({organization:organizationId}):undefined;
 const selector=context.organizations.total?<form method="get" action={href(locale,screen==='H04'?'hiring/vacancies':path)} className={s.organizationSelector}><StudioFormSelection key={session.userId+':'+organizationId} locale={locale} kind="organizations" label={t(locale,'organizationContext')} initial={context.organizations} value={organizationId||''} name="organization" required/><button className={`${s.button} ${s.secondary}`} type="submit">{t(locale,'continue')}</button></form>:null;
 const wrap=(children:ReactNode)=><StudioShell key={session.userId+':'+organizationId} locale={locale} mode="hirer" screenId={screen} title={screenName(screen,locale)} organizationId={organizationId||undefined} context={selector}>{search.pathway==='rejected'?<p className={s.notice} role="status">{pathwayNotice(locale)}</p>:null}{children}</StudioShell>;
 if(screen==='H13'){
  if(!org){const drafts=await studioRows('drafts',{user_id:session.userId,kind:'organization',draft_key:'new-organization'});return wrap(<><SectionHeading title={h(locale,'organizationTitle')} description={h(locale,'organizationHelp')}/><OrganizationEditor locale={locale} organization={null} privateRecord={null} draft={drafts[0]||null}/></>);}
  const selectedSite=typeof search.site==='string'?uuid(search.site):null,sitesPage=integer(Number(search.sitesPage||1),'sitesPage',1,10000),siteKey='site:'+str(org,'id')+':'+(selectedSite||'new');
  const editable=await hiringCapability(str(org,'id'),'organization.manage'),[privateRows,drafts,sites,siteDrafts,chosenSites]=await Promise.all([editable?studioRows('organizationPrivate',{organization_id:str(org,'id')}):Promise.resolve([]),editable?studioRows('drafts',{user_id:session.userId,kind:'organization',draft_key:str(org,'id')}):Promise.resolve([]),studioPage('sites',{organization_id:str(org,'id')},sitesPage),editable?studioRows('drafts',{user_id:session.userId,kind:'organization',draft_key:siteKey}):Promise.resolve([]),selectedSite?studioRows('sites',{id:selectedSite,organization_id:str(org,'id')}):Promise.resolve([])]);
  if(selectedSite&&!chosenSites[0])notFound();const siteDraft=siteDrafts[0]||null,sitePending=siteDraft?.body?siteIntent(object(siteDraft.body).intent):null,siteReceipt=sitePending?await hiringReceipt(sitePending.action,sitePending.key):null;
  return wrap(<div className={s.stack}><div className={s.inlineActions}><Link className={`${s.button} ${s.secondary}`} href={href(locale,'hiring/organization',new URLSearchParams({new:'1'}))}>{h(locale,'newOrganization')}</Link><Link className={s.textLink} href={href(locale,'hiring/verification',navParams)}>{screenName('H14',locale)}</Link></div><OrganizationReview locale={locale} organization={org}/>{editable?<OrganizationEditor key={str(org,'id')+String(org.version)} locale={locale} organization={org} privateRecord={privateRows[0]||null} draft={drafts[0]||null}/>:<div className={s.panel}><h2>{str(org,'public_name')}</h2><p className={s.authoredText}>{str(org,'public_description')}</p><p className={s.notice}>{errorText(locale,'FORBIDDEN')}</p></div>}{org.kind!=='household'?<><SiteEditor key={str(org,'id')+':'+(selectedSite||'new')+':'+String(siteDraft?.version||0)+':'+String(chosenSites[0]?.version||0)} locale={locale} organizationId={str(org,'id')} timezone={session.timezone} sites={sites.items} editable={editable} selected={chosenSites[0]||null} creating={search.newSite==='1'} draft={siteDraft} receipt={siteReceipt} search={search}/><StudioPagination locale={locale} path="hiring/organization" search={search} result={sites} pageKey="sitesPage"/></>:null}</div>);
 }
 if(!org)return wrap(<Empty locale={locale} title={h(locale,'organizationTitle')} description={h(locale,'organizationRequired')}><Link className={s.button} href={href(locale,'hiring/organization')}>{h(locale,'create')}</Link></Empty>);
 if(screen==='H14'||screen==='H15'||screen==='H16')return wrap(<HiringAccount locale={locale} screen={screen} session={session} organization={org} search={search}/>);
 if(screen==='H12')return wrap(<HiringTeam locale={locale} organizationId={str(org,'id')} userId={session.userId} search={search}/>);
 if(screen==='H07'||screen==='H08')return wrap(<HiringTalent locale={locale} organizationId={str(org,'id')} screen={screen} search={search} timezone={session.timezone}/>);
 if(screen==='H09'||screen==='H10')return wrap(<HiringOperations locale={locale} organizationId={str(org,'id')} userId={session.userId} timezone={session.timezone} screen={screen} search={search}/>);
 if(screen==='H11'&&search.tab==='notifications'){let page=1;try{page=integer(Number(search.page||1),'page',1,10000);}catch{return wrap(<Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>);}return wrap(<Notifications locale={locale} timezone={session.timezone} path={path} search={search} page={page}/>);}
 if(screen==='H05'||screen==='H06'||screen==='H11')return wrap(<><Link className={s.textLink} href={href(locale,'hiring/inbox',new URLSearchParams({organization:str(org,'id'),tab:'notifications'}))}>{w(locale,'notificationTitle')}</Link><HiringApplications locale={locale} organizationId={str(org,'id')} userId={session.userId} timezone={session.timezone} screen={screen} search={search}/></>);
 if(screen==='H02')return wrap(<VacancyList locale={locale} organizationId={str(org,'id')} search={search}/>);
 if(screen==='H03')return wrap(<NewVacancy locale={locale} organizationId={str(org,'id')} userId={session.userId}/>);
 if(screen==='H04')return wrap(<VacancyManagement locale={locale} organization={org} userId={session.userId} timezone={session.timezone} id={id||''} search={search}/>);
 if(screen==='H01'){
  const [vacancies,applications,interviews,offers]=await Promise.all([studioPage('vacancies',{organization_id:str(org,'id')}),studioPage('applications',{organization_id:str(org,'id')}),studioPage('interviews',{organization_id:str(org,'id')},1,{upcoming:true}),studioPage('offers',{organization_id:str(org,'id')})]);
  return wrap(<div className={s.stack}><section className={`${s.panel} ${s.studioWelcome}`}><span className={s.eyebrow}>{h(locale,org.kind==='household'?'household':'publicIdentity')}</span><h2>{str(org,'public_name')}</h2><p>{h(locale,'organizationHelp')}</p><div className={s.inlineActions}><Link className={s.button} href={href(locale,'hiring/vacancies/new',navParams)}>{h(locale,'createVacancy')}</Link><Link className={`${s.button} ${s.secondary}`} href={href(locale,'hiring/organization',navParams)}>{screenName('H13',locale)}</Link></div></section><div className={s.studioMetrics}>{[[h(locale,'allVacancies'),vacancies.total,'hiring/vacancies'],[h(locale,'applicationCount'),applications.total,'hiring/applications'],[h(locale,'upcomingInterviews'),interviews.total,'hiring/interviews'],[h(locale,'currentOffers'),offers.total,'hiring/offers']].map(([label,count,path])=><Link key={String(path)} href={href(locale,String(path),navParams)}><span>{label}</span><strong>{new Intl.NumberFormat(locale).format(Number(count))}</strong></Link>)}</div><OrganizationReview locale={locale} organization={org}/><section className={s.stack}><SectionHeading title={h(locale,'recentActivity')}/>{vacancies.items.length?<div className={s.vacancyList}>{vacancies.items.slice(0,4).map(vacancy=><VacancyRow key={str(vacancy,'id')} locale={locale} vacancy={vacancy} organizationId={str(org,'id')}/>)}</div>:<Empty locale={locale}><Link className={s.button} href={href(locale,'hiring/vacancies/new',navParams)}>{h(locale,'createVacancy')}</Link></Empty>}</section></div>);
 }
 notFound();
}
function OrganizationReview({locale,organization}:{locale:Locale;organization:DataRow}){const validUntil=str(organization,'identity_reviewed_until'),reviewed=Boolean(str(organization,'identity_review_reference')&&validUntil&&Date.parse(validUntil)>Date.now());return <section className={s.panel}><h2>{screenName('H14',locale)}</h2><p className={s.notice}>{reviewed?t(locale,'identityReviewed'):t(locale,'notDeclared')}{reviewed?' · '+formatDate(validUntil,locale,undefined,true):''}</p><p>{h(locale,'approvalHelp')}</p></section>;}
