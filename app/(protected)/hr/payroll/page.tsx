import Link from 'next/link'
import { getHREmployeesCommandData } from '@/lib/hr-production/employees-command'

export const dynamic = 'force-dynamic'

function v(row: any, keys: string[], fallback = '—') {
  for (const key of keys) if (row?.[key] !== null && row?.[key] !== undefined && String(row[key]).trim()) return String(row[key])
  return fallback
}

export default async function Page() {
  const command = await getHREmployeesCommandData()
  const rows = command.employees.filter((x: any) => Number(x.__sync?.payroll || 0) > 0 || Number(x.__sync?.attendance || 0) > 0)
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-[32px] border border-white bg-white p-6 shadow-xl shadow-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">AngelCare HR</div><h1 className="mt-2 text-4xl font-black tracking-tight">Payroll Inputs Control</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Synced payroll readiness layer based on existing employee, attendance and payroll records. Use this page to identify who is ready for payroll validation and who needs missing inputs fixed.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/hr/employees" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Employees center</Link><Link href="/hr/attendance" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Attendance</Link><Link href="/hr/reports/export" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Export</Link></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[['Employees', command.totals.employees], ['Payroll records', command.totals.payroll], ['Attendance records', command.totals.attendance], ['Ready profiles', rows.length]].map(([label, value]) => <div key={label} className="rounded-[26px] border border-white bg-white p-5 shadow-lg shadow-slate-200"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div><div className="mt-3 text-3xl font-black">{value}</div></div>)}
      </div>
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-950 text-xs font-black uppercase tracking-[0.12em] text-white"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Attendance</th><th className="px-4 py-3">Payroll</th><th className="px-4 py-3">Readiness</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{command.employees.map((e: any) => <tr key={v(e, ['id','email','full_name'])}><td className="px-4 py-4 font-black">{v(e, ['full_name','name','email'], 'Unnamed')}</td><td className="px-4 py-4 font-bold text-slate-600">{v(e, ['department'])}</td><td className="px-4 py-4 font-black">{e.__sync?.attendance || 0}</td><td className="px-4 py-4 font-black">{e.__sync?.payroll || 0}</td><td className="px-4 py-4 font-black">{Math.round(Number(e.__sync?.readiness || 0))}%</td><td className="px-4 py-4"><Link href={v(e, ['id'], '') ? `/hr/staff/${v(e, ['id'])}` : '/hr/employees'} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">Open</Link></td></tr>)}</tbody></table></div>
    </section>
  </main>
}
