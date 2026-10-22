import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2,ArrowRight,MapPin,ShieldCheck,BriefcaseBusiness,MessageSquare } from 'lucide-react';
import { isLocale,type Locale,type FaultCode } from '../contracts';
import { employerFilters,employerParams } from '../employer-query';
import { approvedEmployerEdition } from '../employer-world';
import { directoryQuery,type DirectoryQuery } from '../directory';
import { employerSearch,publicEmployer,publicEdition,publicEditorialList,searchVacancies,employerSavedSearch,publicReputation,type DataRow } from '../server/repository';
import { getJobkixSession } from '../server/identity';
import { dependencyError } from '../server/http';
import { object } from '../validation';
import { filtersParams,searchHref } from '../discovery';
import { CountryOptions,CountryFlag } from '../Country';
import { countryName } from '../country-format';
import { resolvedEditorialMedia } from '../editorial-media';
import { h } from '../hiring-copy';
import { em } from '../employer-copy';
import { rp } from '../reputation-copy';
import { t,errorText,opportunityCount,formatDate } from '../i18n';
import { href } from '../routes';
import { Empty,SectionHeading,str,number } from '../components/Public';
import { EditorialOpening,EditorialSections,DiscoveryJourneys,ResourceLinks } from '../components/Discovery';
import { StudioPagination } from '../components/StudioPagination';
import { EmployerActions } from '../client/EmployerActions';
import { TaxonomyFilter } from '../client/TaxonomySelect';
import { SearchResults } from '../client/SearchResults';
import s from '../jobkix.module.css';
type Params=Record<string,string|string[]|undefined>;
const KINDS=[{kind:'household',scene:'households'},{kind:'institution',scene:'primary-schools'},{kind:'healthcare',scene:'pediatrics'},{kind:'hospitality',scene:'hospitality'},{kind:'ngo',scene:'ngo-child-welfare'},{kind:'public',scene:'public-education'},{kind:'multi_site',scene:'international-schools'}] as const;
const employerKind=(locale:Locale,value:unknown)=>h(locale,KINDS.find(row=>row.kind===value)?.kind||'institution');

