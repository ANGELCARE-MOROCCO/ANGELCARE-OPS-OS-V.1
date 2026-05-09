import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffPortalAdminPhase4Data } from '@/lib/staff-portal-os/phase4-admin-data'
import { updateStaffMemoStatusPhase4 } from '@/lib/staff-portal-os/phase4-admin-actions'

export default async function StaffMemosPage() {
  const data = await getStaffPortalAdminPhase4Data()

  return (
    <AppShell
      title="Staff Memo Broadcasts"
      subtitle="Control tower pushed memos and acknowledgement monitoring"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Memos' }]}
      actions={<PageAction href="/staff-memos/new" variant="light">New Memo</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#14532d,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#bbf7d0', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>ATC Control Broadcast</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Memo Broadcast Center</h1>
        <p style={{ color: '#dcfce7', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Create and monitor staff control memos, warnings, daily briefings and operational updates.
        </p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Broadcast Queue</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Change memo status and monitor acknowledgement volume.</p>

        {data.memos.map((memo) => (
          <div key={memo.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 17 }}>{memo.title}</strong>
                <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>
                  {memo.memo_type} · {memo.severity} · {memo.source} · {memo.acknowledgements} ACK
                </div>
              </div>
              <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{memo.status}</span>
            </div>
            <p style={{ color: '#475569', fontWeight: 700 }}>{memo.body}</p>
            <form action={updateStaffMemoStatusPhase4} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="hidden" name="memo_id" value={memo.id} />
              <select name="status" defaultValue={memo.status} style={{ height: 38, borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 750 }}>
                {['active', 'urgent', 'paused', 'archived'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button type="submit" style={{ height: 38, borderRadius: 999, border: '1px solid #14532d', background: '#16a34a', color: 'white', fontWeight: 950, padding: '0 13px', cursor: 'pointer' }}>
                Update status
              </button>
            </form>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
