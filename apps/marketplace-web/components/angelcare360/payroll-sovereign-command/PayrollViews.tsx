import Link from 'next/link'
import type { ReactNode } from 'react'
import type { PayrollResult, PayrollSnapshot } from '@/types/angelcare360/payroll-sovereign-control'
import { PayrollCommandShell, StatusPill, EmptyState, formatMoneyMinor, formatDate, toneFor } from './PayrollCommandShell'
import { AdvanceStudio, AdvanceTransition, InputControlStudio, InputDecision, IntegrityLock, PaymentBatchStudio, PaymentItemTruth, ReconcileButton, RunGovernance } from './PayrollActions'
import { PayrollRegistryClient } from './PayrollRegistryClient'
import styles from './PayrollCommand.module.css'

const BASE = '/angelcare-360-command-center/paie'
const TERMINAL_PERIODS = new Set(['closed', 'cancelled', 'archived'])
const DECIDED_INPUTS = new Set(['approved', 'rejected', 'archived'])

function Head({ label, title, copy, action }: { label: string; title: string; copy: string; action?: ReactNode }) {
  return <div className={styles.sectionHead}><div><div className={styles.sectionLabel}>{label}</div><h2>{title}</h2><p>{copy}</p></div>{action ? <div>{action}</div> : null}</div>
}
function Metric({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <div className={styles.metric} data-tone={tone || 'neutral'}><div className={styles.metricLabel}>{label}</div><div className={styles.metricValue}>{value}</div>{hint ? <div className={styles.metricHint}>{hint}</div> : null}</div>
}
function Meta({ children }: { children: ReactNode }) { return <span className={styles.metaPill}>{children}</span> }

function TruthPanel({ s }: { s: PayrollSnapshot }) {
  return <div className={`${styles.card} ${styles.truthPanel}`}><span className={styles.sectionLabel}>CAPABILITY TRUTH</span><h3>Ce que SANILA affirme — et ce qu’il refuse d’inventer</h3><div className={styles.truth}>
    <div className={styles.truthRow}><span>Moteur de calcul automatique prouvé</span><StatusPill value="NON PROUVÉ" tone="warn" /></div>
    <div className={styles.truthRow}><span>Virement bancaire automatique</span><StatusPill value="NON" tone="neutral" /></div>
    <div className={styles.truthRow}><span>CNSS / fiscalité automatiques</span><StatusPill value="NON PROUVÉ" tone="neutral" /></div>
    <div className={styles.truthRow}><span>Moteur PDF bulletin</span><StatusPill value="NON PROUVÉ" tone="warn" /></div>
  </div><p>SANILA expose la vérité persistée, les transitions atomiques et les preuves disponibles. Il ne transforme pas une table ou un document_path en capacité réglementaire, bancaire ou documentaire fictive.</p></div>
}

function currentPeriod(s: PayrollSnapshot) {
  return s.periods.find(period => !TERMINAL_PERIODS.has(period.status)) || s.periods[0]
}
function periodFor(s: PayrollSnapshot, id: string) { return s.periods.find(period => period.id === id) }
function runForResult(s: PayrollSnapshot, result: PayrollResult) { return s.runs.find(run => run.id === result.runId) }
function resultExceptions(result: PayrollResult) {
  const raw = result.calculation.exceptions
  if (Array.isArray(raw)) return raw.map(value => typeof value === 'string' ? value : JSON.stringify(value)).slice(0, 8)
  if (result.calculation.exception) return [String(result.calculation.exception)]
  if (result.calculation.blocker) return [String(result.calculation.blocker)]
  return []
}

function Runway({ s }: { s: PayrollSnapshot }) {
  const run = s.runs[0]
  const status = run?.status || currentPeriod(s)?.status || 'draft'
  const stages = [
    ['Inputs', ['draft', 'planned', 'open', 'inputs_collecting', 'input_cutoff', 'ready']],
    ['Calcul', ['calculating', 'calculated']], ['Revue', ['review']], ['Validation', ['validated']], ['Approbation', ['approved']],
    ['Paiement', ['finalized', 'payment_processing', 'paid']], ['Réconciliation', ['reconciled', 'closed']],
  ] as const
  return <div className={styles.runway}><div className={styles.runwayTrack}>{stages.map(([label, states], index) => {
    const active = (states as readonly string[]).includes(status)
    const passedIndex = stages.findIndex(([, values]) => (values as readonly string[]).includes(status))
    const passed = passedIndex >= 0 && index < passedIndex
    return <div className={styles.stage} key={label} data-active={active} data-passed={passed}><div className={styles.stageDot}>{passed ? '✓' : index + 1}</div><strong>{label}</strong><small>{active ? status : passed ? 'franchi' : '—'}</small></div>
  })}</div></div>
}

function ReadinessRail({ s }: { s: PayrollSnapshot }) {
  const period = currentPeriod(s)
  const latest = s.runs[0]
  const populationGap = Math.max(0, s.metrics.staffPopulation - (latest?.resultCount || 0))
  const paymentReady = latest?.status === 'finalized'
  const checks = [
    ['Population', latest ? `${latest.resultCount}/${s.metrics.staffPopulation}` : `0/${s.metrics.staffPopulation}`, populationGap ? `${populationGap} hors résultats du run` : 'population couverte', populationGap ? 'warn' : 'good'],
    ['Inputs', String(s.metrics.unapprovedInputs), 'à décider', s.metrics.unapprovedInputs ? 'warn' : 'good'],
    ['Intégrité', String(s.integrity.criticalCount), 'bloqueur(s)', s.integrity.safeForOperations ? 'good' : 'bad'],
    ['Exceptions', String(s.metrics.exceptions), 'dans le dernier run', s.metrics.exceptions ? 'warn' : 'good'],
    ['Validation', latest?.status || period?.status || '—', 'état du cycle', latest?.status === 'approved' || latest?.status === 'finalized' ? 'good' : 'neutral'],
    ['Paiement', String(s.metrics.pendingPayments), paymentReady ? 'items pending' : 'run non finalisé', s.metrics.failedPayments ? 'bad' : s.metrics.pendingPayments ? 'warn' : 'neutral'],
    ['Réconciliation', String(s.metrics.unreconciledBatches), 'lot(s) non réconcilié(s)', s.metrics.unreconciledBatches ? 'warn' : 'good'],
  ] as const
  return <section className={styles.readinessRail}>{checks.map(([label, value, hint, tone]) => <Metric key={label} label={label} value={value} hint={hint} tone={tone} />)}</section>
}

function Watchtower({ s }: { s: PayrollSnapshot }) {
  const latest = s.runs[0]
  const period = currentPeriod(s)
  const items: Array<{ kind: string; title: string; detail: string; href: string; tone: 'bad' | 'warn' | 'neutral' }> = []
  if (!s.integrity.safeForOperations) items.push({ kind: 'INTÉGRITÉ', title: 'Mutations Payroll verrouillées', detail: s.integrity.message || `${s.integrity.criticalCount} incohérence(s) critique(s)`, href: `${BASE}/conformite`, tone: 'bad' })
  if (!period) items.push({ kind: 'CYCLE', title: 'Aucune période de paie disponible', detail: 'SANILA ne peut pas préparer d’input sans période.', href: `${BASE}/periodes`, tone: 'bad' })
  if (s.metrics.unapprovedInputs) items.push({ kind: 'VALIDATION', title: `${s.metrics.unapprovedInputs} élément(s) à décider`, detail: 'Le RPC bloque la validation du run tant que des inputs restent non résolus.', href: `${BASE}/validation`, tone: 'warn' })
  if (latest?.exceptionCount) items.push({ kind: 'REVUE', title: `${latest.exceptionCount} résultat(s) avec exception`, detail: `${latest.runCode} nécessite une lecture des calculs persistés avant gouvernance.`, href: `${BASE}/dossiers`, tone: 'warn' })
  if (s.metrics.failedPayments) items.push({ kind: 'PAIEMENT', title: `${s.metrics.failedPayments} échec(s) enregistré(s)`, detail: 'Ces items empêchent une réconciliation complète.', href: `${BASE}/paiements`, tone: 'bad' })
  if (s.metrics.pendingPayments) items.push({ kind: 'PAIEMENT', title: `${s.metrics.pendingPayments} paiement(s) pending`, detail: `${formatMoneyMinor(s.metrics.pendingPaymentMinor)} restent sans confirmation enregistrée.`, href: `${BASE}/paiements`, tone: 'warn' })
  if (s.metrics.unreconciledBatches) items.push({ kind: 'CLÔTURE', title: `${s.metrics.unreconciledBatches} lot(s) non réconcilié(s)`, detail: 'Attendu, payé, pending et échecs doivent converger avant réconciliation.', href: `${BASE}/reconciliation`, tone: 'warn' })
  if (s.metrics.advancesOpen) items.push({ kind: 'AVANCES', title: `${s.metrics.advancesOpen} avance(s) ouverte(s)`, detail: `${formatMoneyMinor(s.metrics.advanceRemainingMinor)} de solde restant enregistré.`, href: `${BASE}/avances`, tone: 'neutral' })
  return <section className={styles.watchtower}><Head label="EXECUTIVE WATCHTOWER" title="À traiter maintenant" copy="Priorités fondées sur les états, références, validations et paiements persistés — aucun score opaque." />{items.length ? <div className={styles.watchList}>{items.slice(0, 8).map((item, index) => <Link href={item.href} className={styles.watchItem} data-tone={item.tone} key={`${item.kind}-${index}`}><span>{item.kind}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>Ouvrir →</b></Link>)}</div> : <EmptyState title="Aucune intervention prioritaire" copy="Les contrôles factuels disponibles ne signalent actuellement aucun blocage majeur." />}</section>
}

function VariableComposition({ s, periodId }: { s: PayrollSnapshot; periodId?: string }) {
  const rows = s.inputs.filter(input => !periodId || input.periodId === periodId)
  const groups = ['bonus', 'deduction', 'adjustment', 'reimbursement', 'earning'].map(kind => ({ kind, rows: rows.filter(row => row.inputType === kind) }))
  return <div className={styles.variableGrid}>{groups.map(group => <div className={styles.variableCard} key={group.kind}><span>{group.kind}</span><strong>{group.rows.length}</strong><p>{formatMoneyMinor(group.rows.reduce((sum, row) => sum + row.amountMinor, 0))}</p><small>{group.rows.filter(row => !DECIDED_INPUTS.has(row.status)).length} à décider</small></div>)}</div>
}

export function Dashboard({ s }: { s: PayrollSnapshot }) {
  const latest = s.runs[0]
  const period = currentPeriod(s)
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Sovereign Control" subtitle="Un poste de commandement de paie centré sur la préparation, la revue, la décision, la vérité de paiement et la preuve — sans inventer de calcul fiscal ou bancaire." meta={<><Meta>{s.authority.toUpperCase()}</Meta><Meta>{s.integrity.safeForOperations ? 'Intégrité prête' : 'Intégrité bloquée'}</Meta><Meta>Actualisé {formatDate(s.generatedAt, true)}</Meta></>}>
    <div className={styles.grid}>
      <section className={styles.hero}><div className={styles.heroTop}><div><div className={styles.heroLabel}>PERIOD COMMAND · CONTRÔLE FINANCIER</div><h2>{period?.label || 'Aucune période active'}</h2><p>Question de direction : la paie de cette période est-elle réellement prête, contrôlée et exécutable ?</p></div><div className={styles.heroSeal}><span>RUN</span><strong>{latest?.runCode || '—'}</strong><small>{latest?.status || period?.status || 'aucun run'}</small></div></div><div className={styles.heroRail}><div className={styles.heroMetric}><span>Population du run</span><strong>{latest?.resultCount || 0}</strong><small>/ {s.metrics.staffPopulation} personnel actif/congé</small></div><div className={styles.heroMetric}><span>Brut enregistré</span><strong>{formatMoneyMinor(s.metrics.grossMinor)}</strong></div><div className={styles.heroMetric}><span>Net payable</span><strong>{formatMoneyMinor(s.metrics.netMinor)}</strong></div><div className={styles.heroMetric}><span>Coût employeur</span><strong>{formatMoneyMinor(s.metrics.employerCostMinor)}</strong></div></div></section>
      <IntegrityLock snapshot={s} />
      <ReadinessRail s={s} />
      <Head label="CYCLE" title="Payroll Runway" copy="La progression vient des états persistés. Une étape visuelle ne crée jamais une autorité de calcul, validation ou paiement." />
      <Runway s={s} />
      <div className={styles.commandColumns}><Watchtower s={s} /><aside className={styles.commandSide}><div className={styles.sideCard}><span className={styles.sectionLabel}>VARIABLES DU CYCLE</span><h3>Ce qui change la paie</h3><VariableComposition s={s} periodId={period?.id} /></div><TruthPanel s={s} /></aside></div>
      <Head label="DIRECTION" title="Run actif & gouvernance" copy="Une décision de validation, approbation ou finalisation reste distincte d’un paiement." />
      {latest ? <div className={styles.runCommand}><div><span>{latest.runCode}</span><h3>{latest.resultCount} résultat(s) · {formatMoneyMinor(latest.netMinor)}</h3><p>{latest.exceptionCount} exception(s) · hash <code>{latest.inputHash.slice(0, 16)}…</code></p></div><div><StatusPill value={latest.status} tone={toneFor(latest.status)} /><RunGovernance snapshot={s} runId={latest.id} status={latest.status} /></div></div> : <EmptyState title="Aucun run souverain" copy="Les dossiers historiques restent lisibles, mais SANILA ne les convertit pas silencieusement en nouveaux résultats de paie." />}
    </div>
  </PayrollCommandShell>
}

export function Periods({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Calendar Command" subtitle="Chaque période est un périmètre financier gouverné : fenêtre, cut-off, run, validation, paiement et fermeture ont des significations distinctes.">
    <div className={styles.grid4}><Metric label="Périodes" value={s.metrics.periods} /><Metric label="Ouvertes" value={s.metrics.openPeriods} tone={s.metrics.openPeriods ? 'warn' : 'neutral'} /><Metric label="Runs" value={s.metrics.runs} /><Metric label="Intégrité" value={s.integrity.safeForOperations ? 'PASS' : 'BLOCKED'} tone={s.integrity.safeForOperations ? 'good' : 'bad'} /></div>
    <Head label="CALENDRIER" title="Périodes de paie" copy="La fermeture n’est jamais un simple dropdown : le cycle porte son historique de gouvernance." />
    {s.periods.length ? <div className={styles.periodGrid}>{s.periods.map(period => { const runs = s.runs.filter(run => run.periodId === period.id); const inputs = s.inputs.filter(input => input.periodId === period.id); return <Link href={`${BASE}/periodes/${period.id}`} className={styles.periodCard} key={period.id}><div className={styles.periodCardTop}><div><span>{period.code}</span><h3>{period.label}</h3></div><StatusPill value={period.status} tone={toneFor(period.status)} /></div><div className={styles.periodDates}><span>{formatDate(period.startsOn)} → {formatDate(period.endsOn)}</span><span>Paiement {formatDate(period.paymentDate)}</span></div><div className={styles.periodStats}><b>{runs.length}<small>run(s)</small></b><b>{inputs.length}<small>input(s)</small></b><b>{inputs.filter(input => !DECIDED_INPUTS.has(input.status)).length}<small>à décider</small></b></div></Link>})}</div> : <EmptyState title="Aucune période" copy="Aucune période de paie n’est enregistrée pour cet établissement." />}
  </PayrollCommandShell>
}

export function PeriodDetail({ s, id }: { s: PayrollSnapshot; id: string }) {
  const period = periodFor(s, id)
  if (!period) return <PayrollCommandShell schoolName={s.schoolName} title="Période introuvable" subtitle="L’identifiant ne correspond pas à une période accessible."><EmptyState title="Période indisponible" copy="Aucune donnée n’a été inventée." /></PayrollCommandShell>
  const runs = s.runs.filter(run => run.periodId === id)
  const inputs = s.inputs.filter(input => input.periodId === id)
  const results = s.results.filter(result => result.periodId === id)
  const latest = runs[0]
  return <PayrollCommandShell schoolName={s.schoolName} title={`Period Control Chamber · ${period.label}`} subtitle="Une chambre unique pour lire fenêtre, inputs, exécutions, résultats et portes de gouvernance de cette période." meta={<><Meta>{period.code}</Meta><Meta>{period.status}</Meta><Meta>Paiement {formatDate(period.paymentDate)}</Meta></>}>
    <nav className={styles.inPageNav}><a href="#readiness">Readiness</a><a href="#variables">Variables</a><a href="#runs">Runs</a><a href="#population">Population</a><a href="#governance">Gouvernance</a></nav>
    <section id="readiness" className={styles.grid4}><Metric label="État" value={period.status} /><Metric label="Population résultats" value={results.length} /><Metric label="Inputs" value={inputs.length} /><Metric label="Net dernier run" value={formatMoneyMinor(latest?.netMinor || 0)} /></section>
    <section className={styles.periodBrief}><div><span className={styles.sectionLabel}>FENÊTRE</span><strong>{formatDate(period.startsOn)} → {formatDate(period.endsOn)}</strong><p>Cut-off inputs : {formatDate(period.inputCutoffAt, true)}</p></div><div><span className={styles.sectionLabel}>PAIEMENT</span><strong>{formatDate(period.paymentDate)}</strong><p>Finalisé : {formatDate(period.finalizedAt, true)}</p></div><div><span className={styles.sectionLabel}>DÉCISION</span><strong>{inputs.filter(input => !DECIDED_INPUTS.has(input.status)).length} input(s) non décidé(s)</strong><p>{latest ? `Run ${latest.runCode} · ${latest.status}` : 'Aucun run souverain'}</p></div></section>
    <section id="variables"><Head label="VARIABLES" title="Variable Element Ledger" copy="Primes, retenues, ajustements, remboursements et autres earnings restent séparés, traçables et décidables." action={<InputControlStudio snapshot={s} />} /><VariableComposition s={s} periodId={id} />{inputs.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Personnel</th><th>Type</th><th>Composant</th><th>Montant</th><th>Source</th><th>État</th><th>Décision</th></tr></thead><tbody>{inputs.map(input => <tr key={input.id}><td><div className={styles.primary}>{input.staffName}</div><div className={styles.secondary}>{input.staffCode}</div></td><td>{input.inputType}</td><td>{input.componentCode}</td><td className={styles.number}>{formatMoneyMinor(input.amountMinor)}</td><td>{input.sourceType}</td><td><StatusPill value={input.status} tone={toneFor(input.status)} /></td><td>{['submitted', 'review'].includes(input.status) ? <InputDecision snapshot={s} inputId={input.id} label={`${input.staffName} · ${input.componentCode} · ${formatMoneyMinor(input.amountMinor)}`} /> : formatDate(input.approvedAt, true)}</td></tr>)}</tbody></table></div> : <EmptyState title="Aucun élément variable" copy="Aucun input n’est enregistré pour cette période." />}</section>
    <section id="runs"><Head label="EXECUTIONS" title="Runs de la période" copy="Chaque run porte son hash, sa population, ses résultats et sa progression de gouvernance." />{runs.length ? <div className={styles.runStack}>{runs.map(run => <article className={styles.runCard} key={run.id}><div><span>{run.runCode}</span><h3>{run.runType} · {run.resultCount} résultat(s)</h3><p>Hash <code>{run.inputHash.slice(0, 18)}…</code> · {run.exceptionCount} exception(s)</p></div><div><strong>{formatMoneyMinor(run.netMinor)}</strong><StatusPill value={run.status} tone={toneFor(run.status)} /><RunGovernance snapshot={s} runId={run.id} status={run.status} /></div></article>)}</div> : <EmptyState title="Aucun run" copy="SANILA ne simule pas de calcul. Aucun run n’est persisté pour cette période." />}</section>
    <section id="population"><Head label="POPULATION" title="Employee Payroll Results" copy="Résultats persistés du cycle, séparés du personnel simplement présent dans l’établissement." />{results.length ? <PayrollRegistryClient rows={results} /> : <EmptyState title="Aucun résultat" copy="La période ne contient pas encore de résultat souverain." />}</section>
    <section id="governance"><Head label="GOUVERNANCE" title="Period Truth" copy="Finalized, payment et reconciled restent des états distincts." /><div className={styles.grid2}><IntegrityLock snapshot={s} /><TruthPanel s={s} /></div></section>
  </PayrollCommandShell>
}

export function Records({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Employee Payroll Registry" subtitle="Registre des résultats souverains : rémunération, contributions, retenues, net, statut et accès au dossier financier individuel.">
    <div className={styles.grid4}><Metric label="Résultats" value={s.results.length} /><Metric label="Personnel calculé" value={s.metrics.employees} /><Metric label="Net payable" value={formatMoneyMinor(s.metrics.netMinor)} /><Metric label="Legacy" value={s.legacyRecords.length} hint="lecture historique uniquement" /></div>
    <Head label="REGISTRE" title="Dossiers de paie" copy="Recherche opérationnelle par personne, matricule et état. Aucun UUID n’est utilisé comme identité principale." />
    {s.results.length ? <PayrollRegistryClient rows={s.results} /> : <EmptyState title="Aucun résultat souverain" copy="Les dossiers legacy éventuels restent séparés et ne sont pas automatiquement convertis." />}
  </PayrollCommandShell>
}

function Anatomy({ r }: { r: PayrollResult }) {
  return <div className={styles.anatomy}><div className={styles.anatomyRow}><span>Base</span><strong>{formatMoneyMinor(r.baseMinor)}</strong></div><div className={styles.anatomyRow}><span>+ Earnings</span><strong>{formatMoneyMinor(r.earningsMinor)}</strong></div><div className={styles.anatomyRow}><span>= Brut</span><strong>{formatMoneyMinor(r.grossMinor)}</strong></div><div className={styles.anatomyRow}><span>- Contributions salarié</span><strong>{formatMoneyMinor(r.employeeContributionsMinor)}</strong></div><div className={styles.anatomyRow}><span>- Retenues</span><strong>{formatMoneyMinor(r.deductionsMinor)}</strong></div><div className={styles.anatomyRow}><span>+ Remboursements</span><strong>{formatMoneyMinor(r.reimbursementsMinor)}</strong></div><div className={styles.anatomyTotal}><span>NET PAYABLE</span><strong>{formatMoneyMinor(r.netPayableMinor)}</strong></div><div className={styles.employerCost}><span>Coût employeur enregistré</span><strong>{formatMoneyMinor(r.employerCostMinor)}</strong></div></div>
}

export function RecordDetail({ s, id }: { s: PayrollSnapshot; id: string }) {
  const result = s.results.find(row => row.id === id)
  if (!result) return <PayrollCommandShell schoolName={s.schoolName} title="Dossier introuvable" subtitle="Aucun résultat de paie souverain ne correspond à cet identifiant."><EmptyState title="Dossier indisponible" copy="Aucune donnée n’a été inventée." /></PayrollCommandShell>
  const period = periodFor(s, result.periodId)
  const run = runForResult(s, result)
  const inputs = s.inputs.filter(input => input.periodId === result.periodId && input.staffId === result.staffId)
  const advances = s.advances.filter(advance => advance.staffId === result.staffId)
  const paymentItems = s.paymentItems.filter(item => item.resultId === result.id)
  const allStaffResults = s.results.filter(row => row.staffId === result.staffId).sort((a, b) => (periodFor(s, b.periodId)?.startsOn || '').localeCompare(periodFor(s, a.periodId)?.startsOn || ''))
  const previous = allStaffResults.find(row => row.id !== result.id)
  const exceptions = resultExceptions(result)
  return <PayrollCommandShell schoolName={s.schoolName} title={`${result.staffName} · Payroll Control Dossier`} subtitle="Anatomie financière, variables, gouvernance du run, avance, paiement et historique réunis sans fabriquer de calcul ou de confirmation bancaire." meta={<><Meta>{result.staffCode}</Meta><Meta>{period?.label || 'Période'}</Meta><Meta>{result.status}</Meta></>}>
    <nav className={styles.inPageNav}><a href="#overview">Vue de paie</a><a href="#anatomy">Anatomie</a><a href="#variables">Variables</a><a href="#change">Variation</a><a href="#payment">Paiement</a><a href="#evidence">Preuve</a></nav>
    <section id="overview" className={styles.dossierHero}><div><span>{result.staffCode}</span><h2>{result.staffName}</h2><p>{period?.label || 'Période'} · {run?.runCode || 'Run non résolu'} · hash calcul <code>{result.calculationHash.slice(0, 18)}…</code></p></div><div><strong>{formatMoneyMinor(result.netPayableMinor)}</strong><StatusPill value={result.status} tone={toneFor(result.status)} /></div></section>
    <section className={styles.dossierFacts}><div><span>Base</span><strong>{formatMoneyMinor(result.baseMinor)}</strong></div><div><span>Brut</span><strong>{formatMoneyMinor(result.grossMinor)}</strong></div><div><span>Retenues + contrib.</span><strong>{formatMoneyMinor(result.deductionsMinor + result.employeeContributionsMinor)}</strong></div><div><span>Remboursements</span><strong>{formatMoneyMinor(result.reimbursementsMinor)}</strong></div><div><span>Coût employeur</span><strong>{formatMoneyMinor(result.employerCostMinor)}</strong></div></section>
    <div className={styles.dossierColumns}><main className={styles.dossierMain}>
      <section id="anatomy"><Head label="CALCULATION ANATOMY" title="De la base au net" copy="Les montants proviennent du résultat persisté. Le navigateur n’est pas le moteur de paie." /><div className={styles.grid2}><div className={styles.card}><Anatomy r={result} /></div><div className={styles.card}><h3>Exceptions persistées</h3>{exceptions.length ? <ul className={styles.exceptionList}>{exceptions.map((exception, index) => <li key={index}>{exception}</li>)}</ul> : <p>Aucune exception structurée n’est exposée dans calculation_json pour ce résultat.</p>}<div className={styles.truthNotice}><strong>Calcul réglementaire</strong><p>Le build ne déduit pas de ce résultat qu’un moteur CNSS/IR automatique existe.</p></div></div></div></section>
      <section id="variables"><Head label="VARIABLES" title="Éléments rattachés à la période" copy="La liste expose les inputs de ce collaborateur, leur source et leur décision." action={<InputControlStudio snapshot={s} />} />{inputs.length ? <div className={styles.inputCards}>{inputs.map(input => <article key={input.id}><div><span>{input.inputType}</span><strong>{input.componentCode}</strong><small>{input.sourceType} · {formatDate(input.createdAt, true)}</small></div><div><b>{formatMoneyMinor(input.amountMinor)}</b><StatusPill value={input.status} tone={toneFor(input.status)} />{['submitted', 'review'].includes(input.status) ? <InputDecision snapshot={s} inputId={input.id} label={`${input.componentCode} · ${formatMoneyMinor(input.amountMinor)}`} /> : null}</div></article>)}</div> : <EmptyState title="Aucun input" copy="Aucun élément variable n’est associé à cette personne sur la période." />}</section>
      <section id="change"><Head label="PERIOD-OVER-PERIOD" title="Variation factuelle" copy="Une différence n’est pas automatiquement une anomalie. SANILA montre seulement ce qui est mesurable." />{previous ? <div className={styles.changeBridge}><div><span>Période précédente</span><strong>{formatMoneyMinor(previous.netPayableMinor)}</strong><small>{periodFor(s, previous.periodId)?.label || 'Période précédente'}</small></div><div className={styles.changeArrow}>→</div><div><span>Période actuelle</span><strong>{formatMoneyMinor(result.netPayableMinor)}</strong><small>{period?.label || 'Actuelle'}</small></div><div className={styles.changeDelta} data-tone={result.netPayableMinor - previous.netPayableMinor < 0 ? 'down' : 'up'}><span>Variation</span><strong>{result.netPayableMinor - previous.netPayableMinor >= 0 ? '+' : ''}{formatMoneyMinor(result.netPayableMinor - previous.netPayableMinor)}</strong><small>Différence factuelle, pas score de risque</small></div></div> : <EmptyState title="Pas de période comparable" copy="Aucun autre résultat souverain n’est disponible pour ce collaborateur." />}</section>
      <section id="payment"><Head label="PAYMENT TRUTH" title="Exécution de paiement enregistrée" copy="Finalized, payment batch, paid et reconciled sont des vérités différentes." />{paymentItems.length ? <div className={styles.paymentStack}>{paymentItems.map(item => <article key={item.id}><div><strong>{formatMoneyMinor(item.amountMinor)}</strong><span>{item.providerReference || 'Aucune référence'}</span>{item.failureReason ? <small>{item.failureReason}</small> : null}</div><div><StatusPill value={item.status} tone={toneFor(item.status)} />{item.status === 'pending' ? <PaymentItemTruth snapshot={s} id={item.id} employee={result.staffName} amountMinor={item.amountMinor} /> : <small>{formatDate(item.paidAt, true)}</small>}</div></article>)}</div> : <EmptyState title="Aucun item de paiement" copy="Ce résultat n’est associé à aucun lot de paiement souverain." />}</section>
      <section id="evidence"><Head label="FORENSICS" title="Preuve & gouvernance" copy="Run, hash et états temporels rendent le résultat inspectable sans prétendre générer une preuve bancaire externe." /><div className={styles.evidenceGrid}><div><span>Run</span><strong>{run?.runCode || '—'}</strong></div><div><span>Hash input</span><code>{run?.inputHash || '—'}</code></div><div><span>Hash calcul</span><code>{result.calculationHash}</code></div><div><span>Finalisé</span><strong>{formatDate(result.finalizedAt, true)}</strong></div></div></section>
    </main><aside className={styles.dossierRail}><div className={styles.railCard}><span className={styles.sectionLabel}>RUN GOVERNANCE</span><h3>{run?.status || 'Aucun run'}</h3>{run ? <RunGovernance snapshot={s} runId={run.id} status={run.status} /> : null}</div><div className={styles.railCard}><span className={styles.sectionLabel}>AVANCES</span><h3>{advances.length} dossier(s)</h3>{advances.slice(0, 4).map(advance => <div className={styles.miniRow} key={advance.id}><span>{advance.advanceCode}</span><strong>{formatMoneyMinor(advance.remainingMinor)}</strong></div>)}<Link className={styles.link} href={`${BASE}/avances`}>Ouvrir le commandement →</Link></div><TruthPanel s={s} /></aside></div>
  </PayrollCommandShell>
}

export function Inputs({ s, kind, title, copy }: { s: PayrollSnapshot; kind?: string; title: string; copy: string }) {
  const rows = kind ? s.inputs.filter(input => input.inputType === kind) : s.inputs
  const pending = rows.filter(input => !DECIDED_INPUTS.has(input.status))
  return <PayrollCommandShell schoolName={s.schoolName} title={title} subtitle={copy}>
    <div className={styles.grid4}><Metric label="Éléments" value={rows.length} /><Metric label="À décider" value={pending.length} tone={pending.length ? 'warn' : 'good'} /><Metric label="Montant enregistré" value={formatMoneyMinor(rows.reduce((sum, row) => sum + row.amountMinor, 0))} /><Metric label="Intégrité" value={s.integrity.safeForOperations ? 'PASS' : 'BLOCKED'} tone={s.integrity.safeForOperations ? 'good' : 'bad'} /></div>
    <Head label="INPUT CONTROL" title="Registre des éléments" copy="Chaque élément porte collaborateur, période, nature, composant, montant, source et état de décision." action={<InputControlStudio snapshot={s} presetType={kind} />} />
    {rows.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Personnel</th><th>Période</th><th>Nature</th><th>Composant</th><th>Montant</th><th>Source</th><th>État</th><th>Décision</th></tr></thead><tbody>{rows.map(input => <tr key={input.id}><td><div className={styles.primary}>{input.staffName}</div><div className={styles.secondary}>{input.staffCode}</div></td><td>{periodFor(s, input.periodId)?.label || '—'}</td><td>{input.inputType}</td><td>{input.componentCode}</td><td className={styles.number}>{formatMoneyMinor(input.amountMinor)}</td><td>{input.sourceType}</td><td><StatusPill value={input.status} tone={toneFor(input.status)} /></td><td>{['submitted', 'review'].includes(input.status) ? <InputDecision snapshot={s} inputId={input.id} label={`${input.staffName} · ${input.componentCode} · ${formatMoneyMinor(input.amountMinor)}`} /> : formatDate(input.approvedAt, true)}</td></tr>)}</tbody></table></div> : <EmptyState title="Aucun élément" copy="Aucun élément ne correspond à cette vue." />}
  </PayrollCommandShell>
}

export function Advances({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Advance Recovery Command" subtitle="Principal, décaissement enregistré, récupération et solde restant restent des vérités distinctes — sans amortissement ou transfert bancaire inventé.">
    <div className={styles.grid4}><Metric label="Avances" value={s.advances.length} /><Metric label="Ouvertes" value={s.metrics.advancesOpen} tone={s.metrics.advancesOpen ? 'warn' : 'good'} /><Metric label="Solde restant" value={formatMoneyMinor(s.metrics.advanceRemainingMinor)} /><Metric label="Intégrité" value={s.integrity.safeForOperations ? 'PASS' : 'BLOCKED'} tone={s.integrity.safeForOperations ? 'good' : 'bad'} /></div>
    <Head label="AVANCES" title="Dossiers d’avance" copy="L’approbation puis le décaissement sont des transitions explicites. Une récupération réelle nécessite l’autorité qui modifie le solde." action={<AdvanceStudio snapshot={s} />} />
    {s.advances.length ? <div className={styles.advanceGrid}>{s.advances.map(advance => { const ratio = advance.principalMinor > 0 ? Math.min(100, Math.round((advance.recoveredMinor / advance.principalMinor) * 100)) : 0; return <article className={styles.advanceCard} key={advance.id}><header><div><span>{advance.advanceCode}</span><h3>{advance.staffName}</h3><small>{advance.staffCode}</small></div><StatusPill value={advance.status} tone={toneFor(advance.status)} /></header><div className={styles.advanceMoney}><div><span>Principal</span><strong>{formatMoneyMinor(advance.principalMinor)}</strong></div><div><span>Récupéré</span><strong>{formatMoneyMinor(advance.recoveredMinor)}</strong></div><div><span>Restant</span><strong>{formatMoneyMinor(advance.remainingMinor)}</strong></div></div><div className={styles.progress}><i style={{ width: `${ratio}%` }} /></div><p>{advance.reason || 'Aucun motif enregistré.'}</p><footer><span>Échéance cible {formatMoneyMinor(advance.installmentMinor)} · {advance.installmentCount} fois</span><AdvanceTransition snapshot={s} id={advance.id} status={advance.status} /></footer></article> })}</div> : <EmptyState title="Aucune avance" copy="Aucun dossier d’avance souverain n’est enregistré." />}
  </PayrollCommandShell>
}

export function Validation({ s }: { s: PayrollSnapshot }) {
  const pendingInputs = s.inputs.filter(input => ['submitted', 'review'].includes(input.status))
  const actionableRuns = s.runs.filter(run => ['calculated', 'review', 'validated', 'approved'].includes(run.status))
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Review & Validation Desk" subtitle="Une validation n’est pas un bouton décoratif : les inputs non décidés, les résultats absents et l’intégrité peuvent bloquer la progression.">
    <ReadinessRail s={s} />
    <div className={styles.reviewColumns}><section><Head label="REVIEW QUEUE" title="Éléments en attente de décision" copy="Le RPC de validation refuse tout run dont la période contient encore des inputs non résolus." />{pendingInputs.length ? <div className={styles.reviewList}>{pendingInputs.map(input => <article key={input.id}><div><span>{input.inputType}</span><strong>{input.staffName}</strong><p>{input.componentCode} · {formatMoneyMinor(input.amountMinor)} · {periodFor(s, input.periodId)?.label || 'Période'}</p></div><InputDecision snapshot={s} inputId={input.id} label={`${input.staffName} · ${input.componentCode} · ${formatMoneyMinor(input.amountMinor)}`} /></article>)}</div> : <EmptyState title="Aucun input en attente" copy="Tous les inputs visibles sont décidés ou archivés." />}</section><aside><Head label="RUN GOVERNANCE" title="Portes de décision" copy="Validated → approved → finalized : chaque transition est atomique et séquentielle." />{actionableRuns.length ? <div className={styles.runStack}>{actionableRuns.map(run => <article className={styles.runCard} key={run.id}><div><span>{run.runCode}</span><h3>{periodFor(s, run.periodId)?.label || run.periodCode}</h3><p>{run.resultCount} résultat(s) · {run.exceptionCount} exception(s) · {formatMoneyMinor(run.netMinor)}</p></div><div><StatusPill value={run.status} tone={toneFor(run.status)} /><RunGovernance snapshot={s} runId={run.id} status={run.status} /></div></article>)}</div> : <EmptyState title="Aucun run décisionnable" copy="Aucun run n’est actuellement dans un état calculé/review/validated/approved." />}</aside></div>
  </PayrollCommandShell>
}

export function Payments({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Disbursement Control" subtitle="Préparer un lot, enregistrer une confirmation et réconcilier sont trois opérations différentes. Paid n’est jamais déduit d’un simple lot créé.">
    <div className={styles.grid4}><Metric label="Lots ouverts" value={s.metrics.batchesOpen} /><Metric label="Pending" value={s.metrics.pendingPayments} tone={s.metrics.pendingPayments ? 'warn' : 'good'} /><Metric label="Montant pending" value={formatMoneyMinor(s.metrics.pendingPaymentMinor)} /><Metric label="Échecs" value={s.metrics.failedPayments} tone={s.metrics.failedPayments ? 'bad' : 'good'} /></div>
    <div className={styles.paymentTruthBanner}><span>PAYMENT TRUTH</span><strong>Préparé ≠ exécuté ≠ payé ≠ réconcilié</strong><p>SANILA ne contacte aucune banque dans ce build. « paid » est une confirmation opérateur référencée et enregistrée par l’autorité atomique.</p></div>
    <Head label="BATCH COMMAND" title="Lots de paiement" copy="Un run doit être finalized et ne peut avoir qu’un lot actif non réconcilié." action={<PaymentBatchStudio snapshot={s} />} />
    {s.batches.length ? <div className={styles.batchGrid}>{s.batches.map(batch => <article className={styles.batchCard} key={batch.id}><header><div><span>{batch.batchCode}</span><h3>{formatMoneyMinor(batch.totalMinor)}</h3><small>{batch.paymentMethod} · {formatDate(batch.paymentDate)}</small></div><StatusPill value={batch.status} tone={toneFor(batch.status)} /></header><div className={styles.batchProgress}><div><span>Payé enregistré</span><strong>{formatMoneyMinor(batch.paidMinor)}</strong></div><div className={styles.batchBar}><i style={{ width: `${batch.totalMinor > 0 ? Math.min(100, Math.round((batch.paidMinor / batch.totalMinor) * 100)) : 0}%` }} /></div><div className={styles.batchCounts}><span>{batch.paidCount} paid</span><span>{batch.pendingCount} pending</span><span>{batch.failedCount} failed</span></div></div>{batch.status !== 'reconciled' ? <ReconcileButton snapshot={s} batchId={batch.id} /> : <StatusPill value="RECONCILED" tone="good" />}</article>)}</div> : <EmptyState title="Aucun lot" copy="Aucun lot de paiement souverain n’est préparé." />}
    <Head label="ITEM TRUTH" title="Paiements individuels" copy="Une confirmation paid requiert une référence explicite; un clic isolé ne suffit plus." />
    {s.paymentItems.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Personnel</th><th>Montant</th><th>État</th><th>Référence</th><th>Échec</th><th>Action</th></tr></thead><tbody>{s.paymentItems.map(item => <tr key={item.id}><td>{item.staffName}</td><td className={styles.numberStrong}>{formatMoneyMinor(item.amountMinor)}</td><td><StatusPill value={item.status} tone={toneFor(item.status)} /></td><td>{item.providerReference || '—'}</td><td>{item.failureReason || '—'}</td><td>{item.status === 'pending' ? <PaymentItemTruth snapshot={s} id={item.id} employee={item.staffName} amountMinor={item.amountMinor} /> : formatDate(item.paidAt, true)}</td></tr>)}</tbody></table></div> : <EmptyState title="Aucun item" copy="Aucun paiement individuel n’est enregistré." />}
  </PayrollCommandShell>
}

export function Reconciliation({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Payment Reconciliation Command" subtitle="La paie n’est pas close parce qu’un lot existe : attendu, payé, échecs et pending doivent se réconcilier exactement.">
    <Head label="RECONCILIATION" title="Lots à rapprocher" copy="Le RPC refuse la réconciliation si pending ≠ 0, failed ≠ 0 ou payé ≠ attendu." />
    {s.batches.length ? <div className={styles.reconcileGrid}>{s.batches.map(batch => <article className={styles.reconcileCard} key={batch.id}><div className={styles.reconcileAmounts}><div><span>Attendu</span><strong>{formatMoneyMinor(batch.totalMinor)}</strong></div><div><span>Payé</span><strong>{formatMoneyMinor(batch.paidMinor)}</strong></div><div><span>Écart</span><strong>{formatMoneyMinor(batch.totalMinor - batch.paidMinor)}</strong></div></div><div className={styles.batchCounts}><span>{batch.pendingCount} pending</span><span>{batch.failedCount} failed</span><StatusPill value={batch.status} tone={toneFor(batch.status)} /></div>{batch.status !== 'reconciled' ? <ReconcileButton snapshot={s} batchId={batch.id} /> : null}</article>)}</div> : <EmptyState title="Aucun lot" copy="Aucun lot n’est disponible pour réconciliation." />}
    <Head label="SESSIONS" title="Journal de réconciliation" copy="Chaque session conserve attendu, payé, échecs, pending et résultat." />
    {s.reconciliations.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Lot</th><th>Attendu</th><th>Payé</th><th>Failed</th><th>Pending</th><th>État</th><th>Créé</th><th>Résolu</th></tr></thead><tbody>{s.reconciliations.map(row => <tr key={row.id}><td>{row.batchCode}</td><td>{formatMoneyMinor(row.expectedMinor)}</td><td>{formatMoneyMinor(row.paidMinor)}</td><td>{row.failedCount}</td><td>{row.pendingCount}</td><td><StatusPill value={row.status} tone={toneFor(row.status)} /></td><td>{formatDate(row.createdAt, true)}</td><td>{formatDate(row.resolvedAt, true)}</td></tr>)}</tbody></table></div> : <EmptyState title="Aucune session" copy="Aucune réconciliation n’a encore été enregistrée." />}
  </PayrollCommandShell>
}

export function Executions({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Run Chamber" subtitle="Exécutions, snapshots, hashes et étapes de gouvernance rendent le cycle inspectable; leur présence ne prouve pas à elle seule un moteur de calcul automatique.">
    <Head label="EXECUTION JOURNAL" title="Runs souverains" copy="Population, net, exceptions, dates et hash d’input sont lus depuis l’autorité persistée." />
    {s.runs.length ? <div className={styles.executionGrid}>{s.runs.map(run => <article key={run.id}><header><div><span>{run.runCode}</span><h3>{periodFor(s, run.periodId)?.label || run.periodCode}</h3></div><StatusPill value={run.status} tone={toneFor(run.status)} /></header><div className={styles.executionFacts}><div><span>Résultats</span><strong>{run.resultCount}</strong></div><div><span>Net</span><strong>{formatMoneyMinor(run.netMinor)}</strong></div><div><span>Exceptions</span><strong>{run.exceptionCount}</strong></div></div><code>{run.inputHash}</code><footer><span>Validé {formatDate(run.validatedAt, true)}</span><span>Approuvé {formatDate(run.approvedAt, true)}</span><span>Finalisé {formatDate(run.finalizedAt, true)}</span></footer></article>)}</div> : <EmptyState title="Aucune exécution" copy="Aucun run n’est persisté." />}
  </PayrollCommandShell>
}

export function Governance({ s }: { s: PayrollSnapshot }) {
  const kinds = ['calendar', 'policy', 'component'] as const
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Governance Vault" subtitle="Calendriers, politiques, composants, objets off-cycle et exports restent visibles comme gouvernance — sans être confondus avec une exécution réglementaire prouvée.">
    <div className={styles.governanceGrid}>{kinds.map(kind => <section className={styles.governanceCard} key={kind}><span className={styles.sectionLabel}>{kind}</span><h3>{kind === 'calendar' ? 'Calendriers' : kind === 'policy' ? 'Politiques' : 'Composants'}</h3>{s.versions.filter(version => version.kind === kind).length ? s.versions.filter(version => version.kind === kind).slice(0, 10).map(version => <div className={styles.governanceRow} key={version.id}><div><strong>{version.name}</strong><small>{version.code} · v{version.version} · effet {formatDate(version.effectiveFrom)}</small></div><StatusPill value={version.status} tone={toneFor(version.status)} /></div>) : <p>Aucune version enregistrée.</p>}</section>)}</div>
    <Head label="READINESS OBJECTS" title="Off-cycle · settlement · controlled exports" copy="Présence d’un objet ou d’une table ≠ moteur exécutable. SANILA les traite comme objets de gouvernance tant que le runtime n’est pas prouvé." />
    {s.versions.filter(version => ['offcycle', 'settlement', 'export'].includes(version.kind)).length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Nature</th><th>Code</th><th>Nom</th><th>Version</th><th>État</th><th>Effet</th></tr></thead><tbody>{s.versions.filter(version => ['offcycle', 'settlement', 'export'].includes(version.kind)).map(version => <tr key={version.id}><td>{version.kind}</td><td>{version.code}</td><td>{version.name}</td><td>v{version.version}</td><td><StatusPill value={version.status} tone={toneFor(version.status)} /></td><td>{formatDate(version.effectiveFrom)}</td></tr>)}</tbody></table></div> : <EmptyState title="Aucun objet readiness" copy="Aucun off-cycle, settlement ou export contrôlé n’est enregistré." />}
  </PayrollCommandShell>
}

export function History({ s }: { s: PayrollSnapshot }) {
  const byStaff = new Map<string, { name: string; code: string; rows: PayrollResult[] }>()
  for (const result of s.results) { const current = byStaff.get(result.staffId) || { name: result.staffName, code: result.staffCode, rows: [] }; current.rows.push(result); byStaff.set(result.staffId, current) }
  return <PayrollCommandShell schoolName={s.schoolName} title="Employee Compensation Chronicle" subtitle="Historique de rémunération factuel, période par période, sans score comportemental ni interprétation RH inventée.">
    <Head label="CHRONICLE" title="Historique personnel" copy="Chaque collaborateur conserve ses résultats souverains, net, statut et variation observable." />
    {byStaff.size ? <div className={styles.historyGrid}>{Array.from(byStaff.entries()).map(([id, person]) => { const rows = person.rows.sort((a, b) => (periodFor(s, b.periodId)?.startsOn || '').localeCompare(periodFor(s, a.periodId)?.startsOn || '')); return <article className={styles.historyCard} key={id}><header><div><span>{person.code}</span><h3>{person.name}</h3></div><b>{rows.length} période(s)</b></header><div className={styles.historyTimeline}>{rows.slice(0, 12).map((row, index) => <Link href={`${BASE}/dossiers/${row.id}`} key={row.id}><i /><div><span>{periodFor(s, row.periodId)?.label || `Période ${index + 1}`}</span><strong>{formatMoneyMinor(row.netPayableMinor)}</strong><small>{row.status}</small></div></Link>)}</div></article> })}</div> : <EmptyState title="Aucun historique souverain" copy="Les dossiers legacy restent séparés plutôt que fusionnés artificiellement." />}
  </PayrollCommandShell>
}

export function Compliance({ s }: { s: PayrollSnapshot }) {
  const checks = [
    ['Intégrité des références', s.integrity.safeForOperations, `${s.integrity.criticalCount} bloqueur(s)`],
    ['Inputs décidés', s.metrics.unapprovedInputs === 0, `${s.metrics.unapprovedInputs} à décider`],
    ['Payment failures', s.metrics.failedPayments === 0, `${s.metrics.failedPayments} échec(s)`],
    ['Réconciliation', s.metrics.unreconciledBatches === 0, `${s.metrics.unreconciledBatches} lot(s) ouvert(s)`],
  ] as const
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Compliance Readiness" subtitle="Contrôle de complétude et de gouvernance interne — jamais certification automatique CNSS, fiscale ou juridique.">
    <div className={styles.complianceHero}><div><span className={styles.sectionLabel}>CONTROL READINESS</span><h2>{checks.every(([, ok]) => ok) ? 'Les contrôles internes visibles sont prêts' : 'Des contrôles internes restent ouverts'}</h2><p>Cette conclusion porte uniquement sur les données et garde-fous SANILA présents. Elle ne constitue aucune certification réglementaire externe.</p></div><StatusPill value={checks.every(([, ok]) => ok) ? 'INTERNAL READY' : 'REVIEW REQUIRED'} tone={checks.every(([, ok]) => ok) ? 'good' : 'warn'} /></div>
    <div className={styles.complianceGrid}>{checks.map(([label, ok, detail]) => <div key={label} data-ok={ok}><span>{ok ? '✓' : '○'}</span><div><strong>{label}</strong><small>{detail}</small></div></div>)}</div>
    <div className={styles.grid2}><div className={styles.card}><h3>Versions de gouvernance</h3><div className={styles.truth}><div className={styles.truthRow}><span>Policy versions</span><strong>{s.versions.filter(version => version.kind === 'policy').length}</strong></div><div className={styles.truthRow}><span>Calendar versions</span><strong>{s.versions.filter(version => version.kind === 'calendar').length}</strong></div><div className={styles.truthRow}><span>Component versions</span><strong>{s.versions.filter(version => version.kind === 'component').length}</strong></div></div></div><TruthPanel s={s} /></div>
  </PayrollCommandShell>
}

export function Payslips({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Payslip Truth" subtitle="Les versions persistées sont visibles; document_path n’est jamais transformé en faux fichier téléchargeable si l’autorité documentaire n’est pas prouvée.">
    <div className={styles.paymentTruthBanner}><span>DOCUMENT TRUTH</span><strong>Moteur PDF non prouvé</strong><p>Un document_path persistant ne prouve ni existence physique, ni URL valide, ni distribution au salarié. Aucun faux bouton de téléchargement n’est exposé.</p></div>
    {s.payslips.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Personnel</th><th>Version</th><th>Code</th><th>Signature source</th><th>État</th><th>Généré</th><th>Publié</th></tr></thead><tbody>{s.payslips.map(payslip => <tr key={payslip.id}><td>{payslip.staffName}</td><td>v{payslip.version}</td><td>{payslip.versionCode}</td><td><code>{payslip.sourceSignature.slice(0, 18)}…</code></td><td><StatusPill value={payslip.status} tone={toneFor(payslip.status)} /></td><td>{formatDate(payslip.generatedAt, true)}</td><td>{formatDate(payslip.publishedAt, true)}</td></tr>)}</tbody></table></div> : <EmptyState title="Aucun bulletin versionné" copy="Aucun bulletin souverain n’est enregistré." />}
  </PayrollCommandShell>
}

export function Audit({ s }: { s: PayrollSnapshot }) {
  return <PayrollCommandShell schoolName={s.schoolName} title="Payroll Forensics" subtitle="Chronologie institutionnelle des décisions et mutations de paie : action, entité, auteur, sévérité et instant.">
    <Head label="FORENSICS" title="Journal d’audit" copy="Une trace exploitable par la direction, pas une console développeur." />
    {s.audits.length ? <div className={styles.auditTimeline}>{s.audits.map(audit => <article key={audit.id}><i /><time>{formatDate(audit.createdAt, true)}</time><div><span>{audit.entityType || 'payroll'}</span><strong>{audit.action}</strong><p>{audit.actorRole || 'Rôle non libellé'} · {audit.entityId ? audit.entityId.slice(0, 12) : 'aucun identifiant'}</p></div><StatusPill value={audit.severity} tone={toneFor(audit.severity)} /></article>)}</div> : <EmptyState title="Aucun événement" copy="Aucun événement payroll/paie n’est disponible dans le journal d’audit." />}
  </PayrollCommandShell>
}
