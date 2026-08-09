'use client'

import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Angelcare360AuditEventDrawerProps = {
  open: boolean
  event: Angelcare360AuditRecord | null
  onClose: () => void
}

export default function Angelcare360AuditEventDrawer({ open, event, onClose }: Angelcare360AuditEventDrawerProps) {
  if (!open || !event) return null

  return (
    <div style={overlayStyle} role="presentation" onClick={onClose}>
      <div style={drawerStyle} onClick={(eventClick) => eventClick.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>{event.severity}</div>
            <h3 style={titleStyle}>{event.module} · {event.action}</h3>
            <p style={subtitleStyle}>{event.entity_type || 'entité non précisée'} · {event.created_at}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </div>

        <div style={gridStyle}>
          <div style={cardStyle}>
            <div style={labelStyle}>Acteur</div>
            <div style={valueStyle}>{event.actor_role || '—'} · {event.actor_user_id || '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Entité</div>
            <div style={valueStyle}>{event.entity_type || '—'} · {event.entity_id || '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Requête</div>
            <div style={valueStyle}>{event.request_id || '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Adresse IP</div>
            <div style={valueStyle}>{event.ip_address || '—'}</div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>Métadonnées</div>
          <pre style={codeStyle}>{JSON.stringify(event.metadata || {}, null, 2)}</pre>
        </div>
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>Avant</div>
          <pre style={codeStyle}>{JSON.stringify(event.before_data || {}, null, 2)}</pre>
        </div>
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>Après</div>
          <pre style={codeStyle}>{JSON.stringify(event.after_data || {}, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  background: 'rgba(15,23,42,.34)',
  backdropFilter: 'blur(8px)',
  display: 'grid',
  placeItems: 'end',
  padding: 16,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(860px, 100%)',
  maxHeight: '92vh',
  overflow: 'auto',
  borderRadius: 28,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 30px 90px rgba(15,23,42,.18)',
  padding: 22,
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
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
  lineHeight: 1.55,
  fontWeight: 600,
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: 14,
}

const labelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const valueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  lineHeight: 1.5,
  fontWeight: 700,
  wordBreak: 'break-word',
}

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const sectionLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const codeStyle: React.CSSProperties = {
  margin: 0,
  padding: 16,
  borderRadius: 18,
  background: '#0f172a',
  color: '#e2e8f0',
  fontSize: 12,
  lineHeight: 1.65,
  overflowX: 'auto',
}

