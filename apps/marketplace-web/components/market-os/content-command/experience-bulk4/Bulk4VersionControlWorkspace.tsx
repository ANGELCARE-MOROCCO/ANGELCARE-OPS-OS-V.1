"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  Copy,
  FileDiff,
  FileImage,
  GitBranch,
  History,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useBulk4Registry } from "./bulk4-api"
import type { CreativeAssetRecord } from "./bulk4-types"
import { ContentMediaPreview, contentMediaSourceFromAsset } from "../media-preview/ContentMediaPreview"
import { Bulk4BrandCrown, Bulk4TruthState, EmptyCreativeState, SectionTitle, TonePill, styles } from "./Bulk4Shared"

function meta(asset: CreativeAssetRecord | null, key: string) {
  const value = asset?.metadata?.[key]
  if (typeof value === "string") return value
  if (value && typeof value === "object") return JSON.stringify(value)
  return ""
}

export default function Bulk4VersionControlWorkspace() {
  const registry = useBulk4Registry()
  const [leftId, setLeftId] = React.useState("")
  const [rightId, setRightId] = React.useState("")
  const [mode, setMode] = React.useState<"side" | "copy" | "metadata" | "findings">("side")
  const left = registry.assets.find((asset) => asset.id === leftId) || registry.assets[0] || null
  const related = left ? registry.assets.filter((asset) => asset.id !== left.id && (meta(asset, "dossierId") === meta(left, "dossierId") || meta(asset, "parentAssetId") === left.id || meta(left, "parentAssetId") === asset.id)) : registry.assets
  const right = registry.assets.find((asset) => asset.id === rightId) || related[0] || registry.assets[1] || null
  const fields = [
    ["Version", meta(left, "version"), meta(right, "version")],
    ["Template", meta(left, "templateCode"), meta(right, "templateCode")],
    ["Headline", meta(left, "master") || meta(left, "headline"), meta(right, "master") || meta(right, "headline")],
    ["Langue", meta(left, "language"), meta(right, "language")],
    ["Ville", meta(left, "city"), meta(right, "city")],
    ["Droits", meta(left, "rightsState"), meta(right, "rightsState")],
    ["Status", left?.status || "", right?.status || ""],
    ["Reviewer", meta(left, "reviewer"), meta(right, "reviewer")],
  ]
  const changes = fields.filter(([, a, b]) => a !== b)

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="version-control">
    <Bulk4BrandCrown eyebrow="CREATIVE VERSION & RENDITION CONTROL" title="Comparer ce qui a changé. Comprendre pourquoi. Préserver l’autorité." description="Le comparateur utilise les versions et métadonnées réellement disponibles. Lorsqu’une branche ou un finding n’est pas modélisé, il reste explicitement absent — jamais reconstruit artificiellement." returnTo="/market-os/content-command-center/studio" actions={<Link href="/market-os/content-command-center/assets"><FileImage/> Asset Library</Link>} />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.versionCommandBar}>
      <label>Version A<select value={left?.id || ""} onChange={(event) => setLeftId(event.target.value)}>{registry.assets.map((asset) => <option key={asset.id} value={asset.id}>{meta(asset, "version") || "Version?"} · {asset.title}</option>)}</select></label>
      <GitBranch/>
      <label>Version B<select value={right?.id || ""} onChange={(event) => setRightId(event.target.value)}>{registry.assets.map((asset) => <option key={asset.id} value={asset.id}>{meta(asset, "version") || "Version?"} · {asset.title}</option>)}</select></label>
      <div role="tablist"><button aria-selected={mode === "side"} onClick={() => setMode("side")}><Columns3/> Side-by-side</button><button aria-selected={mode === "copy"} onClick={() => setMode("copy")}><Copy/> Copy diff</button><button aria-selected={mode === "metadata"} onClick={() => setMode("metadata")}><FileDiff/> Metadata</button><button aria-selected={mode === "findings"} onClick={() => setMode("findings")}><History/> Findings</button></div>
    </section>

    {!left || !right ? <EmptyCreativeState title="Deux versions requises" detail="Le registre doit contenir au moins deux assets pour permettre une comparaison réelle." href="/market-os/content-command-center/studio/quick-create" action="Créer une production"/> : <>
      <section className={styles.versionComparisonStage}>
        <article className={styles.versionSide}><header><span><small>VERSION A</small><strong>{meta(left, "version") || "Non documentée"}</strong></span><TonePill tone="neutral">{left.status}</TonePill></header><div><ContentMediaPreview source={contentMediaSourceFromAsset(left)} mode="inspector" fit="contain"/></div><h2>{left.title}</h2><p>{left.category} · {left.channel}</p><dl><div><dt>Owner</dt><dd>{left.owner || "Absent"}</dd></div><div><dt>Template</dt><dd>{meta(left, "templateCode") || "Absent"}</dd></div><div><dt>Dossier</dt><dd>{meta(left, "dossierId") || "Absent"}</dd></div></dl></article>
        <div className={styles.versionDelta}><FileDiff/><strong>{changes.length}</strong><span>différence(s) observable(s)</span><i/></div>
        <article className={styles.versionSide}><header><span><small>VERSION B</small><strong>{meta(right, "version") || "Non documentée"}</strong></span><TonePill tone="info">{right.status}</TonePill></header><div><ContentMediaPreview source={contentMediaSourceFromAsset(right)} mode="inspector" fit="contain"/></div><h2>{right.title}</h2><p>{right.category} · {right.channel}</p><dl><div><dt>Owner</dt><dd>{right.owner || "Absent"}</dd></div><div><dt>Template</dt><dd>{meta(right, "templateCode") || "Absent"}</dd></div><div><dt>Dossier</dt><dd>{meta(right, "dossierId") || "Absent"}</dd></div></dl></article>
      </section>

      <section className={styles.versionInspectionDeck}>
        <div><SectionTitle eyebrow={mode.toUpperCase()} title="Différences institutionnelles" description="Les champs comparés proviennent des records. Une absence reste visible comme absence." />
          {mode === "side" || mode === "metadata" ? <div className={styles.diffTable}>{fields.map(([label, a, b]) => <article key={label} className={a === b ? styles.diffSame : styles.diffChanged}><strong>{label}</strong><span>{a || "Non documenté"}</span><ArrowRight/><span>{b || "Non documenté"}</span><small>{a === b ? "Identique" : "Modifié"}</small></article>)}</div> : mode === "copy" ? <div className={styles.copyDiff}><article><small>A</small><p>{meta(left, "master") || "Copy structurée non documentée."}</p></article><article><small>B</small><p>{meta(right, "master") || "Copy structurée non documentée."}</p></article></div> : <div className={styles.findingsDiff}><article><History/><span><strong>Version A</strong><p>{meta(left, "reviewFindings") || "Aucun finding structuré dans metadata."}</p></span></article><article><History/><span><strong>Version B</strong><p>{meta(right, "reviewFindings") || "Aucun finding structuré dans metadata."}</p></span></article></div>}
        </div>
        <aside className={styles.versionAuthorityRail}><header><ShieldCheck/><span><small>VERSION AUTHORITY</small><strong>Historique immuable en présentation</strong></span></header><ul><li><CheckCircle2/>Créer une nouvelle version plutôt qu’écraser.</li><li><CheckCircle2/>Conserver auteur, raison et parent lorsqu’ils existent.</li><li><CheckCircle2/>Distinguer working copy, evidence copy et approved asset.</li><li><CheckCircle2/>La restauration crée une nouvelle version; elle ne réécrit pas l’historique.</li></ul><Link href={`/market-os/content-command-center/studio/quick-create?asset=${encodeURIComponent(right.id)}&template=${encodeURIComponent(meta(right, "templateId"))}`}><RotateCcw/> Restaurer comme nouvelle production <ArrowRight/></Link><Link href="/market-os/content-command-center/evidence"><Sparkles/> Préparer la comparaison Evidence <ArrowRight/></Link></aside>
      </section>
    </>}
  </main>
}
