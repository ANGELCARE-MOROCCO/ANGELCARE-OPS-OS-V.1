"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  ContactRound,
  FileSignature,
  Filter,
  Gauge,
  Handshake,
  Layers3,
  Loader2,
  MapPin,
  Network,
  Plus,
  Radar,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  X,
  Zap,
} from "lucide-react"
import styles from "./ProspectEnterprise.module.css"
import { PROSPECT_ROUTE_CONTRACTS, PROSPECT_ROUTE_NAVIGATION } from "./route-contracts"
import type { ProspectEnterpriseMode, ProspectEnterpriseRow } from "./types"
import { mutateRevenueEndpoint, useProspectEnterpriseData } from "./useProspectEnterpriseData"
import { useEnterpriseDialog } from "./useEnterpriseDialog"

const STAGES = [
  { key: "new_lead", label: "Nouveaux", description: "Signaux à prendre en charge" },
  { key: "discovery", label: "Découverte", description: "Contexte et besoin" },
  { key: "qualification", label: "Qualification", description: "Fit, autorité, budget" },
  { key: "decision_map", label: "Décision", description: "Pouvoir et influence" },
  { key: "appointment_ready", label: "Rendez-vous", description: "Rencontre préparée" },
  { key: "proposal", label: "Proposition", description: "Offre en préparation" },
  { key: "negotiation", label: "Négociation", description: "Valeur à défendre" },
  { key: "contracting", label: "Contractualisation", description: "Accord et conditions" },
]

const fmtDh = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
const fmtDateTime = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

function dh(value: unknown) {
  return `${fmtDh.format(Number(value || 0))} Dh`
}

function pct(value: unknown) {
  return `${Math.max(0, Math.min(100, Math.round(Number(value || 0))))} %`
}

function date(value: unknown) {
  if (!value) return "Non planifiée"
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? "Non planifiée" : fmtDate.format(parsed)
}

function dateTime(value: unknown) {
  if (!value) return "Non horodaté"
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? "Non horodaté" : fmtDateTime.format(parsed)
}

function initials(value: unknown) {
  return String(value || "AC")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AC"
}

function stageLabel(value: unknown) {
  const key = String(value || "new_lead")
  return STAGES.find((stage) => stage.key === key)?.label || key.replaceAll("_", " ")
}

function badgeTone(value: unknown): "green" | "amber" | "red" | "blue" | "violet" | undefined {
  const normalized = String(value || "").toLowerCase()
  if (["won", "closed_won", "approved", "active", "low", "on_track"].includes(normalized)) return "green"
  if (["critical", "high", "blocked", "overdue", "lost", "closed_lost"].includes(normalized)) return "red"
  if (["medium", "proposal", "negotiation", "pending", "review"].includes(normalized)) return "amber"
  if (["decision_map", "influencer", "sponsor"].includes(normalized)) return "violet"
  return "blue"
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function prospectValue(row: ProspectEnterpriseRow) {
  return Math.max(number(row.prospect_value_mad), number(row.open_opportunity_value_mad))
}

function prospectLink(row: ProspectEnterpriseRow) {
  return `/revenue-command-center/prospects/${encodeURIComponent(row.prospect_id)}`
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return <span className={styles.panelTitleIcon}>{children}</span>
}

function Panel({
  icon,
  title,
  subtitle,
  action,
  children,
  className,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`${styles.panel} ${className || ""}`}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <IconBadge>{icon}</IconBadge>
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "green" | "amber" | "red" | "blue" | "violet" }) {
  return <span className={styles.badge} data-tone={tone}>{children}</span>
}

function Progress({ value }: { value: number }) {
  return (
    <div className={styles.progressTrack} aria-label={`Progression ${Math.round(value)} %`}>
      <div className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function EntityCell({ row }: { row: ProspectEnterpriseRow }) {
  return (
    <Link href={prospectLink(row)} className={styles.entityLink}>
      <div className={styles.entityName}>
        <span className={styles.avatar}>{initials(row.prospect_name)}</span>
        <div>
          <strong>{row.prospect_name || "Prospect sans nom"}</strong>
          <small>{row.account_name || row.company || "Compte à structurer"} · {row.city || "Ville non attribuée"}</small>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyStateIcon}><Users size={21} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionHref && actionLabel ? <Link className={styles.ghostButton} href={actionHref} style={{ marginTop: 14 }}>{actionLabel}<ArrowRight size={14} /></Link> : null}
    </div>
  )
}

