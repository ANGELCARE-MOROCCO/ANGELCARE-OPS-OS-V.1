import Link from 'next/link';
import { BookOpen,Search,GraduationCap,FileText,Globe2,MessagesSquare,Compass,ArrowRight,UserRound,CalendarDays,ClipboardList } from 'lucide-react';
import type { Locale } from '../contracts';
import { directoryQuery,type DirectoryQuery } from '../directory';
import { filtersParams } from '../discovery';
import { publicEditorialList } from '../server/repository';
import { href } from '../routes';
import { t,errorText,formatDate } from '../i18n';
import { resourceText as r } from '../resource-copy';
import { screenName } from '../screen-copy';
import { Empty,SectionHeading,SettingTiles,str } from '../components/Public';
import { EditorialOpening } from '../components/Discovery';
import { EditorialFigure } from '../components/EditorialImage';
import s from '../jobkix.module.css';
const TOPICS=[['career',Compass],['skills',GraduationCap],['interview',MessagesSquare],['cv',FileText],['abroad',Globe2]] as const;
const TOOLS=[['C06','career/passport',UserRound],['C07','career/cv',FileText],['C04','career/applications',ClipboardList],['C08','career/interviews',CalendarDays]] as const;
export async function Resources({locale,search}:{locale:Locale;search:Record<string,string|string[]|undefined>}){
 let query:DirectoryQuery;try{query=directoryQuery(search);}catch{return <div className={s.container}><Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/></div>;}
 const result=await publicEditorialList('guide',locale,'',query.term,query.page).then(value=>({value,error:false}),()=>({value:null,error:true})),context=filtersParams(query.context);
 function libraryUrl(term=query.term,page=1){const params=new URLSearchParams(context);if(term)params.set('term',term);if(page>1)params.set('page',String(page));return href(locale,'resources',params);}
 return <><EditorialOpening locale={locale} title={r(locale,'title')} description={r(locale,'intro')} scene="setting-digital-learning" breadcrumb={[{label:t(locale,'resources'),href:href(locale,'resources')}]}/>
  <section className={`${s.container} ${s.resourceSearchPanel}`}><form className={s.directorySearch} action={href(locale,'resources')} method="get">{Array.from(context).map(([key,value])=><input type="hidden" key={key} name={key} value={value}/>)}<label><span>{r(locale,'search')}</span><input type="search" name="term" defaultValue={query.term} maxLength={240}/></label><button className={s.button} type="submit"><Search size={18} aria-hidden="true"/>{t(locale,'search')}</button>{query.term?<Link className={s.textLink} href={libraryUrl('')}>{t(locale,'clearFilters')}</Link>:null}</form></section>
  <section className={s.section}><div className={s.container}><SectionHeading title={r(locale,'topics')}/><nav className={s.resourceTopics} aria-label={r(locale,'topics')}>{TOPICS.map(([key,Icon])=><Link key={key} href={libraryUrl(r(locale,key))}><Icon aria-hidden="true"/><span>{r(locale,key)}</span><ArrowRight size={16} aria-hidden="true"/></Link>)}</nav></div></section>
  <section className={s.section}><div className={s.container}><SectionHeading title={r(locale,'latest')} description={query.term||undefined}/>{result.value?.items.length?<div className={s.guideGrid}>{result.value.items.map(item=><article className={s.guideCard} key={str(item,'id')}><Link href={href(locale,'resources/'+encodeURIComponent(str(item,'slug')),context)}><EditorialFigure value={item._image}/><div className={s.guideCardCopy}><span className={s.eyebrow}><BookOpen size={15} aria-hidden="true"/>{t(locale,'resources')}</span><h2>{str(item,'title')}</h2><p>{str(item,'summary')}</p><small>{str(item,'author')}{str(item,'publishedAt')?' · '+formatDate(str(item,'publishedAt'),locale,undefined,true):''}</small><span className={s.textLink}>{t(locale,'continue')}<ArrowRight size={16} aria-hidden="true"/></span></div></Link></article>)}</div>:<Empty locale={locale} problem={result.error} title={result.error?undefined:t(locale,'noPublishedContent')} description={result.error?undefined:query.term?r(locale,'search'):r(locale,'intro')}>{result.error?<a className={s.textLink} href={libraryUrl()}>{t(locale,'retry')}</a>:null}</Empty>}
   {result.value&&result.value.total>result.value.pageSize?<nav className={s.pagination} aria-label={t(locale,'resources')}>{query.page>1?<Link className={`${s.button} ${s.secondary}`} href={libraryUrl(query.term,query.page-1)}>{t(locale,'previous')}</Link>:null}<span>{new Intl.NumberFormat(locale).format(query.page)} / {new Intl.NumberFormat(locale).format(Math.ceil(result.value.total/result.value.pageSize))}</span>{query.page*result.value.pageSize<result.value.total?<Link className={s.button} href={libraryUrl(query.term,query.page+1)}>{t(locale,'next')}</Link>:null}</nav>:null}
  </div></section>
  <section className={`${s.section} ${s.sectionSoft}`}><div className={s.container}><SectionHeading title={r(locale,'tools')} description={r(locale,'toolsHelp')}/><div className={s.careerToolGrid}>{TOOLS.map(([id,path,Icon])=><Link href={href(locale,path)} key={id}><Icon aria-hidden="true"/><h3>{screenName(id,locale)}</h3><ArrowRight size={18} aria-hidden="true"/></Link>)}</div></div></section>
  <section className={s.section}><div className={s.container}><SectionHeading title={t(locale,'sixteenSettings')} description={r(locale,'intro')}/><SettingTiles locale={locale} rail/></div></section>
  <section className={s.sectionDark}><div className={`${s.container} ${s.resourceStudioBand}`}><div><span className={s.eyebrow}>{t(locale,'careerStudio')}</span><h2>{r(locale,'tools')}</h2><p>{r(locale,'toolsHelp')}</p></div><Link className={`${s.button} ${s.secondary}`} href={href(locale,'career')}>{t(locale,'careerStudio')}<ArrowRight size={18} aria-hidden="true"/></Link></div></section>
 </>;
}
