"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent, type ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  FileCheck2,
  Gauge,
  GitBranch,
  Landmark,
  Layers3,
  LineChart,
  ListChecks,
  Loader2,
  Network,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react"
import { EXECUTIVE_ROUTE_CONTRACTS } from "./route-contracts"
import type {
  ExecutiveCommand,
  ExecutiveCommandPayload,
  ExecutiveExperience,
  ExecutiveForecastLine,
  ExecutiveMetric,
  ExecutivePortfolio,
  ExecutiveRecord,
  ExecutiveTeamRow,
} from "./types"
import styles from "./RevenueExecutiveWorkspace.module.css"

const ROUTE_TABS: Array<{ experience: ExecutiveExperience; label: string; href: string }> = [
  { experience: "executive-overview", label: "Commandement", href: "/revenue-command-center" },
  { experience: "forecast-command", label: "Prévisions", href: "/revenue-command-center/predictive" },
  { experience: "control-tower", label: "Fuites & risques", href: "/revenue-command-center/control-tower" },
  { experience: "executive-briefing", label: "Briefing", href: "/revenue-command-center/executive-briefing" },
  { experience: "strategy-room", label: "Scénarios", href: "/revenue-command-center/strategy-room" },
  { experience: "revenue-analytics", label: "Analytics", href: "/revenue-command-center/revenue-analytics" },
  { experience: "team-intelligence", label: "Équipe", href: "/revenue-command-center/team-performance" },
  { experience: "overdue-heatmap", label: "Pression", href: "/revenue-command-center/overdue-heatmap" },
  { experience: "workload-command", label: "Capacité", href: "/revenue-command-center/workload-balancer" },
  { experience: "management-decision-room", label: "Décisions", href: "/revenue-command-center/management" },
]

const COMMAND_LABELS: Record<ExecutiveCommand, string> = {
  "generate-forecast-snapshot": "Générer un snapshot de prévision",
  "submit-owner-forecast": "Soumettre l'engagement du propriétaire",
  "override-forecast": "Appliquer un override exécutif",
  "expire-forecast-override": "Expirer l'override",
  "create-intervention": "Créer une intervention",
  "assign-intervention": "Assigner l'intervention",
  "escalate-intervention": "Escalader l'intervention",
  "request-decision": "Demander une décision",
  "decide-intervention": "Décider l'intervention",
  "record-intervention-checkpoint": "Enregistrer un checkpoint",
  "close-intervention": "Clôturer l'intervention",
  "create-scenario": "Créer un scénario",
  "run-scenario": "Exécuter le scénario",
  "approve-scenario": "Approuver le scénario",
  "generate-briefing": "Générer un briefing",
  "approve-briefing": "Approuver le briefing",
  "acknowledge-signal": "Accuser réception du signal",
  "dismiss-signal": "Classer le faux positif",
  "create-canonical-task": "Créer une tâche canonique",
  "request-finance-review": "Demander une revue Finance",
}

