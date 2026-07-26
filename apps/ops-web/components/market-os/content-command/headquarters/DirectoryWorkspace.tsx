"use client"

import * as React from "react"
import Link from "next/link"
import { Archive, Boxes, CheckCircle2, FileArchive, FileSearch, Film, FolderTree, Grid3X3, ImageIcon, Layers3, Search, ShieldAlert, Sparkles, TableProperties } from "lucide-react"
import { Badge, Empty, PageStatus, Progress, SectionHeader } from "./primitives"
import { CONTENT_FAMILIES, formatDate, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

type Mode = "atlas" | "register" | "tree" | "integrity" | "reuse"

export default function DirectoryWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [mode, setMode] = React.useState<Mode>("atlas")
  const [query, setQuery] = React.useState("")
  const [family, setFamily] = React.useState("all")
  const dossiers = (snapshot?.dossiers || []).filter((item) => {
    const hay = `${item.content_code} ${item.title} ${item.category} ${item.subcategory} ${item.service_label} ${item.campaign_label || ""} ${item.audience} ${item.city} ${item.channel}`.toLowerCase()
    return (family === "all" || item.family === family) && hay.includes(query.toLowerCase())
  })
  const currentSources = new Map((snapshot?.sources || []).filter((source) => source.is_current).map((source) => [source.dossier_id, source]))

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.atlasHero}>
      <div><span className={styles.eyebrow}><FolderTree/> CONTENT ATLAS</span><h1>Le répertoire institutionnel où chaque contenu possède une place, une source et une histoire.</h1><p>Classification profonde, recherche croisée, intégrité source, réutilisation et provenance dans un environnement conçu pour des milliers de contenus.</p></div>
      <div className={styles.atlasSearch}><Search/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Code, service, campagne, format, audience, ville, channel…"/><span>{dossiers.length} résultats</span></div>
    </section>

    <section className={styles.atlasModeRail}>
      {([
        ["atlas","Atlas visuel",Grid3X3], ["register","Registre",TableProperties], ["tree","Arbre",FolderTree], ["integrity","Intégrité source",ShieldAlert], ["reuse","Intelligence & réutilisation",Sparkles],
      ] as const).map(([key,label,Icon]) => <button key={key} className={mode === key ? styles.isActive : ""} onClick={() => setMode(key)}><Icon/>{label}</button>)}
      <select value={family} onChange={(e) => setFamily(e.target.value)}><option value="all">Toutes les familles</option>{CONTENT_FAMILIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
    </section>

    {mode === "atlas" ? <section className={styles.contentAtlas}>
      {CONTENT_FAMILIES.map((familyItem) => {
        const familyDossiers = dossiers.filter((item) => item.family === familyItem.id)
        return <article key={familyItem.id} className={`${styles.familyAtlas} ${styles[`family_${familyItem.id}`]}`}>
          <header><div><span>{familyItem.id === "digital" ? <Film/> : familyItem.id === "print_offline" ? <Boxes/> : <FileArchive/>}</span><div><small>FAMILLE CANONIQUE</small><h2>{familyItem.label}</h2><p>{familyItem.short}</p></div></div><strong>{familyDossiers.length}</strong></header>
          <div className={styles.familyCategoryRail}>{familyItem.categories.slice(0, 8).map((category) => <span key={category}>{category}<b>{familyDossiers.filter((item) => item.category === category).length}</b></span>)}</div>
          <div className={styles.atlasCards}>
            {familyDossiers.slice(0, 8).map((dossier) => <Link key={dossier.id} href={`/market-os/content-command-center/dossiers/${dossier.id}`} className={styles.atlasCard}>
              <div className={styles.assetPreview}>{dossier.family === "digital" ? <ImageIcon/> : dossier.family === "print_offline" ? <Layers3/> : <FileArchive/>}<span>{dossier.category}</span></div>
              <div><small>{dossier.content_code}</small><h3>{dossier.title}</h3><p>{dossier.service_label} · {dossier.city} · {dossier.channel}</p></div>
              <footer><Badge tone={tone(dossier.status)}>{statusLabel(dossier.status)}</Badge><Progress value={dossier.readiness}/></footer>
            </Link>)}
            {!familyDossiers.length ? <Empty title={`Aucun ${familyItem.label}`} detail="Les dossiers de cette famille apparaîtront ici avec leurs classifications réelles." action="Créer" href="/market-os/content-command-center/studio"/> : null}
          </div>
        </article>
      })}
    </section> : null}

    {mode === "register" ? <section className={styles.registerPanel}><SectionHeader eyebrow="REGISTRE ENTERPRISE" title="Inventaire complet" description="Vue dense pour audit, filtres, tri et ouverture du dossier 360."/><div className={styles.directoryTable}><header><span>Référence</span><span>Contenu</span><span>Classification</span><span>Responsabilité</span><span>État</span><span>Source</span></header>{dossiers.map((dossier) => { const source=currentSources.get(dossier.id); return <Link key={dossier.id} href={`/market-os/content-command-center/dossiers/${dossier.id}`}><span><strong>{dossier.content_code}</strong><small>{formatDate(dossier.created_at)}</small></span><span><strong>{dossier.title}</strong><small>{dossier.campaign_label || "Hors campagne"}</small></span><span><strong>{dossier.category}</strong><small>{dossier.subcategory}</small></span><span><strong>{dossier.owner_name || "Non assigné"}</strong><small>{dossier.reviewer_name || "Reviewer à nommer"}</small></span><span><Badge tone={tone(dossier.status)}>{statusLabel(dossier.status)}</Badge></span><span><Badge tone={source?.integrity_state === "verified" ? "success" : "warning"}>{source ? statusLabel(source.integrity_state) : "Source absente"}</Badge></span></Link>})}</div></section> : null}

    {mode === "tree" ? <section className={styles.classificationTree}><SectionHeader eyebrow="NAVIGATION TAXONOMIQUE" title="Famille → catégorie → sous-catégorie → dossier" description="Une lecture arborescente fidèle aux trois studios de création existants."/>{CONTENT_FAMILIES.map((familyItem) => <article key={familyItem.id}><h2><FolderTree/>{familyItem.label}<span>{dossiers.filter((d) => d.family === familyItem.id).length}</span></h2><div>{familyItem.categories.map((category) => { const subset=dossiers.filter((d) => d.family === familyItem.id && d.category === category); return <details key={category}><summary>{category}<b>{subset.length}</b></summary><ul>{familyItem.subcategories.map((sub) => <li key={sub}><span>{sub}</span><b>{subset.filter((d) => d.subcategory === sub).length}</b></li>)}</ul></details>})}</div></article>)}</section> : null}

    {mode === "integrity" ? <section className={styles.integrityBoard}><SectionHeader eyebrow="SOURCE INTEGRITY" title="Un code, une source canonique" description="Les renditions sont multiples; l’original éditable actif reste unique."/><div className={styles.integrityStats}><span><CheckCircle2/><strong>{[...currentSources.values()].filter((s) => s.integrity_state === "verified").length}</strong><small>Sources vérifiées</small></span><span><ShieldAlert/><strong>{dossiers.filter((d) => !currentSources.has(d.id)).length}</strong><small>Sources manquantes</small></span><span><Archive/><strong>{snapshot?.sources.filter((s) => !s.is_current).length || 0}</strong><small>Métadonnées historiques</small></span></div><div className={styles.integrityRows}>{dossiers.map((dossier) => { const source=currentSources.get(dossier.id); return <Link key={dossier.id} href={`/market-os/content-command-center/dossiers/${dossier.id}`}><FileSearch/><div><strong>{dossier.content_code} · {dossier.title}</strong><p>{source ? `${source.original_filename} · v${source.source_version} · ${(source.size_bytes/1024/1024).toFixed(1)} MB` : "Original source requis après validation"}</p></div><Badge tone={source?.integrity_state === "verified" ? "success" : "danger"}>{source ? statusLabel(source.integrity_state) : "MANQUANTE"}</Badge></Link>})}</div></section> : null}

    {mode === "reuse" ? <section className={styles.reuseConstellation}><SectionHeader eyebrow="CONTENT INTELLIGENCE" title="Réutiliser sans dupliquer la pensée" description="Repérez les familles, formats et messages adaptables avant de produire à nouveau."/><div className={styles.reuseGrid}>{dossiers.slice(0, 12).map((dossier, index) => <Link key={dossier.id} href={`/market-os/content-command-center/dossiers/${dossier.id}`} style={{ ["--reuse-size" as string]: `${110 + (index%4)*18}px` } as React.CSSProperties}><Sparkles/><strong>{dossier.title}</strong><span>{dossier.service_label}</span><small>{dossier.category} · {dossier.channel}</small></Link>)}{!dossiers.length ? <Empty title="Aucune constellation" detail="Les liens de similarité seront produits à partir des contenus classifiés."/> : null}</div></section> : null}
  </main>
}
