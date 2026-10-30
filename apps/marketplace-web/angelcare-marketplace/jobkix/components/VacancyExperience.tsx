import Link from 'next/link';
import {ArrowRight,ArrowUpRight,BriefcaseBusiness,MapPin,Clock3,Check,ShieldCheck,FileCheck2,Wallet} from 'lucide-react';
import type {Locale,FaultCode} from '../contracts';
import type {ReactNode} from 'react';
import type {DataRow} from '../server/repository';
import type {DocumentSelectionResult} from '../document-selection';
import {object} from '../validation';
import {str,number,JobCard,Empty} from './Public';
import {countryName} from '../country-format';
import {VacancyTerms} from './VacancyContent';
import {ApplicationWizard} from '../client/ApplicationWizard';
import {JobActions} from '../client/JobActions';
import {VacancyWorkspace,type VacancyPane} from '../client/VacancyWorkspace';
import {VacancySectorImage} from '../client/VacancySectorImage';
import {v7} from '../vacancy-pm7-copy';
import {e,employmentLabel} from '../experience-copy';
import {SETTING_NAMES,OCCUPATION_NAMES} from '../taxonomy-copy';
import {SETTINGS,OCCUPATIONS,AGE_COHORTS} from '../taxonomy';
import {AGE_NAMES} from '../age-copy';
import {t,errorText,formatDate,formatMoney,LANGUAGE_NAMES} from '../i18n';
import {href} from '../routes';
import s from '../vacancy-pm7.module.css';

