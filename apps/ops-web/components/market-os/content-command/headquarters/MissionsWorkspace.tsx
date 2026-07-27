"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  GitBranch,
  Layers3,
  Plus,
  Route,
  ShieldCheck,
  Target,
  UsersRound,
  Workflow,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { formatDate, headquartersAction, statusLabel, useHeadquartersSnapshot } from "./client"
import {
  EmptyState,
  ExecutionBadge,
  ExecutionModal,
  ExecutionPanel,
  MetricCard,
  ProgressBar,
  SectionHeading,
  StatusMessage,
  toneForStatus,
} from "../execution/execution-ui"
import styles from "../execution/execution-command.module.css"

const lifecycle = [
  "proposed",
  "qualifying",
  "scope_approved",
  "ready",
  "assigned",
  "accepted",
  "in_progress",
  "checkpoint",
  "submitted",
  "ai_review",
  "human_review",
  "revision",
  "validated",
  "closed",
]

const nextMissionState: Record<string, { status: string; label: string }> = {
  proposed: { status: "qualifying", label: "Qualifier" },
  qualifying: { status: "scope_approved", label: "Approuver le périmètre" },
  scope_approved: { status: "ready", label: "Déclarer prête" },
  ready: { status: "assigned", label: "Libérer la mission" },
  assigned: { status: "accepted", label: "Confirmer la prise en charge" },
  accepted: { status: "in_progress", label: "Démarrer l’exécution" },
  in_progress: { status: "checkpoint", label: "Ouvrir un point de contrôle" },
  checkpoint: { status: "submitted", label: "Soumettre les preuves" },
  submitted: { status: "ai_review", label: "Préparer l’analyse assistée" },
  ai_review: { status: "human_review", label: "Transmettre à l’autorité" },
  human_review: { status: "validated", label: "Valider la mission" },
  revision: { status: "in_progress", label: "Reprendre l’exécution" },
  validated: { status: "closed", label: "Clôturer" },
  blocked: { status: "in_progress", label: "Lever le blocage" },
  paused: { status: "in_progress", label: "Reprendre" },
}

function readinessForMission(mission: any, tasks: any[]) {
  const missing = [
    !mission?.objective ? "Objectif opérationnel" : null,
    !mission?.scope ? "Périmètre autorisé" : null,
    !mission?.success_definition ? "Définition de réussite" : null,
    !mission?.assigned_to_name ? "Responsable de mission" : null,
    !mission?.reviewer_name ? "Réviseur" : null,
    !mission?.due_at ? "Échéance" : null,
    !tasks.length ? "Architecture de tâches" : null,
    tasks.some((task) => !task.completion_definition) ? "Définition de réalisation sur toutes les tâches" : null,
  ].filter(Boolean) as string[]
  const score = Math.max(0, Math.round(((8 - missing.length) / 8) * 100))
  return { missing, score, ready: missing.length === 0 }
}

