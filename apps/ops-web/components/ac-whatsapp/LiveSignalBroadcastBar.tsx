"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import {
  Activity, AlertTriangle, ArrowRightLeft, BellRing, Bot, BriefcaseBusiness, CalendarClock,
  CheckCheck, CircleGauge, Eye, FileCheck2, FileText, Gauge, Inbox, Layers3, MessageCircleMore,
  Paperclip, RadioTower, Send, ShieldAlert, ShieldCheck, Sparkles, Target, TimerReset,
  TrendingUp, UserRoundCheck, UsersRound, Workflow, Zap,
} from "lucide-react"
import type { AcWhatsAppBootstrap } from "@/lib/ac-whatsapp/types"
import { cx } from "./ACWhatsAppUI"

export type LiveFeedMode = "pulse" | "operator" | "risk" | "commercial" | "broadcast"

type SignalTone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"
type SignalBlueprint = {
  id: string
  title: string
  caption: string
  icon: typeof Activity
  tone: SignalTone
  value: (data?: AcWhatsAppBootstrap | null) => string
}

type FeedModeDefinition = {
  id: LiveFeedMode
  label: string
  shortLabel: string
  icon: typeof Activity
  signals: SignalBlueprint[]
}

const count = (value: unknown) => Number(value || 0)
const plural = (value: number, one: string, many = `${one}s`) => `${value} ${value === 1 ? one : many}`
const conversations = (data?: AcWhatsAppBootstrap | null) => data?.conversations || []
const campaigns = (data?: AcWhatsAppBootstrap | null) => data?.campaigns || []
const accounts = (data?: AcWhatsAppBootstrap | null) => data?.accounts || []
const openConversations = (data?: AcWhatsAppBootstrap | null) => conversations(data).filter((row) => !["resolved", "closed", "archived"].includes(row.status))
const waiting = (data?: AcWhatsAppBootstrap | null) => conversations(data).filter((row) => row.status === "waiting_customer").length
const escalated = (data?: AcWhatsAppBootstrap | null) => conversations(data).filter((row) => row.status === "escalated").length
const automated = (data?: AcWhatsAppBootstrap | null) => conversations(data).filter((row) => !row.automation_paused).length
const assigned = (data?: AcWhatsAppBootstrap | null) => conversations(data).filter((row) => Boolean(row.assigned_user_id)).length
const highPriority = (data?: AcWhatsAppBootstrap | null) => conversations(data).filter((row) => ["high", "urgent", "vip"].includes(String(row.priority || "").toLowerCase())).length
const activeCampaigns = (data?: AcWhatsAppBootstrap | null) => campaigns(data).filter((row) => ["active", "running", "launched", "scheduled"].includes(String(row.status || "").toLowerCase())).length
const replies = (data?: AcWhatsAppBootstrap | null) => campaigns(data).reduce((sum, row) => sum + count(row.reply_count), 0)
const delivered = (data?: AcWhatsAppBootstrap | null) => campaigns(data).reduce((sum, row) => sum + count(row.delivered_count), 0)
const reads = (data?: AcWhatsAppBootstrap | null) => campaigns(data).reduce((sum, row) => sum + count(row.read_count), 0)
const conversions = (data?: AcWhatsAppBootstrap | null) => campaigns(data).reduce((sum, row) => sum + count(row.conversion_count), 0)
const failedCampaignMessages = (data?: AcWhatsAppBootstrap | null) => campaigns(data).reduce((sum, row) => sum + count(row.failed_count), 0)
const healthyAccounts = (data?: AcWhatsAppBootstrap | null) => accounts(data).filter((row) => row.status === "connected" && row.outbound_enabled).length

