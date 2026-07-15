import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createStaffServiceRequestPhase2 } from '@/lib/staff-portal-os/phase2-actions'

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

export default function NewStaffServiceRequestPage() {
  return (
    <AppShell
      title="New Staff Service Request"
      subtitle="Create an administrative service request"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Staff Services', href: '/staff-services' }, { label: 'New' }]}
      actions={<PageAction href="/staff-services" variant="light">Back to services</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Services</div>
        <h1 style={{ margin: '8px 0', fontSize: 36 }}>Create Staff Service Request</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0 }}>Ask for HR support, admin help, roster support, documents, IT assistance, training or internal service follow-up.</p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 20, boxShadow: '0 18px 55px rgba(15,23,42,.07)', maxWidth: 860 }}>
        <form action={createStaffServiceRequestPhase2} style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>
            Request title
            <input name="title" required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Request type
            <select name="request_type" defaultValue="admin_service" style={inputStyle}>
              {['admin_service', 'hr_support', 'roster_support', 'document_request', 'training_request', 'it_support', 'attendance_support', 'access_request'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Priority
            <select name="priority" defaultValue="medium" style={inputStyle}>
              {['low', 'medium', 'high', 'critical'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Description
            <textarea name="description" rows={7} required style={{ ...inputStyle, padding: 12, resize: 'vertical' }} />
          </label>
          <button type="submit" style={{ border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', borderRadius: 999, padding: '11px 16px', fontWeight: 950, justifySelf: 'start', cursor: 'pointer' }}>
            Submit request
          </button>
        </form>
      </section>
    </AppShell>
  )
}
