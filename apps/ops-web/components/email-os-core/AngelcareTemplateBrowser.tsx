"use client"

import { useMemo, useState } from "react"
import { angelcareEmailTemplates } from "@/lib/email-os-core/angelcare-email-templates"

type Props = {
  onSelect?: (template: { subject: string; body: string; title: string; category: string }) => void
}

export function AngelcareTemplateBrowser({ onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")

  const categories = useMemo(
    () => Array.from(new Set(angelcareEmailTemplates.map((item) => item.category))),
    []
  )

  const filtered = useMemo(() => {
    return angelcareEmailTemplates.filter((item) => {
      const q = query.toLowerCase()
      return (category === "all" || item.category === category) &&
        (!q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q))
    })
  }, [category, query])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Modèles AngelCare</h2>
      <p className="text-sm font-semibold text-slate-500">{filtered.length} modèles opérationnels en français</p>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_260px]">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un modèle..." className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none">
          <option value="all">Toutes catégories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="mt-5 grid max-h-[560px] gap-3 overflow-y-auto">
        {filtered.map((template) => (
          <button key={template.id} type="button" onClick={() => onSelect?.(template)} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-black text-slate-950">{template.title}</div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{template.category}</div>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-600">{template.subject}</div>
            <div className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{template.body}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
