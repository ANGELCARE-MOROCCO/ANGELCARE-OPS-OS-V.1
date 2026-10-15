'use client'
import {useEffect,useState} from 'react'
import {Globe2} from 'lucide-react'
import styles from './country.module.css'
type Locale='fr'|'en'|'ar'
let cached:{code:string|null;at:number}|null=null
let pending:Promise<string|null>|null=null
function detect(){if(cached&&Date.now()-cached.at<900000)return Promise.resolve(cached.code);if(!pending)pending=fetch('/api/angelcare-marketplace/public/country',{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(async r=>{if(!r.ok)throw Error('Country unavailable');const v=await r.json();const code=typeof v.code==='string'&&/^[A-Z]{2}$/.test(v.code)?v.code:null;cached={code,at:Date.now()};return code}).catch(()=>null).finally(()=>{pending=null});return pending}
export function VisitorCountry({locale}:{locale:Locale}){const [code,setCode]=useState<string|null>(null),[failed,setFailed]=useState(false)
 useEffect(()=>{let active=true;void detect().then(v=>{if(active){setCode(v);setFailed(false)}});return()=>{active=false}},[])
 let name=locale==='ar'?'دولي':locale==='fr'?'International':'International';try{if(code)name=new Intl.DisplayNames([locale],{type:'region'}).of(code)||code}catch{name=code||name}
 return <span className={styles.indicator} data-visitor-country={code||'unknown'} role="status" aria-live="polite" title={name+' · '+(locale==='ar'?'البلد التقريبي للاتصال. يتم تحديد مكان الخدمة بشكل منفصل.':locale==='fr'?'Pays approximatif de la connexion. Le lieu de service se choisit séparément.':'Approximate connection country. Service location is selected separately.')}>{code&&!failed?<img src={`/angelcare-marketplace/visitor-country/flags/${code.toLowerCase()}.svg`} width={24} height={18} alt="" onError={()=>setFailed(true)}/>:<Globe2 size={21} aria-hidden="true"/>}<span><strong>{name}</strong><small>{locale==='ar'?'بلد الاتصال':locale==='fr'?'Votre pays':'Your country'}</small></span></span>
}
export const currentVisitorCountry=()=>cached?.code||null
