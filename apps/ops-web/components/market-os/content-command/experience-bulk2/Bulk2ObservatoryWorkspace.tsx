"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity, ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, CircleDot,
  FileSearch, Globe2, Layers3, Lightbulb, Link2, Plus, Radar, RefreshCw,
  Search, ShieldCheck, Sparkles, Target, TriangleAlert, Waypoints,
} from "lucide-react"
import { Field, PageStatus } from "../headquarters/primitives"
import { formatDate, headquartersAction, statusLabel, useHeadquartersSnapshot } from "../headquarters/client"
import type { Bulk2Signal, Bulk2Snapshot, StrategicContext } from "./bulk2-types"
import { asStrings, signalCredibility } from "./bulk2-derivations"
import { Drawer, EmptyStrategicState, Notice, StrategicContextSidecar, StrategicIdentityStrip } from "./Bulk2Shared"
import { strategicHref } from "./bulk2-context"
import styles from "./bulk2-experience.module.css"

const statusOptions = ["captured", "enriching", "verified", "qualified", "converted", "deferred", "rejected", "expired"]

function score(signal: Bulk2Signal) {
  return Math.round((Number(signal.opportunity_score || 0) * .5) + (Number(signal.urgency || 0) * .3) + (Number(signal.confidence || 0) * .2))
}

