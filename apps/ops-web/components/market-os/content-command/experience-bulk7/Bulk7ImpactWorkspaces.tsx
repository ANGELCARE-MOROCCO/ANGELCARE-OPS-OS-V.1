"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Activity, ArrowRight, BadgeCheck, BarChart3, BookOpenCheck, BrainCircuit, BriefcaseBusiness,
  CalendarRange, CheckCircle2, CircleAlert, CircleDot, DatabaseZap, Eye, FileCheck2, Fingerprint,
  GitBranch, Globe2, Layers3, Lightbulb, Link2, ListChecks, LoaderCircle, Map, MousePointerClick,
  Network, Orbit, PackageCheck, RefreshCcw, Route, Scale, SearchCheck, ShieldCheck, Sparkles,
  Target, TrendingUp, UserRoundCheck, UsersRound, Workflow, Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageStatus } from "../headquarters/primitives"
import { headquartersAction, useHeadquartersSnapshot } from "../headquarters/client"
import {
  buildImpactModel, caseTone, eventOf, formatDh, formatImpactDate, metricRecord, metricValue,
  readable, text, type ImpactCase, type ImpactMetricKey,
} from "./bulk7-impact-model"
import { DataSeal, DominantAction, MetricReadout, TonePill, TruthBoundary, WorkspaceTitle } from "./bulk7-ui"
import styles from "./bulk7-impact.module.css"

const BASE = "/market-os/content-command-center"

type WorkspaceMode = "performance" | "attribution" | "optimization" | "learning"

type WorkspaceState = {
  selected: ImpactCase | null
  select: (id: string) => void
  cases: ImpactCase[]
  model: ReturnType<typeof buildImpactModel>
  loading: boolean
  error: string
  refresh: () => Promise<void>
  busy: boolean
  notice: string
  execute: (action: string, payload: Record<string, unknown>) => Promise<boolean>
}

function useBulk7Workspace(): WorkspaceState {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const model = React.useMemo(() => buildImpactModel(snapshot), [snapshot])
  const searchParams = useSearchParams()
  const requested = searchParams.get("packageId") || ""
  const [selectedId, setSelectedId] = React.useState(requested)
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  React.useEffect(() => { if (!selectedId && model.cases[0]) setSelectedId(model.cases[0].id) }, [model.cases, selectedId])
  const selected = model.cases.find((item) => item.id === selectedId) || model.cases[0] || null
  async function execute(action: string, payload: Record<string, unknown>) {
    setBusy(true); setNotice("")
    try {
      await headquartersAction(action, payload)
      await refresh()
      setNotice("Action persistée. La mesure, l’attribution, la décision et la mémoire ont été resynchronisées depuis la source autoritaire.")
      return true
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "BULK7_ACTION_FAILED")
      return false
    } finally { setBusy(false) }
  }
  return { selected, select: setSelectedId, cases: model.cases, model, loading, error, refresh, busy, notice, execute }
}

