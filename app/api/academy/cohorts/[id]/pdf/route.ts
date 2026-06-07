import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import QRCode from 'qrcode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

function esc(value: any) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function read(record: AnyRecord, keys: string[], fallback = '—') {
  for (const key of keys) {
    const value = record?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return fallback
}

function readNumber(record: AnyRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const parsed = Number(record?.[key])
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function safeDate(value: string) {
  if (!value || value === '—') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-MA')
}

function normalizeStatus(value: string) {
  const lower = String(value || '').toLowerCase()
  if (lower.includes('pending')) return 'PENDING'
  if (lower.includes('approved')) return 'APPROVED'
  if (lower.includes('assigned')) return 'ENROLLED'
  if (lower.includes('enrolled')) return 'ENROLLED'
  if (lower.includes('active')) return 'ENROLLED'
  return value ? value.toUpperCase() : 'EMPTY'
}

function initials(name: string) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—'
}

function dayCount(start: string, end: string, fallback = 5) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return fallback
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
  return Math.max(1, Math.min(31, diff))
}

async function buildCohortHtml(cohort: AnyRecord, origin: string, id: string) {
  const reference = read(cohort, ['reference_number'], `COH-${id}`)
  const qrTarget = `${origin}/api/academy/cohorts/${encodeURIComponent(id)}/pdf`
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    margin: 1,
    width: 128,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })

  const trainingStartTime = cohort?.training_start_time || cohort?.start_time || '09:00'
  const trainingEndTime = cohort?.training_end_time || cohort?.end_time || '17:00'
  const hoursPerDay = cohort?.hours_per_day || 8
  const participants = Array.isArray(cohort.participants) ? cohort.participants : []
  const capacity = Math.max(1, readNumber(cohort, ['capacity', 'seat_capacity'], 20))
  const usedSeats = participants.length
  const availableSeats = Math.max(0, capacity - usedSeats)
  const readiness = readNumber(cohort, ['readiness_score', 'readiness'], 0)
  const progression = readNumber(cohort, ['progression_percent', 'progression'], 0)
  const attendanceHealth = readNumber(cohort, ['attendance_health', 'attendance_health_percent'], 0)
  const durationDays = Math.max(
    1,
    Math.min(
      31,
      readNumber(cohort, ['duration_days', 'durationDays'], dayCount(cohort.start_date, cohort.end_date, 5)),
    ),
  )

  const dayHeaders = Array.from({ length: durationDays }, (_, index) => `<th class="day-col">D${index + 1}</th>`).join('')

  const participantRows = Array.from({ length: capacity }, (_, index) => {
    const participant = participants[index]
    const name = participant
      ? read(participant, ['trainee_name', 'name', 'participant_name', 'full_name'], '—')
      : '—'
    const status = participant ? normalizeStatus(read(participant, ['status'], 'ENROLLED')) : 'EMPTY'
    const dayCells = Array.from({ length: durationDays }, () => `<td class="day-cell"><span class="mark-box"></span></td>`).join('')

    return `
      <tr class="${participant ? '' : 'empty-row'}">
        <td>${index + 1}</td>
        <td>
          <div class="participant-cell">
            <span class="${participant ? 'avatar' : 'avatar empty'}">${esc(participant ? initials(name) : '—')}</span>
            <strong>${esc(name)}</strong>
          </div>
        </td>
        <td><span class="participant-status ${status.toLowerCase()}">${esc(status)}</span></td>
        ${dayCells}
      </tr>
    `
  }).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cohort Manifest ${esc(read(cohort, ['reference_number'], ''))}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: white;
      color: #0f172a;
      font-family: Inter, Arial, sans-serif;
    }
    @page { size: A4 landscape; margin: 0; }
    .a4-landscape {
      width: 297mm;
      min-height: 210mm;
      padding: 9mm;
      background: radial-gradient(circle at top right, rgba(79,70,229,.07), transparent 24%), #fff;
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
      letter-spacing: .18em;
      color: #2563eb;
      font-size: 14px;
    }
    .brand-block span {
      display: block;
      margin-top: 4px;
      letter-spacing: .36em;
      color: #111827;
      font-size: 9px;
      font-weight: 950;
    }
    .title-block h1 {
      margin: 0;
      color: #0f172a;
      letter-spacing: .05em;
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
      letter-spacing: .08em;
    }
    .reference-card strong {
      display: block;
      margin-top: 6px;
      color: #312e81;
      font-size: 19px;
    }
    .qr-box {
      position: absolute;
      top: 9px;
      right: 9px;
      width: 40px;
      height: 40px;
      border: 1px solid #111827;
      border-radius: 4px;
      background: white;
      object-fit: contain;
      padding: 2px;
    }
    .meta-strip {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      padding: 10px 0;
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .meta-item { display: flex; align-items: center; gap: 12px; }
    .meta-icon {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      border: 2px solid currentColor;
      font-weight: 950;
    }
    .purple { color: #7c3aed; }
    .indigo { color: #4f46e5; }
    .green { color: #16a34a; }
    .meta-item span {
      display: block;
      color: #64748b;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: .08em;
    }
    .meta-item strong { display: block; margin-top: 4px; font-size: 12px; }
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
      grid-template-columns: 1.2fr 1fr .42fr;
      gap: 9px;
      margin-bottom: 9px;
    }
    .panel {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: rgba(255,255,255,.96);
      padding: 10px;
      break-inside: avoid;
    }
    .panel h2 {
      display: flex;
      gap: 8px;
      margin: 0 0 9px;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 950;
      letter-spacing: .05em;
    }
    .panel h2 span { color: #4f46e5; }
    .data-grid {
      display: grid;
      grid-template-columns: 34% 66%;
      gap: 6px 10px;
      font-size: 11px;
    }
    .data-grid label { color: #64748b; font-weight: 800; }
    .data-grid strong { color: #0f172a; font-weight: 950; }
    .data-grid small { display: block; margin-top: 3px; color: #475569; font-size: 10px; }
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
    .summary-metrics span { display: block; font-size: 10px; font-weight: 850; }
    .summary-metrics strong { display: inline-block; margin-top: 6px; color: #4f46e5; font-size: 24px; }
    .summary-metrics small { margin-left: 4px; color: #475569; }
    .side-metrics { display: grid; gap: 8px; }
    .side-card {
      min-height: 33mm;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      padding: 10px;
    }
    .side-card span { display: block; font-size: 11px; font-weight: 900; }
    .side-card strong { display: inline-block; margin-top: 8px; color: #4f46e5; font-size: 27px; }
    .side-card small { display: block; margin-top: 5px; color: #475569; font-size: 10px; }
    .side-card.purple { background: #f5f3ff; }
    .side-card.amber { background: #fffbeb; }
    .side-card.green { background: #f0fdf4; }
    .manifest-panel { margin-bottom: 9px; }
    .attendance-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8.7px;
    }
    .attendance-table th, .attendance-table td {
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
    .slot-col { width: 8mm; }
    .name-col { width: 45mm; text-align: left !important; }
    .status-col { width: 25mm; }
    .day-col { width: 8mm; }
    .participant-cell { display: flex; align-items: center; gap: 6px; }
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
    .avatar.empty { background: #f1f5f9; color: #94a3b8; }
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
    .participant-status.enrolled { background: #dcfce7; color: #166534; }
    .participant-status.pending { background: #fef3c7; color: #92400e; }
    .participant-status.approved { background: #dbeafe; color: #1d4ed8; }
    .participant-status.empty { background: #f8fafc; color: #94a3b8; }
    .empty-row td { color: #94a3b8; }
    .day-cell { text-align: center; }
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
    .dot { display: inline-block; width: 7px; height: 7px; border-radius: 999px; margin-right: 6px; }
    .green-dot { background: #16a34a; }
    .amber-dot { background: #f97316; }
    .blue-dot { background: #2563eb; }
    .gray-dot { background: #64748b; }
    .checklist-panel { margin-bottom: 9px; }
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
    .check-card strong { font-size: 10px; font-weight: 950; }
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
    .approval-card.blue { background: #f8fbff; border-color: #bfdbfe; }
    .approval-card.purple { background: #faf5ff; border-color: #ddd6fe; }
    .approval-card.green { background: #f0fdf4; border-color: #bbf7d0; }
    .approval-card h3 { margin: 0 0 8px; color: #1d4ed8; font-size: 11px; font-weight: 950; }
    .approval-card.green h3 { color: #15803d; }
    .approval-data {
      display: grid;
      grid-template-columns: 19mm 1fr;
      gap: 4px 8px;
      font-size: 9px;
    }
    .approval-data label { color: #64748b; font-weight: 850; }
    .approval-data strong, .approval-data span { font-weight: 900; }
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
    .doc-footer {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #c7d2fe;
      padding-top: 6px;
      color: #475569;
      font-size: 9px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <section class="a4-landscape">
    <header class="doc-header">
      <div class="brand-block">
        <div class="brand-mark">A</div>
        <div><strong>ANGELCARE</strong><span>ACADEMY OS</span></div>
      </div>
      <div class="title-block">
        <h1>COHORT TECHNICAL SHEET</h1>
        <p>Live Group / Cohort Record</p>
      </div>
      <div class="reference-card">
        <span>REFERENCE NUMBER</span>
        <strong>${esc(reference)}</strong>
        <img class="qr-box" src="${qrDataUrl}" alt="Cohort QR code" />
      </div>
    </header>

    <section class="meta-strip">
      <div class="meta-item"><div class="meta-icon purple">▣</div><div><span>GENERATED AT</span><strong>${esc(new Date().toLocaleDateString('fr-MA'))} · ${esc(new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }))}</strong></div></div>
      <div class="meta-item"><div class="meta-icon indigo">●</div><div><span>GENERATED BY</span><strong>System User · Academy OS</strong></div></div>
      <div class="meta-item"><div class="meta-icon green">✓</div><div><span>COHORT STATUS</span><strong class="status-pill">${esc(read(cohort, ['status'], 'Planned'))}</strong></div></div>
    </section>

    <section class="top-grid">
      <div class="panel">
        <h2><span>1.</span> COHORT CORE CONTROL</h2>
        <div class="data-grid">
          <label>Cohort Title</label><strong>${esc(read(cohort, ['title']))}</strong>
          <label>Linked Program</label><strong>${esc(read(cohort, ['program_title', 'program_name']))}<small>${esc(read(cohort, ['program_reference'], ''))}</small></strong>
          <label>Trainer</label><strong>${esc(read(cohort, ['trainer_name']))}</strong>
          <label>Start Date</label><strong>${esc(safeDate(read(cohort, ['start_date'])))}</strong>
          <label>End Date</label><strong>${esc(safeDate(read(cohort, ['end_date'])))}</strong>
          <label>Capacity</label><strong>${capacity} Seats</strong>
          <label>Status</label><strong><em>${esc(read(cohort, ['status'], 'planned'))}</em></strong>
          <label>Operational Notes</label><strong>${esc(read(cohort, ['notes'], '—'))}</strong>
        </div>
      </div>

      <div class="panel">
        <h2><span>2.</span> COHORT MANIFEST SUMMARY</h2>
        <div class="data-grid">
          <label>Reference</label><strong>${esc(read(cohort, ['reference_number']))}</strong>
          <label>Program</label><strong>${esc(read(cohort, ['program_title', 'program_name']))}</strong>
          <label>Trainer</label><strong>${esc(read(cohort, ['trainer_name']))}</strong>
          <label>Dates</label><strong>${esc(safeDate(read(cohort, ['start_date'])))} → ${esc(safeDate(read(cohort, ['end_date'])))}</strong>
        </div>
        <div class="summary-metrics">
          <div><span>Available Seats</span><strong>${availableSeats}</strong><small>/ ${capacity}</small></div>
          <div><span>Readiness</span><strong>${readiness}%</strong></div>
          <div><span>Progression</span><strong>${progression}%</strong></div>
        </div>
      </div>

      <aside class="side-metrics">
        <div class="side-card"><span>Available Seats</span><strong>${availableSeats}</strong><small>/ ${capacity}</small></div>
        <div class="side-card purple"><span>Readiness</span><strong>${readiness}%</strong><small>${readiness >= 80 ? 'High readiness' : 'Low readiness'}</small></div>
        <div class="side-card amber"><span>Progression</span><strong>${progression}%</strong><small>${progression > 0 ? 'In progress' : 'Not started'}</small></div>
        <div class="side-card green"><span>Attendance Health</span><strong>${attendanceHealth ? `${attendanceHealth}%` : 'N/A'}</strong><small>${attendanceHealth ? 'Tracked' : 'No data yet'}</small></div>
      </aside>
    </section>

    <section class="panel manifest-panel">
      <h2><span>3.</span> PARTICIPANT MANIFEST / ATTENDANCE TRACKING</h2>
      <table class="attendance-table">
        <thead>
          <tr>
            <th class="slot-col">#</th>
            <th class="name-col">Participant Name</th>
            <th class="status-col">Status</th>
            ${dayHeaders}
          </tr>
        </thead>
        <tbody>${participantRows}</tbody>
      </table>
      <div class="legend">
        <span><i class="dot green-dot"></i>ENROLLED</span>
        <span><i class="dot amber-dot"></i>PENDING</span>
        <span><i class="dot blue-dot"></i>APPROVED</span>
        <span><i class="dot gray-dot"></i>EMPTY / RESERVED SLOT</span>
      </div>
    </section>

    <section class="panel checklist-panel">
      <h2><span>4.</span> FINAL CHECKLIST & READINESS VALIDATION</h2>
      <div class="check-grid">
        <div class="check-card"><span class="checkbox"></span><strong>Program validated</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Trainer assigned</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Participants confirmed</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Schedule ready</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Learning resources shared</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Attendance sheet ready</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Documents complete</strong></div>
        <div class="check-card"><span class="checkbox"></span><strong>Launch approved</strong></div>
      </div>
    </section>

    <section class="approval-grid">
      <div class="approval-card blue"><h3>SUPERVISOR / ADMIN APPROVAL</h3><div class="approval-data"><label>Name</label><span>________________________</span><label>Role</label><strong>Training Operations Manager</strong><label>Date</label><span>____ / ____ / ______</span><label>Signature</label><span>________________________</span><label>Status</label><em>PENDING</em></div></div>
      <div class="approval-card purple"><h3>TRAINER APPROVAL</h3><div class="approval-data"><label>Name</label><span>________________________</span><label>Role</label><strong>Lead Trainer</strong><label>Date</label><span>____ / ____ / ______</span><label>Signature</label><span>________________________</span><label>Status</label><em>PENDING</em></div></div>
      <div class="approval-card green"><h3>OPERATIONS FINAL VALIDATION</h3><div class="approval-data"><label>Name</label><span>________________________</span><label>Role</label><strong>Training Operations Lead</strong><label>Date</label><span>____ / ____ / ______</span><label>Signature</label><span>________________________</span><label>Status</label><em>PENDING</em></div></div>
    </section>

    <footer class="doc-footer">
      <span>AngelCare Academy OS · Cohort Technical Sheet</span>
      <span>Page 1 of 1</span>
    </footer>
  </section>

      <section class="section">
        <h2>Training Timing</h2>
        <div class="grid three">
          <div class="mini-card"><div class="mini-label">Training Start</div><div class="mini-value">${trainingStartTime}</div></div>
          <div class="mini-card"><div class="mini-label">Training End</div><div class="mini-value">${trainingEndTime}</div></div>
          <div class="mini-card"><div class="mini-label">Hours / Day</div><div class="mini-value">${hoursPerDay}</div></div>
        </div>
      </section>
</body>
</html>`
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params
  const id = String(params.id || '').trim()

  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing cohort id' }, { status: 400 })
  }

  const cookie = request.headers.get('cookie') || ''
  const origin = request.nextUrl.origin
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null

  try {
    const apiResponse = await fetch(`${origin}/api/academy/cohorts/${encodeURIComponent(id)}`, {
      headers: cookie ? { cookie } : undefined,
      cache: 'no-store',
    })

    const raw = await apiResponse.text()
    let json: AnyRecord = {}
    try {
      json = raw ? JSON.parse(raw) : {}
    } catch {
      json = { ok: false, error: raw || 'Invalid API response' }
    }

    if (!apiResponse.ok || json?.ok === false) {
      return NextResponse.json(
        { ok: false, error: json?.error || `Unable to load cohort ${id}` },
        { status: apiResponse.status || 500 },
      )
    }

    const cohort = json.data || json.cohort || json.record
    if (!cohort) {
      return NextResponse.json({ ok: false, error: 'Cohort data missing from API response' }, { status: 404 })
    }

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1754, height: 1240 } })

    await page.setContent(await buildCohortHtml(cohort, origin, id), {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    await page.emulateMedia({ media: 'print' })

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="academy-cohort-${id}-manifest.pdf"`,
        'cache-control': 'no-store',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Cohort PDF generation failed' },
      { status: 500 },
    )
  } finally {
    if (browser) await browser.close().catch(() => undefined)
  }
}
