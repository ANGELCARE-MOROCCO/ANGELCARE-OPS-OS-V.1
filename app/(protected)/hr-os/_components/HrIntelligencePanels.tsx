import { Badge, Kpi, Panel } from '@/app/components/hr-os/EliteCards'
import { generateSystemRecommendations, getHrCommandSignals, getHrRiskLevel, getNextBestAction, getReadinessScore } from '../_lib/hrIntelligence'

export function HrIntelligenceBoard({ actions }: { actions: any[] }) {
  const signals = getHrCommandSignals(actions)
  const recommendations = generateSystemRecommendations(actions)
  const topRisks = actions
    .filter((a) => a.status !== 'closed')
    .sort((a, b) => getReadinessScore(a) - getReadinessScore(b))
    .slice(0, 8)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
        {signals.map((s) => <Kpi key={s.label} label={s.label} value={s.value} sub={s.insight} tone={s.tone} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18, alignItems: 'start' }}>
        <Panel title="System Recommendations" subtitle="Auto-generated HR management priorities based on current action register." tone="#7c3aed">
          <div style={{ display: 'grid', gap: 10 }}>
            {recommendations.map((r) => (
              <div key={r} style={recCard}>
                <strong>{r}</strong>
                <small>Recommended by HR-OS intelligence layer</small>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk & Readiness Queue" subtitle="Lowest readiness and highest-risk actions requiring manager attention." tone="#ef4444">
          <div style={{ display: 'grid', gap: 10 }}>
            {topRisks.length ? topRisks.map((a) => (
              <div key={a.id} style={riskCard}>
                <div>
                  <strong>{a.title}</strong>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{getNextBestAction(a)}</p>
                </div>
                <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                  <Badge tone={getHrRiskLevel(a) === 'critical' || getHrRiskLevel(a) === 'high' ? '#ef4444' : '#f59e0b'}>{getHrRiskLevel(a)}</Badge>
                  <strong>{getReadinessScore(a)}%</strong>
                </div>
              </div>
            )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No active risk queue.</p>}
          </div>
        </Panel>
      </div>
    </div>
  )
}

const recCard: React.CSSProperties = { display: 'grid', gap: 5, padding: 15, borderRadius: 18, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#1e1b4b' }
const riskCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgba(15,23,42,.04)' }
