'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Angelcare360PortalKind,
  Angelcare360PortalRecord,
} from '@/types/angelcare360/role-portals'

type PortalAction =
  | 'assignment.create'
  | 'submission.grade'
  | 'comment.create'
  | 'request.create'
  | 'attendance.justify'
  | 'assignment.submit'
  | 'leave.request'

type ActionResponse = {
  ok?: boolean
  error?: string
}

type ActionSnapshot = Record<string, unknown>

function records(
  snapshot: ActionSnapshot,
  key: string,
): Angelcare360PortalRecord[] {
  const value = snapshot[key]

  return Array.isArray(value)
    ? value as Angelcare360PortalRecord[]
    : []
}

function idempotency(
  kind: Angelcare360PortalKind,
  action: PortalAction,
) {
  return `${kind}:${action}:${crypto.randomUUID()}`
}

export default function PortalActionPanel({
  kind,
  view,
  snapshot,
}: {
  kind: Angelcare360PortalKind
  view: string
  snapshot: ActionSnapshot
}) {
  const router = useRouter()

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const action = useMemo<PortalAction | null>(() => {
    if (kind === 'teacher' && view === 'homework') return 'assignment.create'
    if (kind === 'teacher' && view === 'submissions') return 'submission.grade'
    if (kind === 'teacher' && view === 'bulletins') return 'comment.create'
    if (kind === 'parent' && view === 'requests') return 'request.create'
    if (kind === 'parent' && view === 'attendance') return 'attendance.justify'
    if (kind === 'student' && view === 'submissions') return 'assignment.submit'
    if (kind === 'staff' && view === 'leave') return 'leave.request'
    return null
  }, [kind, view])

  if (!action) return null

  const actionKey = action

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const form = new FormData(event.currentTarget)

      const body: Record<string, FormDataEntryValue> =
        Object.fromEntries(form.entries())

      const response = await fetch(
        '/api/angelcare360/portal-actions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...body,
            kind,
            action: actionKey,
            idempotencyKey:
              idempotency(kind, actionKey),
          }),
        },
      )

      const payload = await response
        .json()
        .catch(() => ({})) as ActionResponse

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error || 'Action impossible.',
        )
      }

      setMessage('Action enregistrée et tracée.')
      event.currentTarget.reset()
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Action impossible.',
      )
    } finally {
      setBusy(false)
    }
  }

  const classes = records(snapshot, 'classes')
  const subjects = records(snapshot, 'subjects')
  const submissions = records(snapshot, 'submissions')
  const students = records(snapshot, 'students')
  const attendance = records(snapshot, 'attendance')
  const assignments = records(snapshot, 'assignments')

  return (
    <section style={box}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 950,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          color: '#2d64b0',
        }}
      >
        Action opérationnelle
      </div>

      <h2
        style={{
          fontSize: 18,
          margin: '6px 0 11px',
          color: '#153052',
        }}
      >
        {title(actionKey)}
      </h2>

      <form
        onSubmit={submit}
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(180px,1fr))',
          gap: 9,
        }}
      >
        {actionKey === 'assignment.create' ? (
          <>
            <select required name="classId" style={input} defaultValue="">
              <option value="" disabled>Classe</option>
              {classes.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.classId || row.id)}
                >
                  {row.title}
                </option>
              ))}
            </select>

            <select required name="subjectId" style={input} defaultValue="">
              <option value="" disabled>Matière</option>
              {subjects.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.subjectId || row.id)}
                >
                  {row.title}
                </option>
              ))}
            </select>

            <input required name="title" placeholder="Titre du devoir" style={input} />
            <input required name="dueOn" type="date" style={input} />
            <input name="maxScore" type="number" min="1" max="100" defaultValue="20" style={input} />
            <input name="description" placeholder="Consigne" style={input} />
          </>
        ) : null}

        {actionKey === 'submission.grade' ? (
          <>
            <select required name="submissionId" style={input} defaultValue="">
              <option value="" disabled>Soumission</option>
              {submissions.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.submissionId || row.id)}
                >
                  {row.title} · {row.subtitle || ''}
                </option>
              ))}
            </select>

            <input
              required
              name="score"
              type="number"
              min="0"
              step="0.25"
              placeholder="Score"
              style={input}
            />
          </>
        ) : null}

        {actionKey === 'comment.create' ? (
          <>
            <select required name="studentId" style={input} defaultValue="">
              <option value="" disabled>Élève</option>
              {students.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.studentId || row.id)}
                >
                  {row.title}
                </option>
              ))}
            </select>

            <select required name="classId" style={input} defaultValue="">
              <option value="" disabled>Classe</option>
              {classes.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.classId || row.id)}
                >
                  {row.title}
                </option>
              ))}
            </select>

            <input
              required
              name="comment"
              placeholder="Appréciation"
              style={input}
            />
          </>
        ) : null}

        {actionKey === 'request.create' ? (
          <>
            <input
              required
              name="subject"
              placeholder="Objet de la demande"
              style={input}
            />

            <select name="relatedEntityType" style={input}>
              <option value="operations">Vie scolaire</option>
              <option value="attendance">Présence</option>
              <option value="transport">Transport</option>
              <option value="finance">Finance</option>
            </select>

            <select name="priority" style={input}>
              <option value="medium">Normale</option>
              <option value="high">Prioritaire</option>
            </select>

            <input
              required
              name="description"
              placeholder="Description"
              style={input}
            />
          </>
        ) : null}

        {actionKey === 'attendance.justify' ? (
          <>
            <select required name="recordId" style={input} defaultValue="">
              <option value="" disabled>Événement de présence</option>
              {attendance.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.recordId || row.id)}
                >
                  {row.title} · {row.subtitle || row.status || ''}
                </option>
              ))}
            </select>

            <select name="reasonCategory" style={input}>
              <option value="family">Familial</option>
              <option value="medical">Médical</option>
              <option value="transport">Transport</option>
            </select>

            <input
              required
              name="description"
              placeholder="Justification"
              style={input}
            />
          </>
        ) : null}

        {actionKey === 'assignment.submit' ? (
          <>
            <select required name="assignmentId" style={input} defaultValue="">
              <option value="" disabled>Devoir</option>
              {assignments.map((row) => (
                <option
                  key={row.id}
                  value={String(row.meta?.assignmentId || row.id)}
                >
                  {row.title} · {row.date || ''}
                </option>
              ))}
            </select>

            <input
              name="note"
              placeholder="Note accompagnant la remise"
              style={input}
            />
          </>
        ) : null}

        {actionKey === 'leave.request' ? (
          <>
            <input required name="startsOn" type="date" style={input} />
            <input required name="endsOn" type="date" style={input} />
            <input required name="reason" placeholder="Motif du congé" style={input} />
          </>
        ) : null}

        <button
          disabled={busy}
          type="submit"
          style={button}
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      {error ? (
        <div
          style={{
            marginTop: 9,
            color: '#a8323e',
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          style={{
            marginTop: 9,
            color: '#087151',
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {message}
        </div>
      ) : null}
    </section>
  )
}

function title(action: PortalAction) {
  const labels: Record<PortalAction, string> = {
    'assignment.create': 'Publier un devoir',
    'submission.grade': 'Corriger une soumission',
    'comment.create': 'Ajouter une appréciation',
    'request.create': 'Créer une demande',
    'attendance.justify': 'Justifier une absence ou un retard',
    'assignment.submit': 'Enregistrer ma remise',
    'leave.request': 'Demander un congé',
  }

  return labels[action]
}

const box: React.CSSProperties = {
  margin: '16px 0',
  padding: 17,
  border: '1px solid #dce6f2',
  borderRadius: 20,
  background: 'linear-gradient(135deg,#fff,#f7faff)',
  boxShadow: '0 10px 30px rgba(31,56,87,.05)',
}

const input: React.CSSProperties = {
  border: '1px solid #d8e2ee',
  borderRadius: 12,
  padding: '10px 11px',
  background: '#fff',
  color: '#18314f',
  fontSize: 12,
}

const button: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: '10px 13px',
  background: '#1f5fb8',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
}
