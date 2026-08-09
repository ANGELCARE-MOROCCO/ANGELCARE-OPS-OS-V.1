"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Flag,
  GitBranch,
  Layers3,
  ListChecks,
  PauseCircle,
  Play,
  Plus,
  Route,
  ShieldCheck,
  Target,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react"
import { PageStatus } from "../headquarters/primitives"
import { formatDate, headquartersAction, statusLabel, useHeadquartersSnapshot } from "../headquarters/client"
import { contextFromLocation, bulk3ContextHref, writeBulk3Context } from "./bulk3-context"
import { missionClosureMissing, missionDominantAction, missionReadiness } from "./bulk3-derivations"
import {
  Bulk3Modal,
  Bulk3Shell,
  BusyLabel,
  ExperienceHeader,
  GovernanceNotice,
  IdentityBridge,
  MetricRail,
  OperationalEmpty,
  ReadinessRunway,
  ReturnContext,
  SectionTitle,
  StatusPill,
} from "./Bulk3Shared"
import styles from "./bulk3-experience.module.css"

type MissionTab = "constitution" | "architecture" | "responsibility" | "release" | "closure"

function missionTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" | "navy" {
  if (["closed", "validated", "ready"].includes(status)) return "success"
  if (["blocked", "cancelled"].includes(status)) return "danger"
  if (["revision", "checkpoint", "submitted", "human_review"].includes(status)) return "warning"
  if (["assigned", "accepted", "in_progress"].includes(status)) return "info"
  return "neutral"
}

function missionCode(mission: any) {
  return mission?.code || `AC-MISSION-${String(mission?.id || "—").slice(-6).toUpperCase()}`
}

function optionalMissionText(
  mission: unknown,
  key: string,
): string | undefined {
  if (!mission || typeof mission !== "object") return undefined

  const value = (mission as Record<string, unknown>)[key]

  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined
}

