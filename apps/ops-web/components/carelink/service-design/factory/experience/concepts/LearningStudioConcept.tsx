import { CheckSquare2, Layers3, Sparkles } from 'lucide-react'
import type { ConceptLayoutProps } from '../types'

export function LearningStudioConcept({ blueprint, renderSection }: ConceptLayoutProps) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4"><Layers3 className="text-indigo-700" size={20} /><p className="mt-2 text-xs font-black text-indigo-950">Profil apprenant</p></div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><Sparkles className="text-blue-700" size={20} /><p className="mt-2 text-xs font-black text-blue-950">Objectifs mesurables</p></div><div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><CheckSquare2 className="text-violet-700" size={20} /><p className="mt-2 text-xs font-black text-violet-950">Séquences locales</p></div></div><div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">{blueprint.sections.map((section, index) => <div key={section.code} className={index === 1 ? 'xl:row-span-2' : ''}>{renderSection(section)}</div>)}</div></div>
}
