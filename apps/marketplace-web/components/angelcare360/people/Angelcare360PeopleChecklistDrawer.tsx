'use client'

import Link from 'next/link'

type Angelcare360PeopleChecklistDrawerProps = {
  open: boolean
  items: Array<{ label: string; value: number; href: string }>
  onClose: () => void
}

export default function Angelcare360PeopleChecklistDrawer({ open, items, onClose }: Angelcare360PeopleChecklistDrawerProps) {
  if (!open) return null

  return (
    <div style={overlayStyle} role="presentation" onClick={onClose}>
      <div style={drawerStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Complétude des dossiers</div>
            <h3 style={titleStyle}>Checklist des données manquantes</h3>
            <p style={subtitleStyle}>Les éléments suivants signalent les dossiers à compléter avant les modules métier suivants.</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </div>

        <div style={gridStyle}>
          {items.map((item) => (
            <article key={item.label} style={cardStyle}>
              <div style={cardLabelStyle}>{item.label}</div>
              <div style={cardValueStyle}>{item.value}</div>
              <Link href={item.href} style={cardLinkStyle}>
                Ouvrir le module
              </Link>
            </article>
          ))}
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
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  padding: 16,
}

const cardLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const cardValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const cardLinkStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

