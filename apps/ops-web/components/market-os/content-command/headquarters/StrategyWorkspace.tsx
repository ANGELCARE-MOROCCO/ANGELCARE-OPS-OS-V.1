"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Boxes, BrainCircuit, FileStack, GitBranch, Lightbulb, Network, Plus, ShieldCheck, Target, Users, Waypoints } from "lucide-react"
import { Badge, Empty, Field, Modal, PageStatus, Progress, SectionHeader } from "./primitives"
import { headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

const framework = [
  ["Évidence", "Sources vérifiées et signaux qualifiés", Network],
  ["Problème", "Tension marché ou manque de couverture", Lightbulb],
  ["Position", "Perception recherchée pour ANGELCARE", Target],
  ["Architecture", "Piliers, canaux, preuves et offres", GitBranch],
  ["Plan", "Actions, livrables, capacité et mesures", Waypoints],
  ["Missions", "Owners, tâches, preuves et validations", Users],
] as const

export default function StrategyWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selectedId, setSelectedId] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [compileOpen, setCompileOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const qualifiedSignals = snapshot?.signals.filter((signal) => signal.status === "qualified") || []
  const [form, setForm] = React.useState({ title: "", problemStatement: "", businessObjective: "", contentObjective: "", signalIds: [] as string[], services: "", audiences: "", cities: "" })
  const [planForm, setPlanForm] = React.useState({ title: "", objective: "", capacityHours: "40", deliverables: "", requiredRoles: "Content Strategist, Content Officer, Designer, Reviewer" })
  const selected = snapshot?.strategies.find((strategy) => strategy.id === selectedId) || snapshot?.strategies[0] || null
  const selectedPlans = snapshot?.actionPlans.filter((plan) => plan.strategy_id === selected?.id) || []
  const selectedMissions = snapshot?.missions.filter((mission) => mission.strategy_id === selected?.id) || []

  async function createStrategy() {
    setBusy("create")
    try {
      const result = await headquartersAction("create_strategy", {
        ...form,
        services: form.services.split(",").map((value) => value.trim()).filter(Boolean),
        audiences: form.audiences.split(",").map((value) => value.trim()).filter(Boolean),
        cities: form.cities.split(",").map((value) => value.trim()).filter(Boolean),
      }) as { id?: string }
      setCreateOpen(false)
      setNotice("Stratégie créée avec provenance des signaux.")
      await refresh()
      if (result?.id) setSelectedId(result.id)
    } catch (nextError) { setNotice(nextError instanceof Error ? nextError.message : "STRATEGY_CREATE_FAILED") }
    finally { setBusy("") }
  }

  async function compilePlan() {
    if (!selected) return
    setBusy("compile")
    try {
      await headquartersAction("compile_strategy", {
        strategyId: selected.id,
        title: planForm.title || `Plan d’action · ${selected.title}`,
        objective: planForm.objective || selected.content_objective,
        capacityHours: Number(planForm.capacityHours || 0),
        deliverables: planForm.deliverables.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, status: "planned" })),
        requiredRoles: planForm.requiredRoles.split(",").map((value) => value.trim()).filter(Boolean),
      })
      setCompileOpen(false)
      setNotice("Plan d’action compilé. Il reste soumis à l’autorité humaine avant libération des missions.")
      await refresh()
    } catch (nextError) { setNotice(nextError instanceof Error ? nextError.message : "STRATEGY_COMPILE_FAILED") }
    finally { setBusy("") }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.strategyHero}>
      <div><span className={styles.eyebrow}><Target/> FABRIQUE STRATÉGIQUE</span><h1>Transformer une preuve de marché en direction éditoriale, plan d’action et missions exécutables.</h1><p>Aucun signal ne devient automatiquement une tâche. La fabrique impose un problème, une position, une architecture, une mesure et une autorité.</p></div>
      <button onClick={() => setCreateOpen(true)}><Plus/> Nouvelle stratégie</button>
    </section>
    {notice ? <div className={styles.inlineNotice}>{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.strategyFramework}>
      {framework.map(([label, description, Icon], index) => <article key={label}><span>0{index + 1}</span><Icon/><div><strong>{label}</strong><p>{description}</p></div>{index < framework.length - 1 ? <ArrowRight/> : null}</article>)}
    </section>

    <section className={styles.strategyWorkspaceGrid}>
      <aside className={styles.strategyPortfolio}>
        <SectionHeader eyebrow="PORTEFEUILLE" title={`${snapshot?.strategies.length || 0} stratégies`} description="Priorisées selon leur statut, leur mandat et leurs plans rattachés."/>
        <div>
          {(snapshot?.strategies || []).map((strategy) => <button key={strategy.id} onClick={() => setSelectedId(strategy.id)} className={selected?.id === strategy.id ? styles.strategyCardActive : styles.strategyCard}>
            <header><span>{strategy.code}</span><Badge tone={tone(strategy.status)}>{statusLabel(strategy.status)}</Badge></header>
            <h3>{strategy.title}</h3><p>{strategy.content_objective}</p>
            <footer><span><Network/>{strategy.signal_ids.length} signaux</span><span><Boxes/>{snapshot?.actionPlans.filter((plan) => plan.strategy_id === strategy.id).length || 0} plans</span><span><Users/>{snapshot?.missions.filter((mission) => mission.strategy_id === strategy.id).length || 0} missions</span></footer>
          </button>)}
          {!snapshot?.strategies.length ? <Empty title="Aucune stratégie" detail="Qualifiez un signal puis créez la première stratégie avec son objectif business et son objectif de contenu."/> : null}
        </div>
      </aside>

      <article className={styles.strategyCanvas}>
        {selected ? <>
          <header className={styles.strategyCanvasHeader}><div><span>{selected.code}</span><h2>{selected.title}</h2><p>{selected.problem_statement}</p></div><div><Badge tone={tone(selected.status)}>{statusLabel(selected.status)}</Badge><button onClick={() => { setPlanForm((value) => ({ ...value, title: `Plan d’action · ${selected.title}`, objective: selected.content_objective })); setCompileOpen(true) }}><BrainCircuit/> Compiler le plan</button></div></header>
          <section className={styles.strategyNorthStar}>
            <article><small>OBJECTIF BUSINESS</small><strong>{selected.business_objective}</strong></article>
            <article><small>OBJECTIF CONTENT</small><strong>{selected.content_objective}</strong></article>
            <article><small>PERCEPTION RECHERCHÉE</small><strong>{selected.desired_perception || "À définir avant approbation"}</strong></article>
          </section>
          <section className={styles.strategyMap}>
            <div className={styles.strategyEvidence}><h3><Network/> Évidence d’origine</h3>{selected.signal_ids.map((id) => { const signal = snapshot?.signals.find((item) => item.id === id); return signal ? <article key={id}><Badge tone={tone(signal.status)}>{signal.code}</Badge><strong>{signal.title}</strong><p>{signal.source_label} · confiance {signal.confidence}%</p></article> : null })}{!selected.signal_ids.length ? <p>Aucun signal lié. La stratégie doit documenter sa source d’autorité.</p> : null}</div>
            <div className={styles.strategySpine}><span/><strong>POSITION ANGELCARE</strong><p>{selected.desired_perception || "Positionnement à consolider dans la revue stratégique."}</p><span/></div>
            <div className={styles.strategyArchitecture}><h3><GitBranch/> Architecture de réponse</h3><div><article><small>Services</small>{selected.services.map((value) => <span key={value}>{value}</span>)}</article><article><small>Audiences</small>{selected.audiences.map((value) => <span key={value}>{value}</span>)}</article><article><small>Villes</small>{selected.cities.map((value) => <span key={value}>{value}</span>)}</article><article><small>Parcours</small>{selected.journey_stages.map((value) => <span key={value}>{value}</span>)}</article></div></div>
          </section>
          <section className={styles.strategyExecutionBand}>
            <div><h3><FileStack/> Plans d’action</h3>{selectedPlans.map((plan) => <article key={plan.id}><header><strong>{plan.code}</strong><Badge tone={tone(plan.status)}>{statusLabel(plan.status)}</Badge></header><h4>{plan.title}</h4><p>{plan.objective}</p><footer><span>{plan.deliverables.length} livrables</span><span>{plan.capacity_estimate_hours} h estimées</span></footer></article>)}{!selectedPlans.length ? <Empty title="Aucun plan compilé" detail="Compilez la stratégie en livrables, rôles, capacité et dépendances."/> : null}</div>
            <div><h3><Users/> Missions dérivées</h3>{selectedMissions.map((mission) => <Link href="/market-os/content-command-center/missions" key={mission.id}><div><strong>{mission.code}</strong><p>{mission.title}</p></div><Badge tone={tone(mission.status)}>{statusLabel(mission.status)}</Badge><Progress value={mission.progress}/></Link>)}{!selectedMissions.length ? <Empty title="Aucune mission libérée" detail="Un plan approuvé peut être transformé en mission manuelle ou compilée par l’AI Director."/> : null}</div>
          </section>
          <footer className={styles.strategyGovernance}><ShieldCheck/><div><strong>Garde de décision</strong><p>Les propositions AI restent internes. L’approbation stratégique, l’affectation et la libération des missions restent humaines.</p></div><Link href="/market-os/content-command-center/missions">Ouvrir Mission Control <ArrowRight/></Link></footer>
        </> : <Empty title="Sélectionnez une stratégie" detail="Le canvas montrera sa preuve, son problème, son architecture et sa chaîne d’exécution."/>}
      </article>
    </section>

    <Modal open={createOpen} title="Créer une stratégie depuis des preuves" onClose={() => setCreateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button onClick={createStrategy} disabled={busy === "create" || !form.title || !form.problemStatement || !form.businessObjective || !form.contentObjective}><Plus/> Créer la stratégie</button></>}>
      <div className={styles.formGrid}>
        <Field label="Titre"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></Field>
        <Field label="Signaux qualifiés"><div className={styles.checkboxStack}>{qualifiedSignals.map((signal) => <label key={signal.id}><input type="checkbox" checked={form.signalIds.includes(signal.id)} onChange={(event) => setForm({ ...form, signalIds: event.target.checked ? [...form.signalIds, signal.id] : form.signalIds.filter((id) => id !== signal.id) })}/><span><strong>{signal.code}</strong>{signal.title}</span></label>)}</div></Field>
        <Field label="Services"><input value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })} placeholder="Home Service, Academy…"/></Field>
        <Field label="Audiences"><input value={form.audiences} onChange={(event) => setForm({ ...form, audiences: event.target.value })}/></Field>
        <Field label="Villes"><input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })}/></Field>
        <Field label="Problème stratégique" wide><textarea rows={4} value={form.problemStatement} onChange={(event) => setForm({ ...form, problemStatement: event.target.value })}/></Field>
        <Field label="Objectif business" wide><textarea rows={3} value={form.businessObjective} onChange={(event) => setForm({ ...form, businessObjective: event.target.value })}/></Field>
        <Field label="Objectif contenu" wide><textarea rows={3} value={form.contentObjective} onChange={(event) => setForm({ ...form, contentObjective: event.target.value })}/></Field>
      </div>
    </Modal>

    <Modal open={compileOpen} title="Compiler la stratégie en plan d’action" onClose={() => setCompileOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCompileOpen(false)}>Annuler</button><button onClick={compilePlan} disabled={busy === "compile" || !selected}><BrainCircuit/> Compiler sans libérer</button></>}>
      <div className={styles.formGrid}>
        <Field label="Nom du plan"><input value={planForm.title} onChange={(event) => setPlanForm({ ...planForm, title: event.target.value })}/></Field>
        <Field label="Capacité estimée (heures)"><input type="number" value={planForm.capacityHours} onChange={(event) => setPlanForm({ ...planForm, capacityHours: event.target.value })}/></Field>
        <Field label="Rôles requis" wide><input value={planForm.requiredRoles} onChange={(event) => setPlanForm({ ...planForm, requiredRoles: event.target.value })}/></Field>
        <Field label="Objectif d’exécution" wide><textarea rows={4} value={planForm.objective} onChange={(event) => setPlanForm({ ...planForm, objective: event.target.value })}/></Field>
        <Field label="Livrables — un par ligne" wide><textarea rows={8} value={planForm.deliverables} onChange={(event) => setPlanForm({ ...planForm, deliverables: event.target.value })} placeholder={"12 publications image\n4 reels\n2 carrousels\n1 kit B2B"}/></Field>
      </div>
    </Modal>
  </main>
}
