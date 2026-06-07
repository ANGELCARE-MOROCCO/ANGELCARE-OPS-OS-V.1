'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type AnyRecord = Record<string, any>

function read(record: AnyRecord | null, keys: string[], fallback = '—') {
  if (!record) return fallback
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return fallback
}

function readList(record: AnyRecord | null, keys: string[]) {
  if (!record) return []
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) return value
  }
  return []
}

function readNumber(record: AnyRecord | null, keys: string[], fallback = 0) {
  if (!record) return fallback
  for (const key of keys) {
    const value = Number(record[key])
    if (Number.isFinite(value)) return value
  }
  return fallback
}

function unwrap(payload: AnyRecord) {
  return payload?.cohort || payload?.data || payload?.item || payload?.record || payload
}

function safeDate(value: string) {
  if (!value || value === '—') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-MA')
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—'
}

function normalizeStatus(value: string) {
  const lower = value.toLowerCase()
  if (lower.includes('pending')) return 'PENDING'
  if (lower.includes('approved')) return 'APPROVED'
  if (lower.includes('enrolled')) return 'ENROLLED'
  if (lower.includes('active')) return 'ENROLLED'
  return value && value !== '—' ? value.toUpperCase() : 'EMPTY'
}

export default function AcademyCohortManifestPrintPage() {
  const params = useParams()
  const id = String(params?.id || '')

  const [cohort, setCohort] = useState<AnyRecord | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadCohort() {
      try {
        const response = await fetch(`/api/academy/cohorts/${id}`, { cache: 'no-store' })
        const raw = await response.text()

        let json: AnyRecord = {}
        try {
          json = raw ? JSON.parse(raw) : {}
        } catch {
          json = { ok: false, error: raw || 'Invalid server response' }
        }

        if (!response.ok || json?.ok === false) {
          throw new Error(json?.error || `Unable to load cohort ${id}`)
        }

        const record = unwrap(json)
        if (!record || typeof record !== 'object') throw new Error('Cohort record is empty')

        if (active) setCohort(record)
      } catch (err: any) {
        if (active) setError(err?.message || 'Unable to load cohort')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCohort()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => window.print(), 900)
      return () => window.clearTimeout(timer)
    }
  }, [loading])

  const participants = useMemo(
    () => readList(cohort, ['participants', 'cohort_participants', 'roster']),
    [cohort],
  )

  const capacity = Math.max(1, readNumber(cohort, ['capacity', 'seat_capacity'], 20))
  const durationDays = Math.max(
    1,
    Math.min(31, readNumber(cohort, ['duration_days', 'durationDays'], 15)),
  )

  const reservedRows = useMemo(() => {
    return Array.from({ length: capacity }).map((_, index) => {
      const participant = participants[index] || null
      const name = participant
        ? read(participant, ['name', 'participant_name', 'trainee_name', 'full_name'], '—')
        : '—'
      const status = participant
        ? normalizeStatus(read(participant, ['status'], 'ENROLLED'))
        : 'EMPTY'

      return {
        slot: index + 1,
        participant,
        name,
        status,
      }
    })
  }, [capacity, participants])

  const dayColumns = useMemo(
    () => Array.from({ length: durationDays }).map((_, index) => `D${index + 1}`),
    [durationDays],
  )

  const usedSeats = participants.length
  const availableSeats = Math.max(0, capacity - usedSeats)
  const readiness = readNumber(cohort, ['readiness_score', 'readiness'], 0)
  const progression = readNumber(cohort, ['progression_percent', 'progression'], 0)
  const attendanceHealth = readNumber(cohort, ['attendance_health', 'attendance_health_percent'], 0)

  if (loading) {
    return (
      <main className="loading-screen">
        <PrintStyles />
        Loading Academy Cohort Manifest…
      </main>
    )
  }

  if (error || !cohort) {
    return (
      <main className="print-root">
        <PrintStyles />
        <div className="no-print print-actions">
          <a href="/academy/cohorts">Back</a>
          <button type="button" onClick={() => window.print()}>Print</button>
        </div>

        <section className="a4-landscape">
          <header className="doc-header">
            <div className="brand-block">
              <div className="brand-mark">A</div>
              <div>
                <strong>ANGELCARE</strong>
                <span>ACADEMY OS</span>
              </div>
            </div>
            <div className="title-block">
              <h1>COHORT TECHNICAL SHEET</h1>
              <p>Live Group / Cohort Record</p>
            </div>
            <div className="reference-card">
              <span>REFERENCE NUMBER</span>
              <strong>COH-{id}</strong>
              <div className="qr-box">QR</div>
            </div>
          </header>

          <div className="error-box">
            <strong>Unable to load cohort manifest.</strong>
            <p>{error || `No cohort record found for ID ${id}`}</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="print-root">
      <PrintStyles />

      <div className="no-print print-actions">
        <a href="/academy/cohorts">Back to Cohorts</a>
        <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <section className="a4-landscape">
        <header className="doc-header">
          <div className="brand-block">
            <div className="brand-mark">A</div>
            <div>
              <strong>ANGELCARE</strong>
              <span>ACADEMY OS</span>
            </div>
          </div>

          <div className="title-block">
            <h1>COHORT TECHNICAL SHEET</h1>
            <p>Live Group / Cohort Record</p>
          </div>

          <div className="reference-card">
            <span>REFERENCE NUMBER</span>
            <strong>{read(cohort, ['reference_number', 'reference', 'cohort_reference'], `COH-${id}`)}</strong>
            <div className="qr-box">QR</div>
          </div>
        </header>

        <section className="meta-strip">
          <div className="meta-item">
            <div className="meta-icon purple">▣</div>
            <div>
              <span>GENERATED AT</span>
              <strong>{new Date().toLocaleDateString('fr-MA')} · {new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>

          <div className="meta-item">
            <div className="meta-icon indigo">●</div>
            <div>
              <span>GENERATED BY</span>
              <strong>System User · Academy OS</strong>
            </div>
          </div>

          <div className="meta-item">
            <div className="meta-icon green">✓</div>
            <div>
              <span>COHORT STATUS</span>
              <strong className="status-pill">{read(cohort, ['status'], 'Planned')}</strong>
            </div>
          </div>
        </section>

        <section className="top-grid">
          <div className="panel core-panel">
            <h2><span>1.</span> COHORT CORE CONTROL</h2>
            <div className="data-grid">
              <label>Cohort Title</label>
              <strong>{read(cohort, ['title', 'cohort_title', 'name'])}</strong>

              <label>Linked Program</label>
              <strong>
                {read(cohort, ['program_title', 'program_name', 'program_label'])}
                <small>{read(cohort, ['program_reference', 'program_ref'], '')}</small>
              </strong>

              <label>Trainer</label>
              <strong>{read(cohort, ['trainer_name', 'trainer_label', 'trainer'])}</strong>

              <label>Start Date</label>
              <strong>{safeDate(read(cohort, ['start_date', 'starts_at']))}</strong>

              <label>End Date</label>
              <strong>{safeDate(read(cohort, ['end_date', 'ends_at']))}</strong>

              <label>Capacity</label>
              <strong>{capacity} Seats</strong>

              <label>Status</label>
              <strong><em>{read(cohort, ['status'], 'Planned')}</em></strong>

              <label>Operational Notes</label>
              <strong>{read(cohort, ['notes', 'operational_notes'], '—')}</strong>
            </div>
          </div>

          <div className="panel summary-panel">
            <h2><span>2.</span> COHORT MANIFEST SUMMARY</h2>
            <div className="data-grid compact">
              <label>Reference</label>
              <strong>{read(cohort, ['reference_number', 'reference', 'cohort_reference'], `COH-${id}`)}</strong>

              <label>Program</label>
              <strong>{read(cohort, ['program_title', 'program_name', 'program_label'])}</strong>

              <label>Trainer</label>
              <strong>{read(cohort, ['trainer_name', 'trainer_label', 'trainer'])}</strong>

              <label>Dates</label>
              <strong>{safeDate(read(cohort, ['start_date', 'starts_at']))} → {safeDate(read(cohort, ['end_date', 'ends_at']))}</strong>
            </div>

            <div className="summary-metrics">
              <div>
                <span>Available Seats</span>
                <strong>{availableSeats}</strong>
                <small>/ {capacity}</small>
              </div>
              <div>
                <span>Readiness</span>
                <strong>{readiness}%</strong>
              </div>
              <div>
                <span>Progression</span>
                <strong>{progression}%</strong>
              </div>
            </div>
          </div>

          <aside className="side-metrics">
            <div className="side-card">
              <span>Available Seats</span>
              <strong>{availableSeats}</strong>
              <small>/ {capacity}</small>
            </div>
            <div className="side-card purple">
              <span>Readiness</span>
              <strong>{readiness}%</strong>
              <small>{readiness >= 80 ? 'High readiness' : 'Low readiness'}</small>
            </div>
            <div className="side-card amber">
              <span>Progression</span>
              <strong>{progression}%</strong>
              <small>{progression > 0 ? 'In progress' : 'Not started'}</small>
            </div>
            <div className="side-card green">
              <span>Attendance Health</span>
              <strong>{attendanceHealth ? `${attendanceHealth}%` : 'N/A'}</strong>
              <small>{attendanceHealth ? 'Tracked' : 'No data yet'}</small>
            </div>
          </aside>
        </section>

        <section className="panel manifest-panel">
          <h2><span>3.</span> PARTICIPANT MANIFEST / ATTENDANCE TRACKING</h2>

          <table className="attendance-table">
            <thead>
              <tr>
                <th className="slot-col">#</th>
                <th className="name-col">Participant Name</th>
                <th className="status-col">Status</th>
                {dayColumns.map((day) => (
                  <th className="day-col" key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservedRows.map((row) => (
                <tr key={`slot-${row.slot}`} className={!row.participant ? 'empty-row' : ''}>
                  <td>{row.slot}</td>
                  <td>
                    <div className="participant-cell">
                      <span className={!row.participant ? 'avatar empty' : 'avatar'}>
                        {row.participant ? initials(row.name) : '—'}
                      </span>
                      <strong>{row.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`participant-status ${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  {dayColumns.map((day) => (
                    <td className="day-cell" key={`${row.slot}-${day}`}>
                      <span className="mark-box" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="legend">
            <span><i className="dot green-dot" /> ENROLLED</span>
            <span><i className="dot amber-dot" /> PENDING</span>
            <span><i className="dot blue-dot" /> APPROVED</span>
            <span><i className="dot gray-dot" /> EMPTY / RESERVED SLOT</span>
          </div>
        </section>

        <section className="panel checklist-panel">
          <h2><span>4.</span> FINAL CHECKLIST & READINESS VALIDATION</h2>
          <div className="check-grid">
            <Check label="Program validated" />
            <Check label="Trainer assigned" />
            <Check label="Participants confirmed" />
            <Check label="Schedule ready" />
            <Check label="Learning resources shared" />
            <Check label="Attendance sheet ready" />
            <Check label="Documents complete" />
            <Check label="Launch approved" />
          </div>
        </section>

        <section className="approval-grid">
          <ApprovalBox
            title="SUPERVISOR / ADMIN APPROVAL"
            role="Training Operations Manager"
            tone="blue"
          />
          <ApprovalBox
            title="TRAINER APPROVAL"
            role="Lead Trainer"
            tone="purple"
          />
          <ApprovalBox
            title="OPERATIONS FINAL VALIDATION"
            role="Training Operations Lead"
            tone="green"
          />
        </section>

        <footer className="doc-footer">
          <span>AngelCare Academy OS · Cohort Technical Sheet</span>
          <span>Page 1 of 1</span>
        </footer>
      </section>
    </main>
  )
}

function Check({ label }: { label: string }) {
  return (
    <div className="check-card">
      <span className="checkbox" />
      <strong>{label}</strong>
    </div>
  )
}

function ApprovalBox({
  title,
  role,
  tone,
}: {
  title: string
  role: string
  tone: 'blue' | 'purple' | 'green'
}) {
  return (
    <div className={`approval-card ${tone}`}>
      <h3>{title}</h3>
      <div className="approval-data">
        <label>Name</label>
        <span>________________________</span>

        <label>Role</label>
        <strong>{role}</strong>

        <label>Date</label>
        <span>____ / ____ / ______</span>

        <label>Signature</label>
        <span className="signature-line">________________________</span>

        <label>Status</label>
        <em>PENDING</em>
      </div>
    </div>
  )
}

function PrintStyles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        background: #e5e7eb;
        color: #0f172a;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .loading-screen {
        padding: 48px;
        font-weight: 900;
      }

      .print-actions {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        gap: 10px;
        padding: 10px;
        border-radius: 18px;
        border: 1px solid #e5e7eb;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 22px 60px rgba(15, 23, 42, 0.25);
        backdrop-filter: blur(16px);
      }

      .print-actions a,
      .print-actions button {
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: white;
        color: #111827;
        padding: 10px 14px;
        font-weight: 950;
        text-decoration: none;
        cursor: pointer;
      }

      .print-actions button {
        background: #111827;
        border-color: #111827;
        color: white;
      }

      .a4-landscape {
        width: 297mm;
        min-height: 210mm;
        margin: 16px auto;
        padding: 9mm;
        background:
          radial-gradient(circle at top right, rgba(79, 70, 229, 0.07), transparent 24%),
          white;
        box-shadow: 0 24px 90px rgba(15, 23, 42, 0.28);
      }

      .doc-header {
        display: grid;
        grid-template-columns: 55mm 1fr 66mm;
        align-items: center;
        gap: 18px;
        padding-bottom: 9px;
        border-bottom: 3px solid #c7d2fe;
      }

      .brand-block {
        display: flex;
        align-items: center;
        gap: 12px;
        border-right: 1px solid #cbd5e1;
        padding-right: 16px;
      }

      .brand-mark {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        color: #1d4ed8;
        font-size: 38px;
        font-weight: 950;
      }

      .brand-block strong {
        display: block;
        letter-spacing: 0.18em;
        color: #2563eb;
        font-size: 14px;
      }

      .brand-block span {
        display: block;
        margin-top: 4px;
        letter-spacing: 0.36em;
        color: #111827;
        font-size: 9px;
        font-weight: 950;
      }

      .title-block h1 {
        margin: 0;
        color: #0f172a;
        letter-spacing: 0.05em;
        font-size: 24px;
        font-weight: 950;
      }

      .title-block p {
        margin: 6px 0 0;
        color: #475569;
        font-size: 13px;
        font-weight: 700;
      }

      .reference-card {
        position: relative;
        border: 1px solid #a5b4fc;
        border-radius: 12px;
        padding: 12px 54px 12px 16px;
        background: #f8fafc;
      }

      .reference-card span {
        color: #4f46e5;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.08em;
      }

      .reference-card strong {
        display: block;
        margin-top: 6px;
        color: #312e81;
        font-size: 19px;
      }

      .qr-box {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        color: #111827;
        background:
          linear-gradient(90deg, #111827 50%, transparent 0) 0 0 / 8px 8px,
          linear-gradient(#111827 50%, transparent 0) 0 0 / 8px 8px,
          #fff;
        border: 1px solid #111827;
        font-size: 0;
      }

      .meta-strip {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
        padding: 10px 0;
        border-bottom: 1px solid #cbd5e1;
        margin-bottom: 10px;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .meta-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        border: 2px solid currentColor;
        font-weight: 950;
      }

      .meta-icon.purple { color: #7c3aed; }
      .meta-icon.indigo { color: #4f46e5; }
      .meta-icon.green { color: #16a34a; }

      .meta-item span {
        display: block;
        color: #64748b;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.08em;
      }

      .meta-item strong {
        display: block;
        margin-top: 4px;
        font-size: 12px;
      }

      .status-pill {
        display: inline-flex !important;
        width: fit-content;
        border: 1px solid #86efac;
        border-radius: 999px;
        padding: 3px 10px;
        background: #dcfce7;
        color: #166534;
        text-transform: uppercase;
      }

      .top-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr 0.42fr;
        gap: 9px;
        margin-bottom: 9px;
      }

      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: rgba(255,255,255,0.96);
        padding: 10px;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .panel h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 9px;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.05em;
      }

      .panel h2 span {
        color: #4f46e5;
      }

      .data-grid {
        display: grid;
        grid-template-columns: 34% 66%;
        gap: 6px 10px;
        font-size: 11px;
      }

      .data-grid.compact {
        grid-template-columns: 32% 68%;
      }

      .data-grid label {
        color: #64748b;
        font-weight: 800;
      }

      .data-grid strong {
        color: #0f172a;
        font-weight: 950;
      }

      .data-grid small {
        display: block;
        margin-top: 3px;
        color: #475569;
        font-size: 10px;
      }

      .data-grid em {
        display: inline-flex;
        width: fit-content;
        min-width: 70px;
        justify-content: center;
        border-radius: 999px;
        background: #e0e7ff;
        color: #3730a3;
        padding: 2px 9px;
        font-style: normal;
        text-transform: uppercase;
      }

      .summary-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
        margin-top: 10px;
      }

      .summary-metrics div {
        border: 1px solid #ddd6fe;
        border-radius: 10px;
        background: #f8f7ff;
        padding: 9px;
      }

      .summary-metrics span {
        display: block;
        color: #0f172a;
        font-size: 10px;
        font-weight: 850;
      }

      .summary-metrics strong {
        display: inline-block;
        margin-top: 6px;
        color: #4f46e5;
        font-size: 24px;
      }

      .summary-metrics small {
        margin-left: 4px;
        color: #475569;
      }

      .side-metrics {
        display: grid;
        gap: 8px;
      }

      .side-card {
        min-height: 33mm;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #f8fafc;
        padding: 10px;
      }

      .side-card span {
        display: block;
        color: #0f172a;
        font-size: 11px;
        font-weight: 900;
      }

      .side-card strong {
        display: inline-block;
        margin-top: 8px;
        color: #4f46e5;
        font-size: 27px;
      }

      .side-card small {
        display: block;
        margin-top: 5px;
        color: #475569;
        font-size: 10px;
      }

      .side-card.purple { background: #f5f3ff; }
      .side-card.amber { background: #fffbeb; }
      .side-card.green { background: #f0fdf4; }

      .manifest-panel {
        margin-bottom: 9px;
      }

      .attendance-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 8.7px;
      }

      .attendance-table th,
      .attendance-table td {
        border: 1px solid #e2e8f0;
        padding: 3px 4px;
        vertical-align: middle;
      }

      .attendance-table th {
        color: #1d4ed8;
        background: #f8fafc;
        font-weight: 950;
        text-align: center;
      }

      .attendance-table .slot-col {
        width: 8mm;
      }

      .attendance-table .name-col {
        width: 45mm;
        text-align: left;
      }

      .attendance-table .status-col {
        width: 25mm;
      }

      .attendance-table .day-col {
        width: 8mm;
      }

      .participant-cell {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .participant-cell strong {
        overflow: hidden;
        color: #111827;
        font-size: 8.8px;
        font-weight: 950;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .avatar {
        width: 18px;
        height: 18px;
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 999px;
        background: #dbeafe;
        color: #2563eb;
        font-size: 7px;
        font-weight: 950;
      }

      .avatar.empty {
        background: #f1f5f9;
        color: #94a3b8;
      }

      .participant-status {
        display: inline-flex;
        justify-content: center;
        width: 100%;
        border-radius: 999px;
        padding: 2px 5px;
        background: #f1f5f9;
        color: #475569;
        font-size: 7px;
        font-weight: 950;
      }

      .participant-status.enrolled {
        background: #dcfce7;
        color: #166534;
      }

      .participant-status.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .participant-status.approved {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .participant-status.empty {
        background: #f8fafc;
        color: #94a3b8;
      }

      .empty-row td {
        color: #94a3b8;
      }

      .day-cell {
        text-align: center;
      }

      .mark-box {
        display: inline-block;
        width: 8px;
        height: 8px;
        border: 1.4px solid #94a3b8;
        border-radius: 2px;
        background: white;
      }

      .legend {
        display: flex;
        align-items: center;
        gap: 30px;
        margin-top: 7px;
        padding-left: 8px;
        color: #475569;
        font-size: 8px;
        font-weight: 800;
      }

      .dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        margin-right: 6px;
      }

      .green-dot { background: #16a34a; }
      .amber-dot { background: #f97316; }
      .blue-dot { background: #2563eb; }
      .gray-dot { background: #64748b; }

      .checklist-panel {
        margin-bottom: 9px;
      }

      .check-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 7px;
      }

      .check-card {
        display: flex;
        align-items: center;
        gap: 7px;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
        padding: 7px;
        background: #fff;
      }

      .checkbox {
        width: 12px;
        height: 12px;
        border: 1.5px solid #94a3b8;
        border-radius: 3px;
        background: white;
      }

      .check-card strong {
        color: #0f172a;
        font-size: 10px;
        font-weight: 950;
      }

      .approval-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 9px;
        margin-bottom: 9px;
      }

      .approval-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 10px;
        min-height: 33mm;
        background: #fff;
      }

      .approval-card.blue {
        background: #f8fbff;
        border-color: #bfdbfe;
      }

      .approval-card.purple {
        background: #faf5ff;
        border-color: #ddd6fe;
      }

      .approval-card.green {
        background: #f0fdf4;
        border-color: #bbf7d0;
      }

      .approval-card h3 {
        margin: 0 0 8px;
        color: #1d4ed8;
        font-size: 11px;
        font-weight: 950;
      }

      .approval-card.green h3 {
        color: #15803d;
      }

      .approval-data {
        display: grid;
        grid-template-columns: 19mm 1fr;
        gap: 4px 8px;
        font-size: 9px;
      }

      .approval-data label {
        color: #64748b;
        font-weight: 850;
      }

      .approval-data strong,
      .approval-data span {
        font-weight: 900;
      }

      .approval-data em {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        background: #dcfce7;
        color: #166534;
        padding: 2px 8px;
        font-style: normal;
        font-weight: 950;
      }

      .signature-line {
        font-family: "Brush Script MT", "Segoe Script", cursive;
        font-size: 15px;
      }

      .doc-footer {
        display: flex;
        justify-content: space-between;
        border-top: 2px solid #c7d2fe;
        padding-top: 6px;
        color: #475569;
        font-size: 9px;
        font-weight: 800;
      }

      .error-box {
        margin-top: 24px;
        border: 1px solid #fecaca;
        border-radius: 16px;
        background: #fee2e2;
        color: #991b1b;
        padding: 18px;
      }

      @page {
        size: A4 landscape;
        margin: 0;
      }

      @media print {
        html,
        body {
          width: 297mm;
          min-height: 210mm;
          background: white !important;
        }

        .no-print {
          display: none !important;
        }

        .a4-landscape {
          width: 297mm !important;
          min-height: 210mm !important;
          margin: 0 !important;
          box-shadow: none !important;
          padding: 9mm !important;
        }
      }
    `}</style>
  )
}
