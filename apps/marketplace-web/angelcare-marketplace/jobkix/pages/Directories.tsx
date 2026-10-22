import Link from 'next/link';
import { ArrowRight,LayoutGrid,List,Search } from 'lucide-react';
import type { Locale } from '../contracts';
import { directoryQuery,directoryHref } from '../directory';
import { filtersParams } from '../discovery';
import { publicTaxonomy } from '../server/repository';
import { href } from '../routes';
import { t,opportunityCount,errorText } from '../i18n';
import { d,SETTING_DESCRIPTIONS } from '../discovery-copy';
import { settingExists } from '../taxonomy';
import { taxonomyScene } from '../editorial-assets';
import { SearchCommand } from '../client/SearchCommand';
import { Empty,SectionHeading,SettingTiles,str } from '../components/Public';
import { DiscoveryJourneys,EditorialOpening } from '../components/Discovery';
import s from '../jobkix.module.css';

/** P03/P05: individual mapped compositions; taxonomy records and counts remain canonical. */
export async function Directories({locale,kind,search}:{locale:Locale;kind:'setting'|'occupation';search:Record<string,string|string[]|undefined>}){
 let query;try{query=directoryQuery(search);}catch{return <div className={s.container}><Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}><Link className={s.textLink} href={href(locale,kind==='setting'?'sectors':'professions')}>{t(locale,'clearFilters')}</Link></Empty></div>;}
 const result=await publicTaxonomy(kind,locale,query.term,query.letter,query.page).then(value=>({value,error:false}),()=>({value:null,error:true}));
 const label=t(locale,kind==='setting'?'sectors':'professions'),base=kind==='setting'?'sectors':'professions',context=filtersParams(query.context),rows=result.value?.items||[];
 return <>
  <EditorialOpening locale={locale} title={d(locale,kind==='setting'?'settingsTitle':'professionsTitle')} description={d(locale,kind==='setting'?'settingsIntro':'professionsIntro')} scene={kind==='setting'?'setting-primary-schools':'setting-preschool'} breadcrumb={[{label,href:href(locale,base)}]}/>
  <div className={`${s.container} ${s.editorialCommand}`}><SearchCommand key={context.toString()} locale={locale} filters={query.context}/></div>
  {kind==='occupation'?<section className={s.section}><div className={s.container}><SectionHeading title={d(locale,'browseSettings')} description={d(locale,'relatedContext')}/><SettingTiles locale={locale} rail/></div></section>:null}
  <section className={s.section}><div className={s.container}>
   <div className={s.directoryToolbar}><div><span className={s.eyebrow}>{kind==='setting'?'01 — 16':label}</span><h2>{label}</h2></div><div className={s.viewOptions}><Link href={directoryHref(locale,kind,query,{view:'grid'})} aria-current={query.view==='grid'?'page':undefined} aria-label={d(locale,'grid')}><LayoutGrid size={19} aria-hidden="true"/></Link><Link href={directoryHref(locale,kind,query,{view:'list'})} aria-current={query.view==='list'?'page':undefined} aria-label={d(locale,'list')}><List size={21} aria-hidden="true"/></Link></div></div>
   <form className={s.directorySearch} method="get" action={href(locale,base)}>{Array.from(context).map(([key,value])=><input type="hidden" key={key} name={key} value={value}/>)}{query.view==='list'?<input type="hidden" name="view" value="list"/>:null}<label><span>{d(locale,'directorySearch')}</span><input name="term" type="search" defaultValue={query.term} maxLength={240}/></label><button className={s.button} type="submit"><Search size={18} aria-hidden="true"/>{d(locale,kind==='setting'?'searchSettings':'searchProfessions')}</button>{query.term||query.letter?<Link className={s.textLink} href={directoryHref(locale,kind,query,{term:'',letter:'',page:1})}>{t(locale,'clearFilters')}</Link>:null}</form>
   {kind==='occupation'&&result.value?.letters.length?<nav className={s.alphabet} aria-label={d(locale,'alphabet')}><Link href={directoryHref(locale,kind,query,{letter:'',page:1})} aria-current={!query.letter?'page':undefined}>{d(locale,'all')}</Link>{result.value.letters.map(letter=><Link key={letter} href={directoryHref(locale,kind,query,{letter,page:1})} aria-current={query.letter===letter?'page':undefined}>{letter}</Link>)}</nav>:null}
   {rows.length?<div className={`${kind==='setting'?s.settingDirectory:s.professionDirectory} ${query.view==='list'?s.directoryList:''}`}>{rows.map(item=>{const key=str(item,'key'),scene=taxonomyScene(kind,key),description=kind==='setting'&&settingExists(key)?SETTING_DESCRIPTIONS[key][locale]:'';return <article className={s.directoryCard} key={key}><Link href={href(locale,base+'/'+key,context)}>{scene?<picture><source media="(max-width:767px)" srcSet={`/jobkix/editorial/${scene}-mobile.webp`}/><img src={`/jobkix/editorial/${scene}.webp`} alt="" width={450} height={300} loading="lazy"/></picture>:null}<div className={s.directoryCardCopy}><span className={s.directoryIndex}>{kind==='setting'?new Intl.NumberFormat(locale,{minimumIntegerDigits:2}).format(Number(item.sortOrder)):null}</span><h3>{str(item,'name')}</h3>{description?<p>{description}</p>:null}{typeof item.opportunityCount==='number'?<small>{opportunityCount(locale,item.opportunityCount)}</small>:null}<span className={s.directoryArrow}><span className={s.srOnly}>{d(locale,kind==='setting'?'exploreWorld':'exploreProfession')}</span><ArrowRight size={18} aria-hidden="true"/></span></div></Link></article>;})}</div>:<Empty locale={locale} problem={result.error} title={result.error?undefined:d(locale,'directoryEmpty')} description={result.error?undefined:d(locale,'directoryHelp')}>{result.error?<a className={s.textLink} href={directoryHref(locale,kind,query)}>{t(locale,'retry')}</a>:null}</Empty>}
   {result.value&&result.value.total>result.value.pageSize?<nav className={s.pagination} aria-label={label}>{query.page>1?<Link className={`${s.button} ${s.secondary}`} href={directoryHref(locale,kind,query,{page:query.page-1})}>{t(locale,'previous')}</Link>:null}<span>{new Intl.NumberFormat(locale).format(query.page)} / {new Intl.NumberFormat(locale).format(Math.ceil(result.value.total/result.value.pageSize))}</span>{query.page*result.value.pageSize<result.value.total?<Link className={s.button} href={directoryHref(locale,kind,query,{page:query.page+1})}>{t(locale,'next')}</Link>:null}</nav>:null}
  </div></section><DiscoveryJourneys locale={locale}/>
 </>;
}
