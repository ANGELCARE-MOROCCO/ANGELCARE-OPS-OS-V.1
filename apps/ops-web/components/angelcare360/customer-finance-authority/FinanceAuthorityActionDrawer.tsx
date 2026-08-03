'use client'

import { useMemo, useState, type ChangeEvent, type MouseEvent } from 'react'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
import type { FinanceAuthorityCommandResult, FinanceAuthorityOperationKey } from '@/types/angelcare360/customer-finance-authority'
import styles from './FinanceAuthorityWorkspace.module.css'

type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'textarea' | 'select'; required?: boolean; wide?: boolean; options?: Array<{ value: string; label: string }>; placeholder?: string; source?: string }

type Props = {
  open: boolean
  operationKey: FinanceAuthorityOperationKey
  title: string
  description: string
  entityId?: string | null
  fields: Field[]
  onClose: () => void
  onCompleted: (result: FinanceAuthorityCommandResult) => void
}

export default function FinanceAuthorityActionDrawer({ open, operationKey, title, description, entityId, fields, onClose, onCompleted }: Props) {
  const initial = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, ''])), [fields])
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      for (const field of fields) {
        const value = values[field.key]
        if (field.required && !value.trim()) throw new Error(`${field.label} est requis.`)
        if (value.trim()) payload[field.key] = field.type === 'number' ? value.replace(',', '.') : value
      }
      const response = await fetch('/api/angelcare360/customer-finance-authority', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operationKey, entityId: entityId || undefined, reason: values.reason || undefined, idempotencyKey: `${operationKey}:${entityId || 'new'}:${JSON.stringify(payload)}`, payload }),
      })
      const result = await response.json() as FinanceAuthorityCommandResult & { error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || result.message || 'La commande financière a échoué.')
      onCompleted(result)
      setValues(initial)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'La commande n’a pas pu être exécutée.')
    } finally {
      setSubmitting(false)
    }
  }

  return <CustomerOverlayPortal>
    <div className={styles.drawerBackdrop} role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget && !submitting) onClose() }}>
      <section className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="finance-authority-drawer-title">
        <header className={styles.drawerHeader}>
          <div><h2 id="finance-authority-drawer-title">{title}</h2><p>{description}</p></div>
          <button className={styles.close} type="button" onClick={onClose} disabled={submitting} aria-label="Fermer">×</button>
        </header>
        <div className={styles.drawerBody}>
          <div className={styles.formGrid}>
            {fields.map((field) => <div className={styles.field} data-wide={field.wide || undefined} key={field.key}>
              <label htmlFor={`finance-${field.key}`}>{field.label}{field.required ? ' *' : ''}</label>
              {field.type === 'textarea' ? <textarea id={`finance-${field.key}`} value={values[field.key] || ''} placeholder={field.placeholder} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}/>
                : field.type === 'select' ? <select id={`finance-${field.key}`} value={values[field.key] || ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}><option value="">Sélectionner…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  : <input id={`finance-${field.key}`} type={field.type === 'number' ? 'text' : field.type || 'text'} inputMode={field.type === 'number' ? 'decimal' : undefined} value={values[field.key] || ''} placeholder={field.placeholder} onChange={(event: ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}/>}</div>)}
          </div>
          {error ? <p role="alert" style={{ color: '#a42e39', fontWeight: 800, marginTop: 14 }}>{error}</p> : null}
        </div>
        <footer className={styles.drawerFooter}>
          <button className={styles.button} type="button" onClick={onClose} disabled={submitting}>Annuler</button>
          <button className={styles.primary} type="button" onClick={submit} disabled={submitting}>{submitting ? 'Exécution…' : 'Confirmer et exécuter'}</button>
        </footer>
      </section>
    </div>
  </CustomerOverlayPortal>
}
