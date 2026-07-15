import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAutomationData } from '@/lib/opsos-automation/data'
import { createAutomationTrigger, createAutomationBriefing } from '@/lib/opsos-automation/actions'
import { AutoButton, AutoHero, AutoMetric, AutoPanel, AutoRow, AutoShell, autoGrid } from '@/components/angelcare-enterprise/AutomationUI'

const inputStyle: React.CSSProperties = { height: 42, borderRadius: 14, border: '1px solid #cbd5e1', padding: '0 12px', fontWeight: 750 }
const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900 }

export default function Page() {
  return (
    <AppShell title="New Automation Trigger" subtitle="Create operational trigger" breadcrumbs={[{ label: 'Automation', href: '/automation-command' }, { label: 'New Trigger' }]}>
      <AutoShell>
        <AutoHero eyebrow="Create Trigger" title="New Automation Trigger" subtitle="Create a condition/action rule for operational intelligence." tone="green" />
        <AutoPanel title="Trigger Setup" subtitle="Define condition and action labels." tone="green">
          <form action={createAutomationTrigger} style={{ display: 'grid', gap: 14, maxWidth: 900 }}>
            <label style={labelStyle}>Title<input name="title" required style={inputStyle} /></label>
            <label style={labelStyle}>Module<select name="module_key" defaultValue="global" style={inputStyle}>{['global','hr','staff','revenue','market','academy','operations'].map((x) => <option key={x}>{x}</option>)}</select></label>
            <label style={labelStyle}>Trigger type<input name="trigger_type" defaultValue="risk" style={inputStyle} /></label>
            <label style={labelStyle}>Condition<input name="condition_label" required style={inputStyle} /></label>
            <label style={labelStyle}>Action<input name="action_label" required style={inputStyle} /></label>
            <label style={labelStyle}>Route<input name="route" defaultValue="/automation-command" style={inputStyle} /></label>
            <button type="submit" style={{ justifySelf: 'start', border: '1px solid #047857', background: '#059669', color: 'white', borderRadius: 999, padding: '11px 16px', fontWeight: 950 }}>Create trigger</button>
          </form>
        </AutoPanel>
      </AutoShell>
    </AppShell>
  )
}
