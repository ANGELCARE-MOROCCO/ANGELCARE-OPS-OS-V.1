import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffPortalAdminPhase4Data } from '@/lib/staff-portal-os/phase4-admin-data'
import { updateStaffServiceRequestPhase4 } from '@/lib/staff-portal-os/phase4-admin-actions'

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
      <div style={{ color: tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#475569', fontWeight: 750 }}>{detail}</div>
    </div>
  )
}

export default async function StaffServicesAdminPage() {
  const data = await getStaffPortalAdminPhase4Data()

  return (
    <AppShell
      title="Staff Services Admin"
      subtitle="Admin command desk for staff requests"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Staff Services', href: '/staff-services' }, { label: 'Admin' }]}
      actions={<PageAction href="/staff-memos/new" variant="light">Push Memo</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 4</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Admin Services Command</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Central control for staff service requests: triage, response, status update and operational follow-up.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {data.metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Staff Request Queue</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Update status and write response visible in staff services.</p>

        {data.requests.map((item) => (
          <div key={item.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 17 }}>{item.title}</strong>
                <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{item.request_type} · {item.priority} · {item.user_id.slice(0, 8)}</div>
              </div>
              <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{item.status}</span>
            </div>

            {item.description ? <p style={{ color: '#475569', fontWeight: 700 }}>{item.description}</p> : null}

            <form action={updateStaffServiceRequestPhase4} style={{ display: 'grid', gridTemplateColumns: '170px minmax(0,1fr) auto', gap: 10, alignItems: 'end', marginTop: 10 }}>
              <input type="hidden" name="request_id" value={item.id} />
              <label style={{ display: 'grid', gap: 5, fontWeight: 900, color: '#334155', fontSize: 13 }}>
                Status
                <select name="status" defaultValue={item.status} style={{ height: 38, borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 750 }}>
                  {['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 5, fontWeight: 900, color: '#334155', fontSize: 13 }}>
                Response
                <input name="response" defaultValue={item.response || ''} style={{ height: 38, borderRadius: 12, border: '1px solid #cbd5e1', padding: '0 10px', fontWeight: 750 }} />
              </label>
              <button type="submit" style={{ height: 38, borderRadius: 999, border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', fontWeight: 950, padding: '0 13px', cursor: 'pointer' }}>
                Update
              </button>
            </form>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
