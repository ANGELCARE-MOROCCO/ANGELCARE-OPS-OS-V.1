'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatMoney, formatCompactMoney } from '@/lib/pacojaco-ops/calculations'
import {
  buildPacojacoInterventionDisplayRows,
  getPacojacoDisplayedTotals,
  PACOJACO_COMPANY_BOX_ENTRIES,
  PACOJACO_FOOTER_SIGNATURE_LINES,
} from '@/lib/pacojaco-ops/presentation'
import type { PacojacoPrintableDocument } from '@/lib/pacojaco-ops/types'

type Props = {
  document: PacojacoPrintableDocument
  hasLogo?: boolean
}

function displayDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function boxLabel(key: string, label: string, value: string | null | undefined) {
  return (
    <div key={key} style={labelRowStyle}>
      <span style={labelKeyStyle}>{label}</span>
      <span style={labelValueStyle}>{value || '—'}</span>
    </div>
  )
}

export default function PacoJacoA4PrintDocument({ document, hasLogo = true }: Props) {
  const [logoBroken, setLogoBroken] = useState(false)
  useEffect(() => {
    if (!hasLogo) return
    const image = new Image()
    image.src = '/pacojaco/logo.png'
    image.onload = () => setLogoBroken(false)
    image.onerror = () => setLogoBroken(true)
  }, [hasLogo])

  const title = document.document_type === 'invoice' ? 'FACTURE' : 'DEVIS'
  const numberLabel = document.document_type === 'invoice' ? 'N° FACTURE' : 'N° DEVIS'
  const dateLabel = document.document_type === 'invoice' ? 'DATE' : 'DATE'
  const effectiveLogo = hasLogo && !logoBroken
  const interventionRows = useMemo(() => buildPacojacoInterventionDisplayRows(document), [document])
  const companyFields = useMemo(
    () => PACOJACO_COMPANY_BOX_ENTRIES.map(([label, value], index) => ({ key: `company-${index}-${label}`, label, value })),
    []
  )
  const documentFields = useMemo(
    () => [
      { key: 'document-date', label: dateLabel, value: displayDate(document.issue_date) },
      { key: 'document-number', label: numberLabel, value: document.document_number },
      { key: 'document-object', label: 'OBJET', value: document.object },
      { key: 'document-company', label: 'ENTREPRISE', value: document.client_company },
      { key: 'document-ice', label: 'ICE', value: document.client_ice },
      { key: 'document-contact', label: 'CONTACT', value: document.contact_name || document.client_name },
      { key: 'document-tel', label: 'TEL', value: document.client_phone },
      { key: 'document-region', label: 'REGION', value: document.region },
    ],
    [dateLabel, document.client_company, document.client_ice, document.client_name, document.client_phone, document.contact_name, document.document_number, document.issue_date, document.object, document.region, numberLabel]
  )
  const totalRows = useMemo(
    () =>
      getPacojacoDisplayedTotals(document)
        .filter(([label]) => label !== 'Total TTC')
        .map(([label, value]) => ({ key: `total-${label}`, label, value })),
    [document]
  )
  const footerRows = useMemo(
    () => PACOJACO_FOOTER_SIGNATURE_LINES.map((line, index) => ({ key: `footer-${index}`, line })),
    []
  )

  const totals = useMemo(
    () => ({
      subtotal: formatMoney(document.subtotal, document.currency),
      discount: formatMoney(document.discount_total, document.currency),
      advance: formatMoney(document.advance_amount, document.currency),
      remaining: formatMoney(document.remaining_amount, document.currency),
      total: formatMoney(document.total_ttc, document.currency),
    }),
    [document.advance_amount, document.currency, document.discount_total, document.remaining_amount, document.subtotal, document.total_ttc]
  )
  return (
    <div className="pacojaco-print-root" style={pageStyle}>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .pacojaco-print-root,
          .pacojaco-print-root * {
            visibility: visible !important;
          }

          .pacojaco-print-root {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 0 !important;
            overflow: hidden !important;
            transform: none !important;
            box-shadow: none !important;
          }

          .paco-a4-preview-scale {
            transform: none !important;
            width: 210mm !important;
          }

          .paco-a4-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
            break-after: avoid;
            page-break-after: avoid;
          }
        }
      `}</style>

      <article className="paco-a4-sheet" style={sheetStyle}>
        <header className="paco-a4-header" style={headerStyle}>
          <div style={brandBlockStyle}>
            <div style={logoShellStyle}>
              {effectiveLogo ? (
                <img
                  src="/pacojaco/logo.png"
                  alt="ANGELCARE"
                  onError={() => setLogoBroken(true)}
                  style={logoStyle}
                />
              ) : (
                <div style={logoFallbackStyle}>
                  <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.6 }}>ANGELCARE</div>
                </div>
              )}
            </div>
          </div>

          <div style={titleBlockStyle}>
            <div style={titleStyle}>{title}</div>
            <div style={numberStyle}>{document.document_number}</div>
            <div style={statusStyle}>{document.status.replace(/_/g, ' ').toUpperCase()}</div>
          </div>
        </header>

        <section className="paco-a4-body" style={bodyStyle}>
          <div style={topGridStyle}>
          <div style={infoCardStyle}>
            <div style={cardTitleStyle}>COMPANY / CONTACT</div>
            <div style={companyNameStyle}>ANGELCARE</div>
            <div style={companyBodyStyle}>
                {companyFields.map((field) => boxLabel(field.key, field.label, field.value))}
            </div>
          </div>

          <div style={infoCardStyle}>
            <div style={cardTitleStyle}>DOCUMENT / CLIENT</div>
            <div style={companyBodyStyle}>
                {documentFields.map((field) => boxLabel(field.key, field.label, field.value))}
            </div>
          </div>
          </div>

          <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>REF</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>DESIGNATION / DESCRIPTION</th>
                <th style={thStyle}>CAT</th>
                <th style={thStyle}>P.U</th>
                <th style={thStyle}>QTÉ</th>
                <th style={thStyle}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {document.items.length ? (
                document.items.map((item, index) => (
                  <tr key={`${item.ref || item.designation}-${index}`}>
                    <td style={tdStyle}>{item.ref || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700 }}>{item.designation}</div>
                      {item.description ? <div style={itemDescriptionStyle}>{item.description}</div> : null}
                    </td>
                    <td style={tdStyle}>{item.category || 'SVC'}</td>
                    <td style={tdStyle}>{formatCompactMoney(item.unit_price)}</td>
                    <td style={tdStyle}>{formatCompactMoney(item.quantity)}</td>
                    <td style={tdStyle}>{formatCompactMoney(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={emptyRowStyle}>
                    No items connected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div style={financialRowStyle}>
          <div style={leftFinanceStyle}>
            <div style={cardTitleStyle}>INFOS PAIEMENT</div>
            <div style={smallBodyStyle}>
              <div><strong>Mode:</strong> {document.payment_method || '—'}</div>
              <div><strong>Infos:</strong> {document.payment_info || '—'}</div>
              <div><strong>Date paiement:</strong> {displayDate(document.payment_date)}</div>
            </div>
          </div>

          <div style={centerFinanceStyle}>
            <div style={cardTitleStyle}>INFOS INTERVENTION</div>
            <div style={interventionListStyle}>
              {interventionRows.map((row, index) => (
                <div key={`intervention-${index}-${row.summary}`} style={interventionItemStyle}>
                  <div style={interventionTitleStyle}>{row.summary}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={rightFinanceStyle}>
            <div style={totalPillStyle}>
              <div style={totalLabelStyle}>TOTAL TTC</div>
              <div style={totalValueStyle}>{totals.total}</div>
            </div>
            <div style={summaryTableStyle}>
              {totalRows.map((row) => (
                <div key={row.key} style={summaryRowStyle}>
                  <span>{row.label}</span>
                  <strong>{formatMoney(row.value, document.currency)}</strong>
                </div>
              ))}
            </div>
          </div>
          </div>

          <div style={notesRowStyle}>
          <div style={conditionsCardStyle}>
            <div style={cardTitleStyle}>CONDITIONS</div>
            <div style={smallBodyStyle}>{document.conditions || '—'}</div>
          </div>
          <div style={conditionsCardStyle}>
            <div style={cardTitleStyle}>PAYMENT / REMARKS</div>
            <div style={smallBodyStyle}>{document.notes || '—'}</div>
          </div>
          </div>
        </section>

        <footer className="paco-a4-footer" style={footerBlockStyle}>
          <div style={footerTopRowStyle}>
            <div style={footerDepartmentStyle}>
              {footerRows.map((row) => (
                <div key={row.key}>{row.line}</div>
              ))}
            </div>
            <div style={footerSeparatorStyle} />
          </div>
          <div style={legalFooterStyle}>{document.legal_footer || '—'}</div>
        </footer>
      </article>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  background: '#fff',
  overflow: 'hidden',
}

const sheetStyle: React.CSSProperties = {
  width: '210mm',
  height: '297mm',
  minHeight: '297mm',
  maxHeight: '297mm',
  background: '#ffffff',
  color: '#111827',
  border: 'none',
  padding: '12mm 12mm 8mm',
  boxSizing: 'border-box',
  fontFamily: 'Arial, Helvetica, sans-serif',
  lineHeight: 1.25,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  pageBreakAfter: 'avoid',
  breakAfter: 'avoid',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 4,
  flex: '0 0 auto',
}

const bodyStyle: React.CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const brandBlockStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  minWidth: 0,
}

const logoShellStyle: React.CSSProperties = {
  width: '44mm',
  height: '28mm',
  border: 'none',
  borderRadius: 0,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  background: 'transparent',
}

const logoStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
}

const logoFallbackStyle: React.CSSProperties = {
  padding: 8,
  textAlign: 'center',
  color: '#0f172a',
  width: '100%',
}

const brandTextStyle: React.CSSProperties = { minWidth: 0 }

const brandNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#0f172a',
}

const brandMetaStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  fontWeight: 700,
  marginTop: 2,
}

const titleBlockStyle: React.CSSProperties = {
  textAlign: 'right',
  display: 'grid',
  justifyItems: 'end',
  gap: 2,
}

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: 1.1,
  color: '#0f172a',
}

const numberStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#1d4ed8',
}

const statusStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.5,
  color: '#475569',
}

const topGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
  marginBottom: 6,
}

const infoCardStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 7,
  minHeight: '30mm',
  boxSizing: 'border-box',
}

const cardTitleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.4,
  color: '#1d4ed8',
  marginBottom: 6,
}

const companyNameStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 6,
}

const companyBodyStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
  fontSize: 9.5,
}

const labelRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '72px 1fr',
  gap: 6,
  alignItems: 'start',
}

const labelKeyStyle: React.CSSProperties = {
  fontWeight: 900,
  color: '#334155',
}

const labelValueStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#0f172a',
  overflowWrap: 'anywhere',
}

const tableWrapStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  overflow: 'hidden',
  flex: '1 1 auto',
  minHeight: 0,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 9,
}

const thStyle: React.CSSProperties = {
  background: '#eef4ff',
  color: '#0f172a',
  borderBottom: '1px solid #cbd5e1',
  padding: '4px 4px',
  textAlign: 'center',
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 0.7,
}

const tdStyle: React.CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #f1f5f9',
  padding: '4px 4px',
  textAlign: 'center',
  verticalAlign: 'top',
  color: '#0f172a',
}

const itemDescriptionStyle: React.CSSProperties = {
  fontSize: 8,
  color: '#475569',
  marginTop: 3,
  whiteSpace: 'pre-wrap',
}

const emptyRowStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '10px 8px',
  color: '#64748b',
  fontStyle: 'italic',
}

const financialRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 0.9fr',
  gap: 6,
  marginTop: 6,
  alignItems: 'stretch',
}

const leftFinanceStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 6,
  minHeight: '34mm',
  boxSizing: 'border-box',
}

const centerFinanceStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 6,
  minHeight: '34mm',
  boxSizing: 'border-box',
}

const rightFinanceStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 6,
  minHeight: '34mm',
  display: 'grid',
  gap: 8,
  alignContent: 'start',
  boxSizing: 'border-box',
}

const smallBodyStyle: React.CSSProperties = {
  fontSize: 9,
  color: '#0f172a',
  display: 'grid',
  gap: 2,
}

const totalPillStyle: React.CSSProperties = {
  borderRadius: 12,
  background: '#0f172a',
  color: '#fff',
  padding: '8px 10px',
  textAlign: 'center',
}

const totalLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.2,
  opacity: 0.85,
}

const totalValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginTop: 4,
}

const summaryTableStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
  fontSize: 9,
}

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  borderBottom: '1px dashed #cbd5e1',
  paddingBottom: 4,
}

const notesRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
  marginTop: 6,
}

const conditionsCardStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 6,
  minHeight: '16mm',
  boxSizing: 'border-box',
}

const footerBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 'auto',
  paddingTop: '3mm',
  flex: '0 0 auto',
}

const footerTopRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
}

const footerSeparatorStyle: React.CSSProperties = {
  flex: 1,
  borderTop: '1px solid #d6dbe5',
  marginTop: 6,
}

const footerDepartmentStyle: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 900,
  color: '#0f172a',
  lineHeight: 1.28,
}

const legalFooterStyle: React.CSSProperties = {
  marginTop: 0,
  paddingTop: 0,
  fontSize: 7.5,
  lineHeight: 1.28,
  color: '#334155',
  textAlign: 'center',
}

const interventionListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const interventionItemStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#f8fbff',
  padding: '6px 8px',
}

const interventionTitleStyle: React.CSSProperties = {
  fontSize: 8.8,
  fontWeight: 900,
  color: '#0f172a',
  lineHeight: 1.25,
}
