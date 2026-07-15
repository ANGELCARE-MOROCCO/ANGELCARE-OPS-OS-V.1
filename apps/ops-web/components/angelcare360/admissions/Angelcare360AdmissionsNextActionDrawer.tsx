'use client'

import { useState } from 'react'

type Angelcare360AdmissionsNextActionDrawerProps = {
  open: boolean
  title: string
  entity: 'lead' | 'application'
  id: string
  schoolId: string
  currentNextAction?: string | null
  currentNextActionAt?: string | null
  currentResponsibleStaffId?: string | null
  onClose: () => void
  onSaved: () => void
  disabledReason?: string
}

export default function Angelcare360AdmissionsNextActionDrawer({
  open,
  title,
  entity,
  id,
  schoolId,
  currentNextAction,
  currentNextActionAt,
  currentResponsibleStaffId,
  onClose,
  onSaved,
  disabledReason,
}: Angelcare360AdmissionsNextActionDrawerProps) {
  const [nextAction, setNextAction] = useState(currentNextAction || '')
  const [nextActionAt, setNextActionAt] = useState(currentNextActionAt || '')
  const [responsibleStaffId, setResponsibleStaffId] = useState(currentResponsibleStaffId || '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/angelcare360/admissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          entity: 'next-action',
          operation: 'update',
          id,
          payload: {
            schoolId,
            entity,
            nextAction,
            nextActionAt,
            responsibleStaffId,
            notes,
          },
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || 'La sauvegarde a échoué.')
      }
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
            <div style={eyebrowStyle}>Suivi</div>
            <h3 style={titleStyle}>{title}</h3>
            <p style={subtitleStyle}>{disabledReason || 'La prochaine action sera enregistrée et auditée côté serveur.'}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>Fermer</button>
        </header>

        {error ? <div style={errorBoxStyle}>{error}</div> : null}

        <label style={fieldShellStyle}>
          <span style={labelStyle}>Prochaine action</span>
          <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} style={inputStyle} placeholder="Rappel au parent, entretien, relance, etc." />
        </label>
        <label style={fieldShellStyle}>
          <span style={labelStyle}>Échéance</span>
          <input type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldShellStyle}>
          <span style={labelStyle}>Responsable</span>
          <input value={responsibleStaffId} onChange={(event) => setResponsibleStaffId(event.target.value)} style={inputStyle} placeholder="ID du staff responsable" />
        </label>
        <label style={fieldShellStyle}>
          <span style={labelStyle}>Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} />
        </label>

        <footer style={footerStyle}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>Annuler</button>
          <button type="button" onClick={handleSubmit} disabled={submitting || Boolean(disabledReason)} title={disabledReason} style={submitting || disabledReason ? disabledButtonStyle : primaryButtonStyle}>
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
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'grid',
  placeItems: 'center',
  padding: 16,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(680px, 100%)',
  background: '#fff',
  borderRadius: 28,
  border: '1px solid #dbe4ef',
  boxShadow: '0 30px 90px rgba(15, 23, 42, 0.18)',
  padding: 22,
  display: 'grid',
  gap: 18,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
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
  fontSize: 22,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  fontWeight: 650,
  lineHeight: 1.5,
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
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  padding: 12,
  fontWeight: 700,
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

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