function PortfolioTable({ rows, limit = 25 }: { rows: ProspectEnterpriseRow[]; limit?: number }) {
  if (!rows.length) {
    return <EmptyState title="Aucun dossier visible" description="Créez un prospect ou adaptez les filtres pour alimenter ce portefeuille." actionHref="/revenue-command-center/prospects/new" actionLabel="Créer le premier dossier" />
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Prospect / Compte</th>
            <th>Étape</th>
            <th>Responsable</th>
            <th>Valeur</th>
            <th>Score</th>
            <th>Décideurs</th>
            <th>Actions ouvertes</th>
            <th>Risques</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((row) => (
            <tr key={row.prospect_id}>
              <td><EntityCell row={row} /></td>
              <td><Badge tone={badgeTone(row.prospect_stage)}>{stageLabel(row.prospect_stage)}</Badge></td>
              <td>{row.owner || "Non attribué"}</td>
              <td><strong>{dh(prospectValue(row))}</strong></td>
              <td>
                <div style={{ minWidth: 92 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span>{Math.round(number(row.score))}/100</span><span>{pct(row.prospect_probability)}</span></div>
                  <Progress value={number(row.score)} />
                </div>
              </td>
              <td>{number(row.decision_member_count)}</td>
              <td>{number(row.open_task_count)} {number(row.overdue_task_count) ? <Badge tone="red">{number(row.overdue_task_count)} en retard</Badge> : null}</td>
              <td>{number(row.open_risk_count) ? <Badge tone="red">{number(row.open_risk_count)} ouvert(s)</Badge> : <Badge tone="green">Maîtrisé</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type ProspectEnterpriseModalKind = "opportunity" | "qualification" | "decision" | "risk" | null
type ModalKind = ProspectEnterpriseModalKind

export function EnterpriseActionModal({
  kind,
  prospect,
  onClose,
  onSaved,
  contactOptions = [],
}: {
  kind: ModalKind
  prospect?: ProspectEnterpriseRow | null
  contactOptions?: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useEnterpriseDialog(Boolean(kind), onClose)
  const [form, setForm] = useState<Record<string, string>>({
    title: prospect ? `Développement ${prospect.account_name || prospect.prospect_name}` : "",
    valueMad: String(prospectValue(prospect || ({} as ProspectEnterpriseRow)) || ""),
    probability: String(prospect?.prospect_probability || 45),
    expectedCloseDate: "",
    nextStep: "",
    needScore: String(prospect?.score || 60),
    authorityScore: "50",
    budgetScore: "50",
    timingScore: "50",
    fitScore: String(prospect?.score || 60),
    urgencyScore: "50",
    evidenceQuality: "50",
    notes: "",
    contactId: "",
    memberRole: "decision_maker",
    influenceScore: "75",
    supportLevel: "neutral",
    accessLevel: "indirect",
    engagementStrategy: "",
    riskType: "commercial",
    severity: "medium",
    riskTitle: "",
    impactMad: "",
    mitigationPlan: "",
    owner: prospect?.owner || "",
    dueAt: "",
  })

  if (!kind) return null
  const prospectId = prospect?.prospect_id || ""
  const definitions = {
    opportunity: {
      icon: <BriefcaseBusiness size={18} />,
      title: "Créer une opportunité reliée",
      description: "Ouvrir une opportunité traçable sans perdre le lien avec le prospect, le compte et la valeur du dossier.",
    },
    qualification: {
      icon: <ClipboardCheck size={18} />,
      title: "Évaluation de qualification",
      description: "Enregistrer une évaluation pondérée et fondée sur des preuves avant toute progression commerciale.",
    },
    decision: {
      icon: <Network size={18} />,
      title: "Ajouter un membre de décision",
      description: "Relier un contact existant à la cartographie de pouvoir, d’influence et d’accès du dossier.",
    },
    risk: {
      icon: <ShieldAlert size={18} />,
      title: "Déclarer un risque commercial",
      description: "Rendre le risque visible, quantifié, attribué et assorti d’un plan de mitigation.",
    },
  }[kind]

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    if (!prospectId) {
      setError("Sélectionnez d’abord un dossier prospect.")
      return
    }
    setSaving(true)
    setError("")
    try {
      if (kind === "opportunity") {
        await mutateRevenueEndpoint("/api/revenue-command-center/opportunities", "POST", {
          prospectId,
          accountId: prospect?.account_id || null,
          contactId: prospect?.contact_id || null,
          title: form.title,
          valueMad: Number(form.valueMad || 0),
          probability: Number(form.probability || 0),
          expectedCloseDate: form.expectedCloseDate || null,
          nextStep: form.nextStep,
          owner: prospect?.owner || "BD Officer",
          stage: "qualification",
        })
      }
      if (kind === "qualification") {
        await mutateRevenueEndpoint(`/api/revenue-command-center/prospects/${encodeURIComponent(prospectId)}/qualification`, "POST", {
          needScore: Number(form.needScore),
          authorityScore: Number(form.authorityScore),
          budgetScore: Number(form.budgetScore),
          timingScore: Number(form.timingScore),
          fitScore: Number(form.fitScore),
          urgencyScore: Number(form.urgencyScore),
          evidenceQuality: Number(form.evidenceQuality),
          notes: form.notes,
        })
      }
      if (kind === "decision") {
        await mutateRevenueEndpoint(`/api/revenue-command-center/prospects/${encodeURIComponent(prospectId)}/decision-map`, "POST", {
          accountId: prospect?.account_id || null,
          contactId: form.contactId,
          memberRole: form.memberRole,
          influenceScore: Number(form.influenceScore),
          supportLevel: form.supportLevel,
          accessLevel: form.accessLevel,
          engagementStrategy: form.engagementStrategy,
        })
      }
      if (kind === "risk") {
        await mutateRevenueEndpoint(`/api/revenue-command-center/prospects/${encodeURIComponent(prospectId)}/risks`, "POST", {
          accountId: prospect?.account_id || null,
          riskType: form.riskType,
          severity: form.severity,
          probability: Number(form.probability || 50),
          impactMad: Number(form.impactMad || 0),
          title: form.riskTitle,
          mitigationPlan: form.mitigationPlan,
          owner: form.owner,
          dueAt: form.dueAt || null,
        })
      }
      onSaved()
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’opération n’a pas pu être enregistrée.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <section ref={dialogRef} tabIndex={-1} className={`${styles.modal} ${kind === "qualification" ? styles.modalWide : ""}`} role="dialog" aria-modal="true" aria-labelledby="prospect-enterprise-modal-title">
        <header className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span className={styles.modalTitleIcon}>{definitions.icon}</span>
            <div>
              <h2 id="prospect-enterprise-modal-title">{definitions.title}</h2>
              <p>{definitions.description}</p>
            </div>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            {kind === "opportunity" ? (
              <>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Titre de l’opportunité</label><input value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
                <div className={styles.field}><label>Valeur estimée</label><input type="number" value={form.valueMad} onChange={(e) => update("valueMad", e.target.value)} /></div>
                <div className={styles.field}><label>Probabilité</label><input type="number" min="0" max="100" value={form.probability} onChange={(e) => update("probability", e.target.value)} /></div>
                <div className={styles.field}><label>Clôture attendue</label><input type="date" value={form.expectedCloseDate} onChange={(e) => update("expectedCloseDate", e.target.value)} /></div>
                <div className={styles.field}><label>Prochaine étape</label><input value={form.nextStep} onChange={(e) => update("nextStep", e.target.value)} placeholder="Décision concrète attendue" /></div>
              </>
            ) : null}
            {kind === "qualification" ? (
              <>
                {[
                  ["needScore", "Besoin"], ["authorityScore", "Autorité"], ["budgetScore", "Budget"], ["timingScore", "Timing"], ["fitScore", "Adéquation"], ["urgencyScore", "Urgence"], ["evidenceQuality", "Qualité des preuves"],
                ].map(([key, label]) => <div className={styles.field} key={key}><label>{label}</label><input type="number" min="0" max="100" value={form[key]} onChange={(e) => update(key, e.target.value)} /></div>)}
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Notes et preuves</label><textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Faits observés, documents, échanges et hypothèses à confirmer." /></div>
              </>
            ) : null}
            {kind === "decision" ? (
              <>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Contact existant</label>{contactOptions.length ? <select value={form.contactId} onChange={(e) => update("contactId", e.target.value)}><option value="">Sélectionner un contact</option>{contactOptions.map((contact: any) => <option key={contact.id} value={contact.id}>{contact.full_name} · {contact.role_title || "fonction à confirmer"}</option>)}</select> : <input value={form.contactId} onChange={(e) => update("contactId", e.target.value)} placeholder="Identifiant du contact Revenue Command" />}</div>
                <div className={styles.field}><label>Rôle dans la décision</label><select value={form.memberRole} onChange={(e) => update("memberRole", e.target.value)}><option value="decision_maker">Décideur</option><option value="economic_buyer">Acheteur économique</option><option value="sponsor">Sponsor</option><option value="influencer">Influenceur</option><option value="user">Utilisateur</option><option value="blocker">Bloqueur</option></select></div>
                <div className={styles.field}><label>Influence / 100</label><input type="number" min="0" max="100" value={form.influenceScore} onChange={(e) => update("influenceScore", e.target.value)} /></div>
                <div className={styles.field}><label>Niveau de soutien</label><select value={form.supportLevel} onChange={(e) => update("supportLevel", e.target.value)}><option value="champion">Champion</option><option value="supportive">Favorable</option><option value="neutral">Neutre</option><option value="resistant">Résistant</option><option value="hostile">Hostile</option></select></div>
                <div className={styles.field}><label>Niveau d’accès</label><select value={form.accessLevel} onChange={(e) => update("accessLevel", e.target.value)}><option value="direct">Direct</option><option value="indirect">Indirect</option><option value="unknown">Inconnu</option><option value="blocked">Bloqué</option></select></div>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Stratégie d’engagement</label><textarea value={form.engagementStrategy} onChange={(e) => update("engagementStrategy", e.target.value)} /></div>
              </>
            ) : null}
            {kind === "risk" ? (
              <>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Risque</label><input value={form.riskTitle} onChange={(e) => update("riskTitle", e.target.value)} placeholder="Ex. absence de sponsor interne" /></div>
                <div className={styles.field}><label>Type</label><select value={form.riskType} onChange={(e) => update("riskType", e.target.value)}><option value="commercial">Commercial</option><option value="decision">Décision</option><option value="budget">Budget</option><option value="competition">Concurrence</option><option value="timing">Timing</option><option value="relationship">Relation</option></select></div>
                <div className={styles.field}><label>Sévérité</label><select value={form.severity} onChange={(e) => update("severity", e.target.value)}><option value="low">Faible</option><option value="medium">Modérée</option><option value="high">Élevée</option><option value="critical">Critique</option></select></div>
                <div className={styles.field}><label>Probabilité</label><input type="number" min="0" max="100" value={form.probability} onChange={(e) => update("probability", e.target.value)} /></div>
                <div className={styles.field}><label>Impact</label><input type="number" value={form.impactMad} onChange={(e) => update("impactMad", e.target.value)} /></div>
                <div className={styles.field}><label>Responsable</label><input value={form.owner} onChange={(e) => update("owner", e.target.value)} /></div>
                <div className={styles.field}><label>Échéance</label><input type="datetime-local" value={form.dueAt} onChange={(e) => update("dueAt", e.target.value)} /></div>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Plan de mitigation</label><textarea value={form.mitigationPlan} onChange={(e) => update("mitigationPlan", e.target.value)} /></div>
              </>
            ) : null}
          </div>
          {error ? <div className={styles.schemaNotice} style={{ marginTop: 14 }}><AlertTriangle size={18} /><div><strong>Enregistrement impossible</strong><p>{error}</p></div></div> : null}
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.ghostButton} onClick={onClose}>Annuler</button>
          <button type="button" className={styles.ghostButton} onClick={submit} disabled={saving}>{saving ? <Loader2 size={15} className={styles.loadingSpin} /> : <CheckCircle2 size={15} />} Enregistrer</button>
        </footer>
      </section>
    </div>
  )
}

function Kpis({ summary }: { summary: any }) {
  const cards = [
    { icon: <Users size={15} />, label: "Prospects actifs", value: fmtDh.format(number(summary?.prospectCount)), note: "Dossiers exploitables" },
    { icon: <Building2 size={15} />, label: "Comptes structurés", value: fmtDh.format(number(summary?.accountCount)), note: "Identités commerciales" },
    { icon: <CircleDollarSign size={15} />, label: "Valeur pipeline", value: dh(summary?.pipelineValueMad), note: "Opportunités ouvertes" },
    { icon: <TrendingUp size={15} />, label: "Prévision pondérée", value: dh(summary?.weightedPipelineMad), note: "Valeur × probabilité" },
    { icon: <ShieldAlert size={15} />, label: "Risques ouverts", value: fmtDh.format(number(summary?.openRiskCount)), note: "Mitigation requise" },
    { icon: <Clock3 size={15} />, label: "Actions en retard", value: fmtDh.format(number(summary?.overdueTaskCount)), note: "Discipline d’exécution" },
  ]
  return <div className={styles.kpiGrid}>{cards.map((card) => <article key={card.label} className={styles.kpiCard}><span className={styles.kpiIcon}>{card.icon}</span><span>{card.label}</span><strong>{card.value}</strong><small>{card.note}</small></article>)}</div>
}

function ExecutiveView({ prospects, summary }: { prospects: ProspectEnterpriseRow[]; summary: any }) {
  const strategic = [...prospects].sort((a, b) => prospectValue(b) - prospectValue(a)).slice(0, 7)
  const intervention = prospects.filter((row) => number(row.open_risk_count) > 0 || number(row.overdue_task_count) > 0).slice(0, 8)
  const concentration = summary?.pipelineValueMad ? Math.round((strategic.reduce((sum, row) => sum + prospectValue(row), 0) / summary.pipelineValueMad) * 100) : 0
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<Gauge size={16} />} title="Portefeuille stratégique" subtitle="Comptes et prospects qui concentrent la valeur et l’attention de Direction">
        <div className={styles.accountPortfolio}>
          {strategic.slice(0, 6).map((row) => (
            <Link href={prospectLink(row)} className={styles.accountCard} key={row.prospect_id}>
              <div className={styles.accountCardTop}><div><h3>{row.account_name || row.prospect_name}</h3><p>{row.city || "Ville non attribuée"} · {row.industry || row.account_segment || "Segment à confirmer"}</p></div><Badge tone={badgeTone(row.priority)}>{row.priority || "medium"}</Badge></div>
              <div className={styles.accountValue}><span>Valeur protégée</span><strong>{dh(prospectValue(row))}</strong></div>
              <div className={styles.accountStats}><div><span>Score</span><strong>{Math.round(number(row.score))}/100</strong></div><div><span>Décideurs</span><strong>{number(row.decision_member_count)}</strong></div><div><span>Risques</span><strong>{number(row.open_risk_count)}</strong></div></div>
            </Link>
          ))}
        </div>
      </Panel>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<Target size={16} />} title="Concentration de valeur" subtitle="Part du pipeline portée par les principaux dossiers">
          <div className={styles.donut} style={{ "--value": concentration } as React.CSSProperties}><div className={styles.donutCenter}><strong>{concentration}%</strong><span>du pipeline concentré</span></div></div>
        </Panel>
        <Panel icon={<ShieldAlert size={16} />} title="Interventions Direction" subtitle="Dossiers exposés ou sans discipline de suivi">
          <div className={styles.priorityList}>{intervention.length ? intervention.map((row) => <Link href={prospectLink(row)} className={styles.priorityItem} key={row.prospect_id} style={{ textDecoration: "none" }}><span className={styles.itemIcon}><AlertTriangle size={14} /></span><div><h3>{row.prospect_name}</h3><p>{number(row.open_risk_count)} risque(s) · {number(row.overdue_task_count)} action(s) en retard</p></div><span className={styles.itemMetric}>{dh(prospectValue(row))}</span></Link>) : <EmptyState title="Aucune intervention critique" description="Les dossiers visibles ne présentent pas de risque ou de retard confirmé." />}</div>
        </Panel>
      </div>
    </div>
  )
}

function PipelineView({ prospects }: { prospects: ProspectEnterpriseRow[] }) {
  return (
    <Panel icon={<Layers3 size={16} />} title="Pipeline opérationnel" subtitle="Chaque colonne représente une étape commerciale et sa valeur réellement visible">
      <div className={styles.pipelineBoard}>
        {STAGES.map((stage) => {
          const rows = prospects.filter((row) => String(row.prospect_stage) === stage.key)
          const value = rows.reduce((sum, row) => sum + prospectValue(row), 0)
          return (
            <section className={styles.pipelineColumn} key={stage.key}>
              <header className={styles.pipelineHeader}><div className={styles.pipelineHeaderTop}><h3>{stage.label}</h3><strong>{rows.length}</strong></div><p>{dh(value)} · {stage.description}</p></header>
              <div className={styles.pipelineCards}>
                {rows.slice(0, 12).map((row) => <Link href={prospectLink(row)} className={styles.pipelineCard} key={row.prospect_id}><h4>{row.prospect_name}</h4><p>{row.account_name || row.company || "Compte à structurer"} · {row.owner || "Non attribué"}</p><div className={styles.pipelineCardMeta}><span>{dh(prospectValue(row))}</span><span>{Math.round(number(row.score))}/100</span></div></Link>)}
                {!rows.length ? <div style={{ padding: 12, color: "#8495a5", fontSize: 9, textAlign: "center" }}>Aucun dossier dans cette étape</div> : null}
              </div>
            </section>
          )
        })}
      </div>
    </Panel>
  )
}

function QualificationView({ prospects, qualifications, onOpen }: { prospects: ProspectEnterpriseRow[]; qualifications: any[]; onOpen: (kind: ModalKind, row: ProspectEnterpriseRow) => void }) {
  const latestByProspect = new Map<string, any>()
  for (const assessment of qualifications || []) if (!latestByProspect.has(assessment.prospect_id)) latestByProspect.set(assessment.prospect_id, assessment)
  const rows = prospects.filter((row) => ["new_lead", "discovery", "qualification"].includes(String(row.prospect_stage)) || latestByProspect.has(row.prospect_id))
  return (
    <div className={styles.matrix}>
      {rows.slice(0, 18).map((row) => {
        const assessment = latestByProspect.get(row.prospect_id)
        const score = number(assessment?.overall_score ?? row.score)
        return <article className={styles.matrixCard} key={row.prospect_id}><div className={styles.matrixCardTop}><div><h3>{row.prospect_name}</h3><p>{row.account_name || row.company || "Compte à structurer"}<br />Responsable : {row.owner || "Non attribué"}</p></div><span className={styles.scoreRing} style={{ "--score": score } as React.CSSProperties}><strong>{Math.round(score)}</strong></span></div><div className={styles.matrixDetails}><div><span>Besoin</span><strong>{Math.round(number(assessment?.need_score))}</strong></div><div><span>Autorité</span><strong>{Math.round(number(assessment?.authority_score))}</strong></div><div><span>Budget</span><strong>{Math.round(number(assessment?.budget_score))}</strong></div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 13 }}><Badge tone={score >= 70 ? "green" : score >= 45 ? "amber" : "red"}>{assessment?.recommendation || "À évaluer"}</Badge><button className={styles.ghostButton} type="button" onClick={() => onOpen("qualification", row)}>Évaluer</button></div></article>
      })}
      {!rows.length ? <div style={{ gridColumn: "1 / -1" }}><EmptyState title="Aucun dossier à qualifier" description="Les dossiers en découverte et qualification apparaîtront ici." actionHref="/revenue-command-center/prospects/new" actionLabel="Créer un prospect" /></div> : null}
    </div>
  )
}

function DecisionMapView({ prospects, members, onOpen }: { prospects: ProspectEnterpriseRow[]; members: any[]; onOpen: (kind: ModalKind, row: ProspectEnterpriseRow) => void }) {
  const target = [...prospects].sort((a, b) => number(b.decision_member_count) - number(a.decision_member_count) || prospectValue(b) - prospectValue(a))[0]
  const targetMembers = target ? (members || []).filter((member) => member.prospect_id === target.prospect_id || (target.account_id && member.account_id === target.account_id)) : []
  if (!target) return <EmptyState title="Aucun dossier à cartographier" description="Créez un prospect et son compte avant d’identifier les membres du centre de décision." />
  return (
    <div className={styles.contentGrid}>
      <div className={styles.decisionStage}>
        <div className={styles.decisionCore}><strong>{target.account_name || target.prospect_name}</strong><span>{target.decision_member_count || 0} membre(s) identifié(s)<br />{dh(prospectValue(target))}</span></div>
        <div className={styles.decisionMembers}>
          {targetMembers.slice(0, 6).map((member: any) => <article className={styles.decisionMember} key={member.id}><h3>{member.revenue_contacts?.full_name || "Contact relié"}</h3><p>{member.revenue_contacts?.role_title || "Fonction à confirmer"}<br />Stratégie : {member.engagement_strategy || "À définir"}</p><div className={styles.decisionMemberFooter}><Badge tone={badgeTone(member.member_role)}>{String(member.member_role || "influencer").replaceAll("_", " ")}</Badge><Badge tone={badgeTone(member.support_level)}>{member.support_level || "neutral"}</Badge><Badge>{Math.round(number(member.influence_score))}/100</Badge></div></article>)}
          {!targetMembers.length ? <article className={styles.decisionMember}><h3>Cartographie non démarrée</h3><p>Ajoutez les décideurs, sponsors, influenceurs, utilisateurs et bloqueurs de cette organisation.</p></article> : null}
        </div>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<Network size={16} />} title="Dossier cartographié" subtitle="Compte prioritaire sélectionné automatiquement"><div className={styles.priorityList}><div className={styles.priorityItem}><span className={styles.itemIcon}><Building2 size={14} /></span><div><h3>{target.account_name || target.prospect_name}</h3><p>{target.city || "Ville non attribuée"} · {stageLabel(target.prospect_stage)}</p></div><span className={styles.itemMetric}>{dh(prospectValue(target))}</span></div><div className={styles.priorityItem}><span className={styles.itemIcon}><ContactRound size={14} /></span><div><h3>{target.primary_contact_name || target.contact_name || "Contact principal manquant"}</h3><p>{target.primary_contact_role || "Rôle à qualifier"}</p></div><span className={styles.itemMetric}>{target.decision_member_count || 0} membre(s)</span></div></div><button type="button" className={styles.ghostButton} style={{ marginTop: 12, width: "100%" }} onClick={() => onOpen("decision", target)}><Plus size={14} /> Ajouter un membre</button></Panel>
        <Panel icon={<ShieldCheck size={16} />} title="Règle de progression" subtitle="Contrôle avant proposition"><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Un décideur économique doit être identifié.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Le niveau de soutien doit être qualifié.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Une stratégie d’engagement doit être attribuée.</div></div></Panel>
      </div>
    </div>
  )
}

function AppointmentsView({ prospects }: { prospects: ProspectEnterpriseRow[] }) {
  const rows = prospects.filter((row) => number(row.upcoming_meeting_count) > 0 || ["appointment_ready", "proposal", "negotiation"].includes(String(row.prospect_stage))).sort((a, b) => number(b.upcoming_meeting_count) - number(a.upcoming_meeting_count))
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<CalendarDays size={16} />} title="Dossiers à préparer" subtitle="Prospects disposant d’un rendez-vous ou arrivés à l’étape de rencontre">
        <div className={styles.timeline}>{rows.slice(0, 15).map((row) => <div className={styles.timelineItem} key={row.prospect_id}><span className={styles.timelineDot}><CalendarClock size={14} /></span><div><Link href={prospectLink(row)} className={styles.entityLink}><h3>{row.prospect_name}</h3></Link><p>{row.account_name || row.company || "Compte à structurer"} · Objectif : confirmer la prochaine décision commerciale</p></div><span className={styles.timelineDate}>{number(row.upcoming_meeting_count)} rendez-vous</span></div>)}{!rows.length ? <EmptyState title="Aucun rendez-vous relié" description="Planifiez une rencontre depuis le dossier prospect ou le centre Rendez-vous." actionHref="/revenue-command-center/appointments/new" actionLabel="Planifier" /> : null}</div>
      </Panel>
      <Panel icon={<ClipboardCheck size={16} />} title="Contrôle de préparation" subtitle="Le rendez-vous doit être exploitable"><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Objectif et résultat attendu documentés.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Décideurs et participants confirmés.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Questions, risques et documents préparés.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Prochaine action générée après l’issue.</div></div><Link href="/revenue-command-center/appointments" className={styles.ghostButton} style={{ marginTop: 14, width: "100%" }}>Ouvrir le centre Rendez-vous <ArrowRight size={14} /></Link></Panel>
    </div>
  )
}