function Frame({ mode, state, children }: { mode: WorkspaceMode; state: WorkspaceState; children: React.ReactNode }) {
  const titles: Record<WorkspaceMode, { eyebrow: string; title: string; description: string }> = {
    performance: { eyebrow: "IMPACT OBSERVATORY", title: "L’externalité mesurée, sans performance inventée.", description: "Chaque résultat reste lié à une publication vérifiée, une fenêtre d’observation, une provenance et une limite explicite." },
    attribution: { eyebrow: "ATTRIBUTION CHAMBER", title: "Corrélation, influence et causalité ne sont jamais confondues.", description: "Le parcours, les touchpoints, les preuves concurrentes et la conclusion humaine forment un dossier d’attribution inspectable." },
    optimization: { eyebrow: "OPTIMIZATION FOUNDRY", title: "Le résultat devient une décision gouvernée, jamais une retouche silencieuse.", description: "Continuer, adapter, localiser, réemployer, relancer ou retirer implique un périmètre, une autorité et une conséquence visible." },
    learning: { eyebrow: "INSTITUTIONAL LEARNING", title: "Ce qu’AngelCare apprend devient une mémoire contrôlée.", description: "Une leçon reste un brouillon jusqu’à son examen humain, ses limites et son éventuelle conversion en doctrine." },
  }
  const current = titles[mode]
  return <main className={styles.canvas} data-content-experience-bulk7={mode}>
    <PageStatus loading={state.loading} error={state.error} migrationReady={true} refresh={state.refresh}/>
    <section className={styles.crown}>
      <div className={styles.crownIdentity}><div className={styles.brandMark}><BrainCircuit/></div><div><span>ANGELCARE · SANILA MARKET OS · {current.eyebrow}</span><h1>{current.title}</h1><p>{current.description}</p></div></div>
      <div className={styles.crownRail}>
        <article><small>PUBLICATIONS VÉRIFIÉES</small><strong>{state.model.metrics.verifiedPublications}</strong><p>Vérité externe constituée dans Bulk 6.</p></article>
        <article><small>OBSERVATION À OUVRIR</small><strong>{state.model.metrics.awaitingObservation}</strong><p>Aucun chiffre n’est généré pour combler le vide.</p></article>
        <article><small>ATTRIBUTIONS EXAMINÉES</small><strong>{state.model.metrics.attributed}</strong><p>Directes, assistées, corrélées ou non établies.</p></article>
        <article><small>LEÇONS ACCEPTÉES</small><strong>{state.model.metrics.acceptedLessons}</strong><p>Mémoire humaine prête à nourrir le prochain cycle.</p></article>
      </div>
    </section>
    <nav className={styles.contextRibbon} aria-label="Bulk 7 — impact, attribution, optimisation et apprentissage">
      <Link aria-current={mode === "performance" ? "page" : undefined} href={`${BASE}/performance`}><BarChart3/><span><strong>Impact Observatory</strong><small>Mesure & suffisance</small></span></Link>
      <Link aria-current={mode === "attribution" ? "page" : undefined} href={`${BASE}/attribution`}><Route/><span><strong>Attribution Chamber</strong><small>Parcours & preuve</small></span></Link>
      <Link aria-current={mode === "optimization" ? "page" : undefined} href={`${BASE}/optimization`}><Wrench/><span><strong>Optimization Foundry</strong><small>Décision & adaptation</small></span></Link>
      <Link aria-current={mode === "learning" ? "page" : undefined} href={`${BASE}/learning`}><BookOpenCheck/><span><strong>Learning Chamber</strong><small>Leçon & doctrine</small></span></Link>
      <Link href={`${BASE}/directory`}><Map/><span><strong>Content Atlas</strong><small>Mémoire & réemploi</small></span></Link>
    </nav>
    <section className={styles.metricRunway} aria-label="État institutionnel de l’impact">
      <MetricReadout icon={BadgeCheck} label="VÉRIFIÉ" value={state.model.metrics.verifiedPublications} detail="Publication confirmée et vérifiée." tone="success"/>
      <MetricReadout icon={Eye} label="OBSERVÉ" value={state.model.metrics.observed} detail="Fenêtre et provenance enregistrées." tone="info"/>
      <MetricReadout icon={Scale} label="CONCLU" value={state.model.metrics.conclusions} detail="Suffisance décidée humainement." tone="authority"/>
      <MetricReadout icon={GitBranch} label="ATTRIBUÉ" value={state.model.metrics.attributed} detail="Méthode et limites visibles." tone="authority"/>
      <MetricReadout icon={Wrench} label="OPTIMISÉ" value={state.model.metrics.optimized} detail="Prochain mouvement gouverné." tone="warning"/>
      <MetricReadout icon={Lightbulb} label="APPRENTISSAGE" value={state.model.metrics.acceptedLessons} detail="Leçons acceptées ou limitées." tone="success"/>
      <MetricReadout icon={BriefcaseBusiness} label="IMPACT FINANCIER" value={formatDh(state.model.metrics.totalRevenueDh)} detail="Uniquement direct ou assisté, jamais estimé." tone={state.model.metrics.totalRevenueDh === null ? "neutral" : "success"}/>
    </section>
    {state.notice ? <div className={styles.notice} aria-live="polite">{state.notice}</div> : null}
    {children}
  </main>
}

function CaseQueue({ state, title, filter }: { state: WorkspaceState; title: string; filter?: (item: ImpactCase) => boolean }) {
  const items = filter ? state.cases.filter(filter) : state.cases
  return <section className={styles.observationIntake}>
    <WorkspaceTitle icon={ListChecks} eyebrow="CASE INTAKE" title={title} description="Chaque dossier conserve son package, sa version, son canal et son état de vérité." action={<button type="button" onClick={() => void state.refresh()}><RefreshCcw/> Actualiser</button>}/>
    <div className={styles.caseList}>{items.map((item, index) => <button type="button" key={item.id} className={styles.caseButton} data-selected={state.selected?.id === item.id} onClick={() => state.select(item.id)}>
      <span>{String(index + 1).padStart(2,"0")}</span><div><strong>{item.dossier?.title || "Dossier non exposé"}</strong><small>{item.dossier?.content_code || item.package.id} · {item.package.channel}</small><em>{item.package.external_reference || "Référence externe absente"}</em></div><TonePill tone={caseTone(item)}>{readable(item.measurementState)}</TonePill>
    </button>)}</div>
    {!items.length ? <div className={styles.empty}><CircleAlert/><h3>Aucun dossier dans cette constitution</h3><p>Bulk 7 n’invente aucun record de démonstration. Les publications vérifiées apparaîtront ici après leur persistance réelle.</p></div> : null}
  </section>
}

