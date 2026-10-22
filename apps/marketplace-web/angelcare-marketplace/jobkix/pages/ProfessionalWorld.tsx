import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight,BriefcaseBusiness,ClipboardCheck,Globe2 } from 'lucide-react';
import type { Locale } from '../contracts';
import { directoryQuery } from '../directory';
import { searchHref,filtersParams } from '../discovery';
import { publicTaxon,publicEdition,publicEditorialList,searchVacancies,relatedTaxonomy } from '../server/repository';
import { taxonomyScene } from '../editorial-assets';
import { resolvedEditorialMedia } from '../editorial-media';
import { settingExists } from '../taxonomy';
import { SETTING_DESCRIPTIONS,d } from '../discovery-copy';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import { e,employmentLabel } from '../experience-copy';
import { SearchCommand } from '../client/SearchCommand';
import { Empty,JobCard,SectionHeading,str } from '../components/Public';
import { EditorialOpening,DiscoveryJourneys,EditorialSections,RelatedTaxa,ResourceLinks } from '../components/Discovery';
import s from '../jobkix.module.css';

/** P04/P06: published career context + current canonical vacancies. No invented qualifications. */
export async function ProfessionalWorld({locale,kind,slug,search,preview}:{locale:Locale;kind:'setting'|'occupation';slug:string;search:Record<string,string|string[]|undefined>;preview?:Record<string,unknown>}){
 if(!/^[a-z0-9][a-z0-9-]{1,100}$/.test(slug))notFound();
 let query;try{query=directoryQuery(search);}catch{return <div className={s.container}><Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/></div>;}
 const record=await publicTaxon(kind,slug,locale).then(value=>({value,error:false}),()=>({value:null,error:true}));
 if(!record.value){if(!record.error)notFound();return <div className={s.container}><Empty locale={locale} problem><a className={s.textLink} href={href(locale,(kind==='setting'?'sectors/':'professions/')+slug,filtersParams(query.context))}>{t(locale,'retry')}</a></Empty></div>;}
 const filters={...query.context,[kind==='setting'?'setting':'occupation']:slug,page:'1'},base=kind==='setting'?'sectors':'professions',label=t(locale,kind==='setting'?'sectors':'professions'),name=str(record.value,'name');
 const [jobs,editorial,related,resources]=await Promise.allSettled([searchVacancies(filters),preview?Promise.resolve(preview):publicEdition(base+'/'+slug,locale),relatedTaxonomy(kind,slug,locale),publicEditorialList('guide',locale,(kind==='setting'?'sector-':'profession-')+slug+'-')]);
 const edition=editorial.status==='fulfilled'&&editorial.value?.kind===(kind==='setting'?'sector':'profession')?editorial.value:null,items=jobs.status==='fulfilled'?jobs.value.items:[],relatedItems=related.status==='fulfilled'?related.value:[];
 const scene=taxonomyScene(kind,slug),description=edition?str(edition,'summary'):kind==='setting'&&settingExists(slug)?SETTING_DESCRIPTIONS[slug][locale]:d(locale,'worldIntro');
 const opening=edition&&Array.isArray(edition.sections)?edition.sections.find(value=>value&&typeof value==='object'&&'id' in value&&value.id==='opening'):null;
 const customOpening=opening&&typeof opening==='object'&&'media' in opening&&Boolean(opening.media),image=opening&&typeof opening==='object'&&'_image' in opening?resolvedEditorialMedia(opening._image):null;
 const terms=Array.from(new Set(items.flatMap(job=>[str(job,'workSchedule'),str(job,'contractType'),str(job,'workLocation')]).filter(Boolean)));
 const opportunities=<section className={`${s.section} ${s.sectionSoft}`} id="opportunities"><div className={s.container}><SectionHeading title={t(locale,'featuredOpportunities')} description={name} action={<Link className={s.textLink} href={searchHref(locale,filters)}>{t(locale,'viewAllJobs')}<ArrowRight size={17} aria-hidden="true"/></Link>}/>{items.length?<div className={s.jobsGrid}>{items.slice(0,6).map(job=><JobCard locale={locale} job={job} key={str(job,'id')}/>)}</div>:<Empty locale={locale} problem={jobs.status==='rejected'}/>}</div></section>;
 return <>
  {preview?<p className={s.notice} role="status">{e(locale,'privatePreview')}</p>:null}
  <EditorialOpening locale={locale} title={name} description={description} scene={customOpening?null:scene} image={image} breadcrumb={[{label,href:href(locale,base)},{label:name,href:href(locale,base+'/'+slug)}]}><div className={s.inlineActions}><Link className={s.button} href={searchHref(locale,filters)}>{t(locale,'findJobs')}<ArrowRight size={17} aria-hidden="true"/></Link><a className={`${s.button} ${s.secondary}`} href="#overview">{d(locale,'careerPath')}</a></div></EditorialOpening>
  {kind==='setting'?<div className={`${s.container} ${s.editorialCommand}`}><SearchCommand key={filtersParams(filters).toString()} locale={locale} filters={filters}/></div>:null}
  <nav className={`${s.container} ${s.worldNavigation}`} aria-label={name}>{[['overview',d(locale,'overview')],['opportunities',t(locale,'featuredOpportunities')],['requirements',d(locale,'qualifications')],['world-related',d(locale,kind==='setting'?'roles':'environments')]].map(([id,label])=><a href={'#'+id} key={id}>{label}</a>)}</nav>
  {kind==='setting'?<section className={s.section} id="world-related"><div className={s.container}><SectionHeading title={d(locale,'roles')} description={d(locale,'relatedContext')}/>{relatedItems.length?<RelatedTaxa locale={locale} kind="occupation" rows={relatedItems}/>:<Empty locale={locale} problem={related.status==='rejected'} title={related.status==='rejected'?undefined:t(locale,'noPublishedContent')} description={related.status==='rejected'?undefined:d(locale,'noRelated')}><Link className={s.textLink} href={href(locale,'professions')}>{t(locale,'professions')}</Link></Empty>}</div></section>:null}
  {kind==='setting'?opportunities:null}
  <EditorialSections locale={locale} edition={edition} failed={editorial.status==='rejected'}/>
  {kind==='occupation'?<section className={`${s.section} ${s.sectionSoft}`} id="world-related"><div className={s.container}><SectionHeading title={d(locale,'environments')} description={d(locale,'relatedContext')}/>{relatedItems.length?<RelatedTaxa locale={locale} kind="setting" rows={relatedItems}/>:<Empty locale={locale} problem={related.status==='rejected'} title={related.status==='rejected'?undefined:t(locale,'noPublishedContent')} description={related.status==='rejected'?undefined:d(locale,'noRelated')}><Link className={s.textLink} href={href(locale,'sectors')}>{t(locale,'sectors')}</Link></Empty>}</div></section>:null}
  <section className={s.section} id="requirements"><div className={s.container}><div className={s.worldPractical}><div className={s.worldPracticalLead}><BriefcaseBusiness aria-hidden="true"/><h2>{d(locale,'contracts')}</h2><p>{d(locale,'contractHelp')}</p>{terms.length?<><small>{d(locale,'fromJobs')}</small><div className={s.chips}>{terms.map(term=><span className={s.chip} key={term}>{employmentLabel(locale,term)}</span>)}</div></>:null}<Link className={s.textLink} href={searchHref(locale,filters)}>{t(locale,'findJobs')}<ArrowRight size={17} aria-hidden="true"/></Link></div><div><ClipboardCheck aria-hidden="true"/><h2>{d(locale,'employerRequirements')}</h2><p>{d(locale,'requirementHelp')}</p>{items.some(job=>Array.isArray(job.requirements)&&job.requirements.length)?<div className={s.requirementSources}>{items.filter(job=>Array.isArray(job.requirements)&&job.requirements.length).slice(0,3).map(job=><div key={str(job,'id')}><h3><Link className={s.textLink} href={href(locale,'jobs/'+str(job,'id'))}>{str(job,'title')}</Link></h3><ul>{Array.isArray(job.requirements)?job.requirements.filter((value):value is string=>typeof value==='string').slice(0,3).map((value,index)=><li key={index}>{value}</li>):null}</ul></div>)}</div>:<p className={s.notice}>{jobs.status==='rejected'?errorText(locale,'DEPENDENCY_UNAVAILABLE'):t(locale,'noPublishedContent')}</p>}</div><div><Globe2 aria-hidden="true"/><h2>{t(locale,'abroad')}</h2><p>{t(locale,'noVisaGuarantee')}</p><Link className={s.textLink} href={searchHref(locale,filters,{reach:'abroad',page:null})}>{t(locale,'international')}<ArrowRight size={17} aria-hidden="true"/></Link></div></div></div></section>
  {kind==='occupation'?opportunities:null}
  <DiscoveryJourneys locale={locale}/><ResourceLinks locale={locale} result={resources.status==='fulfilled'?resources.value:null} failed={resources.status==='rejected'}/>
 </>;
}