const FEED_MODES: FeedModeDefinition[] = [
  {
    id: "pulse", label: "Operations Pulse", shortLabel: "Pulse", icon: Activity,
    signals: [
      { id: "pulse-open", title: "Charge live", caption: "Conversations ouvertes à piloter maintenant", icon: MessageCircleMore, tone: "blue", value: (d) => plural(openConversations(d).length, "conversation") },
      { id: "pulse-unread", title: "Attention entrante", caption: "Messages non lus qui attendent une lecture humaine", icon: Inbox, tone: "amber", value: (d) => plural(count(d?.counts.unread), "non lu") },
      { id: "pulse-unassigned", title: "Responsabilité", caption: "Conversations encore sans propriétaire explicite", icon: UserRoundCheck, tone: "amber", value: (d) => plural(count(d?.counts.unassigned), "à assigner", "à assigner") },
      { id: "pulse-waiting", title: "Attente client", caption: "Dossiers où AngelCare attend désormais la réponse du contact", icon: TimerReset, tone: "emerald", value: (d) => plural(waiting(d), "dossier") },
      { id: "pulse-accounts", title: "Comptes WhatsApp", caption: "Sessions connectées et autorisées pour l’outbound", icon: RadioTower, tone: "emerald", value: (d) => `${healthyAccounts(d)}/${accounts(d).length || count(d?.counts.accounts)} opérationnels` },
      { id: "pulse-automation", title: "Automatisation", caption: "Conversations où l’automatisation reste disponible", icon: Bot, tone: "violet", value: (d) => plural(automated(d), "conversation") },
      { id: "pulse-team", title: "Équipe autorisée", caption: "Membres visibles dans le périmètre AC WhatsApp", icon: UsersRound, tone: "blue", value: (d) => plural((d?.memberships || []).length, "membre") },
      { id: "pulse-contacts", title: "Portefeuille relationnel", caption: "Contacts actuellement connus par AC WhatsApp", icon: Layers3, tone: "slate", value: (d) => plural((d?.contacts || []).length, "contact") },
      { id: "pulse-followup", title: "Suivi opérationnel", caption: "Priorités hautes ou urgentes visibles dans la file", icon: CalendarClock, tone: "amber", value: (d) => plural(highPriority(d), "priorité") },
      { id: "pulse-runtime", title: "Runtime", caption: "État de disponibilité OpenWA rapporté au shell opérateur", icon: ShieldCheck, tone: "emerald", value: (d) => d?.health.openwaReachable ? "OpenWA confirmé" : "Contrôle requis" },
    ],
  },
  {
    id: "operator", label: "Operator Flow", shortLabel: "Équipe", icon: UsersRound,
    signals: [
      { id: "operator-assigned", title: "Charge attribuée", caption: "Conversations avec un responsable explicite", icon: UserRoundCheck, tone: "blue", value: (d) => plural(assigned(d), "conversation") },
      { id: "operator-unassigned", title: "File sans propriétaire", caption: "À distribuer avant rupture de responsabilité", icon: ArrowRightLeft, tone: "amber", value: (d) => plural(count(d?.counts.unassigned), "dossier") },
      { id: "operator-presence", title: "Présence live", caption: "Présences opérationnelles actuellement remontées", icon: Activity, tone: "emerald", value: (d) => plural((d?.presence || []).length, "présence") },
      { id: "operator-members", title: "Workforce AC WhatsApp", caption: "Membres disposant d’un rattachement opérationnel", icon: UsersRound, tone: "slate", value: (d) => plural((d?.memberships || []).length, "membre") },
      { id: "operator-waiting", title: "Clients à reprendre", caption: "Conversations dont le prochain mouvement dépend du client", icon: TimerReset, tone: "blue", value: (d) => plural(waiting(d), "attente") },
      { id: "operator-escalation", title: "Interventions superviseur", caption: "Conversations explicitement escaladées", icon: ShieldAlert, tone: "rose", value: (d) => plural(escalated(d), "escalade") },
      { id: "operator-priority", title: "Priorités fortes", caption: "VIP, urgentes ou hautes dans le portefeuille courant", icon: Zap, tone: "amber", value: (d) => plural(highPriority(d), "conversation") },
      { id: "operator-auto", title: "Human takeover", caption: "Conversations où l’automatisation est suspendue", icon: Bot, tone: "violet", value: (d) => plural(conversations(d).filter((row) => row.automation_paused).length, "prise en main", "prises en main") },
      { id: "operator-queues", title: "Files de responsabilité", caption: "Files actives disponibles pour la distribution", icon: Workflow, tone: "slate", value: (d) => plural((d?.queues || []).length, "file") },
      { id: "operator-read", title: "Lecture opérateur", caption: "Conversations avec activité non lue signalée", icon: Eye, tone: "blue", value: (d) => plural(conversations(d).filter((row) => row.unread_count > 0).length, "conversation") },
    ],
  },
  {
    id: "risk", label: "Risk Watch", shortLabel: "Risques", icon: ShieldAlert,
    signals: [
      { id: "risk-security", title: "Signaux sécurité", caption: "Événements ouverts nécessitant une attention gouvernée", icon: ShieldAlert, tone: "rose", value: (d) => plural(count(d?.counts.securityOpen), "signal") },
      { id: "risk-escalated", title: "Escalades live", caption: "Conversations dont le niveau d’intervention a été élevé", icon: AlertTriangle, tone: "rose", value: (d) => plural(escalated(d), "escalade") },
      { id: "risk-unassigned", title: "Risque de propriété", caption: "Conversations ouvertes sans responsable", icon: UserRoundCheck, tone: "amber", value: (d) => plural(count(d?.counts.unassigned), "conversation") },
      { id: "risk-unread", title: "Risque de silence", caption: "Entrants non lus pouvant devenir une attente client", icon: BellRing, tone: "amber", value: (d) => plural(count(d?.counts.unread), "message") },
      { id: "risk-account", title: "Continuité runtime", caption: "Comptes connectés par rapport au parc déclaré", icon: RadioTower, tone: "rose", value: (d) => `${count(d?.counts.connectedAccounts)}/${count(d?.counts.accounts)} connectés` },
      { id: "risk-outbound", title: "Outbound suspendu", caption: "Comptes connectés mais non autorisés à émettre", icon: Send, tone: "amber", value: (d) => plural(accounts(d).filter((row) => !row.outbound_enabled).length, "compte") },
      { id: "risk-campaign", title: "Échecs campagne", caption: "Échecs cumulés visibles dans les campagnes chargées", icon: AlertTriangle, tone: "rose", value: (d) => plural(failedCampaignMessages(d), "échec") },
      { id: "risk-priority", title: "Pression prioritaire", caption: "Dossiers à priorité haute, urgente ou VIP", icon: Gauge, tone: "amber", value: (d) => plural(highPriority(d), "dossier") },
      { id: "risk-automation", title: "Automations suspendues", caption: "Conversations sous contrôle humain explicite", icon: Bot, tone: "violet", value: (d) => plural(conversations(d).filter((row) => row.automation_paused).length, "conversation") },
      { id: "risk-health", title: "Santé OpenWA", caption: "Vérité runtime sans faux positif visuel", icon: ShieldCheck, tone: "emerald", value: (d) => d?.health.openwaReachable ? "Aucune rupture détectée" : "Dégradation détectée" },
    ],
  },
  {
    id: "commercial", label: "Commercial Heat", shortLabel: "Business", icon: TrendingUp,
    signals: [
      { id: "commercial-campaigns", title: "Campagnes actives", caption: "Missions commerciales actives, lancées ou planifiées", icon: BriefcaseBusiness, tone: "violet", value: (d) => plural(activeCampaigns(d), "campagne") },
      { id: "commercial-replies", title: "Réponses campagne", caption: "Réponses cumulées sur les campagnes chargées", icon: MessageCircleMore, tone: "blue", value: (d) => plural(replies(d), "réponse") },
      { id: "commercial-delivered", title: "Livraisons campagne", caption: "Messages campagne confirmés comme livrés", icon: CheckCheck, tone: "emerald", value: (d) => plural(delivered(d), "livraison") },
      { id: "commercial-reads", title: "Lectures campagne", caption: "Messages campagne confirmés comme lus", icon: Eye, tone: "emerald", value: (d) => plural(reads(d), "lecture") },
      { id: "commercial-conversions", title: "Conversions", caption: "Conversions enregistrées sur le portefeuille campagne", icon: Target, tone: "emerald", value: (d) => plural(conversions(d), "conversion") },
      { id: "commercial-prospects", title: "Prospects identifiés", caption: "Contacts qualifiés comme prospects dans AC WhatsApp", icon: BriefcaseBusiness, tone: "blue", value: (d) => plural((d?.contacts || []).filter((row) => String(row.contact_type).toLowerCase() === "prospect").length, "prospect") },
      { id: "commercial-vip", title: "Relations prioritaires", caption: "Contacts ou conversations marqués VIP / priorité forte", icon: Sparkles, tone: "amber", value: (d) => plural((d?.contacts || []).filter((row) => ["vip", "high", "urgent"].includes(String(row.priority || "").toLowerCase())).length + highPriority(d), "signal") },
      { id: "commercial-waiting", title: "Opportunités en attente", caption: "Conversations après réponse AngelCare en attente du client", icon: TimerReset, tone: "amber", value: (d) => plural(waiting(d), "conversation") },
      { id: "commercial-templates", title: "Réponses & modèles", caption: "Réponses enregistrées disponibles dans le bootstrap courant", icon: FileText, tone: "violet", value: (d) => plural((d?.templates || []).length, "modèle") },
      { id: "commercial-open", title: "Surface relationnelle", caption: "Conversations ouvertes pouvant encore produire une prochaine action", icon: TrendingUp, tone: "blue", value: (d) => plural(openConversations(d).length, "opportunité potentielle", "opportunités potentielles") },
    ],
  },
  {
    id: "broadcast", label: "Broadcast Live", shortLabel: "Broadcast", icon: RadioTower,
    signals: [
      { id: "broadcast-runtime", title: "AC WhatsApp est en ligne", caption: "Runtime, conversation et responsabilité réunis dans le même OS", icon: RadioTower, tone: "emerald", value: (d) => d?.health.openwaReachable ? "Transport opérationnel" : "Transport à contrôler" },
      { id: "broadcast-truth", title: "Transport truth", caption: "Stocké, en file, envoyé, livré et lu restent des états distincts", icon: ShieldCheck, tone: "blue", value: () => "Vérité d’état activée" },
      { id: "broadcast-files", title: "Pièces jointes gouvernées", caption: "Les médias restent liés au fil et à leur vérité de transport", icon: Paperclip, tone: "violet", value: () => "Vault + WhatsApp" },
      { id: "broadcast-human", title: "Human-in-the-loop", caption: "L’opérateur conserve le contrôle des réponses et des décisions sensibles", icon: UserRoundCheck, tone: "blue", value: (d) => plural((d?.memberships || []).length, "membre autorisé", "membres autorisés") },
      { id: "broadcast-automation", title: "Automatisation gouvernée", caption: "Les conversations peuvent basculer explicitement en prise en main humaine", icon: Bot, tone: "violet", value: (d) => `${conversations(d).filter((row) => row.automation_paused).length} takeover` },
      { id: "broadcast-command", title: "Command layer", caption: "Recherche, réponses, actions et intelligence restent accessibles au clavier", icon: Zap, tone: "amber", value: () => "⌘K · / · J/K" },
      { id: "broadcast-coverage", title: "Couverture opérationnelle", caption: "Conversations actuellement rattachées à un opérateur", icon: CircleGauge, tone: "emerald", value: (d) => { const total = openConversations(d).length; const owned = openConversations(d).filter((row) => row.assigned_user_id).length; return total ? `${Math.round((owned / total) * 100)}% attribuées` : "File vide" } },
      { id: "broadcast-activity", title: "Flux relationnel", caption: "Le portefeuille actif reste visible sans quitter Live Command", icon: Activity, tone: "blue", value: (d) => plural(count(d?.counts.conversations), "conversation") },
      { id: "broadcast-governance", title: "Gouvernance active", caption: "Risques, audit et contrôle restent attachés aux décisions opérateur", icon: FileCheck2, tone: "slate", value: (d) => plural((d?.securityEvents || []).length, "événement") },
      { id: "broadcast-excellence", title: "Operator Experience", caption: "Un seul théâtre pour comprendre, répondre, transférer et décider", icon: Sparkles, tone: "violet", value: () => "APEX Visual Command" },
    ],
  },
]

