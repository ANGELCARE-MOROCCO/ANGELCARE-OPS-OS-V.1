'use client'

import type { Angelcare360AdmissionConversionChecklistItem } from '@/types/angelcare360/admissions'

type Angelcare360AdmissionConversionChecklistProps = {
  checklist: Angelcare360AdmissionConversionChecklistItem[]
  duplicateCount: number
  capacityWarning?: string | null
}

export default function Angelcare360AdmissionConversionChecklist({
  checklist,
  duplicateCount,
  capacityWarning,
}: Angelcare360AdmissionConversionChecklistProps) {
  return (
    <section style={shellStyle}>
      <div style={titleStyle}>Checklist de conversion</div>
      <div style={listStyle}>
        {checklist.map((item) => (
          <div key={item.key} style={itemStyle}>
            <div style={itemHeadingStyle}>{item.label}</div>
            <div style={itemStatus(item.ok)}>{item.ok ? 'OK' : 'À corriger'}</div>
            <div style={itemTextStyle}>{item.explanation}</div>
          </div>
        ))}
      </div>
      <div style={footerStyle}>
        <div style={footerPillStyle}>{duplicateCount} doublon(s) potentiel(s)</div>
        {capacityWarning ? <div style={warningStyle}>{capacityWarning}</div> : <div style={okStyle}>Capacité sans alerte</div>}
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const itemStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 14,
  display: 'grid',
  gap: 8,
}

const itemHeadingStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 850,
}

function itemStatus(ok: boolean): React.CSSProperties {
  return ok
    ? { display: 'inline-flex', alignSelf: 'start', borderRadius: 999, padding: '5px 8px', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 900 }
    : { display: 'inline-flex', alignSelf: 'start', borderRadius: 999, padding: '5px 8px', background: '#fef2f2', color: '#b91c1c', fontSize: 11, fontWeight: 900 }
}

const itemTextStyle: React.CSSProperties = {
  color: '#475569',
  fontWeight: 600,
  lineHeight: 1.5,
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const footerPillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '7px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const warningStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '7px 10px',
  background: '#fff7ed',
  color: '#c2410c',
  fontSize: 12,
  fontWeight: 900,
}

const okStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '7px 10px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 12,
  fontWeight: 900,
}

