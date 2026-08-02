'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, LibraryBig, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react'
import type { CatalogueCompositionResult, CatalogueCompositionScenario, CatalogueJourneyScenario, CataloguePackageScenario } from '@/lib/flashcards-os/catalogue-composer/types'
import styles from './catalogue-composer.module.css'
import { money, sourceLabel } from './ComposerPrimitives'

export default function CatalogueResultsTheatre({result}:{result:CatalogueCompositionResult}){
  const router=useRouter()
  const [selected,setSelected]=useState<string[]>([])
  const [expanded,setExpanded]=useState<string|null>(result.scenarios[0]?.id||null)
  const [working,setWorking]=useState(false)
  const [error,setError]=useState('')
  const collectionMap=useMemo(()=>new Map(result.collections.map((item)=>[item.id,item])),[result.collections])
  function toggle(id:string){setSelected((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id])}
  async function publish(){setWorking(true);setError('');try{
    const response=await fetch(`/api/flashcards-os/catalogue-composer/requests/${result.requestId}/publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioIds:selected,universe:result.universe})})
    const payload=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(String(payload.error||'Publication impossible.'))
    router.push(result.universe==='b2b'?'/flashcards-os/solutions/b2b':'/flashcards-os/solutions/b2c')
    router.refresh()
  }catch(e){setError(e instanceof Error?e.message:'Publication impossible.');setWorking(false)}}
  return <div className={styles.page}>
    <section className={styles.resultsHero}><div><Link className={styles.backLink} href={result.mode==='package'?'/flashcards-os/solutions/composer':'/flashcards-os/solutions/learning-journeys/new'}><ArrowLeft size={15}/> Nouvelle compilation</Link><div className={styles.kicker}><Sparkles size={16}/> CATALOGUE COMPOSITION THEATRE</div><h1>{result.title}</h1><p>{result.scenarios.length} proposition(s) compilée(s) à partir du registre local. Sélectionnez une ou plusieurs références pour publication immédiate dans la vitrine {result.universe.toUpperCase()}.</p></div><aside className={styles.sourceSeal}><strong>LOCAL CATALOGUE ONLY</strong><span>{sourceLabel(result.sourceMode)}</span><small>{result.requestCode} · IDs de collections validés · prix calculés côté serveur</small></aside></section>
    <section className={styles.resultCommand}><div><strong>{selected.length}</strong><span>sélection(s)</span></div><div><strong>{result.scenarios.length}</strong><span>propositions</span></div><div><strong>{new Set(result.scenarios.flatMap((item)=>item.collectionIds)).size}</strong><span>collections utilisées</span></div><div className={styles.commandGrow}><ShieldCheck size={17}/><span>OpenRouter conseille. Le catalogue, les prix et votre décision font autorité.</span></div><button className={styles.publishButton} disabled={!selected.length||working} onClick={publish}><PackageCheck size={17}/>{working?'Publication…':`Publier ${selected.length||''} sélection${selected.length>1?'s':''}`}</button></section>
    {error?<div className={styles.errorBox}>{error}</div>:null}
    <section className={styles.scenarioGrid}>{result.scenarios.map((scenario,index)=><article key={scenario.id} className={`${styles.scenarioCard} ${selected.includes(scenario.id)?styles.scenarioSelected:''}`}>
      <header><button className={styles.selectScenario} onClick={()=>toggle(scenario.id)}>{selected.includes(scenario.id)?<CheckCircle2 size={21}/>:<span>{index+1}</span>}</button><div><span>{result.mode==='package'?'PACKAGE':'PROGRAMME'} · {scenario.collectionIds.length} COLLECTIONS</span><h2>{scenario.name}</h2><p>{scenario.mode==='package'?scenario.positioning:scenario.thesis}</p></div><button className={styles.expandButton} onClick={()=>setExpanded(expanded===scenario.id?null:scenario.id)}>{expanded===scenario.id?<ChevronDown/>:<ChevronRight/>}</button></header>
      <div className={styles.scenarioMetrics}><div><span>Total</span><strong>{money(scenario.commercial.finalTotalDh)}</strong></div><div><span>Collections</span><strong>{scenario.collectionIds.length}</strong></div><div><span>IA réelle</span><strong>{scenario.modelUsed||'OpenRouter Free'}</strong></div><div><span>Prix</span><strong>Déterministe</strong></div></div>
      <div className={styles.collectionPills}>{scenario.collectionIds.map((id)=><span key={id}><LibraryBig size={12}/>{collectionMap.get(id)?.name||id}<small>v{collectionMap.get(id)?.versionLabel||'catalogue'}</small></span>)}</div>
      {expanded===scenario.id?<ScenarioDetail scenario={scenario} collectionMap={collectionMap}/>:null}
      <footer><button onClick={()=>toggle(scenario.id)} className={selected.includes(scenario.id)?styles.selectedAction:styles.secondaryAction}>{selected.includes(scenario.id)?<><Check size={15}/> Sélectionné</>:<>Sélectionner cette proposition</>}</button></footer>
    </article>)}</section>
  </div>
}

function ScenarioDetail({scenario,collectionMap}:{scenario:CatalogueCompositionScenario;collectionMap:Map<string,any>}){
  return <div className={styles.scenarioDetail}>
    {scenario.mode==='package'?<PackageDetail scenario={scenario} collectionMap={collectionMap}/>:<JourneyDetail scenario={scenario} collectionMap={collectionMap}/>} 
    <div className={styles.priceBreakdown}><h3>Détail tarifaire local</h3>{scenario.commercial.lines.map((line)=><div key={line.collectionId}><span>{line.collectionName}<small>{line.quantity} × {money(line.unitPriceDh)}</small></span><strong>{money(line.subtotalDh)}</strong></div>)}<div className={styles.priceTotal}><span>Total confirmé</span><strong>{money(scenario.commercial.finalTotalDh)}</strong></div>{scenario.commercial.warnings.map((warning)=><p key={warning}>{warning}</p>)}</div>
  </div>
}
function PackageDetail({scenario,collectionMap}:{scenario:CataloguePackageScenario;collectionMap:Map<string,any>}){return <div className={styles.packageDetail}><div className={styles.detailPanel}><h3>Promesse client</h3><p>{scenario.customerPromise}</p><b>{scenario.targetCustomer}</b></div><div className={styles.detailPanel}><h3>Logique de composition</h3>{scenario.collectionRationales.sort((a,b)=>a.usageOrder-b.usageOrder).map((item)=><div className={styles.rationaleRow} key={item.collectionId}><span>{item.usageOrder}</span><div><strong>{collectionMap.get(item.collectionId)?.name||item.collectionId}</strong><p>{item.rationale}</p></div></div>)}</div><div className={styles.detailPanel}><h3>Argument commercial</h3><p>{scenario.salesArgument}</p><small>Upgrade: {scenario.upgradePath||'Aucun chemin complémentaire indiqué.'}</small></div></div>}
function JourneyDetail({scenario,collectionMap}:{scenario:CatalogueJourneyScenario;collectionMap:Map<string,any>}){return <div className={styles.journeyDetail}><div className={styles.detailPanel}><h3>Résultat attendu</h3><p>{scenario.expectedOutcome}</p><b>{scenario.targetLearner}</b></div><div className={styles.dayRunway}>{scenario.days.map((day)=><details key={day.dayNumber} open={day.dayNumber===1}><summary><span>J{day.dayNumber}</span><strong>{day.title}</strong><small>{day.sessions.length} séance(s)</small></summary>{day.sessions.map((session)=><div className={styles.sessionBlock} key={session.sessionNumber}><header><b>Session {session.sessionNumber} · {session.title}</b><span>{session.durationMinutes} min</span></header>{session.activities.map((activity)=><div className={styles.activityRow} key={`${activity.order}-${activity.collectionId}`}><span>{activity.order}</span><div><strong>{activity.title}</strong><p>{activity.instruction}</p><small>{collectionMap.get(activity.collectionId)?.name||activity.collectionId} · {activity.cardReference} · {activity.durationMinutes} min</small></div></div>)}<p className={styles.facilitator}><b>Facilitateur:</b> {session.facilitatorInstruction}</p></div>)}<p className={styles.continuation}>{day.parentOrTeacherContinuation}</p></details>)}</div></div>}
