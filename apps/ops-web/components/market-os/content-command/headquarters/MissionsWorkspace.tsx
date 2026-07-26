"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock3, GitBranch, Plus, Route, ShieldCheck, UsersRound, Workflow } from "lucide-react"
import { Badge, Empty, Field, Modal, PageStatus, Progress, SectionHeader } from "./primitives"
import { formatDate, headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

const stages = ["proposed", "ready", "assigned", "in_progress", "checkpoint", "submitted", "ai_review", "human_review", "revision", "validated"]

export default function MissionsWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selected, setSelected] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [form, setForm] = React.useState({ title: "", objective: "", scope: "", successDefinition: "", assignedToName: "", dueAt: "", task1: "", task2: "", task3: "" })
  const mission = snapshot?.missions.find((item) => item.id === selected) || snapshot?.missions[0]
  const missionTasks = snapshot?.tasks.filter((task) => task.mission_id === mission?.id) || []
  const blockers = snapshot?.missions.filter((item) => item.status === "blocked") || []

  async function createMission() {
    setBusy("create")
    try {
      await headquartersAction("create_mission", {
        ...form,
        tasks: [form.task1, form.task2, form.task3].filter(Boolean).map((title) => ({ title, evidenceRequired: true, completionDefinition: "Preuve soumise, analysée et acceptée dans le dossier." })),
      })
      setOpen(false); setForm({ title: "", objective: "", scope: "", successDefinition: "", assignedToName: "", dueAt: "", task1: "", task2: "", task3: "" }); await refresh()
    } finally { setBusy("") }
  }

  async function advanceTask(taskId: string, status: string, progress: number) {
    setBusy(taskId)
    try { await headquartersAction("update_task", { taskId, status, progress }); await refresh() } finally { setBusy("") }
  }

  async function advanceMission(status: string) {
    if (!mission) return
    setBusy(mission.id)
    try { await headquartersAction("update_mission_status", { missionId: mission.id, status, note: "Transition confirmée depuis Mission Control." }); await refresh() } finally { setBusy("") }
  }

  const nextMissionState: Record<string, { status: string; label: string }> = {
    proposed: { status: "qualifying", label: "Qualifier" }, qualifying: { status: "scope_approved", label: "Approuver le scope" }, scope_approved: { status: "ready", label: "Rendre assignable" }, ready: { status: "assigned", label: "Libérer la mission" }, assigned: { status: "accepted", label: "Accepter" }, accepted: { status: "in_progress", label: "Démarrer" }, in_progress: { status: "submitted", label: "Soumettre" }, checkpoint: { status: "submitted", label: "Soumettre" }, submitted: { status: "ai_review", label: "Envoyer à l’AI review" }, ai_review: { status: "human_review", label: "Envoyer à l’autorité" }, human_review: { status: "validated", label: "Valider la mission" }, revision: { status: "in_progress", label: "Reprendre" }, validated: { status: "closed", label: "Clôturer" }, blocked: { status: "in_progress", label: "Lever le blocage" }, paused: { status: "in_progress", label: "Reprendre" },
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.missionHero}>
      <div><span className={styles.eyebrow}><Route/> MISSION CONTROL</span><h1>Une orchestration qui protège le scope, la charge, les preuves et l’autorité.</h1><p>Les stratégies deviennent des missions multi-tâches; chaque membre connaît le travail attendu, la preuve exigée et le prochain verrou.</p></div>
      <button type="button" onClick={() => setOpen(true)}><Plus/> Créer une mission gouvernée</button>
    </section>

    <section className={styles.missionStageRail}>
      {stages.map((stage) => <div key={stage}><span>{snapshot?.missions.filter((item) => item.status === stage).length || 0}</span><strong>{statusLabel(stage)}</strong></div>)}
    </section>

    <section className={styles.missionControlGrid}>
      <article className={styles.missionPortfolio}>
        <SectionHeader eyebrow="PORTEFEUILLE" title="Missions en responsabilité" description="Origine, owner, risque, échéance et avancement sans perdre le lien stratégique."/>
        <div className={styles.missionList}>
          {snapshot?.missions.map((item) => <button type="button" key={item.id} onClick={() => setSelected(item.id)} className={mission?.id === item.id ? styles.isSelected : ""}>
            <span className={styles.missionCode}>{item.code}</span>
            <div><strong>{item.title}</strong><p>{item.objective}</p><small><UsersRound/> {item.assigned_to_name || "Non assignée"} · <CalendarClock/> {formatDate(item.due_at)}</small></div>
            <Progress value={item.progress}/><Badge tone={tone(item.status)}>{statusLabel(item.status)}</Badge>
          </button>)}
          {!snapshot?.missions.length ? <Empty title="Aucune mission" detail="Une mission peut être créée manuellement ou compilée depuis une stratégie approuvée." action="Créer" href="#"/> : null}
        </div>
      </article>

      <article className={styles.missionDependencyMap}>
        <SectionHeader eyebrow="DOSSIER D’EXÉCUTION" title={mission?.title || "Sélectionnez une mission"} description={mission ? `${mission.code} · ${mission.success_definition}` : "La mission sélectionnée révèle ses dépendances et preuves."}/>
        {mission ? <>
          <div className={styles.missionAuthorityStrip}>
            <span><small>Origin</small><strong>{statusLabel(mission.origin_type)}</strong></span>
            <span><small>AI supervisor</small><strong>{mission.ai_director_id ? "Affecté" : "À affecter"}</strong></span>
            <span><small>Reviewer</small><strong>{mission.reviewer_name || "Non désigné"}</strong></span>
            <span><small>Risque</small><Badge tone={tone(mission.risk_level)}>{mission.risk_level}</Badge></span>
            {nextMissionState[mission.status] ? <button className={styles.missionAdvance} disabled={busy === mission.id} onClick={() => void advanceMission(nextMissionState[mission.status].status)}><Workflow/> {nextMissionState[mission.status].label}</button> : null}
          </div>
          <div className={styles.dependencyTrack}>
            {missionTasks.map((task, index) => <div key={task.id} className={styles.dependencyNode}>
              <span className={styles.sequence}>{String(index + 1).padStart(2, "0")}</span>
              <div><Badge tone={tone(task.status)}>{statusLabel(task.status)}</Badge><h3>{task.title}</h3><p>{task.description || task.completion_definition}</p><small>{task.assigned_to_name || mission.assigned_to_name || "Non assignée"} · {formatDate(task.due_at)}</small></div>
              <Progress value={task.progress}/>
              <div className={styles.taskActions}>
                <button disabled={busy === task.id} onClick={() => void advanceTask(task.id, "doing", Math.max(20, task.progress))}><Clock3/> Démarrer</button>
                <button disabled={busy === task.id} onClick={() => void advanceTask(task.id, "done", 100)}><CheckCircle2/> Soumettre</button>
              </div>
              {index < missionTasks.length - 1 ? <GitBranch className={styles.dependencyArrow}/> : null}
            </div>)}
            {!missionTasks.length ? <Empty title="Plan de tâches vide" detail="Ajoutez des tâches ordonnées avec preuve et définition de complétion."/> : null}
          </div>
        </> : <Empty title="Mission non sélectionnée" detail="Sélectionnez une mission dans le portefeuille."/>}
      </article>
    </section>

    <section className={styles.missionBottomGrid}>
      <article><SectionHeader eyebrow="SCOPE GUARD" title="Protection contre la dérive" description="Le mandat, l’out-of-scope et la réussite restent visibles pendant toute l’exécution."/>{mission ? <div className={styles.scopeConstitution}><div><ShieldCheck/><strong>Dans le scope</strong><p>{mission.scope || "Scope à formaliser."}</p></div><div><AlertTriangle/><strong>Hors scope</strong><p>{mission.out_of_scope || "Toute activité non reliée au livrable doit être validée."}</p></div></div> : null}</article>
      <article><SectionHeader eyebrow="EXCEPTIONS" title="Blocages et escalades" description="Aucun risque n’est réduit au silence par un pourcentage."/><div className={styles.blockerStack}>{blockers.map((item) => <Link key={item.id} href={`/market-os/content-command-center/dossiers/${item.dossier_id || ""}`}><AlertTriangle/><div><strong>{item.code}</strong><p>{item.title}</p></div><ArrowRight/></Link>)}{!blockers.length ? <Empty title="Aucun blocage déclaré" detail="Les missions actives ne signalent actuellement aucun état bloqué."/> : null}</div></article>
    </section>

    <Modal open={open} title="Créer une mission gouvernée" onClose={() => setOpen(false)} footer={<><button className={styles.modalSecondary} onClick={() => setOpen(false)}>Annuler</button><button className={styles.modalPrimary} disabled={busy === "create" || !form.title || !form.objective} onClick={() => void createMission()}><Workflow/> Créer et ordonner</button></>}>
      <div className={styles.formGrid}>
        <Field label="Titre"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/></Field>
        <Field label="Responsable"><input value={form.assignedToName} onChange={(e) => setForm({ ...form, assignedToName: e.target.value })}/></Field>
        <Field label="Échéance"><input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })}/></Field>
        <Field label="Objectif" wide><textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}/></Field>
        <Field label="Scope" wide><textarea value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}/></Field>
        <Field label="Définition de réussite" wide><textarea value={form.successDefinition} onChange={(e) => setForm({ ...form, successDefinition: e.target.value })}/></Field>
        {[1,2,3].map((number) => <Field key={number} label={`Tâche ${number}`} wide><input value={form[`task${number}` as keyof typeof form]} onChange={(e) => setForm({ ...form, [`task${number}`]: e.target.value })}/></Field>)}
      </div>
    </Modal>
  </main>
}
