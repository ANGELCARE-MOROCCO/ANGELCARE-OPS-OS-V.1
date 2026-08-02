"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity, AlertTriangle, Bell, BriefcaseBusiness, ChevronRight, Command, ContactRound,
  Gauge, LayoutGrid, Menu, MessageCircleMore, RadioTower, RefreshCw, Search, Settings2,
  ShieldCheck, Sparkles, UsersRound, X,
} from "lucide-react"
import { cx, HealthBadge, LiveDot, StatusPill } from "./ACWhatsAppUI"
import { formatRelative, initials, useAcWhatsApp } from "./useAcWhatsApp"

const masters = [
  { href: "/ac-whatsapp/live", label: "Live Command", caption: "Conversations en temps réel", icon: MessageCircleMore, number: "01" },
  { href: "/ac-whatsapp/outreach", label: "Commercial Outreach", caption: "Prospection, campagnes, séquences", icon: BriefcaseBusiness, number: "02" },
  { href: "/ac-whatsapp/contacts", label: "Contacts & Intelligence", caption: "Identités et contexte business", icon: ContactRound, number: "03" },
  { href: "/ac-whatsapp/team", label: "Team Operations", caption: "Files, accès et performance", icon: UsersRound, number: "04" },
  { href: "/ac-whatsapp/accounts", label: "Accounts & Automation", caption: "Sessions, modèles et runtime", icon: RadioTower, number: "05" },
  { href: "/ac-whatsapp/executive", label: "Executive Control", caption: "Pilotage, risques et audit", icon: Gauge, number: "06" },
]

type SearchResult = { id: string; type: "conversation" | "contact" | "campaign" | "account" | "navigation"; title: string; subtitle: string; href: string; status?: string }

