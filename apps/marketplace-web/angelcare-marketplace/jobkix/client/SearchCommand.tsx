'use client';
import { useRef,useState,useTransition,type FormEvent } from 'react';
import {useJobkixRouter as useRouter} from './useJobkixRouter';
import Link from 'next/link';
import { Search,Globe2 } from 'lucide-react';
import type { Locale } from '../contracts';
import { CountryOptions,ConnectionCountry } from '../Country';
import { SETTINGS } from '../taxonomy';
import { SETTING_NAMES } from '../taxonomy-copy';
import { FILTER_KEYS,readFilters,searchHref,type SearchFilters } from '../discovery';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import s from '../jobkix.module.css';
import { announceJobkixNavigation } from './navigation-buffer-events';
export function SearchCommand({locale,filters={},mode='candidate',target='jobs',savedSearchId}:{locale:Locale;filters?:SearchFilters;mode?:'candidate'|'hirer';target?:'jobs'|'career/discovery';savedSearchId?:string}){
 const [reach,setReach]=useState(filters.reach||'worldwide');
 const form=useRef<HTMLFormElement>(null),[invalid,setInvalid]=useState(false);
 const router=useRouter(),[pending,startNavigation]=useTransition();
 function formFilters(element:HTMLFormElement){const params=new URLSearchParams();for(const [key,value] of new FormData(element)){if(typeof value==='string'&&value)params.set(key,value);}return readFilters(params);}
 function destination(next:SearchFilters){const url=searchHref(locale,next,{},target);return savedSearchId&&target==='career/discovery'?url+(url.includes('?')?'&':'?')+new URLSearchParams({editSearch:savedSearchId}):url;}
 function navigate(event:FormEvent<HTMLFormElement>){if(mode!=='candidate')return;event.preventDefault();try{const next=formFilters(event.currentTarget);setInvalid(false);const target=destination(next);announceJobkixNavigation(target);startNavigation(()=>router.push(target));}catch{setInvalid(true);}}
 function advanced(){if(!form.current)return;try{const next=formFilters(form.current);setInvalid(false);const target=destination(next)+'#results';announceJobkixNavigation(target);startNavigation(()=>router.push(target));}catch{setInvalid(true);}}
 return <div className={s.command} id="jobkix-search-command"><div className={s.commandTabs}>
  <Link href={href(locale)} aria-current={mode==='candidate'?'page':undefined}>{t(locale,'findJobs')}</Link><Link href={href(locale,'for-employers')} aria-current={mode==='hirer'?'page':undefined}>{t(locale,'hireTalent')}</Link><Link href={href(locale,'professions')}>{t(locale,'professions')}</Link>
 </div><form ref={form} action={href(locale,mode==='candidate'?target:'for-employers')} method="get" onSubmit={navigate}>
  {FILTER_KEYS.filter(key=>!['origin','q','setting','reach','destination','city','page'].includes(key)).map(key=>filters[key]?<input type="hidden" key={key} name={key} value={filters[key]}/>:null)}
  <div className={s.commandFields}>
   <label><span>1 · {t(locale,'country')}</span><small>{t(locale,'origin')}</small><select name="origin" required defaultValue={filters.origin||''}><option value="">{t(locale,'country')}</option><CountryOptions locale={locale}/></select></label>
   <label><span>2 · {t(locale,'keyword')}</span><small>{t(locale,'keywordHelp')}</small><input name="q" defaultValue={filters.q||''} placeholder={t(locale,'keyword')} maxLength={300}/></label>
   <label><span>3 · {t(locale,'sectors')}</span><small>{t(locale,'chooseSetting')}</small><select name="setting" defaultValue={filters.setting||''}><option value="">{t(locale,'any')}</option>{SETTINGS.map(([id])=><option key={id} value={id}>{SETTING_NAMES[id][locale]}</option>)}</select></label>
   <button className={`${s.button} ${s.coral}`} type="submit" disabled={pending}><Search size={18} aria-hidden="true"/>{t(locale,pending?'loading':mode==='candidate'?'search':'hireTalent')}</button>
  </div><div className={s.commandFields} style={{marginBlockStart:18}}>
   <label><span>{t(locale,'searchArea')}</span><select name="reach" value={reach} onChange={event=>setReach(event.target.value)}><option value="domestic">{t(locale,'domestic')}</option><option value="abroad">{t(locale,'international')}</option><option value="worldwide">{t(locale,'worldwide')}</option></select></label>
   <label><span>{t(locale,'destination')}</span><select name="destination" defaultValue={filters.destination||''}><option value="">{t(locale,'any')}</option><CountryOptions locale={locale}/></select></label>
   <label><span>{t(locale,'city')}</span><input name="city" defaultValue={filters.city||''} maxLength={180}/></label>
  </div>{invalid?<p className={s.notice} role="alert">{errorText(locale,'INVALID_INPUT')}</p>:null}<div className={s.commandMeta}><span><Globe2 size={14} aria-hidden="true"/> {t(locale,'detectedCountry')}: <ConnectionCountry locale={locale}/></span><button className={s.commandAdvanced} type="button" disabled={pending} onClick={advanced}>{t(locale,'advancedFilters')}</button></div>
 </form></div>;
}