function ProposalView({ prospects, opportunities, onOpen }: { prospects: ProspectEnterpriseRow[]; opportunities: any[]; onOpen: (kind: ModalKind, row: ProspectEnterpriseRow) => void }) {
  const opportunityByProspect = new Map<string, any[]>()
  for (const opportunity of opportunities || []) {
    const list = opportunityByProspect.get(opportunity.prospect_id) || []
    list.push(opportunity)
    opportunityByProspect.set(opportunity.prospect_id, list)
  }
  const rows = prospects.filter((row) => ["proposal", "appointment_ready", "decision_map", "qualification"].includes(String(row.prospect_stage)) || opportunityByProspect.has(row.prospect_id))
  return (
    <Panel icon={<FileSignature size={16} />} title="Préparation des propositions" subtitle="Dossiers évalués selon leur maturité, leur décision et leur opportunité">
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Dossier</th><th>Maturité</th><th>Décision</th><th>Opportunités</th><th>Valeur</th><th>Blocage</th><th>Action</th></tr></thead><tbody>{rows.slice(0, 40).map((row) => { const opps = opportunityByProspect.get(row.prospect_id) || []; const maturity = Math.round((number(row.score) + Math.min(100, number(row.decision_member_count) * 20) + (opps.length ? 85 : 25)) / 3); const blocker = !opps.length ? "Opportunité absente" : number(row.decision_member_count) === 0 ? "Décideur non identifié" : number(row.score) < 60 ? "Qualification insuffisante" : "Prêt pour cadrage"; return <tr key={row.prospect_id}><td><EntityCell row={row} /></td><td><strong>{maturity}/100</strong><Progress value={maturity} /></td><td>{number(row.decision_member_count)} membre(s)</td><td>{opps.length}</td><td>{dh(opps.reduce((sum, opp) => sum + number(opp.value_mad), prospectValue(row)))}</td><td><Badge tone={blocker === "Prêt pour cadrage" ? "green" : "amber"}>{blocker}</Badge></td><td>{!opps.length ? <button type="button" className={styles.ghostButton} onClick={() => onOpen("opportunity", row)}><Plus size={13} /> Opportunité</button> : <Link href={`${prospectLink(row)}/proposal`} className={styles.ghostButton}>Ouvrir <ArrowRight size={13} /></Link>}</td></tr> })}</tbody></table></div>
    </Panel>
  )
}

