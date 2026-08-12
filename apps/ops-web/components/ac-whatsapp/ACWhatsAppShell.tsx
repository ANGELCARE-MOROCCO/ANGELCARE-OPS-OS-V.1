"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity, AlertTriangle, Bell, BriefcaseBusiness, ChevronRight, ChevronsLeft, ChevronsRight,
  CircleHelp, CircleUserRound, Command, ContactRound, Gauge, LayoutGrid, Menu, MessageCircleMore,
  RadioTower, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, UsersRound, X,
} from "lucide-react"
import { cx, HealthBadge, LiveDot, StatusPill } from "./ACWhatsAppUI"
import { acApi, formatRelative, initials, useAcWhatsApp } from "./useAcWhatsApp"
import LiveSignalBroadcastBar from "./LiveSignalBroadcastBar"

const masters = [
  { href: "/ac-whatsapp/live", label: "Live Command", caption: "Conversations", icon: MessageCircleMore, number: "01", key: "L" },
  { href: "/ac-whatsapp/outreach", label: "Commercial Outreach", caption: "Campagnes", icon: BriefcaseBusiness, number: "02", key: "O" },
  { href: "/ac-whatsapp/contacts", label: "Contacts & Intelligence", caption: "Relations", icon: ContactRound, number: "03", key: "C" },
  { href: "/ac-whatsapp/team", label: "Team Operations", caption: "Workforce", icon: UsersRound, number: "04", key: "T" },
  { href: "/ac-whatsapp/accounts", label: "Accounts & Automation", caption: "Runtime", icon: RadioTower, number: "05", key: "A" },
  { href: "/ac-whatsapp/executive", label: "Executive Control", caption: "Gouvernance", icon: Gauge, number: "06", key: "E" },
]

const SIDEBAR_STORAGE_KEY = "ac-whatsapp:sidebar-collapsed"
const DENSITY_STORAGE_KEY = "ac-whatsapp:apex-density"
const privilegedSidebarRoles = new Set(["ceo", "owner", "direction", "executive", "executif", "administrator", "administrators", "administrateur", "admin", "super_admin", "platform_administrator", "account_administrator", "whatsapp_director", "auditor", "auditeur", "root", "root_admin"])

type Density = "compact" | "balanced" | "comfortable"
type SearchResult = { id: string; type: "conversation" | "contact" | "campaign" | "account" | "navigation" | "message" | "file" | "response" | "team"; title: string; subtitle: string; href: string; status?: string; shortcut?: string }

function normalizeIdentity(value: unknown) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s-]+/g, "_")
}
function isAissaouiIlyass(value: unknown) {
  const identity = normalizeIdentity(value).replaceAll("_", " ")
  return identity.includes("aissaoui") && identity.includes("ilyass")
}

