"use client"

import * as React from "react"
import { AssetForm, Badge, Button, Input, PageHeader, Panel, Shell, statusLabel, useContentStore, type ContentAsset } from "./content-command-system"

export default function ContentAssetsPage() {
  const { store, commit } = useContentStore()
  const [query, setQuery] = React.useState("")
  const assets = store.assets.filter((asset) => `${asset.name} ${asset.type} ${asset.owner} ${asset.status}`.toLowerCase().includes(query.toLowerCase()))

  const updateStatus = (asset: ContentAsset, status: ContentAsset["status"]) => commit((draft) => { draft.assets = draft.assets.map((candidate) => candidate.id === asset.id ? { ...candidate, status } : candidate) }, "asset status", `${asset.name} moved to ${status}`)

  return <Shell>
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 lg:p-8">
      <PageHeader eyebrow="Content Command / Assets" title="Asset library and content linking" description="Register creative assets, link them to content, update approval state, track references and remove old materials." actions={<Button href="/market-os/content-command-center">Back</Button>} />
      <Panel className="p-6"><h2 className="text-2xl font-black">Register asset</h2><p className="mt-2 text-sm font-semibold text-slate-600">Every asset is attached to one content item so production, review and publishing stay synchronized inside Content Command Center.</p><div className="mt-5"><AssetForm items={store.items} onSave={(asset) => commit((draft) => { draft.assets = [asset, ...draft.assets]; draft.items = draft.items.map((item) => item.id === asset.linkedContentId ? { ...item, assets: Array.from(new Set([...item.assets, asset.id])) } : item) }, "asset create", `Registered asset ${asset.name}`)} /></div></Panel>
      <Panel className="p-5"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets by name, type, owner or status..." /></Panel>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => { const item = store.items.find((candidate) => candidate.id === asset.linkedContentId); return <Panel key={asset.id} className="p-5"><div className="flex flex-wrap gap-2"><Badge>{asset.type}</Badge><Badge>{asset.status}</Badge><Badge>{asset.channel}</Badge></div><h3 className="mt-3 text-xl font-black">{asset.name}</h3><p className="mt-1 text-sm font-bold text-slate-500">Linked: {item?.title ?? "No content"}</p><p className="mt-2 text-xs font-black uppercase text-slate-400">Owner: {asset.owner}</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{asset.notes || "No notes."}</p>{asset.url ? <a className="mt-3 block text-sm font-black text-rose-600" href={asset.url}>Open reference</a> : null}<div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => updateStatus(asset, "approved")} kind="primary">Approve</Button><Button onClick={() => updateStatus(asset, "needs revision")}>Needs revision</Button><Button onClick={() => updateStatus(asset, "archived")}>Archive</Button><Button onClick={() => commit((draft) => { draft.assets = draft.assets.filter((candidate) => candidate.id !== asset.id); draft.items = draft.items.map((itemCandidate) => ({ ...itemCandidate, assets: itemCandidate.assets.filter((assetId) => assetId !== asset.id) })) }, "asset delete", `Deleted asset ${asset.name}`)} kind="danger">Delete</Button></div></Panel> })}</div>
      {!assets.length ? <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">No assets found.</p> : null}
    </main>
  </Shell>
}