export async function Employers({locale,search}:{locale:Locale;search:Params}){
 let query:DirectoryQuery,filters:Record<string,string>;
 try{query=directoryQuery(search);filters=employerFilters(search);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}
 const result=await employerSearch(filters,query.page).then(value=>({value,error:false}),()=>({value:null,error:true})),context=filtersParams(query.context),params=employerParams(filters,query.context),clear=filtersParams({...query.context,q:undefined,city:undefined,setting:undefined});
 const retryParams=new URLSearchParams(params);if(query.page>1)retryParams.set('page',String(query.page));
 function typeUrl(kind:string){const next=new URLSearchParams(params);next.set('kind',kind);return href(locale,'employers',next);}
 return <>
  <div className={s.employerDirectoryOpening}><EditorialOpening locale={locale} title={em(locale,'directoryTitle')} description={em(locale,'intro')} scene="setting-international-schools" breadcrumb={[{label:em(locale,'directoryTitle'),href:href(locale,'employers',context)}]}>
   <form className={s.employerCommand} method="get" action={href(locale,'employers')} data-employer-command>
    {[...context].filter(([key])=>!['q','city','setting'].includes(key)).map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}
    <label className={`${s.field} ${s.employerQuery}`}>{em(locale,'employerQuery')}<input name="term" type="search" defaultValue={filters.q||''} maxLength={240}/></label>
    <div className={s.employerCommandFilters}>
     <label className={s.field}>{h(locale,'organizationType')}<select name="kind" defaultValue={filters.kind||''}><option value="">{t(locale,'any')}</option>{KINDS.map(({kind})=><option value={kind} key={kind}>{h(locale,kind)}</option>)}</select></label>
     <label className={s.field}>{t(locale,'country')}<select name="country" defaultValue={filters.country||''}><option value="">{t(locale,'any')}</option><CountryOptions locale={locale}/></select></label>
     <label className={s.field}>{t(locale,'city')}<input name="city" defaultValue={filters.city||''} maxLength={180}/></label>
     <TaxonomyFilter locale={locale} kind="setting" name="setting" label={t(locale,'sectors')} initialValue={filters.setting||''}/>
     <label className={s.field}>{em(locale,'hiring')}<select name="hiring" defaultValue={filters.hiring||''}><option value="">{t(locale,'any')}</option><option value="yes">{t(locale,'yes')}</option><option value="no">{t(locale,'no')}</option></select></label>
    </div>
    <div className={s.inlineActions}><button className={s.button} type="submit">{em(locale,'searchEmployers')}<ArrowRight size={17} aria-hidden="true"/></button><Link className={s.textLink} href={href(locale,'employers',clear)}>{t(locale,'clearFilters')}</Link></div>
   </form>
  </EditorialOpening></div>
  <section className={s.section}><div className={s.container}><SectionHeading title={em(locale,'types')}/><nav className={s.employerTypes} aria-label={em(locale,'types')}>{KINDS.map(({kind,scene})=><Link href={typeUrl(kind)} key={kind} aria-current={filters.kind===kind?'page':undefined}><picture><source media="(max-width:767px)" srcSet={'/jobkix/editorial/setting-'+scene+'-mobile.webp'}/><img src={'/jobkix/editorial/setting-'+scene+'.webp'} alt="" width={450} height={300} loading="lazy"/></picture><strong>{h(locale,kind)}</strong><ArrowRight size={17} aria-hidden="true"/></Link>)}</nav></div></section>
  <section className={`${s.section} ${s.sectionSoft}`} id="employers-results"><div className={s.container}><SectionHeading title={em(locale,'results')} description={result.value?new Intl.NumberFormat(locale).format(result.value.total):undefined}/>
   {result.value?.items.length?<div className={s.employerCards}>{result.value.items.map(employer=><article key={str(employer,'id')} data-employer-id={str(employer,'id')}><Building2 aria-hidden="true"/><div><span className={s.eyebrow}>{employerKind(locale,employer.kind)}</span><h2><Link href={href(locale,'employers/'+str(employer,'id'),context)}>{str(employer,'name')}</Link></h2><p><MapPin size={15} aria-hidden="true"/> {[str(employer,'city'),countryName(str(employer,'country'),locale)].filter(Boolean).join(' · ')}</p><p className={s.authoredText} lang={str(employer,'originalLocale')||undefined} dir={employer.originalLocale==='ar'?'rtl':'auto'}>{Array.from(str(employer,'description')).slice(0,320).join('')}{Array.from(str(employer,'description')).length>320?'…':''}</p><p>{opportunityCount(locale,number(employer,'liveVacancies')||0)}</p>{employer.identityReview?<p><ShieldCheck size={16} aria-hidden="true"/>{t(locale,'identityReviewed')}</p>:null}<Link className={s.textLink} href={href(locale,'employers/'+str(employer,'id'),context)}>{em(locale,'profile')}<ArrowRight size={17} aria-hidden="true"/></Link></div></article>)}</div>:<Empty locale={locale} problem={result.error} title={result.error?undefined:em(locale,'empty')} description={result.error?undefined:em(locale,'emptyHelp')}>{result.error?<a className={s.textLink} href={href(locale,'employers',retryParams)}>{t(locale,'retry')}</a>:<Link className={s.textLink} href={href(locale,'employers',clear)}>{t(locale,'clearFilters')}</Link>}</Empty>}
   {result.value?<StudioPagination locale={locale} path="employers" search={search} result={result.value}/>:null}
  </div></section>
  <section className={s.section}><div className={s.container}><SectionHeading title={em(locale,'practical')}/><div className={s.employerGuidance}>
   <article><ShieldCheck aria-hidden="true"/><h3>{t(locale,'identityReviewed')}</h3><p>{em(locale,'noGuarantee')}</p><Link className={s.textLink} href={href(locale,'trust',context)}>{t(locale,'trust')}<ArrowRight size={16} aria-hidden="true"/></Link></article>
   <article><BriefcaseBusiness aria-hidden="true"/><h3>{em(locale,'compare')}</h3><p>{em(locale,'compareHelp')}</p><Link className={s.textLink} href={searchHref(locale,query.context)}>{t(locale,'findJobs')}<ArrowRight size={16} aria-hidden="true"/></Link></article>
   <article><MapPin aria-hidden="true"/><h3>{em(locale,'locations')}</h3><p>{em(locale,'locationHelp')}</p><Link className={s.textLink} href={href(locale,'countries',context)}>{t(locale,'countries')}<ArrowRight size={16} aria-hidden="true"/></Link></article>
  </div></div></section><DiscoveryJourneys locale={locale} context={context}/>
 </>;
}

