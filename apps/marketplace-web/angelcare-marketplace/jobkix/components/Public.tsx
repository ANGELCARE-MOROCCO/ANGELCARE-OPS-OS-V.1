import Link from 'next/link';
import { ArrowRight,BriefcaseBusiness,MapPin,Globe2,TriangleAlert,Search } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { CountryFlag } from '../Country';
import { countryName } from '../country-format';
import { href,safeReturnTo } from '../routes';
import { t,formatDate,formatMoney } from '../i18n';
import { employmentLabel } from '../experience-copy';
import { SETTINGS } from '../taxonomy';
import { SETTING_NAMES } from '../taxonomy-copy';
import s from '../jobkix.module.css';
export const str=(row:DataRow,key:string)=>typeof row[key]==='string'?row[key]:'';
export const number=(row:DataRow,key:string)=>typeof row[key]==='number'?row[key]:null;
export function SectionHeading({title,description,action}:{title:string;description?:string;action?:ReactNode}){return <div className={s.sectionHeading}><div><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{action}</div>;}
export function PageHero({locale,title,description,eyebrow,children}:{locale:Locale;title:string;description?:string;eyebrow?:string;children?:ReactNode}){return <section className={s.pageHero}><div className={s.container}><nav className={s.breadcrumbs} aria-label={t(locale,'menu')}><Link href={href(locale)}>JOBKIX</Link><span aria-hidden="true">/</span><span>{title}</span></nav>{eyebrow?<span className={s.eyebrow}>{eyebrow}</span>:null}<h1>{title}</h1>{description?<p>{description}</p>:null}{children}</div></section>;}
export function Empty({locale,problem=false,title,description,children}:{locale:Locale;problem?:boolean;title?:string;description?:string;children?:ReactNode}){const Icon=problem?TriangleAlert:Search;return <div className={`${s.empty} ${problem?s.error:''}`} role={problem?'alert':undefined}><Icon aria-hidden="true"/><div><h3>{title||t(locale,problem?'unavailable':'noJobs')}</h3><p>{description||t(locale,problem?'inputPreserved':'noJobsHelp')}</p>{children}</div></div>;}
export function JobCard({locale,job,returnTo}:{locale:Locale;job:DataRow;returnTo?:string}){
 const id=str(job,'id'),pay=job.compensation && typeof job.compensation==='object' && !Array.isArray(job.compensation)?job.compensation:null;
 const payRow=pay?Object.fromEntries(Object.entries(pay)):null;
 const min=payRow?number(payRow,'minimum'):null,max=payRow?number(payRow,'maximum'):null,currency=payRow?str(payRow,'currency'):'';
 const salary=currency&&(min!==null||max!==null)?[min===null?'':formatMoney(min,currency,locale),max===null?'':formatMoney(max,currency,locale)].filter(Boolean).join(' – ')+' · '+employmentLabel(locale,payRow?str(payRow,'unit'):''):t(locale,'notDeclared');
 const country=str(job,'country'),destination=href(locale,'jobs/'+encodeURIComponent(id),returnTo?new URLSearchParams({returnTo:safeReturnTo(returnTo,locale,'jobs')}):undefined);
 return <article className={s.jobCard} data-vacancy-id={id}><div className={s.jobMeta}><BriefcaseBusiness aria-hidden="true"/><span>{str(job,'employerName')}</span></div><h3><Link href={destination}>{str(job,'title')}</Link></h3><div className={s.jobMeta}><MapPin aria-hidden="true"/><span>{[str(job,'city'),country?countryName(country,locale):''].filter(Boolean).join(', ')}</span></div><div className={s.chips}><span className={s.chip}>{employmentLabel(locale,str(job,'workSchedule'))}</span><span className={s.chip}>{employmentLabel(locale,str(job,'contractType'))}</span></div><div className={s.salary}>{salary}</div><div className={s.cardBottom}><Link className={s.button} href={destination}>{t(locale,'viewJob')}<ArrowRight size={15} aria-hidden="true"/></Link>{str(job,'publishedAt')?<small><time dateTime={str(job,'publishedAt')}>{formatDate(str(job,'publishedAt'),locale,undefined,true)}</time></small>:null}</div></article>;
}
export const SETTING_IMAGES:Readonly<Partial<Record<string,string>>>=Object.fromEntries(SETTINGS.map(([id])=>[id,'setting-'+id]));
export function SettingTiles({locale,rail=false,context}:{locale:Locale;rail?:boolean;context?:URLSearchParams}){return <div className={rail?s.worldRail:s.worldGrid}>{SETTINGS.map(([id])=><Link className={s.worldTile} href={href(locale,'sectors/'+id,context)} key={id}><picture><source media="(max-width:767px)" srcSet={`/jobkix/editorial/setting-${id}-mobile.webp`}/><img src={`/jobkix/editorial/setting-${id}.webp`} alt="" width={450} height={300} loading="lazy" style={{objectPosition:'50% 45%'}}/></picture><strong>{SETTING_NAMES[id][locale]}</strong></Link>)}</div>;}
export function CountryLinks({locale,codes}:{locale:Locale;codes:readonly string[]}){return <div className={s.geographyLinks}>{codes.map(code=><Link href={href(locale,'countries/'+code.toLowerCase())} key={code}><CountryFlag code={code}/><span>{countryName(code,locale)}</span><ArrowRight size={16} aria-hidden="true"/></Link>)}</div>;}
