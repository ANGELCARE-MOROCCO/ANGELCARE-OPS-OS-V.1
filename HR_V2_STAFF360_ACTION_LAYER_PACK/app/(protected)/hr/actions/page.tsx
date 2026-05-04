import Link from 'next/link'

export default function Page({ searchParams }: { searchParams: Record<string,string|undefined> }) {
  const user = searchParams.user || 'selected staff'
  const action = searchParams.action || 'HR Action'
  const actions = ['Assign Shift','Request Replacement','Approve Leave','Upload Document','Add Certification','Log Performance Review','Send Memo','Create HR Approval','Create Disciplinary Record','Prepare Payroll Input','Assign Training','Update Contract Status']
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#020617,#172554,#111827)] px-6 py-8 lg:px-10"><div className="mx-auto max-w-6xl"><p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-[0.22em]">HR Action Desk</p><h1 className="text-4xl font-black">{action}</h1><p className="mt-3 max-w-3xl text-slate-300">Central action workspace for staff user: <span className="font-bold text-white">{user}</span>. This page gives managers a clean control layer for HR operations before deeper server actions are attached.</p></div></section>
      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <aside className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-black">Action Menu</h2><div className="mt-4 grid gap-3">{actions.map(a => <Link key={a} href={`/hr/actions?user=${encodeURIComponent(user)}&action=${encodeURIComponent(a)}`} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold hover:border-blue-400">{a}</Link>)}</div></aside>
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6"><h2 className="text-2xl font-black">Execution Form</h2><p className="mt-2 text-sm text-slate-400">Operational template for capturing the action, assigning owner, due date, approval level, memo and audit note.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{['Action title','Assigned owner','Due date','Priority','Approval status','Related module','Staff user id','Audit note','Management memo','Next follow-up'].map(label => <label key={label}><span className="text-xs font-bold uppercase text-slate-500">{label}</span><input className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder={label} /></label>)}</div><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white">Save action draft</button><button className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold">Send for approval</button><Link href={user !== 'selected staff' ? `/hr/staff/${user}` : '/hr'} className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold">Back</Link></div></div>
        </div>
      </section>
    </main>
  )
}
