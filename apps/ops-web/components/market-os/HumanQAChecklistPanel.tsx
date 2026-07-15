"use client"

import { EMAIL_OS_PRODUCTION_QA_MANIFEST } from "@/lib/email-os-core/production-qa-manifest"

export default function HumanQAChecklistPanel() {
  const grouped = EMAIL_OS_PRODUCTION_QA_MANIFEST.reduce<Record<string, typeof EMAIL_OS_PRODUCTION_QA_MANIFEST>>((acc, item) => {
    acc[item.area] ||= []
    acc[item.area].push(item)
    return acc
  }, {})

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">Human QA Checklist</h1>
      <p className="mt-2 text-sm leading-6 text-slate-9500">
        Use this checklist for the manual validation that code cannot honestly replace.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {Object.entries(grouped).map(([area, items]) => (
          <div key={area} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-black uppercase text-slate-950">{area}</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3">
                  <input type="checkbox" className="h-4 w-4 cursor-pointer" />
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  <span className="ml-auto rounded-full border border-slate-200 px-2 py-1 text-xs font-black uppercase text-slate-500">{item.severity}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
