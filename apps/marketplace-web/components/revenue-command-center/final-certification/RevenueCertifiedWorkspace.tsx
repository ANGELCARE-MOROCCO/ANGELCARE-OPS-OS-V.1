"use client"

import Image from "next/image"
import Link from "next/link"
import { ChangeEvent, CSSProperties, FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Blocks,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Command,
  Database,
  FileCheck2,
  FilePlus2,
  Filter,
  Gauge,
  Globe2,
  Layers3,
  Loader2,
  MapPinned,
  Megaphone,
  Network,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react"
import styles from "./RevenueCertifiedWorkspace.module.css"

type WorkspaceProps = {
  workspace?: string
  recordId?: string
  mode?: string
  pageKey?: string
  title?: string
  subtitle?: string
}

type RevenueRecord = {
  id?: string
  title?: string
  description?: string | null
  module_key?: string
  page_key?: string
  record_type?: string
  owner_name?: string | null
  status?: string
  priority?: string
  risk_level?: string
  value_mad?: number | string
  due_at?: string | null
  updated_at?: string | null
  metadata?: Record<string, unknown> | null
  [key: string]: unknown
}

type Pulse = {
  total?: number
  open?: number
  active?: number
  done?: number
  overdue?: number
  highRisk?: number
  escalated?: number
  totalValue?: number
  weightedValue?: number
  approvalPending?: number
  byModule?: Record<string, number>
  byOwner?: Record<string, number>
  byStatus?: Record<string, number>
  byRisk?: Record<string, number>
  recentActivity?: Array<Record<string, unknown>>
}

type ApiState = "idle" | "loading" | "ready" | "error"

type WorkspaceContract = {
  key: string
  title: string
  eyebrow: string
  mission: string
  owner: string
  moduleKey: string
  icon: ReactNode
  accent: string
}

const contracts: Record<string, WorkspaceContract> = {
  automation: {
    key: "automation",
    title: "Automation Revenue",
    eyebrow: "ORCHESTRATION & CONTRÔLE",
    mission: "Gouverner les règles, déclencheurs, chaînes de récupération et exceptions qui soutiennent l’exécution commerciale.",
    owner: "Revenue Operations",
    moduleKey: "automation",
    icon: <Workflow />,
    accent: "violet",
  },
  businessDevelopment: {
    key: "businessDevelopment",
    title: "Business Development Command",
    eyebrow: "CRÉATION D’OPPORTUNITÉS",
    mission: "Transformer les territoires, comptes cibles et signaux marché en initiatives commerciales détenues et mesurables.",
    owner: "Business Development Lead",
    moduleKey: "business-development",
    icon: <BriefcaseBusiness />,
    accent: "blue",
  },
  campaigns: {
    key: "campaigns",
    title: "Campaign Revenue Command",
    eyebrow: "PORTEFEUILLE CAMPAGNES",
    mission: "Piloter les campagnes comme des investissements commerciaux reliés aux opportunités, coûts, risques et revenus attribués.",
    owner: "Growth & Revenue",
    moduleKey: "campaigns",
    icon: <Megaphone />,
    accent: "red",
  },
  campaignBoard: {
    key: "campaignBoard",
    title: "Campaign Execution Board",
    eyebrow: "FLUX & RESPONSABILITÉS",
    mission: "Visualiser la progression des campagnes, leurs blocages, propriétaires, échéances et décisions de récupération.",
    owner: "Campaign Operations",
    moduleKey: "campaigns",
    icon: <Layers3 />,
    accent: "orange",
  },
  campaignNew: {
    key: "campaignNew",
    title: "Constitution de campagne",
    eyebrow: "NOUVEL INVESTISSEMENT COMMERCIAL",
    mission: "Constituer une campagne complète avec objectif, cible, budget, propriétaire, période et définition du succès.",
    owner: "Growth Lead",
    moduleKey: "campaigns",
    icon: <FilePlus2 />,
    accent: "green",
  },
  campaignDetail: {
    key: "campaignDetail",
    title: "Dossier campagne",
    eyebrow: "IDENTITÉ, VALEUR & RISQUE",
    mission: "Inspecter une campagne précise, son état, ses responsabilités, son exposition et ses prochaines actions.",
    owner: "Campaign Owner",
    moduleKey: "campaigns",
    icon: <FileCheck2 />,
    accent: "blue",
  },
  campaignAssets: {
    key: "campaignAssets",
    title: "Campaign Asset Control",
    eyebrow: "PREUVES & MATÉRIAUX",
    mission: "Contrôler les actifs, documents, liens de preuve et exigences de disponibilité avant activation commerciale.",
    owner: "Campaign Production",
    moduleKey: "campaigns",
    icon: <Database />,
    accent: "violet",
  },
  campaignExecution: {
    key: "campaignExecution",
    title: "Campaign Execution Runway",
    eyebrow: "COMMANDES & CHECKPOINTS",
    mission: "Ordonner les actions de lancement, suivi, correction et clôture sans perdre la responsabilité ni les preuves.",
    owner: "Campaign Operations",
    moduleKey: "campaigns",
    icon: <Rocket />,
    accent: "red",
  },
  campaignPerformance: {
    key: "campaignPerformance",
    title: "Campaign Performance Intelligence",
    eyebrow: "ATTRIBUTION & APPRENTISSAGE",
    mission: "Comparer coût, progression, opportunités attribuées et valeur réalisée sans confondre signal marketing et revenu confirmé.",
    owner: "Revenue Analytics",
    moduleKey: "campaigns",
    icon: <BarChart3 />,
    accent: "green",
  },
  cockpit: {
    key: "cockpit",
    title: "Revenue Cockpit",
    eyebrow: "VUE OPÉRATIONNELLE COMPACTE",
    mission: "Donner une lecture immédiate du travail actif, de la valeur exposée, des échéances et des actions prioritaires.",
    owner: "Revenue Operations",
    moduleKey: "hq",
    icon: <Gauge />,
    accent: "blue",
  },
  "elite-command": {
    key: "elite-command",
    title: "Elite Revenue Command",
    eyebrow: "INTERVENTION HAUTE PRIORITÉ",
    mission: "Concentrer les dossiers critiques, les décisions de direction et les actions qui protègent le plus de valeur.",
    owner: "Executive Revenue Office",
    moduleKey: "hq",
    icon: <ShieldCheck />,
    accent: "red",
  },
  growth: {
    key: "growth",
    title: "Growth Command",
    eyebrow: "EXPÉRIMENTATION & ACCÉLÉRATION",
    mission: "Organiser les initiatives de croissance, hypothèses, propriétaires, échéances et résultats commerciaux observables.",
    owner: "Growth Lead",
    moduleKey: "growth",
    icon: <Sparkles />,
    accent: "violet",
  },
  "leads-impact": {
    key: "leads-impact",
    title: "Lead Impact Intelligence",
    eyebrow: "SOURCE, QUALITÉ & CONVERSION",
    mission: "Évaluer l’impact réel des sources de leads, leurs risques et leur contribution au pipeline sans inventer l’attribution.",
    owner: "Growth Analyst",
    moduleKey: "prospects",
    icon: <Target />,
    accent: "green",
  },
  "market-mapping": {
    key: "market-mapping",
    title: "Market Mapping",
    eyebrow: "TERRITOIRES & COUVERTURE",
    mission: "Cartographier les comptes, zones, propriétaires et lacunes de couverture à partir des enregistrements commerciaux existants.",
    owner: "Market Intelligence",
    moduleKey: "market-mapping",
    icon: <MapPinned />,
    accent: "blue",
  },
  "master-command": {
    key: "master-command",
    title: "Master Revenue Command",
    eyebrow: "ORCHESTRATION TRANSVERSE",
    mission: "Relier exécution, risque, valeur, approbations et interventions dans une vue de direction sans dupliquer les systèmes sources.",
    owner: "Revenue Director",
    moduleKey: "hq",
    icon: <Command />,
    accent: "violet",
  },
  myWork: {
    key: "myWork",
    title: "Mon travail Revenue",
    eyebrow: "EXÉCUTION PERSONNELLE",
    mission: "Présenter les dossiers attribués, urgences, blocages et actions de clôture du collaborateur connecté.",
    owner: "Utilisateur connecté",
    moduleKey: "tasks",
    icon: <UserCheck />,
    accent: "green",
  },
  notifications: {
    key: "notifications",
    title: "Revenue Signal Center",
    eyebrow: "ALERTES & ESCALADES",
    mission: "Centraliser les alertes persistées, leur gravité, leur propriétaire et leur résolution opérationnelle.",
    owner: "Revenue Operations",
    moduleKey: "notifications",
    icon: <Bell />,
    accent: "orange",
  },
  "system-activation": {
    key: "system-activation",
    title: "Revenue Activation Control",
    eyebrow: "PRÉPARATION & REPLAY",
    mission: "Vérifier les dépendances, sources, règles et états requis avant l’activation ou la relance d’un workflow Revenue.",
    owner: "Revenue Automation",
    moduleKey: "system-activation",
    icon: <Zap />,
    accent: "red",
  },
}

const money = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" })

function norm(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function formatMoney(value: unknown) {
  const number = Number(value ?? 0)
  return `${money.format(Number.isFinite(number) ? number : 0)} Dh`
}

function formatDate(value: unknown) {
  if (!value) return "Non définie"
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? "Non définie" : dateFmt.format(date)
}

function recordRisk(record: RevenueRecord) {
  const risk = norm(record.risk_level)
  if (risk === "critical" || risk === "high") return "critical"
  if (record.due_at && new Date(record.due_at).getTime() < Date.now() && !["done", "won", "archived"].includes(norm(record.status))) return "warning"
  return "stable"
}

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Requête impossible (${response.status})`)
  return payload
}

export default function RevenueCertifiedWorkspace(props: WorkspaceProps) {
  const key = props.workspace || props.mode || props.pageKey || "cockpit"
  const contract = contracts[key] || contracts.cockpit
  const [state, setState] = useState<ApiState>("idle")
  const [records, setRecords] = useState<RevenueRecord[]>([])
  const [pulse, setPulse] = useState<Pulse>({})
  const [campaigns, setCampaigns] = useState<RevenueRecord[]>([])
  const [notifications, setNotifications] = useState<RevenueRecord[]>([])
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [mutation, setMutation] = useState("")

  const load = useCallback(async () => {
    setState("loading")
    setError("")
    try {
      const requests: Promise<unknown>[] = [
        jsonRequest("/api/revenue-command-center/v12/pulse"),
        jsonRequest(`/api/revenue-command-center/v12/records?module=${encodeURIComponent(contract.moduleKey)}`),
      ]
      if (key.startsWith("campaign")) requests.push(jsonRequest("/api/revenue-command-center/campaigns"))
      if (key === "notifications") requests.push(jsonRequest("/api/revenue-command-center/notifications"))
      const payloads = (await Promise.all(requests)) as Array<Record<string, unknown>>
      const pulsePayload = payloads[0] as { pulse?: Pulse }
      const recordPayload = payloads[1] as { records?: RevenueRecord[] }
      setPulse(pulsePayload.pulse || {})
      setRecords(recordPayload.records || [])
      let cursor = 2
      if (key.startsWith("campaign")) {
        const campaignPayload = payloads[cursor++] as Record<string, unknown>
        const list = Object.values(campaignPayload).find((value) => Array.isArray(value))
        setCampaigns(Array.isArray(list) ? (list as RevenueRecord[]) : [])
      }
      if (key === "notifications") {
        const notificationPayload = payloads[cursor] as Record<string, unknown>
        const list = Object.values(notificationPayload).find((value) => Array.isArray(value))
        setNotifications(Array.isArray(list) ? (list as RevenueRecord[]) : [])
      }
      setState("ready")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger le workspace.")
      setState("error")
    }
  }, [contract.moduleKey, key])

  useEffect(() => {
    void load()
  }, [load])

  const activeRecords = useMemo(() => {
    const source = key.startsWith("campaign") && campaigns.length ? campaigns : key === "notifications" && notifications.length ? notifications : records
    const needle = query.trim().toLowerCase()
    if (!needle) return source
    return source.filter((record) => [record.title, record.description, record.owner_name, record.status, record.priority].some((value) => String(value ?? "").toLowerCase().includes(needle)))
  }, [campaigns, key, notifications, query, records])

  const selectedRecord = useMemo(() => {
    if (!props.recordId) return activeRecords[0]
    return activeRecords.find((record) => String(record.id) === String(props.recordId)) || activeRecords[0]
  }, [activeRecords, props.recordId])

  const actionRecord = async (record: RevenueRecord, action_key: string) => {
    if (!record.id) return
    setMutation(`${record.id}:${action_key}`)
    setError("")
    try {
      await jsonRequest("/api/revenue-command-center/v12/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "action", id: record.id, action_key }),
      })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action non enregistrée.")
    } finally {
      setMutation("")
    }
  }

  const runAutomation = async () => {
    setMutation("automation")
    setError("")
    try {
      await jsonRequest("/api/revenue-command-center/automation/run", { method: "POST" })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Moteur non exécuté.")
    } finally {
      setMutation("")
    }
  }

  const createCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get("title") || "").trim()
    if (!title) return
    setMutation("campaign-create")
    setError("")
    try {
      await jsonRequest("/api/revenue-command-center/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: String(form.get("description") || "").trim() || null,
          owner_name: String(form.get("owner") || "").trim() || null,
          status: "draft",
          priority: String(form.get("priority") || "medium"),
          budget_mad: Number(form.get("budget") || 0),
          start_at: String(form.get("start") || "") || null,
          end_at: String(form.get("end") || "") || null,
        }),
      })
      event.currentTarget.reset()
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Campagne non créée.")
    } finally {
      setMutation("")
    }
  }

  return (
    <main className={`${styles.page} ${styles[`accent_${contract.accent}`] || ""}`}>
      <header className={styles.hero}>
        <div className={styles.brandLine}>
          <Image src="/logo.png" alt="AngelCare" width={142} height={42} className={styles.logo} priority />
          <span className={styles.brandDivider} />
          <span>ANGELCARE · SANILA REVENUE OS</span>
          <span className={styles.certifiedBadge}><ShieldCheck /> FINAL CERTIFICATION</span>
        </div>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.eyebrow}>{contract.eyebrow}</div>
            <div className={styles.titleLine}><span className={styles.heroIcon}>{contract.icon}</span><h1>{props.title || contract.title}</h1></div>
            <p>{props.subtitle || contract.mission}</p>
            <div className={styles.metaLine}>
              <span><Users /> Autorité: {contract.owner}</span>
              <span><Database /> Source: API Revenue existante</span>
              <span><ShieldCheck /> Aucune donnée simulée</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <button type="button" onClick={() => void load()} className={styles.secondaryButton} disabled={state === "loading"}>
              {state === "loading" ? <Loader2 className={styles.spin} /> : <RefreshCw />} Actualiser
            </button>
            <Link href="/revenue-command-center" className={styles.primaryButton}><Command /> Commandement central</Link>
          </div>
        </div>
      </header>

      {error ? <div className={styles.errorBanner} role="alert"><AlertTriangle /><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Fermer"><XCircle /></button></div> : null}

      <section className={styles.kpiGrid} aria-label="Indicateurs Revenue">
        <Kpi label="Portefeuille" value={String(pulse.total ?? activeRecords.length)} detail="enregistrements observés" icon={<Layers3 />} />
        <Kpi label="Actifs" value={String(pulse.active ?? activeRecords.filter((r) => ["active", "in_progress", "qualified"].includes(norm(r.status))).length)} detail="travail actuellement ouvert" icon={<Activity />} />
        <Kpi label="Exposition" value={formatMoney(pulse.totalValue)} detail={`pondérée ${formatMoney(pulse.weightedValue)}`} icon={<CircleDollarSign />} />
        <Kpi label="À protéger" value={String((pulse.overdue ?? 0) + (pulse.highRisk ?? 0))} detail="retards + risques élevés" icon={<AlertTriangle />} critical={(pulse.overdue ?? 0) + (pulse.highRisk ?? 0) > 0} />
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search />
          <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher titre, propriétaire, statut…" />
        </label>
        <div className={styles.sourceState} data-state={state}><span />{state === "loading" ? "Synchronisation" : state === "error" ? "Source indisponible" : "Source synchronisée"}</div>
      </section>

      {state === "loading" && !activeRecords.length ? <LoadingState /> : renderWorkspace({ key, contract, records: activeRecords, selectedRecord, mutation, actionRecord, runAutomation, createCampaign, recordId: props.recordId })}
    </main>
  )
}

type RenderContext = {
  key: string
  contract: WorkspaceContract
  records: RevenueRecord[]
  selectedRecord?: RevenueRecord
  mutation: string
  actionRecord: (record: RevenueRecord, action: string) => Promise<void>
  runAutomation: () => Promise<void>
  createCampaign: (event: FormEvent<HTMLFormElement>) => Promise<void>
  recordId?: string
}

function renderWorkspace(context: RenderContext) {
  switch (context.key) {
    case "campaignNew": return <CampaignCreate context={context} />
    case "campaignBoard": return <CampaignBoard context={context} />
    case "campaignDetail": return <CampaignDossier context={context} mode="identity" />
    case "campaignAssets": return <CampaignDossier context={context} mode="assets" />
    case "campaignExecution": return <CampaignDossier context={context} mode="execution" />
    case "campaignPerformance": return <CampaignDossier context={context} mode="performance" />
    case "campaigns": return <CampaignPortfolio context={context} />
    case "automation": return <AutomationCommand context={context} />
    case "system-activation": return <ActivationControl context={context} />
    case "businessDevelopment": return <BusinessDevelopment context={context} />
    case "growth": return <GrowthCommand context={context} />
    case "leads-impact": return <LeadImpact context={context} />
    case "market-mapping": return <MarketMapping context={context} />
    case "myWork": return <MyWork context={context} />
    case "notifications": return <NotificationCenter context={context} />
    case "elite-command": return <ExecutiveCommand context={context} intensity="elite" />
    case "master-command": return <ExecutiveCommand context={context} intensity="master" />
    case "cockpit":
    default: return <RevenueCockpit context={context} />
  }
}

function RevenueCockpit({ context }: { context: RenderContext }) {
  const urgent = context.records.filter((record) => recordRisk(record) !== "stable").slice(0, 6)
  const active = context.records.filter((record) => ["active", "open", "in_progress", "qualified"].includes(norm(record.status))).slice(0, 7)
  return (
    <div className={styles.twoColumnWide}>
      <section className={styles.panel}>
        <PanelHeading icon={<Gauge />} title="Priorités du jour" subtitle="Une lecture compacte des dossiers qui exigent une action réelle." />
        <RecordList records={active} empty="Aucune priorité active dans la source Revenue." actionRecord={context.actionRecord} mutation={context.mutation} />
      </section>
      <aside className={styles.stack}>
        <section className={styles.panel}>
          <PanelHeading icon={<AlertTriangle />} title="Exposition immédiate" subtitle="Retards et risques élevés, sans score inventé." />
          <CompactRisk records={urgent} />
        </section>
        <NavigationMatrix />
      </aside>
    </div>
  )
}

function ExecutiveCommand({ context, intensity }: { context: RenderContext; intensity: "elite" | "master" }) {
  const critical = context.records.filter((record) => ["critical", "high"].includes(norm(record.risk_level)) || norm(record.status) === "escalated")
  const unowned = context.records.filter((record) => !record.owner_name)
  const decisions = context.records.filter((record) => ["approval", "decision", "intervention"].some((term) => norm(record.record_type).includes(term)))
  return (
    <div className={styles.commandLayout}>
      <section className={styles.commandDecisionPanel}>
        <PanelHeading icon={intensity === "elite" ? <ShieldCheck /> : <Command />} title={intensity === "elite" ? "Interventions à haute valeur" : "Orchestration transverse"} subtitle="Priorité donnée à l’autorité, à la valeur exposée et au propriétaire de la prochaine décision." />
        <RecordList records={(critical.length ? critical : context.records).slice(0, 8)} empty="Aucun dossier critique observé." actionRecord={context.actionRecord} mutation={context.mutation} executive />
      </section>
      <section className={styles.commandRail}>
        <MetricBlock label="Sans propriétaire" value={unowned.length} icon={<Users />} warning={unowned.length > 0} />
        <MetricBlock label="Décisions observées" value={decisions.length} icon={<ClipboardCheck />} />
        <MetricBlock label="Dossiers critiques" value={critical.length} icon={<AlertTriangle />} warning={critical.length > 0} />
        <NavigationMatrix compact />
      </section>
    </div>
  )
}

function AutomationCommand({ context }: { context: RenderContext }) {
  const exceptions = context.records.filter((record) => ["escalated", "blocked", "failed"].includes(norm(record.status)) || recordRisk(record) === "critical")
  return (
    <div className={styles.automationLayout}>
      <section className={styles.panel}>
        <PanelHeading icon={<Workflow />} title="Chaînes et exceptions" subtitle="Les règles existantes restent la source d’autorité; l’exécution ne démarre qu’après une action explicite." action={<button className={styles.primaryButton} type="button" onClick={() => void context.runAutomation()} disabled={context.mutation === "automation"}>{context.mutation === "automation" ? <Loader2 className={styles.spin} /> : <Play />} Exécuter le moteur</button>} />
        <div className={styles.flowRail}>
          {["Détecter", "Qualifier", "Attribuer", "Exécuter", "Vérifier", "Escalader"].map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong>{index < 5 ? <ChevronRight /> : null}</div>)}
        </div>
        <RecordList records={context.records.slice(0, 8)} empty="Aucun enregistrement Automation disponible." actionRecord={context.actionRecord} mutation={context.mutation} />
      </section>
      <aside className={styles.stack}>
        <section className={styles.panel}><PanelHeading icon={<AlertTriangle />} title="Exceptions" subtitle="Aucune résolution n’est simulée." /><CompactRisk records={exceptions.slice(0, 8)} /></section>
        <section className={styles.panel}><PanelHeading icon={<ShieldCheck />} title="Garde-fous" subtitle="Les mutations passent par les APIs existantes." /><CheckRows rows={["Action explicite requise", "Journalisation Revenue", "Erreur visible", "Aucun succès local simulé", "Récupération par propriétaire"]} /></section>
      </aside>
    </div>
  )
}

function ActivationControl({ context }: { context: RenderContext }) {
  const readiness = [
    { label: "Sources Revenue", ready: context.records.length > 0, detail: context.records.length ? `${context.records.length} enregistrements observés` : "Aucune donnée retournée" },
    { label: "Propriétaires", ready: context.records.every((record) => Boolean(record.owner_name)) && context.records.length > 0, detail: `${context.records.filter((record) => !record.owner_name).length} sans propriétaire` },
    { label: "Échéances", ready: context.records.every((record) => !record.due_at || !Number.isNaN(new Date(record.due_at).getTime())), detail: "Validation déterministe des dates" },
    { label: "Risques critiques", ready: !context.records.some((record) => norm(record.risk_level) === "critical"), detail: `${context.records.filter((record) => norm(record.risk_level) === "critical").length} critiques` },
  ]
  return (
    <div className={styles.activationLayout}>
      <section className={styles.activationRail}>
        <PanelHeading icon={<Rocket />} title="Runway d’activation" subtitle="Une activation n’est prête que lorsque ses dépendances observables sont satisfaites." />
        {readiness.map((item, index) => <div className={styles.readinessStep} data-ready={item.ready} key={item.label}><span>{index + 1}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div>{item.ready ? <CheckCircle2 /> : <AlertTriangle />}</div>)}
      </section>
      <section className={styles.panel}>
        <PanelHeading icon={<Database />} title="Dossiers de préparation" subtitle="Les actions restent gouvernées par les enregistrements persistés." />
        <RecordList records={context.records.slice(0, 10)} empty="Aucun dossier d’activation observé." actionRecord={context.actionRecord} mutation={context.mutation} />
      </section>
    </div>
  )
}

function BusinessDevelopment({ context }: { context: RenderContext }) {
  const groups = groupRecords(context.records, (record) => norm(record.status) || "open")
  return (
    <div className={styles.bdLayout}>
      <section className={styles.targetMap}>
        <PanelHeading icon={<Target />} title="Portfolio de développement" subtitle="Initiatives, valeur, propriétaires et échéances commerciales." />
        <div className={styles.laneGrid}>{Object.entries(groups).slice(0, 4).map(([status, records]) => <div className={styles.lane} key={status}><div className={styles.laneHead}><strong>{humanStatus(status)}</strong><span>{records.length}</span></div>{records.slice(0, 5).map((record) => <RecordCard key={String(record.id || record.title)} record={record} />)}{!records.length ? <EmptyMini /> : null}</div>)}</div>
      </section>
      <aside className={styles.stack}>
        <section className={styles.panel}><PanelHeading icon={<Globe2 />} title="Couverture" subtitle="Répartition par propriétaire observé." /><OwnerDistribution records={context.records} /></section>
        <NavigationMatrix compact />
      </aside>
    </div>
  )
}

function GrowthCommand({ context }: { context: RenderContext }) {
  const experiments = context.records.filter((record) => ["experiment", "growth", "campaign"].some((term) => norm(record.record_type).includes(term)))
  return (
    <div className={styles.growthLayout}>
      <section className={styles.growthCanvas}>
        <PanelHeading icon={<Sparkles />} title="Portefeuille d’expérimentation" subtitle="Hypothèse, propriétaire, échéance, exposition et résultat observable." />
        <div className={styles.experimentGrid}>{(experiments.length ? experiments : context.records).slice(0, 9).map((record) => <ExperimentCard key={String(record.id || record.title)} record={record} />)}</div>
        {!context.records.length ? <EmptyState title="Aucune initiative Growth" detail="La source Revenue n’a retourné aucune initiative pour ce module." /> : null}
      </section>
      <section className={styles.panel}><PanelHeading icon={<BarChart3 />} title="Discipline de portefeuille" subtitle="Statuts et risques observés, sans conversion inventée." /><StatusBars records={context.records} /></section>
    </div>
  )
}

function LeadImpact({ context }: { context: RenderContext }) {
  const byOwner = groupRecords(context.records, (record) => String(record.owner_name || "Non attribué"))
  return (
    <div className={styles.impactLayout}>
      <section className={styles.panel}>
        <PanelHeading icon={<Target />} title="Matrice impact × qualité" subtitle="La valeur et le risque proviennent des enregistrements Revenue; aucune attribution sémantique n’est fabriquée." />
        <div className={styles.impactMatrix}>{context.records.slice(0, 24).map((record) => <div className={styles.impactDot} data-risk={recordRisk(record)} key={String(record.id || record.title)} style={{ "--impact": `${Math.min(92, 20 + Math.log10(Math.max(1, Number(record.value_mad || 1))) * 15)}%` } as CSSProperties}><span>{record.title || "Lead"}</span><small>{formatMoney(record.value_mad)}</small></div>)}</div>
        {!context.records.length ? <EmptyState title="Aucun lead observable" detail="Le module Prospects n’a retourné aucun enregistrement." /> : null}
      </section>
      <aside className={styles.panel}><PanelHeading icon={<Users />} title="Responsabilité" subtitle="Distribution des leads par propriétaire déclaré." /><div className={styles.ownerList}>{Object.entries(byOwner).slice(0, 10).map(([owner, rows]) => <div key={owner}><span>{owner}</span><strong>{rows.length}</strong></div>)}</div></aside>
    </div>
  )
}

function MarketMapping({ context }: { context: RenderContext }) {
  const byOwner = Object.entries(groupRecords(context.records, (record) => String(record.owner_name || "Zone non attribuée")))
  return (
    <div className={styles.mapLayout}>
      <section className={styles.mapCanvas}>
        <PanelHeading icon={<MapPinned />} title="Carte de couverture commerciale" subtitle="Une représentation institutionnelle des zones et propriétaires disponibles dans les données." />
        <div className={styles.territoryGrid}>{byOwner.slice(0, 12).map(([owner, rows], index) => <div className={styles.territory} key={owner} data-tone={index % 4}><div className={styles.territoryIcon}><MapPinned /></div><strong>{owner}</strong><span>{rows.length} dossier{rows.length > 1 ? "s" : ""}</span><small>{formatMoney(rows.reduce((sum, row) => sum + Number(row.value_mad || 0), 0))}</small></div>)}</div>
        {!context.records.length ? <EmptyState title="Aucune couverture enregistrée" detail="Ajoutez ou attribuez des dossiers dans la source Revenue pour matérialiser la couverture." /> : null}
      </section>
      <aside className={styles.panel}><PanelHeading icon={<Network />} title="Lacunes observables" subtitle="Dossiers non attribués et risques sans propriétaire." /><CompactRisk records={context.records.filter((record) => !record.owner_name || recordRisk(record) !== "stable").slice(0, 10)} /></aside>
    </div>
  )
}

function MyWork({ context }: { context: RenderContext }) {
  const today = context.records.filter((record) => !record.due_at || new Date(record.due_at).getTime() <= Date.now() + 86400000 * 2)
  return (
    <div className={styles.myWorkLayout}>
      <section className={styles.todayPanel}>
        <PanelHeading icon={<CalendarClock />} title="À exécuter maintenant" subtitle="Priorité aux échéances proches, blocages et actions actives." />
        <RecordList records={(today.length ? today : context.records).slice(0, 10)} empty="Aucun travail attribué dans la source Revenue." actionRecord={context.actionRecord} mutation={context.mutation} />
      </section>
      <aside className={styles.stack}>
        <section className={styles.panel}><PanelHeading icon={<ClipboardCheck />} title="Discipline personnelle" subtitle="États observés dans vos dossiers." /><StatusBars records={context.records} /></section>
        <NavigationMatrix compact />
      </aside>
    </div>
  )
}

function NotificationCenter({ context }: { context: RenderContext }) {
  const groups = groupRecords(context.records, (record) => recordRisk(record))
  return (
    <div className={styles.notificationLayout}>
      <section className={styles.signalRail}>
        <PanelHeading icon={<Bell />} title="File de signaux" subtitle="Chaque alerte conserve son état, sa gravité et son action suivante." />
        <RecordList records={context.records.slice(0, 14)} empty="Aucune notification persistée." actionRecord={context.actionRecord} mutation={context.mutation} />
      </section>
      <aside className={styles.signalSummary}>
        <MetricBlock label="Critiques" value={(groups.critical || []).length} warning={(groups.critical || []).length > 0} icon={<AlertTriangle />} />
        <MetricBlock label="À surveiller" value={(groups.warning || []).length} icon={<Bell />} />
        <MetricBlock label="Stables" value={(groups.stable || []).length} icon={<CheckCircle2 />} />
        <section className={styles.panel}><PanelHeading icon={<ShieldCheck />} title="Doctrine" subtitle="Aucun signal n’est considéré résolu sans mutation persistée." /><CheckRows rows={["Propriétaire visible", "Sévérité explicite", "Action traçable", "Échec visible", "Aucune résolution locale"]} /></section>
      </aside>
    </div>
  )
}

function CampaignPortfolio({ context }: { context: RenderContext }) {
  return (
    <div className={styles.campaignPortfolio}>
      <section className={styles.campaignRegister}>
        <PanelHeading icon={<Megaphone />} title="Registre des campagnes" subtitle="Un registre commercial relié à la valeur, au risque, au propriétaire et à la prochaine action." action={<Link className={styles.primaryButton} href="/revenue-command-center/campaigns/new"><Plus /> Constituer</Link>} />
        <RecordList records={context.records.slice(0, 20)} empty="Aucune campagne persistée." actionRecord={context.actionRecord} mutation={context.mutation} campaign />
      </section>
      <aside className={styles.stack}>
        <section className={styles.panel}><PanelHeading icon={<BarChart3 />} title="Répartition" subtitle="Statuts observés dans la source campagne." /><StatusBars records={context.records} /></section>
        <section className={styles.panel}><PanelHeading icon={<CalendarClock />} title="Échéances" subtitle="Campagnes possédant une date exploitable." /><DateQueue records={context.records} /></section>
      </aside>
    </div>
  )
}

function CampaignBoard({ context }: { context: RenderContext }) {
  const groups = groupRecords(context.records, (record) => norm(record.status) || "draft")
  const preferred = ["draft", "planned", "active", "paused", "completed"]
  const keys = [...preferred.filter((key) => groups[key]), ...Object.keys(groups).filter((key) => !preferred.includes(key))].slice(0, 5)
  return (
    <section className={styles.boardPanel}>
      <PanelHeading icon={<Layers3 />} title="Board d’exécution" subtitle="Les colonnes reflètent les statuts réellement présents dans la source." />
      <div className={styles.board}>{keys.map((status) => <div className={styles.boardColumn} key={status}><div className={styles.boardColumnHead}><strong>{humanStatus(status)}</strong><span>{groups[status].length}</span></div>{groups[status].slice(0, 7).map((record) => <RecordCard record={record} key={String(record.id || record.title)} />)}</div>)}</div>
      {!context.records.length ? <EmptyState title="Board vide" detail="Aucune campagne n’est actuellement disponible." /> : null}
    </section>
  )
}

function CampaignCreate({ context }: { context: RenderContext }) {
  return (
    <div className={styles.createLayout}>
      <form className={styles.createForm} onSubmit={(event: FormEvent<HTMLFormElement>) => void context.createCampaign(event)}>
        <PanelHeading icon={<FilePlus2 />} title="Constitution commerciale" subtitle="La création est persistée par l’API Campaigns existante." />
        <label><span>Nom de campagne *</span><input name="title" required placeholder="Ex. Rentrée scolaire Rabat 2026" /></label>
        <label><span>Objectif et contexte</span><textarea name="description" rows={5} placeholder="Résultat attendu, audience, hypothèse commerciale…" /></label>
        <div className={styles.formGrid}>
          <label><span>Propriétaire</span><input name="owner" placeholder="Nom du responsable" /></label>
          <label><span>Priorité</span><select name="priority" defaultValue="high"><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option></select></label>
          <label><span>Budget (Dh)</span><input name="budget" type="number" min="0" step="1" /></label>
          <label><span>Début</span><input name="start" type="date" /></label>
          <label><span>Fin</span><input name="end" type="date" /></label>
        </div>
        <div className={styles.formActions}><Link href="/revenue-command-center/campaigns" className={styles.secondaryButton}>Annuler</Link><button className={styles.primaryButton} disabled={context.mutation === "campaign-create"}>{context.mutation === "campaign-create" ? <Loader2 className={styles.spin} /> : <CheckCircle2 />} Enregistrer la campagne</button></div>
      </form>
      <aside className={styles.constitutionRail}>
        <PanelHeading icon={<ShieldCheck />} title="Gates de constitution" subtitle="La création ne vaut ni activation ni revenu réalisé." />
        <CheckRows rows={["Objectif documenté", "Propriétaire déclaré", "Période définie", "Budget distingué du revenu", "Attribution future à vérifier", "Activation séparée"]} />
      </aside>
    </div>
  )
}

function CampaignDossier({ context, mode }: { context: RenderContext; mode: "identity" | "assets" | "execution" | "performance" }) {
  const record = context.selectedRecord
  if (!record) return <EmptyState title="Campagne introuvable" detail="L’identifiant demandé n’est pas disponible dans la réponse Campaigns actuelle." />
  const title = record.title || "Campagne"
  const info = [
    ["Statut", humanStatus(record.status)],
    ["Propriétaire", String(record.owner_name || "Non attribué")],
    ["Priorité", humanStatus(record.priority)],
    ["Risque", humanStatus(record.risk_level)],
    ["Valeur observée", formatMoney(record.value_mad)],
    ["Échéance", formatDate(record.due_at)],
  ]
  const assets = extractReferences(record)
  return (
    <div className={styles.dossierLayout}>
      <section className={styles.dossierMain}>
        <div className={styles.dossierIdentity}><div><span>DOSSIER CAMPAGNE</span><h2>{title}</h2><p>{record.description || "Aucune description disponible dans la source actuelle."}</p></div><StatusPill value={record.status} /></div>
        {mode === "identity" ? <><div className={styles.infoGrid}>{info.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><AuditFacts record={record} /></> : null}
        {mode === "assets" ? <AssetControl assets={assets} /> : null}
        {mode === "execution" ? <ExecutionRunway record={record} actionRecord={context.actionRecord} mutation={context.mutation} /> : null}
        {mode === "performance" ? <PerformanceTruth record={record} /> : null}
      </section>
      <aside className={styles.stack}>
        <section className={styles.panel}><PanelHeading icon={<ArrowRight />} title="Navigation dossier" subtitle="Les sous-routes conservent le même identifiant." /><div className={styles.routeLinks}>{[
          ["Identité", ""], ["Actifs", "/assets"], ["Exécution", "/execution"], ["Performance", "/performance"],
        ].map(([label, suffix]) => <Link key={label} href={`/revenue-command-center/campaigns/${record.id}${suffix}`}><span>{label}</span><ArrowRight /></Link>)}</div></section>
        <section className={styles.panel}><PanelHeading icon={<AlertTriangle />} title="Vigilance" subtitle="Aucune performance n’est inventée à partir d’un simple statut." /><CheckRows rows={["Budget ≠ revenu", "Lead ≠ revenu", "Paiement confirmé ≠ réalisation", "Attribution ≤ revenu réel", "Preuve avant clôture"]} /></section>
      </aside>
    </div>
  )
}

function Kpi({ label, value, detail, icon, critical }: { label: string; value: string; detail: string; icon: ReactNode; critical?: boolean }) {
  return <article className={styles.kpi} data-critical={critical || undefined}><div>{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function PanelHeading({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle: string; action?: ReactNode }) {
  return <div className={styles.panelHeading}><div className={styles.panelIcon}>{icon}</div><div><h2>{title}</h2><p>{subtitle}</p></div>{action ? <div className={styles.panelAction}>{action}</div> : null}</div>
}

function RecordList({ records, empty, actionRecord, mutation, executive, campaign }: { records: RevenueRecord[]; empty: string; actionRecord: RenderContext["actionRecord"]; mutation: string; executive?: boolean; campaign?: boolean }) {
  if (!records.length) return <EmptyState title="Aucun enregistrement" detail={empty} />
  return <div className={styles.recordList}>{records.map((record) => <article className={styles.recordRow} data-risk={recordRisk(record)} key={String(record.id || record.title)}><div className={styles.recordRisk}><span /></div><div className={styles.recordBody}><div className={styles.recordTitleLine}><strong>{record.title || "Enregistrement Revenue"}</strong><StatusPill value={record.status} /></div><p>{record.description || `${humanStatus(record.record_type)} · ${record.owner_name || "Non attribué"}`}</p><div className={styles.recordMeta}><span><Users /> {record.owner_name || "Non attribué"}</span><span><CalendarClock /> {formatDate(record.due_at)}</span><span><CircleDollarSign /> {formatMoney(record.value_mad)}</span></div></div><div className={styles.recordActions}>{campaign && record.id ? <Link className={styles.iconButton} href={`/revenue-command-center/campaigns/${record.id}`} aria-label="Ouvrir le dossier"><ArrowRight /></Link> : null}<button type="button" className={styles.textButton} onClick={() => void actionRecord(record, executive ? "escalate" : "start")} disabled={!record.id || mutation.startsWith(`${record.id}:`)}>{mutation.startsWith(`${record.id}:`) ? <Loader2 className={styles.spin} /> : executive ? <AlertTriangle /> : <Play />}{executive ? "Escalader" : "Démarrer"}</button><button type="button" className={styles.textButton} onClick={() => void actionRecord(record, "complete")} disabled={!record.id || mutation.startsWith(`${record.id}:`)}><CheckCircle2 /> Clôturer</button></div></article>)}</div>
}

function RecordCard({ record }: { record: RevenueRecord }) {
  return <article className={styles.recordCard} data-risk={recordRisk(record)}><div><strong>{record.title || "Dossier"}</strong><StatusPill value={record.status} /></div><p>{record.description || "Aucune description."}</p><footer><span>{record.owner_name || "Non attribué"}</span><span>{formatDate(record.due_at)}</span></footer></article>
}

function ExperimentCard({ record }: { record: RevenueRecord }) {
  return <article className={styles.experimentCard}><div className={styles.experimentTop}><Sparkles /><StatusPill value={record.status} /></div><h3>{record.title || "Initiative Growth"}</h3><p>{record.description || "Hypothèse non documentée dans la source."}</p><div className={styles.experimentFacts}><span>Responsable<strong>{record.owner_name || "Non attribué"}</strong></span><span>Valeur observée<strong>{formatMoney(record.value_mad)}</strong></span><span>Échéance<strong>{formatDate(record.due_at)}</strong></span></div></article>
}

function CompactRisk({ records }: { records: RevenueRecord[] }) {
  if (!records.length) return <EmptyState title="Aucune exposition" detail="Aucun risque ou retard observable dans la source chargée." compact />
  return <div className={styles.riskList}>{records.map((record) => <div key={String(record.id || record.title)} data-risk={recordRisk(record)}><span /><div><strong>{record.title || "Dossier"}</strong><small>{record.owner_name || "Sans propriétaire"} · {formatDate(record.due_at)}</small></div><b>{formatMoney(record.value_mad)}</b></div>)}</div>
}

function NavigationMatrix({ compact }: { compact?: boolean }) {
  const links = [
    ["Prévisions", "/revenue-command-center/predictive", <BarChart3 />],
    ["Control Tower", "/revenue-command-center/control-tower", <ShieldCheck />],
    ["Tâches", "/revenue-command-center/tasks", <ClipboardCheck />],
    ["Prospects", "/revenue-command-center/prospects", <Target />],
    ["Campagnes", "/revenue-command-center/campaigns", <Megaphone />],
    ["Décisions", "/revenue-command-center/management", <Command />],
  ] as const
  return <section className={styles.panel}><PanelHeading icon={<Network />} title="Navigation Revenue" subtitle="Accès direct aux sources opérationnelles." /><div className={compact ? styles.navCompact : styles.navMatrix}>{links.map(([label, href, icon]) => <Link href={href} key={href}><span>{icon}</span><strong>{label}</strong><ArrowRight /></Link>)}</div></section>
}

function MetricBlock({ label, value, icon, warning }: { label: string; value: number; icon: ReactNode; warning?: boolean }) {
  return <div className={styles.metricBlock} data-warning={warning || undefined}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>
}

function CheckRows({ rows }: { rows: string[] }) {
  return <div className={styles.checkRows}>{rows.map((row) => <div key={row}><CheckCircle2 /><span>{row}</span></div>)}</div>
}

function OwnerDistribution({ records }: { records: RevenueRecord[] }) {
  const groups = Object.entries(groupRecords(records, (record) => String(record.owner_name || "Non attribué"))).sort((a, b) => b[1].length - a[1].length)
  if (!groups.length) return <EmptyState title="Aucun propriétaire" detail="Aucune responsabilité disponible." compact />
  const max = Math.max(...groups.map(([, rows]) => rows.length), 1)
  return <div className={styles.distribution}>{groups.slice(0, 8).map(([owner, rows]) => <div key={owner}><div><span>{owner}</span><strong>{rows.length}</strong></div><i><b style={{ width: `${(rows.length / max) * 100}%` }} /></i></div>)}</div>
}

function StatusBars({ records }: { records: RevenueRecord[] }) {
  const groups = Object.entries(groupRecords(records, (record) => norm(record.status) || "open")).sort((a, b) => b[1].length - a[1].length)
  if (!groups.length) return <EmptyState title="Aucun statut" detail="Aucun enregistrement à analyser." compact />
  const max = Math.max(...groups.map(([, rows]) => rows.length), 1)
  return <div className={styles.statusBars}>{groups.slice(0, 8).map(([status, rows]) => <div key={status}><span>{humanStatus(status)}</span><i><b style={{ width: `${(rows.length / max) * 100}%` }} /></i><strong>{rows.length}</strong></div>)}</div>
}

function DateQueue({ records }: { records: RevenueRecord[] }) {
  const dated = records.filter((record) => record.due_at).sort((a, b) => new Date(String(a.due_at)).getTime() - new Date(String(b.due_at)).getTime()).slice(0, 7)
  if (!dated.length) return <EmptyState title="Aucune échéance" detail="Aucune date exploitable dans les campagnes chargées." compact />
  return <div className={styles.dateQueue}>{dated.map((record) => <div key={String(record.id || record.title)}><CalendarClock /><span><strong>{record.title || "Campagne"}</strong><small>{record.owner_name || "Non attribué"}</small></span><b>{formatDate(record.due_at)}</b></div>)}</div>
}

function StatusPill({ value }: { value: unknown }) {
  const normalized = norm(value) || "unknown"
  return <span className={styles.statusPill} data-status={normalized}>{humanStatus(normalized)}</span>
}

function EmptyState({ title, detail, compact }: { title: string; detail: string; compact?: boolean }) {
  return <div className={compact ? styles.emptyCompact : styles.emptyState}><Blocks /><div><strong>{title}</strong><p>{detail}</p></div></div>
}

function EmptyMini() {
  return <div className={styles.emptyMini}>Aucun dossier</div>
}

function LoadingState() {
  return <div className={styles.loadingState}><Loader2 className={styles.spin} /><strong>Synchronisation Revenue</strong><span>Lecture des sources existantes sans génération de données de démonstration.</span></div>
}

function AuditFacts({ record }: { record: RevenueRecord }) {
  return <section className={styles.auditFacts}><PanelHeading icon={<FileCheck2 />} title="Traçabilité observable" subtitle="Métadonnées disponibles dans l’enregistrement actuel." /><div>{Object.entries(record.metadata || {}).slice(0, 10).map(([key, value]) => <span key={key}><small>{key.replaceAll("_", " ")}</small><strong>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</strong></span>)}</div>{!Object.keys(record.metadata || {}).length ? <EmptyState title="Métadonnées absentes" detail="La source ne fournit aucune métadonnée complémentaire." compact /> : null}</section>
}

function AssetControl({ assets }: { assets: Array<{ label: string; value: string }> }) {
  return <section className={styles.assetControl}><PanelHeading icon={<Database />} title="Registre des matériaux observables" subtitle="Uniquement les liens et références réellement présents dans le dossier." /><div className={styles.assetGrid}>{assets.map((asset) => <div key={`${asset.label}-${asset.value}`}><FileCheck2 /><span><strong>{asset.label}</strong><small>{asset.value}</small></span></div>)}</div>{!assets.length ? <EmptyState title="Aucun actif référencé" detail="Le dossier ne contient actuellement aucun lien ou identifiant d’actif exploitable." /> : null}</section>
}

function ExecutionRunway({ record, actionRecord, mutation }: { record: RevenueRecord; actionRecord: RenderContext["actionRecord"]; mutation: string }) {
  const steps = [
    ["Constituée", Boolean(record.title)],
    ["Attribuée", Boolean(record.owner_name)],
    ["Planifiée", Boolean(record.due_at)],
    ["Active", ["active", "in_progress"].includes(norm(record.status))],
    ["Clôturée", ["done", "completed", "won"].includes(norm(record.status))],
  ] as const
  return <section className={styles.executionRunway}><PanelHeading icon={<Rocket />} title="Runway d’exécution" subtitle="Les gates utilisent uniquement les champs observables de la campagne." /><div className={styles.runway}>{steps.map(([label, ready], index) => <div key={label} data-ready={ready}><span>{index + 1}</span><strong>{label}</strong>{ready ? <CheckCircle2 /> : <CalendarClock />}</div>)}</div><div className={styles.executionActions}><button className={styles.primaryButton} onClick={() => void actionRecord(record, "start")} disabled={!record.id || mutation.startsWith(`${record.id}:`)}><Play /> Démarrer</button><button className={styles.secondaryButton} onClick={() => void actionRecord(record, "escalate")} disabled={!record.id || mutation.startsWith(`${record.id}:`)}><AlertTriangle /> Escalader</button><button className={styles.secondaryButton} onClick={() => void actionRecord(record, "complete")} disabled={!record.id || mutation.startsWith(`${record.id}:`)}><CheckCircle2 /> Clôturer</button></div></section>
}

function PerformanceTruth({ record }: { record: RevenueRecord }) {
  const facts = [
    ["Valeur portée", formatMoney(record.value_mad)],
    ["Statut opérationnel", humanStatus(record.status)],
    ["Risque", humanStatus(record.risk_level)],
    ["Dernière mise à jour", formatDate(record.updated_at)],
  ]
  return <section className={styles.performanceTruth}><PanelHeading icon={<BarChart3 />} title="Lecture de performance vérifiable" subtitle="Aucun ROI, conversion ou attribution n’est dérivé sans relation persistée." /><div className={styles.performanceCards}>{facts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className={styles.truthNotice}><ShieldCheck /><div><strong>Frontière de vérité</strong><p>La campagne peut porter une valeur ou un budget, mais le revenu réalisé reste exclusivement autorisé par le ledger de réalisation Revenue.</p></div></div></section>
}

function groupRecords(records: RevenueRecord[], key: (record: RevenueRecord) => string) {
  return records.reduce<Record<string, RevenueRecord[]>>((acc, record) => {
    const value = key(record) || "unknown"
    ;(acc[value] ||= []).push(record)
    return acc
  }, {})
}

function humanStatus(value: unknown) {
  const status = norm(value)
  const labels: Record<string, string> = {
    open: "Ouvert", active: "Actif", in_progress: "En cours", done: "Terminé", completed: "Terminé", won: "Gagné", lost: "Perdu", archived: "Archivé", escalated: "Escaladé", blocked: "Bloqué", draft: "Brouillon", planned: "Planifié", paused: "En pause", qualified: "Qualifié", critical: "Critique", high: "Élevé", medium: "Moyen", low: "Faible", unknown: "Non documenté",
  }
  return labels[status] || status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Non documenté"
}

function extractReferences(record: RevenueRecord) {
  const entries: Array<{ label: string; value: string }> = []
  const visit = (key: string, value: unknown) => {
    if (value == null) return
    if (/url|asset|file|document|evidence|reference|source/i.test(key) && ["string", "number"].includes(typeof value)) entries.push({ label: key.replaceAll("_", " "), value: String(value) })
  }
  Object.entries(record).forEach(([key, value]) => visit(key, value))
  Object.entries(record.metadata || {}).forEach(([key, value]) => visit(key, value))
  return entries.slice(0, 18)
}
