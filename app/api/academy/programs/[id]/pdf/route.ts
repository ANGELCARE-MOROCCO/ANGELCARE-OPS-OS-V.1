import { NextRequest, NextResponse } from 'next/server'
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

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-MA')} Dhs`
}

async function buildProgramHtml(program: AnyRecord, origin: string, id: string) {
  const reference = read(program, ['reference_number'], `PRG-${id}`)
  const qrTarget = `${origin}/api/academy/programs/${encodeURIComponent(id)}/pdf`
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    margin: 1,
    width: 128,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })
  const trainers = Array.isArray(program.trainers) ? program.trainers : []
  const libraryLinks = Array.isArray(program.library_links)
    ? program.library_links
    : Array.isArray(program.libraryLinks)
      ? program.libraryLinks
      : []
  const pricingRows = Array.isArray(program.pricing_rows)
    ? program.pricing_rows
    : Array.isArray(program.pricingRows)
      ? program.pricingRows
      : []
  const addons = Array.isArray(program.addons) ? program.addons : []

  const basePrice = readNumber(program, ['base_price_dhs', 'base_price', 'price_mad', 'program_price', 'price'], 0)
  const extraTotal = pricingRows.reduce((sum: number, row: AnyRecord) => sum + Number(row?.amount_dhs || row?.amount || 0), 0)
  const addonTotal = addons.reduce((sum: number, row: AnyRecord) => sum + Number(row?.amount_dhs || row?.amount || 0), 0)
  const total = readNumber(program, ['total_price_dhs', 'total_price'], basePrice + extraTotal + addonTotal)

  const trainerRows = trainers.length
    ? trainers.map((trainer: AnyRecord, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(read(trainer, ['name', 'trainer_name', 'full_name', 'label'], `Trainer ${index + 1}`))}</td>
        <td>${esc(read(trainer, ['specialty_label', 'specialty', 'role'], 'Registered Trainer'))}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="3">No trainers assigned.</td></tr>`

  const libraryRows = libraryLinks.length
    ? libraryLinks.map((link: AnyRecord, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(read(link, ['category'], 'Resource'))}</td>
        <td>${esc(read(link, ['label', 'title'], `Resource ${index + 1}`))}</td>
        <td class="link-cell">${esc(read(link, ['url', 'href', 'link']))}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="4">No library links registered.</td></tr>`

  const pricingRowsHtml = pricingRows.length
    ? pricingRows.map((row: AnyRecord, index: number) => `
      <tr>
        <td>${esc(read(row, ['label', 'price_label'], `Price Row ${index + 1}`))}</td>
        <td>${esc(read(row, ['billing_type', 'billingType'], '—'))}</td>
        <td>${money(Number(row?.amount_dhs || row?.amount || 0))}</td>
        <td>${esc(read(row, ['applies_to', 'appliesTo'], '—'))}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="4">No additional pricing rows.</td></tr>`

  const addonRowsHtml = addons.length
    ? addons.map((row: AnyRecord, index: number) => `
      <tr>
        <td>${esc(read(row, ['label', 'addon_name', 'name'], `Add-on ${index + 1}`))}</td>
        <td>${esc(read(row, ['addon_type', 'type'], '—'))}</td>
        <td>${money(Number(row?.amount_dhs || row?.amount || 0))}</td>
        <td>${esc(read(row, ['optional_required', 'mode'], 'Optional'))}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="4">No on-demand add-ons for this program.</td></tr>`

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Program Technical Sheet ${esc(read(program, ['reference_number'], ''))}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: white;
      color: #111827;
      font-family: Inter, Arial, sans-serif;
    }
    @page { size: A4; margin: 0; }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 10.5mm;
      background: radial-gradient(circle at top right, rgba(79,70,229,.08), transparent 25%), #fff;
    }
    .doc-header {
      display: grid;
      grid-template-columns: 44mm 1fr 58mm;
      align-items: center;
      gap: 14px;
      padding-bottom: 11px;
      border-bottom: 3px solid #c7d2fe;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 10px;
      border-right: 1px solid #cbd5e1;
      padding-right: 16px;
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      color: #1d4ed8;
      font-size: 30px;
      font-weight: 950;
    }
    .brand-block strong {
      display: block;
      letter-spacing: .12em;
      color: #2563eb;
      font-size: 9.5px;
    }
    .brand-block span {
      display: block;
      letter-spacing: .34em;
      color: #111827;
      font-size: 9px;
      font-weight: 900;
    }
    .title-block h1 {
      margin: 0;
      letter-spacing: .04em;
      font-size: 16px;
      font-weight: 950;
    }
    .title-block p {
      margin: 6px 0 0;
      color: #475569;
      font-size: 9.5px;
    }
    .reference-card {
      position: relative;
      border: 1px solid #a5b4fc;
      border-radius: 12px;
      padding: 12px 52px 12px 14px;
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
      font-size: 15px;
    }
    .qr-box {
      position: absolute;
      top: 9px;
      right: 9px;
      width: 38px;
      height: 38px;
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
      padding: 11px 0;
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .meta-item { display: flex; align-items: center; gap: 9px; }
    .meta-icon {
      width: 36px;
      height: 36px;
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
    .meta-item strong { display: block; margin-top: 4px; font-size: 9px; }
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
    .section-grid {
      display: grid;
      gap: 9px;
      margin-bottom: 9px;
    }
    .identity-grid { grid-template-columns: 1fr 1fr; }
    .two-cols { grid-template-columns: 1fr 1fr; }
    .pricing-grid { grid-template-columns: .8fr 1fr 1fr; }
    .panel {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: rgba(255,255,255,.96);
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
      font-size: 9px;
      font-weight: 950;
      letter-spacing: .06em;
    }
    .panel h2 span { color: #7c3aed; }
    .data-grid {
      display: grid;
      grid-template-columns: 34% 66%;
      gap: 8px 10px;
      font-size: 9.5px;
    }
    .data-grid label { color: #64748b; font-weight: 700; }
    .data-grid strong { font-weight: 950; }
    .duration-panel {
      background: linear-gradient(135deg, #f8f7ff, #ffffff);
      border-color: #ddd6fe;
    }
    .big-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      padding: 10px 0 14px;
      border-bottom: 1px solid #cbd5e1;
    }
    .big-metrics span {
      display: block;
      color: #312e81;
      font-size: 10px;
      font-weight: 800;
    }
    .big-metrics strong {
      display: block;
      margin-top: 8px;
      color: #4f46e5;
      font-size: 26px;
      line-height: 1;
    }
    .big-metrics small {
      display: block;
      margin-top: 6px;
      color: #312e81;
      font-size: 9px;
    }
    .duration-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      margin-top: 14px;
    }
    .duration-details span {
      display: block;
      color: #64748b;
      font-size: 10px;
      font-weight: 800;
    }
    .duration-details strong {
      display: block;
      margin-top: 5px;
      font-size: 9.5px;
    }
    .description-panel p {
      margin: 0;
      font-size: 12px;
      line-height: 1.55;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    th {
      background: linear-gradient(90deg, #2563eb, #4f46e5);
      color: white;
      text-align: left;
      padding: 5px 6px;
      font-weight: 950;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 5px 6px;
      vertical-align: top;
      font-weight: 700;
    }
    .link-cell {
      color: #2563eb;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9px;
      word-break: break-all;
    }
    .pricing-summary {
      border-color: #bbf7d0;
      background: linear-gradient(180deg, #ffffff, #f0fdf4);
    }
    .price-line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #bbf7d0;
      padding: 7px 0;
      font-size: 9.5px;
    }
    .price-line span { font-weight: 800; }
    .price-line strong { font-weight: 950; }
    .total-price {
      margin-top: 12px;
      border-top: 2px solid #bbf7d0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #16a34a;
      font-weight: 950;
    }
    .total-price strong { font-size: 16px; }
    .pricing-summary p {
      margin: 12px -12px -12px;
      border-radius: 0 0 14px 14px;
      background: #dcfce7;
      color: #166534;
      padding: 10px;
      text-align: center;
      font-size: 9.5px;
      font-weight: 950;
    }
    .addons-panel { border-color: #e9d5ff; }
    .addon-total {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      border-top: 2px solid #e9d5ff;
      padding-top: 10px;
      color: #7c3aed;
      font-size: 9px;
      font-weight: 950;
    }
    .option-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }
    .option-card {
      min-height: 44px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 9px;
      background: #f8fafc;
    }
    .option-card span {
      display: block;
      color: #4f46e5;
      font-size: 8px;
      font-weight: 950;
    }
    .option-card strong {
      display: block;
      margin-top: 5px;
      font-size: 10px;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }
    .check-card {
      display: flex;
      gap: 8px;
      align-items: center;
      min-height: 44px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px;
      background: #fff;
    }
    .check-card span {
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: #f8fafc;
      color: #f59e0b;
      font-weight: 950;
    }
    .check-card.done span {
      background: #dcfce7;
      color: #16a34a;
    }
    .check-card strong { display: block; font-size: 9px; }
    .check-card small {
      display: block;
      margin-top: 3px;
      color: #64748b;
      font-size: 8px;
      font-weight: 800;
    }
    .doc-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      border-top: 2px solid #c7d2fe;
      padding-top: 10px;
      color: #475569;
      font-size: 9px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <section class="a4-page">
    <header class="doc-header">
      <div class="brand-block">
        <div class="brand-mark">A</div>
        <div><strong>ANGELCARE</strong><span>ACADEMY OS</span></div>
      </div>
      <div class="title-block">
        <h1>PROGRAM TECHNICAL SHEET</h1>
        <p>Enterprise Training Program Record</p>
      </div>
      <div class="reference-card">
        <span>REFERENCE NUMBER</span>
        <strong>${esc(reference)}</strong>
        <img class="qr-box" src="${qrDataUrl}" alt="Program QR code" />
      </div>
    </header>

    <section class="meta-strip">
      <div class="meta-item"><div class="meta-icon purple">▣</div><div><span>GENERATED AT</span><strong>${esc(new Date().toLocaleDateString('fr-MA'))} · ${esc(new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }))}</strong></div></div>
      <div class="meta-item"><div class="meta-icon indigo">●</div><div><span>GENERATED BY</span><strong>System User · Academy OS</strong></div></div>
      <div class="meta-item"><div class="meta-icon green">✓</div><div><span>PROGRAM STATUS</span><strong class="status-pill">${esc(read(program, ['status'], 'Active'))}</strong></div></div>
    </section>

    <section class="section-grid identity-grid">
      <div class="panel">
        <h2><span>1.</span> PROGRAM IDENTITY</h2>
        <div class="data-grid">
          <label>Program Name</label><strong>${esc(read(program, ['title', 'program_name', 'name']))}</strong>
          <label>Category</label><strong>${esc(read(program, ['category']))}</strong>
          <label>Level</label><strong>${esc(read(program, ['level']))}</strong>
          <label>Delivery Format</label><strong>${esc(read(program, ['delivery_format', 'deliveryFormat']))}</strong>
          <label>Program Type</label><strong>${esc(read(program, ['program_type', 'type'], 'Enterprise Program'))}</strong>
          <label>Target Audience</label><strong>${esc(read(program, ['target_audience', 'targetAudience']))}</strong>
          <label>Language</label><strong>${esc(read(program, ['language'], 'Français'))}</strong>
          <label>Operational Notes</label><strong>${esc(read(program, ['operational_notes', 'notes'], '—'))}</strong>
        </div>
      </div>

      <div class="panel duration-panel">
        <h2><span>⏱</span> DURATION & TRAINING VOLUME</h2>
        <div class="big-metrics">
          <div><span>Duration</span><strong>${esc(read(program, ['duration_days', 'durationDays'], '0'))}</strong><small>days</small></div>
          <div><span>Hours / Day</span><strong>${esc(read(program, ['hours_per_day', 'hoursPerDay'], '0'))}</strong><small>hours</small></div>
          <div><span>Total Training Hours</span><strong>${esc(read(program, ['total_hours', 'totalHours'], '0'))}</strong><small>hours</small></div>
        </div>
        <div class="duration-details">
          <div><span>Schedule Type</span><strong>${esc(read(program, ['schedule_type'], 'Planned'))}</strong></div>
          <div><span>Intake Start</span><strong>${esc(read(program, ['intake_start', 'start_date']))}</strong></div>
          <div><span>Intake End</span><strong>${esc(read(program, ['intake_end', 'end_date']))}</strong></div>
        </div>
      </div>
    </section>

    <section class="section-grid two-cols">
      <div class="panel">
        <h2><span>2.</span> REGISTERED TRAINERS</h2>
        <table><thead><tr><th>#</th><th>Trainer Name</th><th>Specialty / Role</th></tr></thead><tbody>${trainerRows}</tbody></table>
      </div>
      <div class="panel description-panel">
        <h2><span>3.</span> PROGRAM DESCRIPTION</h2>
        <p>${esc(read(program, ['description'], 'No program description registered.'))}</p>
      </div>
    </section>

    <section class="panel">
      <h2><span>4.</span> SMART LEARNING LIBRARY LINKS</h2>
      <table><thead><tr><th>#</th><th>Category</th><th>Label</th><th>Resource Link</th></tr></thead><tbody>${libraryRows}</tbody></table>
    </section>

    <section class="section-grid pricing-grid">
      <div class="panel pricing-summary">
        <h2><span>5.</span> PRICING SUMMARY — RAW Dhs</h2>
        <div class="price-line"><span>Base Initial Course Price</span><strong>${money(basePrice)}</strong></div>
        <div class="price-line"><span>Additional Pricing Rows</span><strong>${pricingRows.length}</strong></div>
        <div class="price-line"><span>On-Demand Add-ons</span><strong>${addons.length}</strong></div>
        <div class="total-price"><span>TOTAL PRICE RAW</span><strong>${money(total)}</strong></div>
        <p>All pricing shown excl. VAT.</p>
      </div>

      <div class="panel">
        <h2><span>5.1</span> ADDITIONAL PRICING ROWS</h2>
        <table><thead><tr><th>Label</th><th>Billing Type</th><th>Amount</th><th>Applies To</th></tr></thead><tbody>${pricingRowsHtml}</tbody></table>
      </div>

      <div class="panel addons-panel">
        <h2><span>5.2</span> ON-DEMAND ADD-ONS</h2>
        <table><thead><tr><th>Add-on</th><th>Type</th><th>Amount</th><th>Mode</th></tr></thead><tbody>${addonRowsHtml}</tbody></table>
        <div class="addon-total">Total Add-ons <strong>${money(addonTotal)}</strong></div>
      </div>
    </section>

    <section class="panel">
      <h2><span>6.</span> PROGRAM PARAMETERS & OPTIONS</h2>
      <div class="option-grid">
        <div class="option-card"><span>Certificate Completion</span><strong>${esc(read(program, ['certificate_type'], 'Included'))}</strong></div>
        <div class="option-card"><span>Minimum Enrollments</span><strong>${esc(read(program, ['minimum_enrollments', 'min_enrollments'], '—'))}</strong></div>
        <div class="option-card"><span>Maximum Enrollments</span><strong>${esc(read(program, ['maximum_enrollments', 'max_enrollments', 'capacity'], '—'))}</strong></div>
        <div class="option-card"><span>Attendance Required</span><strong>${esc(read(program, ['attendance_required'], '75% Minimum'))}</strong></div>
        <div class="option-card"><span>Assessment Type</span><strong>${esc(read(program, ['assessment_type'], 'Quizzes, Exams, Practical'))}</strong></div>
        <div class="option-card"><span>Certification Type</span><strong>${esc(read(program, ['certification_type'], 'Internal Certificate'))}</strong></div>
      </div>
    </section>

    <section class="panel">
      <h2><span>7.</span> READINESS & APPROVAL CHECKLIST</h2>
      <div class="checklist-grid">
        <div class="check-card done"><span>✓</span><div><strong>Program Validated</strong><small>Completed</small></div></div>
        <div class="check-card ${trainers.length ? 'done' : ''}"><span>${trainers.length ? '✓' : '○'}</span><div><strong>Trainers Assigned</strong><small>${trainers.length ? 'Completed' : 'Pending'}</small></div></div>
        <div class="check-card"><span>○</span><div><strong>Participants Confirmed</strong><small>In Progress</small></div></div>
        <div class="check-card done"><span>✓</span><div><strong>Schedule Ready</strong><small>Completed</small></div></div>
        <div class="check-card ${libraryLinks.length ? 'done' : ''}"><span>${libraryLinks.length ? '✓' : '○'}</span><div><strong>Resources Shared</strong><small>${libraryLinks.length ? 'Completed' : 'Pending'}</small></div></div>
        <div class="check-card"><span>○</span><div><strong>Launch Approved</strong><small>Pending</small></div></div>
      </div>
    </section>

    <footer class="doc-footer">
      <span>AngelCare Academy OS · Program Technical Sheet</span>
      <span>Page 1 of 1</span>
    </footer>
  </section>
</body>
</html>`
}

async function launchAcademyPdfBrowser() {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_REGION)

  if (isVercel) {
    const chromiumServerless = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')

    return puppeteer.launch({
      args: chromiumServerless.args,
      defaultViewport: { width: 1440, height: 1100 },
      executablePath: await chromiumServerless.executablePath(),
      headless: true,
    })
  }

  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}

async function applyAcademyPrintMedia(page: any) {
  if (typeof page.emulateMedia === 'function') {
    await page.emulateMedia({ media: 'print' })
    return
  }

  if (typeof page.emulateMediaType === 'function') {
    await page.emulateMediaType('print')
  }
}


async function newAcademyPdfPage(browser: any, viewport: { width: number; height: number }) {
  const page = await browser.newPage()

  if (typeof page.setViewportSize === 'function') {
    await page.setViewportSize(viewport)
  } else if (typeof page.setViewport === 'function') {
    await page.setViewport(viewport)
  }

  return page
}

function academyPdfResponse(pdf: Uint8Array | Buffer, filename: string) {
  return new Response(Buffer.from(pdf) as unknown as BodyInit, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename=\"${filename}}\"`,
      'cache-control': 'no-store',
    },
  })
}


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params
  const id = String(params.id || '').trim()

  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing program id' }, { status: 400 })
  }

  const cookie = request.headers.get('cookie') || ''
  const origin = request.nextUrl.origin
  let browser: any = null

  try {
    const apiResponse = await fetch(`${origin}/api/academy/programs/${encodeURIComponent(id)}`, {
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
        { ok: false, error: json?.error || `Unable to load program ${id}` },
        { status: apiResponse.status || 500 },
      )
    }

    const program = json.data || json.program || json.record
    if (!program) {
      return NextResponse.json({ ok: false, error: 'Program data missing from API response' }, { status: 404 })
    }

    browser = await launchAcademyPdfBrowser()
    const page = await newAcademyPdfPage(browser, { width: 1240, height: 1754 })

    await page.setContent(await buildProgramHtml(program, origin, id), {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    await applyAcademyPrintMedia(page)

    const pdf = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })

    return academyPdfResponse(pdf, 'academy-document.pdf')
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Program PDF generation failed' },
      { status: 500 },
    )
  } finally {
    if (browser) await browser.close().catch(() => undefined)
  }
}
