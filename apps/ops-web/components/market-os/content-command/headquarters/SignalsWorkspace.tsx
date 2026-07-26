"use client"

import * as React from "react"
import Link from "next/link"
import { Activity, ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, CircleDot, Globe2, Lightbulb, Link2, Plus, Radar, Search, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react"
import { Badge, Empty, Field, Modal, PageStatus, Progress, SectionHeader } from "./primitives"
import { formatDate, headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

export default function SignalsWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [selectedId, setSelectedId] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [form, setForm] = React.useState({ title: "", summary: "", sourceType: "manual_observation", sourceLabel: "Observation interne", sourceUrl: "", services: "", audiences: "", cities: "" })

  const signals = (snapshot?.signals || []).filter((signal) => {
    const haystack = `${signal.code} ${signal.title} ${signal.summary} ${signal.source_label} ${signal.services.join(" ")} ${signal.audiences.join(" ")} ${signal.cities.join(" ")}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === "all" || signal.status === status)
  })
  const selected = snapshot?.signals.find((signal) => signal.id === selectedId) || signals[0] || null

  async function runScan() {
    setBusy("scan"); setMessage("")
    try { const result = await headquartersAction("run_signal_scan", { reason: "Manual Market Observatory scan" }) as { signals?: unknown[] }; setMessage(`${result.signals?.length || 0} nouveau(x) signal(aux) créé(s).`); await refresh() }
    catch (nextError) { setMessage(nextError instanceof Error ? nextError.message : "MARKET_SCAN_FAILED") } finally { setBusy("") }
  }

  async function createSignal() {
    setBusy("create")
    setMessage("")
    try {
      await headquartersAction("create_signal", {
        ...form,
        services: form.services.split(",").map((value) => value.trim()).filter(Boolean),
        audiences: form.audiences.split(",").map((value) => value.trim()).filter(Boolean),
        cities: form.cities.split(",").map((value) => value.trim()).filter(Boolean),
      })
      setCreateOpen(false)
      setForm({ title: "", summary: "", sourceType: "manual_observation", sourceLabel: "Observation interne", sourceUrl: "", services: "", audiences: "", cities: "" })
      setMessage("Signal enregistré avec provenance.")
      await refresh()
    } catch (nextError) { setMessage(nextError instanceof Error ? nextError.message : "SIGNAL_CREATE_FAILED") }
    finally { setBusy("") }
  }

  async function qualifySelected() {
    if (!selected) return
    setBusy("qualify")
    try {
      await headquartersAction("update_signal_status", { signalId: selected.id, status: "qualified", confidence: Math.max(selected.confidence, 75), urgency: Math.max(selected.urgency, 60), opportunityScore: Math.max(selected.opportunity_score, 70), humanConclusion: selected.human_conclusion || "Signal qualifié pour conversion stratégique." })
      setMessage(`${selected.code} qualifié.`)
      await refresh()
    } catch (nextError) { setMessage(nextError instanceof Error ? nextError.message : "SIGNAL_QUALIFY_FAILED") }
    finally { setBusy("") }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.signalHero}>
      <div><span className={styles.eyebrow}><Radar/> OBSERVATOIRE DES SIGNAUX</span><h1>Voir ce que le marché prépare avant que la demande ne devienne évidente.</h1><p>Sources publiques autorisées, signaux commerciaux, besoins services, observations terrain et scans AI deviennent des opportunités vérifiables.</p></div>
      <div className={styles.signalHeroActions}><button disabled={busy === "scan"} onClick={() => void runScan()}><Sparkles/> Lancer un scan AI</button><button onClick={() => setCreateOpen(true)}><Plus/> Capturer un signal</button><Link href="/market-os/content-command-center/ai-foundry"><BrainCircuit/> Configurer les scans</Link></div>
    </section>

    {message ? <div className={styles.inlineNotice}>{message}<button onClick={() => setMessage("")}>×</button></div> : null}

    <section className={styles.signalControlBar}>
      <label><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher source, service, audience, ville ou opportunité…"/></label>
      <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les états</option>{["captured", "enriching", "verified", "qualified", "converted", "deferred", "rejected", "expired"].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select>
      <div><span><CircleDot/> {snapshot?.signals.length || 0} signaux</span><span><TrendingUp/> {snapshot?.rollups.anticipationOpportunities || 0} opportunités</span><span><ShieldCheck/> {snapshot?.signals.filter((item) => item.status === "verified").length || 0} vérifiés</span></div>
    </section>

    <section className={styles.observatoryGrid}>
      <article className={styles.signalStream}>
        <SectionHeader eyebrow="FLUX INTELLIGENCE" title="Signaux classés par valeur d’action" description="Chaque signal conserve sa source, son niveau de preuve, sa fraîcheur et sa décision humaine."/>
        <div className={styles.signalRows}>
          {signals.map((signal) => <button key={signal.id} className={selected?.id === signal.id ? styles.signalRowActive : styles.signalRow} onClick={() => setSelectedId(signal.id)}>
            <span className={styles.signalSourceIcon}>{signal.source_type.includes("ai") ? <BrainCircuit/> : signal.source_url ? <Globe2/> : <Activity/>}</span>
            <div className={styles.signalRowMain}><header><Badge tone={tone(signal.status)}>{statusLabel(signal.status)}</Badge><small>{signal.code} · {formatDate(signal.detected_at)}</small></header><strong>{signal.title}</strong><p>{signal.summary}</p><footer>{signal.services.slice(0, 3).map((service) => <span key={service}>{service}</span>)}{signal.cities.slice(0, 2).map((city) => <span key={city}>{city}</span>)}</footer></div>
            <div className={styles.signalScore}><strong>{signal.opportunity_score}</strong><span>valeur</span><Progress value={signal.confidence}/><small>Confiance {signal.confidence}%</small></div>
          </button>)}
          {!signals.length ? <Empty title="Aucun signal dans ce filtre" detail="Lancez un scan gouverné ou capturez une observation de terrain avec sa source."/> : null}
        </div>
      </article>

      <aside className={styles.signalEvidenceDesk}>
        {selected ? <>
          <header><div><span>{selected.code}</span><h2>{selected.title}</h2></div><Badge tone={tone(selected.status)}>{statusLabel(selected.status)}</Badge></header>
          <div className={styles.signalScores}><span><small>Confiance</small><strong>{selected.confidence}%</strong><Progress value={selected.confidence}/></span><span><small>Urgence</small><strong>{selected.urgency}%</strong><Progress value={selected.urgency}/></span><span><small>Opportunité</small><strong>{selected.opportunity_score}</strong><Progress value={selected.opportunity_score}/></span></div>
          <section><h3><Link2/> Source et fraîcheur</h3><dl><div><dt>Source</dt><dd>{selected.source_label}</dd></div><div><dt>Type</dt><dd>{selected.source_type}</dd></div><div><dt>Fraîcheur</dt><dd>{selected.freshness}</dd></div><div><dt>Détecté</dt><dd>{formatDate(selected.detected_at, true)}</dd></div></dl>{selected.source_url ? <a href={selected.source_url} target="_blank" rel="noreferrer">Ouvrir la source <ArrowRight/></a> : null}</section>
          <section><h3><BrainCircuit/> Interprétation AI</h3><p>{selected.ai_interpretation || "Aucune interprétation AI n’a encore été enregistrée. La donnée brute reste clairement distinguée."}</p></section>
          <section><h3><CheckCircle2/> Conclusion humaine</h3><p>{selected.human_conclusion || "Aucune conclusion humaine. Le signal ne peut pas devenir une directive silencieuse."}</p></section>
          <section><h3><Target/> Impact ANGELCARE</h3><div className={styles.tagMatrix}><strong>Services</strong>{selected.services.map((value) => <span key={value}>{value}</span>)}<strong>Audiences</strong>{selected.audiences.map((value) => <span key={value}>{value}</span>)}<strong>Villes</strong>{selected.cities.map((value) => <span key={value}>{value}</span>)}</div></section>
          <footer><button onClick={qualifySelected} disabled={busy === "qualify" || selected.status === "qualified"}><ShieldCheck/> Qualifier pour stratégie</button><Link href={`/market-os/content-command-center/strategies?signal=${selected.id}`}><Lightbulb/> Construire la stratégie</Link></footer>
        </> : <Empty title="Sélectionnez un signal" detail="Le panneau de preuve affichera son origine, son autorité, sa fraîcheur et sa décision."/>}
      </aside>
    </section>

    <section className={styles.anticipationLanes}>
      <SectionHeader eyebrow="ANTICIPATION" title="Fenêtres de contenu à préparer" description="La fraîcheur et la prochaine date de scan empêchent les tendances périmées de devenir des ordres permanents."/>
      <div>{["Immédiat", "7 prochains jours", "30 prochains jours", "Surveillance"].map((lane, index) => <article key={lane}><header><CalendarClock/><strong>{lane}</strong><span>{snapshot?.signals.filter((signal) => index === 0 ? signal.urgency >= 80 : index === 1 ? signal.urgency >= 60 && signal.urgency < 80 : index === 2 ? signal.urgency >= 40 && signal.urgency < 60 : signal.urgency < 40).length || 0}</span></header>{(snapshot?.signals || []).filter((signal) => index === 0 ? signal.urgency >= 80 : index === 1 ? signal.urgency >= 60 && signal.urgency < 80 : index === 2 ? signal.urgency >= 40 && signal.urgency < 60 : signal.urgency < 40).slice(0, 3).map((signal) => <button key={signal.id} onClick={() => setSelectedId(signal.id)}><strong>{signal.title}</strong><small>{signal.source_label}</small></button>)}</article>)}</div>
    </section>

    <Modal open={createOpen} title="Capturer un signal vérifiable" onClose={() => setCreateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button onClick={createSignal} disabled={busy === "create" || !form.title.trim() || !form.summary.trim()}><Plus/> Enregistrer le signal</button></>}>
      <div className={styles.formGrid}>
        <Field label="Titre"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex. demande croissante pour les activités éducatives d’été"/></Field>
        <Field label="Type de source"><select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}><option value="manual_observation">Observation manuelle</option><option value="sales_signal">Signal commercial</option><option value="service_signal">Signal service</option><option value="market_ai_scan">Scan AI marché</option><option value="campaign_performance">Performance campagne</option><option value="customer_question">Question client</option></select></Field>
        <Field label="Libellé source"><input value={form.sourceLabel} onChange={(event) => setForm({ ...form, sourceLabel: event.target.value })}/></Field>
        <Field label="URL de preuve"><input value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="Optionnel"/></Field>
        <Field label="Services (séparés par virgules)"><input value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })}/></Field>
        <Field label="Audiences"><input value={form.audiences} onChange={(event) => setForm({ ...form, audiences: event.target.value })}/></Field>
        <Field label="Villes"><input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })}/></Field>
        <Field label="Observation complète" wide><textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={6}/></Field>
      </div>
    </Modal>
  </main>
}
