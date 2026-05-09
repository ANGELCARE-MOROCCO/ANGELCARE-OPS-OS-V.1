import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createStaffControlMemoPhase4 } from '@/lib/staff-portal-os/phase4-admin-actions'

const inputStyle: React.CSSProperties = {
  minHeight: 42,
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '0 12px',
  fontWeight: 750,
  color: '#0f172a',
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 7,
  color: '#334155',
  fontWeight: 900,
}

export default function NewStaffMemoPage() {
  return (
    <AppShell
      title="New Staff Memo"
      subtitle="Push an ATC control memo to staff portal"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Memos', href: '/staff-memos' }, { label: 'New' }]}
      actions={<PageAction href="/staff-memos" variant="light">Back to memos</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#14532d,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#bbf7d0', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>ATC Control Broadcast</div>
        <h1 style={{ margin: '8px 0', fontSize: 36 }}>Create Staff Memo</h1>
        <p style={{ color: '#dcfce7', fontWeight: 760, lineHeight: 1.6, margin: 0 }}>Push daily briefings, warnings, urgent memos, protocol updates and operational messages.</p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 20, boxShadow: '0 18px 55px rgba(15,23,42,.07)', maxWidth: 900 }}>
        <form action={createStaffControlMemoPhase4} style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>Title<input name="title" required style={inputStyle} /></label>
          <label style={labelStyle}>Source<input name="source" defaultValue="AngelCare Control Tower" style={inputStyle} /></label>
          <label style={labelStyle}>
            Memo type
            <select name="memo_type" defaultValue="briefing" style={inputStyle}>
              {['briefing', 'warning', 'protocol', 'update', 'urgent', 'training', 'operations'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Severity
            <select name="severity" defaultValue="info" style={inputStyle}>
              {['info', 'success', 'warning', 'critical'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={labelStyle}>Target role optional<input name="target_role" style={inputStyle} /></label>
          <label style={labelStyle}>Target department optional<input name="target_department" style={inputStyle} /></label>
          <label style={labelStyle}>
            Body
            <textarea name="body" required rows={8} style={{ ...inputStyle, padding: 12, resize: 'vertical' }} />
          </label>
          <button type="submit" style={{ border: '1px solid #14532d', background: '#16a34a', color: 'white', borderRadius: 999, padding: '11px 16px', fontWeight: 950, justifySelf: 'start', cursor: 'pointer' }}>
            Push memo
          </button>
        </form>
      </section>
    </AppShell>
  )
}
