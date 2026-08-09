'use client'

import { useCallback, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Save, Send, X } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceRecord, CommerceResource } from '../types'

interface ApiEnvelope<T> { data?: T; error?: { message?: string } }

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const payload = await response.json() as ApiEnvelope<T>
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Action impossible.')
  return payload.data
}

export function useStudioMutation(onChanged?: () => void) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(action: () => Promise<T>, success: string): Promise<T | null> => {
    setSaving(true); setMessage(null); setError(null)
    try {
      const result = await action()
      setMessage(success)
      onChanged?.()
      return result
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action impossible.')
      return null
    } finally {
      setSaving(false)
    }
  }, [onChanged])

  return { saving, message, error, run, clear: () => { setMessage(null); setError(null) } }
}

export function StudioNotice({ message, error, onClose }: { message: string | null; error: string | null; onClose?: () => void }) {
  if (!message && !error) return null
  return <div className={styles.notice} data-error={Boolean(error)}>
    {error ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}<span>{error || message}</span>
    {onClose ? <button type="button" onClick={onClose}><X size={16}/></button> : null}
  </div>
}

export function StudioForm({
  resource, id, children, onSaved, submitLabel = 'Enregistrer', extraPayload,
}: {
  resource: CommerceResource
  id?: string
  children: ReactNode
  onSaved?: (record: CommerceRecord) => void
  submitLabel?: string
  extraPayload?: Record<string, unknown>
}) {
  const mutation = useStudioMutation()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload: Record<string, unknown> = { ...extraPayload }
    for (const [key, value] of form.entries()) {
      if (value instanceof File) continue
      if (key.endsWith('_json')) {
        payload[key.replace(/_json$/, '')] = value || '{}'
      } else if (key.startsWith('is_') || key === 'featured' || key === 'visible' || key === 'available' || key.endsWith('_visible')) {
        payload[key] = value === 'on' || value === 'true'
      } else {
        payload[key] = value
      }
    }
    for (const input of event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]')) {
      payload[input.name] = input.checked
    }
    const result = await mutation.run(
      () => apiRequest<{ record: CommerceRecord }>(
        `/api/angelcare-marketplace/admin/commerce/${resource}${id ? `/${id}` : ''}`,
        { method: id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) },
      ),
      id ? 'Modifications publiables enregistrées.' : 'Objet créé avec succès.',
    )
    if (result) onSaved?.(result.record)
  }
  return <form className={styles.studioForm} onSubmit={submit}>
    {children}
    <StudioNotice message={mutation.message} error={mutation.error} onClose={mutation.clear}/>
    <button className={styles.primaryAction} type="submit" disabled={mutation.saving}>
      {mutation.saving ? <Loader2 className={styles.spin} size={17}/> : <Save size={17}/>} {submitLabel}
    </button>
  </form>
}

export function ImmediateAction({ resource, id, action, label, payload, onDone, tone = 'default' }: {
  resource: CommerceResource
  id: string
  action: string
  label: string
  payload?: Record<string, unknown>
  onDone?: () => void
  tone?: 'default' | 'danger' | 'success'
}) {
  const mutation = useStudioMutation(onDone)
  return <button type="button" className={styles.inlineAction} data-tone={tone} disabled={mutation.saving} onClick={() => void mutation.run(
    () => apiRequest(`/api/angelcare-marketplace/admin/commerce/${resource}/${id}/${action}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload || {}),
    }),
    `${label} — résultat appliqué immédiatement.`,
  )}>{mutation.saving ? <Loader2 className={styles.spin} size={14}/> : action === 'publish' ? <Send size={14}/> : <RefreshCw size={14}/>} {label}</button>
}

export function Field({ name, label, defaultValue, type = 'text', required = false, placeholder, min, step }: {
  name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean; placeholder?: string; min?: number; step?: string
}) {
  return <label className={styles.field}><span>{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue ?? ''} placeholder={placeholder} min={min} step={step}/></label>
}

export function TextArea({ name, label, defaultValue, rows = 5, placeholder }: { name: string; label: string; defaultValue?: string | null; rows?: number; placeholder?: string }) {
  return <label className={styles.field}><span>{label}</span><textarea name={name} defaultValue={defaultValue ?? ''} rows={rows} placeholder={placeholder}/></label>
}

export function SelectField({ name, label, defaultValue, options, required = false }: { name: string; label: string; defaultValue?: string | null; options: Array<string | { value: string; label: string }>; required?: boolean }) {
  return <label className={styles.field}><span>{label}</span><select name={name} defaultValue={defaultValue ?? ''} required={required}>{options.map((option) => typeof option === 'string'
    ? <option key={option} value={option}>{option}</option>
    : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

export function CheckField({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className={styles.checkField}><input name={name} type="checkbox" defaultChecked={defaultChecked}/><span>{label}</span></label>
}
