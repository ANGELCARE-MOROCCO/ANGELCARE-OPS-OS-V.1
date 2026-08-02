import { CheckSquare2, Send, Route } from 'lucide-react'
import type { ConceptLayoutProps } from '../types'

export function RouteSafetyConcept({ blueprint, renderSection }: ConceptLayoutProps) {
  return <div className="space-y-5"><div className="relative overflow-hidden rounded-[30px] border border-amber-200 bg-amber-50 p-5"><div className="absolute left-10 top-0 h-full border-l-2 border-dashed border-amber-300" /><div className="relative flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-amber-600 text-white"><Route size={21} /></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">Route & Safety Planner</p><h3 className="mt-1 text-2xl font-black text-slate-950">Départ <Route className="mx-2 inline text-amber-600" size={20} /> Points de contrôle <CheckSquare2 className="mx-2 inline text-amber-600" size={20} /> Remise</h3></div></div></div>{blueprint.sections.map((section, index) => <div key={section.code} className={index % 2 ? 'ml-0 lg:ml-12' : 'mr-0 lg:mr-12'}>{renderSection(section)}</div>)}</div>
}
