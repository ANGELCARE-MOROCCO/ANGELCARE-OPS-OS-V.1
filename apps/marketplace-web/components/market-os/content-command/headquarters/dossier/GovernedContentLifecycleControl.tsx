"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertOctagon,
  Archive,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileArchive,
  FileCheck2,
  FileImage,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react"
import { useContentStore } from "../../content-command-system"
import styles from "../mz2-executive-dossier.module.css"

export default function GovernedContentLifecycleControl({ id }: { id: string }) {
  const router = useRouter()
  const { store, commit } = useContentStore()
  const item = store.items.find((candidate) => candidate.id === id)
  const [reason, setReason] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const [selectedAction, setSelectedAction] = React.useState<"archive" | "delete" | "">("")
  const [submitted, setSubmitted] = React.useState(false)

  if (!item) return <main className={styles.governedRouteCanvas}><section className={styles.routeFailure}><ShieldAlert/><div><span>CONTRÔLE INDISPONIBLE</span><h1>Aucun enregistrement historique correspondant.</h1><p>Cette chambre ne peut agir que sur un record réellement présent dans le registre Content Command existant.</p><Link href="/market-os/content-command-center">Retour au commandement <ArrowRight/></Link></div></section></main>

  const currentItem = item

  const tasks = store.tasks.filter((task) => task.contentId === id)
  const assets = store.assets.filter((asset) => asset.linkedContentId === id || currentItem.assets.includes(asset.id))
  const briefs = store.briefs.filter((brief) => brief.title === currentItem.title || brief.campaign === currentItem.campaign)
  const published = currentItem.status === "published" || Boolean(currentItem.scheduledDate)
  const exactConfirmation = `SUPPRIMER ${currentItem.title}`
  const canExecute = Boolean(selectedAction && reason.trim() && (selectedAction === "archive" || confirmation === exactConfirmation))

  function execute() {
    setSubmitted(true)
    if (!canExecute) return
    if (selectedAction === "archive") {
      commit((draft) => {
        draft.items = draft.items.map((candidate) => candidate.id === id ? { ...candidate, status: "archived", notes: [candidate.notes, `ARCHIVAGE: ${reason.trim()}`].filter(Boolean).join("\n"), updatedAt: new Date().toISOString() } : candidate)
      }, "archive", `Archived ${currentItem.title}: ${reason.trim()}`)
      router.push(`/market-os/content-command-center/${id}`)
      return
    }
    commit((draft) => {
      draft.items = draft.items.filter((candidate) => candidate.id !== id)
      draft.tasks = draft.tasks.filter((task) => task.contentId !== id)
      draft.assets = draft.assets.filter((asset) => asset.linkedContentId !== id)
    }, "permanent delete", `Permanently deleted ${currentItem.title}: ${reason.trim()}`)
    router.push("/market-os/content-command-center")
  }

  const dependencies = [
    { label: "Tâches liées", value: tasks.length, icon: ListChecks, consequence: "Supprimées avec le record lors d’une suppression permanente." },
    { label: "Assets liés", value: assets.length, icon: FileImage, consequence: "Les relations locales seront supprimées ; les fichiers externes ne sont pas effacés par cette action." },
    { label: "Briefs correspondants", value: briefs.length, icon: FileCheck2, consequence: "Les briefs sont signalés mais ne sont pas supprimés automatiquement par le store actuel." },
    { label: "Publication", value: published ? 1 : 0, icon: FileArchive, consequence: published ? "Le contenu possède un état ou une date de publication. La suppression peut rompre la traçabilité." : "Aucune publication visible dans le registre historique." },
  ]

  return <main className={styles.governedRouteCanvas} data-mz2-lifecycle-control>
    <header className={styles.lifecycleControlHeader}>
      <div><Link href={`/market-os/content-command-center/${id}`}><ArrowLeft/> Retour au dossier</Link><span>INSTITUTIONAL LIFECYCLE CONTROL</span><h1>Archiver ou supprimer : {currentItem.title}</h1><p>L’option réversible est prioritaire. La suppression permanente reste secondaire, explicite et fortement confirmée.</p></div>
      <ShieldAlert/>
    </header>

    <section className={styles.dependencyAssessment}>
      <header><AlertOctagon/><div><small>PRE-ACTION ASSESSMENT</small><h2>Conséquences visibles</h2><p>Cette analyse reflète uniquement les relations présentes dans le store historique local.</p></div></header>
      <div>{dependencies.map((dependency) => { const Icon = dependency.icon; return <article key={dependency.label}><Icon/><div><small>{dependency.label}</small><strong>{dependency.value}</strong><p>{dependency.consequence}</p></div></article> })}</div>
    </section>

    <section className={styles.lifecycleOptions}>
      <button type="button" className={`${styles.lifecycleOption} ${selectedAction === "archive" ? styles.selectedLifecycleOption : ""}`} onClick={() => setSelectedAction("archive")}>
        <span className={styles.safeOptionIcon}><Archive/></span>
        <div><small>OPTION RECOMMANDÉE</small><h2>Archiver le dossier</h2><p>Conserve le record, ses tâches, ses assets et son historique. Le contenu quitte les flux actifs sans destruction irréversible.</p><ul><li><CheckCircle2/> Réversible par une modification ultérieure</li><li><CheckCircle2/> Historique conservé</li><li><CheckCircle2/> Relations locales conservées</li></ul></div>
        <span>{selectedAction === "archive" ? "Sélectionnée" : "Sélectionner"}</span>
      </button>
      <button type="button" className={`${styles.lifecycleOption} ${styles.dangerousOption} ${selectedAction === "delete" ? styles.selectedLifecycleOption : ""}`} onClick={() => setSelectedAction("delete")}>
        <span className={styles.dangerOptionIcon}><Trash2/></span>
        <div><small>OPTION IRRÉVERSIBLE</small><h2>Supprimer définitivement</h2><p>Retire le contenu, ses tâches et les relations d’assets du registre local. Les briefs correspondants et les fichiers externes ne sont pas automatiquement supprimés.</p><ul><li><XCircle/> Aucune restauration automatique</li><li><XCircle/> Rupture possible de liens enregistrés</li><li><XCircle/> Traçabilité locale réduite</li></ul></div>
        <span>{selectedAction === "delete" ? "Sélectionnée" : "Sélectionner"}</span>
      </button>
    </section>

    <section className={styles.lifecycleConfirmation}>
      <header><ShieldCheck/><div><small>AUTHORITY CONFIRMATION</small><h2>Justification et confirmation</h2></div></header>
      <label><span>Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez la raison opérationnelle, réglementaire ou de gouvernance." aria-invalid={submitted && !reason.trim()}/>{submitted && !reason.trim() ? <small>Le motif est obligatoire.</small> : null}</label>
      {selectedAction === "delete" ? <label><span>Confirmation exacte</span><p>Recopiez : <strong>{exactConfirmation}</strong></p><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} aria-invalid={submitted && confirmation !== exactConfirmation}/>{submitted && confirmation !== exactConfirmation ? <small>La confirmation ne correspond pas exactement.</small> : null}</label> : null}
      {!selectedAction ? <div className={styles.selectActionNotice}><AlertOctagon/> Sélectionnez d’abord une option de cycle de vie.</div> : null}
      <footer><Link href={`/market-os/content-command-center/${id}`}>Annuler et conserver</Link><button type="button" disabled={!canExecute} className={selectedAction === "delete" ? styles.permanentDeleteButton : styles.archiveButton} onClick={execute}>{selectedAction === "delete" ? <Trash2/> : <Archive/>}{selectedAction === "delete" ? "Supprimer définitivement" : "Archiver le dossier"}</button></footer>
    </section>
  </main>
}
