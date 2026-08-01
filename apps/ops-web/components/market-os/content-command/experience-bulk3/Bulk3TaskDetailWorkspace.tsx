"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  History,
  MessageSquareWarning,
  ShieldAlert,
  Target,
  Workflow,
} from "lucide-react"
import { Shell, useContentStore } from "../content-command-system"
import { hydrateTaskRuntime, readTaskActivity, readTaskChecklists, readTaskExecutionMeta } from "@/lib/content-command/tasks/task-activity"
import { humanDate } from "../execution/task-operating-model"
import { bulk3ContextHref, contextFromLocation, writeBulk3Context } from "./bulk3-context"
import { taskOperatingState } from "./bulk3-derivations"
import {
  ActivityLine,
  Bulk3Shell,
  EvidenceTile,
  ExperienceHeader,
  GovernanceNotice,
  OperationalEmpty,
  ReturnContext,
  SectionTitle,
  StatusPill,
} from "./Bulk3Shared"
import styles from "./bulk3-experience.module.css"

export default function Bulk3TaskDetailWorkspace({ taskId }: { taskId: string }) {
  const { store } = useContentStore()
  const [version, setVersion] = React.useState(0)
  const [context, setContext] = React.useState<ReturnType<typeof contextFromLocation>>({ returnTo: "/market-os/content-command-center/tasks" })
  React.useEffect(() => { setContext(contextFromLocation("/market-os/content-command-center/tasks")) }, [])
  React.useEffect(() => { void hydrateTaskRuntime(taskId).then(() => setContext((current) => ({ ...current }))).catch(() => undefined) }, [taskId])
  const task = store.tasks.find((candidate) => candidate.id === taskId)
  const item = task ? store.items.find((candidate) => candidate.id === task.contentId) : null
  const meta = task ? readTaskExecutionMeta(task.id) : null
  const checklist = task ? readTaskChecklists().filter((entry) => entry.taskId === task.id) : []
  const history = task ? readTaskActivity().filter((entry) => entry.taskId === task.id) : []
  const operating = task && meta ? taskOperatingState(task, item, meta, checklist) : null
  void version

  React.useEffect(() => {
    if (!task || !meta) return
    writeBulk3Context({ dossierId: task.contentId, dossierTitle: item?.title, missionId: meta.missionId, taskId: task.id, taskTitle: task.title, stage: "task-detail", sourceHref: `/market-os/content-command-center/tasks/${task.id}`, returnTo: context.returnTo || "/market-os/content-command-center/tasks", updatedAt: new Date().toISOString() })
  }, [task, meta, item, context])

  if (!task || !meta || !operating) return <Shell><Bulk3Shell><ReturnContext href={context.returnTo}/><ExperienceHeader eyebrow="TASK ACCOUNTABILITY CHRONICLE" title="Tâche introuvable" description="Aucune tâche du registre Content Command ne correspond à cet identifiant. Aucun dossier d’audit fictif n’est généré."/><OperationalEmpty title="Aucun objet à auditer" detail={`Identifiant demandé : ${taskId}`}/></Bulk3Shell></Shell>

  const summary = [
    { label: "Dossier", value: item?.title || task.contentId || "Non relié" },
    { label: "Mission", value: meta.missionId || "Non renseignée" },
    { label: "Owner", value: task.owner || "À affecter" },
    { label: "Réviseur", value: meta.reviewer || "À désigner" },
    { label: "Échéance", value: humanDate(task.dueDate) },
    { label: "État", value: meta.workState.replaceAll("_", " ") },
  ]

  return <Shell><Bulk3Shell>
    <ReturnContext href={context.returnTo}/>
    <ExperienceHeader eyebrow="ACCOUNTABILITY CHRONICLE / ANGELCARE" title="Comprendre exactement ce qui était attendu, ce qui a changé et pourquoi la tâche est dans cet état." description="Task Detail devient le dossier forensic : constitution originale, prise en charge, changements, clarifications, blocages, preuves, décisions et handovers restent lisibles sans dupliquer le poste d’exécution." actions={<><Link className={styles.secondaryButton} href={bulk3ContextHref(`/market-os/content-command-center/tasks/${task.id}/edit`, { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/${task.id}` })}><GitBranch size={15}/>Amendement</Link><Link className={styles.primaryButton} href={bulk3ContextHref(`/market-os/content-command-center/tasks/execution?task=${task.id}`, { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/${task.id}` })}><Target size={15}/>Poste d’exécution</Link></>}/>

    <section className={styles.chronicleLayout}>
      <aside className={styles.chronicleSummary}>
        <section className={styles.chronicleSummaryHero}><small>TASK FORENSIC RECORD</small><h2>{task.title}</h2><p>{meta.objective || task.notes || "Objectif non documenté."}</p></section>
        <div className={styles.chronicleSummaryGrid}>{summary.map((entry) => <div key={entry.label}><small>{entry.label}</small><strong>{entry.value}</strong></div>)}</div>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <GovernanceNotice kind={operating.openBlockers ? "danger" : operating.openClarifications ? "warning" : "info"} title={operating.nextAction}>{operating.openBlockers ? `${operating.openBlockers} blocage(s) restent ouverts.` : operating.openClarifications ? `${operating.openClarifications} clarification(s) attendent une réponse.` : "Aucun défaut critique n’est exposé par le registre actuel."}</GovernanceNotice>
          <Link className={styles.quietButton} href={bulk3ContextHref("/market-os/content-command-center/missions", { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/${task.id}` })}><Workflow size={13}/>Ouvrir Mission Control</Link>
        </div>
      </aside>

      <section className={styles.chronicle}>
        <SectionTitle eyebrow="ACCOUNTABILITY TIMELINE" title="Chronique des événements observables" description="Les événements sont issus du registre de tâche existant. Aucun acteur, commentaire ou décision n’est inventé."/>
        {history.length ? <div className={styles.chronicleRail}>{history.map((event) => <div className={styles.chronicleEvent} key={event.id}><header><strong>{event.action.replaceAll("_", " ")}</strong><time>{humanDate(event.timestamp)}</time></header><p>{event.detail}</p></div>)}</div> : <OperationalEmpty title="Aucun événement enregistré" detail="La tâche existe, mais son registre d’activité ne contient encore aucun événement exploitable."/>}

        <div className={styles.comparisonGrid}>
          <section className={styles.comparisonPanel}><h3>Constitution originale observable</h3><dl><div><dt>Objectif</dt><dd>{meta.objective || task.notes || "Non défini"}</dd></div><div><dt>Périmètre</dt><dd>{meta.scope || "Non défini"}</dd></div><div><dt>Owner</dt><dd>{task.owner || "Non affecté"}</dd></div><div><dt>Échéance</dt><dd>{humanDate(task.dueDate)}</dd></div><div><dt>Réalisation</dt><dd>{meta.completionDefinition || "Non définie"}</dd></div></dl></section>
          <section className={styles.comparisonPanel}><h3>État institutionnel actuel</h3><dl><div><dt>Work state</dt><dd>{meta.workState.replaceAll("_", " ")}</dd></div><div><dt>Checklist</dt><dd>{checklist.filter((entry) => entry.done).length}/{checklist.length}</dd></div><div><dt>Preuves</dt><dd>{meta.evidences.length} · {operating.acceptedEvidence} acceptée(s)</dd></div><div><dt>Blocages</dt><dd>{operating.openBlockers}</dd></div><div><dt>Clarifications</dt><dd>{operating.openClarifications}</dd></div></dl></section>
        </div>

        <div style={{ marginTop: 16 }}><SectionTitle eyebrow="EVIDENCE & REVIEW" title="Preuves, findings et décision" description="Une pièce jointe reste distincte d’une preuve acceptée."/>{meta.evidences.length ? <div className={styles.materialList}>{meta.evidences.map((evidence) => <EvidenceTile key={evidence.id} label={evidence.label} state={evidence.state} note={evidence.note} href={evidence.url}/>)}</div> : <OperationalEmpty title="Aucune preuve" detail={meta.evidenceRequirement || "Aucune exigence de preuve n’est documentée."}/>}</div>

        <div className={styles.comparisonGrid} style={{ marginTop: 16 }}>
          <section className={styles.comparisonPanel}><h3>Clarifications</h3>{meta.clarifications.length ? meta.clarifications.map((entry) => <ActivityLine key={entry.id} title={entry.question} detail={`Demandée à ${entry.requestedFrom || "non renseigné"} · ${entry.state}`} date={humanDate(entry.dueDate)}/>) : <p>Aucune clarification enregistrée.</p>}</section>
          <section className={styles.comparisonPanel}><h3>Blocages</h3>{meta.blockers.length ? meta.blockers.map((entry) => <ActivityLine key={entry.id} title={entry.description} detail={`${entry.type} · owner ${entry.owner || "non renseigné"} · ${entry.state}`} date={humanDate(entry.openedAt)} icon={<ShieldAlert size={14}/>}/>) : <p>Aucun blocage enregistré.</p>}</section>
        </div>
      </section>
    </section>
  </Bulk3Shell></Shell>
}
