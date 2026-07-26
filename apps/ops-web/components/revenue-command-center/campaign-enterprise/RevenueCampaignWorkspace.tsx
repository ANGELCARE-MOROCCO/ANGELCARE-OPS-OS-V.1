"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Ban,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CirclePause,
  CircleStop,
  Clock3,
  DatabaseZap,
  Eye,
  FileText,
  Filter,
  Gauge,
  Layers3,
  Link2,
  Mail,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  PhoneCall,
  Play,
  Plus,
  Radio,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react"
import type { ReactNode } from "react"

import { ACTION_GROUPS, CAMPAIGN_ACTIONS } from "./campaign-actions"
import { CAMPAIGN_NAVIGATION, CAMPAIGN_ROUTE_CONTRACTS } from "./route-contracts"
import type {
  CampaignActionDefinition,
  CampaignActionKind,
  CampaignExperienceKey,
  CampaignPortfolio,
  CampaignRecord,
} from "./types"
import { campaignMutation, useCampaignPortfolio } from "./useCampaignPortfolio"
import styles from "./RevenueCampaignWorkspace.module.css"

function money(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value || 0))} Dh`
}
function number(value: unknown) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value || 0))
}
function percent(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(Number(value || 0))} %`
}
function date(value: unknown, fallback = "Non planifié") {
  if (!value) return fallback
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}
function dateTime(value: unknown, fallback = "—") {
  if (!value) return fallback
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}
function initials(value: unknown) {
  return String(value || "AC").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}
function statusClass(value: unknown) {
  const status = String(value || "").toLowerCase()
  if (["active", "approved", "ready", "completed", "delivered", "confirmed", "eligible", "positive_interest"].some((item) => status.includes(item))) return `${styles.status} ${styles.statusActive}`
  if (["blocked", "failed", "cancelled", "hard_bounce", "rejected", "critical", "opt_out"].some((item) => status.includes(item))) return `${styles.status} ${styles.statusDanger}`
  if (["pending", "paused", "warning", "review", "scheduled", "limited", "recovery"].some((item) => status.includes(item))) return `${styles.status} ${styles.statusWarning}`
  return styles.status
}
function safeArray<T>(value: T[] | undefined | null) { return Array.isArray(value) ? value : [] }
function campaignHref(id: string, suffix = "") { return `/revenue-command-center/campaigns/${id}${suffix}` }

const KPI_ICONS = [Megaphone, Users, Send, MessageCircle, CalendarDays, CircleDollarSign]

