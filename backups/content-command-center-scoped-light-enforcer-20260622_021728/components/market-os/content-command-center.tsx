"use client"

import Link from "next/link"
import React, { useMemo, useState, type ReactNode, useEffect} from "react"
import {
  Bell,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Command,
  Download,
  Edit3,
  Eye,
  FileImage,
  FileText,
  PackageOpen,
  Flag,
  ScrollText,
  Box,
  IdCard,
  PanelTop,
  FolderKanban,
  Globe2,
  Grid3X3,
  ImageIcon,
  Layers3,
  LayoutTemplate,
  Link2,
  Mail,
  MessageSquareText,
  MessageCircle,
  MoreVertical,
  Palette,
  PanelRightOpen,
  Package,
  PenTool,
  Plus,
  Printer,
  Search,
  SendHorizonal,
  Save,
  ShieldCheck,
  Sparkles,
  Sparkle,
  Tags,
  TimerReset,
  Trash2,
  UploadCloud,
  Users,
  UserCheck,
  X,
  Video,
  Wand2,
  Radio,
  Radar,
  MonitorPlay,
  Route,
  LibraryBig,
  GraduationCap,
  BadgeCheck,
  Megaphone,
  ScanSearch,
  Workflow,
  SlidersHorizontal,
  List,
  Maximize2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react"

type Tone = "violet" | "blue" | "amber" | "emerald" | "rose" | "cyan" | "slate"

const categoryTabs = [
  { label: "All Content", icon: Grid3X3, href: "/market-os/content-command-center" },
  { label: "Digital", icon: Globe2, href: "/market-os/content-command-center/assets" },
  { label: "Print & Offline", icon: Printer, href: "/market-os/content-command-center/assets" },
  { label: "Corporate Docs", icon: FileText, href: "/market-os/content-command-center/briefs" },
  { label: "Templates", icon: ClipboardCheck, href: "/market-os/content-command-center/create" },
]

const sidebarLinks = [
  { label: "Contents management", href: "/market-os/content-command-center", icon: FolderKanban },
  { label: "Tasks", href: "/market-os/content-command-center/tasks", icon: CheckCircle2 },
  { label: "assets", href: "/market-os/content-command-center/assets", icon: ImageIcon },
  { label: "Callendar", href: "/market-os/content-command-center/calendar", icon: CalendarDays },
  { label: "Active assets", href: "/market-os/content-command-center/assets", icon: Boxes },
  { label: "briefings", href: "/market-os/content-command-center/briefs", icon: BookOpen },
  { label: "academie interne formation complète", href: "/market-os/content-command-center/academy", icon: Sparkles },
]

const metrics = [
  { label: "Total Assets", value: "3,247", trend: "↑ 18% vs last month", tone: "violet" as Tone, icon: FileText },
  { label: "Content Published", value: "1,089", trend: "↑ 24% vs last month", tone: "blue" as Tone, icon: UploadCloud },
  { label: "Assets in Review", value: "56", trend: "↓ 12% vs last month", tone: "amber" as Tone, icon: Clock3 },
  { label: "Approvals", value: "98%", trend: "↑ 6% vs last month", tone: "emerald" as Tone, icon: ShieldCheck },
  { label: "Content Utilization", value: "87%", trend: "High", tone: "emerald" as Tone, icon: Sparkles },
  { label: "Total Engagement", value: "2.4M", trend: "↑ 31% vs last month", tone: "rose" as Tone, icon: Users },
]

const contentTypes = [
  ["Brochures", "152", FileText, "violet"],
  ["Prospectus", "98", FileText, "emerald"],
  ["Presentations", "214", FileImage, "rose"],
  ["Case Studies", "126", ClipboardCheck, "violet"],
  ["One Pagers", "165", FileText, "emerald"],
  ["Flyers", "87", FileText, "blue"],
  ["Catalogs", "63", BookOpen, "amber"],
  ["Whitepapers", "74", FileText, "blue"],
  ["Videos", "132", Video, "rose"],
  ["Infographics", "93", ImageIcon, "violet"],
  ["Social Posts", "245", MessageSquareText, "amber"],
  ["Email Templates", "109", Mail, "blue"],
  ["Press Kits", "58", BriefcaseBusiness, "blue"],
  ["Roll-up Banners", "41", Palette, "violet"],
  ["Merch & Swag", "36", Boxes, "rose"],
] as const

const recentContent = [
  { title: "Angelcare Corporate Brochure 2025", type: "Brochure · Print & Offline", date: "May 15, 2025 · v2.0", status: "Approved", tone: "emerald" as Tone },
  { title: "STEM Program Prospectus — B2B", type: "Prospectus · Sales Enablement", date: "May 14, 2025 · v1.3", status: "Approved", tone: "emerald" as Tone },
  { title: "Education Solutions Presentation", type: "Presentation · Sales Enablement", date: "May 13, 2025 · v3.1", status: "In Review", tone: "amber" as Tone },
  { title: "Angelcare Brand Video 2025", type: "Video · Multimedia", date: "May 12, 2025 · v1.0", status: "Approved", tone: "emerald" as Tone },
  { title: "Exhibition Booth Design", type: "Event Asset · Events & Exhibitions", date: "May 11, 2025 · v2.2", status: "In Review", tone: "amber" as Tone },
]

const workflow = [
  { label: "IDEATION", value: "23", sub: "Ideas", tone: "violet" as Tone },
  { label: "CREATION", value: "12", sub: "In Progress", tone: "blue" as Tone },
  { label: "REVIEW", value: "8", sub: "In Review", tone: "rose" as Tone },
  { label: "APPROVAL", value: "6", sub: "Pending", tone: "amber" as Tone },
  { label: "PUBLISHED", value: "1,089", sub: "Published", tone: "emerald" as Tone },
]

const taskRows = [
  ["Review: STEM Prospectus v1.3", "Review", "Imane L.", "May 16, 2025", "Review"],
  ["Approve: Corporate Brochure v2.0", "Approval", "You", "May 17, 2025", "Approve"],
  ["Update: Brand Guidelines Document", "Update", "Omar K.", "May 18, 2025", "In Progress"],
]

const brandItems = [
  ["Logo Suite", "12 Assets", PenTool, "amber"],
  ["Color Palette", "8 Colors", Palette, "rose"],
  ["Typography", "6 Fonts", FileText, "slate"],
  ["Iconography", "120 Icons", Command, "slate"],
  ["Image Library", "2,453 Images", ImageIcon, "violet"],
  ["Brand Guidelines", "v2.1", FileText, "slate"],
] as const

const tags = [
  ["# stem", "156", "violet"],
  ["# education", "132", "emerald"],
  ["# brochure", "98", "rose"],
  ["# b2b", "87", "violet"],
  ["# b2c", "75", "blue"],
  ["# event", "63", "violet"],
  ["# morocco", "59", "rose"],
  ["# partnership", "48", "amber"],
] as const

const channels = [
  ["Website", "24 Assets", Globe2, "slate"],
  ["Email", "18 Assets", Mail, "violet"],
  ["LinkedIn", "32 Assets", BriefcaseBusiness, "blue"],
  ["Events", "15 Assets", CalendarDays, "rose"],
  ["Sales Portal", "27 Assets", FileImage, "amber"],
  ["Print", "14 Assets", Printer, "violet"],
] as const

const performanceBars = [12, 24, 41, 29, 34, 58, 70, 56, 44, 61, 39, 43, 69, 49, 58, 54]

function toneClasses(tone: Tone) {
  const map: Record<Tone, { bg: string; ring: string; text: string; glow: string; border: string }> = {
    violet: { bg: "bg-violet-50", ring: "from-violet-500 to-purple-500", text: "text-violet-700", glow: "shadow-violet-500/20", border: "border-violet-400/25" },
    blue: { bg: "bg-blue-500/15", ring: "from-blue-500 to-cyan-500", text: "text-blue-700", glow: "shadow-blue-500/20", border: "border-blue-400/25" },
    amber: { bg: "bg-amber-50", ring: "from-amber-400 to-orange-500", text: "text-amber-700", glow: "shadow-amber-500/20", border: "border-amber-400/25" },
    emerald: { bg: "bg-emerald-50", ring: "from-emerald-400 to-green-500", text: "text-emerald-700", glow: "shadow-emerald-500/20", border: "border-emerald-400/25" },
    rose: { bg: "bg-rose-50", ring: "from-rose-400 to-pink-500", text: "text-rose-700", glow: "shadow-rose-500/20", border: "border-rose-400/25" },
    cyan: { bg: "bg-cyan-50", ring: "from-cyan-400 to-blue-500", text: "text-cyan-700", glow: "shadow-cyan-500/20", border: "border-cyan-400/25" },
    slate: { bg: "bg-slate-500/15", ring: "from-slate-300 to-slate-500", text: "text-slate-700", glow: "shadow-slate-500/10", border: "border-slate-200" },
  }
  return map[tone]
}

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}

