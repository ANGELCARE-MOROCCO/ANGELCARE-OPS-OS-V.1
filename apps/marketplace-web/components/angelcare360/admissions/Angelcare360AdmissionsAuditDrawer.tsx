'use client'

import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Angelcare360AdmissionsAuditDrawerProps = {
  open: boolean
  event: Angelcare360AuditRecord | null
  onClose: () => void
}

export default function Angelcare360AdmissionsAuditDrawer({ open, event, onClose }: Angelcare360AdmissionsAuditDrawerProps) {
  if (!open || !event) return null

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={`Audit ${event.action}`}>
      <div style={drawerStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Audit admissions</div>
            <h3 style={titleStyle}>{event.module} · {event.action}</h3>
            <p style={subtitleStyle}>{event.entity_type || 'Entrée sans type'} · {event.severity}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </div>

        <div style={metaGridStyle}>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Acteur</div><div style={metaValueStyle}>{event.actor_role || '—'}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Entité</div><div style={metaValueStyle}>{event.entity_type || '—'}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Heure</div><div style={metaValueStyle}>{new Date(event.created_at).toLocaleString('fr-FR')}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Requête</div><div style={metaValueStyle}>{event.request_id || '—'}</div></div>
        </div>

        <div style={payloadGridStyle}>
          <section style={payloadCardStyle}>
            <div style={payloadLabelStyle}>Avant</div>
            <pre style={codeStyle}>{JSON.stringify(event.before_data || {}, null, 2)}</pre>
          </section>
          <section style={payloadCardStyle}>
            <div style={payloadLabelStyle}>Après</div>
            <pre style={codeStyle}>{JSON.stringify(event.after_data || {}, null, 2)}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'grid',
  placeItems: 'end',
  padding: 16,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(920px, 100%)',
  maxHeight: '100%',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 28,
  border: '1px solid #dbe4ef',
  boxShadow: '0 30px 90px rgba(15, 23, 42, 0.18)',
  padding: 22,
  display: 'grid',
  gap: 18,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  fontWeight: 650,
}

const closeButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '8px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
}

const metaCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  background: '#f8fafc',
  padding: 14,
}

const metaLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const metaValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontWeight: 800,
  lineHeight: 1.45,
}

const payloadGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 12,
}

const payloadCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  background: '#fff',
  padding: 14,
}

const payloadLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const codeStyle: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 14,
  background: '#f8fafc',
  padding: 14,
  overflowX: 'auto',
  color: '#0f172a',
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
}

