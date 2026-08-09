"use client"

import { contentCommandRequest, toContentCommandBlocker } from '@/components/market-os/content-command/runtime/content-command-runtime'
import * as React from "react"
import Link from "next/link"
import {
  AlertOctagon, Archive, ArchiveRestore, ArrowLeftRight, BookOpenCheck, CheckCircle2, CircleAlert,
  Database, FileArchive, FileCheck2, FileClock, FileSearch, Fingerprint, HardDrive, History,
  KeyRound, Layers3, Link2, RefreshCw, Replace, RotateCcw, Scale, Search, Server, ShieldAlert,
  ShieldCheck, UploadCloud,
} from "lucide-react"
import { Field, Modal, PageStatus } from "./primitives"
import { formatDate, useHeadquartersSnapshot } from "./client"
import {
  EmptyKnowledge, FileClassLegend, IntegritySeal, KnowledgeMetric, KnowledgeTabs,
  SectionTitle, StatusPill, TruthBoundary,
} from "../knowledge/knowledge-ui"
import { buildAtlasModel, formatBytes, knowledgeTone, readableStatus } from "../knowledge/knowledge-model"
import styles from "../knowledge/knowledge-system.module.css"
import { ContentMediaPreview } from "../media-preview/ContentMediaPreview"

type VaultMode = "register" | "missing" | "versions" | "classes" | "replacement" | "rights" | "incidents" | "audit"
type ReplacementDossier = { id: string; content_code: string; title: string }
type ReplacementDraft = { dossier: ReplacementDossier; file: File } | null

const BASE = "/market-os/content-command-center"

