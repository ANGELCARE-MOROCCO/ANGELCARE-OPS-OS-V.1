'use client'
import {useCallback,useEffect,useMemo,useState,type ReactNode} from 'react'
import {Activity,AlertCircle,ArrowDownToLine,ArrowRight,ArrowUpRight,BarChart3,Bell,BookOpen,Boxes,Check,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,ClipboardCheck,Clock3,Database,ExternalLink,FileText,Filter,Globe2,Image as ImageIcon,Layers3,LayoutGrid,List,LoaderCircle,Lock,MapPin,Package,PackageCheck,Plus,RefreshCw,Search,Settings2,ShieldCheck,ShoppingBag,ShoppingCart,SlidersHorizontal,Sparkles,Tag,Truck,Upload,Users,Wallet,X} from 'lucide-react'
import {EMPTY_COMPLIANCE,EMPTY_EDITORIAL,editorialGate,suggestedPrice,type Provider,type ProviderState,type SupplierListing,type Selection,type Editorial,type Compliance} from './contract'
import css from './ops.module.css'
import type { CjCategory } from './cj-native'

type Row=Record<string,any>
type OneWorldShadowQuote={
  country:string
  amount:string
  currency:string
  source:'ONE_WORLD_NATIVE_SHADOW'
  rate:string
  upliftBp:number
}

