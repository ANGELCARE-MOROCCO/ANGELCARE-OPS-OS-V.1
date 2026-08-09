'use client'

import type { CategoryExperienceSection } from '@/types/homeservice-category-experience'
import { ControlledField } from './ControlledField'
import { cx } from '../FactoryUI'

export function ExperienceSectionCard({ section, values, onChange, accent, dense = false }: { section: CategoryExperienceSection; values: Record<string, unknown>; onChange: (code: string, value: unknown) => void; accent: string; dense?: boolean }) {
  const layoutClass = section.layout === 'journey' ? 'lg:grid-cols-2' : section.layout === 'safety' ? 'lg:grid-cols-2' : section.layout === 'profile' ? 'lg:grid-cols-2' : 'lg:grid-cols-2'
  return <section id={`section-${section.code}`} className={cx('rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,.06)]', dense ? 'p-4' : 'p-5 sm:p-6')}>
    <header className="border-b border-slate-100 pb-4"><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-400">Configuration contrôlée</p><h3 className="mt-1 text-xl font-black tracking-[-.035em] text-slate-950">{section.title}</h3><p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-500">{section.description}</p></header>
    <div className={cx('mt-5 grid gap-4', layoutClass)}>{section.fields.map((field) => <ControlledField key={field.code} field={field} value={values[field.code]} onChange={(value) => onChange(field.code, value)} accent={accent} />)}</div>
  </section>
}
