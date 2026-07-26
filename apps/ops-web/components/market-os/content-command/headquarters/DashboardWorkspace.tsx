"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  FileArchive,
  FileCheck2,
  Lightbulb,
  Radar,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge, Empty, Metric, PageStatus, Progress, SectionHeader } from "./primitives"
import { formatDate, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"
import LegacyPromotionPanel from "./LegacyPromotionPanel"

const quarterWaves = [
  { month: "Mois 1", title: "Fondation & activation", items: ["Alignement doctrine", "Architecture de campagne", "Piliers éditoriaux", "Briefs prioritaires", "Premières publications"] },
  { month: "Mois 2", title: "Échelle & optimisation", items: ["Production haute fréquence", "Adaptations canaux", "Réutilisation intelligente", "Objections commerciales", "Variantes régionales"] },
  { month: "Mois 3", title: "Conversion & institutionnalisation", items: ["Contenus de conversion", "Cas & témoignages", "Sales enablement", "Consolidation performance", "Cycle suivant"] },
]

export default function DashboardWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const rollups = snapshot?.rollups
  const prioritySignals = snapshot?.signals.filter((signal) => signal.status === "qualified" || signal.opportunity_score >= 70).slice(0, 5) || []
  const activeMissions = snapshot?.missions.filter((mission) => ["assigned", "accepted", "in_progress", "checkpoint", "submitted", "ai_review", "human_review", "revision", "blocked"].includes(mission.status)).slice(0, 6) || []
  const decisionDossiers = snapshot?.dossiers.filter((dossier) => ["human_review", "source_required", "validated"].includes(dossier.status)).slice(0, 5) || []
  const sourceRisk = snapshot?.sources.filter((source) => source.is_current && source.integrity_state !== "verified").slice(0, 4) || []

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.commandHero}>
      <div className={styles.commandHeroMain}>
        <span className={styles.eyebrow}><Sparkles/> ANGELCARE CONTENT COMMAND CENTER 360</span>
        <h1>Le quartier général qui transforme les signaux du marché en contenus gouvernés, exécutés et préservés.</h1>
        <p>Cycle actif de 90 jours · Intelligence marché, stratégie, missions, production supervisée, validation, sources canoniques et diffusion.</p>
        <div className={styles.heroActions}>
          <Link href="/market-os/content-command-center/signals"><Radar/> Ouvrir l’observatoire</Link>
          <Link href="/market-os/content-command-center/studio" className={styles.secondaryAction}><Sparkles/> Créer un contenu</Link>
          <button type="button" onClick={refresh}><RefreshCw/> Actualiser</button>
        </div>
      </div>
      <aside className={styles.commandMandate}>
        <header><span>MANDAT TRIMESTRIEL</span><Badge tone="success">ACTIF</Badge></header>
        <h2>Autorité, visibilité et conversion des services ANGELCARE</h2>
        <p>Priorité sur Home Service, Academy, B2B Partnerships et confiance familles dans Rabat, Casablanca et Kénitra.</p>
        <div className={styles.mandateGrid}>
          <span><small>Horizon</small><strong>90 jours</strong></span>
          <span><small>Objectifs</small><strong>Trust · Demand · Conversion</strong></span>
          <span><small>Bridge</small><strong>{snapshot?.bridge.available ? "Opérationnel" : "À vérifier"}</strong></span>
          <span><small>AI Provider</small><strong>{snapshot?.provider.available ? "Gouverné" : "Non affecté"}</strong></span>
        </div>
      </aside>
    </section>

    <section className={styles.metricRail}>
      <Metric label="Signaux actifs" value={rollups?.activeSignals || 0} detail={`${rollups?.anticipationOpportunities || 0} opportunités d’anticipation`} icon={<Radar/>} tone="blue"/>
      <Metric label="Missions actives" value={rollups?.activeMissions || 0} detail={`${rollups?.tasksDueToday || 0} tâches dues aujourd’hui`} icon={<Workflow/>} tone="violet"/>
      <Metric label="Dossiers en production" value={rollups?.dossiersInProduction || 0} detail={`${rollups?.dossiersAwaitingEvidence || 0} attendent une preuve`} icon={<Activity/>} tone="navy"/>
      <Metric label="Validation" value={rollups?.dossiersAwaitingValidation || 0} detail={`${rollups?.humanDecisionsPending || 0} décisions humaines`} icon={<ShieldCheck/>} tone="amber"/>
      <Metric label="Sources requises" value={rollups?.dossiersAwaitingSource || 0} detail={`${rollups?.sourceIntegrityRisks || 0} risques d’intégrité`} icon={<FileArchive/>} tone="red"/>
      <Metric label="Prêts à diffuser" value={rollups?.readyForDistribution || 0} detail="packages à préparer ou planifier" icon={<Send/>} tone="green"/>
    </section>

    <section className={styles.quarterPanorama}>
      <SectionHeader eyebrow="CARTE OPÉRATIONNELLE 90 JOURS" title="Trois vagues, une seule chaîne d’autorité" description="Le département voit le mandat, la production, les validations et l’apprentissage sans perdre le contexte stratégique." action={<Link href="/market-os/content-command-center/strategies">Gérer le cycle <ArrowRight/></Link>}/>
      <div className={styles.waveGrid}>
        {quarterWaves.map((wave, index) => <article key={wave.month} className={styles.waveCard}>
          <span className={styles.waveNumber}>0{index + 1}</span>
          <div><small>{wave.month}</small><h3>{wave.title}</h3></div>
          <ul>{wave.items.map((item) => <li key={item}><CheckCircle2/>{item}</li>)}</ul>
          <Progress value={[38, 17, 4][index]} label="Avancement observé"/>
        </article>)}
      </div>
    </section>

    <section className={styles.situationGrid}>
      <article className={styles.signalCommand}>
        <SectionHeader eyebrow="SIGNAL RADAR" title="Contenus à anticiper" description="Signaux qualifiés ou à forte valeur potentielle détectés par l’écosystème." action={<Link href="/market-os/content-command-center/signals">Observatoire <ArrowRight/></Link>}/>
        <div className={styles.signalOrbit}>
          <div className={styles.radarCore}><Radar/><strong>{prioritySignals.length}</strong><span>opportunités</span></div>
          {prioritySignals.map((signal, index) => <Link key={signal.id} href="/market-os/content-command-center/signals" className={styles.orbitSignal} style={{ ["--signal-index" as string]: index } as React.CSSProperties}>
            <Badge tone={tone(signal.status)}>{statusLabel(signal.status)}</Badge>
            <strong>{signal.title}</strong>
            <span>{signal.source_label} · score {signal.opportunity_score}</span>
          </Link>)}
          {!prioritySignals.length ? <div className={styles.orbitEmpty}><Lightbulb/><strong>Aucun signal qualifié</strong><span>L’observatoire est prêt pour les scans AI ou les observations manuelles.</span></div> : null}
        </div>
      </article>

      <article className={styles.executiveInterventions}>
        <SectionHeader eyebrow="DÉCISIONS" title="Interventions prioritaires" description="Ce qui nécessite une autorité, une correction ou une preuve avant de continuer."/>
        <div className={styles.interventionList}>
          {(rollups?.overdueTasks || 0) > 0 ? <Link href="/market-os/content-command-center/missions"><span className={styles.alertIcon}><AlertTriangle/></span><div><strong>{rollups?.overdueTasks} tâches en retard</strong><p>Réaffecter, décaler ou lever les blocages documentés.</p></div><ArrowRight/></Link> : null}
          {(rollups?.aiReviewsPending || 0) > 0 ? <Link href="/market-os/content-command-center/evidence"><span className={styles.aiIcon}><BrainCircuit/></span><div><strong>{rollups?.aiReviewsPending} preuves attendent l’analyse AI</strong><p>Lancer les contrôles de scope, marque, design et message.</p></div><ArrowRight/></Link> : null}
          {decisionDossiers.map((dossier) => <Link key={dossier.id} href={`/market-os/content-command-center/dossiers/${dossier.id}`}><span className={styles.decisionIcon}><CircleDot/></span><div><strong>{dossier.content_code}</strong><p>{dossier.title} · {statusLabel(dossier.status)}</p></div><ArrowRight/></Link>)}
          {sourceRisk.map((source) => <Link key={source.id} href="/market-os/content-command-center/source-vault"><span className={styles.alertIcon}><FileArchive/></span><div><strong>Intégrité source à traiter</strong><p>{source.content_code} · {source.original_filename}</p></div><ArrowRight/></Link>)}
          {!((rollups?.overdueTasks || 0) + (rollups?.aiReviewsPending || 0) + decisionDossiers.length + sourceRisk.length) ? <Empty title="Aucune intervention critique" detail="Les données actuellement visibles n’indiquent aucun blocage prioritaire."/> : null}
        </div>
      </article>
    </section>

    <section className={styles.liveOperations}>
      <SectionHeader eyebrow="PRODUCTION EN COURS" title="Le département en mouvement" description="Missions, owners, échéances, risques et avancement dans une vue d’exécution unique." action={<Link href="/market-os/content-command-center/missions">Mission Control <ArrowRight/></Link>}/>
      <div className={styles.missionRunway}>
        {activeMissions.map((mission) => <Link key={mission.id} href="/market-os/content-command-center/missions" className={styles.missionFlight}>
          <div className={styles.missionIdentity}><span>{mission.code}</span><h3>{mission.title}</h3><p>{mission.assigned_to_name || "Non assignée"} · échéance {formatDate(mission.due_at)}</p></div>
          <div className={styles.missionProgress}><Progress value={mission.progress}/><small>{mission.success_definition}</small></div>
          <div className={styles.missionState}><Badge tone={tone(mission.status)}>{statusLabel(mission.status)}</Badge><Badge tone={tone(mission.risk_level)}>{mission.risk_level}</Badge></div>
          <ArrowRight/>
        </Link>)}
        {!activeMissions.length ? <Empty title="Aucune mission active" detail="Une stratégie approuvée, un dossier ou une décision administrative peut créer la première mission gouvernée." action="Créer une mission" href="/market-os/content-command-center/missions"/> : null}
      </div>
    </section>

    <section className={styles.departmentChain}>
      <SectionHeader eyebrow="CHAÎNE DE VALEUR" title="De l’intelligence à la mémoire institutionnelle" description="Chaque sortie déverrouille le prochain état, avec preuve, provenance et autorité."/>
      <div className={styles.chainTrack}>
        {([
          { label: "Signaux", value: rollups?.activeSignals || 0, Icon: Radar, href: "/signals" },
          { label: "Stratégies", value: rollups?.activeStrategies || 0, Icon: Target, href: "/strategies" },
          { label: "Missions", value: rollups?.activeMissions || 0, Icon: Users, href: "/missions" },
          { label: "Création", value: rollups?.dossiersInProduction || 0, Icon: Sparkles, href: "/studio" },
          { label: "Preuves", value: rollups?.dossiersAwaitingEvidence || 0, Icon: Activity, href: "/evidence" },
          { label: "Validation", value: rollups?.dossiersAwaitingValidation || 0, Icon: ShieldCheck, href: "/validation" },
          { label: "Sources", value: snapshot?.sources.filter((source) => source.is_current).length || 0, Icon: FileCheck2, href: "/source-vault" },
          { label: "Diffusion", value: rollups?.readyForDistribution || 0, Icon: Send, href: "/distribution" },
        ] satisfies Array<{ label: string; value: number; Icon: LucideIcon; href: string }>).map(({ label, value, Icon, href }, index) => <Link key={label} href={`/market-os/content-command-center${href}`} className={styles.chainNode}>
          <span>0{index + 1}</span><Icon/><strong>{label}</strong><b>{value}</b>
        </Link>)}
      </div>
    </section>
    <LegacyPromotionPanel onPromoted={refresh}/>
  </main>
}