function isOneWorldShadowQuote(
  value:Row|null
):value is OneWorldShadowQuote{
  return value!==null
    && value.source==='ONE_WORLD_NATIVE_SHADOW'
    && typeof value.country==='string'
    && /^[A-Z]{2}$/.test(value.country)
    && typeof value.amount==='string'
    && typeof value.currency==='string'
    && /^[A-Z]{3}$/.test(value.currency)
    && typeof value.rate==='string'
    && Number.isSafeInteger(value.upliftBp)
}
type Snapshot={providers:ProviderState[];selections:Selection[];categories:Row[];events:Row[];imports:Row[];generatedAt:string;finance?:{books:Row[];rules:Row[];authorityAvailable:boolean};cjBridges?:{items:Row[];available:boolean}}
type Legacy={suppliers:Row[];profiles:Row[];documents:Row[];media:Row[];channels:Row[];assortments:Row[];catalog:Row[];offers:Row[];commercials:Row[];imports:Row[];importRows:Row[];journeys:Row[];payments:Row[];purchases:Row[];purchaseLines:Row[];availability:Row[];shipments:Row[];shipmentEvents:Row[];tasks:Row[];audit:Row[];rateBook:Row[]}
type SelectionDraft=Omit<Partial<Selection>,'editorial'|'compliance'> & {editorial?:Partial<Editorial>;compliance?:Partial<Compliance>}
const base='/angelcare-marketplace/admin/supplier-command-360'
const url='/api/angelcare-marketplace/admin/supplier-ops-max'
const legacyUrl='/api/angelcare-marketplace/admin/supplier-command-360'
const tabs=[
 ['01','Command Center','Unified supplier intelligence',Activity],
 ['02','Connections & API Hub','CJ / Fulfillbot / HyperSKU / EPROLO',Database],
 ['03','Discover Catalogue','Live multi-supplier discovery',Search],
 ['04','My Selection & Variants','Sourcing shortlist and variant editor',ShoppingBag],
 ['05','Suppliers 360','Verified supplier authority',Users],
 ['06','Channels & Collections','Internal merchandizing ownership',Layers3],
 ['07','Catalogue & Sourcing','Offers and canonical product alignment',Package],
 ['08','Imports & Media','Preflight, media and asset controls',Upload],
 ['09','Product Launch','Product 360 and governed publication',PackageCheck],
 ['10','Trilingual Import','FR / EN / AR editorial closure',Globe2],
 ['11','Pricing & Profitability','Landed cost, margin and FX',BarChart3],
 ['12','Customer Orders','Canonical customer requests',ShoppingCart],
 ['13','Supplier Purchasing','Approved purchase-order workflow',Wallet],
 ['14','Stock & Availability','Supplier declarations, no invented stock',Boxes],
 ['15','Shipping & Tracking','Movement, milestones and delivery',Truck],
 ['16','Automation & Audit','Connector events and operational evidence',Settings2],
] as const
const currencies=['USD','CNY','EUR','MAD','GBP']
const money=(v:unknown,code='USD')=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(v))+' '+code
const stamp=(v:unknown)=>{if(!v)return'—';const d=new Date(String(v));return Number.isFinite(d.valueOf())?d.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—'}
const text=(v:unknown)=>String(v??'').trim()
const uniq=(xs:string[])=>[...new Set(xs)]
const linkTarget=(path:string)=>path.startsWith('http')?path:base+path
async function response<T>(u:string,options?:RequestInit):Promise<T>{
 const r=await fetch(u,{credentials:'same-origin',cache:'no-store',...options})
 const v=await r.json().catch(()=>null)
 if(!r.ok||!v||!('data' in v))throw Error(v?.error?.message||`Request failed (HTTP ${r.status})`)
 return v.data as T
}
const post=(body:Row)=>response<Row>(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
function Btn({children,onClick,disabled=false,variant='default',title}:{children:ReactNode;onClick?:()=>void;disabled?:boolean;variant?:'default'|'gold'|'blue'|'ghost';title?:string}){return <button type="button" title={title} className={`${css.btn} ${css[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>}
function Badge({children,tone='neutral'}:{children:ReactNode;tone?:'green'|'red'|'amber'|'blue'|'neutral'}){return <span className={`${css.badge} ${css[tone]}`}>{children}</span>}
function Empty({title,detail}:{title:string;detail?:string}){return <div className={css.empty}><Package size={27}/><b>{title}</b><small>{detail||'There are no records in the connected backend. Nothing has been simulated.'}</small></div>}
function Card({title,meta,children,action,className}:{title?:string;meta?:string;children:ReactNode;action?:ReactNode;className?:string}){return <section className={`${css.card} ${className||''}`}>{title&&<header className={css.cardHead}><div><h3>{title}</h3>{meta&&<span>{meta}</span>}</div>{action}</header>}{children}</section>}
function Stat({label,value,detail,icon:Icon,tone='blue'}:{label:string;value:string|number;detail?:string;icon:typeof Activity;tone?:'gold'|'blue'|'pink'|'green'}){return <div className={css.stat}><span className={`${css.statIcon} ${css['stat'+tone]}`}><Icon size={22}/></span><div><small>{label}</small><strong>{value}</strong><em>{detail||'Connected source'}</em></div></div>}
function DataTable({head,rows,empty='No records'}:{head:string[];rows:ReactNode[][];empty?:string}){return <div className={css.tableWrap}><table><thead><tr>{head.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length&&<Empty title={empty}/>}</div>}
function Img({src,label,large=false}:{src:string|null|undefined;label:string;large?:boolean}){return src?<img className={large?css.heroPhoto:css.thumb} src={src} alt={label} loading="lazy" referrerPolicy="no-referrer"/>:<span className={`${css.missingPhoto} ${large?css.heroPhoto:''}`}><ImageIcon size={30}/></span>}
function Segments({value,items,onChange}:{value:string;items:string[];onChange:(s:string)=>void}){return <div className={css.segments}>{items.map(x=><button key={x} onClick={()=>onChange(x)} className={value===x?css.segmentActive:''}>{x}</button>)}</div>}
function Field({label,value,onChange,type='text',wide=false,placeholder}:{label:string;value:string|number;onChange:(v:string)=>void;type?:'text'|'number'|'textarea';wide?:boolean;placeholder?:string}){return <label className={`${css.field} ${wide?css.fieldWide:''}`}><span>{label}</span>{type==='textarea'?<textarea rows={4} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</label>}
function CheckField({label,checked,onChange,sub}:{label:string;checked:boolean;onChange:(v:boolean)=>void;sub?:string}){return <label className={css.checkField}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span><b>{label}</b>{sub&&<small>{sub}</small>}</span></label>}
function CsvButton({rows,name}:{rows:Row[];name:string}){return <Btn disabled={!rows.length} onClick={()=>{const headers=uniq(rows.flatMap(Object.keys));const esc=(s:unknown)=>`"${String(s??'').replaceAll('"','""')}"`;const csv='\uFEFF'+headers.join(',')+'\r\n'+rows.map(r=>headers.map(k=>esc(typeof r[k]==='object'?JSON.stringify(r[k]):r[k])).join(',')).join('\r\n');const b=new Blob([csv],{type:'text/csv;charset=utf-8'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}}><ArrowDownToLine size={15}/> Export CSV</Btn>}

export function SupplierOpsMax(){
 const [tab,setTab]=useState(1),[data,setData]=useState<Snapshot|null>(null),[legacy,setLegacy]=useState<Legacy|null>(null)
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [provider,setProvider]=useState<Provider>('cj'),[query,setQuery]=useState('montessori'),[page,setPage]=useState(1)
 const [results,setResults]=useState<SupplierListing[]>([]),[total,setTotal]=useState<number|null>(null),[searched,setSearched]=useState(false),[minCost,setMinCost]=useState(''),[maxCost,setMaxCost]=useState(''),[stockOnly,setStockOnly]=useState(false),[withImage,setWithImage]=useState(false),[view,setView]=useState<'grid'|'list'>('grid')
 const [selected,setSelected]=useState<string>(''),[pane,setPane]=useState<'overview'|'variants'|'editorial'|'pricing'|'compliance'|'media'>('overview')
 const [draft,setDraft]=useState<SelectionDraft>({}),[showFilters,setShowFilters]=useState(true),[globalSearch,setGlobalSearch]=useState('')
 const [legacySection,setLegacySection]=useState('')
 const [categoryTree,setCategoryTree]=useState<CjCategory[]>([])
 const [cjCategoryId,setCjCategoryId]=useState('')
 const [warehouseCountry,setWarehouseCountry]=useState('')
 const [sortBy,setSortBy]=useState('0')
 const [sortDir,setSortDir]=useState<'asc'|'desc'>('desc')
 const [verification,setVerification]=useState('0')
 const [flag,setFlag]=useState('')
 const [cjStatus,setCjStatus]=useState('')
 const [categoryTerm,setCategoryTerm]=useState('')
 const [destination,setDestination]=useState('MA')
 const [origin,setOrigin]=useState('CN')
 const [quantity,setQuantity]=useState('1')
 const [freight,setFreight]=useState<{methods:Array<{name:string;price:number|null;estimatedDays:string}>;currency:string;checkedAt:string}|null>(null)
 const [warehouses,setWarehouses]=useState<Array<{warehouse:string;countryCode:string;total:number|null;cjManaged:number|null;factoryManaged:number|null}>>([])
 const [activeVariant,setActiveVariant]=useState('')
 const [financePriceBook,setFinancePriceBook]=useState('')
 const [financePrice,setFinancePrice]=useState('')
 const [financeEvidence,setFinanceEvidence]=useState('')
 const [cjPurchaseId,setCjPurchaseId]=useState('')
 const [cjOptions,setCjOptions]=useState<{addresses:Row[];lines:Array<{lineId:string;quantity:number;variants:Array<{id:string;sku:string;label:string}>}>}|null>(null)
 const [cjAddressId,setCjAddressId]=useState('')
 const [cjCountryCode,setCjCountryCode]=useState('MA')
 const [cjOriginCountry,setCjOriginCountry]=useState('CN')
 const [cjProvince,setCjProvince]=useState('')
 const [cjLogisticName,setCjLogisticName]=useState('')
 const [cjConsentEvidence,setCjConsentEvidence]=useState('')
 const [cjVerifiedConsent,setCjVerifiedConsent]=useState(false)
 const [cjVariants,setCjVariants]=useState<Record<string,string>>({})
 const [cjOptionsStatus,setCjOptionsStatus]=useState('')
 const [cjQuoteMethods,setCjQuoteMethods]=useState<string[]>([])
 const [oneWorldCountry,setOneWorldCountry]=useState('MA')
 const [oneWorldResult,setOneWorldResult]=useState<{country:string;amount:string;currency:string;source:string;rate:string;upliftBp:number}|null>(null)
 const load=useCallback(async()=>{
  const [next,old]=await Promise.allSettled([response<Snapshot>(url),response<Legacy>(legacyUrl)])
  if(next.status==='fulfilled')setData(next.value);else setError(next.reason instanceof Error?next.reason.message:String(next.reason))
  if(old.status==='fulfilled')setLegacy(old.value);else setLegacy(null)
  setLoading(false)
 },[])
 useEffect(()=>{load()},[load])
 useEffect(()=>{response<{tree:CjCategory[]}>(url+'?operation=categories').then(x=>setCategoryTree(x.tree)).catch(e=>{setCjStatus('CJ category browsing unavailable: '+(e instanceof Error?e.message:String(e)))})},[])
 const filterParams=()=>{
  const qp=new URLSearchParams()
  if(provider!=='cj')return qp
  if(cjCategoryId)qp.set('categoryId',cjCategoryId)
  if(warehouseCountry)qp.set('countryCode',warehouseCountry.trim().toUpperCase())
  if(minCost)qp.set('startSellPrice',minCost)
  if(maxCost)qp.set('endSellPrice',maxCost)
  if(stockOnly)qp.set('startWarehouseInventory','1')
  if(verification!=='0')qp.set('verifiedWarehouse',verification)
  if(flag)qp.set('productFlag',flag)
  qp.set('orderBy',sortBy);qp.set('sort',sortDir)
  return qp
 }
 useEffect(()=>{const hash=Number(window.location.hash.slice(1));if(hash>=1&&hash<=16)setTab(hash)},[])
 const nav=(n:number)=>{setTab(n);window.history.replaceState(null,'',`#${n}`);setNotice('');setError('')}
 const selectedRow=data?.selections.find(x=>x.id===selected)||data?.selections[0]
 const editing=useMemo(()=>selectedRow?{...selectedRow,...draft,editorial:{...selectedRow.editorial,...draft.editorial},compliance:{...selectedRow.compliance,...draft.compliance}} as Selection:null,[selectedRow,draft])
 const choose=(id:string)=>{setSelected(id);setDraft({});setPane('overview')}
 const pending=(patch:SelectionDraft)=>setDraft(prev=>({...prev,...patch,...(patch.editorial?{editorial:{...prev.editorial,...patch.editorial}}:{}),...(patch.compliance?{compliance:{...prev.compliance,...patch.compliance}}:{})}))
 const act=async(body:Row,success='Saved and audit recorded')=>{setBusy(true);setError('');setNotice('');try{const result=await post(body);setNotice(success);await load();return result}catch(e){setError(e instanceof Error?e.message:String(e));return null}finally{setBusy(false)}}
 const search=async(n=1,p=provider,q=query)=>{
  setBusy(true);setError('');setNotice('');setSearched(true)
  try{
   const qp=filterParams();qp.set('operation','search');qp.set('provider',p);qp.set('q',q);qp.set('page',String(n))
   const out=await response<{items:SupplierListing[];total:number|null;page:number}>(url+'?'+qp.toString())
   setResults(out.items);setTotal(out.total);setPage(out.page)
  }catch(e){setResults([]);setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 const loadCjOptions=async()=>{
  setBusy(true);setError('');setCjOptionsStatus('');setCjOptions(null)
  try{const result=await response<{addresses:Row[];lines:Array<{lineId:string;quantity:number;variants:Array<{id:string;sku:string;label:string}>}>}>(url+'?operation=cj-options&purchaseId='+encodeURIComponent(cjPurchaseId))
    setCjOptions(result);setCjAddressId(result.addresses[0]?.id||'');setCjVariants(Object.fromEntries(result.lines.map(l=>[l.lineId,l.variants.length===1?l.variants[0].id:''])))
    setCjOptionsStatus('Canonical order, customer address and variant mappings loaded; verify them before staging.')
  }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 const cjPayload=()=>({purchaseId:cjPurchaseId,addressId:cjAddressId,countryCode:cjCountryCode,fromCountryCode:cjOriginCountry,
   province:cjProvince,logisticsName:cjLogisticName,variantMap:cjVariants,verifiedShippingConsent:cjVerifiedConsent,consentEvidence:cjConsentEvidence})
 const nextTab=tabs[tab-1]
 const matched=useMemo(()=>results.filter(r=>{
  if(provider!=='cj'&&minCost&&!(r.cost!==null&&r.cost>=Number(minCost)))return false
  if(provider!=='cj'&&maxCost&&!(r.cost!==null&&r.cost<=Number(maxCost)))return false
  if(provider!=='cj'&&stockOnly&&!(r.stock!==null&&r.stock>0))return false
  if(withImage&&!r.imageUrl)return false
  return true
 }),[results,minCost,maxCost,stockOnly,withImage,provider])
 const selectionCounts={selected:data?.selections.length||0,imported:data?.selections.filter(x=>x.catalog_item_id).length||0,ready:data?.selections.filter(s=>editorialGate(s).ok).length||0}
 const realOffers=legacy?.offers||[]
 const counts={suppliers:legacy?.suppliers.length||0,activeSuppliers:legacy?.suppliers.filter(s=>s.status==='active').length||0,orders:legacy?.journeys.length||0,shipments:legacy?.shipments.length||0}
 const configured=data?.providers.filter(p=>p.mode==='configured').length||0
 const fx=(currency:string):number|null=>{
  if(currency==='MAD')return 1
  const rates=legacy?.rateBook||[]
  const mad=rates.find(r=>r.currency==='MAD'),unit=currency==='USD'?{rate:1,observed_on:mad?.observed_on}:rates.find(r=>r.currency===currency)
  if(!mad||!unit)return null
  if(![mad,unit].every(x=>Number.isFinite(Number(x.rate))&&Number(x.rate)>0&&Number.isFinite(new Date(x.observed_on).valueOf())&&Date.now()-new Date(x.observed_on).valueOf()<7*86400000))return null
  return Number(mad.rate)/Number(unit.rate)
 }
 const metric=<div className={css.kpis}>
  <Stat label="Active supplier accounts" value={counts.activeSuppliers} detail="Supplier 360 records" icon={Users} tone="gold"/>
  <Stat label="Supplier offers" value={realOffers.length} detail="Canonical offer records" icon={Tag} tone="pink"/>
  <Stat label="Curated products" value={selectionCounts.selected} detail="Persistent selections" icon={Package} tone="blue"/>
  <Stat label="Product dossiers ready" value={selectionCounts.ready} detail="Strict evidence gate" icon={CheckCircle2} tone="green"/>
  <Stat label="Configured supplier connectors" value={`${configured}/4`} detail="Configured is not authenticated" icon={Database} tone="gold"/>
 </div>
 const docs=data?.providers||[]
 const warning=(v:string)=>setError(v)
 const supplierCount=legacy?legacy.suppliers.length:'—'
 const gotoLegacy=()=>window.open(`${base}/legacy`,'_blank','noopener,noreferrer')
 const providerState=docs.find(x=>x.id===provider)

 return <div className={css.root}>
  <header className={css.brandBar}>
   <div className={css.brandIdentity}><img src="/angelcare-marketplace/brand/angelcare-logo-header.png" alt="AngelCare official logo"/><div><strong>SUPPLIER OPS <em>MAX</em></strong><small>China sourcing • Global marketplace • Governed commerce</small></div></div>
   <div className={css.brandTools}><span className={css.liveDot}/><span>Canonical AngelCare commerce</span><button onClick={()=>{setLoading(true);load()}} title="Refresh live snapshots"><RefreshCw size={16}/></button><button title="Existing Supplier 360" onClick={gotoLegacy}><ExternalLink size={15}/></button></div>
  </header>
  <div className={css.shell}>
   <aside className={css.sidebar}>
    <div className={css.navLabel}>SUPPLIER COMMAND SYSTEM <span>16</span></div>
    <nav aria-label="Supplier Operations Max workspaces">
     {tabs.map(([num,label,detail,Icon],i)=><button key={num} className={`${css.navItem} ${tab===i+1?css.navActive:''}`} onClick={()=>nav(i+1)} title={detail}>
      <span className={css.navNum}>{num}</span><Icon size={17}/><span>{label}</span>{tab===i+1&&<ChevronRight size={14}/>}
     </button>)}
    </nav>
    <div className={css.navBottom}><ShieldCheck size={17}/><div><b>No demo inventory</b><small>Only live provider and canonical data</small></div></div>
   </aside>
   <main className={css.main}>
    <section className={css.heading}><div><div className={css.eyebrow}><span className={css.headingNum}>{nextTab[0]}</span><span>SUPPLIER INTELLIGENCE / ANGELCARE</span></div><h1>{nextTab[1]}</h1><p>{nextTab[2]}</p></div><div className={css.headingActions}><Btn onClick={()=>{setLoading(true);load()}} disabled={busy}><RefreshCw size={15}/> Refresh</Btn>{tab!==2&&<Btn variant="gold" onClick={()=>nav(3)}><Search size={15}/> Discover products</Btn>}</div></section>
    {error&&<div role="alert" className={css.error}><AlertCircle size={18}/><span>{error}</span><button onClick={()=>setError('')} aria-label="Dismiss"><X size={16}/></button></div>}
    {notice&&<div role="status" className={css.notice}><CheckCircle2 size={18}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
    {loading&&<div className={css.loading}><LoaderCircle className={css.spin}/> Connecting to the real AngelCare supplier authorities…</div>}
    {!loading&&data&&<>
     {tab===1&&<>{metric}
      <div className={css.threeCol}>
       <Card title="Supplier supply chain" meta="Real sourcing pipeline; amounts reflect stored records only" className={css.wideTwo} action={<Badge tone="blue">Current snapshot</Badge>}>
        <div className={css.pipeline}>{[
         ['Discovered',selectionCounts.selected],['Editorial ready',selectionCounts.ready],['Imported',selectionCounts.imported],['Canonical offers',realOffers.length],['Live suppliers',counts.activeSuppliers]
        ].map(([name,n],i)=><button key={name} onClick={()=>nav([4,4,9,7,5][i])} className={css.stage}><small>{name}</small><strong>{n}</strong><span>View <ArrowRight size={12}/></span></button>)}</div>
        <div className={css.chartHead}><strong>Selected supplier distribution</strong><small>Actual normalized product records</small></div>
        {docs.map(p=>{const n=data.selections.filter(s=>s.provider===p.id).length;return <div className={css.chartLine} key={p.id}><b>{p.name}</b><span className={css.bar}><i style={{width:`${selectionCounts.selected?100*n/selectionCounts.selected:0}%`}}/></span><strong>{n}</strong></div>})}
       </Card>
       <Card title="Live connector readiness" meta="Server secrets and validated upstream specifications">
        {docs.map(p=><button className={css.providerMini} key={p.id} onClick={()=>{setProvider(p.id);nav(2)}}><span className={css.providerSymbol}>{p.name.slice(0,2)}</span><span><b>{p.name}</b><small>{p.capabilities.length} documented capabilities</small></span><Badge tone={p.mode==='configured'?'blue':p.mode==='documentation_required'?'amber':'red'}>{p.mode.replaceAll('_',' ')}</Badge></button>)}
       </Card>
       <Card title="Operational incidents & audit" meta="Latest recorded events from real supplier workflows" className={css.fullWidth} action={<Btn variant="ghost" onClick={()=>nav(16)}>All events <ArrowRight size={15}/></Btn>}>
        <DataTable head={['Timestamp','Action','Subject','Evidence']} rows={data.events.slice(0,7).map(e=>[stamp(e.created_at),<strong key="a">{e.action}</strong>,<span key="b" className={css.mono}>{text(e.selection_id).slice(0,12)||'—'}</span>,e.note||'—'])} empty="No audited supplier changes recorded"/>
       </Card>
      </div>
     </>}
     {tab===2&&<><div className={css.providerGrid}>{docs.map(p=><Card key={p.id} title={p.name} meta={p.note} action={<Badge tone={p.mode==='configured'?'blue':p.mode==='documentation_required'?'amber':'red'}>{p.mode.replaceAll('_',' ')}</Badge>}><div className={css.providerCardHero}><span>{p.name.slice(0,2).toUpperCase()}</span><div><b>{p.credentialsConfigured?'Server credential configured':p.mode==='documentation_required'?'Provider documentation pending':'Server credential missing'}</b><small>{p.capabilities.length?p.capabilities.join(' · '):'No API endpoints assumed'}</small></div></div><div className={css.buttonRow}><Btn disabled={!p.capabilities.includes('search')} onClick={()=>{setProvider(p.id);setQuery('montessori');nav(3);search(1,p.id,'montessori')}}><Search size={14}/> Test real search</Btn><a className={css.docLink} href={p.docs} target="_blank" rel="noreferrer">Documentation <ExternalLink size={13}/></a></div></Card>)}</div>
      <Card title="CJ authenticated endpoint test" meta="Calls genuine category API; no credentials displayed" action={<Btn disabled={busy} onClick={async()=>{setBusy(true);try{const result=await response<{authenticationTest:{ok:boolean;status:string;checkedAt:string}}>(url+'?operation=health');setCjStatus(result.authenticationTest.ok?'CJ authenticated and category endpoint tested at '+result.authenticationTest.checkedAt:'CJ API test failed; check server credentials and permissions')}catch(e){setCjStatus(String(e))}finally{setBusy(false)}}}><RefreshCw size={14}/> Verify actual CJ access</Btn>}><p className={css.smallNotice}>{cjStatus||'No live authentication test has yet been performed in this session. A configured environment variable is not proof of connectivity.'}</p></Card>
      <Card title="Connection security policy"
 meta="A credential presence flag is not a successful authenticated test"><div className={css.policyGrid}>{[['Server-only secrets','CJ_ACCESS_TOKEN • FULFILLBOT_API_KEY'],['Source protections','HTTPS allowlist, bounded response, timeout and no browser keys'],['Manual gates','No unattended paid orders, publishing or supplier approval'],['HyperSKU / EPROLO','Specification and credentials needed for live product actions']].map(([a,b])=><div key={a}><ShieldCheck size={18}/><span><b>{a}</b><small>{b}</small></span></div>)}</div></Card></>}
     {tab===3&&<>
      <div className={css.searchPanel}><div className={css.searchRow}><div className={css.searchBox}><Search size={21}/><input aria-label="Search live supplier products" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')search(1)}} placeholder="Search a product, SKU, Montessori kit, childcare accessory…"/></div><select className={css.providerSelect} value={provider} onChange={e=>{setProvider(e.target.value as Provider);setSearched(false);setResults([]);setTotal(null)}}>{docs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><Btn variant="gold" disabled={busy||(provider!=='cj'&&query.trim().length<2)} onClick={()=>search(1)}><Search size={16}/> Search live API</Btn></div><div className={css.searchFoot}><span>Provider: <b>{providerState?.mode.replaceAll('_',' ')}</b></span><span>Results shown only after real API response</span><button onClick={()=>setShowFilters(!showFilters)}><Filter size={14}/> {showFilters?'Hide':'Show'} filters</button></div></div>
      <div className={css.discovery}>
       {showFilters&&<aside className={css.filterPanel}><b>Advanced source filters</b>
        {provider==='cj'&&<>
         <label className={css.field}><span>Real CJ categories · choose leaf</span><select value={cjCategoryId} onChange={e=>setCjCategoryId(e.target.value)}><option value="">All supplier categories</option>{categoryTree.flatMap(a=>a.children.flatMap(b=>b.children.map(c=><option key={c.id} value={c.id}>{c.path}</option>)))}</select></label>
         <Field label="Warehouse country code (e.g. US, CN)" value={warehouseCountry} onChange={setWarehouseCountry}/>
         <label className={css.field}><span>Inventory verification</span><select value={verification} onChange={e=>setVerification(e.target.value)}><option value="0">All stock sources</option><option value="1">Verified inventory only</option><option value="2">Unverified inventory</option></select></label>
         <label className={css.field}><span>CJ product group</span><select value={flag} onChange={e=>setFlag(e.target.value)}><option value="">All groups</option><option value="0">Trending</option><option value="1">Recently listed</option><option value="2">Video products</option><option value="3">Slow moving</option></select></label>
         <label className={css.field}><span>Server sort field</span><select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="0">Best match</option><option value="1">Listing count</option><option value="2">Supplier price</option><option value="3">Date added</option><option value="4">Inventory</option></select></label>
         <label className={css.field}><span>Direction</span><select value={sortDir} onChange={e=>setSortDir(e.target.value as 'asc'|'desc')}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
        </>}
        <Field label="Minimum supplier cost" value={minCost} onChange={setMinCost} type="number"/><Field label="Maximum supplier cost" value={maxCost} onChange={setMaxCost} type="number"/><CheckField label="Known stock > 0" checked={stockOnly} onChange={setStockOnly} sub="Unknown inventory is not treated as available"/><CheckField label="Has source photography" checked={withImage} onChange={setWithImage}/><Btn onClick={()=>{setMinCost('');setMaxCost('');setStockOnly(false);setWithImage(false);setCjCategoryId('');setWarehouseCountry('');setVerification('0');setFlag('');setSortBy('0');setSortDir('desc')}}><RefreshCw size={14}/> Reset filters</Btn><p>Commercial margin and delivered cost require a verified currency rate, freight and destination taxes.</p></aside>}
       <div className={css.discoveryContent}><div className={css.resultToolbar}><div><strong>{searched?`${matched.length} shown${total!==null?` / ${total} provider matches`:''}`:'Live supplier catalogue'}</strong><small>{searched?'Provider-sourced data · one page at a time':'Run a real search to populate this workspace'}</small></div><Segments value={view} onChange={v=>setView(v as 'grid'|'list')} items={['grid','list']}/></div>
        {!searched?<Empty title="Search a connected supplier" detail="Supplier search requires verified provider access; configuration alone does not prove connectivity. No sample results are displayed."/>:!matched.length?<Empty title="No matching live products" detail="Try another keyword, provider or filter. An empty result is never padded with fabricated listings."/>:<div className={view==='grid'?css.productsGrid:css.productsList}>{matched.map(p=><div key={`${p.provider}:${p.productId}`} className={css.productCard}><div className={css.productImage}><Img src={p.imageUrl} label={p.title}/><Badge tone="blue">{p.provider.toUpperCase()}</Badge></div><h4>{p.title}</h4><small className={css.mono}>SKU {p.sku}</small><div className={css.productNumbers}><strong>{money(p.cost,p.currency)}</strong><span>{p.stock===null?'Stock not provided':`Stock ${p.stock}`}</span></div><div className={css.buttonRow}><Btn onClick={async()=>{let details:SupplierListing=p;try{if(p.variants.length===0)details=await response<SupplierListing>(`${url}?operation=detail&provider=${p.provider}&productId=${encodeURIComponent(p.productId)}`)}catch{/* selection may still save summary with unknown variants */}const r=await act({action:'select',product:details,query,page,filters:Object.fromEntries(filterParams())},'Saved verified product to persistent selection');if(r?.selection){choose(r.selection.id);nav(4)}}} disabled={busy}><Plus size={14}/> Select product</Btn></div></div>)}</div>}
        {searched&&<div className={css.pagination}><Btn disabled={busy||page<=1} onClick={()=>search(page-1)}><ChevronLeft size={14}/> Previous</Btn><span>Provider page {page}</span><Btn disabled={busy||!results.length} onClick={()=>search(page+1)}>Next <ChevronRight size={14}/></Btn></div>}
       </div>
      </div>
     </>}
     {tab===4&&<>{metric}<div className={css.selectionLayout}><Card title="My supplier selection" meta="Persistent selections; click to curate" className={css.selectionList} action={<CsvButton rows={data.selections.map(s=>({id:s.id,provider:s.provider,product_id:s.provider_product_id,title:s.title,sku:s.sku,cost:s.cost,currency:s.currency,category:s.category_key,status:s.status}))} name="angelcare-supplier-selection.csv"/>}><div className={css.selectionScroll}>{data.selections.map(s=><button key={s.id} className={`${css.selectionItem} ${selectedRow?.id===s.id?css.chosen:''}`} onClick={()=>choose(s.id)}><Img src={s.image_url} label={s.title}/><div><b>{s.title}</b><small>{s.provider.toUpperCase()} · {s.sku}</small><span>{money(s.cost,s.currency)} · <strong>{editorialGate(s).score}/{editorialGate(s).total} gates</strong></span></div><Badge tone={s.catalog_item_id?'green':editorialGate(s).ok?'blue':'amber'}>{s.catalog_item_id?'Imported':s.status}</Badge></button>)}</div>{!data.selections.length&&<Empty title="No supplier selections"/>}</Card>
        <div className={css.selectionDetail}>{editing?<>
         <Card title={editing.title} meta={`${editing.provider.toUpperCase()} · ${editing.sku}`} action={<Badge tone={editorialGate(editing).ok?'green':'amber'}>{editorialGate(editing).score}/{editorialGate(editing).total} checks</Badge>}>
          <div className={css.productDetailHero}><Img large src={editing.image_url} label={editing.title}/><div className={css.productDetailFacts}><div><span>Supplier product ID</span><strong className={css.mono}>{editing.provider_product_id}</strong></div><div><span>Supplier price</span><strong>{money(editing.cost,editing.currency)}</strong></div><div><span>Supplier stock</span><strong>{editing.stock===null?'Not provided':editing.stock}</strong></div><div><span>Variants</span><strong>{editing.normalized.variants?.length||0}</strong></div><div><span>Target category</span><strong>{editing.category_key||'Unassigned'}</strong></div></div></div>
          <div className={css.paneTabs}>{['overview','variants','editorial','pricing','compliance','media'].map(p=><button key={p} className={pane===p?css.paneActive:''} onClick={()=>setPane(p as typeof pane)}>{p}</button>)}</div>
          {pane==='overview'&&<><div className={css.fieldGrid}><div className={css.categoryPicker}><label className={css.field}><span>Search AngelCare storefront categories</span><input value={categoryTerm} onChange={e=>setCategoryTerm(e.target.value)} placeholder="Search storefronts by label or key"/></label><div className={css.categoryResults}>{data.categories.filter(c=>(c.title+' '+c.category_key).toLowerCase().includes(categoryTerm.toLowerCase())).filter(c=>!Array.isArray(c.allowed_sellable_types)||!c.allowed_sellable_types.length||c.allowed_sellable_types.includes('product')||c.allowed_sellable_types.includes('physical_product')).map(c=><div key={c.id} className={css.categoryChoice}><label><input type="checkbox" checked={editing.category_keys.includes(c.category_key)} onChange={e=>{const keys=e.target.checked?uniq([...editing.category_keys,c.category_key]):editing.category_keys.filter(k=>k!==c.category_key);pending({category_keys:keys,category_key:keys.includes(editing.category_key||'')?editing.category_key:keys[0]||null})}}/>{c.title} <small>{c.category_key}</small></label><label className={css.primaryChoice}><input type="radio" name="supplier-primary-category" checked={editing.category_key===c.category_key} disabled={!editing.category_keys.includes(c.category_key)} onChange={()=>pending({category_key:c.category_key})}/>Primary</label></div>)}</div><small>{editing.category_keys.length} selected; {editing.category_key||'No primary category'} is primary.</small></div><label className={css.field}><span>Qualified canonical supplier</span><select value={editing.canonical_supplier_id||''} onChange={e=>pending({canonical_supplier_id:e.target.value})}><option value="">Select an approved supplier</option>{(legacy?.suppliers||[]).filter(s=>['active','approved'].includes(s.status)&&['approved','conditional'].includes(s.quality_status)).map(s=><option value={s.id} key={s.id}>{s.display_name} · {s.supplier_code}</option>)}</select></label></div><p className={css.smallNotice}>Supplier approval and quality are owned by existing Supplier 360. This selection cannot bypass them.</p></>}
          {pane==='variants'&&<><p className={css.smallNotice}>Variant IDs are source identities. Select the variants to include in the canonical Product 360 dossier.</p><div className={css.variantsGrid}>{(editing.normalized.variants||[]).map(v=><label key={v.id} className={css.variantRow}><input type="checkbox" checked={editing.selected_variant_ids.includes(v.id)} onChange={e=>pending({selected_variant_ids:e.target.checked?uniq([...editing.selected_variant_ids,v.id]):editing.selected_variant_ids.filter(id=>id!==v.id)})}/><Img src={v.imageUrl} label={v.label}/><div><b>{v.label}</b><small>{v.sku}</small></div><strong>{money(v.cost,editing.currency)}</strong><span>{v.stock===null?'Unknown stock':v.stock}</span></label>)}</div>{!editing.normalized.variants.length&&<Empty title="Provider variants unavailable" detail="Use Refresh details to ask the supplier API; no variants are invented."/>}{editing.provider==='cj'&&<div className={css.nativeQuote}><h4>CJ live stock & freight — source data only</h4><div className={css.inlineQuote}><label>Variant <select value={activeVariant} onChange={e=>{setActiveVariant(e.target.value);setWarehouses([]);setFreight(null)}}><option value="">Choose CJ variant</option>{editing.normalized.variants.map(v=><option key={v.id} value={v.id}>{v.sku} · {v.label}</option>)}</select></label><label>Origin <input value={origin} onChange={e=>setOrigin(e.target.value.toUpperCase())} maxLength={2}/></label><label>Destination <input value={destination} onChange={e=>setDestination(e.target.value.toUpperCase())} maxLength={2}/></label><label>Qty <input type="number" min="1" max="1000" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label></div><div className={css.buttonRow}><Btn disabled={busy||!activeVariant} onClick={async()=>{setBusy(true);try{const out=await response<{warehouses:typeof warehouses}>(`${url}?operation=stock&variantId=${encodeURIComponent(activeVariant)}`);setWarehouses(out.warehouses)}catch(e){setError(String(e))}finally{setBusy(false)}}}><Boxes size={14}/> Check real stock</Btn><Btn variant="gold" disabled={busy||!activeVariant} onClick={async()=>{setBusy(true);try{const qp=new URLSearchParams({operation:'freight',variantId:activeVariant,origin,destination,quantity});const out=await response<typeof freight>(url+'?'+qp);setFreight(out)}catch(e){setError(String(e))}finally{setBusy(false)}}}><Truck size={14}/> Quote delivery</Btn></div>{warehouses.length>0&&<DataTable head={['Warehouse','Country','CJ-managed','Factory (not warehouse)','Total reported']} rows={warehouses.map(w=>[w.warehouse,w.countryCode,w.cjManaged??'Unknown',w.factoryManaged??'Unknown',w.total??'Unknown'])}/>} {freight&&<><p className={css.smallNotice}>Live supplier quote {stamp(freight.checkedAt)} · {freight.currency}; not approved landed cost.</p><DataTable head={['Logistics','Freight USD','Transit indication','Action']} rows={freight.methods.map(m=>[m.name,m.price===null?'Unavailable':money(m.price,'USD'),m.estimatedDays||'Not supplied',<Btn disabled={m.price===null||editing.currency!=='USD'} onClick={()=>pending({shipping_cost:Number(m.price)})}>Use as draft freight</Btn>])}/></>}</div>}
          <Btn onClick={()=>act({action:'refresh',id:editing.id},'Refreshed product details from supplier')} disabled={busy}><RefreshCw size={15}/> Refresh supplier product</Btn></>}
          {pane==='editorial'&&<div className={css.fieldGrid}>{(Object.keys(EMPTY_EDITORIAL) as (keyof Editorial)[]).map(k=><Field key={k} label={k.replaceAll('_',' ').toUpperCase()} value={editing.editorial[k]} wide={k.startsWith('description_')||k.startsWith('trust_')||k.startsWith('fulfillment_')} type={k.startsWith('description_')||k.startsWith('trust_')||k.startsWith('fulfillment_')?'textarea':'text'} onChange={v=>pending({editorial:{...editing.editorial,[k]:v}})}/>)}</div>}
          {pane==='pricing'&&<><div className={css.fieldGrid}><Field label="Verified supplier minimum order quantity (MOQ)" value={editing.supplier_moq??''} type="number" onChange={v=>pending({supplier_moq:v===''?null:Number(v)})}/><Field label={`Verified freight cost (${editing.currency})`} value={editing.shipping_cost??''} type="number" onChange={v=>pending({shipping_cost:v===''?null:Number(v)})}/><Field label={`Verified duties / other cost (${editing.currency})`} value={editing.duty_cost??''} type="number" onChange={v=>pending({duty_cost:v===''?null:Number(v)})}/><Field label="Target gross margin (0.30 = 30%)" value={editing.target_margin??''} type="number" onChange={v=>pending({target_margin:v===''?null:Number(v)})}/></div><div className={css.costBox}><h4>Real landed-cost estimate</h4><strong>{editing.cost===null||editing.shipping_cost===null||editing.duty_cost===null?'Incomplete':money(editing.cost+editing.shipping_cost+editing.duty_cost,editing.currency)}</strong><p>{(()=>{const output=suggestedPrice(editing,fx(editing.currency));return output.value!==null?`Indicative retail ${money(output.value,'MAD')} — ${output.reason}`:output.reason})()}</p><p>Estimates do not include unverified costs or replace finance approval. Source currency rate comes only from current ONE WORLD records.</p><div className={css.inlineQuote}><label>ONE WORLD destination <input maxLength={2} value={oneWorldCountry} onChange={e=>setOneWorldCountry(e.target.value.toUpperCase())} placeholder="MA"/></label><Btn disabled={busy||editing.currency!=='USD'||editing.cost===null||editing.shipping_cost===null||editing.duty_cost===null} onClick={async()=>{const output=await act({action:'one-world-simulate',id:editing.id,country:oneWorldCountry},'ONE WORLD shadow simulation recorded; no customer selling price changed');if(isOneWorldShadowQuote(output))setOneWorldResult(output);else if(output){setNotice('');setError('ONE WORLD returned an invalid shadow quote. No customer price was changed.')}}}><Globe2 size={14}/> Simulate in ONE WORLD</Btn></div>{oneWorldResult&&<p className={css.smallNotice}>Actual ONE WORLD authority: {oneWorldResult.country} · {oneWorldResult.amount} {oneWorldResult.currency} · rate {oneWorldResult.rate} · uplift {oneWorldResult.upliftBp} bp. Simulation ONLY, not a published price.</p>}</div></>}
          {pane==='compliance'&&<><div className={css.checklist}>{(Object.keys(EMPTY_COMPLIANCE) as (keyof Compliance)[]).filter(k=>k!=='evidenceNotes').map(k=><CheckField key={k} label={k.replace(/([A-Z])/g,' $1')} checked={editing.compliance[k]===true} onChange={v=>pending({compliance:{...editing.compliance,[k]:v}})} sub={k==='supplierQualified'?'Requires canonical supplier qualification; self-marking does not approve suppliers':k==='childSafetyReviewed'?'Applicable destination country child-product safety documentation reviewed':undefined}/>)}</div><Field label="Evidence notes and document references" value={editing.compliance.evidenceNotes} onChange={v=>pending({compliance:{...editing.compliance,evidenceNotes:v}})} type="textarea" wide/></>}
          {pane==='media'&&<><p className={css.smallNotice}>Source images may only be imported after usage rights are verified. Choose a gallery image and record its evidence in Compliance.</p><div className={css.gallery}>{editing.normalized.images.map(src=><button key={src} className={editing.image_url===src?css.gallerySelected:''} onClick={()=>pending({image_url:src})}><Img src={src} label={editing.title}/></button>)}</div></>}
          <div className={css.detailFooter}><Btn onClick={()=>{setDraft({});setNotice('Unsaved changes discarded')}} disabled={!Object.keys(draft).length}>Discard changes</Btn><Btn variant="blue" disabled={busy||!Object.keys(draft).length} onClick={async()=>{const result=await act({action:'edit',id:editing.id,patch:draft},'Selection updated in governed database');if(result)setDraft({})}}><Check size={15}/> Save full dossier</Btn><Btn variant="gold" onClick={()=>{choose(editing.id);nav(9)}}><PackageCheck size={15}/> Import readiness</Btn></div>
         </Card>
        </>:<Empty title="Choose a supplier product"/>}</div></div>
     </>}
     {tab===5&&<><div className={css.kpis}><Stat label="Registered suppliers" value={supplierCount} icon={Users}/><Stat label="Active suppliers" value={counts.activeSuppliers} icon={CheckCircle2} tone="green"/><Stat label="Canonical offers" value={realOffers.length} icon={Package}/><Stat label="Supplier evidence files" value={legacy?.documents.length||0} icon={FileText}/><Stat label="Quality audits" value={legacy?.profiles.length||0} icon={ShieldCheck}/></div><Card title="Supplier 360 — canonical network" meta="Official suppliers, quality status, legal identity and source readiness" action={<Btn variant="gold" onClick={gotoLegacy}><ExternalLink size={14}/> Open full qualification workspace</Btn>}><DataTable head={['Supplier','Code','Country','Status','Quality','Offers']} rows={(legacy?.suppliers||[]).filter(s=>!globalSearch||text(s.display_name).toLowerCase().includes(globalSearch.toLowerCase())).map(s=>[<strong key="1">{s.display_name}</strong>,s.supplier_code,(legacy?.profiles||[]).find(p=>p.supplier_id===s.id)?.country_code||'—',<Badge tone={s.status==='active'?'green':'amber'}>{s.status}</Badge>,<Badge tone={s.quality_status==='approved'?'green':'amber'}>{s.quality_status||'Unknown'}</Badge>,realOffers.filter(o=>o.supplier_id===s.id).length])} empty="No canonical suppliers"/></Card></>}
     {tab===6&&<><Card title="AngelCare-owned channels and collections" meta="Internal merchandising architecture; supplier portals are not being created" action={<Btn onClick={gotoLegacy}><ExternalLink size={14}/> Manage approved channel authority</Btn>}><div className={css.tiles}>{(legacy?.channels||[]).map(c=><div className={css.tile} key={c.id}><Layers3 size={24}/><h4>{c.title||c.channel_key}</h4><p>{c.description||'AngelCare internal assortment channel'}</p><Badge tone={c.status==='active'?'green':'amber'}>{c.status}</Badge><small>{legacy?.assortments.filter(a=>a.channel_id===c.id).length||0} assortments</small></div>)}{!legacy?.channels.length&&<Empty title="No internal channels created"/>}</div></Card><Card title="Channel assortment mapping"><DataTable head={['Channel','Product','Visibility','Updated']} rows={(legacy?.assortments||[]).map(a=>[legacy?.channels.find(c=>c.id===a.channel_id)?.title||'—',legacy?.catalog.find(i=>i.id===a.catalog_item_id)?.name_fr||a.catalog_item_id||'—',a.status||'—',stamp(a.updated_at)])}/></Card></>}
     {tab===7&&<><div className={css.kpis}><Stat label="Canonical source offers" value={realOffers.length} icon={Package}/><Stat label="Unmapped selections" value={data.selections.filter(x=>!x.category_key).length} icon={Tag} tone="gold"/><Stat label="Qualified suppliers" value={counts.activeSuppliers} icon={ShieldCheck} tone="green"/><Stat label="Products imported" value={selectionCounts.imported} icon={CheckCircle2}/><Stat label="Supplier quotation status" value="Governed" icon={Lock}/></div><Card title="Actual supplier offers" meta="Authoritative supplier offers, not catalogue examples" action={<Btn onClick={gotoLegacy}><ExternalLink size={15}/> Open sourcing controls</Btn>}><DataTable head={['Supplier','Product','SKU','Unit cost','State','Last change']} rows={realOffers.map(o=>[legacy?.suppliers.find(s=>s.id===o.supplier_id)?.display_name||o.supplier_id||'—',legacy?.catalog.find(x=>x.id===o.catalog_item_id)?.name_fr||'Unmapped',o.supplier_sku||'—',money(o.unit_cost,o.currency_label||'USD'),<Badge tone={o.status==='active'?'green':'amber'}>{o.status}</Badge>,stamp(o.updated_at)])}/></Card></>}
     {tab===8&&<><Card title="Import pipeline and media rights" meta="Catalogue Import R2 and canonical Media Vault remain the publishing authorities" action={<div className={css.buttonRow}><a className={css.docLink} href="/angelcare-marketplace/admin/catalog/imports" target="_blank" rel="noreferrer">Catalogue Import R2 <ExternalLink size={14}/></a><Btn variant="gold" onClick={()=>nav(4)}>Review selections <ArrowRight size={14}/></Btn></div>}><div className={css.importMatrix}>{[['Selected source records',data.selections.length],['Factual/translation-ready',data.selections.filter(s=>editorialGate(s).ok).length],['Media rights confirmed',data.selections.filter(s=>s.compliance.mediaRightsVerified).length],['Canonical drafts created',selectionCounts.imported]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><DataTable head={['Selection','Source','Image','Category','Gate','Action']} rows={data.selections.map(s=>[s.title,s.provider.toUpperCase(),<Badge tone={s.compliance.mediaRightsVerified?'green':'amber'}>{s.compliance.mediaRightsVerified?'Rights reviewed':'Review required'}</Badge>,s.category_key||'Missing',<Badge tone={editorialGate(s).ok?'green':'amber'}>{editorialGate(s).score}/{editorialGate(s).total}</Badge>,<Btn onClick={()=>{choose(s.id);setPane('media');nav(4)}}>Inspect <ArrowRight size={13}/></Btn>])}/></Card></>}
     {tab===9&&<><Card title="Canonical Product 360 launch queue" meta="Draft creation through existing Product 360 engine; publication through existing Commerce Studio only"><div className={css.launchList}>{data.selections.map(s=><div key={s.id} className={css.launchRow}><Img src={s.image_url} label={s.title}/><div><h4>{s.title}</h4><span>{s.provider.toUpperCase()} · {s.sku}</span><small>{s.catalog_item_id?'Canonical dossier: '+s.catalog_item_id:editorialGate(s).missing.slice(0,4).join(' · ')||'Strict gate passed'}</small></div><Badge tone={s.catalog_item_id?'green':editorialGate(s).ok?'blue':'amber'}>{s.catalog_item_id?'Imported draft':editorialGate(s).score+'/'+editorialGate(s).total}</Badge><div className={css.launchButtons}>{s.catalog_item_id?<><a className={css.docLink} href={`/angelcare-marketplace/admin/catalog/items/${s.catalog_item_id}/overview`} target="_blank" rel="noreferrer">Product 360 <ExternalLink size={13}/></a><Btn disabled={busy} onClick={()=>act({action:'sync-categories',id:s.id},'Canonical storefront assignments synchronized and verified')}><Tag size={14}/> Sync categories</Btn><Btn disabled={busy||Boolean(s.supplier_offer_id)} onClick={()=>act({action:'link-offer',id:s.id},'Canonical supplier offer linked; approval still required')}><Tag size={14}/> {s.supplier_offer_id?'Offer linked':'Link offer'}</Btn><Btn disabled={busy} onClick={async()=>{const a=await act({action:'readiness',id:s.id});if(a?.readiness)setNotice(a.readiness.ready?'Canonical Product 360 readiness: PASS':`Readiness: ${a.readiness.reasons.join(', ')}`)}}><ClipboardCheck size={14}/> Preflight</Btn><Btn variant="gold" disabled={busy} onClick={()=>{const confirmed=window.prompt(`To publish, type: PUBLISH ${s.id}`);if(confirmed===`PUBLISH ${s.id}`)act({action:'publish',id:s.id,confirm:confirmed},'Canonical publish invoked; verify public storefront visibility separately')}}><PackageCheck size={14}/> Publish</Btn><Btn disabled={busy} onClick={async()=>{const result=await act({action:'verify-public',id:s.id},'Canonical public discovery/category verification completed; browser HTTP render remains untested');if(result?.link)setNotice('Public discovery verified: '+result.link+' · HTTP rendering remains untested')}}><ExternalLink size={14}/> Verify public projection</Btn></>:<><Btn disabled={busy||!editorialGate(s).ok||!s.canonical_supplier_id} variant="blue" onClick={()=>act({action:'import-draft',id:s.id},'Canonical Product 360 draft created and linked')}><Upload size={14}/> Create governed draft</Btn><Btn onClick={()=>{choose(s.id);nav(4)}}>Fix blockers <ArrowRight size={14}/></Btn></>}</div></div>)}{!data.selections.length&&<Empty title="No products ready for import"/>}</div></Card><p className={css.smallNotice}>Each product must pass canonical readiness, supplier offer approval, valid child-product conformity evidence, shipping capability and admin publication approval. No automatic activation.</p></>}
     {tab===10&&<><Card title="FR / EN / AR Product 360 editorial closure" meta="All 3 locales and SEO fields stay linked to the supplier selection dossier" action={<Btn variant="gold" onClick={()=>{choose(selectedRow?.id||'');setPane('editorial');nav(4)}}><FileText size={15}/> Edit selected dossier</Btn>}><DataTable head={['Product','French','English','Arabic','SEO FR','SEO EN','SEO AR','Publication']} rows={data.selections.map(s=>{const e=s.editorial;const ready=(keys:(keyof Editorial)[])=>keys.every(k=>Boolean(e[k]));return [s.title,<Badge tone={ready(['name_fr','short_fr','description_fr'])?'green':'red'}>FR {ready(['name_fr','short_fr','description_fr'])?'Ready':'Missing'}</Badge>,<Badge tone={ready(['name_en','short_en','description_en'])?'green':'red'}>EN {ready(['name_en','short_en','description_en'])?'Ready':'Missing'}</Badge>,<Badge tone={ready(['name_ar','short_ar','description_ar'])?'green':'red'}>AR {ready(['name_ar','short_ar','description_ar'])?'Ready':'Missing'}</Badge>,e.seo_title_fr&&e.seo_description_fr?'✓':'—',e.seo_title_en&&e.seo_description_en?'✓':'—',e.seo_title_ar&&e.seo_description_ar?'✓':'—',<Badge tone={editorialGate(s).ok?'green':'amber'}>{editorialGate(s).score}/{editorialGate(s).total}</Badge>]})}/><p className={css.smallNotice}>Supplier API English text is never passed off as French or Arabic translation. Operators must approve locale-specific content and commercial claims.</p></Card></>}
     {tab>=11&&tab<=16&&<><div className={css.kpis}><Stat label="Canonical suppliers" value={legacy?.suppliers.length||0} icon={Users}/><Stat label="Supplier PO records" value={legacy?.purchases.length||0} icon={Wallet} tone="gold"/><Stat label="Stock declarations" value={legacy?.availability.length||0} icon={Boxes}/><Stat label="Shipments" value={legacy?.shipments.length||0} icon={Truck}/><Stat label="Audit events" value={(legacy?.audit.length||0)+data.events.length} icon={ShieldCheck}/></div>
      {tab===11&&<Card title="ONE WORLD → Finance approval pipeline" meta="Create a draft Finance rule; only independently approved active MAD rules can activate retail pricing. No FX guesses." action={<a className={css.docLink} href="/angelcare-marketplace/admin/one-world-currency" target="_blank" rel="noreferrer">ONE WORLD authority <ExternalLink size={13}/></a>}>
       <div className={css.detailGrid}>
        <label className={css.field}><span>Canonical supplier product</span><select value={selectedRow?.id||''} onChange={e=>choose(e.target.value)}><option value="">Select product</option>{data.selections.filter(x=>x.catalog_item_id).map(x=><option value={x.id} key={x.id}>{x.title} · {x.sku}</option>)}</select></label>
        <label className={css.field}><span>Approved / active Finance price book</span><select value={financePriceBook} onChange={e=>setFinancePriceBook(e.target.value)}><option value="">Choose existing book</option>{(data.finance?.books||[]).map(x=><option key={x.id} value={x.id}>{x.name} · {x.currency_label} · {x.status}</option>)}</select></label>
        <Field label="Proposed fixed retail price (book currency)" type="number" value={financePrice} onChange={setFinancePrice}/>
        <Field label="Sourcing, FX and commercial justification" value={financeEvidence} onChange={setFinanceEvidence} type="textarea" wide/>
       </div>
       <div className={css.buttonRow}>
        <Btn variant="blue" disabled={busy||!selectedRow?.catalog_item_id||!financePriceBook||!financePrice||financeEvidence.length<15} onClick={()=>selectedRow&&act({action:'finance-propose',id:selectedRow.id,priceBookId:financePriceBook,standardPrice:financePrice,reason:financeEvidence},'Draft Finance rule created; approval in canonical Finance still required')}><Plus size={14}/> Propose governed retail rule</Btn>
        <Btn variant="gold" disabled={busy||!selectedRow?.catalog_item_id} onClick={()=>{if(!selectedRow)return;const confirm=window.prompt(`After independent Finance approval, type ACTIVATE PRICE ${selectedRow.id}`);if(confirm===`ACTIVATE PRICE ${selectedRow.id}`)act({action:'finance-activate',id:selectedRow.id,confirm},'Verified approved Finance price activated on canonical draft')}}><CheckCircle2 size={14}/> Activate independently approved MAD price</Btn>
       </div>
       <DataTable head={['Finance rule','Product','Price','Status','Book']} rows={(data.finance?.rules||[]).filter(r=>data.selections.some(x=>x.catalog_item_id===r.catalog_item_id)).slice(0,60).map(r=>[String(r.id).slice(0,12),data.selections.find(x=>x.catalog_item_id===r.catalog_item_id)?.title||'—',r.standard_price,<Badge tone={r.status==='active'?'green':'amber'}>{r.status}</Badge>,(data.finance?.books||[]).find(b=>b.id===r.price_book_id)?.name||r.price_book_id])} empty="No canonical Finance rule for imported supplier products"/>
       <p className={css.smallNotice}>No Finance rule is self-approved here. First review and activate it through your existing Finance governance. Existing approved rates only; the selected book sets currency and territory.</p>
      </Card>}
      {tab===11&&<Card title="Commercials and margin authority" meta="Supplier prices are not final customer checkout prices" action={<Btn onClick={gotoLegacy}>Manage Finance in Supplier 360 <ExternalLink size={14}/></Btn>}><DataTable head={['Source offer','Supplier cost','Rate reference','Commercial status']} rows={(legacy?.commercials||[]).map(c=>[legacy?.offers.find(o=>o.id===c.offer_id)?.supplier_sku||c.offer_id||'—',money(c.unit_cost||c.supplier_cost,c.currency||'USD'),c.rate_source||'—',c.status||'—'])}/></Card>}
      {tab===12&&<Card title="Real customer journeys" meta="Existing customer, payment and order authorities" action={<Btn onClick={gotoLegacy}>Open order operations <ExternalLink size={14}/></Btn>}><DataTable head={['Reference','Journey','Status','Date']} rows={(legacy?.journeys||[]).map(x=>[x.public_reference||x.id,x.title||x.journey_type||'—',<Badge tone="blue">{x.status||'—'}</Badge>,stamp(x.created_at)])}/></Card>}
      {tab===13&&<Card title="Supplier purchase orders" meta="Existing approval and payable execution authority" action={<Btn onClick={gotoLegacy}>Open purchase authority <ExternalLink size={14}/></Btn>}><DataTable head={['PO Reference','Supplier','Status','Updated']} rows={(legacy?.purchases||[]).map(x=>[x.reference||x.id,legacy?.suppliers.find(s=>s.id===x.supplier_id)?.display_name||'—',<Badge tone={x.status==='approved'?'green':'amber'}>{x.status}</Badge>,stamp(x.updated_at)])}/></Card>}
      {tab===13&&<Card title="CJ SANDBOX · Canonical purchase order bridge" meta="At-most-once provider submission. Never triggers payment, a real shipment or an automatic retry." action={<Badge tone={data.cjBridges?.available?'blue':'amber'}>{data.cjBridges?.available?'Bridge installed':'SQL migration required'}</Badge>}>
        <div className={css.detailGrid}>
         <label className={css.field}><span>Approved & issued purchase order</span><select value={cjPurchaseId} onChange={e=>{setCjPurchaseId(e.target.value);setCjOptions(null);setCjVariants({})}}><option value="">Choose canonical PO</option>{(legacy?.purchases||[]).filter(x=>['issued','accepted'].includes(x.status)).map(x=><option key={x.id} value={x.id}>{x.reference} · {x.status}</option>)}</select></label>
         <div className={css.buttonRow}><Btn disabled={busy||!cjPurchaseId} onClick={loadCjOptions}><RefreshCw size={14}/> Load verified order + customer address</Btn></div>
        </div>
        {cjOptions&&<>
          <div className={css.detailGrid}>
           <label className={css.field}><span>Existing canonical customer address</span><select value={cjAddressId} onChange={e=>setCjAddressId(e.target.value)}><option value="">Select approved address</option>{cjOptions.addresses.map(a=><option key={a.id} value={a.id}>{a.label||'Address'} · {a.city} · {a.recipient_name}</option>)}</select></label>
           <Field label="Destination ISO country" value={cjCountryCode} onChange={setCjCountryCode}/>
           <Field label="Destination province/state (reviewed)" value={cjProvince} onChange={setCjProvince}/>
           <Field label="Origin warehouse ISO country" value={cjOriginCountry} onChange={setCjOriginCountry}/>
           <label className={css.field}><span>Real CJ logistics method</span>{cjQuoteMethods.length?<select value={cjLogisticName} onChange={e=>setCjLogisticName(e.target.value)}><option value="">Choose CJ quoted method</option>{cjQuoteMethods.map(m=><option key={m}>{m}</option>)}</select>:<input value={cjLogisticName} onChange={e=>setCjLogisticName(e.target.value)} placeholder="Use actual supplier quotation"/>}</label>
           <Field label="Recorded customer data-transfer consent evidence" value={cjConsentEvidence} onChange={setCjConsentEvidence} type="textarea" wide/>
          </div>
          <div className={css.detailGrid}>{cjOptions.lines.map(line=><label key={line.lineId} className={css.field}><span>PO line {line.lineId.slice(0,8)} · quantity {line.quantity}</span><select value={cjVariants[line.lineId]||''} onChange={e=>setCjVariants(p=>({...p,[line.lineId]:e.target.value}))}><option value="">Choose exact CJ variant</option>{line.variants.map(v=><option key={v.id} value={v.id}>{v.sku} · {v.label}</option>)}</select></label>)}</div>
          <CheckField label="I confirm customer data transfer is consented and logged outside the LIVE API" checked={cjVerifiedConsent} onChange={setCjVerifiedConsent} sub="Do not use a real customer address for demonstrations without permission."/>
          <div className={css.buttonRow}>
           <Btn disabled={busy||!cjOptions.lines.length||!Object.values(cjVariants).every(Boolean)} onClick={async()=>{const line=cjOptions.lines[0];const first=cjVariants[line.lineId];if(!first)return;setBusy(true);try{const q=new URLSearchParams({operation:'freight',variantId:first,origin:cjOriginCountry,destination:cjCountryCode,quantity:String(line.quantity)});const r=await response<{methods:Array<{name:string;price:number|null}>}>(url+'?'+q);const methods=r.methods.filter(m=>m.price!==null).map(m=>m.name);setCjQuoteMethods(methods);setCjLogisticName(methods[0]||'');setCjOptionsStatus(methods.length?`Received ${methods.length} provider quotation(s). Final preparation rechecks every line.`:'CJ did not return an eligible quoted logistics method.')}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}}><Truck size={14}/> Query CJ freight</Btn>
           <Btn disabled={busy||!cjVerifiedConsent||!cjAddressId||!cjLogisticName||cjConsentEvidence.length<4} onClick={async()=>{const r=await act({action:'cj-preview',...cjPayload()},'Verified preflight for sandbox PO; no CJ order submitted');if(r?.orderNumber)setCjOptionsStatus(`PREVIEW ${r.orderNumber} · ${r.productCount} genuine source line(s); no payment`)}}><ClipboardCheck size={14}/> Preview governed order</Btn>
           <Btn variant="gold" disabled={busy||!cjVerifiedConsent||!cjLogisticName||!cjAddressId||cjConsentEvidence.length<4} onClick={()=>{const confirm=window.prompt(`Type PREPARE SANDBOX ${cjPurchaseId} to stage a single provider submission`);if(confirm===`PREPARE SANDBOX ${cjPurchaseId}`)act({action:'cj-prepare',...cjPayload(),confirm},'CJ sandbox order safely prepared; provider not yet contacted')}}><ShieldCheck size={14}/> Prepare sandbox</Btn>
          </div>
         </>}
        {cjOptionsStatus&&<p className={css.smallNotice}>{cjOptionsStatus}</p>}
        <DataTable head={['Purchase / order','State','CJ ID','Tracking','Controlled action']} rows={(data.cjBridges?.items||[]).map(b=>[
          <><b>{String(b.orderNumber)}</b><small>{String(b.purchaseId).slice(0,8)}</small></>,
          <Badge tone={['submitted','reconciled'].includes(b.status)?'green':b.status==='ambiguous'?'red':'amber'}>{b.status}</Badge>,b.cjOrderId||'—',b.tracking||'—',
          <div className={css.buttonRow}><Btn disabled={busy||b.status!=='prepared'} onClick={()=>{const confirm=window.prompt(`One irreversible-attempt CJ SANDBOX submission. Type SUBMIT SANDBOX ${b.id}`);if(confirm===`SUBMIT SANDBOX ${b.id}`)act({action:'cj-submit',bridgeId:b.id,confirm},'CJ SANDBOX submission response recorded; no payment')}}>Submit once</Btn><Btn disabled={busy||b.status==='prepared'} onClick={()=>act({action:'cj-reconcile',bridgeId:b.id},'Read-only CJ order reconciliation checked')}>Reconcile</Btn></div>])} empty="No CJ purchase-order bridges staged"/>
        <p className={css.smallNotice}>All orders require an issued and approved AngelCare PO, verified captured customer payment, canonical customer address, explicit customer-data consent, verified CJ variant and freight. Sandbox writes cannot be retried; ambiguous outcomes remain locked pending read-only CJ reconciliation.</p>
       </Card>}
      {tab===14&&<Card title="Supplier stock declarations" meta="External supplier inventory, not AngelCare-owned warehouse stock" action={<Btn onClick={gotoLegacy}>Open verification <ExternalLink size={14}/></Btn>}><DataTable head={['Supplier offer','Quantity','Status','Verified']} rows={(legacy?.availability||[]).map(x=>[legacy?.offers.find(o=>o.id===x.offer_id)?.supplier_sku||x.offer_id||'—',x.quantity??x.stock_quantity??'—',x.status||'—',stamp(x.verified_at)])}/></Card>}
      {tab===15&&<Card title="Shipment tracking & delivery handover" meta="Real shipment status and transport evidence" action={<Btn onClick={gotoLegacy}>Manage shipments <ExternalLink size={14}/></Btn>}><DataTable head={['Reference','Carrier','Tracking','Status','Updated']} rows={(legacy?.shipments||[]).map(x=>[x.reference||x.id,x.carrier||'—',x.tracking_number||'—',<Badge tone={x.status==='delivered'?'green':'amber'}>{x.status}</Badge>,stamp(x.updated_at)])}/></Card>}
      {tab===16&&<><Card title="Multi-provider live integration state" meta="No unsupported autonomous order execution">{docs.map(p=><div className={css.stateLine} key={p.id}><b>{p.name}</b><Badge tone={p.mode==='configured'?'blue':'amber'}>{p.mode}</Badge><span>{p.note}</span></div>)}</Card><Card title="Integration & supplier audit trail" meta="Evidence-backed actions only" action={<CsvButton rows={data.events} name="angelcare-supplier-ops-audit.csv"/>}><DataTable head={['Time','Operation','Selection','Details']} rows={data.events.map(e=>[stamp(e.created_at),e.action,<span className={css.mono} key="k">{e.selection_id||'—'}</span>,e.note])}/></Card></>}
     </>}
     <footer className={css.footer}><span><ShieldCheck size={14}/> ANGELCARE-owned merchant · Supplier data is provenance-labeled · No simulated activity</span><span>Snapshot {stamp(data.generatedAt)}</span></footer>
    </>}
   </main>
  </div>
 </div>
}
