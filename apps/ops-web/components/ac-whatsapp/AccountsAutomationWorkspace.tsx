"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Activity, AlertTriangle, Bot, CheckCircle2, CirclePause, CirclePlay, CloudCog, Copy, KeyRound, Link2,
  MessageSquareText, PlugZap, Plus, QrCode, RadioTower, RefreshCw, ServerCog, ShieldCheck,
  Smartphone, Unplug, Webhook, Wifi, Workflow,
} from "lucide-react"
import type { AcWhatsAppAccount } from "@/lib/ac-whatsapp/types"
import {
  cx, DetailRow, EmptyState, HealthBadge, LoadingPanel, Metric, ModalFrame, NoticeBanner,
  ProgressBar, SectionTitle, StatusPill, Surface, SurfaceHeader, WorkspaceTabs,
} from "./ACWhatsAppUI"
import { acApi, formatRelative, friendlyAcError, percentage, useAcWhatsApp } from "./useAcWhatsApp"

type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }

export default function AccountsAutomationWorkspace() {
  const searchParams = useSearchParams()
  const { data, loading, error, refresh } = useAcWhatsApp(12000)
  const [tab, setTab] = useState("accounts")
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("account"))
  const [createOpen, setCreateOpen] = useState(false)
  const [pairOpen, setPairOpen] = useState(false)
  const [pairPayload, setPairPayload] = useState<any>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const accounts = data?.accounts || []
  const selected = accounts.find((row) => row.id === selectedId) || accounts[0] || null
  useEffect(() => { if (!selectedId && accounts[0]) setSelectedId(accounts[0].id) }, [accounts, selectedId])

  async function action(account: AcWhatsAppAccount, actionName: "start" | "stop" | "logout" | "qr" | "pairing" | "sync" | "pause" | "resume") {
    setBusy(`${account.id}:${actionName}`)
    try {
      const result = await acApi<any>(`/api/ac-whatsapp/accounts/${account.id}/action`, { method: "POST", body: JSON.stringify({ action: actionName, phoneNumber: account.phone_number_e164 }) })
      if (actionName === "qr" || actionName === "pairing") { setPairPayload({ action: actionName, account, result }); setPairOpen(true) }
      await refresh()
      if (!["qr", "pairing"].includes(actionName)) setNotice({ tone: "success", title: "Commande runtime exécutée", description: `La commande « ${actionName} » a été envoyée à OpenWA et le statut AngelCare a été synchronisé.` })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setBusy(null) }
  }

  if (loading && !data) return <LoadingPanel label="Ouverture de Accounts & Automation" />
  const connected = accounts.filter((row) => row.status === "connected").length
  const degraded = accounts.filter((row) => ["error", "degraded", "disconnected", "authentication_lost"].includes(row.status)).length
  const enabledCampaigns = accounts.filter((row) => row.campaigns_enabled && row.bulk_messaging_enabled).length

  return <div className="space-y-5">
    <SectionTitle eyebrow="Master Workspace 05 · Accounts & Automation" title="Piloter les comptes, les sessions et l’automatisation avec confiance." description="Provisionnement guidé, QR, santé OpenWA, capacités commerciales, modèles et webhooks sous une administration AngelCare lisible et traçable." action={<button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black text-white shadow-lg shadow-rose-600/20"><Plus className="h-4 w-4" />Connecter un compte</button>} />
    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)} /> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} reference={notice.reference} onClose={() => setNotice(null)} /> : null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Comptes déclarés" value={accounts.length} detail="Sessions isolées" icon={RadioTower} tone="slate" />
      <Metric label="Connectés" value={connected} detail="Transport actif" icon={PlugZap} tone="emerald" />
      <Metric label="Campagnes autorisées" value={enabledCampaigns} detail="Bulk + campagnes activés" icon={MessageSquareText} tone="blue" />
      <Metric label="À contrôler" value={degraded} detail={data?.health.openwaReachable ? "Gateway joignable" : "Runtime indisponible"} icon={ServerCog} tone={degraded ? "rose" : "violet"} />
    </div>

    <WorkspaceTabs active={tab} onChange={setTab} tabs={[
      { id: "accounts", label: "Comptes & sessions", icon: RadioTower, count: accounts.length },
      { id: "templates", label: "Template Studio", icon: MessageSquareText, count: data?.templates.length || 0 },
      { id: "automation", label: "Automatisations", icon: Workflow },
      { id: "runtime", label: "Runtime & webhooks", icon: ServerCog },
    ]} />

    {tab === "accounts" ? <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
      <Surface className="p-0"><div className="border-b border-slate-200 p-4"><SurfaceHeader eyebrow="Account fleet" title="Actifs de communication" icon={RadioTower} /></div><div className="grid gap-3 p-4 lg:grid-cols-2">{accounts.length ? accounts.map((account) => <AccountCard key={account.id} account={account} selected={selected?.id === account.id} busy={Boolean(busy?.startsWith(account.id))} onSelect={() => setSelectedId(account.id)} onAction={(name) => void action(account, name)} />) : <div className="lg:col-span-2"><EmptyState title="Aucun compte OpenWA" description="Créez une session isolée puis authentifiez le numéro par QR ou code d’appairage." icon={QrCode} action={<button type="button" onClick={() => setCreateOpen(true)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Démarrer le provisioning</button>} /></div>}</div></Surface>
      <AccountInspector account={selected} health={Boolean(data?.health.openwaReachable)} onAction={(account, name) => void action(account, name)} busy={busy} />
    </div> : null}

    {tab === "templates" ? <TemplateStudio templates={data?.templates || []} /> : null}
    {tab === "automation" ? <AutomationStudio accounts={accounts} /> : null}
    {tab === "runtime" ? <RuntimeCockpit data={data} onRefresh={() => void refresh()} /> : null}

    {createOpen && data ? <AccountProvisioning data={data} onClose={() => setCreateOpen(false)} onCreated={async (account) => { setCreateOpen(false); setSelectedId(account.id); await refresh(); setNotice({ tone: "success", title: "Session OpenWA créée", description: "Le compte est enregistré. Poursuivez avec le QR ou le code d’appairage pour achever l’authentification." }) }} /> : null}
    {pairOpen && pairPayload ? <PairingModal payload={pairPayload} onClose={() => setPairOpen(false)} onRefresh={() => pairPayload.account && void action(pairPayload.account, pairPayload.action)} onConnected={async () => { setPairOpen(false); setPairPayload(null); await refresh(); setNotice({ tone: "success", title: "WhatsApp connecté", description: "Le téléphone a été authentifié, la session OpenWA est active et le statut AngelCare a été synchronisé." }) }} /> : null}
  </div>
}