export default function ACWhatsAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, refresh } = useAcWhatsApp(15000)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [densityOpen, setDensityOpen] = useState(false)
  const [density, setDensity] = useState<Density>("balanced")
  const [query, setQuery] = useState("")
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([])
  const [syncing, setSyncing] = useState(false)
  const [navChord, setNavChord] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const actorRole = normalizeIdentity(data?.actor.role)
  const hasPrivilegedSidebar = isAissaouiIlyass(data?.actor.name) || privilegedSidebarRoles.has(actorRole)
  const visibleMasters = hasPrivilegedSidebar ? masters : masters.slice(0, 3)
  const activeMaster = masters.find((item) => pathname.startsWith(item.href)) || masters[0]
  const ActiveMasterIcon = activeMaster.icon
  const securityEvents = data?.securityEvents || []
  const criticalCount = securityEvents.filter((event: any) => ["critical", "high"].includes(String(event.severity))).length

  const localResults = useMemo<SearchResult[]>(() => {
    const needle = query.trim().toLowerCase()
    const all: SearchResult[] = [
      ...visibleMasters.map((item) => ({ id: item.href, type: "navigation" as const, title: item.label, subtitle: item.caption, href: item.href, shortcut: `G ${item.key}` })),
      ...(data?.conversations || []).map((row) => ({ id: row.id, type: "conversation" as const, title: row.contact?.display_name || row.contact?.phone_number_e164 || "Conversation WhatsApp", subtitle: [row.contact?.organization_name, row.last_message_preview].filter(Boolean).join(" · "), href: `/ac-whatsapp/live?conversation=${encodeURIComponent(row.id)}`, status: row.status })),
      ...(data?.contacts || []).map((row) => ({ id: row.id, type: "contact" as const, title: row.display_name || row.phone_number_e164 || "Contact WhatsApp", subtitle: [row.organization_name, row.city, row.phone_number_e164].filter(Boolean).join(" · "), href: `/ac-whatsapp/contacts?contact=${encodeURIComponent(row.id)}`, status: row.lead_stage || row.priority })),
      ...(data?.campaigns || []).map((row) => ({ id: row.id, type: "campaign" as const, title: row.name, subtitle: [row.objective, `${row.total_recipients || 0} destinataires`].filter(Boolean).join(" · "), href: `/ac-whatsapp/outreach?campaign=${encodeURIComponent(row.id)}`, status: row.status })),
      ...(data?.accounts || []).map((row) => ({ id: row.id, type: "account" as const, title: row.name, subtitle: [row.phone_number_e164, row.department, row.openwa_session_name].filter(Boolean).join(" · "), href: `/ac-whatsapp/accounts?account=${encodeURIComponent(row.id)}`, status: row.status })),
    ]
    if (!needle) return all.slice(0, 18)
    return all.filter((item) => `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(needle)).slice(0, 36)
  }, [data, query, visibleMasters])

  const results = useMemo<SearchResult[]>(() => {
    const seen = new Set<string>()
    return [...localResults, ...remoteResults].filter((row) => { const key = `${row.type}:${row.id}`; if (seen.has(key)) return false; seen.add(key); return true }).slice(0, 48)
  }, [localResults, remoteResults])

  useEffect(() => {
    const needle = query.trim()
    if (needle.length < 2) { setRemoteResults([]); return }
    let active = true
    const timer = window.setTimeout(() => {
      acApi<{ results: SearchResult[] }>(`/api/ac-whatsapp/search?q=${encodeURIComponent(needle)}`)
        .then((payload) => { if (active) setRemoteResults(Array.isArray(payload?.results) ? payload.results : []) })
        .catch(() => { if (active) setRemoteResults([]) })
    }, 160)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query])

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true")
      const storedDensity = window.localStorage.getItem(DENSITY_STORAGE_KEY)
      if (["compact", "balanced", "comfortable"].includes(String(storedDensity))) setDensity(storedDensity as Density)
    } catch {}
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = Boolean(target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((value) => !value); return }
      if (event.key === "Escape") { setPaletteOpen(false); setNotificationsOpen(false); setHelpOpen(false); setMobileOpen(false); setDensityOpen(false); setNavChord(false); return }
      if (!typing && event.key === "?") { event.preventDefault(); setHelpOpen((value) => !value); return }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (navChord) {
        const item = visibleMasters.find((master) => master.key.toLowerCase() === event.key.toLowerCase())
        setNavChord(false)
        if (item) { event.preventDefault(); router.push(item.href) }
        return
      }
      if (event.key.toLowerCase() === "g") { setNavChord(true); window.setTimeout(() => setNavChord(false), 1200) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [navChord, router, visibleMasters])

  useEffect(() => { if (paletteOpen) window.setTimeout(() => searchRef.current?.focus(), 50); else setQuery("") }, [paletteOpen])

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current
      try { window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }
  function chooseDensity(value: Density) {
    setDensity(value); setDensityOpen(false)
    try { window.localStorage.setItem(DENSITY_STORAGE_KEY, value) } catch {}
  }
  async function synchronize() { if (syncing) return; setSyncing(true); try { await refresh() } catch {} finally { setSyncing(false) } }
  function navigate(href: string) { setPaletteOpen(false); setMobileOpen(false); router.push(href) }

  function renderSidebar(collapsed: boolean) {
    return <div className={cx("flex h-full min-h-0 flex-col bg-white", collapsed ? "px-2 py-3" : "px-3 py-3")}>
      <div className={cx("flex items-center border-b border-slate-200 pb-3", collapsed ? "justify-center" : "gap-3 px-1")}>
        <Link href="/ac-whatsapp/live" onClick={() => setMobileOpen(false)} className={cx("relative block overflow-hidden bg-white", collapsed ? "h-10 w-12" : "h-[48px] w-[142px]")}>
          <img src="/ac-whatsapp/angelcare-full-logo-transparent.png" alt="AngelCare" className="h-full w-full object-contain object-left" />
        </Link>
        {!collapsed ? <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black tracking-[-.02em] text-slate-950">AC WhatsApp</p><div className="mt-1"><LiveDot online={Boolean(data?.health.openwaReachable)} label={data?.health.openwaReachable ? "Runtime connecté" : "Runtime à vérifier"} /></div></div> : null}
        <button type="button" onClick={toggleSidebar} title={collapsed ? "Déployer" : "Réduire"} className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50", collapsed && "absolute left-[57px] top-4 z-10 shadow-sm")}>
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {!collapsed ? <p className="px-2 pb-1 pt-4 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Espaces opératoires</p> : null}
      <nav className={cx("min-h-0 flex-1 overflow-y-auto py-2", collapsed ? "space-y-1" : "space-y-0.5")}>
        {visibleMasters.map((item) => {
          const active = pathname.startsWith(item.href); const Icon = item.icon
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined} className={cx("group relative flex items-center border transition-colors", collapsed ? "h-12 justify-center rounded-xl" : "gap-3 rounded-xl px-2.5 py-2.5", active ? "border-slate-200 bg-slate-950 text-white shadow-sm" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950") }>
            <div className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-lg", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")}><Icon className="h-4 w-4" /></div>
            {!collapsed ? <><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black">{item.label}</p><p className={cx("mt-0.5 text-[10px] font-semibold", active ? "text-white/55" : "text-slate-400")}>{item.caption}</p></div><span className={cx("text-[10px] font-black", active ? "text-white/45" : "text-slate-300")}>{item.number}</span></> : null}
          </Link>
        })}
      </nav>

      <div className="border-t border-slate-200 pt-3">
        {!collapsed ? <div className="mb-2 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50"><Pulse label="Non lus" value={data?.counts.unread || 0} /><Pulse label="À assigner" value={data?.counts.unassigned || 0} /><Pulse label="Risques" value={data?.counts.securityOpen || 0} /></div> : null}
        <Link href="/whatsapp-os/admin" title={collapsed ? "WhatsApp Desktop Admin" : undefined} className={cx("flex items-center rounded-xl text-[9px] font-extrabold text-slate-600 hover:bg-slate-50", collapsed ? "h-10 justify-center" : "gap-2 px-2.5 py-2")}><LayoutGrid className="h-4 w-4" />{!collapsed ? "Desktop Admin" : null}</Link>
        <button type="button" onClick={() => void synchronize()} title={collapsed ? "Synchroniser" : undefined} className={cx("flex w-full items-center rounded-xl text-[9px] font-extrabold text-slate-600 hover:bg-slate-50", collapsed ? "h-10 justify-center" : "gap-2 px-2.5 py-2")}><RefreshCw className={cx("h-4 w-4", syncing && "animate-spin")} />{!collapsed ? (syncing ? "Synchronisation…" : "Synchroniser") : null}</button>
      </div>
    </div>
  }

  return <div data-acw-apex data-acw-density={density} className="h-dvh overflow-hidden bg-[#f4f6f9] pt-[86px] text-slate-950">
    <div className={cx("fixed bottom-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-200 xl:block", sidebarCollapsed ? "w-[72px]" : "w-[252px]")} style={{ top: 86 }}>{renderSidebar(sidebarCollapsed)}</div>

    {mobileOpen ? <div className="fixed bottom-0 left-0 right-0 z-[70] xl:hidden" style={{ top: 86 }}><button type="button" aria-label="Fermer la navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" /><div className="relative h-full w-[min(90vw,280px)] border-r border-slate-200 bg-white shadow-2xl">{renderSidebar(false)}</div></div> : null}

    <div className={cx("h-[calc(100dvh-86px)] overflow-y-auto overscroll-contain transition-[padding] duration-200 [scrollbar-gutter:stable]", sidebarCollapsed ? "xl:pl-[72px]" : "xl:pl-[252px]")}>
      <header className="acw-apex-glass sticky top-0 z-30 border-b border-slate-200">
        <div className="flex min-h-[64px] items-center gap-3 px-3 lg:px-5">
          <button type="button" onClick={() => setMobileOpen(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 xl:hidden"><Menu className="h-4 w-4" /></button>
          <div className="flex min-w-0 shrink-0 items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white shadow-[0_8px_18px_rgba(7,20,38,.14)]"><ActiveMasterIcon className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[.15em] text-slate-400">Master {activeMaster.number} · Communications OS</p><p className="truncate text-[12px] font-black text-slate-950">{activeMaster.label}</p></div></div>

          <div className="hidden min-w-[360px] flex-1 2xl:block"><LiveSignalBroadcastBar data={data} activeWorkspace={activeMaster.label} /></div>

          <button type="button" onClick={() => setPaletteOpen(true)} className="hidden h-9 w-[min(24vw,330px)] shrink-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:bg-white md:flex"><Search className="h-3.5 w-3.5" /><span className="flex-1 truncate">Rechercher ou commander…</span><span className="acw-apex-command-key">⌘K</span></button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <div className="hidden 2xl:block"><HealthBadge good={Boolean(data?.health.openwaReachable)} goodLabel="OpenWA opérationnel" badLabel="OpenWA à vérifier" /></div>
            <button type="button" onClick={() => setPaletteOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 md:hidden"><Search className="h-4 w-4" /></button>
            <button type="button" onClick={() => setHelpOpen(true)} className="hidden h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 md:grid" title="Aide opérateur · ?"><CircleHelp className="h-4 w-4" /></button>
            <button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><Bell className="h-4 w-4" />{criticalCount ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-black text-white">{criticalCount > 9 ? "9+" : criticalCount}</span> : null}</button>
            <div className="relative hidden sm:block"><button type="button" onClick={() => setDensityOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" title="Densité d’affichage"><Settings2 className="h-4 w-4" /></button>{densityOpen ? <div data-apex-popover className="acw-apex-floating-surface absolute right-0 top-11 z-[70] w-52 rounded-xl border bg-white p-1.5"><p className="px-2 py-1.5 text-[10px] font-black uppercase tracking-[.13em] text-slate-500">Densité opérateur</p>{([ ["compact","Compact"], ["balanced","Équilibrée"], ["comfortable","Confort"] ] as const).map(([id,label]) => <button key={id} type="button" onClick={() => chooseDensity(id)} className={cx("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[10px] font-bold", density === id ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50")}>{label}{density === id ? <ShieldCheck className="h-3.5 w-3.5" /> : null}</button>)}</div> : null}</div>
            <Link href="/ac-whatsapp/accounts" className="hidden h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[9px] font-extrabold text-slate-700 hover:bg-slate-50 lg:flex"><Settings2 className="h-3.5 w-3.5" />Admin</Link>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-[9px] font-black text-white" title={`${data?.actor.name || "Utilisateur"} · ${data?.actor.role || "Accès protégé"}`}>{initials(data?.actor.name)}</div>
          </div>
        </div>
        <div className="flex h-8 items-center gap-2 border-t border-slate-100 px-3 lg:px-5"><div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto"><ContextChip label="Comptes" value={`${data?.counts.connectedAccounts || 0}/${data?.counts.accounts || 0}`} good={Boolean(data?.counts.connectedAccounts)} /><ContextChip label="Conversations" value={String(data?.counts.conversations || 0)} /><ContextChip label="Non lus" value={String(data?.counts.unread || 0)} attention={Boolean(data?.counts.unread)} /><ContextChip label="À assigner" value={String(data?.counts.unassigned || 0)} attention={Boolean(data?.counts.unassigned)} /><ContextChip label="Risques" value={String(data?.counts.securityOpen || 0)} danger={Boolean(data?.counts.securityOpen)} /></div><span className="hidden text-[10px] font-bold text-slate-400 lg:block">Synchronisation live · 15 s</span></div>
      </header>
      <main className={cx("mx-auto w-full", density === "compact" ? "p-3 lg:p-4" : density === "comfortable" ? "p-5 lg:p-7" : "p-4 lg:p-5")}>{children}</main>
    </div>

    {navChord ? <div className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white shadow-2xl">Navigation · appuyez sur L, O, C, T, A ou E</div> : null}

    {notificationsOpen ? <div data-apex-popover className="acw-apex-floating-surface fixed right-4 top-[154px] z-[75] w-[min(92vw,390px)] overflow-hidden rounded-[18px] border bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Centre d’attention</p><p className="mt-0.5 text-[14px] font-black text-slate-950">Signaux à contrôler</p></div><button type="button" onClick={() => setNotificationsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200"><X className="h-3.5 w-3.5" /></button></div><div className="max-h-[56vh] overflow-y-auto p-2">{securityEvents.length ? securityEvents.slice(0, 12).map((event: any, index) => <div key={event.id || index} className="acw-apex-row border-b border-slate-100 px-2 py-3 last:border-0"><div className="flex gap-3"><div className={cx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", ["critical", "high"].includes(String(event.severity)) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}><AlertTriangle className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-black text-slate-900">{event.title || event.event_type}</p><StatusPill status={event.severity || "warning"} compact /></div><p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-4 text-slate-500">{event.description || "Signal de sécurité ou de runtime enregistré."}</p><p className="mt-1.5 text-[10px] font-bold text-slate-400">{formatRelative(event.created_at)}</p></div></div></div>) : <div className="grid min-h-40 place-items-center text-center"><div><ShieldCheck className="mx-auto h-6 w-6 text-emerald-600" /><p className="mt-2 text-[11px] font-black text-slate-900">Aucun signal critique ouvert</p><p className="mt-1 text-[9px] font-semibold text-slate-500">La surveillance reste active.</p></div></div>}</div><Link href="/ac-whatsapp/executive" onClick={() => setNotificationsOpen(false)} className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[9px] font-black text-slate-700 hover:bg-slate-50">Ouvrir Executive Control<ChevronRight className="h-3.5 w-3.5" /></Link></div> : null}

    {paletteOpen ? <CommandPalette results={results} query={query} onQuery={setQuery} searchRef={searchRef} onClose={() => setPaletteOpen(false)} onNavigate={navigate} /> : null}
    {helpOpen ? <OperatorHelp onClose={() => setHelpOpen(false)} /> : null}
  </div>
}

function OperatorHelp({ onClose }: { onClose: () => void }) {
  const steps = [
    ["1", "Trouvez le bon dossier", "Utilisez ⌘K / Ctrl K, la recherche Live ou vos vues de file."],
    ["2", "Prenez la responsabilité", "Attribuez-vous la conversation ou transférez-la explicitement."],
    ["3", "Comprenez avant de répondre", "Lisez le dernier besoin, les engagements et le contexte relationnel."],
    ["4", "Répondez avec précision", "Rédigez librement ou tapez / pour insérer une réponse enregistrée."],
    ["5", "Ajoutez la bonne preuve", "Pièce jointe, vocal, note interne ou suivi restent dans le même fil."],
    ["6", "Contrôlez l’automatisation", "Prenez la main quand une réponse humaine doit primer."],
    ["7", "Décidez la prochaine action", "Suivi, transfert, escalade ou résolution doivent être explicites."],
    ["8", "Laissez une trace vraie", "Les statuts affichés décrivent le transport et l’action réellement confirmés."],
  ]
  const shortcuts = [["⌘K / Ctrl K", "Commande universelle"], ["G puis L/O/C/T/A/E", "Changer d’espace"], ["J / K", "Conversation suivante / précédente"], ["R", "Focus réponse"], ["A / F / E", "Attribuer / relance / commandes"], ["/", "Réponses enregistrées"], ["⌘↵ / Ctrl↵", "Envoyer"], ["?", "Aide opérateur"], ["Esc", "Fermer le contexte actif"]]
  return <div className="fixed inset-0 z-[115] flex justify-end bg-slate-950/30 backdrop-blur-[2px]"><button type="button" aria-label="Fermer l’aide" onClick={onClose} className="absolute inset-0" /><aside role="dialog" aria-modal="true" aria-label="Aide opérateur AC WhatsApp" className="acw-apex-floating-surface acw-apex-drawer relative h-full w-full max-w-[560px] overflow-y-auto border-l border-slate-200 bg-white"><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-rose-600">Activation opérateur · 5 minutes</p><h2 className="mt-1 text-[20px] font-black tracking-[-.035em] text-slate-950">Travailler vite, sans perdre le contrôle.</h2><p className="mt-1 max-w-md text-[10px] font-semibold leading-5 text-slate-500">Le produit privilégie la responsabilité, la vérité des statuts et la continuité du contexte.</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="p-5"><div className="space-y-1">{steps.map(([number,title,detail]) => <div key={number} className="acw-apex-row flex gap-3 rounded-xl border border-transparent px-2 py-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-950 text-[10px] font-black text-white">{number}</span><div><p className="text-[10px] font-black text-slate-950">{title}</p><p className="mt-0.5 text-[9px] font-semibold leading-4 text-slate-500">{detail}</p></div></div>)}</div><div className="mt-6 border-t border-slate-200 pt-5"><p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">Raccourcis de puissance</p><div className="mt-2 overflow-hidden rounded-xl border border-slate-200">{shortcuts.map(([keys,action]) => <div key={keys} className="flex items-center justify-between gap-4 border-b border-slate-100 px-3 py-2.5 last:border-0"><span className="acw-apex-command-key">{keys}</span><span className="text-right text-[9px] font-bold text-slate-600">{action}</span></div>)}</div></div><div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"><p className="text-[9px] font-black text-blue-950">Principe de confiance</p><p className="mt-1 text-[9px] font-semibold leading-4 text-blue-800">Stocké, en file, accepté, envoyé, livré et lu sont des états différents. AC WhatsApp ne doit jamais les confondre.</p></div></div></aside></div>
}

function CommandPalette({ results, query, onQuery, searchRef, onClose, onNavigate }: { results: SearchResult[]; query: string; onQuery: (value: string) => void; searchRef: React.RefObject<HTMLInputElement | null>; onClose: () => void; onNavigate: (href: string) => void }) {
  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => { setActiveIndex(0) }, [query, results.length])
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(results.length - 1, index + 1)); return }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)); return }
    if (event.key === "Enter" && results[activeIndex]) { event.preventDefault(); onNavigate(results[activeIndex].href) }
  }
  return <div className="fixed inset-0 z-[110] flex justify-center bg-slate-950/40 px-4 pt-[7vh] backdrop-blur-[3px]">
    <button type="button" className="absolute inset-0" aria-label="Fermer" onClick={onClose} />
    <div className="acw-apex-floating-surface relative h-fit max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-[20px] border bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Command className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Commande universelle</p><input ref={searchRef} value={query} onChange={(event) => onQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Conversation, message, fichier, réponse, contact, membre…" className="mt-0.5 w-full bg-transparent text-[15px] font-bold text-slate-950 outline-none placeholder:text-slate-300" /></div>
        <span className="acw-apex-command-key hidden sm:inline">ESC</span><button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 sm:hidden"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="max-h-[62vh] overflow-y-auto p-2">
        <div className="mb-1 flex items-center justify-between px-2 py-1.5"><p className="text-[10px] font-black uppercase tracking-[.13em] text-slate-400">{query ? "Résultats multi-source" : "Navigation & activité récente"}</p><span className="text-[10px] font-bold text-slate-400">{results.length} résultat(s)</span></div>
        {results.length ? results.map((result, index) => <button key={`${result.type}:${result.id}`} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => onNavigate(result.href)} className={cx("acw-apex-row group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left", index === activeIndex && "bg-slate-100")}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600">{result.type === "conversation" || result.type === "message" ? <MessageCircleMore className="h-4 w-4" /> : result.type === "contact" ? <ContactRound className="h-4 w-4" /> : result.type === "campaign" ? <BriefcaseBusiness className="h-4 w-4" /> : result.type === "account" ? <RadioTower className="h-4 w-4" /> : result.type === "team" ? <UsersRound className="h-4 w-4" /> : result.type === "response" ? <Sparkles className="h-4 w-4" /> : result.type === "file" ? <LayoutGrid className="h-4 w-4" /> : <Command className="h-4 w-4" />}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-slate-950">{result.title}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-slate-500">{result.subtitle || result.type}</p></div>
          {result.status ? <StatusPill status={result.status} compact /> : result.shortcut ? <span className="acw-apex-command-key">{result.shortcut}</span> : <ChevronRight className="h-4 w-4 text-slate-300" />}
        </button>) : <div className="grid min-h-36 place-items-center text-center"><div><Search className="mx-auto h-5 w-5 text-slate-300" /><p className="mt-2 text-[11px] font-black text-slate-700">Aucun résultat</p><p className="mt-1 text-[9px] font-semibold text-slate-500">Essayez un nom, numéro, message, fichier ou réponse.</p></div></div>}
      </div>
      <div className="flex items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-500"><span><b className="text-slate-700">↑↓</b> naviguer</span><span><b className="text-slate-700">↵</b> ouvrir</span><span><b className="text-slate-700">G + lettre</b> changer d’espace</span></div>
    </div>
  </div>
}

function Pulse({ label, value }: { label: string; value: number }) { return <div className="px-2 py-2 text-center"><p className="text-[13px] font-black leading-none text-slate-950 tabular-nums">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{label}</p></div> }
function ContextChip({ label, value, good = false, attention = false, danger = false }: { label: string; value: string; good?: boolean; attention?: boolean; danger?: boolean }) { return <span className={cx("inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold", danger ? "text-rose-700" : attention ? "text-amber-700" : good ? "text-emerald-700" : "text-slate-500")}><span className={cx("h-1.5 w-1.5 rounded-full", danger ? "bg-rose-500" : attention ? "bg-amber-500" : good ? "bg-emerald-500" : "bg-slate-300")} /><span>{label}</span><strong className="font-black tabular-nums">{value}</strong></span> }
