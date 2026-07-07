'use client'

import type { Angelcare360AdministrationOverview } from '@/types/angelcare360/administration'

type Angelcare360SetupChecklistDrawerProps = {
  open: boolean
  overview: Angelcare360AdministrationOverview
  onClose: () => void
}

export default function Angelcare360SetupChecklistDrawer({ open, overview, onClose }: Angelcare360SetupChecklistDrawerProps) {
  if (!open) return null

  const checklist = [
    { label: 'Un établissement actif', done: overview.schoolCount > 0 },
    { label: 'Une année scolaire active', done: overview.academicYearCount > 0 },
    { label: 'Des périodes configurées', done: overview.termCount > 0 },
    { label: 'Des classes configurées', done: overview.classCount > 0 },
    { label: 'Des sections configurées', done: overview.sectionCount > 0 },
    { label: 'Le catalogue de matières', done: overview.subjectCount > 0 },
    { label: 'Le catalogue RBAC', done: overview.permissionCatalogReady },
  ]

  return (
    <div style={overlayStyle} role="presentation" onClick={onClose}>
      <div style={drawerStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Checklist de configuration</div>
            <h3 style={titleStyle}>Préparation du command center</h3>
            <p style={subtitleStyle}>Contrôle visuel du socle administratif avant d’ouvrir les modules métier.</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </div>

        <div style={scoreCardStyle}>
          <div style={scoreLabelStyle}>Score de préparation</div>
          <div style={scoreValueStyle}>{overview.setupScore}/8</div>
          <div style={scoreHintStyle}>Le score reflète la présence du socle scolaire, RBAC et configuration.</div>
        </div>

        <div style={listStyle}>
          {checklist.map((item) => (
            <div key={item.label} style={itemStyle}>
              <span>{item.label}</span>
              <span style={item.done ? doneBadgeStyle : pendingBadgeStyle}>{item.done ? 'OK' : 'À faire'}</span>
            </div>
          ))}
        </div>

        {overview.risks.length > 0 ? (
          <div style={riskBoxStyle}>
            <div style={riskTitleStyle}>Points de vigilance</div>
            <ul style={riskListStyle}>
              {overview.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  background: 'rgba(15,23,42,.34)',
  backdropFilter: 'blur(8px)',
  display: 'grid',
  placeItems: 'end',
  padding: 16,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(760px, 100%)',
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

const scoreCardStyle: React.CSSProperties = {
  borderRadius: 20,
  padding: 18,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  display: 'grid',
  gap: 8,
}

const scoreLabelStyle: React.CSSProperties = {
  color: '#1d4ed8',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const scoreValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 950,
}

const scoreHintStyle: React.CSSProperties = {
  color: '#1e3a8a',
  lineHeight: 1.55,
  fontWeight: 600,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 700,
}

const doneBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 9px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 12,
  fontWeight: 900,
}

const pendingBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 9px',
  background: '#fef3c7',
  color: '#92400e',
  fontSize: 12,
  fontWeight: 900,
}

const riskBoxStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  padding: 16,
}

const riskTitleStyle: React.CSSProperties = {
  color: '#b91c1c',
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const riskListStyle: React.CSSProperties = {
  margin: '10px 0 0',
  paddingInlineStart: 18,
  color: '#7f1d1d',
  lineHeight: 1.65,
  fontWeight: 600,
}

