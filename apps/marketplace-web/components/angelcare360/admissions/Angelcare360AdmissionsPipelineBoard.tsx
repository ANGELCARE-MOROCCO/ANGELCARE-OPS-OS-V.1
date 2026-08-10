'use client'

import Link from 'next/link'
import type { Angelcare360AdmissionsPipelineCard } from '@/types/angelcare360/admissions'

type Angelcare360AdmissionsPipelineBoardProps = {
  columns: Array<{ key: string; label: string; helpText: string }>
  groups: Record<string, Angelcare360AdmissionsPipelineCard[]>
  onChangeStatus?: (card: Angelcare360AdmissionsPipelineCard) => void
  canChangeStatus?: boolean
  disabledReason?: string
}

export default function Angelcare360AdmissionsPipelineBoard({
  columns,
  groups,
  onChangeStatus,
  canChangeStatus = true,
  disabledReason,
}: Angelcare360AdmissionsPipelineBoardProps) {
  return (
    <div style={boardStyle}>
      {columns.map((column) => {
        const cards = groups[column.key] || []
        return (
          <section key={column.key} style={columnStyle}>
            <div style={columnHeaderStyle}>
              <div>
                <div style={columnTitleStyle}>{column.label}</div>
                <div style={columnHelpStyle}>{column.helpText}</div>
              </div>
              <div style={countStyle}>{cards.length}</div>
            </div>

            <div style={cardListStyle}>
              {cards.length > 0 ? cards.map((card) => (
                <article key={card.id} style={cardStyle}>
                  <div style={cardTopStyle}>
                    <div>
                      <div style={cardTitleStyle}>{card.title}</div>
                      <div style={cardSubtitleStyle}>{card.subtitle || '—'}</div>
                    </div>
                    <span style={statusStyle}>{card.status}</span>
                  </div>
                  <div style={metaGridStyle}>
                    <div style={metaItemStyle}>
                      <div style={metaLabelStyle}>Prochaine action</div>
                      <div style={metaValueStyle}>{card.nextAction || '—'}</div>
                    </div>
                    <div style={metaItemStyle}>
                      <div style={metaLabelStyle}>Documents</div>
                      <div style={metaValueStyle}>{card.missingDocumentCount ? `${card.missingDocumentCount} manquant(s)` : 'Couvert'}</div>
                    </div>
                  </div>
                  <div style={actionRowStyle}>
                    <Link href={card.detailHref} style={linkStyle}>
                      Ouvrir
                    </Link>
                    <button
                      type="button"
                      onClick={() => onChangeStatus?.(card)}
                      disabled={!canChangeStatus || Boolean(disabledReason)}
                      title={disabledReason}
                      style={!canChangeStatus || disabledReason ? disabledButtonStyle : actionButtonStyle}
                    >
                      Changer le statut
                    </button>
                  </div>
                </article>
              )) : (
                <div style={emptyColumnStyle}>Aucun dossier dans cette étape.</div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

const boardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
}

const columnStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  alignContent: 'start',
}

const columnHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 10,
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
}

const columnTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
  fontSize: 14,
}

const columnHelpStyle: React.CSSProperties = {
  marginTop: 4,
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

const countStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const cardListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 14,
  boxShadow: '0 14px 42px rgba(15,23,42,.05)',
}

const cardTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'start',
}

const cardTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const cardSubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  color: '#475569',
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

const statusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 9px',
  background: '#f8fafc',
  color: '#334155',
  fontSize: 11,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const metaItemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const metaLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontWeight: 900,
}

const metaValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 700,
  lineHeight: 1.45,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '9px 12px',
  fontWeight: 800,
}

const actionButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '9px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 12,
  padding: '9px 12px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const emptyColumnStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px dashed #cbd5e1',
  padding: 14,
  background: '#f8fafc',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 600,
}

