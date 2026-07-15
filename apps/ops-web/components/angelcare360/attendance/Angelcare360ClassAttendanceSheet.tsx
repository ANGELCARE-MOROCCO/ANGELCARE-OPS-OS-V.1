'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { Angelcare360AttendanceSheetRecord, Angelcare360AttendanceSheetResponse } from '@/types/angelcare360/attendance'

type Angelcare360ClassAttendanceSheetProps = {
  schoolId: string
  classId: string
  date: string
  sheet: Angelcare360AttendanceSheetResponse
  canUpdate: boolean
  canApprove: boolean
}

type DraftRecord = Angelcare360AttendanceSheetRecord & { studentId: string }

const STATUS_OPTIONS: Array<[string, string]> = [
  ['present', 'Présent'],
  ['absent', 'Absent'],
  ['late', 'Retard'],
  ['excused', 'Excusé'],
  ['justified', 'Justifié'],
  ['pending_justification', 'Justification en attente'],
  ['left_early', 'Sortie anticipée'],
  ['unknown', 'Non renseigné'],
]

function emptyDraft(record: Angelcare360AttendanceSheetRecord): DraftRecord {
  return {
    ...record,
    studentId: record.studentId,
  }
}

export default function Angelcare360ClassAttendanceSheet({
  schoolId,
  classId,
  date,
  sheet,
  canUpdate,
  canApprove,
}: Angelcare360ClassAttendanceSheetProps) {
  const [drafts, setDrafts] = useState<Record<string, DraftRecord>>(() => {
    const initial: Record<string, DraftRecord> = {}
    for (const record of sheet.students) {
      initial[record.studentId] = emptyDraft(record)
    }
    return initial
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const draftRows = useMemo(() => Object.values(drafts), [drafts])

  const updateDraft = (studentId: string, patch: Partial<DraftRecord>) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        ...patch,
      },
    }))
  }

  const saveOne = (record: DraftRecord) => {
    if (!sheet.session?.id) {
      setFeedback('La session doit être ouverte avant la saisie des présences.')
      return
    }
    if (!canUpdate) {
      setFeedback('La modification des présences est verrouillée pour votre rôle.')
      return
    }

    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/attendance', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'record',
            operation: 'update',
            payload: {
              schoolId,
              attendanceSessionId: sheet.session?.id,
              studentId: record.studentId,
              attendanceStatus: record.attendanceStatus,
              minutesLate: record.minutesLate,
              note: record.note,
              justificationRequired: record.attendanceStatus === 'absent' || record.attendanceStatus === 'late',
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'La sauvegarde de la ligne a échoué.')
        }
        setFeedback(result.warning || 'Présence enregistrée avec succès.')
        globalThis.setTimeout(() => globalThis.location?.reload(), 220)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  const saveAll = () => {
    if (!sheet.session?.id) {
      setFeedback('La session doit être ouverte avant la saisie des présences.')
      return
    }
    if (!canUpdate) {
      setFeedback('La modification des présences est verrouillée pour votre rôle.')
      return
    }

    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/attendance', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'record',
            operation: 'bulk-update',
            payload: {
              schoolId,
              attendanceSessionId: sheet.session?.id,
              records: draftRows.map((record) => ({
                studentId: record.studentId,
                attendanceStatus: record.attendanceStatus,
                minutesLate: record.minutesLate,
                note: record.note,
                justificationRequired: record.attendanceStatus === 'absent' || record.attendanceStatus === 'late',
              })),
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'La sauvegarde du lot a échoué.')
        }
        setFeedback(result.warning || 'Lot de présences enregistré avec succès.')
        globalThis.setTimeout(() => globalThis.location?.reload(), 220)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div style={shellStyle}>
      <section style={sheetHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>Feuille de classe</div>
          <h2 style={titleStyle}>
            {sheet.session ? `${sheet.session.class_name || 'Classe'} · ${sheet.session.section_name || 'Section'}` : 'Session non ouverte'}
          </h2>
          <p style={subtitleStyle}>
            {sheet.session
              ? `Date ${date} · ${sheet.expectedStudents} élève(s) attendu(s) · ${sheet.markedStudents} déjà renseigné(s) · ${sheet.completionRate}% de complétude.`
              : 'Aucune session de présence n’est encore ouverte pour cette classe à la date choisie.'}
          </p>
        </div>
        <div style={sheetActionsStyle}>
          <button type="button" onClick={saveAll} disabled={!canUpdate || !sheet.session?.id} style={!canUpdate || !sheet.session?.id ? disabledButtonStyle : primaryButtonStyle}>
            Enregistrer tout
          </button>
          <Link href="/angelcare-360-command-center/presences/jour" style={secondaryButtonStyle}>
            Retour à la journée
          </Link>
        </div>
      </section>

      {feedback ? <div style={feedbackStyle}>{feedback}</div> : null}
      {isPending ? <div style={pendingStyle}>Traitement de la demande en cours…</div> : null}

      {sheet.risks.length > 0 ? (
        <section style={riskStyle}>
          <div style={riskTitleStyle}>Risques opérationnels</div>
          <ul style={riskListStyle}>
            {sheet.risks.map((risk) => (
              <li key={risk} style={riskItemStyle}>
                {risk}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!sheet.session?.id ? (
        <section style={emptyStyle}>
          <div style={emptyTitleStyle}>Session manquante</div>
          <p style={emptyTextStyle}>Ouvrez la session quotidienne depuis la vue du jour avant de renseigner cette feuille.</p>
        </section>
      ) : (
        <section style={tableShellStyle}>
          <div style={tableHeaderStyle}>
            <div>Élève</div>
            <div>Statut</div>
            <div>Minutes de retard</div>
            <div>Note</div>
            <div>Justification</div>
            <div>Action</div>
          </div>
          {sheet.students.length === 0 ? (
            <div style={emptyRowStyle}>Aucun élève n’est inscrit dans cette classe pour la période sélectionnée.</div>
          ) : (
            sheet.students.map((record) => {
              const draft = drafts[record.studentId] || emptyDraft(record)
              return (
                <div key={record.studentId} style={tableRowStyle}>
                  <div style={studentCellStyle}>
                    <div style={studentNameStyle}>{record.studentFullName}</div>
                    <div style={studentMetaStyle}>
                      {record.studentCode || '—'}
                      {record.enrollmentStatus ? ` · ${record.enrollmentStatus}` : ''}
                    </div>
                  </div>
                  <div>
                    <select
                      value={draft.attendanceStatus}
                      onChange={(event) => updateDraft(record.studentId, { attendanceStatus: event.target.value })}
                      disabled={!canUpdate}
                      style={selectStyle}
                    >
                      {STATUS_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={0}
                      value={draft.minutesLate ?? ''}
                      onChange={(event) => updateDraft(record.studentId, { minutesLate: event.target.value === '' ? null : Number(event.target.value) })}
                      disabled={!canUpdate}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={draft.note || ''}
                      onChange={(event) => updateDraft(record.studentId, { note: event.target.value })}
                      disabled={!canUpdate}
                      placeholder="Note, motif, précision"
                      style={inputStyle}
                    />
                  </div>
                  <div style={justificationCellStyle}>
                    <div style={justificationStateStyle}>{record.justificationStatus || 'Aucune'}</div>
                    <div style={justificationIdStyle}>{record.justificationId ? `#${record.justificationId}` : '—'}</div>
                  </div>
                  <div style={actionCellStyle}>
                    <button type="button" onClick={() => saveOne(draft)} disabled={!canUpdate} style={!canUpdate ? disabledButtonStyle : secondaryButtonStyle}>
                      Enregistrer
                    </button>
                    {record.attendanceRecordId ? (
                      <div style={recordStateStyle}>{record.attendanceStatus}</div>
                    ) : (
                      <div style={recordStateStyle}>Nouveau</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {!canApprove ? (
        <div style={lockedStyle}>La clôture et les corrections avancées restent verrouillées pour votre rôle.</div>
      ) : null}
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const sheetHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 40px rgba(15,23,42,.05)',
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
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const sheetActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 850,
  cursor: 'not-allowed',
}

const feedbackStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #bae6fd',
  background: '#f0f9ff',
  color: '#075985',
  padding: '12px 14px',
  fontWeight: 700,
}

const pendingStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  color: '#475569',
  padding: '12px 14px',
  fontWeight: 700,
}

const riskStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #fde68a',
  background: '#fffbeb',
  padding: 16,
}

const riskTitleStyle: React.CSSProperties = {
  color: '#92400e',
  fontWeight: 900,
  marginBottom: 8,
}

const riskListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 6,
  color: '#78350f',
  fontWeight: 600,
}

const riskItemStyle: React.CSSProperties = {
  lineHeight: 1.5,
}

const emptyStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 18,
}

const emptyTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

const tableShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr 1fr',
  gap: 10,
  padding: '0 8px',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr 1fr',
  gap: 10,
  padding: 12,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  alignItems: 'start',
}

const emptyRowStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 18,
  color: '#475569',
  fontWeight: 700,
}

const studentCellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const studentNameStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const studentMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const justificationCellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const justificationStateStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
}

const justificationIdStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const actionCellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const recordStateStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 12,
  fontWeight: 700,
}

const lockedStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  padding: 14,
  color: '#475569',
  fontWeight: 700,
}
