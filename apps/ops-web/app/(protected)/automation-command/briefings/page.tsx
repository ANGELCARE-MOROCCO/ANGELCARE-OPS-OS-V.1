import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAutomationData } from '@/lib/opsos-automation/data'
import { createAutomationTrigger, createAutomationBriefing } from '@/lib/opsos-automation/actions'
import { AutoButton, AutoHero, AutoMetric, AutoPanel, AutoRow, AutoShell, autoGrid } from '@/components/angelcare-enterprise/AutomationUI'

const inputStyle: React.CSSProperties = { height: 38, borderRadius: 12, border: '1px solid #cbd5e1', padding: '0 10px', fontWeight: 750 }

export default async function Page() {
  const data = await getAutomationData()
  return (
    <AppShell title="Intelligence Briefings" subtitle="Operational recommendations" breadcrumbs={[{ label: 'Automation', href: '/automation-command' }, { label: 'Briefings' }]}>
      <AutoShell>
        <AutoHero eyebrow="Operational Intelligence" title="Intelligence Briefings" subtitle="Briefings transform raw operational signals into recommendations and priorities." tone="green" />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
          <AutoPanel title="Briefing Queue" subtitle="Open intelligence and recommendations." tone="green">
            {data.briefings.map((b:any) => <AutoRow key={b.id} title={b.title} meta={`${b.module_key} · ${b.summary || ''} · ${b.recommendation || ''}`} status={b.severity} href={b.route || '/enterprise-command'} tone={b.severity === 'critical' ? 'red' : b.severity === 'high' ? 'amber' : 'green'} />)}
          </AutoPanel>
          <AutoPanel title="Create Briefing" subtitle="Manual intelligence note." tone="blue">
            <form action={createAutomationBriefing} style={{ display: 'grid', gap: 10 }}>
              <input name="title" placeholder="Briefing title" required style={inputStyle} />
              <select name="module_key" defaultValue="global" style={inputStyle}>{['global','executive','hr','staff','revenue','market','academy','operations'].map((x) => <option key={x}>{x}</option>)}</select>
              <select name="severity" defaultValue="medium" style={inputStyle}>{['low','medium','high','critical'].map((x) => <option key={x}>{x}</option>)}</select>
              <input name="route" defaultValue="/enterprise-command" style={inputStyle} />
              <textarea name="summary" rows={4} placeholder="Summary" style={{ borderRadius: 12, border: '1px solid #cbd5e1', padding: 10 }} />
              <textarea name="recommendation" rows={4} placeholder="Recommendation" style={{ borderRadius: 12, border: '1px solid #cbd5e1', padding: 10 }} />
              <button type="submit" style={{ border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', borderRadius: 999, padding: '10px 14px', fontWeight: 950 }}>Create briefing</button>
            </form>
          </AutoPanel>
        </div>
      </AutoShell>
    </AppShell>
  )
}
