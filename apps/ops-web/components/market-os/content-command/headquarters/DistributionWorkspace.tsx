"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Plus, RadioTower, Send, ShieldCheck, Waves } from "lucide-react"
import { Badge, Empty, Field, Modal, PageStatus, Progress, SectionHeader } from "./primitives"
import { formatDate, headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import type { PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"
import styles from "./content-command-headquarters.module.css"

const channels = ["Instagram", "Facebook", "LinkedIn", "Website", "WhatsApp", "Print", "Internal Workspace"]

export default function DistributionWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [proofPackage, setProofPackage] = React.useState<PublicationPackage | null>(null)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [form, setForm] = React.useState({ dossierId: "", channel: "Instagram", scheduledAt: "", renditions: "Portrait 1080×1350\nStory 1080×1920" })
  const [externalReference, setExternalReference] = React.useState("")
  const [proofNote, setProofNote] = React.useState("")
  const packages = snapshot?.publicationPackages || []
  const eligibleDossiers = snapshot?.dossiers.filter((dossier) => dossier.source_state === "secured" && ["source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(dossier.status)) || []

  async function createPackage() {
    setBusy("create")
    setNotice("")
    try {
      await headquartersAction("create_publication_package", {
        dossierId: form.dossierId,
        channel: form.channel,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
        requiredRenditions: form.renditions.split("\n").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, required: true, status: "required" })),
      })
      setCreateOpen(false)
      setForm({ dossierId: "", channel: "Instagram", scheduledAt: "", renditions: "Portrait 1080×1350\nStory 1080×1920" })
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "PUBLICATION_PACKAGE_FAILED")
    } finally { setBusy("") }
  }

  async function advancePackage(pkg: PublicationPackage, status: string) {
    setBusy(pkg.id)
    setNotice("")
    try {
      await headquartersAction("update_publication_package", { packageId: pkg.id, status, scheduledAt: pkg.scheduled_at || "" })
      await refresh()
    } catch (nextError) { setNotice(nextError instanceof Error ? nextError.message : "PUBLICATION_UPDATE_FAILED") }
    finally { setBusy("") }
  }

  async function confirmPublication() {
    if (!proofPackage) return
    setBusy(proofPackage.id)
    setNotice("")
    try {
      await headquartersAction("update_publication_package", {
        packageId: proofPackage.id,
        status: "published",
        externalReference,
        evidence: [{ type: "manual_publication_proof", note: proofNote, externalReference, recordedAt: new Date().toISOString() }],
      })
      setProofPackage(null); setExternalReference(""); setProofNote("")
      await refresh()
    } catch (nextError) { setNotice(nextError instanceof Error ? nextError.message : "PUBLICATION_PROOF_FAILED") }
    finally { setBusy("") }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    {notice ? <div className={styles.inlineNotice}>{notice}<button onClick={() => setNotice("")}>×</button></div> : null}
    <section className={styles.towerHero}>
      <div><span className={styles.eyebrow}><RadioTower/> DISTRIBUTION TOWER</span><h1>La tour de contrôle qui sépare préparation, planification, publication et preuve externe.</h1><p>Chaque canal reçoit un package complet; aucun statut local n’est présenté comme publication vérifiée sans evidence.</p></div>
      <aside><Waves/><strong>{packages.filter((pkg) => ["ready", "scheduled"].includes(pkg.status)).length}</strong><span>packages prêts ou planifiés</span><button onClick={() => setCreateOpen(true)}><Plus/> Nouveau package</button></aside>
    </section>

    <section className={styles.channelRunways}>{channels.map((channel) => <article key={channel}><header><strong>{channel}</strong><span>{packages.filter((pkg) => pkg.channel === channel).length}</span></header><div>{packages.filter((pkg) => pkg.channel === channel).slice(0, 6).map((pkg) => {
      const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id)
      return <div key={pkg.id} className={styles.runwayPackage}><Link href={`/market-os/content-command-center/dossiers/${pkg.dossier_id}`}><small>{formatDate(pkg.scheduled_at, true)}</small><strong>{dossier?.title || "Dossier"}</strong><Progress value={pkg.package_readiness}/><Badge tone={tone(pkg.status)}>{statusLabel(pkg.status)}</Badge></Link><div className={styles.packageActions}>{pkg.status === "draft" ? <button disabled={busy === pkg.id} onClick={() => void advancePackage(pkg, "ready")}>Préparer</button> : null}{pkg.status === "ready" && pkg.scheduled_at ? <button disabled={busy === pkg.id} onClick={() => void advancePackage(pkg, "scheduled")}>Confirmer horaire</button> : null}{pkg.status === "scheduled" ? <button disabled={busy === pkg.id} onClick={() => setProofPackage(pkg)}><ExternalLink/> Ajouter preuve</button> : null}</div></div>
    })}{!packages.some((pkg) => pkg.channel === channel) ? <span className={styles.emptyRunway}>Aucun package</span> : null}</div></article>)}</section>

    <section className={styles.distributionControlGrid}>
      <article><SectionHeader eyebrow="PRE-FLIGHT" title="Readiness gates" description="Source, rendition, copy, CTA, approval, scheduling et publication evidence."/><div className={styles.preflightList}>{eligibleDossiers.map((dossier) => <button key={dossier.id} onClick={() => { setForm((value) => ({ ...value, dossierId: dossier.id, channel: dossier.channel || "Instagram" })); setCreateOpen(true) }}><Send/><div><strong>{dossier.content_code} · {dossier.title}</strong><p>{dossier.channel} · {dossier.campaign_label || "Hors campagne"}</p></div><Badge tone="success">SOURCE OK</Badge></button>)}{!eligibleDossiers.length ? <Empty title="Aucun dossier au pre-flight" detail="Les contenus avec source canonique sécurisée arriveront ici."/> : null}</div></article>
      <article><SectionHeader eyebrow="CONFLICT RADAR" title="Pression audience & collisions" description="La tour détecte les packages incomplets, les horaires absents et les publications non prouvées."/><div className={styles.conflictRadar}><span><AlertTriangle/><strong>Collisions</strong><b>0</b><small>Aucune donnée suffisante pour conclure.</small></span><span><Clock/><strong>Sans horaire</strong><b>{packages.filter((pkg) => !pkg.scheduled_at).length}</b><small>Packages à positionner.</small></span><span><ShieldCheck/><strong>Sans preuve</strong><b>{packages.filter((pkg) => pkg.status === "published" && !pkg.external_reference).length}</b><small>Publication non vérifiée.</small></span><span><CheckCircle2/><strong>Confirmées</strong><b>{packages.filter((pkg) => Boolean(pkg.published_at && pkg.external_reference)).length}</b><small>Evidence de publication visible.</small></span></div></article>
    </section>

    <Modal open={createOpen} title="Créer un package de diffusion gouverné" onClose={() => setCreateOpen(false)} footer={<><button className={styles.modalSecondary} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.modalPrimary} disabled={busy === "create" || !form.dossierId || !form.channel} onClick={() => void createPackage()}><Send/> Créer le package</button></>}>
      <div className={styles.formGrid}>
        <Field label="Dossier source" wide><select value={form.dossierId} onChange={(event) => setForm({ ...form, dossierId: event.target.value })}><option value="">Sélectionner…</option>{eligibleDossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.content_code} · {dossier.title}</option>)}</select></Field>
        <Field label="Canal"><select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></Field>
        <Field label="Horaire"><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}/></Field>
        <Field label="Renditions requises — une par ligne" wide><textarea rows={7} value={form.renditions} onChange={(event) => setForm({ ...form, renditions: event.target.value })}/></Field>
      </div>
    </Modal>

    <Modal open={Boolean(proofPackage)} title="Enregistrer une preuve de publication" onClose={() => setProofPackage(null)} footer={<><button className={styles.modalSecondary} onClick={() => setProofPackage(null)}>Annuler</button><button className={styles.modalPrimary} disabled={!externalReference.trim() || busy === proofPackage?.id} onClick={() => void confirmPublication()}><CheckCircle2/> Confirmer la publication</button></>}>
      <div className={styles.formGrid}>
        <Field label="Référence externe" wide><input value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="URL, ID de publication, référence imprimeur ou preuve interne"/></Field>
        <Field label="Note de preuve" wide><textarea rows={5} value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="Décrivez la preuve et le canal. Aucune publication externe n’est exécutée par ce bouton."/></Field>
      </div>
    </Modal>
  </main>
}
