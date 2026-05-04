import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { createRule } from './actions'

type AutomationTemplate = {
  id: string
  name: string
  category: string
  trigger_type: string
  impact: string
  cadence: string
  description: string
}

const CATEGORIES = [
  'Prospect Intake',
  'Qualification',
  'Follow-up',
  'Appointments',
  'Tasks',
  'Campaigns',
  'Partnerships',
  'Offers',
  'Retention',
  'Data Hygiene',
]

const TRIGGERS = [
  'prospect',
  'task',
  'appointment',
  'campaign',
  'partnership',
  'offer',
]

const ACTIONS = [
  'create follow-up task',
  'raise priority',
  'flag missing owner',
  'request outcome log',
  'prepare WhatsApp reminder',
  'create manager review item',
  'mark as attention required',
  'schedule next contact',
  'detect stalled opportunity',
  'route to senior agent',
]

const automationTemplates: AutomationTemplate[] = Array.from({ length: 300 }, (_, index) => {
  const category = CATEGORIES[index % CATEGORIES.length]
  const trigger_type = TRIGGERS[index % TRIGGERS.length]
  const action = ACTIONS[index % ACTIONS.length]
  const number = index + 1

  return {
    id: `auto-template-${number}`,
    name: `${category} Rule ${String(number).padStart(3, '0')} — ${action}`,
    category,
    trigger_type,
    impact: number % 5 === 0 ? 'Critical' : number % 3 === 0 ? 'High' : 'Standard',
    cadence: number % 4 === 0 ? 'Daily scan' : number % 2 === 0 ? 'On activity' : 'On creation',
    description: `Template designed to ${action} when ${trigger_type} activity requires operational control.`,
  }
})

function toneForStatus(status?: string | null) {
  const value = String(status || 'ready').toLowerCase()
  if (['active', 'enabled', 'running'].includes(value)) return '#22c55e'
  if (['paused', 'draft', 'inactive'].includes(value)) return '#f59e0b'
  if (['failed', 'error'].includes(value)) return '#ef4444'
  return '#38bdf8'
}

function formatStatus(status?: string | null) {
  return String(status || 'ready').replaceAll('_', ' ').toUpperCase()
}

