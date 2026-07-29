"use client"

import * as React from "react"
import Link from "next/link"
import {
  Archive,
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileImage,
  FileStack,
  Filter,
  FolderOpen,
  GitBranch,
  Grid3X3,
  Image as ImageIcon,
  Link2,
  List,
  Network,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react"
import { loadStore } from "../content-command-system"
import { useBulk4Registry } from "./bulk4-api"
import type { CreativeAssetRecord } from "./bulk4-types"
import { Bulk4BrandCrown, Bulk4TruthState, EmptyCreativeState, SectionTitle, TonePill, styles } from "./Bulk4Shared"

type View = "visual" | "register" | "relationships"
type FilterMode = "all" | "approved" | "draft" | "revision" | "missing-source" | "rights-risk" | "expiring"

function metadataString(asset: CreativeAssetRecord, key: string) {
  const value = asset.metadata?.[key]
  return typeof value === "string" ? value : ""
}

function normalizeStatus(status: string) {
  const lower = status.toLowerCase()
  if (lower.includes("approved") || lower.includes("active")) return { label: status, tone: "success" as const }
  if (lower.includes("revision") || lower.includes("correction")) return { label: status, tone: "danger" as const }
  if (lower.includes("ready")) return { label: status, tone: "info" as const }
  if (lower.includes("archive") || lower.includes("suspend")) return { label: status, tone: "warning" as const }
  return { label: status || "Draft", tone: "neutral" as const }
}

export default function Bulk4AssetLibraryWorkspace() {
  const registry = useBulk4Registry()
  const [store] = React.useState(() => loadStore())
  const [view, setView] = React.useState<View>("visual")
  const [filter, setFilter] = React.useState<FilterMode>("all")
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const legacyAssets = React.useMemo<CreativeAssetRecord[]>(() => store.assets.map((asset) => ({
    id: `legacy:${asset.id}`,
    family: "legacy",
    title: asset.name,
    category: asset.type,
    subcategory: "Legacy Content Command Store",
    output: asset.type,
    channel: asset.channel,
    service_product: null,
    owner: asset.owner,
    status: asset.status,
    priority: null,
    storage_path: null,
    preview_url: asset.url || null,
    metadata: { legacy: true, linkedContentId: asset.linkedContentId, notes: asset.notes, sourceUrl: asset.url || "" },
  })), [store.assets])
  const allAssets = React.useMemo(() => [...registry.assets, ...legacyAssets], [legacyAssets, registry.assets])
  const visible = allAssets.filter((asset) => {
    const needle = query.trim().toLowerCase()
    const haystack = [asset.title, asset.family, asset.category, asset.subcategory, asset.channel, asset.owner, asset.status, metadataString(asset, "dossierId"), metadataString(asset, "templateCode")].join(" ").toLowerCase()
    if (needle && !haystack.includes(needle)) return false
    const source = asset.storage_path || asset.preview_url || metadataString(asset, "sourceUrl")
    const rights = metadataString(asset, "rightsState")
    const expiration = metadataString(asset, "expirationDate")
    if (filter === "approved" && !/approved|active/i.test(asset.status)) return false
    if (filter === "draft" && !/draft|working/i.test(asset.status)) return false
    if (filter === "revision" && !/revision|correction/i.test(asset.status)) return false
    if (filter === "missing-source" && source) return false
    if (filter === "rights-risk" && rights === "valid") return false
    if (filter === "expiring" && !expiration) return false
    return true
  })
  const selected = allAssets.find((asset) => asset.id === selectedId) || visible[0] || null
  const sourceGaps = allAssets.filter((asset) => !(asset.storage_path || asset.preview_url || metadataString(asset, "sourceUrl"))).length
  const rightsRisks = allAssets.filter((asset) => metadataString(asset, "rightsState") !== "valid").length
  const linked = allAssets.filter((asset) => metadataString(asset, "dossierId") || metadataString(asset, "linkedContentId")).length

  async function updateAsset(asset: CreativeAssetRecord, updates: Partial<CreativeAssetRecord>, metadataUpdates: Record<string, unknown> = {}) {
    if (String(asset.id).startsWith("legacy:")) { setNotice("Cet asset appartient au store legacy. Ouvrez son dossier historique pour le promouvoir avant mutation API."); return }
    setBusy(true)
    setNotice("")
    try {
      await registry.saveAsset({ ...asset, ...updates, metadata: { ...(asset.metadata || {}), ...metadataUpdates } })
      setNotice(`${asset.title}: registre mis à jour.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : "ASSET_UPDATE_FAILED") }
    finally { setBusy(false) }
  }

  async function deleteAsset(asset: CreativeAssetRecord) {
    if (String(asset.id).startsWith("legacy:")) { setNotice("La suppression legacy reste gouvernée par le store historique."); return }
    if (!window.confirm(`Supprimer définitivement ${asset.title} du registre API?`)) return
    setBusy(true)
    try { await registry.deleteAsset(asset.id); setSelectedId(""); setNotice("Asset supprimé du registre API. Les sources externes ne sont pas supprimées.") }
    catch (error) { setNotice(error instanceof Error ? error.message : "ASSET_DELETE_FAILED") }
    finally { setBusy(false) }
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="asset-library">
    <Bulk4BrandCrown eyebrow="VISUAL INTELLIGENCE LIBRARY" title="Voir l’actif. Comprendre sa source. Maîtriser son usage." description="Asset Library combine découverte visuelle, registre professionnel, provenance, droits, versions, variantes, dossiers et usages. Une miniature ne suffit jamais à déclarer un actif utilisable." returnTo="/market-os/content-command-center/studio" actions={<Link href="/market-os/content-command-center/active-assets"><ShieldCheck/> Active Assets</Link>} />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.assetTelemetry}>
      <article><Boxes/><span><small>REGISTRE API + LEGACY</small><strong>{allAssets.length}</strong><p>{registry.assets.length} API · {legacyAssets.length} legacy identifiable(s)</p></span></article>
      <article><Link2/><span><small>RELATIONS DOSSIER</small><strong>{linked}</strong><p>Relations observées dans metadata ou store historique.</p></span></article>
      <article><FolderOpen/><span><small>SOURCES MANQUANTES</small><strong>{sourceGaps}</strong><p>Aucune URL, storage path ou référence observable.</p></span></article>
      <article><ShieldAlert/><span><small>DROITS NON VALIDÉS</small><strong>{rightsRisks}</strong><p>État différent de « valid » ou absent.</p></span></article>
    </section>

    <section className={styles.assetCommandBar}>
      <label><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher titre, code, template, dossier, owner, canal…"/></label>
      <div><Filter/><select value={filter} onChange={(event) => setFilter(event.target.value as FilterMode)}><option value="all">Tous les actifs</option><option value="approved">Approuvés / actifs</option><option value="draft">Working / draft</option><option value="revision">Correction</option><option value="missing-source">Source absente</option><option value="rights-risk">Droits à traiter</option><option value="expiring">Expiration documentée</option></select></div>
      <div role="tablist"><button aria-selected={view === "visual"} onClick={() => setView("visual")}><Grid3X3/> Discovery</button><button aria-selected={view === "register"} onClick={() => setView("register")}><List/> Registre</button><button aria-selected={view === "relationships"} onClick={() => setView("relationships")}><Network/> Relations</button></div>
      <Link href="/market-os/content-command-center/studio/quick-create"><Sparkles/> Nouvelle production</Link>
    </section>

    <section className={styles.assetLibraryDesk}>
      <div className={styles.assetResults}>
        <SectionTitle eyebrow={view === "visual" ? "DISCOVERY CANVAS" : view === "register" ? "ENTERPRISE REGISTER" : "RELATIONSHIP GRAPH"} title={`${visible.length} actif(s) dans cette vue`} description="Toutes les vues utilisent les mêmes records. Les assets legacy restent explicitement identifiés et non mutables par l’API moderne." />
        {!visible.length ? <EmptyCreativeState title="Aucun actif visible" detail="Modifiez la recherche ou le filtre, ou créez une production gouvernée depuis Quick Create." href="/market-os/content-command-center/studio/quick-create" action="Lancer une production"/> : view === "visual" ? <div className={styles.assetDiscoveryGrid}>{visible.map((asset) => { const status = normalizeStatus(asset.status); const source = asset.preview_url || metadataString(asset, "sourceUrl"); return <button key={asset.id} type="button" aria-pressed={selected?.id === asset.id} onClick={() => setSelectedId(asset.id)}>
          <div className={styles.assetVisual}>{source ? <img src={source} alt={`Aperçu ${asset.title}`}/> : <><FileImage/><span>Aperçu non documenté</span></>}<small>{asset.family}</small></div>
          <header><TonePill tone={status.tone}>{status.label}</TonePill>{metadataString(asset, "rightsState") === "valid" ? <ShieldCheck/> : <ShieldAlert/>}</header>
          <strong>{asset.title}</strong><p>{asset.category || "Sans catégorie"} · {asset.channel || "Canal absent"}</p><footer><span>{asset.owner || "Owner absent"}</span><small>{metadataString(asset, "version") || "Version non documentée"}</small></footer>
        </button>})}</div> : view === "register" ? <div className={styles.assetRegister}><table><thead><tr>{["Asset","Famille","Version","Owner","Source","Droits","Statut","Dossier"].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{visible.map((asset) => <tr key={asset.id} onClick={() => setSelectedId(asset.id)}><td><strong>{asset.title}</strong><small>{asset.id}</small></td><td>{asset.family}<small>{asset.category || "—"}</small></td><td>{metadataString(asset, "version") || "—"}</td><td>{asset.owner || "—"}</td><td>{asset.storage_path || asset.preview_url || metadataString(asset, "sourceUrl") ? "Référence présente" : "Absente"}</td><td>{metadataString(asset, "rightsState") || "Inconnus"}</td><td><TonePill tone={normalizeStatus(asset.status).tone}>{asset.status}</TonePill></td><td>{metadataString(asset, "dossierId") || metadataString(asset, "linkedContentId") || "Non lié"}</td></tr>)}</tbody></table></div> : <div className={styles.assetRelationshipGraph}>{visible.slice(0, 16).map((asset, index) => <article key={asset.id} className={index === 0 ? styles.relationshipMaster : ""} onClick={() => setSelectedId(asset.id)}><span><FileImage/></span><strong>{asset.title}</strong><small>{metadataString(asset, "templateCode") || asset.family}</small><div><i/><em>{metadataString(asset, "dossierId") || "Dossier non documenté"}</em></div></article>)}</div>}
      </div>

      <aside className={styles.assetInspector}>
        {selected ? <>
          <header><span><ImageIcon/><small>ASSET INSPECTOR</small></span><button onClick={() => void registry.refresh()}><RefreshCcw/></button></header>
          <div className={styles.assetInspectorPreview}>{selected.preview_url || metadataString(selected, "sourceUrl") ? <img src={selected.preview_url || metadataString(selected, "sourceUrl")} alt={`Aperçu ${selected.title}`}/> : <FileStack/>}</div>
          <section><small>{selected.id}</small><h2>{selected.title}</h2><p>{selected.category || "Catégorie non documentée"} · {selected.subcategory || "Sous-catégorie non documentée"}</p><div><TonePill tone={normalizeStatus(selected.status).tone}>{selected.status}</TonePill><TonePill tone={metadataString(selected, "rightsState") === "valid" ? "success" : "warning"}>{metadataString(selected, "rightsState") || "Droits inconnus"}</TonePill></div></section>
          <dl><div><dt>Famille</dt><dd>{selected.family}</dd></div><div><dt>Version</dt><dd>{metadataString(selected, "version") || "Non documentée"}</dd></div><div><dt>Template</dt><dd>{metadataString(selected, "templateCode") || "Non documenté"}</dd></div><div><dt>Dossier</dt><dd>{metadataString(selected, "dossierId") || metadataString(selected, "linkedContentId") || "Non lié"}</dd></div><div><dt>Source</dt><dd>{selected.storage_path || selected.preview_url || metadataString(selected, "sourceUrl") || "Absente"}</dd></div><div><dt>Expiration</dt><dd>{metadataString(selected, "expirationDate") || "Non modélisée"}</dd></div><div><dt>Reviewer</dt><dd>{metadataString(selected, "reviewer") || "Non documenté"}</dd></div><div><dt>Provenance</dt><dd>{selected.family === "legacy" ? "Legacy Content Store" : "Content Command Assets API"}</dd></div></dl>
          <section className={styles.assetLineage}><h3>Lineage observable</h3>{[["Source", selected.storage_path || metadataString(selected, "sourceUrl") || "Manquante"],["Template", metadataString(selected, "templateId") || "Non lié"],["Master / parent", metadataString(selected, "parentAssetId") || "Non documenté"],["Rendition", selected.output || "Non documentée"],["Usage", metadataString(selected, "usage") || "Non documenté"]].map(([label, value]) => <div key={label}><span><GitBranch/></span><strong>{label}</strong><small>{value}</small></div>)}</section>
          {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}
          <footer><button disabled={busy} onClick={() => void updateAsset(selected, { status: "Approved" })}><CheckCircle2/> Approuver le statut</button><button disabled={busy} onClick={() => void updateAsset(selected, { status: "Needs Revision" })}><ShieldAlert/> Correction</button><button disabled={busy} onClick={() => void updateAsset(selected, { status: "Archived" })}><Archive/> Archiver</button><button disabled={busy || String(selected.id).startsWith("legacy:")} onClick={() => void deleteAsset(selected)}><Trash2/> Supprimer</button></footer>
        </> : <EmptyCreativeState title="Aucun asset sélectionné" detail="Sélectionnez un record dans la découverte, le registre ou le graphe."/>}
      </aside>
    </section>
  </main>
}