export default function Bulk2ObservatoryWorkspace() {
  const { snapshot: rawSnapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const snapshot = rawSnapshot as unknown as Bulk2Snapshot | null
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [selectedId, setSelectedId] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const [form, setForm] = React.useState({
    title: "", summary: "", sourceType: "manual_observation", sourceLabel: "Observation interne",
    sourceUrl: "", services: "", audiences: "", cities: "",
  })

  const allSignals = snapshot?.signals || []
  const signals = React.useMemo(() => allSignals.filter((signal) => {
    const haystack = [signal.code, signal.title, signal.summary, signal.source_label, ...asStrings(signal.services), ...asStrings(signal.audiences), ...asStrings(signal.cities)].join(" ").toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === "all" || signal.status === status)
  }).sort((a, b) => score(b) - score(a)), [allSignals, query, status])
  const selected = allSignals.find((signal) => signal.id === selectedId) || signals[0] || null
  const credibility = selected ? signalCredibility(selected) : null

  const clusters = React.useMemo(() => {
    const map = new Map<string, { label: string; count: number; ids: string[]; basis: string }>()
    for (const signal of allSignals) {
      const dimensions = [
        ...asStrings(signal.services).map((value) => [value, "service"] as const),
        ...asStrings(signal.audiences).map((value) => [value, "audience"] as const),
        ...asStrings(signal.cities).map((value) => [value, "ville"] as const),
      ]
      for (const [label, basis] of dimensions) {
        const key = `${basis}:${label}`
        const current = map.get(key) || { label, count: 0, ids: [], basis }
        current.count += 1; current.ids.push(signal.id); map.set(key, current)
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8)
  }, [allSignals])

  const horizons = [
    { label: "Immédiat", count: allSignals.filter((signal) => Number(signal.urgency || 0) >= 80).length, detail: "Réponse stratégique requise sans attendre." },
    { label: "7 jours", count: allSignals.filter((signal) => Number(signal.urgency || 0) >= 60 && Number(signal.urgency || 0) < 80).length, detail: "Vérification et qualification prioritaires." },
    { label: "30 jours", count: allSignals.filter((signal) => Number(signal.urgency || 0) >= 40 && Number(signal.urgency || 0) < 60).length, detail: "Fenêtre stratégique à structurer." },
    { label: "Surveillance", count: allSignals.filter((signal) => Number(signal.urgency || 0) < 40).length, detail: "Conserver sans transformer en directive." },
  ]

  const context: StrategicContext = {
    caseId: selected?.id, caseCode: selected?.code, title: selected?.title,
    stage: "observation", status: selected ? statusLabel(selected.status) : "Aucun signal", returnTo: "/market-os/content-command-center/signals",
  }

  async function runScan() {
    setBusy("scan"); setNotice(null)
    try {
      const result = await headquartersAction("run_signal_scan", { reason: "Bulk 2 strategic observatory authorized scan" }) as { signals?: unknown[] }
      setNotice({ tone: "success", text: `${result.signals?.length || 0} nouveau(x) signal(aux) créé(s) depuis les sources autorisées.` })
      await refresh()
    } catch (nextError) {
      setNotice({ tone: "danger", text: nextError instanceof Error ? nextError.message : "Scan indisponible." })
    } finally { setBusy("") }
  }

  async function createSignal() {
    if (!form.title.trim() || !form.summary.trim()) return
    setBusy("create"); setNotice(null)
    try {
      const result = await headquartersAction("create_signal", {
        ...form,
        services: form.services.split(",").map((value) => value.trim()).filter(Boolean),
        audiences: form.audiences.split(",").map((value) => value.trim()).filter(Boolean),
        cities: form.cities.split(",").map((value) => value.trim()).filter(Boolean),
      }) as { id?: string }
      setCreateOpen(false)
      setForm({ title: "", summary: "", sourceType: "manual_observation", sourceLabel: "Observation interne", sourceUrl: "", services: "", audiences: "", cities: "" })
      setNotice({ tone: "success", text: "Signal enregistré avec sa provenance. Il reste distinct de toute interprétation ou décision." })
      await refresh(); if (result?.id) setSelectedId(result.id)
    } catch (nextError) {
      setNotice({ tone: "danger", text: nextError instanceof Error ? nextError.message : "Enregistrement indisponible." })
    } finally { setBusy("") }
  }

  async function qualifySelected() {
    if (!selected) return
    setBusy("qualify"); setNotice(null)
    try {
      await headquartersAction("update_signal_status", {
        signalId: selected.id,
        status: "qualified",
        confidence: Math.max(Number(selected.confidence || 0), 75),
        urgency: Math.max(Number(selected.urgency || 0), 60),
        opportunityScore: Math.max(Number(selected.opportunity_score || 0), 70),
        humanConclusion: selected.human_conclusion || "Signal qualifié pour examen stratégique humain.",
      })
      setNotice({ tone: "success", text: `${selected.code} est qualifié. Sa provenance reste attachée à la Fabrique stratégique.` })
      await refresh()
    } catch (nextError) {
      setNotice({ tone: "danger", text: nextError instanceof Error ? nextError.message : "Qualification indisponible." })
    } finally { setBusy("") }
  }

  return <main aria-label="Observatoire stratégique AngelCare" className={`${styles.bulk2Canvas} ${styles.observatoryCanvas}`}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>

    <section className={styles.observatoryHero}>
      <div className={styles.heroSignalPulse}><Radar/><span>OBSERVATOIRE ANGELCARE</span></div>
      <div className={styles.heroCopy}><span>Signal Intelligence Field</span><h1>Voir le réel avant d’interpréter. Vérifier avant de décider.</h1><p>Une observation reste une observation. La provenance, la fraîcheur, l’interprétation et la conclusion humaine sont inspectées séparément avant toute conversion stratégique.</p></div>
      <div className={styles.heroCommandCluster}>
        <button className={styles.sovereignButton} disabled={busy === "scan"} onClick={() => void runScan()}><Sparkles/> {busy === "scan" ? "Scan en cours…" : "Lancer un scan autorisé"}</button>
        <button className={styles.secondaryButton} onClick={() => setCreateOpen(true)}><Plus/> Capturer un signal</button>
        <button className={styles.iconButton} onClick={refresh} aria-label="Actualiser"><RefreshCw/></button>
      </div>
    </section>

    {notice ? <Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice> : null}

    <StrategicIdentityStrip context={context} nextAction={selected?.status === "qualified" ? "Ouvrir la Fabrique stratégique" : "Qualifier le signal"} onNextAction={selected ? selected.status === "qualified" ? undefined : () => void qualifySelected() : () => setCreateOpen(true)}/>

    <section className={styles.observatoryCommandBar}>
      <label className={styles.searchControl}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Source, service, audience, ville ou opportunité…"/></label>
      <select className={styles.selectControl} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrer les signaux">
        <option value="all">Tous les états</option>{statusOptions.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
      </select>
      <div className={styles.truthCounters}>
        <span><strong>{allSignals.length}</strong> signaux persistés</span>
        <span><strong>{allSignals.filter((signal) => signal.status === "verified").length}</strong> vérifiés</span>
        <span><strong>{allSignals.filter((signal) => signal.status === "qualified").length}</strong> qualifiés</span>
      </div>
    </section>

    <div className={styles.observatoryLayout}>
      <section className={styles.signalStream} aria-label="Flux de signaux">
        <header className={styles.zoneHeader}><div><span>01 · Signal Intake Stream</span><h2>Observations classées par valeur d’action</h2><p>L’ordre combine uniquement les champs de confiance, urgence et opportunité enregistrés.</p></div><Activity/></header>
        <div className={styles.signalRows}>
          {signals.map((signal) => {
            const state = signalCredibility(signal)
            return <button key={signal.id} className={selected?.id === signal.id ? styles.signalRowActive : styles.signalRow} onClick={() => setSelectedId(signal.id)}>
              <span className={styles.signalSourceIcon}>{signal.source_url ? <Globe2/> : String(signal.source_type || "").includes("ai") ? <BrainCircuit/> : <FileSearch/>}</span>
              <span className={styles.signalRowBody}><span className={styles.signalMeta}><span className={`${styles.statusChip} ${styles[`tone_${state.tone}`]}`}>{state.label}</span><small>{signal.code} · {formatDate(signal.detected_at)}</small></span><strong>{signal.title}</strong><p>{signal.summary}</p><span className={styles.microTags}>{[...asStrings(signal.services), ...asStrings(signal.cities)].slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</span></span>
              <span className={styles.actionScore}><strong>{score(signal)}</strong><small>valeur d’action</small></span>
            </button>
          })}
          {!signals.length ? <EmptyStrategicState title="Aucun signal dans ce champ" detail="Capturez une observation sourcée ou lancez un scan autorisé. Aucun signal d’exemple n’est injecté." action={<button className={styles.inlineAction} onClick={() => setCreateOpen(true)}>Capturer maintenant <ArrowRight/></button>}/> : null}
        </div>
      </section>

      <section className={styles.signalAnalysisField} aria-label="Inspection du signal">
        {selected ? <>
          <header className={styles.analysisHeader}><div><span>02 · Fact vs Interpretation</span><h2>{selected.title}</h2><p>{selected.code} · {selected.source_label || "Source non libellée"}</p></div><span className={`${styles.statusChip} ${credibility ? styles[`tone_${credibility.tone}`] : ""}`}>{credibility?.label}</span></header>

          <div className={styles.factInterpretationSplit}>
            <article className={styles.factPane}><header><ShieldCheck/><span>FAIT OBSERVÉ</span></header><p>{selected.summary || "Aucun fait détaillé n’a été enregistré."}</p><footer><small>Source</small><strong>{selected.source_label || "Non renseignée"}</strong>{selected.source_url ? <a href={selected.source_url} target="_blank" rel="noreferrer"><Link2/> Ouvrir la source</a> : <span className={styles.missingInline}><TriangleAlert/> URL non renseignée</span>}</footer></article>
            <article className={styles.interpretationPane}><header><BrainCircuit/><span>INTERPRÉTATION / HYPOTHÈSE</span></header><p>{selected.ai_interpretation || "Aucune interprétation AI enregistrée. Le système n’en invente pas."}</p><footer><small>Conclusion humaine</small><strong>{selected.human_conclusion || "Revue humaine requise"}</strong></footer></article>
          </div>

          <section className={styles.credibilityInspector}>
            <header className={styles.subsectionTitle}><div><span>03 · Source Credibility Inspector</span><h3>Pourquoi ce signal est-il exploitable — ou non ?</h3></div><ShieldCheck/></header>
            <div className={styles.credibilityMatrix}>
              <article><small>Provenance</small><strong>{selected.source_label || "Non renseignée"}</strong><span>{selected.source_url ? "Lien disponible" : "Lien absent"}</span></article>
              <article><small>Fraîcheur</small><strong>{formatDate(selected.detected_at)}</strong><span>Date de détection enregistrée</span></article>
              <article><small>Confiance</small><strong>{Number(selected.confidence || 0)}</strong><span>Valeur persistée, non recalculée</span></article>
              <article><small>Limitation</small><strong>{credibility?.label}</strong><span>{credibility?.explanation}</span></article>
            </div>
          </section>

          <section className={styles.conversionGate}>
            <div><span>05 · Strategic Conversion Gate</span><h3>Transformer seulement ce qui mérite une décision</h3><p>{selected.status === "qualified" ? "Le signal est qualifié. Ouvrez la Fabrique avec sa provenance et son contexte conservés." : "La qualification reste une décision humaine. Vérifiez la source et documentez la conclusion avant conversion."}</p></div>
            {selected.status === "qualified" ? <Link className={styles.sovereignButton} href={strategicHref("/market-os/content-command-center/strategies", { ...context, stage: "strategy" })}><Lightbulb/> Ouvrir la Fabrique <ArrowRight/></Link> : <button className={styles.sovereignButton} disabled={busy === "qualify"} onClick={() => void qualifySelected()}><CheckCircle2/> Qualifier pour la stratégie</button>}
          </section>
        </> : <EmptyStrategicState title="Sélectionnez une observation" detail="La source, le fait, l’interprétation et le gate de conversion apparaîtront ici."/>}
      </section>

      <StrategicContextSidecar context={context} sections={[
        { label: "Source", value: selected?.source_label || "Non renseignée", tone: selected?.source_label ? "success" : "danger" },
        { label: "Crédibilité", value: credibility?.label || "Aucune sélection", tone: (credibility?.tone as "success" | "warning" | "danger" | "neutral") || "neutral" },
        { label: "Urgence", value: selected ? String(Number(selected.urgency || 0)) : "—", tone: Number(selected?.urgency || 0) >= 80 ? "danger" : "neutral" },
        { label: "Opportunité", value: selected ? String(Number(selected.opportunity_score || 0)) : "—" },
      ]}/>
    </div>

    <section className={styles.signalLandscape}>
      <article className={styles.clusterCanvas}><header className={styles.zoneHeader}><div><span>04 · Signal Cluster Canvas</span><h2>Relations observables, jamais décoratives</h2><p>Les regroupements reposent uniquement sur les services, audiences et villes persistés.</p></div><Layers3/></header><div className={styles.clusterMap}>{clusters.map((cluster, index) => <button key={`${cluster.basis}:${cluster.label}`} className={styles.clusterNode} style={{ "--cluster-size": `${Math.min(112, 62 + cluster.count * 8)}px`, "--cluster-order": index } as React.CSSProperties} onClick={() => setQuery(cluster.label)}><strong>{cluster.count}</strong><span>{cluster.label}</span><small>par {cluster.basis}</small></button>)}{!clusters.length ? <EmptyStrategicState title="Aucune relation exploitable" detail="Les signaux actuels ne contiennent pas assez de métadonnées communes pour former un cluster déterministe."/> : null}</div></article>
      <article className={styles.horizonRail}><header className={styles.zoneHeader}><div><span>Horizon d’opportunité</span><h2>Quand faut-il agir ?</h2></div><CalendarClock/></header><div>{horizons.map((horizon) => <article key={horizon.label}><strong>{horizon.count}</strong><div><span>{horizon.label}</span><p>{horizon.detail}</p></div></article>)}</div></article>
    </section>

    {createOpen ? <Drawer title="Capturer une observation sourcée" eyebrow="Observatoire · Intake" onClose={() => setCreateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={busy === "create" || !form.title.trim() || !form.summary.trim()} onClick={() => void createSignal()}><Plus/> Enregistrer le signal</button></>}>
      <div className={styles.drawerFormGrid}>
        <Field label="Titre du signal"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></Field>
        <Field label="Type de source"><select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}><option value="manual_observation">Observation interne</option><option value="customer_feedback">Feedback client</option><option value="market_source">Source marché</option><option value="partner_intelligence">Intelligence partenaire</option></select></Field>
        <Field label="Fait observé"><textarea rows={6} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })}/></Field>
        <Field label="Libellé de source"><input value={form.sourceLabel} onChange={(event) => setForm({ ...form, sourceLabel: event.target.value })}/></Field>
        <Field label="URL de source"><input value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })}/></Field>
        <Field label="Services, séparés par des virgules"><input value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })}/></Field>
        <Field label="Audiences"><input value={form.audiences} onChange={(event) => setForm({ ...form, audiences: event.target.value })}/></Field>
        <Field label="Villes"><input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })}/></Field>
      </div>
    </Drawer> : null}
  </main>
}
