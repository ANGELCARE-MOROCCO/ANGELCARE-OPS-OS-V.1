'use client'

import type { ReactNode } from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PayrollSnapshot } from '@/types/angelcare360/payroll-sovereign-control'
import { formatMoneyMinor } from './PayrollCommandShell'
import styles from './PayrollCommand.module.css'

type Feedback = { state: 'ok' | 'error'; text: string } | null

async function mutate(payload: Record<string, unknown>) {
  const response = await fetch('/api/angelcare360/payroll-sovereign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) throw new Error(data?.error || 'L’action de paie n’a pas été enregistrée.')
  return data
}

function useAction() {
  const router = useRouter()
  const [busy, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback>(null)
  function run(payload: Record<string, unknown>, onDone?: () => void) {
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await mutate(payload)
        setFeedback({ state: 'ok', text: result.message || 'Action enregistrée.' })
        onDone?.()
        router.refresh()
      } catch (error) {
        setFeedback({ state: 'error', text: error instanceof Error ? error.message : 'Action impossible.' })
      }
    })
  }
  return { busy, feedback, run, setFeedback }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

function Drawer({ title, eyebrow, copy, children, onClose }: { title: string; eyebrow: string; copy: string; children: ReactNode; onClose: () => void }) {
  return <div className={styles.drawerBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={title}>
      <header className={styles.drawerHeader}><div><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div><button type="button" onClick={onClose} aria-label="Fermer">×</button></header>
      <div className={styles.drawerBody}>{children}</div>
    </aside>
  </div>
}

function ConfirmDialog({ title, copy, consequence, confirmLabel, danger = false, busy, onConfirm, onClose }: { title: string; copy: string; consequence: string; confirmLabel: string; danger?: boolean; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  return <div className={styles.modalBackdrop}><div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}><span className={styles.modalEyebrow}>ACTION SENSIBLE</span><h2>{title}</h2><p>{copy}</p><div className={styles.impactPreview}><strong>Conséquence</strong><p>{consequence}</p></div><div className={styles.modalActions}><button type="button" className={styles.button} onClick={onClose}>Annuler</button><button type="button" className={`${styles.button} ${danger ? styles.buttonDanger : styles.buttonPrimary}`} disabled={busy} onClick={onConfirm}>{busy ? 'Enregistrement…' : confirmLabel}</button></div></div></div>
}

export function IntegrityLock({ snapshot }: { snapshot: PayrollSnapshot }) {
  const integrity = snapshot.integrity
  return <div className={`${styles.integrityBar} ${integrity.safeForOperations ? styles.integrityGood : styles.integrityBad}`}>
    <div><span>INTÉGRITÉ PAYROLL</span><strong>{integrity.safeForOperations ? 'Autorité prête' : 'Mutations verrouillées'}</strong><p>{integrity.message || 'État du garde-fou atomique.'}</p></div>
    <div className={styles.integrityFacts}><span>{integrity.criticalCount} critique(s)</span><span>{integrity.resultReferenceMismatch + integrity.inputReferenceMismatch + integrity.paymentReferenceMismatch} référence(s)</span><span>{integrity.finalizationMismatch} finalisation(s)</span></div>
  </div>
}

export function InputControlStudio({ snapshot, presetType }: { snapshot: PayrollSnapshot; presetType?: string }) {
  const [open, setOpen] = useState(false)
  const action = useAction()
  const [periodId, setPeriodId] = useState(snapshot.periods.find(period => !['finalized', 'payment_processing', 'paid', 'reconciled', 'closed', 'cancelled', 'archived'].includes(period.status))?.id || snapshot.periods[0]?.id || '')
  const activeStaff = snapshot.staffDirectory.filter(staff => ['active', 'on_leave'].includes(staff.status))
  const [staffId, setStaffId] = useState(activeStaff[0]?.id || '')
  const [inputType, setInputType] = useState(presetType || 'earning')
  const [componentCode, setComponentCode] = useState(presetType ? presetType.toUpperCase() : 'VARIABLE')
  const [amount, setAmount] = useState('0')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const period = snapshot.periods.find(item => item.id === periodId)
  const amountMinor = Math.round(Number(amount || 0) * 100)

  return <>
    <button className={`${styles.button} ${styles.buttonPrimary}`} disabled={!snapshot.integrity.safeForOperations || !activeStaff.length || !snapshot.periods.length} onClick={() => setOpen(true)}>Nouvel élément</button>
    {open ? <Drawer title="Payroll Input Studio" eyebrow="VARIABLE CONTROL" copy="L’élément est soumis au moteur atomique, puis reste en attente de décision. Aucune paie n’est recalculée par le navigateur." onClose={() => setOpen(false)}>
      <div className={styles.form}>
        <div className={styles.formGrid}><Field label="Période"><select className={styles.select} value={periodId} onChange={event => setPeriodId(event.target.value)}>{snapshot.periods.map(item => <option key={item.id} value={item.id}>{item.label} · {item.status}</option>)}</select></Field><Field label="Collaborateur"><select className={styles.select} value={staffId} onChange={event => setStaffId(event.target.value)}>{activeStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name} · {staff.staffCode}</option>)}</select></Field></div>
        <div className={styles.formGrid}><Field label="Nature"><select className={styles.select} value={inputType} onChange={event => setInputType(event.target.value)} disabled={Boolean(presetType)}><option value="earning">Earning</option><option value="bonus">Prime</option><option value="deduction">Retenue</option><option value="adjustment">Ajustement</option><option value="reimbursement">Remboursement</option></select></Field><Field label="Code composant"><input className={styles.input} value={componentCode} onChange={event => setComponentCode(event.target.value.toUpperCase())} placeholder="BONUS_EXCEPTIONNEL" /></Field></div>
        <div className={styles.formGrid}><Field label="Montant (Dh)"><input className={styles.input} type="number" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} /></Field><Field label="Quantité"><input className={styles.input} type="number" step="0.01" value={quantity} onChange={event => setQuantity(event.target.value)} /></Field></div>
        <Field label="Motif / preuve opérationnelle" hint="Ce texte devient evidence_json.reason. Il ne constitue pas une preuve réglementaire externe."><textarea className={styles.textarea} value={reason} onChange={event => setReason(event.target.value)} placeholder="Pourquoi cet élément doit-il entrer dans la paie ?" /></Field>
        <div className={styles.consequence}><span>APERÇU AVANT SOUMISSION</span><div><strong>{period?.label || 'Période'}</strong><b>{formatMoneyMinor(amountMinor)}</b></div><p>État créé : <strong>submitted</strong>. Une décision séparée sera requise avant validation du run.</p></div>
        {action.feedback ? <div className={styles.feedback} data-state={action.feedback.state}>{action.feedback.text}</div> : null}
        <div className={styles.drawerFooter}><button className={styles.button} onClick={() => setOpen(false)}>Annuler</button><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={action.busy || !periodId || !staffId || !componentCode.trim() || !Number.isFinite(amountMinor)} onClick={() => action.run({ action: 'input.submit', schoolId: snapshot.schoolId, periodId, staffId, componentCode: componentCode.trim(), inputType, amountMinor, quantity: Number(quantity || 1), sourceType: 'manual', evidence: { reason: reason.trim() || null, source: 'sanila_payroll_sovereign_control' }, idempotencyKey: `ui:${periodId}:${staffId}:${inputType}:${componentCode}:${Date.now()}` }, () => setOpen(false))}>{action.busy ? 'Soumission…' : 'Soumettre l’élément'}</button></div>
      </div>
    </Drawer> : null}
  </>
}

