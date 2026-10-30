import Link from 'next/link';
import { notFound,redirect } from 'next/navigation';
import { type Locale,type FaultCode } from '../contracts';
import { publicVacancy,searchVacancies,studioRows,applicationDocuments,externalSavedRow,type DataRow } from '../server/repository';
import { verifiedExternalApplicationUrl } from '../supply/external-application';
import type { DocumentSelectionResult } from '../document-selection';
import { getJobkixSession } from '../server/identity';
import { dependencyError } from '../server/http';
import { object,uuid } from '../validation';
import { VacancyExperience } from '../components/VacancyExperience';
import { Empty,str } from '../components/Public';
import { t,errorText } from '../i18n';
import { href,safeReturnTo } from '../routes';
import s from '../jobkix.module.css';
export async function JobDetail({locale,id,apply=false,returnTo}:{locale:Locale;id:string;apply?:boolean;returnTo?:string}){
 try{uuid(id);}catch{notFound();}
 let job:DataRow|null;try{job=await publicVacancy(id);}catch(error){return <div className={`${s.container} ${s.section}`}><Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}><Link href={href(locale,'jobs/'+id)} className={s.button}>{t(locale,'retry')}</Link></Empty></div>;}
 if(!job)notFound();if(job.state==='unavailable')return <div className={`${s.container} ${s.section}`}><Empty locale={locale} title={t(locale,'closedJob')}><Link className={s.button} href={href(locale,'jobs')}>{t(locale,'findJobs')}</Link></Empty></div>;
 const external=job.sourceOrigin==='external';
 const returnUrl=safeReturnTo(returnTo,locale,'jobs'),active=job.state==='published';
 const externalDestination=external?verifiedExternalApplicationUrl(job.externalApplyUrl):null;
 if(external&&!externalDestination)notFound();
 const applyUrl=external?externalDestination!:href(locale,'jobs/'+id,new URLSearchParams({apply:'1',returnTo:returnUrl}));
 if(external&&apply&&active)redirect(applyUrl);
 const relatedPromise=searchVacancies({setting:str(job,'settingId'),destination:str(job,'country'),page:'1'}).then(value=>value.items.filter(item=>item.id!==id).slice(0,3),()=>null);
 let preparation:{profile:DataRow|null;documents:DocumentSelectionResult;draft:DataRow|null;existing:DataRow|null}|null=null,prepareError:FaultCode|null=null,sessionState='anonymous';
 if(apply&&active&&!external){try{const session=await getJobkixSession();sessionState=session.state;if(session.state==='active'){
   const [profiles,drafts,applications]=await Promise.all([studioRows('profile',{user_id:session.userId}),studioRows('drafts',{user_id:session.userId,kind:'application',draft_key:id}),studioRows('applications',{candidate_user_id:session.userId,vacancy_id:id})]);
   const draft=drafts[0]||null,body=draft?.body&&typeof draft.body==='object'&&!Array.isArray(draft.body)?object(draft.body):{},params=new URLSearchParams();
   if(typeof body.documentId==='string'&&body.documentId){try{params.set('selected',uuid(body.documentId));}catch{/* An unavailable restored choice stays visible in the wizard until corrected. */}}
   preparation={profile:profiles[0]||null,documents:await applicationDocuments(params),draft,existing:applications[0]||null};
  }}catch(error){prepareError=dependencyError(error).code;}}
 let savedJob:DataRow|null=null,savedError:FaultCode|null=null;try{const session=await getJobkixSession();if(session.state==='active'){const entries=external?[await externalSavedRow(id)]:await studioRows('saved',{user_id:session.userId,vacancy_id:id});savedJob=entries[0]||null;}}catch(error){savedError=dependencyError(error).code;}
 let fitProfile:DataRow|null=preparation?.profile||null;
 if(!fitProfile){try{const session=await getJobkixSession();if(session.state==='active'){
  const profiles=await studioRows('profile',{user_id:session.userId});fitProfile=profiles[0]||null;
 }}catch{/* Profile comparison is best-effort; never block opening a vacancy. */}}
 const related=await relatedPromise;
 return <VacancyExperience locale={locale} id={id} job={job} active={active} external={external} apply={apply} applyUrl={applyUrl} returnUrl={returnUrl}
  preparation={preparation} prepareError={prepareError} sessionState={sessionState} savedJob={savedJob} savedError={savedError} related={related} fitProfile={fitProfile}/>;
}
