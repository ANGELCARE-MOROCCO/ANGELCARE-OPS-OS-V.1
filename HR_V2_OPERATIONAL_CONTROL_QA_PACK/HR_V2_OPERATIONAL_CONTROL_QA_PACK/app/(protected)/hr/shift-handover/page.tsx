import OperationalControlShell from '@/components/hr-v2/OperationalControlShell'

export default function Page() {
  return (
    <OperationalControlShell active="handover">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <section>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">Manual production workspace</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Shift handover board</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Built for real daily HR operators: filter records, review exceptions, assign responsible users, capture evidence, and move work through controlled manual steps.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {['All','Urgent','Assigned to me','Unresolved'].map((f) => (
                <button key={f} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">{f}</button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Control item</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Incoming shift briefing</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Open the record, add notes, assign owner, set priority, and move the item through the manual HR control workflow.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Review</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Assign</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Add note</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Close</button>
            </div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Control item</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Unclosed shift notes</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Open the record, add notes, assign owner, set priority, and move the item through the manual HR control workflow.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Review</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Assign</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Add note</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Close</button>
            </div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Control item</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Client risk updates</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Open the record, add notes, assign owner, set priority, and move the item through the manual HR control workflow.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Review</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Assign</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Add note</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Close</button>
            </div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Control item</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Replacement watchlist</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Open the record, add notes, assign owner, set priority, and move the item through the manual HR control workflow.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Review</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Assign</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Add note</button>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Close</button>
            </div>
          </article>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Quick creation</h3>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900" placeholder="Record title" />
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"><option>Medium priority</option><option>High priority</option><option>Critical</option></select>
              <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900" placeholder="Operational notes" />
              <button className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950">Create control record</button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
            <h3 className="text-lg font-black">Operator rules</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Every issue must have owner + status.</li>
              <li>• Critical items require manager review.</li>
              <li>• Closed records must include resolution notes.</li>
              <li>• Audit trail should never be deleted.</li>
            </ul>
          </div>
        </aside>
      </div>
    </OperationalControlShell>
  )
}
