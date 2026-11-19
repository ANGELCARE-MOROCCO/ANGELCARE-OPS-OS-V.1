'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, Clock3, Download, Filter, Globe2, Layers3, MapPin, RefreshCw, Save, Search, ShieldCheck, TrendingUp, X } from 'lucide-react'
import type { XrayHistoricalFilters, XrayHistoricalSummary, XrayHistoricalLayer, XrayHistoricalGranularity, XrayHistoricalLocation } from './types'
import css from './historical-r6.module.css'

const HistoryMap = dynamic(()=>import('./HistoricalGeoMapR6').then(x=>x.HistoricalGeoMapR6),{ssr:false})
type Envelope = { data?: XrayHistoricalSummary; error?: { message?: string } }
type ViewMode = 'world'|'region'|'density'|'live'|'evolution'
const presets=[['24h',1],['7 jours',7],['30 jours',30],['90 jours',90],['180 jours',180],['1 an',365]] as const
const zones=['Africa/Casablanca','UTC','Europe/Paris','Europe/London','America/New_York','Asia/Dubai']
const formatInt=(n:number)=>Number(n||0).toLocaleString('fr-FR')
const flag=(code:string)=>/^[A-Z]{2}$/.test(code)?String.fromCodePoint(...code.split('').map(x=>x.charCodeAt(0)+127397)):'🌐'
const inputFromUtc=(iso:string,zone:string)=>{
  const value=new Date(iso)
  if(!Number.isFinite(value.getTime()))return ''
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(value)
  const part=(k:string)=>parts.find(p=>p.type===k)?.value||'00'
  return part('year')+'-'+part('month')+'-'+part('day')+'T'+part('hour')+':'+part('minute')
}
const utcFromZonedInput=(wall:string,zone:string)=>{
  const raw=Date.parse(wall+':00Z')
  if(!Number.isFinite(raw))throw new Error('Date ou heure invalide.')
  let guess=raw
  for(let i=0;i<4;i++){
    const shown=inputFromUtc(new Date(guess).toISOString(),zone)
    const got=Date.parse(shown+':00Z')
    if(!Number.isFinite(got))break
    const delta=raw-got
    if(!delta)break
    guess+=delta
  }
  return new Date(guess).toISOString()
}
function defaultFilter():XrayHistoricalFilters{
  const to=Date.now()
  return {from:new Date(to-7*86_400_000).toISOString(),to:new Date(to).toISOString(),timezone:'Africa/Casablanca',granularity:'day'}
}
function mergeFilters(f:XrayHistoricalFilters){
  const p=new URLSearchParams()
  for(const [key,value] of Object.entries(f))if(value)p.set(key,value)
  return p
}
function query(f:XrayHistoricalFilters){
  return '/api/angelcare-marketplace/analytics/xray/historical?'+mergeFilters(f).toString()
}
function readUrl(f:XrayHistoricalFilters):XrayHistoricalFilters{
  const u=new URLSearchParams(window.location.search)
  if(u.get('xrayHistorical')!=='1')return f
  const validGranularity=['hour','day','week','month']
  const next={...f}
  for(const key of ['from','to','timezone','country','device','route','source','intent','campaign','locale','event','search'] as const){
    const v=u.get('r6_'+key)
    if(v && v.length<260 && (key!=='timezone'||zones.includes(v)))Object.assign(next,{[key]:v})
  }
  const g=u.get('r6_granularity')
  if(g&&validGranularity.includes(g))next.granularity=g as XrayHistoricalGranularity
  return next
}
function PeriodControl({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  return <input type="datetime-local" step="60" value={value} onChange={e=>onChange(e.target.value)} />
}
function BarTimeline({history,kind}:{history:XrayHistoricalSummary;kind:'sessions'|'events'|'commerce'|'errors'}) {
  const points=history.timeline
  const max=Math.max(1,...points.map(x=>x[kind]))
  return <div className={css.timeline} role="img" aria-label={'Évolution '+kind+' sur la période'}>
    {points.length?points.map((x,i)=><div key={i} className={css.timelineColumn} title={x.bucket+' · '+formatInt(x[kind])} style={{height:Math.max(1,(x[kind]/max)*100)+'%'}}/>):<p>Pas d’événements pour construire la chronologie.</p>}
  </div>
}
function CountryEvolution({history}:{history:XrayHistoricalSummary}){
  const series=history.countryTimeline
  const top=history.countries.filter(c=>c.code!=='??').slice(0,8).map(c=>c.code)
  const times=[...new Set(series.map(x=>x.bucket))].sort()
  const maximum=Math.max(1,...series.map(x=>x.sessions))
  const colors=['#1583d5','#12b9b3','#ed7665','#9c70de','#d6a12a','#2c6e9e','#25ad73','#df6996']
  return <div className={css.evolution}>
    <div className={css.evolutionHeading}><h3>Évolution géographique quotidienne</h3><small>Huit pays principaux · sessions observées par jour selon la même sélection</small></div>
    {series.length>0?<><svg className={css.geoTrendChart} viewBox="0 0 900 240" preserveAspectRatio="none" role="img" aria-label="Tendances quotidiennes des sessions par pays">
      {[0,1,2,3,4].map(i=><line key={i} x1="36" y1={20+i*47} x2="880" y2={20+i*47} stroke="#e1ebf1" strokeWidth="1"/>)}
      {top.map((code,j)=>{
        const data=new Map(series.filter(x=>x.code===code).map(x=>[x.bucket,x.sessions]))
        const pts=times.map((bucket,i)=>(36+(times.length<=1?0:i/(times.length-1)*844))+','+(208-(data.get(bucket)||0)/maximum*188)).join(' ')
        return <polyline key={code} fill="none" stroke={colors[j%colors.length]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      })}
    </svg><div className={css.countryLegend}>{top.map((code,i)=><span key={code}><i style={{background:colors[i%colors.length]}}/>{flag(code)} {code}</span>)}</div>
    <div className={css.trendRange}>{times[0]?.slice(0,10)} — {times[times.length-1]?.slice(0,10)}</div>
    </>:<p>Aucune série géographique disponible pour la sélection. Aucune trajectoire n’est simulée.</p>}
  </div>
}

function Metric({label,value,sub,accent}:{label:string;value:string|number;sub?:string;accent?:string}) {
  return <div className={css.metric} data-accent={accent||'blue'}><small>{label}</small><strong>{typeof value==='number'?formatInt(value):value}</strong>{sub?<span>{sub}</span>:null}</div>
}

export function HistoricalIntelligenceR6(){
  const initial=useMemo(defaultFilter,[])
  const [draft,setDraft]=useState<XrayHistoricalFilters>(initial)
  const [applied,setApplied]=useState<XrayHistoricalFilters|null>(null)
  const [history,setHistory]=useState<XrayHistoricalSummary|null>(null)
  const [previous,setPrevious]=useState<XrayHistoricalSummary|null>(null)
  const [compare,setCompare]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [view,setView]=useState<ViewMode>('world')
  const [layer,setLayer]=useState<XrayHistoricalLayer>('presence')
  const [selected,setSelected]=useState<XrayHistoricalLocation|null>(null)
  const [metric,setMetric]=useState<'sessions'|'events'|'commerce'|'errors'>('sessions')
  const [saved,setSaved]=useState<Array<{name:string;filters:XrayHistoricalFilters}>>([])
  const [viewName,setViewName]=useState('')
  const [showFilters,setShowFilters]=useState(false)
  const seq=useRef(0)

  useEffect(()=>{
    const hydrated=readUrl(initial)
    setDraft(hydrated);setApplied(hydrated)
    try{const data=JSON.parse(localStorage.getItem('angelcare:xray:r6:views')||'[]');if(Array.isArray(data))setSaved(data.slice(0,10))}catch{}
  },[initial])

  useEffect(()=>{
    if(!applied)return
    const abort=new AbortController()
    const order=++seq.current
    setLoading(true);setError('')
    const nextQuery=query(applied)
    const start=Date.parse(applied.from),end=Date.parse(applied.to)
    const prior:{from:string;to:string}|null=compare?{from:new Date(start-(end-start)).toISOString(),to:new Date(start).toISOString()}:null
    const previousFilter=prior?{...applied,...prior}:null
    Promise.all([
      fetch(nextQuery,{credentials:'same-origin',cache:'no-store',signal:abort.signal}).then(async r=>{const b=await r.json() as Envelope;if(!r.ok||!b.data)throw new Error(b.error?.message||'Historical intelligence unavailable');return b.data}),
      previousFilter?fetch(query(previousFilter),{credentials:'same-origin',cache:'no-store',signal:abort.signal}).then(async r=>{const b=await r.json() as Envelope;return r.ok&&b.data?b.data:null}):Promise.resolve(null),
    ]).then(([primary,older])=>{
      if(order!==seq.current)return
      setHistory(primary);setPrevious(older)
    }).catch(e=>{
      if(abort.signal.aborted||order!==seq.current)return
      setHistory(null);setPrevious(null);setError(e instanceof Error?e.message:'Erreur analytique.')
    }).finally(()=>{if(order===seq.current)setLoading(false)})
    return ()=>abort.abort()
  },[applied,compare])

  function apply(filters=draft){
    try {
      const start=Date.parse(filters.from),end=Date.parse(filters.to)
      if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end||end>Date.now()+60_000||end-start>367*86_400_000)throw new Error('Période invalide. Maximum 367 jours ; aucune date future.')
      setError('')
      setApplied({...filters});setSelected(null)
      const next=new URL(window.location.href)
      next.searchParams.set('xrayHistorical','1')
      for(const [k,v] of mergeFilters(filters))next.searchParams.set('r6_'+k,v)
      window.history.replaceState(null,'',next.pathname+next.search+next.hash)
    }catch(e){setError(e instanceof Error?e.message:'Période invalide.')}
  }
  function selectPreset(days:number){
    const end=new Date(),start=new Date(end.getTime()-days*86_400_000)
    const g:XrayHistoricalGranularity=days===1?'hour':days<=90?'day':days<=180?'week':'month'
    const next={...draft,from:start.toISOString(),to:end.toISOString(),granularity:g}
    setDraft(next);apply(next)
  }
  function set<K extends keyof XrayHistoricalFilters>(key:K,value:XrayHistoricalFilters[K]){
    setDraft(f=>({...f,[key]:value}))
  }
  function saveView(){
    const name=viewName.trim().slice(0,50)
    if(!name)return
    const list=[{name,filters:draft},...saved.filter(x=>x.name!==name)].slice(0,10)
    setSaved(list);setViewName('')
    localStorage.setItem('angelcare:xray:r6:views',JSON.stringify(list))
  }
  function exportCSV(){
    if(!history)return
    const rows=[['Période','Pays','Sessions','Événements','Commerce','Incidents'],
      ...history.countries.map(c=>[history.from+' / '+history.to,c.code,String(c.sessions),String(c.events),String(c.commerce),String(c.errors)])]
    const csv=rows.map(row=>row.map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(';')).join('\n')
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob),link=document.createElement('a')
    link.href=url;link.download='angelcare-xray-geographie-r6.csv';link.click();URL.revokeObjectURL(url)
  }
  const countries=history?.countries||[]
  const mapped=history?.geoSessions||0
  const unmapped=history?Math.max(0,history.sessions-mapped):0
  const previousChange=previous?.sessions?((history?.sessions||0)-previous.sessions)/previous.sessions*100:null
  const filterChips=(applied?Object.entries(applied).filter(([k,v])=>!['from','to','timezone','granularity'].includes(k)&&Boolean(v)):[])

  return <section className={css.command} aria-label="Historical X-Ray Global Intelligence R6">
    <header className={css.heading}>
      <div><div className={css.eyebrow}><Globe2 size={15}/> GLOBAL INTELLIGENCE · HISTORICAL COMMAND</div>
        <h2>Intelligence géographique & temporelle</h2>
        <p>Analyse historique, géographie approximative qualifiée et performance commerciale. Une seule population de données pour tous les résultats.</p>
      </div>
      <div className={css.status}><ShieldCheck size={16}/> Historique enregistré uniquement <small>La conservation complète doit être vérifiée en base</small></div>
    </header>

    <div className={css.presets}>
      <div className={css.presetsLabel}><Clock3 size={15}/> Période</div>
      {presets.map(([title,days])=><button type="button" key={days} onClick={()=>selectPreset(days)}>{title}</button>)}
      <button type="button" className={css.filterAction} onClick={()=>setShowFilters(v=>!v)}><Filter size={14}/> Filtres avancés <ChevronDown size={13}/></button>
    </div>

    <div className={css.temporal}>
      <label>Du <PeriodControl value={inputFromUtc(draft.from,draft.timezone)} onChange={v=>{try{set('from',utcFromZonedInput(v,draft.timezone))}catch{}}}/></label>
      <label>Au <PeriodControl value={inputFromUtc(draft.to,draft.timezone)} onChange={v=>{try{set('to',utcFromZonedInput(v,draft.timezone))}catch{}}}/></label>
      <label>Fuseau horaire <select value={draft.timezone} onChange={e=>set('timezone',e.target.value)}>{zones.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Granularité <select value={draft.granularity} onChange={e=>set('granularity',e.target.value as XrayHistoricalGranularity)}>
        {(['hour','day','week','month'] as const).map(x=><option key={x} value={x}>{({hour:'Heure',day:'Jour',week:'Semaine',month:'Mois'})[x]}</option>)}
      </select></label>
    </div>

    {showFilters?<div className={css.advanced}>
      {([
        ['country','Pays (ISO, ex. MA)'],['device','Appareil'],['route','Route / chemin'],
        ['source','Source'],['campaign','Campagne'],['intent','Intention'],['locale','Langue'],
        ['event','Événement'],['search','Texte recherché'],
      ] as Array<[keyof XrayHistoricalFilters,string]>).map(([key,label])=><label key={key}>{label}<input value={String(draft[key]||'')} onChange={e=>set(key,e.target.value)} placeholder={label}/></label>)}
    </div>:null}

    <div className={css.actions}>
      <label className={css.comparison}><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/> Comparer à la période précédente</label>
      <button type="button" className={css.reset} onClick={()=>{setDraft(defaultFilter());setCompare(false)}}>Réinitialiser les filtres</button>
      <button type="button" className={css.apply} onClick={()=>apply()} disabled={loading}><RefreshCw size={14}/> {loading?'Chargement…':'Appliquer les filtres'}</button>
    </div>
    {filterChips.length?<div className={css.chips}>{filterChips.map(([key,value])=><button key={key} onClick={()=>{const next={...draft,[key]:undefined};setDraft(next);apply(next)}}>{key}: {String(value)} <X size={12}/></button>)}</div>:null}

    <div className={css.savedViews}>
      <Save size={14}/><input aria-label="Nommer la vue enregistrée" placeholder="Nom de vue privée, sur cet appareil" value={viewName} onChange={e=>setViewName(e.target.value)}/>
      <button onClick={saveView} disabled={!viewName.trim()}>Enregistrer</button>
      <select aria-label="Restaurer une vue" value="" onChange={e=>{const v=saved.find(x=>x.name===e.target.value);if(v){setDraft(v.filters);apply(v.filters)}}}>
        <option value="">Vues enregistrées ({saved.length})</option>{saved.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}
      </select>
    </div>

    {error?<div className={css.problem}><AlertTriangle size={17}/><div><strong>Analyse historique indisponible</strong><span>{error}. Les chiffres ne sont pas remplacés par des valeurs fictives. Vérifiez que la migration R6 est appliquée.</span></div></div>:null}
    {history?<>
      <div className={css.coverage}><ShieldCheck size={17}/><span>
        Agrégats exacts parmi les événements conservés · {history.firstObserved?'Première observation sélectionnée : '+new Date(history.firstObserved).toLocaleString('fr-FR',{timeZone:history.timezone}):'Aucun événement observé'}.
        La rétention et les périodes manquantes ne sont pas certifiées.
      </span><button onClick={exportCSV}><Download size={13}/> CSV</button></div>
      <div className={css.metrics}>
        <Metric label="Sessions observées" value={history.sessions} sub={previousChange===null?'Période choisie':(previousChange>=0?'+':'')+previousChange.toFixed(1)+' % vs précédente'}/>
        <Metric label="Événements" value={history.events} accent="violet"/>
        <Metric label="Pays identifiés" value={countries.filter(c=>c.code!=='??').length} accent="aqua"/>
        <Metric label="Signaux commerciaux" value={history.commerce} accent="gold"/>
        <Metric label="Incidents observés" value={history.errors} accent="coral"/>
        <Metric label="Sans position de ville" value={unmapped} accent="gray" sub="Pays seul ou zone non résolue"/>
      </div>
      <div className={css.graphHeader}><div><small>CHRONOLOGIE</small><h3>Évolution sur la période sélectionnée</h3></div>
        <select value={metric} onChange={e=>setMetric(e.target.value as typeof metric)}><option value="sessions">Sessions</option><option value="events">Événements</option><option value="commerce">Commerce</option><option value="errors">Incidents</option></select>
      </div>
      <BarTimeline history={history} kind={metric}/>
      {history.geoCellsTotal>history.locations.length?<div className={css.notice}><AlertTriangle size={16}/> La carte présente {formatInt(history.locations.length)} zones sur {formatInt(history.geoCellsTotal)}. Les totaux restent calculés sur l’ensemble des événements retenus.</div>:null}
      <div className={css.geoTitle}>
        <div><small>GÉOGRAPHIE QUALIFIÉE</small><h3>Explorez les zones réellement identifiables</h3><p>Les regroupements par pays ne sont pas des positions individuelles. Aucun point n’est inventé.</p></div>
        <div className={css.layerRow}>{(['presence','commerce','risk','density'] as const).map(k=><button key={k} className={layer===k?css.active:''} onClick={()=>setLayer(k)}>{({presence:'Présence',commerce:'Commerce',risk:'Risques',density:'Densité'})[k]}</button>)}</div>
      </div>
      <div className={css.views}>{([
        ['world','🌍 Vue mondiale'],['region','📍 Régions'],['density','🔥 Densité'],['live','📡 Période récente'],['evolution','📈 Évolution']
      ] as Array<[ViewMode,string]>).map(([k,label])=><button key={k} className={view===k?css.selected:''} onClick={()=>{setView(k);if(k==='density')setLayer('density')}}>{label}</button>)}</div>
      {view==='evolution'?<CountryEvolution history={history}/>:
       view==='live'?<div className={css.notice}><Activity size={18}/> Pour l’activité réellement instantanée, utilisez le premier onglet « Live Store ». Cette vue présente uniquement la période historique sélectionnée et ne simule pas de présences en direct.</div>:
      <div className={css.mapGrid}>
        <HistoryMap locations={history.locations} mode={layer} selected={selected?.city||null} onSelect={setSelected}/>
        <aside className={css.countries}>{view==='region'?<>
          <div className={css.countryHeading}><h4>Régions & villes</h4><span>{formatInt(history.locations.length)} cellules</span></div>
          {history.locations.map((l,i)=><button key={l.code+l.city+i} onClick={()=>setSelected(l)} className={css.countryRow}>
            <span>{flag(l.code)}</span><div><strong>{l.city||l.region||l.code}</strong><small>{l.region||'Région non renseignée'} · {formatInt(l.commerce)} commerce</small></div><b>{formatInt(l.sessions)}</b>
          </button>)}
          {!history.locations.length?<p className={css.empty}>Aucune ville géographiquement qualifiée disponible.</p>:null}
        </>:<>
          <div className={css.countryHeading}><h4>Pays & territoires</h4><span>{formatInt(countries.length)} zones</span></div>
          {countries.map((c,i)=><button key={c.code+String(i)} onClick={()=>{const next={...draft,country:c.code};setDraft(next);apply(next)}} className={css.countryRow}>
            <span>{flag(c.code)}</span><div><strong>{c.code==='??'?'Non résolu':c.code}</strong><small>{formatInt(c.events)} événements · {formatInt(c.commerce)} commerce</small></div><b>{formatInt(c.sessions)}</b>
          </button>)}
          {!countries.length?<p className={css.empty}>Aucun pays observé pour les filtres sélectionnés.</p>:null}
        </>}</aside>
      </div>}
      {selected?<div className={css.locationDetail}><MapPin size={16}/><strong>{selected.city||selected.region||selected.code}</strong><span>{formatInt(selected.sessions)} sessions · {formatInt(selected.commerce)} commerce · {formatInt(selected.errors)} risques</span><small>Position approximative par IP, cellule de 0,1 degré, jamais adresse ou GPS</small><button onClick={()=>setSelected(null)}><X size={14}/></button></div>:null}
      <div className={css.foot}><CheckCircle2 size={16}/> {formatInt(mapped)} sessions distinctes associées à des villes approximatives · {formatInt(unmapped)} sans zone de ville fiable. Les cellules de carte peuvent représenter plusieurs visites ; les sessions sans ville valide ne reçoivent aucun marqueur.</div>
    </>:!loading&&!error?<div className={css.empty}>Choisissez une période et appliquez les filtres.</div>:null}
  </section>
}
