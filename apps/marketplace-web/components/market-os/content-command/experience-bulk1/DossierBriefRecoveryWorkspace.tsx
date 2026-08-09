"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  LoaderCircle,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Wrench,
} from "lucide-react"
import { headquartersAction, useHeadquartersSnapshot } from "../headquarters/client"
import { buildLiveDossierViewModel, findLiveDossier, type DossierViewModel } from "../headquarters/mz2-view-models"
import styles from "./dossier-recovery.module.css"

type BriefForm = {
  objective: string
  audience: string
  userProblem: string
  coreMessage: string
  supportingMessages: string
  format: string
  channels: string
  tone: string
  references: string
  version: string
  dueAt: string
}

type ReadinessCheck = { label: string; present: boolean }

const placeholderPattern = /non défini|non définie|non documenté|non documentée|à constituer|à sélectionner/i

function usable(value: string) {
  return Boolean(value.trim()) && !placeholderPattern.test(value)
}

function briefReadiness(form: BriefForm) {
  const checks: ReadinessCheck[] = [
    { label: "Objectif", present: usable(form.objective) },
    { label: "Audience", present: usable(form.audience) },
    { label: "Problème utilisateur", present: usable(form.userProblem) },
    { label: "Message central", present: usable(form.coreMessage) },
    { label: "Format", present: usable(form.format) },
    { label: "Canal", present: form.channels.split(/[,;\n]/).some((item) => usable(item)) },
    { label: "Ton", present: usable(form.tone) },
    { label: "Version initiale", present: usable(form.version) },
  ]
  const count = checks.filter((item) => item.present).length
  return { checks, score: Math.round((count / checks.length) * 100), complete: count === checks.length }
}

function initialForm(dossier: DossierViewModel): BriefForm {
  return {
    objective: dossier.brief.objective,
    audience: dossier.brief.audience,
    userProblem: dossier.brief.userProblem,
    coreMessage: dossier.brief.coreMessage,
    supportingMessages: dossier.brief.supportingMessages.join("\n"),
    format: dossier.brief.format,
    channels: dossier.brief.channels.join(", ") || dossier.channel,
    tone: dossier.brief.tone,
    references: dossier.brief.references.join("\n"),
    version: dossier.brief.version === "Version non définie" ? "v1" : dossier.brief.version,
    dueAt: dossier.brief.deadline ? dossier.brief.deadline.slice(0, 10) : "",
  }
}

function errorLabel(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || "DOSSIER_BRIEF_ACTION_FAILED")
  if (message.startsWith("BRIEF_INCOMPLETE:")) return `Le brief reste incomplet : ${message.split(":")[1]?.split("|").join(", ")}.`
  if (message === "FORBIDDEN") return "Votre rôle ne possède pas l’autorité requise pour cette action."
  if (message === "REVIEW_AUTHORITY_PENDING") return "Affectez une autorité de révision ou confirmez explicitement la progression sous condition."
  return message.replaceAll("_", " ")
}

