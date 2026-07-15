'use client'

import { useEffect, useMemo, useState } from 'react'

type AnyRecord = Record<string, any>

function money(value: any) {
  const n = Number(value || 0)
  return `${n.toLocaleString('fr-FR')} MAD`
}

function todayFr() {
  return new Date().toLocaleDateString('fr-FR')
}

function unwrap(payload: any) {
  const request =
    payload?.request ||
    payload?.record ||
    payload?.quoteRequest ||
    payload?.quote_request ||
    payload?.data?.request ||
    payload?.data?.record ||
    payload?.data ||
    payload

  const lines =
    payload?.lines ||
    payload?.quoteLines ||
    payload?.quote_lines ||
    payload?.data?.lines ||
    request?.lines ||
    request?.quote_lines ||
    []

  return { request: request || {}, lines: Array.isArray(lines) ? lines : [] }
}

export default function DevisPrintClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [request, setRequest] = useState<AnyRecord>({})
  const [lines, setLines] = useState<AnyRecord[]>([])

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const res = await fetch(`/api/b2b-marketplace/admin/quote-requests/${id}`, {
          cache: 'no-store',
        })

        const json = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(json?.error || json?.message || `HTTP ${res.status}`)
        }

        const normalized = unwrap(json)

        if (!alive) return
        setRequest(normalized.request)
        setLines(normalized.lines)
      } catch (err: any) {
        if (!alive) return
        setError(err?.message || 'Impossible de charger le devis.')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [id])

  const total = useMemo(() => {
    const requestTotal =
      request?.estimated_total_mad ??
      request?.total_mad ??
      request?.total ??
      request?.estimatedTotal

    if (Number(requestTotal || 0) > 0) return Number(requestTotal)

    return lines.reduce((sum, line) => {
      const qty = Number(line.quantity || line.qty || 1)
      const price = Number(
        line.unit_price_mad ||
          line.estimated_unit_price ||
          line.price_mad ||
          line.price ||
          0
      )
      return sum + qty * price
    }, 0)
  }, [request, lines])

  const clientName =
    request?.school_name ||
    request?.organization_name ||
    request?.creche_name ||
    request?.establishment_name ||
    request?.customer_name ||
    request?.title ||
    'Établissement à confirmer'

  const contactName =
    request?.contact_name ||
    request?.contact_person ||
    request?.customer_contact ||
    request?.full_name ||
    'Contact à confirmer'

  const phone = request?.phone || request?.telephone || request?.contact_phone || ''
  const email = request?.email || request?.contact_email || ''
  const city = request?.city || request?.ville || ''
  const ref =
    request?.request_ref ||
    request?.reference ||
    request?.ref ||
    request?.id ||
    id

  useEffect(() => {
    if (!loading && !error) {
      const timer = window.setTimeout(() => window.print(), 650)
      return () => window.clearTimeout(timer)
    }
  }, [loading, error])

  if (loading) {
    return <div className="print-loading">Préparation du devis A4...</div>
  }

  if (error) {
    return (
      <main className="screen-shell">
        <h1>Erreur devis</h1>
        <p>{error}</p>
      </main>
    )
  }

  return (
    <>
      <main className="a4-page">
        <header className="devis-header">
          <div>
            <div className="brand-row">
              <div className="logo-mark">AC</div>
              <div>
                <strong>ANGELCARE</strong>
                <span>B2B Crèche Marketplace</span>
              </div>
            </div>
            <h1>DEVIS B2B</h1>
            <p>Proposition indicative — produits, formations & solutions catalogue.</p>
          </div>

          <div className="doc-box">
            <span>Référence devis</span>
            <strong>{ref}</strong>
            <span>Date</span>
            <strong>{todayFr()}</strong>
            <span>Format</span>
            <strong>A4 / ISO</strong>
          </div>
        </header>

        <section className="summary-grid">
          <div className="card">
            <span className="eyebrow">Client</span>
            <h2>{clientName}</h2>
            <p><strong>Contact:</strong> {contactName}</p>
            <p><strong>Téléphone:</strong> {phone || '—'}</p>
            <p><strong>Email:</strong> {email || '—'}</p>
            <p><strong>Ville:</strong> {city || '—'}</p>
          </div>

          <div className="card navy-card">
            <span className="eyebrow">Total indicatif</span>
            <h2>{money(total)}</h2>
            <p>Prix catalogue indicatif, ajustable selon quantités, personnalisation, disponibilité et validation AngelCare.</p>
          </div>
        </section>

        <section className="items-section">
          <div className="section-title">
            <span>Sélection demandée</span>
            <strong>{lines.length} ligne(s)</strong>
          </div>

          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Type</th>
                <th>Qté</th>
                <th>PU</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const qty = Number(line.quantity || line.qty || 1)
                const unitPrice = Number(
                  line.unit_price_mad ||
                    line.estimated_unit_price ||
                    line.price_mad ||
                    line.price ||
                    0
                )
                const lineTotal =
                  Number(line.total_mad || line.estimated_total || 0) || qty * unitPrice

                return (
                  <tr key={line.id || `${line.reference_code || 'line'}-${index}`}>
                    <td>{line.reference_code || line.ref || line.item_ref || '—'}</td>
                    <td>
                      <strong>{line.title || line.item_title || line.name || 'Ligne devis'}</strong>
                      <small>{line.description || line.notes || line.personalization_notes || ''}</small>
                    </td>
                    <td>{line.item_type || line.type || 'Catalogue'}</td>
                    <td>{qty}</td>
                    <td>{money(unitPrice)}</td>
                    <td>{money(lineTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="terms">
          <div>
            <strong>Conditions indicatives</strong>
            <p>Ce devis est préparé à titre indicatif. Les prix finaux peuvent varier selon format, quantités, personnalisation, délais et validation fournisseur.</p>
          </div>
          <div>
            <strong>Prochaine étape</strong>
            <p>Validation du besoin, confirmation des références, ajustement commercial et émission du devis final AngelCare.</p>
          </div>
        </section>

        <footer>
          <strong>AngelCare — Preschool & Kindergarten</strong>
          <span>Catalogue B2B premium pour crèches, maternelles et établissements préscolaires.</span>
        </footer>
      </main>

      <div className="no-print actions">
        <button onClick={() => window.print()}>Imprimer A4</button>
        <button onClick={() => window.close()}>Fermer</button>
      </div>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          background: #eef3f9;
          color: #071225;
          font-family: Inter, Arial, sans-serif;
        }

        .print-loading,
        .screen-shell {
          padding: 48px;
          font-size: 18px;
        }

        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto;
          background: white;
          box-sizing: border-box;
          padding: 18mm;
          border-radius: 18px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
        }

        .devis-header {
          display: grid;
          grid-template-columns: 1fr 72mm;
          gap: 18px;
          align-items: stretch;
          padding-bottom: 18px;
          border-bottom: 2px solid #0b2d5c;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          letter-spacing: 0.18em;
        }

        .brand-row span {
          display: block;
          color: #64748b;
          font-size: 10px;
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        .logo-mark {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: #0b2d5c;
          color: white;
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          font-size: 42px;
          line-height: 0.95;
          letter-spacing: -0.05em;
          color: #071225;
        }

        .devis-header p {
          color: #475569;
          font-size: 13px;
          max-width: 110mm;
          line-height: 1.6;
        }

        .doc-box {
          background: linear-gradient(135deg, #0b2d5c, #0f3e7d);
          color: white;
          border-radius: 22px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .doc-box span {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.78;
        }

        .doc-box strong {
          font-size: 13px;
          margin-bottom: 8px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 14px;
          margin-top: 18px;
        }

        .card {
          border: 1px solid #dbe7f4;
          border-radius: 20px;
          padding: 16px;
          background: #f8fbff;
        }

        .navy-card {
          background: #0b2d5c;
          color: white;
        }

        .navy-card h2,
        .navy-card p,
        .navy-card span {
          color: white;
        }

        .eyebrow {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #64748b;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .card h2 {
          margin: 0 0 10px;
          font-size: 22px;
          letter-spacing: -0.03em;
        }

        .card p {
          margin: 5px 0;
          font-size: 12px;
          color: #334155;
        }

        .items-section {
          margin-top: 18px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 900;
          color: #0b2d5c;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid #dbe7f4;
        }

        th {
          background: #0b2d5c;
          color: white;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          padding: 10px;
          text-align: left;
        }

        td {
          padding: 11px 10px;
          border-bottom: 1px solid #e6edf6;
          font-size: 11px;
          vertical-align: top;
        }

        td strong {
          display: block;
          font-size: 12px;
        }

        td small {
          display: block;
          color: #64748b;
          margin-top: 3px;
          line-height: 1.35;
        }

        .terms {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 18px;
        }

        .terms div {
          border: 1px solid #dbe7f4;
          border-radius: 16px;
          padding: 13px;
          background: #ffffff;
        }

        .terms strong {
          font-size: 12px;
          color: #0b2d5c;
        }

        .terms p {
          font-size: 10.5px;
          line-height: 1.55;
          color: #475569;
        }

        footer {
          margin-top: 20px;
          border-top: 1px solid #dbe7f4;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          font-size: 10px;
          color: #64748b;
        }

        footer strong {
          color: #0b2d5c;
        }

        .actions {
          width: 210mm;
          margin: 0 auto 28px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .actions button {
          border: 0;
          border-radius: 999px;
          background: #0b2d5c;
          color: white;
          padding: 12px 18px;
          font-weight: 800;
          cursor: pointer;
        }

        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .a4-page {
            margin: 0;
            width: 210mm;
            min-height: 297mm;
            border-radius: 0;
            box-shadow: none;
            padding: 16mm;
            page-break-after: always;
          }
        }
      `}</style>
    </>
  )
}
