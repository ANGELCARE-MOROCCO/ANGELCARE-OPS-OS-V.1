'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, CircleAlert, LoaderCircle, X, type LucideIcon } from 'lucide-react'
import type { CustomerToastInput, CustomerToastRecord } from '@/types/angelcare360/customer-experience'
import CustomerCommandPalette from './CustomerCommandPalette'
import styles from './CustomerExperience.module.css'

type ContextValue = { notify: (input: CustomerToastInput) => string; update: (id: string, input: Partial<CustomerToastInput>) => void; dismiss: (id: string) => void }
const Context = createContext<ContextValue | null>(null)
const EVENT_NAME = 'angelcare360:toast'

function id() { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` }

export function dispatchCustomerToast(input: CustomerToastInput) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: input }))
}

export function useCustomerExperience() {
  const value = useContext(Context)
  if (!value) throw new Error('useCustomerExperience must be used inside CustomerExperienceProvider.')
  return value
}

export default function CustomerExperienceProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<CustomerToastRecord[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((toastId: string) => {
    const timer = timers.current.get(toastId)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(toastId)
    setToasts((items) => items.filter((item) => item.id !== toastId))
  }, [])

  const schedule = useCallback((toast: CustomerToastRecord) => {
    if (toast.persistent || toast.tone === 'processing') return
    const existing = timers.current.get(toast.id)
    if (existing) window.clearTimeout(existing)
    timers.current.set(toast.id, window.setTimeout(() => dismiss(toast.id), toast.durationMs))
  }, [dismiss])

  const notify = useCallback((input: CustomerToastInput) => {
    const record: CustomerToastRecord = {
      id: input.id || id(), title: input.title, message: input.message, tone: input.tone || 'info', progress: input.progress,
      durationMs: input.durationMs ?? 3000, persistent: input.persistent ?? false, createdAt: Date.now(),
    }
    setToasts((items) => [...items.filter((item) => item.id !== record.id), record].slice(-5))
    window.setTimeout(() => schedule(record), 0)
    return record.id
  }, [schedule])

  const update = useCallback((toastId: string, input: Partial<CustomerToastInput>) => {
    setToasts((items) => items.map((item) => {
      if (item.id !== toastId) return item
      const next = { ...item, ...input, id: item.id, durationMs: input.durationMs ?? item.durationMs, persistent: input.persistent ?? item.persistent }
      window.setTimeout(() => schedule(next), 0)
      return next
    }))
  }, [schedule])

  useEffect(() => {
    const handler = (event: Event) => notify((event as CustomEvent<CustomerToastInput>).detail)
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [notify])

  useEffect(() => {
    const original = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
      const url = String(input instanceof Request ? input.url : input)
      const requestHeaders = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined))
      const mutation = !['GET','HEAD','OPTIONS'].includes(method) && url.includes('/api/angelcare360/') && requestHeaders.get('x-angelcare360-toast') !== 'off'
      if (!mutation) return original(input, init)
      const toastId = notify({ title: 'Action en cours', message: 'Traitement sécurisé de votre demande…', tone: 'processing', progress: 36, persistent: true })
      try {
        const response = await original(input, init)
        if (response.ok) update(toastId, { title: 'Action réalisée', message: 'La modification a été enregistrée et synchronisée.', tone: 'success', progress: 100, persistent: false, durationMs: 3000 })
        else {
          let message = `La demande a échoué (${response.status}).`
          try { const body = await response.clone().json(); message = body.error || body.message || message } catch {}
          update(toastId, { title: 'Action non réalisée', message, tone: 'error', progress: 100, persistent: false, durationMs: 3000 })
        }
        return response
      } catch (error) {
        update(toastId, { title: 'Connexion interrompue', message: error instanceof Error ? error.message : 'Impossible de terminer la demande.', tone: 'error', progress: 100, persistent: false, durationMs: 3000 })
        throw error
      }
    }
    return () => { window.fetch = original; for (const timer of timers.current.values()) window.clearTimeout(timer); timers.current.clear() }
  }, [notify, update])

  const value = useMemo(() => ({ notify, update, dismiss }), [notify, update, dismiss])
  return <Context.Provider value={value}>{children}<CustomerCommandPalette/><ToastViewport toasts={toasts} dismiss={dismiss} /></Context.Provider>
}

function ToastViewport({ toasts, dismiss }: { toasts: CustomerToastRecord[]; dismiss: (id: string) => void }) {
  return <div className={styles.toastViewport} role="region" aria-label="État des actions" aria-live="polite">
    {toasts.map((toast) => <Toast key={toast.id} toast={toast} dismiss={dismiss} />)}
  </div>
}
function Toast({ toast, dismiss }: { toast: CustomerToastRecord; dismiss: (id: string) => void }) {
  const icons: Record<CustomerToastRecord['tone'], LucideIcon> = { processing: LoaderCircle, success: CheckCircle2, warning: AlertTriangle, error: CircleAlert, info: CircleAlert }
  const Icon = icons[toast.tone]
  return <article className={styles.toast} data-tone={toast.tone}>
    <div className={styles.toastIcon}><Icon size={19} className={toast.tone === 'processing' ? styles.spin : undefined} /></div>
    <div className={styles.toastBody}><strong>{toast.title}</strong>{toast.message ? <span>{toast.message}</span> : null}</div>
    <button type="button" onClick={() => dismiss(toast.id)} aria-label="Fermer la notification"><X size={16} /></button>
    <div className={styles.toastProgress} style={{ transform: `scaleX(${Math.max(0, Math.min(100, toast.progress ?? (toast.tone === 'processing' ? 58 : 100))) / 100})` }} />
  </article>
}
