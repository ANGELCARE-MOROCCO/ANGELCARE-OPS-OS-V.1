'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, ShieldCheck, X } from 'lucide-react'
import styles from './governed-action.module.css'

export type GovernedActionRequest = {
  title: string
  objectLabel: string
  currentState?: string
  nextState?: string
  consequence: string
  reversibility?: string
  permission?: string
  danger?: boolean
  reasonLabel?: string
}

type PendingRequest = GovernedActionRequest & { resolve: (reason: string | null) => void }
type GovernedActionContextValue = (request: GovernedActionRequest) => Promise<string | null>

const GovernedActionContext = createContext<GovernedActionContextValue | null>(null)

export function GovernedActionProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<PendingRequest | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (pending && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [pending])

  function requestAction(request: GovernedActionRequest) {
    return new Promise<string | null>((resolve) => {
      setReason('')
      setPending({ ...request, resolve })
    })
  }

  function finish(value: string | null) {
    pending?.resolve(value)
    dialogRef.current?.close()
    setPending(null)
    setReason('')
  }

  return (
    <GovernedActionContext.Provider value={requestAction}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onCancel={(event) => {
          event.preventDefault()
          finish(null)
        }}
      >
        {pending ? (
          <>
            <header className={styles.header}>
              <div className={styles.signal} data-danger={pending.danger}>
                {pending.danger ? <AlertTriangle /> : <ShieldCheck />}
              </div>
              <div>
                <span>ACTION OPÉRATEUR GOUVERNÉE</span>
                <h2>{pending.title}</h2>
                <p>{pending.objectLabel}</p>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => finish(null)}>
                <X />
              </button>
            </header>
            <section className={styles.body}>
              {(pending.currentState || pending.nextState) ? (
                <div className={styles.transition}>
                  <div><span>État actuel</span><strong>{pending.currentState || 'NOT_APPLICABLE'}</strong></div>
                  <b>→</b>
                  <div><span>État proposé</span><strong>{pending.nextState || 'NOT_APPLICABLE'}</strong></div>
                </div>
              ) : null}
              <dl className={styles.impact}>
                <div><dt>Conséquence</dt><dd>{pending.consequence}</dd></div>
                <div><dt>Réversibilité</dt><dd>{pending.reversibility || 'À confirmer depuis l’autorité métier après exécution.'}</dd></div>
                {pending.permission ? <div><dt>Permission</dt><dd><code>{pending.permission}</code></dd></div> : null}
              </dl>
              <label className={styles.reason}>
                <span>{pending.reasonLabel || 'Motif obligatoire / base de décision'}</span>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} autoFocus />
              </label>
            </section>
            <footer className={styles.footer}>
              <button type="button" onClick={() => finish(null)}>Annuler</button>
              <button type="button" data-danger={pending.danger} disabled={!reason.trim()} onClick={() => finish(reason.trim())}>
                Confirmer l’action
              </button>
            </footer>
          </>
        ) : null}
      </dialog>
    </GovernedActionContext.Provider>
  )
}

export function useGovernedAction() {
  const context = useContext(GovernedActionContext)
  if (!context) throw new Error('useGovernedAction must be used inside GovernedActionProvider')
  return context
}
