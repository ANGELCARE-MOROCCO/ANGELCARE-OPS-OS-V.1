'use client';
import { CommandForm } from './CommandForm';
import { useEffect,useRef,useState,useTransition,type FormEvent,type ReactNode } from 'react';
import {useJobkixRouter as useRouter} from './useJobkixRouter';
import Link from 'next/link';
import { BookmarkPlus,SlidersHorizontal,X } from 'lucide-react';
import { JobkixFault,type FaultCode,type Locale } from '../contracts';
import { FILTER_KEYS,filtersParams,readFilters,searchHref as publicSearchHref,type FilterKey,type SearchFilters } from '../discovery';
import type { SearchResult,DataRow } from '../server/repository';
import { object } from '../validation';
import { AGE_COHORTS } from '../taxonomy';
import { AGE_NAMES } from '../age-copy';
import { h } from '../hiring-copy';
import { TaxonomyFilter } from './TaxonomySelect';
import { CountryOptions } from '../Country';
import { t,errorText,LANGUAGE_NAMES,opportunityCount } from '../i18n';
import { e,employmentLabel } from '../experience-copy';
import { href } from '../routes';
import { Empty,JobCard,str,number } from '../components/Public';
import { readResponse,useCommand } from './commands';
import s from '../jobkix.module.css';