const metricDefinitions: Array<{ key: ImpactMetricKey; label: string; icon: typeof Eye }> = [
  { key: "impressions", label: "Impressions", icon: Globe2 }, { key: "views", label: "Vues", icon: Eye },
  { key: "engagements", label: "Engagements", icon: Activity }, { key: "clicks", label: "Clics", icon: MousePointerClick },
  { key: "downloads", label: "Téléchargements", icon: FileCheck2 }, { key: "leads", label: "Leads", icon: UsersRound },
  { key: "conversions", label: "Conversions", icon: Target }, { key: "revenueDh", label: "Revenu relié", icon: BriefcaseBusiness },
]

export function Bulk7ImpactObservatory() {
  const state = useBulk7Workspace(); const selected = state.selected
  const [formMode, setFormMode] = React.useState<"observation"|"conclusion">("observation")
  const [observation, setObservation] = React.useState({ observedFrom:"", observedTo:"", provenanceType:"manual", sourceLabel:"", sourceReference:"", limitations:"", impressions:"", views:"", engagements:"", clicks:"", downloads:"", leads:"", conversions:"", revenueDh:"" })
  const [conclusion, setConclusion] = React.useState({ conclusion:"sufficient", summary:"", limitations:"", nextReviewAt:"" })
  async function submitObservation() { if (!selected) return; const metrics = Object.fromEntries(metricDefinitions.map(({key}) => [key, Number(observation[key] || 0)])); const ok = await state.execute("performance_record_observation", { packageId:selected.id, ...observation, metrics }); if (ok) setObservation({...observation, sourceLabel:"", sourceReference:"", limitations:"", impressions:"", views:"", engagements:"", clicks:"", downloads:"", leads:"", conversions:"", revenueDh:""}) }
  async function submitConclusion() { if (!selected) return; const ok = await state.execute("performance_record_conclusion", { packageId:selected.id, ...conclusion }); if (ok) setConclusion({...conclusion, summary:"", limitations:""}) }
  return <Frame mode="performance" state={state}><section className={styles.observatory}>
    <CaseQueue state={state} title="Publications sous observation"/>
    <section className={styles.outcomeHorizon}>
      <WorkspaceTitle icon={Orbit} eyebrow="OUTCOME HORIZON" title={selected?.dossier?.title || "Sélectionnez une publication vérifiée"} description="La rivière d’impact ne remplit aucune étape absente. Chaque nœud affiche uniquement ce qui est persisté." action={selected ? <TonePill tone={caseTone(selected)}>{readable(selected.measurementState)}</TonePill> : null}/>
      {selected ? <><div className={styles.horizonCanvas}><div className={styles.outcomeRiver}>
        <div className={styles.outcomeNode}><PackageCheck/><small>PUBLICATION</small><strong>{selected.package.channel}</strong><p>{formatImpactDate(selected.package.published_at,true)}</p></div>
        <div className={styles.outcomeNode}><BadgeCheck/><small>VÉRIFICATION</small><strong>{selected.verified ? "Confirmée" : "Non constituée"}</strong><p>{text(selected.verification?.reason,"Aucune conclusion")}</p></div>
        <div className={styles.outcomeNode}><Eye/><small>OBSERVATION</small><strong>{selected.observation ? readable(selected.observation.provenanceType) : "À ouvrir"}</strong><p>{selected.observation ? `${formatImpactDate(selected.observation.observedFrom)} → ${formatImpactDate(selected.observation.observedTo)}` : "Fenêtre absente"}</p></div>
        <div className={styles.outcomeNode}><DatabaseZap/><small>MESURE</small><strong>{selected.observation ? Object.values(metricRecord(selected.observation)).filter((v)=>Number(v)>0).length : 0} métrique(s)</strong><p>Valeurs réellement déclarées.</p></div>
        <div className={styles.outcomeNode}><Scale/><small>CONCLUSION</small><strong>{readable(selected.performanceConclusion?.conclusion)}</strong><p>{text(selected.performanceConclusion?.summary,"Conclusion humaine absente")}</p></div>
        <div className={styles.outcomeNode}><ArrowRight/><small>PROCHAIN GATE</small><strong>{selected.dominantAction.label}</strong><p>{selected.dominantAction.detail}</p></div>
      </div><div className={styles.observationFoot}>{metricDefinitions.slice(0,6).map(({key,label}) => <div key={key}><small>{label}</small><strong>{selected.observation ? new Intl.NumberFormat("fr-FR").format(metricValue(selected.observation,key)) : "Non mesuré"}</strong></div>)}</div></div>
      <DataSeal source={readable(selected.observation?.provenanceType)} reference={text(selected.observation?.sourceReference)} limitations={text(selected.observation?.limitations)}/>
      <div className={styles.formDock}><div className={styles.formActions}><button type="button" className={formMode==="observation"?undefined:styles.secondary} onClick={()=>setFormMode("observation")}><Eye/> Observation</button><button type="button" className={formMode==="conclusion"?undefined:styles.secondary} onClick={()=>setFormMode("conclusion")}><Scale/> Conclusion</button></div>
      {formMode==="observation" ? <><div className={styles.formGrid}><label><span>Début de fenêtre</span><input type="date" value={observation.observedFrom} onChange={e=>setObservation({...observation,observedFrom:e.target.value})}/></label><label><span>Fin de fenêtre</span><input type="date" value={observation.observedTo} onChange={e=>setObservation({...observation,observedTo:e.target.value})}/></label><label><span>Provenance</span><select value={observation.provenanceType} onChange={e=>setObservation({...observation,provenanceType:e.target.value})}><option value="provider">Provider réel</option><option value="internal_event">Événement interne</option><option value="crm_linked">CRM lié</option><option value="imported">Import documenté</option><option value="manual">Déclaration manuelle</option><option value="customer_declared">Source client déclarée</option></select></label><label><span>Source</span><input value={observation.sourceLabel} onChange={e=>setObservation({...observation,sourceLabel:e.target.value})} placeholder="Nom du rapport ou système"/></label><label className={styles.wide}><span>Référence de preuve</span><input value={observation.sourceReference} onChange={e=>setObservation({...observation,sourceReference:e.target.value})} placeholder="URL, identifiant CRM, fichier ou registre"/></label>{metricDefinitions.map(({key,label})=><label key={key}><span>{label}{key==="revenueDh"?" (Dh)":""}</span><input type="number" min="0" value={observation[key]} onChange={e=>setObservation({...observation,[key]:e.target.value})}/></label>)}<label className={styles.wide}><span>Limites obligatoires pour une saisie manuelle</span><textarea rows={3} value={observation.limitations} onChange={e=>setObservation({...observation,limitations:e.target.value})}/></label></div><div className={styles.formActions}><button disabled={state.busy||!selected?.verified||!observation.observedFrom||!observation.observedTo||!observation.sourceLabel} onClick={()=>void submitObservation()}>{state.busy?<LoaderCircle/>:<DatabaseZap/>}Enregistrer la mesure</button></div></> : <><div className={styles.formGrid}><label><span>Conclusion</span><select value={conclusion.conclusion} onChange={e=>setConclusion({...conclusion,conclusion:e.target.value})}><option value="sufficient">Mesure suffisante</option><option value="extend_observation">Prolonger l’observation</option><option value="insufficient">Mesure insuffisante</option><option value="disputed">Conclusion contestée</option></select></label><label><span>Prochaine revue</span><input type="date" value={conclusion.nextReviewAt} onChange={e=>setConclusion({...conclusion,nextReviewAt:e.target.value})}/></label><label className={styles.wide}><span>Conclusion humaine</span><textarea rows={4} value={conclusion.summary} onChange={e=>setConclusion({...conclusion,summary:e.target.value})}/></label><label className={styles.wide}><span>Limites et réserves</span><textarea rows={3} value={conclusion.limitations} onChange={e=>setConclusion({...conclusion,limitations:e.target.value})}/></label></div><div className={styles.formActions}><button disabled={state.busy||!selected?.observation||!conclusion.summary} onClick={()=>void submitConclusion()}>{state.busy?<LoaderCircle/>:<Scale/>}Rendre la conclusion</button></div></>}</div></> : <div className={styles.empty}><Eye/><h3>Aucune publication sélectionnée</h3><p>La surface reste vide plutôt que de montrer des résultats de démonstration.</p></div>}
    </section>
    <aside className={styles.confidenceRail}><WorkspaceTitle icon={ShieldCheck} eyebrow="MEASUREMENT CONFIDENCE" title="Ce que nous savons réellement" description="La confiance vient de la chaîne de preuve, pas d’un score IA."/><div className={styles.confidenceSteps}>{[
      ["01","Publication vérifiée",selected?.verified?"Vérité externe présente":"Gate Bulk 6 manquant"],
      ["02","Fenêtre documentée",selected?.observation?"Période persistée":"Observation absente"],
      ["03","Provenance inspectable",text(selected?.observation?.sourceLabel,"Source absente")],
      ["04","Limites déclarées",text(selected?.observation?.limitations,"Aucune limite documentée")],
      ["05","Conclusion humaine",readable(selected?.performanceConclusion?.conclusion)],
    ].map(([n,t,d])=><article key={n}><span>{n}</span><div><strong>{t}</strong><p>{d}</p></div></article>)}</div>{selected?<DominantAction {...selected.dominantAction}/>:null}<TruthBoundary title="Aucun ROI calculé automatiquement" detail="Bulk 7 affiche uniquement un revenu relié par une conclusion directe ou assistée, avec méthode et limites." tone="authority"/></aside>
  </section></Frame>
}

