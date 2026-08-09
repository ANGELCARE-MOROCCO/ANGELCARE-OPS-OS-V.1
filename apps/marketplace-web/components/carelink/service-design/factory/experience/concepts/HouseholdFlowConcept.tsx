import { ChevronDown, CheckSquare2, Boxes } from 'lucide-react'
import type { ConceptLayoutProps } from '../types'

export function HouseholdFlowConcept({ blueprint, renderSection }: ConceptLayoutProps) {
  return <div className="space-y-5"><div className="rounded-[28px] border border-teal-200 bg-teal-950 p-5 text-white"><div className="flex items-center gap-4"><Boxes size={24} className="text-teal-300" /><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-300">Family Operations Flow</p><h3 className="mt-1 text-2xl font-black">Évaluer → Préparer → Exécuter → Vérifier → Transmettre</h3></div><CheckSquare2 className="ml-auto text-teal-300" size={24} /></div></div><div className="space-y-3">{blueprint.sections.map((section, index) => <div key={section.code}><div className="mx-auto mb-3 grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-teal-800"><span className="text-xs font-black">{index + 1}</span></div>{renderSection(section)}{index < blueprint.sections.length - 1 ? <ChevronDown className="mx-auto mt-3 text-teal-500" size={18} /> : null}</div>)}</div></div>
}
