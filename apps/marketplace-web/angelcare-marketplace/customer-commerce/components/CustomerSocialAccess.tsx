'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import type {CatalogLocale} from '../../catalog-discovery/types'
import {SOCIAL_PROVIDERS,type SocialProvider} from '../customer-social/contracts'
import {parseSocialReadiness,providerAvailable,socialFeedback,type SocialReadiness} from '../customer-social/access-feedback'
import {socialCopy} from '../customer-social/copy'
import {CustomerAppleUpdateNotice,appleUpdateCopy} from './CustomerAppleUpdateNotice'
import s from '../customer-social/social.module.css'
export function CustomerSocialAccess({locale,intent,returnTo,disabled=false}:{locale:CatalogLocale;intent:'login'|'register';returnTo:string;disabled?:boolean}){
 const t=socialCopy(locale),f=socialFeedback(locale);
 const [appleOpen,setAppleOpen]=useState(false),[ready,setReady]=useState<SocialReadiness|null>(null),[checking,setChecking]=useState(true),[busy,setBusy]=useState<SocialProvider|null>(null),[error,setError]=useState(''),[unavailable,setUnavailable]=useState<SocialProvider|null>(null),[checkFailed,setCheckFailed]=useState(false);
 const active=useRef(false),lock=useRef(false),checkRequest=useRef<AbortController|null>(null),startRequest=useRef<AbortController|null>(null),generation=useRef(0);
 const closeApple=useCallback(()=>setAppleOpen(false),[]);
 const check=useCallback(async()=>{
  checkRequest.current?.abort();const controller=new AbortController(),id=++generation.current;checkRequest.current=controller;
  const timer=setTimeout(()=>controller.abort(),30000);setChecking(true);setCheckFailed(false);
  try{const response=await fetch('/api/angelcare-marketplace/customer/auth/social/providers',{credentials:'same-origin',cache:'no-store',signal:controller.signal});const data=parseSocialReadiness(await response.json());if(!response.ok||!data)throw Error('READINESS_FAILED');if(active.current&&id===generation.current){setReady(data);setCheckFailed(!data.settingsAvailable)}}
  catch{if(active.current&&id===generation.current){setReady(null);setCheckFailed(true)}}
  finally{clearTimeout(timer);if(active.current&&id===generation.current)setChecking(false)}
 },[]);
 useEffect(()=>{active.current=true;void check();const resume=()=>{if(!lock.current)void check()},restore=(event:PageTransitionEvent)=>{if(event.persisted){lock.current=false;setBusy(null);void check()}};window.addEventListener('online',resume);window.addEventListener('pageshow',restore);return()=>{active.current=false;generation.current++;checkRequest.current?.abort();startRequest.current?.abort();window.removeEventListener('online',resume);window.removeEventListener('pageshow',restore)}},[check]);
 async function start(provider:SocialProvider){
  if(lock.current||disabled)return;
  if(provider==='apple'){setError('');setAppleOpen(true);return}
  if(checking)return;
  if(!providerAvailable(ready,provider)){setUnavailable(provider);return}
  lock.current=true;setBusy(provider);setError('');setUnavailable(null);
  const controller=new AbortController();startRequest.current=controller;const timer=setTimeout(()=>controller.abort(),30000);
  try{const response=await fetch('/api/angelcare-marketplace/customer/auth/social/start',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({provider,locale,intent,returnTo}),signal:controller.signal});const payload=await response.json();if(!response.ok||typeof payload.data?.url!=='string')throw Error('SOCIAL_UNAVAILABLE');const url=new URL(payload.data.url);if(!['https:','http:'].includes(url.protocol))throw Error('SOCIAL_UNAVAILABLE');if(active.current)window.location.assign(url.toString())}
  catch{if(active.current){lock.current=false;setBusy(null);setError(t.failed)}}finally{clearTimeout(timer)}
 }
 const detail=unavailable?checkFailed?f.load:!ready?.profileReady?f.profile:unavailable==='google'?f.google:f.facebook:'';
 return <section className={s.social} aria-label={t.continue} aria-busy={checking||Boolean(busy)}>
  <div className={s.providers}>{SOCIAL_PROVIDERS.map(provider=>{const available=providerAvailable(ready,provider);return <button key={provider} type="button" data-provider={provider} data-available={available} disabled={disabled||Boolean(busy)||(checking&&provider!=='apple')} onClick={()=>void start(provider)}>
   <span className={s.providerIcon}><img src={`/brand/social/${provider}-official-r1.${provider==='facebook'?'png':'svg'}`} width="24" height="24" alt="" aria-hidden="true"/></span><span className={s.providerText}>{t.continue} {provider==='google'?'Google':provider==='facebook'?'Facebook':'Apple'}{provider==='apple'?<small>{appleUpdateCopy(locale).update}</small>:!checking&&!available?<small>{f.unavailable}</small>:null}</span><span className={s.providerArrow} aria-hidden="true">{busy===provider?'…':'›'}</span>
  </button>})}</div>
  <p className={s.hint} role="status">{checking?f.checking:busy?f.opening:checkFailed?f.load:f.hint}</p>
  {!checking&&!busy?<button className={s.refreshProviders} type="button" disabled={disabled} onClick={()=>void check()}>{f.retry}</button>:null}
  {detail?<div className={s.providerNotice} role="status"><strong>{unavailable==='google'?'Google':'Facebook'}</strong><p>{detail}</p><button type="button" onClick={()=>setUnavailable(null)}>{f.close}</button></div>:null}
  {error?<p className={s.error} role="alert">{error}</p>:null}<div className={s.divider}>{t.divider}</div>
  {appleOpen?<CustomerAppleUpdateNotice locale={locale} googleAvailable={providerAvailable(ready,'google')} facebookAvailable={providerAvailable(ready,'facebook')} onClose={closeApple} onChoose={provider=>{setAppleOpen(false);void start(provider)}}/>:null}
 </section>
}
