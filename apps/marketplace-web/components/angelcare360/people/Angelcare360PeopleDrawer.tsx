'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Angelcare360PeopleEntityConfig, Angelcare360PeopleFieldDefinition } from '@/types/angelcare360/people'

type Angelcare360PeopleDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  config: Angelcare360PeopleEntityConfig
  initialValues?: Record<string, unknown>
  title: string
  onClose: () => void
  onSaved: () => void
}

function valueToString(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.map((item) => String(item)).join(',')
  return String(value)
}

function buildEmptyValue(field: Angelcare360PeopleFieldDefinition) {
  if (field.kind === 'switch') return false
  if (field.kind === 'multi-select') return [] as string[]
  return ''
}

export default function Angelcare360PeopleDrawer({
  open,
  mode,
  config,
  initialValues = {},
  title,
  onClose,
  onSaved,
}: Angelcare360PeopleDrawerProps) {
  const [formState, setFormState] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const nextState: Record<string, unknown> = { ...config.fixedValues, ...initialValues }
    for (const field of config.fields) {
      if (!(field.name in nextState)) {
        nextState[field.name] = buildEmptyValue(field)
      }
    }
    setFormState(nextState)
    setError(null)
    setSuccess(null)
  }, [config.fields, config.fixedValues, initialValues, open])

  const fieldList = useMemo(() => config.fields, [config.fields])

  if (!open) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        entity: config.resource,
        operation: mode === 'create' ? 'create' : 'update',
        id: initialValues.id || formState.id || undefined,
        payload: formState,
      }

      const response = await fetch('/api/angelcare360/people', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      })

      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || 'La sauvegarde a échoué.')
      }

      setSuccess('Enregistrement effectué.')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={overlayStyle} role="presentation" onClick={onClose}>
      <div style={drawerStyle} onClick={(event) => event.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>{mode === 'create' ? 'Nouvelle fiche' : 'Mise à jour'}</div>
            <h3 style={titleStyle}>{title}</h3>
            <p style={subtitleStyle}>{config.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </header>

        {error ? <div style={errorBoxStyle}>{error}</div> : null}
        {success ? <div style={successBoxStyle}>{success}</div> : null}

        <div style={formGridStyle}>
          {fieldList.map((field) => {
            const currentValue = formState[field.name]
            const commonProps = {
              style: fieldShellStyle,
            }

            if (field.kind === 'switch') {
              return (
                <label key={field.name} {...commonProps}>
                  <span style={labelStyle}>{field.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentValue)}
                    onChange={(event) => setFormState((state) => ({ ...state, [field.name]: event.target.checked }))}
                  />
                </label>
              )
            }

            if (field.kind === 'select') {
              return (
                <label key={field.name} {...commonProps}>
                  <span style={labelStyle}>{field.label}</span>
                  <select
                    value={valueToString(currentValue)}
                    onChange={(event) => setFormState((state) => ({ ...state, [field.name]: event.target.value }))}
                    style={inputStyle}
                    disabled={field.readOnly}
                    title={field.disabledReason}
                  >
                    <option value="">Sélectionner</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {field.helpText ? <span style={helpStyle}>{field.helpText}</span> : null}
                </label>
              )
            }

            if (field.kind === 'multi-select') {
              const currentValues = Array.isArray(currentValue) ? currentValue.map(String) : []
              return (
                <div key={field.name} {...commonProps}>
                  <span style={labelStyle}>{field.label}</span>
                  <div style={multiSelectGridStyle}>
                    {field.options?.map((option) => {
                      const checked = currentValues.includes(option.value)
                      return (
                        <label key={option.value} style={multiSelectItemStyle}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setFormState((state) => {
                                const existing = Array.isArray(state[field.name]) ? (state[field.name] as string[]) : []
                                const next = event.target.checked
                                  ? [...existing, option.value]
                                  : existing.filter((item) => item !== option.value)
                                return { ...state, [field.name]: next }
                              })
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {field.helpText ? <span style={helpStyle}>{field.helpText}</span> : null}
                </div>
              )
            }

            if (field.kind === 'textarea') {
              return (
                <label key={field.name} {...commonProps}>
                  <span style={labelStyle}>{field.label}</span>
                  <textarea
                    value={valueToString(currentValue)}
                    onChange={(event) => setFormState((state) => ({ ...state, [field.name]: event.target.value }))}
                    style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly}
                    title={field.disabledReason}
                  />
                  {field.helpText ? <span style={helpStyle}>{field.helpText}</span> : null}
                </label>
              )
            }

            return (
              <label key={field.name} {...commonProps}>
                <span style={labelStyle}>{field.label}</span>
                <input
                  type={field.kind === 'email' || field.kind === 'tel' || field.kind === 'date' || field.kind === 'number' ? field.kind : 'text'}
                  value={valueToString(currentValue)}
                  onChange={(event) => setFormState((state) => ({ ...state, [field.name]: event.target.value }))}
                  style={inputStyle}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  readOnly={field.readOnly}
                  title={field.disabledReason}
                />
                {field.helpText ? <span style={helpStyle}>{field.helpText}</span> : null}
              </label>
            )
          })}
        </div>

        <footer style={footerStyle}>
          <button type="button" onClick={onClose} style={ghostButtonStyle}>
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} style={saveButtonStyle} disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  background: 'rgba(15,23,42,.34)',
  backdropFilter: 'blur(8px)',
  display: 'grid',
  placeItems: 'end',
  padding: 16,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(860px, 100%)',
  maxHeight: '92vh',
  overflow: 'auto',
  borderRadius: 28,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 30px 90px rgba(15,23,42,.18)',
  padding: 22,
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const closeButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '8px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const errorBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#b91c1c',
  padding: 12,
  fontWeight: 700,
  lineHeight: 1.6,
}

const successBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #bbf7d0',
  background: '#f0fdf4',
  color: '#166534',
  padding: 12,
  fontWeight: 700,
  lineHeight: 1.6,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const fieldShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '11px 14px',
  fontSize: 14,
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
}

const helpStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

const multiSelectGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const multiSelectItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: '10px 12px',
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'end',
  gap: 10,
  flexWrap: 'wrap',
}

const ghostButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const saveButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}