export default function MissionsWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selected, setSelected] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [form, setForm] = React.useState({ title: "", objective: "", scope: "", successDefinition: "", assignedToName: "", dueAt: "", task1: "", task2: "", task3: "" })

  const missions = snapshot?.missions || []
  const mission = missions.find((item) => item.id === selected) || missions[0]
  const missionTasks = snapshot?.tasks.filter((task) => task.mission_id === mission?.id) || []
  const readiness = mission ? readinessForMission(mission, missionTasks) : { missing: [], score: 0, ready: false }
  const blockers = missions.filter((item) => item.status === "blocked")
  const overdue = missions.filter((item) => item.due_at && new Date(item.due_at).getTime() < Date.now() && !["closed", "validated"].includes(item.status))
  const awaitingEvidence = missions.filter((item) => ["checkpoint", "submitted"].includes(item.status))
  const readyToClose = missions.filter((item) => item.status === "validated")

  async function createMission() {
    setBusy("create")
    setNotice("")
    try {
      await headquartersAction("create_mission", {
        ...form,
        tasks: [form.task1, form.task2, form.task3]
          .filter(Boolean)
          .map((title) => ({ title, evidenceRequired: true, completionDefinition: "Preuve soumise, analysée et acceptée dans le dossier." })),
      })
      setOpen(false)
      setForm({ title: "", objective: "", scope: "", successDefinition: "", assignedToName: "", dueAt: "", task1: "", task2: "", task3: "" })
      setNotice("Mission créée. Sa préparation opérationnelle doit maintenant être confirmée avant libération.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "La mission n’a pas pu être créée.")
    } finally {
      setBusy("")
    }
  }

  async function advanceTask(taskId: string, status: string, progress: number) {
    setBusy(taskId)
    try {
      await headquartersAction("update_task", { taskId, status, progress })
      await refresh()
    } finally {
      setBusy("")
    }
  }

  async function advanceMission(status: string) {
    if (!mission) return
    setBusy(mission.id)
    setNotice("")
    try {
      await headquartersAction("update_mission_status", {
        missionId: mission.id,
        status,
        note: "Transition confirmée depuis Mission Control — Mega ZIP 4.",
      })
      setNotice(`Transition enregistrée : ${statusLabel(status)}.`)
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "La transition n’a pas pu être enregistrée.")
    } finally {
      setBusy("")
    }
  }

  return <main className={styles.root} data-market-os-root>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>

    <section className={styles.hero}>
      <div>
        <span className={styles.eyebrow}><Route size={16}/> MISSION CONTROL / QUARTIER GÉNÉRAL D’EXÉCUTION</span>
        <h1>Transformer une direction approuvée en exécution contrôlée, prouvée et clôturable.</h1>
        <p>Chaque mission possède un mandat, un périmètre, une responsabilité, une architecture de tâches, des points de contrôle, des preuves exigées et une autorité de clôture.</p>
      </div>
      <div className={styles.heroActions}>
        <button type="button" className={styles.primaryButton} onClick={() => setOpen(true)}><Plus size={16}/> Constituer une mission</button>
        <Link className={styles.secondaryButton} href="/market-os/content-command-center/tasks"><ClipboardCheck size={16}/> Ouvrir Task Command</Link>
      </div>
    </section>

    {notice ? <StatusMessage kind={notice.includes("pas pu") ? "error" : "success"}>{notice}</StatusMessage> : null}

    <section className={styles.metricGrid} aria-label="Indicateurs opérationnels des missions">
      <MetricCard label="Missions actives" value={missions.filter((item) => !["closed", "cancelled"].includes(item.status)).length} detail="Portefeuille actuellement gouverné" icon={<Workflow size={14}/>}/>
      <MetricCard label="Blocages" value={blockers.length} detail="Missions nécessitant une résolution explicite" icon={<AlertTriangle size={14}/>}/>
      <MetricCard label="Échéances dépassées" value={overdue.length} detail="Charge à réordonner ou escalader" icon={<CalendarClock size={14}/>}/>
      <MetricCard label="Preuves attendues" value={awaitingEvidence.length} detail="Points de contrôle et soumissions" icon={<ShieldCheck size={14}/>}/>
      <MetricCard label="Prêtes à clôturer" value={readyToClose.length} detail="Validation obtenue, clôture à autoriser" icon={<CheckCircle2 size={14}/>}/>
    </section>

    <section className={styles.gridTwo}>
      <ExecutionPanel>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="PORTEFEUILLE DE RESPONSABILITÉ" title="Missions, autorité et prochain verrou" description="La priorité vient de l’état réel, de l’échéance, du risque et du prochain gate — jamais d’un pourcentage isolé."/>
          <div className={styles.missionList}>
            {missions.map((item) => {
              const tasks = snapshot?.tasks.filter((task) => task.mission_id === item.id) || []
              const itemReadiness = readinessForMission(item, tasks)
              return <button type="button" key={item.id} className={`${styles.missionCard} ${mission?.id === item.id ? styles.selectedCard : ""}`} onClick={() => setSelected(item.id)} aria-pressed={mission?.id === item.id}>
                <span className={styles.code}>{item.code || "MISSION"}</span>
                <span className={styles.cardMain}>
                  <strong>{item.title}</strong>
                  <p>{item.objective || "Objectif à formaliser avant libération."}</p>
                  <span className={styles.cardMeta}><span>{item.assigned_to_name || "Responsable manquant"}</span><span>{formatDate(item.due_at)}</span><span>{tasks.length} tâche(s)</span><span>{itemReadiness.score}% prête</span></span>
                </span>
                <ExecutionBadge tone={toneForStatus(item.status)}>{statusLabel(item.status)}</ExecutionBadge>
              </button>
            })}
            {!missions.length ? <EmptyState title="Aucune mission constituée" detail="Une stratégie approuvée ou une demande autorisée doit être convertie en mission avec périmètre, résultat et preuves." action="Ouvrir la Fabrique stratégique" href="/market-os/content-command-center/strategies"/> : null}
          </div>
        </div>
      </ExecutionPanel>

      <ExecutionPanel>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="READINESS GATE" title={mission ? `Préparation de ${mission.code}` : "Préparation opérationnelle"} description="Une mission n’est libérable que lorsque le mandat, le périmètre, l’owner, les tâches, les preuves et le réviseur sont explicites."/>
          {mission ? <>
            <ProgressBar value={readiness.score} label={readiness.ready ? "Mission prête à être libérée" : "Préparation incomplète"}/>
            {readiness.missing.length ? <ul className={styles.missingList}>{readiness.missing.map((item) => <li key={item}><AlertTriangle size={14}/>{item}</li>)}</ul> : <StatusMessage kind="success">Toutes les exigences observables de préparation sont présentes.</StatusMessage>}
            <div className={styles.detailStrip}>
              <div className={styles.detailCell}><small>Responsable</small><strong>{mission.assigned_to_name || "Non affecté"}</strong></div>
              <div className={styles.detailCell}><small>Réviseur</small><strong>{mission.reviewer_name || "Non désigné"}</strong></div>
              <div className={styles.detailCell}><small>Risque</small><strong>{statusLabel(mission.risk_level || "non_evalue")}</strong></div>
              <div className={styles.detailCell}><small>Échéance</small><strong>{formatDate(mission.due_at)}</strong></div>
              <div className={styles.detailCell}><small>Prochain gate</small><strong>{nextMissionState[mission.status]?.label || "Aucun gate disponible"}</strong></div>
            </div>
            {nextMissionState[mission.status] ? <button type="button" className={styles.quietButton} disabled={busy === mission.id} onClick={() => void advanceMission(nextMissionState[mission.status].status)}><Workflow size={15}/>{nextMissionState[mission.status].label}</button> : null}
          </> : <EmptyState title="Sélectionnez une mission" detail="Le readiness gate s’appuie uniquement sur les informations réellement disponibles."/>}
        </div>
      </ExecutionPanel>
    </section>

    <section className={styles.panel} style={{ marginTop: 16 }}>
      <div className={styles.panelInner}>
        <SectionHeading eyebrow="LIFECYCLE RUNWAY" title="Quatorze gates d’autorité et de preuve" description="Chaque transition révèle son état, son responsable implicite et la condition suivante. La séquence reste utilisable sur mobile."/>
        <div className={styles.stageRail} aria-label="Cycle de vie de la mission">
          {lifecycle.map((stage, index) => {
            const currentIndex = mission ? lifecycle.indexOf(mission.status) : -1
            const isCurrent = mission?.status === stage
            const isComplete = currentIndex > index
            const isBlocked = mission?.status === "blocked" && stage === "in_progress"
            return <div key={stage} className={`${styles.stage} ${isCurrent ? styles.stageCurrent : ""} ${isComplete ? styles.stageComplete : ""} ${isBlocked ? styles.stageBlocked : ""}`} aria-current={isCurrent ? "step" : undefined}>
              <strong>{statusLabel(stage)}</strong><small>{isCurrent ? "Gate actuel" : isComplete ? "Gate franchi" : "À venir"}</small>
            </div>
          })}
        </div>
      </div>
    </section>

    <section className={styles.gridTwo}>
      <ExecutionPanel>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="CONSTITUTION DE MISSION" title="Mandat, périmètre et réussite" description="L’exécution ne peut pas élargir silencieusement la mission au-delà de ce qui a été autorisé."/>
          {mission ? <div className={styles.scopeGrid}>
            <div className={styles.scopeGood}><strong><Target size={15}/> Objectif opérationnel</strong><p>{mission.objective || "Objectif manquant — qualification requise."}</p></div>
            <div className={styles.scopeGood}><strong><ShieldCheck size={15}/> Périmètre autorisé</strong><p>{mission.scope || "Périmètre à formaliser."}</p></div>
            <div className={styles.scopeStop}><strong><AlertTriangle size={15}/> Hors périmètre</strong><p>{mission.out_of_scope || "Toute activité non reliée au résultat doit faire l’objet d’un amendement autorisé."}</p></div>
            <div className={styles.scopeNeutral}><strong><Flag size={15}/> Définition de réussite</strong><p>{mission.success_definition || "Condition de réussite manquante."}</p></div>
          </div> : <EmptyState title="Aucune constitution sélectionnée" detail="Sélectionnez une mission dans le portefeuille."/>}
        </div>
      </ExecutionPanel>

      <ExecutionPanel>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="RESOURCE & AUTHORITY MAP" title="Responsabilités explicites" description="La charge observée ne devient jamais un score de performance. Elle sert uniquement à rendre les affectations et défauts d’ownership visibles."/>
          {mission ? <div className={styles.detailStrip}>
            <div className={styles.detailCell}><small>Sponsor / origine</small><strong>{statusLabel(mission.origin_type || "non_renseigne")}</strong></div>
            <div className={styles.detailCell}><small>Mission owner</small><strong>{mission.assigned_to_name || "Défaut d’ownership"}</strong></div>
            <div className={styles.detailCell}><small>Réviseur</small><strong>{mission.reviewer_name || "À désigner"}</strong></div>
            <div className={styles.detailCell}><small>Supervision IA</small><strong>{mission.ai_director_id ? "Référencée" : "Non affectée"}</strong></div>
            <div className={styles.detailCell}><small>Tâches non affectées</small><strong>{missionTasks.filter((task) => !task.assigned_to_name).length}</strong></div>
          </div> : null}
        </div>
      </ExecutionPanel>
    </section>

    <section className={styles.gridMainRail}>
      <ExecutionPanel>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="TASK ARCHITECTURE" title={mission ? `Plan d’exécution — ${mission.title}` : "Architecture ordonnée"} description="Les dépendances sont présentées comme une séquence observable; aucun chemin critique n’est inventé sans données de dépendance." action={<Link href="/market-os/content-command-center/tasks" className={styles.quietButton}>Task Command <ArrowRight size={14}/></Link>}/>
          {missionTasks.length ? <div className={styles.dependencyGraph}>
            {missionTasks.map((task, index) => <article className={styles.dependencyNode} key={task.id}>
              <span className={styles.sequence}>{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.cardMain}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><ExecutionBadge tone={toneForStatus(task.status)}>{statusLabel(task.status)}</ExecutionBadge>{task.evidence_required ? <ExecutionBadge tone="warning">Preuve requise</ExecutionBadge> : null}</div>
                <strong style={{ marginTop: 8 }}>{task.title}</strong>
                <p>{task.description || task.completion_definition || "Définition de réalisation à compléter."}</p>
                <span className={styles.cardMeta}><span>{task.assigned_to_name || mission.assigned_to_name || "Non affectée"}</span><span>{formatDate(task.due_at)}</span><span>{task.progress || 0}% déclaré</span></span>
              </div>
              <div className={styles.nodeActions}>
                <button disabled={busy === task.id} onClick={() => void advanceTask(task.id, "doing", Math.max(20, task.progress || 0))}>Démarrer</button>
                <button disabled={busy === task.id || Boolean(task.evidence_required && !(task as any).evidence_id)} onClick={() => void advanceTask(task.id, "done", 100)}>Soumettre</button>
              </div>
            </article>)}
          </div> : <EmptyState title="Architecture de tâches absente" detail="La mission ne peut pas être considérée prête tant que les unités d’exécution et leurs conditions de réalisation ne sont pas définies."/>}
        </div>
      </ExecutionPanel>

      <div style={{ display: "grid", gap: 16 }}>
        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="CHECKPOINT COMMAND" title="Preuves et gates" description="Les tâches terminées sans preuve restent des déclarations, pas des résultats acceptés."/>
            <div className={styles.commandQueue}>
              <div className={styles.queueCard}><span>Preuves requises</span><strong>{missionTasks.filter((task) => task.evidence_required).length}</strong><p>Obligations explicites sur les tâches</p></div>
              <div className={styles.queueCard}><span>Preuves manquantes</span><strong>{missionTasks.filter((task) => task.evidence_required && !(task as any).evidence_id).length}</strong><p>Soumission impossible ou à compléter</p></div>
              <div className={styles.queueCard}><span>À réviser</span><strong>{missionTasks.filter((task) => ["submitted", "review"].includes(task.status)).length}</strong><p>Décision humaine attendue</p></div>
            </div>
          </div>
        </ExecutionPanel>

        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="RISK & ESCALATION" title="Blocages sans silence" description="Chaque blocage doit avoir un owner, une conséquence et une résolution enregistrée."/>
            <div className={styles.queueList}>
              {blockers.slice(0, 5).map((item) => <Link className={styles.queueItem} key={item.id} href={item.dossier_id ? `/market-os/content-command-center/dossiers/${item.dossier_id}` : "/market-os/content-command-center/missions"}>
                <AlertTriangle size={17}/><span className={styles.cardMain}><strong>{item.code}</strong><p>{item.title}</p><span className={styles.cardMeta}><span>{item.assigned_to_name || "Owner manquant"}</span><span>{formatDate(item.due_at)}</span></span></span><ArrowRight size={15}/>
              </Link>)}
              {!blockers.length ? <EmptyState title="Aucun blocage déclaré" detail="Aucune mission n’est actuellement dans l’état bloqué. Cette vue n’invente pas de risque latent."/> : null}
            </div>
          </div>
        </ExecutionPanel>
      </div>
    </section>

    <section className={styles.gridThree}>
      <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="HANDOVER" title="Transfert de responsabilité" description="Les changements d’owner doivent exposer les tâches ouvertes, preuves et risques."/><EmptyState title="Handover non modélisé par le snapshot" detail="Le workspace présente la limite honnêtement; aucune prise en charge fictive n’est créée côté client."/></div></ExecutionPanel>
      <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="CLOSURE REVIEW" title="Conditions de clôture" description="Livrables, tâches, preuves, revue et blocages doivent être connus avant fermeture."/>{mission ? <ul className={styles.missingList}>{[
        missionTasks.some((task) => task.status !== "done") ? "Tâches non terminées" : null,
        missionTasks.some((task) => task.evidence_required && !(task as any).evidence_id) ? "Preuves manquantes" : null,
        blockers.some((item) => item.id === mission.id) ? "Blocage ouvert" : null,
        mission.status !== "validated" ? "Validation finale non obtenue" : null,
      ].filter(Boolean).map((item) => <li key={item as string}><AlertTriangle size={14}/>{item}</li>)}</ul> : null}</div></ExecutionPanel>
      <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="LESSONS LEARNED" title="Capitaliser sans inventer" description="Les enseignements ne sont affichés que lorsqu’un retour réellement enregistré existe."/><EmptyState title="Aucun enseignement enregistré" detail="La clôture devra documenter ce qui a fonctionné, échoué, retardé ou mérite une règle réutilisable."/></div></ExecutionPanel>
    </section>

    <ExecutionModal open={open} title="Constituer une mission gouvernée" onClose={() => setOpen(false)} footer={<><button className={styles.quietButton} onClick={() => setOpen(false)}>Annuler</button><button className={styles.primaryButton} disabled={busy === "create" || !form.title.trim() || !form.objective.trim()} onClick={() => void createMission()}><Workflow size={15}/>Créer la mission</button></>}>
      <div className={styles.formGrid}>
        <label className={styles.label}>Titre<input className={styles.field} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label>
        <label className={styles.label}>Responsable proposé<input className={styles.field} value={form.assignedToName} onChange={(event) => setForm({ ...form, assignedToName: event.target.value })}/></label>
        <label className={styles.label}>Échéance<input className={styles.field} type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })}/></label>
        <label className={`${styles.label} ${styles.formWide}`}>Objectif<textarea className={styles.textarea} value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })}/></label>
        <label className={`${styles.label} ${styles.formWide}`}>Périmètre autorisé<textarea className={styles.textarea} value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}/></label>
        <label className={`${styles.label} ${styles.formWide}`}>Définition de réussite<textarea className={styles.textarea} value={form.successDefinition} onChange={(event) => setForm({ ...form, successDefinition: event.target.value })}/></label>
        {[1, 2, 3].map((number) => {
          const key = `task${number}` as "task1" | "task2" | "task3"
          return <label className={`${styles.label} ${styles.formWide}`} key={key}>Tâche {number}<input className={styles.field} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label>
        })}
      </div>
    </ExecutionModal>
  </main>
}
