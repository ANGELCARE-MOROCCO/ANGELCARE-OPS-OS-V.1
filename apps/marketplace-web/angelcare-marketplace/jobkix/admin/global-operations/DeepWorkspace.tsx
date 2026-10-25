'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,BarChart3,BookOpen,CheckCircle2,ChevronRight,ClipboardList,Database,Download,ExternalLink,Filter,Info,LockKeyhole,Search,ShieldCheck,SlidersHorizontal} from 'lucide-react';
import type {OpsPayload,SafeRow,Snapshot} from './server';
import {getTabSpec} from './TabRegistry';
import {nativeHref,type SourceArea} from './contracts';
import c from './deep.module.css';

type Props={data:OpsPayload;tab:string;area:SourceArea|null;onOpen:(row:SafeRow,source:SourceArea)=>void};
const attention=(s:string)=>/pending|review|failed|reported|triaged|needs_information|open|expired|suspended/i.test(s);
const label=(s:string)=>s.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const uniq=(s:string[])=>[...new Set(s.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const safeDownload=(rows:SafeRow[],name:string)=>{
 const cols:(keyof SafeRow)[]=['id','title','state','type','country','locale','organization','updatedAt'];
 const cell=(s:string)=>'"'+s.replaceAll('"','""').replace(/^[=+\-@\t\r]/,'\u2019$&')+'"';
 const body=[cols.join(','),...rows.map(r=>cols.map(k=>cell(String(r[k]??''))).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff',body],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
};
function countGroup(rows:SafeRow[],field:(r:SafeRow)=>string){
 const count=new Map<string,number>();for(const row of rows){const k=field(row)||'Not specified';count.set(k,(count.get(k)||0)+1);}
 return [...count.entries()].sort((a,b)=>b[1]-a[1]);
}
export function DeepWorkspace({data,tab,area,onOpen}:Props){
 const spec=getTabSpec(data.workspace,tab);
 const [lens,setLens]=useState(0),[term,setTerm]=useState(''),[state,setState]=useState(''),[market,setMarket]=useState(''),[breakdown,setBreakdown]=useState<'state'|'country'|'type'>('state'),[view,setView]=useState<'table'|'cards'>('table'),[attentionOnly,setAttentionOnly]=useState(false);
 useEffect(()=>{setLens(0);setTerm('');setState('');setMarket('');setAttentionOnly(false);},[tab]);
 const exact=area===null?undefined:data.sources.find(s=>s.area===area);
 const source:Snapshot|undefined=exact; // Do not relabel adjacent data as the missing authority.
 const all=source?.rows||[];
 const markets=useMemo(()=>uniq(all.map(x=>x.country)),[all]);
 const states=useMemo(()=>uniq(all.map(x=>x.state)),[all]);
 const filtered=useMemo(()=>all.filter(r=>(!term||[r.id,r.title,r.state,r.type,r.organization,r.country].some(x=>x.toLowerCase().includes(term.toLowerCase())))&&(!state||state===r.state)&&(!market||market===r.country)&&(!attentionOnly||attention(r.state))),[all,term,state,market,attentionOnly]);
 const groups=useMemo(()=>countGroup(filtered,r=>breakdown==='country'?r.country:breakdown==='type'?r.type:r.state),[filtered,breakdown]);
 const max=Math.max(1,...groups.map(x=>x[1]));
 const isLive=Boolean(exact);
 const showRecords=isLive&&lens===0, showSeg=isLive&&lens===1,showAudit=isLive&&lens===2;
 const insight=spec?.controls||[];
 const authority=area===null?null:nativeHref(area);
 if(!spec)return null;
 return <section className={c.board} aria-label={`${tab} specialized operator workspace`}>
   <div className={c.heading}>
    <div className={c.context}><span className={c.overline}>OPERATOR WORKBENCH · {data.workspace.toUpperCase()}</span><h2>{tab}</h2><p>{spec.purpose}</p></div>
    <span className={isLive?c.live:c.unavailable}><span className={c.dot}/>{isLive?'Native data authority connected':'Specialist read authority required'}</span>
   </div>
   <div className={c.nav} role="tablist" aria-label={`${tab} in-page navigation`}>
    {spec.lenses.map((text,i)=><button role="tab" aria-selected={lens===i} type="button" key={text} onClick={()=>setLens(i)} className={lens===i?c.chosen:''}><span>{String(i+1).padStart(2,'0')}</span>{text}</button>)}
   </div>
   {isLive?<>
     <div className={c.tools}>
      <label className={c.search}><Search size={15}/><input aria-label={`Filter ${tab} loaded records`} placeholder="Search this authorized page…" value={term} onChange={e=>setTerm(e.target.value)}/></label>
      <label><Filter size={13}/><select aria-label="Choose record state" value={state} onChange={e=>setState(e.target.value)}><option value="">All states</option>{states.map(s=><option value={s} key={s}>{label(s)}</option>)}</select></label>
      <label><select aria-label="Choose loaded country" value={market} onChange={e=>setMarket(e.target.value)}><option value="">All countries</option>{markets.map(s=><option key={s}>{s}</option>)}</select></label>
      <button type="button" aria-pressed={attentionOnly} className={attentionOnly?c.activeFilter:''} onClick={()=>setAttentionOnly(!attentionOnly)}>Needs attention</button>
      <button type="button" onClick={()=>{setState('');setTerm('');setMarket('');setAttentionOnly(false);}} aria-label="Reset workbench filters">Reset</button>
      <button type="button" onClick={()=>safeDownload(filtered,`jobkix-${data.workspace}-${tab.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-page.csv`)}><Download size={14}/> Page CSV</button>
     </div>
     <div className={c.scope}><Info size={14}/> {filtered.length} matching / {all.length} loaded records · Source: D0{['verification','vacancies','cases','reputation','taxonomy','editorial','health','audit'].indexOf(source!.area)+1} ({source!.area}) · This is a <strong>page-scoped view</strong>, not a search of every database record.</div>
   </>:<div className={c.gate}><LockKeyhole size={22}/><div><strong>A dedicated {tab.toLowerCase()} operator read model is not in the supplied source.</strong><p>R2 defines the full navigation, workflow and permission-boundary contract. It does not guess sensitive accounts, recruitment outcomes, service metrics or production statistics. Related native authorities remain available below.</p></div></div>}
   {showRecords?<>
     <div className={c.statStrip}>
      <div><small>Loaded records</small><strong>{all.length}</strong><span>Current server page</span></div>
      <div><small>Matching records</small><strong>{filtered.length}</strong><span>After local filters</span></div>
      <div><small>Attention signals</small><strong>{filtered.filter(x=>attention(x.state)).length}</strong><span>State-based observation</span></div>
      <div><small>Countries represented</small><strong>{uniq(filtered.map(x=>x.country)).length}</strong><span>Visible records only</span></div>
     </div>
     <div className={c.sectionTop}><div><h3>Operational records</h3><p>Inspect the safely projected record and continue in its authorized native authority.</p></div><div className={c.viewToggle}><button type="button" aria-pressed={view==='table'} onClick={()=>setView('table')}>Table</button><button type="button" aria-pressed={view==='cards'} onClick={()=>setView('cards')}>Cards</button></div></div>
     {filtered.length?view==='table'?<div className={c.tableScroll}><table className={c.table}><thead><tr><th>Record / reference</th><th>State</th><th>Type</th><th>Country</th><th>Updated</th><th>Inspect</th></tr></thead><tbody>{filtered.slice(0,40).map((r,i)=><tr key={`${r.id}-${i}`}><td><strong>{r.title}</strong><small>{r.id}</small></td><td><span className={c.state}>{label(r.state)}</span></td><td>{label(r.type)}</td><td>{r.country||'—'}</td><td>{r.updatedAt?(Number.isNaN(Date.parse(r.updatedAt))?r.updatedAt.slice(0,10):new Date(r.updatedAt).toLocaleDateString('en-GB')):'—'}</td><td><button type="button" onClick={()=>onOpen(r,source!.area)}>Inspect <ChevronRight size={13}/></button></td></tr>)}</tbody></table></div>:<div className={c.cards}>{filtered.slice(0,36).map((r,i)=><button type="button" key={`${r.id}-${i}`} onClick={()=>onOpen(r,source!.area)}><strong>{r.title}</strong><span>{label(r.state)}</span><small>{r.country||r.type||r.id}</small><span className={c.cardArrow}>Open dossier <ArrowRight size={14}/></span></button>)}</div>:<p className={c.empty}>There are no matching authorized records on this page. Try resetting the filters.</p>}
     <div className={c.subFoot}><Info size={14}/> Open the primary record table below to use server pagination for the next batch. Local filters apply only to the loaded page.</div>
   </>:null}
   {showSeg?<div className={c.twoCol}><article className={c.module}><div className={c.sectionTop}><div><h3>Distribution explorer</h3><p>Reconciles with the filtered page; never a global census.</p></div><select value={breakdown} onChange={e=>setBreakdown(e.target.value as 'state'|'country'|'type')} aria-label="Break down filtered records by"><option value="state">By state</option><option value="country">By country</option><option value="type">By type</option></select></div><div className={c.bars}>{groups.slice(0,10).map(([k,n])=><div key={k}><span title={k}>{label(k)}</span><div><i style={{width:`${100*n/max}%`}}/></div><b>{n}</b></div>)}</div>{groups.length===0?<p className={c.empty}>No available records for this breakdown.</p>:null}</article><article className={c.module}><h3>Quality of available fields</h3><p>Completeness of non-sensitive projected fields on the loaded page.</p>{[['Country',filtered.filter(x=>!!x.country).length],['Locale',filtered.filter(x=>!!x.locale).length],['Version',filtered.filter(x=>x.version!==null).length],['Updated timestamp',filtered.filter(x=>!!x.updatedAt).length]].map(([name,n])=><div className={c.quality} key={name}><span>{name}</span><div><i style={{width:`${Math.round(Number(n)/Math.max(1,filtered.length)*100)}%`}}/></div><b>{filtered.length?Math.round(Number(n)/filtered.length*100):0}%</b></div>)}</article></div>:null}
   {showAudit?<div className={c.twoCol}><article className={c.module}><h3>Recent source updates</h3><p>Dates exposed by the current permissioned projection. This is not a complete immutable audit log.</p>{filtered.slice().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,10).map((r,i)=><button className={c.event} type="button" key={`${r.id}-${i}`} onClick={()=>onOpen(r,source!.area)}><span className={c.eventIcon}><ClipboardList size={14}/></span><div><strong>{r.title}</strong><small>{label(r.state)} · {r.updatedAt||'Time unavailable'}</small></div><ChevronRight size={14}/></button>)}</article><article className={c.module}><h3>State attention breakdown</h3><p>Source-backed attention flags; operator judgment is always required.</p>{countGroup(filtered.filter(x=>attention(x.state)),r=>r.state).slice(0,8).map(([s,n])=><div className={c.riskRow} key={s}><span>{label(s)}</span><b>{n}</b></div>)}{filtered.every(x=>!attention(x.state))?<p className={c.empty}>No attention states on this authorized page.</p>:null}</article></div>:null}
   {lens===3||!isLive?<div className={c.twoCol}><article className={c.module}><h3>{tab} · Control contract</h3><p>The specialist controls expected before an additional privileged backend is enabled.</p><div className={c.checklist}>{insight.map((x,i)=><div key={x}><span className={c.check}><CheckCircle2 size={15}/></span><div><strong>{x}</strong><small>{i===0?'Require an authoritative data source and real scope checks.':i===1?'Validate against existing JOBKIX lifecycle, revisions and governance.':'Never substitute sample content for live records.'}</small></div></div>)}</div></article><article className={c.module}><h3>Authorized continuation</h3><p>Preserve native ownership of all high-risk decisions.</p><div className={c.authorityList}>{data.sources.map(s=><Link href={nativeHref(s.area)} key={s.area}><ShieldCheck size={16}/><div><strong>{label(s.area)}</strong><small>{s.total===null?'Total unavailable':`${s.total} source records`} · D0{['verification','vacancies','cases','reputation','taxonomy','editorial','health','audit'].indexOf(s.area)+1} permission checked</small></div><ExternalLink size={13}/></Link>)}</div>{data.sources.length===0?<p className={c.empty}>No related authorities are currently available.</p>:null}</article></div>:null}
   <div className={c.bottom}><BookOpen size={17}/><div><strong>Source-bound operator experience</strong><span>{authority?'This tab relies on JOBKIX native administrative read and audited commands.':'Specialist functionality remains gated until authorized native read/action services are deployed.'}</span></div>{authority?<Link href={authority}>Open native management <ArrowRight size={14}/></Link>:null}</div>
  </section>;
}
