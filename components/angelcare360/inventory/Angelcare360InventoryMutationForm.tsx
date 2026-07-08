'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type Angelcare360InventoryMutationField = {
  name: string
  label: string
  kind: 'text' | 'textarea' | 'number' | 'date' | 'select'
  placeholder?: string
  helperText?: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

type Props = {
  title: string
  description?: string
  entity: string
  operation: string
  submitLabel: string
  fields: Angelcare360InventoryMutationField[]
  initialValues?: Record<string, string | number | boolean | null | undefined>
  recordId?: string | null
  schoolId?: string | null
  lockedReason?: string | null
}

export default function Angelcare360InventoryMutationForm({
  title,
  description,
  entity,
  operation,
  submitLabel,
  fields,
  initialValues,
  recordId,
  schoolId,
  lockedReason,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {}
    for (const field of fields) next[field.name] = String(initialValues?.[field.name] ?? '')
    return next
  })

  const payload = useMemo(() => {
    const data: Record<string, unknown> = {}
    for (const field of fields) {
      const value = values[field.name]
      data[field.name] = field.kind === 'number' ? Number(value) : value.trim()
    }
    if (schoolId) data.schoolId = schoolId
    if (recordId) data.id = recordId
    return data
  }, [fields, values, schoolId, recordId])

  async function submit() {
    setError(null)
    setMessage(null)
    const response = await fetch('/api/angelcare360/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, operation, payload }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      setError(data?.error || 'La mutation inventaire a échoué.')
      return
    }

    setMessage('Mutation enregistrée avec succès.')
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>{title}</h3>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </div>
        {lockedReason ? <span style={lockedStyle}>{lockedReason}</span> : null}
      </div>

      <div style={formStyle}>
        {fields.map((field) => (
          <label key={field.name} style={fieldStyle}>
            <span style={labelStyle}>{field.label}{field.required ? ' *' : ''}</span>
            {field.kind === 'textarea' ? (
              <textarea value={values[field.name] || ''} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} style={textareaStyle} rows={4} />
            ) : field.kind === 'select' ? (
              <select value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} style={inputStyle}>
                <option value="">Sélectionner…</option>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input type={field.kind} value={values[field.name] || ''} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} style={inputStyle} />
            )}
            {field.helperText ? <span style={helperStyle}>{field.helperText}</span> : null}
          </label>
        ))}
      </div>

      <div style={footerStyle}>
        <button type="button" onClick={() => void submit()} disabled={pending || Boolean(lockedReason)} style={lockedReason ? disabledButtonStyle : buttonStyle}>
          {pending ? 'Enregistrement…' : submitLabel}
        </button>
        {message ? <span style={successStyle}>{message}</span> : null}
        {error ? <span style={errorStyle}>{error}</span> : null}
      </div>
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const descriptionStyle: React.CSSProperties = { margin: '6px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const lockedStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#fef2f2', color: '#991b1b', fontSize: 12, fontWeight: 800 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6 }
const labelStyle: React.CSSProperties = { color: '#0f172a', fontSize: 13, fontWeight: 900 }
const inputStyle: React.CSSProperties = { borderRadius: 14, border: '1px solid #cbd5e1', padding: '10px 12px', background: '#fff', color: '#0f172a', fontWeight: 600 }
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 110, resize: 'vertical' }
const helperStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, lineHeight: 1.45, fontWeight: 600 }
const footerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }
const buttonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', fontWeight: 800 }
const disabledButtonStyle: React.CSSProperties = { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' }
const successStyle: React.CSSProperties = { color: '#166534', fontWeight: 700 }
const errorStyle: React.CSSProperties = { color: '#991b1b', fontWeight: 700 }