function NegotiationView({ prospects, opportunities }: { prospects: ProspectEnterpriseRow[]; opportunities: any[] }) {
  const negotiationOpps = (opportunities || []).filter((opp) => ["negotiation", "proposal", "contracting"].includes(String(opp.stage)) && opp.status !== "archived")
  const byProspect = new Map(prospects.map((row) => [row.prospect_id, row]))
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<Handshake size={16} />} title="Dossiers en défense de valeur" subtitle="Offres et opportunités nécessitant arbitrage, objections ou protection de marge">
        <div className={styles.priorityList}>{negotiationOpps.slice(0, 18).map((opp: any) => { const row = byProspect.get(opp.prospect_id); return <Link key={opp.id} href={row ? `${prospectLink(row)}/negotiation` : "/revenue-command-center/prospects/negotiation"} className={styles.priorityItem} style={{ textDecoration: "none" }}><span className={styles.itemIcon}><Handshake size={14} /></span><div><h3>{opp.title}</h3><p>{row?.prospect_name || "Prospect relié"} · Étape {stageLabel(opp.stage)} · {opp.owner || "Non attribué"}</p></div><span className={styles.itemMetric}>{dh(opp.value_mad)}</span></Link>})}{!negotiationOpps.length ? <EmptyState title="Aucune négociation active" description="Les opportunités en proposition, négociation ou contractualisation apparaîtront ici." /> : null}</div>
      </Panel>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<ShieldCheck size={16} />} title="Garde-fous de négociation" subtitle="Contrôles obligatoires avant concession"><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Valeur, marge et limite de concession visibles.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Objection et position du client documentées.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Approbateur identifié au-delà du seuil.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Contrepartie obtenue pour chaque concession.</div></div></Panel>
        <Panel icon={<CircleDollarSign size={16} />} title="Valeur exposée" subtitle="Total des opportunités dans la zone de négociation"><div className={styles.scoreLarge}><strong>{dh(negotiationOpps.reduce((sum: number, opp: any) => sum + number(opp.value_mad), 0))}</strong><span>La valeur doit rester reliée aux décisions, aux objections et aux conditions contractuelles.</span></div></Panel>
      </div>
    </div>
  )
}