export default function ContentCommandCenter() {
  const [activeTab, setActiveTab] = useState("All Content")
  const [status, setStatus] = useState("All Status")
  const [sort, setSort] = useState("Latest First")
  const [actionMessage, setActionMessage] = useState("")
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [createContentType, setCreateContentType] = useState<string | null>(null)
  const [editingTemplatePayload, setEditingTemplatePayload] = useState<TemplateEditPayload | null>(null)
  const [productionWorkspaceStats, setProductionWorkspaceStats] = useState({
    assets: 0,
    templates: 0,
    documents: 0,
    tasks: 0,
    comments: 0,
    categories: 0,
    activity: 0,
    syncState: "loading" as "loading" | "live" | "offline",
  })

  async function loadProductionWorkspaceStats() {
    try {
      const [assetsRes, templatesRes, documentsRes, tasksRes, commentsRes, categoriesRes, activityRes] = await Promise.all([
        fetch("/api/market-os/content-command-center/assets", { cache: "no-store" }),
        fetch("/api/market-os/content-command-center/templates", { cache: "no-store" }),
        fetch("/api/market-os/content-command-center/documents", { cache: "no-store" }),
        fetch("/api/market-os/content-command-center/tasks", { cache: "no-store" }),
        fetch("/api/market-os/content-command-center/comments", { cache: "no-store" }),
        fetch("/api/market-os/content-command-center/categories", { cache: "no-store" }),
        fetch("/api/market-os/content-command-center/activity", { cache: "no-store" }),
      ])

      const [assets, templates, documents, tasks, comments, categories, activity] = await Promise.all([
        assetsRes.json().catch(() => ({})),
        templatesRes.json().catch(() => ({})),
        documentsRes.json().catch(() => ({})),
        tasksRes.json().catch(() => ({})),
        commentsRes.json().catch(() => ({})),
        categoriesRes.json().catch(() => ({})),
        activityRes.json().catch(() => ({})),
      ])

      setProductionWorkspaceStats({
        assets: Array.isArray(assets.assets) ? assets.assets.length : 0,
        templates: Array.isArray(templates.templates) ? templates.templates.length : 0,
        documents: Array.isArray(documents.documents) ? documents.documents.length : 0,
        tasks: Array.isArray(tasks.tasks) ? tasks.tasks.length : 0,
        comments: Array.isArray(comments.comments) ? comments.comments.length : 0,
        categories: Array.isArray(categories.categories) ? categories.categories.length : 0,
        activity: Array.isArray(activity.activity) ? activity.activity.length : 0,
        syncState: "live",
      })
    } catch {
      setProductionWorkspaceStats((current) => ({ ...current, syncState: "offline" }))
    }
  }

  useEffect(() => {
    loadProductionWorkspaceStats()
  }, [])

  function runCommand(label: string) {
    setActionMessage(`${label} command activated`)
    if (typeof window !== "undefined") {
      fetch("/api/market-os/content-command-center/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: "content-command-center",
          entity_id: activeTab,
          action: label,
          actor: "workspace-user",
          payload: { activeTab, timestamp: new Date().toISOString() },
        }),
      }).catch(() => undefined)
      window.setTimeout(() => setActionMessage(""), 2400)
    }
  }
  const selectedTab = useMemo(() => categoryTabs.find((tab) => tab.label === activeTab), [activeTab])

  return (
    <main data-content-command-exact="true" className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-content-command-exact] * { box-sizing: border-box; }
        [data-content-command-exact] {
          background:
            radial-gradient(circle at 18% 0%, rgba(88, 28, 135, .18), transparent 28%),
            radial-gradient(circle at 82% 12%, rgba(14, 165, 233, .12), transparent 30%),
            linear-gradient(180deg, #07111f 0%, #030b15 100%);
          color: #f8fafc !important;
        }
        [data-content-command-exact] h1,
        [data-content-command-exact] h2,
        [data-content-command-exact] h3,
        [data-content-command-exact] h4,
        [data-content-command-exact] strong,
        [data-content-command-exact] button,
        [data-content-command-exact] a {
          color: #ffffff !important;
        }
        [data-content-command-exact] p,
        [data-content-command-exact] span,
        [data-content-command-exact] div,
        [data-content-command-exact] label {
          opacity: 1 !important;
        }
        [data-content-command-exact] input,
        [data-content-command-exact] select,
        [data-content-command-exact] textarea,
        [data-content-command-exact] option {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background-color: #071426 !important;
          border-color: rgba(103, 232, 249, .28) !important;
        }
        [data-content-command-exact] input::placeholder,
        [data-content-command-exact] textarea::placeholder {
          color: rgba(255,255,255,.72) !important;
          -webkit-text-fill-color: rgba(255,255,255,.72) !important;
        }
        [data-content-command-exact] .soft-text {
          color: rgba(255,255,255,.82) !important;
        }
        [data-content-command-exact] .muted-text {
          color: rgba(255,255,255,.68) !important;
        }
        [data-content-command-exact] .ultra-card {
          background: linear-gradient(180deg, rgba(14,31,51,.98), rgba(8,20,34,.98)) !important;
          border-color: rgba(103,232,249,.18) !important;
          box-shadow: 0 20px 60px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.06) !important;
        }
      ` }} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_4%,rgba(124,58,237,.13),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(56,189,248,.10),transparent_30%),linear-gradient(180deg,rgba(2,6,23,.05),rgba(2,6,23,.45))]" />

      <div data-market-os-root className="relative flex min-h-screen">
        <aside className="hidden w-[286px] shrink-0 border-r border-cyan-400/10 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,.10)] xl:block">
          <Link href="/market-os/marketing-home" className="mb-6 flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-black tracking-[.18em]">MARKET OS</div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-700">Content Command</div>
            </div>
          </Link>

          <div className="mb-4 text-[11px] font-black uppercase tracking-[.18em] text-slate-800">Content workspace</div>
          <nav className="space-y-2">
            {sidebarLinks.map((item, index) => {
              const Icon = item.icon
              const active = index === 0
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition",
                    active
                      ? "border-violet-400/35 bg-violet-50 text-slate-950 shadow-[0_12px_36px_rgba(124,58,237,.22)]"
                      : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300/25 hover:bg-cyan-50 hover:text-slate-950",
                  )}
                >
                  <span className={cn("grid h-9 w-9 place-items-center rounded-xl", active ? "bg-violet-500" : "bg-white/5 group-hover:bg-cyan-50")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-5">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-50 p-4">
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Live command</div>
            <div className="mt-2 text-2xl font-black">98%</div>
            <div className="mt-1 text-xs font-bold text-slate-950/80">Approval engine readiness</div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-4 lg:p-6">
          <header className="mb-4 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-slate-950 md:text-[34px]">Content & Branding Management</h1>
              <p className="mt-1 text-sm font-bold text-slate-800">Create. Manage. Approve. Distribute. Measure.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-full min-w-[320px] flex-1 2xl:w-[470px] 2xl:flex-none">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-800" />
                <input className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-14 text-sm font-bold text-slate-950 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,.04)] placeholder:text-slate-400" placeholder="Search content, assets, tags..." />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white/5 px-2 py-1 text-xs font-black text-slate-950/74">⌘ K</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCreateMenuOpen((open) => !open)}
                  className="inline-flex h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 text-sm font-black shadow-[0_16px_42px_rgba(124,58,237,.28)] hover:from-violet-500 hover:to-purple-500 text-white"
                >
                  <Plus className="h-5 w-5" /> + Create New Content <ChevronDown className="h-4 w-4" />
                </button>

                {createMenuOpen && (
                  <div className="absolute right-0 top-16 z-[9999] w-[360px] overflow-hidden rounded-3xl border border-cyan-300/20 bg-white p-2 shadow-[0_22px_70px_rgba(15,23,42,.10)] backdrop-blur-xl">
                    <div className="px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-700">Create new content</div>
                      <div className="mt-1 text-xs font-bold text-slate-800">Choose a production family to launch its advanced AngelCare creation modal.</div>
                    </div>
                    {CREATE_CONTENT_TYPES.filter((item) =>
                      ["digital-content", "print-offline", "corporate-docs", "templates"].includes(item.id),
                    ).map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setEditingTemplatePayload(null)
                            setCreateContentType(item.id)
                            setCreateMenuOpen(false)
                          }}
                          className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-cyan-50"
                        >
                          <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br shadow-lg", toneClasses(item.tone).ring)}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-slate-950">{item.label}</span>
                            <span className="block truncate text-xs font-bold text-slate-950/68">{item.short}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-700" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button onClick={() => runCommand("Notifications")} className="relative grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white hover:border-cyan-300/30 hover:bg-cyan-50">
                <Bell className="h-5 w-5 text-slate-800" />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-black">12</span>
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-rose-400 text-sm font-black text-slate-950">SE</div>
                <div className="hidden sm:block">
                  <div className="text-sm font-black">Salma El Alami</div>
                  <div className="text-xs font-bold text-slate-950/74">Marketing Director</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-800" />
              </div>
            </div>
          </header>

          <nav className="mb-5 overflow-hidden rounded-2xl border border-cyan-300/10 bg-white p-2 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
            <div className="flex gap-2 overflow-x-auto">
              {categoryTabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.label
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={cn(
                      "group relative flex min-h-[58px] shrink-0 items-center gap-3 rounded-xl px-5 py-3 text-sm font-black transition duration-300",
                      active
                        ? "bg-gradient-to-r from-violet-600/25 via-fuchsia-500/12 to-cyan-500/10 text-violet-800 shadow-[0_0_32px_rgba(168,85,247,.18)] ring-1 ring-violet-400/30"
                        : "text-slate-950/84 hover:bg-white hover:text-slate-950",
                    )}
                  >
                    {active && <span className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 shadow-[0_0_18px_rgba(168,85,247,.75)]" />}
                    <span className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg border transition",
                      active ? "border-violet-200 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-800 group-hover:border-cyan-300/25 group-hover:text-cyan-800",
                    )}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {actionMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800 shadow-[0_0_34px_rgba(16,185,129,.16)]">
              {actionMessage}
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-50 px-5 py-4 text-xs font-black uppercase tracking-[.14em] text-cyan-800">
            <span>V67 Launch Safety Layer · V66 Storage Version Audit Layer · V65 Workflow Persistence Layer · V64 CRUD Persistence Layer · V63 Workspace Hydration Layer · Production API Trace Layer · {productionWorkspaceStats.syncState.toUpperCase()} · every workspace command is logged to activity API.</span>
            <button
              type="button"
              onClick={() => {
                loadProductionWorkspaceStats()
                runCommand("Production workspace stats refreshed")
              }}
              className="rounded-xl border border-cyan-300/20 bg-cyan-50 px-4 py-2 text-[10px] font-black text-cyan-800 hover:bg-cyan-50"
            >
              <RefreshCw className="mr-2 inline h-3 w-3" /> Refresh Sync
            </button>
          </div>

          {createContentType && (
            <AdvancedCreateContentModal
              contentType={createContentType}
              editPayload={editingTemplatePayload}
              onClose={() => {
                setCreateContentType(null)
                setEditingTemplatePayload(null)
              }}
              onSubmit={(title) => {
                setCreateContentType(null)
                setCreateMenuOpen(false)
                runCommand(editingTemplatePayload ? `${title} template changes saved live` : `${title} creation workflow launched`)
                setEditingTemplatePayload(null)
              }}
              onSaved={(payload) => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("angelcare-template-saved", { detail: payload }))
                }
              }}
            />
          )}

          <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              {
                label: "Live Assets",
                value: String(productionWorkspaceStats.assets),
                trend: productionWorkspaceStats.syncState === "live" ? "API synced" : "API offline",
                tone: productionWorkspaceStats.syncState === "live" ? "emerald" as Tone : "rose" as Tone,
                icon: Boxes,
              },
              {
                label: "Templates",
                value: String(productionWorkspaceStats.templates),
                trend: "production records",
                tone: "violet" as Tone,
                icon: LayoutTemplate,
              },
              {
                label: "Documents",
                value: String(productionWorkspaceStats.documents),
                trend: "corporate docs API",
                tone: "blue" as Tone,
                icon: FileText,
              },
              {
                label: "Tasks",
                value: String(productionWorkspaceStats.tasks),
                trend: "execution tasks",
                tone: "amber" as Tone,
                icon: CheckCircle2,
              },
              {
                label: "Comments",
                value: String(productionWorkspaceStats.comments),
                trend: "team coordination",
                tone: "cyan" as Tone,
                icon: MessageCircle,
              },
              {
                label: "Activity",
                value: String(productionWorkspaceStats.activity),
                trend: "command audit trail",
                tone: "emerald" as Tone,
                icon: Radio,
              },
            ].map((item) => <div key={`workspace-${item.label}`}><MetricCard {...item} /></div>)}
          </section>

          {activeTab === "Digital" && (
            <DigitalAssetWorkspace
              runCommand={runCommand}
              onCreateDigital={() => setCreateContentType("digital-content")}
            />
          )}

          {activeTab === "Print & Offline" && (
            <PrintOfflineWorkspace
              runCommand={runCommand}
              onCreatePrint={() => {
                setCreateContentType("print-offline")
              }}
            />
          )}

          {activeTab === "Corporate Docs" && (
            <CorporateDocsWorkspace
              runCommand={runCommand}
              onCreateDoc={() => {
                setCreateContentType("corporate-docs")
              }}
            />
          )}

          {activeTab === "Templates" && (
            <TemplatesManagementWorkspace
              runCommand={runCommand}
              onCreateTemplate={() => {
                setEditingTemplatePayload(null)
                setCreateContentType("templates")
              }}
              onCreateByFamily={(familyId) => {
                setEditingTemplatePayload(null)
                setCreateContentType(familyId)
              }}
              onEditTemplate={(template) => {
                setEditingTemplatePayload(template)
                setCreateContentType("templates")
              }}
            />
          )}

          {activeTab !== "Digital" && activeTab !== "Print & Offline" && activeTab !== "Corporate Docs" && activeTab !== "Templates" && (
            <div className="space-y-5">
          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(440px,.9fr)]">
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(360px,.95fr)_minmax(460px,1fr)]">
                <Panel title="CONTENT EXPLORER" action={<Link href="/market-os/content-command-center/assets">View All</Link>}>
                  <div className="mb-4 text-xs font-black uppercase tracking-[.14em] text-slate-800">Explore by content type</div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {contentTypes.map(([label, value, Icon, tone]) => (
                      <Link key={String(label)} href="/market-os/content-command-center/assets" className="group rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-slate-950 shadow-lg", toneClasses(tone as Tone).ring, toneClasses(tone as Tone).glow)}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-xs font-black text-slate-800">{label}</span>
                            <span className="block text-lg font-black">{value}</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                    <Link href="/market-os/content-command-center/create" className="grid min-h-[72px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white text-center text-xs font-black text-slate-800 hover:border-violet-400/40 hover:text-slate-950">
                      <Plus className="mb-1 h-5 w-5" /> Create Print & Offline Content Type
                    </Link>
                  </div>
                </Panel>

                <Panel
                  title="RECENT CONTENT"
                  action={
                    <div className="flex items-center gap-2">
                      <SelectPill value={status} setValue={setStatus} options={["All Status", "Approved", "In Review"]} />
                      <SelectPill value={sort} setValue={setSort} options={["Latest First", "Most Viewed"]} />
                    </div>
                  }
                >
                  <div className="space-y-3">
                    {recentContent.map((item, index) => (
                      <div key={item.title} className="grid grid-cols-[24px_86px_1fr_auto_34px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50">
                        <input type="checkbox" className="h-4 w-4 accent-violet-500" defaultChecked={index < 3} />
                        <div className="h-14 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-200 via-blue-100 to-slate-600">
                          <div className="grid h-full place-items-center text-[10px] font-black text-slate-800">PREVIEW</div>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black">{item.title}</div>
                          <div className="truncate text-xs font-bold text-slate-800">{item.type}</div>
                          <div className="truncate text-xs font-bold text-slate-950/84">{item.date}</div>
                        </div>
                        <span className={cn("rounded-lg px-3 py-2 text-xs font-black", item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-500/20 text-amber-700")}>{item.status}</span>
                        <button onClick={() => runCommand(`Asset actions: ${item.title}`)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white/[.05] hover:border-violet-300/40 hover:bg-violet-50"><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                <Panel title="CONTENT WORKFLOW">
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                    {workflow.map((step) => (
                      <Link key={step.label} href="/market-os/content-command-center/tasks" className={cn("rounded-2xl border p-4", toneClasses(step.tone).border, toneClasses(step.tone).bg)}>
                        <div className={cn("text-xs font-black", toneClasses(step.tone).text)}>{step.label}</div>
                        <div className="mt-2 text-2xl font-black">{step.value}</div>
                        <div className="text-xs font-bold text-slate-950/74">{step.sub}</div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="text-sm font-black">My Tasks</div>
                    {taskRows.map(([task, type, owner, date, action], index) => (
                      <div key={task} className="grid grid-cols-[24px_1fr_90px_90px_110px_90px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs">
                        <input type="checkbox" className="accent-violet-500" />
                        <span className="font-bold">{task}</span>
                        <span className="text-slate-800">{type}</span>
                        <span className="text-slate-950/80">{owner}</span>
                        <span className="text-slate-800">{date}</span>
                        <button onClick={() => runCommand(`${action}: ${task}`)} className={cn("rounded-lg px-3 py-1.5 font-black ring-1 ring-slate-200 hover:ring-cyan-300/35", index === 1 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : index === 2 ? "bg-blue-500/20 text-blue-800" : "bg-violet-50 text-violet-800")}>{action}</button>
                      </div>
                    ))}
                  </div>
                  <Link href="/market-os/content-command-center/tasks" className="mt-4 block text-center text-sm font-black text-violet-700">View All Tasks →</Link>
                </Panel>

                <Panel title="CONTENT LIFECYCLE">
                  <div className="grid items-center gap-5 md:grid-cols-[180px_1fr]">
                    <div className="grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#10b981_0_34%,#3b82f6_34%_48%,#f59e0b_48%_79%,#64748b_79%_100%)]">
                      <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
                        <div>
                          <div className="text-3xl font-black">3,247</div>
                          <div className="text-xs font-bold text-slate-950/74">Total Assets</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm font-bold text-slate-800">
                      <Legend color="bg-emerald-400" label="Published" value="1,089 (33%)" />
                      <Legend color="bg-blue-400" label="In Review" value="456 (14%)" />
                      <Legend color="bg-amber-400" label="Draft" value="1,012 (31%)" />
                      <Legend color="bg-slate-400" label="Archived" value="690 (21%)" />
                      <Legend color="bg-rose-400" label="Expired" value="0 (0%)" />
                    </div>
                  </div>
                  <Link href="/market-os/content-command-center/assets" className="mt-6 block text-center text-sm font-black text-violet-700">Manage Lifecycle →</Link>
                </Panel>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_.9fr_1.45fr]">
                <Panel title="BRAND CENTER" action={<Link href="/market-os/content-command-center/brand-governance">View All</Link>}>
                  <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                    {brandItems.map(([label, detail, Icon, tone]) => (
                      <Link key={String(label)} href="/market-os/content-command-center/brand-governance" className="rounded-2xl border border-slate-200 bg-white p-3 text-center hover:border-violet-400/35">
                        <Icon className={cn("mx-auto h-9 w-9", toneClasses(tone as Tone).text)} />
                        <div className="mt-3 text-xs font-black">{label}</div>
                        <div className="text-[11px] font-bold text-slate-800">{detail}</div>
                      </Link>
                    ))}
                  </div>
                </Panel>

                <Panel title="POPULAR TAGS" action={<Link href="/market-os/content-command-center/assets">View All</Link>}>
                  <div className="flex flex-wrap gap-3">
                    {tags.map(([label, value, tone]) => (
                      <button key={String(label)} onClick={() => runCommand(`Filter tag ${label}`)} className={cn("rounded-full px-4 py-2 text-sm font-black ring-1 ring-slate-200 hover:scale-[1.03] hover:ring-cyan-300/35", toneClasses(tone as Tone).bg, toneClasses(tone as Tone).text)}>
                        {label} × {value}
                      </button>
                    ))}
                  </div>
                </Panel>

                <Panel title="DISTRIBUTION CHANNELS">
                  <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
                    {channels.map(([label, detail, Icon, tone]) => (
                      <Link key={String(label)} href={selectedTab?.href || "/market-os/content-command-center"} className="rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-cyan-400/30">
                        <span className={cn("mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br", toneClasses(tone as Tone).ring)}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="mt-3 text-sm font-black">{label}</div>
                        <div className="text-xs font-bold text-slate-800">{detail}</div>
                      </Link>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr_1fr]">
            <Panel title="AI CONTENT COMMAND PIPELINE" action={<Link href="/market-os/content-command-center/tasks">Open pipeline</Link>}>
              <div className="grid gap-3">
                {([
                  ["Market signal intake", "Capture preschool, B2B, parent, event and academy content needs", "Live intake", Radio, "cyan"],
                  ["Brief generation", "Transform requests into structured brand-safe briefs", "12 active", Wand2, "violet"],
                  ["Production routing", "Assign design, copy, review, translation and print tasks", "8 routed", Route, "blue"],
                  ["Publishing control", "Approve, schedule, distribute and measure every asset", "98% ready", BadgeCheck, "emerald"],
                ] as const).map(([title, detail, stat, Icon, tone]) => (
                  <Link key={title as string} href="/market-os/content-command-center/tasks" className={cn("grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5", toneClasses(tone as Tone).border, "bg-white hover:bg-slate-50")}>
                    <span className={cn("grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br shadow-lg", toneClasses(tone as Tone).ring)}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{title}</span>
                      <span className="block text-xs font-bold text-slate-800">{detail}</span>
                    </span>
                    <span className={cn("rounded-xl px-3 py-2 text-xs font-black", toneClasses(tone as Tone).bg, toneClasses(tone as Tone).text)}>{stat}</span>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="ASSET READINESS CONTROL" action={<Link href="/market-os/content-command-center/assets">Open assets</Link>}>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Print-ready files", "426", "Brochures, flyers, rollups", Printer, "amber"],
                  ["Digital kits", "918", "Posts, reels, ads, email", MonitorPlay, "blue"],
                  ["Sales enablement", "284", "B2B decks and proof sheets", BriefcaseBusiness, "emerald"],
                  ["Internal academy", "73", "Formation guides and SOPs", GraduationCap, "violet"],
                ] as const).map(([label, value, detail, Icon, tone]) => (
                  <Link key={String(label)} href="/market-os/content-command-center/assets" className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-cyan-400/30 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <Icon className={cn("h-7 w-7", toneClasses(tone as Tone).text)} />
                      <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-black text-slate-800">SYNCED</span>
                    </div>
                    <div className="mt-4 text-3xl font-black">{value}</div>
                    <div className="text-sm font-black text-slate-800">{label}</div>
                    <div className="mt-1 text-xs font-bold text-slate-950/84">{detail}</div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-50 p-4">
                <div className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">Production readiness</div>
                <div className="mt-2 h-3 rounded-full bg-slate-200"><div className="h-full w-[87%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 shadow-[0_0_22px_rgba(45,212,191,.35)]" /></div>
                <div className="mt-2 text-sm font-black text-slate-800">87% of active assets are reusable, tagged and channel-ready.</div>
              </div>
            </Panel>

            <Panel title="CONTENT GOVERNANCE RADAR" action={<Link href="/market-os/content-command-center/briefs">Open briefings</Link>}>
              <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-5">
                <div className="mx-auto grid h-64 w-64 place-items-center rounded-full border border-cyan-300/20">
                  <div className="grid h-48 w-48 place-items-center rounded-full border border-violet-300/20">
                    <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-[0_0_44px_rgba(124,58,237,.3)]">
                      <div>
                        <div className="text-3xl font-black">92</div>
                        <div className="text-xs font-bold text-slate-800">Brand radar</div>
                      </div>
                    </div>
                  </div>
                </div>
                {[
                  ["Tone", "94%", "left-6 top-8"],
                  ["Visuals", "89%", "right-6 top-12"],
                  ["Legal", "98%", "left-10 bottom-12"],
                  ["Offer", "91%", "right-8 bottom-10"],
                ].map(([label, value, pos]) => (
                  <div key={String(label)} className={cn("absolute rounded-2xl border border-slate-200 bg-white/25 px-3 py-2 backdrop-blur", pos as string)}>
                    <div className="text-xs font-black">{label}</div>
                    <div className="text-sm font-black text-cyan-700">{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Panel title="CALENDAR & DISTRIBUTION CONTROL" action={<Link href="/market-os/content-command-center/calendar">Open calendar</Link>}>
              <div className="grid gap-3 md:grid-cols-4">
                {["Today", "This Week", "This Month", "Campaign Lock"].map((label, index) => (
                  <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-slate-800">{label}</div>
                    <div className="mt-2 text-2xl font-black">{[9, 36, 142, 18][index]}</div>
                    <div className="text-xs font-bold text-emerald-700">{["publishing slots", "active deadlines", "scheduled assets", "locked approvals"][index]}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["B2B kindergarten partnership brochure", "Print + sales portal", "May 17 · 09:30", "Approved"],
                  ["Flashcards WINWIN campaign carousel", "Instagram + LinkedIn", "May 18 · 12:00", "Scheduled"],
                  ["Academie interne module 01", "Internal training", "May 20 · 16:00", "Draft"],
                ].map(([title, channel, date, status]) => (
                  <div key={title} className="grid grid-cols-[1fr_160px_130px_105px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                    <div className="font-black">{title}</div>
                    <div className="text-xs font-bold text-slate-800">{channel}</div>
                    <div className="text-xs font-black text-cyan-700">{date}</div>
                    <div className={cn("rounded-lg px-3 py-2 text-center text-xs font-black", status === "Approved" ? "bg-emerald-50 text-emerald-700" : status === "Scheduled" ? "bg-blue-500/15 text-blue-700" : "bg-amber-50 text-amber-700")}>{status}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="ACADEMIE INTERNE · FORMATION COMPLÈTE" action={<Link href="/market-os/content-command-center/academy">Open academy</Link>}>
              <div className="grid gap-3 md:grid-cols-3">
                {([
                  ["Brand fundamentals", "9 lessons", "100%", BadgeCheck, "emerald"],
                  ["Content production SOP", "14 lessons", "72%", Workflow, "violet"],
                  ["B2B brochure execution", "7 lessons", "61%", LibraryBig, "blue"],
                ] as const).map(([title, detail, progress, Icon, tone]) => (
                  <Link key={title as string} href="/market-os/content-command-center/academy" className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-violet-400/30">
                    <Icon className={cn("h-8 w-8", toneClasses(tone as Tone).text)} />
                    <div className="mt-4 text-sm font-black">{title}</div>
                    <div className="text-xs font-bold text-slate-800">{detail}</div>
                    <div className="mt-4 h-2 rounded-full bg-slate-200"><div className={cn("h-full rounded-full bg-gradient-to-r", toneClasses(tone as Tone).ring)} style={{ width: progress as string }} /></div>
                    <div className="mt-2 text-xs font-black text-slate-950/80">{progress} complete</div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-50 p-4">
                <div className="text-sm font-black text-cyan-800">Training objective</div>
                <p className="mt-1 text-sm font-bold text-slate-950/80">Standardize every AngelCare content operator on brand governance, B2B/B2C asset creation, approval control, publishing cadence and performance interpretation.</p>
              </div>
            </Panel>
          </section>
          </section>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}


type TemplateEditPayload = {
  id: string
  name: string
  familyId: string
  family: string
  category: string
  subcategory: string
  output: string
  channel: string
  owner: string
  status: string
  modalScope?: string
  rules?: string[]
  matchedParams?: string[]
}

type TemplateRecord = {
  id: string
  name: string
  family: "Digital content" | "Print & Offline Content" | "Corporate Docs" | "Templates"
  familyId: string
  category: string
  subcategory: string
  modalScope: string
  output: string
  channel: string
  owner: string
  status: "Approved" | "Draft" | "In Review" | "Locked"
  usage: number
  readiness: number
  lastUpdated: string
  tone: Tone
  icon: any
  rules: string[]
  matchedParams: string[]
}

function TemplatesManagementWorkspace({
  runCommand,
  onCreateTemplate,
  onCreateByFamily,
  onEditTemplate,
}: {
  runCommand: (label: string) => void
  onCreateTemplate: () => void
  onCreateByFamily: (familyId: string) => void
  onEditTemplate: (template: TemplateEditPayload) => void
}) {
  const [query, setQuery] = useState("")
  const [family, setFamily] = useState("All Families")
  const [templateCategory, setTemplateCategory] = useState("All Categories")
  const [templateSubcategory, setTemplateSubcategory] = useState("All Subcategories")
  const [status, setStatus] = useState("All Status")
  const [output, setOutput] = useState("All Outputs")
  const [selectedTemplateId, setSelectedTemplateId] = useState("digital-social-post-master")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [templatePreviewTab, setTemplatePreviewTab] = useState("Rules")

  const masterFamilies = [
    {
      id: "digital-content",
      label: "Digital content",
      description: "Digital creation modal ecosystem: primary output, AngelCare service/product, channel, audience, objective, brief, tasks and comments.",
      icon: MonitorPlay,
      tone: "blue" as Tone,
      outputs: ["Photos produits ou service", "Publication Reel", "publication story", "publication image", "publication vidéo", "vidéos ads promototionnel"],
      subcategories: [
        "A.A ANGELCARE ACADEMY",
        "S.L ANIMATION LUDIQUE MONTESSORI À DOMICILE",
        "H.S GARDE ACCOMPAGENEMENT ENFANTS À DOMICILE",
        "P.P ACCOMPAGNEMENT POST PARTUM",
        "S.K GARDE ACCOMPAGNEMENT ENFANT SPEÉCIALE",
        "K.E EVENEMENT POUR ENFANT",
        "F.C PROGRAME FLASHCARTES",
      ],
      rules: ["Primary output required", "Related service/product required", "Channel required", "Audience + objective required", "Approval before publish"],
    },
    {
      id: "print-offline",
      label: "Print & Offline Content",
      description: "Print/offline modal ecosystem: output, purpose, format, size, quantity, finishing, delivery/distribution and approval status.",
      icon: Printer,
      tone: "amber" as Tone,
      outputs: ["Brochure", "Catalog", "Flyer", "Prospectus", "Business Card", "Poster", "Packaging", "Stationery", "Report", "Rollup", "Direct Mailer", "Packaging Insert"],
      subcategories: ["Corporate", "Marketing", "Product", "Sales", "HR & Internal", "Events", "Clients", "Partnerships"],
      rules: ["Purpose required", "Format required", "Size required", "Print quantity required", "Distribution owner required"],
    },
    {
      id: "corporate-docs",
      label: "Corporate Docs",
      description: "Corporate document modal ecosystem: category, subcategory, type, owner, version, status, confidentiality and approval flow.",
      icon: FileText,
      tone: "slate" as Tone,
      outputs: ["Policy", "SOP", "Executive memo", "Company profile", "Governance document", "Guide", "Agreement", "Form", "Presentation"],
      subcategories: [
        "Governance & Policies",
        "Human Resources",
        "Operations",
        "Finance & Legal",
        "Quality & Compliance",
        "IT & Security",
        "Marketing & Brand",
        "Sales & Commercial",
        "Products & Services",
        "Training & Development",
        "Facilities & Maintenance",
      ],
      rules: ["Owner required", "Version required", "Confidentiality required", "Approval flow required", "Review date required"],
    },
    {
      id: "templates",
      label: "Templates",
      description: "Template system modal ecosystem: reusable brief, layout, report, email, print and workflow frameworks governed by usage rules.",
      icon: LayoutTemplate,
      tone: "violet" as Tone,
      outputs: ["Brief template", "Design template", "Email template", "Report template", "Print layout", "Workflow template", "Checklist template", "Approval template"],
      subcategories: ["Briefing", "Design system", "Reporting", "Email", "Print layout", "Workflow", "Governance", "Automation"],
      rules: ["Template type required", "Usage rules required", "Owner required", "Version required", "Lifecycle status required"],
    },
  ]

  const templateFamilyOptions = ["All Families", ...masterFamilies.map((item) => item.label)]
  const templateCategoryOptions = ["All Categories", ...Array.from(new Set(masterFamilies.flatMap((item) => item.outputs)))]
  const templateSubcategoryOptions = ["All Subcategories", ...Array.from(new Set(masterFamilies.flatMap((item) => item.subcategories)))]
  const baseTemplates: TemplateRecord[] = [
    {
      id: "digital-photos-academy-master",
      name: "Photos produits ou service · Academy Master",
      family: "Digital content",
      familyId: "digital-content",
      category: "Photos produits ou service",
      subcategory: "A.A ANGELCARE ACADEMY",
      modalScope: "Digital Create Modal",
      output: "Photos produits ou service",
      channel: "Instagram / Website / Ads",
      owner: "Salma E.",
      status: "Approved",
      usage: 248,
      readiness: 96,
      lastUpdated: "May 14, 2025",
      tone: "blue",
      icon: MonitorPlay,
      rules: ["Primary output", "Related service/product", "Audience", "Objective", "Caption", "CTA", "Publishing channel"],
      matchedParams: ["primaryOutput", "relatedServiceProduct", "channel", "audience", "objective", "brief", "tasks", "comments"],
    },
    {
      id: "digital-reel-montessori-master",
      name: "Publication Reel · Montessori Home Service",
      family: "Digital content",
      familyId: "digital-content",
      category: "Publication Reel",
      subcategory: "S.L ANIMATION LUDIQUE MONTESSORI À DOMICILE",
      modalScope: "Digital Create Modal",
      output: "Publication Reel",
      channel: "Instagram / TikTok / Facebook",
      owner: "Imane L.",
      status: "In Review",
      usage: 132,
      readiness: 84,
      lastUpdated: "May 13, 2025",
      tone: "blue",
      icon: Video,
      rules: ["Hook", "Script", "Shot list", "Service", "Approval", "Export ratio"],
      matchedParams: ["primaryOutput", "relatedServiceProduct", "channel", "creativeScenario", "deliverables", "approval"],
    },
    {
      id: "digital-story-flashcards-master",
      name: "Publication Story · Flashcartes WINWIN",
      family: "Digital content",
      familyId: "digital-content",
      category: "publication story",
      subcategory: "F.C PROGRAME FLASHCARTES",
      modalScope: "Digital Create Modal",
      output: "publication story",
      channel: "Instagram / WhatsApp",
      owner: "Salma E.",
      status: "Approved",
      usage: 174,
      readiness: 93,
      lastUpdated: "May 12, 2025",
      tone: "blue",
      icon: MessageCircle,
      rules: ["Story sequence", "Offer CTA", "Service/product", "Audience", "Link sticker", "Approval"],
      matchedParams: ["primaryOutput", "relatedServiceProduct", "channel", "audience", "objective", "CTA"],
    },
    {
      id: "print-brochure-corporate-master",
      name: "Brochure · Corporate B2B Master",
      family: "Print & Offline Content",
      familyId: "print-offline",
      category: "Brochure",
      subcategory: "Corporate",
      modalScope: "Print & Offline Create Modal",
      output: "Brochure",
      channel: "Print Shop / Sales Handout",
      owner: "Youssef B.",
      status: "Approved",
      usage: 96,
      readiness: 92,
      lastUpdated: "May 12, 2025",
      tone: "amber",
      icon: Printer,
      rules: ["Purpose", "A4/A5 size", "Print quantity", "Paper stock", "Finishing", "Distribution"],
      matchedParams: ["output", "purpose", "format", "size", "quantity", "deliveryMode", "status"],
    },
    {
      id: "print-prospectus-partnership-master",
      name: "Prospectus · Partnership Development",
      family: "Print & Offline Content",
      familyId: "print-offline",
      category: "Prospectus",
      subcategory: "Partnerships",
      modalScope: "Print & Offline Create Modal",
      output: "Prospectus",
      channel: "PDF Export / B2B Meeting",
      owner: "Omar K.",
      status: "Locked",
      usage: 74,
      readiness: 98,
      lastUpdated: "May 11, 2025",
      tone: "amber",
      icon: BookOpen,
      rules: ["Offer blocks", "Proof section", "Pricing insert", "Signature page", "Version lock"],
      matchedParams: ["output", "purpose", "format", "size", "distribution", "approvalStatus"],
    },
    {
      id: "print-flyer-events-master",
      name: "Flyer · Events Activation",
      family: "Print & Offline Content",
      familyId: "print-offline",
      category: "Flyer",
      subcategory: "Events",
      modalScope: "Print & Offline Create Modal",
      output: "Flyer",
      channel: "Print Shop / Event Distribution",
      owner: "Imane L.",
      status: "Draft",
      usage: 88,
      readiness: 76,
      lastUpdated: "May 9, 2025",
      tone: "amber",
      icon: Megaphone,
      rules: ["Event date", "Location", "Offer", "Format", "Print quantity", "Distribution route"],
      matchedParams: ["output", "purpose", "format", "size", "deliveryMode", "eventContext"],
    },
    {
      id: "docs-policy-hr-master",
      name: "Policy · Human Resources Control",
      family: "Corporate Docs",
      familyId: "corporate-docs",
      category: "Policy",
      subcategory: "Human Resources",
      modalScope: "Corporate Docs Create Modal",
      output: "Policy",
      channel: "Internal Workspace / PDF Export",
      owner: "Hind E.",
      status: "Approved",
      usage: 118,
      readiness: 94,
      lastUpdated: "May 10, 2025",
      tone: "slate",
      icon: ShieldCheck,
      rules: ["Owner", "Version", "Approval matrix", "Confidentiality", "Review date"],
      matchedParams: ["category", "subcategory", "documentType", "version", "owner", "approvalFlow", "confidentiality"],
    },
    {
      id: "docs-sop-operations-master",
      name: "SOP · Operations Execution",
      family: "Corporate Docs",
      familyId: "corporate-docs",
      category: "SOP",
      subcategory: "Operations",
      modalScope: "Corporate Docs Create Modal",
      output: "SOP",
      channel: "Internal Workspace",
      owner: "Imane L.",
      status: "Draft",
      usage: 61,
      readiness: 71,
      lastUpdated: "May 4, 2025",
      tone: "slate",
      icon: ClipboardCheck,
      rules: ["Process owner", "Steps", "Risk controls", "Dependencies", "Approval"],
      matchedParams: ["category", "subcategory", "documentType", "owner", "version", "relations", "reviewStatus"],
    },
    {
      id: "docs-report-finance-master",
      name: "Report · Finance & Legal",
      family: "Corporate Docs",
      familyId: "corporate-docs",
      category: "Report template",
      subcategory: "Finance & Legal",
      modalScope: "Corporate Docs Create Modal",
      output: "Report template",
      channel: "Leadership Review / PDF Export",
      owner: "Youssef B.",
      status: "In Review",
      usage: 48,
      readiness: 82,
      lastUpdated: "May 8, 2025",
      tone: "slate",
      icon: ScrollText,
      rules: ["Executive summary", "KPI table", "Risks", "Actions", "Decision points"],
      matchedParams: ["category", "subcategory", "documentType", "version", "approvalFlow", "relatedDocuments"],
    },
    {
      id: "template-brief-master",
      name: "Brief Template · Master Content Workflow",
      family: "Templates",
      familyId: "templates",
      category: "Brief template",
      subcategory: "Briefing",
      modalScope: "Templates Create Modal",
      output: "Brief template",
      channel: "Content Library",
      owner: "Salma E.",
      status: "Approved",
      usage: 322,
      readiness: 99,
      lastUpdated: "May 15, 2025",
      tone: "violet",
      icon: LayoutTemplate,
      rules: ["Purpose", "Scenario", "Audience", "Deliverables", "Tasks", "Comments"],
      matchedParams: ["templateType", "usageRules", "owner", "version", "lifecycle", "tasks", "comments"],
    },
    {
      id: "template-design-system-master",
      name: "Design Template · Brand System",
      family: "Templates",
      familyId: "templates",
      category: "Design template",
      subcategory: "Design system",
      modalScope: "Templates Create Modal",
      output: "Design template",
      channel: "Design System",
      owner: "Salma E.",
      status: "Locked",
      usage: 207,
      readiness: 97,
      lastUpdated: "May 13, 2025",
      tone: "violet",
      icon: Palette,
      rules: ["Brand palette", "Typography", "Logo safe zone", "Spacing", "Export presets"],
      matchedParams: ["templateType", "brandRules", "usageRules", "owner", "version", "approval"],
    },
    {
      id: "template-workflow-approval-master",
      name: "Workflow Template · Approval Automation",
      family: "Templates",
      familyId: "templates",
      category: "Workflow template",
      subcategory: "Automation",
      modalScope: "Templates Create Modal",
      output: "Workflow template",
      channel: "Content Library / Automation",
      owner: "Omar K.",
      status: "In Review",
      usage: 54,
      readiness: 86,
      lastUpdated: "May 7, 2025",
      tone: "violet",
      icon: Workflow,
      rules: ["Trigger", "Task route", "Reviewer", "SLA", "Completion signal"],
      matchedParams: ["templateType", "workflowRules", "owner", "version", "automation", "approvalFlow"],
    },
  ]

  const [templates, setTemplates] = useState<TemplateRecord[]>(baseTemplates)
  const [templateSyncStatus, setTemplateSyncStatus] = useState<"loading" | "live" | "offline" | "saving">("loading")

  async function loadTemplatesFromProduction() {
    try {
      setTemplateSyncStatus("loading")
      const response = await fetch("/api/market-os/content-command-center/templates", { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to load templates")
      const payload = await response.json()
      const records = Array.isArray(payload?.templates) ? payload.templates : []
      setTemplates(records.length ? records : baseTemplates)
      setTemplateSyncStatus("live")
    } catch {
      setTemplates(baseTemplates)
      setTemplateSyncStatus("offline")
      runCommand("Template production sync unavailable — using protected seed fallback")
    }
  }

  async function persistTemplateToProduction(template: TemplateRecord) {
    setTemplateSyncStatus("saving")
    const response = await fetch("/api/market-os/content-command-center/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    })
    if (!response.ok) throw new Error("Template save failed")
    setTemplateSyncStatus("live")
  }

  async function deleteTemplateFromProduction(templateId: string) {
    setTemplateSyncStatus("saving")
    const response = await fetch(`/api/market-os/content-command-center/templates/${templateId}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Template delete failed")
    setTemplateSyncStatus("live")
  }

  useEffect(() => {
    loadTemplatesFromProduction()
  }, [])

  useEffect(() => {
    function handleSaved(event: Event) {
      const payload = (event as CustomEvent<TemplateEditPayload>).detail
      if (!payload?.id) return
      const incomingTemplate: TemplateRecord = {
        id: payload.id,
        name: payload.name,
        family: payload.family as TemplateRecord["family"],
        familyId: payload.familyId,
        category: payload.category,
        subcategory: payload.subcategory,
        modalScope: payload.modalScope || `${payload.family} Create Modal`,
        output: payload.output,
        channel: payload.channel,
        owner: payload.owner,
        status: payload.status as TemplateRecord["status"],
        usage: 0,
        readiness: 72,
        lastUpdated: "Just now",
        tone: payload.family === "Digital content" ? "blue" : payload.family === "Print & Offline Content" ? "amber" : payload.family === "Corporate Docs" ? "slate" : "violet",
        icon: payload.family === "Digital content" ? MonitorPlay : payload.family === "Print & Offline Content" ? Printer : payload.family === "Corporate Docs" ? FileText : LayoutTemplate,
        rules: payload.rules || [],
        matchedParams: payload.matchedParams || [],
      }

      setTemplates((current) => {
        const exists = current.some((item) => item.id === payload.id)
        return exists
          ? current.map((item) =>
              item.id === payload.id
                ? { ...item, ...incomingTemplate, usage: item.usage, readiness: Math.min(100, item.readiness + 2) }
                : item,
            )
          : [incomingTemplate, ...current]
      })
      persistTemplateToProduction(incomingTemplate).catch(() => {
        setTemplateSyncStatus("offline")
        runCommand("Template saved locally but production API failed")
      })
      setSelectedTemplateId(payload.id)
    }

    window.addEventListener("angelcare-template-saved", handleSaved)
    return () => window.removeEventListener("angelcare-template-saved", handleSaved)
  }, [])

  function deleteTemplate(template: TemplateRecord) {
    setTemplates((current) => {
      const next = current.filter((item) => item.id !== template.id)
      if (selectedTemplateId === template.id) {
        setSelectedTemplateId(next[0]?.id || baseTemplates[0]?.id || "")
      }
      return next
    })
    deleteTemplateFromProduction(template.id).catch(() => {
      setTemplateSyncStatus("offline")
      runCommand("Template deleted locally but production API failed")
    })
    runCommand(`Template deleted live: ${template.name}`)
  }

  function resetTemplateWorkspace() {
    setTemplates(baseTemplates)
    setSelectedTemplateId(baseTemplates[0]?.id || "")
    setQuery("")
    setFamily("All Families")
    setTemplateCategory("All Categories")
    setTemplateSubcategory("All Subcategories")
    setStatus("All Status")
    setOutput("All Outputs")
    setTemplatePreviewTab("Rules")
    fetch("/api/market-os/content-command-center/templates/reset", { method: "POST" })
      .then(() => loadTemplatesFromProduction())
      .catch(() => runCommand("Template reset could not reach production API"))
    runCommand("Template workspace reset to production seed")
  }

  function editTemplate(template: TemplateRecord) {
    onEditTemplate({
      id: template.id,
      name: template.name,
      familyId: "templates",
      family: template.family,
      category: template.category,
      subcategory: template.subcategory,
      output: template.output,
      channel: template.channel,
      owner: template.owner,
      status: template.status,
      modalScope: template.modalScope,
      rules: template.rules,
      matchedParams: template.matchedParams,
    })
  }

  const filteredTemplates = templates.filter((template) => {
    const q = query.trim().toLowerCase()
    return (
      (family === "All Families" || template.family === family) &&
      (templateCategory === "All Categories" || template.category === templateCategory) &&
      (templateSubcategory === "All Subcategories" || template.subcategory === templateSubcategory) &&
      (status === "All Status" || template.status === status) &&
      (output === "All Outputs" || template.output === output) &&
      (q === "" ||
        [template.name, template.family, template.category, template.subcategory, template.modalScope, template.output, template.channel, template.owner, template.rules.join(" "), template.matchedParams.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q))
    )
  })

  const selectedTemplate = filteredTemplates.find((template) => template.id === selectedTemplateId) || filteredTemplates[0] || templates[0] || baseTemplates[0]
  const allOutputs = Array.from(new Set(templates.map((template) => template.output)))

  const SelectedTemplateIcon = selectedTemplate.icon
  const templateExecutionTabs = [
    { label: "Rules", icon: ShieldCheck },
    { label: "Fields", icon: LayoutTemplate },
    { label: "Activity", icon: Clock3 },
    { label: "Versions", icon: Layers3 },
    { label: "Approval", icon: BadgeCheck },
    { label: "Distribution", icon: SendHorizonal },
    { label: "Automation", icon: Wand2 },
    { label: "Risks", icon: Radar },
    { label: "Performance", icon: Sparkles },
    { label: "Governance", icon: ClipboardCheck },
  ]

  function renderTemplateExecutionLayer() {
    if (templatePreviewTab === "Rules") {
      return (
        <div className="space-y-2">
          {selectedTemplate.rules.map((rule) => (
            <div key={rule} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm font-black text-slate-950">{rule}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
          ))}
          
                    <div className="mt-5 rounded-[28px] border border-fuchsia-300/20 bg-fuchsia-500/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.18em] text-fuchsia-200">
                  Template Ecosystem Mapping
                </div>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  Fully Synced Content Intelligence Layer
                </h3>
                <p className="mt-2 max-w-3xl text-sm font-bold text-slate-800">
                  This preview is synced to the selected template and reflects its family, master category,
                  subcategory, modal scope, parameters and execution binding.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-50 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">
                  Sync State
                </div>
                <div className="mt-1 text-lg font-black text-slate-950">
                  LIVE CONNECTED
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Content family", selectedTemplate.family],
                ["Master category / output", selectedTemplate.category],
                ["Subcategory / service", selectedTemplate.subcategory],
                ["Lifecycle status", selectedTemplate.status],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">{label}</div>
                  <div className="mt-2 text-sm font-black text-slate-950">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700">
                  Related AngelCare offers
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "AngelCare Academy",
                    "Montessori",
                    "Home Care",
                    "Postpartum",
                    "Special Needs",
                    "Events",
                    "Flashcards",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cyan-300/20 bg-cyan-50 px-3 py-1 text-[10px] font-black text-cyan-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-300/15 bg-violet-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-violet-700">
                  Required modal parameters
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTemplate.matchedParams.map((param) => (
                    <span
                      key={param}
                      className="rounded-full border border-violet-300/20 bg-violet-50 px-3 py-1 text-[10px] font-black text-violet-800"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/15 bg-amber-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-amber-700">
                  Execution binding
                </div>

                <div className="mt-3 space-y-2 text-xs font-bold text-slate-800">
                  <div>• Connected to creation modal</div>
                  <div>• Connected to approval workflow</div>
                  <div>• Connected to distribution plan</div>
                  <div>• Connected to tasks & comments</div>
                  <div>• Connected to content library</div>
                  <div>• Connected to version governance</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-50 p-4">
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700">Synced modal parameters</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTemplate.matchedParams.map((param) => (
                <span key={param} className="rounded-full border border-cyan-300/20 bg-cyan-50 px-3 py-1 text-[10px] font-black text-cyan-800">{param}</span>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (templatePreviewTab === "Fields") {
      return (
        <div className="grid gap-3">
          {[
            ["Template family", selectedTemplate.family],
            ["Modal scope", selectedTemplate.modalScope],
            ["Master category", selectedTemplate.category],
            ["Subcategory / service", selectedTemplate.subcategory],
            ["Primary output", selectedTemplate.output],
            ["Channel / destination", selectedTemplate.channel],
            ["Owner", selectedTemplate.owner],
            ["Last updated", selectedTemplate.lastUpdated],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[145px_1fr] gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
              <span className="text-slate-950/58">{label}</span>
              <span className="text-slate-950">{value}</span>
            </div>
          ))}
        </div>
      )
    }

    if (templatePreviewTab === "Activity") {
      return (
        <div className="space-y-3">
          {[
            ["Template opened", "Salma E.", "Just now", "cyan"],
            ["Rules checked", "Governance engine", "12 min ago", "emerald"],
            ["Version compared", "Imane L.", "Today 10:20", "violet"],
            ["Production used", "Marketing team", "Yesterday", "amber"],
          ].map(([title, actor, time, tone]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-950">{title}</div>
                <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase", toneClasses(tone as Tone).bg, toneClasses(tone as Tone).text)}>{time}</span>
              </div>
              <div className="mt-1 text-xs font-bold text-slate-950/62">{actor}</div>
            </div>
          ))}
        </div>
      )
    }

    if (templatePreviewTab === "Versions") {
      return (
        <div className="grid gap-3">
          {["v3.2 Current", "v3.1 Approved", "v2.9 Archived"].map((version, index) => (
            <button key={version} type="button" onClick={() => runCommand(`Template version selected: ${version}`)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
              <span>
                <span className="block text-sm font-black text-slate-950">{version}</span>
                <span className="block text-xs font-bold text-slate-700">{index === 0 ? "Production master" : "Previous controlled version"}</span>
              </span>
              <span className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-800">{index === 0 ? "Active" : "Compare"}</span>
            </button>
          ))}
        </div>
      )
    }

    if (templatePreviewTab === "Approval") {
      return (
        <div className="space-y-3">
          {[
            ["Brand approval", "Approved", "emerald"],
            ["Legal/compliance check", selectedTemplate.family === "Corporate Docs" ? "Required" : "Optional", "amber"],
            ["Publishing lock", selectedTemplate.status === "Locked" ? "Locked" : "Open", "violet"],
          ].map(([step, state, tone]) => (
            <div key={step} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm font-black text-slate-950">{step}</span>
              <span className={cn("rounded-xl px-3 py-2 text-xs font-black", toneClasses(tone as Tone).bg, toneClasses(tone as Tone).text)}>{state}</span>
            </div>
          ))}
          <button type="button" onClick={() => runCommand(`Approval workflow opened: ${selectedTemplate.name}`)} className="w-full rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800">Open approval workflow</button>
        </div>
      )
    }

    if (templatePreviewTab === "Distribution") {
      return (
        <div className="space-y-3">
          {selectedTemplate.channel.split("/").map((channel) => (
            <div key={channel.trim()} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm font-black text-slate-950">{channel.trim()}</span>
              <SendHorizonal className="h-4 w-4 text-cyan-700" />
            </div>
          ))}
          <button type="button" onClick={() => runCommand(`Distribution map opened: ${selectedTemplate.name}`)} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-50 px-5 py-4 text-sm font-black text-cyan-800">Open distribution map</button>
        </div>
      )
    }

    if (templatePreviewTab === "Automation") {
      return (
        <div className="grid gap-3">
          {[
            ["Auto-brief creation", "Generate brief from selected template"],
            ["Auto-task routing", "Create production, review and approval tasks"],
            ["Auto-version lock", "Freeze approved master after validation"],
          ].map(([title, detail]) => (
            <button key={title} type="button" onClick={() => runCommand(`${title}: ${selectedTemplate.name}`)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300/30">
              <div className="text-sm font-black text-slate-950">{title}</div>
              <div className="mt-1 text-xs font-bold text-slate-950/62">{detail}</div>
            </button>
          ))}
        </div>
      )
    }

    if (templatePreviewTab === "Risks") {
      return (
        <div className="space-y-3">
          {[
            ["Missing field risk", selectedTemplate.readiness < 85 ? "Medium" : "Low"],
            ["Brand drift risk", selectedTemplate.status === "Draft" ? "Medium" : "Low"],
            ["Outdated version risk", selectedTemplate.status === "Locked" ? "Low" : "Watch"],
          ].map(([risk, level]) => (
            <div key={risk} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm font-black text-slate-950">{risk}</span>
              <span className={cn("rounded-xl px-3 py-2 text-xs font-black", level === "Low" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800 border border-amber-200")}>{level}</span>
            </div>
          ))}
        </div>
      )
    }

    if (templatePreviewTab === "Performance") {
      return (
        <div className="grid gap-3">
          {[
            ["Reuse rate", `${Math.min(99, Math.round(selectedTemplate.usage / 3))}%`],
            ["Production speed gain", "+42%"],
            ["Approval confidence", `${selectedTemplate.readiness}%`],
            ["Launches", selectedTemplate.usage],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-2xl font-black text-slate-950">{value}</div>
              <div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-700">{label}</div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {[
          "Owner and edit permissions",
          "Template naming convention",
          "Brand validation checklist",
          "Lifecycle and archive policy",
        ].map((item) => (
          <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm font-black text-slate-950">{item}</span>
            <ShieldCheck className="h-4 w-4 text-violet-700" />
          </div>
        ))}
      </div>
    )
  }

  function templateStatusClass(value: TemplateRecord["status"]) {
    if (value === "Approved") return "bg-emerald-50 text-emerald-800 border border-emerald-200"
    if (value === "In Review") return "bg-amber-500/20 text-amber-800"
    if (value === "Locked") return "bg-violet-50 text-violet-800"
    return "bg-slate-500/25 text-slate-900"
  }

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[34px] border border-violet-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-700">Template command ecosystem</div>
            <h2 className="mt-1 text-4xl font-black text-slate-950">Templates Workspace · Master Systems + Rules Control</h2>
            <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-slate-950/76">
              Centralize every reusable AngelCare template across digital, print/offline, corporate documents and master workflow templates. Each master category follows the exact creation modal parameters, rules and approval structure.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onCreateTemplate} className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-4 text-sm font-black text-white shadow-[0_18px_52px_rgba(124,58,237,.32)]">
              <Plus className="mr-2 inline h-4 w-4" /> Create Template
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplatePreviewTab("Governance")
                runCommand("Template governance cockpit opened")
              }}
              className="rounded-2xl border border-slate-200 bg-white/5 px-6 py-4 text-sm font-black text-slate-950 hover:bg-slate-50"
            >
              <ShieldCheck className="mr-2 inline h-4 w-4" /> Governance
            </button>
            <button
              type="button"
              onClick={resetTemplateWorkspace}
              className="rounded-2xl border border-slate-200 bg-white/5 px-6 py-4 text-sm font-black text-slate-950 hover:bg-slate-50"
            >
              <RefreshCw className="mr-2 inline h-4 w-4" /> Reset Templates
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[1fr_180px_190px_190px_160px_180px_120px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates by family, category, subcategory, modal parameter, output, owner..."
              className="h-14 w-full rounded-2xl border border-cyan-300/20 bg-white pl-12 pr-4 text-sm font-black text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
          <SelectPill value={family} setValue={setFamily} options={templateFamilyOptions} />
          <SelectPill value={templateCategory} setValue={setTemplateCategory} options={templateCategoryOptions} />
          <SelectPill value={templateSubcategory} setValue={setTemplateSubcategory} options={templateSubcategoryOptions} />
          <SelectPill value={status} setValue={setStatus} options={["All Status", "Approved", "In Review", "Draft", "Locked"]} />
          <SelectPill value={output} setValue={setOutput} options={["All Outputs", ...allOutputs]} />
          <button
            type="button"
            onClick={() => {
              setTemplatePreviewTab("Fields")
              runCommand("Advanced template filters opened")
            }}
            className="rounded-2xl border border-slate-200 bg-white/5 px-4 text-xs font-black text-slate-800"
          >
            <SlidersHorizontal className="mr-2 inline h-4 w-4" /> Filters
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {([
            ["Master Templates", templates.length, "controlled reusable systems", LayoutTemplate, "violet"],
            ["Approved", templates.filter((item) => item.status === "Approved").length, "ready for production", BadgeCheck, "emerald"],
            ["Avg Readiness", `${Math.round(templates.reduce((sum, item) => sum + item.readiness, 0) / templates.length)}%`, "governance confidence", Radar, "cyan"],
            ["Usage Events", templates.reduce((sum, item) => sum + item.usage, 0), "template launches", Workflow, "amber"],
            ["Sync State", templateSyncStatus.toUpperCase(), "production API status", RefreshCw, templateSyncStatus === "live" ? "emerald" : templateSyncStatus === "saving" ? "amber" : "rose"],
          ] as const).map(([label, value, detail, Icon, tone]) => (
            <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4">
              <Icon className={cn("h-6 w-6", toneClasses(tone as Tone).text)} />
              <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
              <div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-700">{label}</div>
              <div className="mt-1 text-xs font-bold text-slate-800">{detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        {masterFamilies.map((item) => {
          const Icon = item.icon
          const active = family === item.label
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFamily(item.label)
                runCommand(`Template family selected: ${item.label}`)
              }}
              className={cn("group overflow-hidden rounded-[30px] border bg-white text-left transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(34,211,238,.12)]", active ? "border-violet-300/55 shadow-[0_0_38px_rgba(124,58,237,.2)]" : "border-slate-200 hover:border-cyan-300/35")}
            >
              <div className={cn("relative h-36 bg-gradient-to-br", toneClasses(item.tone).ring)}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,.36),transparent_18%),linear-gradient(135deg,rgba(255,255,255,.12),rgba(15,23,42,.08))]" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-20 w-20 place-items-center rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,.10)] backdrop-blur-md transition group-hover:scale-105">
                    <Icon className="h-10 w-10 text-slate-950" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="text-xl font-black text-slate-950">{item.label}</div>
                <p className="mt-2 min-h-[48px] text-sm font-bold leading-6 text-slate-800">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.outputs.slice(0, 3).map((entry) => (
                    <span key={entry} className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black text-slate-800">{entry}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-700">{item.rules.length} rules synced</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onCreateByFamily(item.id)
                    }}
                    className="rounded-xl border border-slate-200 bg-white/5 px-3 py-2 text-xs font-black text-slate-950 hover:bg-slate-50"
                  >
                    Open modal
                  </button>
                </div>
              </div>
            </button>
          )
        })}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          title={`Template Results · ${filteredTemplates.length} matched · live`}
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setViewMode("grid")} className={cn("grid h-9 w-9 place-items-center rounded-xl border", viewMode === "grid" ? "border-violet-300/40 bg-violet-50" : "border-slate-200 bg-white/5")}><Grid3X3 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("list")} className={cn("grid h-9 w-9 place-items-center rounded-xl border", viewMode === "list" ? "border-violet-300/40 bg-violet-50" : "border-slate-200 bg-white/5")}><List className="h-4 w-4" /></button>
            </div>
          }
        >
          {filteredTemplates.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-cyan-300/25 bg-cyan-50 p-8 text-center">
              <LayoutTemplate className="mx-auto h-10 w-10 text-cyan-700" />
              <h3 className="mt-4 text-xl font-black text-slate-950">No templates match this cockpit state</h3>
              <p className="mt-2 text-sm font-bold text-slate-700">Adjust filters, reset the workspace, or create a new synced template.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={resetTemplateWorkspace} className="rounded-2xl border border-slate-200 bg-white/5 px-5 py-3 text-xs font-black text-slate-950 hover:bg-slate-50">Reset workspace</button>
                <button type="button" onClick={onCreateTemplate} className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-xs font-black text-white">Create template</button>
              </div>
            </div>
          )}

          <div className={cn("grid gap-4", viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
            {filteredTemplates.map((template) => {
              const Icon = template.icon
              return (
                <article
                  key={template.id}
                  className={cn("rounded-[26px] border bg-white p-4 transition hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_24px_70px_rgba(34,211,238,.12)]", selectedTemplate.id === template.id ? "border-violet-300/55" : "border-slate-200", viewMode === "list" && "grid grid-cols-[1fr_220px] gap-4")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(template.id)
                      setTemplatePreviewTab("Rules")
                      runCommand(`Template preview synced: ${template.name}`)
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn("grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br p-3", toneClasses(template.tone).ring)}>
                        <Icon className="h-6 w-6 text-slate-950" />
                      </span>
                      <span className={cn("rounded-xl px-3 py-2 text-[10px] font-black uppercase", templateStatusClass(template.status))}>{template.status}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">{template.name}</h3>
                    <div className="mt-1 text-sm font-bold text-slate-800">{template.family} · {template.category}</div>
                    <div className="mt-2 text-xs font-black text-cyan-700">{template.subcategory}</div>
                    <div className="mt-2 text-xs font-bold text-slate-950/62">{template.channel}</div>
                    <div className="mt-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[.1em] text-slate-600">{template.modalScope}</div>
                    <div className="mt-4 h-2 rounded-full bg-slate-200">
                      <div className={cn("h-full rounded-full bg-gradient-to-r", toneClasses(template.tone).ring)} style={{ width: `${template.readiness}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-black text-slate-800">
                      <span>{template.readiness}% readiness</span>
                      <span>{template.usage} uses</span>
                    </div>
                  </button>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      ["View", Eye],
                      ["Edit", Edit3],
                      ["Clone", PackageOpen],
                      ["Delete", Trash2],
                    ].map(([label, ActionIcon]) => (
                      <button
                        key={String(label)}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedTemplateId(template.id)

                          if (label === "View") {
                            setTemplatePreviewTab("Rules")
                            runCommand(`Template preview synced: ${template.name}`)
                            return
                          }

                          if (label === "Edit") {
                            runCommand(`Edit template opened in matching modal: ${template.name}`)
                            editTemplate(template)
                            return
                          }

                          if (label === "Clone") {
                            const clone: TemplateRecord = {
                              ...template,
                              id: `clone-${template.id}-${Date.now()}`,
                              name: `${template.name} · Copy`,
                              status: "Draft",
                              usage: 0,
                              readiness: Math.max(50, template.readiness - 10),
                              lastUpdated: "Just now",
                            }
                            setTemplates((current) => [clone, ...current])
                            persistTemplateToProduction(clone).catch(() => setTemplateSyncStatus("offline"))
                            setSelectedTemplateId(clone.id)
                            runCommand(`Clone template created live: ${template.name}`)
                            return
                          }

                          deleteTemplate(template)
                        }}
                        className="grid h-10 place-items-center rounded-xl border border-slate-200 bg-white/5 text-slate-800 hover:border-cyan-300/30 hover:bg-cyan-50"
                        title={String(label)}
                      >
                        <ActionIcon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </Panel>

        <Panel title="Template Control Preview" action={<button type="button" onClick={() => runCommand(`Expand template: ${selectedTemplate.name}`)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5"><Maximize2 className="h-4 w-4" /></button>}>
          <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6", toneClasses(selectedTemplate.tone).ring)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(255,255,255,.36),transparent_18%),linear-gradient(135deg,rgba(255,255,255,.12),rgba(15,23,42,.08))]" />
            <div className="relative grid min-h-[220px] place-items-center text-center">
              <div className="rounded-[30px] border border-slate-200 bg-white p-7 backdrop-blur-md">
                <SelectedTemplateIcon className="mx-auto h-16 w-16 text-slate-950" />
                <div className="mt-4 text-2xl font-black text-slate-950">{selectedTemplate.name}</div>
                <div className="mt-2 text-sm font-black text-slate-950/80">{selectedTemplate.family}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-950">{selectedTemplate.name}</h3>
              <div className="mt-1 text-sm font-bold text-slate-700">{selectedTemplate.output} · {selectedTemplate.category}</div>
              <div className="mt-1 text-xs font-black text-cyan-700">{selectedTemplate.subcategory}</div>
              <div className="mt-2 inline-flex rounded-full border border-emerald-300/20 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-emerald-800">
                Preview synced with Template Results
              </div>
            </div>
            <span className={cn("rounded-xl px-3 py-2 text-xs font-black", templateStatusClass(selectedTemplate.status))}>{selectedTemplate.status}</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Usage", selectedTemplate.usage],
              ["Readiness", `${selectedTemplate.readiness}%`],
              ["Rules", selectedTemplate.rules.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <div className="text-xl font-black text-slate-950">{value}</div>
                <div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-700">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex gap-1 overflow-x-auto p-2">
              {templateExecutionTabs.map((tab) => {
                const TabIcon = tab.icon
                const active = templatePreviewTab === tab.label
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setTemplatePreviewTab(tab.label)
                      runCommand(`Template execution layer: ${tab.label}`)
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition",
                      active
                        ? "bg-violet-500/25 text-violet-800 ring-1 ring-violet-300/35"
                        : "text-slate-950/62 hover:bg-white/5 hover:text-slate-950",
                    )}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            {renderTemplateExecutionLayer()}
          </div>

          <div className="mt-5 grid gap-2">
            <button type="button" onClick={() => editTemplate(selectedTemplate)} className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-4 text-sm font-black text-white">
              Edit in matching modal + Save workflow
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => runCommand(`Template version control: ${selectedTemplate.name}`)} className="rounded-2xl border border-violet-300/35 bg-violet-50 px-4 py-3 text-xs font-black text-slate-950 hover:bg-violet-50">
                Version Control
              </button>
              <button
                type="button"
                onClick={() => {
                  const clone: TemplateRecord = {
                    ...selectedTemplate,
                    id: `clone-${selectedTemplate.id}-${Date.now()}`,
                    name: `${selectedTemplate.name} · Copy`,
                    status: "Draft",
                    usage: 0,
                    readiness: Math.max(50, selectedTemplate.readiness - 10),
                    lastUpdated: "Just now",
                  }
                  setTemplates((current) => [clone, ...current])
                  persistTemplateToProduction(clone).catch(() => setTemplateSyncStatus("offline"))
                  setSelectedTemplateId(clone.id)
                  runCommand(`Template clone created live: ${selectedTemplate.name}`)
                }}
                className="rounded-2xl border border-cyan-300/25 bg-cyan-50 px-4 py-3 text-xs font-black text-cyan-800 hover:bg-cyan-50"
              >
                Clone Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplates((current) =>
                    current.map((item) =>
                      item.id === selectedTemplate.id
                        ? { ...item, status: "In Review", lastUpdated: "Just now" }
                        : item,
                    ),
                  )
                  setTemplatePreviewTab("Approval")
                  runCommand(`Template approval requested live: ${selectedTemplate.name}`)
                }}
                className="rounded-2xl border border-emerald-300/25 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800 hover:bg-emerald-100"
              >
                Request Approval
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplates((current) =>
                    current.map((item) =>
                      item.id === selectedTemplate.id
                        ? { ...item, status: "Locked", lastUpdated: "Just now" }
                        : item,
                    ),
                  )
                  runCommand(`Template archived live: ${selectedTemplate.name}`)
                }}
                className="rounded-2xl border border-rose-300/25 bg-rose-50 px-4 py-3 text-xs font-black text-rose-800 hover:bg-rose-500/20"
              >
                Archive
              </button>
            </div>
          </div>
        </Panel>
      </section>
    </section>
  )
}


type CorporateDocRecord = {
  id: string
  name: string
  file: string
  category: string
  subcategory: string
  type: string
  version: string
  status: "Approved" | "Published" | "In Review" | "Draft" | "Archived"
  owner: string
  modified: string
  size: string
  tags: string[]
  iconTone: Tone
}

function CorporateDocsWorkspace({
  runCommand,
  onCreateDoc,
}: {
  runCommand: (label: string) => void
  onCreateDoc: () => void
}) {
  const [activeListTab, setActiveListTab] = useState("All Documents")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All Categories")
  const [subcategory, setSubcategory] = useState("All Subcategories")
  const [docType, setDocType] = useState("All Document Types")
  const [status, setStatus] = useState("All Status")
  const [selectedDocId, setSelectedDocId] = useState("employee-handbook-2025")

  const docCategories = [
    ["Governance & Policies", "1,245 docs", ShieldCheck, "violet"],
    ["Human Resources", "2,156 docs", Users, "rose"],
    ["Operations", "3,487 docs", Workflow, "blue"],
    ["Finance & Legal", "2,842 docs", BriefcaseBusiness, "cyan"],
    ["Quality & Compliance", "1,326 docs", BadgeCheck, "emerald"],
    ["IT & Security", "1,876 docs", ShieldCheck, "cyan"],
    ["Marketing & Brand", "2,134 docs", Megaphone, "amber"],
    ["Sales & Commercial", "2,456 docs", Route, "amber"],
    ["Products & Services", "1,987 docs", Boxes, "violet"],
    ["Training & Development", "1,432 docs", GraduationCap, "violet"],
    ["Facilities & Maintenance", "876 docs", ClipboardCheck, "emerald"],
  ] as const

  const docs: CorporateDocRecord[] = [
    { id: "employee-handbook-2025", name: "Employee Handbook 2025", file: "employee-handbook-2025.pdf", category: "Human Resources", subcategory: "Employee Relations", type: "Policy", version: "v2.3", status: "Approved", owner: "Imane L.", modified: "May 12, 2025", size: "2.4 MB", tags: ["handbook", "hr", "policy", "2025"], iconTone: "rose" },
    { id: "code-of-conduct", name: "Code of Conduct", file: "code-of-conduct.docx", category: "Governance & Policies", subcategory: "Corporate Policies", type: "Policy", version: "v1.7", status: "Approved", owner: "Salma E.", modified: "May 10, 2025", size: "1.6 MB", tags: ["conduct", "policy"], iconTone: "blue" },
    { id: "financial-report-q1", name: "Q1 2025 Financial Report", file: "q1-2025-financial-report.pptx", category: "Finance & Legal", subcategory: "Financial Reports", type: "Presentation", version: "v1.2", status: "Published", owner: "Youssef B.", modified: "May 8, 2025", size: "8.8 MB", tags: ["finance", "report"], iconTone: "amber" },
    { id: "brand-guidelines-v21", name: "Brand Guidelines v2.1", file: "brand-guidelines-v2.1.pdf", category: "Marketing & Brand", subcategory: "Brand Identity", type: "Guideline", version: "v2.1", status: "Approved", owner: "Salma E.", modified: "May 7, 2025", size: "12.1 MB", tags: ["brand", "guideline"], iconTone: "rose" },
    { id: "vendor-evaluation-form", name: "Vendor Evaluation Form", file: "vendor-evaluation-form.xlsx", category: "Operations", subcategory: "Forms & Templates", type: "Form", version: "v1.5", status: "In Review", owner: "Omar K.", modified: "May 6, 2025", size: "860 KB", tags: ["vendor", "form"], iconTone: "emerald" },
    { id: "info-security-policy", name: "Information Security Policy", file: "info-security-policy.pdf", category: "IT & Security", subcategory: "Security Policies", type: "Policy", version: "v3.0", status: "Approved", owner: "Hind E.", modified: "May 5, 2025", size: "3.2 MB", tags: ["security", "policy"], iconTone: "rose" },
    { id: "training-program-guide", name: "Training Program Guide", file: "training-program-guide.pdf", category: "Training & Development", subcategory: "Training Materials", type: "Guide", version: "v1.3", status: "Draft", owner: "Imane L.", modified: "May 4, 2025", size: "4.6 MB", tags: ["training", "guide"], iconTone: "rose" },
    { id: "service-level-agreement", name: "Service Level Agreement", file: "sla-template.docx", category: "Sales & Commercial", subcategory: "Contracts & Agreements", type: "Agreement", version: "v2.2", status: "Approved", owner: "Youssef B.", modified: "May 3, 2025", size: "1.1 MB", tags: ["sla", "agreement"], iconTone: "blue" },
  ]

  const filteredDocs = docs.filter((doc) => {
    const q = query.trim().toLowerCase()
    return (
      (category === "All Categories" || doc.category === category) &&
      (subcategory === "All Subcategories" || doc.subcategory === subcategory) &&
      (docType === "All Document Types" || doc.type === docType) &&
      (status === "All Status" || doc.status === status) &&
      (q === "" || [doc.name, doc.file, doc.category, doc.subcategory, doc.type, doc.owner, doc.tags.join(" ")].join(" ").toLowerCase().includes(q))
    )
  })

  const selectedDoc = filteredDocs.find((doc) => doc.id === selectedDocId) || filteredDocs[0] || docs[0]

  function docStatusClass(value: string) {
    if (value === "Approved") return "bg-emerald-50 text-emerald-800 border border-emerald-200"
    if (value === "Published") return "bg-cyan-50 text-cyan-800"
    if (value === "In Review") return "bg-amber-500/20 text-amber-800"
    if (value === "Draft") return "bg-slate-500/25 text-slate-900"
    return "bg-rose-500/20 text-rose-800"
  }

  return (
    <section className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
        {([
          ["Total Documents", "28,542", "↑ 18% vs last month", ShieldCheck, "violet"],
          ["Policies & Procedures", "2,842", "↑ 12% vs last month", ClipboardCheck, "blue"],
          ["Forms & Templates", "1,652", "↑ 9% vs last month", LayoutTemplate, "rose"],
          ["Reports & Presentations", "4,326", "↑ 15% vs last month", FileText, "cyan"],
          ["Manuals & Guides", "3,218", "↑ 7% vs last month", BookOpen, "amber"],
          ["Compliance Docs", "1,987", "↑ 22% vs last month", BadgeCheck, "emerald"],
        ] as const).map(([label, value, trend, Icon, tone]) => (
          <div key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br", toneClasses(tone as Tone).ring)}><Icon className="h-5 w-5" /></span>
              <div><div className="text-xs font-black text-slate-800">{label}</div><div className="text-2xl font-black text-slate-950">{value}</div><div className="text-[11px] font-bold text-emerald-700">{trend}</div></div>
            </div>
          </div>
        ))}
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(#8b5cf6_0_68%,rgba(255,255,255,.1)_68%_100%)]"><div className="grid h-11 w-11 place-items-center rounded-full bg-white"><Sparkle className="h-5 w-5 text-violet-700" /></div></div><div><div className="text-xs font-black text-slate-800">Storage Used</div><div className="text-2xl font-black text-slate-950">68%</div><div className="text-[11px] font-bold text-slate-700">342 GB / 500 GB</div></div></div>
        </div>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <Panel title="Document Categories" action={<button type="button" onClick={() => runCommand("View all document categories")} className="text-sm font-black text-violet-700">View All Categories</button>}>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {docCategories.map(([label, count, Icon, tone]) => (
                <button key={String(label)} type="button" onClick={() => { setCategory(label as string); runCommand(`Document category selected: ${label}`) }} className={cn("flex items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5", category === label ? "border-violet-300/55 bg-violet-50" : "border-slate-200 bg-white hover:border-cyan-300/30")}>
                  <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br", toneClasses(tone as Tone).ring)}><Icon className="h-5 w-5" /></span>
                  <span><span className="block text-xs font-black text-slate-950">{label}</span><span className="mt-1 block text-sm font-bold text-slate-800">{count}</span></span>
                </button>
              ))}
              <button type="button" onClick={onCreateDoc} className="grid min-h-[82px] place-items-center rounded-2xl border border-dashed border-violet-300/25 bg-violet-500/8 text-center text-sm font-black text-violet-800"><Plus className="mb-1 h-5 w-5" /> Add Category</button>
            </div>
          </Panel>

          <Panel title="">
            <div className="mb-5 flex flex-wrap gap-6 border-b border-slate-200">
              {["All Documents", "Recently Added", "Favorites", "Expiring Soon", "Needs Review", "Archived"].map((tab) => (
                <button key={tab} type="button" onClick={() => { setActiveListTab(tab); runCommand(`Document tab: ${tab}`) }} className={cn("border-b-2 px-1 pb-4 text-sm font-black", activeListTab === tab ? "border-violet-400 text-violet-800" : "border-transparent text-slate-950/62 hover:text-slate-950")}>{tab}</button>
              ))}
            </div>
            <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_150px_170px_170px_120px_120px]">
              <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." className="h-12 w-full rounded-xl border border-cyan-300/20 bg-white pl-11 pr-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400" /></div>
              <SelectPill value={category} setValue={setCategory} options={["All Categories", ...docCategories.map(([label]) => label as string)]} />
              <SelectPill value={subcategory} setValue={setSubcategory} options={["All Subcategories", "Employee Relations", "Corporate Policies", "Financial Reports", "Brand Identity", "Forms & Templates", "Security Policies", "Training Materials", "Contracts & Agreements"]} />
              <SelectPill value={docType} setValue={setDocType} options={["All Document Types", "Policy", "Presentation", "Guideline", "Form", "Guide", "Agreement"]} />
              <SelectPill value={status} setValue={setStatus} options={["All Status", "Approved", "Published", "In Review", "Draft"]} />
              <button type="button" onClick={() => runCommand("Advanced document filters")} className="rounded-xl border border-slate-200 bg-white/5 px-4 text-xs font-black text-slate-800"><SlidersHorizontal className="mr-2 inline h-4 w-4" />More</button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1.45fr_1fr_1fr_.75fr_.6fr_.75fr_.85fr_.8fr_.65fr] gap-3 bg-white px-4 py-3 text-xs font-black uppercase tracking-[.1em] text-slate-600"><span>Document Name</span><span>Category</span><span>Subcategory</span><span>Type</span><span>Version</span><span>Status</span><span>Owner</span><span>Modified</span><span>Actions</span></div>
              {filteredDocs.map((doc) => (
                <button key={doc.id} type="button" onClick={() => { setSelectedDocId(doc.id); runCommand(`Document selected: ${doc.name}`) }} className={cn("grid w-full grid-cols-[1.45fr_1fr_1fr_.75fr_.6fr_.75fr_.85fr_.8fr_.65fr] items-center gap-3 border-t border-slate-200 px-4 py-4 text-left text-sm hover:bg-slate-50", selectedDoc.id === doc.id && "bg-violet-50")}>
                  <span className="flex items-center gap-3"><span className={cn("grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br", toneClasses(doc.iconTone).ring)}><FileText className="h-4 w-4" /></span><span><span className="block font-black text-slate-950">{doc.name}</span><span className="block text-xs font-bold text-slate-600">{doc.file}</span></span></span>
                  <span className="font-bold text-cyan-700">{doc.category}</span><span className="font-bold text-violet-700">{doc.subcategory}</span><span className="font-black text-amber-700">{doc.type}</span><span className="font-bold text-slate-800">{doc.version}</span><span className={cn("w-fit rounded-lg px-3 py-1.5 text-xs font-black", docStatusClass(doc.status))}>{doc.status}</span><span className="font-bold text-slate-800">{doc.owner}</span><span className="font-bold text-slate-700">{doc.modified}</span><span className="flex items-center gap-3 text-slate-800"><Eye className="h-4 w-4" /><Download className="h-4 w-4" /><MoreVertical className="h-4 w-4" /></span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-800"><span>Showing 1 to {filteredDocs.length} of 28,542 results</span><div className="flex items-center gap-2">{["‹", "1", "2", "3", "...", "357", "››"].map((page, index) => (<button key={index} type="button" onClick={() => runCommand(`Document page ${page}`)} className={cn("grid h-10 min-w-10 place-items-center rounded-xl border px-3", page === "1" ? "border-violet-300/40 bg-violet-50 text-violet-800" : "border-slate-200 bg-white/5")}>{page}</button>))}<button type="button" className="h-10 rounded-xl border border-slate-200 bg-white/5 px-3">20 / page</button></div></div>
          </Panel>
        </div>

        <Panel title="Document Preview" action={<button type="button" onClick={() => runCommand(`Expand document preview: ${selectedDoc.name}`)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5"><Maximize2 className="h-4 w-4" /></button>}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-blue-950 to-amber-100 p-5"><div className="grid h-56 place-items-center rounded-xl bg-white/25 text-center"><div className="rounded-2xl border border-slate-200 bg-slate-200 p-6 backdrop-blur"><FileText className="mx-auto h-14 w-14 text-slate-950" /><div className="mt-3 text-xl font-black text-slate-950">{selectedDoc.name}</div><div className="mt-1 text-sm font-black text-slate-950/80">{selectedDoc.version}</div></div></div><button type="button" onClick={() => runCommand("Previous document")} className="absolute left-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/35"><ArrowLeft className="h-4 w-4" /></button><button type="button" onClick={() => runCommand("Next document")} className="absolute right-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/35"><ArrowRight className="h-4 w-4" /></button></div>
          <div className="mt-5 flex items-start justify-between gap-3"><div><h3 className="text-xl font-black text-slate-950">{selectedDoc.name}</h3><div className="mt-1 text-sm font-bold text-slate-700">{selectedDoc.type} · {selectedDoc.size} · A4</div></div><span className={cn("rounded-xl px-3 py-2 text-xs font-black", docStatusClass(selectedDoc.status))}>{selectedDoc.status}</span></div>
          <div className="mt-5 grid grid-cols-4 gap-2">{([
              ["View", Eye],
              ["Download", Download],
              ["Share", UploadCloud],
              ["More", MoreVertical],
            ] as const).map(([label, Icon]) => (<button key={String(label)} type="button" onClick={() => runCommand(`${label}: ${selectedDoc.name}`)} className="rounded-xl border border-slate-200 bg-white/5 px-3 py-3 text-xs font-black text-slate-800 hover:border-cyan-300/30"><Icon className="mx-auto mb-1 h-4 w-4" /> {String(label)}</button>))}</div>
          <div className="mt-5 border-b border-slate-200"><div className="flex gap-7 text-sm font-black">{["Details", "Activity", "Versions", "Relations"].map((tab, index) => (<button key={tab} type="button" onClick={() => runCommand(`Document preview tab: ${tab}`)} className={cn("border-b-2 pb-4", index === 0 ? "border-violet-400 text-violet-800" : "border-transparent text-slate-950/62")}>{tab}</button>))}</div></div>
          <div className="mt-5 space-y-3 text-sm font-bold">{[["Description", `Comprehensive ${selectedDoc.type.toLowerCase()} for ${selectedDoc.category.toLowerCase()} operations.`], ["Category", selectedDoc.category], ["Subcategory", selectedDoc.subcategory], ["Document Type", selectedDoc.type], ["Version", selectedDoc.version.replace("v", "")], ["Status", selectedDoc.status], ["Owner", selectedDoc.owner], ["Created On", "Apr 15, 2025 10:30 AM"], ["Modified On", `${selectedDoc.modified} 02:15 PM`]].map(([label, value]) => (<div key={String(label)} className="grid grid-cols-[120px_1fr] gap-3"><span className="text-slate-600">{label}</span><span className="text-slate-950/86">{value}</span></div>))}</div>
          <div className="mt-5 flex flex-wrap gap-2">{selectedDoc.tags.map((tag) => (<span key={tag} className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-black text-slate-800">{tag}</span>))}</div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4"><div className="text-sm font-black text-slate-950">Related Documents (12)</div><div className="mt-3 grid gap-2">{["Code of Conduct v1.7", "HR Policy Manual", "Benefits Overview 2025"].map((doc) => (<button key={doc} type="button" onClick={() => runCommand(`Related document opened: ${doc}`)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-black text-slate-800">{doc}</button>))}</div></div>
          <button type="button" onClick={onCreateDoc} className="mt-6 w-full rounded-2xl border border-violet-300/35 bg-violet-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-violet-50">Edit Document</button>
        </Panel>
      </section>
    </section>
  )
}


type PrintOfflineAssetRecord = {
  id: string
  name: string
  category: string
  subcategory: string
  format: string
  status: "Approved" | "Published" | "In Review" | "Draft" | "In Production" | "Scheduled"
  brand: string
  size: string
  dimensions: string
  pages: number
  owner: string
  modifiedBy: string
  usage: string
  tags: string[]
}

function PrintOfflineWorkspace({
  runCommand,
  onCreatePrint,
}: {
  runCommand: (label: string) => void
  onCreatePrint: () => void
}) {
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedSubcategory, setSelectedSubcategory] = useState("All Subcategories")
  const [format, setFormat] = useState("All Formats")
  const [status, setStatus] = useState("All Status")
  const [size, setSize] = useState("All Sizes")
  const [language, setLanguage] = useState("All Languages")
  const [query, setQuery] = useState("")
  const [printOutput, setPrintOutput] = useState("All Print Outputs")
  const [printPurpose, setPrintPurpose] = useState("All Purposes")
  const [printDelivery, setPrintDelivery] = useState("All Delivery Modes")
  const [printAudience, setPrintAudience] = useState("All Audiences")
  const [printPage, setPrintPage] = useState(1)
  const printPageSize = 8
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedAssetId, setSelectedAssetId] = useState("print-corporate-brochure")

  const categories = [
    { label: "Brochures", count: 2142, gradient: "from-amber-900 to-slate-200", icon: BookOpen },
    { label: "Catalogs", count: 1656, gradient: "from-slate-100 to-blue-200", icon: LibraryBig },
    { label: "Flyers", count: 1320, gradient: "from-orange-900 to-amber-200", icon: Megaphone },
    { label: "Prospectus", count: 1108, gradient: "from-slate-700 to-cyan-200", icon: FileText },
    { label: "Business Cards", count: 856, gradient: "from-slate-100 to-white", icon: IdCard },
    { label: "Posters", count: 732, gradient: "from-amber-800 to-white", icon: PanelTop },
    { label: "Packaging", count: 645, gradient: "from-orange-800 to-amber-100", icon: Box },
    { label: "Stationery", count: 612, gradient: "from-slate-700 to-white", icon: PenTool },
    { label: "Reports", count: 542, gradient: "from-orange-950 to-slate-700", icon: ScrollText },
    { label: "Banners & Rollups", count: 498, gradient: "from-blue-950 to-orange-200", icon: Flag },
    { label: "Direct Mailers", count: 412, gradient: "from-slate-100 to-amber-200", icon: Mail },
    { label: "Packaging Inserts", count: 389, gradient: "from-amber-900 to-stone-200", icon: PackageOpen },
  ]

  const subcategories = [
    ["All Subcategories", 128],
    ["Corporate", 24],
    ["Marketing", 32],
    ["Product", 18],
    ["Sales", 16],
    ["HR & Internal", 12],
    ["Events", 14],
    ["Clients", 12],
  ] as const

  const printOutputs = ["All Print Outputs", "Brochure", "Catalog", "Flyer", "Prospectus", "Business Card", "Poster", "Packaging", "Stationery", "Report", "Rollup", "Direct Mailer"]
  const printPurposes = ["All Purposes", "Brand Awareness", "B2B Sales", "Events", "Internal Training", "Customer Education", "Partnership", "Product Promotion"]
  const printDeliveryModes = ["All Delivery Modes", "Print Shop", "In-house Print", "PDF Export", "Event Distribution", "Sales Handout", "Direct Mail"]
  const printAudiences = ["All Audiences", "Parents", "B2B Partners", "Nurseries", "Internal Staff", "Sales Team", "Events Audience", "Corporate Clients"]

  const assets: PrintOfflineAssetRecord[] = [
    {
      id: "print-corporate-brochure",
      name: "Corporate Brochure 2025",
      category: "Brochures",
      subcategory: "Corporate",
      format: "PDF",
      status: "Approved",
      brand: "Angelcare",
      size: "24.8 MB",
      dimensions: "210 × 297 mm (A4)",
      pages: 24,
      owner: "Imane L.",
      modifiedBy: "Salma E.",
      usage: "Website, Email, Print, Events",
      tags: ["corporate", "brochure", "company", "2025"],
    },
    {
      id: "print-product-catalog",
      name: "Product Catalog Q2",
      category: "Catalogs",
      subcategory: "Product",
      format: "PDF",
      status: "Published",
      brand: "Hogolcet",
      size: "18.6 MB",
      dimensions: "210 × 297 mm (A4)",
      pages: 36,
      owner: "Youssef B.",
      modifiedBy: "Youssef B.",
      usage: "Sales Portal, Print, Events",
      tags: ["catalog", "product", "q2"],
    },
    {
      id: "print-summer-flyer",
      name: "Event Flyer - Summer Camp",
      category: "Flyers",
      subcategory: "Events",
      format: "PDF",
      status: "In Review",
      brand: "Angelcare",
      size: "8.2 MB",
      dimensions: "148 × 210 mm (A5)",
      pages: 2,
      owner: "Salma E.",
      modifiedBy: "Salma E.",
      usage: "Events, Print, Handout",
      tags: ["flyer", "event", "summer"],
    },
    {
      id: "print-company-prospectus",
      name: "Company Prospectus",
      category: "Prospectus",
      subcategory: "Sales",
      format: "PDF",
      status: "Approved",
      brand: "Angelcare",
      size: "15.1 MB",
      dimensions: "210 × 297 mm (A4)",
      pages: 18,
      owner: "Omar K.",
      modifiedBy: "Omar K.",
      usage: "B2B Sales, Partnerships",
      tags: ["prospectus", "b2b", "sales"],
    },
    {
      id: "print-business-card",
      name: "New Business Card Design",
      category: "Business Cards",
      subcategory: "Corporate",
      format: "AI",
      status: "Draft",
      brand: "Jaht",
      size: "4.7 MB",
      dimensions: "85 × 55 mm",
      pages: 1,
      owner: "Hind E.",
      modifiedBy: "Hind E.",
      usage: "Staff, Events, Office",
      tags: ["business card", "identity"],
    },
    {
      id: "print-service-brochures",
      name: "Service Brochures",
      category: "Brochures",
      subcategory: "Marketing",
      format: "PDF",
      status: "Published",
      brand: "Angelcare",
      size: "28.4 MB",
      dimensions: "210 × 297 mm (A4)",
      pages: 32,
      owner: "Imane L.",
      modifiedBy: "Salma E.",
      usage: "Print, Email, Events",
      tags: ["service", "brochure"],
    },
    {
      id: "print-product-sheets",
      name: "Product Sheets",
      category: "Catalogs",
      subcategory: "Product",
      format: "PDF",
      status: "Approved",
      brand: "Hogolcet",
      size: "9.8 MB",
      dimensions: "210 × 297 mm (A4)",
      pages: 12,
      owner: "Youssef B.",
      modifiedBy: "Youssef B.",
      usage: "Sales, B2B, Print",
      tags: ["product", "sheet"],
    },
    {
      id: "print-training-materials",
      name: "Training Materials",
      category: "Reports",
      subcategory: "HR & Internal",
      format: "PDF",
      status: "In Production",
      brand: "Angelcare",
      size: "22.1 MB",
      dimensions: "210 × 297 mm (A4)",
      pages: 42,
      owner: "Training Team",
      modifiedBy: "Training Team",
      usage: "Academy, Staff, Internal",
      tags: ["training", "academy", "internal"],
    },
  ]

  const filteredAssets = assets.filter((asset) => {
    const q = query.trim().toLowerCase()
    return (
      (selectedCategory === "All Categories" || asset.category === selectedCategory) &&
      (selectedSubcategory === "All Subcategories" || asset.subcategory === selectedSubcategory) &&
      (format === "All Formats" || asset.format === format) &&
      (status === "All Status" || asset.status === status) &&
      (printOutput === "All Print Outputs" || asset.category.toLowerCase().includes(printOutput.toLowerCase()) || asset.name.toLowerCase().includes(printOutput.toLowerCase())) &&
      (printPurpose === "All Purposes" || asset.usage.toLowerCase().includes(printPurpose.toLowerCase()) || asset.tags.join(" ").toLowerCase().includes(printPurpose.toLowerCase())) &&
      (printDelivery === "All Delivery Modes" || asset.usage.toLowerCase().includes(printDelivery.toLowerCase())) &&
      (printAudience === "All Audiences" || asset.usage.toLowerCase().includes(printAudience.toLowerCase()) || asset.tags.join(" ").toLowerCase().includes(printAudience.toLowerCase())) &&
      (q === "" || [asset.name, asset.category, asset.subcategory, asset.format, asset.status, asset.owner, asset.brand, asset.usage, asset.tags.join(" ")].join(" ").toLowerCase().includes(q))
    )
  })

  const selectedAsset = filteredAssets.find((item) => item.id === selectedAssetId) || filteredAssets[0] || assets[0]
  const printTotalPages = Math.max(1, Math.ceil(filteredAssets.length / printPageSize))
  const visiblePrintAssets = filteredAssets.slice((printPage - 1) * printPageSize, printPage * printPageSize)
  const approved = assets.filter((asset) => asset.status === "Approved").length
  const published = assets.filter((asset) => asset.status === "Published").length
  const review = assets.filter((asset) => asset.status === "In Review").length

  function printStatusClass(value: string) {
    if (value === "Approved") return "bg-emerald-50 text-emerald-800 border border-emerald-200"
    if (value === "Published") return "bg-cyan-50 text-cyan-800"
    if (value === "In Review") return "bg-amber-500/20 text-amber-800"
    if (value === "In Production") return "bg-orange-500/20 text-orange-100"
    if (value === "Scheduled") return "bg-blue-500/20 text-blue-800"
    return "bg-slate-500/20 text-slate-900"
  }

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[34px] border border-cyan-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-700">Print & offline execution cockpit</div>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Print & Offline Workspace · Live Output + Delivery Control</h2>
            <p className="mt-2 max-w-4xl text-sm font-bold text-slate-800">Built on the Print & Offline Create modal parameters: output, purpose, format, size, audience, delivery mode, status and live result navigation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onCreatePrint} className="inline-flex h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-500 px-7 text-sm font-black text-white shadow-[0_16px_42px_rgba(124,58,237,.28)]">
              <Plus className="h-5 w-5" /> Create Print & Offline Content
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setPrintOutput("All Print Outputs")
                setPrintPurpose("All Purposes")
                setPrintDelivery("All Delivery Modes")
                setPrintAudience("All Audiences")
                setSelectedCategory("All Categories")
                setSelectedSubcategory("All Subcategories")
                setFormat("All Formats")
                setStatus("All Status")
                setSize("All Sizes")
                setLanguage("All Languages")
                setPrintPage(1)
                runCommand("Print cockpit reset")
              }}
              className="h-14 rounded-2xl border border-slate-200 bg-white/5 px-6 text-sm font-black text-slate-950 hover:bg-slate-50"
            >
              Reset Cockpit
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr_.85fr_.85fr_.85fr_.75fr]">
          <SelectPill value={printOutput} setValue={(value) => { setPrintOutput(value); setPrintPage(1) }} options={printOutputs} />
          <SelectPill value={printPurpose} setValue={(value) => { setPrintPurpose(value); setPrintPage(1) }} options={printPurposes} />
          <SelectPill value={format} setValue={(value) => { setFormat(value); setPrintPage(1) }} options={["All Formats", "PDF", "AI"]} />
          <SelectPill value={size} setValue={(value) => { setSize(value); setPrintPage(1) }} options={["All Sizes", "A4", "A5", "Business Card"]} />
          <SelectPill value={status} setValue={(value) => { setStatus(value); setPrintPage(1) }} options={["All Status", "Approved", "Published", "In Review", "Draft", "In Production"]} />
          <SelectPill value={printDelivery} setValue={(value) => { setPrintDelivery(value); setPrintPage(1) }} options={printDeliveryModes} />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_620px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPrintPage(1) }}
              placeholder="Search print/offline assets by output, purpose, category, tags, owner, format..."
              className="h-14 w-full rounded-2xl border border-cyan-300/20 bg-white pl-12 pr-4 text-sm font-black text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {([
              ["Matched", filteredAssets.length, "filtered print assets", ScanSearch, "cyan"],
              ["Approved", approved, "approval ready", CheckCircle2, "emerald"],
              ["Output", printOutput.replace("All Print Outputs", "All"), "selected output", FileText, "violet"],
              ["Delivery", printDelivery.replace("All Delivery Modes", "All"), "delivery mode", Package, "amber"],
            ] as const).map(([label, value, detail, Icon, tone]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-3">
                <Icon className={cn("h-5 w-5", toneClasses(tone as Tone).text)} />
                <div className="mt-2 truncate text-xl font-black text-slate-950">{value}</div>
                <div className="truncate text-[10px] font-black uppercase tracking-[.12em] text-slate-700">{label}</div>
                <div className="mt-1 truncate text-[11px] font-bold text-slate-800">{detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {([
            ["Total Assets", String(assets.length), "live records", ShieldCheck, "violet"],
            ["In Review", String(review), "review queue", Clock3, "amber"],
            ["Approved", String(approved), "approved files", CheckCircle2, "emerald"],
            ["Published", String(published), "released assets", FileImage, "cyan"],
            ["Print Orders", "1,245", "active print ops", Package, "amber"],
            ["Storage Used", "68%", "342 GB / 500 GB", Palette, "rose"],
          ] as const).map(([label, value, detail, Icon, tone]) => (
            <div key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br", toneClasses(tone as Tone).ring)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs font-black text-slate-800">{label}</div>
                  <div className="text-2xl font-black text-slate-950">{value}</div>
                  <div className="text-[11px] font-bold text-emerald-700">{detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.15fr)_390px]">
        <Panel title="Content Categories" action={<button type="button" onClick={() => runCommand("View all print categories")} className="text-sm font-black text-violet-700">View All</button>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const CategoryIcon = category.icon
              return (
              <button
                key={category.label}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.label)
                  setSelectedSubcategory("All Subcategories")
                  runCommand(`Print category selected: ${category.label}`)
                }}
                className={cn("group overflow-hidden rounded-[26px] border bg-white text-left transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(34,211,238,.12)]", selectedCategory === category.label ? "border-violet-300/55 shadow-[0_0_34px_rgba(124,58,237,.18)]" : "border-slate-200 hover:border-cyan-300/30")}
              >
                <div className={cn("relative h-32 overflow-hidden bg-gradient-to-br", category.gradient)}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,.38),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.12),rgba(15,23,42,.08))]" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-20 w-20 place-items-center rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,.10)] backdrop-blur-md transition group-hover:scale-105">
                      <CategoryIcon className="h-10 w-10 text-slate-950 drop-shadow-[0_22px_70px_rgba(15,23,42,.10)]" />
                    </div>
                  </div>
                  <div className="absolute left-4 top-4 rounded-full border border-slate-200 bg-white/30 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-950/85">
                    Print type
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-lg font-black text-slate-950">{category.label}</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">{category.count.toLocaleString()} assets</div>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${Math.min(100, Math.round(category.count / 25))}%` }} />
                  </div>
                </div>
              </button>
              )
            })}
          </div>
        </Panel>

        <Panel title="Recent Content">
          <div className="grid grid-cols-[1fr_100px_95px_110px_30px] gap-3 border-b border-slate-200 px-2 pb-3 text-xs font-black uppercase tracking-[.12em] text-slate-600">
            <span>Asset</span><span>Type</span><span>Status</span><span>Modified</span><span />
          </div>
          <div className="space-y-2 pt-2">
            {assets.slice(0, 5).map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  setSelectedAssetId(asset.id)
                  runCommand(`Print content selected: ${asset.name}`)
                }}
                className="grid w-full grid-cols-[1fr_100px_95px_110px_30px] items-center gap-3 rounded-2xl border border-transparent p-2 text-left hover:border-cyan-300/20 hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-12 w-14 place-items-center rounded-xl bg-gradient-to-br from-amber-900 to-slate-200 text-[9px] font-black text-slate-950">PRINT</span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">{asset.name}</span>
                    <span className="block text-xs font-bold text-slate-700">{asset.category}</span>
                  </span>
                </span>
                <span className="text-xs font-black text-rose-700">{asset.brand}</span>
                <span className={cn("rounded-lg px-2 py-1 text-center text-[11px] font-black", printStatusClass(asset.status))}>{asset.status}</span>
                <span className="text-xs font-bold text-slate-950/62">{asset.modifiedBy}</span>
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Content Preview"
          action={<button type="button" onClick={() => runCommand(`Expand print preview: ${selectedAsset.name}`)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5"><Maximize2 className="h-4 w-4" /></button>}
        >
          <div className="rounded-2xl bg-gradient-to-br from-slate-700 via-blue-900 to-amber-100 p-4">
            <div className="grid h-56 place-items-center rounded-xl bg-slate-100 text-center">
              <div>
                <FileText className="mx-auto h-14 w-14 text-slate-950/90" />
                <div className="mt-3 text-lg font-black text-slate-950">{selectedAsset.name}</div>
                <div className="text-xs font-bold text-slate-800">{selectedAsset.format} · {selectedAsset.dimensions}</div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-black text-slate-950">{selectedAsset.name}</div>
              <div className="mt-1 text-sm font-bold text-slate-950/68">{selectedAsset.category} · {selectedAsset.format} · {selectedAsset.size}</div>
            </div>
            <span className={cn("rounded-xl px-3 py-2 text-xs font-black", printStatusClass(selectedAsset.status))}>{selectedAsset.status}</span>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {[
              ["Download", Download],
              ["Assign", Users],
              ["Print", Printer],
              ["Link", Link2],
              ["More", MoreVertical],
            ].map(([label, Icon]) => (
              <button key={String(label)} type="button" onClick={() => runCommand(`${label}: ${selectedAsset.name}`)} className="grid h-12 place-items-center rounded-xl border border-slate-200 bg-white/5 hover:border-cyan-300/30">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3 text-sm font-bold">
            {[
              ["Category", selectedAsset.category],
              ["Subcategory", selectedAsset.subcategory],
              ["Format", selectedAsset.format],
              ["Size", selectedAsset.size],
              ["Dimensions", selectedAsset.dimensions],
              ["Pages", String(selectedAsset.pages)],
              ["Created by", selectedAsset.owner],
              ["Modified by", selectedAsset.modifiedBy],
              ["Usage", selectedAsset.usage],
            ].map(([label, value]) => (
              <div key={String(label)} className="grid grid-cols-[120px_1fr] gap-3">
                <span className="text-slate-950/66">{label}</span>
                <span className="text-slate-950">{value}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={onCreatePrint} className="mt-6 w-full rounded-2xl border border-violet-300/35 bg-violet-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-violet-50">
            Edit Content
          </button>
        </Panel>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[300px_minmax(0,1fr)]">
        <Panel title="Browse by Subcategories" action={<button type="button" onClick={() => runCommand("View all print subcategories")} className="text-xs font-black text-violet-700">View All</button>}>
          <div className="space-y-2">
            {subcategories.map(([label, count]) => (
              <button
                key={String(label)}
                type="button"
                onClick={() => {
                  setSelectedSubcategory(label)
                  runCommand(`Print subcategory selected: ${label}`)
                }}
                className={cn("flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-black transition", selectedSubcategory === label ? "bg-violet-500/25 text-slate-950" : "bg-white text-slate-800 hover:bg-white/[.07]")}
              >
                <span>{label}</span>
                <span>{count}</span>
              </button>
            ))}
            <button type="button" onClick={() => runCommand("Add print subcategory")} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-50 px-4 py-3 text-sm font-black text-violet-800">
              <Plus className="h-4 w-4" /> Add Subcategory
            </button>
          </div>
        </Panel>

        <Panel
          title={`Advanced Print Results · ${filteredAssets.length} matched`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setViewMode("grid")} className={cn("grid h-9 w-9 place-items-center rounded-xl border", viewMode === "grid" ? "border-cyan-300/40 bg-cyan-50" : "border-slate-200 bg-white/5")}><Grid3X3 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("list")} className={cn("grid h-9 w-9 place-items-center rounded-xl border", viewMode === "list" ? "border-cyan-300/40 bg-cyan-50" : "border-slate-200 bg-white/5")}><List className="h-4 w-4" /></button>
              <button type="button" onClick={onCreatePrint} className="rounded-xl border border-cyan-300/20 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-800">Create matching print asset</button>
            </div>
          }
        >
          <div className="mb-5 rounded-[28px] border border-cyan-300/15 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Live print query</div>
            <div className="mt-1 text-lg font-black text-slate-950">{printOutput} → {selectedCategory} → {selectedSubcategory}</div>
            <div className="mt-1 text-xs font-bold text-slate-800">Purpose: {printPurpose} · Format: {format} · Size: {size} · Status: {status} · Delivery: {printDelivery} · Search: {query.trim() || "No keyword"}</div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-cyan-300/25 bg-cyan-500/8 p-10 text-center">
              <ScanSearch className="mx-auto h-12 w-12 text-cyan-700" />
              <div className="mt-4 text-2xl font-black text-slate-950">No print/offline content matches this command</div>
              <p className="mx-auto mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-950/74">Adjust output, purpose, category, format, size, status, delivery or search keyword — or create a matching print/offline workflow.</p>
              <button type="button" onClick={onCreatePrint} className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-black text-white">Create Print Content</button>
            </div>
          ) : (
            <>
              <div className={cn("grid gap-4", viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1")}>
                {visiblePrintAssets.map((asset) => (
                  <article
                    key={asset.id}
                    className={cn("overflow-hidden rounded-[26px] border bg-white transition hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_24px_70px_rgba(34,211,238,.12)]", selectedAsset.id === asset.id ? "border-violet-300/55" : "border-slate-200", viewMode === "list" && "grid grid-cols-[240px_1fr]")}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssetId(asset.id)
                        runCommand(`Opened print asset: ${asset.name}`)
                      }}
                      className="relative h-32 w-full bg-gradient-to-br from-slate-700 via-blue-900 to-amber-200 text-left"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,.35),transparent_18%),linear-gradient(135deg,rgba(255,255,255,.12),rgba(15,23,42,.08))]" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/40 px-2 py-1 text-[10px] font-black text-slate-950">{asset.format}</span>
                      <span className={cn("absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-black", printStatusClass(asset.status))}>{asset.status}</span>
                    </button>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-slate-950">{asset.name}</div>
                          <div className="mt-1 text-xs font-bold text-slate-800">{asset.category} · {asset.subcategory}</div>
                        </div>
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black text-violet-800">{asset.brand}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-black text-cyan-800">{asset.size}</span>
                        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-800">{asset.dimensions}</span>
                        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-800">{asset.pages} pages</span>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <button type="button" onClick={() => { setSelectedAssetId(asset.id); runCommand(`View print content: ${asset.name}`) }} className="grid h-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-50 text-cyan-800 hover:bg-cyan-50" title="View"><Eye className="h-4 w-4" /></button>
                        <button type="button" onClick={onCreatePrint} className="grid h-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-50 text-violet-800 hover:bg-violet-50" title="Edit"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => runCommand(`Downloaded print asset: ${asset.name}`)} className="grid h-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" title="Download"><Download className="h-4 w-4" /></button>
                        <button type="button" onClick={() => runCommand(`Delete requested for print asset: ${asset.name}`)} className="grid h-10 place-items-center rounded-xl border border-red-300/20 bg-red-500/10 text-red-100 hover:bg-red-500/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-bold text-slate-800">Showing page {printPage} of {printTotalPages} · {filteredAssets.length} result{filteredAssets.length === 1 ? "" : "s"}</div>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={printPage <= 1} onClick={() => setPrintPage((page) => Math.max(1, page - 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5 disabled:opacity-40">‹</button>
                  {Array.from({ length: printTotalPages }).slice(0, 5).map((_, index) => {
                    const page = index + 1
                    return (
                      <button key={page} type="button" onClick={() => setPrintPage(page)} className={cn("grid h-10 w-10 place-items-center rounded-xl border text-sm font-black", printPage === page ? "border-cyan-300/40 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white/5 text-slate-800")}>{page}</button>
                    )
                  })}
                  <button type="button" disabled={printPage >= printTotalPages} onClick={() => setPrintPage((page) => Math.min(printTotalPages, page + 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5 disabled:opacity-40">›</button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </section>

      <Panel title="Content Calendar" action={<button type="button" onClick={() => runCommand("Add print calendar event")} className="text-sm font-black text-violet-700"><Plus className="mr-2 inline h-4 w-4" />Add Event</button>}>
        <div className="grid gap-4 lg:grid-cols-5">
          {[
            ["MON 12", "Brochure Launch", "Corporate Brochure 2025", "Published"],
            ["TUE 13", "Flyer Distribution", "Summer Camp Flyer", "Scheduled"],
            ["WED 14", "Trade Show", "Booth Materials", "Scheduled"],
            ["THU 15", "Mailing Campaign", "Direct Mailer - Q2", "Scheduled"],
            ["FRI 16", "Report Publication", "Annual Report 2025", "Draft"],
          ].map(([day, title, detail, eventStatus]) => (
            <div key={day} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 text-xs font-black uppercase tracking-[.12em] text-slate-800">{day}</div>
              <button type="button" onClick={() => runCommand(`Calendar event opened: ${title}`)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left">
                <div className="text-sm font-black text-slate-950">{title}</div>
                <div className="text-xs font-bold text-slate-700">{detail}</div>
                <span className={cn("mt-3 inline-flex rounded-lg px-2 py-1 text-[10px] font-black", printStatusClass(eventStatus))}>{eventStatus}</span>
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  )
}


type DigitalSubcategoryRecord = {
  id: string
  name: string
  count: number
}

type DigitalCategoryRecord = {
  id: string
  label: string
  countLabel: string
  gradient: string
  subcategories: DigitalSubcategoryRecord[]
}

const DIGITAL_TAXONOMY_STORAGE_KEY = "angelcare_market_os_digital_taxonomy_v1"

const DEFAULT_DIGITAL_CATEGORIES: DigitalCategoryRecord[] = [
  {
    id: "photos-prod-svc",
    label: "PHOTOS PROD/SVC",
    countLabel: "2,245 items",
    gradient: "from-slate-700 to-amber-300",
    subcategories: [
      { id: "academy", name: "ACADEMY", count: 24 },
      { id: "services-b2b", name: "SERVICES B2B", count: 39 },
      { id: "services-b2c", name: "SERVICES B2C", count: 54 },
      { id: "staff-portraits", name: "STAFF & EXPERTS", count: 18 },
      { id: "facilities", name: "FACILITIES & OFFICES", count: 21 },
    ],
  },
  {
    id: "publication-reels",
    label: "PUBLICATION REELS",
    countLabel: "1,320 items",
    gradient: "from-blue-900 to-slate-100",
    subcategories: [
      { id: "instagram-reels", name: "INSTAGRAM REELS", count: 44 },
      { id: "linkedin-short-video", name: "LINKEDIN SHORT VIDEO", count: 27 },
      { id: "academy-reels", name: "ACADEMY REELS", count: 19 },
      { id: "b2b-reels", name: "B2B PARTNERSHIP REELS", count: 31 },
    ],
  },
  {
    id: "publication-stories",
    label: "PUBLICATION STORIES",
    countLabel: "3,120 items",
    gradient: "from-slate-100 to-blue-200",
    subcategories: [
      { id: "daily-stories", name: "DAILY STORIES", count: 92 },
      { id: "event-stories", name: "EVENT STORIES", count: 48 },
      { id: "testimonial-stories", name: "TESTIMONIAL STORIES", count: 36 },
      { id: "campaign-stories", name: "CAMPAIGN STORIES", count: 64 },
    ],
  },
  {
    id: "publications-image",
    label: "PUBLICATIONS IMAGE",
    countLabel: "4,560 items",
    gradient: "from-amber-800 to-slate-200",
    subcategories: [
      { id: "social-posts", name: "SOCIAL POSTS", count: 245 },
      { id: "carousels", name: "CAROUSELS", count: 118 },
      { id: "ads-static", name: "ADS STATIC", count: 96 },
      { id: "infographics", name: "INFOGRAPHICS", count: 93 },
    ],
  },
  {
    id: "publications-videos",
    label: "PUBLICATIONS VIDÉOS",
    countLabel: "2,780 items",
    gradient: "from-cyan-900 to-blue-400",
    subcategories: [
      { id: "youtube", name: "YOUTUBE", count: 32 },
      { id: "explainer", name: "EXPLAINER VIDEOS", count: 41 },
      { id: "training-video", name: "TRAINING VIDEOS", count: 57 },
      { id: "event-video", name: "EVENT VIDEOS", count: 29 },
    ],
  },
  {
    id: "ressource-internes",
    label: "RESSOURCE INTERNES",
    countLabel: "1,560 items",
    gradient: "from-slate-700 to-amber-200",
    subcategories: [
      { id: "brand-sop", name: "BRAND SOP", count: 15 },
      { id: "academy-internal", name: "ACADEMIE INTERNE", count: 73 },
      { id: "staff-guides", name: "STAFF GUIDES", count: 42 },
      { id: "templates-internal", name: "INTERNAL TEMPLATES", count: 38 },
    ],
  },
  {
    id: "videos-ads-promo",
    label: "VIDÉOS ADS PROMOTIONNELLES",
    countLabel: "890 items",
    gradient: "from-orange-900 to-slate-200",
    subcategories: [
      { id: "b2b-ads", name: "B2B ADS", count: 28 },
      { id: "b2c-ads", name: "B2C ADS", count: 35 },
      { id: "retargeting", name: "RETARGETING VIDEOS", count: 22 },
      { id: "seasonal", name: "SEASONAL PROMOS", count: 17 },
    ],
  },
]

function loadDigitalTaxonomy(): DigitalCategoryRecord[] {
  if (typeof window === "undefined") return DEFAULT_DIGITAL_CATEGORIES
  try {
    const stored = window.localStorage.getItem(DIGITAL_TAXONOMY_STORAGE_KEY)
    if (!stored) return DEFAULT_DIGITAL_CATEGORIES
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_DIGITAL_CATEGORIES
  } catch {
    return DEFAULT_DIGITAL_CATEGORIES
  }
}

function saveDigitalTaxonomy(categories: DigitalCategoryRecord[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DIGITAL_TAXONOMY_STORAGE_KEY, JSON.stringify(categories))
  window.dispatchEvent(new CustomEvent("market-os-digital-taxonomy-updated", { detail: { at: Date.now() } }))
}


const DIGITAL_OUTPUT_TYPES = [
  "Photos produits ou service",
  "Publication Reel",
  "publication story",
  "publication image",
  "publication vidéo",
  "vidéos ads promototionnel",
  "Social post",
  "Carousel",
  "Reel brief",
  "Ad creative",
  "Landing section",
  "Email creative",
  "WhatsApp visual",
  "Web banner",
]

const DIGITAL_RELATED_SERVICES = [
  "A.A ANGELCARE ACADEMY",
  "S.L ANIMATION LUDIQUE MONTESSORI À DOMICILE",
  "H.S GARDE ACCOMPAGENEMENT ENFANTS À DOMICILE",
  "P.P ACCOMPAGNEMENT POST PARTUM",
  "S.K GARDE ACCOMPAGNEMENT ENFANT SPEÉCIALE",
  "K.E EVENEMENT POUR ENFANT",
  "F.C PROGRAME FLASHCARTES",
]

const DIGITAL_WORKSPACE_STORAGE_KEY = "angelcare_market_os_digital_workspace_live_v1"

function readDigitalWorkspaceState() {
  if (typeof window === "undefined") {
    return { output: DIGITAL_OUTPUT_TYPES[0], service: DIGITAL_RELATED_SERVICES[0], status: "All Status", channel: "All Channels", query: "" }
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DIGITAL_WORKSPACE_STORAGE_KEY) || "{}")
    return {
      output: parsed.output || DIGITAL_OUTPUT_TYPES[0],
      service: parsed.service || DIGITAL_RELATED_SERVICES[0],
      status: parsed.status || "All Status",
      channel: parsed.channel || "All Channels",
      query: parsed.query || "",
    }
  } catch {
    return { output: DIGITAL_OUTPUT_TYPES[0], service: DIGITAL_RELATED_SERVICES[0], status: "All Status", channel: "All Channels", query: "" }
  }
}

function saveDigitalWorkspaceState(state: { output: string; service: string; status: string; channel: string; query: string }) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DIGITAL_WORKSPACE_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent("market-os-digital-workspace-updated", { detail: { state, at: Date.now() } }))
}

function DigitalAssetWorkspace({
  runCommand,
  onCreateDigital,
}: {
  runCommand: (label: string) => void
  onCreateDigital: () => void
}) {
  const workspaceInitial = readDigitalWorkspaceState()
  const [selectedOutput, setSelectedOutput] = useState(workspaceInitial.output)
  const [selectedService, setSelectedService] = useState(workspaceInitial.service)
  const [digitalStatus, setDigitalStatus] = useState(workspaceInitial.status)
  const [digitalChannel, setDigitalChannel] = useState(workspaceInitial.channel)
  const [digitalQuery, setDigitalQuery] = useState(workspaceInitial.query)
  const [digitalPage, setDigitalPage] = useState(1)
  const digitalPageSize = 8
  const [categories, setCategories] = useState<DigitalCategoryRecord[]>(() => loadDigitalTaxonomy())
  const [activeCategoryId, setActiveCategoryId] = useState(() => loadDigitalTaxonomy()[0]?.id || "photos-prod-svc")
  const [digitalCategoryFilter, setDigitalCategoryFilter] = useState("All Categories")
  const [digitalSubcategoryFilter, setDigitalSubcategoryFilter] = useState("All Subcategories")
  const [activeSubcategory, setActiveSubcategory] = useState("ACADEMY")
  const [selectedAsset, setSelectedAsset] = useState("academy_overview_banner.jpg")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [assetStatus, setAssetStatus] = useState("Approved")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DigitalCategoryRecord | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<DigitalSubcategoryRecord | null>(null)

  const activeCategory = categories.find((item) => item.id === activeCategoryId) || categories[0]
  const subcategories = activeCategory?.subcategories || []

  function activateCategory(category: DigitalCategoryRecord) {
    setActiveCategoryId(category.id)
    setDigitalCategoryFilter(category.label)
    setDigitalSubcategoryFilter("All Subcategories")
    setActiveSubcategory(category.subcategories[0]?.name || "Uncategorized")
    runCommand(`Digital category opened: ${category.label}`)
  }

  function upsertCategory(input: { id?: string; label: string; countLabel: string; gradient: string; subcategories: DigitalSubcategoryRecord[] }) {
    const id = input.id || input.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `category-${Date.now()}`
    const nextCategory: DigitalCategoryRecord = {
      id,
      label: input.label.toUpperCase(),
      countLabel: input.countLabel || "0 items",
      gradient: input.gradient || "from-violet-900 to-cyan-300",
      subcategories: input.subcategories.length ? input.subcategories : [{ id: `${id}-general`, name: "GENERAL", count: 0 }],
    }
    const exists = categories.some((item) => item.id === id)
    const next = exists ? categories.map((item) => item.id === id ? nextCategory : item) : [nextCategory, ...categories]
    setCategories(next)
    saveDigitalTaxonomy(next)
    setActiveCategoryId(nextCategory.id)
    setActiveSubcategory(nextCategory.subcategories[0]?.name || "GENERAL")
    setModalOpen(false)
    setEditingCategory(null)
    runCommand(`${exists ? "Category updated" : "New category created"}: ${nextCategory.label}`)
  }

  function deleteCategory(categoryId: string) {
    const target = categories.find((item) => item.id === categoryId)
    const next = categories.filter((item) => item.id !== categoryId)
    if (!next.length) {
      runCommand("At least one category must remain")
      return
    }
    setCategories(next)
    saveDigitalTaxonomy(next)
    if (activeCategoryId === categoryId) {
      setActiveCategoryId(next[0].id)
      setActiveSubcategory(next[0].subcategories[0]?.name || "GENERAL")
    }
    runCommand(`Category deleted: ${target?.label || categoryId}`)
  }

  function upsertSubcategory(input: { id?: string; name: string; count: number }) {
    if (!activeCategory) return
    const subId = input.id || `${activeCategory.id}-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || Date.now()}`
    const nextSub: DigitalSubcategoryRecord = { id: subId, name: input.name.toUpperCase(), count: Number(input.count || 0) }
    const exists = activeCategory.subcategories.some((item) => item.id === subId)
    const nextCategories = categories.map((category) => {
      if (category.id !== activeCategory.id) return category
      return {
        ...category,
        subcategories: exists
          ? category.subcategories.map((item) => item.id === subId ? nextSub : item)
          : [nextSub, ...category.subcategories],
      }
    })
    setCategories(nextCategories)
    saveDigitalTaxonomy(nextCategories)
    setActiveSubcategory(nextSub.name)
    setEditingSubcategory(null)
    runCommand(`${exists ? "Subcategory updated" : "Subcategory added"}: ${nextSub.name}`)
  }

  function deleteSubcategory(subcategoryId: string) {
    if (!activeCategory) return
    const target = activeCategory.subcategories.find((item) => item.id === subcategoryId)
    const nextSubcategories = activeCategory.subcategories.filter((item) => item.id !== subcategoryId)
    const safeSubcategories = nextSubcategories.length ? nextSubcategories : [{ id: `${activeCategory.id}-general`, name: "GENERAL", count: 0 }]
    const nextCategories = categories.map((category) =>
      category.id === activeCategory.id ? { ...category, subcategories: safeSubcategories } : category
    )
    setCategories(nextCategories)
    saveDigitalTaxonomy(nextCategories)
    setActiveSubcategory(safeSubcategories[0]?.name || "GENERAL")
    runCommand(`Subcategory deleted: ${target?.name || subcategoryId}`)
  }

  const assets = [
    ["academy_overview_banner.jpg", "2.4 MB · JPG", "Approved", "image"],
    ["training_session_01.mp4", "45.6 MB · MP4", "Published", "video"],
    ["course_guide_v2.pdf", "3.1 MB · PDF", "In Review", "doc"],
    ["instructor_profile_03.jpg", "1.8 MB · JPG", "Approved", "image"],
    ["academy_intro_video.mp4", "65.3 MB · MP4", "Published", "video"],
    ["student_success_story.jpg", "2.2 MB · JPG", "Approved", "image"],
    ["program_highlights.pdf", "4.7 MB · PDF", "Published", "doc"],
    ["learning_materials.zip", "12.8 MB · ZIP", "Draft", "zip"],
  ]

  const kpis = [
    ["Total Assets", "12,458", "+ 23% vs last month", ShieldCheck, "rose"],
    ["In Review", "256", "+ 8% vs last month", ClipboardCheck, "blue"],
    ["Approved", "9,842", "+31% vs last month", CheckCircle2, "emerald"],
    ["Published", "8,107", "+18% vs last month", FileImage, "cyan"],
    ["Total Engagement", "2.4M", "+27% vs last month", Users, "amber"],
    ["Storage Used", "68%", "342 GB / 500 GB", Palette, "violet"],
  ] as const

  function digitalStatusClass(status: string) {
    if (status === "Approved") return "bg-emerald-50 text-emerald-800 border border-emerald-200"
    if (status === "Published") return "bg-cyan-50 text-cyan-800"
    if (status === "In Review") return "bg-amber-500/20 text-amber-800"
    return "bg-slate-500/20 text-slate-900"
  }


  function updateDigitalWorkspace(next: Partial<{ output: string; service: string; status: string; channel: string; query: string }>) {
    const state = {
      output: next.output ?? selectedOutput,
      service: next.service ?? selectedService,
      status: next.status ?? digitalStatus,
      channel: next.channel ?? digitalChannel,
      query: next.query ?? digitalQuery,
    }
    setSelectedOutput(state.output)
    setSelectedService(state.service)
    setDigitalStatus(state.status)
    setDigitalChannel(state.channel)
    setDigitalQuery(state.query)
    saveDigitalWorkspaceState(state)
    setDigitalPage(1)
  }

  const syncedDigitalAssets = assets
    .map((asset, index) => ({
      name: asset[0] as string,
      meta: asset[1] as string,
      status: asset[2] as string,
      type: asset[3] as string,
      output: DIGITAL_OUTPUT_TYPES[index % DIGITAL_OUTPUT_TYPES.length],
      service: DIGITAL_RELATED_SERVICES[index % DIGITAL_RELATED_SERVICES.length],
      channel: ["Instagram", "Facebook", "LinkedIn", "Website", "Email", "WhatsApp"][index % 6],
      readiness: [92, 84, 76, 98, 67, 89, 72, 58][index % 8],
      owner: ["Imane L.", "Salma El Alami", "Omar K.", "Creative Team"][index % 4],
      category: categories[index % Math.max(categories.length, 1)]?.label || "Unassigned",
      subcategory:
        categories[index % Math.max(categories.length, 1)]?.subcategories?.[
          index % Math.max(categories[index % Math.max(categories.length, 1)]?.subcategories?.length || 1, 1)
        ]?.name || "General",
    }))
    .filter((asset) => {
      const query = digitalQuery.trim().toLowerCase()
      const matchesOutput = selectedOutput === "All Digital Outputs" || asset.output === selectedOutput
      const matchesService = selectedService === "All AngelCare Services" || asset.service === selectedService
      const matchesStatus = digitalStatus === "All Status" || asset.status === digitalStatus
      const matchesChannel = digitalChannel === "All Channels" || asset.channel === digitalChannel
      const matchesCategory = digitalCategoryFilter === "All Categories" || asset.category === digitalCategoryFilter
      const matchesSubcategory = digitalSubcategoryFilter === "All Subcategories" || asset.subcategory === digitalSubcategoryFilter
      const matchesQuery = !query || [asset.name, asset.output, asset.service, asset.channel, asset.owner, asset.category, asset.subcategory].join(" ").toLowerCase().includes(query)
      return matchesOutput && matchesService && matchesStatus && matchesChannel && matchesCategory && matchesSubcategory && matchesQuery
    })

  const digitalReadiness = syncedDigitalAssets.length
    ? Math.round(syncedDigitalAssets.reduce((sum, asset) => sum + asset.readiness, 0) / syncedDigitalAssets.length)
    : 0

  const digitalServiceIsSelected = selectedService !== "All AngelCare Services"
  const digitalTotalPages = Math.max(1, Math.ceil(syncedDigitalAssets.length / digitalPageSize))
  const visibleDigitalAssets = syncedDigitalAssets.slice((digitalPage - 1) * digitalPageSize, digitalPage * digitalPageSize)

  const digitalCommandCards = [
    { label: "Matched assets", value: String(syncedDigitalAssets.length), detail: "filtered live workspace", icon: FileImage, tone: "cyan" as Tone },
    { label: "Readiness", value: `${digitalReadiness}%`, detail: "production confidence", icon: BadgeCheck, tone: "emerald" as Tone },
    { label: "Selected output", value: selectedOutput.split(" ").slice(0, 2).join(" "), detail: selectedOutput, icon: MonitorPlay, tone: "violet" as Tone },
    { label: "Related offer", value: selectedService.split(" ")[0], detail: selectedService, icon: BriefcaseBusiness, tone: "amber" as Tone },
  ]

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[34px] border border-cyan-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-700">Digital content execution cockpit</div>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Digital Workspace · Live Output + Service Control</h2>
            <p className="mt-2 max-w-4xl text-sm font-bold text-slate-800">
              Built on the exact Digital Create modal parameters: primary output, related AngelCare service/product, channel, status, search, readiness and live execution navigation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onCreateDigital} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_44px_rgba(124,58,237,.26)]">
              <Plus className="h-4 w-4" /> Create Digital Content
            </button>
            <button type="button" onClick={() => updateDigitalWorkspace({ output: DIGITAL_OUTPUT_TYPES[0], service: DIGITAL_RELATED_SERVICES[0], status: "All Status", channel: "All Channels", query: "" })} className="rounded-2xl border border-slate-200 bg-white/[.05] px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">
              Reset Cockpit
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.15fr_1.15fr_1fr_1fr_.75fr_.75fr]">
          <FormSelect label="Primary output" value={selectedOutput} setValue={(value) => updateDigitalWorkspace({ output: value })} options={["All Digital Outputs", ...DIGITAL_OUTPUT_TYPES]} />
          <FormSelect label="Related service / product" value={selectedService} setValue={(value) => updateDigitalWorkspace({ service: value })} options={["All AngelCare Services", ...DIGITAL_RELATED_SERVICES]} />
          <FormSelect
            label="Content category"
            value={digitalCategoryFilter}
            setValue={(value) => {
              setDigitalCategoryFilter(value)
              setDigitalSubcategoryFilter("All Subcategories")
              const category = categories.find((item) => item.label === value)
              if (category) setActiveCategoryId(category.id)
            }}
            options={["All Categories", ...categories.map((item) => item.label)]}
          />
          <FormSelect
            label="Subcategory"
            value={digitalSubcategoryFilter}
            setValue={setDigitalSubcategoryFilter}
            options={[
              "All Subcategories",
              ...(
                digitalCategoryFilter === "All Categories"
                  ? categories.flatMap((item) => item.subcategories.map((sub) => sub.name))
                  : categories.find((item) => item.label === digitalCategoryFilter)?.subcategories.map((sub) => sub.name) || []
              ),
            ]}
          />
          <FormSelect label="Status" value={digitalStatus} setValue={(value) => updateDigitalWorkspace({ status: value })} options={["All Status", "Approved", "Published", "In Review", "Draft"]} />
          <FormSelect label="Channel" value={digitalChannel} setValue={(value) => updateDigitalWorkspace({ channel: value })} options={["All Channels", "Instagram", "Facebook", "LinkedIn", "Website", "Email", "WhatsApp"]} />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
            <input
              value={digitalQuery}
              onChange={(event) => updateDigitalWorkspace({ query: event.target.value })}
              placeholder="Search digital assets by output, service, owner, channel..."
              className="h-13 w-full rounded-2xl border border-cyan-300/20 bg-white pl-12 pr-4 text-sm font-black text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {digitalCommandCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br", toneClasses(card.tone).ring)}>
                      <Icon className="h-4 w-4 text-slate-950" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-lg font-black text-slate-950">{card.value}</div>
                      <div className="truncate text-[10px] font-black uppercase tracking-[.12em] text-slate-700">{card.label}</div>
                    </div>
                  </div>
                  <div className="mt-2 truncate text-[11px] font-bold text-slate-800">{card.detail}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-800">Master digital output categories</div>
          <div className="grid gap-3 lg:grid-cols-6">
            {DIGITAL_OUTPUT_TYPES.slice(0, 6).map((output) => (
              <button
                key={output}
                type="button"
                onClick={() => updateDigitalWorkspace({ output, service: "All AngelCare Services" })}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-left text-xs font-black transition hover:-translate-y-0.5",
                  selectedOutput === output ? "border-cyan-300/45 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-800 hover:border-violet-300/30"
                )}
              >
                {output}
              </button>
            ))}
          </div>
        </div>
      </section>

      {modalOpen && (
        <DigitalCategoryModal
          editingCategory={editingCategory}
          onClose={() => {
            setModalOpen(false)
            setEditingCategory(null)
          }}
          onSave={upsertCategory}
        />
      )}

      {editingSubcategory && (
        <DigitalSubcategoryModal
          subcategory={editingSubcategory.id === "__new__" ? null : editingSubcategory}
          onClose={() => setEditingSubcategory(null)}
          onSave={upsertSubcategory}
        />
      )}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpis.map(([label, value, trend, Icon, tone]) => (
          <button
            key={String(label)}
            onClick={() => runCommand(`Digital KPI opened: ${label}`)}
            className="ultra-card group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/35"
          >
            <div className="flex items-center gap-4">
              <span className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br shadow-lg", toneClasses(tone as Tone).ring)}>
                <Icon className="h-7 w-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-800">{label}</span>
                <span className="block text-3xl font-black text-slate-950">{value}</span>
                <span className="block text-xs font-black text-emerald-700">{trend}</span>
              </span>
            </div>
          </button>
        ))}
      </section>

      <section className="mt-3 grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(430px,.65fr)]">
        <Panel
          title="ADVANCED DIGITAL CATEGORY NAVIGATION"
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => runCommand("Open category command center")} className="rounded-xl border border-cyan-300/25 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-800">Command view</button>
              <button type="button" onClick={() => setViewMode("grid")} className={cn("grid h-10 w-10 place-items-center rounded-xl border", viewMode === "grid" ? "border-cyan-300/35 bg-cyan-50" : "border-slate-200 bg-white/5")}><Grid3X3 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("list")} className={cn("grid h-10 w-10 place-items-center rounded-xl border", viewMode === "list" ? "border-cyan-300/35 bg-cyan-50" : "border-slate-200 bg-white/5")}><List className="h-4 w-4" /></button>
            </div>
          }
        >
          <div className="mb-5 grid gap-3 lg:grid-cols-4">
            {([
              ["Categories", categories.length, "connected to cockpit", FolderKanban, "cyan"],
              ["Selected", selectedOutput, "master output", MonitorPlay, "violet"],
              ["Service", selectedService.split(" ")[0], selectedService, BriefcaseBusiness, "amber"],
              ["Matched", syncedDigitalAssets.length, "live filtered results", ScanSearch, "emerald"],
            ] as const).map(([label, value, detail, Icon, tone]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                <Icon className={cn("h-6 w-6", toneClasses(tone as Tone).text)} />
                <div className="mt-3 truncate text-2xl font-black text-slate-950">{value}</div>
                <div className="text-xs font-black uppercase tracking-[.12em] text-slate-800">{label}</div>
                <div className="mt-1 truncate text-xs font-bold text-slate-800">{detail}</div>
              </div>
            ))}
          </div>

          <div className={cn("grid gap-4", viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1")}>
            {categories.map((category) => {
              const categoryAssets = syncedDigitalAssets.filter((asset) => asset.category === category.label)
              const isActive = digitalCategoryFilter === category.label || activeCategoryId === category.id
              const connectedSubcategories = category.subcategories
              const connectedCount = categoryAssets.length

              return (
                <div
                  key={category.id}
                  className={cn(
                    "group overflow-hidden rounded-[26px] border bg-white transition hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_24px_70px_rgba(34,211,238,.12)]",
                    isActive ? "border-cyan-300/55 shadow-[0_0_38px_rgba(34,211,238,.16)]" : "border-slate-200",
                    viewMode === "list" && "grid grid-cols-[260px_1fr_auto] items-stretch",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(category.id)
                      setDigitalCategoryFilter(category.label)
                      setDigitalSubcategoryFilter("All Subcategories")
                      runCommand(`Category opened from advanced navigation: ${category.label}`)
                    }}
                    className={cn("relative block h-36 w-full bg-gradient-to-br text-left", category.gradient, viewMode === "list" && "h-full min-h-[180px]")}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,.35),transparent_18%),linear-gradient(135deg,rgba(255,255,255,.12),rgba(15,23,42,.08))]" />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {isActive && <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-black text-slate-950">ACTIVE</span>}
                      <span className="rounded-full bg-white/40 px-3 py-1 text-[10px] font-black text-slate-950">{connectedCount} synced</span>
                    </div>
                    <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/35">
                      <Eye className="h-4 w-4 text-slate-950" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="truncate text-sm font-black text-slate-950">{category.label}</div>
                      <div className="mt-1 text-xs font-bold text-slate-950/80">{category.countLabel} · {connectedSubcategories.length} services/subcategories</div>
                    </div>
                  </button>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-black text-slate-950">{category.label}</div>
                        <div className="mt-1 text-xs font-bold text-slate-800">Connected to live output/service cockpit</div>
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-[10px] font-black", isActive ? "bg-cyan-400 text-slate-950" : "bg-slate-200 text-slate-800")}>
                        {isActive ? "ACTIVE" : "READY"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {connectedSubcategories.slice(0, 4).map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setActiveCategoryId(category.id)
                            setDigitalCategoryFilter(category.label)
                            setDigitalSubcategoryFilter(sub.name)
                            runCommand(`Subcategory filtered: ${sub.name}`)
                          }}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[10px] font-black transition",
                            digitalSubcategoryFilter === sub.name ? "bg-cyan-400 text-slate-950" : "bg-violet-50 text-violet-800 hover:bg-violet-500/25"
                          )}
                        >
                          {sub.name} · {sub.count}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategoryId(category.id)
                          setDigitalCategoryFilter(category.label)
                          setDigitalSubcategoryFilter("All Subcategories")
                          runCommand(`Opened category: ${category.label}`)
                        }}
                        className="grid h-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-50 text-cyan-800 hover:bg-cyan-50"
                        title="Open"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(category)
                          setModalOpen(true)
                        }}
                        className="grid h-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-50 text-violet-800 hover:bg-violet-50"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => runCommand(`View category analytics: ${category.label}`)}
                        className="grid h-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        title="View analytics"
                      >
                        <ScanSearch className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category.id)}
                        className="grid h-10 place-items-center rounded-xl border border-red-300/20 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-800">
                        <span>Live match coverage</span>
                        <span>{connectedCount}/{syncedDigitalAssets.length || 0}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${syncedDigitalAssets.length ? Math.min(100, Math.round((connectedCount / syncedDigitalAssets.length) * 100)) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="grid min-h-[330px] place-items-center rounded-[26px] border border-dashed border-cyan-300/25 bg-cyan-500/5 p-6 text-center transition hover:border-cyan-300/45 hover:bg-cyan-50"
            >
              <span>
                <Plus className="mx-auto h-10 w-10 text-cyan-800" />
                <span className="mt-4 block text-base font-black text-slate-950">Add New Category</span>
                <span className="mt-2 block text-xs font-bold text-slate-800">Create category, attach subcategories, and sync to the cockpit</span>
              </span>
            </button>
          </div>
        </Panel>

        <Panel
          title="CONTENT PREVIEW"
          action={<button type="button" onClick={() => runCommand("Open preview fullscreen")} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5 hover:border-cyan-300/35"><Maximize2 className="h-4 w-4" /></button>}
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-blue-900 to-white">
            <div className="grid h-52 place-items-center">
              <div className="rounded-3xl border border-slate-200 bg-slate-200 px-8 py-6 text-center backdrop-blur">
                <ImageIcon className="mx-auto h-14 w-14 text-cyan-800" />
                <div className="mt-3 text-sm font-black text-slate-950">{selectedAsset}</div>
                <div className="mt-1 text-xs font-bold text-slate-800">Preview renderer active</div>
              </div>
            </div>
            <button type="button" onClick={() => runCommand("Previous preview")} className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/35"><ArrowLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => runCommand("Next preview")} className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/35"><ArrowRight className="h-4 w-4" /></button>
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-black text-slate-950">{selectedAsset}</div>
              <div className="mt-1 text-xs font-bold text-slate-800">JPG Image · 2.4 MB · 1920x1080</div>
            </div>
            <select value={assetStatus} onChange={(e) => { setAssetStatus(e.target.value); runCommand(`Status changed to ${e.target.value}`) }} className={cn("rounded-xl border border-slate-200 px-3 py-2 text-sm font-black", digitalStatusClass(assetStatus))}>
              {["Approved", "Published", "In Review", "Draft"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {[
              ["Download", Download],
              ["Assign", Users],
              ["Publish", UploadCloud],
              ["Link", Link2],
              ["Archive", ClipboardCheck],
            ].map(([label, Icon]) => (
              <button key={String(label)} type="button" onClick={() => runCommand(`${label} asset: ${selectedAsset}`)} className="grid h-10 place-items-center rounded-xl border border-slate-200 bg-white hover:border-cyan-300/35 hover:bg-cyan-50">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="mt-5 flex border-b border-slate-200 text-sm font-black">
            {["DETAILS", "METADATA", "ACTIVITY", "VERSIONS"].map((tab, index) => (
              <button key={tab} type="button" onClick={() => runCommand(`Preview tab opened: ${tab}`)} className={cn("px-4 py-3", index === 0 ? "border-b-2 border-violet-400 text-violet-800" : "text-slate-950/68 hover:text-slate-950")}>{tab}</button>
            ))}
          </div>

          <div className="mt-4 space-y-4 text-sm">
            {[
              ["Category", "PHOTOS PROD/SVC"],
              ["Subcategory", activeSubcategory],
              ["Type", "Image"],
              ["Created by", "Imane L."],
              ["Created on", "May 10, 2025 10:30 AM"],
              ["Modified on", "May 13, 2025 02:15 PM"],
              ["Status", assetStatus],
              ["Usage", "Website, Social Media, Ads"],
            ].map(([label, value]) => (
              <div key={String(label)} className="grid grid-cols-[120px_1fr] gap-4">
                <span className="font-bold text-slate-950/68">{label}</span>
                <span className="font-black text-slate-950">{value}</span>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => runCommand(`Edit content: ${selectedAsset}`)} className="mt-5 w-full rounded-2xl border border-violet-400/35 bg-violet-50 px-4 py-4 text-sm font-black text-violet-800 hover:bg-violet-50">
            Edit Content
          </button>
        </Panel>
      </section>

      
            <section className="grid gap-5 2xl:grid-cols-[360px_420px_minmax(0,1fr)]">
        <Panel
          title="1. MASTER OUTPUT"
          action={
            <button
              type="button"
              onClick={() => {
                updateDigitalWorkspace({ output: "All Digital Outputs", service: "All AngelCare Services", status: "All Status", channel: "All Channels", query: "" })
                setDigitalCategoryFilter("All Categories")
                setDigitalSubcategoryFilter("All Subcategories")
              }}
              className="text-xs font-black text-cyan-800"
            >
              Reset
            </button>
          }
        >
          <div className="mb-4 rounded-3xl border border-cyan-300/15 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Choose content family first</div>
            <div className="mt-1 text-2xl font-black text-slate-950">{selectedOutput}</div>
            <div className="mt-1 text-xs font-bold text-slate-800">Each output opens AngelCare service/product subcategories.</div>
          </div>

          <div className="space-y-3">
            {DIGITAL_OUTPUT_TYPES.map((output) => {
              const outputCount = assets.filter((_, index) => DIGITAL_OUTPUT_TYPES[index % DIGITAL_OUTPUT_TYPES.length] === output).length
              return (
                <button
                  key={output}
                  type="button"
                  onClick={() => updateDigitalWorkspace({ output, service: "All AngelCare Services" })}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5",
                    selectedOutput === output ? "border-cyan-300/45 bg-cyan-50 shadow-[0_0_26px_rgba(34,211,238,.12)]" : "border-slate-200 bg-white hover:border-violet-300/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-950">{output}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-800">{outputCount}</span>
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-slate-800">Open services → choose asset scope</div>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel
          title="2. SERVICE / PRODUCT"
          action={<span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black text-violet-800">{DIGITAL_RELATED_SERVICES.length} services</span>}
        >
          <div className="mb-4 rounded-3xl border border-violet-300/15 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Subcategories for selected output</div>
            <div className="mt-1 text-2xl font-black text-slate-950">{selectedService}</div>
            <div className="mt-1 text-xs font-bold text-slate-800">Example: Publication Story → A.A AngelCare Academy → content grid.</div>
          </div>

          <div className="space-y-3">
            {DIGITAL_RELATED_SERVICES.map((service) => {
              const serviceCount = syncedDigitalAssets.filter((asset) => asset.service === service || selectedService === service).length
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => updateDigitalWorkspace({ service })}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5",
                    selectedService === service ? "border-violet-300/45 bg-violet-50 shadow-[0_0_26px_rgba(168,85,247,.14)]" : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-950">{service}</span>
                    <ChevronRight className="h-4 w-4 text-slate-800" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span>Service-linked content scope</span>
                    <span>{serviceCount} assets</span>
                  </div>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel
          title={`3. CONTENT RESULTS · ${selectedOutput} · ${selectedService}`}
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setViewMode("grid")} className={cn("grid h-10 w-10 place-items-center rounded-xl border", viewMode === "grid" ? "border-cyan-300/40 bg-cyan-50" : "border-slate-200 bg-white/5")}><Grid3X3 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("list")} className={cn("grid h-10 w-10 place-items-center rounded-xl border", viewMode === "list" ? "border-cyan-300/40 bg-cyan-50" : "border-slate-200 bg-white/5")}><List className="h-4 w-4" /></button>
              <button type="button" onClick={onCreateDigital} className="rounded-xl border border-cyan-300/25 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-800">Create matching content</button>
            </div>
          }
        >
          {!digitalServiceIsSelected ? (
            <div className="rounded-[32px] border border-dashed border-violet-300/30 bg-violet-500/8 p-10 text-center">
              <BriefcaseBusiness className="mx-auto h-12 w-12 text-violet-800" />
              <div className="mt-4 text-2xl font-black text-slate-950">Choose a service/product to show content</div>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-950/74">
                Select a master output on the left, then choose one AngelCare service/product in the middle. Results, grid/list view, pagination and actions will appear instantly.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 md:grid-cols-4">
                {([
                  ["Results", syncedDigitalAssets.length, "matched content", ScanSearch, "cyan"],
                  ["Output", selectedOutput.split(" ").slice(0, 2).join(" "), selectedOutput, MonitorPlay, "violet"],
                  ["Service", selectedService.split(" ")[0], selectedService, BriefcaseBusiness, "amber"],
                  ["Readiness", `${digitalReadiness}%`, "filtered quality score", BadgeCheck, "emerald"],
                ] as const).map(([label, value, detail, Icon, tone]) => (
                  <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <Icon className={cn("h-6 w-6", toneClasses(tone as Tone).text)} />
                    <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
                    <div className="text-xs font-black uppercase tracking-[.12em] text-slate-800">{label}</div>
                    <div className="mt-1 truncate text-xs font-bold text-slate-800">{detail}</div>
                  </div>
                ))}
              </div>

              <div className={cn("grid gap-4", viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
                {visibleDigitalAssets.length === 0 ? (
                  <div className="col-span-full rounded-[28px] border border-dashed border-cyan-300/25 bg-cyan-500/8 p-8 text-center">
                    <ScanSearch className="mx-auto h-10 w-10 text-cyan-700" />
                    <div className="mt-3 text-lg font-black text-slate-950">No content matches this output + service</div>
                    <p className="mt-1 text-sm font-bold text-slate-800">Create a matching digital content workflow or adjust filters.</p>
                    <button type="button" onClick={onCreateDigital} className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white">
                      Create matching digital content
                    </button>
                  </div>
                ) : visibleDigitalAssets.map((asset) => (
                  <button
                    key={asset.name}
                    type="button"
                    onClick={() => {
                      setSelectedAsset(asset.name)
                      setAssetStatus(asset.status)
                      updateDigitalWorkspace({ output: asset.output, service: asset.service, channel: asset.channel, status: asset.status })
                      runCommand(`Asset selected: ${asset.name}`)
                    }}
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:border-cyan-300/35",
                      selectedAsset === asset.name ? "border-violet-300/55 shadow-[0_0_32px_rgba(124,58,237,.18)]" : "border-slate-200",
                      viewMode === "list" && "grid grid-cols-[180px_1fr_auto] items-center",
                    )}
                  >
                    <div className="relative h-28 bg-gradient-to-br from-slate-700 via-blue-900 to-amber-200">
                      <div className="absolute inset-0 bg-white" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/35 px-2 py-1 text-[10px] font-black text-slate-950">{asset.readiness}% ready</span>
                      {(asset.type === "video" || asset.type === "image") && <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/35"><Eye className="h-4 w-4" /></span>}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-xs font-black text-slate-950">{asset.name} ›</div>
                      <div className="mt-1 text-[11px] font-bold text-slate-800">{asset.meta}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={cn("inline-flex rounded-lg px-2 py-1 text-[10px] font-black", digitalStatusClass(asset.status))}>{asset.status}</span>
                        <span className="rounded-lg bg-cyan-50 px-2 py-1 text-[10px] font-black text-cyan-800">{asset.output}</span>
                      </div>
                      <div className="mt-2 truncate text-[11px] font-bold text-slate-950/68">{asset.service}</div>
                      <div className="mt-1 text-[11px] font-black text-violet-700">{asset.channel} · {asset.owner}</div>
                    </div>
                    {viewMode === "list" && <MoreVertical className="mr-4 h-4 w-4 text-slate-700" />}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-bold text-slate-800">
                  Showing page {digitalPage} of {digitalTotalPages} · {syncedDigitalAssets.length} result{syncedDigitalAssets.length === 1 ? "" : "s"}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={digitalPage <= 1} onClick={() => setDigitalPage((page) => Math.max(1, page - 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5 disabled:opacity-40">‹</button>
                  {Array.from({ length: digitalTotalPages }).slice(0, 5).map((_, index) => {
                    const page = index + 1
                    return (
                      <button key={page} type="button" onClick={() => setDigitalPage(page)} className={cn("grid h-10 w-10 place-items-center rounded-xl border text-sm font-black", digitalPage === page ? "border-cyan-300/40 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white/5 text-slate-800")}>
                        {page}
                      </button>
                    )
                  })}
                  <button type="button" disabled={digitalPage >= digitalTotalPages} onClick={() => setDigitalPage((page) => Math.min(digitalTotalPages, page + 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5 disabled:opacity-40">›</button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </section>
    </section>
  )
}


function DigitalCategoryModal({
  editingCategory,
  onClose,
  onSave,
}: {
  editingCategory?: DigitalCategoryRecord | null
  onClose: () => void
  onSave: (input: { id?: string; label: string; countLabel: string; gradient: string; subcategories: DigitalSubcategoryRecord[] }) => void
}) {
  const [label, setLabel] = useState(editingCategory?.label || "")
  const [countLabel, setCountLabel] = useState(editingCategory?.countLabel || "0 items")
  const [gradient, setGradient] = useState(editingCategory?.gradient || "from-violet-900 to-cyan-300")
  const [subInput, setSubInput] = useState(
    editingCategory?.subcategories?.length
      ? editingCategory.subcategories.map((item) => `${item.name}, ${item.count}`).join("\n")
      : "GENERAL, 0\nCAMPAIGN ASSETS, 0\nAPPROVAL READY, 0"
  )

  const subcategories = subInput
    .split("\\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name = "GENERAL", count = "0"] = line.split(",").map((item) => item.trim())
      const cleanName = name.toUpperCase()
      return {
        id: `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
        name: cleanName,
        count: Number(count || 0),
      }
    })

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-[32px] border border-cyan-300/20 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-700">Digital taxonomy builder</div>
            <h2 className="mt-1 text-3xl font-black text-slate-950">{editingCategory ? "Edit Category + Subcategories" : "Create Category + Subcategories"}</h2>
            <p className="mt-1 text-sm font-bold text-slate-800">Creates a live in-page category, immediately filters subcategories, and persists the taxonomy in browser storage.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white/5 px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-50">Close</button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Category name</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Example: PUBLICATIONS CAROUSELS" className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Count label</span>
              <input value={countLabel} onChange={(e) => setCountLabel(e.target.value)} placeholder="Example: 450 items" className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Visual gradient</span>
              <select value={gradient} onChange={(e) => setGradient(e.target.value)} className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none">
                <option value="from-violet-900 to-cyan-300">Violet / Cyan</option>
                <option value="from-amber-900 to-slate-200">Amber / Slate</option>
                <option value="from-blue-900 to-emerald-300">Blue / Emerald</option>
                <option value="from-rose-900 to-orange-300">Rose / Orange</option>
                <option value="from-slate-100 to-blue-200">Slate / Blue</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Subcategories — one per line: name, count</span>
            <textarea value={subInput} onChange={(e) => setSubInput(e.target.value)} className="min-h-[226px] rounded-2xl border border-cyan-300/20 bg-white p-4 text-sm font-black text-slate-950 outline-none" />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-xs font-black uppercase tracking-[.14em] text-cyan-700">Live preview</div>
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-violet-300/30 bg-white">
              <div className={cn("h-28 bg-gradient-to-br", gradient)} />
              <div className="p-4">
                <div className="text-sm font-black text-slate-950">{label || "NEW CATEGORY"}</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{countLabel}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <span key={sub.id} className="rounded-xl border border-cyan-300/20 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800">
                  {sub.name} · {sub.count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white/5 px-5 py-3 text-sm font-black text-slate-950">Cancel</button>
          <button
            type="button"
            disabled={!label.trim()}
            onClick={() => onSave({ id: editingCategory?.id, label, countLabel, gradient, subcategories })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-[0_18px_44px_rgba(124,58,237,.26)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save className="h-4 w-4" /> {editingCategory ? "Save Category Changes" : "Create Live Category"}
          </button>
        </div>
      </div>
    </div>
  )
}


function DigitalSubcategoryModal({
  subcategory,
  onClose,
  onSave,
}: {
  subcategory?: DigitalSubcategoryRecord | null
  onClose: () => void
  onSave: (input: { id?: string; name: string; count: number }) => void
}) {
  const [name, setName] = useState(subcategory?.name || "")
  const [count, setCount] = useState(String(subcategory?.count ?? 0))

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[28px] border border-cyan-300/20 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-700">Subcategory manager</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{subcategory ? "Edit Subcategory" : "Add Subcategory"}</h2>
            <p className="mt-1 text-sm font-bold text-slate-800">Manage the active category’s subcategory list and sync instantly in-page.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5 text-slate-950 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Subcategory name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Example: ACADEMY" className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Content count</span>
            <input value={count} onChange={(e) => setCount(e.target.value)} type="number" min="0" className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white/5 px-5 py-3 text-sm font-black text-slate-950">Cancel</button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => onSave({ id: subcategory?.id, name, count: Number(count || 0) })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-[0_18px_44px_rgba(124,58,237,.26)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save className="h-4 w-4" /> Save Subcategory
          </button>
        </div>
      </div>
    </div>
  )
}


type CreateContentTypeRecord = {
  id: string
  label: string
  short: string
  tone: Tone
  icon: any
  channels: string[]
  outputs: string[]
  scenarios: string[]
  coverage: string[]
}

const CREATE_CONTENT_TYPES: CreateContentTypeRecord[] = [
  {
    id: "digital-content",
    label: "Digital content",
    short: "Create digital-first assets for social media, website, ads, landing pages, email, WhatsApp, and online acquisition.",
    tone: "blue",
    icon: MonitorPlay,
    channels: ["Instagram", "Facebook", "LinkedIn", "Website", "Email", "WhatsApp", "Google Ads"],
    outputs: [
      "Social post",
      "Photos produits ou service",
      "Publication Reel",
      "publication story",
      "publication image",
      "publication vidéo",
      "vidéos ads promototionnel",
      "Landing page visual",
      "Email creative",
      "WhatsApp asset",
    ],
    scenarios: ["Market activation", "Lead generation", "Parent awareness", "B2B preschool partnerships"],
    coverage: ["Output", "Related service / product", "Channel", "Audience", "Objective", "Brief", "Tasks", "Comments"],
  },
  {
    id: "print-offline",
    label: "Print & Offline Content",
    short: "Create print-ready and offline assets for brochures, catalogs, flyers, prospectus, packaging, events and field distribution.",
    tone: "amber",
    icon: Printer,
    channels: ["Print Shop", "In-house Print", "PDF Export", "Event Distribution", "Sales Handout", "Direct Mail"],
    outputs: [
      "Brochure",
      "Catalog",
      "Flyer",
      "Prospectus",
      "Business Card",
      "Poster",
      "Packaging",
      "Stationery",
      "Report",
      "Rollup",
      "Direct Mailer",
      "Packaging Insert",
    ],
    scenarios: [
      "Corporate brochure for B2B meeting",
      "Nursery partnership prospectus",
      "Event flyer and handout",
      "Sales catalog for field team",
      "Internal training print pack",
    ],
    coverage: ["Format", "Size", "Print quantity", "Paper stock", "Finishing", "Distribution owner", "Approval status"],
  },
  {
    id: "corporate-docs",
    label: "Corporate Docs",
    short: "Policies, governance, company documents, SOPs, executive notes and formal records.",
    tone: "slate",
    icon: FileText,
    channels: ["Internal Workspace", "PDF Export", "Email", "Leadership Review"],
    outputs: ["Policy", "SOP", "Executive memo", "Company profile", "Governance document"],
    scenarios: ["Internal governance", "Executive alignment", "Operational documentation", "Policy control"],
    coverage: ["Owner", "Version", "Confidentiality", "Approval flow"],
  },
  {
    id: "sales-enablement",
    label: "Sales Enablement",
    short: "Decks, one-pagers, proof sheets, objection support and B2B conversion material.",
    tone: "emerald",
    icon: BriefcaseBusiness,
    channels: ["Sales Portal", "Email", "WhatsApp", "Print", "B2B Meeting"],
    outputs: ["Sales deck", "One-pager", "Proof sheet", "Proposal support", "Objection response"],
    scenarios: ["B2B acquisition", "Nursery partnership", "Corporate account conversion", "Sales follow-up"],
    coverage: ["Sales stage", "Offer", "CTA", "Decision maker", "Proof"],
  },
  {
    id: "events-exhibitions",
    label: "Events & Exhibitions",
    short: "Event booths, signage, invitations, schedules, banners and activation material.",
    tone: "rose",
    icon: CalendarDays,
    channels: ["Event Venue", "Print Shop", "Email", "Social Media", "Field Team"],
    outputs: ["Invitation", "Booth design", "Signage", "Event flyer", "Program"],
    scenarios: ["Open day", "Kids event", "Preschool partnership event", "Exhibition"],
    coverage: ["Event date", "Location", "Logistics", "Print run", "Staff owner"],
  },
  {
    id: "multimedia",
    label: "Multimedia",
    short: "Video, photography, reels, motion graphics, audio and visual storytelling assets.",
    tone: "violet",
    icon: Video,
    channels: ["Instagram", "Facebook", "YouTube", "Website", "Ads"],
    outputs: ["Video", "Reel", "Photo set", "Motion graphic", "Audio clip"],
    scenarios: ["Brand awareness", "Campaign production", "Service explanation", "Testimonials"],
    coverage: ["Script", "Shot list", "Format", "Duration", "Distribution"],
  },
  {
    id: "merch-swag",
    label: "Merch & Swag",
    short: "Branded objects, staff kits, event gifts, uniforms, labels and physical brand assets.",
    tone: "amber",
    icon: Boxes,
    channels: ["Supplier", "Events", "Staff", "B2B Gifts"],
    outputs: ["T-shirt", "Badge", "Gift kit", "Bag", "Sticker", "Uniform"],
    scenarios: ["Event activation", "Staff branding", "Client gifting", "Partner onboarding"],
    coverage: ["Supplier", "Quantity", "Size", "Cost", "Delivery"],
  },
  {
    id: "internal-communications",
    label: "Internal Communications",
    short: "Internal announcements, HR notes, training communication and operational alignment.",
    tone: "cyan",
    icon: MessageSquareText,
    channels: ["Email", "Internal Workspace", "WhatsApp", "Printed notice"],
    outputs: ["Announcement", "Memo", "Training note", "Staff briefing"],
    scenarios: ["HR communication", "Policy update", "Team alignment", "Training rollout"],
    coverage: ["Audience", "Urgency", "Owner", "Acknowledgement"],
  },
  {
    id: "templates",
    label: "Templates",
    short: "Reusable templates for brand-safe production, briefs, reports, emails and print layouts.",
    tone: "violet",
    icon: LayoutTemplate,
    channels: ["Content Library", "Design System", "Internal Workspace"],
    outputs: ["Brief template", "Design template", "Email template", "Report template", "Print layout"],
    scenarios: ["Reusable production", "Brand consistency", "Fast execution", "Team standardization"],
    coverage: ["Template type", "Owner", "Version", "Usage rules"],
  },
] 

const PRINT_OFFLINE_PURPOSES = [
  "Brand Awareness",
  "B2B Sales",
  "Events",
  "Internal Training",
  "Customer Education",
  "Partnership",
  "Product Promotion",
]

const PRINT_OFFLINE_FORMATS = ["PDF", "AI", "PSD", "INDD", "PNG", "JPG", "SVG"]
const PRINT_OFFLINE_SIZES = ["A4", "A5", "Business Card", "Rollup", "Poster A3", "Custom"]
const PRINT_OFFLINE_QUANTITIES = ["Digital only", "25", "50", "100", "250", "500", "1000", "Custom"]


type ContentTaskStatus = "active" | "review" | "done"

type ContentRelatedTask = {
  id: string
  title: string
  status: ContentTaskStatus
  owner: string
  dueDate: string
  priority: "Low" | "Medium" | "High"
  description: string
}

type ContentComment = {
  id: string
  author: string
  role: string
  audience: string
  message: string
  sentiment: "question" | "approval" | "note" | "coordination"
  createdAt: string
  pinned: boolean
}

const CONTENT_MODAL_RUNTIME_STORAGE_KEY = "angelcare_content_modal_runtime_v1"



function readContentRuntime(contentTypeId: string): { tasks: ContentRelatedTask[]; comments: ContentComment[] } {
  if (typeof window === "undefined") return { tasks: [], comments: [] }
  try {
    const raw = window.localStorage.getItem(`${CONTENT_MODAL_RUNTIME_STORAGE_KEY}_${contentTypeId}`)
    if (!raw) return { tasks: [], comments: [] }
    const parsed = JSON.parse(raw)
    return {
      tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : [],
      comments: Array.isArray(parsed?.comments) ? parsed.comments : [],
    }
  } catch {
    return { tasks: [], comments: [] }
  }
}

function writeContentRuntime(contentTypeId: string, data: { tasks: ContentRelatedTask[]; comments: ContentComment[] }) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(`${CONTENT_MODAL_RUNTIME_STORAGE_KEY}_${contentTypeId}`, JSON.stringify(data))
}

function buildNewContentTask(record: Pick<CreateContentTypeRecord, "label" | "outputs">, index: number): ContentRelatedTask {
  return {
    id: `task-${Date.now()}-${index}`,
    title: `${record.label} production task ${index + 1}`,
    status: "active",
    owner: "Marketing Team",
    dueDate: "This week",
    priority: "High",
    description: `Create, review and prepare ${record.outputs?.[0] || "content"} for execution.`,
  }
}


const TEMPLATE_EDIT_FAMILIES = ["Digital content", "Print & Offline Content", "Corporate Docs", "Templates"]

const TEMPLATE_DIGITAL_CATEGORIES = [
  "Photos produits ou service",
  "Publication Reel",
  "publication story",
  "publication image",
  "publication vidéo",
  "vidéos ads promototionnel",
]

const TEMPLATE_DIGITAL_SUBCATEGORIES = [
  "A.A ANGELCARE ACADEMY",
  "S.L ANIMATION LUDIQUE MONTESSORI À DOMICILE",
  "H.S GARDE ACCOMPAGENEMENT ENFANTS À DOMICILE",
  "P.P ACCOMPAGNEMENT POST PARTUM",
  "S.K GARDE ACCOMPAGNEMENT ENFANT SPEÉCIALE",
  "K.E EVENEMENT POUR ENFANT",
  "F.C PROGRAME FLASHCARTES",
]

const TEMPLATE_PRINT_CATEGORIES = [
  "Brochure",
  "Catalog",
  "Flyer",
  "Prospectus",
  "Business Card",
  "Poster",
  "Packaging",
  "Stationery",
  "Report",
  "Rollup",
  "Direct Mailer",
  "Packaging Insert",
]

const TEMPLATE_PRINT_SUBCATEGORIES = [
  "Corporate",
  "Marketing",
  "Product",
  "Sales",
  "HR & Internal",
  "Events",
  "Clients",
  "Partnerships",
]

const TEMPLATE_CORPORATE_CATEGORIES = [
  "Policy",
  "SOP",
  "Executive memo",
  "Company profile",
  "Governance document",
  "Guide",
  "Agreement",
  "Form",
  "Presentation",
  "Report template",
]

const TEMPLATE_CORPORATE_SUBCATEGORIES = [
  "Governance & Policies",
  "Human Resources",
  "Operations",
  "Finance & Legal",
  "Quality & Compliance",
  "IT & Security",
  "Marketing & Brand",
  "Sales & Commercial",
  "Products & Services",
  "Training & Development",
  "Facilities & Maintenance",
]

const TEMPLATE_NATIVE_CATEGORIES = [
  "Brief template",
  "Design template",
  "Email template",
  "Report template",
  "Print layout",
  "Workflow template",
  "Checklist template",
  "Approval template",
]

const TEMPLATE_NATIVE_SUBCATEGORIES = [
  "Briefing",
  "Design system",
  "Reporting",
  "Email",
  "Print layout",
  "Workflow",
  "Governance",
  "Automation",
]

function templateCategoriesForFamily(family: string) {
  if (family === "Digital content") return TEMPLATE_DIGITAL_CATEGORIES
  if (family === "Print & Offline Content") return TEMPLATE_PRINT_CATEGORIES
  if (family === "Corporate Docs") return TEMPLATE_CORPORATE_CATEGORIES
  return TEMPLATE_NATIVE_CATEGORIES
}

function templateSubcategoriesForFamily(family: string) {
  if (family === "Digital content") return TEMPLATE_DIGITAL_SUBCATEGORIES
  if (family === "Print & Offline Content") return TEMPLATE_PRINT_SUBCATEGORIES
  if (family === "Corporate Docs") return TEMPLATE_CORPORATE_SUBCATEGORIES
  return TEMPLATE_NATIVE_SUBCATEGORIES
}

function templateModalParamsForFamily(family: string) {
  if (family === "Digital content") return ["primaryOutput", "relatedServiceProduct", "channel", "audience", "objective", "brief", "tasks", "comments"]
  if (family === "Print & Offline Content") return ["output", "purpose", "format", "size", "quantity", "deliveryMode", "status", "approval"]
  if (family === "Corporate Docs") return ["category", "subcategory", "documentType", "version", "owner", "approvalFlow", "confidentiality"]
  return ["templateType", "usageRules", "owner", "version", "lifecycle", "tasks", "comments"]
}


function AdvancedCreateContentModal({
  contentType,
  onClose,
  onSubmit,
  editPayload,
  onSaved,
}: {
  contentType: string
  onClose: () => void
  onSubmit: (title: string) => void
  editPayload?: TemplateEditPayload | null
  onSaved?: (payload: TemplateEditPayload) => void
}) {
  const record = CREATE_CONTENT_TYPES.find((item) => item.id === contentType) || CREATE_CONTENT_TYPES[0]
  const taskContextRecord = record
  const Icon = record.icon
  const [title, setTitle] = useState(editPayload?.name || "")
  const [audience, setAudience] = useState("B2B kindergarten / preschool")
  const [objective, setObjective] = useState("Lead generation and market activation")
  const [output, setOutput] = useState(editPayload?.output || record.outputs[0])
  const [relatedDigitalService, setRelatedDigitalService] = useState(DIGITAL_RELATED_SERVICES[0])
  const [channel, setChannel] = useState(editPayload?.channel || record.channels[0])
  const [printPurpose, setPrintPurpose] = useState(PRINT_OFFLINE_PURPOSES[0])
  const [printFormat, setPrintFormat] = useState(PRINT_OFFLINE_FORMATS[0])
  const [printSize, setPrintSize] = useState(PRINT_OFFLINE_SIZES[0])
  const [printQuantity, setPrintQuantity] = useState(PRINT_OFFLINE_QUANTITIES[0])
  const [templateEditFamily, setTemplateEditFamily] = useState(editPayload?.family || "Digital content")
  const [templateEditCategory, setTemplateEditCategory] = useState(editPayload?.category || templateCategoriesForFamily(editPayload?.family || "Digital content")[0])
  const [templateEditSubcategory, setTemplateEditSubcategory] = useState(editPayload?.subcategory || templateSubcategoriesForFamily(editPayload?.family || "Digital content")[0])
  const [templateEditStatus, setTemplateEditStatus] = useState(editPayload?.status || "Draft")
  const templateEditCategoryOptions = templateCategoriesForFamily(templateEditFamily)
  const templateEditSubcategoryOptions = templateSubcategoriesForFamily(templateEditFamily)
  const templateEditParams = templateModalParamsForFamily(templateEditFamily)

  useEffect(() => {
    if (!templateCategoriesForFamily(templateEditFamily).includes(templateEditCategory)) {
      setTemplateEditCategory(templateCategoriesForFamily(templateEditFamily)[0])
    }
    if (!templateSubcategoriesForFamily(templateEditFamily).includes(templateEditSubcategory)) {
      setTemplateEditSubcategory(templateSubcategoriesForFamily(templateEditFamily)[0])
    }
  }, [templateEditFamily, templateEditCategory, templateEditSubcategory])
  const [scenario, setScenario] = useState(record.scenarios[0])
  const [priority, setPriority] = useState("High")
  const [owner, setOwner] = useState(editPayload?.owner || "Marketing Director")
  const [deadline, setDeadline] = useState("")
  const [language, setLanguage] = useState("French + Arabic + English ready")
  const [brandControl, setBrandControl] = useState(true)
  const [approvalRequired, setApprovalRequired] = useState(true)
  const [distributionRequired, setDistributionRequired] = useState(true)
  const [brief, setBrief] = useState(editPayload ? `Editing synced template: ${editPayload.name}` : "")
  const [deliverables, setDeliverables] = useState(record.outputs.slice(0, 4))
  const [relatedTasks, setRelatedTasks] = useState<ContentRelatedTask[]>(() => readContentRuntime(record.id).tasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [taskEditorOpen, setTaskEditorOpen] = useState(false)
  const [taskDraft, setTaskDraft] = useState<ContentRelatedTask | null>(null)
  const [comments, setComments] = useState<ContentComment[]>(() => readContentRuntime(record.id).comments)
  const [commentText, setCommentText] = useState("")
  const [commentAudience, setCommentAudience] = useState("Marketing team")

  function syncRuntime(nextTasks = relatedTasks, nextComments = comments) {
    writeContentRuntime(record.id, { tasks: nextTasks, comments: nextComments })
  }

  function toggleDeliverable(item: string) {
    setDeliverables((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    )
  }

  function openTask(task: ContentRelatedTask) {
    setActiveTaskId(task.id)
    setTaskDraft(task)
    setTaskEditorOpen(true)
  }

  function createTask() {
    const nextTask = buildNewContentTask(taskContextRecord as any, relatedTasks.length)
    setTaskDraft(nextTask)
    setActiveTaskId(nextTask.id)
    setTaskEditorOpen(true)
  }

  function saveTask(task: ContentRelatedTask) {
    setRelatedTasks((current) => {
      const exists = current.some((item) => item.id === task.id)
      const next = exists ? current.map((item) => item.id === task.id ? task : item) : [task, ...current]
      writeContentRuntime(record.id, { tasks: next, comments })
      return next
    })
    setTaskEditorOpen(false)
    setTaskDraft(null)
    setActiveTaskId(task.id)
  }

  function updateTaskStatus(taskId: string, status: ContentRelatedTask["status"]) {
    setRelatedTasks((current) => {
      const next = current.map((task) => task.id === taskId ? { ...task, status } : task)
      writeContentRuntime(record.id, { tasks: next, comments })
      return next
    })
  }

  function addComment() {
    const clean = commentText.trim()
    if (!clean) return
    const next: ContentComment = {
      id: `comment-${Date.now()}`,
      author: "Salma El Alami",
      role: "Marketing Director",
      audience: commentAudience,
      message: clean,
      sentiment: clean.includes("?") ? "question" : clean.toLowerCase().includes("approve") ? "approval" : "coordination",
      createdAt: "Just now",
      pinned: clean.toLowerCase().includes("urgent") || clean.toLowerCase().includes("priority"),
    }
    setComments((current) => {
      const nextComments = [next, ...current]
      writeContentRuntime(record.id, { tasks: relatedTasks, comments: nextComments })
      return nextComments
    })
    setCommentText("")
  }

  function saveEditedTemplateWorkflow() {
    const payload: TemplateEditPayload = {
      id: editPayload?.id || `template-${Date.now()}`,
      name: title.trim() || editPayload?.name || `${templateEditCategory} · ${templateEditSubcategory}`,
      familyId: "templates",
      family: record.id === "templates" ? templateEditFamily : record.label,
      category: record.id === "templates" ? templateEditCategory : output,
      subcategory: record.id === "templates" ? templateEditSubcategory : editPayload?.subcategory || "Synced workspace",
      output: record.id === "templates" ? templateEditCategory : output,
      channel,
      owner: owner || editPayload?.owner || "Marketing Team",
      status: record.id === "templates" ? templateEditStatus : editPayload?.status || "In Review",
      modalScope: record.id === "templates" ? `${templateEditFamily} Create Modal` : editPayload?.modalScope,
      rules: record.id === "templates" ? templateEditParams : editPayload?.rules || [],
      matchedParams: record.id === "templates" ? templateEditParams : editPayload?.matchedParams || [],
    }
    onSaved?.(payload)
    onSubmit(payload.name)
  }

  const completion = Math.min(
    100,
    18 +
      (title.trim() ? 18 : 0) +
      (brief.trim() ? 18 : 0) +
      (deadline ? 12 : 0) +
      deliverables.length * 6 +
      (brandControl ? 8 : 0) +
      (approvalRequired ? 8 : 0),
  )

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-white/75 p-4 backdrop-blur-md">
      {taskEditorOpen && taskDraft && (
        <ContentTaskEditorModal
          task={taskDraft}
          onClose={() => {
            setTaskEditorOpen(false)
            setTaskDraft(null)
          }}
          onSave={saveTask}
        />
      )}

      <div className="mx-auto w-full max-w-[1720px] rounded-[38px] border border-cyan-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-6 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className={cn("grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br shadow-xl", toneClasses(record.tone).ring)}>
              <Icon className="h-8 w-8 text-slate-950" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-700">Advanced content creation studio</div>
              <h2 className="mt-1 text-4xl font-black text-slate-950">{record.label}</h2>
              <p className="mt-2 max-w-4xl text-sm font-bold text-slate-800">{record.short}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Brief readiness</div>
              <div className="text-2xl font-black text-slate-950">{completion}%</div>
            </div>
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white/5 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">Cancel</button>
            <button
              type="button"
              onClick={() => {
            if (record.id === "templates") {
              saveEditedTemplateWorkflow()
              return
            }
            if (editPayload) {
              saveEditedTemplateWorkflow()
              return
            }
            onSubmit(title || `${record.label} content`)
          }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-[0_18px_44px_rgba(124,58,237,.3)]"
            >
              <Save className="h-4 w-4" /> {editPayload ? "Save Template Changes" : record.id === "templates" ? "Create Template Workflow" : record.id === "print-offline" ? "Create Print Workflow" : "Create Workflow"}
            </button>
          </div>
        </div>

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          {[
            ["Purpose", record.short],
            ["Scenario", scenario],
            ["Channel", channel],
            ["Output", output],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-800">{label}</div>
              <div className="mt-2 text-sm font-black text-slate-950">{value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.12fr)_minmax(520px,.88fr)]">
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">1. Strategic Brief</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Content title</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Example: AngelCare ${record.label} for preschool partnership activation`} className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
                </label>
                <FormSelect label="Audience" value={audience} setValue={setAudience} options={["B2B kindergarten / preschool", "Parents / B2C families", "Internal staff", "Corporate partners", "Event attendees", "Executive direction"]} />
                <FormSelect label="Objective" value={objective} setValue={setObjective} options={["Lead generation and market activation", "Brand awareness", "Sales conversion", "Training and enablement", "Retention and loyalty", "Operational alignment"]} />
                <FormSelect label="Primary output" value={output} setValue={setOutput} options={record.outputs} />
                {record.id === "print-offline" && (
                  <>
                    <FormSelect label="Purpose" value={printPurpose} setValue={setPrintPurpose} options={PRINT_OFFLINE_PURPOSES} />
                    <FormSelect label="Format" value={printFormat} setValue={setPrintFormat} options={PRINT_OFFLINE_FORMATS} />
                    <FormSelect label="Size" value={printSize} setValue={setPrintSize} options={PRINT_OFFLINE_SIZES} />
                    <FormSelect label="Print quantity" value={printQuantity} setValue={setPrintQuantity} options={PRINT_OFFLINE_QUANTITIES} />
                  </>
                )}
                {record.id === "templates" && (
                  <div className="md:col-span-2 rounded-[28px] border border-violet-300/20 bg-violet-50 p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">
                          Synced Template Parameters
                        </div>
                        <h3 className="mt-1 text-2xl font-black text-slate-950">
                          {editPayload ? "Edit Template Parameters" : "Create Template Parameters"}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-slate-800">
                          Select the exact family, output, subcategory/service and lifecycle status this template should follow.
                        </p>
                      </div>
                      <span className="rounded-2xl border border-emerald-300/20 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-[.14em] text-emerald-800">
                        Synced
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <FormSelect label="Content family" value={templateEditFamily} setValue={setTemplateEditFamily} options={TEMPLATE_EDIT_FAMILIES} />
                      <FormSelect label="Master category / output" value={templateEditCategory} setValue={setTemplateEditCategory} options={templateEditCategoryOptions} />
                      <FormSelect label="Subcategory / service" value={templateEditSubcategory} setValue={setTemplateEditSubcategory} options={templateEditSubcategoryOptions} />
                      <FormSelect label="Lifecycle status" value={templateEditStatus} setValue={setTemplateEditStatus} options={["Approved", "In Review", "Draft", "Locked"]} />
                    </div>

                    <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700">
                        Required modal parameters
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {templateEditParams.map((param) => (
                          <span key={param} className="rounded-full border border-cyan-300/20 bg-cyan-50 px-3 py-1 text-[10px] font-black text-cyan-800">
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {record.id === "templates" && (
                  <div className="md:col-span-2 rounded-[26px] border border-violet-300/20 bg-violet-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">{editPayload ? "Template edit cockpit" : "Template creation cockpit"}</div>
                        <h3 className="mt-1 text-xl font-black text-slate-950">Synced Template Parameters</h3>
                        <p className="mt-1 text-xs font-bold text-slate-700">Edit the exact template ecosystem: family, category, subcategory, modal scope, status and matched modal parameters.</p>
                      </div>
                      <span className="rounded-xl border border-emerald-300/20 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-800">Live synced</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <FormSelect label="Template family" value={templateEditFamily} setValue={setTemplateEditFamily} options={TEMPLATE_EDIT_FAMILIES} />
                      <FormSelect label="Lifecycle status" value={templateEditStatus} setValue={setTemplateEditStatus} options={["Approved", "In Review", "Draft", "Locked"]} />
                      <FormSelect label="Master category / output" value={templateEditCategory} setValue={setTemplateEditCategory} options={templateEditCategoryOptions} />
                      <FormSelect label="Subcategory / service / department" value={templateEditSubcategory} setValue={setTemplateEditSubcategory} options={templateEditSubcategoryOptions} />
                    </div>
                    <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700">Matched modal parameters</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {templateEditParams.map((param) => (
                          <span key={param} className="rounded-full border border-cyan-300/20 bg-cyan-50 px-3 py-1 text-[10px] font-black text-cyan-800">{param}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {record.id === "digital-content" && (
                  <FormSelect
                    label="Related service / product"
                    value={relatedDigitalService}
                    setValue={setRelatedDigitalService}
                    options={DIGITAL_RELATED_SERVICES}
                  />
                )}
                <FormSelect label="Primary channel" value={channel} setValue={setChannel} options={record.channels} />
                <FormSelect label="Scenario" value={scenario} setValue={setScenario} options={record.scenarios} />
                <FormSelect label="Priority" value={priority} setValue={setPriority} options={["Critical", "High", "Medium", "Low"]} />
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Owner</span>
                  <input value={owner} onChange={(e) => setOwner(e.target.value)} className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">Deadline</span>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none" />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-violet-300/15 bg-white p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">2. Deliverables & Requirements</h3>
              <div className="grid gap-3 md:grid-cols-4">
                {record.outputs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleDeliverable(item)}
                    className={cn(
                      "rounded-2xl border p-4 text-left text-sm font-black transition",
                      deliverables.includes(item)
                        ? "border-violet-300/45 bg-violet-50 text-slate-950"
                        : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300/30"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <ToggleCard label="Brand control required" value={brandControl} setValue={setBrandControl} detail="Logo, color, typography, voice and claim validation" />
                <ToggleCard label="Approval workflow" value={approvalRequired} setValue={setApprovalRequired} detail="Manager review before publishing or printing" />
                <ToggleCard label="Distribution plan" value={distributionRequired} setValue={setDistributionRequired} detail="Channel, date, owner and measurement setup" />
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-300/15 bg-white p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">3. Creative Direction & Execution Notes</h3>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe the offer, message, visual direction, target emotion, CTA, proof points, legal constraints, versions needed, language adaptation, and execution notes..."
                className="min-h-[190px] w-full rounded-2xl border border-cyan-300/20 bg-white p-4 text-sm font-bold text-slate-950 outline-none"
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormSelect label="Language / localization" value={language} setValue={setLanguage} options={["French + Arabic + English ready", "French only", "Arabic only", "English only", "French + Arabic", "French + English"]} />
                <FormSelect label="Measurement KPI" value="Engagement + conversion" setValue={() => undefined} options={["Engagement + conversion", "Downloads", "Leads generated", "Sales meetings", "Training completion", "Print utilization"]} />
              </div>
            </div>
          </section>

          <aside className="space-y-5 2xl:sticky 2xl:top-5 2xl:self-start">
            <div className="overflow-hidden rounded-[32px] border border-cyan-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-4 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 shadow-[0_0_34px_rgba(34,211,238,.28)]">
                    <PanelRightOpen className="h-6 w-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-700">Live execution rail</div>
                    <div className="text-xl font-black text-slate-950">Tasks + Team Coordination</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-50 px-3 py-2 text-right">
                  <div className="text-[10px] font-black text-emerald-700">SYNCED</div>
                  <div className="text-sm font-black text-slate-950">Live</div>
                </div>
              </div>

              <ContentTasksCard
              tasks={relatedTasks}
              activeTaskId={activeTaskId}
              onOpen={openTask}
              onCreate={createTask}
              onStatus={updateTaskStatus}
            />

              <div className="mt-4">
                <ContentCommentsCard
              comments={comments}
              commentText={commentText}
              setCommentText={setCommentText}
              commentAudience={commentAudience}
              setCommentAudience={setCommentAudience}
              onAdd={addComment}
            />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
              <div className="mb-4 flex items-center gap-3">
                <Radar className="h-5 w-5 text-violet-700" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-800">Lower execution intelligence</div>
                  <h3 className="text-lg font-black text-slate-950">Coverage + Scenario + Next Actions</h3>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl border border-cyan-300/15 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Execution Coverage</h3>
              <div className="mt-4 space-y-3">
                {[
                  ["Strategy", title ? "Ready" : "Needs title"],
                  ["Audience", audience],
                  ["Output", output],
                  ...(record.id === "print-offline" ? [["Purpose", printPurpose], ["Format", printFormat], ["Size", printSize], ["Quantity", printQuantity]] : []),
                  ["Channel", channel],
                  ["Approvals", approvalRequired ? "Required" : "Optional"],
                  ["Brand", brandControl ? "Controlled" : "Flexible"],
                  ["Distribution", distributionRequired ? "Planned" : "Not required"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                    <span className="text-sm font-black text-slate-950">{value}</span>
                  </div>
                ))}
              </div>
            </div>
                <div className="rounded-3xl border border-violet-300/15 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">AngelCare Scenario Library</h3>
              <div className="mt-4 grid gap-2">
                {record.scenarios.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setScenario(item)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-black transition",
                      scenario === item ? "border-violet-300/45 bg-violet-50" : "border-slate-200 bg-white hover:border-cyan-300/30"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
                <div className="rounded-3xl border border-emerald-300/15 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Next Actions Created</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-800">
                <div className="rounded-2xl bg-white p-3">Create content task in Market OS</div>
                <div className="rounded-2xl bg-white p-3">Attach asset requirements and owner</div>
                <div className="rounded-2xl bg-white p-3">Send to review / approval pipeline</div>
                <div className="rounded-2xl bg-white p-3">Prepare distribution and KPI tracking</div>
              </div>
            </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ContentTasksCard({
  tasks,
  activeTaskId,
  onOpen,
  onCreate,
  onStatus,
}: {
  tasks: ContentRelatedTask[]
  activeTaskId: string | null
  onOpen: (task: ContentRelatedTask) => void
  onCreate: () => void
  onStatus: (taskId: string, status: ContentRelatedTask["status"]) => void
}) {
  const active = tasks.filter((task) => task.status === "active").length
  const review = tasks.filter((task) => task.status === "review").length
  const done = tasks.filter((task) => task.status === "done").length

  return (
    <section className="rounded-[28px] border border-violet-300/25 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Smart execution tasks</div>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Related Tasks</h3>
          <p className="mt-1 text-xs font-bold text-slate-800">Create, open, view and edit production, approval and publishing tasks.</p>
        </div>
        <button type="button" onClick={onCreate} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-slate-950">
          <Plus className="mr-2 inline h-4 w-4" /> Add
        </button>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ["Total", tasks.length],
          ["Active", active],
          ["Review", review],
          ["Done", done],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <div className="text-xl font-black text-slate-950">{value}</div>
            <div className="text-[10px] font-black uppercase text-slate-800">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-700">No related tasks yet.</div>
        ) : tasks.map((task) => (
          <button key={task.id} type="button" onClick={() => onOpen(task)} className={cn("w-full rounded-2xl border p-3 text-left", activeTaskId === task.id ? "border-cyan-300/40 bg-cyan-50" : "border-slate-200 bg-white")}>
            <div className="flex items-center justify-between gap-3">
              <div className="font-black text-slate-950">{task.title}</div>
              <select value={task.status} onChange={(event) => onStatus(task.id, event.target.value as ContentRelatedTask["status"])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-950">
                <option value="active">active</option>
                <option value="review">review</option>
                <option value="done">done</option>
              </select>
            </div>
            <div className="mt-1 text-xs font-bold text-slate-950/66">{task.owner} · {task.dueDate} · {task.priority}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

function ContentCommentsCard({
  comments,
  commentText,
  setCommentText,
  commentAudience,
  setCommentAudience,
  onAdd,
}: {
  comments: ContentComment[]
  commentText: string
  setCommentText: (value: string) => void
  commentAudience: string
  setCommentAudience: (value: string) => void
  onAdd: () => void
}) {
  return (
    <section className="rounded-[28px] border border-cyan-300/20 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Team coordination</div>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Comments</h3>
          <p className="mt-1 text-xs font-bold text-slate-800">Internal coordination notes linked to this content workflow.</p>
        </div>
        <select value={commentAudience} onChange={(event) => setCommentAudience(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-950">
          <option>Internal team</option>
          <option>Design</option>
          <option>Management</option>
          <option>Sales</option>
        </select>
      </div>
      <div className="mt-4 flex gap-2">
        <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add internal comment..." className="h-12 flex-1 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-bold text-slate-950 outline-none" />
        <button type="button" onClick={onAdd} className="rounded-2xl bg-cyan-600 px-5 text-sm font-black text-slate-950">Add</button>
      </div>
      <div className="mt-4 space-y-2">
        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-700">No comments yet.</div>
        ) : comments.map((comment) => (
          <div key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-950">{comment.author}</div>
              <div className="text-[10px] font-black uppercase text-cyan-700">{comment.audience}</div>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-950/76">{comment.message}</div>
          </div>
        ))}
      </div>
    </section>
  )
}


function ContentTaskEditorModal({
  task,
  onClose,
  onSave,
}: {
  task: ContentRelatedTask
  onClose: () => void
  onSave: (task: ContentRelatedTask) => void
}) {
  const [draft, setDraft] = useState<ContentRelatedTask>(task)

  return (
    <div className="fixed inset-0 z-[100000] grid place-items-center bg-white/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-[32px] border border-cyan-300/25 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Task editor</div>
            <h3 className="mt-1 text-2xl font-black text-slate-950">Edit related task</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-slate-800">
            Title
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
            />
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-slate-800">
            Description
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              className="min-h-28 rounded-2xl border border-cyan-300/20 bg-white p-4 text-sm font-bold text-slate-950 outline-none"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-slate-800">
              Owner
              <input
                value={draft.owner}
                onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
                className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
              />
            </label>
            <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-slate-800">
              Due date
              <input
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
              />
            </label>
            <label className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-slate-800">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ContentRelatedTask["status"] }))}
                className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
              >
                <option value="active">active</option>
                <option value="review">review</option>
                <option value="done">done</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white/5 px-5 py-3 text-sm font-black text-slate-950">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(draft)} className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white">
            Save Task
          </button>
        </div>
      </div>
    </div>
  )
}


function FormSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.14em] text-slate-800">{label}</span>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="h-12 rounded-2xl border border-cyan-300/20 bg-white px-4 text-sm font-black text-slate-950 outline-none">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ToggleCard({ label, detail, value, setValue }: { label: string; detail: string; value: boolean; setValue: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => setValue(!value)}
      className={cn(
        "rounded-2xl border p-4 text-left transition",
        value ? "border-emerald-300/35 bg-emerald-50" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-slate-950">{label}</span>
        <span className={cn("rounded-full px-3 py-1 text-[10px] font-black", value ? "bg-emerald-400 text-slate-950" : "bg-slate-200 text-slate-950")}>{value ? "ON" : "OFF"}</span>
      </div>
      <div className="mt-2 text-xs font-bold text-slate-800">{detail}</div>
    </button>
  )
}


function MetricCard({ label, value, trend, tone, icon: Icon }: { label: string; value: string; trend: string; tone: Tone; icon: any }) {
  const t = toneClasses(tone)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
      <div className="flex items-center gap-4">
        <span className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br shadow-lg", t.ring, t.glow)}>
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <div className="text-xs font-bold text-slate-800">{label}</div>
          <div className="text-3xl font-black">{value}</div>
          <div className={cn("text-xs font-black", trend.startsWith("↓") ? "text-red-400" : "text-emerald-700")}>{trend}</div>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="ultra-card rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,.10)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-950/90">{title}</h2>
        <div className="text-sm font-black text-violet-700">{action}</div>
      </div>
      {children}
    </section>
  )
}

function SelectPill({ value, setValue, options }: { value: string; setValue: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => setValue(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 outline-none">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  )
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-black text-slate-950/84"><span>{label}</span><span>{value}/100</span></div>
      <div className="h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${value}%` }} /></div>
    </div>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><span className={cn("h-3 w-3 rounded-full", color)} />{label}</span><span>{value}</span></div>
}