function accountStateMeta(status: string) {
  const normalized = String(status || "draft").toLowerCase()
  if (normalized === "connected") return { label: "Connecté", detail: "Transport actif", tone: "emerald" as const, icon: Wifi }
  if (["qr_required", "pairing_required"].includes(normalized)) return { label: "QR requis", detail: "Authentification attendue", tone: "amber" as const, icon: QrCode }
  if (["starting", "authenticating"].includes(normalized)) return { label: "Connexion en cours", detail: "OpenWA initialise la session", tone: "blue" as const, icon: RefreshCw }
  if (normalized === "paused") return { label: "En pause", detail: "Transport suspendu", tone: "violet" as const, icon: CirclePause }
  if (["error", "degraded", "authentication_lost"].includes(normalized)) return { label: "À rétablir", detail: "Intervention requise", tone: "rose" as const, icon: AlertTriangle }
  if (normalized === "disconnected") return { label: "Déconnecté", detail: "Session inactive", tone: "slate" as const, icon: Unplug }
  return { label: "À configurer", detail: "Session non activée", tone: "slate" as const, icon: Smartphone }
}

function AccountCard({ account, selected, busy, onSelect, onAction }: { account: AcWhatsAppAccount; selected: boolean; busy: boolean; onSelect: () => void; onAction: (action: "start" | "stop" | "qr" | "pairing" | "sync" | "pause" | "resume" | "logout") => void }) {
  const state = accountStateMeta(account.status)
  const configurationScore = Math.max(0, Math.min(100, Number(account.health_score || 0)))
  const canShowQr = ["qr_required", "pairing_required", "starting", "authenticating", "draft", "disconnected", "error"].includes(account.status)
  const primaryLabel = account.status === "connected" ? "Mettre en pause" : account.status === "paused" ? "Reprendre" : "Démarrer"
  const primaryIcon = account.status === "connected" ? CirclePause : CirclePlay
  const primaryAction = account.status === "connected" ? "pause" : account.status === "paused" ? "resume" : "start"

  return <article className={cx(
    "group relative overflow-hidden rounded-[28px] border p-5 transition-all duration-300",
    selected
      ? "border-[#253956] bg-[#07111f] text-white shadow-[0_24px_70px_rgba(7,17,31,.28)] ring-1 ring-white/[.04]"
      : "border-slate-200 bg-white text-slate-950 shadow-[0_12px_35px_rgba(15,23,42,.06)] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,.10)]",
  )}>
    {selected ? <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" /> : null}

    <button type="button" onClick={onSelect} className="w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#07111f]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className={cx(
            "grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border",
            selected ? "border-white/10 bg-white/[.07] text-sky-200" : "border-slate-200 bg-slate-50 text-slate-700",
          )}><Smartphone className="h-5 w-5" /></div>
          <div className="min-w-0">
            <p className={cx("text-[9px] font-black uppercase tracking-[.19em]", selected ? "text-sky-300" : "text-sky-700")}>{account.code}</p>
            <p className={cx("mt-1.5 truncate text-[17px] font-black tracking-[-.02em]", selected ? "text-white" : "text-slate-950")}>{account.name}</p>
            <p className={cx("mt-1 truncate text-[10px] font-bold", selected ? "text-slate-300" : "text-slate-500")}>{account.phone_number_e164 || "Numéro à authentifier"}</p>
          </div>
        </div>
        <AccountStateBadge status={account.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <AccountMetric label="Configuration" value={`${configurationScore}%`} selected={selected} />
        <AccountMetric label="Département" value={account.department || "—"} selected={selected} />
        <AccountMetric label="Activité" value={formatRelative(account.last_activity_at)} selected={selected} />
      </div>

      <div className={cx("mt-5 rounded-2xl border p-3.5", selected ? "border-white/10 bg-white/[.045]" : "border-slate-200 bg-slate-50/80")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cx("text-[8px] font-black uppercase tracking-[.16em]", selected ? "text-slate-400" : "text-slate-500")}>Configuration du compte</p>
            <p className={cx("mt-1 text-[9px] font-bold", selected ? "text-slate-200" : "text-slate-600")}>{state.detail}</p>
          </div>
          <span className={cx("text-xs font-black tabular-nums", selected ? "text-white" : "text-slate-950")}>{configurationScore}%</span>
        </div>
        <div className={cx("mt-3 h-2 overflow-hidden rounded-full", selected ? "bg-white/10" : "bg-slate-200")}>
          <div className={cx("h-full rounded-full transition-all duration-500", account.status === "connected" ? "bg-emerald-400" : "bg-sky-400")} style={{ width: `${configurationScore}%` }} />
        </div>
      </div>
    </button>

    <div className={cx("mt-5 flex flex-wrap items-center gap-2 border-t pt-4", selected ? "border-white/10" : "border-slate-200")}>
      <AccountAction label={primaryLabel} icon={primaryIcon} variant="primary" selected={selected} disabled={busy} onClick={() => onAction(primaryAction)} />
      {canShowQr ? <AccountAction label="Afficher le QR" icon={QrCode} variant="secondary" selected={selected} disabled={busy} onClick={() => onAction("qr")} /> : null}
      <AccountAction label="Synchroniser" icon={RefreshCw} variant="utility" selected={selected} disabled={busy} onClick={() => onAction("sync")} />
      {busy ? <span className={cx("ml-auto inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.12em]", selected ? "text-sky-200" : "text-sky-700")}><RefreshCw className="h-3 w-3 animate-spin" />Commande en cours</span> : null}
    </div>
  </article>
}