function formatDh(value: number | undefined | null, compact = true) {
  const amount = Number(value || 0)
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount / 1_000_000)} M Dh`
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(amount / 1_000)} k Dh`
  }
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} Dh`
}

function formatPercent(value: number | undefined | null) {
  return `${Math.round(Number(value || 0))}%`
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Non daté"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date invalide"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AC"
}

function statusClass(status: string | undefined) {
  const value = String(status || "").toLowerCase()
  if (/critical|blocked|broken|overdue|rejected|lost|high/.test(value)) return `${styles.status} ${styles.statusRed}`
  if (/warning|pending|review|medium|at_risk|slipped/.test(value)) return `${styles.status} ${styles.statusAmber}`
  if (/approved|active|closed|resolved|realized|confirmed|low/.test(value)) return `${styles.status} ${styles.statusGreen}`
  return styles.status
}

function recordAmount(record: ExecutiveRecord) {
  return formatDh(record.amountMad || 0)
}

function topRows<T>(rows: T[] | undefined, count = 5) {
  return Array.isArray(rows) ? rows.slice(0, count) : []
}

export default function RevenueExecutiveWorkspace({ experience }: { experience: ExecutiveExperience }) {
  const contract = EXECUTIVE_ROUTE_CONTRACTS[experience]
  const [portfolio, setPortfolio] = useState<ExecutivePortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [command, setCommand] = useState<ExecutiveCommand | null>(null)
  const [entityId, setEntityId] = useState("")
  const [toast, setToast] = useState("")

  async function load(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") setLoading(true)
    else setRefreshing(true)
    setError("")
    try {
      const response = await fetch(
        `/api/revenue-command-center/executive-enterprise/portfolio?experience=${encodeURIComponent(experience)}`,
        { cache: "no-store" },
      )
      const payload = await response.json()
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Intelligence exécutive indisponible.")
      setPortfolio(payload.portfolio)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Intelligence exécutive indisponible.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load("initial")
  }, [experience])

  const heroSignals = useMemo(() => {
    const summary = portfolio?.summary || {}
    return [
      { label: "Réalisé", value: formatDh(summary.realizedMad), icon: <CircleDollarSign size={17} /> },
      { label: "Commit", value: formatDh(summary.commitMad), icon: <Target size={17} /> },
      { label: "À risque", value: formatDh(summary.atRiskMad), icon: <ShieldAlert size={17} /> },
    ]
  }, [portfolio])

  function openCommand(next: ExecutiveCommand, id = "") {
    setEntityId(id)
    setCommand(next)
  }

  async function execute(payload: ExecutiveCommandPayload) {
    const response = await fetch("/api/revenue-command-center/executive-enterprise/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (!response.ok || !result?.ok) throw new Error(result?.error || "Commande exécutive refusée.")
    setToast(result.message || "Commande exécutive enregistrée.")
    setCommand(null)
    await load("refresh")
    window.setTimeout(() => setToast(""), 4300)
  }

  if (loading) {
    return (
      <main className={styles.shell}>
        <div className={styles.loading}>
          <span><Loader2 size={18} /> Synchronisation de la vérité Revenue Command…</span>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <div className={styles.topBar}>
        <div className={styles.breadcrumb}>
          <span>Revenue Command Center</span>
          <ChevronRight size={13} />
          <strong>{contract.title}</strong>
        </div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Source canonique · {portfolio ? dateLabel(portfolio.syncedAt) : "hors ligne"}
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.eyebrow}>{contract.eyebrow}</p>
          <h1 className={styles.heroTitle}>{contract.title}</h1>
          <p className={styles.heroMission}>{contract.mission}</p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => openCommand(contract.primaryCommand as ExecutiveCommand)}
            >
              <Zap size={16} />
              {contract.primaryAction}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => void load("refresh")} disabled={refreshing}>
              {refreshing ? <Loader2 size={15} /> : <RefreshCcw size={15} />}
              Actualiser
            </button>
            <Link className={styles.secondaryButton} href="/revenue-command-center/tasks">
              <ListChecks size={15} />
              Tâches Revenue
            </Link>
          </div>
        </div>
        <aside className={styles.heroAside}>
          {heroSignals.map((signal) => (
            <div className={styles.heroSignal} key={signal.label}>
              <span className={styles.heroSignalIcon}>{signal.icon}</span>
              <span className={styles.heroSignalCopy}>
                <span>{signal.label}</span>
                <strong>Valeur vérifiée</strong>
              </span>
              <strong className={styles.heroSignalValue}>{signal.value}</strong>
            </div>
          ))}
        </aside>
      </section>

      <nav className={styles.tabRail} aria-label="Navigation intelligence exécutive">
        {ROUTE_TABS.map((tab) => (
          <Link
            key={tab.experience}
            href={tab.href}
            className={`${styles.tab} ${tab.experience === experience ? styles.tabActive : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {error ? <div className={styles.error}>{error}</div> : null}
      <MetricRail portfolio={portfolio} />

      <section className={styles.canvas}>
        {experience === "executive-overview" ? <ExecutiveOverview portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "control-tower" ? <ControlTower portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "executive-briefing" ? <BriefingRoom portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "forecast-command" ? <ForecastCommand portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "strategy-room" ? <StrategyRoom portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "revenue-analytics" ? <AnalyticsCommand portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "team-intelligence" ? <TeamIntelligence portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "overdue-heatmap" ? <OverdueHeatmap portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "workload-command" ? <WorkloadCommand portfolio={portfolio} openCommand={openCommand} /> : null}
        {experience === "management-decision-room" ? <DecisionRoom portfolio={portfolio} openCommand={openCommand} /> : null}
      </section>

      {command ? (
        <ExecutiveCommandDrawer
          command={command}
          entityId={entityId}
          onClose={() => setCommand(null)}
          onExecute={execute}
        />
      ) : null}
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  )
}

function MetricRail({ portfolio }: { portfolio: ExecutivePortfolio | null }) {
  const metrics = portfolio?.metrics || []
  const fallback: ExecutiveMetric[] = [
    { key: "pipeline", label: "Pipeline", value: portfolio?.summary?.pipelineMad || 0, tone: "blue" as const, detail: "Opportunités ouvertes" },
    { key: "weighted", label: "Pondéré", value: portfolio?.summary?.weightedMad || 0, tone: "cyan" as const, detail: "Probabilité gouvernée" },
    { key: "contracted", label: "Contracté", value: portfolio?.summary?.contractedMad || 0, tone: "navy" as const, detail: "Contrats actifs" },
    { key: "confirmed", label: "Confirmé", value: portfolio?.summary?.confirmedMad || 0, tone: "green" as const, detail: "Finance confirmée" },
    { key: "realized", label: "Réalisé", value: portfolio?.summary?.realizedMad || 0, tone: "green" as const, detail: "Événements de réalisation" },
    { key: "risk", label: "À risque", value: portfolio?.summary?.atRiskMad || 0, tone: "red" as const, detail: "Exposition active" },
  ]
  const items = metrics.length ? metrics.slice(0, 6) : fallback
  return (
    <section className={styles.metricGrid}>
      {items.map((metric) => (
        <article
          className={`${styles.metricCard} ${
            metric.tone === "green" ? styles.metricToneGreen :
            metric.tone === "amber" ? styles.metricToneAmber :
            metric.tone === "red" ? styles.metricToneRed :
            metric.tone === "cyan" ? styles.metricToneCyan :
            metric.tone === "violet" ? styles.metricToneViolet :
            metric.tone === "navy" ? styles.metricToneNavy : styles.metricToneBlue
          }`}
          key={metric.key}
        >
          <span className={styles.metricLabel}>{metric.label}</span>
          <strong className={styles.metricValue}>{metric.formatted || formatDh(metric.value)}</strong>
          <span className={styles.metricDetail}>{metric.detail || metric.source || "Source canonique"}</span>
        </article>
      ))}
    </section>
  )
}

function Panel({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <article className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.cardEyebrow}>{eyebrow}</span>
          <h2 className={styles.panelTitle}>{title}</h2>
          {description ? <p className={styles.panelDescription}>{description}</p> : null}
        </div>
        {action}
      </header>
      <div className={styles.panelBody}>{children}</div>
    </article>
  )
}

