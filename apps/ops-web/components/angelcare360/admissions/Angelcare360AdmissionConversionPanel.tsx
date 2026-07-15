'use client'

import Link from 'next/link'

type Angelcare360AdmissionConversionPanelProps = {
  applicationId: string
  readinessLabel: string
  canConvert: boolean
  disabledReason?: string
  onConvert?: () => void
  conversionHref?: string
}

export default function Angelcare360AdmissionConversionPanel({
  applicationId,
  readinessLabel,
  canConvert,
  disabledReason,
  onConvert,
  conversionHref,
}: Angelcare360AdmissionConversionPanelProps) {
  return (
    <section style={shellStyle}>
      <div style={titleStyle}>Conversion vers le socle personnes</div>
      <div style={summaryStyle}>{readinessLabel}</div>
      <div style={actionRowStyle}>
        {conversionHref ? (
          <Link href={conversionHref} style={primaryLinkStyle}>
            Ouvrir la conversion
          </Link>
        ) : (
          <button
            type="button"
            onClick={onConvert}
            disabled={!canConvert || Boolean(disabledReason)}
            title={disabledReason}
            style={!canConvert || disabledReason ? disabledButtonStyle : primaryButtonStyle}
          >
            Convertir le dossier
          </button>
        )}
        <div style={metaStyle}>Dossier {applicationId}</div>
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const titleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const summaryStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 650,
}

const actionRowStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 700,
}

