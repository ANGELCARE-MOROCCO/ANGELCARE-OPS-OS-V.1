"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileImage,
  Filter,
  FolderOpen,
  Image as ImageIcon,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useBulk4Registry } from "./bulk4-api"
import type { CreativeAssetRecord } from "./bulk4-types"
import { Bulk4BrandCrown, Bulk4TruthState, EmptyCreativeState, SectionTitle, TonePill, styles } from "./Bulk4Shared"

function metadataString(asset: CreativeAssetRecord, key: string) {
  const value = asset.metadata?.[key]
  return typeof value === "string" ? value : ""
}

function readiness(asset: CreativeAssetRecord) {
  const source = Boolean(asset.storage_path || asset.preview_url || metadataString(asset, "sourceUrl"))
  const rights = metadataString(asset, "rightsState") === "valid"
  const approved = /approved|active/i.test(asset.status)
  const template = Boolean(metadataString(asset, "templateId") || metadataString(asset, "templateCode"))
  const dossier = Boolean(metadataString(asset, "dossierId"))
  const expiration = metadataString(asset, "expirationDate")
  const expired = Boolean(expiration && expiration < new Date().toISOString().slice(0, 10))
  const replacement = metadataString(asset, "replacementAssetId")
  const missing = [!approved ? "statut approuvé" : "", !source ? "source" : "", !rights ? "droits" : "", !template ? "template" : "", !dossier ? "dossier" : ""].filter(Boolean)
  return { source, rights, approved, template, dossier, expiration, expired, replacement, missing, ready: missing.length === 0 && !expired }
}

type Shelf = "ready" | "restricted" | "expiring" | "replacement" | "suspended" | "evergreen" | "all"

