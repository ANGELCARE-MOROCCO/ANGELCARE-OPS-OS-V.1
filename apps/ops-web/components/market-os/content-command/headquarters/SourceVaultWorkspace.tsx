"use client"

import * as React from "react"
import Link from "next/link"
import { AlertOctagon, ArchiveRestore, CheckCircle2, Database, FileArchive, Fingerprint, HardDrive, RefreshCw, Replace, Server, ShieldCheck, UploadCloud } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge, Empty, Field, Modal, PageStatus, SectionHeader } from "./primitives"
import { statusLabel, tone, useHeadquartersSnapshot } from "./client"
import type { ContentDossier } from "@/lib/market-os/content-command-headquarters/types"
import styles from "./content-command-headquarters.module.css"

type ReplacementDraft = { dossier: ContentDossier; file: File } | null

export default function SourceVaultWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [busy, setBusy] = React.useState("")
  const [operationError, setOperationError] = React.useState("")
  const [replacement, setReplacement] = React.useState<ReplacementDraft>(null)
  const [replacementReason, setReplacementReason] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const eligible = snapshot?.dossiers.filter((dossier) => ["validated", "source_required", "source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(dossier.status)) || []
  const current = new Map((snapshot?.sources || []).filter((source) => source.is_current).map((source) => [source.dossier_id, source]))

  async function executeUpload(dossier: ContentDossier, file: File, mode: "initial" | "replace") {
    setBusy(dossier.id)
    setOperationError("")
    try {
      const body = new FormData()
      body.set("dossierId", dossier.id)
      body.set("file", file)
      if (mode === "replace") {
        body.set("replacementReason", replacementReason)
        body.set("confirmation", confirmation)
      }
      const endpoint = mode === "replace" ? "/api/market-os/content-command-headquarters/source-replace" : "/api/market-os/content-command-headquarters/source-upload?mode=source"
      const response = await fetch(endpoint, { method: "POST", body, credentials: "include" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || "SOURCE_OPERATION_FAILED")
      setReplacement(null)
      setReplacementReason("")
      setConfirmation("")
      await refresh()
    } catch (nextError) {
      setOperationError(nextError instanceof Error ? nextError.message : "SOURCE_OPERATION_FAILED")
    } finally {
      setBusy("")
    }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    {operationError ? <div className={styles.inlineNotice}>{operationError}<button onClick={() => setOperationError("")}>×</button></div> : null}
    <section className={styles.vaultHero}>
      <div><span className={styles.eyebrow}><Fingerprint/> SOURCE VAULT & WINDOWS BRIDGE</span><h1>Un code Content, un original actif, aucune ambiguïté sur la source de vérité.</h1><p>Aucune limite métier arbitraire n’est imposée dans ce workspace. Les limites physiques du serveur, du réseau et de la passerelle restent surveillées et doivent être validées en production.</p></div>
      <div className={styles.vaultHealth}><span><Server/><small>Bridge</small><strong>{snapshot?.bridge.available ? "ONLINE" : "À VÉRIFIER"}</strong></span><span><HardDrive/><small>Capacité</small><strong>PHYSIQUE SURVEILLÉE</strong></span><span><ShieldCheck/><small>Doctrine</small><strong>1 SOURCE ACTIVE</strong></span></div>
    </section>
    <section className={styles.vaultFlow}>{([
      { number: "01", label: "Upload temporaire", Icon: UploadCloud },
      { number: "02", label: "Checksum & intégrité", Icon: Fingerprint },
      { number: "03", label: "Promotion atomique", Icon: CheckCircle2 },
      { number: "04", label: "Suppression ancien bytes", Icon: AlertOctagon },
      { number: "05", label: "Audit métadonnées", Icon: Database },
    ] satisfies Array<{ number: string; label: string; Icon: LucideIcon }>).map(({ number, label, Icon }) => <span key={number}><b>{number}</b><Icon/><strong>{label}</strong></span>)}</section>
    <section className={styles.vaultRegister}>
      <SectionHeader eyebrow="CANONICAL SOURCE REGISTER" title="Sources originales et remplacements" description="La source éditable originale est distincte des previews, exports et renditions de diffusion."/>
      <div className={styles.vaultRows}>
        {eligible.map((dossier) => {
          const source = current.get(dossier.id)
          return <article key={dossier.id}>
            <div className={styles.vaultIdentity}><FileArchive/><div><small>{dossier.content_code}</small><h3>{dossier.title}</h3><p>{dossier.family} · {dossier.category} · {dossier.service_label}</p></div></div>
            <div className={styles.vaultFile}>{source ? <><strong>{source.original_filename}</strong><small>{(source.size_bytes / 1024 / 1024).toFixed(2)} MB · SHA {source.sha256_hash.slice(0, 12)}… · v{source.source_version}</small><Badge tone={tone(source.integrity_state)}>{statusLabel(source.integrity_state)}</Badge></> : <><strong>Source originale requise</strong><small>Le dossier ne peut pas être fermé sans son original.</small><Badge tone="danger">MANQUANTE</Badge></>}</div>
            <label className={styles.vaultUpload}>
              <input type="file" disabled={busy === dossier.id} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; if (source) setReplacement({ dossier, file }); else void executeUpload(dossier, file, "initial") }}/>
              {source ? <><Replace/> Préparer le remplacement</> : <><UploadCloud/> Charger la source</>}
            </label>
            <Link href={`/market-os/content-command-center/dossiers/${dossier.id}`}>Dossier</Link>
          </article>
        })}
        {!eligible.length ? <Empty title="Aucun dossier éligible" detail="Après validation, les dossiers arrivent ici pour sécuriser leur original."/> : null}
      </div>
    </section>
    <section className={styles.vaultDoctrine}><div><ArchiveRestore/><h3>Historique sans duplication de bytes</h3><p>Après remplacement confirmé, seules les métadonnées d’audit de l’ancienne source restent: hash, nom, taille, acteur, raison et preuve de suppression.</p></div><div><RefreshCw/><h3>Résilience avant destruction</h3><p>L’ancienne source n’est jamais supprimée avant la validation complète et la promotion atomique de la nouvelle source.</p></div></section>

    <Modal open={Boolean(replacement)} title="Remplacement irréversible de la source canonique" onClose={() => setReplacement(null)} footer={<><button className={styles.modalSecondary} onClick={() => setReplacement(null)}>Annuler</button><button className={styles.modalPrimary} disabled={!replacement || !replacementReason.trim() || confirmation !== `REMPLACER ${replacement?.dossier.content_code}` || busy === replacement?.dossier.id} onClick={() => replacement && void executeUpload(replacement.dossier, replacement.file, "replace")}><Replace/> Remplacer et supprimer l’ancien original</button></>}>
      {replacement ? <div className={styles.formGrid}>
        <div className={styles.destructiveNotice}><AlertOctagon/><div><strong>La nouvelle source sera validée avant promotion.</strong><p>Après promotion, le Bridge recevra une demande de suppression définitive des anciens bytes. Les métadonnées d’audit resteront, pas le fichier précédent.</p></div></div>
        <Field label="Contenu"><input value={`${replacement.dossier.content_code} · ${replacement.dossier.title}`} readOnly/></Field>
        <Field label="Nouveau fichier"><input value={`${replacement.file.name} · ${(replacement.file.size / 1024 / 1024).toFixed(2)} MB`} readOnly/></Field>
        <Field label="Raison opérationnelle" wide><textarea rows={4} value={replacementReason} onChange={(event) => setReplacementReason(event.target.value)} placeholder="Pourquoi la source actuelle doit-elle être remplacée?"/></Field>
        <Field label={`Saisissez exactement: REMPLACER ${replacement.dossier.content_code}`} wide><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off"/></Field>
      </div> : null}
    </Modal>
  </main>
}
