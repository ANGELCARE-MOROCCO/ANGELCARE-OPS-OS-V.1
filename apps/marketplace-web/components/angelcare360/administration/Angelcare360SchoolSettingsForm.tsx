'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Angelcare360SchoolSettingsFormProps = {
  schoolId: string
  initialValues: Record<string, unknown> | null
  canUpdate: boolean
  disabledReason?: string
}

function toString(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  return false
}

export default function Angelcare360SchoolSettingsForm({
  schoolId,
  initialValues,
  canUpdate,
  disabledReason,
}: Angelcare360SchoolSettingsFormProps) {
  const router = useRouter()
  const [isSaving, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<Record<string, unknown>>({})

  useEffect(() => {
    setFormState({
      schoolId,
      defaultLanguage: toString(initialValues?.default_language || initialValues?.defaultLanguage, 'fr'),
      defaultCurrency: toString(initialValues?.default_currency || initialValues?.defaultCurrency, 'MAD'),
      defaultTimezone: toString(initialValues?.default_timezone || initialValues?.defaultTimezone, 'Africa/Casablanca'),
      academicYearStartMonth: Number(initialValues?.academic_year_start_month || initialValues?.academicYearStartMonth || 9),
      weekStartDay: Number(initialValues?.week_start_day || initialValues?.weekStartDay || 1),
      gradingScale: toString(initialValues?.grading_scale || initialValues?.gradingScale, '0-20'),
      attendanceGraceMinutes: Number(initialValues?.attendance_grace_minutes || initialValues?.attendanceGraceMinutes || 10),
      allowParentPortal: toBoolean(initialValues?.allow_parent_portal ?? initialValues?.allowParentPortal),
      allowStudentPortal: toBoolean(initialValues?.allow_student_portal ?? initialValues?.allowStudentPortal),
      communicationSenderName: toString(initialValues?.communication_sender_name || initialValues?.communicationSenderName, ''),
      schoolYearLabelFormat: toString(initialValues?.school_year_label_format || initialValues?.schoolYearLabelFormat, 'YYYY-YYYY+1'),
      status: toString(initialValues?.status, 'active'),
    })
    setMessage(null)
    setError(null)
  }, [initialValues, schoolId])

  const updateField = (field: string, value: unknown) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const save = () => {
    if (!canUpdate) {
      setError(disabledReason || 'La mise à jour des paramètres est verrouillée.')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/angelcare360/administration', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'school-settings',
            operation: 'update',
            payload: formState,
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'L’enregistrement a échoué.')
        }
        setMessage('Paramètres de l’établissement enregistrés.')
        setError(null)
        router.refresh()
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <section style={shellStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Paramètres</div>
            <h3 style={titleStyle}>Configuration de l’établissement</h3>
            <p style={subtitleStyle}>Les réglages suivants structurent les defaults du command center et des modules futurs.</p>
          </div>
          <button type="button" onClick={save} disabled={!canUpdate || isSaving} title={disabledReason} style={!canUpdate ? disabledButtonStyle : primaryButtonStyle}>
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {error ? <div style={errorBoxStyle}>{error}</div> : null}
        {message ? <div style={successBoxStyle}>{message}</div> : null}
        {!canUpdate && disabledReason ? <div style={infoBoxStyle}>{disabledReason}</div> : null}

        <div style={gridStyle}>
          {[
            { key: 'defaultLanguage', label: 'Langue par défaut', kind: 'select', options: [['Français', 'fr'], ['Arabe', 'ar'], ['Bilingue', 'bilingual']] },
            { key: 'defaultCurrency', label: 'Devise par défaut', kind: 'select', options: [['MAD', 'MAD'], ['EUR', 'EUR'], ['USD', 'USD']] },
            { key: 'defaultTimezone', label: 'Fuseau horaire', kind: 'text' },
            { key: 'academicYearStartMonth', label: 'Mois de démarrage de l’année', kind: 'number' },
            { key: 'weekStartDay', label: 'Jour de début de semaine', kind: 'select', options: [['Lundi', '1'], ['Mardi', '2'], ['Mercredi', '3'], ['Jeudi', '4'], ['Vendredi', '5'], ['Samedi', '6'], ['Dimanche', '7']] },
            { key: 'gradingScale', label: 'Échelle de notation', kind: 'text' },
            { key: 'attendanceGraceMinutes', label: 'Tolérance de présence (minutes)', kind: 'number' },
            { key: 'communicationSenderName', label: 'Nom expéditeur communication', kind: 'text' },
            { key: 'schoolYearLabelFormat', label: "Format de libellé d'année", kind: 'text' },
          ].map((field) => (
            <label key={field.key} style={fieldStyle}>
              <span style={labelStyle}>{field.label}</span>
              {field.kind === 'select' ? (
                <select
                  value={toString(formState[field.key])}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  style={inputStyle}
                  disabled={!canUpdate}
                >
                  {(field.options || []).map(([label, value]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.kind === 'number' ? 'number' : 'text'}
                  value={toString(formState[field.key])}
                  onChange={(event) => updateField(field.key, field.kind === 'number' ? Number(event.target.value) : event.target.value)}
                  style={inputStyle}
                  disabled={!canUpdate}
                />
              )}
            </label>
          ))}

          <label style={fieldStyle}>
            <span style={labelStyle}>Autoriser le portail parent</span>
            <input
              type="checkbox"
              checked={Boolean(formState.allowParentPortal)}
              onChange={(event) => updateField('allowParentPortal', event.target.checked)}
              disabled={!canUpdate}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Autoriser le portail élève</span>
            <input
              type="checkbox"
              checked={Boolean(formState.allowStudentPortal)}
              onChange={(event) => updateField('allowStudentPortal', event.target.checked)}
              disabled={!canUpdate}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Statut</span>
            <select
              value={toString(formState.status, 'active')}
              onChange={(event) => updateField('status', event.target.value)}
              style={inputStyle}
              disabled={!canUpdate}
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="archived">Archivé</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 20,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
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
  lineHeight: 1.6,
  fontWeight: 600,
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

const infoBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: 12,
  fontWeight: 700,
  lineHeight: 1.6,
}

const errorBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#b91c1c',
  padding: 12,
  fontWeight: 700,
}

const successBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #bbf7d0',
  background: '#f0fdf4',
  color: '#166534',
  padding: 12,
  fontWeight: 700,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#64748b',
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
}

