"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Clock3, ExternalLink,
  FileCheck2, History, Link2, Radio, RefreshCcw, RotateCcw, Send, ShieldCheck,
  Siren, UploadCloud, XCircle,
} from "lucide-react"
import { canPublish, statusLabel as legacyStatusLabel, useContentStore, type ContentItem } from "./content-command-system"
import { formatDate, headquartersAction, tone, useHeadquartersSnapshot } from "./headquarters/client"
import type { PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"
import {
  executionModeLabel, failureRecord, packageDominantAction, publicationProof, releaseManifest,
  requiredRenditions, statusLabel, verificationRecord, verificationState,
  type Bulk6ExecutionMode,
} from "./experience-bulk6/bulk6-release-model"
import { Empty, Field, Metric, Modal, Pill, SectionTitle, toneClass, type ReleaseTone } from "./release/release-ui"
import styles from "./release/mz7-release.module.css"
import { ContentMediaPreview } from "./media-preview/ContentMediaPreview"

type ActiveModal = "execute" | "verify" | "failure" | "recovery" | "terminate" | null

function todayKey() { return new Date().toISOString().slice(0, 10) }
function localDateTime(value?: string | null) {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
function statusTone(pkg: PublicationPackage): ReleaseTone {
  if (pkg.status === "verified") return "success"
  if (["failed", "blocked", "verification_failed", "withdrawn"].includes(pkg.status)) return "danger"
  if (pkg.status === "published") return verificationState(pkg) === "awaiting_verification" ? "warning" : "info"
  if (pkg.status === "scheduled") return "authority"
  if (pkg.status === "ready") return "info"
  return "neutral"
}

export default function ContentPublishingPage() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const { store } = useContentStore()
  const [selectedId, setSelectedId] = React.useState("")
  const [modal, setModal] = React.useState<ActiveModal>(null)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [executionMode, setExecutionMode] = React.useState<Bulk6ExecutionMode>("manual")
  const [externalReference, setExternalReference] = React.useState("")
  const [executionNote, setExecutionNote] = React.useState("")
  const [versionIdentity, setVersionIdentity] = React.useState("")
  const [renditionIdentity, setRenditionIdentity] = React.useState("")
  const [verificationConclusion, setVerificationConclusion] = React.useState<"verified" | "failed">("verified")
  const [verificationReason, setVerificationReason] = React.useState("")
  const [failureClass, setFailureClass] = React.useState("provider_rejection")
  const [failureImpact, setFailureImpact] = React.useState("")
  const [recoveryOwner, setRecoveryOwner] = React.useState("")
  const [recoveryAction, setRecoveryAction] = React.useState("")
  const [recoveryResolution, setRecoveryResolution] = React.useState("")
  const [recoverySchedule, setRecoverySchedule] = React.useState(localDateTime())
  const [terminationDecision, setTerminationDecision] = React.useState<"withdrawn" | "superseded" | "cancelled">("withdrawn")
  const [terminationReason, setTerminationReason] = React.useState("")
  const [replacementPackageId, setReplacementPackageId] = React.useState("")

  const packages = snapshot?.publicationPackages || []
  const selected = packages.find((pkg) => pkg.id === selectedId) || packages[0]
  const dossier = snapshot?.dossiers.find((item) => item.id === selected?.dossier_id)
  const dossierSource = snapshot?.sources.find((item) => item.dossier_id === selected?.dossier_id && item.is_current) || snapshot?.sources.find((item) => item.dossier_id === selected?.dossier_id)
  const dossierEvidence = snapshot?.evidence.filter((item) => item.dossier_id === selected?.dossier_id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const manifest = selected ? releaseManifest(selected) : null
  const proof = selected ? publicationProof(selected) : null
  const verification = selected ? verificationRecord(selected) : null
  const failure = selected ? failureRecord(selected) : null
  const renditions = selected ? requiredRenditions(selected) : []
  const authorized = packages.filter((pkg) => pkg.status === "scheduled")
  const dueToday = authorized.filter((pkg) => pkg.scheduled_at?.slice(0, 10) === todayKey())
  const awaitingVerification = packages.filter((pkg) => pkg.status === "published")
  const verified = packages.filter((pkg) => pkg.status === "verified")
  const failures = packages.filter((pkg) => ["failed", "blocked", "verification_failed"].includes(pkg.status))
  const legacyQueue = store.items.filter((item) => ["approved", "scheduled", "published"].includes(item.status))

  React.useEffect(() => {
    if (!selected) return
    const currentManifest = releaseManifest(selected)
    setExecutionMode(currentManifest?.executionMode || (selected.channel === "Print" ? "print" : selected.channel === "Internal Workspace" ? "internal" : "manual"))
    setVersionIdentity(currentManifest?.canonicalSourceVersion ? `Source V${currentManifest.canonicalSourceVersion}` : "")
    setRenditionIdentity(requiredRenditions(selected)[0]?.name || "")
  }, [selected?.id])

  async function run(action: string, payload: Record<string, unknown>, success: string) {
    setBusy(action); setNotice("")
    try { await headquartersAction(action, payload); setNotice(success); setModal(null); await refresh() }
    catch (nextError) { setNotice(nextError instanceof Error ? nextError.message : "BULK6_PUBLISHING_ACTION_FAILED") }
    finally { setBusy("") }
  }

  async function recordExecution() {
    if (!selected) return
    await run("publication_record_execution", { packageId: selected.id, executionMode, externalReference, note: executionNote, versionIdentity, renditionIdentity }, "Publication exécutée et preuve enregistrée. Elle attend encore une vérification indépendante.")
    setExternalReference(""); setExecutionNote("")
  }
  async function verifyExecution() {
    if (!selected) return
    await run("publication_verify", { packageId: selected.id, conclusion: verificationConclusion, reason: verificationReason }, verificationConclusion === "verified" ? "Publication vérifiée et décision persistée." : "Vérification échouée: le package entre en recovery.")
    setVerificationReason("")
  }
  async function recordFailure() {
    if (!selected) return
    await run("publication_record_failure", { packageId: selected.id, failureClass, impact: failureImpact, recoveryOwner, recoveryAction }, "Échec institutionnel enregistré sans effacer l’exécution précédente.")
  }
  async function recover() {
    if (!selected) return
    await run("publication_recover", { packageId: selected.id, resolution: recoveryResolution, scheduledAt: new Date(recoverySchedule).toISOString() }, "Recovery enregistré: nouvelle exécution autorisée au créneau choisi.")
  }
  async function terminate() {
    if (!selected) return
    await run("publication_terminate", { packageId: selected.id, decision: terminationDecision, reason: terminationReason, replacementPackageId }, `Décision ${terminationDecision} enregistrée avec sa lignée.`)
  }

  const history = React.useMemo(() => packages.flatMap((pkg) => {
    const itemDossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id)
    const events: Array<{ id: string; label: string; detail: string; at: string; icon: React.ReactNode }> = []
    if (pkg.scheduled_at) events.push({ id: `${pkg.id}-scheduled`, label: "Release planifiée", detail: `${itemDossier?.title || "Dossier"} · ${pkg.channel}`, at: pkg.scheduled_at, icon: <CalendarClock/> })
    if (pkg.published_at) events.push({ id: `${pkg.id}-published`, label: "Exécution confirmée", detail: pkg.external_reference || "Référence externe absente", at: pkg.published_at, icon: <ExternalLink/> })
    const checked = verificationRecord(pkg)
    if (checked?.checkedAt) events.push({ id: `${pkg.id}-verified`, label: checked.conclusion === "verified" ? "Publication vérifiée" : "Vérification échouée", detail: checked.reason, at: checked.checkedAt, icon: checked.conclusion === "verified" ? <CheckCircle2/> : <XCircle/> })
    const failed = failureRecord(pkg)
    if (failed?.detectedAt) events.push({ id: `${pkg.id}-failed`, label: "Échec enregistré", detail: `${failed.failureClass} · ${failed.impact}`, at: failed.detectedAt, icon: <Siren/> })
    return events
  }).sort((a, b) => b.at.localeCompare(a.at)), [packages, snapshot])

  return <main className={styles.canvas}>
    <div className={styles.liveRegion} aria-live="polite">{notice}</div>
    {error ? <div className={styles.notice}>Snapshot indisponible: {error}<button type="button" onClick={() => void refresh()}><RefreshCcw/></button></div> : null}
    {notice ? <div className={styles.notice}>{notice}<button type="button" aria-label="Fermer" onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}><Radio/> PUBLISHING OPERATIONS · BULK 6</span><h1>Exécuter, prouver, vérifier et récupérer la réalité externe.</h1><p>Le cockpit ne confond jamais release autorisée, exécution, URL saisie, preuve, vérification et succès final. Aucun provider n’est simulé.</p></div>
      <aside className={styles.heroCommand}><div className={styles.heroStat}><span><Send/></span><div><strong>{authorized.length}</strong><small>releases autorisées</small></div><b>{loading ? "…" : `${packages.length} total`}</b></div><div className={styles.heroActions}><Link className={styles.primary} href="/market-os/content-command-center/distribution"><ShieldCheck/> Distribution Tower</Link><button type="button" className={styles.secondary} onClick={() => void refresh()}><RefreshCcw/> Actualiser</button></div></aside>
    </section>

    <section className={styles.metrics} aria-label="Pression publication">
      <Metric icon={<Clock3/>} label="À exécuter aujourd’hui" value={dueToday.length} detail="Release autorisée avec horaire persisté aujourd’hui." tone="authority"/>
      <Metric icon={<UploadCloud/>} label="À vérifier" value={awaitingVerification.length} detail="Preuve enregistrée, conclusion indépendante absente." tone={awaitingVerification.length ? "warning" : "success"}/>
      <Metric icon={<CheckCircle2/>} label="Vérifiées" value={verified.length} detail="Conclusion de vérification persistée." tone="success"/>
      <Metric icon={<Siren/>} label="Recovery requis" value={failures.length} detail="Échec, blocage ou vérification négative réelle." tone={failures.length ? "danger" : "success"}/>
    </section>

    <section className={styles.publishLayout}>
      <article className={styles.section}>
        <SectionTitle eyebrow="LIVE RELEASE QUEUE" title="Packages et prochaine action autorisée" description="Seuls les états persistés gouvernent les actions. Un brouillon n’est jamais publiable et une URL n’est jamais une vérification."/>
        <div className={styles.releaseQueue}>{packages.map((pkg) => { const itemDossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); const packageTone = statusTone(pkg); return <article key={pkg.id} className={`${styles.releaseCard} ${toneClass(packageTone)}`} onClick={() => setSelectedId(pkg.id)}><span>{packageTone === "success" ? <CheckCircle2/> : packageTone === "danger" ? <Siren/> : pkg.status === "published" ? <UploadCloud/> : <Radio/>}</span><div><strong>{itemDossier?.title || "Dossier non exposé"}</strong><p>{itemDossier?.content_code || pkg.dossier_id} · {pkg.channel} · {formatDate(pkg.scheduled_at, true)}</p><small>{packageDominantAction(pkg, itemDossier)}</small></div><div className={styles.releaseActions}><Pill tone={packageTone}>{statusLabel(pkg.status)}</Pill><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(pkg.id) }}>Inspecter</button>{pkg.status === "scheduled" ? <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(pkg.id); setModal("execute") }}><ExternalLink/> Exécuter</button> : null}{pkg.status === "published" ? <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(pkg.id); setModal("verify") }}><ShieldCheck/> Vérifier</button> : null}{["failed", "blocked", "verification_failed"].includes(pkg.status) ? <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(pkg.id); setRecoverySchedule(localDateTime(pkg.scheduled_at)); setModal("recovery") }}><RotateCcw/> Recovery</button> : null}</div></article> })}{!packages.length ? <Empty title="Aucun package" detail="Les releases autorisées par Distribution Tower apparaîtront ici."/> : null}</div>
      </article>

      <aside className={styles.commandRail}>
        <section className={styles.statusPanel}><h3>Frontière provider</h3><div className={styles.statusList}><div className={styles.statusItem}><CircleDashed/><div><strong>Aucun connecteur social exécuté ici</strong><small>Bulk 6 ne fabrique ni token, ni compte, ni réponse de plateforme.</small></div></div><div className={styles.statusItem}><CheckCircle2/><div><strong>Modes persistables</strong><small>Manuel contrôlé, print / physique et release interne.</small></div></div><div className={styles.statusItem}><AlertTriangle/><div><strong>Provider réel</strong><small>Nécessite une intégration backend distincte, testée et observable.</small></div></div></div></section>
        <section className={styles.section}><SectionTitle eyebrow="AUTHORITY LINE" title="Ce que chaque état signifie"/><div className={styles.inspectionRail}><div className={`${styles.truthCard} ${toneClass("authority")}`}><span><ShieldCheck/></span><div><strong>Scheduled</strong><p>Release humaine autorisée; aucune publication externe n’est encore affirmée.</p></div></div><div className={`${styles.truthCard} ${toneClass("warning")}`}><span><ExternalLink/></span><div><strong>Published</strong><p>Exécution et preuve saisies; vérification indépendante encore requise.</p></div></div><div className={`${styles.truthCard} ${toneClass("success")}`}><span><CheckCircle2/></span><div><strong>Verified</strong><p>Une autorité a inspecté la référence et enregistré sa conclusion.</p></div></div></div></section>
      </aside>
    </section>

    {selected && dossier ? <section className={styles.section}>
      <SectionTitle eyebrow="ACTIVE PUBLICATION COCKPIT" title={dossier.title} description={`${dossier.content_code} · ${selected.channel} · ${executionModeLabel(manifest?.executionMode || "manual")}`} action={{ href: `/market-os/content-command-center/dossiers/${selected.dossier_id}`, label: "Ouvrir Dossier 360" }}/>
      <div className={styles.inspectionGrid}>
        <div className={styles.preview}>{dossierSource ? <ContentMediaPreview source={{ id: dossierSource.id, title: dossierSource.original_filename || dossier.title, bridgeFileId: dossierSource.bridge_file_id, storageKey: dossierSource.storage_key, contentType: dossierSource.content_type, filename: dossierSource.original_filename, sizeBytes: dossierSource.size_bytes, sourceLabel: `Publishing · ${dossier.content_code}` }} mode="inspector" fit="contain"/> : dossierEvidence ? <ContentMediaPreview source={{ id: dossierEvidence.id, title: dossierEvidence.title || dossier.title, url: dossierEvidence.preview_url, bridgeFileId: dossierEvidence.bridge_file_id, storageKey: dossierEvidence.storage_key, contentType: dossierEvidence.content_type, filename: dossierEvidence.filename, sizeBytes: dossierEvidence.size_bytes, sourceLabel: `Publishing Evidence · ${dossier.content_code}` }} mode="inspector" fit="contain"/> : <div className={styles.previewFallback}><Radio/><strong>{statusLabel(selected.status)}</strong><p>{selected.external_reference || "Aucun fichier source ou résultat externe n’est enregistré. Le système ne prétend pas que ce contenu est en ligne."}</p><Pill tone={statusTone(selected)}>{verificationState(selected).replaceAll("_", " ").toUpperCase()}</Pill></div>}</div>
        <aside className={styles.inspectionRail}>
          <div className={`${styles.truthCard} ${toneClass("info")}`}><span><CalendarClock/></span><div><strong>Runway</strong><p>{formatDate(selected.scheduled_at, true)}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(renditions.length ? "success" : "warning")}`}><span><FileCheck2/></span><div><strong>Version / renditions</strong><p>{manifest?.canonicalSourceVersion ? `Source V${manifest.canonicalSourceVersion}` : "Version non exposée"} · {renditions.map((item) => item.name).join(", ") || "Aucune rendition"}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(proof ? "success" : "warning")}`}><span><Link2/></span><div><strong>Preuve d’exécution</strong><p>{proof ? `${proof.externalReference} · ${proof.note}` : "Aucune preuve persistée."}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(verification?.conclusion === "verified" ? "success" : verification ? "danger" : "neutral")}`}><span><ShieldCheck/></span><div><strong>Vérification</strong><p>{verification ? `${verification.conclusion}: ${verification.reason}` : "Aucune conclusion de vérification."}</p></div></div>
          {failure ? <div className={`${styles.truthCard} ${toneClass("danger")}`}><span><Siren/></span><div><strong>{failure.failureClass}</strong><p>{failure.impact} · Recovery: {failure.recoveryAction}</p></div></div> : null}
          <div className={styles.releaseActions}>{selected.status === "scheduled" ? <button type="button" className={styles.primary} onClick={() => setModal("execute")}><ExternalLink/> Enregistrer l’exécution</button> : null}{selected.status === "published" ? <><button type="button" className={styles.primary} onClick={() => setModal("verify")}><ShieldCheck/> Vérifier</button><button type="button" className={styles.secondary} onClick={() => setModal("failure")}><Siren/> Signaler un échec</button></> : null}{["failed", "blocked", "verification_failed"].includes(selected.status) ? <button type="button" className={styles.primary} onClick={() => { setRecoverySchedule(localDateTime(selected.scheduled_at)); setModal("recovery") }}><RotateCcw/> Préparer la récupération</button> : null}{["scheduled", "published", "verified", "failed", "verification_failed"].includes(selected.status) ? <button type="button" className={styles.secondary} onClick={() => setModal("terminate")}><XCircle/> Retrait / supersession</button> : null}</div>
        </aside>
      </div>
    </section> : null}

    <section className={styles.section}><SectionTitle eyebrow="SCHEDULE RUNWAY" title="Releases autorisées et publications confirmées" description="Le runway utilise exclusivement scheduled_at, published_at et les décisions persistées."/><div className={styles.runway}>{packages.filter((pkg) => pkg.scheduled_at).sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))).map((pkg) => { const itemDossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); return <article className={styles.runwayItem} key={pkg.id}><time>{formatDate(pkg.scheduled_at, true)}</time><span><strong>{itemDossier?.title || "Dossier"}</strong><small>{pkg.channel} · {pkg.external_reference || "Aucune référence externe"}</small></span><Pill tone={statusTone(pkg)}>{statusLabel(pkg.status)}</Pill><Pill tone={verificationState(pkg) === "verified" ? "success" : verificationState(pkg) === "verification_failed" ? "danger" : "neutral"}>{verificationState(pkg).replaceAll("_", " ")}</Pill><button type="button" onClick={() => setSelectedId(pkg.id)}>Inspecter</button></article> })}{!packages.some((pkg) => pkg.scheduled_at) ? <Empty title="Runway vide" detail="Aucune release autorisée n’a de créneau persisté."/> : null}</div></section>

    <section className={styles.section}><SectionTitle eyebrow="PUBLICATION PROOF & DECISION LINEAGE" title="Preuves et événements vérifiables" description="Chaque événement dérive du package ou de son evidence JSON; aucun historique décoratif."/><div className={styles.evidenceGrid}>{packages.filter((pkg) => publicationProof(pkg)).map((pkg) => { const itemDossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); const itemProof = publicationProof(pkg)!; return <article className={styles.evidenceCard} key={pkg.id}><span><ExternalLink/> {executionModeLabel(itemProof.executionMode).toUpperCase()}</span><h3>{itemDossier?.title || pkg.channel}</h3><p>{itemProof.externalReference} · {formatDate(itemProof.executedAt, true)}</p></article> })}{!packages.some((pkg) => publicationProof(pkg)) ? <Empty title="Aucune preuve" detail="Aucune exécution contrôlée n’a encore fourni de référence externe."/> : null}</div><div className={styles.timeline} style={{ marginTop: 14 }}>{history.map((event) => <article className={styles.timelineItem} key={event.id}><span>{event.icon}</span><div><strong>{event.label}</strong><p>{event.detail}</p></div><time>{formatDate(event.at, true)}</time></article>)}{!history.length ? <Empty title="Historique vide" detail="Les événements de release apparaîtront ici après persistence."/> : null}</div></section>

    <section className={styles.section}><SectionTitle eyebrow="FAILURE & RECOVERY COMMAND" title="Échecs, vérifications négatives et reprise" description="L’échec ne disparaît jamais lorsqu’un retry est préparé."/><div className={styles.collisionGrid}>{failures.map((pkg) => { const itemDossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); const itemFailure = failureRecord(pkg); return <article className={`${styles.collisionCard} ${toneClass("danger")}`} key={pkg.id}><span><Siren/></span><div><strong>{itemDossier?.title || pkg.channel}</strong><p>{statusLabel(pkg.status)} · {itemFailure?.impact || "Recovery requis"}</p><button type="button" className={styles.secondary} onClick={() => { setSelectedId(pkg.id); setRecoverySchedule(localDateTime(pkg.scheduled_at)); setModal("recovery") }}><RotateCcw/> Ouvrir Recovery</button></div></article> })}{!failures.length ? <Empty title="Aucun recovery ouvert" detail="Aucun package n’expose un échec ou une vérification négative."/> : null}</div></section>

    <section className={styles.section}><SectionTitle eyebrow="LEGACY COMPATIBILITY" title="Registre historique isolé" description="Les anciens objets restent visibles mais ne deviennent jamais des PublicationPackage vérifiés par simple état local."/><div className={styles.legacyBoundary}><strong>Frontière stricte</strong><p>Le registre legacy est consultatif dans Bulk 6. Les nouvelles releases doivent passer par Distribution Tower et les actions persistées Headquarters.</p></div><div className={styles.releaseQueue} style={{ marginTop: 12 }}>{legacyQueue.map((item: ContentItem) => <article key={item.id} className={`${styles.releaseCard} ${toneClass(item.status === "published" ? "warning" : canPublish(item, store.tasks, store.rules) ? "info" : "neutral")}`}><span>{item.status === "published" ? <UploadCloud/> : <CircleDashed/>}</span><div><strong>{item.title}</strong><p>{item.channel} · {item.scheduledDate || "Date non définie"} · {item.owner}</p><small>{item.status === "published" ? "Publication legacy non équivalente à une vérification Bulk 6" : "Objet historique"}</small></div><Pill tone="neutral">{legacyStatusLabel(item.status)}</Pill></article>)}{!legacyQueue.length ? <Empty title="Registre legacy vide" detail="Aucun item historique approved, scheduled ou published."/> : null}</div></section>

    <Modal open={modal === "execute"} eyebrow="CONTROLLED PUBLICATION EXECUTION" title="Enregistrer ce qui s’est réellement produit" onClose={() => setModal(null)} footer={<><button type="button" className={styles.secondary} onClick={() => setModal(null)}>Annuler</button><button type="button" className={styles.primary} disabled={!externalReference.trim() || !executionNote.trim() || Boolean(busy)} onClick={() => void recordExecution()}><ExternalLink/> Enregistrer l’exécution</button></>}><div className={styles.formGrid}><Field label="Mode d’exécution"><select value={executionMode} onChange={(event) => setExecutionMode(event.target.value as Bulk6ExecutionMode)}><option value="manual">Exécution manuelle contrôlée</option><option value="print">Handover print / physique</option><option value="internal">Release interne</option><option value="provider" disabled>Provider réel — aucune intégration disponible</option></select></Field><Field label="Référence externe"><input value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="URL, ID de plateforme, référence imprimeur ou accusé interne"/></Field><Field label="Version exécutée"><input value={versionIdentity} onChange={(event) => setVersionIdentity(event.target.value)}/></Field><Field label="Rendition exécutée"><input value={renditionIdentity} onChange={(event) => setRenditionIdentity(event.target.value)}/></Field><Field label="Note et preuve opérationnelle" wide><textarea rows={6} value={executionNote} onChange={(event) => setExecutionNote(event.target.value)} placeholder="Qui a publié, sur quel compte/canal, quel contrôle a été effectué et quelle preuve existe."/></Field></div></Modal>

    <Modal open={modal === "verify"} eyebrow="INDEPENDENT PUBLICATION VERIFICATION" title="Rendre la conclusion de vérification" onClose={() => setModal(null)} footer={<><button type="button" className={styles.secondary} onClick={() => setModal(null)}>Annuler</button><button type="button" className={styles.primary} disabled={!verificationReason.trim() || Boolean(busy)} onClick={() => void verifyExecution()}><ShieldCheck/> Enregistrer la conclusion</button></>}><div className={styles.formGrid}><Field label="Conclusion"><select value={verificationConclusion} onChange={(event) => setVerificationConclusion(event.target.value as "verified" | "failed")}><option value="verified">Publication externe vérifiée</option><option value="failed">Vérification échouée</option></select></Field><Field label="Référence inspectée"><input readOnly value={selected?.external_reference || ""}/></Field><Field label="Raison et méthode de vérification" wide><textarea rows={7} value={verificationReason} onChange={(event) => setVerificationReason(event.target.value)} placeholder="Décrivez ce qui a été vérifié, la version observée, la disponibilité, le CTA et les limites."/></Field></div></Modal>

    <Modal open={modal === "failure"} eyebrow="FAILURE CONSTITUTION" title="Enregistrer un échec sans effacer la lignée" onClose={() => setModal(null)} footer={<><button type="button" className={styles.secondary} onClick={() => setModal(null)}>Annuler</button><button type="button" className={styles.primary} disabled={!failureImpact.trim() || !recoveryOwner.trim() || !recoveryAction.trim() || Boolean(busy)} onClick={() => void recordFailure()}><Siren/> Ouvrir le recovery</button></>}><div className={styles.formGrid}><Field label="Classe d’échec"><select value={failureClass} onChange={(event) => setFailureClass(event.target.value)}><option value="provider_rejection">Rejet provider</option><option value="authentication_failure">Échec authentification</option><option value="permission_failure">Permission insuffisante</option><option value="wrong_version">Mauvaise version publiée</option><option value="wrong_rendition">Mauvaise rendition</option><option value="broken_cta">CTA cassé</option><option value="missing_tracking">Tracking absent</option><option value="rights_issue">Droits découverts après publication</option><option value="publication_unavailable">Publication indisponible</option><option value="manual_confirmation_disputed">Confirmation manuelle contestée</option></select></Field><Field label="Propriétaire recovery"><input value={recoveryOwner} onChange={(event) => setRecoveryOwner(event.target.value)}/></Field><Field label="Impact" wide><textarea rows={4} value={failureImpact} onChange={(event) => setFailureImpact(event.target.value)}/></Field><Field label="Action corrective exigée" wide><textarea rows={4} value={recoveryAction} onChange={(event) => setRecoveryAction(event.target.value)}/></Field></div></Modal>

    <Modal open={modal === "recovery"} eyebrow="RECOVERY AUTHORITY" title="Préparer une nouvelle exécution contrôlée" onClose={() => setModal(null)} footer={<><button type="button" className={styles.secondary} onClick={() => setModal(null)}>Annuler</button><button type="button" className={styles.primary} disabled={!recoveryResolution.trim() || !recoverySchedule || Boolean(busy)} onClick={() => void recover()}><RotateCcw/> Autoriser le retry</button></>}><div className={styles.formGrid}><Field label="Nouveau créneau"><input type="datetime-local" value={recoverySchedule} onChange={(event) => setRecoverySchedule(event.target.value)}/></Field><Field label="Résolution et contrôles effectués" wide><textarea rows={7} value={recoveryResolution} onChange={(event) => setRecoveryResolution(event.target.value)} placeholder="Ce qui a été corrigé, quelle version/rendition sera exécutée et pourquoi le retry est désormais sûr."/></Field></div></Modal>

    <Modal open={modal === "terminate"} eyebrow="WITHDRAWAL & SUPERSESSION" title="Gouverner la fin ou le remplacement de la release" onClose={() => setModal(null)} footer={<><button type="button" className={styles.secondary} onClick={() => setModal(null)}>Annuler</button><button type="button" className={styles.primary} disabled={!terminationReason.trim() || (terminationDecision === "superseded" && !replacementPackageId) || Boolean(busy)} onClick={() => void terminate()}><XCircle/> Enregistrer la décision</button></>}><div className={styles.formGrid}><Field label="Décision"><select value={terminationDecision} onChange={(event) => setTerminationDecision(event.target.value as "withdrawn" | "superseded" | "cancelled")}><option value="withdrawn">Retirer la publication</option><option value="superseded">Superséder par un autre package</option><option value="cancelled">Annuler avant exécution</option></select></Field>{terminationDecision === "superseded" ? <Field label="Package de remplacement"><select value={replacementPackageId} onChange={(event) => setReplacementPackageId(event.target.value)}><option value="">Sélectionner…</option>{packages.filter((pkg) => pkg.id !== selected?.id).map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.channel} · {pkg.id.slice(0, 8)}</option>)}</select></Field> : null}<Field label="Raison institutionnelle" wide><textarea rows={7} value={terminationReason} onChange={(event) => setTerminationReason(event.target.value)}/></Field></div></Modal>
  </main>
}
