"use client"

import * as React from "react"
import { Badge, Button, DarkPanel, Field, Input, Panel, Select, Shell, TextArea, todayISO, uid, useAmbassadorStore } from "./ambassador-backoffice-system"

type AssetStatus = "draft" | "approved" | "needs_revision"
type AssetType = "script" | "caption" | "visual_brief" | "faq" | "training" | "campaign_kit"

type AssetItem = {
  id: string
  title: string
  type: AssetType
  programId: string
  channel: string
  status: AssetStatus
  owner: string
  updatedAt: string
  usageRule: string
  content: string
}

const storageKey = "angelcare.marketos.ambassador.assets.phase1"

const seedAssets: AssetItem[] = [
  { id: "asset-whatsapp-postpartum", title: "Approved WhatsApp postpartum reassurance script", type: "script", programId: "prog-community", channel: "WhatsApp", status: "approved", owner: "Marketing Director", updatedAt: todayISO(-1), usageRule: "Use only for qualified postpartum family conversations. No medical claims.", content: "Bonjour, AngelCare accompagne les familles avec des services de garde et assistance à domicile structurés, rassurants et suivis par l'équipe." },
  { id: "asset-clinic-referral", title: "Clinic referral partner talking points", type: "faq", programId: "prog-clinic", channel: "Clinic", status: "approved", owner: "Partnership Lead", updatedAt: todayISO(-3), usageRule: "For clinic referral conversations. Consent and traceability required.", content: "Position AngelCare as a premium operational support partner for families requiring organized care solutions." },
  { id: "asset-academy-caption", title: "Academy student advocate caption kit", type: "caption", programId: "prog-academy", channel: "Instagram", status: "draft", owner: "Academy Marketing", updatedAt: todayISO(), usageRule: "Requires final approval before public publication.", content: "Caption draft for explaining AngelCare Academy opportunities with clarity and no exaggerated promises." },
]

function readAssets(): AssetItem[] {
  if (typeof window === "undefined") return seedAssets
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) as AssetItem[] : seedAssets
  } catch {
    return seedAssets
  }
}

function writeAssets(items: AssetItem[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(items))
}