function RecoveryView({ prospects }: { prospects: ProspectEnterpriseRow[] }) {
  const rows = prospects.filter((row) => String(row.prospect_stage) === "recovery" || number(row.overdue_task_count) > 0 || (row.last_activity_at && Date.now() - new Date(String(row.last_activity_at)).getTime() > 14 * 86400000)).sort((a, b) => number(b.overdue_task_count) - number(a.overdue_task_count) || prospectValue(b) - prospectValue(a))
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<RotateCcw size={16} />} title="Portefeuille à récupérer" subtitle="Dossiers silencieux, stagnants ou exposés à une perte évitable"><PortfolioTable rows={rows} limit={35} /></Panel>
      <Panel icon={<Zap size={16} />} title="Doctrine Revenue Rescue" subtitle="Intervention structurée, pas relance aléatoire"><div className={styles.timeline}><div className={styles.timelineItem}><span className={styles.timelineDot}><Search size={14} /></span><div><h3>Diagnostiquer</h3><p>Identifier le vrai blocage, l’acteur manquant et la valeur exposée.</p></div></div><div className={styles.timelineItem}><span className={styles.timelineDot}><Target size={14} /></span><div><h3>Choisir l’intervention</h3><p>Message, appel, sponsor, nouvelle proposition ou escalade de Direction.</p></div></div><div className={styles.timelineItem}><span className={styles.timelineDot}><Clock3 size={14} /></span><div><h3>Fixer la limite</h3><p>Attribuer un responsable, une échéance et un résultat mesurable.</p></div></div><div className={styles.timelineItem}><span className={styles.timelineDot}><CheckCircle2 size={14} /></span><div><h3>Clôturer honnêtement</h3><p>Réactivation, maintien en nurturing ou perte documentée.</p></div></div></div></Panel>
    </div>
  )
}

function AnalyticsView({ prospects, summary }: { prospects: ProspectEnterpriseRow[]; summary: any }) {
  const stages = STAGES.map((stage) => ({ ...stage, count: prospects.filter((row) => String(row.prospect_stage) === stage.key).length, value: prospects.filter((row) => String(row.prospect_stage) === stage.key).reduce((sum, row) => sum + prospectValue(row), 0) }))
  const maxCount = Math.max(1, ...stages.map((stage) => stage.count))
  const qualified = prospects.filter((row) => number(row.score) >= 70).length
  const qualityRate = prospects.length ? Math.round((qualified / prospects.length) * 100) : 0
  return (
    <div className={styles.chartGrid}>
      <Panel icon={<BarChart3 size={16} />} title="Distribution par étape" subtitle="Volume visible et valeur portée par chaque phase du parcours"><div className={styles.barChart}>{stages.map((stage) => <div className={styles.barItem} key={stage.key}><strong>{stage.count}</strong><div className={styles.bar} style={{ height: `${Math.max(3, (stage.count / maxCount) * 100)}%` }} /><span>{stage.label}<br />{dh(stage.value)}</span></div>)}</div></Panel>
      <Panel icon={<Gauge size={16} />} title="Qualité du portefeuille" subtitle="Part des dossiers ayant un score au moins égal à 70"><div className={styles.donut} style={{ "--value": qualityRate } as React.CSSProperties}><div className={styles.donutCenter}><strong>{qualityRate}%</strong><span>dossiers qualifiés</span></div></div><div className={styles.priorityList}><div className={styles.priorityItem}><span className={styles.itemIcon}><CircleDollarSign size={14} /></span><div><h3>Prévision pondérée</h3><p>Valeur ajustée par la probabilité</p></div><span className={styles.itemMetric}>{dh(summary?.weightedPipelineMad)}</span></div><div className={styles.priorityItem}><span className={styles.itemIcon}><ShieldAlert size={14} /></span><div><h3>Risques ouverts</h3><p>Interventions de mitigation</p></div><span className={styles.itemMetric}>{number(summary?.openRiskCount)}</span></div></div></Panel>
    </div>
  )
}

