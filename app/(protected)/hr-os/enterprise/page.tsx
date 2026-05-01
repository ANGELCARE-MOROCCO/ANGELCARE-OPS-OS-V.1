import Link from 'next/link'
import HrOsShell from '@/app/components/hr-os/HrOsShell'
import { Badge, Kpi, Panel, inputStyle, ActionButton } from '@/app/components/hr-os/EliteCards'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { buildEnterpriseQueue, HR_LIFECYCLE } from '../_lib/hrEnterpriseCommand'
import { createEnterpriseCommand, moveLifecycleStage } from '../_actionsEnterprise'

export default async function HrEnterpriseCommandPage() {
  await requireAccess('hr.view')
  const supabase = await createClient()

  let actions: any[] = []
  let commands: any[] = []
  try {
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from('hr_os_actions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('hr_os_enterprise_commands').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    actions = a || []
    commands = c || []
  } catch {
    actions = []
    commands = []
  }

  const queue = buildEnterpriseQueue(actions)
  const critical = queue.filter((q) => q.enterprise.severity === 'critical').length
  const high = queue.filter((q) => q.enterprise.severity === 'high').length

  return (
    <HrOsShell
      title="HR-OS Enterprise Command System"
      subtitle="Cross-module HR command layer: lifecycle control, system-generated enterprise queue, escalation routes and governance-ready execution."
      active="enterprise"
      actions={<Link href="/hr-os/intelligence" style={topLink}>Intelligence</Link>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <Kpi label="Enterprise Queue" value={queue.length} tone="#2563eb" />
          <Kpi label="Critical Commands" value={critical} tone="#ef4444" />
          <Kpi label="High Priority" value={high} tone="#f59e0b" />
          <Kpi label="Manual Commands" value={commands.length} tone="#7c3aed" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Create Enterprise Command" subtitle="Create a cross-module command that can route to HR, Academy, Ops or Reports." tone="#7c3aed">
            <form action={createEnterpriseCommand} style={{ display: 'grid', gap: 10 }}>
              <input name="command_title" required placeholder="Command title..." style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <select name="source_module" style={inputStyle}>
                  <option value="hr-os">HR-OS</option>
                  <option value="academy">Academy</option>
                  <option value="operations">Operations</option>
                  <option value="revenue">Revenue</option>
                </select>
                <select name="severity" style={inputStyle}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                </select>
                <input name="owner" placeholder="Owner" style={inputStyle} />
              </div>
              <input name="linked_route" defaultValue="/hr-os" style={inputStyle} />
              <textarea name="notes" placeholder="Command reason, target, expected outcome..." style={{ ...inputStyle, minHeight: 90 }} />
              <ActionButton>Create Enterprise Command</ActionButton>
            </form>
          </Panel>

          <Panel title="Lifecycle Controller" subtitle="Controlled HR lifecycle movement with validation rule enforcement." tone="#16a34a">
            <form action={moveLifecycleStage} style={{ display: 'grid', gap: 10 }}>
              <input name="entity_id" required placeholder="Entity ID / user ID / candidate ID" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select name="from_stage" style={inputStyle}>{HR_LIFECYCLE.map((s) => <option key={s}>{s}</option>)}</select>
                <select name="to_stage" style={inputStyle}>{HR_LIFECYCLE.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <textarea name="reason" placeholder="Reason for lifecycle transition..." style={{ ...inputStyle, minHeight: 90 }} />
              <ActionButton>Move Lifecycle Stage</ActionButton>
            </form>
          </Panel>
        </div>

        <Panel title="System-Generated Enterprise Queue" subtitle="HR-OS converts action records into cross-module commands and recommended routes." tone="#ef4444">
          <div style={{ display: 'grid', gap: 10 }}>
            {queue.length ? queue.slice(0, 20).map((item) => (
              <div key={item.id} style={queueRow}>
                <div>
                  <strong>{item.title}</strong>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{item.enterprise.command}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Badge tone={item.enterprise.severity === 'critical' ? '#ef4444' : '#f59e0b'}>{item.enterprise.severity}</Badge>
                  <Link href={item.enterprise.linkedRoute || '/hr-os'} style={routeButton}>Open Route</Link>
                </div>
              </div>
            )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No enterprise queue items yet.</p>}
          </div>
        </Panel>

        <Panel title="Manual Enterprise Commands" subtitle="Commands explicitly created by managers." tone="#2563eb">
          <div style={{ display: 'grid', gap: 10 }}>
            {commands.length ? commands.map((c) => (
              <div key={c.id} style={queueRow}>
                <div>
                  <strong>{c.command_title}</strong>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{c.notes || 'No notes'}</p>
                </div>
                <Badge tone={c.severity === 'critical' ? '#ef4444' : c.severity === 'high' ? '#f59e0b' : '#2563eb'}>{c.severity}</Badge>
              </div>
            )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No manual commands created yet.</p>}
          </div>
        </Panel>
      </div>
    </HrOsShell>
  )
}

const topLink: React.CSSProperties = { display: 'inline-flex', padding: '10px 12px', borderRadius: 13, background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 950 }
const queueRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 15, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const routeButton: React.CSSProperties = { display: 'inline-flex', padding: '9px 11px', borderRadius: 12, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 900 }
