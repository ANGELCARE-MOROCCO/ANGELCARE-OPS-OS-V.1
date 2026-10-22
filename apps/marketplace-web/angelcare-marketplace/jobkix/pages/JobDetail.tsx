import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BriefcaseBusiness,MapPin,ShieldCheck,ArrowRight } from 'lucide-react';
import { type Locale,type FaultCode } from '../contracts';
import { publicVacancy,searchVacancies,studioRows,applicationDocuments,type DataRow } from '../server/repository';
import type { DocumentSelectionResult } from '../document-selection';
import { getJobkixSession } from '../server/identity';
import { dependencyError } from '../server/http';
import { object,uuid } from '../validation';
import { Empty,JobCard,SectionHeading,str,number } from '../components/Public';
import { VacancyTerms,VacancyDescription } from '../components/VacancyContent';
import { JobActions } from '../client/JobActions';
import { ApplicationWizard } from '../client/ApplicationWizard';
import { countryName } from '../country-format';
import { SETTING_NAMES,OCCUPATION_NAMES } from '../taxonomy-copy';
import { SETTINGS,OCCUPATIONS } from '../taxonomy';
import { href,safeReturnTo } from '../routes';
import { t,errorText,formatDate } from '../i18n';
import { e } from '../experience-copy';
import s from '../jobkix.module.css';
export async function JobDetail({locale,id,apply=false,returnTo}:{locale:Locale;id:string;apply?:boolean;returnTo?:string}){
 try{uuid(id);}catch{notFound();}
 let job:DataRow|null;try{job=await publicVacancy(id);}catch(error){return <div className={`${s.container} ${s.section}`}><Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}><Link href={href(locale,'jobs/'+id)} className={s.button}>{t(locale,'retry')}</Link></Empty></div>;}
 if(!job)notFound();if(job.state==='unavailable')return <div className={`${s.container} ${s.section}`}><Empty locale={locale} title={t(locale,'closedJob')}><Link className={s.button} href={href(locale,'jobs')}>{t(locale,'findJobs')}</Link></Empty></div>;
 const returnUrl=safeReturnTo(returnTo,locale,'jobs'),active=job.state==='published',applyUrl=href(locale,'jobs/'+id,new URLSearchParams({apply:'1',returnTo:returnUrl}));
 const relatedPromise=searchVacancies({setting:str(job,'settingId'),destination:str(job,'country'),page:'1'}).then(value=>value.items.filter(item=>item.id!==id).slice(0,3),()=>null);
 let preparation:{profile:DataRow|null;documents:DocumentSelectionResult;draft:DataRow|null;existing:DataRow|null}|null=null,prepareError:FaultCode|null=null,sessionState='anonymous';
 if(apply&&active){try{const session=await getJobkixSession();sessionState=session.state;if(session.state==='active'){
   const [profiles,drafts,applications]=await Promise.all([studioRows('profile',{user_id:session.userId}),studioRows('drafts',{user_id:session.userId,kind:'application',draft_key:id}),studioRows('applications',{candidate_user_id:session.userId,vacancy_id:id})]);
   const draft=drafts[0]||null,body=draft?.body&&typeof draft.body==='object'&&!Array.isArray(draft.body)?object(draft.body):{},params=new URLSearchParams();
   if(typeof body.documentId==='string'&&body.documentId){try{params.set('selected',uuid(body.documentId));}catch{/* An unavailable restored choice stays visible in the wizard until corrected. */}}
   preparation={profile:profiles[0]||null,documents:await applicationDocuments(params),draft,existing:applications[0]||null};
  }}catch(error){prepareError=dependencyError(error).code;}}
 let savedJob:DataRow|null=null,savedError:FaultCode|null=null;try{const session=await getJobkixSession();if(session.state==='active'){const entries=await studioRows('saved',{user_id:session.userId,vacancy_id:id});savedJob=entries[0]||null;}}catch(error){savedError=dependencyError(error).code;}
 const setting=SETTINGS.find(([key])=>key===job.settingId)?.[0],occupation=OCCUPATIONS.find(([key])=>key===job.occupationId)?.[0];
 const related=await relatedPromise;
 const identity=job.identityReview&&typeof job.identityReview==='object'&&!Array.isArray(job.identityReview)?Object.fromEntries(Object.entries(job.identityReview)):null;
 return <>
  <section className={`${s.pageHero} ${s.jobOpening}`}><div className={s.container}><nav className={s.breadcrumbs} aria-label={t(locale,'menu')}><Link href={href(locale)}>JOBKIX</Link><span>/</span><Link href={returnUrl}>{t(locale,'findJobs')}</Link>{setting?<><span>/</span><Link href={href(locale,'sectors/'+setting)}>{SETTING_NAMES[setting][locale]}</Link></>:null}</nav><span className={s.eyebrow}>{occupation?OCCUPATION_NAMES[occupation][locale]:t(locale,'findJobs')}</span><h1 className={s.authoredText}>{str(job,'title')}</h1><div className={s.inlineActions}><span><BriefcaseBusiness size={18} aria-hidden="true"/> {str(job,'employerName')}</span><span><MapPin size={18} aria-hidden="true"/> {str(job,'city')}, {countryName(str(job,'country'),locale)}</span></div></div></section>
  <section className={s.section}><div className={`${s.container} ${s.detailsLayout}`}>
   <div className={s.stack}><section className={s.panel}><div className={s.inlineActions}><Link className={s.textLink} href={href(locale,'employers/'+str(job,'organizationId'))}>{str(job,'employerName')}<ArrowRight size={16} aria-hidden="true"/></Link><span className={s.chip}>{active?e(locale,'published'):t(locale,'closedJob')}</span></div>
    <VacancyTerms job={job} locale={locale}/>{active?<div className={s.mobileApplicationEntry}><Link className={s.button} href={apply?applyUrl+'#application':applyUrl}>{t(locale,'apply')}<ArrowRight size={17} aria-hidden="true"/></Link></div>:null}<JobActions locale={locale} id={id} initialSaved={savedJob?.saved===true} initialVersion={savedJob?number(savedJob,'version')||0:0} initialCollection={savedJob?str(savedJob,'collection'):'default'} initialError={savedError}/>
    <p className={s.metadataLine}>{e(locale,'published')}: {formatDate(str(job,'publishedAt'),locale,undefined,true)} · {e(locale,'deadline')}: {str(job,'expiresAt')?formatDate(str(job,'expiresAt'),locale):t(locale,'notDeclared')}</p>
   </section>
   <VacancyDescription job={job} locale={locale}/>
   {apply&&active?<div id="application"><div className={s.notice} role="status">{prepareError?errorText(locale,prepareError):sessionState==='restricted'?errorText(locale,'ACCOUNT_RESTRICTED'):sessionState==='verification_pending'?errorText(locale,'EMAIL_UNCONFIRMED'):t(locale,'profileControl')}</div>
    {preparation?.existing?<section className={s.panel}><h2>{errorText(locale,'ALREADY_APPLIED')}</h2><Link className={s.button} href={href(locale,'career/applications/'+str(preparation.existing,'id'))}>{t(locale,'careerStudio')}</Link></section>:preparation?.profile?<ApplicationWizard key={str(preparation.profile,'user_id')+':'+id} locale={locale} job={job} profile={preparation.profile} documents={preparation.documents} draft={preparation.draft}/>:<section className={s.panel}><h2>{e(locale,'profileRequired')}</h2><Link className={s.button} href={href(locale,sessionState==='onboarding'||sessionState==='active'?'onboarding':'candidate/sign-in',new URLSearchParams({intent:'candidate',next:applyUrl}))}>{t(locale,sessionState==='active'||sessionState==='onboarding'?'continue':'signIn')}</Link></section>}
   </div>:null}</div>
   <aside className={`${s.stack} ${s.sticky}`}><section className={s.panel}>{active?<Link className={s.button} href={apply?applyUrl+'#application':applyUrl}>{t(locale,'apply')}<ArrowRight size={17} aria-hidden="true"/></Link>:<p className={s.notice}>{t(locale,'closedJob')}</p>}<p>{t(locale,'profileControlDescription')}</p></section>
    <section className={s.panel}><h2>{str(job,'employerName')}</h2>{identity?<p><ShieldCheck size={19} aria-hidden="true"/>{t(locale,'identityReviewed')} · {formatDate(str(identity,'validUntil'),locale,undefined,true)}</p>:null}<p>{t(locale,'trustDescription')}</p><Link className={s.textLink} href={href(locale,'employers/'+str(job,'organizationId'))}>{e(locale,'employerProfile')}</Link></section>
    <section className={s.panel}><h2>{t(locale,'trust')}</h2><p>{t(locale,'noVisaGuarantee')}</p><Link className={s.textLink} href={href(locale,'trust')}>{t(locale,'trust')}</Link><Link className={s.textLink} href={href(locale,'report',new URLSearchParams({vacancy:id}))}>{t(locale,'report')}</Link></section>
   </aside>
  </div></section>
  <section className={`${s.section} ${s.sectionSoft}`}><div className={s.container}><SectionHeading title={e(locale,'relatedJobs')}/>{related?.length?<div className={s.jobsGrid}>{related.map(job=><JobCard key={str(job,'id')} job={job} locale={locale}/>)}</div>:<Empty locale={locale} problem={related===null}/>}</div></section>
 </>;
}