export function InputDecision({ snapshot, inputId, label }: { snapshot: PayrollSnapshot; inputId: string; label?: string }) {
  const action = useAction()
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  return <div className={styles.actions}>
    <button className={`${styles.button} ${styles.buttonPrimary}`} disabled={action.busy || !snapshot.integrity.safeForOperations} onClick={() => setDecision('approved')}>Approuver</button>
    <button className={styles.button} disabled={action.busy || !snapshot.integrity.safeForOperations} onClick={() => setDecision('rejected')}>Rejeter</button>
    {decision ? <ConfirmDialog title={decision === 'approved' ? 'Approuver cet élément de paie ?' : 'Rejeter cet élément de paie ?'} copy={label || 'L’élément sélectionné'} consequence={decision === 'approved' ? 'Il deviendra éligible au cycle de validation du run. Cela ne calcule ni ne paie automatiquement la paie.' : 'Il restera dans l’historique comme rejeté et ne sera pas utilisé comme élément approuvé.'} confirmLabel={decision === 'approved' ? 'Confirmer l’approbation' : 'Confirmer le rejet'} danger={decision === 'rejected'} busy={action.busy} onClose={() => setDecision(null)} onConfirm={() => action.run({ action: 'input.approve', schoolId: snapshot.schoolId, inputId, decision }, () => setDecision(null))} /> : null}
  </div>
}