export default function ACWhatsAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, refresh } = useAcWhatsApp(15000)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [syncing, setSyncing] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const activeMaster = masters.find((item) => pathname.startsWith(item.href)) || masters[0]
  const ActiveMasterIcon = activeMaster.icon
  const securityEvents = data?.securityEvents || []
  const criticalCount = securityEvents.filter((event: any) => ["critical", "high"].includes(String(event.severity))).length

  const results = useMemo<SearchResult[]>(() => {
    const needle = query.trim().toLowerCase()
    const all: SearchResult[] = [
      ...masters.map((item) => ({ id: item.href, type: "navigation" as const, title: item.label, subtitle: item.caption, href: item.href })),
      ...(data?.conversations || []).map((row) => ({ id: row.id, type: "conversation" as const, title: row.contact?.display_name || row.contact?.phone_number_e164 || "Conversation WhatsApp", subtitle: [row.contact?.organization_name, row.last_message_preview].filter(Boolean).join(" · "), href: `/ac-whatsapp/live?conversation=${encodeURIComponent(row.id)}`, status: row.status })),
      ...(data?.contacts || []).map((row) => ({ id: row.id, type: "contact" as const, title: row.display_name || row.phone_number_e164 || "Contact WhatsApp", subtitle: [row.organization_name, row.city, row.phone_number_e164].filter(Boolean).join(" · "), href: `/ac-whatsapp/contacts?contact=${encodeURIComponent(row.id)}`, status: row.lead_stage || row.priority })),
      ...(data?.campaigns || []).map((row) => ({ id: row.id, type: "campaign" as const, title: row.name, subtitle: [row.objective, `${row.total_recipients || 0} destinataires`].filter(Boolean).join(" · "), href: `/ac-whatsapp/outreach?campaign=${encodeURIComponent(row.id)}`, status: row.status })),
      ...(data?.accounts || []).map((row) => ({ id: row.id, type: "account" as const, title: row.name, subtitle: [row.phone_number_e164, row.department, row.openwa_session_name].filter(Boolean).join(" · "), href: `/ac-whatsapp/accounts?account=${encodeURIComponent(row.id)}`, status: row.status })),
    ]
    if (!needle) return all.slice(0, 18)
    return all.filter((item) => `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(needle)).slice(0, 30)
  }, [data, query])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((v) => !v) }
      if (event.key === "Escape") { setPaletteOpen(false); setNotificationsOpen(false); setMobileOpen(false) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => { if (paletteOpen) window.setTimeout(() => searchRef.current?.focus(), 60); else setQuery("") }, [paletteOpen])

  async function synchronize() { if (syncing) return; setSyncing(true); try { await refresh() } catch {} finally { setSyncing(false) } }
  function navigate(href: string) { setPaletteOpen(false); setMobileOpen(false); router.push(href) }

  const Sidebar = (
    <div className="flex h-full flex-col bg-white px-3 pb-3 pt-4">
      <Link href="/ac-whatsapp/live" onClick={() => setMobileOpen(false)} className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_18%_0%,#fff1f2_0,#ffffff_42%,#f8fafc_100%)] p-4 shadow-[0_18px_50px_rgba(15,23,42,.065)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-rose-100 bg-rose-50/60" />
        <div className="relative flex items-center gap-3"><div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-slate-950 text-white shadow-lg shadow-slate-950/15"><MessageCircleMore className="h-5 w-5" /><span className={cx("absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white", data?.health.openwaReachable ? "bg-emerald-500" : "bg-rose-600")} /></div><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[.22em] text-rose-600">ANGELCARE</p><p className="mt-1 truncate text-lg font-black tracking-[-.04em] text-slate-950">AC WhatsApp Live</p><p className="mt-1 text-[9px] font-bold text-slate-400">Communications Command Universe</p></div></div>
        <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white/85 px-3 py-2.5 backdrop-blur"><LiveDot online={Boolean(data?.health.openwaReachable)} /><span className="text-[9px] font-black text-slate-400">{data?.counts.connectedAccounts || 0}/{data?.counts.accounts || 0} comptes</span></div>
      </Link>
      <div className="mt-5 flex items-center justify-between px-2"><p className="text-[8px] font-black uppercase tracking-[.2em] text-slate-400">Master workspaces</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-500">06</span></div>
      <nav className="mt-2 space-y-1.5">{masters.map((item) => { const active = pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cx("group flex items-center gap-3 rounded-[18px] border px-3 py-3 transition duration-200", active ? "border-slate-950 bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,.18)]" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950")}><div className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-xl", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-white")}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={cx("text-[8px] font-black", active ? "text-rose-300" : "text-slate-300")}>{item.number}</span><p className="truncate text-xs font-black">{item.label}</p></div><p className={cx("mt-1 truncate text-[9px] font-bold", active ? "text-white/50" : "text-slate-400")}>{item.caption}</p></div><ChevronRight className={cx("h-3.5 w-3.5", active ? "text-white" : "text-slate-300")} /></Link> })}</nav>
      <div className="mt-auto space-y-2 pt-4"><div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-600" /><span className="text-[9px] font-black text-slate-700">Pulse opérationnel</span></div><span className="text-[8px] font-black text-slate-400">LIVE</span></div><div className="mt-3 grid grid-cols-3 gap-1.5"><Pulse label="Non lus" value={data?.counts.unread || 0} /><Pulse label="À assigner" value={data?.counts.unassigned || 0} /><Pulse label="Risques" value={data?.counts.securityOpen || 0} /></div></div><Link href="/whatsapp-os/admin" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><LayoutGrid className="h-4 w-4" />WhatsApp Desktop Admin</Link><button type="button" onClick={() => void synchronize()} className="flex w-full items-center gap-3 rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-200"><RefreshCw className={cx("h-4 w-4", syncing && "animate-spin")} />{syncing ? "Synchronisation…" : "Synchroniser maintenant"}</button></div>
    </div>
  )

  return <div className="min-h-screen bg-[#f3f6fb] text-slate-950">
    <div className="fixed inset-y-0 left-0 z-40 hidden w-[300px] border-r border-slate-200 bg-white xl:block">{Sidebar}</div>
    {mobileOpen ? <div className="fixed inset-0 z-[70] xl:hidden"><button type="button" aria-label="Fermer la navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" /><div className="relative h-full w-[min(92vw,320px)] border-r border-slate-200 bg-white shadow-2xl">{Sidebar}</div></div> : null}
    <div className="xl:pl-[300px]">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/94 backdrop-blur-xl">
        <div className="flex min-h-[66px] items-center justify-between gap-4 px-4 lg:px-7"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 xl:hidden"><Menu className="h-4 w-4" /></button><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/20"><ActiveMasterIcon className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-[8px] font-black uppercase tracking-[.18em] text-slate-400">Communications Operating System · Master {activeMaster.number}</p><p className="mt-0.5 truncate text-sm font-black text-slate-950">{activeMaster.label}<span className="font-semibold text-slate-400"> · {data?.actor.role || "Accès protégé"}</span></p></div></div>
          <button type="button" onClick={() => setPaletteOpen(true)} className="hidden min-w-[260px] max-w-[460px] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 transition hover:border-slate-300 hover:bg-white lg:flex"><Search className="h-4 w-4" /><span className="flex-1">Rechercher conversation, contact, campagne…</span><span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[8px] font-black text-slate-500">⌘ K</span></button>
          <div className="flex shrink-0 items-center gap-2"><div className="hidden 2xl:block"><HealthBadge good={Boolean(data?.health.openwaReachable)} goodLabel="OpenWA opérationnel" badLabel="OpenWA à vérifier" /></div><div className="hidden items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] text-violet-700 md:flex"><Sparkles className="h-3.5 w-3.5" />Intelligence AC</div><button type="button" onClick={() => setPaletteOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden"><Search className="h-4 w-4" /></button><button type="button" onClick={() => setNotificationsOpen((v) => !v)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"><Bell className="h-4 w-4" />{criticalCount ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-600 px-1 text-[8px] font-black text-white">{criticalCount > 9 ? "9+" : criticalCount}</span> : null}</button><Link href="/ac-whatsapp/accounts" className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-700 sm:flex"><Settings2 className="h-4 w-4" />Admin</Link><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-[10px] font-black text-white">{initials(data?.actor.name)}</div></div>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2 lg:px-7"><div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"><ContextChip label="Comptes" value={`${data?.counts.connectedAccounts || 0}/${data?.counts.accounts || 0}`} tone="emerald" /><ContextChip label="Conversations" value={String(data?.counts.conversations || 0)} /><ContextChip label="Non lus" value={String(data?.counts.unread || 0)} tone="rose" /><ContextChip label="Campagnes actives" value={String(data?.counts.runningCampaigns || 0)} tone="blue" /><ContextChip label="Risques" value={String(data?.counts.securityOpen || 0)} tone="amber" /></div><span className="hidden text-[8px] font-black uppercase tracking-[.12em] text-slate-400 md:block">Flux live · auto 15 s</span></div>
      </header>
      <main className="p-4 lg:p-7">{children}</main>
    </div>

    {notificationsOpen ? <div className="fixed right-4 top-[74px] z-[65] w-[min(92vw,390px)] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-4"><div><p className="text-[8px] font-black uppercase tracking-[.16em] text-rose-600">Escalation centre</p><p className="mt-1 text-base font-black text-slate-950">Signaux à contrôler</p></div><button type="button" onClick={() => setNotificationsOpen(false)} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200"><X className="h-3.5 w-3.5" /></button></div><div className="max-h-[58vh] overflow-y-auto p-3">{securityEvents.length ? securityEvents.slice(0, 12).map((event: any, index) => <div key={event.id || index} className="rounded-2xl border border-slate-200 p-3"><div className="flex gap-3"><div className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-xl", ["critical", "high"].includes(String(event.severity)) ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}><AlertTriangle className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-black text-slate-900">{event.title || event.event_type}</p><StatusPill status={event.severity || "warning"} compact /></div><p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-4 text-slate-500">{event.description || "Signal de sécurité ou de runtime enregistré."}</p><p className="mt-2 text-[8px] font-bold text-slate-400">{formatRelative(event.created_at)}</p></div></div></div>) : <div className="grid min-h-40 place-items-center text-center"><div><ShieldCheck className="mx-auto h-7 w-7 text-emerald-600" /><p className="mt-3 text-xs font-black text-slate-900">Aucun signal critique ouvert</p><p className="mt-1 text-[10px] font-semibold text-slate-500">Les événements apparaîtront ici.</p></div></div>}</div><Link href="/ac-whatsapp/executive" onClick={() => setNotificationsOpen(false)} className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[10px] font-black text-slate-700">Ouvrir Executive Control<ChevronRight className="h-4 w-4" /></Link></div> : null}

    {paletteOpen ? <div className="fixed inset-0 z-[90] flex justify-center bg-slate-950/55 px-4 pt-[8vh] backdrop-blur-sm"><button type="button" className="absolute inset-0" aria-label="Fermer" onClick={() => setPaletteOpen(false)} /><div className="relative h-fit max-h-[78vh] w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/30 bg-white shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Command className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">Commande universelle</p><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && results[0]) navigate(results[0].href) }} placeholder="Rechercher ou lancer une action…" className="mt-1 w-full bg-transparent text-base font-black text-slate-950 outline-none placeholder:text-slate-300" /></div><button type="button" onClick={() => setPaletteOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div><div className="max-h-[60vh] overflow-y-auto p-3">{results.length ? <div className="space-y-1">{results.map((result) => <button key={`${result.type}:${result.id}`} type="button" onClick={() => navigate(result.href)} className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">{result.type === "conversation" ? <MessageCircleMore className="h-4 w-4" /> : result.type === "contact" ? <ContactRound className="h-4 w-4" /> : result.type === "campaign" ? <BriefcaseBusiness className="h-4 w-4" /> : result.type === "account" ? <RadioTower className="h-4 w-4" /> : <Command className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-950">{result.title}</p><p className="mt-1 truncate text-[9px] font-semibold text-slate-500">{result.subtitle || result.type}</p></div>{result.status ? <StatusPill status={result.status} compact /> : <ChevronRight className="h-4 w-4 text-slate-300" />}</button>)}</div> : <div className="grid min-h-40 place-items-center text-center"><p className="text-sm font-black text-slate-600">Aucun résultat correspondant</p></div>}</div></div></div> : null}
  </div>
}

function Pulse({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center"><p className="text-sm font-black text-slate-950">{value}</p><p className="mt-0.5 text-[7px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p></div> }
function ContextChip({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "emerald" | "rose" | "blue" | "amber" }) { const classes = { slate: "border-slate-200 bg-slate-50 text-slate-600", emerald: "border-emerald-100 bg-emerald-50 text-emerald-700", rose: "border-rose-100 bg-rose-50 text-rose-700", blue: "border-blue-100 bg-blue-50 text-blue-700", amber: "border-amber-100 bg-amber-50 text-amber-700" }[tone]; return <span className={cx("inline-flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.08em]", classes)}><span className="opacity-65">{label}</span><strong>{value}</strong></span> }
