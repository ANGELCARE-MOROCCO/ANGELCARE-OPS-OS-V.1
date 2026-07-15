import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { getStaffCommandData } from '@/lib/hr-production/staff-enterprise'
import { StaffButton, StaffHero, StaffMetric, StaffPanel, StaffShell, StaffStatus, StaffTable } from '../_components/StaffEnterpriseUI'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'

function t(v: any) { return String(v || '').toLowerCase() }
function readiness(row: any) {
  let score = 100
  if (!row.email) score -= 10
  if (!row.phone) score -= 10
  if (!row.department) score -= 10
  if (!row.position) score -= 10
  if (t(row.employment_status).includes('archiv')) score -= 30
  return Math.max(0, score)
}

export default async function Page() {
  const { staff, active, archived, documents, attendance, contracts } = await getStaffCommandData()
  const cities = new Set(staff.map((x: any) => x.city).filter(Boolean)).size
  const avgReadiness = staff.length ? Math.round(staff.reduce((a: number, x: any) => a + readiness(x), 0) / staff.length) : 0

  const rows = staff.slice(0, 100).map((x: any) => [
    <Link key="name" href={`/hr/staff/${x.id}`} className="font-black text-slate-950 hover:underline">{x.full_name || x.name || x.email || 'Unnamed staff'}</Link>,
    x.position || '—',
    x.department || '—',
    x.city || '—',
    <StaffStatus key="status" value={x.employment_status || x.status || 'active'} />,
    `${readiness(x)}%`,
    <div key="actions" className="flex flex-wrap gap-2">
      <Link className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white" href={`/hr/staff/${x.id}`}>Open</Link>
      <Link className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-700" href={`/hr/employees/${x.id}`}>Edit</Link>
    </div>
  ])

  return (
    <AppShell>
      <StaffShell>
        <HRModuleCommandBridge context="Staff Command Center" compact />
        <StaffHero
          eyebrow="AngelCare HR Staff OS"
          title="Staff Command Center"
          subtitle="Premium workforce control layer for staff profiles, attendance synchronization, contracts, documents, rosters, performance, payroll inputs and operational readiness."
          score={avgReadiness}
          actions={<>
            <StaffButton href="/hr/staff/new">+ Add staff</StaffButton>
            <StaffButton href="/hr/staff?view=import" variant="light">Import CSV</StaffButton>
            <StaffButton href="/hr/sync-center" variant="light">Sync center</StaffButton>
            <StaffButton href="/hr/reports" variant="light">Export workforce</StaffButton>
          </>}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StaffMetric title="Total staff" value={staff.length} detail="All records" />
          <StaffMetric title="Active" value={active.length} detail="Operational workforce" />
          <StaffMetric title="Archived" value={archived.length} detail="Inactive records" />
          <StaffMetric title="Cities" value={cities} detail="Coverage locations" />
          <StaffMetric title="Attendance" value={attendance.length} detail="Synced records" />
          <StaffMetric title="Contracts" value={contracts.length} detail="Contract records" />
        </section>

        <StaffPanel title="Workforce execution board" subtitle="Open every staff record, edit profile, inspect compliance and manage actions from one premium table.">
          <StaffTable headers={['Staff', 'Position', 'Department', 'City', 'Status', 'Readiness', 'Actions']} rows={rows} />
        </StaffPanel>

        <StaffPanel title="Staff submodule navigation" subtitle="Direct access to every operational staff layer.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['/hr/staff/new','Add Staff','Create a complete staff profile'],
              ['/hr/staff?status=active','Active Staff','Operational employees'],
              ['/hr/staff?status=archived','Archived Staff','Inactive employees'],
              ['/hr/attendance','Attendance','Punch and validation center'],
              ['/hr/documents','Documents','Compliance and expiry tracking'],
              ['/hr/contracts','Contracts','Employment agreements'],
              ['/hr/rosters','Rosters','Schedules and mission coverage'],
              ['/hr/training','Training','Academy and skill progression'],
              ['/hr/performance-matrix','Performance','Reviews and quality'],
              ['/hr/payroll','Payroll Inputs','Hours, bonuses and deductions'],
              ['/hr/onboarding','Onboarding','Checklists and readiness'],
              ['/hr/activity-timeline','Activity Timeline','Audit and actions'],
            ].map(([href,title,sub]) => (
              <Link key={href} href={href} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="font-black text-slate-950">{title}</div>
                <div className="mt-1 text-sm text-slate-500">{sub}</div>
              </Link>
            ))}
          </div>
        </StaffPanel>
      </StaffShell>
    </AppShell>
  )
}