function PerformanceView({ prospects }: { prospects: ProspectEnterpriseRow[] }) {
  const owners = new Map<string, { owner: string; rows: ProspectEnterpriseRow[] }>()
  prospects.forEach((row) => { const owner = row.owner || "Non attribué"; const bucket = owners.get(owner) || { owner, rows: [] }; bucket.rows.push(row); owners.set(owner, bucket) })
  const leaderboard = [...owners.values()].map((bucket) => ({ owner: bucket.owner, count: bucket.rows.length, value: bucket.rows.reduce((sum, row) => sum + prospectValue(row), 0), weighted: bucket.rows.reduce((sum, row) => sum + number(row.weighted_pipeline_mad), 0), overdue: bucket.rows.reduce((sum, row) => sum + number(row.overdue_task_count), 0), risk: bucket.rows.reduce((sum, row) => sum + number(row.open_risk_count), 0), averageScore: bucket.rows.length ? Math.round(bucket.rows.reduce((sum, row) => sum + number(row.score), 0) / bucket.rows.length) : 0 })).sort((a, b) => b.weighted - a.weighted || b.value - a.value)
  return (
    <Panel icon={<UserRoundCheck size={16} />} title="Discipline et performance par responsable" subtitle="Valeur, qualité, retards et risques du portefeuille attribué">
      <div className={styles.leaderboard}>{leaderboard.map((item, index) => <div className={styles.leaderRow} key={item.owner}><span className={styles.rank}>{index + 1}</span><div className={styles.leaderName}><strong>{item.owner}</strong><span>{item.count} dossier(s) attribué(s)</span></div><div><Progress value={item.averageScore} /></div><div className={styles.leaderMetric}><strong>{dh(item.value)}</strong><span>Valeur</span></div><div className={styles.leaderMetric}><strong>{item.overdue}</strong><span>Retards</span></div><div className={styles.leaderMetric}><strong>{item.risk}</strong><span>Risques</span></div></div>)}{!leaderboard.length ? <EmptyState title="Aucun portefeuille attribué" description="L’attribution des responsables permettra la comparaison de charge et de performance." /> : null}</div>
    </Panel>
  )
}

function HighValueView({ prospects, threshold }: { prospects: ProspectEnterpriseRow[]; threshold: number }) {
  const rows = [...prospects].filter((row) => prospectValue(row) >= threshold && prospectValue(row) > 0).sort((a, b) => prospectValue(b) - prospectValue(a))
  return <div className={styles.accountPortfolio}>{rows.map((row) => <Link href={prospectLink(row)} className={styles.accountCard} key={row.prospect_id}><div className={styles.accountCardTop}><div><h3>{row.account_name || row.prospect_name}</h3><p>{row.prospect_name} · {row.city || "Ville non attribuée"}</p></div><Badge tone={badgeTone(row.priority)}>{row.priority || "medium"}</Badge></div><div className={styles.accountValue}><span>Valeur stratégique</span><strong>{dh(prospectValue(row))}</strong></div><div className={styles.accountStats}><div><span>Score</span><strong>{Math.round(number(row.score))}</strong></div><div><span>Décision</span><strong>{number(row.decision_member_count)}</strong></div><div><span>Retards</span><strong>{number(row.overdue_task_count)}</strong></div></div></Link>)}{!rows.length ? <div style={{ gridColumn: "1 / -1" }}><EmptyState title="Aucun dossier à haute valeur" description="Le seuil est calculé à partir du portefeuille disponible. Enrichissez les valeurs des opportunités pour activer cette vue." /></div> : null}</div>
}

function RiskView({ prospects, risks, onOpen }: { prospects: ProspectEnterpriseRow[]; risks: any[]; onOpen: (kind: ModalKind, row: ProspectEnterpriseRow) => void }) {
  const prospectById = new Map(prospects.map((row) => [row.prospect_id, row]))
  const cells = [
    { level: "critical", label: "Critique", risks: risks.filter((risk) => risk.severity === "critical") },
    { level: "high", label: "Élevé", risks: risks.filter((risk) => risk.severity === "high") },
    { level: "medium", label: "Modéré", risks: risks.filter((risk) => risk.severity === "medium") },
    { level: "low", label: "Faible", risks: risks.filter((risk) => risk.severity === "low") },
    { level: "medium", label: "Sans classification", risks: risks.filter((risk) => !["critical", "high", "medium", "low"].includes(String(risk.severity))) },
  ]
  const exposed = prospects.filter((row) => number(row.open_risk_count) > 0).sort((a, b) => number(b.open_risk_count) - number(a.open_risk_count))
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<Radar size={16} />} title="Matrice d’exposition" subtitle="Nombre de risques et impact déclaré par sévérité"><div className={styles.riskMatrix}>{cells.map((cell) => <div className={styles.riskCell} data-level={cell.level} key={cell.label}><h4>{cell.label}</h4><strong>{cell.risks.length}</strong><span>{dh(cell.risks.reduce((sum, risk) => sum + number(risk.impact_mad), 0))} d’impact</span></div>)}</div><div className={styles.riskList} style={{ marginTop: 14 }}>{risks.slice(0, 12).map((risk) => { const row = prospectById.get(risk.prospect_id); return <div className={styles.riskItem} key={risk.id}><span className={styles.itemIcon}><ShieldAlert size={14} /></span><div><h3>{risk.title}</h3><p>{row?.prospect_name || "Dossier relié"} · {risk.mitigation_plan || "Plan de mitigation à définir"}</p></div><span className={styles.itemMetric}>{dh(risk.impact_mad)}</span></div> })}</div></Panel>
      <Panel icon={<AlertTriangle size={16} />} title="Dossiers exposés" subtitle="Prospects nécessitant une action de mitigation"><div className={styles.priorityList}>{exposed.slice(0, 12).map((row) => <div className={styles.priorityItem} key={row.prospect_id}><span className={styles.itemIcon}><AlertTriangle size={14} /></span><div><Link href={prospectLink(row)} className={styles.entityLink}><h3>{row.prospect_name}</h3></Link><p>{number(row.open_risk_count)} risque(s) · {dh(prospectValue(row))}</p></div><button type="button" className={styles.ghostButton} onClick={() => onOpen("risk", row)}><Plus size={13} /></button></div>)}{!exposed.length ? <EmptyState title="Aucun risque ouvert" description="Les risques déclarés avec leur impact et leur plan de mitigation apparaîtront ici." /> : null}</div></Panel>
    </div>
  )
}

function AcquisitionView({ prospects, onOpen }: { prospects: ProspectEnterpriseRow[]; onOpen: (kind: ModalKind, row: ProspectEnterpriseRow) => void }) {
  const newRows = prospects.filter((row) => ["new_lead", "discovery"].includes(String(row.prospect_stage)))
  const unattended = newRows.filter((row) => !row.owner || row.owner === "BD Officer" || !row.next_action_at)
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<Zap size={16} />} title="File d’acquisition" subtitle="Signaux entrants, prise en charge et structuration du premier cycle"><PortfolioTable rows={newRows} limit={35} /></Panel>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<AlertTriangle size={16} />} title="Prise en charge incomplète" subtitle="Dossiers sans propriétaire spécifique ou prochaine action"><div className={styles.priorityList}>{unattended.slice(0, 9).map((row) => <Link href={prospectLink(row)} className={styles.priorityItem} key={row.prospect_id} style={{ textDecoration: "none" }}><span className={styles.itemIcon}><Clock3 size={14} /></span><div><h3>{row.prospect_name}</h3><p>{row.owner || "Sans responsable"} · prochaine action {date(row.next_action_at)}</p></div><ChevronRight size={14} /></Link>)}{!unattended.length ? <div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Tous les dossiers visibles sont pris en charge.</div> : null}</div></Panel>
        <Panel icon={<BriefcaseBusiness size={16} />} title="Activation commerciale" subtitle="Créer une opportunité dès que le besoin devient exploitable"><div className={styles.priorityList}>{newRows.slice(0, 5).map((row) => <div className={styles.priorityItem} key={row.prospect_id}><span className={styles.itemIcon}><Target size={14} /></span><div><h3>{row.prospect_name}</h3><p>Score {Math.round(number(row.score))}/100 · {dh(prospectValue(row))}</p></div><button type="button" className={styles.ghostButton} onClick={() => onOpen("opportunity", row)}><Plus size={13} /></button></div>)}</div></Panel>
      </div>
    </div>
  )
}

