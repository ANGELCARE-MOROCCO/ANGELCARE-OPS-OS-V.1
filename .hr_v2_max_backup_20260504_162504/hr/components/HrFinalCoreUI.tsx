import Link from 'next/link'

export function HrFinalCoreHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 p-8 text-white shadow-2xl">
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-0 left-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative z-10 max-w-4xl">
        <div className="mb-3 inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-emerald-100">
          AngelCare HR Final Core
        </div>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">{subtitle}</p>
      </div>
    </section>
  )
}

export function HrMetricGrid({ cards }: { cards: Array<{ label: string; value: any; detail: string; href: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="group rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div className="text-sm font-bold text-slate-500">{card.label}</div>
          <div className="mt-3 text-4xl font-black text-slate-950">{card.value}</div>
          <div className="mt-2 text-sm text-slate-600">{card.detail}</div>
          <div className="mt-4 text-sm font-bold text-emerald-700 group-hover:text-emerald-900">Open control →</div>
        </Link>
      ))}
    </div>
  )
}

export function HrUnifiedFeed({ items }: { items: Array<any> }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Unified HR Operations Feed</h2>
          <p className="text-sm text-slate-500">Memos, leave, approvals, alerts and HR activity in one control stream.</p>
        </div>
        <Link href="/hr/actions" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Action Center</Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">No feed items yet. Once HR actions begin, they will appear here.</div>
        ) : items.map((item, idx) => (
          <Link href={item.href || '/hr'} key={`${item.title}-${idx}`} className="block rounded-2xl border bg-slate-50 p-4 transition hover:bg-emerald-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-black text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-600">{item.subtitle}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-slate-600 shadow-sm">{item.type} · {item.status}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function HrSourceMatrix({ sources }: { sources: Array<any> }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">System Sync Matrix</h2>
      <p className="mt-1 text-sm text-slate-500">Shows which app modules HR can currently read without crashing.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sources.map((s) => (
          <div key={s.key} className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-black text-slate-900">{s.key}</div>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${s.exists ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {s.exists ? 'LIVE' : 'FALLBACK'}
              </span>
            </div>
            <div className="mt-2 text-2xl font-black">{s.count}</div>
            {s.error ? <div className="mt-1 text-xs text-amber-700">{s.error}</div> : <div className="mt-1 text-xs text-slate-500">Rows detected</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
