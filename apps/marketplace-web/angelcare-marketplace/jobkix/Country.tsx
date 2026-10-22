'use client';
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import { Globe2 } from 'lucide-react';
import type { Locale } from './contracts';
import { t } from './i18n';
import type { CountryLabel } from './country-format';
import s from './jobkix.module.css';
const Connection=createContext<{code:string|null;loading:boolean;locale:Locale;countries:CountryLabel[]}>({code:null,loading:false,locale:'en',countries:[]});
export function CountryProvider({initialDetected,locale,countries,children}:{initialDetected:string|null;locale:Locale;countries:CountryLabel[];children:ReactNode}){
 const [code,setCode]=useState(initialDetected),[loading,setLoading]=useState(!initialDetected);
 useEffect(()=>{
  if(initialDetected){setCode(initialDetected);setLoading(false);return;}
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5000);let active=true;
  void fetch('/api/angelcare-marketplace/public/country',{cache:'no-store',signal:controller.signal}).then(async response=>{
   if(!response.ok)throw Error('unavailable');const value:unknown=await response.json();
   if(active && value && typeof value==='object' && 'code' in value && typeof value.code==='string' && /^[A-Z]{2}$/.test(value.code))setCode(value.code);
  }).catch(()=>{if(active)setCode(null);}).finally(()=>{if(active)setLoading(false);clearTimeout(timeout);});
  return()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[initialDetected]);
 return <Connection.Provider value={{code,loading,locale,countries}}>{children}</Connection.Provider>;
}
export const useConnectionCountry=()=>useContext(Connection);
function FlagImage({code}:{code:string}){const [failed,setFailed]=useState(false);return <span className={s.flag} aria-hidden="true">{failed?<Globe2/>:<img src={`/angelcare-marketplace/visitor-country/flags/${code.toLowerCase()}.svg`} width={24} height={18} alt="" onError={()=>setFailed(true)}/>}</span>;}
export function CountryFlag({code}:{code:string|null}){return code?<FlagImage code={code} key={code}/>:<span className={s.flag} aria-hidden="true"><Globe2/></span>;}
export function ConnectionCountry({locale}:{locale:Locale}){const {code,loading,countries}=useConnectionCountry();return <span className={s.countryIndicator} title={t(locale,'countryExplanation')} aria-busy={loading}><CountryFlag code={code}/><span>{code?countries.find(row=>row.code===code)?.name||code:t(locale,'countryUnknown')}</span></span>;}
export function CountryOptions({locale}:{locale:Locale}){const {countries}=useConnectionCountry();return <>{countries.map(({code,name})=><option lang={locale} key={code} value={code}>{name}</option>)}</>;}
