'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ChevronDown,ChevronRight,Download,ExternalLink,Globe2,Info,LockKeyhole,Menu,RefreshCw,Search,ShieldAlert,ShieldCheck,SlidersHorizontal,X} from 'lucide-react';
import {WORKSPACES,operatorHref,nativeHref,workspaceFromSlug,type SourceArea} from './contracts';
import type {OpsPayload,SafeRow} from './server';
import {getTabSpec} from './TabRegistry';
import {lensKeys,normalizedView,viewURL} from './ViewKeys';
import {DeepWorkspace} from './DeepWorkspace';
import {DossierR2} from './DossierR2';
import {SpecialistContent} from './Specialist';
import css from './operations.module.css';
import r3 from './navigation-r3.module.css';

const workIcons=['▥','▣','◎','◇','◉','▤','⌘'];
const fmt=(n:number|null)=>n===null?'Unavailable':new Intl.NumberFormat('en-US').format(n);
function downloadSummary(data:OpsPayload){
 const safe=(s:string)=>'"'+String(s).replaceAll('"','""').replace(/^[=+\-@\t\r]/,'\u2019$&')+'"';
 const out=['source,total_records,loaded_rows,page',...data.sources.map(s=>[s.area,s.total===null?'':String(s.total),s.rows.length,s.page].map(safe).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff',out+'\r\n'],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`jobkix-${data.workspace}-authorized-summary.csv`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),700);
}
/** R3: exactly one selected tab and one selected lens own the entire central viewport. */
export function OperationsScreen({data,initialTab='',page=1}:{data:OpsPayload;initialTab?:string;page?:number}){
 const config=workspaceFromSlug(data.workspace)!;
 const router=useRouter();
 const tabs=config.tabs.map(t=>({name:t[0],area:t[1] as SourceArea|null}));
 const first=tabs[0].name;
 const safeTab=tabs.some(t=>t.name===initialTab)?initialTab:first;
 const [tab,setTab]=useState(safeTab);
 const [view,setView]=useState(normalizedView(data.workspace,safeTab,null));
 const [mobile,setMobile]=useState(false);
 const [selected,setSelected]=useState<SafeRow|null>(null);
 const [selectedArea,setSelectedArea]=useState<SourceArea|null>(null);
 const [query,setQuery]=useState('');
 const [saveOpen,setSaveOpen]=useState(false);
 const [saved,setSaved]=useState<{tab:string;view:string}[]>([]);
 const searchRef=useRef<HTMLInputElement>(null);
 const headingRef=useRef<HTMLHeadingElement>(null);
 const current=tabs.find(t=>t.name===tab)||tabs[0];
 const exact=current.area===null?undefined:data.sources.find(s=>s.area===current.area);
 const primary=data.sources.find(s=>s.area===config.primary);
 const keys=useMemo(()=>lensKeys(data.workspace,tab),[data.workspace,tab]);
 const selectedKey=normalizedView(data.workspace,tab,view);
 const activeIndex=Math.max(0,keys.indexOf(selectedKey));
 const spec=getTabSpec(data.workspace,tab);
 const isFirst=tab===first;
 const isFirstLens=activeIndex===0;
 const isOverview=isFirst&&isFirstLens;
 const viewTitle=spec?.lenses[activeIndex]||tab;
 const canShowSource=Boolean(exact);
 const navigate=useCallback((toTab:string,toView:string,toPage=1)=>{
  const validTab=tabs.some(item=>item.name===toTab)?toTab:first;
  const validView=normalizedView(data.workspace,validTab,toView);
  setTab(validTab);setView(validView);setSelected(null);setSelectedArea(null);setQuery('');setSaveOpen(false);setMobile(false);
  router.push(viewURL(data.workspace,validTab,validView,toPage),{scroll:true});
  window.scrollTo({top:0,behavior:'instant'});
  window.requestAnimationFrame(()=>headingRef.current?.focus({preventScroll:true}));
 },[data.workspace,router,first,tabs]);
 useEffect(()=>{
  // URL wins over stale client tab state on hard refresh, history traversal and RSC updates.
  const sync=()=>{
   const url=new URL(window.location.href);
   const requested=url.searchParams.get('tab');
   const resolved=tabs.some(t=>t.name===requested)?requested!:first;
   setTab(resolved);setView(normalizedView(data.workspace,resolved,url.searchParams.get('view')));
   setSelected(null);setSelectedArea(null);setQuery('');
  };
  const onHistory=()=>{sync();window.scrollTo({top:0,behavior:'instant'});window.requestAnimationFrame(()=>headingRef.current?.focus({preventScroll:true}));};
  sync();window.addEventListener('popstate',onHistory);
  return ()=>window.removeEventListener('popstate',onHistory);
 },[data.workspace,first,initialTab]);
 useEffect(()=>{
  try{
   const raw=window.localStorage.getItem('jobkix-ops-r3-views-'+data.workspace);
   const parsed=raw?JSON.parse(raw):[];
   if(Array.isArray(parsed))setSaved(parsed.filter((x:unknown)=>!!x&&typeof x==='object'&&typeof (x as {tab?:unknown}).tab==='string'&&typeof (x as {view?:unknown}).view==='string').slice(-12));
  }catch{setSaved([]);}
 },[data.workspace]);
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchRef.current?.focus();}
   if(event.key==='Escape'){setMobile(false);setSaveOpen(false);setSelected(null);}
  };
  window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
 },[]);
 const addSaved=()=>{
  const next=[...saved.filter(s=>s.tab!==tab||s.view!==selectedKey),{tab,view:selectedKey}].slice(-12);
  setSaved(next);setSaveOpen(false);
  try{window.localStorage.setItem('jobkix-ops-r3-views-'+data.workspace,JSON.stringify(next));}catch{/* Preferences are browser-local and optional. */}
 };
 const onOpen=(record:SafeRow,area:SourceArea)=>{setSelectedArea(area);setSelected(record);};
 return <div className={`${css.shell} ${r3.shell}`} style={{'--ops-accent':config.accent} as CSSProperties}>
   <aside className={`${css.sidebar} ${mobile?css.mobileOpen:''} ${r3.sidebar}`} aria-label="JOBKIX operator workspaces">
    <Link className={css.brand} href={operatorHref('executive')}><img src="/jobkix/brand/jobkix-logo-white.png" alt="JOBKIX · Global Careers Platform" className={css.brandImg}/><span className={css.brandSub}>GLOBAL OPERATIONS</span></Link>
    <div className={css.org}><Globe2 size={17}/><div><strong>Global Headquarters</strong><small>Operator environment</small></div><ChevronDown size={15}/></div>
    <div className={css.sideSection}>CONTROL CENTERS</div>
    <nav>{WORKSPACES.map((w,i)=>data.allowed.includes(w.slug)?<Link key={w.slug} className={`${css.sideNav} ${w.slug===data.workspace?css.active:''}`} aria-current={w.slug===data.workspace?'page':undefined} href={operatorHref(w.slug)} onClick={()=>setMobile(false)}><span className={r3.sideGlyph} aria-hidden="true">{workIcons[i]}</span><span>{w.number}. {w.name}</span>{w.slug===data.workspace?<b/>:null}</Link>:<span key={w.slug} className={`${css.sideNav} ${css.locked}`} title="Requires native workspace permission"><LockKeyhole size={15}/><span>{w.number}. {w.name}</span></span>)}</nav>
    <div className={css.sidebarRule}/><div className={css.sideSection}>WORKSPACE ACTIONS</div>
    <button className={`${css.sideNav} ${r3.sideButton}`} type="button" onClick={()=>{window.scrollTo({top:0,behavior:'instant'});headingRef.current?.focus({preventScroll:true});setMobile(false);}}><SlidersHorizontal size={16}/> Active page</button>
    <Link className={css.sideNav} href={nativeHref(config.primary)}><ShieldCheck size={16}/> Native authority</Link>
    <div className={css.sideEnd}><div className={css.operatorAvatar}>OP</div><span><strong>Authorized operator</strong><small>Native Marketplace session</small></span></div>
    <small className={css.restricted}>INTERNAL · RESTRICTED VIEW<br/>Permission-scoped control plane</small>
   </aside>
   {mobile?<button type="button" className={r3.mobileBackdrop} aria-label="Close operator menu" onClick={()=>setMobile(false)}/>:null}
   <div className={`${css.mainWrap} ${r3.main}`}>
    <header className={`${css.topbar} ${r3.topbar}`}>
     <div className={css.crumb}><button type="button" className={css.mobileToggle} onClick={()=>setMobile(v=>!v)} aria-label="Toggle navigation" aria-expanded={mobile}><Menu size={19}/></button> JOBKIX <ChevronRight size={13}/> Operations <ChevronRight size={13}/><strong>{config.name}</strong></div>
     <div className={css.headerTools}><label className={css.headSearch}><Search size={15}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search this active operator page" aria-label="Search active operator page"/><kbd>⌘K</kbd></label><span className={css.globalIndicator}><Globe2 size={15}/> Global</span><button type="button" className={css.iconButton} onClick={()=>router.refresh()} title="Refresh authorized data"><RefreshCw size={17}/></button><span className={css.profile}>OP</span></div>
    </header>
    <main className={`${css.content} ${r3.content}`} id="ops-main" aria-label={`${config.name} workspace`}>
     <div className={r3.breadcrumb}>JOBKIX OPERATOR OS <ChevronRight size={12}/>{config.number} · {config.name}<ChevronRight size={12}/><strong>{tab}</strong></div>
     <div className={`${css.titlebar} ${r3.titlebar}`}><div><span className={r3.sectionLabel}>GLOBAL OPERATIONS · {config.number} / 07</span><h1 ref={headingRef} tabIndex={-1}>{config.name}</h1><p>{config.subtitle}</p></div><div className={css.titleTools}>{isOverview?<button type="button" onClick={()=>downloadSummary(data)}><Download size={15}/> Source summary CSV</button>:null}<button type="button" className={r3.bookmarkBtn} onClick={()=>setSaveOpen(x=>!x)} aria-expanded={saveOpen}><SlidersHorizontal size={15}/> Saved views</button></div></div>
     {saveOpen?<div className={r3.savedBox}><div className={r3.savedHead}><strong>My operator shortcuts</strong><button type="button" onClick={()=>setSaveOpen(false)} aria-label="Close saved views"><X size={16}/></button></div><p>Browser-local shortcuts only. No private records or server preferences are stored.</p><button type="button" onClick={addSaved}>Save current page: {tab} / {viewTitle}</button>{saved.map((s,i)=><button type="button" key={i} onClick={()=>navigate(s.tab,s.view)}>Open {s.tab} / {getTabSpec(data.workspace,s.tab)?.lenses[lensKeys(data.workspace,s.tab).indexOf(s.view)]||'Overview'}</button>)}</div>:null}
     <nav className={`${css.navBlock} ${r3.navBlock}`} aria-label={`${config.name} workspace sections`}><div className={`${css.tabs} ${r3.tabRail}`} role="tablist" aria-label="Workspace primary tabs">{tabs.map(t=><button id={`ops-tab-${data.workspace}-${tabs.indexOf(t)}`} key={t.name} role="tab" type="button" aria-selected={tab===t.name} aria-controls="ops-active-view" tabIndex={tab===t.name?0:-1} className={`${css.tab} ${tab===t.name?css.tabActive:''}`} onClick={()=>navigate(t.name,normalizedView(data.workspace,t.name,null))} onKeyDown={e=>{const i=tabs.indexOf(t);const next=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i-1+tabs.length)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;if(next<0)return;e.preventDefault();navigate(tabs[next].name,normalizedView(data.workspace,tabs[next].name,null));window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>document.getElementById(`ops-tab-${data.workspace}-${next}`)?.focus()));}}>{t.name}</button>)}</div></nav>
     <section id="ops-active-view" role="tabpanel" aria-label={`${tab} dedicated operator page`} className={r3.viewport}>
      <div className={r3.viewHeading}><div><span className={r3.sectionLabel}>ACTIVE WORKSPACE / {tab.toUpperCase()}</span><h2>{tab}</h2><p>{spec?.purpose||'Permission-scoped operational workspace.'}</p></div><span className={canShowSource?r3.sourceLive:r3.sourceGate}>{canShowSource?`SOURCE · ${current.area?.toUpperCase()}`:'SOURCE INTEGRATION REQUIRED'}</span></div>
      {data.failures.length?<div role="alert" className={r3.notice}><ShieldAlert size={18}/><span>Some authorized source requests were unavailable. {data.failures.join(' ')}</span></div>:null}
      {isOverview&&primary?<div className={r3.overviewGrid}>{[
       ['Primary source records',primary.total,`Native ${primary.area.toUpperCase()} authority`],
       ['Records on this page',primary.rows.length,`Server page ${primary.page}`],
       ['Authorized sources',data.sources.length,'Permission-checked domains'],
       ['Available operator screens',data.allowed.length,'Granted workspace scope']
      ].map(([name,total,detail])=><div className={r3.statCard} key={String(name)}><small>{name}</small><strong>{typeof total==='number'?fmt(total):'Unavailable'}</strong><span>{detail}</span></div>)}</div>:null}
      {isOverview?<div className={r3.overviewSpecialist}><SpecialistContent data={data}/></div>:null}
      <DeepWorkspace key={`${data.workspace}:${tab}`} data={data} tab={tab} area={current.area} activeView={selectedKey} onViewChange={next=>navigate(tab,next)} onPageChange={next=>navigate(tab,selectedKey,next)} query={query} onOpen={onOpen}/>
     </section>
    </main>
    <footer className={`${css.footer} ${r3.footer}`}><strong>JOBKIX</strong><span>Global Careers Platform · Operator Control Plane</span><div>Internal Operations · Permission-scoped access · Audited decisions</div><small>© JOBKIX · Official operator experience</small></footer>
   </div>
   {selected?<DossierR2 key={selected.id} record={selected} source={selectedArea||current.area||config.primary} canAudit={data.sources.some(s=>s.area==='audit')} onClose={()=>setSelected(null)} onUpdated={()=>router.refresh()}/>:null}
  </div>;
}