export default function Bulk3MissionControlWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selectedId, setSelectedId] = React.useState("")
  const [tab, setTab] = React.useState<MissionTab>("constitution")
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [decisionOpen, setDecisionOpen] = React.useState(false)
  const [form, setForm] = React.useState({ title: "", objective: "", scope: "", exclusions: "", successDefinition: "", owner: "", reviewer: "", dueAt: "", task1: "", task2: "", task3: "" })
  const [locationContext, setLocationContext] = React.useState<ReturnType<typeof contextFromLocation>>({ returnTo: "/market-os/content-command-center" })

  React.useEffect(() => { setLocationContext(contextFromLocation("/market-os/content-command-center")) }, [])
  const missions = snapshot?.missions || []
  const mission = missions.find((item: any) => item.id === selectedId) || missions.find((item: any) => item.id === locationContext.missionId) || missions[0]
  const tasks = mission ? (snapshot?.tasks || []).filter((task: any) => task.mission_id === mission.id) : []
  const readiness = missionReadiness(mission, tasks)
  const dominant = missionDominantAction(mission, readiness)
  const closureMissing = missionClosureMissing(mission, tasks)
  const active = missions.filter((item: any) => !["closed", "cancelled"].includes(item.status))
  const blockers = missions.filter((item: any) => item.status === "blocked")
  const awaitingRelease = missions.filter((item: any) => ["scope_approved", "ready", "assigned"].includes(item.status))
  const awaitingClosure = missions.filter((item: any) => item.status === "validated")
  const overdue = active.filter((item: any) => item.due_at && new Date(item.due_at).getTime() < Date.now())
  const unassignedTasks = (snapshot?.tasks || []).filter((task: any) => !task.assigned_to_name)

  React.useEffect(() => {
    if (!mission) return
    writeBulk3Context({
      dossierId: mission.dossier_id || locationContext.dossierId,
      missionId: mission.id,
      missionTitle: mission.title,
      stage: "mission",
      sourceHref: `/market-os/content-command-center/missions?mission=${mission.id}`,
      returnTo: locationContext.returnTo || "/market-os/content-command-center",
      updatedAt: new Date().toISOString(),
    })
  }, [mission, locationContext])

  async function transitionMission() {
    if (!mission || readiness.missing.length) {
      setNotice(readiness.missing[0] || "La transition n’est pas disponible.")
      return
    }
    setBusy(mission.id)
    setNotice("")
    try {
      await headquartersAction("update_mission_status", {
        missionId: mission.id,
        status: dominant.targetStatus,
        note: "Transition gouvernée depuis Experience Reconstruction Bulk 3.",
      })
      setDecisionOpen(false)
      setNotice(`Transition enregistrée : ${dominant.label}.`)
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "La transition n’a pas pu être enregistrée.")
    } finally {
      setBusy("")
    }
  }

  async function updateTask(taskId: string, status: string, progress: number) {
    setBusy(taskId)
    setNotice("")
    try {
      await headquartersAction("update_task", { taskId, status, progress })
      setNotice("État de tâche synchronisé avec le dossier de mission.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "La tâche n’a pas pu être mise à jour.")
    } finally {
      setBusy("")
    }
  }

  async function createMission() {
    if (!form.title.trim() || !form.objective.trim()) return
    setBusy("create")
    try {
      await headquartersAction("create_mission", {
        title: form.title,
        objective: form.objective,
        scope: form.scope,
        exclusions: form.exclusions,
        successDefinition: form.successDefinition,
        assignedToName: form.owner,
        reviewerName: form.reviewer,
        dueAt: form.dueAt,
        dossierId: locationContext.dossierId,
        tasks: [form.task1, form.task2, form.task3].filter(Boolean).map((title) => ({
          title,
          evidenceRequired: true,
          completionDefinition: "Résultat livré, preuve jointe et décision de révision enregistrée.",
        })),
      })
      setCreateOpen(false)
      setForm({ title: "", objective: "", scope: "", exclusions: "", successDefinition: "", owner: "", reviewer: "", dueAt: "", task1: "", task2: "", task3: "" })
      setNotice("Mission constituée. Sa préparation doit être inspectée avant libération.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "La mission n’a pas pu être créée.")
    } finally { setBusy("") }
  }

  return <Bulk3Shell>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <ReturnContext href={locationContext.returnTo}/>
    <ExperienceHeader
      eyebrow="MISSION OPERATIONS RUNWAY / ANGELCARE"
      title="Constituer, libérer et clôturer chaque mission avec une responsabilité incontestable."
      description="La mission devient un charter opérationnel : origine stratégique, périmètre, livrables, architecture de tâches, ownership, preuves, checkpoints, autorité et conditions de clôture restent visibles dans une seule continuité."
      actions={<><button className={styles.secondaryButton} type="button" onClick={() => void refresh()}><Route size={15}/>Actualiser</button><button className={styles.primaryButton} type="button" onClick={() => setCreateOpen(true)}><Plus size={15}/>Constituer une mission</button></>}
    />
    {notice ? <GovernanceNotice kind={notice.includes("pas") || notice.includes("doit") ? "warning" : "success"} title="État de l’opération">{notice}</GovernanceNotice> : null}
    <MetricRail items={[
      { label: "Missions actives", value: active.length, detail: "Portefeuille opérationnel ouvert", tone: "info" },
      { label: "Libération attendue", value: awaitingRelease.length, detail: "Constitution à autoriser", tone: "warning" },
      { label: "Blocages critiques", value: blockers.length, detail: "Intervention explicite requise", tone: blockers.length ? "danger" : "success" },
      { label: "Échéances exposées", value: overdue.length, detail: "Dates dépassées ou à arbitrer", tone: overdue.length ? "danger" : "neutral" },
      { label: "Clôture attendue", value: awaitingClosure.length, detail: "Validation obtenue, closure à décider", tone: "success" },
    ]}/>

    {!mission ? <OperationalEmpty title="Aucune mission réelle" detail="Aucune mission n’est exposée par le snapshot Headquarters. Le workspace ne crée aucune mission de démonstration." action={<button className={styles.primaryButton} onClick={() => setCreateOpen(true)}>Constituer la première mission</button>}/> : <>
      <IdentityBridge
        code={missionCode(mission)}
        title={mission.title}
        meta={[
          { label: "Dossier", value: mission.dossier_id || locationContext.dossierId || "Non relié" },
          { label: "Owner", value: mission.assigned_to_name || "À affecter" },
          { label: "Réviseur", value: mission.reviewer_name || "À désigner" },
          { label: "Échéance", value: formatDate(mission.due_at) },
          { label: "Phase", value: statusLabel(mission.status || "proposed") },
        ]}
        state={<StatusPill tone={missionTone(mission.status || "")}>{statusLabel(mission.status || "proposed")}</StatusPill>}
        dominantAction={dominant.label}
        onDominantAction={() => setDecisionOpen(true)}
        disabled={Boolean(busy)}
      />

      <section className={styles.missionRunway}>
        <aside className={styles.missionPortfolio}>
          <SectionTitle eyebrow="MISSION PORTFOLIO" title="Portefeuille de responsabilité" description="Sélectionnez une mission sans perdre le dossier ou le point de retour."/>
          <div className={styles.missionPortfolioList}>
            {missions.map((item: any) => {
              const itemTasks = (snapshot?.tasks || []).filter((task: any) => task.mission_id === item.id)
              const itemReadiness = missionReadiness(item, itemTasks)
              return <button key={item.id} type="button" className={`${styles.missionPortfolioButton} ${item.id === mission.id ? styles.missionPortfolioButtonActive : ""}`} onClick={() => { setSelectedId(item.id); setTab("constitution") }}>
                <div><strong>{item.title}</strong><p>{item.objective || "Objectif à compléter"}</p><span className={styles.missionPortfolioMeta}><StatusPill tone={missionTone(item.status || "")}>{statusLabel(item.status || "proposed")}</StatusPill><StatusPill tone={itemReadiness.ready ? "success" : "warning"}>{itemReadiness.completed}/{itemReadiness.total}</StatusPill></span></div><ArrowRight size={15}/>
              </button>
            })}
          </div>
        </aside>

        <div className={styles.missionCanvas}>
          <div className={styles.missionTabs} role="tablist" aria-label="Espaces de la mission">
            {(["constitution", "architecture", "responsibility", "release", "closure"] as MissionTab[]).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} aria-pressed={tab === value} onClick={() => setTab(value)}>{({ constitution: "Constitution", architecture: "Architecture", responsibility: "Responsabilités", release: "Libération", closure: "Clôture" } as const)[value]}</button>)}
          </div>

          {tab === "constitution" ? <div className={styles.constitutionGrid}>
            <section className={styles.charterPanel}><small>MISSION CHARTER</small><h3>{mission.objective || "Objectif opérationnel à constituer"}</h3><p>{mission.success_definition || "La définition de réussite doit préciser le résultat, les preuves et le handover attendus."}</p><div className={styles.scopeColumns}><div><strong>Inclus</strong><span>{mission.scope || "Périmètre non défini"}</span></div><div><strong>Exclus / limites</strong><span>{optionalMissionText(mission, "exclusions") || "Exclusions non documentées"}</span></div></div></section>
            <section className={styles.deliverablePanel}><h3>Livrables et preuve d’existence</h3><p>Les tâches visibles représentent les unités d’exécution réellement reliées à la mission.</p><div className={styles.deliverableList}>{tasks.slice(0, 5).map((task: any, index: number) => <div className={styles.deliverableItem} key={task.id}><span>{index + 1}</span><div><strong>{task.title}</strong><small>{task.completion_definition || task.description || "Condition de réalisation absente"}</small></div><StatusPill tone={missionTone(task.status || "")}>{statusLabel(task.status || "todo")}</StatusPill></div>)}</div></section>
            <section className={styles.checkpointPanel}><h3>Origine et autorité</h3><p>Origine : {statusLabel(mission.origin_type || "non_renseignee")}. Sponsor : {optionalMissionText(mission, "sponsor_name") || optionalMissionText(mission, "created_by_name") || "Non exposé"}. La libération reste distincte de la création.</p></section>
            <ReadinessRunway completed={readiness.completed} total={readiness.total} missing={readiness.missing} label="Mission readiness"/>
          </div> : null}

          {tab === "architecture" ? <section className={styles.architectureMap}><SectionTitle eyebrow="EXECUTION ARCHITECTURE" title="Dépendances, preuves et checkpoints" description="La séquence est issue des tâches réellement reliées. Aucun chemin critique n’est inventé." action={<Link className={styles.quietButton} href={bulk3ContextHref("/market-os/content-command-center/tasks", { dossierId: mission.dossier_id ?? undefined, missionId: mission.id, returnTo: `/market-os/content-command-center/missions?mission=${mission.id}` })}><ListChecks size={14}/>Task Command</Link>}/><div className={styles.taskArchitectureList}>{tasks.length ? tasks.map((task: any, index: number) => <article className={styles.architectureNode} key={task.id}><span className={styles.architectureNodeIndex}>{String(index + 1).padStart(2, "0")}</span><div><strong>{task.title}</strong><p>{task.description || task.completion_definition || "Définition de réalisation à compléter."}</p></div><aside><StatusPill tone={missionTone(task.status || "")}>{statusLabel(task.status || "todo")}</StatusPill><small>{task.assigned_to_name || mission.assigned_to_name || "Non affectée"}</small></aside></article>) : <OperationalEmpty title="Architecture de tâches absente" detail="La mission ne peut pas être libérée avant la constitution d’unités d’exécution et de leurs critères de réalisation."/>}</div></section> : null}

          {tab === "responsibility" ? <section className={styles.responsibilityMatrix}><SectionTitle eyebrow="OWNERSHIP MATRIX" title="Responsabilité, revue et défauts d’affectation" description="Cette vue rend les responsabilités visibles sans transformer la charge en notation de performance."/><div className={styles.responsibilityGrid}><div className={styles.responsibilityCell}><small>Mission owner</small><strong>{mission.assigned_to_name || "Non affecté"}</strong></div><div className={styles.responsibilityCell}><small>Réviseur</small><strong>{mission.reviewer_name || "Non désigné"}</strong></div><div className={styles.responsibilityCell}><small>Tâches non affectées</small><strong>{tasks.filter((task: any) => !task.assigned_to_name && !mission.assigned_to_name).length}</strong></div><div className={styles.responsibilityCell}><small>Handover en attente</small><strong>{tasks.filter((task: any) => ["assigned", "waiting"].includes(task.status)).length}</strong></div></div><div className={styles.deliverableList}>{tasks.map((task: any) => <div className={styles.deliverableItem} key={task.id}><span><UserRoundCheck size={13}/></span><div><strong>{task.title}</strong><small>{task.assigned_to_name || mission.assigned_to_name || "Défaut d’ownership"} · Révision : {task.reviewer_name || mission.reviewer_name || "À désigner"}</small></div><StatusPill tone={!task.assigned_to_name && !mission.assigned_to_name ? "danger" : "success"}>{!task.assigned_to_name && !mission.assigned_to_name ? "À affecter" : "Affectée"}</StatusPill></div>)}</div></section> : null}

          {tab === "release" ? <section className={styles.releaseChamber}><SectionTitle eyebrow="RELEASE AUTHORITY" title="Libérer la mission en connaissance des conséquences" description="La décision utilise l’action Headquarters existante et reste bloquée lorsque la constitution est incomplète."/><ReadinessRunway completed={readiness.completed} total={readiness.total} missing={readiness.missing}/><div className={styles.chamberActions}><button type="button" onClick={() => setDecisionOpen(true)} disabled={Boolean(busy) || readiness.missing.length > 0}><Play size={14}/>{dominant.label}</button><button type="button" onClick={() => setTab("constitution")}><ClipboardCheck size={14}/>Corriger la constitution</button><Link href={bulk3ContextHref("/market-os/content-command-center/calendar", { dossierId: mission.dossier_id ?? undefined, missionId: mission.id, returnTo: `/market-os/content-command-center/missions?mission=${mission.id}` })}><CalendarClock size={14}/>Retourner au planning</Link></div></section> : null}

          {tab === "closure" ? <section className={styles.closureChamber}><SectionTitle eyebrow="CLOSURE AUTHORITY" title="Clôturer le résultat, pas seulement les tâches" description="La closure expose les tâches ouvertes, preuves manquantes et autorité restante."/><ul className={styles.closureMissing}>{closureMissing.map((item) => <li key={item}><AlertTriangle size={14}/>{item}</li>)}</ul>{!closureMissing.length ? <GovernanceNotice kind="success" title="Closure observable">Les conditions exposées par le snapshot sont satisfaites. La décision de clôture reste une action d’autorité.</GovernanceNotice> : null}<div className={styles.chamberActions}><button type="button" onClick={() => setDecisionOpen(true)} disabled={closureMissing.length > 0 || Boolean(busy)}><BadgeCheck size={14}/>Clôturer la mission</button><Link href={bulk3ContextHref("/market-os/content-command-center/evidence", { dossierId: mission.dossier_id ?? undefined, missionId: mission.id, returnTo: `/market-os/content-command-center/missions?mission=${mission.id}` })}><FileCheck2 size={14}/>Inspecter les preuves</Link></div></section> : null}
        </div>

        <aside className={styles.missionIntervention}>
          <SectionTitle eyebrow="INTERVENTION RAIL" title="Risques qui exigent une action" description="Chaque item expose une cause observable, une conséquence et un point d’entrée."/>
          <div className={styles.interventionList}>
            {readiness.missing.slice(0, 4).map((item) => <article className={styles.interventionItem} key={item}><header><strong>Constitution incomplète</strong><StatusPill tone="warning">Bloquant</StatusPill></header><p>{item}. Cette absence empêche une libération fiable de la mission.</p><button type="button" onClick={() => setTab("constitution")}>Corriger <ArrowRight size={13}/></button></article>)}
            {tasks.filter((task: any) => task.status === "blocked").slice(0, 3).map((task: any) => <article className={styles.interventionItem} key={task.id}><header><strong>{task.title}</strong><StatusPill tone="danger">Bloquée</StatusPill></header><p>{task.blocker_reason || task.description || "Blocage déclaré sans conséquence détaillée."}</p><Link href={bulk3ContextHref(`/market-os/content-command-center/tasks/execution?task=${task.id}`, { dossierId: mission.dossier_id ?? undefined, missionId: mission.id, taskId: task.id, returnTo: `/market-os/content-command-center/missions?mission=${mission.id}` })}>Ouvrir le poste <ArrowRight size={13}/></Link></article>)}
            {!readiness.missing.length && !tasks.some((task: any) => task.status === "blocked") ? <GovernanceNotice kind="success" title="Aucune intervention critique">Aucun défaut critique n’est exposé par la mission sélectionnée.</GovernanceNotice> : null}
          </div>
          <div className={styles.missionStack} style={{ marginTop: 16 }}>
            <div className={styles.checkpointPanel}><h3>Pression de portefeuille</h3><p>{unassignedTasks.length} tâche(s) non affectée(s) et {overdue.length} mission(s) exposée(s) par la date.</p></div>
            <div className={styles.checkpointPanel}><h3>Prochain handover</h3><p>{tasks.find((task: any) => !["done", "closed"].includes(task.status))?.title || "Aucun handover ouvert"}</p></div>
          </div>
        </aside>
      </section>

      <section className={styles.missionLowerGrid}>
        <section className={styles.architectureMap}><SectionTitle eyebrow="ACTIVE EXECUTION" title="Tâches de la mission active" description="Démarrage et soumission restent séparés. Une preuve exigée ne peut pas être remplacée par un simple statut."/><div className={styles.taskArchitectureList}>{tasks.slice(0, 8).map((task: any, index: number) => <article className={styles.architectureNode} key={task.id}><span className={styles.architectureNodeIndex}>{index + 1}</span><div><strong>{task.title}</strong><p>{task.completion_definition || task.description || "Définition à compléter"}</p></div><aside><StatusPill tone={missionTone(task.status || "")}>{statusLabel(task.status || "todo")}</StatusPill><div className={styles.chamberActions}><button type="button" onClick={() => void updateTask(task.id, "doing", Math.max(20, task.progress || 0))} disabled={busy === task.id}>Démarrer</button><Link href={bulk3ContextHref(`/market-os/content-command-center/tasks/execution?task=${task.id}`, { dossierId: mission.dossier_id ?? undefined, missionId: mission.id, taskId: task.id, returnTo: `/market-os/content-command-center/missions?mission=${mission.id}` })}>Exécuter</Link></div></aside></article>)}</div></section>
        <div className={styles.missionStack}><section className={styles.checkpointPanel}><h3>Checkpoint command</h3><p>{tasks.filter((task: any) => task.evidence_required).length} preuve(s) requise(s), {tasks.filter((task: any) => task.evidence_required && !(task as any).evidence_id).length} encore manquante(s).</p></section><section className={styles.checkpointPanel}><h3>Authority chain</h3><p>Owner : {mission.assigned_to_name || "non affecté"}. Réviseur : {mission.reviewer_name || "non désigné"}. Statut : {statusLabel(mission.status || "proposed")}.</p></section></div>
      </section>
    </>}

    <Bulk3Modal open={decisionOpen} onClose={() => setDecisionOpen(false)} title={dominant.label} subtitle="La transition est appliquée uniquement à la mission sélectionnée, puis le snapshot est rechargé." footer={<><button className={styles.secondaryButton} onClick={() => setDecisionOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={() => void transitionMission()} disabled={Boolean(busy) || readiness.missing.length > 0}><BusyLabel busy={Boolean(busy)}>Confirmer la transition</BusyLabel></button></>}>
      <ReadinessRunway completed={readiness.completed} total={readiness.total} missing={readiness.missing}/>
      <GovernanceNotice kind={readiness.missing.length ? "warning" : "info"} title="Décision de mission">État actuel : {statusLabel(mission?.status || "proposed")}. État proposé : {statusLabel(dominant.targetStatus)}. Aucune transition n’est simulée localement.</GovernanceNotice>
    </Bulk3Modal>

    <Bulk3Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Constituer une mission gouvernée" subtitle="Le formulaire prépare un mandat, un scope, une définition de réussite et une première architecture de tâches." footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={() => void createMission()} disabled={busy === "create" || !form.title.trim() || !form.objective.trim()}><BusyLabel busy={busy === "create"}>Créer la mission</BusyLabel></button></>}>
      <div className={styles.formGrid}>
        <label>Titre<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label>
        <label>Responsable proposé<input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}/></label>
        <label>Réviseur<input value={form.reviewer} onChange={(event) => setForm({ ...form, reviewer: event.target.value })}/></label>
        <label>Échéance<input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })}/></label>
        <label className={styles.wide}>Objectif<textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })}/></label>
        <label className={styles.wide}>Périmètre autorisé<textarea value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}/></label>
        <label className={styles.wide}>Exclusions<textarea value={form.exclusions} onChange={(event) => setForm({ ...form, exclusions: event.target.value })}/></label>
        <label className={styles.wide}>Définition de réussite<textarea value={form.successDefinition} onChange={(event) => setForm({ ...form, successDefinition: event.target.value })}/></label>
        {[1,2,3].map((number) => { const key = `task${number}` as "task1" | "task2" | "task3"; return <label className={styles.wide} key={key}>Tâche {number}<input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label> })}
      </div>
    </Bulk3Modal>
  </Bulk3Shell>
}
