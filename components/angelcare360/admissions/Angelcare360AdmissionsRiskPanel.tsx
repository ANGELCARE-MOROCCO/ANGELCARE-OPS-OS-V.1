'use client'

type Angelcare360AdmissionsRiskPanelProps = {
  risks: string[]
  setupReadiness: {
    schoolReady: boolean
    academicYearReady: boolean
    classReady: boolean
    documentReady: boolean
    duplicateScanReady: boolean
  }
}

export default function Angelcare360AdmissionsRiskPanel({ risks, setupReadiness }: Angelcare360AdmissionsRiskPanelProps) {
  const readiness = [
    { label: 'Établissement', ok: setupReadiness.schoolReady },
    { label: 'Année scolaire', ok: setupReadiness.academicYearReady },
    { label: 'Classes', ok: setupReadiness.classReady },
    { label: 'Documents requis', ok: setupReadiness.documentReady },
    { label: 'Scan doublons', ok: setupReadiness.duplicateScanReady },
  ]

  return (
    <div style={shellStyle}>
      <article style={cardStyle}>
        <div style={titleStyle}>Préparation opérationnelle</div>
        <div style={readinessGridStyle}>
          {readiness.map((item) => (
            <div key={item.label} style={readinessItemStyle}>
              <span style={readinessLabelStyle}>{item.label}</span>
              <span style={item.ok ? okStyle : koStyle}>{item.ok ? 'Prêt' : 'À configurer'}</span>
            </div>
          ))}
        </div>
      </article>

      <article style={cardStyle}>
        <div style={titleStyle}>Risques et alertes</div>
        {risks.length > 0 ? (
          <ul style={riskListStyle}>
            {risks.map((risk) => (
              <li key={risk} style={riskItemStyle}>
                {risk}
              </li>
            ))}
          </ul>
        ) : (
          <div style={positiveStyle}>Aucun risque bloquant détecté pour le moment.</div>
        )}
      </article>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
}

const cardStyle: React.CSSProperties = {
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

const readinessGridStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
}

const readinessItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  padding: '10px 12px',
  background: '#f8fafc',
}

const readinessLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 700,
}

const okStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 8px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 11,
  fontWeight: 900,
}

const koStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 8px',
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: 11,
  fontWeight: 900,
}

const riskListStyle: React.CSSProperties = {
  margin: '12px 0 0',
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: 8,
}

const riskItemStyle: React.CSSProperties = {
  borderRadius: 16,
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  color: '#9a3412',
  padding: '10px 12px',
  fontWeight: 650,
  lineHeight: 1.5,
}

const positiveStyle: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  background: '#dcfce7',
  border: '1px solid #bbf7d0',
  color: '#166534',
  padding: '10px 12px',
  fontWeight: 700,
  lineHeight: 1.55,
}

