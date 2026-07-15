'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { Angelcare360AttendanceDayClassRecord, Angelcare360AttendanceDayState } from '@/types/angelcare360/attendance'

type Angelcare360DailyAttendanceBoardProps = {
  schoolId: string
  academicYearId: string
  dayState: Angelcare360AttendanceDayState
  canCreateSession: boolean
  canApproveSession: boolean
}

function isClosed(status?: string | null) {
  return status === 'closed' || status === 'locked'
}

export default function Angelcare360DailyAttendanceBoard({
  schoolId,
  academicYearId,
  dayState,
  canCreateSession,
  canApproveSession,
}: Angelcare360DailyAttendanceBoardProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const contextSummary = useMemo(() => {
    return `${dayState.classes.length} classe(s) prête(s) · ${dayState.sessions.length} session(s) ouverte(s)`
  }, [dayState.classes.length, dayState.sessions.length])

  const submitMutation = (entity: string, operation: string, payload: Record<string, unknown>) => {
    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/attendance', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity,
            operation,
            payload,
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'L’action de présence a échoué.')
        }
        setFeedback(result.warning || 'Action de présence exécutée avec succès.')
        globalThis.setTimeout(() => {
          globalThis.location?.reload()
        }, 200)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  const openSession = (item: Angelcare360AttendanceDayClassRecord) => {
    if (!canCreateSession) {
      setFeedback('La création de session est verrouillée pour votre rôle.')
      return
    }

    submitMutation('session', 'open', {
      schoolId,
      academicYearId,
      classId: item.classId,
      sectionId: item.sectionId || null,
      sessionDate: dayState.selectedDate,
      sessionKey: 'daily',
      sessionStatus: 'open',
      notes: `Session ouverte pour ${item.className}${item.sectionName ? ` / ${item.sectionName}` : ''}.`,
    })
  }

  const closeSession = (sessionId: string) => {
    if (!canApproveSession) {
      setFeedback('La clôture de session est réservée aux rôles autorisés.')
      return
    }

    submitMutation('session', 'close', {
      schoolId,
      attendanceSessionId: sessionId,
      notes: 'Clôture de la session quotidienne.',
    })
  }

  return (
    <div style={shellStyle}>
      <section style={summaryGridStyle}>
        <article style={kpiCardStyle}>
          <div style={kpiLabelStyle}>Élèves attendus</div>
          <div style={kpiValueStyle}>{dayState.totalExpectedStudents}</div>
          <div style={kpiNoteStyle}>Base calculée à partir des inscriptions actives.</div>
        </article>
        <article style={kpiCardStyle}>
          <div style={kpiLabelStyle}>Élèves marqués</div>
          <div style={kpiValueStyle}>{dayState.totalMarkedStudents}</div>
          <div style={kpiNoteStyle}>Présences effectivement renseignées.</div>
        </article>
        <article style={kpiCardStyle}>
          <div style={kpiLabelStyle}>Complétude</div>
          <div style={kpiValueStyle}>{dayState.totalCompletionRate}%</div>
          <div style={kpiNoteStyle}>Mesurée sur les classes préparées aujourd’hui.</div>
        </article>
      </section>

      {feedback ? <div style={feedbackStyle}>{feedback}</div> : null}
      {isPending ? <div style={pendingStyle}>Traitement de la demande en cours…</div> : null}

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Présence du jour</div>
            <h2 style={panelTitleStyle}>Sessions et feuilles du {dayState.selectedDate}</h2>
          </div>
          <div style={panelMetaStyle}>{contextSummary}</div>
        </div>

        {dayState.classes.length === 0 ? (
          <div style={emptyStyle}>Aucune classe n’est prête pour la présence du jour.</div>
        ) : (
          <div style={cardsGridStyle}>
            {dayState.classes.map((item) => (
              <article key={`${item.classId}-${item.sectionId || 'all'}`} style={classCardStyle}>
                <div style={classHeaderStyle}>
                  <div>
                    <div style={classLabelStyle}>{item.classCode || item.className}</div>
                    <div style={classTitleStyle}>
                      {item.className}
                      {item.sectionName ? ` · ${item.sectionName}` : ''}
                    </div>
                  </div>
                  <div style={statusPillStyle}>{item.hasSession ? (isClosed(item.sessionStatus) ? 'Clôturée' : 'Ouverte') : 'À ouvrir'}</div>
                </div>

                <div style={metricsRowStyle}>
                  <span>Attendus {item.expectedStudents}</span>
                  <span>Marqués {item.markedStudents}</span>
                  <span>Complétude {item.completionRate}%</span>
                </div>

                <div style={actionsRowStyle}>
                  <Link href={item.detailHref} style={linkStyle}>
                    Ouvrir la feuille
                  </Link>
                  {!item.hasSession ? (
                    <button type="button" onClick={() => openSession(item)} disabled={!canCreateSession} style={!canCreateSession ? disabledButtonStyle : actionButtonStyle}>
                      Ouvrir la session
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => closeSession(String(item.sessionId || ''))}
                      disabled={!canApproveSession || isClosed(item.sessionStatus)}
                      title={!canApproveSession ? 'La clôture requiert une autorisation.' : isClosed(item.sessionStatus) ? 'La session est déjà clôturée.' : undefined}
                      style={!canApproveSession || isClosed(item.sessionStatus) ? disabledButtonStyle : actionButtonStyle}
                    >
                      Clôturer
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const kpiCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 40px rgba(15,23,42,.05)',
  padding: 18,
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const kpiValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 950,
}

const kpiNoteStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#475569',
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 600,
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

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 950,
}

const panelMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const emptyStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 18,
  color: '#475569',
  fontWeight: 700,
}

const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
}

const classCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  display: 'grid',
  gap: 12,
}

const classHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'start',
}

const classLabelStyle: React.CSSProperties = {
  color: '#2563eb',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.9,
  fontWeight: 900,
}

const classTitleStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 900,
}

const statusPillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const metricsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const actionButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
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

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}