export async function EmployerProfile({locale,id,search,preview}:{locale:Locale;id:string;search:Params;preview?:DataRow}){
 let employer:DataRow|null;
 try{employer=await publicEmployer(id);}catch(error){return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}><Link className={s.textLink} href={href(locale,'employers')}>{em(locale,'directoryTitle')}</Link></Empty>;}
 if(!employer)notFound();let query:DirectoryQuery;
 try{query=directoryQuery(search);}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}
 const filters={...query.context,organizationId:id,page:String(query.page)},[edition,jobs,resources,reputation]=await Promise.allSettled([preview?Promise.resolve(preview):publicEdition('employer/'+id,locale),searchVacancies(filters),publicEditorialList('guide',locale,'hiring-'),publicReputation('review',locale,{organizationId:id},1)]),published=approvedEmployerEdition(edition.status==='fulfilled'?edition.value:null,employer),sections=Array.isArray(published?.sections)?published.sections.map(object):[],cover=resolvedEditorialMedia(sections.find(row=>row.id==='opening')?._image),context=filtersParams(query.context),name=str(employer,'name'),place=[str(employer,'city'),countryName(str(employer,'country'),locale)].filter(Boolean).join(' · ');
 let authenticated=false,saved=false,fault:FaultCode|null=null,actorKey='anonymous';
 try{const session=await getJobkixSession();authenticated=session.state==='active';actorKey=session.state==='active'?session.userId:session.state;if(authenticated)saved=Boolean(await employerSavedSearch(id));if(session.state==='restricted')fault='ACCOUNT_RESTRICTED';}catch{fault='DEPENDENCY_UNAVAILABLE';}
 const authoredLanguage=str(employer,'originalLocale'),descriptionLocale=isLocale(authoredLanguage)?authoredLanguage:undefined;
 const review=employer.identityReview?object(employer.identityReview):null,reviewPath=href(locale,'reviews',new URLSearchParams({...Object.fromEntries(context),organizationId:id}));
 return <>
  <div className={s.employerProfileOpening}><EditorialOpening locale={locale} title={name} description={str(employer,'description')} descriptionLocale={descriptionLocale} scene={null} image={cover} breadcrumb={[{label:em(locale,'directoryTitle'),href:href(locale,'employers',context)},{label:name,href:href(locale,'employers/'+id,context)}]}><div className={s.inlineActions}><span className={s.chip}><Building2 size={16} aria-hidden="true"/>{employerKind(locale,employer.kind)}</span><CountryFlag code={str(employer,'country')}/><span>{place}</span></div></EditorialOpening></div>
  <section className={`${s.container} ${s.employerProfileHeader}`} aria-label={em(locale,'atGlance')}><div className={s.panel}>
   <div className={s.employerIdentityActions}><div><h2>{em(locale,'atGlance')}</h2><p>{opportunityCount(locale,number(employer,'liveVacancies')||0)}</p>{review?<p className={s.metadataLine}><ShieldCheck size={17} aria-hidden="true"/>{t(locale,'identityReviewed')} · <time dateTime={str(review,'validUntil')}>{formatDate(str(review,'validUntil'),locale,undefined,true)}</time></p>:null}</div><a className={s.button} href="#positions">{t(locale,'findJobs')}<ArrowRight size={17} aria-hidden="true"/></a></div>
   {!preview?<EmployerActions key={id+':'+actorKey+':'+saved} locale={locale} id={id} authenticated={authenticated} initialSaved={saved} fault={fault}/>:null}
  </div></section>
  <nav className={`${s.container} ${s.worldNavigation}`} aria-label={name}>{[['employer-about',em(locale,'workplace')],['positions',t(locale,'findJobs')],['employer-locations',em(locale,'locations')],['employer-reviews',em(locale,'reviews')]].map(([anchor,label])=><a key={anchor} href={'#'+anchor}>{label}</a>)}</nav>
  <section className={s.section} id="employer-about"><div className={`${s.container} ${s.employerAbout}`}><div><SectionHeading title={em(locale,'workplace')}/><p className={s.authoredText} lang={str(employer,'originalLocale')} dir={employer.originalLocale==='ar'?'rtl':'auto'}>{str(employer,'description')}</p></div><aside className={s.panel}><ShieldCheck aria-hidden="true"/><h3>{t(locale,'trust')}</h3><p>{em(locale,'noGuarantee')}</p><Link className={s.textLink} href={href(locale,'trust',context)}>{t(locale,'trust')}<ArrowRight size={16} aria-hidden="true"/></Link></aside></div></section>
  <EditorialSections locale={locale} edition={published} failed={edition.status==='rejected'}/>
  <div id="positions"><SearchResults locale={locale} filters={filters} initialResult={jobs.status==='fulfilled'?jobs.value:null} initialError={jobs.status==='rejected'?'DEPENDENCY_UNAVAILABLE':null} embeddedEmployer={name}/></div>
  <section className={`${s.section} ${s.sectionSoft}`} id="employer-locations"><div className={s.container}><SectionHeading title={em(locale,'locations')} description={em(locale,'locationHelp')}/>{jobs.status==='fulfilled'&&jobs.value.items.length?<div className={s.cityCards}>{Array.from(new Set(jobs.value.items.map(job=>str(job,'country')+'|'+str(job,'city')))).map(location=>{const [country,city]=location.split('|');return <Link key={location} href={searchHref(locale,filters,{destination:country,city,page:null})}><MapPin aria-hidden="true"/><div><h3>{city||countryName(country,locale)}</h3><p>{countryName(country,locale)}</p></div><ArrowRight size={17} aria-hidden="true"/></Link>;})}</div>:<Empty locale={locale} problem={jobs.status==='rejected'}/>}</div></section>
  <section className={s.section} id="employer-reviews"><div className={s.container}><SectionHeading title={em(locale,'reviews')} description={em(locale,'reviewsHelp')} action={<Link className={s.textLink} href={reviewPath}>{em(locale,'reviewDirectory')}<ArrowRight size={17} aria-hidden="true"/></Link>}/>
   {reputation.status==='rejected'?<Empty locale={locale} problem><Link className={s.textLink} href={reviewPath}>{t(locale,'retry')}</Link></Empty>:reputation.value.items.length?<div className={s.employerReviewGrid}>{reputation.value.items.slice(0,3).map(row=><article key={str(row,'id')} className={s.reviewCard}><MessageSquare aria-hidden="true"/><span className={s.eyebrow}>{rp(locale,'selfReported')}</span>{typeof row.rating==='number'?<p className={s.chip}>{new Intl.NumberFormat(locale).format(row.rating)} / {new Intl.NumberFormat(locale).format(5)}</p>:null}<p className={s.authoredText} lang={str(row,'originalLocale')} dir={row.originalLocale==='ar'?'rtl':'auto'}>{str(row,'body')}</p><time className={s.metadataLine} dateTime={str(row,'reviewedAt')}>{formatDate(str(row,'reviewedAt'),locale,undefined,true)}</time></article>)}</div>:<Empty locale={locale} title={em(locale,'reviews')} description={em(locale,'reviewPending')}/>}
  </div></section><ResourceLinks locale={locale} result={resources.status==='fulfilled'?resources.value:null} failed={resources.status==='rejected'}/><DiscoveryJourneys locale={locale} context={context}/>
 </>;
}