export default function DossierBriefRecoveryWorkspace({ dossierId, returnTo }: { dossierId: string; returnTo?: string }) {
  const router = useRouter()
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const liveRecord = findLiveDossier(snapshot, dossierId)
  const dossier = React.useMemo(() => liveRecord ? buildLiveDossierViewModel(snapshot, liveRecord) : null, [liveRecord, snapshot])
  const [form, setForm] = React.useState<BriefForm | null>(null)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")

  React.useEffect(() => {
    if (dossier) setForm(initialForm(dossier))
  }, [dossier?.id, dossier?.updatedAt])

  const readiness = React.useMemo(() => form ? briefReadiness(form) : null, [form])
  const reviewerAssigned = dossier ? !/non affecté/i.test(dossier.reviewer) : false
  const dossierHref = returnTo || (dossier ? `/market-os/content-command-center/dossiers/${dossier.id}?stage=${dossier.currentStage}` : "/market-os/content-command-center")

  async function perform(action: string, payload: Record<string, unknown>, success: string, after?: () => void) {
    setBusy(action)
    setNotice("")
    try {
      await headquartersAction(action, { dossierId, ...payload })
      setNotice(success)
      await refresh()
      after?.()
    } catch (nextError) {
      setNotice(errorLabel(nextError))
    } finally {
      setBusy("")
    }
  }

  async function save() {
    if (!form) return
    await perform("dossier_save_brief", {
      ...form,
      supportingMessages: form.supportingMessages.split("\n").map((item) => item.trim()).filter(Boolean),
      channels: form.channels.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean),
      references: form.references.split("\n").map((item) => item.trim()).filter(Boolean),
    }, "Brief enregistré dans le dossier autoritaire. La préparation du gate a été recalculée.")
  }

  async function confirm() {
    if (!form || !readiness?.complete) {
      setNotice("Complétez les huit conditions essentielles avant de confirmer la constitution.")
      return
    }
    setBusy("confirm")
    setNotice("")
    try {
      await headquartersAction("dossier_save_brief", {
        dossierId,
        ...form,
        supportingMessages: form.supportingMessages.split("\n").map((item) => item.trim()).filter(Boolean),
        channels: form.channels.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean),
        references: form.references.split("\n").map((item) => item.trim()).filter(Boolean),
      })
      await headquartersAction("dossier_confirm_constitution", { dossierId, continueUnderCondition: true })
      await refresh()
      router.push(`/market-os/content-command-center/dossiers/${dossierId}?stage=scope_locked`)
    } catch (nextError) {
      setNotice(errorLabel(nextError))
    } finally {
      setBusy("")
    }
  }

  if (loading && !dossier) return <main className={styles.canvas}><div className={styles.loading}><LoaderCircle/><span><strong>Ouverture du Brief Recovery Desk…</strong><small>Le dossier, son brief et sa gouvernance sont consolidés.</small></span></div></main>
  if (!dossier || !form || !readiness) return <main className={styles.canvas}><section className={styles.failure}><AlertTriangle/><div><h1>Dossier introuvable</h1><p>{error || "Le dossier n’est pas accessible dans le snapshot Headquarters."}</p><button onClick={() => router.push(dossierHref)}><ArrowLeft/> Revenir</button></div></section></main>

  return <main className={styles.canvas} data-dossier-brief-recovery>
    <section className={styles.hero}>
      <div className={styles.heroIdentity}><FileText/><span><small>DOSSIER LIVE · {dossier.code}</small><strong>Brief Constitution & Recovery Desk</strong></span></div>
      <div className={styles.heroCopy}><span>CONSTITUTION TRANSACTIONNELLE</span><h1>Compléter, gouverner et libérer le Brief sans boucle morte.</h1><p>Chaque champ est persisté directement dans le dossier. La confirmation fait franchir le gate « Brief » et ferme l’action dérivée sur Commandement 360.</p></div>
      <div className={styles.heroActions}><button onClick={() => router.push(dossierHref)}><ArrowLeft/> Retour au dossier</button><button onClick={() => void refresh()}><RefreshCcw/> Synchroniser</button></div>
    </section>

    {notice ? <div className={styles.notice} role="status"><Sparkles/><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.commandStrip}>
      <article><Gauge/><span><small>PRÉPARATION</small><strong>{readiness.score}%</strong><p>{readiness.complete ? "Constitution confirmable" : "Champs obligatoires manquants"}</p></span></article>
      <article><UserRoundCheck/><span><small>GOUVERNANCE</small><strong>{reviewerAssigned ? dossier.reviewer : "À affecter"}</strong><p>{reviewerAssigned ? "Autorité persistée" : "Progression autorisée sous condition jusqu’à la revue"}</p></span></article>
      <article><ShieldCheck/><span><small>ÉTAT DOSSIER</small><strong>{dossier.status.replaceAll("_", " ")}</strong><p>La confirmation réussie avance vers « Constitution ».</p></span></article>
    </section>

    <section className={styles.workspace}>
      <aside className={styles.readinessRail}>
        <header><ClipboardCheck/><span><small>CONDITIONS DE CONSTITUTION</small><strong>{readiness.checks.filter((item) => item.present).length}/8 satisfaites</strong></span></header>
        <div>{readiness.checks.map((item, index) => <article key={item.label} data-state={item.present ? "complete" : "missing"}><span>{item.present ? <Check/> : String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><small>{item.present ? "Documenté" : "À compléter"}</small></div></article>)}</div>
        <section className={styles.continuityNote}><AlertTriangle/><div><strong>Aucun blocage sans sortie</strong><p>L’autorité de révision n’empêche plus la constitution du Brief. Son absence devient une condition explicite à résoudre avant la revue humaine.</p></div></section>
      </aside>

      <article className={styles.formDesk}>
        <header><div><small>BRIEF VERSION {form.version || "v1"}</small><h2>{dossier.title}</h2><p>Les valeurs ci-dessous appartiennent au dossier {dossier.code}, pas au registre local historique.</p></div><span>{readiness.complete ? <CheckCircle2/> : <Wrench/>}{readiness.complete ? "Prêt à confirmer" : "Réparation en cours"}</span></header>
        <div className={styles.formGrid}>
          <label><span>Objectif</span><textarea rows={3} value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })}/></label>
          <label><span>Audience</span><textarea rows={3} value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}/></label>
          <label className={styles.wide}><span>Problème utilisateur</span><textarea rows={3} value={form.userProblem} onChange={(event) => setForm({ ...form, userProblem: event.target.value })}/></label>
          <label className={styles.wide}><span>Message central</span><textarea rows={4} value={form.coreMessage} onChange={(event) => setForm({ ...form, coreMessage: event.target.value })}/></label>
          <label><span>Format</span><input value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })}/></label>
          <label><span>Canaux</span><input value={form.channels} onChange={(event) => setForm({ ...form, channels: event.target.value })} placeholder="Instagram, LinkedIn, Email…"/></label>
          <label><span>Ton</span><input value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })}/></label>
          <label><span>Version initiale</span><input value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })}/></label>
          <label><span>Échéance</span><input type="date" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })}/></label>
          <label><span>Messages de soutien</span><textarea rows={3} value={form.supportingMessages} onChange={(event) => setForm({ ...form, supportingMessages: event.target.value })} placeholder="Un message par ligne"/></label>
          <label className={styles.wide}><span>Références</span><textarea rows={3} value={form.references} onChange={(event) => setForm({ ...form, references: event.target.value })} placeholder="Une référence par ligne"/></label>
        </div>
        <footer className={styles.formActions}>
          <button className={styles.secondary} disabled={Boolean(busy)} onClick={() => void perform("dossier_repair_brief", {}, "Le brief lié a été réparé à partir des valeurs réellement disponibles dans le dossier.")}><Wrench/> Réparer le lien Brief</button>
          <button className={styles.secondary} disabled={Boolean(busy) || reviewerAssigned} onClick={() => void perform("dossier_assign_reviewer", { selfAssign: true }, "Vous êtes maintenant l’autorité de révision persistée pour ce dossier.")}><UserRoundCheck/> M’affecter comme réviseur</button>
          <button className={styles.secondary} disabled={Boolean(busy)} onClick={() => void save()}>{busy === "dossier_save_brief" ? <LoaderCircle className={styles.spin}/> : <Save/>} Enregistrer</button>
          <button className={styles.primary} disabled={Boolean(busy) || !readiness.complete} onClick={() => void confirm()}>{busy === "confirm" ? <LoaderCircle className={styles.spin}/> : <ShieldCheck/>}{reviewerAssigned ? "Confirmer la constitution" : "Confirmer sous condition"}</button>
        </footer>
      </article>
    </section>
  </main>
}
