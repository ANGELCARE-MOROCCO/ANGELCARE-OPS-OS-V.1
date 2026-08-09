"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight, Boxes, BrainCircuit, CheckCircle2, CircleDot, FileStack, GitBranch,
  Gavel, Lightbulb, Network, Plus, Scale, Search, ShieldAlert, Target, TriangleAlert,
  Users, Waypoints,
} from "lucide-react"
import { Field, PageStatus } from "../headquarters/primitives"
import { headquartersAction, statusLabel, useHeadquartersSnapshot } from "../headquarters/client"
import type { Bulk2Snapshot, Bulk2Strategy, StrategicContext } from "./bulk2-types"
import { asStrings, strategyReadiness } from "./bulk2-derivations"
import { Drawer, EmptyStrategicState, Notice, ReadinessGate, StrategicContextSidecar, StrategicIdentityStrip } from "./Bulk2Shared"
import { strategicHref } from "./bulk2-context"
import styles from "./bulk2-experience.module.css"

type ScenarioView = { id: string; title: string; logic?: string; advantage?: string; risk?: string; assumptions?: string[]; authority?: string }

function scenariosOf(strategy: Bulk2Strategy | null): ScenarioView[] {
  if (!strategy || !Array.isArray(strategy.scenarios)) return []
  return strategy.scenarios.map((value, index) => {
    const item = typeof value === "object" && value ? value as Record<string, unknown> : {}
    return {
      id: String(item.id || `scenario-${index + 1}`),
      title: String(item.title || item.name || `Scénario ${index + 1}`),
      logic: typeof item.logic === "string" ? item.logic : typeof item.description === "string" ? item.description : undefined,
      advantage: typeof item.advantage === "string" ? item.advantage : undefined,
      risk: typeof item.risk === "string" ? item.risk : undefined,
      assumptions: Array.isArray(item.assumptions) ? item.assumptions.map(String) : [],
      authority: typeof item.authority === "string" ? item.authority : undefined,
    }
  })
}

