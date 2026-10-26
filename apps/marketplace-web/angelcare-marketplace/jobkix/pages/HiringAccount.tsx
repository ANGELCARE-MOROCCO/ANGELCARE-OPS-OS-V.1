import Link from 'next/link';
import type { Locale } from '../contracts';
import type { JobkixSession } from '../server/identity';
import { studioPage,hiringAnalytics,type DataRow } from '../server/repository';
import { hiringCapability } from '../server/hiring-context';
import { integer,object } from '../validation';
import { analyticsWindow } from '../analytics-query';
import { APPLICATION_STATUS,applicationStatus } from '../application-copy';
import { fileLibraryRows } from '../file-library';
import { DocumentLibrary } from '../client/DocumentLibrary';
import { AccountSettings } from '../client/AccountControls';
import { EmployerAnalyticsVisual } from '../components/EmployerAnalyticsVisual';
import { StudioPagination } from '../components/StudioPagination';
import { Empty,str,number } from '../components/Public';
import { CaseWorkspace } from './CandidateAccount';
import { w } from '../workforce-copy';
import { screenName } from '../screen-copy';
import { h } from '../hiring-copy';
import { t,errorText,formatDate } from '../i18n';
import { href } from '../routes';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
export async function HiringAccount({locale,screen,session,organization,search}:{locale:Locale;screen:'H14'|'H15'|'H16';session:Extract<JobkixSession,{state:'active'}>;organization:DataRow;search:Params}){
 const organizationId=str(organization,'id'),params=new URLSearchParams({organization:organizationId});let page=1;
 try{if(Array.isArray(search.page)||search.page&&!/^\d{1,5}$/.test(search.page))throw Error();page=integer(Number(search.page||1),'page',1,10000);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}
 if(screen==='H15'){
  let window;try{window=analyticsWindow(search);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}
  const data=await hiringAnalytics(organizationId,window.from,window.until),states=object(data.currentApplicationStates),total=number(data,'submissions')||0;
  return <div className={s.stack}><section className={s.panel}><h2>{screenName('H15',locale)}</h2><p>{w(locale,'analyticsHelp')}</p><form className={s.formGrid} method="get" action={href(locale,'hiring/analytics')}><input type="hidden" name="organization" value={organizationId}/><label className={s.field}>{w(locale,'from')}<input type="date" name="from" defaultValue={window.from.slice(0,10)} required/></label><label className={s.field}>{w(locale,'until')}<input type="date" name="until" defaultValue={window.until.slice(0,10)} required/></label><button className={s.button} type="submit">{t(locale,'search')}</button></form><p className={s.notice}>{w(locale,'noTracking')}</p><time dateTime={str(data,'asOf')}>{formatDate(str(data,'asOf'),locale,session.timezone)}</time></section><dl className={s.studioMetrics}>{(['activeVacancies','submissions','interviewsProposed','offersSent','acceptedOffers'] as const).map(key=><div key={key}><dt>{w(locale,key)}</dt><dd><strong>{new Intl.NumberFormat(locale).format(number(data,key)||0)}</strong></dd></div>)}</dl><EmployerAnalyticsVisual locale={locale} states={states} total={total}/><section className={s.panel}><h2>{screenName('H05',locale)}</h2><div className={s.tableWrap}><table className={s.table}><thead><tr><th scope="col">{screenName('H06',locale)}</th><th scope="col">{w(locale,'submissions')}</th></tr></thead><tbody>{Object.keys(APPLICATION_STATUS).map(state=><tr key={state}><th scope="row">{applicationStatus(locale,state)}</th><td>{new Intl.NumberFormat(locale).format(typeof states[state]==='number'?states[state]:0)}</td></tr>)}</tbody></table></div>{!total?<Empty locale={locale} title={screenName('H05',locale)} description={w(locale,'analyticsHelp')}/>:null}</section></div>;
 }
 if(screen==='H14'){
  if(!await hiringCapability(organizationId,'organization.manage'))return <Empty locale={locale} problem title={errorText(locale,'FORBIDDEN')}/>;
  const files=await studioPage('files',{owner_user_id:session.userId,organization_id:organizationId,purpose:'verification'},page),validUntil=str(organization,'identity_reviewed_until'),valid=Boolean(str(organization,'identity_review_reference')&&Date.parse(validUntil)>Date.now());
  return <div className={s.stack}><section className={s.panel}><h2>{screenName('H14',locale)}</h2><p>{w(locale,'verificationHelp')}</p><p className={s.notice}>{valid?t(locale,'identityReviewed'):t(locale,'notDeclared')}{valid?' · '+formatDate(validUntil,locale,session.timezone,true):''}</p><p>{h(locale,'approvalHelp')}</p><Link className={s.textLink} href={href(locale,'hiring/organization',params)}>{screenName('H13',locale)}</Link></section><div id="documents"><DocumentLibrary locale={locale} files={fileLibraryRows(files.items)} organizationId={organizationId} verification/></div><StudioPagination locale={locale} path="hiring/verification" search={{...search,organization:organizationId}} result={files}/><CaseWorkspace locale={locale} userId={session.userId} timezone={session.timezone} path="hiring/verification" search={search} page={page} organizationId={organizationId} verification documentHref={href(locale,'hiring/verification',params)+'#documents'}/></div>;
 }
 const files=await studioPage('files',{owner_user_id:session.userId},page);
 return <div className={s.stack}><AccountSettings key={session.userId+':'+session.accountVersion} userId={session.userId} locale={locale} version={session.accountVersion} initialLocale={session.locale} timezone={session.timezone} emailNotifications={session.emailNotifications} email={session.email} helpPath="hiring/settings" organizationId={organizationId}/><section className={s.panel}><h2>{screenName('H13',locale)}</h2><div className={s.inlineActions}><Link className={s.button} href={href(locale,'hiring/organization',params)}>{screenName('H13',locale)}</Link><Link className={`${s.button} ${s.secondary}`} href={href(locale,'hiring/team',params)}>{screenName('H12',locale)}</Link><Link className={s.textLink} href={href(locale,'hiring/verification',params)}>{screenName('H14',locale)}</Link></div></section><div id="documents"><DocumentLibrary locale={locale} files={fileLibraryRows(files.items)}/></div><StudioPagination locale={locale} path="hiring/settings" search={{...search,organization:organizationId}} result={files}/><CaseWorkspace locale={locale} userId={session.userId} timezone={session.timezone} path="hiring/settings" search={search} page={page} organizationId={organizationId} documentHref={href(locale,'hiring/settings',params)+'#documents'}/></div>;
}
