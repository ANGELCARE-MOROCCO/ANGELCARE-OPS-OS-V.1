"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ClipboardCheck,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Wrench,
  X,
} from "lucide-react"
import { headquartersAction } from "../headquarters/client"
import type { DossierViewModel } from "../headquarters/mz2-view-models"
import styles from "./dossier-recovery.module.css"

type RecoveryInspection = {
  dossier: { id: string; code: string; title: string; status: string }
  dependencies: Record<string, number>
  activeTasks: number
  activeMissions: number
  protectedReasons: string[]
  archiveAllowed: boolean
  permanentDeleteAllowed: boolean
  typedConfirmation: string
}

type DialogMode = "none" | "archive" | "delete"

function readableError(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || "DOSSIER_RECOVERY_FAILED")
  if (message === "FORBIDDEN") return "Votre session ne possède pas l’autorité nécessaire pour cette action."
  if (message.startsWith("DOSSIER_PURGE_BLOCKED:")) return `Suppression définitive bloquée : ${message.split(":")[1]?.split("|").join(" ")}`
  if (message === "TYPED_CONFIRMATION_MISMATCH") return "La confirmation saisie ne correspond pas exactement au code du dossier."
  return message.replaceAll("_", " ")
}

export default function DossierRecoveryDock({ dossier, onRefresh }: { dossier: DossierViewModel; onRefresh: () => Promise<unknown> | void }) {
  const router = useRouter()
  const [inspection, setInspection] = React.useState<RecoveryInspection | null>(null)
  const [dialog, setDialog] = React.useState<DialogMode>("none")
  const [reason, setReason] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")

  const briefHref = `/market-os/content-command-center/briefs?dossierId=${encodeURIComponent(dossier.id)}&returnTo=${encodeURIComponent(`/market-os/content-command-center/dossiers/${dossier.id}?stage=brief`)}`

  async function inspect(open?: DialogMode) {
    setBusy("inspect")
    setNotice("")
    try {
      const result = await headquartersAction("dossier_inspect_recovery", { dossierId: dossier.id }) as RecoveryInspection
      setInspection(result)
      if (open) setDialog(open)
    } catch (error) {
      setNotice(readableError(error))
    } finally {
      setBusy("")
    }
  }

  async function repair() {
    setBusy("repair")
    setNotice("")
    try {
      await headquartersAction("dossier_repair_brief", { dossierId: dossier.id })
      await onRefresh()
      router.push(briefHref)
    } catch (error) {
      setNotice(readableError(error))
    } finally {
      setBusy("")
    }
  }

  async function archive() {
    setBusy("archive")
    setNotice("")
    try {
      await headquartersAction("dossier_archive_cleanup", { dossierId: dossier.id, reason })
      setDialog("none")
      router.push("/market-os/content-command-center?workspace=my-work")
      router.refresh()
    } catch (error) {
      setNotice(readableError(error))
    } finally {
      setBusy("")
    }
  }

  async function permanentDelete() {
    setBusy("delete")
    setNotice("")
    try {
      await headquartersAction("dossier_permanent_delete_cleanup", { dossierId: dossier.id, reason, confirmation })
      setDialog("none")
      router.push("/market-os/content-command-center?workspace=my-work")
      router.refresh()
    } catch (error) {
      setNotice(readableError(error))
    } finally {
      setBusy("")
    }
  }

  if (dossier.sourceType !== "headquarters") return null

  const dependencyTotal = inspection ? Object.values(inspection.dependencies).reduce<number>((sum, value) => sum + Number(value || 0), 0) : null

  return <>
    <section className={styles.recoveryDock}>
      <div className={styles.recoveryIntro}><ShieldAlert/><span><small>DOSSIER RECOVERY & CLEANUP</small><strong>Aucune boucle morte, aucune obligation impossible à retirer.</strong><p>Réparez le Brief lié, annulez les files dérivées ou inspectez une suppression définitive gouvernée.</p></span></div>
      <div className={styles.recoveryActions}>
        <button onClick={() => void repair()} disabled={Boolean(busy)}>{busy === "repair" ? <LoaderCircle className={styles.spin}/> : <Wrench/>} Réparer / compléter le Brief</button>
        <button onClick={() => void inspect("archive")} disabled={Boolean(busy)}><Archive/> Annuler et archiver</button>
        <button onClick={() => void inspect("delete")} disabled={Boolean(busy)} className={styles.dangerAction}><Trash2/> Supprimer définitivement</button>
        <button onClick={() => void inspect()} disabled={Boolean(busy)}><ClipboardCheck/> Inspecter les dépendances</button>
      </div>
      {inspection ? <div className={styles.inspectionSummary}><span><strong>{dependencyTotal}</strong><small>relations</small></span><span><strong>{inspection.activeTasks}</strong><small>tâches actives</small></span><span><strong>{inspection.activeMissions}</strong><small>missions actives</small></span><span data-safe={inspection.permanentDeleteAllowed}><strong>{inspection.permanentDeleteAllowed ? "Éligible" : "Protégé"}</strong><small>purge</small></span></div> : null}
      {notice ? <div className={styles.recoveryNotice}><AlertTriangle/><span>{notice}</span></div> : null}
    </section>

    {dialog !== "none" && inspection ? <div className={styles.recoveryBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog("none") }}>
      <section className={styles.recoveryDialog} role="dialog" aria-modal="true" aria-labelledby="dossier-recovery-dialog-title">
        <header><span><ShieldAlert/><small>ACTION GOUVERNÉE · {inspection.dossier.code}</small><h2 id="dossier-recovery-dialog-title">{dialog === "archive" ? "Annuler et archiver le dossier" : "Supprimer définitivement le dossier"}</h2></span><button onClick={() => setDialog("none")} aria-label="Fermer"><X/></button></header>
        <div className={styles.recoveryContext}><strong>{inspection.dossier.title}</strong><p>État actuel : {inspection.dossier.status.replaceAll("_", " ")} · {dependencyTotal} relation(s) inspectée(s).</p></div>
        {dialog === "archive" ? <div className={styles.recoveryExplanation}><Archive/><div><strong>Conséquence opérationnelle</strong><p>Les tâches actives et missions dérivées sont annulées, le dossier devient archivé et l’action dominante disparaît de Commandement 360 après rechargement.</p></div></div> : <>
          <div className={styles.recoveryExplanation}><Trash2/><div><strong>Purge contrôlée du brouillon</strong><p>Les tâches et missions dérivées sont retirées avant le dossier. Toute source canonique, décision humaine, publication, performance ou mémoire institutionnelle bloque automatiquement la purge.</p></div></div>
          {inspection.protectedReasons.length ? <div className={styles.protectedReasons}>{inspection.protectedReasons.map((item) => <p key={item}><ShieldAlert/>{item}</p>)}</div> : null}
        </>}
        <label className={styles.recoveryField}><span>Motif obligatoire</span><textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez la raison et la portée de l’action…"/></label>
        {dialog === "delete" ? <label className={styles.recoveryField}><span>Saisissez exactement : <b>{inspection.typedConfirmation}</b></span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)}/></label> : null}
        {notice ? <div className={styles.recoveryNotice}><AlertTriangle/><span>{notice}</span></div> : null}
        <footer><button onClick={() => setDialog("none")}><RotateCcw/> Revenir</button><button className={dialog === "delete" ? styles.dangerConfirm : styles.archiveConfirm} disabled={Boolean(busy) || reason.trim().length < 8 || (dialog === "delete" && (!inspection.permanentDeleteAllowed || confirmation !== inspection.typedConfirmation))} onClick={() => dialog === "archive" ? void archive() : void permanentDelete()}>{busy ? <LoaderCircle className={styles.spin}/> : dialog === "archive" ? <Archive/> : <Trash2/>}{dialog === "archive" ? "Confirmer l’archivage" : "Purger définitivement"}<ArrowRight/></button></footer>
      </section>
    </div> : null}
  </>
}