export default function RevenueCampaignWorkspace({ experience, contextId }: { experience: CampaignExperienceKey; contextId?: string | null }) {
  const contract = CAMPAIGN_ROUTE_CONTRACTS[experience]
  const { data, loading, error, refresh } = useCampaignPortfolio(contextId)
  const [modalKind, setModalKind] = useState<CampaignActionKind | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(contextId || null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [notice, setNotice] = useState<string | null>(null)

  const selectedCampaign = useMemo(() => {
    if (!data?.campaigns.length) return null
    return data.campaigns.find((campaign) => campaign.id === (contextId || selectedCampaignId)) || data.campaigns[0]
  }, [data, contextId, selectedCampaignId])

  const filteredCampaigns = useMemo(() => {
    const term = search.trim().toLowerCase()
    return safeArray(data?.campaigns).filter((campaign) => {
      const matchesStatus = statusFilter === "all" || String(campaign.status) === statusFilter
      const haystack = [campaign.name, campaign.audience, campaign.objective, campaign.owner, campaign.channel].join(" ").toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [data?.campaigns, search, statusFilter])

  function openAction(kind: CampaignActionKind, campaign?: CampaignRecord | null) {
    if (campaign?.id) setSelectedCampaignId(campaign.id)
    setNotice(null)
    setModalKind(kind)
  }

  if (loading && !data) return <div className={styles.shell}><div className={styles.loading}><RefreshCcw size={20} />&nbsp; Synchronisation du Campaign Control Plane…</div></div>
  if (error && !data) return <div className={styles.shell}><div className={styles.error}>Impossible de charger Mega ZIP 10 : {error}</div></div>

  const portfolio = data || emptyPortfolio()
  const kpis = kpisForExperience(experience, portfolio)

  return (
    <main className={styles.shell} data-campaign-enterprise={experience}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.eyebrow}><Sparkles size={14} />{contract.eyebrow}</div>
            <h1 className={styles.heroTitle}>{contract.title}</h1>
            <p className={styles.heroMission}>{contract.mission}</p>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.secondaryButton} onClick={() => void refresh()}><RefreshCcw size={15} />Actualiser</button>
            {selectedCampaign && experience !== "campaign-create-studio" && (
              <Link className={styles.secondaryButton} href={campaignHref(selectedCampaign.id)}><Eye size={15} />Dossier</Link>
            )}
            <button className={styles.primaryButton} onClick={() => openAction(experience === "campaign-create-studio" ? "create-campaign" : primaryActionFor(experience), selectedCampaign)}><Plus size={15} />{contract.primaryAction}</button>
          </div>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaPill}><DatabaseZap size={13} />Source canonique : revenue_campaigns</span>
          <span className={styles.metaPill}><ShieldCheck size={13} />Suppression & fréquence contrôlées</span>
          <span className={styles.metaPill}><Link2 size={13} />Lineage jusqu’au revenu réalisé</span>
          <span className={styles.metaPill}><Clock3 size={13} />Sync : {dateTime(portfolio.syncedAt)}</span>
          {notice && <span className={`${styles.metaPill} ${styles.statusActive}`}><CheckCircle2 size={13} />{notice}</span>}
        </div>
      </section>

      <nav className={styles.nav} aria-label="Navigation campagnes">
        {CAMPAIGN_NAVIGATION.map(([label, href]) => {
          const active = (experience === "campaign-command" && href.endsWith("/campaigns")) ||
            (experience === "campaign-create-studio" && href.endsWith("/new")) ||
            (experience === "campaign-board" && href.endsWith("/board")) ||
            (experience === "sdr-command" && href.endsWith("/sdr-execution"))
          return <Link key={href} className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`} href={href}>{label}</Link>
        })}
        {selectedCampaign && experience !== "campaign-command" && experience !== "campaign-create-studio" && experience !== "campaign-board" && experience !== "sdr-command" && (
          <>
            <Link className={`${styles.navLink} ${experience === "campaign-dossier" ? styles.navLinkActive : ""}`} href={campaignHref(selectedCampaign.id)}>Dossier 360</Link>
            <Link className={`${styles.navLink} ${experience === "campaign-assets-studio" ? styles.navLinkActive : ""}`} href={campaignHref(selectedCampaign.id, "/assets")}>Séquences & assets</Link>
            <Link className={`${styles.navLink} ${experience === "campaign-live-room" ? styles.navLinkActive : ""}`} href={campaignHref(selectedCampaign.id, "/execution")}>Live Room</Link>
            <Link className={`${styles.navLink} ${experience === "campaign-performance" ? styles.navLinkActive : ""}`} href={campaignHref(selectedCampaign.id, "/performance")}>Performance</Link>
          </>
        )}
      </nav>

      <section className={styles.kpiGrid}>
        {kpis.map((kpi, index) => {
          const Icon = KPI_ICONS[index] || Activity
          return <Kpi key={kpi.label} icon={<Icon size={18} />} label={kpi.label} value={kpi.value} detail={kpi.detail} />
        })}
      </section>

      {experience === "campaign-command" && <CampaignCommand data={portfolio} campaigns={filteredCampaigns} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} openAction={openAction} />}
      {experience === "campaign-create-studio" && <CampaignCreateStudio data={portfolio} openAction={openAction} />}
      {experience === "campaign-board" && <CampaignBoard data={portfolio} campaigns={filteredCampaigns} openAction={openAction} setSelectedCampaignId={setSelectedCampaignId} />}
      {experience === "campaign-dossier" && <CampaignDossier data={portfolio} campaign={selectedCampaign} openAction={openAction} />}
      {experience === "campaign-assets-studio" && <CampaignAssets data={portfolio} campaign={selectedCampaign} openAction={openAction} />}
      {experience === "campaign-live-room" && <CampaignLiveRoom data={portfolio} campaign={selectedCampaign} openAction={openAction} />}
      {experience === "campaign-performance" && <CampaignPerformance data={portfolio} campaign={selectedCampaign} openAction={openAction} />}
      {experience === "sdr-command" && <SDRCommand data={portfolio} openAction={openAction} />}

      {modalKind && (
        <ActionModal
          action={CAMPAIGN_ACTIONS[modalKind]}
          campaign={selectedCampaign}
          data={portfolio}
          onClose={() => setModalKind(null)}
          onSuccess={async (message) => { setNotice(message); setModalKind(null); await refresh() }}
        />
      )}
    </main>
  )
}

function CampaignCommand({ data, campaigns, search, setSearch, statusFilter, setStatusFilter, openAction }: {
  data: CampaignPortfolio
  campaigns: CampaignRecord[]
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void
}) {
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<Megaphone size={17} />} title="Portefeuille campagnes" subtitle="Objectif, audience, lifecycle, ownership, délivrabilité, coûts et contribution au revenu.">
        <div className={styles.filters}>
          <div className={styles.searchBox}><Search className={styles.searchIcon} size={16} /><input className={`${styles.input} ${styles.searchInput}`} value={search} onChange={(event: any) => setSearch(event.target.value)} placeholder="Rechercher campagne, audience, owner, canal…" /></div>
          <select className={styles.select} value={statusFilter} onChange={(event: any) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut">
            <option value="all">Tous les statuts</option><option value="draft">Draft</option><option value="approval_required">Approval</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="paused">Paused</option><option value="recovery">Recovery</option><option value="completed">Completed</option>
          </select>
          <button className={styles.primaryButton} onClick={() => openAction("create-campaign")}><Plus size={14} />Créer</button>
        </div>
        <CampaignTable campaigns={campaigns} data={data} openAction={openAction} />
      </Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<Workflow size={17} />} title="Funnel commercial vérifié" subtitle="Les étapes ne sont comptées que lorsqu’un objet canonique existe.">
          <Funnel data={data} />
        </Panel>
        <Panel icon={<Gauge size={17} />} title="Délivrabilité & sécurité" subtitle="Acceptation provider, échecs, suppressions et fatigue ne sont jamais confondus.">
          <div className={styles.threeGrid}>
            <MetricCard label="Provider failures" value={number(data.summary.providerFailures)} detail="dispatchs à investiguer" />
            <MetricCard label="Suppressions actives" value={number(data.summary.openSuppressions)} detail="globales, canal ou campagne" />
            <MetricCard label="Backlog SDR" value={number(data.summary.sdrBacklog)} detail="étapes dues / en retard" />
          </div>
        </Panel>
      </div>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Interventions prioritaires" actions={["evaluate-readiness", "request-approval", "pause-campaign", "create-recovery-plan"]} openAction={openAction} />
      <SchemaPanel schema={data.schema} />
      <AuditPanel rows={data.statusHistory} />
    </aside>
  </div>
}

function CampaignCreateStudio({ data, openAction }: { data: CampaignPortfolio; openAction: (kind: CampaignActionKind) => void }) {
  const gates = [
    ["Stratégie commerciale", true], ["Audience & exclusions", data.segments.length > 0], ["Séquence versionnée", data.sequenceVersions.length > 0], ["Templates approuvés", data.templateVersions.length > 0],
    ["Provider vérifié", data.providerReadiness.some((row) => row.status === "ready")], ["Expéditeur vérifié", data.senderReadiness.some((row) => row.status === "ready")], ["Fréquence gouvernée", true], ["Approbation", data.approvals.some((row) => String(row.status).startsWith("approved"))],
  ] as const
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<Target size={17} />} title="Architecture stratégique" subtitle="La campagne commence par une hypothèse commerciale et non par un bouton d’envoi.">
        <div className={styles.contextStrip}>
          <ContextCard label="Objectif" value="Meeting, opportunité ou revenu" />
          <ContextCard label="Audience" value="Éligible et dédupliquée" />
          <ContextCard label="Cadence" value="Versionnée et approuvée" />
          <ContextCard label="Attribution" value="Rules primary source" />
        </div>
        <div className={styles.threeGrid}>
          <StudioCard icon={<Target />} title="1. Stratégie" text="Pain, proposition de valeur, action attendue, objections, succès et stop criteria." action="create-campaign" openAction={openAction} />
          <StudioCard icon={<Users />} title="2. Audience" text="Segment, exclusions, suppression, fréquence, canal manquant et snapshot figé." action="create-segment" openAction={openAction} />
          <StudioCard icon={<Workflow />} title="3. Séquence" text="Étapes multicanales, délais, owners, branches, sorties et comportements d’échec." action="create-sequence" openAction={openAction} />
          <StudioCard icon={<FileText />} title="4. Contenus" text="Templates versionnés, variables sûres, prévisualisation et approbation." action="create-template" openAction={openAction} />
          <StudioCard icon={<Radio />} title="5. Readiness" text="Provider, sender, capacité, tests et limites réelles par canal." action="record-provider-readiness" openAction={openAction} />
          <StudioCard icon={<ShieldCheck />} title="6. Gouvernance" text="Budget, fréquence, risque, approbation et décision de lancement auditée." action="request-approval" openAction={openAction} />
        </div>
      </Panel>
      <Panel icon={<Sparkles size={17} />} title="Modèle de campagne premium" subtitle="Un parcours complet, sans raccourci entre audience et résultat commercial.">
        <div className={styles.timeline}>
          {["Stratégie validée", "Audience figée", "Séquence approuvée", "Provider et sender prêts", "Approbation de lancement", "Enrôlement idempotent", "Exécution & réponses", "Conversion & attribution"].map((label, index) => <div className={styles.timelineItem} key={label}><div className={styles.timelineDot}>{index + 1}</div><div className={styles.timelineContent}><div className={styles.timelineTitle}>{label}</div><div className={styles.timelineText}>Gate obligatoire avec ownership, preuve et état explicite.</div></div><div className={styles.timelineTime}>Phase {index + 1}</div></div>)}
        </div>
      </Panel>
    </div>
    <aside className={styles.sideColumn}>
      <Panel icon={<ShieldCheck size={17} />} title="Readiness contractuelle" subtitle="Aucun lancement tant qu’un gate critique reste ouvert.">
        <div className={styles.readinessGrid}>{gates.map(([label, passed]) => <Gate key={label} label={label} status={passed ? "passed" : "pending"} />)}</div>
      </Panel>
      <ActionPanel title="Commandes de construction" actions={["create-campaign", "create-segment", "create-sequence", "create-template", "evaluate-readiness"]} openAction={openAction} />
    </aside>
  </div>
}

function CampaignBoard({ data, campaigns, openAction, setSelectedCampaignId }: { data: CampaignPortfolio; campaigns: CampaignRecord[]; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void; setSelectedCampaignId: (id: string) => void }) {
  const lanes = [
    ["Préparation", ["draft", "strategy_preparation", "audience_preparation", "sequence_preparation"]],
    ["Gouvernance", ["readiness_review", "approval_required", "approved"]],
    ["Exécution", ["scheduled", "launching", "active", "paused"]],
    ["Résultat", ["recovery", "completed", "cancelled", "archived"]],
  ] as const
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<Layers3 size={17} />} title="Board lifecycle" subtitle="Chaque carte expose valeur, audience, ownership, risque et prochaine autorité.">
        <div className={styles.board}>
          {lanes.map(([label, statuses]) => {
            const laneCampaigns = campaigns.filter((campaign) => statuses.includes(String(campaign.status) as never))
            return <div className={styles.lane} key={label}><div className={styles.laneHeader}><span>{label}</span><span className={styles.laneCount}>{laneCampaigns.length}</span></div><div className={styles.laneCards}>{laneCampaigns.map((campaign) => <button key={campaign.id} className={styles.laneCard} onClick={() => setSelectedCampaignId(campaign.id)}><div className={styles.laneCardTop}><div className={styles.laneCardName}>{campaign.name || "Campagne"}</div><span className={statusClass(campaign.status)}>{campaign.status}</span></div><div className={styles.laneCardMeta}><div className={styles.miniMetric}>Budget<strong>{money(campaign.budget_mad)}</strong></div><div className={styles.miniMetric}>Owner<strong>{campaign.owner || "—"}</strong></div><div className={styles.miniMetric}>Audience<strong>{campaign.audience || "—"}</strong></div><div className={styles.miniMetric}>Lancement<strong>{date(campaign.launch_at)}</strong></div></div></button>)}</div></div>
          })}
        </div>
      </Panel>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Décisions board" actions={["transition-campaign", "evaluate-readiness", "request-approval", "pause-campaign", "emergency-stop"]} openAction={openAction} />
      <Panel icon={<AlertTriangle size={17} />} title="Pression opérationnelle" subtitle="Interventions issues des données persistées."><div className={styles.actionRail}><RiskLine label="Campagnes à risque" value={data.summary.atRisk} tone="danger" /><RiskLine label="Approvals en attente" value={data.summary.approvalRequired} tone="warning" /><RiskLine label="Provider failures" value={data.summary.providerFailures} tone="danger" /><RiskLine label="Backlog SDR" value={data.summary.sdrBacklog} tone="warning" /></div></Panel>
    </aside>
  </div>
}

function CampaignDossier({ data, campaign, openAction }: { data: CampaignPortfolio; campaign: CampaignRecord | null; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void }) {
  if (!campaign) return <Empty title="Aucune campagne sélectionnée" text="Créez ou ouvrez une campagne pour afficher son dossier 360°." />
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<Megaphone size={17} />} title={campaign.name || "Dossier campagne"} subtitle={`${campaign.audience || "Audience à définir"} · ${campaign.owner || "Owner non affecté"}`} action={<span className={statusClass(campaign.status)}>{campaign.status || "draft"}</span>}>
        <div className={styles.contextStrip}>
          <ContextCard label="Objectif" value={campaign.objective || "À définir"} />
          <ContextCard label="Canal" value={campaign.channel || "multichannel"} />
          <ContextCard label="Budget" value={money(campaign.budget_mad)} />
          <ContextCard label="Attribution" value={`${campaign.attribution_model || "rules_primary_source"} · ${campaign.attribution_window_days || 60} j`} />
        </div>
        <div className={styles.splitGrid}>
          <div className={styles.metricCard}><div className={styles.metricCardLabel}>Stratégie</div><div className={styles.metricCardDetail}>{String(campaign.strategy?.valueProposition || campaign.objective || "Proposition de valeur à formaliser")}</div><div className={styles.commandPalette}><button className={styles.commandChip} onClick={() => openAction("edit-campaign", campaign)}><Target size={12} />Modifier</button><button className={styles.commandChip} onClick={() => openAction("transition-campaign", campaign)}><ArrowRight size={12} />Transition</button></div></div>
          <div className={styles.metricCard}><div className={styles.metricCardLabel}>Gouvernance</div><div className={styles.metricCardValue}>{campaign.approval_status || "not_requested"}</div><div className={styles.metricCardDetail}>Readiness : {campaign.readiness_status || "not_evaluated"}</div><div className={styles.commandPalette}><button className={styles.commandChip} onClick={() => openAction("evaluate-readiness", campaign)}><ShieldCheck size={12} />Gates</button><button className={styles.commandChip} onClick={() => openAction("request-approval", campaign)}><UserRoundCheck size={12} />Approval</button></div></div>
        </div>
      </Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<Users size={17} />} title="Audience & destinataires" subtitle="Éligibilité, enrôlement, suppression et progression."><div className={styles.threeGrid}><MetricCard label="Éligibles" value={number(data.summary.eligibleAudience)} detail="décisions eligible" /><MetricCard label="Enrôlés" value={number(data.summary.enrolled)} detail="actifs dans la cadence" /><MetricCard label="Contactés" value={number(data.summary.contacted)} detail="au moins une action" /></div></Panel>
        <Panel icon={<Workflow size={17} />} title="Séquence & assets" subtitle="Versions approuvées et sources de contenu."><div className={styles.threeGrid}><MetricCard label="Séquences" value={number(data.sequences.length)} detail={`${data.sequenceVersions.length} versions`} /><MetricCard label="Étapes" value={number(data.sequenceSteps.length)} detail="multicanales" /><MetricCard label="Templates" value={number(data.templates.length)} detail={`${data.templateVersions.length} versions`} /></div></Panel>
      </div>
      <Panel icon={<Activity size={17} />} title="Timeline consolidée" subtitle="Transitions, réponses, conversions et décisions auditées."><Timeline rows={[...data.statusHistory, ...data.replies, ...data.conversionEvents].slice(0, 12)} /></Panel>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Commandes dossier" actions={["edit-campaign", "transition-campaign", "freeze-audience", "create-sequence", "evaluate-readiness", "record-evidence"]} openAction={(kind) => openAction(kind, campaign)} />
      <SchemaPanel schema={data.schema} />
      <AuditPanel rows={data.statusHistory} />
    </aside>
  </div>
}

function CampaignAssets({ data, campaign, openAction }: { data: CampaignPortfolio; campaign: CampaignRecord | null; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void }) {
  if (!campaign) return <Empty title="Campagne introuvable" text="L’espace assets nécessite un dossier campagne valide." />
  const steps = data.sequenceSteps.slice().sort((a, b) => Number(a.step_order || 0) - Number(b.step_order || 0))
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<Workflow size={17} />} title="Sequence Studio" subtitle="Canal, délai, contenu, owner, préconditions, échecs et sortie explicite." action={<button className={styles.primaryButton} onClick={() => openAction("add-sequence-step", campaign)}><Plus size={14} />Étape</button>}>
        <div className={styles.sequenceCanvas}>{steps.length ? steps.map((step, index) => <div className={styles.sequenceStep} key={step.id || index}><div className={styles.sequenceIndex}>{step.step_order || index + 1}</div><div><div className={styles.sequenceTitle}>{String(step.step_type || step.channel || "Étape")}</div><div className={styles.sequenceMeta}>{String(step.channel || "internal")} · délai {number(step.delay_minutes)} min · owner {String(step.owner_role || "SDR")}</div></div><span className={statusClass(step.status)}>{step.status || "draft"}</span></div>) : <Empty title="Aucune étape" text="Créez une séquence puis ajoutez les étapes email, WhatsApp, call, wait, branch ou exit." compact />}</div>
      </Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<FileText size={17} />} title="Template Library" subtitle="Versions immuables et variables contrôlées."><AssetList rows={data.templates} empty="Aucun template campagne" /></Panel>
        <Panel icon={<Radio size={17} />} title="Sender & Provider Readiness" subtitle="Les états unknown et limited ne sont pas présentés comme ready."><ReadinessList provider={data.providerReadiness} sender={data.senderReadiness} identities={data.senderIdentities} /></Panel>
      </div>
      <Panel icon={<Eye size={17} />} title="Personalization Safety" subtitle="Aucune variable interne, note confidentielle ou identifiant technique ne doit sortir."><div className={styles.threeGrid}><MetricCard label="Variables déclarées" value={number(data.templates.reduce((total, row) => total + safeArray(row.variables).length, 0))} detail="source field requise" /><MetricCard label="Versions approuvées" value={number(data.templateVersions.filter((row) => row.status === "approved").length)} detail="immuables" /><MetricCard label="Expéditeurs actifs" value={number(data.senderIdentities.filter((row) => row.status === "active").length)} detail="Email OS authority" /></div></Panel>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Commandes assets" actions={["create-sequence", "add-sequence-step", "approve-sequence", "create-template", "approve-template", "record-provider-readiness", "record-sender-readiness"]} openAction={(kind) => openAction(kind, campaign)} />
      <Panel icon={<ShieldCheck size={17} />} title="Asset gates" subtitle="Préconditions minimales avant readiness review."><div className={styles.readinessGrid}><Gate label="Séquence" status={data.sequenceVersions.length ? "passed" : "pending"} /><Gate label="Templates" status={data.templateVersions.length ? "passed" : "pending"} /><Gate label="Provider" status={data.providerReadiness.some((row) => row.status === "ready") ? "passed" : "pending"} /><Gate label="Sender" status={data.senderReadiness.some((row) => row.status === "ready") ? "passed" : "pending"} /></div></Panel>
    </aside>
  </div>
}

function CampaignLiveRoom({ data, campaign, openAction }: { data: CampaignPortfolio; campaign: CampaignRecord | null; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void }) {
  if (!campaign) return <Empty title="Campagne introuvable" text="Le Live Room nécessite un dossier campagne valide." />
  const active = ["active", "launching"].includes(String(campaign.status))
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <div className={styles.liveBanner}><div className={styles.liveState}><span className={active ? styles.liveDot : ""} />{active ? "Campagne en exécution contrôlée" : `Campagne ${campaign.status || "draft"}`}</div><div className={styles.heroActions}><button className={styles.secondaryButton} onClick={() => openAction("pause-campaign", campaign)}><CirclePause size={14} />Pause</button><button className={styles.dangerButton} onClick={() => openAction("emergency-stop", campaign)}><CircleStop size={14} />Emergency stop</button></div></div>
      <Panel icon={<Radio size={17} />} title="Operations live" subtitle="Queue, exécutions, providers, réponses et backlog SDR.">
        <div className={styles.threeGrid}><MetricCard label="Recipients" value={number(data.recipients.length)} detail={`${data.summary.enrolled} enrôlés`} /><MetricCard label="Steps due" value={number(data.summary.sdrBacklog)} detail="manuel ou automatisé" /><MetricCard label="Provider failures" value={number(data.summary.providerFailures)} detail="jamais masqués" /></div>
        <div className={styles.tableWrap} style={{ marginTop: 13 }}><table className={styles.table}><thead><tr><th>Destinataire</th><th>Canal</th><th>État</th><th>Étape</th><th>Owner</th><th>Dernière action</th><th>Action</th></tr></thead><tbody>{data.recipients.slice(0, 80).map((recipient) => <tr key={recipient.id}><td><div className={styles.entityCell}><span className={styles.avatar}>{initials(recipient.display_name || recipient.contact_value)}</span><span><span className={styles.entityTitle}>{recipient.display_name || recipient.contact_value || "Destinataire"}</span><span className={styles.entitySub}>{recipient.prospect_id || recipient.contact_id || recipient.id}</span></span></div></td><td>{recipient.channel || "—"}</td><td><span className={statusClass(recipient.status)}>{recipient.status || "candidate"}</span></td><td>{recipient.current_step_order || "—"}</td><td>{recipient.owner || "SDR"}</td><td>{dateTime(recipient.last_action_at)}</td><td><button className={styles.tableButton} onClick={() => openAction("record-reply", campaign)}><MessageCircle size={12} />Traiter</button></td></tr>)}</tbody></table>{!data.recipients.length && <Empty title="Aucun destinataire enrôlé" text="Figez l’audience, évaluez l’éligibilité puis enrôlez idempotemment." compact />}</div>
      </Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<Send size={17} />} title="Dispatch attempts" subtitle="Idempotency, provider reference et état réel."><Timeline rows={data.dispatchAttempts.slice(0, 8)} /></Panel>
        <Panel icon={<MessageCircle size={17} />} title="Réponses & opt-outs" subtitle="Toute réponse qualifiante arrête ou redirige les étapes futures."><Timeline rows={data.replies.slice(0, 8)} /></Panel>
      </div>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Commandes Live Room" actions={["evaluate-readiness", "launch-campaign", "enroll-recipient", "dispatch-step", "record-provider-event", "record-reply", "record-call-outcome", "emergency-stop"]} openAction={(kind) => openAction(kind, campaign)} />
      <Panel icon={<Gauge size={17} />} title="Safety posture" subtitle="Contrôles avant chaque dispatch."><div className={styles.readinessGrid}><Gate label="Campaign active" status={active ? "passed" : "pending"} /><Gate label="Suppression" status="passed" /><Gate label="Frequency" status="passed" /><Gate label="Provider" status={data.providerReadiness.some((row) => row.status === "ready") ? "passed" : "pending"} /></div></Panel>
    </aside>
  </div>
}

function CampaignPerformance({ data, campaign, openAction }: { data: CampaignPortfolio; campaign: CampaignRecord | null; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void }) {
  if (!campaign) return <Empty title="Campagne introuvable" text="L’analyse nécessite un dossier campagne valide." />
  const realized = data.summary.realizedMad
  const confirmedCost = data.summary.confirmedCostMad
  const returnValue = confirmedCost > 0 ? ((realized - confirmedCost) / confirmedCost) * 100 : 0
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<Workflow size={17} />} title="Funnel end-to-end" subtitle="Reply, meeting, opportunity, proposal, contract et revenu réalisé restent des états distincts."><Funnel data={data} /></Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<Gauge size={17} />} title="Deliverability" subtitle="Provider accepted n’est pas delivered, viewed ou replied."><div className={styles.threeGrid}><MetricCard label="Dispatch attempts" value={number(data.dispatchAttempts.length)} detail="tous providers" /><MetricCard label="Delivery events" value={number(data.deliveryEvents.length)} detail="événements externes persistés" /><MetricCard label="Failures" value={number(data.summary.providerFailures)} detail="bounce / reject / failed" /></div></Panel>
        <Panel icon={<CircleDollarSign size={17} />} title="Campaign economics" subtitle="ROI uniquement sur coûts confirmés et revenu réalisé."><div className={styles.threeGrid}><MetricCard label="Revenu réalisé" value={money(realized)} detail="Phase 7 authority" /><MetricCard label="Coût confirmé" value={money(confirmedCost)} detail={`${money(data.summary.estimatedCostMad)} estimé`} /><MetricCard label="Return" value={confirmedCost ? percent(returnValue) : "N/A"} detail="base réalisée" /></div></Panel>
      </div>
      <Panel icon={<Link2 size={17} />} title="Attribution ledger" subtitle="Modèle, part, événement canonique, preuve, conflits et reversals."><AttributionTable rows={data.attributions} conflicts={data.attributionConflicts} /></Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<CircleDollarSign size={17} />} title="Cost ledger" subtitle="Estimated, approved, committed et confirmed ne sont jamais mélangés."><CostList rows={data.costs} /></Panel>
        <Panel icon={<Sparkles size={17} />} title="Experiments" subtitle="Hypothèse, métrique et échantillon minimum avant déclaration de gagnant."><AssetList rows={data.experiments} empty="Aucune expérimentation" /></Panel>
      </div>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Commandes performance" actions={["create-attribution", "raise-attribution-conflict", "record-cost", "create-performance-period", "close-performance-period", "create-experiment", "create-recovery-plan"]} openAction={(kind) => openAction(kind, campaign)} />
      <Panel icon={<AlertTriangle size={17} />} title="Attribution control" subtitle="Aucune attribution silencieuse ou supérieure à 100%."><div className={styles.actionRail}><RiskLine label="Attributions" value={data.attributions.length} tone="neutral" /><RiskLine label="Conflits ouverts" value={data.attributionConflicts.filter((row) => row.status === "open").length} tone="danger" /><RiskLine label="Revenu attribué" value={money(realized)} tone="positive" /></div></Panel>
    </aside>
  </div>
}

function SDRCommand({ data, openAction }: { data: CampaignPortfolio; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void }) {
  const queue = data.stepExecutions.filter((row) => ["scheduled", "due", "overdue", "manual_review"].includes(String(row.status))).slice(0, 120)
  return <div className={styles.workspaceGrid}>
    <div className={styles.mainColumn}>
      <Panel icon={<UserRoundCheck size={17} />} title="Daily SDR queue" subtitle="Prochaine action autorisée, contexte campagne, priorité, SLA et outcome attendu.">
        <div className={styles.filters}><div className={styles.searchBox}><Search className={styles.searchIcon} size={16} /><input className={`${styles.input} ${styles.searchInput}`} placeholder="Rechercher destinataire, campagne, owner…" /></div><button className={styles.secondaryButton}><Filter size={14} />Priorité</button></div>
        <div className={styles.sdrQueue}>{queue.length ? queue.map((item, index) => {
          const recipient = data.recipients.find((row) => row.id === item.campaign_recipient_id)
          const campaign = data.campaigns.find((row) => row.id === item.campaign_id) || null
          return <div className={styles.sdrItem} key={item.id || index}><div className={styles.sdrScore}>{item.priority_score || Math.max(1, 99 - index)}</div><div><div className={styles.entityTitle}>{recipient?.display_name || recipient?.contact_value || "Destinataire"}</div><div className={styles.entitySub}>{campaign?.name || "Campagne"} · étape {item.step_order || "—"}</div></div><div><span className={statusClass(item.status)}>{item.status}</span></div><div className={styles.entitySub}>{item.channel || item.step_type || "manual"}<br />{dateTime(item.scheduled_at)}</div><div className={styles.entitySub}>{item.owner || recipient?.owner || "SDR"}</div><button className={styles.primaryButton} onClick={() => openAction(item.channel === "call" ? "record-call-outcome" : "record-reply", campaign)}><ArrowRight size={13} />Traiter</button></div>
        }) : <Empty title="Aucune étape SDR due" text="La file se remplit à partir des enrollments et des step executions persistés." compact />}</div>
      </Panel>
      <div className={styles.splitGrid}>
        <Panel icon={<MessageCircle size={17} />} title="Replies requiring action" subtitle="Positive, meeting request, information request ou human review."><Timeline rows={data.replies.filter((row) => ["positive_interest", "meeting_request", "information_request", "needs_human_review"].includes(String(row.classification))).slice(0, 10)} /></Panel>
        <Panel icon={<TrendingUp size={17} />} title="SDR conversion" subtitle="Contribution distincte de l’attribution source campagne."><div className={styles.threeGrid}><MetricCard label="Réponses +" value={number(data.summary.positiveReplies)} detail="intérêt confirmé" /><MetricCard label="Meetings" value={number(data.summary.meetings)} detail="objets canoniques" /><MetricCard label="Opportunités" value={number(data.summary.opportunities)} detail="pipeline créé" /></div></Panel>
      </div>
    </div>
    <aside className={styles.sideColumn}>
      <ActionPanel title="Workbench SDR" actions={["record-reply", "record-call-outcome", "create-meeting-conversion", "create-opportunity-conversion", "suppress-recipient"]} openAction={openAction} />
      <Panel icon={<ShieldCheck size={17} />} title="Contact discipline" subtitle="Rappel permanent avant toute action manuelle."><div className={styles.readinessGrid}><Gate label="Suppression" status="passed" /><Gate label="Fréquence" status="passed" /><Gate label="Canal valide" status="passed" /><Gate label="Owner" status={data.sdrAssignments.length ? "passed" : "pending"} /></div></Panel>
    </aside>
  </div>
}

function CampaignTable({ campaigns, data, openAction }: { campaigns: CampaignRecord[]; data: CampaignPortfolio; openAction: (kind: CampaignActionKind, campaign?: CampaignRecord | null) => void }) {
  return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Campagne</th><th>Lifecycle</th><th>Audience</th><th>Canaux</th><th>Budget</th><th>Réponses</th><th>Revenu réalisé</th><th>Owner</th><th>Action</th></tr></thead><tbody>{campaigns.map((campaign) => {
    const recipients = data.recipients.filter((row) => row.campaign_id === campaign.id)
    const replies = data.replies.filter((row) => row.campaign_id === campaign.id)
    const attributed = data.attributions.filter((row) => row.campaign_id === campaign.id && row.event_type === "revenue_realized").reduce((total, row) => total + Number(row.attributed_value || 0), 0)
    return <tr key={campaign.id}><td><div className={styles.entityCell}><span className={styles.avatar}>{initials(campaign.name)}</span><span><span className={styles.entityTitle}>{campaign.name || "Campagne"}</span><span className={styles.entitySub}>{campaign.objective || "Objectif à définir"}</span></span></div></td><td><span className={statusClass(campaign.status)}>{campaign.status || "draft"}</span></td><td>{campaign.audience || "—"}<div className={styles.entitySub}>{recipients.length} destinataires</div></td><td><span className={styles.metricBadge}>{campaign.channel || "multichannel"}</span></td><td>{money(campaign.budget_mad)}</td><td>{number(replies.length)}</td><td>{money(attributed)}</td><td>{campaign.owner || "—"}</td><td><Link className={styles.tableButton} href={campaignHref(campaign.id)}>Ouvrir <ChevronRight size={12} /></Link></td></tr>
  })}</tbody></table>{!campaigns.length && <Empty title="Aucune campagne correspondante" text="Ajustez les filtres ou créez une campagne gouvernée." compact />}</div>
}

function Funnel({ data }: { data: CampaignPortfolio }) {
  const values = [data.summary.enrolled, data.summary.contacted, data.summary.replies, data.summary.meetings, data.summary.opportunities, data.summary.contracts, data.summary.realizedMad]
  const labels = ["Enrolled", "Contacted", "Replies", "Meetings", "Opportunities", "Contracts", "Realized Dh"]
  return <div className={styles.funnel}>{values.map((value, index) => <div className={styles.funnelStep} key={labels[index]}><div className={styles.progress}><div className={styles.progressBar} style={{ width: `${Math.max(8, Math.min(100, index === 0 ? 100 : Number(values[0]) ? (Number(value) / Number(values[0])) * 100 : 0))}%` }} /></div><div className={styles.funnelValue}>{index === values.length - 1 ? money(value) : number(value)}</div><div className={styles.funnelLabel}>{labels[index]}</div></div>)}</div>
}

function ActionModal({ action, campaign, data, onClose, onSuccess }: { action: CampaignActionDefinition; campaign: CampaignRecord | null; data: CampaignPortfolio; onClose: () => void; onSuccess: (message: string) => Promise<void> }) {
  const defaults = Object.fromEntries(action.fields.map((field) => [field.key, field.defaultValue ?? campaignDefault(field.key, campaign)]))
  const [form, setForm] = useState<Record<string, string | number | boolean>>(defaults)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const missing = action.fields.find((field) => field.required && !String(form[field.key] ?? "").trim())
    if (missing) { setError(`${missing.label} est requis.`); return }
    setSubmitting(true); setError(null)
    try {
      const payload: Record<string, unknown> = { ...form, operation: action.kind, campaignId: campaign?.id || undefined }
      for (const key of ["members", "filters", "filterSnapshot", "metadata", "evidence"]) {
        const raw = payload[key]
        if (typeof raw === "string" && raw.trim()) {
          try { payload[key] = JSON.parse(raw) } catch { throw new Error(`${key} doit contenir un JSON valide.`) }
        }
      }
      await campaignMutation(action.endpoint, action.method, payload)
      await onSuccess(`${action.label} — succès`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
      setSubmitting(false)
    }
  }

  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event: any) => { if (event.target === event.currentTarget) onClose() }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="campaign-modal-title"><header className={styles.modalHeader}><div><div className={styles.modalEyebrow}>MEGA ZIP 10 · GOVERNED COMMAND</div><h2 className={styles.modalTitle} id="campaign-modal-title">{action.label}</h2><p className={styles.modalDescription}>{action.description}</p></div><button className={styles.iconButton} onClick={onClose} aria-label="Fermer"><X size={18} /></button></header><div className={styles.modalBody}>{campaign && <div className={styles.contextStrip}><ContextCard label="Campagne" value={campaign.name || campaign.id} /><ContextCard label="Statut" value={campaign.status || "draft"} /><ContextCard label="Owner" value={campaign.owner || "—"} /><ContextCard label="Audience" value={campaign.audience || "—"} /></div>}<div className={styles.formGrid}>{action.fields.map((field) => <FormField key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} data={data} />)}</div>{error && <div className={styles.error} style={{ marginTop: 14 }}>{error}</div>}</div><footer className={styles.modalFooter}><button className={styles.secondaryButton} onClick={onClose}>Annuler</button><button className={action.tone === "danger" ? styles.dangerButton : styles.primaryButton} disabled={submitting} onClick={() => void submit()}>{submitting ? <RefreshCcw size={14} /> : <CheckCircle2 size={14} />}{submitting ? "Exécution…" : "Confirmer la commande"}</button></footer></section></div>
}

function FormField({ field, value, onChange, data }: { field: CampaignActionDefinition["fields"][number]; value: string | number | boolean | undefined; onChange: (value: string | number | boolean) => void; data: CampaignPortfolio }) {
  const wide = field.type === "textarea"
  const className = `${styles.field} ${wide ? styles.fieldWide : ""}`
  const datalist = field.key === "senderIdentityId" ? "sender-identities" : undefined
  return <label className={className}><span className={styles.fieldLabel}>{field.label}{field.required && <span className={styles.required}> *</span>}</span>{field.type === "textarea" ? <textarea className={styles.textarea} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event: any) => onChange(event.target.value)} /> : field.type === "select" ? <select className={styles.select} value={String(value ?? "")} onChange={(event: any) => onChange(event.target.value)}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(value)} onChange={(event: any) => onChange(event.target.checked)} /> : <><input className={styles.input} list={datalist} type={field.type || "text"} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event: any) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} />{datalist && <datalist id="sender-identities">{data.senderIdentities.map((identity) => <option key={identity.id} value={identity.id}>{identity.external_display_name || identity.from_address || identity.id}</option>)}</datalist>}</>}</label>
}

function campaignDefault(key: string, campaign: CampaignRecord | null) {
  if (!campaign) return ""
  const map: Record<string, unknown> = { name: campaign.name, objective: campaign.objective, audience: campaign.audience, owner: campaign.owner, sdrLead: campaign.sdr_lead, budgetMad: campaign.budget_mad, attributionWindowDays: campaign.attribution_window_days, launchAt: campaign.launch_at }
  return (map[key] as string | number | boolean | undefined) ?? ""
}

function Panel({ icon, title, subtitle, action, children }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <section className={styles.panel}><header className={styles.panelHeader}><div><div className={styles.panelTitle}><span className={styles.panelTitleIcon}>{icon}</span>{title}</div>{subtitle && <p className={styles.panelSubtitle}>{subtitle}</p>}</div>{action}</header><div className={styles.panelBody}>{children}</div></section>
}
function Kpi({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) { return <div className={styles.kpi}><div className={styles.kpiIcon}>{icon}</div><div className={styles.kpiLabel}>{label}</div><div className={styles.kpiValue}>{value}</div><div className={styles.kpiDetail}>{detail}</div></div> }
function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className={styles.metricCard}><div className={styles.metricCardLabel}>{label}</div><div className={styles.metricCardValue}>{value}</div><div className={styles.metricCardDetail}>{detail}</div></div> }
function ContextCard({ label, value }: { label: string; value: string }) { return <div className={styles.contextCard}><div className={styles.contextLabel}>{label}</div><div className={styles.contextValue}>{value}</div></div> }
function Gate({ label, status }: { label: string; status: "passed" | "pending" | "failed" }) { const Icon = status === "passed" ? CheckCircle2 : status === "failed" ? AlertTriangle : Clock3; return <div className={styles.gate}><span className={styles.gateLabel}>{label}</span><Icon className={status === "passed" ? styles.gatePassed : status === "failed" ? styles.gateFailed : styles.gatePending} size={16} /></div> }
function StudioCard({ icon, title, text, action, openAction }: { icon: ReactNode; title: string; text: string; action: CampaignActionKind; openAction: (kind: CampaignActionKind) => void }) { return <button className={styles.actionCard} onClick={() => openAction(action)}><span><span className={styles.panelTitleIcon}>{icon}</span><span className={styles.actionCardTitle}>{title}</span><span className={styles.actionCardText}>{text}</span></span><ChevronRight className={styles.actionArrow} size={16} /></button> }
function ActionPanel({ title, actions, openAction }: { title: string; actions: CampaignActionKind[]; openAction: (kind: CampaignActionKind) => void }) { return <Panel icon={<Zap size={17} />} title={title} subtitle="Commandes persistées, permissionnées et auditées."><div className={styles.actionRail}>{actions.map((kind) => { const action = CAMPAIGN_ACTIONS[kind]; return <button key={kind} className={styles.actionCard} onClick={() => openAction(kind)}><span><span className={styles.actionCardTitle}>{action.label}</span><span className={styles.actionCardText}>{action.description}</span></span><ChevronRight className={styles.actionArrow} size={15} /></button> })}</div></Panel> }
function RiskLine({ label, value, tone }: { label: string; value: string | number; tone: "danger" | "warning" | "positive" | "neutral" }) { return <div className={styles.actionCard}><span className={styles.actionCardTitle}>{label}</span><span className={tone === "danger" ? `${styles.status} ${styles.statusDanger}` : tone === "warning" ? `${styles.status} ${styles.statusWarning}` : tone === "positive" ? `${styles.status} ${styles.statusActive}` : styles.status}>{value}</span></div> }
function Empty({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) { return <div className={styles.empty} style={compact ? { minHeight: 135 } : undefined}><div><div className={styles.emptyIcon}><Megaphone size={22} /></div><div className={styles.emptyTitle}>{title}</div><div className={styles.emptyText}>{text}</div></div></div> }

function SchemaPanel({ schema }: { schema: Record<string, boolean> }) {
  const entries = Object.entries(schema)
  const available = entries.filter(([, value]) => value).length
  return <Panel icon={<DatabaseZap size={17} />} title="Live schema posture" subtitle={`${available}/${entries.length} structures disponibles`}><div className={styles.progress}><div className={styles.progressBar} style={{ width: `${entries.length ? (available / entries.length) * 100 : 0}%` }} /></div><div className={styles.auditList}>{entries.slice(0, 9).map(([key, value]) => <div className={styles.auditItem} key={key}><span className={styles.auditDot} style={{ background: value ? "#1a9b72" : "#c17a20" }} /><span><span className={styles.auditTitle}>{key}</span><span className={styles.auditMeta}>{value ? "Disponible" : "Migration requise"}</span></span><span className={value ? `${styles.status} ${styles.statusActive}` : `${styles.status} ${styles.statusWarning}`}>{value ? "PASS" : "PENDING"}</span></div>)}</div></Panel>
}
function AuditPanel({ rows }: { rows: Array<Record<string, any>> }) { return <Panel icon={<Activity size={17} />} title="Audit récent" subtitle="Événements immuables de lifecycle."><div className={styles.auditList}>{rows.slice(0, 8).map((row, index) => <div className={styles.auditItem} key={row.id || index}><span className={styles.auditDot} /><span><span className={styles.auditTitle}>{row.title || row.event_type || "Événement campagne"}</span><span className={styles.auditMeta}>{row.reason || row.to_status || row.status || "recorded"}</span></span><span className={styles.auditTime}>{dateTime(row.occurred_at || row.created_at)}</span></div>)}{!rows.length && <div className={styles.emptyText}>Aucun événement Phase 10 persistant pour le moment.</div>}</div></Panel> }
function Timeline({ rows }: { rows: Array<Record<string, any>> }) { return <div className={styles.timeline}>{rows.map((row, index) => <div className={styles.timelineItem} key={row.id || index}><div className={styles.timelineDot}>{index + 1}</div><div className={styles.timelineContent}><div className={styles.timelineTitle}>{row.title || row.event_type || row.classification || row.status || "Événement"}</div><div className={styles.timelineText}>{row.reason || row.description || row.message || row.body_summary || row.result || row.provider || "Événement enregistré dans le control plane."}</div></div><div className={styles.timelineTime}>{dateTime(row.occurred_at || row.created_at || row.updated_at)}</div></div>)}{!rows.length && <Empty title="Aucun événement" text="Les événements apparaîtront ici après exécution réelle." compact />}</div> }
function AssetList({ rows, empty }: { rows: Array<Record<string, any>>; empty: string }) { return <div className={styles.actionRail}>{rows.slice(0, 8).map((row, index) => <div className={styles.actionCard} key={row.id || index}><span><span className={styles.actionCardTitle}>{row.name || row.label || `Asset ${index + 1}`}</span><span className={styles.actionCardText}>{row.objective || row.hypothesis || row.channel || row.status || "Asset campagne"}</span></span><span className={statusClass(row.status)}>{row.status || "draft"}</span></div>)}{!rows.length && <div className={styles.emptyText}>{empty}</div>}</div> }
function ReadinessList({ provider, sender, identities }: { provider: Array<Record<string, any>>; sender: Array<Record<string, any>>; identities: Array<Record<string, any>> }) { return <div className={styles.actionRail}><RiskLine label="Providers contrôlés" value={provider.length} tone={provider.some((row) => row.status === "ready") ? "positive" : "warning"} /><RiskLine label="Senders contrôlés" value={sender.length} tone={sender.some((row) => row.status === "ready") ? "positive" : "warning"} /><RiskLine label="Identités Email OS" value={identities.length} tone={identities.length ? "positive" : "warning"} /></div> }
function AttributionTable({ rows, conflicts }: { rows: Array<Record<string, any>>; conflicts: Array<Record<string, any>> }) { return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Event</th><th>Event ID</th><th>Model</th><th>Share</th><th>Value</th><th>Evidence</th><th>Status</th></tr></thead><tbody>{rows.slice(0, 100).map((row) => <tr key={row.id}><td>{row.event_type}</td><td>{row.event_id}</td><td>{row.attribution_model || row.attribution_method}</td><td>{percent(row.attribution_share)}</td><td>{money(row.attributed_value)}</td><td>{row.evidence_reference || "—"}</td><td><span className={statusClass(row.status)}>{row.status}</span></td></tr>)}</tbody></table>{!rows.length && <Empty title="Aucune attribution" text={`${conflicts.length} conflit(s) ouvert(s) ou historique vide.`} compact />}</div> }
function CostList({ rows }: { rows: Array<Record<string, any>> }) { return <div className={styles.actionRail}>{rows.slice(0, 10).map((row, index) => <div className={styles.actionCard} key={row.id || index}><span><span className={styles.actionCardTitle}>{row.label || row.category || "Coût"}</span><span className={styles.actionCardText}>{row.category || "other"} · {date(row.occurred_on)}</span></span><span><strong>{money(row.amount_mad)}</strong><br /><span className={statusClass(row.cost_state)}>{row.cost_state}</span></span></div>)}{!rows.length && <div className={styles.emptyText}>Aucun coût enregistré.</div>}</div> }

function kpisForExperience(experience: CampaignExperienceKey, data: CampaignPortfolio) {
  const summary = data.summary
  const common = [
    { label: "Campagnes", value: number(summary.total), detail: `${summary.active} actives` },
    { label: "Audience éligible", value: number(summary.eligibleAudience), detail: `${summary.enrolled} enrôlés` },
    { label: "Contacts exécutés", value: number(summary.contacted), detail: `${summary.providerFailures} échecs provider` },
    { label: "Réponses positives", value: number(summary.positiveReplies), detail: `${summary.replies} réponses totales` },
    { label: "Meetings", value: number(summary.meetings), detail: `${summary.opportunities} opportunités` },
    { label: "Revenu réalisé", value: money(summary.realizedMad), detail: `${money(summary.confirmedCostMad)} coût confirmé` },
  ]
  if (experience === "campaign-assets-studio") return [
    { label: "Séquences", value: number(data.sequences.length), detail: `${data.sequenceVersions.length} versions` },
    { label: "Étapes", value: number(data.sequenceSteps.length), detail: "email, WhatsApp, call, wait" },
    { label: "Templates", value: number(data.templates.length), detail: `${data.templateVersions.length} versions` },
    { label: "Providers ready", value: number(data.providerReadiness.filter((row) => row.status === "ready").length), detail: `${data.providerReadiness.length} contrôlés` },
    { label: "Senders ready", value: number(data.senderReadiness.filter((row) => row.status === "ready").length), detail: `${data.senderIdentities.length} identités Email OS` },
    { label: "Gates ouverts", value: number(Math.max(0, 4 - [data.sequenceVersions.length, data.templateVersions.length, data.providerReadiness.length, data.senderReadiness.length].filter(Boolean).length)), detail: "avant readiness" },
  ]
  if (experience === "campaign-performance") return [
    { label: "Enrolled", value: number(summary.enrolled), detail: `${summary.contacted} contactés` },
    { label: "Reply rate", value: summary.contacted ? percent((summary.replies / summary.contacted) * 100) : "0 %", detail: `${summary.positiveReplies} positives` },
    { label: "Meeting rate", value: summary.replies ? percent((summary.meetings / summary.replies) * 100) : "0 %", detail: `${summary.meetings} meetings` },
    { label: "Contracts", value: number(summary.contracts), detail: "objets canoniques" },
    { label: "Cost confirmed", value: money(summary.confirmedCostMad), detail: `${money(summary.estimatedCostMad)} estimé` },
    { label: "Realized revenue", value: money(summary.realizedMad), detail: "attribution vérifiée" },
  ]
  if (experience === "sdr-command") return [
    { label: "Backlog SDR", value: number(summary.sdrBacklog), detail: "due / overdue / review" },
    { label: "Replies", value: number(summary.replies), detail: `${summary.positiveReplies} positives` },
    { label: "Calls logged", value: number(data.communications.filter((row) => row.channel === "call").length), detail: "communication ledger" },
    { label: "Meetings", value: number(summary.meetings), detail: "créés canoniquement" },
    { label: "Opportunities", value: number(summary.opportunities), detail: "lineage campagne" },
    { label: "Suppressions", value: number(summary.openSuppressions), detail: "à respecter" },
  ]
  return common
}
function primaryActionFor(experience: CampaignExperienceKey): CampaignActionKind {
  if (experience === "campaign-command") return "create-campaign"
  if (experience === "campaign-board") return "transition-campaign"
  if (experience === "campaign-dossier") return "edit-campaign"
  if (experience === "campaign-assets-studio") return "create-sequence"
  if (experience === "campaign-live-room") return "evaluate-readiness"
  if (experience === "campaign-performance") return "close-performance-period"
  return "record-reply"
}
function emptyPortfolio(): CampaignPortfolio {
  return {
    campaigns: [], segments: [], segmentVersions: [], audienceSnapshots: [], audienceMembers: [], recipients: [], eligibility: [], suppressions: [], frequencyDecisions: [], sequences: [], sequenceVersions: [], sequenceSteps: [], sequenceBranches: [], templates: [], templateVersions: [], enrollments: [], stepExecutions: [], dispatchAttempts: [], replies: [], sdrAssignments: [], providerReadiness: [], senderReadiness: [], conversionEvents: [], attributions: [], attributionConflicts: [], costs: [], performancePeriods: [], experiments: [], experimentVariants: [], risks: [], recoveryPlans: [], recoveryCheckpoints: [], evidence: [], approvals: [], statusHistory: [], communications: [], deliveryEvents: [], tasks: [], appointments: [], opportunities: [], proposals: [], contracts: [], realizationEvents: [], senderIdentities: [],
    summary: { total:0,draft:0,approvalRequired:0,scheduled:0,active:0,paused:0,atRisk:0,completed:0,eligibleAudience:0,enrolled:0,contacted:0,replies:0,positiveReplies:0,meetings:0,opportunities:0,proposals:0,contracts:0,realizedMad:0,estimatedCostMad:0,confirmedCostMad:0,openSuppressions:0,providerFailures:0,sdrBacklog:0 }, schema: {}, syncedAt: new Date().toISOString(),
  }
}