export function Bulk7AttributionChamber() {
  const state=useBulk7Workspace(); const selected=state.selected
  const [form,setForm]=React.useState({method:"tracked_link",conclusion:"direct",outcomeLabel:"",outcomeReference:"",attributedRevenueDh:"",evidenceBasis:"",competingExplanations:"",limitations:""})
  async function submit(){if(!selected)return;const ok=await state.execute("attribution_record_conclusion",{packageId:selected.id,...form,attributedRevenueDh:Number(form.attributedRevenueDh||0)});if(ok)setForm({...form,outcomeLabel:"",outcomeReference:"",attributedRevenueDh:"",evidenceBasis:"",competingExplanations:"",limitations:""})}
  return <Frame mode="attribution" state={state}><section className={styles.attributionGrid}><CaseQueue state={state} title="Dossiers admissibles à l’attribution" filter={item=>Boolean(item.performanceConclusion)}/><div className={styles.journeyEvidence}>{selected?<><WorkspaceTitle icon={Route} eyebrow="ATTRIBUTION JOURNEY" title={selected.dossier?.title||"Dossier"} description="Les touchpoints montrent ce qui est présent, absent ou seulement déclaré." action={<TonePill tone={selected.attribution?"authority":"warning"}>{readable(selected.attribution?.conclusion)}</TonePill>}/><div className={styles.courtHeader}><div className={styles.caseMandate}><small>ISSUE À EXAMINER</small><h3>{text(selected.attribution?.outcomeLabel,"Aucune issue encore constituée")}</h3><p>{text(selected.attribution?.evidenceBasis,"L’attribution doit exposer sa méthode, sa preuve, les explications concurrentes et ses limites.")}</p></div><div className={styles.authorityBoundary}><Scale/><small>FRONTIÈRE D’AUTORITÉ</small><strong>Conclusion humaine uniquement</strong><p>Aucun pourcentage de confiance opaque et aucune causalité inventée.</p></div></div><div className={styles.journeyLine}>{([
      [PackageCheck,"Publication vérifiée",selected.package.external_reference||"Référence absente"],
      [MousePointerClick,"Interaction",metricValue(selected.observation,"clicks") ? `${metricValue(selected.observation,"clicks")} clic(s)` : "Non observée"],
      [UsersRound,"Lead",metricValue(selected.observation,"leads") ? `${metricValue(selected.observation,"leads")} lead(s)` : "Non relié"],
      [Target,"Conversion",metricValue(selected.observation,"conversions") ? `${metricValue(selected.observation,"conversions")} conversion(s)` : "Non reliée"],
      [BriefcaseBusiness,"Issue métier",text(selected.attribution?.outcomeReference,"Référence à constituer")],
    ] satisfies Array<[LucideIcon, string, string]>).map(([Icon,label,detail])=><article className={styles.touchpoint} key={label}><span><Icon/></span><small>TOUCHPOINT</small><strong>{label}</strong><p>{detail}</p></article>)}</div><div className={styles.competingExplanations}><article><h4>Base probante</h4><p>{text(selected.attribution?.evidenceBasis,"Aucune preuve d’attribution enregistrée.")}</p></article><article><h4>Explications concurrentes</h4><p>{text(selected.attribution?.competingExplanations,"Non documentées. Leur absence ne signifie pas qu’elles n’existent pas.")}</p></article></div><div className={styles.formDock}><div className={styles.formGrid}><label><span>Méthode</span><select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}><option value="tracked_link">Lien suivi</option><option value="crm_link">CRM lié</option><option value="customer_declaration">Déclaration client</option><option value="assisted_journey">Parcours assisté</option><option value="manual_evidence">Preuve manuelle</option><option value="correlation_only">Corrélation uniquement</option></select></label><label><span>Conclusion</span><select value={form.conclusion} onChange={e=>setForm({...form,conclusion:e.target.value})}><option value="direct">Directe</option><option value="assisted">Assistée</option><option value="correlated">Corrélée</option><option value="unestablished">Non établie</option><option value="disputed">Contestée</option></select></label><label><span>Issue observée</span><input value={form.outcomeLabel} onChange={e=>setForm({...form,outcomeLabel:e.target.value})}/></label><label><span>Référence issue / CRM</span><input value={form.outcomeReference} onChange={e=>setForm({...form,outcomeReference:e.target.value})}/></label><label><span>Revenu relié (Dh)</span><input type="number" min="0" value={form.attributedRevenueDh} onChange={e=>setForm({...form,attributedRevenueDh:e.target.value})}/></label><label className={styles.wide}><span>Base probante</span><textarea rows={3} value={form.evidenceBasis} onChange={e=>setForm({...form,evidenceBasis:e.target.value})}/></label><label className={styles.wide}><span>Explications concurrentes</span><textarea rows={3} value={form.competingExplanations} onChange={e=>setForm({...form,competingExplanations:e.target.value})}/></label><label className={styles.wide}><span>Limites obligatoires</span><textarea rows={3} value={form.limitations} onChange={e=>setForm({...form,limitations:e.target.value})}/></label></div><div className={styles.formActions}><button disabled={state.busy||text(selected.performanceConclusion?.conclusion)!=="sufficient"||!form.outcomeLabel||!form.evidenceBasis||!form.limitations} onClick={()=>void submit()}>{state.busy?<LoaderCircle/>:<SearchCheck/>}Rendre la conclusion d’attribution</button></div></div></>:<div className={styles.empty}><Route/><h3>Aucun dossier d’attribution</h3><p>Une mesure suffisante doit être conclue avant cette chambre.</p></div>}</div></section></Frame>
}