export default function SourceVaultWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const model = React.useMemo(() => buildAtlasModel(snapshot), [snapshot])
  const [mode, setMode] = React.useState<VaultMode>("register")
  const [query, setQuery] = React.useState("")
  const [busy, setBusy] = React.useState("")
  const [operationError, setOperationError] = React.useState("")
  const [operationMessage, setOperationMessage] = React.useState("")
  const [replacement, setReplacement] = React.useState<ReplacementDraft>(null)
  const [replacementReason, setReplacementReason] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")

  const dossiers = snapshot?.dossiers || []
  const eligible = dossiers.filter((dossier: any) => ["validated", "source_required", "source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(dossier.status))
  const currentByDossier = new Map<string, any>((snapshot?.sources || []).filter((source: any) => source.is_current).map((source: any) => [source.dossier_id, source]))
  const filteredSources = model.sources.filter((source) => {
    const haystack = `${source.contentCode} ${source.contentTitle} ${source.filename} ${source.owner} ${source.integrity}`.toLowerCase()
    return !query.trim() || haystack.includes(query.trim().toLowerCase())
  })
  const missingEntries = model.entries.filter((entry) => !entry.hasCurrentSource)
  const incidentSources = model.sources.filter((source) => source.integrity !== "verified")
  const currentSources = filteredSources.filter((source) => source.current)

  async function executeUpload(dossier: ReplacementDossier, file: File, uploadMode: "initial" | "replace") {
    setBusy(dossier.id)
    setOperationError("")
    setOperationMessage("")
    try {
      const body = new FormData()
      body.set("dossierId", dossier.id)
      body.set("file", file)
      if (uploadMode === "replace") {
        body.set("replacementReason", replacementReason)
        body.set("confirmation", confirmation)
      }
      const endpoint = uploadMode === "replace" ? "/api/market-os/content-command-headquarters/source-replace" : "/api/market-os/content-command-headquarters/source-upload?mode=source"
      await contentCommandRequest(endpoint, { method: "POST", body })
      setReplacement(null)
      setReplacementReason("")
      setConfirmation("")
      setOperationMessage(uploadMode === "replace" ? "La nouvelle source a été traitée par le workflow de remplacement existant." : "La source a été transmise au workflow d’intégrité existant.")
      await refresh()
    } catch (nextError) {
      setOperationError(toContentCommandBlocker(nextError, "Source Vault").message)
    } finally {
      setBusy("")
    }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <div className={styles.liveRegion} aria-live="polite">{operationError || operationMessage}</div>
    {operationError ? <TruthBoundary title="Opération source non exécutée" detail={operationError} tone="danger"/> : null}
    {operationMessage ? <TruthBoundary title="Workflow source actualisé" detail={operationMessage} tone="success"/> : null}

    <section className={styles.hero}>
      <div className={styles.heroIdentity}>
        <span><Fingerprint/> SOURCE VAULT · AUTORITÉ CANONIQUE</span>
        <h1>Un original gouverné, une lignée de versions, aucune ambiguïté sur la source de vérité.</h1>
        <p>Source Vault distingue l’original éditable des versions de travail, renditions, aperçus, exports et copies de preuve. Il expose uniquement les intégrités, versions et états réellement présents dans le snapshot et les workflows existants.</p>
      </div>
      <div className={styles.heroActions}>
        <Link href={`${BASE}/directory`}><BookOpenCheck/> Ouvrir Content Atlas</Link>
        <button type="button" onClick={() => setMode("missing")}><FileSearch/> Sources manquantes</button>
        <button type="button" onClick={refresh}><RefreshCw/> Actualiser le coffre</button>
      </div>
    </section>

    <section className={styles.metrics} aria-label="État du Source Vault">
      <KnowledgeMetric icon={FileArchive} label="Sources canoniques" value={model.sources.filter((source) => source.current).length} detail="Sources marquées courantes dans le snapshot." tone="info"/>
      <KnowledgeMetric icon={FileSearch} label="Sources manquantes" value={missingEntries.length} detail="Dossiers visibles sans original courant." tone={missingEntries.length ? "danger" : "success"}/>
      <KnowledgeMetric icon={Fingerprint} label="Intégrité vérifiée" value={model.metrics.verifiedSources} detail={`${incidentSources.length} source(s) à vérifier ou en incident.`} tone={incidentSources.length ? "warning" : "success"}/>
      <KnowledgeMetric icon={History} label="Versions historiques" value={model.metrics.historicalSources} detail="Métadonnées non courantes préservées dans le snapshot." tone="neutral"/>
    </section>

    <div className={styles.searchBar} role="search">
      <Search aria-hidden="true"/>
      <input aria-label="Rechercher une source" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code contenu, fichier, responsable, intégrité…"/>
      <span aria-live="polite">{filteredSources.length} sources visibles</span>
      <StatusPill tone={snapshot?.bridge.available ? "success" : "warning"}>{snapshot?.bridge.available ? "Bridge disponible" : "Bridge à vérifier"}</StatusPill>
    </div>

    <KnowledgeTabs value={mode} onChange={setMode} label="Modes Source Vault" items={[
      { value: "register", label: "Sources canoniques", icon: FileArchive, count: currentSources.length },
      { value: "missing", label: "Sources manquantes", icon: FileSearch, count: missingEntries.length },
      { value: "versions", label: "Lignée des versions", icon: History, count: model.metrics.historicalSources },
      { value: "classes", label: "Classes de fichiers", icon: Layers3 },
      { value: "replacement", label: "Remplacement", icon: Replace },
      { value: "rights", label: "Droits & rétention", icon: Scale },
      { value: "incidents", label: "Incidents", icon: ShieldAlert, count: incidentSources.length + missingEntries.length },
      { value: "audit", label: "Audit observable", icon: Database },
    ]}/>

    {mode === "register" ? <section className={styles.vaultLayout}>
      <article className={styles.section}>
        <SectionTitle eyebrow="CANONICAL SOURCE REGISTER" title="Originaux courants et contrôles disponibles" description="Le statut canonique vient du champ is_current; l’interface ne déduit jamais l’autorité du nom de fichier."/>
        <div className={styles.sourceRegister}>{eligible.map((dossier: any) => {
          const source = currentByDossier.get(dossier.id)
          return <article key={dossier.id} className={styles.sourceRow}>
            <div className={styles.sourceIdentity}><span><FileArchive/></span><div><small>{dossier.content_code}</small><strong>{dossier.title}</strong><small>{dossier.category} · {dossier.service_label}</small></div></div>
            <div className={styles.sourceMediaPreview}>{source ? <ContentMediaPreview source={{ id: source.id, title: source.original_filename || dossier.title, bridgeFileId: source.bridge_file_id, storageKey: source.storage_key, contentType: source.content_type, filename: source.original_filename, sizeBytes: source.size_bytes, sourceLabel: `${dossier.content_code} · Source canonique` }} mode="compact" fit="contain"/> : <ContentMediaPreview source={{ title: dossier.title, filename: "Source manquante" }} mode="compact" interactive={false}/>}</div>
            <div className={styles.sourceFile}>{source ? <><strong>{source.original_filename}</strong><small>{formatBytes(source.size_bytes)} · v{source.source_version}</small></> : <><strong>Original non sécurisé</strong><small>La source est requise par le cycle gouverné.</small></>}</div>
            <IntegritySeal verified={source?.integrity_state === "verified"} label={source ? readableStatus(source.integrity_state) : "Source manquante"}/>
            <StatusPill tone={source ? "info" : "danger"}>{source ? "Canonique courante" : "À constituer"}</StatusPill>
            <label aria-label={source ? `Préparer le remplacement de ${dossier.title}` : `Charger la source de ${dossier.title}`}><input type="file" disabled={busy === dossier.id} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; const replacementDossier = { id: dossier.id, content_code: dossier.content_code, title: dossier.title }; if (source) setReplacement({ dossier: replacementDossier, file }); else void executeUpload(replacementDossier, file, "initial") }}/>{source ? <><Replace/> Remplacer</> : <><UploadCloud/> Charger</>}</label>
            <Link href={`${BASE}/dossiers/${dossier.id}`}><Link2/> Dossier</Link>
          </article>
        })}</div>
        {!eligible.length ? <EmptyKnowledge title="Aucun dossier éligible" detail="Les dossiers validés ou exigeant une source apparaîtront ici."/> : null}
      </article>
      <aside className={styles.vaultRail}>
        <TruthBoundary title="Autorité canonique explicite" detail="Un upload initial utilise le workflow source existant; aucun fichier n’est déclaré canonique par simple affichage front-end." tone="info"/>
        <article className={styles.section}><SectionTitle eyebrow="ÉTAT OPÉRATIONNEL" title="Stockage & passerelle" description="Signal de disponibilité exposé, sans secret ni contrôle infrastructure."/><div className={styles.sourceSummary}><article><Server/><strong>{snapshot?.bridge.available ? "ONLINE" : "À vérifier"}</strong><small>Windows Bridge</small></article><article><HardDrive/><strong>Non exposée</strong><small>Capacité physique</small></article><article><KeyRound/><strong>Protégé</strong><small>Accès par permissions existantes</small></article><article><ShieldCheck/><strong>1 courante</strong><small>Doctrine canonique par dossier</small></article></div></article>
      </aside>
    </section> : null}

    {mode === "missing" ? <section className={styles.section}>
      <SectionTitle eyebrow="MISSING SOURCE QUEUE" title="Dossiers sans original courant" description="Chaque lacune est reliée à son dossier et à son responsable actuel; aucune fausse source n’est générée."/>
      <div className={styles.incidentList}>{missingEntries.map((entry) => <article key={entry.id} className={styles.incidentCard}><span><FileSearch/></span><div><strong>{entry.code} · {entry.title}</strong><p>Source canonique absente · {entry.assetCount} asset(s) · {entry.publicationCount} publication(s) observée(s)</p><small>Responsable: {entry.owner}</small></div><Link href={`${BASE}/dossiers/${entry.id}`}>Ouvrir le dossier</Link></article>)}</div>
      {!missingEntries.length ? <TruthBoundary title="Aucune source courante manquante" detail="Cette conclusion se limite aux dossiers et sources présents dans le snapshot actuel." tone="success"/> : null}
    </section> : null}

    {mode === "versions" ? <section className={styles.section}>
      <SectionTitle eyebrow="VERSION LINEAGE" title="Chaque version reste identifiable" description="Les versions courantes, historiques et états d’intégrité sont ordonnés par dossier sans effacer les prédécesseurs."/>
      <div className={styles.versionTimeline}>{Array.from(model.sourceVersions.entries()).flatMap(([dossierId, versions]) => versions.map((source) => <article key={source.id} className={styles.versionItem}><span>v{source.version}</span><div className={styles.versionMediaPreview}><ContentMediaPreview source={{ id: source.id, title: source.filename, bridgeFileId: source.bridgeFileId, storageKey: source.storageKey, contentType: source.contentType, filename: source.filename, sizeBytes: source.sizeBytes, sourceLabel: `${source.contentCode} · v${source.version}` }} mode="compact" fit="contain"/></div><div><small>{source.contentCode} · {source.contentTitle}</small><strong>{source.filename}</strong><p>{formatBytes(source.sizeBytes)} · {source.createdAt ? formatDate(source.createdAt, true) : "Date non exposée"} · {source.owner}</p></div><div><StatusPill tone={source.current ? "info" : "neutral"}>{source.current ? "Courante" : "Historique"}</StatusPill><StatusPill tone={knowledgeTone(source.integrity)}>{readableStatus(source.integrity)}</StatusPill></div></article>))}</div>
      {!model.sources.length ? <EmptyKnowledge title="Aucune version disponible" detail="La lignée apparaîtra après les premiers uploads ou remplacements persistés."/> : null}
    </section> : null}

    {mode === "classes" ? <section className={styles.section}>
      <SectionTitle eyebrow="FILE AUTHORITY MODEL" title="Original, rendition, aperçu et export ne sont jamais équivalents" description="Une légende institutionnelle empêche les erreurs d’autorité documentaire."/>
      <FileClassLegend/>
      <TruthBoundary title="Limite du modèle actuel" detail="Le snapshot fourni expose principalement les sources canoniques. Les renditions, aperçus et exports restent distingués par doctrine et relations, mais ne sont pas inventés comme fichiers persistés." tone="warning"/>
    </section> : null}

    {mode === "replacement" ? <section className={styles.section}>
      <SectionTitle eyebrow="SOURCE REPLACEMENT CHAMBER" title="Remplacer sans écraser l’histoire" description="Le workflow existant exige une raison et une confirmation exacte avant de demander le remplacement."/>
      {currentSources.length ? <div className={styles.replacementGrid}><article className={styles.replacementPane}><span><FileArchive/> Source canonique actuelle</span><h3>{currentSources[0].filename}</h3><p>{currentSources[0].contentCode} · v{currentSources[0].version} · {readableStatus(currentSources[0].integrity)}</p></article><div className={styles.replacementArrow}><ArrowLeftRight/></div><article className={styles.replacementPane}><span><Replace/> Remplacement gouverné</span><h3>Nouveau fichier non sélectionné</h3><p>Utilisez « Remplacer » dans le registre pour choisir un fichier, documenter la raison et confirmer le code.</p></article></div> : <EmptyKnowledge title="Aucune source remplaçable" detail="Une source courante doit exister avant l’ouverture d’un remplacement."/>}
      <div className={styles.impactGrid}><article><strong>{model.entries.reduce((sum, entry) => sum + entry.assetCount, 0)}</strong><small>Assets reliés aux dossiers visibles</small></article><article><strong>{model.entries.reduce((sum, entry) => sum + entry.publicationCount, 0)}</strong><small>Publications observées à considérer</small></article><article><strong>{model.metrics.historicalSources}</strong><small>Versions historiques déjà présentes</small></article></div>
      <TruthBoundary title="Aucune propagation automatique revendiquée" detail="Source Vault montre l’impact observable; il ne prétend pas remplacer automatiquement les assets, packages ou publications sans backend dédié." tone="info"/>
    </section> : null}

    {mode === "rights" ? <section className={styles.section}>
      <SectionTitle eyebrow="RIGHTS & RETENTION" title="Ne jamais supposer un usage illimité" description="Les champs non présents restent explicitement non documentés."/>
      <div className={styles.rightsGrid}>
        <article className={styles.rightsCard}><header><span><Scale/></span><div><h3>Droits d’usage</h3><StatusPill tone="warning">Non documentés par défaut</StatusPill></div></header><dl><div><dt>Titulaire</dt><dd>Non exposé</dd></div><div><dt>Périmètre</dt><dd>Non exposé</dd></div><div><dt>Expiration</dt><dd>Non exposée</dd></div><div><dt>Attribution</dt><dd>Non exposée</dd></div></dl></article>
        <article className={styles.rightsCard}><header><span><Archive/></span><div><h3>Rétention institutionnelle</h3><StatusPill tone="warning">Classification absente</StatusPill></div></header><dl><div><dt>Classe</dt><dd>Non documentée</dd></div><div><dt>Période</dt><dd>Non documentée</dd></div><div><dt>Révision</dt><dd>Non planifiée</dd></div><div><dt>Destruction</dt><dd>Aucune éligibilité supposée</dd></div></dl></article>
      </div>
      <TruthBoundary title="Blocage honnête, pas faux contrôle" detail="Mega ZIP 6 n’ajoute aucune table de droits ou de rétention. Il expose la lacune institutionnelle pour qu’elle ne soit jamais confondue avec une autorisation." tone="warning"/>
    </section> : null}

    {mode === "incidents" ? <section className={styles.section}>
      <SectionTitle eyebrow="INTEGRITY INCIDENT COMMAND" title="Sources absentes ou non vérifiées" description="Incidents déterministes issus de l’état d’intégrité et de l’absence de source courante."/>
      <div className={styles.incidentList}>{incidentSources.map((source) => <article key={source.id} className={styles.incidentCard}><span><AlertOctagon/></span><div><strong>{source.contentCode} · {source.filename}</strong><p>État: {readableStatus(source.integrity)} · v{source.version} · {formatBytes(source.sizeBytes)}</p><small>Responsable: {source.owner}</small></div><StatusPill tone={knowledgeTone(source.integrity)}>{readableStatus(source.integrity)}</StatusPill></article>)}{missingEntries.map((entry) => <article key={`missing-${entry.id}`} className={styles.incidentCard}><span><FileSearch/></span><div><strong>{entry.code} · Source absente</strong><p>{entry.title} ne possède pas de source courante dans le snapshot.</p><small>Responsable: {entry.owner}</small></div><Link href={`${BASE}/dossiers/${entry.id}`}>Dossier</Link></article>)}</div>
      {!incidentSources.length && !missingEntries.length ? <TruthBoundary title="Aucun incident déterministe" detail="Seuls les états du snapshot actuel sont évalués; cela ne constitue pas un audit physique du stockage." tone="success"/> : null}
      <SectionTitle eyebrow="RESTORATION CHAMBER" title="Restaurer sans falsifier l’historique" description="La lignée est visible, mais aucune API de restauration n’est exposée dans le paquet source."/>
      <div className={styles.replacementGrid}><article className={styles.replacementPane}><span><FileClock/> Version historique</span><h3>{model.sources.find((source) => !source.current)?.filename || "Aucune version historique disponible"}</h3><p>Une version antérieure ne devient jamais canonique par simple interaction locale.</p></article><div className={styles.replacementArrow}><RotateCcw/></div><article className={styles.replacementPane}><span><ArchiveRestore/> Restauration gouvernée</span><h3>Action backend non exposée</h3><p>Le futur workflow devra préserver la source actuelle, créer l’événement de restauration et enregistrer l’autorité.</p></article></div>
    </section> : null}

    {mode === "audit" ? <section className={styles.section}>
      <SectionTitle eyebrow="VAULT AUDIT" title="Événements observables, sans journal inventé" description="La chronologie ci-dessous provient des métadonnées de sources disponibles: version, état courant, date et intégrité."/>
      <div className={styles.auditList}>{model.sources.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).map((source) => <article key={source.id} className={styles.auditItem}><span>{source.current ? <CheckCircle2/> : <History/>}</span><div><strong>{source.current ? "Source courante observable" : "Version historique observable"}</strong><p>{source.contentCode} · {source.filename} · v{source.version} · {readableStatus(source.integrity)}</p></div><time>{source.createdAt ? formatDate(source.createdAt, true) : "Date non exposée"}</time></article>)}</div>
      {!model.sources.length ? <EmptyKnowledge title="Aucun événement observable" detail="Aucune source ou version n’est actuellement exposée par le snapshot."/> : null}
      <TruthBoundary title="Audit partiel" detail="Aucun acteur ou motif de remplacement n’est inventé lorsque ces champs ne sont pas présents. L’historique complet reste une responsabilité backend." tone="info"/>
    </section> : null}

    <Modal open={Boolean(replacement)} title="Remplacement irréversible de la source canonique" onClose={() => setReplacement(null)} footer={<><button className={styles.secondaryAction} type="button" onClick={() => setReplacement(null)}>Annuler</button><button className={styles.dangerAction} type="button" disabled={!replacement || !replacementReason.trim() || confirmation !== `REMPLACER ${replacement?.dossier.content_code}` || busy === replacement?.dossier.id} onClick={() => replacement && void executeUpload(replacement.dossier, replacement.file, "replace")}><Replace/> Demander le remplacement</button></>}>
      {replacement ? <div className={styles.formGrid}>
        <div className={`${styles.truthBoundary} ${styles.tone_danger} ${styles.fieldWide}`}><AlertOctagon/><div><strong>Le workflow existant doit valider la nouvelle source avant toute promotion.</strong><p>Le front-end ne modifie jamais localement l’autorité canonique et ne simule aucune suppression.</p></div></div>
        <Field label="Contenu"><input value={`${replacement.dossier.content_code} · ${replacement.dossier.title}`} readOnly/></Field>
        <Field label="Nouveau fichier"><input value={`${replacement.file.name} · ${formatBytes(replacement.file.size)}`} readOnly/></Field>
        <Field label="Raison opérationnelle" wide><textarea rows={4} value={replacementReason} onChange={(event) => setReplacementReason(event.target.value)} placeholder="Pourquoi la source courante doit-elle être remplacée?"/></Field>
        <Field label={`Saisissez exactement: REMPLACER ${replacement.dossier.content_code}`} wide><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off"/></Field>
      </div> : null}
    </Modal>
  </main>
}
