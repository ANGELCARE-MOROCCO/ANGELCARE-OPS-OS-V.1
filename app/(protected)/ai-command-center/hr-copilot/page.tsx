import AppShell from '@/app/components/erp/AppShell'
import { AIHero } from '@/components/angelcare-enterprise/AICopilotUI'

export default function Page() {
  return (
    <AppShell title="HR Copilot" subtitle="Operational AI copilot surface">
      <AIHero
        title="HR Copilot"
        subtitle="AI-assisted operational recommendations, summaries, priorities and execution guidance."
      />

      <div style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            padding: 20,
            boxShadow: '0 18px 55px rgba(15,23,42,.07)',
          }}
        >
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Recommended Actions</h2>
          <ul style={{ color: '#475569', fontWeight: 750, lineHeight: 1.7 }}>
            <li>Review operational pressure</li>
            <li>Generate execution summary</li>
            <li>Identify escalations</li>
            <li>Prioritize workflows</li>
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