const optimizationOptions=[
  ["continue","Continuer",CheckCircle2],["extend_observation","Prolonger l’observation",Eye],["improve_copy","Améliorer le copy",Sparkles],["replace_cta","Remplacer le CTA",MousePointerClick],["change_channel","Changer le canal",Globe2],["change_timing","Changer la fenêtre",CalendarRange],["change_audience","Changer l’audience",UsersRound],["localize","Localiser",Map],["adapt_format","Adapter le format",Layers3],["new_variant","Créer une variante",GitBranch],["repurpose","Réemployer",Orbit],["rerun","Relancer",RefreshCcw],["return_strategy","Retour stratégie",Target],["return_brief","Retour brief",FileCheck2],["create_mission","Créer une mission",Workflow],["retire","Retirer",CircleAlert],
] as const

export function Bulk7OptimizationFoundry(){
  const state=useBulk7Workspace();const selected=state.selected
  const [form,setForm]=React.useState({decision:"continue",rationale:"",affectedScope:"",owner:"",dueAt:"",newVersionRequired:false,revalidationRequired:false})
  async function submit(){if(!selected)return;const ok=await state.execute("optimization_record_decision",{packageId:selected.id,...form});if(ok)setForm({...form,rationale:"",affectedScope:"",owner:"",dueAt:""})}
  return <Frame mode="optimization" state={state}><section className={styles.optimizationLayout}><CaseQueue state={state} title="Résultats prêts à décider" filter={item=>Boolean(item.performanceConclusion)}/><section className={styles.optimizationFoundry}>{selected?<><WorkspaceTitle icon={Wrench} eyebrow="DECISION & ADAPTATION FOUNDRY" title={selected.dossier?.title||"Dossier"} description="Le publié reste immuable. Toute amélioration produit un mouvement, une version ou un retour de gate explicite." action={<TonePill tone={selected.optimization?"authority":"warning"}>{readable(selected.optimization?.decision)}</TonePill>}/><div className={styles.foundryLine}>{([
    [PackageCheck,"Mandat publié",selected.package.channel,selected.package.external_reference||"Référence absente"],
    [BarChart3,"Résultat mesuré",readable(selected.performanceConclusion?.conclusion),text(selected.performanceConclusion?.summary,"Conclusion absente")],
    [GitBranch,"Attribution",readable(selected.attribution?.conclusion),text(selected.attribution?.evidenceBasis,"Attribution non constituée")],
    [Lightbulb,"Décision",readable(selected.optimization?.decision),text(selected.optimization?.rationale,"Décision à rendre")],
    [Workflow,"Conséquence",selected.optimization?.newVersionRequired?"Nouvelle version":"Version inchangée",selected.optimization?.revalidationRequired?"Revalidation requise":"Revalidation non demandée"],
  ] satisfies Array<[LucideIcon, string, string, string]>).map(([Icon,label,value,detail])=><article className={styles.foundryNode} key={label}><span><Icon/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div><em><ArrowRight/></em></article>)}</div><div className={styles.decisionConsequence}><strong>Conséquence avant confirmation</strong><p>{form.newVersionRequired?"Une nouvelle version doit être créée; la version publiée reste historique.":"La décision ne crée pas automatiquement une nouvelle version."} {form.revalidationRequired?"Le futur output devra repasser par la Validation Chamber.":"Aucune revalidation n’est affirmée sans sélection explicite."}</p></div><div className={styles.formDock}><div className={styles.formGrid}><label><span>Décision</span><select value={form.decision} onChange={e=>setForm({...form,decision:e.target.value})}>{optimizationOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label><span>Responsable</span><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}/></label><label><span>Échéance</span><input type="date" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/></label><label className={styles.wide}><span>Périmètre affecté</span><input value={form.affectedScope} onChange={e=>setForm({...form,affectedScope:e.target.value})} placeholder="Copy, CTA, canal, audience, variante, campagne…"/></label><label className={styles.wide}><span>Raison probante</span><textarea rows={4} value={form.rationale} onChange={e=>setForm({...form,rationale:e.target.value})}/></label><label><span><input type="checkbox" checked={form.newVersionRequired} onChange={e=>setForm({...form,newVersionRequired:e.target.checked})}/> Nouvelle version requise</span></label><label><span><input type="checkbox" checked={form.revalidationRequired} onChange={e=>setForm({...form,revalidationRequired:e.target.checked})}/> Revalidation requise</span></label></div><div className={styles.formActions}><button disabled={state.busy||!form.rationale||!form.affectedScope||!form.owner} onClick={()=>void submit()}>{state.busy?<LoaderCircle/>:<ShieldCheck/>}Enregistrer la décision</button></div></div></>:<div className={styles.empty}><Wrench/><h3>Aucun dossier d’optimisation</h3><p>Une conclusion de performance doit exister avant toute décision.</p></div>}</section><aside><WorkspaceTitle icon={Sparkles} eyebrow="DECISION CATALOGUE" title="Mouvements autorisés" description="Choisissez un mouvement; aucun système n’optimise automatiquement."/><div className={styles.optionMatrix}>{optimizationOptions.map(([value,label,Icon])=><button type="button" key={value} onClick={()=>setForm({...form,decision:value})}><span><Icon/></span><div><strong>{label}</strong><small>{form.decision===value?"Sélectionné":"Décision disponible"}</small></div></button>)}</div></aside></section></Frame>
}

