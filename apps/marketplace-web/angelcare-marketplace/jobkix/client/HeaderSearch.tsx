'use client';
import { useState,type FormEvent } from 'react';
import { Search,SlidersHorizontal,ChevronDown,Globe2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CountryOptions } from '../Country';
import { readFilters,searchHref } from '../discovery';
import { href } from '../routes';
import type { Locale } from '../contracts';
import { headerText } from '../header-copy';
import { errorText } from '../i18n';
import s from '../jobkix.module.css';
import { announceJobkixNavigation } from './navigation-buffer-events';

/** Client-only UI. Native search filters and searchHref remain the canonical authority. */
export function HeaderSearch({locale}:{locale:Locale}){
 const router=useRouter(),[invalid,setInvalid]=useState(false);
 const h=(key:Parameters<typeof headerText>[1])=>headerText(locale,key);
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{
   const form=new FormData(event.currentTarget),params=new URLSearchParams();
   for(const key of ['origin','q']){const v=form.get(key);if(typeof v==='string'&&v.trim())params.set(key,v.trim());}
   const filters=readFilters(params);
   setInvalid(false);const target=searchHref(locale,filters);announceJobkixNavigation(target);router.push(target);
  }catch{setInvalid(true);}
 }
 return <div className={s.pm5SearchWrap}>
  <form className={s.pm5Search} method="get" action={href(locale,'jobs')} role="search" onSubmit={submit}>
   <label className={s.pm5CountryField}><Globe2 size={19} aria-hidden="true"/><span className={s.srOnly}>{h('country')}</span><select name="origin" defaultValue="" aria-label={h('country')}><option value="">{h('allCountries')}</option><CountryOptions locale={locale}/></select><ChevronDown size={15} aria-hidden="true"/></label>
   <label className={s.pm5KeywordField}><Search size={21} aria-hidden="true"/><span className={s.srOnly}>{h('searchPlaceholder')}</span><input type="search" name="q" maxLength={300} placeholder={h('searchPlaceholder')} autoComplete="off"/></label>
   <button type="submit" className={s.pm5SearchSubmit}><Search size={19} aria-hidden="true"/><span>{h('searchJobs')}</span></button>
  </form>
  <a href={`${href(locale,'jobs')}#jobkix-search-command`} className={s.pm5Advanced}><SlidersHorizontal size={20} aria-hidden="true"/><span>{h('advanced')}</span></a>
  {invalid?<span role="alert" className={s.pm5SearchError}>{errorText(locale,'INVALID_INPUT')}</span>:null}
 </div>;
}