function NewProspectStudio({ onSaved }: { onSaved: (id?: string) => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    company: "",
    city: "Rabat",
    segment: "b2b",
    source: "manual",
    priority: "high",
    owner: "",
    contactName: "",
    roleTitle: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    needSummary: "",
    nextAction: "",
    nextActionAt: "",
    valueMad: "",
    probability: "35",
    opportunityTitle: "",
  })
  function update(key: string, value: string) { setForm((current) => ({ ...current, [key]: value })) }
  async function submit() {
    setSaving(true); setError("")
    try {
      const result = await mutateRevenueEndpoint("/api/revenue-command-center/prospects/enterprise/create", "POST", {
        name: form.name || form.company,
        company: form.company || form.name,
        accountName: form.company || form.name,
        city: form.city,
        segment: form.segment,
        source: form.source,
        priority: form.priority,
        owner: form.owner || "BD Officer",
        contactName: form.contactName,
        roleTitle: form.roleTitle,
        email: form.email,
        phone: form.phone,
        website: form.website,
        industry: form.industry,
        needSummary: form.needSummary,
        nextAction: form.nextAction,
        nextActionAt: form.nextActionAt || null,
        opportunityTitle: form.opportunityTitle || `Développement ${form.company || form.name}`,
        valueMad: Number(form.valueMad || 0),
        probability: Number(form.probability || 0),
        createOpportunity: Boolean(form.opportunityTitle.trim() || Number(form.valueMad || 0) > 0),
      })
      onSaved(result?.dossier?.prospectId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le dossier n’a pas pu être créé.")
    } finally { setSaving(false) }
  }
  const completeness = [form.name || form.company, form.city, form.owner, form.contactName, form.nextAction].filter(Boolean).length * 20
  return (
    <div className={styles.formStudio}>
      <div className={styles.formSections}>
        <section className={styles.formSection}><header className={styles.formSectionHeader}><IconBadge><Building2 size={16} /></IconBadge><div><h2>Identité commerciale</h2><p>Créer une identité exploitable et éviter les doublons de nom, domaine ou organisation.</p></div></header><div className={styles.formGrid}><div className={styles.field}><label>Nom du prospect</label><input value={form.name} onChange={(e) => update("name", e.target.value)} /></div><div className={styles.field}><label>Organisation / Compte</label><input value={form.company} onChange={(e) => update("company", e.target.value)} /></div><div className={styles.field}><label>Ville</label><input value={form.city} onChange={(e) => update("city", e.target.value)} /></div><div className={styles.field}><label>Segment</label><select value={form.segment} onChange={(e) => update("segment", e.target.value)}><option value="b2b">B2B</option><option value="b2c">B2C</option><option value="partner">Partenaire</option><option value="institution">Institution</option></select></div><div className={styles.field}><label>Secteur</label><input value={form.industry} onChange={(e) => update("industry", e.target.value)} /></div><div className={styles.field}><label>Site web</label><input value={form.website} onChange={(e) => update("website", e.target.value)} /></div></div></section>
        <section className={styles.formSection}><header className={styles.formSectionHeader}><IconBadge><ContactRound size={16} /></IconBadge><div><h2>Contact principal</h2><p>Relier la première personne connue et préparer la cartographie décisionnelle.</p></div></header><div className={styles.formGrid}><div className={styles.field}><label>Nom complet</label><input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></div><div className={styles.field}><label>Fonction</label><input value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} /></div><div className={styles.field}><label>Email</label><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div><div className={styles.field}><label>Téléphone</label><input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div></div></section>
        <section className={styles.formSection}><header className={styles.formSectionHeader}><IconBadge><Target size={16} /></IconBadge><div><h2>Mission commerciale initiale</h2><p>Définir le besoin, la valeur, le responsable et la prochaine décision attendue.</p></div></header><div className={styles.formGrid}><div className={styles.field}><label>Responsable</label><input value={form.owner} onChange={(e) => update("owner", e.target.value)} /></div><div className={styles.field}><label>Priorité</label><select value={form.priority} onChange={(e) => update("priority", e.target.value)}><option value="critical">Critique</option><option value="high">Élevée</option><option value="medium">Modérée</option><option value="low">Faible</option></select></div><div className={`${styles.field} ${styles.fieldFull}`}><label>Besoin identifié</label><textarea value={form.needSummary} onChange={(e) => update("needSummary", e.target.value)} /></div><div className={styles.field}><label>Prochaine action</label><input value={form.nextAction} onChange={(e) => update("nextAction", e.target.value)} /></div><div className={styles.field}><label>Échéance</label><input type="datetime-local" value={form.nextActionAt} onChange={(e) => update("nextActionAt", e.target.value)} /></div><div className={styles.field}><label>Titre opportunité</label><input value={form.opportunityTitle} onChange={(e) => update("opportunityTitle", e.target.value)} /></div><div className={styles.field}><label>Valeur estimée</label><input type="number" value={form.valueMad} onChange={(e) => update("valueMad", e.target.value)} /></div><div className={styles.field}><label>Probabilité</label><input type="number" min="0" max="100" value={form.probability} onChange={(e) => update("probability", e.target.value)} /></div><div className={styles.field}><label>Source</label><select value={form.source} onChange={(e) => update("source", e.target.value)}><option value="manual">Saisie manuelle</option><option value="browser_extension">Browser OS</option><option value="campaign">Campagne</option><option value="referral">Recommandation</option><option value="website">Site web</option><option value="field">Terrain</option></select></div></div></section>
        {error ? <div className={styles.schemaNotice}><AlertTriangle size={18} /><div><strong>Création interrompue</strong><p>{error}</p></div></div> : null}
      </div>
      <aside className={styles.studioRail}>
        <Panel icon={<Gauge size={16} />} title="Préparation du dossier" subtitle="Complétude minimale avant prise en charge"><div className={styles.scoreLarge}><strong>{completeness}%</strong><span>Identité, responsable, contact et prochaine action doivent être suffisamment renseignés.</span></div><Progress value={completeness} /></Panel>
        <Panel icon={<ShieldCheck size={16} />} title="Contrôles avant enregistrement" subtitle="Source de vérité commerciale"><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Le compte, le contact, le prospect et l’opportunité sont créés dans une transaction atomique.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Aucun dossier partiel ne subsiste si une étape de création échoue.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> L’opportunité est créée seulement si une valeur exploitable existe.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Chaque mutation génère une activité et un audit.</div></div></Panel>
        <button type="button" className={styles.ghostButton} onClick={submit} disabled={saving} style={{ width: "100%", minHeight: 48 }}>{saving ? <Loader2 size={16} className={styles.loadingSpin} /> : <Sparkles size={16} />} Enregistrer le dossier complet</button>
      </aside>
    </div>
  )
}

