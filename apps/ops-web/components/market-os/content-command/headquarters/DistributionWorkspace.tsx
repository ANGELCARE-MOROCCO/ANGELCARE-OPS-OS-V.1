"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, CircleDashed, FileOutput,
  Fingerprint, Link2, PackageCheck, Plus, RadioTower, Send, ShieldCheck, Users, Waves,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { formatDate, headquartersAction, tone, useHeadquartersSnapshot } from "./client"
import type { ContentDossier, PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"
import {
  deterministicCollisions, executionModeLabel, packageDominantAction, packageReadiness,
  releaseBlockers, releaseManifest, requiredRenditions, statusLabel,
  type Bulk6ExecutionMode,
} from "../experience-bulk6/bulk6-release-model"
import { Empty, Field, Metric, Modal, Pill, SectionTitle, toneClass, type ReleaseTone } from "../release/release-ui"
import styles from "../release/mz7-release.module.css"
import { ContentMediaPreview } from "../media-preview/ContentMediaPreview"

const channels = ["Instagram", "Facebook", "LinkedIn", "Website", "WhatsApp", "Print", "Internal Workspace"]
const defaultRenditions = "Portrait 1080×1350\nStory 1080×1920"

type PackageForm = {
  dossierId: string; channel: string; scheduledAt: string; renditions: string; renditionsReady: boolean
  copy: string; cta: string; audience: string; geography: string; language: string
  trackingReference: string; executionMode: Bulk6ExecutionMode; proofExpectation: string; releaseNote: string
}

function emptyForm(): PackageForm {
  return { dossierId: "", channel: "Instagram", scheduledAt: "", renditions: defaultRenditions, renditionsReady: false, copy: "", cta: "", audience: "", geography: "", language: "fr", trackingReference: "", executionMode: "manual", proofExpectation: "URL ou référence externe + capture contrôlée", releaseNote: "" }
}

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function buildRenditions(form: PackageForm) {
  return form.renditions.split("\n").map((name) => name.trim()).filter(Boolean).map((name, index) => ({ id: `rendition-${index + 1}`, name, required: true, status: form.renditionsReady ? "ready" : "required" }))
}

function buildManifest(form: PackageForm) {
  return { copy: form.copy, cta: form.cta, audience: form.audience, geography: form.geography, language: form.language, trackingReference: form.trackingReference, executionMode: form.executionMode, proofExpectation: form.proofExpectation, releaseNote: form.releaseNote }
}

function formFromPackage(pkg: PublicationPackage, dossier?: ContentDossier | null): PackageForm {
  const manifest = releaseManifest(pkg)
  const renditions = requiredRenditions(pkg)
  return {
    dossierId: pkg.dossier_id,
    channel: pkg.channel,
    scheduledAt: toLocalDateTime(pkg.scheduled_at),
    renditions: renditions.map((item) => item.name).join("\n") || defaultRenditions,
    renditionsReady: renditions.length > 0 && renditions.every((item) => !item.required || ["ready", "approved", "available"].includes(item.status)),
    copy: manifest?.copy || "",
    cta: manifest?.cta || dossier?.cta || "",
    audience: manifest?.audience || dossier?.audience || "",
    geography: manifest?.geography || dossier?.city || "",
    language: manifest?.language || dossier?.language || "fr",
    trackingReference: manifest?.trackingReference || "",
    executionMode: manifest?.executionMode || (pkg.channel === "Print" ? "print" : pkg.channel === "Internal Workspace" ? "internal" : "manual"),
    proofExpectation: manifest?.proofExpectation || "URL ou référence externe + capture contrôlée",
    releaseNote: manifest?.releaseNote || "",
  }
}

export default function DistributionWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selectedId, setSelectedId] = React.useState("")
  const [builderOpen, setBuilderOpen] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [authorizeOpen, setAuthorizeOpen] = React.useState(false)
  const [authorityReason, setAuthorityReason] = React.useState("")
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [form, setForm] = React.useState<PackageForm>(emptyForm)

  const packages = snapshot?.publicationPackages || []
  const selectedPackage = packages.find((pkg) => pkg.id === selectedId) || packages[0]
  const selectedDossier = snapshot?.dossiers.find((item) => item.id === selectedPackage?.dossier_id)
  const eligibleDossiers = snapshot?.dossiers.filter((dossier) => dossier.source_state === "secured" && ["source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(dossier.status)) || []
  const collisions = React.useMemo(() => deterministicCollisions(packages), [packages])
  const draftPackages = packages.filter((pkg) => pkg.status === "draft")
  const readyPackages = packages.filter((pkg) => ["ready", "scheduled"].includes(pkg.status))
  const sourceMismatch = packages.filter((pkg) => snapshot?.dossiers.find((dossier) => dossier.id === pkg.dossier_id)?.source_state !== "secured")
  const selectedBlockers = selectedPackage ? releaseBlockers(selectedPackage, selectedDossier) : []
  const selectedScore = selectedPackage ? packageReadiness(selectedPackage, selectedDossier) : 0
  const selectedManifest = selectedPackage ? releaseManifest(selectedPackage) : null
  const selectedRenditions = selectedPackage ? requiredRenditions(selectedPackage) : []
  const selectedSource = snapshot?.sources.find((item) => item.dossier_id === selectedPackage?.dossier_id && item.is_current) || snapshot?.sources.find((item) => item.dossier_id === selectedPackage?.dossier_id)

  function openCreate(dossier?: ContentDossier) {
    const next = emptyForm()
    if (dossier) Object.assign(next, { dossierId: dossier.id, channel: dossier.channel || "Instagram", audience: dossier.audience, geography: dossier.city, language: dossier.language || "fr", cta: dossier.cta })
    setForm(next); setEditMode(false); setBuilderOpen(true)
  }

  function openEdit() {
    if (!selectedPackage) return
    setForm(formFromPackage(selectedPackage, selectedDossier)); setEditMode(true); setBuilderOpen(true)
  }

  async function run(action: string, payload: Record<string, unknown>, success: string) {
    setBusy(action); setNotice("")
    try { await headquartersAction(action, payload); setNotice(success); await refresh() }
    catch (nextError) { setNotice(nextError instanceof Error ? nextError.message : "BULK6_RELEASE_ACTION_FAILED") }
    finally { setBusy("") }
  }

  async function savePackage() {
    const scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : ""
    if (editMode && selectedPackage) {
      await run("publication_save_manifest", { packageId: selectedPackage.id, scheduledAt, requiredRenditions: buildRenditions(form), manifest: buildManifest(form) }, "Constitution du package enregistrée et readiness recalculée.")
    } else {
      await run("create_publication_package", { dossierId: form.dossierId, channel: form.channel, scheduledAt, requiredRenditions: buildRenditions(form), manifest: buildManifest(form) }, "Package gouverné créé en brouillon. Aucune release n’a été autorisée.")
    }
    setBuilderOpen(false)
  }

  async function declareReady() {
    if (!selectedPackage) return
    await run("publication_declare_ready", { packageId: selectedPackage.id }, "Pre-flight complet: package déclaré prêt pour autorisation humaine.")
  }

  async function authorizeRelease() {
    if (!selectedPackage) return
    await run("publication_authorize_release", { packageId: selectedPackage.id, reason: authorityReason }, "Release autorisée et transmise à Publishing Operations.")
    setAuthorizeOpen(false); setAuthorityReason("")
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <div className={styles.liveRegion} aria-live="polite">{notice}</div>
    {notice ? <div className={styles.notice}>{notice}<button type="button" aria-label="Fermer la notification" onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}><RadioTower/> DISTRIBUTION TOWER · BULK 6</span><h1>Constituer et autoriser la release avant toute exécution.</h1><p>La Tour verrouille la source canonique, la version, les renditions, le copy, le CTA, l’audience, le mode d’exécution, la preuve attendue, le calendrier et l’autorité. « Prêt » ne signifie jamais « publié ».</p></div>
      <aside className={styles.heroCommand}><div className={styles.heroStat}><span><Waves/></span><div><strong>{readyPackages.length}</strong><small>prêts ou autorisés</small></div><b>{packages.length} package(s)</b></div><div className={styles.heroActions}><button type="button" className={styles.primary} onClick={() => openCreate()}><Plus/> Nouveau package</button><Link className={styles.secondary} href="/market-os/content-command-center/publishing"><Send/> Publishing Operations</Link></div></aside>
    </section>

    <section className={styles.metrics} aria-label="Indicateurs de distribution">
      <Metric icon={<PackageCheck/>} label="En constitution" value={draftPackages.length} detail="Packages non autorisés, encore modifiables." tone="info"/>
      <Metric icon={<ShieldCheck/>} label="Release autorisée" value={packages.filter((pkg) => pkg.status === "scheduled").length} detail="Packages ayant franchi l’autorité humaine." tone="authority"/>
      <Metric icon={<AlertTriangle/>} label="Collisions exactes" value={collisions.length} detail="Même canal et même minute persistée uniquement." tone={collisions.length ? "danger" : "success"}/>
      <Metric icon={<Fingerprint/>} label="Source bloquante" value={sourceMismatch.length} detail="Aucune source ou intégrité canonique suffisante." tone={sourceMismatch.length ? "danger" : "success"}/>
    </section>

    <section className={styles.section}>
      <SectionTitle eyebrow="VALIDATED CONTENT INTAKE" title="Contenus admissibles au packaging" description="Le dossier doit être post-validation et sa source canonique doit être sécurisée. L’admissibilité ne vaut ni readiness ni autorisation." action={{ onClick: () => openCreate(), label: "Construire un package" }}/>
      <div className={styles.packageGrid}>{eligibleDossiers.map((dossier) => { const linked = packages.filter((pkg) => pkg.dossier_id === dossier.id); return <article key={dossier.id} className={styles.packageCard}><header><small>{dossier.content_code}</small><Pill tone="success">SOURCE VERROUILLÉE</Pill></header><h3>{dossier.title}</h3><p>{dossier.service_label} · {dossier.audience || "Audience à confirmer"} · {dossier.city || "Géographie à confirmer"}</p><div className={styles.progress}><span style={{ width: `${Math.max(0, Math.min(100, dossier.readiness))}%` }}/></div><div className={styles.releaseActions}><button type="button" onClick={() => openCreate(dossier)}><Plus/> Constituer</button><Link href={`/market-os/content-command-center/dossiers/${dossier.id}`}>Dossier 360</Link><Pill tone={linked.length ? "info" : "neutral"}>{linked.length} package(s)</Pill></div></article> })}{!eligibleDossiers.length ? <Empty title="Aucun contenu admissible" detail="Les dossiers validés et dotés d’une source canonique vérifiée apparaîtront ici."/> : null}</div>
    </section>

    <section className={styles.split}>
      <aside className={styles.section}>
        <SectionTitle eyebrow="PACKAGE REGISTER" title="Registre de release" description="Sélectionnez un package pour inspecter sa constitution réelle."/>
        <div className={styles.queue}>{packages.map((pkg) => { const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); const score = packageReadiness(pkg, dossier); const packageTone: ReleaseTone = pkg.status === "verified" ? "success" : ["failed", "blocked", "verification_failed"].includes(pkg.status) ? "danger" : pkg.status === "scheduled" ? "authority" : score === 100 ? "info" : "warning"; return <button type="button" key={pkg.id} className={`${styles.queueButton} ${selectedPackage?.id === pkg.id ? styles.queueSelected : ""}`} onClick={() => setSelectedId(pkg.id)}><span><small>{pkg.channel} · {formatDate(pkg.scheduled_at, true)}</small><strong>{dossier?.title || "Dossier non exposé"}</strong><small>{packageDominantAction(pkg, dossier)}</small></span><Pill tone={packageTone}>{statusLabel(pkg.status)}</Pill></button> })}{!packages.length ? <Empty title="Aucun package" detail="Créez le premier package à partir d’un dossier admissible."/> : null}</div>
      </aside>

      <article className={`${styles.section} ${styles.case}`}>
        {selectedPackage && selectedDossier ? <>
          <header className={styles.caseHeader}><div><small>{selectedDossier.content_code} · PACKAGE {selectedPackage.id.slice(0, 8)}</small><h2>{selectedDossier.title}</h2><p>{selectedPackage.channel} · {formatDate(selectedPackage.scheduled_at, true)} · {executionModeLabel(selectedManifest?.executionMode || "manual")}</p></div><div className={styles.caseMeta}><Pill tone={tone(selectedPackage.status) as ReleaseTone}>{statusLabel(selectedPackage.status)}</Pill><Pill tone={selectedDossier.source_state === "secured" ? "success" : "danger"}>SOURCE {selectedDossier.source_state}</Pill><Pill tone={selectedScore === 100 ? "success" : "warning"}>{selectedScore}% readiness</Pill></div></header>
          <div className={styles.channelMatrix} role="table" aria-label="Constitution du package"><div className={styles.matrixHeader} role="row"><span>Canal</span><span>Renditions</span><span>Copy / CTA</span><span>Audience</span><span>Horaire</span><span>État</span></div><div className={styles.matrixRow} role="row"><span><strong>{selectedPackage.channel}</strong><small>{executionModeLabel(selectedManifest?.executionMode || "manual")}</small></span><span><strong>{selectedRenditions.length} rendition(s)</strong><small>{selectedRenditions.map((item) => `${item.name}: ${item.status}`).join(" · ") || "Aucune"}</small></span><span><strong>{selectedManifest?.copy || "Copy absent"}</strong><small>{selectedManifest?.cta ? `CTA: ${selectedManifest.cta}` : "CTA non confirmé"}</small></span><span><strong>{selectedManifest?.audience || selectedDossier.audience || "Non confirmée"}</strong><small>{selectedManifest?.geography || selectedDossier.city || "Géographie absente"}</small></span><span><strong>{formatDate(selectedPackage.scheduled_at, true)}</strong><small>{selectedManifest?.language || "Langue absente"}</small></span><span><Pill tone={selectedScore === 100 ? "success" : "warning"}>{selectedScore === 100 ? "PREFLIGHT COMPLET" : `${selectedBlockers.length} BLOCAGE(S)`}</Pill></span></div></div>
          <div className={styles.releaseActions} style={{ marginTop: 14 }}><button type="button" className={styles.secondary} disabled={!(["draft", "ready"].includes(selectedPackage.status))} onClick={openEdit}><FileOutput/> Modifier la constitution</button><button type="button" className={styles.secondary} disabled={selectedPackage.status !== "draft" || selectedScore < 100 || Boolean(busy)} onClick={() => void declareReady()}><PackageCheck/> Déclarer prêt</button><button type="button" className={styles.primary} disabled={selectedPackage.status !== "ready" || Boolean(busy)} onClick={() => setAuthorizeOpen(true)}><ShieldCheck/> Autoriser la release</button><Link className={styles.quiet} href="/market-os/content-command-center/publishing">Publishing <ArrowRight/></Link></div>
        </> : <Empty title="Package non sélectionné" detail="Sélectionnez un package pour inspecter la source, les adaptations et l’autorité."/>}
      </article>
    </section>

    {selectedPackage && selectedDossier ? <section className={styles.split}>
      <article className={styles.section}><SectionTitle eyebrow="PRE-FLIGHT & BLOCKING REQUIREMENTS" title="Ce qui autorise — ou interdit — la release" description="Chaque blocage dérive des champs persistés. Aucun score AI ni provider fictif."/><div className={styles.preflight}>{[
        { label: "Validation et source", ok: selectedDossier.source_state === "secured", detail: "Source canonique sécurisée et dossier post-validation." },
        { label: "Version et renditions", ok: selectedRenditions.length > 0 && selectedRenditions.every((item) => !item.required || ["ready", "approved", "available"].includes(item.status)), detail: selectedRenditions.length ? selectedRenditions.map((item) => `${item.name}: ${item.status}`).join(" · ") : "Aucune rendition déclarée." },
        { label: "Copy, CTA, audience", ok: Boolean(selectedManifest?.copy && selectedManifest?.audience && (selectedManifest?.cta || ["print", "internal"].includes(selectedManifest?.executionMode || "manual"))), detail: "Constitution spécifique au canal, sans contenu inventé." },
        { label: "Horaire et preuve attendue", ok: Boolean(selectedPackage.scheduled_at && selectedManifest?.proofExpectation), detail: `${formatDate(selectedPackage.scheduled_at, true)} · ${selectedManifest?.proofExpectation || "Preuve non définie"}` },
        { label: "Mode d’exécution honnête", ok: selectedManifest?.executionMode !== "unsupported", detail: executionModeLabel(selectedManifest?.executionMode || "manual") },
      ].map((gate) => <div key={gate.label} className={`${styles.preflightItem} ${toneClass(gate.ok ? "success" : "warning")}`}><span>{gate.ok ? <CheckCircle2/> : <CircleDashed/>}</span><div><strong>{gate.label}</strong><p>{gate.detail}</p></div><Pill tone={gate.ok ? "success" : "warning"}>{gate.ok ? "PASS" : "BLOQUANT"}</Pill></div>)}</div>{selectedBlockers.length ? <div className={styles.collisionGrid} style={{ marginTop: 12 }}>{selectedBlockers.map((blocker) => <article className={`${styles.collisionCard} ${toneClass("danger")}`} key={blocker}><span><AlertTriangle/></span><div><strong>Release interdite</strong><p>{blocker}</p></div></article>)}</div> : null}</article>
      <aside className={styles.section}><SectionTitle eyebrow="SOURCE & AUTHORITY BOUNDARY" title="Frontières de vérité" description="Les données non persistées restent explicitement absentes."/>{selectedSource ? <div className={styles.preview} style={{ minHeight: 220, marginBottom: 12 }}><ContentMediaPreview source={{ id: selectedSource.id, title: selectedSource.original_filename || selectedDossier.title, bridgeFileId: selectedSource.bridge_file_id, storageKey: selectedSource.storage_key, contentType: selectedSource.content_type, filename: selectedSource.original_filename, sizeBytes: selectedSource.size_bytes, sourceLabel: `Distribution · ${selectedDossier.content_code}` }} mode="studio" fit="contain"/></div> : null}<div className={styles.inspectionRail}><div className={`${styles.truthCard} ${toneClass("success")}`}><span><Fingerprint/></span><div><strong>Source canonique</strong><p>{selectedManifest?.canonicalSourceId ? `Source ${selectedManifest.canonicalSourceId.slice(0, 8)} · version ${selectedManifest.canonicalSourceVersion || "—"}` : "La source sera capturée lors de la sauvegarde du manifest."}</p></div></div><div className={`${styles.truthCard} ${toneClass(selectedManifest?.trackingReference ? "success" : "neutral")}`}><span><Link2/></span><div><strong>Tracking</strong><p>{selectedManifest?.trackingReference || "Aucune référence de tracking déclarée; aucune n’est fabriquée."}</p></div></div><div className={`${styles.truthCard} ${toneClass("info")}`}><span><Users/></span><div><strong>Audience / géographie</strong><p>{selectedManifest?.audience || "—"} · {selectedManifest?.geography || "—"}</p></div></div></div></aside>
    </section> : null}

    <section className={styles.section}><SectionTitle eyebrow="COLLISION & SCHEDULE RUNWAY" title="Conflits déterministes et handover" description="La collision existe uniquement lorsque le même canal partage exactement la même minute persistée."/><div className={styles.collisionGrid}>{collisions.map((collision) => <article key={collision.key} className={`${styles.collisionCard} ${toneClass("danger")}`}><span><AlertTriangle/></span><div><strong>{collision.channel} · {formatDate(collision.scheduledAt, true)}</strong><p>{collision.packages.length} packages se disputent le même créneau exact.</p></div></article>)}{!collisions.length ? <Empty title="Aucune collision exacte" detail="Aucun package ne partage actuellement le même canal et la même minute."/> : null}</div><div className={styles.runway} style={{ marginTop: 12 }}>{packages.filter((pkg) => pkg.scheduled_at).sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))).map((pkg) => { const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); return <article className={styles.runwayItem} key={pkg.id}><time>{formatDate(pkg.scheduled_at, true)}</time><span><strong>{dossier?.title || "Dossier"}</strong><small>{pkg.channel} · {packageDominantAction(pkg, dossier)}</small></span><Pill tone={tone(pkg.status) as ReleaseTone}>{statusLabel(pkg.status)}</Pill><Pill tone={packageReadiness(pkg, dossier) === 100 ? "success" : "warning"}>{packageReadiness(pkg, dossier)}%</Pill><Link href="/market-os/content-command-center/publishing">Publishing <ArrowRight/></Link></article>})}</div></section>

    <Modal open={builderOpen} eyebrow={editMode ? "PACKAGE ENGINEERING" : "GOVERNED PACKAGE BUILDER"} title={editMode ? "Modifier la constitution avant autorisation" : "Constituer un package de distribution"} onClose={() => setBuilderOpen(false)} footer={<><button type="button" className={styles.secondary} onClick={() => setBuilderOpen(false)}>Annuler</button><button type="button" className={styles.primary} disabled={Boolean(busy) || !form.dossierId || !form.channel} onClick={() => void savePackage()}><Send/> Enregistrer sans publier</button></>}>
      <div className={styles.formGrid}>
        <Field label="Dossier source" wide><select disabled={editMode} value={form.dossierId} onChange={(event) => { const dossier = eligibleDossiers.find((item) => item.id === event.target.value); setForm({ ...form, dossierId: event.target.value, audience: dossier?.audience || form.audience, geography: dossier?.city || form.geography, language: dossier?.language || form.language, cta: dossier?.cta || form.cta }) }}><option value="">Sélectionner…</option>{eligibleDossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.content_code} · {dossier.title}</option>)}</select></Field>
        <Field label="Canal"><select disabled={editMode} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value, executionMode: event.target.value === "Print" ? "print" : event.target.value === "Internal Workspace" ? "internal" : "manual" })}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></Field>
        <Field label="Horaire de release"><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}/></Field>
        <Field label="Mode d’exécution"><select value={form.executionMode} onChange={(event) => setForm({ ...form, executionMode: event.target.value as Bulk6ExecutionMode })}><option value="manual">Exécution manuelle contrôlée</option><option value="print">Handover print / physique</option><option value="internal">Release interne</option><option value="unsupported">Provider non supporté — bloquant</option></select></Field>
        <Field label="Langue"><input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}/></Field>
        <Field label="Audience"><input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}/></Field>
        <Field label="Géographie"><input value={form.geography} onChange={(event) => setForm({ ...form, geography: event.target.value })}/></Field>
        <Field label="Tracking / référence campagne"><input value={form.trackingReference} onChange={(event) => setForm({ ...form, trackingReference: event.target.value })} placeholder="Optionnel si réellement disponible"/></Field>
        <Field label="Copy canal" wide><textarea rows={5} value={form.copy} onChange={(event) => setForm({ ...form, copy: event.target.value })}/></Field>
        <Field label="CTA"><input value={form.cta} onChange={(event) => setForm({ ...form, cta: event.target.value })}/></Field>
        <Field label="Preuve attendue"><input value={form.proofExpectation} onChange={(event) => setForm({ ...form, proofExpectation: event.target.value })}/></Field>
        <Field label="Renditions requises — une par ligne" wide><textarea rows={6} value={form.renditions} onChange={(event) => setForm({ ...form, renditions: event.target.value })}/></Field>
        <Field label="État réel des renditions" wide><select value={form.renditionsReady ? "ready" : "required"} onChange={(event) => setForm({ ...form, renditionsReady: event.target.value === "ready" })}><option value="required">Déclarées mais pas encore prêtes</option><option value="ready">Toutes vérifiées comme prêtes par l’opérateur</option></select></Field>
        <Field label="Note de release" wide><textarea rows={4} value={form.releaseNote} onChange={(event) => setForm({ ...form, releaseNote: event.target.value })}/></Field>
      </div>
    </Modal>

    <Modal open={authorizeOpen} eyebrow="HUMAN RELEASE AUTHORITY" title="Autoriser le handover vers Publishing" onClose={() => setAuthorizeOpen(false)} footer={<><button type="button" className={styles.secondary} onClick={() => setAuthorizeOpen(false)}>Annuler</button><button type="button" className={styles.primary} disabled={!authorityReason.trim() || Boolean(busy)} onClick={() => void authorizeRelease()}><ShieldCheck/> Autoriser formellement</button></>}><div className={styles.authorityBoundary}><ShieldCheck/><div><strong>Autorité résolue côté serveur</strong><p>Le rôle authentifié et la permission <code>govern</code> déterminent l’autorité. Aucun rôle librement saisi n’est accepté.</p></div></div><div className={styles.formGrid}><Field label="Décision et raison" wide><textarea rows={6} value={authorityReason} onChange={(event) => setAuthorityReason(event.target.value)} placeholder="Pourquoi ce package, cette version, ce canal et cet horaire sont autorisés."/></Field></div></Modal>
  </main>
}
