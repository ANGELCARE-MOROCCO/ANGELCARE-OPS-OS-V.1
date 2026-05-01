import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, EmptyState, Kpi, NotificationCard, Panel, formatDate } from '../_components/NotificationCommandPrimitives'
import { createManualNotification, generateNotifications, markNotificationActed, markNotificationRead, resolveNotification } from './actions'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const [{ data: notificationsRaw }, { data: usersRaw }, { data: digestRaw }] = await Promise.all([
    supabase.from('bd_notifications').select('*').neq('status', 'resolved').order('impact_score', { ascending: false }).order('created_at', { ascending: false }).limit(80),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
    supabase.from('bd_notification_digest_runs').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const notifications = notificationsRaw || []
  const users = usersRaw || []
  const digests = digestRaw || []

  const unread = notifications.filter((n: any) => n.status === 'unread')
  const acted = notifications.filter((n: any) => n.status === 'acted')
  const critical = notifications.filter((n: any) => n.severity === 'critical')
  const warning = notifications.filter((n: any) => n.severity === 'warning')
  const avgImpact = notifications.length ? Math.round(notifications.reduce((s: number, n: any) => s + Number(n.impact_score || 0), 0) / notifications.length) : 0

  function userLabel(id?: string) {
    const user = users.find((u: any) => u.id === id)
    return user?.full_name || user?.username || 'Global / Manager'
  }

  return (
    <AppShell
      title="Notification Command Center"
      subtitle="Tier 2 alert inbox for revenue execution: tasks, prospects, follow-ups, insights, activation events, and manager interventions."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Notifications' }]}
      actions={<><PageAction href="/revenue-command-center/control-tower" variant="light">Control Tower</PageAction><PageAction href="/revenue-command-center/system-activation">System Activation</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>TIER 2 — NOTIFICATION COMMAND CENTER</div>
            <h1 style={heroTitleStyle}>Turn system noise into action-ranked alerts.</h1>
            <p style={heroTextStyle}>Generate, route, read, act, and resolve notifications connected to revenue execution surfaces.</p>
          </div>
          <form action={generateNotifications}>
            <button type="submit" style={heroButtonStyle}>Generate Notifications</button>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Open Alerts" value={notifications.length} sub="not resolved" tone="#2563eb" />
          <Kpi title="Unread" value={unread.length} sub="new alerts" tone="#d97706" />
          <Kpi title="Critical" value={critical.length} sub="immediate action" tone="#dc2626" />
          <Kpi title="Warnings" value={warning.length} sub="follow closely" tone="#d97706" />
          <Kpi title="Acted" value={acted.length} sub="in progress" tone="#16a34a" />
          <Kpi title="Avg Impact" value={avgImpact} sub="business pressure" tone="#7c3aed" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Command Inbox" subtitle="Highest impact notifications first.">
            <div style={{ display: 'grid', gap: 12 }}>
              {notifications.length ? notifications.map((notification: any) => (
                <NotificationCard key={notification.id} notification={notification}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge tone="#64748b">Recipient: {userLabel(notification.recipient_user_id)}</Badge>
                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button type="submit" style={smallLightButtonStyle}>Read</button>
                    </form>
                    <form action={markNotificationActed}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button type="submit" style={smallButtonStyle}>Mark Acted</button>
                    </form>
                    <form action={resolveNotification}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button type="submit" style={smallDangerButtonStyle}>Resolve</button>
                    </form>
                  </div>
                </NotificationCard>
              )) : <EmptyState title="No notifications" text="Generate notifications to populate the command inbox." />}
            </div>
          </Panel>

          <div style={{ display: 'grid', gap: 18 }}>
            <Panel title="Manual Notification" subtitle="Manager-created alert for one user or global command.">
              <form action={createManualNotification} style={formStyle}>
                <input name="title" required placeholder="Alert title" style={inputStyle} />
                <textarea name="message" rows={4} placeholder="Alert message..." style={inputStyle} />
                <select name="severity" defaultValue="info" style={inputStyle}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="success">Success</option>
                </select>
                <select name="recipient_user_id" style={inputStyle}>
                  <option value="">Global / Manager</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username} — {u.role}</option>)}
                </select>
                <input name="action_url" placeholder="/revenue-command-center/..." style={inputStyle} />
                <button type="submit" style={buttonStyle}>Create Notification</button>
              </form>
            </Panel>

            <Panel title="Digest Runs" subtitle="Notification generation audit trail.">
              <div style={{ display: 'grid', gap: 10 }}>
                {digests.length ? digests.map((d: any) => (
                  <article key={d.id} style={digestRowStyle}>
                    <strong>{formatDate(d.created_at)}</strong>
                    <span>Scanned {d.notifications_scanned} • Created {d.notifications_created}</span>
                    <span>Critical {d.critical_created} • Warning {d.warning_created}</span>
                  </article>
                )) : <EmptyState title="No digest runs" text="Generate notifications to create the first digest run." />}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#0ea5e9,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#e0f2fe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#e0f2fe', fontWeight: 750, maxWidth: 820, lineHeight: 1.6 }
const heroButtonStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.24)', borderRadius: 16, padding: '14px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '12px 14px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const smallButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '9px 11px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const smallLightButtonStyle: React.CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 12, padding: '9px 11px', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const smallDangerButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '9px 11px', background: '#dc2626', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const digestRowStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
