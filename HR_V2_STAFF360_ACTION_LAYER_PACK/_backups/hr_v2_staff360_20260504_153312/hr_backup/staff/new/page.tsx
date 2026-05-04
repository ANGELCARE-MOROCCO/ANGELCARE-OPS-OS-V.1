import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getOptions() {
  const supabase = await createClient()
  const [positions, departments] = await Promise.all([
    supabase.from('hr_positions').select('title,department,level').order('title').limit(100).catch(() => ({ data: [] as any[] } as any)),
    supabase.from('hr_departments').select('name,code,color').order('name').limit(50).catch(() => ({ data: [] as any[] } as any))
  ])
  return { positions: positions.data || [], departments: departments.data || [] }
}

export default async function Page() {
  const { positions, departments } = await getOptions()
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#020617,#0f172a,#111827)] px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl"><p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-[0.22em]">HR Intake</p><h1 className="text-4xl font-black">Create Staff Profile</h1><p className="mt-3 max-w-3xl text-slate-300">Operational intake screen for creating HR profiles and preparing onboarding, position assignment, roster, documents and probation tracking.</p></div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-black">Staff Data Form</h2>
            <p className="mt-2 text-sm text-slate-400">Use this form as the HR control layout. Connect final submit to your existing user creation flow or Supabase server action.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {['Full name','Email / user id','Phone','Contract type','Start date','Probation end','Salary base','Payroll code','Manager user id','Notes'].map(label => <label key={label} className="block"><span className="text-xs font-bold uppercase text-slate-500">{label}</span><input className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" placeholder={label} /></label>)}
              <label className="block"><span className="text-xs font-bold uppercase text-slate-500">Department</span><select className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"><option>Select department</option>{departments.map((d:any) => <option key={d.name}>{d.name}</option>)}</select></label>
              <label className="block"><span className="text-xs font-bold uppercase text-slate-500">Position</span><select className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"><option>Select position</option>{positions.map((p:any) => <option key={p.title}>{p.title}</option>)}</select></label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3"><button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950">Create profile draft</button><button className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold">Save onboarding checklist</button><Link href="/hr/staff" className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold">Cancel</Link></div>
          </div>
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-black">Auto-Onboarding Checklist</h2><div className="mt-4 space-y-3 text-sm text-slate-300">{['Create staff profile','Assign position and department','Prepare contract type','Assign first roster shift','Request required documents','Assign training/certification','Create management memo','Enable module permissions'].map(x => <div key={x} className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />{x}</div>)}</div></div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-black">Position Intelligence</h2><div className="mt-4 grid gap-3">{positions.slice(0,8).map((p:any) => <div key={p.title} className="rounded-2xl bg-slate-950 p-3"><p className="font-bold">{p.title}</p><p className="text-xs text-slate-500">{p.department} · {p.level}</p></div>)}</div></div>
          </aside>
        </div>
      </section>
    </main>
  )
}
