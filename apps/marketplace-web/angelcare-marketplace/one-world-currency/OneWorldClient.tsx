
'use client'
import {useCallback,useEffect,useMemo,useState} from 'react'
import {Activity,ArrowLeftRight,BarChart3,Check,ChevronRight,CircleAlert,ClipboardList,CreditCard,Database,Download,FileSpreadsheet,Globe2,History,Layers,LoaderCircle,Plus,RefreshCcw,Search,ShieldCheck,SlidersHorizontal} from 'lucide-react'
import style from './one-world.module.css'
type Row=Record<string,any>
type Data={countries:Row[];rates:Row[];batches:Row[];margins:Row[];audit:Row[];config:Row}
const endpoint='/api/angelcare-marketplace/admin/one-world-currency'
const sections=[
 ['overview','Mission Control',Activity],['countries','Country Policy',Globe2],
 ['rates','FX Rate Authority',ArrowLeftRight],['bulk','Bulk Rate Import',FileSpreadsheet],
 ['margins','Margin Operations',SlidersHorizontal],['lab','Live Price Lab',BarChart3],
 ['batches','Approval & Revision',ShieldCheck],['history','Audit & Evidence',History],
 ['payments','Payment Boundaries',CreditCard],['settings','Infrastructure',Database]
] as const
function today(){return new Date().toISOString().slice(0,10)}
async function req(body?:Row):Promise<any>{
 const r=await fetch(endpoint,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'})
 const v=await r.json().catch(()=>({}))
 if(!r.ok||v.error)throw Error(v.error?.message||('Request failed '+r.status))
 return v.data
}
const num=(n:unknown)=>Number(n||0)
const fmt=(v:unknown)=>new Intl.NumberFormat('en',{maximumFractionDigits:5}).format(Number(v||0))
export function OneWorldClient(){
 const [data,setData]=useState<Data|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('')
 const [section,setSection]=useState('overview'),[filter,setFilter]=useState('')
 const [country,setCountry]=useState('MA'),[usd,setUsd]=useState('100')
 const [quote,setQuote]=useState<Row|null>(null)
 const [rateCurrency,setRateCurrency]=useState('MAD'),[rateValue,setRateValue]=useState(''),[rateDate,setRateDate]=useState(today()),[rateSource,setRateSource]=useState('manual')
 const [csv,setCsv]=useState(''),[marginScope,setMarginScope]=useState('country'),[marginKey,setMarginKey]=useState('MA'),[marginPercent,setMarginPercent]=useState('0')
 const [editing,setEditing]=useState<Row|null>(null),[newCountry,setNewCountry]=useState(false)
 const reload=useCallback(async()=>{setData(await req())},[])
 useEffect(()=>{reload().catch(e=>setError(String(e.message||e)))},[reload])
 async function run(body:Row,done?:()=>void){
  setBusy(true);setError('');setSuccess('')
  try{const result=await req(body);setSuccess('Operation confirmed and saved in Supabase');await reload();done?.();return result}
  catch(e){setError(e instanceof Error?e.message:String(e));return null}
  finally{setBusy(false)}
 }
 const countries=useMemo(()=>data?.countries.filter(x=>[x.code,x.name,x.region,x.currency].join(' ').toLowerCase().includes(filter.toLowerCase()))||[],[data,filter])
 const activeRates=data?.rates.filter(x=>x.status==='active')||[]
 const activeBatchIds=new Set(data?.batches.filter(x=>x.status==='active').map(x=>x.id))
 const currentCountry=data?.countries.find(x=>x.code===country)
 const ready=Boolean(data)
 const selected=sections.find(x=>x[0]===section)||sections[0]
 function download(contents:string,name:string){
  const url=URL.createObjectURL(new Blob([contents],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)
 }
 function captureRate(){void run({action:'stageRates',source:'manual',label:'Manual FX '+rateCurrency+' '+today(),rows:[{currency:rateCurrency.toUpperCase(),rate:rateValue,observed_on:rateDate}]},()=>setRateValue(''))}
 function importCsv(){
  const lines=csv.trim().replace(/^\uFEFF/,'').split(/\r?\n/)
  if(lines.length<2){setError('CSV header and at least one rate required');return}
  const header=lines.shift()!.split(',').map(x=>x.trim().toLowerCase())
  if(!['currency','rate','observed_on'].every(x=>header.includes(x))){setError('Headers must contain currency,rate,observed_on');return}
  const rows=lines.map(line=>{const p=line.split(',');return Object.fromEntries(header.map((x,i)=>[x,p[i]?.trim()||'']))})
  void run({action:'stageRates',source:'csv',label:'CSV import '+today(),rows},()=>setCsv(''))
 }
 return <div className={style.root}>
  <header className={style.header}>
   <div><div className={style.eyebrow}><Globe2 size={14}/> ANGELCARE / FINANCIAL CONTROL TOWER</div>
    <h1>ONE WORLD <span>CURRENCY COMMAND</span></h1>
    <p>USD authority · Cross-border currency operations · Market governance</p></div>
   <div className={style.headerRight}><span className={style.pill}><ShieldCheck size={14}/> SHADOW MODE</span>
    <button className={style.btn} disabled={busy} onClick={()=>void reload()}><RefreshCcw size={15}/> Refresh</button></div>
  </header>
  {error&&<div className={style.alert}><CircleAlert size={18}/><span>{error}</span><button onClick={()=>setError('')}>Dismiss</button></div>}
  {success&&<div className={style.ok}><Check size={16}/>{success}</div>}
  <div className={style.metrics}>
   <article><span>MASTER CURRENCY</span><strong>USD</strong><small>Fixed pricing authority</small></article>
   <article><span>COUNTRY POLICIES</span><strong>{data?.countries.length??'—'}</strong><small>Persisted market records</small></article>
   <article><span>ACTIVE FX RATES</span><strong>{data?activeRates.length:'—'}</strong><small>Only approved rate entries</small></article>
   <article><span>PENDING RATE BATCHES</span><strong>{data?data.batches.filter(x=>x.status==='staged').length:'—'}</strong><small>Awaiting second-person approval</small></article>
   <article><span>PRICE MARGIN RULES</span><strong>{data?.margins.length??'—'}</strong><small>Country / region / global</small></article>
  </div>
  <div className={style.body}>
   <nav className={style.nav} aria-label="One World operations">
    <div className={style.navLabel}>OPERATOR WORKSPACES</div>
    {sections.map(([id,name,Icon])=><button key={id} className={section===id?style.navActive:style.navItem} onClick={()=>{setSection(id);setFilter('')}}><Icon size={16}/><span>{name}</span><ChevronRight size={14}/></button>)}
   </nav>
   <main className={style.content}>
    <div className={style.heading}><div><div className={style.eyebrow}>GLOBAL FINANCE / {section.toUpperCase()}</div><h2>{selected[1]}</h2></div>
     <span className={style.status}>{data?'DATABASE CONNECTED':'CONNECTING'}</span></div>
    {!ready?<div className={style.center}><LoaderCircle size={24}/> Connecting to self-hosted Supabase. If no schema has been applied, the server will return a configuration error.</div>:null}
    {ready&&section==='overview'&&<>
      <div className={style.notice}>Real database data is shown below. All price operations are isolated from public product pages and PayPal. No customer-facing currency is activated by this workspace.</div>
      <div className={style.cardGrid}>
       {sections.slice(1,7).map(([id,name,Icon])=><button className={style.actionCard} key={id} onClick={()=>setSection(id)}><Icon size={24}/><b>{name}</b><small>Open operational controls</small><ChevronRight size={16}/></button>)}
      </div>
      <h3>Latest rate observations</h3>
      <div className={style.tableOuter}><table><thead><tr><th>Currency</th><th>1 USD</th><th>Observed</th><th>Source</th><th>Status</th></tr></thead><tbody>
       {data.rates.slice(0,25).map(x=><tr key={x.id}><td><b>{x.currency}</b></td><td>{String(x.rate)}</td><td>{x.observed_on}</td><td>{x.source}</td><td><span className={style.chip}>{x.status}</span></td></tr>)}
      </tbody></table></div>
    </>}
    {ready&&section==='countries'&&<>
     <div className={style.bar}><label className={style.search}><Search size={16}/><input placeholder="Country, ISO, region, currency..." value={filter} onChange={e=>setFilter(e.target.value)}/></label>
      <button className={style.btn} onClick={()=>download('code,name,region,currency,uplift_bp,enabled\n'+data.countries.map(x=>[x.code,x.name,x.region,x.currency,x.uplift_bp,x.enabled].join(',')).join('\n'),'angelcare-one-world-countries.csv')}><Download size={15}/> Export</button>
      <button className={style.primary} onClick={()=>{setEditing({code:'',name:'',region:'',currency:'USD',uplift_bp:0,enabled:true});setNewCountry(true)}}><Plus size={15}/> Add country</button>
     </div>
     <div className={style.tableOuter}><table><thead><tr><th>Country</th><th>ISO</th><th>Market group</th><th>Currency</th><th>Uplift</th><th>Active</th><th>Action</th></tr></thead><tbody>
     {countries.map(x=><tr key={x.code}><td><b>{x.name}</b></td><td>{x.code}</td><td>{x.region}</td><td><b>{x.currency}</b></td><td>{num(x.uplift_bp)/100}%</td><td>{x.enabled?'Yes':'No'}</td><td><button className={style.link} onClick={()=>{setEditing({...x});setNewCountry(false)}}>Edit</button></td></tr>)}
     </tbody></table></div>
     {editing&&<div className={style.editor}><div className={style.heading}><h3>{newCountry?'Create market':'Edit '+editing.code}</h3><button className={style.btn} onClick={()=>setEditing(null)}>Close</button></div>
     <div className={style.fields}>
       {(['code','name','region','currency','uplift_bp'] as const).map(k=><label key={k}>{k.replaceAll('_',' ')}<input disabled={!newCountry&&k==='code'} value={String(editing[k]??'')} onChange={e=>setEditing(x=>({...x,[k]:e.target.value}))}/></label>)}
       <label>Market enabled<select value={editing.enabled?'yes':'no'} onChange={e=>setEditing(x=>({...x,enabled:e.target.value==='yes'}))}><option value="yes">Yes</option><option value="no">No</option></select></label>
     </div><button className={style.primary} disabled={busy} onClick={()=>void run({action:'saveCountry',code:editing.code,name:editing.name,region:editing.region,currency:editing.currency,upliftBp:Number(editing.uplift_bp),enabled:editing.enabled},()=>setEditing(null))}>Save market policy</button></div>}
    </>}
    {ready&&section==='rates'&&<>
     <div className={style.notice}>Manual rates are staged first. They are not active until a different authorized administrator approves the batch.</div>
     <button className={style.btn} disabled={busy} onClick={()=>void run({action:'fetchRates'})}><RefreshCcw size={15}/> Fetch current USD reference rates from Frankfurter (stage only)</button>
     <div className={style.fields}>
      <label>Target currency<input value={rateCurrency} maxLength={3} onChange={e=>setRateCurrency(e.target.value.toUpperCase())}/></label>
      <label>1 USD equals<input value={rateValue} placeholder="Enter actual observed rate" onChange={e=>setRateValue(e.target.value)}/></label>
      <label>Observed date<input type="date" value={rateDate} onChange={e=>setRateDate(e.target.value)}/></label>
      <label>Source type<input value="Manual operator capture" disabled/></label>
     </div>
     <button className={style.primary} onClick={captureRate} disabled={busy||!rateValue}>Stage verified rate</button>
     <h3>Active and historical rates</h3>
     <div className={style.tableOuter}><table><thead><tr><th>Currency</th><th>Rate</th><th>Observation</th><th>Source</th><th>State</th></tr></thead><tbody>{data.rates.slice(0,150).map(x=><tr key={x.id}><td>{x.currency}</td><td><b>{String(x.rate)}</b></td><td>{x.observed_on}</td><td>{x.source}</td><td>{x.status}</td></tr>)}</tbody></table></div>
    </>}
    {ready&&section==='bulk'&&<>
      <div className={style.notice}>Import comma-separated CSV rows. Validate and stage up to 300 rates per batch. This mode deliberately refuses duplicate currencies and USD identity overrides.</div>
      <button className={style.btn} onClick={()=>download('currency,rate,observed_on\nMAD,,\nEUR,,\nCAD,,','one-world-rate-template.csv')}><Download size={15}/> Download CSV template</button>
      <label className={style.upload}><FileSpreadsheet size={17}/> Load CSV file<input type="file" accept=".csv,text/csv" onChange={async e=>{const f=e.target.files?.[0];if(f)setCsv(await f.text())}}/></label>
      <textarea className={style.textarea} value={csv} onChange={e=>setCsv(e.target.value)} placeholder={'currency,rate,observed_on\nMAD,9.5,2026-10-28'} rows={13}/>
      <button className={style.primary} disabled={busy||!csv.trim()} onClick={importCsv}>Validate and stage CSV rate batch</button>
    </>}
    {ready&&section==='margins'&&<>
      <div className={style.notice}>Uplift precedence is Country → Region → Global. Use basis points (100 bp = 1%). These rules are stored but not applied to public product prices in shadow mode.</div>
      <div className={style.fields}>
       <label>Target level<select value={marginScope} onChange={e=>{setMarginScope(e.target.value);setMarginKey(e.target.value==='global'?'*':e.target.value==='country'?'MA':'Europe')}}><option value="country">Country</option><option value="region">Region</option><option value="global">Global</option></select></label>
       <label>Scope key<input value={marginKey} onChange={e=>setMarginKey(e.target.value)}/></label>
       <label>Price uplift %<input type="number" value={marginPercent} onChange={e=>setMarginPercent(e.target.value)}/></label>
      </div><button className={style.primary} disabled={busy} onClick={()=>void run({action:'saveMargin',scope:marginScope,key:marginKey,upliftBp:Math.round(Number(marginPercent)*100)})}>Save effective margin rule</button>
      <h3>Approved margin configuration</h3>
      <div className={style.tableOuter}><table><thead><tr><th>Scope</th><th>Key</th><th>Uplift</th><th>Last update</th></tr></thead><tbody>{data.margins.map(x=><tr key={x.id}><td>{x.scope}</td><td>{x.scope_key}</td><td>{num(x.uplift_bp)/100}%</td><td>{x.updated_at}</td></tr>)}</tbody></table></div>
    </>}
    {ready&&section==='lab'&&<>
      <div className={style.notice}>This tool loads the active approved rate from Supabase and creates a persisted pricing simulation. It does not alter actual product prices or payment amounts.</div>
      <div className={style.fields}><label>Target market<select value={country} onChange={e=>setCountry(e.target.value)}>{data.countries.filter(x=>x.enabled).map(x=><option value={x.code} key={x.code}>{x.name} ({x.currency})</option>)}</select></label>
      <label>USD canonical price<input value={usd} onChange={e=>setUsd(e.target.value)}/></label></div>
      <button className={style.primary} disabled={busy} onClick={()=>void (async()=>{const result=await run({action:'simulate',country,usd});if(result)setQuote(result)})()}>Calculate & save simulation</button>
      {quote&&<div className={style.quote}><small>SHADOW QUOTE · {quote.country}</small><strong>{quote.currency} {quote.amount}</strong><span>USD {quote.usd} × {quote.rate} · uplift {quote.upliftBp/100}%</span><small>Simulation receipt: {quote.simulationId}</small></div>}
    </>}
    {ready&&section==='batches'&&<>
     <div className={style.notice}>Four-eyes approval: rate batch authors cannot approve their own batch. The database switches active currency rates atomically.</div>
     <div className={style.tableOuter}><table><thead><tr><th>Batch</th><th>Source</th><th>Created</th><th>Status</th><th>Approve</th></tr></thead><tbody>{data.batches.map(x=><tr key={x.id}><td><b>{x.label}</b><small className={style.subtle}>{x.id}</small></td><td>{x.source}</td><td>{x.created_at}</td><td>{x.status}</td><td><button className={style.btn} disabled={busy||x.status!=='staged'} onClick={()=>void run({action:'approveRates',batchId:x.id})}>Approve & activate</button></td></tr>)}</tbody></table></div>
    </>}
    {ready&&section==='history'&&<div className={style.tableOuter}><table><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Entity</th><th>Reference</th></tr></thead><tbody>{data.audit.map(x=><tr key={x.id}><td>{x.created_at}</td><td>{x.actor_id}</td><td>{x.action}</td><td>{x.entity}</td><td>{x.entity_id}</td></tr>)}</tbody></table></div>}
    {ready&&section==='payments'&&<div className={style.notice}><CreditCard size={20}/> Existing PayPal code uses EUR capture and legacy Dh reconciliation. This workspace cannot mutate payments. Multi-currency checkout requires a separately tested adapter release.</div>}
    {ready&&section==='settings'&&<div className={style.cardGrid}>
      <div className={style.infoCard}><Database size={24}/><b>Supabase authority</b><span>Database-backed country, rate, margin, audit, and simulation operations</span></div>
      <div className={style.infoCard}><ShieldCheck size={24}/><b>Operational mode</b><span>SHADOW · no public mutation</span></div>
      <div className={style.infoCard}><Layers size={24}/><b>USD base</b><span>Rate = 1, immutable identity</span></div>
      <div className={style.infoCard}><ClipboardList size={24}/><b>Control doctrine</b><span>Rate batches require separate approval before activation</span></div>
    </div>}
   </main>
  </div>
  <footer className={style.footer}>ANGELCARE · ONE WORLD CURRENCY R1 · Admin-only data management · Public site unchanged</footer>
 </div>
}
