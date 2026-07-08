'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type Angelcare360TransportMutationField = {
  name: string
  label: string
  kind: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'checkbox'
  placeholder?: string
  helperText?: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

type Angelcare360TransportMutationFormProps = {
  title: string
  description?: string
  entity: string
  operation: string
  submitLabel: string
  fields: Angelcare360TransportMutationField[]
  initialValues?: Record<string, string | number | boolean | null | undefined>
  recordId?: string | null
  schoolId?: string | null
  lockedReason?: string | null
}

export default function Angelcare360TransportMutationForm({
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
}: Angelcare360TransportMutationFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const next: Record<string, string | boolean> = {}
    for (const field of fields) {
      const initialValue = initialValues?.[field.name]
      next[field.name] = field.kind === 'checkbox' ? Boolean(initialValue) : String(initialValue ?? '')
    }
    return next
  })

  const payload = useMemo(() => {
    const data: Record<string, unknown> = {}
    for (const field of fields) {
      const value = values[field.name]
      if (field.kind === 'checkbox') {
        data[field.name] = Boolean(value)
        continue
      }
      data[field.name] = typeof value === 'string' ? value.trim() : value
    }
    if (schoolId) data.schoolId = schoolId
    if (recordId) data.id = recordId
    return data
  }, [fields, values, schoolId, recordId])

  async function submit() {
    setError(null)
    setMessage(null)
    const response = await fetch('/api/angelcare360/transport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entity, operation, payload }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      setError(data?.error || 'La mutation transport a échoué.')
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
          <label key={field.name} style={field.kind === 'checkbox' ? checkboxFieldStyle : fieldStyle}>
            <span style={labelStyle}>{field.label}{field.required ? ' *' : ''}</span>
            {field.kind === 'textarea' ? (
              <textarea
                value={String(values[field.name] || '')}
                placeholder={field.placeholder}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                style={textareaStyle}
                rows={4}
              />
            ) : field.kind === 'select' ? (
              <select
                value={String(values[field.name] || '')}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                style={inputStyle}
              >
                <option value="">Sélectionner…</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : field.kind === 'checkbox' ? (
              <input
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                style={checkboxStyle}
              />
            ) : (
              <input
                type={field.kind}
                value={String(values[field.name] || '')}
                placeholder={field.placeholder}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                style={inputStyle}
              />
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

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  flexWrap: 'wrap',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const descriptionStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const lockedStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 12,
  fontWeight: 800,
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const checkboxFieldStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const labelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 800,
}

const helperStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
}

const checkboxStyle: React.CSSProperties = {
  width: 18,
  height: 18,
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  fontWeight: 850,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  color: '#94a3b8',
  cursor: 'not-allowed',
}

const successStyle: React.CSSProperties = {
  color: '#166534',
  fontWeight: 700,
}

const errorStyle: React.CSSProperties = {
  color: '#b91c1c',
  fontWeight: 700,
}
