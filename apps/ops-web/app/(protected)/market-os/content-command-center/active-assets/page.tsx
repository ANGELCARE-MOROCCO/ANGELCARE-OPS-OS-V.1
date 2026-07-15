"use client"

import Link from "next/link"
import { Archive, ArrowUpRight, CheckCircle2, FolderKanban, ShieldCheck, Sparkles } from "lucide-react"
import { Shell, useContentStore } from "@/components/market-os/content-command/content-command-system"

export default function Page() {
  const { store } = useContentStore()
  const activeAssets = store.assets.filter((asset) => asset.status === "approved")
  const linkedAssets = activeAssets.filter((asset) => Boolean(asset.linkedContentId))

  return (
    <Shell>
      <main data-market-os-root className="space-y-6 px-4 py-5 text-slate-950 lg:px-7 lg:py-7 2xl:px-9">
        <section className="overflow-hidden rounded-[38px] border border-slate-200 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-7 shadow-[0_34px_110px_rgba(15,23,42,.10)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-emerald-800"><Sparkles className="h-4 w-4" /> Active assets command</div>
              <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight text-slate-950">Approved assets ready for campaign execution.</h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-700">This control panel isolates only active, approved and usable assets so marketing does not execute with draft, blocked or unvalidated creative material.</p>
            </div>
            <Link href="/market-os/content-command-center/assets" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">Open full asset library <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5"><Archive className="h-7 w-7 text-rose-800" /><p className="mt-4 text-[11px] font-black uppercase tracking-[.16em] text-slate-600">Active assets</p><p className="mt-1 text-4xl font-black">{activeAssets.length}</p></div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5"><FolderKanban className="h-7 w-7 text-cyan-800" /><p className="mt-4 text-[11px] font-black uppercase tracking-[.16em] text-slate-600">Linked to content</p><p className="mt-1 text-4xl font-black">{linkedAssets.length}</p></div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5"><ShieldCheck className="h-7 w-7 text-emerald-800" /><p className="mt-4 text-[11px] font-black uppercase tracking-[.16em] text-slate-600">Governance status</p><p className="mt-1 text-4xl font-black">Ready</p></div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)]/82 p-5 shadow-[0_26px_80px_rgba(15,23,42,.10)] backdrop-blur-xl">
          <div className="mb-5"><p className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-700/80">Approved creative inventory</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Active assets</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeAssets.map((asset) => (
              <div key={asset.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-6 w-6" /></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">Approved</span></div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{asset.name}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">{asset.type} · {asset.channel}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{asset.notes || "No notes registered."}</p>
              </div>
            ))}
            {!activeAssets.length ? <div className="rounded-[28px] border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-600 md:col-span-2 xl:col-span-3">No approved active assets yet. Approve assets from the asset library first.</div> : null}
          </div>
        </section>
      </main>
    </Shell>
  )
}
