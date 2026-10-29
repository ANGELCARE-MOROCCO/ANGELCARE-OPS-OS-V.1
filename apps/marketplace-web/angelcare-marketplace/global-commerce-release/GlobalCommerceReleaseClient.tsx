'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import type {Gate} from './server'
import css from './release.module.css'
type Snapshot={checkedAt:string;globalCommercialReleaseAuthorized:boolean;currencyMode:string;paypal:{configured:boolean;environment:string;currency:string};counts:{suppliers:number;offers:number;availableProducts:number;purchases:number|null;shipments:number|null;payments:number|null};gates:Gate[];markets:{code:string;name:string;currency:string;enabled:boolean;fxReady:boolean;ageDays:number|null;commercialReady:boolean}[]}
export function GlobalCommerceReleaseClient(){
 const [data,setData]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function refresh(){setBusy(true);setError('');try{const response=await fetch('/api/angelcare-marketplace/admin/global-commerce-release',{cache:'no-store'});const json=await response.json();if(!response.ok||json.error)throw Error(json.error?.message||'Unable to read release controls');setData(json.data)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 useEffect(()=>{void refresh()},[])
 const verified=data?.gates.filter(x=>x.status==='verified').length||0
 const blocked=data?.gates.filter(x=>x.status==='blocked').length||0
 return <div className={css.root}>
  <header className={css.hero}><div><small>ANGELCARE / EXECUTIVE COMMERCE OPERATIONS</small><h1>Global Commerce Release Authority</h1><p>Real database signals · Source-backed integration limits · No invented go-live approvals</p></div><button onClick={()=>void refresh()} disabled={busy}>{busy?'Inspecting…':'Refresh all authorities'}</button></header>
  <div className={css.banner}><strong>GLOBAL PAID COMMERCE: NOT CERTIFIED</strong><span>No market or payment method is automatically activated by this workspace. Resolve red gates and record actual business evidence before release.</span></div>
  {error&&<div role="alert" className={css.error}>{error}<button onClick={()=>void refresh()}>Retry inspection</button></div>}
  {!data&&!error&&<p>Reading live authorities…</p>}
  {data&&<><div className={css.stats}><article><small>Verified inspection gates</small><b>{verified}/{data.gates.length}</b></article><article><small>Release blockers</small><b>{blocked}</b></article><article><small>Supplier approvals</small><b>{data.counts.suppliers}</b></article><article><small>Approved offers</small><b>{data.counts.offers}</b></article><article><small>Available catalogue</small><b>{data.counts.availableProducts}</b></article><article><small>ONE WORLD mode</small><b>{data.currencyMode}</b></article></div>
   <section className={css.section}><h2>Launch decision register</h2><p>Each item is measured or explicitly classified as requiring external proof. A green data-read gate never means a payment or purchase is commercially certified.</p><div className={css.grid}>{data.gates.map(g=><article key={g.id} className={css.gate}><div className={css.top}><strong>{g.name}</strong><span className={g.status==='verified'?css.good:g.status==='blocked'?css.block:css.review}>{g.status.replace('_',' ')}</span></div><p>{g.detail}</p><Link href={g.href}>Open operating workspace →</Link></article>)}</div></section>
   <section className={css.section}><h2>Countries and FX coverage</h2><div className={css.table}><table><thead><tr><th>Country</th><th>Currency</th><th>Policy</th><th>FX</th><th>Age (days)</th><th>Commerce</th></tr></thead><tbody>{data.markets.map(m=><tr key={m.code}><td>{m.name} ({m.code})</td><td>{m.currency}</td><td>{m.enabled?'Enabled':'Disabled'}</td><td>{m.fxReady?'Rate available':'Missing/stale'}</td><td>{m.ageDays??'—'}</td><td>Not certified</td></tr>)}</tbody></table>{!data.markets.length&&<p>No configured countries found.</p>}</div></section>
   <footer>Inspection generated {new Date(data.checkedAt).toLocaleString()} · Zero production mutations · Payment and legal authorization remain under their canonical authorities</footer></>}
 </div>
}