export default async function AutomationPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bd_automation_rules')
    .select('*')
    .order('created_at', { ascending: false })

  const rules = data || []
  const activeRules = rules.filter((r: any) => ['active', 'enabled', 'running'].includes(String(r.status || '').toLowerCase())).length
  const readyRules = rules.length - activeRules
  const healthScore = rules.length ? Math.min(99, Math.max(35, 72 + activeRules * 3 - readyRules)) : 64

  return (
    <AppShell title="Automation Brain" subtitle="Premium rule-control room for Revenue Command Center execution logic.">
      <div style={pageStyle}>

        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>ANGELCARE REVENUE AUTOMATION CONTROL</div>
            <h1 style={heroTitleStyle}>Automation Command Matrix</h1>
            <p style={heroTextStyle}>
              Configure, inspect, and prepare operational rules for prospects, tasks, appointments, campaigns, partnerships, and offers.
              Rules created here are stored in your existing automation table. Real background execution still depends on your automation runner.
            </p>
            <div style={heroBadgesStyle}>
              <span style={badgeStyle}>300 rule templates loaded</span>
              <span style={badgeStyle}>Schema-safe UI</span>
              <span style={badgeStyle}>No route changes</span>
            </div>
          </div>

          <div style={radarPanelStyle}>
            <div style={radarHeaderStyle}>
              <span>LIVE RULE DIAGNOSTIC</span>
              <strong>{healthScore}%</strong>
            </div>
            <div style={waveBoxStyle}>
              <div style={waveLineStyle}></div>
              <div style={{ ...waveLineStyle, animationDelay: '.3s', opacity: .6 }}></div>
              <div style={{ ...waveLineStyle, animationDelay: '.6s', opacity: .35 }}></div>
              <div style={scanLineStyle}></div>
              <pre style={terminalStyle}>{`> rules_detected: ${rules.length}
> active_rules: ${activeRules}
> templates_available: 300
> engine_status: UI_READY
> runner: VERIFY_BACKEND
> signal: ${rules.length ? 'SYNC ONLINE' : 'WAITING FOR RULES'}`}</pre>
            </div>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <KpiCard label="Saved Rules" value={rules.length} note="Existing DB rules" tone="#38bdf8" />
          <KpiCard label="Active Signal" value={activeRules} note="Rules marked active/enabled" tone="#22c55e" />
          <KpiCard label="Template Bank" value={300} note="Preloaded safe templates" tone="#a78bfa" />
          <KpiCard label="Health Score" value={`${healthScore}%`} note="UI diagnostic estimate" tone="#f59e0b" />
        </section>

        <section style={mainGridStyle}>
          <div style={leftColumnStyle}>
            <Panel title="Create Automation Rule" subtitle="Create a real saved rule using your existing createRule action.">
              <form action={createRule} style={formStyle}>
                <label style={labelStyle}>Rule name</label>
                <input name="name" placeholder="Example: Follow up prospect after 48h silence" required style={inputStyle} />

                <label style={labelStyle}>Trigger type</label>
                <select name="trigger_type" style={inputStyle}>
                  <option value="prospect">Prospect</option>
                  <option value="task">Task</option>
                  <option value="appointment">Appointment</option>
                  <option value="campaign">Campaign</option>
                  <option value="partnership">Partnership</option>
                  <option value="offer">Offer</option>
                </select>

                <button type="submit" style={primaryButtonStyle}>Create Rule</button>
              </form>
            </Panel>

            <Panel title="Existing Rules" subtitle="Rules currently stored in bd_automation_rules.">
              <div style={rulesGridStyle}>
                {rules.length ? rules.map((r: any) => (
                  <article key={r.id} style={ruleCardStyle}>
                    <div style={ruleTopStyle}>
                      <strong>{r.name || 'Unnamed rule'}</strong>
                      <span style={{ ...statusPillStyle, borderColor: toneForStatus(r.status), color: toneForStatus(r.status) }}>
                        {formatStatus(r.status)}
                      </span>
                    </div>
                    <div style={ruleMetaStyle}>
                      <span>Trigger: {r.trigger_type || r.trigger || 'not set'}</span>
                      <span>Action: {r.action || 'stored rule'}</span>
                    </div>
                    <p style={ruleDescriptionStyle}>
                      Conditions: {typeof r.conditions === 'object' && r.conditions ? JSON.stringify(r.conditions) : 'No advanced condition saved yet.'}
                    </p>
                  </article>
                )) : (
                  <div style={emptyStyle}>
                    <strong>No rules saved yet.</strong>
                    <span>Create your first automation rule from the control panel.</span>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <aside style={rightColumnStyle}>
            <Panel title="Template Library — 300 Rules" subtitle="Operational rule ideas. Use names as ready-to-create rules.">
              <div style={templateToolbarStyle}>
                <span>Prospects</span>
                <span>Tasks</span>
                <span>Appointments</span>
                <span>Offers</span>
              </div>

              <div style={templateListStyle}>
                {automationTemplates.map((template) => (
                  <article key={template.id} style={templateCardStyle}>
                    <div style={templateHeaderStyle}>
                      <strong>{template.name}</strong>
                      <span style={smallPillStyle}>{template.impact}</span>
                    </div>
                    <div style={templateMetaStyle}>
                      <span>{template.category}</span>
                      <span>{template.trigger_type}</span>
                      <span>{template.cadence}</span>
                    </div>
                    <p style={templateTextStyle}>{template.description}</p>
                    <form action={createRule} style={{ marginTop: 10 }}>
                      <input type="hidden" name="name" value={template.name} />
                      <input type="hidden" name="trigger_type" value={template.trigger_type} />
                      <button type="submit" style={ghostButtonStyle}>Create from template</button>
                    </form>
                  </article>
                ))}
              </div>
            </Panel>
          </aside>
        </section>

      </div>
    </AppShell>
  )
}

function KpiCard({ label, value, note, tone }: { label: string; value: any; note: string; tone: string }) {
  return (
    <div style={{ ...kpiCardStyle, borderTopColor: tone }}>
      <span style={kpiLabelStyle}>{label}</span>
      <strong style={kpiValueStyle}>{value}</strong>
      <small style={kpiNoteStyle}>{note}</small>
    </div>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={panelTitleStyle}>{title}</h2>
        {subtitle ? <p style={panelSubtitleStyle}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18, padding: 28, borderRadius: 30, background: 'linear-gradient(135deg,#020617,#0f172a 52%,#052e16)', color: '#fff', boxShadow: '0 28px 80px rgba(2,6,23,.28)' }
const eyebrowStyle: React.CSSProperties = { color: '#86efac', fontSize: 12, fontWeight: 950, letterSpacing: 2 }
const heroTitleStyle: React.CSSProperties = { margin: '8px 0', fontSize: 40, lineHeight: 1, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: 0, color: '#cbd5e1', lineHeight: 1.7, fontWeight: 650, maxWidth: 860 }
const heroBadgesStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }
const badgeStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 999, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(134,239,172,.35)', color: '#bbf7d0', fontWeight: 850, fontSize: 12 }
const radarPanelStyle: React.CSSProperties = { borderRadius: 24, padding: 16, background: '#00140a', border: '1px solid rgba(134,239,172,.32)', boxShadow: 'inset 0 0 30px rgba(34,197,94,.12)' }
const radarHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#86efac', fontWeight: 950, marginBottom: 10 }
const waveBoxStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', minHeight: 220, borderRadius: 18, background: 'repeating-linear-gradient(0deg,#001b0d,#001b0d 9px,#002711 10px)', border: '1px solid rgba(134,239,172,.2)' }
const waveLineStyle: React.CSSProperties = { position: 'absolute', left: -80, top: '45%', width: '140%', height: 2, background: 'linear-gradient(90deg,transparent,#22c55e,transparent)', boxShadow: '0 0 20px #22c55e' }
const scanLineStyle: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: '100%', height: 42, background: 'linear-gradient(180deg,rgba(34,197,94,.14),transparent)' }
const terminalStyle: React.CSSProperties = { position: 'absolute', inset: 14, margin: 0, color: '#86efac', fontSize: 12, lineHeight: 1.7, fontWeight: 800, whiteSpace: 'pre-wrap' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const kpiCardStyle: React.CSSProperties = { borderTop: '5px solid', borderRadius: 22, padding: 18, background: '#fff', boxShadow: '0 18px 40px rgba(15,23,42,.08)', border: '1px solid #e2e8f0' }
const kpiLabelStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontWeight: 850, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }
const kpiValueStyle: React.CSSProperties = { display: 'block', color: '#0f172a', fontSize: 34, fontWeight: 950, marginTop: 6 }
const kpiNoteStyle: React.CSSProperties = { color: '#64748b', fontWeight: 750 }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 520px', gap: 18, alignItems: 'start' }
const leftColumnStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const rightColumnStyle: React.CSSProperties = { position: 'sticky', top: 20 }
const panelStyle: React.CSSProperties = { borderRadius: 26, padding: 20, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 45px rgba(15,23,42,.07)' }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
const panelSubtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 650, lineHeight: 1.5 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const primaryButtonStyle: React.CSSProperties = { border: 0, borderRadius: 14, padding: '14px 16px', color: '#fff', background: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const rulesGridStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const ruleCardStyle: React.CSSProperties = { padding: 15, borderRadius: 18, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#ffffff,#f8fafc)' }
const ruleTopStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
const statusPillStyle: React.CSSProperties = { border: '1px solid', borderRadius: 999, padding: '5px 9px', fontWeight: 950, fontSize: 11 }
const ruleMetaStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', color: '#64748b', fontWeight: 800, fontSize: 12, marginTop: 8 }
const ruleDescriptionStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', fontWeight: 650, lineHeight: 1.5 }
const emptyStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 18, background: '#f8fafc', color: '#475569', border: '1px dashed #cbd5e1' }
const templateToolbarStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }
const templateListStyle: React.CSSProperties = { display: 'grid', gap: 10, maxHeight: 760, overflow: 'auto', paddingRight: 6 }
const templateCardStyle: React.CSSProperties = { padding: 14, borderRadius: 18, background: '#020617', color: '#e2e8f0', border: '1px solid #1e293b' }
const templateHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10 }
const smallPillStyle: React.CSSProperties = { borderRadius: 999, padding: '4px 8px', background: '#064e3b', color: '#bbf7d0', fontWeight: 950, fontSize: 11, whiteSpace: 'nowrap' }
const templateMetaStyle: React.CSSProperties = { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8, color: '#93c5fd', fontWeight: 800, fontSize: 12 }
const templateTextStyle: React.CSSProperties = { margin: '8px 0 0', color: '#cbd5e1', lineHeight: 1.45, fontSize: 13 }
const ghostButtonStyle: React.CSSProperties = { width: '100%', border: '1px solid rgba(134,239,172,.35)', borderRadius: 12, padding: '10px 12px', color: '#bbf7d0', background: 'rgba(34,197,94,.08)', fontWeight: 900, cursor: 'pointer' }