export function RunGovernance({ snapshot, runId, status }: { snapshot: PayrollSnapshot; runId: string; status: string }) {
  const action = useAction()
  const [open, setOpen] = useState(false)
  const next = status === 'calculated' || status === 'review' ? 'validated' : status === 'validated' ? 'approved' : status === 'approved' ? 'finalized' : null
  if (!next) return null
  const labels = { validated: 'Valider la paie', approved: 'Approuver la paie', finalized: 'Finaliser la paie' } as const
  const consequence = next === 'validated' ? 'Le RPC refuse la validation tant que des inputs restent non décidés.' : next === 'approved' ? 'Le run devra être validé avant approbation. Approved ne signifie pas paid.' : 'Les résultats deviennent finalisés et le cycle peut ensuite préparer un lot de paiement.'
  return <><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={action.busy || !snapshot.integrity.safeForOperations} onClick={() => setOpen(true)}>{labels[next]}</button>{open ? <ConfirmDialog title={`${labels[next]} ?`} copy={`Run ${runId.slice(0, 8)} · état actuel ${status}`} consequence={consequence} confirmLabel={labels[next]} busy={action.busy} onClose={() => setOpen(false)} onConfirm={() => action.run({ action: 'run.transition', schoolId: snapshot.schoolId, runId, targetStatus: next }, () => setOpen(false))} /> : null}</>
}

export function AdvanceStudio({ snapshot }: { snapshot: PayrollSnapshot }) {
  const [open, setOpen] = useState(false)
  const action = useAction()
  const activeStaff = snapshot.staffDirectory.filter(staff => ['active', 'on_leave'].includes(staff.status))
  const [staffId, setStaffId] = useState(activeStaff[0]?.id || '')
  const [principal, setPrincipal] = useState('0')
  const [installment, setInstallment] = useState('0')
  const [periodId, setPeriodId] = useState('')
  const [reason, setReason] = useState('')
  const principalMinor = Math.round(Number(principal || 0) * 100)
  const installmentMinor = Math.round(Number(installment || 0) * 100)
  const installmentCount = installmentMinor > 0 ? Math.max(1, Math.ceil(principalMinor / installmentMinor)) : 0
  return <><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={!snapshot.integrity.safeForOperations || !activeStaff.length} onClick={() => setOpen(true)}>Nouvelle avance</button>{open ? <Drawer title="Advance Recovery Command" eyebrow="AVANCE · RESPONSABILITÉ" copy="L’avance est créée requested. L’approbation et le décaissement sont des transitions distinctes; aucun transfert bancaire n’est exécuté ici." onClose={() => setOpen(false)}><div className={styles.form}>
    <Field label="Collaborateur"><select className={styles.select} value={staffId} onChange={event => setStaffId(event.target.value)}>{activeStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name} · {staff.staffCode}</option>)}</select></Field>
    <div className={styles.formGrid}><Field label="Principal (Dh)"><input className={styles.input} type="number" min="0" step="0.01" value={principal} onChange={event => setPrincipal(event.target.value)} /></Field><Field label="Échéance cible (Dh)"><input className={styles.input} type="number" min="0" step="0.01" value={installment} onChange={event => setInstallment(event.target.value)} /></Field></div>
    <Field label="Début récupération"><select className={styles.select} value={periodId} onChange={event => setPeriodId(event.target.value)}><option value="">À déterminer</option>{snapshot.periods.map(period => <option key={period.id} value={period.id}>{period.label}</option>)}</select></Field>
    <Field label="Motif"><textarea className={styles.textarea} value={reason} onChange={event => setReason(event.target.value)} /></Field>
    <div className={styles.consequence}><span>PLAN ENREGISTRÉ</span><div><strong>Principal</strong><b>{formatMoneyMinor(principalMinor)}</b></div><p>{installmentCount ? `${installmentCount} échéance(s) théorique(s) au montant saisi. Le RPC n’exécute aucun amortissement automatique.` : 'Saisissez un principal et une échéance positifs.'}</p></div>
    {action.feedback ? <div className={styles.feedback} data-state={action.feedback.state}>{action.feedback.text}</div> : null}
    <div className={styles.drawerFooter}><button className={styles.button} onClick={() => setOpen(false)}>Annuler</button><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={action.busy || principalMinor <= 0 || installmentMinor <= 0 || !staffId} onClick={() => action.run({ action: 'advance.create', schoolId: snapshot.schoolId, staffId, advanceCode: `ADV-${Date.now()}`, principalMinor, installmentMinor, installmentCount, recoveryStartPeriodId: periodId || null, reason: reason.trim() || null }, () => setOpen(false))}>Créer la demande</button></div>
  </div></Drawer> : null}</>
}