function AccountStateBadge({ status }: { status: string }) {
  const state = accountStateMeta(status)
  const Icon = state.icon
  const tone = {
    emerald: "border-emerald-300/50 bg-emerald-50 text-emerald-700",
    amber: "border-amber-300/60 bg-amber-50 text-amber-800",
    blue: "border-sky-300/60 bg-sky-50 text-sky-700",
    violet: "border-violet-300/60 bg-violet-50 text-violet-700",
    rose: "border-rose-300/60 bg-rose-50 text-rose-700",
    slate: "border-slate-300 bg-slate-100 text-slate-700",
  }[state.tone]
  return <span className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] shadow-sm", tone)}><Icon className="h-3.5 w-3.5" />{state.label}</span>
}

function AccountMetric({ label, value, selected }: { label: string; value: React.ReactNode; selected: boolean }) {
  return <div className={cx("min-w-0 rounded-2xl border px-3 py-3", selected ? "border-white/10 bg-white/[.055]" : "border-slate-200 bg-slate-50")}>
    <p className={cx("truncate text-[11px] font-black", selected ? "text-white" : "text-slate-950")}>{value}</p>
    <p className={cx("mt-1.5 truncate text-[7px] font-black uppercase tracking-[.13em]", selected ? "text-slate-400" : "text-slate-500")}>{label}</p>
  </div>
}

