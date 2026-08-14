"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle, BarChart3, BriefcaseBusiness, CheckCircle2, CircleGauge, Download,
  MessageCircleMore, RadioTower, RefreshCw, ShieldAlert, ShieldCheck, Target, TrendingUp,
  UsersRound,
} from "lucide-react"
import {
  cx, EmptyState, LoadingPanel, Metric, NoticeBanner, ProgressBar, SectionTitle, StatusPill,
  Surface, SurfaceHeader, WorkspaceTabs,
} from "./ACWhatsAppUI"
import { acApi, formatDateTime, formatRelative, friendlyAcError, percentage, useAcWhatsApp } from "./useAcWhatsApp"

type Analytics = {
  periodDays: number
  messages: { total: number; inbound: number; outbound: number; delivered: number; read: number; failed: number }
  conversations: { total: number; open: number; resolved: number; escalated: number }
  campaigns: { total: number; running: number; recipients: number; sent: number; delivered: number; read: number; replies: number; conversions: number }
  quality: { reviews: number; average: number }
  delivery: { queued: number; processing: number; failed: number }
  accounts: Array<Record<string, any>>
}
type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }

export default function ExecutiveControlWorkspace() {
  const { data, loading, error, refresh } = useAcWhatsApp(18000)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [tab, setTab] = useState("overview")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function loadAnalytics() {
    setBusy(true)
    try { setAnalytics(await acApi<Analytics>("/api/ac-whatsapp/analytics")); setAnalyticsError(null) }
    catch (cause) { setAnalyticsError(cause instanceof Error ? cause.message : "ANALYTICS_FAILED") }
    finally { setBusy(false) }
  }
  useEffect(() => { void loadAnalytics() }, [])

  if (loading && !data) return <LoadingPanel label="Ouverture de Executive Control" />

  const a = analytics
  const deliveryRate = percentage(a?.messages.delivered || 0, a?.messages.outbound || 0)
  const readRate = percentage(a?.messages.read || 0, a?.messages.outbound || 0)
  const responseRate = percentage(a?.campaigns.replies || 0, a?.campaigns.sent || 0)
  const conversionRate = percentage(a?.campaigns.conversions || 0, a?.campaigns.replies || 0)
  const resolutionRate = percentage(a?.conversations.resolved || 0, a?.conversations.total || 0)
  const criticalRisks = (() => {
    const risks: Array<{ title: string; description: string; severity: string; owner: string }> = []
    if (!data?.health.openwaReachable) risks.push({ title: "Gateway OpenWA indisponible", description: "Les commandes de session et messages directs ne sont pas garanties.", severity: "critical", owner: "IT Infrastructure" })
    if ((a?.delivery.failed || 0) > 0) risks.push({ title: "Échecs dans la file durable", description: `${a?.delivery.failed || 0} message(s) requièrent diagnostic ou reprise.`, severity: "high", owner: "Runtime Operations" })
    if ((a?.conversations.escalated || 0) > 0) risks.push({ title: "Conversations escaladées", description: `${a?.conversations.escalated || 0} dossier(s) attendent une intervention senior.`, severity: "high", owner: "Communication Supervisor" })
    if ((data?.counts.unassigned || 0) > 0) risks.push({ title: "Conversations sans propriétaire", description: `${data?.counts.unassigned || 0} conversation(s) ne disposent pas d’un responsable identifiable.`, severity: "warning", owner: "Team Operations" })
    if ((data?.counts.connectedAccounts || 0) < (data?.counts.accounts || 0)) risks.push({ title: "Flotte partiellement connectée", description: `${data?.counts.connectedAccounts || 0}/${data?.counts.accounts || 0} comptes sont connectés.`, severity: "warning", owner: "Account Administrator" })
    return risks
  })()

  async function synchronize() { await Promise.all([refresh().catch(() => undefined), loadAnalytics()]); setNotice({ tone: "success", title: "Executive Control synchronisé", description: "Les indicateurs et les signaux de risque ont été actualisés." }) }
  function exportSnapshot() {
    const payload = { generatedAt: new Date().toISOString(), actor: data?.actor, analytics, counts: data?.counts, health: data?.health, risks: criticalRisks }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `ac-whatsapp-executive-snapshot-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url)
  }

  return <div data-acw-ice-workspace="executive" className="acw-ice-workspace space-y-5">
    <SectionTitle eyebrow="Master Workspace 06 · Executive Control" title="Voir l’impact, le risque et la responsabilité en quelques secondes." description="Une lecture exécutive honnête de la disponibilité, des conversations, des campagnes et des exceptions nécessitant une intervention humaine." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={exportSnapshot} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black text-slate-700"><Download className="h-4 w-4" />Exporter la preuve</button><button type="button" onClick={() => void synchronize()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[10px] font-black text-white"><RefreshCw className={cx("h-4 w-4", busy && "animate-spin")} />Synchroniser</button></div>} />
    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)} /> : null}
    {analyticsError ? <NoticeBanner tone="danger" {...friendlyAcError(analyticsError)} /> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} onClose={() => setNotice(null)} /> : null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Gateway" value={data?.health.openwaReachable ? "Opérationnel" : "À vérifier"} detail={`${data?.counts.connectedAccounts || 0}/${data?.counts.accounts || 0} comptes connectés`} icon={RadioTower} tone={data?.health.openwaReachable ? "emerald" : "rose"} />
      <Metric label="Conversations ouvertes" value={a?.conversations.open || 0} detail={`${a?.conversations.escalated || 0} escalade(s)`} icon={MessageCircleMore} tone="slate" />
      <Metric label="Livraison" value={`${deliveryRate}%`} detail={`${a?.messages.delivered || 0} messages livrés`} icon={TrendingUp} tone="blue" />
      <Metric label="Réponses campagnes" value={`${responseRate}%`} detail={`${a?.campaigns.replies || 0} réponses observées`} icon={Target} tone="violet" />
      <Metric label="Risques actifs" value={criticalRisks.length} detail="Signaux nécessitant décision" icon={ShieldAlert} tone={criticalRisks.length ? "rose" : "emerald"} />
    </div>

    <WorkspaceTabs active={tab} onChange={setTab} tabs={[
      { id: "overview", label: "Executive cockpit", icon: CircleGauge },
      { id: "impact", label: "Commercial impact", icon: TrendingUp },
      { id: "risk", label: "Intervention desk", icon: ShieldAlert, count: criticalRisks.length },
      { id: "audit", label: "Audit & governance", icon: ShieldCheck, count: data?.auditEvents.length || 0 },
    ]} />

    {tab === "overview" ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <Surface><SurfaceHeader eyebrow="Command overview" title="État de la communication AngelCare" icon={CircleGauge} /><div className="mt-5 grid gap-4 md:grid-cols-2"><ExecutiveGauge label="Résolution conversations" value={resolutionRate} tone="emerald" detail={`${a?.conversations.resolved || 0}/${a?.conversations.total || 0} sur ${a?.periodDays || 30} jours`} /><ExecutiveGauge label="Lecture des messages" value={readRate} tone="blue" detail={`${a?.messages.read || 0} messages lus`} /><ExecutiveGauge label="Réponse campagne" value={responseRate} tone="violet" detail={`${a?.campaigns.replies || 0}/${a?.campaigns.sent || 0}`} /><ExecutiveGauge label="Conversion des réponses" value={conversionRate} tone="amber" detail={`${a?.campaigns.conversions || 0} conversions attribuées`} /></div><div className="mt-5 rounded-[24px] bg-slate-950 p-5 text-white"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.18em] text-rose-300">Executive briefing</p><p className="mt-2 text-lg font-black tracking-[-.03em]">{criticalRisks.length ? `${criticalRisks.length} décision(s) requise(s) aujourd’hui` : "Aucun risque critique détecté dans les signaux disponibles"}</p><p className="mt-2 max-w-2xl text-[10px] font-semibold leading-5 text-white/55">{a?.conversations.open || 0} conversation(s) ouverte(s), {data?.counts.unassigned || 0} sans propriétaire, {a?.delivery.failed || 0} échec(s) de file durable.</p></div><div className={cx("grid h-20 w-20 shrink-0 place-items-center rounded-[28px] text-3xl font-black", criticalRisks.length ? "bg-rose-600" : "bg-emerald-600")}>{criticalRisks.length}</div></div></div></Surface>
      <div className="space-y-4"><Surface><SurfaceHeader eyebrow="Fleet health" title="Comptes de production" icon={RadioTower} /><div className="mt-4 space-y-2">{(a?.accounts || data?.accounts || []).map((account: any) => <div key={account.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-black text-slate-800">{account.name}</p><p className="mt-1 text-[8px] font-semibold text-slate-400">{account.department || account.phone_number_e164 || "Compte WhatsApp"}</p></div><StatusPill status={account.status || "unknown"} compact /></div></div>)}{!(a?.accounts || data?.accounts || []).length ? <p className="text-[9px] font-semibold text-slate-400">Aucun compte déclaré.</p> : null}</div></Surface><Surface><SurfaceHeader eyebrow="Human ownership" title="Responsabilité visible" icon={UsersRound} /><div className="mt-4 space-y-3"><Ownership label="Opérations live" value={`${data?.memberships.length || 0} membres autorisés`} /><Ownership label="Sans propriétaire" value={`${data?.counts.unassigned || 0} conversations`} /><Ownership label="Escalades" value={`${a?.conversations.escalated || 0} dossiers`} /></div></Surface></div>
    </div> : null}

    {tab === "impact" ? <div className="grid gap-5 lg:grid-cols-2"><Surface><SurfaceHeader eyebrow="Commercial influence" title="Performance des missions" icon={BriefcaseBusiness} /><div className="mt-5 space-y-5"><ProgressBar value={percentage(a?.campaigns.sent || 0, a?.campaigns.recipients || 0)} tone="blue" label="Audience exécutée" /><ProgressBar value={percentage(a?.campaigns.delivered || 0, a?.campaigns.sent || 0)} tone="emerald" label="Messages livrés" /><ProgressBar value={responseRate} tone="violet" label="Réponses obtenues" /><ProgressBar value={conversionRate} tone="amber" label="Conversion des réponses" /></div></Surface><Surface><SurfaceHeader eyebrow="Observed totals" title="Volumes attribuables" icon={BarChart3} /><div className="mt-5 grid grid-cols-2 gap-3"><Total label="Campagnes" value={a?.campaigns.total || 0} /><Total label="Destinataires" value={a?.campaigns.recipients || 0} /><Total label="Réponses" value={a?.campaigns.replies || 0} /><Total label="Conversions" value={a?.campaigns.conversions || 0} /></div><NoticeBanner tone="info" title="Pas de revenu simulé" description="Le cockpit affiche les conversions réellement enregistrées. Aucun montant financier n’est inventé sans lien avec un pipeline ou une transaction." /></Surface></div> : null}

    {tab === "risk" ? <Surface><SurfaceHeader eyebrow="Executive intervention desk" title="Risques, impact et propriétaire attendu" icon={ShieldAlert} /><div className="mt-5 space-y-3">{criticalRisks.length ? criticalRisks.map((risk, index) => <div key={`${risk.title}-${index}`} className="grid gap-4 rounded-[24px] border border-slate-200 p-4 md:grid-cols-[50px_1fr_180px_130px] md:items-center"><div className={cx("grid h-11 w-11 place-items-center rounded-2xl text-white", risk.severity === "critical" ? "bg-rose-600" : risk.severity === "high" ? "bg-amber-500" : "bg-slate-500")}><AlertTriangle className="h-4 w-4" /></div><div><p className="text-[10px] font-black text-slate-900">{risk.title}</p><p className="mt-1 text-[9px] font-semibold leading-5 text-slate-500">{risk.description}</p></div><div><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">Propriétaire attendu</p><p className="mt-1 text-[9px] font-black text-slate-700">{risk.owner}</p></div><StatusPill status={risk.severity} compact /></div>) : <EmptyState title="Aucune intervention critique" description="Les signaux disponibles ne font apparaître aucun risque nécessitant une décision exécutive immédiate." icon={CheckCircle2} />}</div></Surface> : null}

    {tab === "audit" ? <Surface><SurfaceHeader eyebrow="Governance ledger" title="Actions et preuves récentes" icon={ShieldCheck} /><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-[160px_1fr_160px_120px] gap-3 bg-slate-50 px-4 py-3 text-[8px] font-black uppercase tracking-[.13em] text-slate-400"><span>Horodatage</span><span>Action</span><span>Entité</span><span>Acteur</span></div>{(data?.auditEvents || []).slice(0, 80).map((event: any, index) => <div key={event.id || index} className="grid grid-cols-[160px_1fr_160px_120px] gap-3 border-t border-slate-100 px-4 py-3"><span className="text-[9px] font-bold text-slate-500">{formatDateTime(event.created_at)}</span><span className="truncate text-[9px] font-black text-slate-700">{event.action || event.event_type || "Action"}</span><span className="truncate text-[9px] font-semibold text-slate-500">{event.entity_type || "—"}</span><span className="truncate text-[9px] font-semibold text-slate-500">{event.actor_name || event.actor_user_id || "Système"}</span></div>)}{!data?.auditEvents.length ? <div className="p-5"><EmptyState compact title="Aucun événement d’audit" description="Les actions auditées apparaîtront dans ce registre de gouvernance." icon={ShieldCheck} /></div> : null}</div></Surface> : null}
  </div>
}

function ExecutiveGauge({ label, value, tone, detail }: { label: string; value: number; tone: "emerald" | "blue" | "violet" | "amber"; detail: string }) { return <div className="rounded-[24px] border border-slate-200 p-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950">{value}%</p></div><StatusPill status={value >= 80 ? "active" : value >= 50 ? "warning" : "error"} compact /></div><div className="mt-4"><ProgressBar value={value} tone={tone} /></div><p className="mt-3 text-[8px] font-semibold text-slate-400">{detail}</p></div> }
function Ownership({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="text-[9px] font-black text-slate-600">{label}</span><span className="text-[9px] font-black text-slate-900">{value}</span></div> }
function Total({ label, value }: { label: string; value: number }) { return <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><p className="text-3xl font-black tracking-[-.05em] text-slate-950">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-slate-400">{label}</p></div> }
