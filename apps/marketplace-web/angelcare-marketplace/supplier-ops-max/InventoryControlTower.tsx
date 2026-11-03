'use client'
import {useMemo,useState} from 'react'
import {AlertTriangle,ArrowRight,Boxes,CheckCircle2,Clock3,Database,RefreshCw,Search,ShieldAlert,Warehouse,Layers3,Filter,PackageCheck} from 'lucide-react'
import type {Selection} from './contract'
import type {InventoryOverview,InventorySnapshot} from './inventory-intelligence'
import {stockFreshness} from './inventory-normalization'
import css from './inventory.module.css'

type Props={selections:Selection[];inventory:InventoryOverview|null;busy:boolean;onRefresh:(id:string,variantIds:string[])=>Promise<void>;
 onOpenProduct:(id:string)=>void;onOpenConnections:()=>void}
const cut=(s:unknown)=>String(s??'').trim()
const fmt=(n:number|null)=>n===null?'Unknown':new Intl.NumberFormat('en-US').format(n)
const when=(v:string)=>{const d=new Date(v);return Number.isFinite(d.valueOf())?d.toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}):'Unknown'}
function status(row:InventorySnapshot){return row.state==='provider_error'?'error':row.state==='provider_empty'?'unknown':stockFreshness(row.checked_at)}
export function InventoryControlTower({selections,inventory,busy,onRefresh,onOpenProduct,onOpenConnections}:Props){
 const [active,setActive]=useState<string>(''),[search,setSearch]=useState(''),[country,setCountry]=useState('all'),[filter,setFilter]=useState<'all'|'fresh'|'stale'|'error'>('all')
 const [wanted,setWanted]=useState<string[]>([])
 const cj=selections.filter(s=>s.provider==='cj')
 const selected=cj.find(s=>s.id===active)||cj[0]||null
 const variants=selected?.normalized?.variants||[]
 const source=(inventory?.items||[]).filter(x=>x.selection_id===selected?.id)
 const countries=[...new Set(source.map(x=>x.country_code).filter(Boolean))] as string[]
 const visible=source.filter(r=>(!search||`${r.variant_sku} ${r.warehouse_name} ${r.variant_id}`.toLowerCase().includes(search.toLowerCase()))&&(country==='all'||r.country_code===country)&&(filter==='all'||(filter==='error'?r.state==='provider_error':filter==='fresh'?status(r)==='fresh':status(r)==='stale')))
 const uniqueVariants=new Set(source.map(x=>x.variant_id)).size
 const fresh=source.filter(r=>status(r)==='fresh'&&r.state==='provider_reported')
 const stale=source.filter(r=>status(r)==='stale').length
 const failed=source.filter(r=>r.state==='provider_error').length
 const reportedCj=fresh.reduce((a,r)=>a+(r.cj_managed??0),0)
 const reportedFactory=fresh.reduce((a,r)=>a+(r.factory_managed??0),0)
 const batches=useMemo(()=>[...new Map((inventory?.items||[]).map(s=>[s.capture_id,s])).values()].length,[inventory])
 const toggle=(id:string)=>setWanted(old=>old.includes(id)?old.filter(v=>v!==id):[...old,id].slice(0,12))
 return <div className={css.tower}>
  <section className={css.hero}>
   <div className={css.heroCopy}>
    <span className={css.eyebrow}><Warehouse size={16}/> SUPPLIER STOCK INTELLIGENCE / CJ WAREHOUSE NETWORK</span>
    <h2>Inventory you can actually <em>trust.</em></h2>
    <p>Live CJ variant enquiries, persistent source snapshots and defensible warehouse-level availability. No guessed inventory and no factory stock passed off as CJ warehouse stock.</p>
    <div className={css.heroActions}><button onClick={()=>selected&&onRefresh(selected.id,wanted.length?wanted:variants.slice(0,12).map(v=>v.id))} disabled={!inventory?.available||!selected||!variants.length||busy}><RefreshCw size={16}/> {busy?'Fetching CJ inventory…':`Refresh ${wanted.length||Math.min(variants.length,12)} variant(s)`}</button><button className={css.lightButton} onClick={onOpenConnections}><Database size={16}/> Connection diagnostics <ArrowRight size={15}/></button></div>
   </div>
   <div className={css.heroIdentity}><span>WAREHOUSE EVIDENCE</span><strong>{uniqueVariants}</strong><small>variant identities sampled<br/>for active selection</small><div className={css.heroNote}><Clock3 size={14}/> 30-minute freshness policy</div></div>
  </section>
  {!inventory?.available&&<div className={css.blocker} role="alert"><ShieldAlert size={20}/><div><strong>R4 database migration required</strong><p>{inventory?.error||'The native inventory snapshot authority is not installed. No fabricated quantity is shown.'}</p></div></div>}
  <div className={css.metrics}>
   {[
    {name:'CJ-managed · fresh',value:fmt(reportedCj),sub:'Provider-reported units, not reserved stock'},
    {name:'Factory-managed · fresh',value:fmt(reportedFactory),sub:'Separate supply; not warehouse-confirmed'},
    {name:'Stale warehouse rows',value:stale,sub:'Refresh before any procurement decision'},
    {name:'Failed CJ enquiries',value:failed,sub:'Errors shown; no false zero stock'},
    {name:'Sample captures',value:batches,sub:'Latest capture per variant is displayed'}
   ].map((m,i)=><div key={m.name} className={css.metric}><span>{m.name}</span><strong className={i===2||i===3?css.warn:''}>{m.value}</strong><small>{m.sub}</small></div>)}
  </div>
  <div className={css.workbench}>
   <aside className={css.selector}>
    <div className={css.sectionHead}><span>01 / PRODUCT FOCUS</span><b>{cj.length} selected CJ items</b></div>
    <div className={css.productList}>{cj.map(s=><button key={s.id} onClick={()=>{setActive(s.id);setWanted([]);setFilter('all');setSearch('');setCountry('all')}} className={s.id===selected?.id?css.activeProduct:''}>
     {s.image_url?<img src={s.image_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span className={css.imageFallback}><Boxes size={19}/></span>}
     <span className={css.productCopy}><strong>{s.title}</strong><small>{s.sku} · {s.normalized?.variants?.length||0} variants</small></span><ArrowRight size={14}/>
    </button>)}{!cj.length&&<div className={css.empty}>No CJ products in your selection. Discover and select real CJ products first.</div>}</div>
   </aside>
   <section className={css.inspector}>
    <div className={css.sectionHead}><span>02 / WAREHOUSE INSPECTOR</span><b>Source: CJ API V2</b></div>
    {selected?<>
     <div className={css.selectionTitle}><div><h3>{selected.title}</h3><p>PID: {selected.provider_product_id} · Only supplier-reported values</p></div><button onClick={()=>onOpenProduct(selected.id)}>Open full Product 360 <ArrowRight size={14}/></button></div>
     <div className={css.toolbar}>
      <label><Search size={15}/><input aria-label="Search stock rows" placeholder="Warehouse, variant, SKU…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <label><Filter size={14}/><select aria-label="Inventory freshness" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">All evidence</option><option value="fresh">Fresh only</option><option value="stale">Stale only</option><option value="error">Errors only</option></select></label>
      <select aria-label="Warehouse country" value={country} onChange={e=>setCountry(e.target.value)}><option value="all">All warehouse countries</option>{countries.map(c=><option key={c}>{c}</option>)}</select>
     </div>
     <div className={css.tableWrap}><table><thead><tr><th>Variant / SKU</th><th>Warehouse</th><th>CJ warehouse</th><th>Factory</th><th>Total reported</th><th>Freshness</th><th>Checked</th></tr></thead><tbody>
      {visible.map(x=><tr key={x.id}><td><b>{x.variant_sku||x.variant_id}</b><small>{x.variant_id.slice(0,24)}</small></td><td><b>{x.warehouse_name}</b><small>{x.country_code||'Country unknown'} · {x.warehouse_key}</small></td><td className={css.qty}>{fmt(x.cj_managed)}</td><td className={css.qty}>{fmt(x.factory_managed)}</td><td className={css.qty}>{fmt(x.total_reported)}</td><td><span className={`${css.status} ${status(x)==='fresh'?css.statusFresh:status(x)==='stale'?css.statusStale:css.statusMissing}`}>{status(x)}</span>{x.error_code&&<small title={x.error_code}>{x.error_code}</small>}</td><td>{when(x.checked_at)}</td></tr>)}
     </tbody></table>{!visible.length&&<div className={css.empty}><AlertTriangle size={22}/><strong>No recorded warehouse rows for this filter.</strong><p>Use controlled refresh to obtain the current CJ inventory response. This is not a statement that stock is zero.</p></div>}</div>
     <div className={css.variantBox}><div><h4><Layers3 size={16}/> Select variants to refresh</h4><span>At most 12 supplier calls in one request. CJ API consumption is controlled.</span></div><div className={css.variantChips}>{variants.map(v=><label key={v.id} className={wanted.includes(v.id)?css.chipActive:''}><input type="checkbox" checked={wanted.includes(v.id)} onChange={()=>toggle(v.id)}/><span>{v.sku||v.label}</span></label>)}</div>{variants.length>12&&<p className={css.warning}>This product has {variants.length} variants. Refresh in batches; all-variant bulk polling is deliberately disabled.</p>}</div>
    </>:<div className={css.empty}>Choose a CJ product to inspect its warehouse inventory.</div>}
   </section>
  </div>
  <footer className={css.footer}><CheckCircle2 size={16}/> Provider-reported stock is never a customer reservation. Publication, purchasing, shipping and checkout remain governed by canonical AngelCare readiness and approval gates.</footer>
 </div>
}