export default function Bulk2StrategyWorkspace() {
  const { snapshot: rawSnapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const snapshot = rawSnapshot as unknown as Bulk2Snapshot | null
  const [selectedId, setSelectedId] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [compileOpen, setCompileOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const qualifiedSignals = snapshot?.signals.filter((signal) => signal.status === "qualified") || []
  const [form, setForm] = React.useState({ title: "", problemStatement: "", businessObjective: "", contentObjective: "", signalIds: [] as string[], services: "", audiences: "", cities: "" })
  const [planForm, setPlanForm] = React.useState({ title: "", objective: "", capacityHours: "40", deliverables: "", requiredRoles: "Content Strategist, Content Officer, Designer, Reviewer" })

  const strategies = React.useMemo(() => (snapshot?.strategies || []).filter((strategy) => {
    const haystack = `${strategy.code} ${strategy.title} ${strategy.problem_statement || ""} ${strategy.business_objective || ""} ${strategy.content_objective || ""}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === "all" || strategy.status === status)
  }), [snapshot?.strategies, query, status])
  const selected = snapshot?.strategies.find((strategy) => strategy.id === selectedId) || strategies[0] || null
  const selectedPlans = snapshot?.actionPlans.filter((plan) => plan.strategy_id === selected?.id) || []
  const selectedMissions = snapshot?.missions.filter((mission) => mission.strategy_id === selected?.id) || []
  const linkedSignals = selected ? asStrings(selected.signal_ids).map((id) => snapshot?.signals.find((signal) => signal.id === id)).filter(Boolean) : []
  const scenarios = scenariosOf(selected)
  const checks = strategyReadiness(selected, snapshot?.signals || [], selectedPlans.length, selectedMissions.length)
  const missing = checks.filter((check) => !check.passed)

  const context: StrategicContext = {
    caseId: selected?.id,
    caseCode: selected?.code,
    title: selected?.title,
    stage: "strategy",
    status: selected ? statusLabel(selected.status) : "Aucune stratégie",
    returnTo: "/market-os/content-command-center/strategies",
  }

  async function createStrategy() {
    if (!form.title.trim() || !form.problemStatement.trim()) return
    setBusy("create"); setNotice(null)
    try {
      const result = await headquartersAction("create_strategy", {
        ...form,
        services: form.services.split(",").map((value) => value.trim()).filter(Boolean),
        audiences: form.audiences.split(",").map((value) => value.trim()).filter(Boolean),
        cities: form.cities.split(",").map((value) => value.trim()).filter(Boolean),
      }) as { id?: string }
      setCreateOpen(false)
      setNotice({ tone: "success", text: "Stratégie créée avec la provenance de ses signaux. Aucune décision n’a été approuvée automatiquement." })
      await refresh(); if (result?.id) setSelectedId(result.id)
    } catch (nextError) {
      setNotice({ tone: "danger", text: nextError instanceof Error ? nextError.message : "Création de stratégie indisponible." })
    } finally { setBusy("") }
  }

  async function compilePlan() {
    if (!selected) return
    setBusy("compile"); setNotice(null)
    try {
      await headquartersAction("compile_strategy", {
        strategyId: selected.id,
        title: planForm.title || `Plan d’action · ${selected.title}`,
        objective: planForm.objective || selected.content_objective || "",
        capacityHours: Number(planForm.capacityHours || 0),
        deliverables: planForm.deliverables.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, status: "planned" })),
        requiredRoles: planForm.requiredRoles.split(",").map((value) => value.trim()).filter(Boolean),
      })
      setCompileOpen(false)
      setNotice({ tone: "success", text: "Plan compilé. La mission n’a pas été libérée automatiquement et reste soumise à son gate." })
      await refresh()
    } catch (nextError) {
      setNotice({ tone: "danger", text: nextError instanceof Error ? nextError.message : "Compilation indisponible." })
    } finally { setBusy("") }
  }

  const nextAction = !selected ? "Créer une stratégie" : missing.some((check) => check.id === "evidence") ? "Relier une évidence" : !selectedPlans.length ? "Compiler le plan" : "Constituer le brief"

  return <main aria-label="Fabrique stratégique AngelCare" className={`${styles.bulk2Canvas} ${styles.strategyCanvas}`}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>

    <section className={styles.strategyHero}>
      <div className={styles.strategyHeroGlyph}><Target/><span>DECISION THEATRE</span></div>
      <div className={styles.heroCopy}><span>Fabrique stratégique AngelCare</span><h1>Transformer l’évidence en direction institutionnelle défendable.</h1><p>Les faits, hypothèses, scénarios, limites et décisions humaines restent distincts. Aucun choix stratégique n’est présenté comme certain ou automatiquement approuvé.</p></div>
      <div className={styles.heroCommandCluster}>
        <button className={styles.sovereignButton} onClick={() => setCreateOpen(true)}><Plus/> Nouvelle stratégie</button>
        <Link className={styles.secondaryButton} href={strategicHref("/market-os/content-command-center/signals", { ...context, stage: "observation" })}><Network/> Revenir aux signaux</Link>
      </div>
    </section>

    {notice ? <Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice> : null}
    <StrategicIdentityStrip context={context} nextAction={nextAction} onNextAction={!selected ? () => setCreateOpen(true) : !selectedPlans.length ? () => setCompileOpen(true) : undefined}/>

    <section className={styles.strategyCommandBar}>
      <label className={styles.searchControl}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Problème, objectif ou code stratégique…"/></label>
      <select className={styles.selectControl} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les états</option>{[...new Set((snapshot?.strategies || []).map((item) => item.status))].map((value) => <option value={value} key={value}>{statusLabel(value)}</option>)}</select>
      <div className={styles.truthCounters}><span><strong>{snapshot?.strategies.length || 0}</strong> stratégies</span><span><strong>{snapshot?.actionPlans.length || 0}</strong> plans</span><span><strong>{qualifiedSignals.length}</strong> signaux qualifiés</span></div>
    </section>

    <div className={styles.strategyTheatre}>
      <aside className={styles.strategyPortfolio}>
        <header className={styles.zoneHeader}><div><span>Portefeuille décisionnel</span><h2>Cas stratégiques</h2><p>Sélectionnez une tension à examiner.</p></div><GitBranch/></header>
        <div className={styles.strategyRows}>{strategies.map((strategy) => <button key={strategy.id} className={selected?.id === strategy.id ? styles.strategyRowActive : styles.strategyRow} onClick={() => setSelectedId(strategy.id)}><span className={styles.strategyRowStatus}><CircleDot/><small>{statusLabel(strategy.status)}</small></span><strong>{strategy.title}</strong><p>{strategy.problem_statement || "Problème stratégique non formulé"}</p><footer><span>{strategy.code}</span><span>{asStrings(strategy.services).slice(0, 2).join(" · ") || "Service non renseigné"}</span></footer></button>)}{!strategies.length ? <EmptyStrategicState title="Aucun cas stratégique" detail="Qualifiez un signal puis créez une stratégie sourcée." action={<button className={styles.inlineAction} onClick={() => setCreateOpen(true)}>Créer une stratégie <ArrowRight/></button>}/> : null}</div>
      </aside>

      <section className={styles.decisionStage}>
        {selected ? <>
          <section className={styles.problemFrame}>
            <header><div><span>01 · Strategic Problem Frame</span><h2>{selected.title}</h2></div><span className={styles.statusChip}>{statusLabel(selected.status)}</span></header>
            <div className={styles.problemStatement}><ShieldAlert/><div><small>TENSION À RÉSOUDRE</small><p>{selected.problem_statement || "Le problème stratégique n’est pas encore formulé."}</p></div></div>
            <div className={styles.northStarGrid}>
              <article><small>Objectif business</small><strong>{selected.business_objective || "À définir"}</strong></article>
              <article><small>Objectif contenu</small><strong>{selected.content_objective || "À définir"}</strong></article>
              <article><small>Perception recherchée</small><strong>{selected.desired_perception || "Non enregistrée"}</strong></article>
            </div>
          </section>

          <section className={styles.evidenceSpine}>
            <header className={styles.subsectionTitle}><div><span>02 · Evidence Lineage</span><h3>Ce que la décision peut réellement soutenir</h3></div><Waypoints/></header>
            <div className={styles.evidenceChain}>{linkedSignals.map((signal, index) => signal ? <article key={signal.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{signal.title}</strong><p>{signal.summary}</p><small>{signal.code} · {statusLabel(signal.status)}</small></div></article> : null)}{!linkedSignals.length ? <EmptyStrategicState title="Lignée d’évidence absente" detail="La stratégie n’est reliée à aucun signal présent dans le snapshot. La décision ne doit pas être présentée comme sourcée." action={<Link className={styles.inlineAction} href="/market-os/content-command-center/signals">Ouvrir l’Observatoire <ArrowRight/></Link>}/> : null}</div>
            <aside className={styles.assumptionLedger}><header><BrainCircuit/><span>Hypothèses et limites</span></header><p>{asStrings(selected.assumptions).length ? asStrings(selected.assumptions).join(" · ") : "Aucune hypothèse structurée n’est exposée par le modèle actuel. Le système n’en invente pas."}</p></aside>
          </section>

          <section className={styles.scenarioLandscape}>
            <header className={styles.subsectionTitle}><div><span>03 · Scenario Landscape</span><h3>Options comparables, limites visibles</h3></div><Scale/></header>
            {scenarios.length ? <div className={styles.scenarioTrack}>{scenarios.map((scenario, index) => <article className={styles.scenarioPanel} key={scenario.id}><header><span>OPTION {String(index + 1).padStart(2, "0")}</span><h4>{scenario.title}</h4></header><section><small>Logique</small><p>{scenario.logic || "Non documentée"}</p></section><div className={styles.scenarioSplit}><section><small>Avantage</small><p>{scenario.advantage || "Non documenté"}</p></section><section><small>Risque</small><p>{scenario.risk || "Non documenté"}</p></section></div><footer><span>{scenario.authority || "Autorité non renseignée"}</span><span>{scenario.assumptions?.length || 0} hypothèse(s)</span></footer></article>)}</div> : <div className={styles.scenarioBoundary}><TriangleAlert/><div><strong>Aucun scénario structuré disponible</strong><p>Le modèle actuel n’expose pas de scénarios persistés pour ce cas. La Fabrique n’invente ni option, ni résultat attendu, ni probabilité.</p></div></div>}
          </section>

          <section className={styles.decisionGuards}>
            <header className={styles.subsectionTitle}><div><span>04 · Decision Guards</span><h3>Ce qui empêche une décision responsable</h3></div><ShieldAlert/></header>
            <div>{missing.map((check) => <article key={check.id}><TriangleAlert/><div><strong>{check.label}</strong><p>{check.reason}</p><small>{check.owner}</small></div></article>)}{!missing.length ? <article className={styles.guardPassed}><CheckCircle2/><div><strong>Préconditions observables satisfaites</strong><p>La disponibilité de l’autorité humaine doit encore être confirmée par le workflow existant.</p></div></article> : null}</div>
          </section>

          <section className={styles.executiveDecisionDock}>
            <div className={styles.decisionAuthority}><Gavel/><div><span>05 · HUMAN AUTHORITY</span><h3>La recommandation ne remplace jamais la décision</h3><p>Le modèle courant ne fournit pas d’action générique d’approbation stratégique. Les actions disponibles restent limitées à la constitution et à la compilation existantes.</p></div></div>
            <div className={styles.decisionActions}>
              <Link className={styles.secondaryButton} href={strategicHref("/market-os/content-command-center/signals", { ...context, stage: "observation" })}>Demander plus d’évidence</Link>
              <button className={styles.sovereignButton} onClick={() => setCompileOpen(true)}><Boxes/> Compiler le plan</button>
              <Link className={styles.primaryOutline} href={strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })}><FileStack/> Constituer le brief <ArrowRight/></Link>
            </div>
          </section>
        </> : <EmptyStrategicState title="Sélectionnez un cas stratégique" detail="Le problème, la lignée d’évidence, les scénarios et les guards de décision apparaîtront ici."/>}
      </section>

      <StrategicContextSidecar context={context} sections={[
        { label: "Évidence", value: linkedSignals.length ? `${linkedSignals.length} signal(aux)` : "Absente", tone: linkedSignals.length ? "success" : "danger" },
        { label: "Scénarios", value: scenarios.length ? `${scenarios.length} option(s)` : "Non structurés", tone: scenarios.length ? "success" : "warning" },
        { label: "Plan", value: selectedPlans.length ? `${selectedPlans.length} compilé(s)` : "À compiler", tone: selectedPlans.length ? "success" : "warning" },
        { label: "Mission", value: selectedMissions.length ? `${selectedMissions.length} reliée(s)` : "Non libérée", tone: selectedMissions.length ? "success" : "neutral" },
      ]}/>
    </div>

    <section className={styles.strategyReleaseRail}>
      <ReadinessGate title="Strategy-to-Brief & Mission Readiness" checks={checks} actionLabel={selectedPlans.length ? "Ouvrir Briefing Suite" : "Compiler le plan"} onAction={selected ? () => {
        if (selectedPlans.length) {
          window.location.href = strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })
          return
        }
        setCompileOpen(true)
      } : undefined}/>
      <article className={styles.releaseSummary}><header><FileStack/><span>Strategy-to-Brief Compiler</span></header><h3>{selected?.content_objective || "Objectif contenu à définir"}</h3><p>La direction sélectionnée prépare le contexte du brief. Elle ne crée pas un brief approuvé et ne libère pas automatiquement une mission.</p>{selected ? <Link href={strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })}>Ouvrir la constitution du brief <ArrowRight/></Link> : null}</article>
    </section>

    {createOpen ? <Drawer title="Constituer un nouveau cas stratégique" eyebrow="Fabrique · Constitution" onClose={() => setCreateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={busy === "create" || !form.title.trim() || !form.problemStatement.trim()} onClick={() => void createStrategy()}><Plus/> Créer le cas</button></>}>
      <div className={styles.drawerFormGrid}>
        <Field label="Titre stratégique"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></Field>
        <Field label="Problème stratégique"><textarea rows={5} value={form.problemStatement} onChange={(event) => setForm({ ...form, problemStatement: event.target.value })}/></Field>
        <Field label="Objectif business"><textarea rows={3} value={form.businessObjective} onChange={(event) => setForm({ ...form, businessObjective: event.target.value })}/></Field>
        <Field label="Objectif contenu"><textarea rows={3} value={form.contentObjective} onChange={(event) => setForm({ ...form, contentObjective: event.target.value })}/></Field>
        <Field label="Signaux qualifiés"><div className={styles.choiceGrid}>{qualifiedSignals.map((signal) => <label key={signal.id}><input type="checkbox" checked={form.signalIds.includes(signal.id)} onChange={(event) => setForm({ ...form, signalIds: event.target.checked ? [...form.signalIds, signal.id] : form.signalIds.filter((id) => id !== signal.id) })}/><span><strong>{signal.code}</strong>{signal.title}</span></label>)}</div></Field>
        <Field label="Services"><input value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })}/></Field>
        <Field label="Audiences"><input value={form.audiences} onChange={(event) => setForm({ ...form, audiences: event.target.value })}/></Field>
        <Field label="Villes"><input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })}/></Field>
      </div>
    </Drawer> : null}

    {compileOpen && selected ? <Drawer title="Compiler un plan d’action gouverné" eyebrow={`${selected.code} · Strategy-to-Plan`} onClose={() => setCompileOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCompileOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={busy === "compile"} onClick={() => void compilePlan()}><Boxes/> Compiler sans libérer</button></>}>
      <div className={styles.drawerFormGrid}>
        <Field label="Titre du plan"><input value={planForm.title} onChange={(event) => setPlanForm({ ...planForm, title: event.target.value })} placeholder={`Plan d’action · ${selected.title}`}/></Field>
        <Field label="Objectif"><textarea rows={3} value={planForm.objective} onChange={(event) => setPlanForm({ ...planForm, objective: event.target.value })} placeholder={selected.content_objective || "Objectif du plan"}/></Field>
        <Field label="Capacité déclarée (heures)"><input type="number" min="0" value={planForm.capacityHours} onChange={(event) => setPlanForm({ ...planForm, capacityHours: event.target.value })}/></Field>
        <Field label="Livrables, un par ligne"><textarea rows={8} value={planForm.deliverables} onChange={(event) => setPlanForm({ ...planForm, deliverables: event.target.value })}/></Field>
        <Field label="Rôles requis"><input value={planForm.requiredRoles} onChange={(event) => setPlanForm({ ...planForm, requiredRoles: event.target.value })}/></Field>
      </div>
    </Drawer> : null}
  </main>
}
