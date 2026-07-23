"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
  Archive,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  FileClock,
  FileText,
  Filter,
  FolderOpen,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"
import type {
  AmbassadorReport,
  AmbassadorWorkspaceSnapshot,
} from "@/lib/market-os/ambassadors/types"

type Row = Record<string, any>
type IconType = ComponentType<{ size?: number; className?: string }>

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot
  reports: AmbassadorReport[]
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  query: string
  statusFilter: string
  sortKey: string
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onSortKeyChange: (value: string) => void
  onRefresh: () => void
  onGenerateReport: () => void
  onExportCurrent: () => void
  onOpenReport: (report: AmbassadorReport) => void
  onExportReport: (report: AmbassadorReport) => void
  onArchiveReport: (report: AmbassadorReport) => void
}

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim()
  return normalized || fallback
}

function dateValue(value: unknown) {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value: unknown, withTime = false) {
  const parsed = dateValue(value)
  if (!parsed) return "Non renseigné"
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function reportPeriod(report: Row) {
  const start = dateValue(report.period_start)
  const end = dateValue(report.period_end)
  if (!start && !end) return "Période non renseignée"
  if (start && end) return `${formatDate(start)} — ${formatDate(end)}`
  return start ? `À partir du ${formatDate(start)}` : `Jusqu’au ${formatDate(end)}`
}

function reportType(report: Row) {
  return text(report.report_type || report.type, "Rapport opérationnel")
}

function reportTitle(report: Row) {
  return text(report.title || report.name, "Rapport sans titre")
}

function reportStatus(report: Row) {
  return text(report.status, "pending").toLowerCase()
}

function statusMeta(status: string) {
  if (["generated", "ready", "completed", "published"].some((item) => status.includes(item))) {
    return {
      label: "Disponible",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      icon: CheckCircle2,
    }
  }
  if (["failed", "error", "rejected", "blocked"].some((item) => status.includes(item))) {
    return {
      label: "À corriger",
      className: "border-rose-200 bg-rose-50 text-rose-800",
      icon: Archive,
    }
  }
  if (["draft", "pending", "processing", "queued"].some((item) => status.includes(item))) {
    return {
      label: "En préparation",
      className: "border-amber-200 bg-amber-50 text-amber-800",
      icon: FileClock,
    }
  }
  return {
    label: status.replaceAll("_", " ") || "En préparation",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: FileText,
  }
}

function familyOf(report: Row) {
  const value = reportType(report).toLowerCase()
  if (value.includes("recruit")) return "Recrutement"
  if (value.includes("onboard") || value.includes("activ")) return "Activation"
  if (value.includes("train") || value.includes("certif")) return "Formation"
  if (value.includes("territ")) return "Territoires"
  if (value.includes("performance") || value.includes("goal") || value.includes("kpi")) return "Performance"
  if (value.includes("mission")) return "Missions"
  if (value.includes("lead") || value.includes("conversion")) return "Leads"
  if (value.includes("incent") || value.includes("payout") || value.includes("finance")) return "Finance"
  if (value.includes("audit") || value.includes("govern")) return "Gouvernance"
  return "Réseau"
}

function familyTone(family: string) {
  if (family === "Recrutement") return "bg-blue-50 text-blue-800"
  if (family === "Activation") return "bg-cyan-50 text-cyan-800"
  if (family === "Formation") return "bg-indigo-50 text-indigo-800"
  if (family === "Territoires") return "bg-emerald-50 text-emerald-800"
  if (family === "Performance") return "bg-amber-50 text-amber-800"
  if (family === "Finance") return "bg-teal-50 text-teal-800"
  if (family === "Gouvernance") return "bg-slate-100 text-slate-800"
  return "bg-[#eef4fb] text-[#214f7d]"
}

function StatCell({ label, value, helper, icon: Icon }: { label: string; value: string | number; helper: string; icon: IconType }) {
  return (
    <div className="border-l border-white/15 px-5 py-4 first:border-l-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] !text-[#a9bfd8]">{label}</p>
          <p className="mt-2 text-3xl font-black tabular-nums !text-white">{value}</p>
          <p className="mt-1 text-[11px] font-semibold !text-[#c9d7e7]">{helper}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 !text-white">
          <Icon size={16} />
        </span>
      </div>
    </div>
  )
}

function StatusBadge({ report }: { report: Row }) {
  const meta = statusMeta(reportStatus(report))
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${meta.className}`}>
      <Icon size={12} />
      {meta.label}
    </span>
  )
}

function EmptyLibrary({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="grid min-h-[370px] place-items-center border border-dashed border-slate-300 bg-[#f8fafc] px-8 py-12 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf2fb] text-[#164d7d]">
          <FolderOpen size={24} />
        </span>
        <h3 className="mt-5 text-lg font-black text-slate-950">Aucune publication dans cette vue</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
          Générez un rapport à partir des données opérationnelles réelles ou ajustez les filtres du catalogue.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b3158] px-4 text-sm font-black !text-white shadow-lg shadow-blue-950/15 hover:bg-[#123f6d]"
        >
          <Plus size={16} />
          Générer le premier rapport
        </button>
      </div>
    </div>
  )
}

export default function AmbassadorReportsRoute({
  snapshot,
  reports,
  loading,
  refreshing,
  error,
  success,
  query,
  statusFilter,
  sortKey,
  onQueryChange,
  onStatusFilterChange,
  onSortKeyChange,
  onRefresh,
  onGenerateReport,
  onExportCurrent,
  onOpenReport,
  onExportReport,
  onArchiveReport,
}: Props) {
  const allReports = useMemo(
    () => snapshot.reports.filter((report: Row) => report.status !== "archived"),
    [snapshot.reports],
  )

  const [familyFilter, setFamilyFilter] = useState("Tous")
  const [selectedId, setSelectedId] = useState("")

  const families = useMemo(
    () => Array.from(new Set(allReports.map((report: Row) => familyOf(report)))).sort((a, b) => a.localeCompare(b, "fr")),
    [allReports],
  )

  const visibleReports = useMemo(
    () => reports.filter((report: Row) => familyFilter === "Tous" || familyOf(report) === familyFilter),
    [familyFilter, reports],
  )

  useEffect(() => {
    if (selectedId && visibleReports.some((report: Row) => text(report.id) === selectedId)) return
    setSelectedId(text(visibleReports[0]?.id))
  }, [selectedId, visibleReports])

  const selected = visibleReports.find((report: Row) => text(report.id) === selectedId) || visibleReports[0] || null
  const available = allReports.filter((report: Row) => statusMeta(reportStatus(report)).label === "Disponible").length
  const pending = allReports.filter((report: Row) => statusMeta(reportStatus(report)).label === "En préparation").length
  const uniquePeriods = new Set(allReports.map((report: Row) => reportPeriod(report)).filter((value) => !value.includes("non renseignée"))).size
  const latest = [...allReports]
    .sort((a: Row, b: Row) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))[0]

  return (
    <div data-ambassador-reports-route="corporate-publication-evidence-studio" className="min-h-screen bg-[#f2f5f8] text-slate-950">
      <section className="border-b border-[#ccd7e3] bg-white">
        <div className="grid min-h-[244px] xl:grid-cols-[1.32fr_0.68fr]">
          <div className="relative overflow-hidden px-6 py-8 lg:px-9 lg:py-9">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#bb2432]" />
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.19em] text-[#2d5b88]">
                <span>AngelCare Market OS</span>
                <span className="h-1 w-1 rounded-full bg-[#bb2432]" />
                <span>Publication & evidence studio</span>
              </div>
              <h1 className="mt-3 text-[34px] font-black tracking-[-0.035em] text-slate-950 lg:text-[40px]">
                Rapports & publications contrôlées
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Organisez les preuves opérationnelles, périodes, propriétaires et exports du réseau ambassadeurs dans un environnement documentaire formel.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onGenerateReport}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b3158] px-4 text-sm font-black !text-white shadow-lg shadow-blue-950/15 hover:bg-[#123f6d]"
                >
                  <Plus size={16} />
                  Générer un rapport
                </button>
                <button
                  type="button"
                  onClick={onExportCurrent}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
                >
                  <Download size={16} />
                  Exporter la vue
                </button>
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label="Actualiser les rapports"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#09284a] px-5 py-6 lg:px-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-[#9fb8d5]">Registre de publication</p>
                <p className="mt-2 text-lg font-black !text-white">État documentaire actuel</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 !text-white">
                <FileCheck2 size={20} />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 border-y border-white/15">
              <StatCell label="Documents" value={allReports.length} helper="persistés" icon={FileText} />
              <StatCell label="Disponibles" value={available} helper="prêts à exploiter" icon={CheckCircle2} />
              <StatCell label="Périodes" value={uniquePeriods} helper="documentées" icon={CalendarRange} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-black !text-white">Dernière publication</p>
                <p className="mt-1 font-semibold !text-[#c9d7e7]">{latest ? reportTitle(latest as Row) : "Aucun rapport disponible"}</p>
              </div>
              <p className="shrink-0 font-bold !text-[#a9bfd8]">{latest ? formatDate((latest as Row).updated_at || (latest as Row).created_at, true) : "—"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4 p-4 lg:p-6">
        {error ? <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</div> : null}
        {success ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</div> : null}
        {snapshot.diagnostics?.length ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            Synchronisation partielle : {snapshot.diagnostics[0]?.reason}
          </div>
        ) : null}

        <section className="grid min-w-0 gap-4 2xl:grid-cols-[330px_minmax(0,1fr)_330px]">
          <aside className="min-w-0 border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2d5b88]">Catalogue</p>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Bibliothèque de rapports</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{visibleReports.length} document(s) visible(s)</p>
                </div>
                <FolderOpen size={20} className="text-[#2d5b88]" />
              </div>
              <label className="mt-4 flex h-10 items-center gap-2 border border-slate-200 bg-slate-50 px-3">
                <Search size={15} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Titre, type, auteur…"
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="h-10 border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-400">
                  <option value="all">Tous statuts</option>
                  <option value="generated">Générés</option>
                  <option value="ready">Disponibles</option>
                  <option value="pending">En préparation</option>
                  <option value="failed">À corriger</option>
                </select>
                <select value={sortKey} onChange={(event) => onSortKeyChange(event.target.value)} className="h-10 border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-400">
                  <option value="updated">Plus récents</option>
                  <option value="name">Titre</option>
                  <option value="status">Statut</option>
                </select>
              </div>
            </div>

            <div className="border-b border-slate-100 p-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["Tous", ...families].map((family) => (
                  <button
                    key={family}
                    type="button"
                    onClick={() => setFamilyFilter(family)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${familyFilter === family ? "border-[#0b3158] bg-[#0b3158] !text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    {family}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[650px] overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-24 animate-pulse bg-slate-100" />)}
                </div>
              ) : visibleReports.length ? (
                visibleReports.map((report: Row) => {
                  const active = text(report.id) === text(selected?.id)
                  return (
                    <button
                      key={text(report.id) || `${reportTitle(report)}-${report.updated_at}`}
                      type="button"
                      onClick={() => setSelectedId(text(report.id))}
                      className={`w-full border-b border-slate-100 p-4 text-left transition ${active ? "bg-[#edf4fb] shadow-[inset_4px_0_0_#0b3158]" : "bg-white hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{reportTitle(report)}</p>
                          <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{reportPeriod(report)}</p>
                        </div>
                        <ChevronRight size={16} className={active ? "text-[#0b3158]" : "text-slate-300"} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.07em] ${familyTone(familyOf(report))}`}>{familyOf(report)}</span>
                        <StatusBadge report={report} />
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-5 text-center text-sm font-bold text-slate-500">Aucun rapport correspondant.</div>
              )}
            </div>
          </aside>

          <main className="min-w-0 border border-slate-200 bg-[#e9eef4] p-4 shadow-sm lg:p-6">
            {selected ? (
              <div className="mx-auto max-w-[820px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                <div className="h-2 bg-[#bb2432]" />
                <div className="border-b border-slate-200 px-7 py-6 lg:px-10 lg:py-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2d5b88]">AngelCare · Rapport contrôlé</p>
                      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">{reportTitle(selected as Row)}</h2>
                      <p className="mt-2 text-sm font-semibold text-slate-600">{reportType(selected as Row)} · {familyOf(selected as Row)}</p>
                    </div>
                    <StatusBadge report={selected as Row} />
                  </div>
                </div>

                <div className="grid border-b border-slate-200 sm:grid-cols-3">
                  {[
                    ["Période", reportPeriod(selected as Row)],
                    ["Généré par", text((selected as Row).generated_by, "Non renseigné")],
                    ["Dernière mise à jour", formatDate((selected as Row).updated_at || (selected as Row).created_at, true)],
                  ].map(([label, value]) => (
                    <div key={label} className="border-t border-slate-200 px-6 py-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="px-7 py-8 lg:px-10 lg:py-10">
                  <div className="grid gap-6 lg:grid-cols-[1fr_230px]">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2d5b88]">Périmètre documentaire</p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">Données et métadonnées enregistrées</h3>
                      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                        Ce document reprend uniquement les métadonnées persistées par le moteur de rapports existant. L’export opérationnel reste généré par le même endpoint et les mêmes filtres.
                      </p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {[
                          ["Type de rapport", reportType(selected as Row)],
                          ["Statut technique", text((selected as Row).status, "pending")],
                          ["Référence", text((selected as Row).id, "Non renseignée")],
                          ["Création", formatDate((selected as Row).created_at, true)],
                        ].map(([label, value]) => (
                          <div key={label} className="border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                            <p className="mt-2 break-words text-sm font-black text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <aside className="border-l-4 border-[#0b3158] bg-[#f2f6fa] p-5">
                      <ShieldCheck className="h-6 w-6 text-[#0b3158]" />
                      <p className="mt-4 text-sm font-black text-slate-950">Source opérationnelle</p>
                      <p className="mt-2 text-xs font-semibold leading-6 text-slate-600">
                        Registre persisté, période explicite et export contrôlé sans données de démonstration ajoutées.
                      </p>
                    </aside>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-7 py-5 lg:px-10">
                  <p className="text-xs font-bold text-slate-500">Référence : {text((selected as Row).id, "—")}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onOpenReport(selected)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-50">
                      <FileText size={15} />
                      Ouvrir les paramètres
                    </button>
                    <button type="button" onClick={() => onExportReport(selected)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0b3158] px-3 text-xs font-black !text-white hover:bg-[#123f6d]">
                      <Download size={15} />
                      Exporter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyLibrary onGenerate={onGenerateReport} />
            )}
          </main>

          <aside className="space-y-4">
            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2d5b88]">File de publication</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">État des documents</h2>
                </div>
                <History size={20} className="text-[#2d5b88]" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Disponibles", available, "bg-emerald-500"],
                  ["En préparation", pending, "bg-amber-500"],
                  ["Autres statuts", Math.max(0, allReports.length - available - pending), "bg-slate-400"],
                ].map(([label, value, bar]) => {
                  const width = allReports.length ? Math.round((Number(value) / allReports.length) * 100) : 0
                  return (
                    <div key={String(label)}>
                      <div className="flex items-center justify-between text-xs font-black text-slate-700"><span>{label}</span><span>{value}</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4fb] text-[#0b3158]"><Filter size={17} /></span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Périmètre courant</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{familyFilter === "Tous" ? "Tous les domaines" : familyFilter}</p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3"><dt className="font-bold text-slate-500">Recherche</dt><dd className="max-w-[160px] truncate font-black text-slate-800">{query || "Aucune"}</dd></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3"><dt className="font-bold text-slate-500">Statut</dt><dd className="font-black text-slate-800">{statusFilter === "all" ? "Tous" : statusFilter}</dd></div>
                <div className="flex items-center justify-between"><dt className="font-bold text-slate-500">Tri</dt><dd className="font-black text-slate-800">{sortKey === "updated" ? "Plus récents" : sortKey}</dd></div>
              </dl>
            </section>

            {selected ? (
              <section className="border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-start gap-3">
                  <Archive size={18} className="mt-0.5 shrink-0 text-rose-700" />
                  <div>
                    <p className="text-sm font-black text-rose-900">Gestion du document</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-rose-800">L’archivage utilise le comportement existant et retire le rapport des vues actives.</p>
                    <button type="button" onClick={() => onArchiveReport(selected)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-black text-rose-700 hover:bg-rose-100">
                      <Archive size={14} />
                      Archiver le rapport
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="bg-[#0b3158] p-5">
              <div className="flex items-center gap-3">
                <Clock3 size={18} className="!text-[#bcd0e6]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] !text-[#a9bfd8]">Mise à jour du registre</p>
                  <p className="mt-1 text-sm font-black !text-white">{formatDate(snapshot.updatedAt, true)}</p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </div>
  )
}