export default function ProspectEnterpriseWorkspace({ mode }: { mode: ProspectEnterpriseMode }) {
  const contract = PROSPECT_ROUTE_CONTRACTS[mode]
  const { portfolio, loading, refreshing, error, refresh } = useProspectEnterpriseData(mode)
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState("all")
  const [modal, setModal] = useState<{ kind: ModalKind; prospect: ProspectEnterpriseRow | null }>({ kind: null, prospect: null })
  const prospects = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (portfolio?.prospects || []).filter((row) => stage === "all" || String(row.prospect_stage) === stage).filter((row) => !q || [row.prospect_name, row.company, row.account_name, row.city, row.owner, row.contact_name, row.primary_contact_name].join(" ").toLowerCase().includes(q))
  }, [portfolio?.prospects, query, stage])

  function openModal(kind: ModalKind, row: ProspectEnterpriseRow) { setModal({ kind, prospect: row }) }
  function closeModal() { setModal({ kind: null, prospect: null }) }

  if (loading) {
    return <main className={styles.shell} data-accent={contract.accent}><div className={styles.loadingState}><span className={styles.loadingStateIcon}><Loader2 size={22} className={styles.loadingSpin} /></span><h2>Préparation du poste prospects</h2><p>Synchronisation des comptes, contacts, opportunités, tâches, rendez-vous, risques et cartographies décisionnelles.</p></div></main>
  }
  if (error && !portfolio) {
    return <main className={styles.shell} data-accent={contract.accent}><div className={styles.errorState}><span className={styles.errorStateIcon}><AlertTriangle size={22} /></span><h2>Le portefeuille n’a pas pu être chargé</h2><p>{error}</p><button type="button" className={styles.ghostButton} style={{ marginTop: 14 }} onClick={() => refresh(false)}><RefreshCcw size={14} /> Réessayer</button></div></main>
  }

  const summary = portfolio?.summary
  const primaryAction = mode === "pipeline" ? () => prospects[0] && openModal("opportunity", prospects[0]) : mode === "qualification" ? () => prospects[0] && openModal("qualification", prospects[0]) : mode === "decision-map" ? () => prospects[0] && openModal("decision", prospects[0]) : mode === "risk" ? () => prospects[0] && openModal("risk", prospects[0]) : undefined

  return (
    <main className={styles.shell} data-accent={contract.accent}>
      <div className={styles.topline}>
        <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane"><Link href="/revenue-command-center">Revenue Command</Link><ChevronRight size={12} /><Link href="/revenue-command-center/prospects">Prospects & comptes</Link><ChevronRight size={12} /><span>{contract.label}</span></nav>
        <span className={styles.freshness}><span className={styles.freshnessDot} /> Données canoniques · {portfolio?.generatedAt ? dateTime(portfolio.generatedAt) : "synchronisées"}</span>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.eyebrowMark} /> {contract.eyebrow}</p>
          <h1>{contract.title}</h1>
          <p className={styles.heroDescription}>{contract.description}</p>
          <div className={styles.heroActions}>
            {contract.primaryHref ? <Link href={contract.primaryHref} className={styles.primaryButton}><Plus size={15} /> {contract.primaryAction}</Link> : <button type="button" className={styles.primaryButton} onClick={primaryAction} disabled={!primaryAction}><Plus size={15} /> {contract.primaryAction}</button>}
            <button type="button" className={styles.secondaryButton} onClick={() => refresh(true)} disabled={refreshing}>{refreshing ? <Loader2 size={15} className={styles.loadingSpin} /> : <RefreshCcw size={15} />} Actualiser</button>
          </div>
        </div>
        <aside className={styles.heroBrief}>
          <span className={styles.heroBriefLabel}><Target size={13} /> Mandat opérationnel</span>
          <h2>{contract.focus}</h2>
          <p>Les chiffres visibles proviennent des tables Revenue Command. Toute capacité indisponible est signalée plutôt que simulée.</p>
          <div className={styles.heroBriefGrid}><div className={styles.heroBriefMetric}><span>Pipeline</span><strong>{dh(summary?.pipelineValueMad)}</strong></div><div className={styles.heroBriefMetric}><span>Pondéré</span><strong>{dh(summary?.weightedPipelineMad)}</strong></div><div className={styles.heroBriefMetric}><span>Dossiers</span><strong>{number(summary?.prospectCount)}</strong></div><div className={styles.heroBriefMetric}><span>Risques</span><strong>{number(summary?.openRiskCount)}</strong></div></div>
        </aside>
      </section>

      <nav className={styles.routeNav} aria-label="Navigation prospects">
        {PROSPECT_ROUTE_NAVIGATION.map((item) => <Link key={item.mode} href={item.href} data-active={item.mode === mode}>{item.label}</Link>)}
      </nav>

      {portfolio?.schema?.migrationRequired ? <div className={styles.schemaNotice}><AlertTriangle size={18} /><div><strong>Complément de schéma requis</strong><p>La vue fonctionne sur les données existantes, mais certaines capacités entreprise attendent la migration additive Phase 2 incluse dans ce build.</p></div></div> : null}

      {mode !== "new" ? <><div className={styles.commandBar}><label className={styles.searchBox}><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher prospect, compte, contact, ville ou responsable…" /></label><select className={styles.select} value={stage} onChange={(event) => setStage(event.target.value)} aria-label="Filtrer par étape"><option value="all">Toutes les étapes</option>{STAGES.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select><Link href="/revenue-command-center/prospects/directory" className={styles.ghostButton}><Filter size={14} /> Répertoire complet</Link></div><Kpis summary={summary} /></> : null}

      {mode === "new" ? <NewProspectStudio onSaved={(id) => { window.location.href = id ? `/revenue-command-center/prospects/${encodeURIComponent(id)}` : "/revenue-command-center/prospects" }} /> : null}
      {mode === "acquisition" ? <AcquisitionView prospects={prospects} onOpen={openModal} /> : null}
      {mode === "directory" ? <Panel icon={<Users size={16} />} title="Répertoire commercial" subtitle={`${prospects.length} dossier(s) correspondant aux filtres`}><PortfolioTable rows={prospects} limit={100} /></Panel> : null}
      {mode === "executive" ? <ExecutiveView prospects={prospects} summary={summary} /> : null}
      {mode === "pipeline" ? <PipelineView prospects={prospects} /> : null}
      {mode === "qualification" ? <QualificationView prospects={prospects} qualifications={portfolio?.qualifications || []} onOpen={openModal} /> : null}
      {mode === "decision-map" ? <DecisionMapView prospects={prospects} members={portfolio?.decisionMapMembers || []} onOpen={openModal} /> : null}
      {mode === "appointments" ? <AppointmentsView prospects={prospects} /> : null}
      {mode === "proposals" ? <ProposalView prospects={prospects} opportunities={portfolio?.opportunities || []} onOpen={openModal} /> : null}
      {mode === "negotiation" ? <NegotiationView prospects={prospects} opportunities={portfolio?.opportunities || []} /> : null}
      {mode === "recovery" ? <RecoveryView prospects={prospects} /> : null}
      {mode === "analytics" ? <AnalyticsView prospects={prospects} summary={summary} /> : null}
      {mode === "performance" ? <PerformanceView prospects={prospects} /> : null}
      {mode === "high-value" ? <HighValueView prospects={prospects} threshold={number(summary?.highValueThresholdMad)} /> : null}
      {mode === "risk" ? <RiskView prospects={prospects} risks={portfolio?.risks || []} onOpen={openModal} /> : null}

      <EnterpriseActionModal kind={modal.kind} prospect={modal.prospect} onClose={closeModal} onSaved={() => refresh(true)} />
    </main>
  )
}
