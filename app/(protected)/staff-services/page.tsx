import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffServicesPhase2 } from '@/lib/staff-portal-os/phase2-data'
import StaffPortalMemoPanelV2 from '../staff-home/_components/StaffPortalMemoPanelV2'

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
      <div style={{ color: tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#475569', fontWeight: 750 }}>{detail}</div>
    </div>
  )
}

export default async function StaffServicesPage() {
  const data = await getStaffServicesPhase2()

  return (
    <AppShell
      title="Staff Services"
      subtitle="Personal requests, memos and administrative services"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Staff Services' }]}
      actions={<PageAction href="/staff-services/new" variant="light">New Request</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 2</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Staff Services Control Desk</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Persistent memo acknowledgements and administrative service requests for every signed-in user.
        </p>
        <div style={{ marginTop: 18 }}>
          <Link href="/staff-services/new" style={{ background: 'white', color: '#1d4ed8', textDecoration: 'none', borderRadius: 999, padding: '10px 14px', fontWeight: 950 }}>Create service request</Link>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
        {data.metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </div>

      <div style={{ height: 22 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 20 }}>
        <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>My Service Requests</h2>
          <p style={{ color: '#64748b', fontWeight: 750 }}>Track admin services, HR support, documents, roster help and IT/support requests.</p>
          {data.requests.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '13px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong style={{ color: '#0f172a' }}>{item.title}</strong>
                <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{item.status}</span>
              </div>
              <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{item.request_type} · {item.priority}</div>
              {item.description ? <p style={{ color: '#475569', fontWeight: 700 }}>{item.description}</p> : null}
              {item.response ? <p style={{ color: '#047857', fontWeight: 800 }}>Response: {item.response}</p> : null}
            </div>
          ))}
        </section>

        <StaffPortalMemoPanelV2 memos={data.memos} />
      </div>
    </AppShell>
  )
}
