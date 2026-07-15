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
  return payload?.program || payload?.data || payload?.item || payload?.record || payload
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-MA')} Dhs`
}

export default function AcademyProgramPrintPage() {
  const params = useParams()
  const id = String(params?.id || '')
  const [program, setProgram] = useState<AnyRecord | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProgram() {
      try {
        const response = await fetch(`/api/academy/programs/${id}`, { cache: 'no-store' })
        const raw = await response.text()

        let json: AnyRecord = {}
        try {
          json = raw ? JSON.parse(raw) : {}
        } catch {
          json = { ok: false, error: raw || 'Invalid server response' }
        }

        if (!response.ok || json?.ok === false) {
          throw new Error(json?.error || `Unable to load program ${id}`)
        }

        const record = unwrap(json)
        if (!record || typeof record !== 'object') throw new Error('Program record is empty')

        if (active) setProgram(record)
      } catch (err: any) {
        if (active) setError(err?.message || 'Unable to load program')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProgram()

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

  const trainers = useMemo(() => readList(program, ['trainers', 'program_trainers', 'assigned_trainers']), [program])
  const libraryLinks = useMemo(() => readList(program, ['library_links', 'libraryLinks', 'resources']), [program])
  const pricingRows = useMemo(() => readList(program, ['pricing_rows', 'pricingRows', 'prices']), [program])
  const addons = useMemo(() => readList(program, ['addons', 'add_ons', 'on_demand_addons']), [program])

  const basePrice = readNumber(program, ['base_price_dhs', 'base_price', 'price_mad', 'program_price', 'price'], 0)
  const extraTotal = pricingRows.reduce((sum: number, row: AnyRecord) => sum + Number(row?.amount_dhs || row?.amount || 0), 0)
  const addonTotal = addons.reduce((sum: number, row: AnyRecord) => sum + Number(row?.amount_dhs || row?.amount || 0), 0)
  const total = readNumber(program, ['total_price_dhs', 'total_price'], basePrice + extraTotal + addonTotal)

  const durationDays = read(program, ['duration_days', 'durationDays'], '0')
  const hoursPerDay = read(program, ['hours_per_day', 'hoursPerDay'], '0')
  const totalHours = read(program, ['total_hours', 'totalHours'], '0')

  if (loading) {
    return (
      <main className="loading-screen">
        <PrintStyles />
        Loading Academy Program Technical Sheet…
      </main>
    )
  }

  if (error || !program) {
    return (
      <main className="print-root">
        <PrintStyles />
        <div className="no-print print-actions">
          <a href="/academy/courses">Back</a>
          <button type="button" onClick={() => window.print()}>Print</button>
        </div>

        <section className="a4-page">
          <header className="doc-header">
            <div className="brand-block">
              <div className="brand-mark">A</div>
              <div>
                <strong>ANGELCARE</strong>
                <span>ACADEMY OS</span>
              </div>
            </div>
            <div className="title-block">
              <h1>PROGRAM TECHNICAL SHEET</h1>
              <p>Enterprise Training Program Record</p>
            </div>
          </header>

          <div className="error-box">
            <strong>Unable to load program record.</strong>
            <p>{error || `No program record found for ID ${id}`}</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="print-root">
      <PrintStyles />

      <div className="no-print print-actions">
        <a href="/academy/courses">Back to Programs</a>
        <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <section className="a4-page">
        <header className="doc-header">
          <div className="brand-block">
            <div className="brand-mark">A</div>
            <div>
              <strong>ANGELCARE</strong>
              <span>ACADEMY OS</span>
            </div>
          </div>

          <div className="title-block">
            <h1>PROGRAM TECHNICAL SHEET</h1>
            <p>Enterprise Training Program Record</p>
          </div>

          <div className="reference-card">
            <span>REFERENCE NUMBER</span>
            <strong>{read(program, ['reference_number', 'reference', 'program_reference'], `PRG-${id}`)}</strong>
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
              <span>PROGRAM STATUS</span>
              <strong className="status-pill">{read(program, ['status'], 'Active')}</strong>
            </div>
          </div>
        </section>

        <section className="section-grid identity-grid">
          <div className="panel identity-panel">
            <h2><span>1.</span> PROGRAM IDENTITY</h2>
            <div className="data-grid">
              <label>Program Name</label>
              <strong>{read(program, ['title', 'program_name', 'name'])}</strong>

              <label>Category</label>
              <strong>{read(program, ['category'])}</strong>

              <label>Level</label>
              <strong>{read(program, ['level'])}</strong>

              <label>Delivery Format</label>
              <strong>{read(program, ['delivery_format', 'deliveryFormat'])}</strong>

              <label>Program Type</label>
              <strong>{read(program, ['program_type', 'type'], 'Enterprise Program')}</strong>

              <label>Target Audience</label>
              <strong>{read(program, ['target_audience', 'targetAudience'])}</strong>

              <label>Language</label>
              <strong>{read(program, ['language'], 'Français')}</strong>

              <label>Operational Notes</label>
              <strong>{read(program, ['operational_notes', 'notes'], '—')}</strong>
            </div>
          </div>

          <div className="panel duration-panel">
            <h2><span>⏱</span> DURATION & TRAINING VOLUME</h2>
            <div className="big-metrics">
              <div>
                <span>Duration</span>
                <strong>{durationDays}</strong>
                <small>days</small>
              </div>
              <div>
                <span>Hours / Day</span>
                <strong>{hoursPerDay}</strong>
                <small>hours</small>
              </div>
              <div>
                <span>Total Training Hours</span>
                <strong>{totalHours}</strong>
                <small>hours</small>
              </div>
            </div>

            <div className="duration-details">
              <div>
                <span>Schedule Type</span>
                <strong>{read(program, ['schedule_type'], 'Planned')}</strong>
              </div>
              <div>
                <span>Intake Start</span>
                <strong>{read(program, ['intake_start', 'start_date'])}</strong>
              </div>
              <div>
                <span>Intake End</span>
                <strong>{read(program, ['intake_end', 'end_date'])}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid two-cols">
          <div className="panel">
            <h2><span>2.</span> REGISTERED TRAINERS</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Trainer Name</th>
                  <th>Specialty / Role</th>
                </tr>
              </thead>
              <tbody>
                {trainers.length ? trainers.map((trainer: AnyRecord, index: number) => (
                  <tr key={`trainer-${index}`}>
                    <td>{index + 1}</td>
                    <td>{read(trainer, ['name', 'trainer_name', 'full_name', 'label'], `Trainer ${index + 1}`)}</td>
                    <td>{read(trainer, ['specialty_label', 'specialty', 'role'], 'Registered Trainer')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3}>No trainers assigned.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="panel description-panel">
            <h2><span>3.</span> PROGRAM DESCRIPTION</h2>
            <p>{read(program, ['description'], 'No program description registered.')}</p>
          </div>
        </section>

        <section className="panel">
          <h2><span>4.</span> SMART LEARNING LIBRARY LINKS</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Label</th>
                <th>Resource Link</th>
              </tr>
            </thead>
            <tbody>
              {libraryLinks.length ? libraryLinks.map((link: AnyRecord, index: number) => (
                <tr key={`library-${index}`}>
                  <td>{index + 1}</td>
                  <td>{read(link, ['category'], 'Resource')}</td>
                  <td>{read(link, ['label', 'title'], `Resource ${index + 1}`)}</td>
                  <td className="link-cell">{read(link, ['url', 'href', 'link'])}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}>No library links registered.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="section-grid pricing-grid">
          <div className="panel pricing-summary">
            <h2><span>5.</span> PRICING SUMMARY — RAW Dhs</h2>
            <div className="price-line"><span>Base Initial Course Price</span><strong>{money(basePrice)}</strong></div>
            <div className="price-line"><span>Additional Pricing Rows</span><strong>{pricingRows.length}</strong></div>
            <div className="price-line"><span>On-Demand Add-ons</span><strong>{addons.length}</strong></div>
            <div className="total-price"><span>TOTAL PRICE RAW</span><strong>{money(total)}</strong></div>
            <p>All pricing shown excl. VAT.</p>
          </div>

          <div className="panel">
            <h2><span>5.1</span> ADDITIONAL PRICING ROWS</h2>
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Billing Type</th>
                  <th>Amount</th>
                  <th>Applies To</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.length ? pricingRows.map((row: AnyRecord, index: number) => (
                  <tr key={`price-${index}`}>
                    <td>{read(row, ['label', 'price_label'], `Price Row ${index + 1}`)}</td>
                    <td>{read(row, ['billing_type', 'billingType'], '—')}</td>
                    <td>{money(Number(row?.amount_dhs || row?.amount || 0))}</td>
                    <td>{read(row, ['applies_to', 'appliesTo'], '—')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4}>No additional pricing rows.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="panel addons-panel">
            <h2><span>5.2</span> ON-DEMAND ADD-ONS</h2>
            <table>
              <thead>
                <tr>
                  <th>Add-on</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {addons.length ? addons.map((row: AnyRecord, index: number) => (
                  <tr key={`addon-${index}`}>
                    <td>{read(row, ['label', 'addon_name', 'name'], `Add-on ${index + 1}`)}</td>
                    <td>{read(row, ['addon_type', 'type'], '—')}</td>
                    <td>{money(Number(row?.amount_dhs || row?.amount || 0))}</td>
                    <td>{read(row, ['optional_required', 'mode'], 'Optional')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4}>No on-demand add-ons for this program.</td></tr>
                )}
              </tbody>
            </table>
            <div className="addon-total">Total Add-ons <strong>{money(addonTotal)}</strong></div>
          </div>
        </section>

        <section className="panel">
          <h2><span>6.</span> PROGRAM PARAMETERS & OPTIONS</h2>
          <div className="option-grid">
            <Option label="Certificate Completion" value={read(program, ['certificate_type'], 'Included')} />
            <Option label="Minimum Enrollments" value={read(program, ['minimum_enrollments', 'min_enrollments'], '—')} />
            <Option label="Maximum Enrollments" value={read(program, ['maximum_enrollments', 'max_enrollments', 'capacity'], '—')} />
            <Option label="Attendance Required" value={read(program, ['attendance_required'], '75% Minimum')} />
            <Option label="Assessment Type" value={read(program, ['assessment_type'], 'Quizzes, Exams, Practical')} />
            <Option label="Certification Type" value={read(program, ['certification_type'], 'Internal Certificate')} />
          </div>
        </section>

        <section className="panel">
          <h2><span>7.</span> READINESS & APPROVAL CHECKLIST</h2>
          <div className="checklist-grid">
            <Check label="Program Validated" status="Completed" done />
            <Check label="Trainers Assigned" status={trainers.length ? 'Completed' : 'Pending'} done={trainers.length > 0} />
            <Check label="Participants Confirmed" status="In Progress" />
            <Check label="Schedule Ready" status="Completed" done />
            <Check label="Resources Shared" status={libraryLinks.length ? 'Completed' : 'Pending'} done={libraryLinks.length > 0} />
            <Check label="Launch Approved" status="Pending" />
          </div>
        </section>

        <footer className="doc-footer">
          <span>AngelCare Academy OS · Program Technical Sheet</span>
          <span>Page 1 of 1</span>
        </footer>
      </section>
    </main>
  )
}

function Option({ label, value }: { label: string; value: string }) {
  return (
    <div className="option-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Check({ label, status, done = false }: { label: string; status: string; done?: boolean }) {
  return (
    <div className={done ? 'check-card done' : 'check-card'}>
      <span>{done ? '✓' : '○'}</span>
      <div>
        <strong>{label}</strong>
        <small>{status}</small>
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
        color: #111827;
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

      .a4-page {
        width: 210mm;
        min-height: 297mm;
        margin: 18px auto;
        padding: 12mm;
        background:
          radial-gradient(circle at top right, rgba(79, 70, 229, 0.08), transparent 25%),
          white;
        box-shadow: 0 24px 90px rgba(15, 23, 42, 0.28);
      }

      .doc-header {
        display: grid;
        grid-template-columns: 44mm 1fr 58mm;
        align-items: center;
        gap: 18px;
        padding-bottom: 14px;
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
        letter-spacing: 0.12em;
        color: #2563eb;
        font-size: 13px;
      }

      .brand-block span {
        display: block;
        letter-spacing: 0.34em;
        color: #111827;
        font-size: 9px;
        font-weight: 900;
      }

      .title-block h1 {
        margin: 0;
        letter-spacing: 0.04em;
        font-size: 20px;
        font-weight: 950;
      }

      .title-block p {
        margin: 6px 0 0;
        color: #475569;
        font-size: 13px;
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
        letter-spacing: 0.08em;
      }

      .reference-card strong {
        display: block;
        margin-top: 6px;
        color: #312e81;
        font-size: 18px;
      }

      .qr-box {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 34px;
        height: 34px;
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
        padding: 16px 0;
        border-bottom: 1px solid #cbd5e1;
        margin-bottom: 14px;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .meta-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        border: 2px solid currentColor;
        font-weight: 950;
      }

      .meta-icon.purple {
        color: #7c3aed;
      }

      .meta-icon.indigo {
        color: #4f46e5;
      }

      .meta-icon.green {
        color: #16a34a;
      }

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

      .section-grid {
        display: grid;
        gap: 12px;
        margin-bottom: 12px;
      }

      .identity-grid {
        grid-template-columns: 1fr 1fr;
      }

      .two-cols {
        grid-template-columns: 1fr 1fr;
      }

      .pricing-grid {
        grid-template-columns: 0.8fr 1fr 1fr;
      }

      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: rgba(255,255,255,0.96);
        padding: 12px;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .panel h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.06em;
      }

      .panel h2 span {
        color: #7c3aed;
      }

      .data-grid {
        display: grid;
        grid-template-columns: 34% 66%;
        gap: 8px 10px;
        font-size: 11px;
      }

      .data-grid label {
        color: #64748b;
        font-weight: 700;
      }

      .data-grid strong {
        font-weight: 950;
      }

      .duration-panel {
        background: linear-gradient(135deg, #f8f7ff, #ffffff);
        border-color: #ddd6fe;
      }

      .big-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 10px 0 14px;
        border-bottom: 1px solid #cbd5e1;
      }

      .big-metrics div {
        min-height: 68px;
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
        font-size: 32px;
        line-height: 1;
      }

      .big-metrics small {
        display: block;
        margin-top: 6px;
        color: #312e81;
        font-size: 12px;
      }

      .duration-details {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
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
        font-size: 11px;
      }

      .description-panel p {
        margin: 0;
        font-size: 14px;
        line-height: 1.55;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
      }

      th {
        background: linear-gradient(90deg, #2563eb, #4f46e5);
        color: white;
        text-align: left;
        padding: 7px 8px;
        font-weight: 950;
      }

      td {
        border: 1px solid #e2e8f0;
        padding: 7px 8px;
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
        font-size: 11px;
      }

      .price-line span {
        color: #111827;
        font-weight: 800;
      }

      .price-line strong {
        font-weight: 950;
      }

      .total-price {
        margin-top: 12px;
        border-top: 2px solid #bbf7d0;
        padding-top: 12px;
        display: flex;
        justify-content: space-between;
        color: #16a34a;
        font-weight: 950;
      }

      .total-price strong {
        font-size: 20px;
      }

      .pricing-summary p {
        margin: 12px -12px -12px;
        border-radius: 0 0 14px 14px;
        background: #dcfce7;
        color: #166534;
        padding: 10px;
        text-align: center;
        font-size: 11px;
        font-weight: 950;
      }

      .addons-panel {
        border-color: #e9d5ff;
      }

      .addon-total {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        border-top: 2px solid #e9d5ff;
        padding-top: 10px;
        color: #7c3aed;
        font-size: 12px;
        font-weight: 950;
      }

      .option-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
      }

      .option-card {
        min-height: 54px;
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
        min-height: 54px;
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

      .check-card strong {
        display: block;
        font-size: 9px;
      }

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

      .error-box {
        margin-top: 24px;
        border: 1px solid #fecaca;
        border-radius: 16px;
        background: #fee2e2;
        color: #991b1b;
        padding: 18px;
      }

      @page {
        size: A4;
        margin: 0;
      }

      @media print {
        html,
        body {
          width: 210mm;
          min-height: 297mm;
          background: white !important;
        }

        .no-print {
          display: none !important;
        }

        .a4-page {
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          box-shadow: none !important;
          padding: 12mm !important;
        }
      }
    `}</style>
  )
}
