import AppShell from '@/app/components/erp/AppShell'
import { aiCopilots } from '@/lib/opsos-ai/data'
import { AICard, AIHero } from '@/components/angelcare-enterprise/AICopilotUI'

export default function Page() {
  return (
    <AppShell title="AI Command Center" subtitle="Operational copilots and intelligence layer">
      <AIHero title="OPSOS AI Command Center" subtitle="Enterprise copilots for executive command, HR, revenue, market and academy operations." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
        {aiCopilots.map((copilot) => (
          <AICard key={copilot.key} title={copilot.title} mission={copilot.mission} actions={copilot.actions} href={copilot.route} />
        ))}
      </div>
    </AppShell>
  )
}