export function Bulk7LearningChamber(){
  const state=useBulk7Workspace();const selected=state.selected
  const [draft,setDraft]=React.useState({title:"",lesson:"",applicability:"",limitations:"",doctrineRecommendation:""})
  const [govern,setGovern]=React.useState({decision:"accepted_with_limitations",reason:""})
  async function create(){if(!selected)return;const ok=await state.execute("learning_record_lesson",{packageId:selected.id,...draft});if(ok)setDraft({title:"",lesson:"",applicability:"",limitations:"",doctrineRecommendation:""})}
  async function decide(){if(!selected)return;const ok=await state.execute("learning_govern_lesson",{packageId:selected.id,...govern});if(ok)setGovern({...govern,reason:""})}
  return <Frame mode="learning" state={state}><section className={styles.learningLayout}><CaseQueue state={state} title="Cas prêts à apprendre" filter={item=>Boolean(item.optimization)}/><section className={styles.learningChamber}>{selected?<><WorkspaceTitle icon={BookOpenCheck} eyebrow="DOCTRINE CONSTITUTION" title={selected.lesson?text(selected.lesson.title):selected.dossier?.title||"Dossier"} description="Leçon, applicabilité, limites et recommandation restent séparées de la décision d’autorité." action={<TonePill tone={selected.lessonGovernance?"success":"warning"}>{readable(selected.lessonGovernance?.decision||selected.lesson?.status)}</TonePill>}/><div className={styles.lessonConstitution}><div className={styles.lessonSeal}><BookOpenCheck/><small>ANGELCARE INSTITUTIONAL LESSON</small><strong>{text(selected.lesson?.lessonId,"Brouillon non constitué")}</strong><p>{text(selected.lessonGovernance?.reason,"Une leçon n’est ni une doctrine ni une vérité universelle avant gouvernance.")}</p></div><div className={styles.lessonBody}><article><small>CE QUI S’EST PASSÉ</small><strong>{text(selected.lesson?.title,"Leçon à formaliser")}</strong><p>{text(selected.lesson?.lesson,"Aucune synthèse institutionnelle enregistrée.")}</p></article><article><small>APPLICABILITÉ</small><strong>Périmètre de réemploi</strong><p>{text(selected.lesson?.applicability,"Non défini")}</p></article><article><small>LIMITES</small><strong>Ce que la leçon ne prouve pas</strong><p>{text(selected.lesson?.limitations,"Limites non constituées")}</p></article><article><small>DOCTRINE PROPOSÉE</small><strong>Retour au système</strong><p>{text(selected.lesson?.doctrineRecommendation,"Aucune recommandation de doctrine")}</p></article></div></div><div className={styles.doctrineBridge}><article><small>ORIGINE</small><strong>{selected.dossier?.content_code||selected.id}</strong><p>Publication, observation, attribution et optimisation restent inspectables.</p></article><ArrowRight/><article><small>DESTINATION</small><strong>{selected.lessonGovernance?"Mémoire acceptée":"Revue d’autorité"}</strong><p>Le futur AI Director ne reçoit que les leçons gouvernées, avec leurs limites.</p></article></div><div className={styles.formDock}><div className={styles.formGrid}><label><span>Titre de la leçon</span><input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label className={styles.wide}><span>Leçon</span><textarea rows={4} value={draft.lesson} onChange={e=>setDraft({...draft,lesson:e.target.value})}/></label><label className={styles.wide}><span>Applicabilité</span><textarea rows={3} value={draft.applicability} onChange={e=>setDraft({...draft,applicability:e.target.value})}/></label><label className={styles.wide}><span>Limites obligatoires</span><textarea rows={3} value={draft.limitations} onChange={e=>setDraft({...draft,limitations:e.target.value})}/></label><label className={styles.wide}><span>Recommandation de doctrine</span><textarea rows={3} value={draft.doctrineRecommendation} onChange={e=>setDraft({...draft,doctrineRecommendation:e.target.value})}/></label></div><div className={styles.formActions}><button disabled={state.busy||!selected.optimization||!draft.title||!draft.lesson||!draft.applicability||!draft.limitations} onClick={()=>void create()}>{state.busy?<LoaderCircle/>:<Lightbulb/>}Constituer le brouillon</button></div></div>{selected.lesson?<div className={styles.formDock}><div className={styles.formGrid}><label><span>Décision d’autorité</span><select value={govern.decision} onChange={e=>setGovern({...govern,decision:e.target.value})}><option value="accepted">Accepter</option><option value="accepted_with_limitations">Accepter avec limites</option><option value="retired">Retirer</option><option value="superseded">Superséder</option></select></label><label className={styles.wide}><span>Raison de décision</span><textarea rows={3} value={govern.reason} onChange={e=>setGovern({...govern,reason:e.target.value})}/></label></div><TruthBoundary title="Conséquence de clôture" detail="Une leçon acceptée clôt le dossier après persistance; l’historique de publication et les versions restent immuables." tone="authority"/><div className={styles.formActions}><button disabled={state.busy||!govern.reason} onClick={()=>void decide()}>{state.busy?<LoaderCircle/>:<UserRoundCheck/>}Rendre la décision institutionnelle</button></div></div>:null}</>:<div className={styles.empty}><BookOpenCheck/><h3>Aucun cas prêt à apprendre</h3><p>Une décision d’optimisation doit précéder la constitution de la leçon.</p></div>}</section></section></Frame>
}