function ExecutiveOverview({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const summary = portfolio?.summary || {}
  const bridge = [
    ["Pipeline", summary.pipelineMad || 0],
    ["Pondéré", summary.weightedMad || 0],
    ["Commit", summary.commitMad || 0],
    ["Contracté", summary.contractedMad || 0],
    ["Réalisé", summary.realizedMad || 0],
  ] as const
  const max = Math.max(...bridge.map((item) => Number(item[1] || 0)), 1)
  return (
    <>
      <div className={styles.twoColumn}>
        <Panel eyebrow="REVENUE BRIDGE" title="De l'opportunité à la réalisation" description="Chaque barre conserve sa définition financière et commerciale propre.">
          <div className={styles.bridge}>
            {bridge.map(([label, value]) => (
              <div className={styles.bridgeItem} key={label}>
                <div className={styles.bridgeBarWrap}>
                  <div className={styles.bridgeBar} style={{ height: `${Math.max(4, (Number(value) / max) * 100)}%` }} />
                </div>
                <strong className={styles.bridgeValue}>{formatDh(Number(value))}</strong>
                <span className={styles.bridgeLabel}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          eyebrow="PRIORITÉ DIRECTION"
          title="Interventions immédiates"
          description="Valeur exposée, autorité attendue et échéance."
          action={<button className={styles.ghostButton} onClick={() => openCommand("create-intervention")}>Créer</button>}
        >
          <RecordList
            rows={portfolio?.interventions}
            empty="Aucune intervention active."
            icon={<ShieldAlert size={16} />}
            onOpen={(id) => openCommand("record-intervention-checkpoint", id)}
          />
        </Panel>
      </div>

      <div className={styles.equalColumn}>
        <Panel eyebrow="MOUVEMENT" title="Prévision et décisions" description="Les écarts doivent rester explicables et versionnés.">
          <ForecastTable rows={portfolio?.forecastLines || []} onOpen={(id) => openCommand("override-forecast", id)} compact />
        </Panel>
        <Panel eyebrow="TRUTH CONTROL" title="Qualité des sources" description="Les manques de données sont séparés des risques commerciaux.">
          <RecordList
            rows={portfolio?.dataQuality}
            empty="Aucun défaut de qualité détecté."
            icon={<Database size={16} />}
            onOpen={(id) => openCommand("create-canonical-task", id)}
          />
        </Panel>
      </div>
    </>
  )
}

function ControlTower({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const leakage = portfolio?.leakage || []
  const severities = [
    { key: "critical", label: "Critique", rows: leakage.filter((row) => /critical/i.test(row.severity || "")) },
    { key: "high", label: "Élevé", rows: leakage.filter((row) => /high/i.test(row.severity || "")) },
    { key: "medium", label: "Avertissement", rows: leakage.filter((row) => /medium|warning/i.test(row.severity || "")) },
    { key: "other", label: "À surveiller", rows: leakage.filter((row) => !/critical|high|medium|warning/i.test(row.severity || "")) },
  ]
  return (
    <>
      <Panel eyebrow="LEAKAGE RADAR" title="Exposition par gravité" description="Les événements sont issus de règles versionnées ou de sources canoniques vérifiées.">
        <div className={styles.riskMatrix}>
          {severities.map((item, index) => (
            <div
              key={item.key}
              className={`${styles.riskCell} ${index === 0 ? styles.riskCellHigh : index === 1 ? styles.riskCellWarn : ""}`}
            >
              <span className={styles.miniLabel}>{item.label}</span>
              <strong className={styles.riskCount}>{item.rows.length}</strong>
              <div className={styles.riskValue}>{formatDh(item.rows.reduce((sum, row) => sum + Number(row.amountMad || 0), 0))} exposés</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className={styles.twoColumn}>
        <Panel
          eyebrow="REVENUE LEAKAGE"
          title="Fuites détectées"
          description="Opportunité, proposition, contrat, paiement, réalisation, relation ou campagne."
          action={<button className={styles.ghostButton} onClick={() => openCommand("create-intervention")}>Intervenir</button>}
        >
          <RecordTable
            rows={leakage}
            actionLabel="Traiter"
            onAction={(id) => openCommand("create-intervention", id)}
          />
        </Panel>
        <Panel eyebrow="SIGNALS" title="Signaux à qualifier" description="Un signal ne devient pas automatiquement une décision.">
          <RecordList
            rows={portfolio?.signals}
            empty="Aucun signal ouvert."
            icon={<Activity size={16} />}
            onOpen={(id) => openCommand("acknowledge-signal", id)}
          />
        </Panel>
      </div>

      <Panel eyebrow="INTERVENTION CENTER" title="Portefeuille des interventions" description="Détection → triage → décision → exécution → résultat mesurable.">
        <RecordTable
          rows={portfolio?.interventions || []}
          actionLabel="Checkpoint"
          onAction={(id) => openCommand("record-intervention-checkpoint", id)}
        />
      </Panel>
    </>
  )
}

function BriefingRoom({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const summary = portfolio?.summary || {}
  return (
    <>
      <section className={styles.briefingHero}>
        <span className={styles.cardEyebrow}>NOTE DE DIRECTION</span>
        <h2>Ce qui a changé, ce qui se détériore, ce qui exige une décision.</h2>
        <p>
          Réalisé {formatDh(summary.realizedMad)} · Commit {formatDh(summary.commitMad)} ·
          Encaissement confirmé {formatDh(summary.confirmedMad)} · Exposition {formatDh(summary.atRiskMad)}.
          Les chiffres simulés et les chiffres réels restent séparés.
        </p>
      </section>

      <div className={styles.threeColumn}>
        <Panel eyebrow="AUJOURD'HUI" title="Décisions à prendre">
          <RecordList rows={portfolio?.decisions} empty="Aucune décision en attente." icon={<Scale size={16} />} onOpen={(id) => openCommand("decide-intervention", id)} />
        </Panel>
        <Panel eyebrow="CETTE SEMAINE" title="Valeur à protéger">
          <RecordList rows={portfolio?.leakage} empty="Aucune fuite prioritaire." icon={<ShieldAlert size={16} />} onOpen={(id) => openCommand("create-intervention", id)} />
        </Panel>
        <Panel eyebrow="À SURVEILLER" title="Mouvements de forecast">
          <RecordList
            rows={(portfolio?.forecastLines || []).map((line) => ({ ...line, amountMad: line.executiveAmountMad || line.ownerAmountMad || line.systemAmountMad }))}
            empty="Aucun mouvement significatif."
            icon={<LineChart size={16} />}
            onOpen={(id) => openCommand("override-forecast", id)}
          />
        </Panel>
      </div>

      <Panel
        eyebrow="BRIEFING ARCHIVE"
        title="Briefings générés"
        description="Snapshots reproductibles, approbation et historique."
        action={<button className={styles.ghostButton} onClick={() => openCommand("generate-briefing")}>Générer</button>}
      >
        <RecordTable rows={portfolio?.briefings || []} actionLabel="Approuver" onAction={(id) => openCommand("approve-briefing", id)} />
      </Panel>
    </>
  )
}

function ForecastCommand({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const categories = [
    ["Pipeline", portfolio?.summary?.pipelineMad || 0],
    ["Upside", portfolio?.summary?.upsideMad || 0],
    ["Best case", portfolio?.summary?.bestCaseMad || 0],
    ["Commit", portfolio?.summary?.commitMad || 0],
    ["Contracté", portfolio?.summary?.contractedMad || 0],
    ["Encaissable", portfolio?.summary?.collectibleMad || 0],
    ["Confirmé", portfolio?.summary?.confirmedMad || 0],
    ["Réalisé", portfolio?.summary?.realizedMad || 0],
    ["Reversé", portfolio?.summary?.reversedMad || 0],
  ]
  return (
    <>
      <Panel eyebrow="FORECAST CATEGORIES" title="Catégories non interchangeables" description="Aucun montant contracté, confirmé ou réalisé n'est déduit d'une simple proposition.">
        <div className={styles.forecastBand}>
          {categories.map(([label, value]) => (
            <div className={styles.forecastCategory} key={String(label)}>
              <span>{label}</span>
              <strong>{formatDh(Number(value))}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        eyebrow="FORECAST DOSSIERS"
        title="Lignes explicables"
        description="Montant système, engagement propriétaire, override exécutif, preuve et date attendue."
        action={<button className={styles.ghostButton} onClick={() => openCommand("generate-forecast-snapshot")}>Snapshot</button>}
      >
        <ForecastTable rows={portfolio?.forecastLines || []} onOpen={(id) => openCommand("override-forecast", id)} />
      </Panel>

      <div className={styles.equalColumn}>
        <Panel eyebrow="ACCURACY" title="Calibration & exactitude">
          <div className={styles.sourceGrid}>
            <SourceStat label="Exactitude commit" value={formatPercent(portfolio?.summary?.commitAccuracy)} note="Prévision vs résultat" />
            <SourceStat label="Biais forecast" value={formatPercent(portfolio?.summary?.forecastBias)} note="Sous / sur-prévision" />
            <SourceStat label="Date correcte" value={formatPercent(portfolio?.summary?.dateAccuracy)} note="Date attendue vs réelle" />
            <SourceStat label="Preuve complète" value={formatPercent(portfolio?.summary?.evidenceCompleteness)} note="Dossiers suffisamment étayés" />
          </div>
        </Panel>
        <Panel eyebrow="MANAGEMENT REVIEW" title="Engagement et override">
          <div className={styles.list}>
            <button className={styles.secondaryButton} onClick={() => openCommand("submit-owner-forecast")}>Soumettre engagement propriétaire</button>
            <button className={styles.secondaryButton} onClick={() => openCommand("override-forecast")}>Appliquer override exécutif</button>
            <button className={styles.secondaryButton} onClick={() => openCommand("expire-forecast-override")}>Expirer un override</button>
          </div>
        </Panel>
      </div>
    </>
  )
}

function StrategyRoom({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const scenarios = portfolio?.scenarios || []
  const fallback = [
    { id: "baseline", title: "Baseline", subtitle: "Situation actuelle sans modification", amountMad: portfolio?.summary?.commitMad || 0, status: "reference" },
    { id: "conservative", title: "Conservateur", subtitle: "Retards de conversion et de collecte", amountMad: (portfolio?.summary?.commitMad || 0) * .78, status: "simulated" },
    { id: "expected", title: "Attendu", subtitle: "Probabilités et délais actuels", amountMad: portfolio?.summary?.weightedMad || 0, status: "simulated" },
    { id: "upside", title: "Expansion", subtitle: "Accélération comptes, partenaires et campagnes", amountMad: (portfolio?.summary?.weightedMad || 0) * 1.18, status: "simulated" },
  ]
  const rows = scenarios.length ? scenarios : fallback
  return (
    <>
      <div className={styles.threeColumn}>
        {rows.slice(0, 6).map((scenario) => (
          <article className={styles.scenarioCard} key={scenario.id}>
            <span className={styles.cardEyebrow}>{scenario.status || "SIMULATED"}</span>
            <h3>{scenario.title}</h3>
            <p>{scenario.subtitle || "Hypothèses isolées des données de production."}</p>
            <div className={styles.scenarioImpact}>{formatDh(scenario.amountMad || 0)}</div>
            <button className={styles.ghostButton} onClick={() => openCommand("run-scenario", scenario.id)}>Comparer</button>
          </article>
        ))}
      </div>

      <div className={styles.twoColumn}>
        <Panel
          eyebrow="ASSUMPTION CONTROL"
          title="Hypothèses gouvernées"
          description="Chaque hypothèse possède une source, une valeur, une période et une version."
          action={<button className={styles.ghostButton} onClick={() => openCommand("create-scenario")}>Nouveau</button>}
        >
          <RecordTable rows={rows} actionLabel="Exécuter" onAction={(id) => openCommand("run-scenario", id)} />
        </Panel>
        <Panel eyebrow="DECISION IMPLICATIONS" title="Arbitrages requis">
          <RecordList rows={portfolio?.decisions} empty="Aucun arbitrage ouvert." icon={<Scale size={16} />} onOpen={(id) => openCommand("decide-intervention", id)} />
        </Panel>
      </div>
    </>
  )
}

function AnalyticsCommand({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  return (
    <>
      <Panel eyebrow="SOURCE CONTRIBUTION" title="Contribution par moteur commercial" description="Source primaire et influence restent séparées pour empêcher le double comptage.">
        <div className={styles.sourceGrid}>
          {(portfolio?.contributions || []).map((source) => (
            <article className={styles.sourceCard} key={source.source}>
              <span className={styles.cardEyebrow}>{source.source}</span>
              <strong>{formatDh(source.realizedMad)}</strong>
              <p>{formatDh(source.pipelineMad)} pipeline · {formatDh(source.contractedMad)} contracté · {source.count} dossiers</p>
            </article>
          ))}
          {!portfolio?.contributions?.length ? <div className={styles.empty}>Aucune attribution exploitable.</div> : null}
        </div>
      </Panel>

      <div className={styles.equalColumn}>
        <Panel eyebrow="DATA LINEAGE" title="Santé des sources">
          <div className={styles.list}>
            {(portfolio?.sourceHealth || []).map((source) => (
              <div className={styles.listItem} key={source.source}>
                <span className={styles.listIcon}>{source.available ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}</span>
                <span className={styles.listCopy}>
                  <strong className={styles.listTitle}>{source.source}</strong>
                  <span className={styles.listMeta}>{source.note || `${source.records} enregistrements`}</span>
                </span>
                <span className={source.available ? `${styles.status} ${styles.statusGreen}` : `${styles.status} ${styles.statusRed}`}>
                  {source.available ? "Disponible" : "Manquant"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel eyebrow="QUALITY CONTROL" title="Anomalies à corriger" action={<button className={styles.ghostButton} onClick={() => openCommand("create-canonical-task")}>Créer tâche</button>}>
          <RecordList rows={portfolio?.dataQuality} empty="Aucune anomalie critique." icon={<Database size={16} />} onOpen={(id) => openCommand("create-canonical-task", id)} />
        </Panel>
      </div>

      <Panel eyebrow="FORECAST VERSUS ACTUAL" title="Prévision confrontée à la réalité">
        <ForecastTable rows={portfolio?.forecastLines || []} onOpen={(id) => openCommand("submit-owner-forecast", id)} />
      </Panel>
    </>
  )
}

function TeamIntelligence({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  return (
    <>
      <div className={styles.threeColumn}>
        {(portfolio?.team || []).slice(0, 9).map((member) => (
          <TeamCard key={member.owner} member={member} onOpen={() => openCommand("create-intervention", member.owner)} />
        ))}
        {!portfolio?.team?.length ? <div className={styles.empty}>Aucun propriétaire commercial disponible.</div> : null}
      </div>
      <Panel eyebrow="PERFORMANCE TABLE" title="Valeur, fiabilité & discipline" description="L'activité brute n'est pas considérée comme une performance.">
        <TeamTable rows={portfolio?.team || []} onOpen={(owner) => openCommand("create-intervention", owner)} />
      </Panel>
    </>
  )
}

function OverdueHeatmap({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const records = [...(portfolio?.leakage || []), ...(portfolio?.collections || [])]
  const ageBuckets = [
    { label: "0–2 jours", min: 0, max: 2 },
    { label: "3–7 jours", min: 3, max: 7 },
    { label: "8–21 jours", min: 8, max: 21 },
    { label: "22+ jours", min: 22, max: 9999 },
  ]
  const now = Date.now()
  return (
    <>
      <Panel eyebrow="PRESSURE HEATMAP" title="Âge du retard × gravité" description="La densité visuelle correspond au nombre de dossiers et à leur valeur exposée.">
        <div className={styles.riskMatrix}>
          {ageBuckets.map((bucket, index) => {
            const rows = records.filter((record) => {
              const date = record.dueAt ? new Date(record.dueAt).getTime() : now
              const age = Math.max(0, Math.floor((now - date) / 86_400_000))
              return age >= bucket.min && age <= bucket.max
            })
            const amount = rows.reduce((sum, row) => sum + Number(row.amountMad || 0), 0)
            return (
              <div key={bucket.label} className={`${styles.riskCell} ${index === 3 ? styles.riskCellHigh : index === 2 ? styles.riskCellWarn : ""}`}>
                <span className={styles.miniLabel}>{bucket.label}</span>
                <strong className={styles.riskCount}>{rows.length}</strong>
                <div className={styles.riskValue}>{formatDh(amount)} exposés</div>
              </div>
            )
          })}
        </div>
      </Panel>
      <Panel eyebrow="OVERDUE QUEUE" title="Files de récupération">
        <RecordTable rows={records} actionLabel="Escalader" onAction={(id) => openCommand("create-intervention", id)} />
      </Panel>
    </>
  )
}

function WorkloadCommand({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  const team = portfolio?.team || []
  const maxLoad = Math.max(...team.map((row) => row.openTasks + row.interventions * 2), 1)
  return (
    <>
      <Panel eyebrow="CAPACITY MAP" title="Charge par propriétaire" description="Tâches, interventions, retards et valeur active sont rapprochés avant redistribution.">
        <div>
          {team.map((member) => {
            const load = member.openTasks + member.interventions * 2
            const percent = Math.min(100, Math.round((load / maxLoad) * 100))
            return (
              <div className={styles.capacityLane} key={member.owner}>
                <div className={styles.capacityName}>
                  <strong>{member.owner}</strong>
                  <span>{member.openTasks} tâches · {member.interventions} interventions</span>
                </div>
                <div className={styles.capacityTrack}>
                  <div
                    className={`${styles.capacityFill} ${percent > 85 ? styles.capacityFillRisk : percent > 67 ? styles.capacityFillWarn : ""}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <button className={styles.rowButton} onClick={() => openCommand("create-canonical-task", member.owner)}>Redistribuer</button>
              </div>
            )
          })}
          {!team.length ? <div className={styles.empty}>Aucune charge attribuée.</div> : null}
        </div>
      </Panel>
      <div className={styles.equalColumn}>
        <Panel eyebrow="SLA PRESSURE" title="Retards par propriétaire">
          <TeamTable rows={team} onOpen={(owner) => openCommand("create-intervention", owner)} />
        </Panel>
        <Panel eyebrow="NEXT ACTION" title="Actions de capacité">
          <div className={styles.list}>
            <button className={styles.secondaryButton} onClick={() => openCommand("create-canonical-task")}>Créer une tâche prioritaire</button>
            <button className={styles.secondaryButton} onClick={() => openCommand("assign-intervention")}>Réassigner une intervention</button>
            <button className={styles.secondaryButton} onClick={() => openCommand("request-decision")}>Demander un arbitrage</button>
          </div>
        </Panel>
      </div>
    </>
  )
}

function DecisionRoom({
  portfolio,
  openCommand,
}: {
  portfolio: ExecutivePortfolio | null
  openCommand: (command: ExecutiveCommand, id?: string) => void
}) {
  return (
    <>
      <div className={styles.twoColumn}>
        <Panel eyebrow="DECISION QUEUE" title="Décisions requises" description="Montant affecté, contexte, alternatives, inaction et autorité attendue.">
          <div className={styles.list}>
            {topRows(portfolio?.decisions, 8).map((record, index) => (
              <article className={styles.decisionCard} key={record.id}>
                <span className={styles.decisionNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.decisionCopy}>
                  <h3>{record.title}</h3>
                  <p>{record.subtitle || "Décision gouvernée nécessitant une justification et une trace d'autorité."}</p>
                </div>
                <button className={styles.rowButton} onClick={() => openCommand("decide-intervention", record.id)}>Décider</button>
              </article>
            ))}
            {!portfolio?.decisions?.length ? <div className={styles.empty}>Aucune décision en attente.</div> : null}
          </div>
        </Panel>
        <Panel eyebrow="GOVERNANCE" title="Cadre de décision">
          <div className={styles.list}>
            <GovernanceItem icon={<Scale size={16} />} title="Autorité" detail="Rôle, permission et périmètre validés côté serveur." />
            <GovernanceItem icon={<FileCheck2 size={16} />} title="Évidence" detail="Chaque décision conserve ses preuves et hypothèses." />
            <GovernanceItem icon={<GitBranch size={16} />} title="Conséquence" detail="Les actions descendantes utilisent les API canoniques." />
            <GovernanceItem icon={<CheckCircle2 size={16} />} title="Clôture" detail="Le résultat et la valeur protégée doivent être mesurés." />
          </div>
        </Panel>
      </div>
      <Panel eyebrow="DECISION HISTORY" title="Interventions & décisions">
        <RecordTable rows={[...(portfolio?.interventions || []), ...(portfolio?.decisions || [])]} actionLabel="Ouvrir" onAction={(id) => openCommand("record-intervention-checkpoint", id)} />
      </Panel>
    </>
  )
}

function GovernanceItem({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className={styles.listItem}>
      <span className={styles.listIcon}>{icon}</span>
      <span className={styles.listCopy}>
        <strong className={styles.listTitle}>{title}</strong>
        <span className={styles.listMeta}>{detail}</span>
      </span>
    </div>
  )
}

function RecordList({
  rows,
  empty,
  icon,
  onOpen,
}: {
  rows: ExecutiveRecord[] | undefined
  empty: string
  icon: ReactNode
  onOpen?: (id: string) => void
}) {
  const records = topRows(rows, 6)
  if (!records.length) return <div className={styles.empty}>{empty}</div>
  return (
    <div className={styles.list}>
      {records.map((record) => (
        <div className={styles.listItem} key={record.id}>
          <span className={styles.listIcon}>{icon}</span>
          <span className={styles.listCopy}>
            <strong className={styles.listTitle}>{record.title}</strong>
            <span className={styles.listMeta}>{record.owner || record.subtitle || record.sourceType || "Revenue Command"}</span>
          </span>
          <span>
            {record.amountMad ? <strong className={styles.listAmount}>{recordAmount(record)}</strong> : null}
            {record.status ? <span className={statusClass(record.status)}>{record.status}</span> : null}
            {onOpen ? <button className={styles.rowButton} onClick={() => onOpen(record.id)}>Ouvrir</button> : null}
          </span>
        </div>
      ))}
    </div>
  )
}

function RecordTable({
  rows,
  actionLabel,
  onAction,
}: {
  rows: ExecutiveRecord[]
  actionLabel: string
  onAction: (id: string) => void
}) {
  if (!rows.length) return <div className={styles.empty}>Aucun dossier disponible.</div>
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader}>Dossier</th>
            <th className={styles.tableHeader}>Source</th>
            <th className={styles.tableHeader}>Propriétaire</th>
            <th className={styles.tableHeader}>Échéance</th>
            <th className={styles.tableHeader}>Valeur</th>
            <th className={styles.tableHeader}>État</th>
            <th className={styles.tableHeader}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 40).map((record) => (
            <tr className={styles.tableRow} key={record.id}>
              <td className={`${styles.tableCell} ${styles.tableCellStrong}`}>{record.title}</td>
              <td className={styles.tableCell}>{record.sourceType || "Revenue"}</td>
              <td className={styles.tableCell}>{record.owner || "Non assigné"}</td>
              <td className={styles.tableCell}>{dateLabel(record.dueAt)}</td>
              <td className={styles.tableCell}>{recordAmount(record)}</td>
              <td className={styles.tableCell}><span className={statusClass(record.status)}>{record.status || "open"}</span></td>
              <td className={styles.tableCell}><button className={styles.rowButton} onClick={() => onAction(record.id)}>{actionLabel}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ForecastTable({
  rows,
  onOpen,
  compact = false,
}: {
  rows: ExecutiveForecastLine[]
  onOpen: (id: string) => void
  compact?: boolean
}) {
  if (!rows.length) return <div className={styles.empty}>Aucune ligne de prévision disponible.</div>
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader}>Dossier</th>
            <th className={styles.tableHeader}>Catégorie</th>
            <th className={styles.tableHeader}>Système</th>
            {!compact ? <th className={styles.tableHeader}>Owner</th> : null}
            <th className={styles.tableHeader}>Exécutif</th>
            <th className={styles.tableHeader}>Confiance</th>
            <th className={styles.tableHeader}>Date</th>
            <th className={styles.tableHeader}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, compact ? 8 : 60).map((line) => (
            <tr className={styles.tableRow} key={line.id}>
              <td className={`${styles.tableCell} ${styles.tableCellStrong}`}>{line.title}</td>
              <td className={styles.tableCell}><span className={statusClass(line.category)}>{line.category}</span></td>
              <td className={styles.tableCell}>{formatDh(line.systemAmountMad)}</td>
              {!compact ? <td className={styles.tableCell}>{formatDh(line.ownerAmountMad || line.systemAmountMad)}</td> : null}
              <td className={styles.tableCell}>{formatDh(line.executiveAmountMad || line.ownerAmountMad || line.systemAmountMad)}</td>
              <td className={styles.tableCell}>{formatPercent(line.confidence)}</td>
              <td className={styles.tableCell}>{dateLabel(line.expectedDate)}</td>
              <td className={styles.tableCell}><button className={styles.rowButton} onClick={() => onOpen(line.id)}>Revoir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SourceStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className={styles.sourceCard}>
      <span className={styles.cardEyebrow}>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}

function TeamCard({
  member,
  onOpen,
}: {
  member: ExecutiveTeamRow
  onOpen: () => void
}) {
  const reliability = Math.max(0, Math.min(100, member.forecastAccuracy || member.dataQualityScore || 0))
  return (
    <article className={styles.teamCard}>
      <div className={styles.teamTop}>
        <span className={styles.avatar}>{initials(member.owner)}</span>
        <span className={styles.teamName}>
          <strong>{member.owner}</strong>
          <span>{formatDh(member.pipelineMad)} pipeline</span>
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${reliability}%` }} />
      </div>
      <div className={styles.teamStats}>
        <div className={styles.teamStat}><strong>{formatPercent(reliability)}</strong><span>Fiabilité</span></div>
        <div className={styles.teamStat}><strong>{member.overdueTasks}</strong><span>Retards</span></div>
        <div className={styles.teamStat}><strong>{member.interventions}</strong><span>Interventions</span></div>
      </div>
      <button className={styles.ghostButton} onClick={onOpen}>Ouvrir la revue</button>
    </article>
  )
}

function TeamTable({
  rows,
  onOpen,
}: {
  rows: ExecutiveTeamRow[]
  onOpen: (owner: string) => void
}) {
  if (!rows.length) return <div className={styles.empty}>Aucun scorecard disponible.</div>
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader}>Propriétaire</th>
            <th className={styles.tableHeader}>Pipeline</th>
            <th className={styles.tableHeader}>Pondéré</th>
            <th className={styles.tableHeader}>Réalisé</th>
            <th className={styles.tableHeader}>Tâches</th>
            <th className={styles.tableHeader}>Retards</th>
            <th className={styles.tableHeader}>Exactitude</th>
            <th className={styles.tableHeader}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row) => (
            <tr className={styles.tableRow} key={row.owner}>
              <td className={`${styles.tableCell} ${styles.tableCellStrong}`}>{row.owner}</td>
              <td className={styles.tableCell}>{formatDh(row.pipelineMad)}</td>
              <td className={styles.tableCell}>{formatDh(row.weightedMad)}</td>
              <td className={styles.tableCell}>{formatDh(row.realizedMad)}</td>
              <td className={styles.tableCell}>{row.openTasks}</td>
              <td className={styles.tableCell}>{row.overdueTasks}</td>
              <td className={styles.tableCell}>{formatPercent(row.forecastAccuracy)}</td>
              <td className={styles.tableCell}><button className={styles.rowButton} onClick={() => onOpen(row.owner)}>Revoir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExecutiveCommandDrawer({
  command,
  entityId,
  onClose,
  onExecute,
}: {
  command: ExecutiveCommand
  entityId: string
  onClose: () => void
  onExecute: (payload: ExecutiveCommandPayload) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [reason, setReason] = useState("")
  const [evidenceReference, setEvidenceReference] = useState("")
  const [owner, setOwner] = useState("")
  const [amountMad, setAmountMad] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [decision, setDecision] = useState("approved")
  const [horizon, setHorizon] = useState("current_month")
  const [scenarioType, setScenarioType] = useState("expected")
  const [briefingType, setBriefingType] = useState("weekly")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const needsReason = !["generate-forecast-snapshot", "generate-briefing", "acknowledge-signal"].includes(command)
  const isScenario = ["create-scenario", "run-scenario", "approve-scenario"].includes(command)
  const isBriefing = ["generate-briefing", "approve-briefing"].includes(command)
  const isDecision = ["decide-intervention", "request-decision"].includes(command)

  async function submit() {
    if (needsReason && !reason.trim()) {
      setError("Un motif documenté est requis.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await onExecute({
        command,
        entityId: entityId || undefined,
        title: title.trim() || undefined,
        reason: reason.trim() || undefined,
        evidenceReference: evidenceReference.trim() || undefined,
        owner: owner.trim() || undefined,
        amountMad: amountMad ? Number(amountMad) : undefined,
        dueAt: dueAt || undefined,
        decision: isDecision ? decision : undefined,
        horizon,
        scenarioType: isScenario ? scenarioType : undefined,
        briefingType: isBriefing ? briefingType : undefined,
        metadata: { source: "revenue_executive_workspace" },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Commande refusée.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.drawerBackdrop} role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.target === event.currentTarget && onClose()}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="executive-command-title">
        <header className={styles.drawerHeader}>
          <div>
            <span className={styles.cardEyebrow}>COMMANDE GOUVERNÉE</span>
            <h2 id="executive-command-title">{COMMAND_LABELS[command]}</h2>
          </div>
          <button className={styles.iconButton} onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </header>
        <div className={styles.drawerBody}>
          {error ? <div className={styles.error}>{error}</div> : null}
          <div className={styles.formGrid}>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.fieldLabel}>Titre / objet</span>
              <input className={styles.fieldInput} value={title} onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)} placeholder="Décision, intervention ou snapshot" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Propriétaire</span>
              <input className={styles.fieldInput} value={owner} onChange={(event: ChangeEvent<HTMLInputElement>) => setOwner(event.target.value)} placeholder="Revenue Manager" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Valeur affectée (Dh)</span>
              <input className={styles.fieldInput} inputMode="decimal" value={amountMad} onChange={(event: ChangeEvent<HTMLInputElement>) => setAmountMad(event.target.value)} placeholder="0" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Échéance</span>
              <input className={styles.fieldInput} type="datetime-local" value={dueAt} onChange={(event: ChangeEvent<HTMLInputElement>) => setDueAt(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Horizon</span>
              <select className={styles.fieldSelect} value={horizon} onChange={(event: ChangeEvent<HTMLSelectElement>) => setHorizon(event.target.value)}>
                <option value="today">Aujourd'hui</option>
                <option value="next_7_days">7 prochains jours</option>
                <option value="current_month">Mois courant</option>
                <option value="rolling_90">90 jours</option>
                <option value="current_quarter">Trimestre courant</option>
              </select>
            </label>
            {isDecision ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Décision</span>
                <select className={styles.fieldSelect} value={decision} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDecision(event.target.value)}>
                  <option value="approved">Approuver</option>
                  <option value="approved_with_conditions">Approuver avec conditions</option>
                  <option value="rejected">Rejeter</option>
                  <option value="deferred">Différer</option>
                  <option value="returned_for_analysis">Retourner pour analyse</option>
                  <option value="escalated">Escalader</option>
                </select>
              </label>
            ) : null}
            {isScenario ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Scénario</span>
                <select className={styles.fieldSelect} value={scenarioType} onChange={(event: ChangeEvent<HTMLSelectElement>) => setScenarioType(event.target.value)}>
                  <option value="baseline">Baseline</option>
                  <option value="conservative">Conservateur</option>
                  <option value="expected">Attendu</option>
                  <option value="best_case">Best case</option>
                  <option value="collection_delay">Retard collecte</option>
                  <option value="partner_underperformance">Sous-performance partenaire</option>
                  <option value="campaign_underperformance">Sous-performance campagne</option>
                  <option value="expansion">Expansion</option>
                </select>
              </label>
            ) : null}
            {isBriefing ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Période briefing</span>
                <select className={styles.fieldSelect} value={briefingType} onChange={(event: ChangeEvent<HTMLSelectElement>) => setBriefingType(event.target.value)}>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </label>
            ) : null}
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.fieldLabel}>Motif, analyse ou hypothèses</span>
              <textarea className={styles.fieldTextArea} value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} placeholder="Contexte vérifiable, conséquence de l'inaction et résultat attendu." />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.fieldLabel}>Référence de preuve</span>
              <input className={styles.fieldInput} value={evidenceReference} onChange={(event: ChangeEvent<HTMLInputElement>) => setEvidenceReference(event.target.value)} placeholder="Document, événement, dossier ou URL interne" />
            </label>
          </div>
          <div className={styles.drawerFooter}>
            <button className={styles.secondaryButton} onClick={onClose}>Annuler</button>
            <button className={styles.primaryButton} onClick={() => void submit()} disabled={saving}>
              {saving ? <Loader2 size={16} /> : <CheckCircle2 size={16} />}
              Confirmer la commande
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
