import HrOsShell from '@/app/components/hr-os/HrOsShell'
import { ActionButton, Badge, Kpi, Panel, inputStyle } from '@/app/components/hr-os/EliteCards'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { createHrScenario } from '../_actionsScenario'
import { calculateScenario, rankScenarioPortfolio } from '../_lib/hrScenarioEngine'

export default async function HrExecutiveAICommandPage() {
  await requireAccess('hr.view')
  const supabase = await createClient()

  let scenarios: any[] = []
  let forecasts: any[] = []

  try {
    const [{ data: s }, { data: f }] = await Promise.all([
      supabase.from('hr_os_scenarios_v9').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('hr_os_workforce_forecasts').select('*').limit(100),
    ])
    scenarios = s || []
    forecasts = f || []
  } catch {
    scenarios = []
    forecasts = []
  }

  const portfolio = rankScenarioPortfolio(
    (scenarios.length ? scenarios : forecasts).map((item: any) => ({
      city: item.city || 'Unknown',
      current: Number(item.current_staff ?? item.current ?? 0),
      required: Number(item.required_staff ?? item.required ?? 0),
      projectedDemandIncrease: Number(item.projected_demand_increase ?? 20),
      averageHiringCost: Number(item.average_hiring_cost ?? 1200),
      targetCoverage: Number(item.target_coverage ?? 100),
    }))
  )

  const totalGap = portfolio.reduce((s, item) => s + item.result.gap, 0)
  const totalBudget = portfolio.reduce((s, item) => s + item.result.estimatedBudget, 0)
  const critical = portfolio.filter((item) => item.result.urgency === 'critical').length

  return (
    <HrOsShell
      title="HR-OS V9 Executive AI Command"
      subtitle="Scenario simulator for workforce demand, hiring budget, city expansion, readiness pressure and executive staffing decisions."
      active="executive-ai"
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <Kpi label="Scenario Gap" value={totalGap} tone="#ef4444" />
          <Kpi label="Budget Pressure" value={`${totalBudget.toLocaleString()} MAD`} tone="#7c3aed" />
          <Kpi label="Critical Cities" value={critical} tone="#dc2626" />
          <Kpi label="Scenarios" value={portfolio.length} tone="#2563eb" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Create Scenario" subtitle="Model demand increase, target coverage and required hiring budget." tone="#7c3aed">
            <form action={createHrScenario} style={{ display: 'grid', gap: 10 }}>
              <input name="name" required placeholder="Scenario name: Rabat expansion wave..." style={inputStyle} />
              <input name="city" required placeholder="City" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input name="current_staff" type="number" placeholder="Current staff" style={inputStyle} />
                <input name="required_staff" type="number" placeholder="Required staff" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <input name="projected_demand_increase" type="number" defaultValue="20" placeholder="Demand +%" style={inputStyle} />
                <input name="average_hiring_cost" type="number" defaultValue="1200" placeholder="Avg hiring cost" style={inputStyle} />
                <input name="target_coverage" type="number" defaultValue="100" placeholder="Coverage %" style={inputStyle} />
              </div>
              <textarea name="notes" placeholder="Executive assumptions, risks, decision context..." style={{ ...inputStyle, minHeight: 90 }} />
              <ActionButton>Create Scenario</ActionButton>
            </form>
          </Panel>

          <Panel title="Executive Scenario Portfolio" subtitle="Ranked city-level workforce pressure and recommended decisions." tone="#ef4444">
            <div style={{ display: 'grid', gap: 10 }}>
              {portfolio.length ? portfolio.map((item: any, index: number) => (
                <div key={`${item.city}-${index}`} style={scenarioRow}>
                  <div>
                    <strong>{item.city}</strong>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>
                      Current {item.current} · Required {item.required} · Projected required {item.result.projectedRequired}
                    </p>
                    <small>{item.result.recommendation}</small>
                  </div>
                  <div style={{ display: 'grid', gap: 7, justifyItems: 'end' }}>
                    <Badge tone={item.result.urgency === 'critical' ? '#ef4444' : item.result.urgency === 'high' ? '#f59e0b' : '#2563eb'}>{item.result.urgency}</Badge>
                    <strong>Gap {item.result.gap}</strong>
                    <small>{item.result.estimatedBudget.toLocaleString()} MAD</small>
                  </div>
                </div>
              )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No scenarios or forecasts found. Create the first scenario.</p>}
            </div>
          </Panel>
        </div>

        <Panel title="Executive Decision Doctrine" subtitle="How HR-OS translates scenario output into action." tone="#0f172a">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Doctrine title="Critical gap" text="Launch recruitment sprint, activate Academy, freeze non-critical allocation." />
            <Doctrine title="High gap" text="Targeted hiring wave and readiness acceleration." />
            <Doctrine title="Medium gap" text="Prepare backup pipeline and monitor demand." />
            <Doctrine title="Controlled" text="Maintain monitoring and preserve quality." />
          </div>
        </Panel>
      </div>
    </HrOsShell>
  )
}

function Doctrine({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ padding: 15, borderRadius: 18, background: '#f8fafc', border: '1px solid #dbe3ee' }}>
      <strong>{title}</strong>
      <p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 750 }}>{text}</p>
    </div>
  )
}

const scenarioRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 15, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
