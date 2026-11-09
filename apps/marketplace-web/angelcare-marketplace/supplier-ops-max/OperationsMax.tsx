'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
 AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Bell,
 Boxes, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock,
 Database, Download, ExternalLink, FileCheck2, Filter, Globe2, Layers3,
 LoaderCircle, Package, PackageCheck, Plus, RefreshCw, Search, ShieldCheck,
 ShoppingBag, ShoppingCart, TrendingUp, Truck, Wallet, X, Zap,
} from 'lucide-react'
import { costPreview } from '../supplier-command-360/money'
import css from './operations.module.css'

type Row = Record<string, any>
type Snapshot = {
 suppliers:Row[]; profiles:Row[]; documents:Row[]; offers:Row[]; catalog:Row[];
 commercials:Row[]; journeys:Row[]; payments:Row[]; purchases:Row[];
 purchaseLines:Row[]; availability:Row[]; shipments:Row[]; shipmentEvents:Row[];
 tasks:Row[]; audit:Row[]; rateBook:Row[]; rateBookConnected:boolean;generatedAt:string;
}
type Space = 'pricing' | 'orders' | 'purchases' | 'stock' | 'fulfillment' | 'automation'
type FormField = {key:string;label:string;kind?:'text'|'number'|'textarea'|'date'|'datetime-local'|'select';options?:[string,string][];required?:boolean;placeholder?:string}
type FormPlan = {title:string;action:string;fields:FormField[];values:Row;reasonRequired?:boolean;requiresConfirmation?:boolean;dangerText?:string}
const api='/api/angelcare-marketplace/admin/supplier-command-360'
const spaces = [
 {id:'pricing',number:'11',title:'Pricing & Margins',subtitle:'Landed cost, profit & approval',icon:BarChart3},
 {id:'orders',number:'12',title:'Customer Orders',subtitle:'Paid journeys & exceptions',icon:ShoppingCart},
 {id:'purchases',number:'13',title:'Purchasing & PO',subtitle:'Dual-control procurement',icon:Wallet},
 {id:'stock',number:'14',title:'Stock & Availability',subtitle:'Verified supplier declarations',icon:Boxes},
 {id:'fulfillment',number:'15',title:'Fulfillment Tower',subtitle:'Dispatch, tracking & proof',icon:Truck},
 {id:'automation',number:'16',title:'Automation & Health',subtitle:'Audit, exceptions & recovery',icon:Zap},
] as const
const string=(v:unknown)=>String(v??'').trim()
const number=(v:unknown):number|null=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null
const day=(v:unknown)=>{const d=new Date(string(v));return Number.isFinite(d.getTime())?d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
const currency=(v:unknown,c='USD')=>number(v)===null?'—':`${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(v))} ${c}`
const validDate=(v:unknown)=>{const d=new Date(String(v));return Number.isFinite(d.getTime())?d.getTime():0}
const isPositive=(v:unknown)=>number(v)!==null&&Number(v)>0
const confirmedPayment=(data:Snapshot,j:Row)=>data.payments.some(p=>string(p.canonical_object_id)===string(j.id)&&Number(p.captured_amount||0)>Number(p.refunded_amount||0))
const auditedStatus=(s:unknown)=>['active','approved','paid','verified','delivered','received','completed','accepted','issued'].includes(string(s).toLowerCase())?'good':['cancelled','exception','rejected','suspended','unavailable','failed','archived','expired'].includes(string(s).toLowerCase())?'bad':'pending'
function Tag({value}:{value:unknown}){return <span className={`${css.tag} ${css[auditedStatus(value)]}`}>{string(value)||'—'}</span>}
function Card({title,sub,children,action}:{title:string;sub?:string;children:ReactNode;action?:ReactNode}){return <section className={css.card}><div className={css.cardHead}><div><h3>{title}</h3>{sub&&<p>{sub}</p>}</div>{action&&<div className={css.actions}>{action}</div>}</div>{children}</section>}
function Empty({description}:{description:string}){return <div className={css.empty}><Database size={26}/><strong>No matching live records</strong><span>{description}</span></div>}
function Grid({headers,rows,empty}:{headers:string[];rows:ReactNode[][];empty:string}){return <div className={css.tableWrap}><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((cells,i)=><tr key={i}>{cells.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>{!rows.length&&<Empty description={empty}/>}</div>}
function Progress({current,total}:{current:number;total:number}){return <div className={css.progress}><span style={{width:`${total?100*current/total:0}%`}}/></div>}
function exportCsv(filename:string,headers:string[],rows:unknown[][]){
 const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n')
 const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)
}
function FormInput({field,value,onValue}:{field:FormField;value:unknown;onValue:(v:string)=>void}){
 return <label className={css.field}><span>{field.label}{field.required?' *':''}</span>{field.kind==='select'?<select value={string(value)} onChange={e=>onValue(e.target.value)}><option value="">Select…</option>{(field.options||[]).map(([v,label])=><option value={v} key={v}>{label}</option>)}</select>:field.kind==='textarea'?<textarea rows={3} value={string(value)} onChange={e=>onValue(e.target.value)} placeholder={field.placeholder}/>:<input type={field.kind==='number'?'number':field.kind==='date'?'date':field.kind==='datetime-local'?'datetime-local':'text'} step={field.kind==='number'?'any':undefined} value={string(value)} onChange={e=>onValue(e.target.value)} placeholder={field.placeholder}/>}</label>
}
function utcFromLocal(v:unknown):string{const d=new Date(String(v));if(!Number.isFinite(d.valueOf()))throw Error('Valid date/time required');return d.toISOString()}
function sanitizeError(e:unknown){return e instanceof Error?e.message:String(e)}

export function OperationsMax({embedded=false,initialSpace='pricing'}:{embedded?:boolean;initialSpace?:Space}={}){
 const [active,setActive]=useState<Space>(initialSpace),[data,setData]=useState<Snapshot|null>(null)
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('')
 const [filter,setFilter]=useState(''),[current,setCurrent]=useState(''),[form,setForm]=useState<FormPlan|null>(null),[reason,setReason]=useState('')
 const [preview,setPreview]=useState<{landedUsd:string;marginPercent:string|null}|null>(null)
 const reload=useCallback(async()=>{
  const resp=await fetch(api,{credentials:'same-origin',cache:'no-store'})
  const packet=await resp.json().catch(()=>null)
  if(!resp.ok||!packet?.data)throw Error(packet?.error?.message||`Supplier API ${resp.status}`)
  setData(packet.data as Snapshot)
 },[])
 useEffect(()=>{let alive=true;setLoading(true);reload().catch(e=>{if(alive)setError(sanitizeError(e))}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reload])
 const invoke=useCallback(async(action:string,payload:Row,why:string)=>{
  setError('');setSuccess('');setBusy(true)
  try{
   const resp=await fetch(api,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({action,payload,reason:why,idempotencyKey:crypto.randomUUID()})})
   const packet=await resp.json().catch(()=>null)
   if(!resp.ok||!packet?.data)throw Error(packet?.error?.message||`Supplier action ${resp.status}`)
   await reload();setSuccess(`${action} recorded with canonical audit.`);return true
  }catch(e){setError(sanitizeError(e));return false}finally{setBusy(false)}
 },[reload])
 const show=(plan:FormPlan)=>{setForm(plan);setReason('');setError('')}
 const supplierOpts=useMemo(()=>data?.suppliers.filter(x=>['approved','active'].includes(string(x.status))).map(x=>[string(x.id),`${x.display_name||x.legal_name} · ${x.supplier_code||''}`] as [string,string])||[],[data])
 const offerOpts=useMemo(()=>data?.offers.filter(x=>['approved','active'].includes(string(x.status))).map(x=>[string(x.id),`${x.supplier_sku} · ${currency(x.unit_cost,string(x.currency_label))}`] as [string,string])||[],[data])
 const poOpts=useMemo(()=>data?.purchases.map(x=>[string(x.id),`${x.reference} · ${x.status}`] as [string,string])||[],[data])
 const onSubmit=async()=>{
  if(!form)return
  const v={...form.values}
  if(form.fields.some(f=>f.required&&!string(v[f.key]))){setError('Complete every required field.');return}
  if(form.reasonRequired&&reason.trim().length<5){setError('Supply a documented decision reason (at least five characters).');return}
  if(form.requiresConfirmation&&!window.confirm(form.dangerText||'Confirm this operational action?'))return
  if(form.action==='availability.record'){
   try{v.expiresAt=utcFromLocal(v.expiresAt);v.observedAt=new Date().toISOString()}catch(e){setError(sanitizeError(e));return}
  }
  if(form.action==='shipment.create'&&v.expected){try{v.expected=utcFromLocal(v.expected)}catch(e){setError(sanitizeError(e));return}}
  const result=await invoke(form.action,v,reason.trim());if(result)setForm(null)
 }
 const filtered=(rows:Row[],terms:(r:Row)=>string)=>rows.filter(r=>terms(r).toLowerCase().includes(filter.toLowerCase()))
 const offerById=(id:unknown)=>data?.offers.find(x=>x.id===id)
 const supplierById=(id:unknown)=>data?.suppliers.find(x=>x.id===id)
 const purchaseById=(id:unknown)=>data?.purchases.find(x=>x.id===id)
 const auditRows=(data?.audit||[]).sort((a,b)=>validDate(b.created_at)-validDate(a.created_at))
 const expiredStock=(data?.availability||[]).filter(x=>x.status==='verified'&&validDate(x.valid_until)<=Date.now())
 const alerts=(data?.shipments||[]).filter(x=>x.status==='exception').length + expiredStock.length + (data?.tasks||[]).filter(x=>!['done','cancelled'].includes(x.status)&&x.due_on&&new Date(x.due_on).getTime()<Date.now()).length
 const widgets:Record<Space,{number:string;title:string;subtitle:string;count:number;accent:string}>={
  pricing:{number:'11',title:'Pricing & Margin Intelligence',subtitle:'Source-verified landed cost and margin reviews',count:data?.commercials.length||0,accent:'Cost sheets'},
  orders:{number:'12',title:'Customer Order Command Center',subtitle:'Real customer journeys, captured payments and purchase matching',count:data?.journeys.length||0,accent:'Journeys'},
  purchases:{number:'13',title:'Supplier Purchasing & PO',subtitle:'Controlled supplier commitments and dual approval',count:data?.purchases.length||0,accent:'Purchase orders'},
  stock:{number:'14',title:'Stock & Availability Intelligence',subtitle:'Supplier-declared inventory with independent verification and expiry',count:data?.availability.length||0,accent:'Declarations'},
  fulfillment:{number:'15',title:'Fulfillment Control Tower',subtitle:'Dispatch evidence, tracking and delivery exceptions',count:data?.shipments.length||0,accent:'Shipments'},
  automation:{number:'16',title:'Automation & Integration Intelligence',subtitle:'Real audit events, risk signals and operator recovery',count:data?.audit.length||0,accent:'Audit events'},
 }
 const selected=widgets[active]
 const openPricing=(o:Row)=>{
  const c=data?.commercials.find(x=>x.offer_id===o.id)
  show({title:`Commercial cost dossier · ${o.supplier_sku}`,action:'commercial.save',fields:[
   {key:'unitCost',label:`Supplier unit cost (${o.currency_label||'USD'})`,kind:'number',required:true},
   {key:'freight',label:'Freight per unit',kind:'number',required:true},
   {key:'duties',label:'Import duties per unit',kind:'number',required:true},
   {key:'other',label:'Other landed costs',kind:'number',required:true},
   {key:'retailUsd',label:'Reference retail (USD)',kind:'number'},
   {key:'notes',label:'Evidence, date, validity and pricing conditions',kind:'textarea',required:true},
  ],values:{offerId:o.id,unitCost:c?.unit_cost??o.unit_cost,freight:c?.freight_unit??0,duties:c?.duties_unit??0,other:c?.other_unit??0,retailUsd:c?.retail_usd??'',notes:c?.notes??''}})
 }
 const transitions:Record<string,string[]>={draft:['review','cancelled'],review:['approved','draft','cancelled'],approved:['issued','cancelled'],issued:['accepted','cancelled'],accepted:['shipped','cancelled'],shipped:['received']}
 const shipTransitions:Record<string,string[]>={preparing:['dispatched','exception'],dispatched:['in_transit','exception'],in_transit:['delivered','exception'],exception:['preparing','in_transit']}
 return <div className={css.root} data-orders360-embedded={embedded}>
  <div className={css.hero}>
   <div><span className={css.eyebrow}><Layers3 size={13}/> ANGELCARE · SUPPLIER OPERATIONS STUDIO</span><h1>Supplier Operations <span>MAX</span></h1><p>Enterprise execution · Workspaces 11–16 · Production data only</p></div>
   <div className={css.heroAction}><a className={css.link} href="/angelcare-marketplace/admin/supplier-command-360"><ArrowLeft size={14}/> Workspaces 01–10</a><button className={css.primary} disabled={loading||busy} onClick={async()=>{setBusy(true);try{await reload();setSuccess('Latest canonical supplier snapshot loaded.')}catch(e){setError(sanitizeError(e))}finally{setBusy(false)}}}><RefreshCw size={14}/> Refresh live</button></div>
  </div>
  <div className={css.meta}><span><ShieldCheck size={14}/> Server-authorized supplier workspace</span><span><Database size={14}/> Canonical order, supplier & fulfillment tables</span><span><Clock size={14}/> Snapshot {data?day(data.generatedAt):'not loaded'}</span></div>
  {error&&<div className={css.bannerError} role="alert"><AlertTriangle size={17}/><span>{error}</span><button onClick={()=>setError('')}><X size={15}/></button></div>}
  {success&&<div className={css.bannerSuccess} role="status"><CheckCircle2 size={17}/><span>{success}</span><button onClick={()=>setSuccess('')}><X size={15}/></button></div>}
  <div className={css.layout}><aside className={css.nav}><div className={css.navLabel}>OPERATIONAL WORKSPACES <strong>06</strong></div>{spaces.map(x=>{const Icon=x.icon;return <button key={x.id} onClick={()=>{setActive(x.id);setFilter('');setCurrent('');setPreview(null);setForm(null)}} className={active===x.id?css.navActive:css.navButton}><span className={css.num}>{x.number}</span><Icon size={17}/><span><b>{x.title}</b><small>{x.subtitle}</small></span><ChevronRight size={15}/></button>})}<div className={css.navFoot}><ShieldCheck size={18}/><p>Approval separation and customer-payment requirements remain enforced by the original database authority. No vendor funds or automatic orders are triggered here.</p></div></aside>
  <main className={css.main}>
   <div className={css.heading}><div><span className={css.overline}>WORKSPACE {selected.number} / 16</span><h2>{selected.title}</h2><p>{selected.subtitle}</p></div><span className={css.headingMeta}><Database size={15}/>{selected.count} {selected.accent.toLowerCase()} in fetched window</span></div>
   {loading?<div className={css.loading}><LoaderCircle className={css.spin} size={22}/> Loading operational records…</div>:!data?<Card title="Data unavailable"><Empty description="The existing Supplier Command API must be configured and the database migration must be applied."/></Card>:<>
   <div className={css.kpiGrid}>
    <div className={css.kpi}><span>{selected.accent}</span><strong>{selected.count}</strong><small>Fetched real rows, not global total</small></div>
    <div className={css.kpi}><span>Approved suppliers</span><strong>{data.suppliers.filter(x=>['approved','active'].includes(x.status)).length}</strong><small>Canonical supplier records</small></div>
    <div className={css.kpi}><span>Operational exceptions</span><strong>{alerts}</strong><small>Shipment, expired stock & overdue tasks</small></div>
    <div className={css.kpi}><span>Audit events</span><strong>{data.audit.length}</strong><small>Recorded database actions</small></div>
   </div>
   {active==='pricing'&&<>
    <Card title="Pricing control desk" sub="Cost evidence, supplier pricing and forecasted contribution margin; no checkout pricing changes" action={<button className={css.outline} onClick={()=>exportCsv('angelcare-supplier-pricing.csv',['SKU','Supplier','Currency','Unit cost','Freight','Duties','Other','Retail USD','Offer status'],data.offers.map(o=>{const c=data.commercials.find(x=>x.offer_id===o.id);return [o.supplier_sku,supplierById(o.supplier_id)?.display_name,o.currency_label,c?.unit_cost??o.unit_cost,c?.freight_unit??'',c?.duties_unit??'',c?.other_unit??'',c?.retail_usd??'',o.status]}))}><Download size={14}/> Export CSV</button>}>
     <div className={css.toolbar}><label className={css.search}><Search size={15}/><input placeholder="Search SKU, supplier or currency" value={filter} onChange={e=>setFilter(e.target.value)}/></label><span className={css.note}>Every cost entry needs evidence and approval.</span></div>
     <Grid headers={['Supplier offer','Source','Unit cost','Landed additions','Retail / margin','Approval','']} empty="No supplier offers are available. Approve suppliers and connect real catalogue items first." rows={filtered(data.offers,o=>[o.supplier_sku,supplierById(o.supplier_id)?.display_name,o.currency_label].join(' ')).map(o=>{const c=data.commercials.find(x=>x.offer_id===o.id);const additions=(Number(c?.freight_unit||0)+Number(c?.duties_unit||0)+Number(c?.other_unit||0));return [<><b>{o.supplier_sku}</b><small>{o.catalog_item_id?.slice(0,8)}</small></>,<>{supplierById(o.supplier_id)?.display_name||'—'}<small>{o.currency_label}</small></>,currency(c?.unit_cost??o.unit_cost,o.currency_label),currency(additions,o.currency_label),<>{currency(c?.retail_usd,'USD')}<small>{c?'Pricing evidence present':'Not documented'}</small></>,<Tag value={o.status}/>,<button className={css.mini} onClick={()=>openPricing(o)}>Manage costs</button> ]})}/>
    </Card>
    <Card title="Landed cost intelligence" sub="Exact fixed-point calculation using ONE WORLD's approved rate book; never an unverified FX quote">
     <div className={css.notice}><ShieldCheck size={16}/> Supplier unit cost + freight + duties + other costs are converted using the selected approved rate. No conversion is shown without evidence.</div>
     <div className={css.twoCol}><div className={css.stack}><label className={css.field}><span>Supplier offer</span><select value={current} onChange={e=>{setCurrent(e.target.value);setPreview(null)}}><option value="">Choose an offer</option>{data.offers.map(o=><option key={o.id} value={o.id}>{o.supplier_sku} ({o.currency_label})</option>)}</select></label>{current&&(()=>{const o=offerById(current),c=data.commercials.find(x=>x.offer_id===current);const rate=data.rateBook.find(x=>x.currency===o?.currency_label&&x.status==='active');if(!o)return null;return <><div className={css.detail}><span>Recorded procurement currency</span><b>{o.currency_label}</b><span>Approved FX book</span><b>{rate?`${rate.rate} · ${day(rate.observed_on)}`:'No matching approved rate'}</b><span>Retail reference (USD)</span><b>{currency(c?.retail_usd)}</b></div><button className={css.primary} onClick={()=>{try{if(!rate||!c)throw Error('Approved FX rate and commercial cost sheet are required');const p=costPreview({unitCost:c.unit_cost,freight:c.freight_unit,duties:c.duties_unit,other:c.other_unit,retailUsd:c.retail_usd,rate:rate.rate});setPreview(p);setError('')}catch(e){setError(sanitizeError(e))}}}>Calculate margin</button></>})()}</div><div className={css.insight}><span>Verified forecast</span><strong>{preview?currency(preview.landedUsd):'Not calculated'}</strong><p>{preview?'Indicative landed cost in USD; validate tariff, taxes and rate validity before a real price change.':'Select an offer with complete costs and a matching approved FX rate.'}</p>{preview&&<><span>Reference gross margin</span><h2>{preview.marginPercent===null?'Not available':`${preview.marginPercent}%`}</h2></>}</div></div>
    </Card>
   </>}
   {active==='orders'&&<>
    <Card title="Customer order intelligence" sub="Canonical journeys with payment evidence; do not invent orders or infer payment from status alone" action={<a className={css.outline} href="/angelcare-marketplace/admin/orders-fulfillment/orders"><ExternalLink size={14}/> Native order console</a>}>
     <div className={css.toolbar}><label className={css.search}><Search size={15}/><input placeholder="Search journey, status or type" value={filter} onChange={e=>setFilter(e.target.value)}/></label><span className={css.note}>{data.journeys.length} records loaded; upstream list may be capped.</span></div>
     <Grid headers={['Customer journey','Status','Payment evidence','Supplier purchasing','Created']} empty="No customer journeys in the source window. This does not imply there are no historical orders." rows={filtered(data.journeys,j=>[j.id,j.status,j.journey_type,j.reference].join(' ')).map(j=>{const lines=data.purchaseLines.filter(x=>x.journey_id===j.id),purchases=lines.map(x=>purchaseById(x.purchase_id)).filter(Boolean);return [<><b>{j.reference||j.journey_key||j.id?.slice(0,12)}</b><small className={css.mono}>{j.id}</small></>,<Tag value={j.status}/>,confirmedPayment(data,j)?<span className={css.goodText}><CheckCircle2 size={13}/> Net capture confirmed</span>:<span className={css.weak}>Unverified / no positive capture</span>,<>{lines.length} purchase line(s)<small>{purchases.map(x=>x?.reference).join(', ')||'No linked PO'}</small></>,day(j.created_at)]})}/>
    </Card>
    <Card title="Operational handover" sub="From customer payment to supplier purchase, without bypassing the existing order authority"><div className={css.process}>{['Capture evidence','Approved supplier offer','Draft purchase order','Independent approval','Supplier PO issued','Tracking & delivery'].map((p,i)=><div key={p}><b>{String(i+1).padStart(2,'0')}</b><span>{p}</span><ArrowRight size={14}/></div>)}</div><div className={css.notice}><AlertTriangle size={16}/> A customer journey is not automatically payable or purchasable. Existing database functions require positive net payment capture before a linked purchase line may be added.</div></Card>
   </>}
   {active==='purchases'&&<>
    <Card title="Procurement execution" sub="Purchase orders are drafted and approved within the canonical supplier authority" action={<button className={css.primary} onClick={()=>show({title:'Create supplier purchase order',action:'purchase.create',fields:[{key:'supplierId',label:'Approved supplier',kind:'select',options:supplierOpts,required:true},{key:'currency',label:'PO currency (ISO 4217)',required:true},{key:'terms',label:'Supplier payment terms',kind:'textarea',required:true},{key:'incoterm',label:'Incoterm'}],values:{supplierId:'',currency:'USD',terms:'',incoterm:''}})}><Plus size={14}/> New draft PO</button>}>
     <div className={css.toolbar}><label className={css.search}><Search size={15}/><input placeholder="Search PO number, status or supplier" value={filter} onChange={e=>setFilter(e.target.value)}/></label><button className={css.outline} onClick={()=>exportCsv('angelcare-purchases.csv',['Reference','Supplier','Currency','Status','Created','Approval'],data.purchases.map(p=>[p.reference,supplierById(p.supplier_id)?.display_name,p.currency,p.status,p.created_at,p.approved_at]))}><Download size={13}/> CSV</button></div>
     <Grid headers={['Purchase order','Supplier','Items & total','State','Owner controls','']} empty="No canonical purchase orders yet." rows={filtered(data.purchases,p=>[p.reference,p.status,supplierById(p.supplier_id)?.display_name].join(' ')).map(p=>{const lines=data.purchaseLines.filter(l=>l.purchase_id===p.id);const next=transitions[p.status]||[];return [<><b>{p.reference}</b><small>{day(p.created_at)}</small></>,supplierById(p.supplier_id)?.display_name||p.supplier_id?.slice(0,8),<><b>{lines.length} line(s) · {currency(lines.reduce((s,l)=>s+Number(l.quantity||0)*Number(l.unit_cost||0),0),p.currency)}</b><small>{lines.some(l=>l.journey_id)?'Customer-linked lines':'Unlinked/manual PO lines'}</small></>,<Tag value={p.status}/>,<><span className={css.mono}>Rev {p.revision}</span><small>Approver: {p.approved_by?String(p.approved_by).slice(0,13):'Not approved'}</small></>,<div className={css.inlineActions}>{p.status==='draft'&&<button className={css.mini} onClick={()=>show({title:`Add approved offer to ${p.reference}`,action:'purchase.line',fields:[{key:'offerId',label:'Approved supplier offer',kind:'select',options:data.offers.filter(o=>o.supplier_id===p.supplier_id&&o.currency_label===p.currency&&['active','approved'].includes(o.status)).map(o=>[o.id,`${o.supplier_sku} · ${currency(o.unit_cost,p.currency)}`]),required:true},{key:'quantity',label:'Quantity',kind:'number',required:true},{key:'unitCost',label:`Confirmed unit cost (${p.currency})`,kind:'number',required:true},{key:'journeyId',label:'Paid customer journey UUID (leave empty for manual stock/order)'},{key:'description',label:'Procurement evidence / item context',kind:'textarea'}],values:{purchaseId:p.id,offerId:'',quantity:'1',unitCost:'',journeyId:'',description:''},requiresConfirmation:true,dangerText:'Add this purchase line? For linked customer orders, net captured payment is required.'})}>Add line</button>}{next.map(status=><button className={css.mini} key={status} disabled={busy} onClick={()=>show({title:`PO ${p.reference}: ${p.status} → ${status}`,action:'purchase.transition',fields:[],values:{id:p.id,status,revision:p.revision},reasonRequired:true,requiresConfirmation:true,dangerText:`Confirm ${status.toUpperCase()} for PO ${p.reference}? This state change is audited. External supplier payments are NOT initiated.`})}>{status}</button>)}</div>]})}/>
    </Card>
    <Card title="Purchasing control rules" sub="Enforced by the existing supplier command database function"><div className={css.controlGrid}>{[['1','Approved supplier','Only approved/active counterparties can receive POs'],['2','Approved offer & currency','Every line must match the PO supplier and currency'],['3','Customer payment evidence','A journey-linked line needs positive net capture'],['4','Dual authorization','PO approver cannot be its original creator'],['5','Immutable audit','Each status change has actor, reason and idempotency key'],['6','No payment execution','Issuing a PO does not debit a bank or supplier account']].map(([n,title,desc])=><div key={n}><b>{n}</b><span><strong>{title}</strong><small>{desc}</small></span></div>)}</div></Card>
   </>}
   {active==='stock'&&<>
    <Card title="Live supplier availability evidence" sub="Supplier-declared, time-limited availability—never AngelCare-owned inventory" action={<button className={css.primary} onClick={()=>show({title:'Record supplier-declared availability',action:'availability.record',fields:[{key:'offerId',label:'Approved supplier offer',kind:'select',options:offerOpts,required:true},{key:'quantity',label:'Quantity declared by supplier',kind:'number',required:true},{key:'location',label:'Supplier warehouse / location',required:true},{key:'expiresAt',label:'Declaration expiry time',kind:'datetime-local',required:true},{key:'proof',label:'Reference to supplier evidence',kind:'textarea',required:true}],values:{offerId:'',quantity:'',location:'',expiresAt:'',proof:'',status:'declared'},reasonRequired:false})}><Plus size={14}/> Record declaration</button>}>
     <div className={css.toolbar}><label className={css.search}><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Offer SKU, location or evidence"/></label><button className={css.outline} onClick={()=>exportCsv('angelcare-supplier-availability.csv',['Offer','Quantity','Location','Observed','Valid until','Status','Verified by'],data.availability.map(a=>[offerById(a.supplier_offer_id)?.supplier_sku,a.announced_qty,a.location,a.observed_at,a.valid_until,a.status,a.verified_by]))}><Download size={13}/> Export</button></div>
     <Grid headers={['Supplier offer','Declared quantity','Location','Freshness','Review','Action']} empty="No supplier stock declarations. Never infer availability from missing data." rows={filtered(data.availability,a=>[offerById(a.supplier_offer_id)?.supplier_sku,a.location,a.proof].join(' ')).sort((a,b)=>validDate(b.created_at)-validDate(a.created_at)).map(a=>{const expired=validDate(a.valid_until)<=Date.now();return [<><b>{offerById(a.supplier_offer_id)?.supplier_sku||a.supplier_offer_id?.slice(0,8)}</b><small>{day(a.observed_at)}</small></>,<b>{a.announced_qty}</b>,a.location,<>{expired?<Tag value="expired"/>:<Tag value="current"/>}<small>Expires {day(a.valid_until)}</small></>,<><Tag value={a.status}/><small>{a.verified_by?'Independently verified':'Not yet independently verified'}</small></>,a.status==='declared'&&!expired?<button className={css.mini} onClick={()=>show({title:'Independent stock verification',action:'availability.verify',fields:[{key:'proof',label:'Verification proof reference',kind:'textarea',required:true}],values:{id:a.id,proof:''},reasonRequired:true,requiresConfirmation:true,dangerText:'Confirm independent supplier stock verification? You must not be the declaring operator.'})}>Verify</button>:<span className={css.note}>{expired?'Expired':a.status==='verified'?'Verified':'No review action'}</span>]})}/>
    </Card><Card title="Availability doctrine" sub="Prevent phantom stock and fulfillment promises"><div className={css.controlGrid}>{[['A','Supplier declaration','Not a stock reservation or AngelCare stock'],['B','Independent check','Declaring operator cannot verify the same record'],['C','Time-limited','An expired verification is not current availability'],['D','Public promises','Storefront must use its own approved availability authority']].map(([n,t,d])=><div key={n}><b>{n}</b><span><strong>{t}</strong><small>{d}</small></span></div>)}</div></Card>
   </>}
   {active==='fulfillment'&&<>
    <Card title="Dispatch and delivery control" sub="Every shipment is linked to an issued/accepted purchase order" action={<button className={css.primary} onClick={()=>show({title:'Create shipment dossier',action:'shipment.create',fields:[{key:'purchaseId',label:'Issued / accepted PO',kind:'select',options:poOpts.filter(([id])=>['issued','accepted','shipped'].includes(purchaseById(id)?.status)),required:true},{key:'journeyId',label:'Customer journey UUID (optional)'},{key:'carrier',label:'Carrier'},{key:'tracking',label:'Real carrier tracking number'},{key:'origin',label:'Origin'},{key:'destination',label:'Destination'},{key:'expected',label:'Expected delivery',kind:'datetime-local'}],values:{purchaseId:'',journeyId:'',carrier:'',tracking:'',origin:'',destination:'',expected:''},requiresConfirmation:true,dangerText:'Create a shipment dossier? This does NOT book a carrier.'})}><Plus size={14}/> Shipment dossier</button>}>
     <div className={css.toolbar}><label className={css.search}><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Shipment, tracking, carrier or status"/></label><button className={css.outline} onClick={()=>exportCsv('angelcare-fulfillment.csv',['Shipment','PO','Carrier','Tracking','Status','Destination','ETA'],data.shipments.map(s=>[s.reference,purchaseById(s.purchase_id)?.reference,s.carrier,s.tracking_number,s.status,s.destination,s.expected_at]))}><Download size={13}/> Export</button></div>
     <Grid headers={['Shipment','Purchase order','Carrier & tracking','Status','Service evidence','Actions']} empty="No shipment dossiers are currently present." rows={filtered(data.shipments,s=>[s.reference,s.status,s.carrier,s.tracking_number].join(' ')).map(s=>{const ev=data.shipmentEvents.filter(x=>x.shipment_id===s.id);return [<><b>{s.reference}</b><small>{day(s.updated_at)}</small></>,purchaseById(s.purchase_id)?.reference||'—',<><b>{s.carrier||'Carrier not assigned'}</b><small className={css.mono}>{s.tracking_number||'No tracking yet'}</small></>,<Tag value={s.status}/>,<><small>Events {ev.length} · ETA {day(s.expected_at)}</small><small>{s.proof?'Proof recorded':'No delivery proof'}</small></>,<div className={css.inlineActions}>{(shipTransitions[s.status]||[]).map(status=><button className={css.mini} key={status} onClick={()=>show({title:`Shipment ${s.reference} → ${status}`,action:'shipment.transition',fields:[{key:'carrier',label:'Carrier (optional)'},{key:'tracking',label:'Tracking number (optional)'},{key:'proof',label:'Delivery or exception evidence',kind:'textarea',required:status==='delivered'}],values:{id:s.id,status,carrier:s.carrier||'',tracking:s.tracking_number||'',proof:''},reasonRequired:true,requiresConfirmation:true,dangerText:`Confirm ${status.toUpperCase()} with recorded evidence?`})}>{status}</button>)}</div>]})}/>
    </Card>
    <Card title="Shipment milestone history" sub="Immutable event records from canonical fulfillment" action={<select className={css.compactSelect} value={current} onChange={e=>setCurrent(e.target.value)}><option value="">Select shipment</option>{data.shipments.map(s=><option value={s.id} key={s.id}>{s.reference}</option>)}</select>}>
     {!current?<Empty description="Select a shipment to see its actual event history."/>:<Grid headers={['Event','When','Operator','Notes']} empty="No milestone records for this shipment." rows={data.shipmentEvents.filter(e=>e.shipment_id===current).sort((a,b)=>validDate(b.occurred_at)-validDate(a.occurred_at)).map(e=>[<Tag value={e.event_status}/>,day(e.occurred_at),<span className={css.mono}>{string(e.operator_id).slice(0,18)}</span>,e.notes||'—'])}/>}
    </Card>
   </>}
   {active==='automation'&&<>
    <Card title="Integration readiness & operational guardrails" sub="Observed system records only; no invented monitoring jobs or live provider statuses">
     <div className={css.healthGrid}><div><Database size={22}/><b>Canonical supplier API</b><Tag value="connected"/><small>Snapshot received from protected endpoint</small></div><div><Globe2 size={22}/><b>ONE WORLD FX source</b><Tag value={data.rateBookConnected?'connected':'unavailable'}/><small>{data.rateBook.length} approved rate records loaded</small></div><div><ShieldCheck size={22}/><b>Approval authority</b><Tag value="enforced"/><small>Dual PO and availability controls in existing database RPC</small></div><div><Zap size={22}/><b>Scheduled provider synchronization</b><Tag value="not configured"/><small>Not claimed active. Requires credentials, worker deployment and monitored schedule.</small></div></div>
    </Card>
    <Card title="Operational exceptions" sub="Real signals from the currently fetched supplier, stock, PO and fulfillment records">
     <div className={css.controlGrid}>{[
      ['!', 'Expired verified supplier stock',`${expiredStock.length} expired record(s); do not treat as available`],
      ['!', 'Shipment exceptions',`${data.shipments.filter(x=>x.status==='exception').length} shipment(s) requiring human recovery`],
      ['!', 'Overdue supplier tasks',`${data.tasks.filter(x=>!['done','cancelled'].includes(x.status)&&x.due_on&&new Date(x.due_on).getTime()<Date.now()).length} active task(s) overdue`],
      ['!', 'POs awaiting independent approval',`${data.purchases.filter(x=>x.status==='review').length} purchase order(s) in review`],
      ['!', 'Draft supplier offers',`${data.offers.filter(x=>x.status==='draft').length} offer(s) not approved`],
      ['!', 'Supplier qualification gaps',`${data.suppliers.filter(x=>!['approved','active'].includes(x.status)).length} supplier(s) not approved or active`],
     ].map(([a,b,c])=><div key={b}><b>{a}</b><span><strong>{b}</strong><small>{c}</small></span></div>)}</div>
    </Card>
    <Card title="System audit trail" sub="Canonical audit rows; inspect actual authority decisions before retrying an operation" action={<button className={css.outline} onClick={()=>exportCsv('angelcare-supplier-ops-audit.csv',['Time','Actor','Action','Entity','ID','Reason'],auditRows.map(a=>[a.created_at,a.actor_id,a.action,a.entity,a.entity_id,a.reason]))}><Download size={14}/> Export evidence</button>}>
     <div className={css.toolbar}><label className={css.search}><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search actor, entity, action or reason"/></label><span className={css.note}>Latest fetched audit records only</span></div>
     <Grid headers={['Time','Action','Affected entity','Actor','Recorded reason']} empty="No matching audit evidence in the fetched window." rows={filtered(auditRows,a=>[a.action,a.entity,a.reason,a.actor_id].join(' ')).map(a=>[day(a.created_at),<b>{a.action}</b>,<><b>{a.entity}</b><small className={css.mono}>{a.entity_id||'—'}</small></>,<span className={css.mono}>{string(a.actor_id).slice(0,16)}</span>,a.reason||'—'])}/>
    </Card>
    <Card title="Recovery & integration actions" sub="Explicit operator control; no silent retries or external purchases"><div className={css.process}><a href="/angelcare-marketplace/admin/supplier-command-360"><b>01</b><span>Open Supplier Command 360</span><ExternalLink size={14}/></a><a href="/angelcare-marketplace/admin/supplier-command-360/product-launch"><b>02</b><span>Review Product 360 launch</span><ExternalLink size={14}/></a><a href="/angelcare-marketplace/admin/supplier-command-360/trilingual-import"><b>03</b><span>Review multilingual imports</span><ExternalLink size={14}/></a><button onClick={async()=>{setBusy(true);try{await reload();setSuccess('Reconciliation read completed: canonical snapshot refreshed. No writes performed.')}catch(e){setError(sanitizeError(e))}finally{setBusy(false)}}}><b>04</b><span>Run read-only reconciliation now</span><RefreshCw size={14}/></button></div><div className={css.notice}><AlertTriangle size={16}/> Real scheduled sync, provider retry queues, stock publication and carrier webhooks require separately verified provider API contracts and scheduled worker infrastructure. This screen does not falsely claim they are running.</div></Card>
   </>}
   <div className={css.footer}><span><Check size={13}/> Audit & identity preserved</span><span><ShieldCheck size={13}/> Human-controlled purchasing</span><span><Database size={13}/> Existing canonical authorities</span></div>
   </>}
  </main></div>
  {form&&<div className={css.overlay} role="dialog" aria-modal="true" aria-label={form.title}><div className={css.drawer}><header><div><span className={css.overline}>CANONICAL OPERATION</span><h3>{form.title}</h3><p>Every mutation is checked by the existing server and database authority.</p></div><button className={css.icon} onClick={()=>setForm(null)} aria-label="Close"><X size={20}/></button></header><div className={css.drawerBody}><div className={css.drawerFields}>{form.fields.map(field=><FormInput field={field} key={field.key} value={form.values[field.key]} onValue={v=>setForm(x=>x?{...x,values:{...x.values,[field.key]:v}}:null)}/>)}</div>{form.reasonRequired&&<label className={css.field}><span>Decision reason (required, at least 5 characters)</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>}{form.requiresConfirmation&&<div className={css.notice}><ShieldCheck size={17}/> This action requires explicit confirmation and remains subject to server-side permissions, transaction rules and idempotency.</div>}</div><footer><button className={css.outline} onClick={()=>setForm(null)}>Cancel</button><button disabled={busy} onClick={onSubmit} className={css.primary}>{busy?<LoaderCircle className={css.spin} size={14}/>:<Check size={14}/>} Save through authority</button></footer></div></div>}
 </div>
}