const MODE_STORAGE_KEY = "ac-whatsapp:visual-apex-feed-mode"
const tones: Record<SignalTone, { dot: string; value: string; icon: string }> = {
  blue: { dot: "bg-sky-400", value: "text-sky-200", icon: "text-sky-300" },
  emerald: { dot: "bg-emerald-400", value: "text-emerald-200", icon: "text-emerald-300" },
  amber: { dot: "bg-amber-400", value: "text-amber-200", icon: "text-amber-300" },
  rose: { dot: "bg-rose-400", value: "text-rose-200", icon: "text-rose-300" },
  violet: { dot: "bg-violet-400", value: "text-violet-200", icon: "text-violet-300" },
  slate: { dot: "bg-slate-300", value: "text-slate-200", icon: "text-slate-300" },
}

function leadingNumber(value: string) {
  const match = value.replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/)
  return match ? Number(match[0].replace(",", ".")) : null
}

function signalScore(signal: SignalBlueprint, value: string) {
  const toneWeight: Record<SignalTone, number> = { rose: 70, amber: 54, violet: 34, blue: 30, emerald: 22, slate: 14 }
  const number = leadingNumber(value)
  let score = toneWeight[signal.tone]
  if (number !== null) score += number > 0 ? Math.min(36, Math.log2(number + 1) * 8) : -32
  const normalized = value.toLowerCase()
  if (/dégrad|requis|rupture|échec|suspendu|critique|risque/.test(normalized)) score += 50
  if (/opérationnel|confirmé|aucune rupture|couverture complète/.test(normalized)) score += 5
  return score
}