function AccountAction({ label, icon: Icon, selected, disabled, variant, onClick }: { label: string; icon: typeof QrCode; selected: boolean; disabled: boolean; variant: "primary" | "secondary" | "utility"; onClick: () => void }) {
  const classes = variant === "primary"
    ? selected ? "bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-sky-50" : "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
    : variant === "secondary"
      ? selected ? "border border-white/20 bg-white/[.07] text-white hover:bg-white/[.12]" : "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
      : selected ? "text-slate-300 hover:bg-white/[.07] hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  return <button type="button" disabled={disabled} onClick={onClick} className={cx("inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40", classes)}><Icon className="h-3.5 w-3.5" />{label}</button>
}

function AccountInspector({ account, health, onAction, busy }: { account: AcWhatsAppAccount | null; health: boolean; onAction: (account: AcWhatsAppAccount, action: "start" | "stop" | "qr" | "pairing" | "sync" | "pause" | "resume" | "logout") => void; busy: string | null }) {
  if (!account) return <Surface><EmptyState compact title="Sélectionnez un compte" description="Le statut, la session et les commandes de provisioning apparaîtront ici." icon={RadioTower} /></Surface>
  return <div className="space-y-4"><Surface><SurfaceHeader eyebrow="Account command" title={account.name} icon={Smartphone} action={<HealthBadge good={health && account.status !== "error"} goodLabel="Gateway protégé" badLabel="À vérifier" />} /><div className="mt-4"><DetailRow label="Statut" value={<StatusPill status={account.status} compact />} /><DetailRow label="Numéro" value={account.phone_number_e164} /><DetailRow label="Session" value={account.openwa_session_name} mono /><DetailRow label="Engine" value={account.engine_type} /><DetailRow label="Dernière activité" value={formatRelative(account.last_activity_at)} /><DetailRow label="Dernière erreur" value={account.last_error || "Aucune"} /></div></Surface><Surface><SurfaceHeader eyebrow="Capabilities" title="Doctrine de communication" icon={ShieldCheck} /><div className="mt-4 grid grid-cols-2 gap-2"><Capability label="Outbound" active={account.outbound_enabled} /><Capability label="Campagnes" active={account.campaigns_enabled} /><Capability label="Prospection" active={account.cold_prospecting_enabled} /><Capability label="Bulk" active={account.bulk_messaging_enabled} /></div></Surface><Surface><SurfaceHeader eyebrow="Provisioning" title="Actions de session" icon={CloudCog} /><div className="mt-4 grid grid-cols-2 gap-2"><Control label="Afficher le QR" icon={QrCode} onClick={() => onAction(account, "qr")} /><Control label="Code d’appairage" icon={KeyRound} onClick={() => onAction(account, "pairing")} /><Control label="Synchroniser" icon={RefreshCw} onClick={() => onAction(account, "sync")} /><Control label={account.status === "connected" ? "Arrêter" : "Démarrer"} icon={account.status === "connected" ? Unplug : CirclePlay} onClick={() => onAction(account, account.status === "connected" ? "stop" : "start")} /></div>{busy?.startsWith(account.id) ? <p className="mt-3 text-[9px] font-black text-slate-400">Commande OpenWA en cours…</p> : null}</Surface></div>
}
function Capability({ label, active }: { label: string; active: boolean }) { return <div className={cx("rounded-2xl border p-3", active ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}><div className="flex items-center justify-between"><span className="text-[9px] font-black text-slate-700">{label}</span>{active ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CirclePause className="h-4 w-4 text-slate-400" />}</div></div> }
function Control({ label, icon: Icon, onClick }: { label: string; icon: typeof QrCode; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white"><Icon className="h-4 w-4 text-slate-700" /><p className="mt-2 text-[9px] font-black text-slate-700">{label}</p></button> }

function TemplateStudio({ templates }: { templates: Array<Record<string, unknown>> }) { return <Surface><SurfaceHeader eyebrow="Template studio" title="Bibliothèque de modèles gouvernés" icon={MessageSquareText} action={<button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-600">Nouveau modèle</button>} /><div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{templates.length ? templates.map((template: any, index) => <div key={template.id || index} className="rounded-[24px] border border-slate-200 p-4"><div className="flex items-start justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.14em] text-rose-600">{template.category || template.template_type || "Modèle"}</p><p className="mt-2 text-sm font-black text-slate-950">{template.name || template.title || `Modèle ${index + 1}`}</p></div><StatusPill status={template.status || "draft"} compact /></div><p className="mt-4 line-clamp-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-[10px] font-semibold leading-5 text-slate-600">{template.body || template.content || template.message_body || "Contenu non exposé dans ce résumé."}</p></div>) : <div className="lg:col-span-2 xl:col-span-3"><EmptyState title="Bibliothèque vide" description="Les modèles approuvés apparaîtront ici avec leur catégorie, langue, variables et statut." icon={MessageSquareText} /></div>}</div></Surface> }

function AutomationStudio({ accounts }: { accounts: AcWhatsAppAccount[] }) { const doctrines = [{ title: "Réponse entrante", detail: "Router vers la bonne file et attribuer selon capacité", icon: Workflow }, { title: "Relance sans réponse", detail: "Créer une tâche humaine après le délai défini", icon: Activity }, { title: "Signal commercial", detail: "Qualifier le contact et ouvrir une opportunité", icon: Bot }, { title: "Escalade risque", detail: "Alerter le superviseur et protéger l’historique", icon: ShieldCheck }]; return <Surface><SurfaceHeader eyebrow="Automation control" title="Doctrines d’automatisation explicables" icon={Workflow} /><div className="mt-5 grid gap-4 lg:grid-cols-2">{doctrines.map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></div><StatusPill status="draft" label="À configurer" compact /></div><p className="mt-4 text-sm font-black text-slate-900">{item.title}</p><p className="mt-2 text-[9px] font-semibold leading-5 text-slate-500">{item.detail}</p></div> })}</div><div className="mt-5"><NoticeBanner tone="info" title="État honnête" description={`${accounts.length} compte(s) sont disponibles. Les cartes ci-dessus décrivent les doctrines prévues ; elles ne sont pas présentées comme actives sans configuration persistée.`} /></div></Surface> }

function RuntimeCockpit({ data, onRefresh }: { data: NonNullable<ReturnType<typeof useAcWhatsApp>["data"]> | null; onRefresh: () => void }) {
  if (!data) return null
  const openSecurityEvents = data.securityEvents.filter((row: any) => row.status === "open")
  const webhookFailureOpen = openSecurityEvents.some((row: any) => String(row.event_type).includes("webhook.registration_failed"))
  const runtimeScore = percentage([data.health.configured, data.health.openwaReachable, !webhookFailureOpen, (data.counts.outboxFailed || 0) === 0].filter(Boolean).length, 4)
  return <div className="grid gap-5 xl:grid-cols-[1fr_380px]"><Surface><SurfaceHeader eyebrow="Runtime cockpit" title="Transport, webhook et capacité de production" icon={ServerCog} action={<button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-600"><RefreshCw className="h-3.5 w-3.5" />Actualiser</button>} /><div className="mt-5 grid gap-3 md:grid-cols-2"><RuntimeLayer icon={ServerCog} title="Configuration serveur" good={data.health.configured} goodText="Variables serveur présentes" badText="Variables manquantes" meaning="Autorise l’application à joindre OpenWA sans exposer de secret au navigateur." /><RuntimeLayer icon={PlugZap} title="OpenWA liveness" good={data.health.openwaReachable} goodText="Gateway joignable" badText="Gateway indisponible" meaning="Le transport peut accepter les commandes de session et de message." /><RuntimeLayer icon={Webhook} title="Événements webhooks" good={!webhookFailureOpen} goodText="Webhook enregistré" badText="Échec ouvert" meaning="Les messages entrants et changements de session peuvent revenir vers AngelCare." /><RuntimeLayer icon={Workflow} title="Dispatch durable" good={(data.counts.outboxFailed || 0) === 0} goodText="Aucun échec déclaré" badText={`${data.counts.outboxFailed || 0} échec(s)`} meaning="Les messages en file dépendent du worker de dispatch et de son secret partagé." /></div><div className="mt-5"><ProgressBar value={runtimeScore} tone={runtimeScore >= 80 ? "emerald" : runtimeScore >= 50 ? "amber" : "rose"} label="Indice de disponibilité observable" /></div></Surface><div className="space-y-4"><Surface><SurfaceHeader eyebrow="Business meaning" title="Ce que le runtime permet" icon={CloudCog} /><div className="mt-4 space-y-3"><Meaning label="OpenWA ready" text="Les commandes de compte, QR et messages directs peuvent être acceptées." /><Meaning label="Webhook sain" text="Les réponses entrantes et accusés de lecture peuvent enrichir le live." /><Meaning label="Dispatch worker sain" text="Les campagnes et retries peuvent sortir de la file durable." /></div></Surface><Surface><SurfaceHeader eyebrow="Exceptions" title="Signaux ouverts" icon={ShieldCheck} /><div className="mt-4 space-y-2">{openSecurityEvents.slice(0, 6).map((event: any, index) => <div key={event.id || index} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><p className="truncate text-[9px] font-black text-slate-700">{event.title || event.event_type}</p><StatusPill status={event.severity || "warning"} compact /></div><p className="mt-1 text-[8px] font-semibold text-slate-400">{formatRelative(event.created_at)}</p></div>)}{!openSecurityEvents.length ? <p className="text-[9px] font-semibold text-slate-400">Aucun événement de sécurité ouvert.</p> : null}</div></Surface></div></div>
}
function RuntimeLayer({ icon: Icon, title, good, goodText, badText, meaning }: { icon: typeof ServerCog; title: string; good: boolean; goodText: string; badText: string; meaning: string }) { return <div className="rounded-[24px] border border-slate-200 p-4"><div className="flex items-start justify-between"><div className={cx("grid h-10 w-10 place-items-center rounded-2xl", good ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}><Icon className="h-4 w-4" /></div><StatusPill status={good ? "active" : "error"} label={good ? goodText : badText} compact /></div><p className="mt-4 text-sm font-black text-slate-900">{title}</p><p className="mt-2 text-[9px] font-semibold leading-5 text-slate-500">{meaning}</p></div> }
function Meaning({ label, text }: { label: string; text: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-black text-slate-800">{label}</p><p className="mt-1 text-[8px] font-semibold leading-4 text-slate-500">{text}</p></div> }

function AccountProvisioning({ data, onClose, onCreated }: { data: NonNullable<ReturnType<typeof useAcWhatsApp>["data"]>; onClose: () => void; onCreated: (account: AcWhatsAppAccount) => void }) {
  const [step, setStep] = useState(1); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice | null>(null)
  const [form, setForm] = useState({ name: "", code: "", phone_number_e164: "", department: "Commercial", purpose: "Prospection et relation client", default_queue_id: data.queues[0]?.id || "", engine_type: "whatsapp-web.js", auto_start: true, outbound_enabled: true, campaigns_enabled: true, cold_prospecting_enabled: true, bulk_messaging_enabled: true })
  async function submit() { setBusy(true); try { const account = await acApi<AcWhatsAppAccount>("/api/ac-whatsapp/accounts", { method: "POST", body: JSON.stringify(form) }); onCreated(account) } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setBusy(false) } }
  const labels = ["Identité", "Responsabilité", "Capacités", "Gateway", "Confirmation"]
  return <ModalFrame wide title="Connecter un compte WhatsApp" eyebrow={`Provisioning guidé · ${step}/5`} description="AngelCare crée une session OpenWA isolée, l’enregistre, relie le webhook puis attend l’authentification du téléphone." onClose={onClose} footer={<div className="flex items-center justify-between"><button type="button" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[9px] font-black text-slate-600 disabled:opacity-30">Précédent</button>{step < 5 ? <button type="button" onClick={() => setStep((value) => Math.min(5, value + 1))} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Continuer</button> : <button type="button" onClick={() => void submit()} disabled={busy || !form.name} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Provisionnement…" : "Créer la session"}</button>}</div>}>
    <div className="mb-5 grid grid-cols-5 gap-1">{labels.map((label, index) => <div key={label}><div className={cx("h-1.5 rounded-full", index + 1 <= step ? "bg-rose-600" : "bg-slate-100")} /><p className="mt-1 hidden text-center text-[7px] font-black text-slate-400 sm:block">{label}</p></div>)}</div>{notice ? <NoticeBanner tone="danger" title={notice.title} description={notice.description} /> : null}
    {step === 1 ? <div className="account-editor grid gap-4 md:grid-cols-2"><EditField label="Nom du compte"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AngelCare Service" /></EditField><EditField label="Code interne"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="AC-GEN" /></EditField><EditField label="Numéro E.164"><input value={form.phone_number_e164} onChange={(e) => setForm({ ...form, phone_number_e164: e.target.value })} placeholder="+212…" /></EditField><EditField label="Engine"><select value={form.engine_type} onChange={(e) => setForm({ ...form, engine_type: e.target.value })}><option value="whatsapp-web.js">whatsapp-web.js</option><option value="baileys">Baileys</option></select></EditField></div> : null}
    {step === 2 ? <div className="account-editor grid gap-4 md:grid-cols-2"><EditField label="Département"><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></EditField><EditField label="File par défaut"><select value={form.default_queue_id} onChange={(e) => setForm({ ...form, default_queue_id: e.target.value })}><option value="">Aucune</option>{data.queues.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></EditField><div className="md:col-span-2"><EditField label="Usage principal"><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></EditField></div></div> : null}
    {step === 3 ? <div className="grid gap-3 sm:grid-cols-2">{([ ["outbound_enabled", "Envoi direct", "Autorise les réponses opérateur"], ["campaigns_enabled", "Campagnes", "Autorise les missions commerciales"], ["cold_prospecting_enabled", "Prospection", "Autorise la prospection déclarée"], ["bulk_messaging_enabled", "Bulk", "Autorise la file de destinataires"] ] as const).map(([key, title, detail]) => <label key={key} className={cx("rounded-[22px] border p-4", form[key] ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black text-slate-800">{title}</p><p className="mt-1 text-[8px] font-semibold text-slate-500">{detail}</p></div><input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} /></div></label>)}</div> : null}
    {step === 4 ? <div className="space-y-3"><ProvisionStep icon={ServerCog} title="Création OpenWA" text="Une session unique est créée sur le runtime Windows." /><ProvisionStep icon={Webhook} title="Webhook signé" text="Les événements session et messages sont reliés au backend AngelCare." /><ProvisionStep icon={QrCode} title="Authentification" text="Après création, affichez le QR depuis la carte du compte." /><ProvisionStep icon={CheckCircle2} title="Preuve de production" text="Connectez le téléphone puis réalisez un message test entrant et sortant." /></div> : null}
    {step === 5 ? <div className="grid gap-3 sm:grid-cols-2"><Summary label="Compte" value={form.name || "Non renseigné"} /><Summary label="Numéro" value={form.phone_number_e164 || "À lier"} /><Summary label="Département" value={form.department} /><Summary label="File" value={data.queues.find((row) => row.id === form.default_queue_id)?.name || "Aucune"} /><div className="sm:col-span-2"><NoticeBanner tone="success" title="Provisionnement contrôlé" description="Le compte sera créé et démarré, mais il ne sera pleinement connecté qu’après authentification QR réussie." /></div></div> : null}
    <style jsx global>{`.account-editor input,.account-editor select{width:100%;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:11px 12px;font-size:11px;font-weight:700;color:#0f172a;outline:none}`}</style>
  </ModalFrame>
}
function EditField({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span>{children}</label> }
function ProvisionStep({ icon: Icon, title, text }: { icon: typeof ServerCog; title: string; text: string }) { return <div className="flex gap-3 rounded-2xl border border-slate-200 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></div><div><p className="text-[10px] font-black text-slate-800">{title}</p><p className="mt-1 text-[9px] font-semibold leading-5 text-slate-500">{text}</p></div></div> }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">{label}</p><p className="mt-2 text-sm font-black text-slate-800">{value}</p></div> }

function PairingModal({ payload, onClose, onRefresh, onConnected }: { payload: any; onClose: () => void; onRefresh: () => void; onConnected: () => Promise<void> | void }) {
  const result = payload.result || {}
  const raw = result.qr || result.qrCode || result.qrcode || result.image || result.data?.qr || result.data?.qrcode || result.data?.image || result.base64 || result.code || result.pairingCode || result.pairing_code || result
  const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)
  const imageSource = typeof raw === "string" && (raw.startsWith("data:image") || raw.startsWith("http")) ? raw : null
  const [nativeStatus, setNativeStatus] = useState("qr_ready")
  const [pollError, setPollError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    let active = true
    let timer: number | undefined

    const poll = async () => {
      try {
        const session = await acApi<any>(`/api/ac-whatsapp/accounts/${payload.account.id}/action`, {
          method: "POST",
          body: JSON.stringify({ action: "sync" }),
        })
        if (!active) return
        const status = String(session?.status || "").toLowerCase()
        setNativeStatus(status || "initializing")
        setPollError(null)
        if (["ready", "connected"].includes(status)) {
          setConfirmed(true)
          window.setTimeout(() => { if (active) void onConnected() }, 700)
          return
        }
      } catch (cause) {
        if (!active) return
        setPollError(cause instanceof Error ? cause.message : "PAIRING_STATUS_CHECK_FAILED")
      }
      if (active) timer = window.setTimeout(poll, 2500)
    }

    timer = window.setTimeout(poll, 1200)
    return () => { active = false; if (timer) window.clearTimeout(timer) }
  }, [payload.account.id])

  async function copy() { try { await navigator.clipboard.writeText(text) } catch {} }
  const authenticating = ["authenticating", "initializing"].includes(nativeStatus)
  const statusTitle = confirmed ? "Connexion confirmée" : authenticating ? "Authentification détectée" : "En attente du téléphone"
  const statusDetail = confirmed ? "La session est prête. AngelCare finalise la synchronisation." : authenticating ? "WhatsApp termine la liaison sécurisée. Gardez cette fenêtre ouverte." : "Scannez le QR. Le statut est vérifié automatiquement toutes les 2,5 secondes."

  return <ModalFrame title={payload.action === "qr" ? "Authentifier par QR" : "Code d’appairage"} eyebrow="Secure pairing ceremony" description="Scannez depuis WhatsApp › Appareils connectés. La fenêtre se ferme automatiquement lorsque OpenWA confirme la connexion." onClose={onClose} footer={<div className="flex items-center justify-between gap-3"><div className={cx("rounded-xl px-3 py-2 text-[8px] font-black", confirmed ? "bg-emerald-50 text-emerald-700" : pollError ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>{confirmed ? "CONNECTED" : pollError ? "VÉRIFICATION À RELANCER" : nativeStatus.replaceAll("_", " ").toUpperCase()}</div><div className="flex justify-end gap-2"><button type="button" onClick={onRefresh} disabled={confirmed} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-[9px] font-black text-slate-600 disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" />Nouveau QR</button><button type="button" onClick={onClose} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Fermer</button></div></div>}><div className="mb-4"><NoticeBanner tone={confirmed ? "success" : pollError ? "warning" : "info"} title={statusTitle} description={pollError ? `${statusDetail} Référence : ${pollError}` : statusDetail} /></div><div className="grid gap-5 md:grid-cols-[1fr_260px]"><div className={cx("grid min-h-72 place-items-center rounded-[26px] border p-5 transition", confirmed ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}>{confirmed ? <div className="text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"><CheckCircle2 className="h-10 w-10" /></div><p className="mt-5 text-lg font-black text-slate-950">WhatsApp connecté</p><p className="mt-2 text-[10px] font-semibold text-slate-500">La session, le webhook et le statut AngelCare sont en cours de confirmation finale.</p></div> : imageSource ? <img src={imageSource} alt="QR WhatsApp" className="max-h-64 max-w-full rounded-2xl bg-white p-3 shadow-xl" /> : payload.action === "pairing" ? <div className="text-center"><KeyRound className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-4 break-all font-mono text-3xl font-black tracking-[.15em] text-slate-950">{text}</p></div> : <div className="text-center"><QrCode className="mx-auto h-12 w-12 text-slate-400" /><p className="mt-4 max-w-sm break-all font-mono text-[9px] leading-5 text-slate-500">{text}</p></div>}</div><div className="space-y-3"><ProvisionStep icon={Smartphone} title="1. Ouvrir WhatsApp" text="Utilisez le téléphone dédié au compte AngelCare." /><ProvisionStep icon={Link2} title="2. Appareils connectés" text="Choisissez Lier un appareil puis scannez le QR." /><ProvisionStep icon={CheckCircle2} title="3. Confirmation automatique" text="AngelCare surveille OpenWA et ferme cette fenêtre lorsque le statut devient Connected." /><button type="button" onClick={() => void copy()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[9px] font-black text-slate-600"><Copy className="h-3.5 w-3.5" />Copier la valeur technique</button></div></div></ModalFrame>
}