export function AdvanceTransition({ snapshot, id, status }: { snapshot: PayrollSnapshot; id: string; status: string }) {
  const action = useAction()
  const [open, setOpen] = useState(false)
  const next = status === 'requested' ? 'approved' : status === 'approved' ? 'disbursed' : status === 'disbursed' ? 'recovering' : null
  if (!next) return null
  const label = next === 'approved' ? 'Approuver' : next === 'disbursed' ? 'Marquer décaissée' : 'Passer en récupération'
  return <><button className={styles.button} disabled={action.busy || !snapshot.integrity.safeForOperations} onClick={() => setOpen(true)}>{label}</button>{open ? <ConfirmDialog title={`${label} ?`} copy={`Avance ${id.slice(0, 8)} · ${status} → ${next}`} consequence={next === 'disbursed' ? 'Cette action enregistre un décaissement opérationnel. Elle ne contacte ni banque ni fournisseur de paiement.' : 'La transition sera validée par le RPC Payroll.'} confirmLabel={label} busy={action.busy} onClose={() => setOpen(false)} onConfirm={() => action.run({ action: 'advance.transition', schoolId: snapshot.schoolId, advanceId: id, targetStatus: next }, () => setOpen(false))} /> : null}</>
}

export function PaymentBatchStudio({ snapshot }: { snapshot: PayrollSnapshot }) {
  const [open, setOpen] = useState(false)
  const action = useAction()
  const eligibleRuns = snapshot.runs.filter(run => run.status === 'finalized' && !snapshot.batches.some(batch => batch.runId === run.id && !['cancelled', 'archived', 'reconciled'].includes(batch.status)))
  const [runId, setRunId] = useState(eligibleRuns[0]?.id || '')
  const [method, setMethod] = useState('manual')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const run = snapshot.runs.find(item => item.id === runId)
  return <><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={!snapshot.integrity.safeForOperations || !eligibleRuns.length} onClick={() => setOpen(true)}>Préparer un lot</button>{open ? <Drawer title="Payroll Disbursement Preparation" eyebrow="PAYMENT TRUTH" copy="Cette étape prépare un lot et ses items à partir d’un run finalisé. Aucun virement bancaire n’est exécuté." onClose={() => setOpen(false)}><div className={styles.form}>
    <Field label="Run finalisé"><select className={styles.select} value={runId} onChange={event => setRunId(event.target.value)}>{eligibleRuns.map(item => <option key={item.id} value={item.id}>{item.runCode} · {formatMoneyMinor(item.netMinor)}</option>)}</select></Field>
    <div className={styles.formGrid}><Field label="Méthode"><select className={styles.select} value={method} onChange={event => setMethod(event.target.value)}><option value="manual">Confirmation manuelle</option><option value="bank_file">Fichier bancaire préparatoire</option><option value="cash">Espèces</option></select></Field><Field label="Date"><input className={styles.input} type="date" value={date} onChange={event => setDate(event.target.value)} /></Field></div>
    <div className={`${styles.consequence} ${styles.paymentTruth}`}><span>VÉRITÉ D’EXÉCUTION</span><div><strong>{run?.runCode || 'Run'}</strong><b>{formatMoneyMinor(run?.netMinor || 0)}</b></div><p>La création du lot génère des items pending. « bank_file » signifie uniquement préparation de registre/fichier; aucune banque n’est appelée.</p></div>
    {action.feedback ? <div className={styles.feedback} data-state={action.feedback.state}>{action.feedback.text}</div> : null}
    <div className={styles.drawerFooter}><button className={styles.button} onClick={() => setOpen(false)}>Annuler</button><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={action.busy || !runId || !date} onClick={() => action.run({ action: 'payment.batch.create', schoolId: snapshot.schoolId, runId, batchCode: `PAY-${run?.runCode || 'RUN'}-${Date.now().toString().slice(-6)}`, paymentMethod: method, paymentDate: date }, () => setOpen(false))}>Préparer le lot</button></div>
  </div></Drawer> : null}</>
}

