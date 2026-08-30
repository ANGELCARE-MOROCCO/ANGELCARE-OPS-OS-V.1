'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import type { B2BDiagnostic, B2BProgram, DiagnosticStatus, ProgramStatus } from '../types'
import styles from '../b2b.module.css'
import operatorStyles from './b2b-operator.module.css'

const diagnosticTransitions: Record<DiagnosticStatus, DiagnosticStatus[]> = {
  draft: ['in_progress', 'archived'],
  in_progress: ['submitted', 'archived'],
  submitted: ['under_review', 'clarification_required'],
  under_review: ['clarification_required', 'qualified', 'not_qualified'],
  clarification_required: ['in_progress', 'submitted', 'archived'],
  qualified: ['converted', 'archived'], not_qualified: ['archived'], converted: ['archived'], archived: [],
}
const programTransitions: Record<ProgramStatus, ProgramStatus[]> = {
  configuration: ['readiness_review', 'archived'], readiness_review: ['configuration', 'approved', 'suspended'],
  approved: ['scheduled', 'active', 'paused'], scheduled: ['active', 'paused', 'suspended'],
  active: ['paused', 'completed', 'suspended'], paused: ['scheduled', 'active', 'suspended', 'archived'],
  completed: ['archived'], suspended: ['configuration', 'readiness_review', 'paused', 'archived'], archived: [],
}

async function mutate(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string } }
  if (!response.ok) throw new Error(payload.error?.message || 'Décision B2B refusée.')
}

export function B2BOperatorDesk({ diagnostics, programs, canReviewDiagnostics, canConvertDiagnostics, canManagePrograms }: {
  diagnostics: B2BDiagnostic[]
  programs: B2BProgram[]
  canReviewDiagnostics: boolean
  canConvertDiagnostics: boolean
  canManagePrograms: boolean
}) {
  const requestAction = useGovernedAction()
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function execute(input: { key: string; title: string; objectLabel: string; currentState: string; nextState: string; consequence: string; permission: string; url: string; body?: Record<string, unknown>; danger?: boolean }) {
    const reason = await requestAction({ title: input.title, objectLabel: input.objectLabel, currentState: input.currentState, nextState: input.nextState, consequence: input.consequence, permission: input.permission, danger: input.danger, reversibility: input.nextState === 'archived' ? 'Aucune restauration n’est exposée par cette autorité.' : 'Soumise aux transitions métier autorisées.' })
    if (!reason) return
    setBusy(input.key); setError(''); setNotice('')
    try { await mutate(input.url, { ...input.body, target: input.nextState, reason }); setNotice(`${input.objectLabel} · décision ${input.nextState} enregistrée et auditée.`); router.refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Décision B2B refusée.') }
    finally { setBusy(null) }
  }

  return <section className={styles.panel}>
    <header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Décisions & transitions</h2><p className={styles.panelSub}>Qualification, conversion et lancement utilisent les gardes, transitions et audits B2B existants.</p></div></header>
    <div className={styles.panelBody}>
      {notice ? <div className={operatorStyles.success}>{notice}</div> : null}{error ? <div className={operatorStyles.error}>{error}</div> : null}
      <div className={operatorStyles.actionDesk}><div><h3>Diagnostics</h3><div className={operatorStyles.actionRows}>{diagnostics.map((diagnostic) => <article className={operatorStyles.actionRow} key={diagnostic.id}><div><strong>{diagnostic.diagnostic_type}</strong><span>{diagnostic.status} · complétude {diagnostic.completion_score}%</span></div><div className={operatorStyles.rowActions}>
        {diagnosticTransitions[diagnostic.status].filter((target) => target !== 'converted').map((target) => <button type="button" key={target} disabled={!canReviewDiagnostics || Boolean(busy)} onClick={() => void execute({ key: `${diagnostic.id}:${target}`, title: `Faire évoluer le diagnostic vers ${target}`, objectLabel: diagnostic.public_reference, currentState: diagnostic.status, nextState: target, consequence: target === 'qualified' ? 'Le diagnostic devient éligible à la conversion CRM et/ou Partner OS.' : 'Le statut et la prochaine étape du dossier sont modifiés.', permission: 'marketplace.b2b.diagnostics.review', url: `/api/angelcare-marketplace/b2b/diagnostics/${diagnostic.id}/transition`, danger: ['not_qualified', 'archived'].includes(target) })}>{busy === `${diagnostic.id}:${target}` ? 'Exécution…' : target}</button>)}
        {diagnostic.status === 'qualified' ? <button type="button" disabled={!canConvertDiagnostics || Boolean(busy)} onClick={() => void execute({ key: `${diagnostic.id}:convert`, title: 'Convertir le diagnostic qualifié', objectLabel: diagnostic.public_reference, currentState: diagnostic.status, nextState: 'converted', consequence: 'Crée les autorités CRM et Partner OS reliées via la RPC métier existante.', permission: 'marketplace.b2b.conversions.manage', url: `/api/angelcare-marketplace/b2b/diagnostics/${diagnostic.id}/convert`, body: { conversionType: 'both' } })}>Convertir CRM + Partner OS</button> : null}
      </div></article>)}{!diagnostics.length ? <div className={operatorStyles.compactEmpty}>Aucun diagnostic relié.</div> : null}</div></div>
      <div><h3>Programmes & readiness</h3><div className={operatorStyles.actionRows}>{programs.map((program) => <article className={operatorStyles.actionRow} key={program.id}><div><strong>{program.name}</strong><span>{program.status} · readiness {program.readiness_score}%</span></div><div className={operatorStyles.rowActions}>{programTransitions[program.status].map((target) => <button type="button" key={target} disabled={!canManagePrograms || Boolean(busy)} onClick={() => void execute({ key: `${program.id}:${target}`, title: `Faire évoluer le programme vers ${target}`, objectLabel: program.public_reference, currentState: program.status, nextState: target, consequence: target === 'active' ? 'L’autorité serveur vérifie tous les contrôles de readiness avant activation.' : 'Le cycle opérationnel du programme est modifié.', permission: 'marketplace.b2b.programs.manage', url: `/api/angelcare-marketplace/b2b/programs/${program.id}/transition`, danger: ['suspended', 'archived'].includes(target) })}>{busy === `${program.id}:${target}` ? 'Exécution…' : target}</button>)}</div></article>)}{!programs.length ? <div className={operatorStyles.compactEmpty}>Aucun programme relié.</div> : null}</div></div></div>
      {!canReviewDiagnostics || !canManagePrograms ? <p className={operatorStyles.permissionNote}>Les commandes non autorisées restent visibles en lecture seule avec leur permission exacte.</p> : null}
    </div>
  </section>
}