export function AtlasImpactLayer({ snapshot }: { snapshot: ReturnType<typeof useHeadquartersSnapshot>["snapshot"] }) {
  const model=React.useMemo(()=>buildImpactModel(snapshot),[snapshot])
  return <section className={styles.atlasImpact}><WorkspaceTitle icon={Map} eyebrow="OUTCOME & LEARNING OVERLAY" title="Le patrimoine relié à son impact et à ce qu’AngelCare en a appris" description="L’Atlas ne fabrique aucune performance. Il superpose uniquement les événements persistés dans la lignée de publication." action={<Link href={`${BASE}/performance`}>Ouvrir Impact Observatory <ArrowRight/></Link>}/><div className={styles.atlasImpactMap}>{([
    [PackageCheck,"Publications vérifiées",model.metrics.verifiedPublications,"Vérité externe avant mesure"],
    [Eye,"Observations",model.metrics.observed,"Fenêtres et provenances"],
    [Scale,"Conclusions",model.metrics.conclusions,"Suffisance humaine"],
    [GitBranch,"Attributions",model.metrics.attributed,"Méthodes et limites"],
    [Wrench,"Décisions",model.metrics.optimized,"Mouvements gouvernés"],
    [BookOpenCheck,"Leçons acceptées",model.metrics.acceptedLessons,"Mémoire institutionnelle"],
  ] satisfies Array<[LucideIcon, string, number, string]>).map(([Icon,label,value,detail])=><article key={label}><span><Icon/></span><small>LIGNÉE BULK 7</small><strong>{value} · {label}</strong><p>{detail}</p></article>)}</div>{model.metrics.verifiedPublications===0?<TruthBoundary title="Aucune publication vérifiée" detail="L’Atlas n’affichera aucune donnée de performance tant que Bulk 6 n’a pas constitué la vérité externe." tone="warning"/>:null}</section>
}
