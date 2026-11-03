'use client'
import {useMemo,useState} from 'react'
import {AlertTriangle,ArrowRight,CheckCircle2,Clipboard,Clock3,PackageCheck,Search,Truck,Wallet} from 'lucide-react'
import css from './commerce-board.module.css'
type Row=Record<string,any>
type Props={mode:'orders'|'fulfillment';journeys:Row[];purchases:Row[];shipments:Row[];events:Row[];onOpenAuthority:()=>void}
const text=(v:unknown)=>String(v??'').trim()
const date=(v:unknown)=>{const n=new Date(String(v||''));return Number.isFinite(n.getTime())?n.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—'}
const danger=(s:unknown)=>/(error|fail|exception|blocked|dispute|return|lost|delay|rejected)/i.test(text(s))
const successful=(s:unknown)=>/(approved|accepted|completed|delivered|paid|fulfilled)/i.test(text(s))
function rowTitle(row:Row,mode:string){return text(row.public_reference||row.reference||row.tracking_number||row.id)||'No reference'}
export function CommerceOperationsBoard({mode,journeys,purchases,shipments,events,onOpenAuthority}:Props){
 const [term,setTerm]=useState(''),[view,setView]=useState<'all'|'exceptions'|'completed'>('all')
 const isOrders=mode==='orders'
 const rows=useMemo(()=>[...(isOrders?journeys:shipments)].sort((a,b)=>Date.parse(text(b.updated_at||b.created_at)) - Date.parse(text(a.updated_at||a.created_at))),[journeys,shipments,isOrders])
 const filtered=rows.filter(r=>{const s=JSON.stringify({id:r.id,status:r.status,reference:r.public_reference||r.reference||r.tracking_number,carrier:r.carrier,title:r.title});return(!term||s.toLowerCase().includes(term.toLowerCase()))&&(view==='all'||(view==='exceptions'?danger(r.status):successful(r.status)))})
 const exceptions=rows.filter(r=>danger(r.status)).length,completed=rows.filter(r=>successful(r.status)).length
 const latestEvents=events.slice(0,8)
 return <div className={css.wrap}>
   <section className={css.banner}><div><span className={css.kicker}>{isOrders?'CUSTOMER COMMERCE':'FULFILLMENT INTELLIGENCE'} · CANONICAL AUTHORITY</span><h2>{isOrders?'Every customer journey. One operational picture.':'Know where every shipment stands.'}</h2><p>{isOrders?'Review real customer journeys, exceptions and supplier purchasing signals while keeping payment decisions in the approved order system.':'Track actual supplier logistics states and exceptions without invented delivery dates or carrier confirmations.'}</p></div><button onClick={onOpenAuthority}>{isOrders?'Open customer order authority':'Open fulfillment authority'}<ArrowRight size={15}/></button></section>
   <div className={css.metrics}>
    <div><Clock3 size={20}/><span>Records loaded</span><strong>{rows.length}</strong><small>Current canonical snapshot</small></div>
    <div><AlertTriangle size={20}/><span>Exception-labelled</span><strong>{exceptions}</strong><small>Actual source status, no SLA inference</small></div>
    <div><CheckCircle2 size={20}/><span>Completed-labelled</span><strong>{completed}</strong><small>Source status only</small></div>
    <div>{isOrders?<Wallet size={20}/>:<Truck size={20}/>}<span>{isOrders?'Purchase orders':'Tracking-linked'}</span><strong>{isOrders?purchases.length:rows.filter(r=>text(r.tracking_number)).length}</strong><small>{isOrders?'Existing supplier purchasing records':'Carrier references when reported'}</small></div>
   </div>
   <section className={css.card}><div className={css.head}><div><strong>{isOrders?'Customer journeys':'Carrier and shipment records'}</strong><span>Source-driven status management; no fictional order samples</span></div><div className={css.controls}><label><Search size={15}/><input aria-label="Search real commerce records" placeholder="Reference, status, carrier…" value={term} onChange={e=>setTerm(e.target.value)}/></label><select value={view} onChange={e=>setView(e.target.value as typeof view)} aria-label="Filter real operational status"><option value="all">All states</option><option value="exceptions">Exceptions</option><option value="completed">Completed</option></select></div></div>
    <div className={css.table}><table><thead><tr><th>Reference</th><th>{isOrders?'Journey / type':'Carrier'}</th><th>Source status</th><th>{isOrders?'Created':'Tracking'}</th><th>Updated</th><th>Action</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><b>{rowTitle(r,mode)}</b><small>{text(r.id).slice(0,13)}</small></td><td>{isOrders?text(r.title||r.journey_type)||'—':text(r.carrier)||'Unknown'}</td><td><span className={`${css.tag} ${danger(r.status)?css.bad:successful(r.status)?css.good:css.pending}`}>{r.status||'Unknown'}</span></td><td>{isOrders?date(r.created_at):text(r.tracking_number)||'Not reported'}</td><td>{date(r.updated_at||r.created_at)}</td><td><button className={css.link} onClick={onOpenAuthority}>Open record <ArrowRight size={13}/></button></td></tr>)}</tbody></table>{!filtered.length&&<div className={css.empty}><PackageCheck size={28}/><b>No matching source records</b><p>Try another filter. This workspace never inserts simulated orders or shipments.</p></div>}</div>
   </section>
   <section className={css.lower}><div className={css.lowerHead}><strong>Recent operational evidence</strong><span>Canonical events provided by Supplier Command 360</span></div>{latestEvents.length?<div className={css.timeline}>{latestEvents.map((event,i)=><div key={event.id||i}><span className={css.timelineDot}/><b>{event.action||event.event_type||event.status||'Event'}</b><small>{date(event.created_at)}</small><p>{text(event.note||event.description)||'No recorded description'}</p></div>)}</div>:<div className={css.empty}>No operational event records currently available.</div>}</section>
   <div className={css.notice}><AlertTriangle size={17}/> Source statuses may be incomplete. Financial settlement, shipping eligibility, returns and supplier payments remain controlled by canonical AngelCare permissions and approvals.</div>
  </div>
}
