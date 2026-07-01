'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildAc360CommandPayload, type Ac360CustomerCommand } from '@/lib/ac360/customer-command-model'

type CommandStep = 'preflight' | 'review' | 'execute' | 'result'

type GuardState = {
  status: 'idle' | 'loading' | 'allowed' | 'blocked' | 'error'
  message: string
  raw?: unknown
}

type ExecutionState = {
  status: 'idle' | 'running' | 'success' | 'error'
  message: string
  raw?: unknown
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

function stringifySafe(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return '{}'
  }
}

function extractGuardMessage(payload: unknown) {
  const data = payload as any
  return data?.reason || data?.message || data?.guard?.reason || data?.guard?.message || data?.policy?.reason || data?.blockedUx?.message || data?.error || 'Pré-vol terminé.'
}

function isGuardAllowed(payload: unknown) {
  const data = payload as any
  return Boolean(data?.allowed || data?.ok || data?.guard?.ok || data?.guard?.allowed)
}

export function Ac360CustomerCommandModal({
  command,
  open,
  onClose,
  onExecuted,
}: {
  command: Ac360CustomerCommand | null
  open: boolean
  onClose: () => void
  onExecuted?: () => void
}) {
  const initialValues = useMemo(() => {
    const values: Record<string, string | number> = {}
    if (!command) return values
    for (const field of command.fields) {
      values[field.key] = field.defaultValue ?? ''
    }
    return values
  }, [command])

  const [values, setValues] = useState<Record<string, string | number>>(initialValues)
  const [step, setStep] = useState<CommandStep>('preflight')
  const [guard, setGuard] = useState<GuardState>({ status: 'idle', message: 'Pré-vol non lancé.' })
  const [execution, setExecution] = useState<ExecutionState>({ status: 'idle', message: 'Commande non exécutée.' })

  useEffect(() => {
    setValues(initialValues)
    setStep('preflight')
    setGuard({ status: 'idle', message: 'Pré-vol non lancé.' })
    setExecution({ status: 'idle', message: 'Commande non exécutée.' })
  }, [initialValues, open])

  if (!open || !command) return null

  const payload = buildAc360CommandPayload(command, values)

  const runPreflight = async () => {
    setGuard({ status: 'loading', message: 'Contrôle organisation, abonnement, droits, restrictions, capacité et usage…' })
    try {
      const response = await fetch('/api/ac360/action-wiring/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wiringKey: command.wiringKey,
          quantity: command.quantity,
          metadata: {
            source: 'ac360_customer_command_modal',
            phase: 'phase_3e',
            moduleKey: command.moduleKey,
            commandKey: command.key,
            targetEndpoint: command.targetEndpoint,
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      const allowed = response.ok && isGuardAllowed(data)
      setGuard({
        status: allowed ? 'allowed' : 'blocked',
        message: allowed ? 'Action autorisée. Le runtime AC360 permet de continuer.' : extractGuardMessage(data),
        raw: data,
      })
      setStep(allowed ? 'review' : 'preflight')
    } catch (error) {
      setGuard({ status: 'error', message: error instanceof Error ? error.message : 'Erreur pré-vol inconnue.' })
    }
  }

  const executeCommand = async () => {
    setExecution({ status: 'running', message: 'Exécution en cours avec journalisation, usage et audit…' })
    setStep('execute')
    try {
      const response = await fetch(command.targetEndpoint, {
        method: command.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setExecution({ status: 'error', message: extractGuardMessage(data), raw: data })
        setStep('result')
        return
      }
      setExecution({ status: 'success', message: command.successMessage, raw: data })
      setStep('result')
      onExecuted?.()
    } catch (error) {
      setExecution({ status: 'error', message: error instanceof Error ? error.message : 'Erreur exécution inconnue.' })
      setStep('result')
    }
  }

  const canExecute = guard.status === 'allowed' && execution.status !== 'running'

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/25 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white via-blue-50 to-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <SmallBadge className="border-blue-200 bg-white text-blue-800">Phase 3E · Commande réelle</SmallBadge>
                <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Pré-vol AC360</SmallBadge>
                <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Usage & audit</SmallBadge>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">{command.label}</h2>
              <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">{command.description}</p>
            </div>
            <button onClick={onClose} type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800">Fermer</button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.78fr_1.18fr_0.82fr]">
          <aside className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Chaîne de contrôle</p>
            <div className="mt-4 space-y-3">
              {[
                ['preflight', 'Pré-vol droits & restrictions'],
                ['review', 'Revue payload & impact'],
                ['execute', 'Exécution gardée'],
                ['result', 'Résultat, preuve & suite'],
              ].map(([key, label], index) => (
                <div key={key} className={cx('rounded-3xl border p-4', step === key ? 'border-blue-300 bg-white ring-4 ring-blue-50' : 'border-slate-200 bg-white')}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">{index + 1}</span>
                  <p className="mt-3 text-sm font-black text-slate-950">{label}</p>
                </div>
              ))}
            </div>
          </aside>

          <main className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {command.fields.map((field) => (
                <label key={field.key} className={cx('block', field.type === 'textarea' && 'md:col-span-2')}>
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
                  {field.type === 'select' ? (
                    <select value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                      {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={String(values[field.key] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  ) : (
                    <input type={field.type} value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} placeholder={field.placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SmallBadge className={guard.status === 'allowed' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : guard.status === 'blocked' || guard.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>
                  {guard.status === 'loading' ? 'pré-vol en cours' : guard.status === 'allowed' ? 'autorisé' : guard.status === 'blocked' ? 'bloqué' : guard.status === 'error' ? 'erreur' : 'à contrôler'}
                </SmallBadge>
                <SmallBadge className="border-slate-200 bg-white text-slate-700">{command.wiringKey}</SmallBadge>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{guard.message}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={runPreflight} disabled={guard.status === 'loading'} type="button" className="rounded-2xl bg-blue-700 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800 disabled:opacity-50">Lancer pré-vol</button>
              <button onClick={executeCommand} disabled={!canExecute} type="button" className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">Exécuter commande</button>
              <button onClick={() => setStep('review')} type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-blue-200 hover:bg-blue-50">Revoir payload</button>
            </div>

            {step === 'result' ? (
              <div className={cx('mt-5 rounded-[1.5rem] border p-4', execution.status === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50')}>
                <SmallBadge className={execution.status === 'success' ? 'border-emerald-200 bg-white text-emerald-800' : 'border-rose-200 bg-white text-rose-800'}>{execution.status === 'success' ? 'succès' : 'à traiter'}</SmallBadge>
                <p className="mt-3 text-sm font-black leading-6 text-slate-800">{execution.message}</p>
              </div>
            ) : null}
          </main>

          <aside className="border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Impact commercial & gouvernance</p>
            <div className="mt-4 space-y-3">
              {[command.businessImpact, command.entitlementSignal, command.creditSignal, command.riskSignal].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">{item}</div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Payload contrôlé</p>
              <pre className="mt-3 max-h-[260px] overflow-auto rounded-2xl bg-white p-3 text-[11px] font-semibold leading-5 text-slate-600">{stringifySafe(payload)}</pre>
            </div>
            {command.recommendedNext?.length ? (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Après succès</p>
                <div className="mt-3 space-y-2">
                  {command.recommendedNext.map((item) => <div key={item} className="rounded-2xl border border-emerald-100 bg-white p-3 text-xs font-black text-slate-700">{item}</div>)}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