export default function LiveSignalBroadcastBar({ data, activeWorkspace }: { data?: AcWhatsAppBootstrap | null; activeWorkspace: string }) {
  const [mode, setMode] = useState<LiveFeedMode>("pulse")

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MODE_STORAGE_KEY) as LiveFeedMode | null
      if (FEED_MODES.some((item) => item.id === stored)) setMode(stored as LiveFeedMode)
    } catch {}
  }, [])

  const selectedMode = useMemo(() => FEED_MODES.find((item) => item.id === mode) || FEED_MODES[0], [mode])
  const rankedSignals = useMemo(() => selectedMode.signals
    .map((signal, order) => ({ signal, value: signal.value(data), order }))
    .sort((a, b) => signalScore(b.signal, b.value) - signalScore(a.signal, a.value) || a.order - b.order), [data, selectedMode])

  function chooseMode(next: LiveFeedMode) {
    setMode(next)
    try { window.localStorage.setItem(MODE_STORAGE_KEY, next) } catch {}
  }

  const ModeIcon = selectedMode.icon
  const duration = `${Math.max(38, rankedSignals.length * 4.8)}s`

  const renderRun = (copy: "primary" | "duplicate") => <div className={cx("acw-broadcast-run", copy === "duplicate" && "acw-broadcast-run-duplicate")} aria-hidden={copy === "duplicate" ? true : undefined}>
    {rankedSignals.map(({ signal, value }, index) => {
      const Icon = signal.icon
      const tone = tones[signal.tone]
      return <div key={`${copy}:${signal.id}`} className="acw-broadcast-signal" title={`${signal.title} — ${signal.caption}`}>
        <span className={cx("acw-broadcast-dot", tone.dot)} />
        <Icon className={cx("h-3.5 w-3.5 shrink-0", tone.icon)} aria-hidden="true" />
        <span className="acw-broadcast-title">{signal.title}</span>
        <strong className={cx("acw-broadcast-value", tone.value)}>{value}</strong>
        {index < rankedSignals.length - 1 ? <span className="acw-broadcast-separator">◆</span> : null}
      </div>
    })}
  </div>

  return <section data-acw-live-feed aria-label={`Flux live AngelCare · ${selectedMode.label}`} className="acw-broadcast-shell">
    <div className="acw-broadcast-controls">
      <div className="acw-broadcast-live-mark"><span className="acw-broadcast-heartbeat" /><span>LIVE</span></div>
      <div className="acw-broadcast-mode-name"><ModeIcon className="h-3.5 w-3.5" /><span>{selectedMode.shortLabel}</span></div>
      <div className="acw-broadcast-mode-buttons" aria-label="Sélection du mode live">
        {FEED_MODES.map((item) => { const SelectorIcon = item.icon; return <button key={item.id} type="button" onClick={() => chooseMode(item.id)} title={item.label} aria-label={item.label} aria-pressed={mode === item.id} className={cx("acw-broadcast-mode-button", mode === item.id && "is-active")}><SelectorIcon className="h-3.5 w-3.5" /></button> })}
      </div>
    </div>

    <div className="acw-broadcast-viewport" role="presentation">
      <div className="acw-broadcast-track" style={{ "--acw-broadcast-duration": duration } as CSSProperties}>
        {renderRun("primary")}
        {renderRun("duplicate")}
      </div>
    </div>

    <div className="acw-broadcast-context" title="Survolez le flux pour le mettre en pause">
      <span className="hidden 2xl:inline">{activeWorkspace}</span>
      <span className="acw-broadcast-pause-hint">Survol = pause</span>
    </div>
    <span className="sr-only">Le flux est animé sans rafraîchissement réseau additionnel. Survolez-le pour suspendre le mouvement.</span>
  </section>
}