export function SearchResults({locale,filters,initialResult,initialError,studio=false,savedSearch=null,embeddedEmployer}:{locale:Locale;filters:SearchFilters;initialResult:SearchResult|null;initialError:FaultCode|null;studio?:boolean;savedSearch?:DataRow|null;embeddedEmployer?:string}){
 const router=useRouter(),[navigating,startNavigation]=useTransition();
 const query=filtersParams(filters).toString();
 const searchUrl=(next:SearchFilters,changes:Partial<Record<FilterKey,string|null>>={})=>{const url=publicSearchHref(locale,next,changes,studio?'career/discovery':'jobs');return studio&&savedSearch?url+(url.includes('?')?'&':'?')+new URLSearchParams({editSearch:str(savedSearch,'id')}):url;};
 const [lastValid,setLastValid]=useState<{query:string;data:SearchResult}|null>(initialResult?{query,data:initialResult}:null);
 const [recovered,setRecovered]=useState<{query:string;data:SearchResult}|null>(null),[retrying,setRetrying]=useState(false),[retryError,setRetryError]=useState<FaultCode|null>(null);
 const request=useRef<AbortController|null>(null),generation=useRef(0);
 const [saveOpen,setSaveOpen]=useState(false),[saved,setSaved]=useState(false),[inputError,setInputError]=useState(false),command=useCommand();
 useEffect(()=>{request.current?.abort();generation.current++;setRetrying(false);setRetryError(null);setRecovered(null);setSaved(false);if(initialResult)setLastValid({query,data:initialResult});},[query,initialResult]);
 useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
 const current=initialResult||(recovered?.query===query?recovered.data:null);
 const data=current||lastValid?.data||null,stale=Boolean(!current&&lastValid);
 const problem=current?null:retryError||initialError;
 async function retry(){
  request.current?.abort();const abort=new AbortController();request.current=abort;const revision=++generation.current;setRetrying(true);setRetryError(null);
  try{const response=await readResponse(await fetch('/api/jobkix/search?'+query,{signal:abort.signal,cache:'no-store'}));const result=object(response.result);
   if(!Array.isArray(result.items)||!Number.isSafeInteger(result.total)||typeof result.page!=='number'||typeof result.pageSize!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
   const checked:SearchResult={items:result.items.map(object),total:Number(result.total),page:result.page,pageSize:result.pageSize};
   if(revision===generation.current){setRecovered({query,data:checked});setLastValid({query,data:checked});}
  }catch(error){if(!abort.signal.aborted&&revision===generation.current)setRetryError(error instanceof JobkixFault?error.code:'DEPENDENCY_UNAVAILABLE');}
  finally{if(revision===generation.current)setRetrying(false);}
 }
 function submitFilters(event:FormEvent<HTMLFormElement>){event.preventDefault();const params=new URLSearchParams();for(const [key,value] of new FormData(event.currentTarget)){if(typeof value==='string'&&value)params.set(key,value);}try{const next=readFilters(params);setInputError(false);startNavigation(()=>router.push(searchUrl(next)));}catch{setInputError(true);}}
 async function saveSearch(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const result=await command.run('search.save',{id:savedSearch?.id||null,name:String(form.get('name')||''),filters,frequency:savedSearch?str(savedSearch,'frequency'):'off',enabled:savedSearch?savedSearch.enabled===true:true},savedSearch?number(savedSearch,'version')||0:0);if(result){setSaved(true);setSaveOpen(false);}}
 const select=(name:'workSchedule'|'contractType'|'workLocation',values:string[])=><label className={s.field}>{e(locale,name)}<select name={name} defaultValue={filters[name]||''}><option value="">{t(locale,'any')}</option>{values.map(value=><option key={value} value={value}>{employmentLabel(locale,value)}</option>)}</select></label>;
 const group=(label:string,keys:FilterKey[],children:ReactNode,initiallyOpen=false)=><details className={s.nativeTaxonomyFilter} open={initiallyOpen||keys.some(key=>Boolean(filters[key]))}><summary>{label}</summary><div className={s.filterGroupFields}>{children}</div></details>;
 return <section className={s.section} id="results"><div className={`${s.container} ${s.twoColumns} ${embeddedEmployer?s.embeddedEmployerResults:''}`}>
  <aside className={s.filters}><details className={s.filterDisclosure} open={!embeddedEmployer}><summary><SlidersHorizontal size={18} aria-hidden="true"/>{t(locale,'filters')}</summary><form method="get" key={query} onSubmit={submitFilters} action={href(locale,studio?'career/discovery':'jobs')}>
   {FILTER_KEYS.filter(key=>['q','reach','organizationId','sort'].includes(key)).map(key=>filters[key]?<input type="hidden" key={key} name={key} value={filters[key]}/>:null)}
   {group(t(locale,'country'),['origin','destination','city'],<><label className={s.field}>{t(locale,'origin')}<select name="origin" defaultValue={filters.origin||''}><option value="">{t(locale,'any')}</option><CountryOptions locale={locale}/></select></label>
   <label className={s.field}>{t(locale,'destination')}<select name="destination" defaultValue={filters.destination||''}><option value="">{t(locale,'any')}</option><CountryOptions locale={locale}/></select></label>
   <label className={s.field}>{t(locale,'city')}<input name="city" maxLength={180} defaultValue={filters.city||''}/></label></>,true)}
   <TaxonomyFilter locale={locale} kind="setting" name="setting" label={t(locale,'sectors')} initialValue={filters.setting||''}/>
   <TaxonomyFilter locale={locale} kind="occupation" name="occupation" label={t(locale,'professions')} initialValue={filters.occupation||''}/>
   {group(h(locale,'ageCohorts'),['ageCohort'],<label className={s.field}>{h(locale,'ageCohorts')}<select name="ageCohort" defaultValue={filters.ageCohort||''}><option value="">{t(locale,'any')}</option>{AGE_COHORTS.map(age=><option key={age} value={age}>{AGE_NAMES[age][locale]}</option>)}</select></label>)}
   {group(e(locale,'workSchedule'),['workSchedule','contractType','workLocation'],<>{select('workSchedule',['full_time','part_time','flexible'])}{select('contractType',['permanent','fixed_term','temporary','seasonal','internship','other'])}{select('workLocation',['on_site','remote','hybrid'])}</>)}
   {group(t(locale,'language'),['language'],<label className={s.field}>{t(locale,'language')}<input name="language" defaultValue={filters.language||''} maxLength={6} placeholder="en, fr, ar…" pattern="[a-z]{2,3}(-[A-Z]{2})?"/><small>{Object.values(LANGUAGE_NAMES).join(' · ')}</small></label>)}
   {group(t(locale,'abroad'),['sponsorship','relocation'],<>{(['sponsorship','relocation'] as const).map(key=><label className={s.field} key={key}>{t(locale,key)}<select name={key} defaultValue={filters[key]||''}><option value="">{t(locale,'any')}</option>{(['yes','no','unknown'] as const).map(value=><option key={value} value={value}>{t(locale,value)}</option>)}</select></label>)}</>)}
   {group(e(locale,'salaryMinimum'),['salaryMinimum','currency','salaryUnit'],<><label className={s.field}>{e(locale,'salaryMinimum')}<input type="number" name="salaryMinimum" min="0" max="1000000000" step="0.01" defaultValue={filters.salaryMinimum||''}/></label>
   <label className={s.field}>{e(locale,'currency')}<input name="currency" pattern="[A-Z]{3}" maxLength={3} defaultValue={filters.currency||''} placeholder="EUR"/></label>
   <label className={s.field}>{e(locale,'payPeriod')}<select name="salaryUnit" defaultValue={filters.salaryUnit||''}><option value="">{t(locale,'any')}</option>{['hour','day','week','month','year'].map(value=><option key={value} value={value}>{employmentLabel(locale,value)}</option>)}</select></label></>)}
   {inputError?<p className={s.notice} role="alert">{errorText(locale,'INVALID_INPUT')}</p>:null}<button type="submit" className={s.button} disabled={navigating}>{navigating?t(locale,'loading'):t(locale,'search')}</button><Link href={searchUrl({}, {origin:filters.origin||null,reach:filters.reach||null})} className={s.textLink}>{t(locale,'clearFilters')}</Link>
  </form></details></aside>
  <div aria-busy={navigating||retrying}>
   <div className={s.resultsHeader}><div><h2>{e(locale,'results')}</h2>{data?<p>{opportunityCount(locale,data.total)}</p>:null}</div><div className={s.inlineActions}>
    <label className={s.inlineSelect}>{t(locale,'sort')}<select value={filters.sort||'newest'} onChange={event=>startNavigation(()=>router.push(searchUrl(filters,{sort:event.target.value,page:null})))}><option value="newest">{t(locale,'newest')}</option><option value="relevance">{t(locale,'relevance')}</option></select></label>
    <button className={`${s.button} ${s.secondary}`} onClick={()=>setSaveOpen(value=>!value)} aria-expanded={saveOpen}><BookmarkPlus size={17} aria-hidden="true"/>{e(locale,'saveSearch')}</button>
   </div></div>
   <div className={s.chips}>{FILTER_KEYS.filter(key=>!['page','sort'].includes(key)&&filters[key]).map(key=><Link className={`${s.chip} ${s.removableChip}`} href={searchUrl(filters,{[key]:null,page:null})} key={key}>{key==='organizationId'&&embeddedEmployer?embeddedEmployer:filters[key]}<X size={14} aria-label={t(locale,'close')}/></Link>)}</div>
   {saveOpen?<CommandForm locale={locale} className={s.panel} onSubmit={saveSearch}><label className={s.field}>{e(locale,'searchName')}<input name="name" required maxLength={180} defaultValue={savedSearch?str(savedSearch,'name'):filters.q||t(locale,'findJobs')}/></label><button className={s.button} disabled={command.pending}>{command.pending?t(locale,'saving'):t(locale,'save')}</button><p className={s.notice}>{e(locale,'frequency')} · {e(locale,savedSearch?.frequency==='daily'?'daily':savedSearch?.frequency==='weekly'?'weekly':'off')}</p></CommandForm>:null}
   {saved?<p className={s.notice} role="status">{t(locale,'saved')}</p>:null}
   {command.error?<div className={s.notice} role="alert">{errorText(locale,command.error.code)}{command.error.code==='AUTHENTICATION_REQUIRED'?<Link className={s.textLink} href={href(locale,'candidate/sign-in',new URLSearchParams({next:searchUrl(filters)}))}>{t(locale,'signIn')}</Link>:null}</div>:null}
   {problem?<div className={s.notice} role="alert"><p>{stale?e(locale,'previousResults'):errorText(locale,problem)}</p><button className={`${s.button} ${s.secondary}`} onClick={retry} disabled={retrying}>{retrying?t(locale,'loading'):t(locale,'retry')}</button></div>:null}
   {data?.items.length?<div className={s.searchCards} data-results-current={!stale}>{data.items.map(job=><JobCard key={String(job.id)} job={job} locale={locale} returnTo={searchUrl(filters)}/>)}</div>:!problem?<Empty locale={locale}><Link className={s.textLink} href={searchUrl({}, {origin:filters.origin||null})}>{t(locale,'clearFilters')}</Link></Empty>:null}
   {data&&data.total>data.pageSize&&!stale?<nav className={s.pagination} aria-label={e(locale,'results')}>{data.page>1?<Link className={`${s.button} ${s.secondary}`} href={searchUrl(filters,{page:String(data.page-1)})}>{t(locale,'previous')}</Link>:null}<span>{new Intl.NumberFormat(locale).format(data.page)} / {new Intl.NumberFormat(locale).format(Math.ceil(data.total/data.pageSize))}</span>{data.page*data.pageSize<data.total?<Link className={s.button} href={searchUrl(filters,{page:String(data.page+1)})}>{t(locale,'next')}</Link>:null}</nav>:null}
  </div>
 </div></section>;
}
