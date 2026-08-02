import { Sparkles, CheckSquare2, Layers3 } from 'lucide-react'
import type { ConceptLayoutProps } from '../types'

export function EventControlConcept({ blueprint, renderSection }: ConceptLayoutProps) {
  return <div className="space-y-5"><div className="rounded-[30px] border border-fuchsia-200 bg-gradient-to-r from-fuchsia-950 to-slate-950 p-5 text-white"><div className="flex flex-wrap items-center gap-4"><Sparkles size={26} className="text-fuchsia-300" /><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-fuchsia-300">Event Operations Studio</p><h3 className="mt-1 text-2xl font-black">Flux invités · groupes · stations · remise</h3></div><div className="ml-auto flex gap-2"><CheckSquare2 size={18} /><Layers3 size={18} /></div></div></div><div className="grid gap-5 lg:grid-cols-2">{blueprint.sections.map((section, index) => <div key={section.code} className={index === 1 || index === 2 ? 'lg:col-span-2' : ''}>{renderSection(section)}</div>)}</div></div>
}
