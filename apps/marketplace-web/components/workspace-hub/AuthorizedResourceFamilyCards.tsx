import Link from 'next/link'
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Layers3,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { AuthorizedIndependentResource } from '@/lib/workspace-hub/authorized-resources'

function riskClass(riskLevel: string) {
  const risk = String(riskLevel || '').toLowerCase()
  if (risk.includes('critical') || risk.includes('high')) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (risk.includes('medium') || risk.includes('warning')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default function AuthorizedResourceFamilyCards({ resources }: { resources: AuthorizedIndependentResource[] }) {
  if (!resources.length) return null

  return (
    <section className="relative -mt-px overflow-hidden bg-[#f2f7ff] [font-family:Inter,ui-sans-serif,system-ui,sans-serif] px-3 pb-12 sm:px-5 lg:px-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-transparent to-blue-50/40" aria-hidden="true" />

      <div className="relative w-full max-w-none overflow-hidden rounded-[38px] border border-white/90 bg-white/[0.88] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur-xl sm:p-7">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-28 left-[20%] h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.23em] text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Extended SANILA privileges
            </div>
            <h2 className="mt-4 max-w-5xl text-3xl font-black tracking-[-0.06em] text-slate-950 sm:text-4xl">
              Independent workspaces entrusted to your profile.
            </h2>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
              These route families and standalone operating pages come directly from the global access registry, beside your standard module authorization.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Layers3 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xl font-black tracking-[-0.04em] text-slate-950">{resources.length}</div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Additional access families</div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 min-[2360px]:grid-cols-6">
          {resources.map((resource) => {
            const isFamily = resource.resourceType === 'route_family'
            return (
              <Link
                key={resource.resourceKey}
                href={resource.href}
                className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_28px_78px_rgba(49,46,129,0.14)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500" />
                <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-indigo-100/70 blur-2xl transition duration-500 group-hover:scale-125" aria-hidden="true" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-700 to-blue-500 text-white shadow-[0_14px_30px_rgba(49,46,129,0.22)]">
                    {isFamily ? <Route className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
                  </div>
                  <span className={`rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${riskClass(resource.riskLevel)}`}>
                    {resource.riskLevel || 'normal'} risk
                  </span>
                </div>

                <div className="relative mt-5">
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-indigo-700">
                    {resource.category || resource.resourceType.replaceAll('_', ' ')}
                  </div>
                  <h3 className="mt-2 line-clamp-2 min-h-[56px] text-xl font-black leading-7 tracking-[-0.045em] text-slate-950">
                    {resource.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 min-h-[60px] text-xs font-semibold leading-5 text-slate-600">
                    {resource.description}
                  </p>
                </div>

                <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {resource.childCount} linked page{resource.childCount === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 transition group-hover:gap-2.5">
                    Enter
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="relative mt-6 flex flex-col gap-3 rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">Access remains governed by your live AngelCare profile.</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">No route shown here bypasses the permission registry.</div>
            </div>
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">SANILA • Verified access environment</div>
        </div>
      </div>
    </section>
  )
}
