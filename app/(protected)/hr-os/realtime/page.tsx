import Link from 'next/link'
import HrOsShell from '@/app/components/hr-os/HrOsShell'
import { ActionButton, Badge, Kpi, Panel, inputStyle } from '@/app/components/hr-os/EliteCards'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { buildRealtimeQueue } from '../_lib/hrRealtimeEngine'
import { createHrRealtimeAlert, updateHrRealtimeAlertStatus } from '../_actionsRealtime'

export default async function HrRealtimeAlertsPage() {
  await requireAccess('hr.view')
  const supabase = await createClient()

  let actions: any[] = []
  let alerts: any[] = []

  try {
    const [{ data: actionData }, { data: alertData }] = await Promise.all([
      supabase.from('hr_os_actions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('hr_os_realtime_alerts').select('*').order('created_at', { ascending: false }).limit(100),
    ])

    actions = actionData || []
    alerts = alertData || []
  } catch {
    actions = []
    alerts = []
  }

  const queue = buildRealtimeQueue(actions)
  const critical = queue.filter((item) => item.alert_severity === 'critical').length
  const missingOwner = queue.filter((item) => item.alert_status === 'missing_owner').length
  const queuedAlerts = alerts.filter((a) => a.status === 'queued').length

  return (
    <HrOsShell
      title="HR-OS Real-Time Alerts"
      subtitle="SLA monitoring, real-time queue, alert creation, acknowledgement and escalation readiness across HR operations."
      active="realtime"
      actions={<Link href="/hr-os/enterprise" style={topLink}>Enterprise</Link>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <Kpi label="Realtime Queue" value={queue.length} tone="#2563eb" />
          <Kpi label="Critical Alerts" value={critical} tone="#ef4444" />
          <Kpi label="Missing Owners" value={missingOwner} tone="#f59e0b" />
          <Kpi label="Queued Manual Alerts" value={queuedAlerts} tone="#7c3aed" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Create Alert" subtitle="Queue a controlled internal alert for HR managers or future notification channels." tone="#7c3aed">
            <form action={createHrRealtimeAlert} style={{ display: 'grid', gap: 10 }}>
              <input name="title" required placeholder="Alert title..." style={inputStyle} />
              <textarea name="message" placeholder="Alert message, action expected, risk and owner..." style={{ ...inputStyle, minHeight: 90 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <select name="severity" style={inputStyle}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                </select>
                <select name="channel" style={inputStyle}>
                  <option value="internal">Internal</option>
                  <option value="manager_review">Manager Review</option>
                  <option value="future_email">Future Email</option>
                  <option value="future_whatsapp">Future WhatsApp</option>
                </select>
                <input name="target_route" defaultValue="/hr-os" style={inputStyle} />
              </div>
              <ActionButton>Create Alert</ActionButton>
            </form>
          </Panel>

          <Panel title="SLA Logic" subtitle="What the alert layer watches automatically." tone="#16a34a">
            <div style={{ display: 'grid', gap: 10 }}>
              <Rule title="High priority action" text="Immediately becomes urgent review." />
              <Rule title="Missing owner" text="Becomes assignment alert until owner is set." />
              <Rule title="Incident / urgent wording" text="Escalates severity to critical." />
              <Rule title="Closed action" text="Removed from active realtime queue." />
            </div>
          </Panel>
        </div>

        <Panel title="Auto-Detected Realtime Queue" subtitle="Built from current HR actions using priority, owner and notes signals." tone="#ef4444">
          <div style={{ display: 'grid', gap: 10 }}>
            {queue.length ? queue.slice(0, 30).map((item) => (
              <div key={item.id} style={row}>
                <div>
                  <strong>{item.alert_message}</strong>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{item.notes || 'No notes captured.'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Badge tone={item.alert_severity === 'critical' ? '#ef4444' : item.alert_severity === 'high' ? '#f59e0b' : '#2563eb'}>{item.alert_severity}</Badge>
                  <Badge tone="#0f172a">{item.alert_status}</Badge>
                </div>
              </div>
            )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No active realtime queue.</p>}
          </div>
        </Panel>

        <Panel title="Manual Alert Queue" subtitle="Alerts created by HR managers for tracking, acknowledgement and future notification delivery." tone="#2563eb">
          <div style={{ display: 'grid', gap: 10 }}>
            {alerts.length ? alerts.map((a) => (
              <div key={a.id} style={row}>
                <div>
                  <strong>{a.title}</strong>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{a.message || 'No message'}</p>
                  <small>{a.channel || 'internal'} · {a.target_route || '/hr-os'}</small>
                </div>
                <form action={updateHrRealtimeAlertStatus} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="hidden" name="id" value={a.id} />
                  <select name="status" defaultValue={a.status || 'queued'} style={{ ...inputStyle, padding: 9 }}>
                    <option value="queued">queued</option>
                    <option value="acknowledged">acknowledged</option>
                    <option value="resolved">resolved</option>
                  </select>
                  <button style={smallButton}>Save</button>
                </form>
              </div>
            )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No manual alerts created yet.</p>}
          </div>
        </Panel>
      </div>
    </HrOsShell>
  )
}

function Rule({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 16, border: '1px solid #dbe3ee', background: '#f8fafc' }}>
      <strong>{title}</strong>
      <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{text}</p>
    </div>
  )
}

const topLink: React.CSSProperties = { display: 'inline-flex', padding: '10px 12px', borderRadius: 13, background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 950 }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 15, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const smallButton: React.CSSProperties = { border: 0, borderRadius: 11, padding: '9px 11px', background: '#0f172a', color: '#fff', fontWeight: 900 }
