
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { ACADEMY_MODULES } from './_lib/config'
import { getAcademyDashboardData, displayName, displayStatus } from './_lib/data'
import { AcademyHero, AcademyNav, Header, KpiGrid, ModuleCardGrid } from './_components/AcademyUI'
import { createAcademyAlert, seedAcademyDemoData } from './actions'

export default async function AcademyCommandCenterPage() {
  await requireAccess('academy.view')
  const data = await getAcademyDashboardData()
  const trainees = data.trainees?.count || 0
  const enrollments = data.enrollments?.count || 0
  const payments = data.payments?.count || 0
  const certificates = data.certificates?.count || 0
  const alerts = data['alerts-sales']?.count || data.administration?.count || 0
  const latestRows = ACADEMY_MODULES.flatMap((m) => (data[m.key]?.rows || []).map((row) => ({ module: m, row }))).slice(0, 12)

  return (
    <AppShell
      title="Academy Command Center V3"
      subtitle="Centralized Academy ERP for trainees, groups, payments, attendance, certificates, partners, placement and after-sales."
      breadcrumbs={[{ label: 'Academy Command Center' }]}
      actions={<><PageAction href="/reports" variant="light">Reports</PageAction><PageAction href="/academy/trainees">New Trainee</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <AcademyNav />
        <AcademyHero title="AngelCare Academy Operating System" subtitle="A 5-year training control tower: candidate intake, eligibility, enrollment, training delivery, payment control, certification authenticity, partner placement and post-graduation revenue." badge="ACADEMY V3 / ISO-STYLE CONTROL CENTER">
          <div style={{ display: 'grid', gap: 12 }}>
            <strong style={{ fontSize: 38 }}>{trainees}</strong>
            <span style={{ fontWeight: 950 }}>trainee files</span>
            <small style={{ color: 'rgba(255,255,255,.76)', fontWeight: 800 }}>Lifecycle spine: Lead → Eligible → Enrolled → Trained → Certified → Placed/Upsold</small>
          </div>
        </AcademyHero>
        <KpiGrid items={[{ label: 'Trainees', value: String(trainees), sub: 'permanent profile folders' }, { label: 'Enrollments', value: String(enrollments), tone: '#0891b2', sub: 'course/group conversion' }, { label: 'Payments', value: String(payments), tone: '#f59e0b', sub: 'finance records' }, { label: 'Certificates', value: String(certificates), tone: '#16a34a', sub: 'authenticity records' }]} />
        <section style={panelStyle}>
          <Header title="14 Academy Submodules" subtitle="Every card opens a real operational submodule with forms, workflows, stored records and manager intelligence." />
          <ModuleCardGrid />
        </section>
        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Latest Academy Evidence" subtitle="Newest records across all Academy tables." />
            <div style={{ display: 'grid', gap: 10 }}>
              {latestRows.length ? latestRows.map(({ module, row }) => <a key={`${module.key}-${row.id}`} href={module.href} style={rowStyle}><span>{module.icon}</span><div><strong>{displayName(row)}</strong><small>{module.shortTitle} • {displayStatus(row)}</small></div></a>) : <div style={emptyStyle}>No Academy records yet. Seed demo data or create records inside submodules.</div>}
            </div>
          </div>
          <div style={panelStyle}>
            <Header title="CEO Action Launcher" subtitle="Create a management alert or seed data to validate all flows." />
            <form action={createAcademyAlert} style={{ display: 'grid', gap: 10 }}>
              <input name="title" placeholder="Alert title" required style={inputStyle}/>
              <textarea name="message" placeholder="Management instruction" rows={4} style={inputStyle}/>
              <select name="severity" style={inputStyle}><option value="normal">normal</option><option value="high">high</option><option value="critical">critical</option></select>
              <button style={buttonStyle}>Create Academy Alert</button>
            </form>
            <form action={seedAcademyDemoData} style={{ marginTop: 12 }}><button style={seedButtonStyle}>Seed demo validation data</button></form>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start' }
const rowStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #dbe3ee', color: '#0f172a', textDecoration: 'none' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 800 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 16, padding: '14px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const seedButtonStyle: React.CSSProperties = { ...buttonStyle, background: '#7c3aed', width: '100%' }