type Prepared={profile:DataRow|null;documents:DocumentSelectionResult;draft:DataRow|null;existing:DataRow|null};
type Props={locale:Locale;id:string;job:DataRow;active:boolean;external:boolean;apply:boolean;applyUrl:string;returnUrl:string;preparation:Prepared|null;prepareError:FaultCode|null;sessionState:string;savedJob:DataRow|null;savedError:FaultCode|null;related:DataRow[]|null;fitProfile:DataRow|null};
const items=(row:DataRow,key:string):string[]=>Array.isArray(row[key])?row[key].filter((v):v is string=>typeof v==='string'&&v.trim().length>0):[];
const contentObject=(value:unknown):DataRow=>value&&typeof value==='object'&&!Array.isArray(value)?object(value):{};
function Explanation({label,title,lead,children}:{label:string;title:string;lead?:string;children:ReactNode}){return <div className={s.contentBox}><div className={s.eyebrow}>{label}</div><h2>{title}</h2>{lead?<p className={s.lead}>{lead}</p>:null}{children}</div>}
function BulletRows({values,empty,lang}:{values:string[];empty:string;lang?:string}){return values.length?<ul className={s.bulletList} lang={lang||undefined}>{values.map((v,i)=><li key={`${i}-${v}`}><span className={s.bulletMark}><Check size={13}/></span><span className={s.authored}>{v}</span></li>)}</ul>:<p className={s.muted}>{empty}</p>}
function Fact({label,value,highlight=false}:{label:string;value:string;highlight?:boolean}){return <div className={`${s.fact} ${highlight?s.factHighlight:''}`}><small>{label}</small><strong>{value}</strong></div>}
function Field({label,value}:{label:string;value:string}){return <div className={s.pair}><span>{label}</span><strong>{value}</strong></div>}
function applicableLanguage(code:string,locale:Locale){if(!code)return '';if(Object.hasOwn(LANGUAGE_NAMES,code))return LANGUAGE_NAMES[code as Locale];try{return new Intl.DisplayNames([locale],{type:'language'}).of(code)||code;}catch{return code;}}
export function VacancyExperience({locale,id,job,active,external,apply,applyUrl,returnUrl,preparation,prepareError,sessionState,savedJob,savedError,related,fitProfile}:Props){
 const copy=v7(locale),employer=str(job,'employerName'),title=str(job,'title'),setting=SETTINGS.find(([key])=>key===job.settingId)?.[0]||'',occupation=OCCUPATIONS.find(([key])=>key===job.occupationId)?.[0],country=str(job,'country');
 const fullLocation=[str(job,'city'),country?countryName(country,locale):''].filter(Boolean).join(', ')||t(locale,'notDeclared');
 const destination=href(locale,'employers/'+str(job,'organizationId'));
 const pay=contentObject(job.compensation),min=number(pay,'minimum'),max=number(pay,'maximum'),currency=str(pay,'currency'),unit=str(pay,'unit');
 const salary=currency&&(min!==null||max!==null)?[min,max].filter((v):v is number=>v!==null).map(v=>formatMoney(v,currency,locale)).join(' – ')+(unit?' · '+employmentLabel(locale,unit):''):t(locale,'notDeclared');
 const schedule=employmentLabel(locale,str(job,'workSchedule'))||t(locale,'notDeclared'),contract=employmentLabel(locale,str(job,'contractType'))||t(locale,'notDeclared'),workplace=employmentLabel(locale,str(job,'workLocation'))||t(locale,'notDeclared'),deadline=str(job,'expiresAt')?formatDate(str(job,'expiresAt'),locale):t(locale,'notDeclared');
 const duties=items(job,'duties'),requirements=items(job,'requirements'),benefits=items(job,'benefits'),languages=items(job,'languages'),ages=items(job,'ageCohorts');
 const originalLocale=str(job,'originalLocale'),originalName=originalLocale?applicableLanguage(originalLocale,locale):t(locale,'notDeclared');
 const identity=contentObject(job.identityReview),identityExists=Object.keys(identity).length>0;
 const profileSkills=fitProfile?items(fitProfile,'skills'):[],profileLanguages=fitProfile?items(fitProfile,'languages'):[];
 const cohortLabels=ages.map(value=>{const k=AGE_COHORTS.find(x=>x===value);return k?AGE_NAMES[k][locale]:value});
 const group=setting?SETTING_NAMES[setting][locale]:occupation?OCCUPATION_NAMES[occupation][locale]:t(locale,'findJobs');
 const panes:VacancyPane[]=[
  {id:'overview',label:copy.overview,content:<>
    <Explanation label="01 / VACANCY INTELLIGENCE" title={copy.position} lead={copy.explore}>
     <div className={s.featureGrid}>
      <div className={s.feature}><BriefcaseBusiness size={20}/><strong>{copy.company}</strong><p>{employer||copy.noInfo}</p></div>
      <div className={s.feature}><MapPin size={20}/><strong>{copy.location}</strong><p>{fullLocation}</p></div>
      <div className={s.feature}><Clock3 size={20}/><strong>{copy.schedule}</strong><p>{schedule}</p></div>
     </div><div className={s.sectionRule}/>
     <h3>{e(locale,'description')}</h3><p className={s.authored} lang={originalLocale||undefined}>{str(job,'description')||copy.noInfo}</p>
     <div className={s.sourceHint}>{copy.sourceLanguage}: {originalName}</div>
    </Explanation>
    <div className={s.twoColTiles}><div className={s.smallPanel}><div className={s.eyebrow}>{e(locale,'responsibilities')}</div><BulletRows values={duties.slice(0,4)} empty={copy.noDuties} lang={originalLocale}/></div><div className={s.smallPanel}><div className={s.eyebrow}>{e(locale,'requirements')}</div><BulletRows values={requirements.slice(0,4)} empty={copy.noRequirements} lang={originalLocale}/></div></div>
  </>},
  {id:'role',label:copy.role,content:<>
    <Explanation label="02 / ROLE EXPERIENCE" title={copy.roleDetails} lead={e(locale,'description')}>
     <div className={s.roleSplit}><section><h3>{e(locale,'responsibilities')}</h3><BulletRows values={duties} empty={copy.noDuties} lang={originalLocale}/></section><section><h3>{e(locale,'requirements')}</h3><BulletRows values={requirements} empty={copy.noRequirements} lang={originalLocale}/></section></div>
    </Explanation><Explanation label="02 / ROLE INTELLIGENCE" title={copy.language}><div className={s.tagList}>{languages.length?languages.map((l,i)=><span className={s.keyword} key={i}>{applicableLanguage(l,locale)}</span>):<span className={s.muted}>{copy.noInfo}</span>}</div>{cohortLabels.length?<><h3 className={s.midHead}>{copy.age}</h3><div className={s.tagList}>{cohortLabels.map((a,i)=><span className={s.keyword} key={i}>{a}</span>)}</div></>:null}</Explanation>
  </>},
  {id:'fit',label:copy.fit,content:<>
    <div className={s.fitHero}><div className={s.eyebrow}>03 / CAREER PASSPORT</div><h2>{copy.fitTitle}</h2><p>{copy.fitSubtitle}</p><div className={s.fitBadge}><ShieldCheck size={14}/>{copy.noScore}</div></div>
    <Explanation label="03 / EVIDENCE REVIEW" title={copy.employerRequires}>
     <div className={s.comparison}><div><h3>{copy.requirements}</h3><BulletRows values={requirements} empty={copy.noRequirements} lang={originalLocale}/></div><div><h3>{copy.yourProfile}</h3>
      {fitProfile?<><p className={s.profileName}>{str(fitProfile,'display_name')||copy.profileHeadline}</p>{str(fitProfile,'headline')?<p className={s.lead}>{str(fitProfile,'headline')}</p>:null}<div className={s.sourceHint}>{copy.profileSkills}</div><div className={s.tagList}>{profileSkills.length?profileSkills.map((k,i)=><span className={s.keyword} key={i}>{k}</span>):<span className={s.muted}>{copy.noInfo}</span>}</div><div className={s.sourceHint}>{copy.profileLanguages}</div><div className={s.tagList}>{profileLanguages.length?profileLanguages.map((k,i)=><span className={s.keyword} key={i}>{k}</span>):<span className={s.muted}>{copy.noInfo}</span>}</div><Link href={href(locale,'career/passport')} className={s.inlineLink}>{e(locale,'editProfile')} <ArrowUpRight size={15}/></Link></>:<><p>{copy.fitGuest}</p><Link className={s.inlineLink} href={href(locale,'candidate/sign-in',new URLSearchParams({next:href(locale,'jobs/'+id)+'#fit'}))}>{t(locale,'signIn')} <ArrowRight size={15}/></Link></>}
     </div></div><p className={s.notice}>{copy.fitNotice}</p>
    </Explanation>
  </>},
  {id:'terms',label:copy.terms,content:<>
    <Explanation label="04 / EMPLOYMENT TERMS" title={copy.conditionsTitle} lead={copy.declared}><div className={s.salaryHighlight}><Wallet size={21}/><div><span>{copy.pay}</span><strong>{salary}</strong></div></div><div className={s.termsWrap}><VacancyTerms locale={locale} job={job}/></div></Explanation>
    <Explanation label="04 / EMPLOYER BENEFITS" title={e(locale,'benefits')}><BulletRows values={benefits} empty={copy.noBenefits} lang={originalLocale}/></Explanation>
  </>},
  {id:'international',label:copy.international,content:<Explanation label="05 / INTERNATIONAL MOBILITY" title={copy.internationalTitle} lead={copy.declared}>
    <div className={s.fieldGrid}><Field label={copy.eligibility} value={t(locale,job.overseasApplicants==='yes'?'yes':job.overseasApplicants==='no'?'no':'unknown')}/><Field label={copy.sponsorship} value={t(locale,job.sponsorship==='yes'?'yes':job.sponsorship==='no'?'no':'unknown')}/><Field label={copy.relocation} value={t(locale,job.relocation==='yes'?'yes':job.relocation==='no'?'no':'unknown')}/><Field label={copy.location} value={fullLocation}/><Field label={e(locale,'workLocation')} value={workplace}/><Field label={copy.contract} value={contract}/></div><p className={s.notice}>{t(locale,'noVisaGuarantee')}</p>
   </Explanation>},
  {id:'employer',label:copy.employer,content:<Explanation label="06 / EMPLOYER WORLD" title={copy.employerTitle}>
    <div className={s.employerFeature}><div className={s.employerInitial} aria-hidden="true">{employer?employer.slice(0,1).toUpperCase():'J'}</div><div><h3>{employer}</h3><p>{fullLocation}</p></div></div>
    <div className={s.fieldGrid}><Field label={copy.company} value={employer||copy.noInfo}/><Field label={copy.location} value={fullLocation}/><Field label={copy.identity} value={identityExists?copy.identity:copy.identityUnverified}/></div>
    {identityExists?<p className={s.notice}>{t(locale,'identityReviewed')} · {str(identity,'validUntil')?formatDate(str(identity,'validUntil'),locale,undefined,true):copy.noInfo}</p>:<p className={s.notice}>{copy.identityUnverified}</p>}
    {external?<p className={s.sourceHint}>{str(job,'originalSourceName')}</p>:<Link href={destination} className={s.inlineLink}>{copy.viewEmployer}<ArrowUpRight size={17}/></Link>}
   </Explanation>},
  {id:'apply',label:copy.apply,content:<Explanation label="07 / APPLICATION CONCIERGE" title={copy.applyTitle} lead={copy.applyIntro}>
    <div className={s.steps}><span>01 · {e(locale,'answers')}</span><span>02 · {e(locale,'review')}</span><span>03 · {e(locale,'sent')}</span></div>
    {active?(external?<div id="application" className={s.applicationIntro}><FileCheck2 size={24} aria-hidden="true"/><p>{copy.applyIntro}</p><a className={s.primaryLink} href={applyUrl} rel="noopener noreferrer nofollow">{copy.startApplication}<ArrowUpRight size={16}/></a></div>:apply?<div id="application" className={s.applicationReal}>
      <p className={s.notice} role="status">{prepareError?errorText(locale,prepareError):sessionState==='restricted'?errorText(locale,'ACCOUNT_RESTRICTED'):sessionState==='verification_pending'?errorText(locale,'EMAIL_UNCONFIRMED'):t(locale,'profileControl')}</p>
      {preparation?.existing?<div className={s.innerPanel}><h3>{errorText(locale,'ALREADY_APPLIED')}</h3><Link className={s.primaryLink} href={href(locale,'career/applications/'+str(preparation.existing,'id'))}>{t(locale,'careerStudio')} <ArrowRight size={15}/></Link></div>:preparation?.profile?<ApplicationWizard key={str(preparation.profile,'user_id')+':'+id} locale={locale} job={job} profile={preparation.profile} documents={preparation.documents} draft={preparation.draft}/>:<div className={s.innerPanel}><h3>{e(locale,'profileRequired')}</h3><Link className={s.primaryLink} href={href(locale,sessionState==='onboarding'||sessionState==='active'?'onboarding':'candidate/sign-in',new URLSearchParams({intent:'candidate',next:applyUrl}))}>{t(locale,sessionState==='active'||sessionState==='onboarding'?'continue':'signIn')}<ArrowRight size={15}/></Link></div>}
     </div>:<div className={s.applicationIntro}><FileCheck2 size={24} aria-hidden="true"/><p>{copy.applyIntro}</p><Link className={s.primaryLink} href={applyUrl+'#apply'}>{copy.startApplication}<ArrowRight size={16}/></Link></div>):<p className={s.notice}>{copy.closed}</p>}
   </Explanation>}
 ];
 return <div className={s.page}>
   <div className={s.shell}>
    <nav className={s.breadcrumb} aria-label={t(locale,'menu')}><Link href={href(locale)}>JOBKIX</Link><span>/</span><Link href={returnUrl}>{t(locale,'findJobs')}</Link>{setting?<><span>/</span><Link href={href(locale,'sectors/'+setting)}>{group}</Link></>:null}<span>/</span><b>{copy.explore}</b></nav>
    <div className={s.hero}>
     <div className={s.heroText}><div className={s.heroTop}><span className={s.eyebrow}>{copy.tag}</span><span className={active?s.statusOpen:s.statusClosed}>{active?copy.open:copy.closed}</span></div>
      <h1 className={s.jobTitle}>{title}</h1><div className={s.employerLine}><span className={s.employerMonogram}>{employer?employer.slice(0,1).toUpperCase():'J'}</span>{external?<span>{employer}</span>:<Link href={destination}>{employer}</Link>}<span className={s.employerDivider}>·</span><MapPin size={15}/><span>{fullLocation}</span></div>
      <p className={s.heroLead}>{str(job,'description')||copy.explore}</p>
      <div className={s.heroTags}><span>{schedule}</span><span>{contract}</span><span>{workplace}</span>{occupation?<span>{OCCUPATION_NAMES[occupation][locale]}</span>:null}</div>
      <div className={s.heroBottom}><Link href={active?(external?applyUrl:applyUrl+'#apply'):href(locale,'jobs')} className={s.primaryLink}>{active?copy.continueApplication:t(locale,'findJobs')} <ArrowRight size={16}/></Link><Link className={s.ghostLink} href={returnUrl}>{t(locale,'back')}</Link><span className={s.heroDate}>{copy.published}: {formatDate(str(job,'publishedAt'),locale,undefined,true)}</span></div>
     </div><VacancySectorImage setting={setting} description={copy.editorial}/>
    </div>
    <div className={s.factStrip}><Fact label={copy.pay} value={salary} highlight/><Fact label={copy.contract} value={contract}/><Fact label={copy.schedule} value={schedule}/><Fact label={copy.location} value={fullLocation}/><Fact label={copy.deadline} value={deadline}/></div>
    <VacancyWorkspace locale={locale} panels={panes} active={active} alreadyApplied={Boolean(preparation?.existing)} applyHref={applyUrl} external={external} employerHref={external?null:destination} employerName={employer} applyOpen={apply} actions={<JobActions external={external} locale={locale} id={id} initialSaved={savedJob?.saved===true} initialVersion={savedJob?number(savedJob,'version')||0:0} initialCollection={savedJob?str(savedJob,'collection'):'default'} initialError={savedError}/>}/>
    <div className={s.relatedHeading}><div><span className={s.eyebrow}>JOBKIX / {copy.related}</span><h2>{copy.related}</h2><p>{copy.relatedIntro}</p></div><Link href={href(locale,'jobs')} className={s.ghostLink}>{t(locale,'findJobs')}<ArrowRight size={15}/></Link></div>
    {related?.length?<div className={s.relatedGrid}>{related.map(item=><div className={s.relatedCard} key={str(item,'id')}><div className={s.relatedArtwork} aria-hidden="true"><span>JOBKIX · {copy.explore}</span></div><JobCard job={item} locale={locale}/></div>)}</div>:<Empty locale={locale} problem={related===null}/>}
    <div className={s.careerCallout}><div><span className={s.eyebrow}>JOBKIX / CAREER OS</span><h2>{t(locale,'careerStudio')}</h2><p>{copy.applicationText}</p></div><Link href={href(locale,'career')} className={s.calloutLink}>{t(locale,'careerStudio')}<ArrowUpRight size={17}/></Link></div>
   </div>
 </div>;
}