export default function AmbassadorAssetsWorkspace() {
  const { store } = useAmbassadorStore()
  const [assets, setAssets] = React.useState<AssetItem[]>(seedAssets)
  const [query, setQuery] = React.useState("")
  const [form, setForm] = React.useState<AssetItem>({ id: "", title: "", type: "script", programId: store.programs[0]?.id || "prog-community", channel: "WhatsApp", status: "draft", owner: "Marketing Director", updatedAt: todayISO(), usageRule: "Use only with approved AngelCare wording.", content: "" })

  React.useEffect(() => setAssets(readAssets()), [])

  const save = () => {
    if (!form.title.trim()) return window.alert("Asset title is required")
    const item: AssetItem = { ...form, id: form.id || uid("asset"), updatedAt: todayISO() }
    const next = form.id ? assets.map((asset) => asset.id === form.id ? item : asset) : [item, ...assets]
    setAssets(next)
    writeAssets(next)
    setForm({ id: "", title: "", type: "script", programId: store.programs[0]?.id || "prog-community", channel: "WhatsApp", status: "draft", owner: "Marketing Director", updatedAt: todayISO(), usageRule: "Use only with approved AngelCare wording.", content: "" })
  }

  const updateStatus = (id: string, status: AssetStatus) => {
    const next = assets.map((asset) => asset.id === id ? { ...asset, status, updatedAt: todayISO() } : asset)
    setAssets(next)
    writeAssets(next)
  }

  const filtered = assets.filter((asset) => `${asset.title} ${asset.type} ${asset.channel} ${asset.owner} ${asset.content}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <Shell>
      <main className="mx-auto max-w-[1800px] space-y-6 p-4 lg:p-8">
        <DarkPanel className="p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2"><Badge tone="emerald">Ambassador OS</Badge><Badge tone="amber">Asset command</Badge></div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Ambassador assets and approved scripts.</h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-emerald-50/80 md:text-base">Control approved scripts, captions, campaign kits, FAQs, visual briefs and usage rules so ambassadors execute with brand-safe messaging.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button href="/market-os/ambassadors" kind="soft">Back to cockpit</Button><Button href="/market-os/ambassadors/communications" kind="primary">Send to ambassadors</Button></div>
          </div>
        </DarkPanel>

        <section className="grid gap-4 md:grid-cols-3">
          <Panel className="p-5"><p className="text-xs font-black uppercase text-slate-400">Total assets</p><p className="mt-2 text-3xl font-black text-slate-950">{assets.length}</p><p className="text-sm font-bold text-slate-500">Operational resources</p></Panel>
          <Panel className="p-5"><p className="text-xs font-black uppercase text-slate-400">Approved</p><p className="mt-2 text-3xl font-black text-slate-950">{assets.filter((asset) => asset.status === "approved").length}</p><p className="text-sm font-bold text-slate-500">Ready for use</p></Panel>
          <Panel className="p-5"><p className="text-xs font-black uppercase text-slate-400">Draft / revision</p><p className="mt-2 text-3xl font-black text-slate-950">{assets.filter((asset) => asset.status !== "approved").length}</p><p className="text-sm font-bold text-slate-500">Needs control</p></Panel>
        </section>

        <Panel className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Create / edit asset</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Resource builder</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Title"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label="Type"><Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AssetType })}><option value="script">Script</option><option value="caption">Caption</option><option value="visual_brief">Visual brief</option><option value="faq">FAQ</option><option value="training">Training</option><option value="campaign_kit">Campaign kit</option></Select></Field>
            <Field label="Program"><Select value={form.programId} onChange={(event) => setForm({ ...form, programId: event.target.value })}>{store.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</Select></Field>
            <Field label="Channel"><Input value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} /></Field>
            <Field label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AssetStatus })}><option value="draft">Draft</option><option value="approved">Approved</option><option value="needs_revision">Needs revision</option></Select></Field>
            <Field label="Owner"><Input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Usage rule"><Input value={form.usageRule} onChange={(event) => setForm({ ...form, usageRule: event.target.value })} /></Field></div>
            <div className="md:col-span-2 xl:col-span-4"><Field label="Content"><TextArea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></Field></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Button onClick={save} kind="primary">Save asset</Button><Button onClick={() => setForm({ id: "", title: "", type: "script", programId: store.programs[0]?.id || "prog-community", channel: "WhatsApp", status: "draft", owner: "Marketing Director", updatedAt: todayISO(), usageRule: "Use only with approved AngelCare wording.", content: "" })}>Clear form</Button></div>
        </Panel>

        <Panel className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_.35fr] lg:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Library</p><h2 className="mt-2 text-2xl font-black text-slate-950">Controlled ambassador resources</h2></div>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources..." />
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {filtered.map((asset) => (
              <div key={asset.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-slate-950">{asset.title}</p><p className="mt-1 text-sm font-bold text-slate-500">{asset.type} • {asset.channel} • {asset.owner}</p></div><Badge tone={asset.status === "approved" ? "emerald" : asset.status === "needs_revision" ? "rose" : "amber"}>{asset.status}</Badge></div>
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{asset.content}</p>
                <p className="mt-3 text-xs font-black uppercase text-slate-400">Rule: <span className="normal-case text-slate-600">{asset.usageRule}</span></p>
                <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setForm(asset)}>Edit</Button><Button onClick={() => updateStatus(asset.id, "approved")} kind="success">Approve</Button><Button onClick={() => updateStatus(asset.id, "needs_revision")} kind="danger">Request revision</Button></div>
              </div>
            ))}
          </div>
        </Panel>
      </main>
    </Shell>
  )
}