export default function Bulk4ActiveAssetsWorkspace() {
  const registry = useBulk4Registry()
  const [shelf, setShelf] = React.useState<Shelf>("ready")
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const enriched = registry.assets.map((asset) => ({ asset, truth: readiness(asset) }))
  const visible = enriched.filter(({ asset, truth }) => {
    const needle = query.trim().toLowerCase()
    if (needle && ![asset.title, asset.family, asset.channel, asset.owner, metadataString(asset, "templateCode"), metadataString(asset, "dossierId")].join(" ").toLowerCase().includes(needle)) return false
    if (shelf === "ready") return truth.ready
    if (shelf === "restricted") return truth.approved && (!truth.rights || !truth.source)
    if (shelf === "expiring") return Boolean(truth.expiration)
    if (shelf === "replacement") return Boolean(truth.replacement) || truth.expired
    if (shelf === "suspended") return /suspend|archive/i.test(asset.status)
    if (shelf === "evergreen") return truth.ready && !truth.expiration
    return true
  })
  const selected = registry.assets.find((asset) => asset.id === selectedId) || visible[0]?.asset || null
  const selectedTruth = selected ? readiness(selected) : null

  async function update(asset: CreativeAssetRecord, status: string, metadata: Record<string, unknown> = {}) {
    setBusy(true)
    setNotice("")
    try { await registry.saveAsset({ ...asset, status, metadata: { ...(asset.metadata || {}), ...metadata } }); setNotice(`${asset.title}: statut mis à jour dans le registre.`) }
    catch (error) { setNotice(error instanceof Error ? error.message : "ACTIVE_ASSET_UPDATE_FAILED") }
    finally { setBusy(false) }
  }

  const counts = {
    ready: enriched.filter((item) => item.truth.ready).length,
    restricted: enriched.filter((item) => item.truth.approved && (!item.truth.rights || !item.truth.source)).length,
    expiring: enriched.filter((item) => item.truth.expiration).length,
    replacement: enriched.filter((item) => item.truth.replacement || item.truth.expired).length,
    suspended: enriched.filter((item) => /suspend|archive/i.test(item.asset.status)).length,
    evergreen: enriched.filter((item) => item.truth.ready && !item.truth.expiration).length,
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="active-assets">
    <Bulk4BrandCrown eyebrow="OPERATIONAL RELEASE SHELF" title="Ce qui existe n’est pas forcément utilisable. Ici, l’usage est gouverné." description="Active Assets ne duplique pas Asset Library. Il isole les versions autorisées, leurs restrictions, sources, droits, expirations et remplacements afin que les équipes utilisent uniquement ce qui est opérationnellement défendable." returnTo="/market-os/content-command-center/studio" actions={<Link href="/market-os/content-command-center/assets"><FolderOpen/> Asset Library</Link>} />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.activeShelfCommand}>
      {([
        ["ready", "Ready now", counts.ready, ShieldCheck],
        ["restricted", "Restricted", counts.restricted, ShieldAlert],
        ["expiring", "Expiring", counts.expiring, CalendarClock],
        ["replacement", "Replacement", counts.replacement, RotateCcw],
        ["suspended", "Suspended", counts.suspended, AlertTriangle],
        ["evergreen", "Evergreen", counts.evergreen, Sparkles],
      ] as const).map(([key, label, count, Icon]) => <button key={key} aria-pressed={shelf === key} onClick={() => setShelf(key)}><Icon/><span><strong>{count}</strong><small>{label}</small></span></button>)}
      <label><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans les actifs opérationnels…"/><Filter/></label>
    </section>

    <section className={styles.operationalShelfDesk}>
      <div className={styles.operationalShelf}>
        <SectionTitle eyebrow="TRUSTED OPERATIONAL SHELF" title={`${visible.length} actif(s) dans « ${shelf} »`} description="La readiness est dérivée de champs observables: statut, source, droits, template, dossier et expiration. Aucun score artificiel." />
        {visible.length ? <div className={styles.operationalAssetGrid}>{visible.map(({ asset, truth }) => <button key={asset.id} aria-pressed={selected?.id === asset.id} onClick={() => setSelectedId(asset.id)}>
          <div className={styles.operationalPreview}>{asset.preview_url || metadataString(asset, "sourceUrl") ? <img src={asset.preview_url || metadataString(asset, "sourceUrl")} alt={`Aperçu ${asset.title}`}/> : <FileImage/>}<span>{asset.family}</span></div>
          <header><TonePill tone={truth.ready ? "success" : truth.expired ? "danger" : "warning"}>{truth.ready ? "Ready now" : truth.expired ? "Expired" : `${truth.missing.length} restriction(s)`}</TonePill>{truth.rights ? <ShieldCheck/> : <ShieldAlert/>}</header>
          <strong>{asset.title}</strong><p>{asset.channel || "Canal absent"} · {metadataString(asset, "version") || "Version absente"}</p>
          <footer><small>{truth.expiration ? `Expire: ${truth.expiration}` : "Sans expiration documentée"}</small><ArrowRight/></footer>
        </button>)}</div> : <EmptyCreativeState title="Aucun actif sur cette shelf" detail="Les actifs apparaissent ici uniquement lorsque leurs conditions observables correspondent à la vue sélectionnée." href="/market-os/content-command-center/assets" action="Ouvrir le registre complet"/>}
      </div>

      <aside className={styles.operationalInspector}>
        {selected && selectedTruth ? <>
          <header><span><ShieldCheck/><small>OPERATIONAL ASSET INSPECTOR</small></span><button onClick={() => void registry.refresh()}><RefreshCcw/></button></header>
          <div className={styles.operationalInspectorPreview}>{selected.preview_url || metadataString(selected, "sourceUrl") ? <img src={selected.preview_url || metadataString(selected, "sourceUrl")} alt={`Aperçu ${selected.title}`}/> : <ImageIcon/>}</div>
          <section><small>{selected.id}</small><h2>{selected.title}</h2><p>{selected.category || "Catégorie non documentée"} · {selected.channel || "Canal non documenté"}</p><TonePill tone={selectedTruth.ready ? "success" : selectedTruth.expired ? "danger" : "warning"}>{selectedTruth.ready ? "Utilisable maintenant" : "Usage sous restriction"}</TonePill></section>
          <div className={styles.readinessDimensions}>{[
            ["Version approuvée", selectedTruth.approved],
            ["Source canonique / référence", selectedTruth.source],
            ["Droits valides", selectedTruth.rights],
            ["Template lié", selectedTruth.template],
            ["Dossier lié", selectedTruth.dossier],
            ["Non expiré", !selectedTruth.expired],
          ].map(([label, passed]) => <article key={String(label)} className={passed ? styles.dimensionReady : styles.dimensionBlocked}>{passed ? <CheckCircle2/> : <AlertTriangle/>}<strong>{String(label)}</strong><small>{passed ? "Conforme" : "Restriction observable"}</small></article>)}</div>
          <dl><div><dt>Template</dt><dd>{metadataString(selected, "templateCode") || "Absent"}</dd></div><div><dt>Dossier</dt><dd>{metadataString(selected, "dossierId") || "Absent"}</dd></div><div><dt>Version</dt><dd>{metadataString(selected, "version") || "Absente"}</dd></div><div><dt>Source</dt><dd>{selected.storage_path || selected.preview_url || metadataString(selected, "sourceUrl") || "Absente"}</dd></div><div><dt>Droits</dt><dd>{metadataString(selected, "rightsState") || "Inconnus"}</dd></div><div><dt>Expiration</dt><dd>{selectedTruth.expiration || "Non documentée"}</dd></div><div><dt>Replacement</dt><dd>{selectedTruth.replacement || "Aucun"}</dd></div><div><dt>Usage</dt><dd>{metadataString(selected, "usage") || "Non documenté"}</dd></div></dl>
          {selectedTruth.missing.length ? <section className={styles.restrictionList}><h3>Conditions manquantes</h3>{selectedTruth.missing.map((item) => <div key={item}><AlertTriangle/><span><strong>{item}</strong><small>Résoudre dans Asset Library ou Source Vault.</small></span></div>)}</section> : null}
          {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}
          <footer><button disabled={busy || !selectedTruth.ready} onClick={() => void update(selected, "Active")}><CheckCircle2/> Activer</button><button disabled={busy} onClick={() => void update(selected, "Suspended")}><ShieldAlert/> Suspendre</button><button disabled={busy} onClick={() => void update(selected, selected.status, { expirationDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0,10) })}><CalendarClock/> Définir +90 jours</button><Link href={`/market-os/content-command-center/studio/quick-create?asset=${encodeURIComponent(selected.id)}&template=${encodeURIComponent(metadataString(selected, "templateId"))}`}><Sparkles/> Créer une variante</Link></footer>
        </> : <EmptyCreativeState title="Aucun actif sélectionné" detail="Sélectionnez un record opérationnel pour inspecter sa readiness."/>}
      </aside>
    </section>
  </main>
}
