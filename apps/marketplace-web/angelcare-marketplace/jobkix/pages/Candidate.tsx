import Link from 'next/link';
import { notFound,redirect } from 'next/navigation';
import type { Locale } from '../contracts';
import type { ReactNode } from 'react';
import { APPLICATION_STATUS,applicationStatus } from '../application-copy';
import { studioSession } from '../server/studio-session';
import { studioRows,studioPage,searchVacancies,type DataRow,type SearchResult } from '../server/repository';
import { dependencyError } from '../server/http';
import { Notifications } from '../components/Notifications';
import { StudioShell } from '../components/StudioShell';
import { ProfileEditor } from '../client/ProfileEditor';
import { DocumentLibrary } from '../client/DocumentLibrary';
import { Conversation } from '../client/Conversation';
import { ApplicationActions,InterviewResponse,OfferResponse } from '../client/ApplicationActions';
import { Empty,str,number } from '../components/Public';
import { screenName } from '../screen-copy';
import { object,integer,uuid } from '../validation';
import { href,safeReturnTo,SCREENS } from '../routes';
import { readFilters,FILTER_KEYS } from '../discovery';
import { st } from '../studio-copy';
import { t,errorText,formatDate } from '../i18n';
import { e } from '../experience-copy';
import { CandidateAccount } from './CandidateAccount';
import { StudioPagination as Pagination } from '../components/StudioPagination';
import { SavedCollections } from './SavedCollections';
import { SearchCommand } from '../client/SearchCommand';
import { SearchResults } from '../client/SearchResults';
import { w } from '../workforce-copy';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
const queryValue=(search:Params,key:string)=>typeof search[key]==='string'?search[key]:'';
function snapshot(application:DataRow){return object(application.snapshot);}
function jobTitle(application:DataRow){const snap=snapshot(application);return snap.vacancy&&typeof snap.vacancy==='object'?str(object(snap.vacancy),'title'):str(application,'vacancy_id');}
function ApplicationList({locale,rows,timezone}:{locale:Locale;rows:DataRow[];timezone:string}){return <div className={s.stack}>{rows.map(application=><article className={s.panel} key={str(application,'id')}><div className={s.sectionHeading}><div><span className={s.chip}>{applicationStatus(locale,str(application,'state'))}</span><h2><Link href={href(locale,'career/applications/'+str(application,'id'))}>{jobTitle(application)}</Link></h2><p>{t(locale,'receipt',{reference:str(application,'receipt')})}</p><time dateTime={str(application,'submitted_at')}>{formatDate(str(application,'submitted_at'),locale,timezone)}</time></div><Link className={s.button} href={href(locale,'career/applications/'+str(application,'id'))}>{t(locale,'continue')}</Link></div></article>)}</div>;}
export async function CandidatePage({locale,screen,id,search}:{locale:Locale;screen:string;id?:string;search:Params}){
 const path=(SCREENS.find(item=>item.id===screen)?.path||'career').replace(':id',id||'');
 const routeQuery=new URLSearchParams();for(const key of [...FILTER_KEYS,'state','next','application','kind','collection','case','page','editSearch','tab']){const value=queryValue(search,key);if(value)routeQuery.set(key,value);}
 const session=await studioSession(locale,'candidate',href(locale,path,routeQuery));
 const profiles=await studioRows('profile',{user_id:session.userId});if(!profiles[0])redirect(href(locale,'onboarding',new URLSearchParams({intent:'candidate',next:href(locale,path,routeQuery)})));
 const profile=profiles[0],title=screenName(screen,locale);
 const wrap=(children:ReactNode)=><StudioShell locale={locale} mode="candidate" screenId={screen} title={title}>{queryValue(search,'next')?<Link className={s.textLink} href={safeReturnTo(queryValue(search,'next'),locale)}>{t(locale,'back')}</Link>:null}{children}</StudioShell>;
 let page=1;try{page=integer(Number(queryValue(search,'page')||1),'page',1,10000);}catch{return wrap(<Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>);}
 if(['C10','C11','C12','C13','C14'].includes(screen))return wrap(<CandidateAccount locale={locale} screen={screen} session={session} profile={profile} search={search} page={page} path={path}/>);
 if(screen==='C02'){const params=new URLSearchParams();for(const [key,value] of Object.entries(search)){if(Array.isArray(value))for(const item of value)params.append(key,item);else if(value!==undefined)params.set(key,value);}let filters;try{filters=readFilters(params);}catch{return wrap(<Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>);}let savedSearch:DataRow|null=null;const savedId=queryValue(search,'editSearch');if(savedId){try{uuid(savedId);}catch{return wrap(<Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>);}savedSearch=(await studioRows('alerts',{id:savedId,user_id:session.userId}))[0]||null;if(!savedSearch)notFound();}const result=await searchVacancies(filters).then(value=>({value,error:null}),error=>({value:null,error:dependencyError(error).code}));return wrap(<><SearchCommand key={params.toString()} locale={locale} filters={filters} target="career/discovery" savedSearchId={savedSearch?str(savedSearch,'id'):undefined}/><SearchResults locale={locale} filters={filters} initialResult={result.value} initialError={result.error} studio savedSearch={savedSearch}/></>);}
 if(screen==='C03')return wrap(<SavedCollections locale={locale} search={search} page={page}/>);
 if(screen==='C06'){
  const drafts=await studioRows('drafts',{user_id:session.userId,kind:'profile',draft_key:'career-passport'});
  return wrap(<ProfileEditor locale={locale} profile={profile} draft={drafts[0]||null}/>);
 }
 if(screen==='C07'){
  const result=await studioPage('files',{owner_user_id:session.userId},page);
  const files=result.items.map(file=>Object.fromEntries(['id','filename','mime','purpose','state','expected_bytes','revision','library_archived_at','upload_key'].map(key=>[key,file[key]])));
  return wrap(<><DocumentLibrary locale={locale} files={files}/><Pagination locale={locale} path={path} search={search} result={result}/></>);
 }
 if(screen==='C04'){
  const state=queryValue(search,'state');if(state&&!Object.hasOwn(APPLICATION_STATUS,state))return wrap(<Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>);
  const result=await studioPage('applications',{candidate_user_id:session.userId,...(state?{state}:{})},page,{q:queryValue(search,'q')});
  return wrap(<><form className={s.panel} action={href(locale,path)} method="get"><div className={s.formGrid}><label className={s.field}>{t(locale,'keyword')}<input name="q" defaultValue={queryValue(search,'q')} maxLength={300}/></label><label className={s.field}>{st(locale,'application')}<select name="state" defaultValue={state}><option value="">{t(locale,'any')}</option>{Object.keys(APPLICATION_STATUS).map(state=><option key={state} value={state}>{applicationStatus(locale,state)}</option>)}</select></label></div><button type="submit" className={s.button}>{t(locale,'search')}</button></form>{result.items.length?<ApplicationList locale={locale} rows={result.items} timezone={session.timezone}/>:<Empty locale={locale} title={st(locale,'noActivity')}/>}<Pagination locale={locale} path={path} search={search} result={result}/></>);
 }
 if(screen==='C05'){
  if(!id)notFound();const applications=await studioRows('applications',{id,candidate_user_id:session.userId}),application=applications[0];if(!application)notFound();
  const [history,threads,interviews,offers,drafts]=await Promise.all([studioPage('history',{application_id:id},integer(Number(queryValue(search,'historyPage')||1),'historyPage',1,10000)),studioRows('threads',{application_id:id}),studioPage('interviews',{application_id:id,candidate_user_id:session.userId},integer(Number(queryValue(search,'interviewsPage')||1),'interviewsPage',1,10000)),studioPage('offers',{application_id:id,candidate_user_id:session.userId},integer(Number(queryValue(search,'offersPage')||1),'offersPage',1,10000)),studioRows('drafts',{user_id:session.userId,kind:'message',draft_key:id})]);
  const messages=threads[0]?await studioPage('messages',{thread_id:str(threads[0],'id')},page):{items:[],total:0,page:1,pageSize:24};
  const snap=snapshot(application),submittedProfile=object(snap.profile),vacancy=snap.vacancy?object(snap.vacancy):{};
  return wrap(<div className={s.stack}><section className={s.panel}><span className={s.chip}>{applicationStatus(locale,str(application,'state'))}</span><h2>{jobTitle(application)}</h2><p>{t(locale,'receipt',{reference:str(application,'receipt')})}</p><Link className={s.textLink} href={href(locale,'jobs/'+str(application,'vacancy_id'))}>{t(locale,'viewJob')}</Link></section>
   <div className={s.detailsLayout}><div className={s.stack}><section className={s.panel}><h2>{st(locale,'snapshot')}</h2><p className={s.notice}>{e(locale,'snapshotNotice')}</p><h3>{str(submittedProfile,'displayName')}</h3><p>{str(submittedProfile,'headline')}</p><p className={s.authoredText}>{str(submittedProfile,'summary')}</p>{['skills','occupations','languages'].map(key=>Array.isArray(submittedProfile[key])?<p key={key}>{submittedProfile[key].filter((value):value is string=>typeof value==='string').join(' · ')}</p>:null)}
    {['experience','education'].map(key=>Array.isArray(submittedProfile[key])?<section key={key}><h3>{st(locale,key==='experience'?'experience':'education')}</h3>{submittedProfile[key].map((entry,index)=>{const row=object(entry);return <div key={index}><strong>{str(row,'title')} · {str(row,'organization')}</strong><p>{str(row,'start')} – {str(row,'end')}</p><p className={s.authoredText}>{str(row,'description')}</p></div>;})}</section>:null)}
    {Array.isArray(vacancy.questions)?<dl>{vacancy.questions.map(value=>{const question=object(value),answers=object(snap.answers);return <div key={str(question,'id')}><dt>{str(question,'label')}</dt><dd className={s.authoredText}>{str(answers,str(question,'id'))}</dd></div>;})}</dl>:null}{snap.file?<a className={s.textLink} download href={'/api/jobkix/files/'+str(object(snap.file),'id')}>{st(locale,'download')} · {e(locale,'document')}</a>:null}
    <details><summary>{e(locale,'terms')}</summary><p className={s.authoredText}>{str(vacancy,'description')}</p>{(['duties','requirements','benefits'] as const).map(key=>Array.isArray(vacancy[key])?<section key={key}><h3>{e(locale,key==='duties'?'responsibilities':key)}</h3><ul>{vacancy[key].filter((value):value is string=>typeof value==='string').map((value,index)=><li key={index}>{value}</li>)}</ul></section>:null)}</details>
   </section><Conversation locale={locale} applicationId={id} timezone={session.timezone} messages={messages.items.map(message=>({id:message.id,body:message.body,originalLocale:message.original_locale,createdAt:message.created_at,attachmentId:message.attachment_id,fromMe:message.sender_user_id===session.userId}))} draft={drafts[0]||null}/><Pagination locale={locale} path={path} search={search} result={messages}/>
    {interviews.items.map(interview=><InterviewResponse key={str(interview,'id')} locale={locale} interview={interview} timezone={session.timezone}/>)}<Pagination locale={locale} path={path} search={search} result={interviews} pageKey="interviewsPage"/>{offers.items.map(offer=><OfferResponse key={str(offer,'id')} locale={locale} offer={offer} timezone={session.timezone}/>)}<Pagination locale={locale} path={path} search={search} result={offers} pageKey="offersPage"/><ApplicationActions locale={locale} application={application}/>
   </div><aside className={s.panel}><h2>{st(locale,'timeline')}</h2><ol className={s.timeline}>{[...history.items].reverse().map(event=>{const detail=object(event.public_detail),type=str(event,'type');return <li key={str(event,'id')}><strong>{type==='application.submitted'?applicationStatus(locale,'submitted'):type==='application.stage_changed'?applicationStatus(locale,str(detail,'state')):type==='offer.sent'?applicationStatus(locale,'offer'):type==='offer.accepted'?applicationStatus(locale,'hired'):type==='offer.declined'?st(locale,'decline'):t(locale,'saved')}</strong><p><time dateTime={str(event,'created_at')}>{formatDate(str(event,'created_at'),locale,session.timezone)}</time></p></li>;})}</ol><Pagination locale={locale} path={path} search={search} result={history} pageKey="historyPage"/></aside></div>
  </div>);
 }
 if(screen==='C08'){
  const result=await studioPage('interviews',{candidate_user_id:session.userId},page);
  return wrap(<><div className={s.stack}>{result.items.map(interview=><div key={str(interview,'id')}><InterviewResponse locale={locale} interview={interview} timezone={session.timezone}/><Link className={s.textLink} href={href(locale,'career/applications/'+str(interview,'application_id'))}>{st(locale,'application')}</Link></div>)}</div>{!result.items.length?<Empty locale={locale} title={st(locale,'noActivity')}/>:null}<Pagination locale={locale} path={path} search={search} result={result}/></>);
 }
 if(screen==='C09'&&queryValue(search,'tab')==='notifications')return wrap(<Notifications locale={locale} timezone={session.timezone} path={path} search={search} page={page}/>);
 if(screen==='C09'){
  const applications=await studioPage('applications',{candidate_user_id:session.userId},integer(Number(queryValue(search,'applicationsPage')||1),'applicationsPage',1,10000)),selectedId=queryValue(search,'application');
  const selected=selectedId?(await studioRows('applications',{id:selectedId,candidate_user_id:session.userId}))[0]:null;
  let conversation:ReactNode=<Empty locale={locale} title={st(locale,'messages')}/>;
  if(selected){const [threads,drafts]=await Promise.all([studioRows('threads',{application_id:str(selected,'id')}),studioRows('drafts',{user_id:session.userId,kind:'message',draft_key:str(selected,'id')})]);const messages=threads[0]?await studioPage('messages',{thread_id:str(threads[0],'id')},page):{items:[],total:0,page:1,pageSize:24};conversation=<><h2>{jobTitle(selected)}</h2><Conversation locale={locale} applicationId={str(selected,'id')} messages={messages.items.map(message=>({id:message.id,body:message.body,originalLocale:message.original_locale,createdAt:message.created_at,attachmentId:message.attachment_id,fromMe:message.sender_user_id===session.userId})).reverse()} timezone={session.timezone} draft={drafts[0]||null}/><Pagination locale={locale} path={path} search={search} result={messages}/></>;}
  return wrap(<><Link className={s.textLink} href={href(locale,path,new URLSearchParams({tab:'notifications'}))}>{w(locale,'notificationTitle')}</Link><div className={s.twoColumns}><aside className={s.panel}><h2>{screenName('C04',locale)}</h2><nav className={s.stack}>{applications.items.map(application=><Link className={s.textLink} key={str(application,'id')} href={href(locale,path,new URLSearchParams({...Object.fromEntries(routeQuery),application:str(application,'id'),page:'1'}))} aria-current={selectedId===application.id?'page':undefined}>{jobTitle(application)}</Link>)}</nav>{!applications.items.length?<p>{st(locale,'noActivity')}</p>:null}<Pagination locale={locale} path={path} search={search} result={applications} pageKey="applicationsPage"/></aside><div className={s.stack}>{conversation}</div></div></>);
 }
 if(screen==='C01'){
  const [applications,interviews]=await Promise.allSettled([studioPage('applications',{candidate_user_id:session.userId},1),studioPage('interviews',{candidate_user_id:session.userId},1,{upcoming:true})]);
  return wrap(<div className={s.stack}><section className={`${s.panel} ${s.studioWelcome}`}><span className={s.eyebrow}>{st(locale,'overview')}</span><h2>{str(profile,'display_name')}</h2><p>{t(locale,'profileControlDescription')}</p><div className={s.inlineActions}><Link className={s.button} href={href(locale,'jobs')}>{t(locale,'findJobs')}</Link><Link className={`${s.button} ${s.secondary}`} href={href(locale,'career/passport')}>{e(locale,'editProfile')}</Link></div></section>
   {applications.status==='fulfilled'?<><h2>{screenName('C04',locale)} · {new Intl.NumberFormat(locale).format(applications.value.total)}</h2><ApplicationList locale={locale} rows={applications.value.items.slice(0,6)} timezone={session.timezone}/>{!applications.value.items.length?<Empty locale={locale} title={st(locale,'noActivity')}/>:null}<Link className={s.textLink} href={href(locale,'career/applications')}>{screenName('C04',locale)}</Link></>:<Empty locale={locale} problem title={errorText(locale,dependencyError(applications.reason).code)}/>}
   {interviews.status==='fulfilled'?<><h2>{st(locale,'interviews')}</h2>{interviews.value.items.slice(0,3).map(interview=><InterviewResponse key={str(interview,'id')} locale={locale} interview={interview} timezone={session.timezone}/>)}</>:<Empty locale={locale} problem/>}
  </div>);
 }
 notFound();
}
