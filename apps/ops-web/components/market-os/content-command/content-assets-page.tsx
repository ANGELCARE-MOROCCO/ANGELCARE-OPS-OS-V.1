"use client"

import * as React from "react"
import Link from "next/link"
import {
  Archive,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  FileImage,
  Filter,
  FolderOpen,
  Grid3X3,
  Image as ImageIcon,
  Link2,
  List,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import {
  AssetForm,
  statusLabel,
  useContentStore,
  type ContentAsset,
} from "./content-command-system"
import {
  CommandHero,
  EmptyOperational,
  MetricCard,
  ProductionCanvas,
  SectionHeading,
  StatusPill,
  TruthNotice,
  styles,
} from "./production/production-ui"
import { getAssetCounts, getAssetTruth, productionStatusTone } from "./production/production-model"

type ViewMode = "visual" | "register"
type FilterMode = "all" | ContentAsset["status"] | "missing-source" | "unlinked"

export default function ContentAssetsPage() {
  const { store, commit } = useContentStore()
  const [query, setQuery] = React.useState("")
  const [view, setView] = React.useState<ViewMode>("visual")
  const [filter, setFilter] = React.useState<FilterMode>("all")
  const [intakeOpen, setIntakeOpen] = React.useState(false)
  const counts = getAssetCounts(store)

  const assets = store.assets.filter((asset) => {
    const item = store.items.find((candidate) => candidate.id === asset.linkedContentId)
    const truth = getAssetTruth(asset, item)
    const haystack = `${asset.name} ${asset.type} ${asset.owner} ${asset.status} ${asset.channel} ${item?.title ?? ""}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesFilter = filter === "all"
      || asset.status === filter
      || (filter === "missing-source" && !asset.url.trim())
      || (filter === "unlinked" && !item)
    return matchesQuery && matchesFilter
  })

  const updateStatus = (asset: ContentAsset, status: ContentAsset["status"]) => commit((draft) => {
    draft.assets = draft.assets.map((candidate) => candidate.id === asset.id ? { ...candidate, status } : candidate)
  }, "asset status", `${asset.name} moved to ${status}`)

  const deleteAsset = (asset: ContentAsset) => {
    if (!window.confirm(`Supprimer définitivement l'asset « ${asset.name} » ? Cette action retire aussi son lien depuis les contenus.`)) return
    commit((draft) => {
      draft.assets = draft.assets.filter((candidate) => candidate.id !== asset.id)
      draft.items = draft.items.map((item) => ({ ...item, assets: item.assets.filter((assetId) => assetId !== asset.id) }))
    }, "asset delete", `Deleted asset ${asset.name}`)
  }

  return <ProductionCanvas>
    <CommandHero
      eyebrow="ASSET OPERATIONS · GOVERNED REGISTER"
      title="Chaque asset possède un owner, un contexte, un risque et une vérité d’usage."
      description="Asset Library enregistre les références créatives sans les confondre avec une source canonique, une preuve ou un export publié. Les limites du modèle de droits restent explicitement visibles."
      icon={Boxes}
      tone="emerald"
      metrics={[
        { label: "Assets enregistrés", value: counts.total, detail: "Registre Content Command existant" },
        { label: "Approuvés", value: counts.approved, detail: "Statut enregistré, non équivalent à une validation formelle" },
        { label: "Risques documentaires", value: counts.missingSource + counts.unlinked, detail: "Source absente ou dossier introuvable" },
      ]}
      actions={<>
        <button className={styles.primaryAction} onClick={() => setIntakeOpen(true)}><Plus /> Enregistrer un asset</button>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/active-assets"><ShieldCheck /> Active Assets</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/source-vault"><FolderOpen /> Source Vault</Link>
      </>}
    />

    <section className={styles.metricGrid}>
      <MetricCard icon={FileImage} label="Brouillons" value={counts.draft} detail="Assets encore en production" tone="neutral" />
      <MetricCard icon={CheckCircle2} label="Approuvés" value={counts.approved} detail="Statut local enregistré" tone="success" />
      <MetricCard icon={ShieldAlert} label="Correction requise" value={counts.revision} detail="Assets à reprendre" tone={counts.revision ? "danger" : "success"} />
      <MetricCard icon={Link2} label="Source absente" value={counts.missingSource} detail="Aucune URL ou référence enregistrée" tone={counts.missingSource ? "warning" : "success"} />
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="ASSET REGISTER" title="Bibliothèque visuelle et registre institutionnel" description="Les deux modes utilisent exactement les mêmes assets et les mêmes actions de persistance." action={<div className={styles.tabRow} role="tablist" aria-label="Mode d’affichage"><button aria-selected={view === "visual"} onClick={() => setView("visual")}><Grid3X3 size={14} /> Visuel</button><button aria-selected={view === "register"} onClick={() => setView("register")}><List size={14} /> Registre</button></div>} />
      <div className={styles.filterBar}>
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher nom, owner, canal, dossier ou statut…" aria-label="Rechercher dans les assets" />
        <Filter size={16} />
        <select value={filter} onChange={(event) => setFilter(event.target.value as FilterMode)} aria-label="Filtrer les assets">
          <option value="all">Tous</option>
          <option value="draft">Brouillons</option>
          <option value="approved">Approuvés</option>
          <option value="needs revision">Correction requise</option>
          <option value="archived">Archivés</option>
          <option value="missing-source">Source absente</option>
          <option value="unlinked">Dossier introuvable</option>
        </select>
      </div>

      {assets.length ? view === "visual" ? <div className={styles.cardGrid} style={{ marginTop: 15 }}>
        {assets.map((asset) => {
          const item = store.items.find((candidate) => candidate.id === asset.linkedContentId)
          const truth = getAssetTruth(asset, item)
          return <article className={styles.assetCard} key={asset.id}>
            <div className={styles.assetPreview}>{asset.type === "Image" ? <ImageIcon /> : <FileImage />}</div>
            <header><StatusPill tone={productionStatusTone(asset.status)}>{statusLabel(asset.status)}</StatusPill><StatusPill tone={truth.risk}>{truth.active ? "Opérationnel" : truth.missing.length ? `${truth.missing.length} manque(s)` : "À gouverner"}</StatusPill></header>
            <h3>{asset.name}</h3>
            <p>{asset.type} · {asset.channel}</p>
            <div className={styles.assetMeta}>
              <div><span>Dossier</span><strong>{item?.title ?? "Non lié"}</strong></div>
              <div><span>Owner</span><strong>{asset.owner || "Absent"}</strong></div>
              <div><span>Source</span><strong>{asset.url ? "Référence présente" : "Non documentée"}</strong></div>
              <div><span>Droits</span><strong>Non modélisés</strong></div>
            </div>
            {truth.missing.length ? <TruthNotice title="Prêt sous conditions" detail={`Éléments manquants: ${truth.missing.join(", ")}.`} tone="warning" /> : null}
            <footer>
              {item ? <Link className={styles.quietAction} href={`/market-os/content-command-center/${item.id}`}>Dossier <ArrowRight /></Link> : null}
              {asset.url ? <a className={styles.quietAction} href={asset.url} target="_blank" rel="noreferrer">Référence <ArrowRight /></a> : null}
              <button className={styles.quietAction} onClick={() => updateStatus(asset, "approved")}>Approuver</button>
              <button className={styles.quietAction} onClick={() => updateStatus(asset, "needs revision")}>Correction</button>
              <button className={styles.quietAction} onClick={() => updateStatus(asset, "archived")}><Archive size={15} /> Archiver</button>
              <button className={styles.dangerAction} onClick={() => deleteAsset(asset)}><Trash2 size={15} /> Supprimer</button>
            </footer>
          </article>
        })}
      </div> : <div className={styles.section} style={{ marginTop: 15, boxShadow: "none" }}>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}><thead><tr>{["Asset", "Type / Canal", "Dossier", "Owner", "Source", "Droits", "Statut", "Actions"].map((label) => <th key={label} style={{ padding: 12, textAlign: "left", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", borderBottom: "1px solid #dbe6f1" }}>{label}</th>)}</tr></thead><tbody>{assets.map((asset) => { const item = store.items.find((candidate) => candidate.id === asset.linkedContentId); return <tr key={asset.id}><td style={{ padding: 12, borderBottom: "1px solid #e7eef5", fontWeight: 800 }}>{asset.name}</td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}>{asset.type}<br/><small>{asset.channel}</small></td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}>{item?.title ?? "Non lié"}</td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}>{asset.owner || "Absent"}</td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}>{asset.url ? "Référence présente" : "Non documentée"}</td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}>Non modélisés</td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}><StatusPill tone={productionStatusTone(asset.status)}>{statusLabel(asset.status)}</StatusPill></td><td style={{ padding: 12, borderBottom: "1px solid #e7eef5" }}><button className={styles.quietAction} onClick={() => updateStatus(asset, "approved")}>Approuver</button></td></tr>})}</tbody></table></div>
      </div> : <EmptyOperational title="Aucun asset pour cette vue" detail="Modifiez la recherche ou le filtre, ou enregistrez le premier asset lié à un contenu existant." action="Créer un contenu" href="/market-os/content-command-center/create" />}
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="INSTITUTIONAL TRUTH" title="Asset, source, preuve, export et duplicate intelligence restent distincts" description="Mega ZIP 5 rend la distinction visible sans inventer les champs encore absents du modèle." />
      <div className={styles.workflowRail}>{[
        ["Working asset", "Fichier ou référence en production"],
        ["Evidence copy", "Copie soumise pour inspection"],
        ["Canonical source", "Original gouverné dans Source Vault"],
        ["Rendition", "Adaptation de canal ou format"],
        ["Publication export", "Fichier destiné à la diffusion"],
        ["Active asset", "Asset approuvé et sans manque observable"],
        ["Retirement", "Sortie contrôlée de l’usage actif"],
      ].map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}</div>
    </section>

    {intakeOpen ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="mz5-asset-intake" onMouseDown={() => setIntakeOpen(false)}><section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}><header><div><p>ASSET INTAKE</p><h2 id="mz5-asset-intake">Enregistrer un asset</h2></div><button aria-label="Fermer" onClick={() => setIntakeOpen(false)}>×</button></header><div className={styles.modalBody}><TruthNotice title="Contrat préservé" detail="Le formulaire enregistre le schéma ContentAsset existant. Les droits, expirations et versions non modélisés sont affichés comme limites, jamais comme faits." tone="info"/><div style={{ marginTop: 16 }}><AssetForm items={store.items} onSave={(asset) => { commit((draft) => { draft.assets = [asset, ...draft.assets]; draft.items = draft.items.map((item) => item.id === asset.linkedContentId ? { ...item, assets: Array.from(new Set([...item.assets, asset.id])) } : item) }, "asset create", `Registered asset ${asset.name}`); setIntakeOpen(false) }} /></div></div></section></div> : null}
  </ProductionCanvas>
}