export function PaymentItemTruth({ snapshot, id, employee, amountMinor }: { snapshot: PayrollSnapshot; id: string; employee?: string; amountMinor?: number }) {
  const [open, setOpen] = useState(false)
  const action = useAction()
  const [target, setTarget] = useState<'paid' | 'failed'>('paid')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  return <><button className={styles.button} disabled={action.busy || !snapshot.integrity.safeForOperations} onClick={() => setOpen(true)}>Enregistrer résultat</button>{open ? <Drawer title="Payment Truth Chamber" eyebrow="CONFIRMATION OPÉRATEUR" copy="Paid n’est enregistré qu’après une confirmation explicite et référencée. SANILA ne prétend pas recevoir un accusé bancaire automatique." onClose={() => setOpen(false)}><div className={styles.form}>
    <div className={styles.paymentIdentity}><span>{employee || 'Collaborateur'}</span><strong>{formatMoneyMinor(amountMinor || 0)}</strong></div>
    <Field label="Résultat"><select className={styles.select} value={target} onChange={event => setTarget(event.target.value as 'paid' | 'failed')}><option value="paid">Paiement confirmé manuellement</option><option value="failed">Échec confirmé</option></select></Field>
    {target === 'paid' ? <Field label="Référence de confirmation" hint="Référence opérateur, bancaire ou justificative réellement disponible. Requise avant paid."><input className={styles.input} value={reference} onChange={event => setReference(event.target.value)} placeholder="REF-PAIEMENT-…" /></Field> : <Field label="Raison de l’échec"><textarea className={styles.textarea} value={reason} onChange={event => setReason(event.target.value)} placeholder="Motif réellement connu" /></Field>}
    <div className={styles.truthNotice}><strong>Aucune confirmation automatique</strong><p>Cette action enregistre la vérité déclarée par l’opérateur autorisé. Elle n’exécute aucun transfert.</p></div>
    {action.feedback ? <div className={styles.feedback} data-state={action.feedback.state}>{action.feedback.text}</div> : null}
    <div className={styles.drawerFooter}><button className={styles.button} onClick={() => setOpen(false)}>Annuler</button><button className={`${styles.button} ${target === 'failed' ? styles.buttonDanger : styles.buttonPrimary}`} disabled={action.busy || (target === 'paid' ? !reference.trim() : !reason.trim())} onClick={() => action.run({ action: 'payment.item.transition', schoolId: snapshot.schoolId, paymentItemId: id, targetStatus: target, providerReference: target === 'paid' ? reference.trim() : null, failureReason: target === 'failed' ? reason.trim() : null }, () => setOpen(false))}>{target === 'paid' ? 'Confirmer payé' : 'Enregistrer l’échec'}</button></div>
  </div></Drawer> : null}</>
}

export function ReconcileButton({ snapshot, batchId }: { snapshot: PayrollSnapshot; batchId: string }) {
  const action = useAction()
  const [open, setOpen] = useState(false)
  const batch = snapshot.batches.find(item => item.id === batchId)
  return <><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={action.busy || !snapshot.integrity.safeForOperations} onClick={() => setOpen(true)}>Réconcilier le lot</button>{open ? <ConfirmDialog title="Réconcilier ce lot ?" copy={`${batch?.batchCode || batchId} · attendu ${formatMoneyMinor(batch?.totalMinor || 0)}`} consequence="Le RPC n’accepte la réconciliation que si pending=0, failed=0 et payé=attendu. Sinon l’opération échoue sans marquer le lot reconciled." confirmLabel="Lancer la réconciliation" busy={action.busy} onClose={() => setOpen(false)} onConfirm={() => action.run({ action: 'payment.batch.reconcile', schoolId: snapshot.schoolId, batchId }, () => setOpen(false))} /> : null}</>
}
