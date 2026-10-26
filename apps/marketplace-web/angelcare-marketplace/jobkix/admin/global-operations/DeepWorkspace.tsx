'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,BarChart3,BookOpen,CheckCircle2,ChevronLeft,ChevronRight,Clock3,Download,ExternalLink,Filter,Globe2,Info,LockKeyhole,Search,ShieldAlert,ShieldCheck,SlidersHorizontal,Table2} from 'lucide-react';
import {getTabSpec} from './TabRegistry';
import {lensKeys,normalizedView} from './ViewKeys';
import {nativeHref,type SourceArea} from './contracts';
import type {OpsPayload,SafeRow,Snapshot} from './server';
import r3 from './navigation-r3.module.css';

type Props={data:OpsPayload;tab:string;area:SourceArea|null;activeView:string;query:string;onViewChange:(view:string)=>void;onPageChange:(page:number)=>void;onOpen:(row:SafeRow,source:SourceArea)=>void};
type LensKind='records'|'summary'|'geography'|'distribution'|'activity'|'exceptions'|'governance';
const human=(n:number)=>new Intl.NumberFormat('en-US').format(n);
const label=(s:string)=>s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const attention=(s:string)=>/pending|review|failed|reported|triaged|needs_information|open|expired|suspended|flagged|blocked/i.test(s);
const by=(rows:SafeRow[],fn:(r:SafeRow)=>string)=>{
 const groups=new Map<string,number>();rows.forEach(r=>{const k=fn(r)||'Not provided';groups.set(k,(groups.get(k)||0)+1);});
 return [...groups.entries()].sort((a,b)=>b[1]-a[1]);
};
const unique=(values:string[])=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
function lensKind(lens:string,tab:string,index:number):LensKind{
 const name=lens.toLowerCase(),context=tab.toLowerCase();
 if(/authority|governance|control|access|permission|guardrail|approval path|policy|definition|requirement|readiness|integration|limitations|compliance/i.test(name))return 'governance';
 if(/chronolog|history|timeline|event|audit|revision|recent changes|publication history|source update/i.test(name))return 'activity';
 if(/risk|fraud|exception|alert|review queue|pending|blocked|failure|breach|incident|appeal|escalat|unresolved|age|investigation|overdue/i.test(name))return 'exceptions';
 if(/country|region|territor|geograph|jurisdiction|market comparison|market balance|market coverage|footprint|expansion|global/i.test(name))return 'geography';
 if(/distribution|composition|mix|compare|segmentation|quality|coverage|trend|insight|conversion|volume|health|signal|performance|analysis|aggregate/i.test(name))return 'distribution';
 if(/overview|pulse|snapshot|executive|summary|status|readiness|workflow/i.test(name))return 'summary';
 if(index===3)return 'governance';
 if(index===2)return 'activity';
 if(index===1)return /country|global|expansion|sector/i.test(context)?'geography':'distribution';
 return 'records';
}
function downloadPage(rows:SafeRow[],workspace:string,tab:string,view:string){
 const fields:(keyof SafeRow)[]=['id','title','state','type','country','locale','organization','updatedAt'];
 const cell=(value:unknown)=>'"'+String(value??'').replaceAll('"','""').replace(/^[=+\-@\t\r]/,'\u2019$&')+'"';
 const csv=[fields.join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n');
 const link=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff',csv+'\r\n'],{type:'text/csv;charset=utf-8'}));
 link.href=url;link.download=`jobkix-ops-${workspace}-${tab.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${view}.csv`;
 link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Title({title,description,source}:{title:string;description:string;source?:string}){
 return <div className={r3.moduleTitle}><div><span className={r3.sectionLabel}>SPECIALIST OPERATOR VIEW</span><h3>{title}</h3><p>{description}</p></div>{source?<span className={r3.moduleSource}>{source}</span>:null}</div>;
}
function Stat({title,value,caption}:{title:string;value:number|null;caption:string}){
 return <div className={r3.statCard}><small>{title}</small><strong>{value===null?'—':human(value)}</strong><span>{caption}</span></div>;
}
function Bars({rows,field}:{rows:SafeRow[];field:(r:SafeRow)=>string}){
 const grouped=by(rows,field).slice(0,12),max=Math.max(1,...grouped.map(([,n])=>n));
 return grouped.length?<div className={r3.bars}>{grouped.map(([name,num])=><div className={r3.barRow} key={name}><span title={name}>{label(name)}</span><div><i style={{width:`${Math.max(2,num/max*100)}%`}}/></div><b>{human(num)}</b></div>)}</div>:<p className={r3.empty}>No matching authorized records in the current page.</p>;
}
function Records({rows,area,onOpen,viewMode}:{rows:SafeRow[];area:SourceArea;onOpen:Props['onOpen'];viewMode:'table'|'cards'}){
 if(!rows.length)return <div className={r3.empty}><Search size={19}/> No matching authorized records for these filters.</div>;
 if(viewMode==='cards')return <div className={r3.recordCards}>{rows.map((r,i)=><button key={`${r.id}-${i}`} type="button" onClick={()=>onOpen(r,area)}><span className={r3.recordState}>{label(r.state)}</span><strong>{r.title}</strong><small>{r.organization||r.country||r.id}</small><span>Open record dossier <ArrowRight size={14}/></span></button>)}</div>;
 return <div className={r3.tableScroll}><table className={r3.table}><thead><tr><th scope="col">Authorized record</th><th scope="col">State</th><th scope="col">Type</th><th scope="col">Country</th><th scope="col">Updated</th><th scope="col">Action</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.id}-${i}`}><td><strong>{r.title}</strong><small>{r.organization||r.id}</small></td><td><span className={r3.recordState}>{label(r.state)}</span></td><td>{label(r.type||'—')}</td><td>{r.country||'—'}</td><td>{r.updatedAt?r.updatedAt.slice(0,10):'—'}</td><td><button type="button" onClick={()=>onOpen(r,area)}>Open <ChevronRight size={15}/></button></td></tr>)}</tbody></table></div>;
}
export function DeepWorkspace({data,tab,area,activeView,query,onViewChange,onPageChange,onOpen}:Props){
 const spec=getTabSpec(data.workspace,tab);
 const ids=lensKeys(data.workspace,tab);
 const resolved=normalizedView(data.workspace,tab,activeView);
 const index=Math.max(0,ids.indexOf(resolved));
 const name=spec?.lenses[index]||tab;
 const kind=lensKind(name,tab,index);
 const [term,setTerm]=useState(''),[state,setState]=useState(''),[country,setCountry]=useState(''),[type,setType]=useState(''),[viewMode,setViewMode]=useState<'table'|'cards'>('table'),[onlyAttention,setOnlyAttention]=useState(false),[distribution,setDistribution]=useState<'state'|'country'|'type'>('state');
 useEffect(()=>{setTerm('');setState('');setCountry('');setType('');setOnlyAttention(false);setViewMode('table');setDistribution('state');},[resolved]);
 const source:Snapshot|undefined=area===null?undefined:data.sources.find(x=>x.area===area);
 const all=source?.rows||[];
 const filterTerm=(query+' '+term).trim().toLowerCase();
 const rows=useMemo(()=>all.filter(r=>(!filterTerm||[r.id,r.title,r.state,r.type,r.country,r.organization].some(x=>x.toLowerCase().includes(filterTerm)))&&(!country||r.country===country)&&(!state||r.state===state)&&(!type||r.type===type)&&(!onlyAttention||attention(r.state))),[all,filterTerm,country,state,type,onlyAttention]);
 const states=useMemo(()=>unique(all.map(r=>r.state)),[all]);
 const countries=useMemo(()=>unique(all.map(r=>r.country)),[all]);
 const types=useMemo(()=>unique(all.map(r=>r.type)),[all]);
 const risks=useMemo(()=>rows.filter(r=>attention(r.state)),[rows]);
 const recorded=useMemo(()=>rows.filter(r=>r.updatedAt||r.createdAt).slice().sort((a,b)=>(b.updatedAt||b.createdAt).localeCompare(a.updatedAt||a.createdAt)),[rows]);
 const scope=source?`D0${['verification','vacancies','cases','reputation','taxonomy','editorial','health','audit'].indexOf(source.area)+1} · ${source.area}`:'';
 if(!spec)return <div className={r3.notice} role="status">This tab has no registered operator contract.</div>;
 const clear=()=>{setTerm('');setState('');setCountry('');setType('');setOnlyAttention(false);};
 const refView:'state'|'country'|'type'=kind==='geography'?'country':kind==='exceptions'?'state':kind==='distribution'?distribution:'state';
 return <div className={r3.workbench}>
  <nav className={r3.lensRail} aria-label={`${tab} dedicated subviews`} role="tablist">{spec.lenses.map((lens,i)=><button type="button" role="tab" key={ids[i]} tabIndex={i===index?0:-1} aria-selected={i===index} aria-controls="ops-specialist-content" className={i===index?r3.lensActive:''} onClick={()=>{clear();onViewChange(ids[i]);}} onKeyDown={e=>{const next=e.key==='ArrowRight'?(i+1)%ids.length:e.key==='ArrowLeft'?(i-1+ids.length)%ids.length:e.key==='Home'?0:e.key==='End'?ids.length-1:-1;if(next<0)return;e.preventDefault();clear();onViewChange(ids[next]);window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>document.getElementById(`ops-lens-${data.workspace}-${tab.replace(/[^a-z0-9]+/gi,'-')}-${next}`)?.focus()));}} id={`ops-lens-${data.workspace}-${tab.replace(/[^a-z0-9]+/gi,'-')}-${i}`}><span>{String(i+1).padStart(2,'0')}</span>{lens}</button>)}</nav>
  <section id="ops-specialist-content" role="tabpanel" aria-label={`${tab}: ${name}`} className={r3.lensContent} key={resolved}>
   <Title title={name} description={spec.purpose} source={source?scope:undefined}/>
   {!source?<div className={r3.integrationGate} role="status"><LockKeyhole size={25}/><div><h3>Dedicated operator data authority required</h3><p>The <strong>{tab} / {name}</strong> screen has its own navigation and workflow contract, but its authorized data service is not deployed in the inspected source. No unrelated records, private profiles, synthetic KPI figures or substitute tables are displayed.</p><div className={r3.contractRows}>{spec.controls.map((x,i)=><div key={x}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong></div>)}</div><p>Activate this area only after adding a permission-checked read model, authorized actions and audit coverage.</p></div></div>:<>
    <div className={r3.contextStrip}><span><ShieldCheck size={14}/> Authorized {source.area} projection</span><span>Server page {source.page} · {source.total===null?'Total unavailable':`${human(source.total)} available records`}</span><Link href={nativeHref(source.area)}>Native controls <ExternalLink size={14}/></Link></div>
    <div className={r3.filterbar}><label><Search size={15}/><input aria-label="Search this view" placeholder={`Search ${name.toLowerCase()}…`} value={term} onChange={e=>setTerm(e.target.value)} maxLength={300}/></label><label><Filter size={14}/><select value={state} onChange={e=>setState(e.target.value)} aria-label="Filter by state"><option value="">All states</option>{states.map(x=><option key={x} value={x}>{label(x)}</option>)}</select></label><label><Globe2 size={14}/><select value={country} onChange={e=>setCountry(e.target.value)} aria-label="Filter by country"><option value="">All countries</option>{countries.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label><SlidersHorizontal size={14}/><select value={type} onChange={e=>setType(e.target.value)} aria-label="Filter by record type"><option value="">All types</option>{types.map(x=><option key={x} value={x}>{label(x)}</option>)}</select></label><button type="button" onClick={clear}>Reset</button><button type="button" onClick={()=>downloadPage(rows,data.workspace,tab,resolved)}><Download size={14}/> Export visible page</button></div>
    <div className={r3.scopeNote}><Info size={15}/> {human(rows.length)} matching of {human(all.length)} records loaded. Filters and charts cover <strong>only this authorized server page</strong>, not the complete global database.</div>
    {kind==='summary'?<>
     <div className={r3.fourStats}><Stat title="Total source records" value={source.total} caption="Server-reported total"/><Stat title="Loaded on this page" value={all.length} caption="Current source page"/><Stat title="Matching visible records" value={rows.length} caption="With current filters"/><Stat title="Attention states" value={risks.length} caption="Observed records only"/></div>
     <div className={r3.twoPanel}><article className={r3.module}><Title title={`${name} · status`} description="Source-backed composition of the selected records"/><Bars rows={rows} field={r=>r.state}/></article><article className={r3.module}><Title title="Regional activity" description="Countries present on this current authorized page"/><Bars rows={rows} field={r=>r.country}/></article></div>
     <article className={r3.module}><Title title="Latest observed records" description="Selected records with a current authorized operator dossier"/><Records rows={recorded.slice(0,8)} area={source.area} onOpen={onOpen} viewMode="table"/></article>
    </>:null}
    {kind==='records'?<>
     <div className={r3.fourStats}><Stat title="Source total" value={source.total} caption="Server-reported"/><Stat title="Loaded" value={all.length} caption="Current page"/><Stat title="Matching records" value={rows.length} caption="Filtered page"/><Stat title="Requiring attention" value={risks.length} caption="State-based signal"/></div>
     <article className={r3.module}><div className={r3.titleActions}><div><h3>{name} · records</h3><p>Review permitted metadata and open a versioned, audited record dossier.</p></div><div><button type="button" aria-pressed={viewMode==='table'} onClick={()=>setViewMode('table')}><Table2 size={14}/> Table</button><button type="button" aria-pressed={viewMode==='cards'} onClick={()=>setViewMode('cards')}><SlidersHorizontal size={14}/> Cards</button></div></div><Records rows={rows} area={source.area} onOpen={onOpen} viewMode={viewMode}/></article>
    </>:null}
    {kind==='exceptions'?<>
     <div className={r3.fourStats}><Stat title="Attention signals" value={risks.length} caption="State-classified on page"/><Stat title="Other visible records" value={rows.length-risks.length} caption="No flagged state"/><Stat title="Current source page" value={source.page} caption="Not the whole database"/><Stat title="Total source records" value={source.total} caption="Server-reported"/></div>
     <div className={r3.twoPanel}><article className={r3.module}><Title title="Exception review queue" description="A state signal is not proof of wrongdoing or a final decision"/><Records rows={risks} area={source.area} onOpen={onOpen} viewMode="table"/></article><article className={r3.module}><Title title="Exception composition" description="Breakdown of visible attention states"/><Bars rows={risks} field={r=>r.state}/><div className={r3.safetyHint}><ShieldAlert size={16}/> Decisions require native authority, evidence and human review.</div></article></div>
    </>:null}
    {kind==='geography'?<>
     <div className={r3.fourStats}><Stat title="Countries on this page" value={unique(rows.map(r=>r.country)).length} caption="Loaded records only"/><Stat title="Matching records" value={rows.length} caption="Visible records"/><Stat title="Country not supplied" value={rows.filter(r=>!r.country).length} caption="Projection completeness"/><Stat title="Total source records" value={source.total} caption="Not country-filtered"/></div>
     <div className={r3.twoPanel}><article className={r3.module}><Title title="Verified country distribution" description="No coverage claims beyond observed page records"/><Bars rows={rows} field={r=>r.country}/></article><article className={r3.module}><Title title="Markets represented" description="A searchable current-page regional directory"/><div className={r3.geoList}>{by(rows,r=>r.country).map(([name,count])=><button type="button" onClick={()=>setCountry(name==='Not provided'?'':name)} key={name}><Globe2 size={16}/><strong>{name}</strong><span>{human(count)} visible records</span><ChevronRight size={14}/></button>)}</div></article></div>
    </>:null}
    {kind==='distribution'?<>
     <div className={r3.fourStats}><Stat title="Visible records" value={rows.length} caption="Current filter set"/><Stat title="Unique states" value={unique(rows.map(r=>r.state)).length} caption="Current page"/><Stat title="Unique record types" value={unique(rows.map(r=>r.type)).length} caption="Current page"/><Stat title="Source total" value={source.total} caption="Server-reported"/></div>
     <div className={r3.twoPanel}><article className={r3.module}><div className={r3.titleActions}><div><h3>{name} · breakdown</h3><p>Observed distribution on the selected authorized page</p></div><select aria-label="Choose distribution dimension" value={distribution} onChange={e=>setDistribution(e.target.value as 'state'|'country'|'type')}><option value="state">By state</option><option value="country">By country</option><option value="type">By type</option></select></div><Bars rows={rows} field={r=>String(r[refView]||'')}/></article><article className={r3.module}><Title title="Projected data quality" description="Completeness for permitted, non-sensitive record metadata"/><div className={r3.qualityGrid}>{[['Country',rows.filter(r=>!!r.country).length],['Locale',rows.filter(r=>!!r.locale).length],['Version',rows.filter(r=>r.version!==null).length],['Updated date',rows.filter(r=>!!r.updatedAt).length]].map(([n,value])=><div key={n}><strong>{n}</strong><b>{rows.length?Math.round(Number(value)/rows.length*100):0}%</b></div>)}</div></article></div>
    </>:null}
    {kind==='activity'?<>
     <div className={r3.fourStats}><Stat title="Visible records" value={rows.length} caption="Permissioned page"/><Stat title="Dated records" value={recorded.length} caption="Creation/update timestamps"/><Stat title="Undated" value={rows.length-recorded.length} caption="Missing timestamps"/><Stat title="Source total" value={source.total} caption="Server-reported"/></div>
     <article className={r3.module}><Title title={`${name} · chronology`} description="Projected creation/update events only; this is not a complete immutable audit trail"/><div className={r3.eventList}>{recorded.slice(0,28).map((r,i)=><button key={`${r.id}-${i}`} type="button" onClick={()=>onOpen(r,source.area)}><span className={r3.eventIcon}><Clock3 size={17}/></span><span><strong>{r.title}</strong><small>{label(r.state)} · {r.type||source.area}</small></span><time>{(r.updatedAt||r.createdAt).slice(0,16).replace('T',' ')}</time><ChevronRight size={16}/></button>)}</div>{recorded.length===0?<p className={r3.empty}>No timestamped records in this authorized page.</p>:null}</article>
     {area!=='audit'&&data.sources.some(s=>s.area==='audit')?<Link className={r3.nativeButton} href={nativeHref('audit')}>Inspect immutable audit authority <ExternalLink size={14}/></Link>:null}
    </>:null}
    {kind==='governance'?<div className={r3.twoPanel}><article className={r3.module}><Title title={`${name} · control requirements`} description="Configured specialist controls and governance conditions"/><div className={r3.contractRows}>{spec.controls.map((control,i)=><div key={control}><span>{String(i+1).padStart(2,'0')}</span><strong>{control}</strong><CheckCircle2 size={15}/></div>)}</div></article><article className={r3.module}><Title title="Native authority handoff" description="Every privileged decision must use established JOBKIX commands"/><div className={r3.authorityBox}><ShieldCheck size={26}/><h4>{label(source.area)} authority</h4><p>Source-backed reading is available. Authorization for each write remains independently enforced by the native D01–D08 endpoint.</p><Link href={nativeHref(source.area)}>Open native management <ArrowRight size={15}/></Link></div></article></div>:null}
    <div className={r3.bottomContext}><div><BookOpen size={17}/><span>{tab} / {name} · Data provenance: {scope}. No shared reports stacked below this active view.</span></div><Link href={nativeHref(source.area)}>Authorized source <ExternalLink size={13}/></Link></div>
    {(kind==='records'||kind==='exceptions'||kind==='activity')&&source.total!==null&&source.total>source.rows.length?<div className={r3.pagination}><span>Server page {source.page} · {human(source.rows.length)} loaded / {human(source.total)} total</span><div><button type="button" disabled={source.page<=1} onClick={()=>onPageChange(source.page-1)}><ChevronLeft size={15}/> Previous page</button><button type="button" disabled={source.rows.length===0||source.page*24>=source.total!} onClick={()=>onPageChange(source.page+1)}>Next page <ChevronRight size={15}/></button></div></div>:null}
   </>}
  </section>
 </div>;
}
