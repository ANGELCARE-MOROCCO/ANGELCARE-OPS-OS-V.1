import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createHrRecord } from '../_lib/actions'
import { HR_TABLES, getHRDashboardData } from '@/lib/hr-production/repository'
import { HRAction, HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const active = data.staff.filter((x:any) => (x.employment_status || 'active') === 'active').length
  return <AppShell title="Staff 360" subtitle="Unified employee and caregiver HR records." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Staff 360'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/staff/new" variant="light">New staff</PageAction></>}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Active staff" value={active} /><HRCard title="Total profiles" value={data.staff.length} /><HRCard title="Missing docs" value={data.docs.filter((x:any)=>['missing','expired','pending'].includes(String(x.status||'missing'))).length} /><HRCard title="Open HR tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Create staff profile" subtitle="Creates a real `hr_staff` record and starts the unified HR source of truth.">
        <form action={createHrRecord} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="_table" value={HR_TABLES.staff} /><input type="hidden" name="_redirect" value="/hr/staff" />
          <input name="full_name" required placeholder="Full name" className="rounded-2xl border p-3" />
          <input name="phone" placeholder="Phone" className="rounded-2xl border p-3" />
          <input name="email" placeholder="Email" className="rounded-2xl border p-3" />
          <input name="city" placeholder="City" className="rounded-2xl border p-3" />
          <input name="department" placeholder="Department" className="rounded-2xl border p-3" />
          <input name="position" placeholder="Position" className="rounded-2xl border p-3" />
          <select name="employment_status" className="rounded-2xl border p-3"><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option></select>
          <select name="contract_type" className="rounded-2xl border p-3"><option value="cdi">CDI</option><option value="cdd">CDD</option><option value="freelance">Freelance</option><option value="internship">Internship</option></select>
          <input name="start_date" type="date" className="rounded-2xl border p-3" />
          <input name="monthly_salary" type="number" placeholder="Monthly salary MAD" className="rounded-2xl border p-3" />
          <input name="mission_capacity" type="number" placeholder="Mission capacity" className="rounded-2xl border p-3" />
          <button className="rounded-2xl bg-slate-950 p-3 font-black text-white">Create staff</button>
        </form>
      </HRSection>
      <HRSection title="Staff records" subtitle="Clickable rows now open `/hr/staff/[id]`." action={<HRAction href="/hr/documents">Documents</HRAction>}>
        <HRTable headers={['Name','Role','Contact','Status','Open']} rows={data.staff.map((x:any)=>[
          <div className="font-black text-slate-950">{x.full_name || x.name}</div>,
          `${x.department || 'Department'} • ${x.position || x.job_title || 'Position'}`,
          `${x.phone || 'No phone'} • ${x.email || 'No email'}`,
          <HRStatusPill value={x.employment_status || x.status || 'active'} />,
          <Link className="font-black text-slate-950 underline" href={`/hr/staff/${x.id}`}>Open 360</Link>
        ])} />
      </HRSection>
    </div>
  </AppShell>
}
