"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle, Archive, ArrowLeftRight, BookOpenCheck, Boxes, CircleAlert, Copy, FileArchive,
  FileCheck2, FileSearch, FolderTree, GitBranch, Grid3X3, History, Layers3, LibraryBig,
  Network, Route, Search, ShieldAlert, Sparkles, TableProperties, Tags, Users,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { CONTENT_FAMILIES, formatDate, useHeadquartersSnapshot } from "./client"
import {
  EmptyKnowledge, IntegritySeal, KnowledgeMetric, KnowledgeTabs, RelationshipChain,
  SectionTitle, StatusPill, TruthBoundary,
} from "../knowledge/knowledge-ui"
import { buildAtlasModel, knowledgeTone, readableStatus } from "../knowledge/knowledge-model"
import styles from "../knowledge/knowledge-system.module.css"

type AtlasMode = "atlas" | "register" | "classification" | "relationships" | "reuse" | "integrity"

const BASE = "/market-os/content-command-center"

export default function DirectoryWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const model = React.useMemo(() => buildAtlasModel(snapshot), [snapshot])
  const [mode, setMode] = React.useState<AtlasMode>("atlas")
  const [query, setQuery] = React.useState("")
  const [family, setFamily] = React.useState("all")
  const normalizedQuery = query.trim().toLowerCase()
  const entries = model.entries.filter((entry) => {
    const haystack = [entry.code, entry.title, entry.family, entry.category, entry.subcategory, entry.service, entry.audience, entry.city, entry.language, entry.channel, entry.campaign, entry.owner].join(" ").toLowerCase()
    return (family === "all" || entry.family === family) && (!normalizedQuery || haystack.includes(normalizedQuery))
  })
  const grouped = CONTENT_FAMILIES.map((item) => ({ ...item, entries: entries.filter((entry) => entry.family === item.id) }))
  const selectedForLineage = entries[0]

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.hero}>
      <div className={styles.heroIdentity}>
        <span><LibraryBig/> CONTENT ATLAS · MÉMOIRE INSTITUTIONNELLE</span>
        <h1>Tout ce qu’AngelCare a créé, relié à sa raison, sa source et son histoire.</h1>
        <p>Explorez le patrimoine Content Command par classification, relations, lignée stratégique, intégrité source et potentiel de réutilisation — sans transformer les lacunes du modèle en données fictives.</p>
      </div>
      <div className={styles.heroActions}>
        <Link href={`${BASE}/source-vault`}><FileArchive/> Ouvrir Source Vault</Link>
        <Link href={`${BASE}/studio`}><Layers3/> Nouvelle production</Link>
        <button type="button" onClick={refresh}><History/> Actualiser l’inventaire</button>
      </div>
    </section>

    <div className={styles.searchBar} role="search">
      <Search aria-hidden="true"/>
      <input aria-label="Rechercher dans Content Atlas" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, titre, service, audience, campagne, ville, canal, responsable…"/>
      <span aria-live="polite">{entries.length} contenus visibles</span>
      <select aria-label="Filtrer par famille" value={family} onChange={(event) => setFamily(event.target.value)}>
        <option value="all">Toutes les familles</option>
        {CONTENT_FAMILIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </div>

    <section className={styles.metrics} aria-label="État du patrimoine contenu">
      <KnowledgeMetric icon={LibraryBig} label="Patrimoine visible" value={model.metrics.total} detail="Dossiers présents dans la source Headquarters." tone="info"/>
      <KnowledgeMetric icon={Tags} label="Classifiés" value={model.metrics.classified} detail={`${model.metrics.unclassified} dossiers nécessitent encore une classification.`} tone={model.metrics.unclassified ? "warning" : "success"}/>
      <KnowledgeMetric icon={FileCheck2} label="Sources vérifiées" value={model.metrics.verifiedSources} detail={`${model.metrics.missingSource} sources canoniques manquantes.`} tone={model.metrics.missingSource ? "danger" : "success"}/>
      <KnowledgeMetric icon={Sparkles} label="Réutilisations déterministes" value={model.metrics.reuseCandidates} detail="Candidats fondés uniquement sur des métadonnées partagées." tone="neutral"/>
    </section>

    <KnowledgeTabs value={mode} onChange={setMode} label="Modes Content Atlas" items={[
      { value: "atlas", label: "Atlas visuel", icon: Grid3X3, count: entries.length },
      { value: "register", label: "Registre", icon: TableProperties, count: entries.length },
      { value: "classification", label: "Classification", icon: FolderTree, count: model.metrics.unclassified },
      { value: "relationships", label: "Relations & lignée", icon: Network },
      { value: "reuse", label: "Réutilisation", icon: Sparkles, count: model.metrics.reuseCandidates },
      { value: "integrity", label: "Intégrité & risques", icon: ShieldAlert, count: model.risks.length },
    ]}/>

    {mode === "atlas" ? <section className={styles.atlasGrid}>
      <article className={styles.atlasMap} aria-label="Atlas visuel avec résumé textuel disponible dans le registre">
        <div className={styles.atlasCore}><LibraryBig/><strong>Content Atlas</strong><small>{entries.length} contenus</small></div>
        <div className={styles.atlasNodes}>{grouped.flatMap((familyItem) => familyItem.entries.slice(0, 2)).slice(0, 6).map((entry) => <Link key={entry.id} href={`${BASE}/dossiers/${entry.id}`} className={styles.atlasNode}><Boxes/><b>{entry.assetCount + entry.taskCount}</b><strong>{entry.title}</strong><small>{entry.service || entry.category || "Classification à compléter"}</small></Link>)}</div>
        {!entries.length ? <EmptyKnowledge title="Atlas vide" detail="Les dossiers classifiés apparaîtront ici avec leurs relations réelles." href={`${BASE}/studio`} action="Ouvrir les Studios"/> : null}
      </article>
      <aside className={styles.atlasRail}>
        <SectionTitle eyebrow="RISQUES DE CONNAISSANCE" title="Ce qui menace la continuité" description="Risques calculés uniquement depuis les champs disponibles."/>
        {model.risks.slice(0, 7).map((risk) => <Link key={risk.id} href={risk.href} className={`${styles.riskCard} ${styles[`tone_${risk.tone}`]}`}><AlertTriangle/><div><strong>{risk.title}</strong><p>{risk.detail}</p><small>Responsable: {risk.owner}</small></div><StatusPill tone={risk.tone}>{risk.category}</StatusPill></Link>)}
        {!model.risks.length ? <TruthBoundary title="Aucun risque déterministe ouvert" detail="Cela ne constitue pas une certification exhaustive: seuls les champs exposés sont évalués." tone="success"/> : null}
      </aside>
    </section> : null}

    {mode === "register" ? <section className={styles.section}>
      <SectionTitle eyebrow="REGISTRE ENTERPRISE" title="Inventaire dense et fiable" description="Identité, classification, responsabilité, source et usage observé, sans interprétation opaque." action={<Link href={`${BASE}/source-vault`}>Contrôler les sources</Link>}/>
      <div className={styles.register} role="table" aria-label="Registre institutionnel des contenus">
        <div className={styles.registerHeader} role="row"><span>Référence</span><span>Contenu</span><span>Classification</span><span>Responsabilité</span><span>État</span><span>Source canonique</span><span>Usage</span></div>
        {entries.map((entry) => <Link key={entry.id} href={`${BASE}/dossiers/${entry.id}`} className={styles.registerRow} role="row">
          <span><strong>{entry.code}</strong><small>{formatDate(entry.createdAt)}</small></span>
          <span><strong>{entry.title}</strong><small>{entry.campaign || "Hors campagne documentée"}</small></span>
          <span><strong>{entry.category || "Catégorie absente"}</strong><small>{entry.service || entry.family || "Famille absente"}</small></span>
          <span><strong>{entry.owner}</strong><small>{entry.reviewer}</small></span>
          <span><StatusPill tone={knowledgeTone(entry.status)}>{readableStatus(entry.status)}</StatusPill></span>
          <span><IntegritySeal verified={entry.sourceIntegrity === "verified"} label={entry.hasCurrentSource ? `${entry.sourceName} · v${entry.sourceVersion}` : "Source manquante"}/></span>
          <span><strong>{entry.publicationCount} publication(s)</strong><small>{entry.assetCount} asset(s) · {entry.taskCount} tâche(s)</small></span>
        </Link>)}
      </div>
      {!entries.length ? <EmptyKnowledge title="Aucun contenu correspondant" detail="Modifiez les filtres ou la recherche pour retrouver le patrimoine existant."/> : null}
    </section> : null}

    {mode === "classification" ? <section className={styles.section}>
      <SectionTitle eyebrow="ARBRE TAXONOMIQUE" title="Famille → catégorie → sous-catégorie" description="L’arbre suit strictement les taxonomies déjà exposées par Content Command."/>
      <div className={styles.treeGrid}>{grouped.map((familyItem) => <article key={familyItem.id} className={styles.treeBranch}><header><span><FolderTree/></span><div><h3>{familyItem.label}</h3><p>{familyItem.entries.length} contenus visibles</p></div></header>{familyItem.categories.map((category) => { const subset = familyItem.entries.filter((entry) => entry.category === category); return <details key={category}><summary>{category}<b>{subset.length}</b></summary><ul>{familyItem.subcategories.map((subcategory) => <li key={subcategory}><span>{subcategory}</span><b>{subset.filter((entry) => entry.subcategory === subcategory).length}</b></li>)}</ul></details>})}</article>)}</div>
      {model.metrics.unclassified ? <TruthBoundary title={`${model.metrics.unclassified} classification(s) incomplète(s)`} detail="Content Atlas signale les champs absents mais n’invente aucune catégorie de remplacement." tone="warning"/> : null}
    </section> : null}

    {mode === "relationships" ? <section className={styles.section}>
      <SectionTitle eyebrow="RELATIONS & LIGNÉE" title="Pourquoi ce contenu existe et où il mène" description="Une chaîne lisible relie le dossier à ses artefacts opérationnels réellement observables."/>
      {selectedForLineage ? <>
        <RelationshipChain stages={[
          { label: "Stratégie", value: selectedForLineage.campaign || "Relation non exposée", href: `${BASE}/strategies`, state: selectedForLineage.campaign ? "info" : "warning" },
          { label: "Dossier", value: selectedForLineage.code, href: `${BASE}/dossiers/${selectedForLineage.id}`, state: "success" },
          { label: "Mission / tâches", value: `${selectedForLineage.taskCount} tâche(s)`, href: `${BASE}/tasks`, state: selectedForLineage.taskCount ? "info" : "warning" },
          { label: "Asset", value: `${selectedForLineage.assetCount} asset(s)`, href: `${BASE}/assets`, state: selectedForLineage.assetCount ? "info" : "warning" },
          { label: "Preuve / revue", value: `${selectedForLineage.evidenceCount} preuve(s) · ${selectedForLineage.reviewCount} revue(s)`, href: `${BASE}/evidence`, state: selectedForLineage.evidenceCount ? "info" : "warning" },
          { label: "Source", value: selectedForLineage.sourceName || "Source absente", href: `${BASE}/source-vault`, state: selectedForLineage.hasCurrentSource ? "success" : "danger" },
          { label: "Publication", value: `${selectedForLineage.publicationCount} publication(s)`, href: `${BASE}/publishing`, state: selectedForLineage.publicationCount ? "success" : "neutral" },
        ]}/>
        <div className={styles.relationshipGrid}>
          <div className={styles.relationGraph}>{entries.slice(0, 8).map((entry, index) => <Link key={entry.id} href={`${BASE}/dossiers/${entry.id}`} className={styles.relationNode}><span>{index % 3 === 0 ? <Route/> : index % 3 === 1 ? <GitBranch/> : <FileArchive/>}</span><strong>{entry.code}</strong><p>{entry.title}</p><small>{entry.taskCount} tâches · {entry.assetCount} assets · {entry.publicationCount} publications</small></Link>)}</div>
          <aside className={styles.atlasRail}><TruthBoundary title="Lignée partielle, jamais simulée" detail="Les étapes non exposées par le snapshot restent indiquées comme absentes; Content Atlas ne fabrique ni stratégie ni publication." tone="info"/>{model.risks.filter((risk) => ["source", "classification", "ownership"].includes(risk.category)).slice(0, 5).map((risk) => <Link className={`${styles.knowledgeCard} ${styles[`tone_${risk.tone}`]}`} href={risk.href} key={risk.id}><CircleAlert/><div><strong>{risk.title}</strong><p>{risk.detail}</p></div></Link>)}</aside>
        </div>
      </> : <EmptyKnowledge title="Aucune lignée disponible" detail="Le premier dossier correspondant à vos filtres servira de point de lecture."/>}
    </section> : null}

    {mode === "reuse" ? <section className={styles.section}>
      <SectionTitle eyebrow="INTELLIGENCE DE RÉUTILISATION" title="Réutiliser sur des bases explicables" description="Les rapprochements utilisent uniquement des attributs partagés — jamais une similarité sémantique inventée."/>
      <div className={styles.reuseGrid}>{model.reuse.filter((candidate) => entries.some((entry) => entry.id === candidate.left.id || entry.id === candidate.right.id)).slice(0, 12).map((candidate) => <article key={candidate.id} className={styles.comparisonCard}><Link href={`${BASE}/dossiers/${candidate.left.id}`}><small>{candidate.left.code}</small><strong>{candidate.left.title}</strong></Link><span><ArrowLeftRight/></span><Link href={`${BASE}/dossiers/${candidate.right.id}`}><small>{candidate.right.code}</small><strong>{candidate.right.title}</strong></Link><footer>{candidate.shared.map((item) => <StatusPill key={item} tone="info">{item}</StatusPill>)}</footer></article>)}</div>
      {!model.reuse.length ? <EmptyKnowledge title="Aucun candidat déterministe" detail="Aucune paire ne partage actuellement au moins trois attributs institutionnels documentés."/> : null}
      <SectionTitle eyebrow="DUPLICATES" title="Doublons à confirmer humainement" description="Aucune fusion automatique: chaque rapprochement affiche sa base observable."/>
      <div className={styles.duplicateGrid}>{model.duplicates.map((candidate) => <article key={candidate.id} className={styles.comparisonCard}><Link href={`${BASE}/dossiers/${candidate.left.id}`}><small>{candidate.left.code}</small><strong>{candidate.left.title}</strong></Link><span><Copy/></span><Link href={`${BASE}/dossiers/${candidate.right.id}`}><small>{candidate.right.code}</small><strong>{candidate.right.title}</strong></Link><footer>{candidate.basis.map((item) => <StatusPill key={item} tone="warning">{item}</StatusPill>)}</footer></article>)}</div>
      {!model.duplicates.length ? <TruthBoundary title="Aucun doublon exact détecté" detail="Cette conclusion porte seulement sur le code, le titre normalisé et l’empreinte source lorsqu’elle existe." tone="success"/> : null}
    </section> : null}

    {mode === "integrity" ? <section className={styles.section}>
      <SectionTitle eyebrow="INTÉGRITÉ & MÉMOIRE" title="Le patrimoine qui doit rester récupérable" description="Sources canoniques, historique, risques de classification et usage observé." action={<Link href={`${BASE}/source-vault`}>Entrer dans Source Vault</Link>}/>
      <div className={styles.sourceSummary}>
        <article><FileCheck2/><strong>{model.metrics.verifiedSources}</strong><small>Sources courantes vérifiées</small></article>
        <article><FileSearch/><strong>{model.metrics.missingSource}</strong><small>Sources canoniques manquantes</small></article>
        <article><Archive/><strong>{model.metrics.historicalSources}</strong><small>Métadonnées de versions historiques</small></article>
        <article><ShieldAlert/><strong>{model.risks.length}</strong><small>Risques de connaissance ouverts</small></article>
      </div>
      <div className={styles.usageGrid}>{entries.slice(0, 12).map((entry) => <article key={entry.id} className={styles.usageCard}><Users/><strong>{entry.title}</strong><p>{entry.publicationCount} publication(s) · {entry.assetCount} asset(s) · {entry.evidenceCount} preuve(s)</p><StatusPill tone={entry.hasCurrentSource ? knowledgeTone(entry.sourceIntegrity) : "danger"}>{entry.hasCurrentSource ? readableStatus(entry.sourceIntegrity) : "Source absente"}</StatusPill></article>)}</div>
      <TruthBoundary title="Usage observé, pas comportemental" detail="Les volumes proviennent uniquement des relations persistées du snapshot; aucune consultation ou ouverture de page n’est comptée comme usage." tone="info"/>
    </section> : null}
  </main>
}
