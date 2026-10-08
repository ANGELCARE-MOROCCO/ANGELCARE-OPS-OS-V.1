'use client'
import { useEffect,useMemo,useState } from 'react'

const pad=(n:number)=>String(Math.max(0,n)).padStart(2,'0')
export function LiveCountdown({endsAt}:{endsAt?:string}){
 const target=useMemo(()=>endsAt?Date.parse(endsAt):NaN,[endsAt]),[now,setNow]=useState(()=>Date.now())
 useEffect(()=>{if(!Number.isFinite(target))return;const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[target])
 if(!Number.isFinite(target)||target<=now)return null
 const seconds=Math.floor((target-now)/1000),days=Math.floor(seconds/86400),hours=Math.floor((seconds%86400)/3600),minutes=Math.floor((seconds%3600)/60),secs=seconds%60
 return <time dateTime={endsAt} aria-label={`Offre se terminant dans ${days} jours ${hours} heures ${minutes} minutes`}><b>Fin dans</b> {days?`${days}j `:''}{pad(hours)}h {pad(minutes)}m {pad(secs)}s</time>
}
