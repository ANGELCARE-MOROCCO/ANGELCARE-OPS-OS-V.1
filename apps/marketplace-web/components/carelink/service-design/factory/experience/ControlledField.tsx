'use client'

import { Check, Plus } from 'lucide-react'
import type { CategoryExperienceField } from '@/types/homeservice-category-experience'
import { cx } from '../FactoryUI'

const arrayValue = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : []

export function ControlledField({ field, value, onChange, accent = 'blue' }: { field: CategoryExperienceField; value: unknown; onChange: (value: unknown) => void; accent?: string }) {
  if (field.type === 'toggle') {
    const checked = Boolean(value)
    return <button type="button" onClick={() => onChange(!checked)} className={cx('flex min-h-20 w-full items-center justify-between rounded-2xl border p-4 text-left transition', checked ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}>
      <div><p className="text-sm font-black">{field.label}</p>{field.description ? <p className={cx('mt-1 text-[11px] font-semibold leading-5', checked ? 'text-slate-300' : 'text-slate-500')}>{field.description}</p> : null}</div>
      <span className={cx('grid h-7 w-7 place-items-center rounded-full border', checked ? 'border-white/20 bg-white/15' : 'border-slate-200 bg-slate-50')}>{checked ? <Check size={14} /> : null}</span>
    </button>
  }
  if (field.type === 'stepper' || field.type === 'number') {
    const numeric = Number(value ?? field.defaultValue ?? field.min ?? 0)
    const min = field.min ?? 0, max = field.max ?? 999
    return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black text-slate-950">{field.label}</p>{field.description ? <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{field.description}</p> : null}</div><div className="flex items-center gap-2"><button type="button" onClick={() => onChange(Math.max(min, numeric - 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50"><span className="text-lg font-black">−</span></button><span className="min-w-12 text-center text-xl font-black text-slate-950">{numeric}</span><button type="button" onClick={() => onChange(Math.min(max, numeric + 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50"><Plus size={14} /></button></div></div>{field.unit ? <p className="mt-2 text-right text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{field.unit}</p> : null}</div>
  }
  if (field.type === 'scale') {
    const numeric = Number(value ?? field.defaultValue ?? field.min ?? 1)
    return <label className="block rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-sm font-black text-slate-950">{field.label}</span><strong className="text-xl font-black text-slate-950">{numeric}</strong></div><input type="range" min={field.min ?? 1} max={field.max ?? 10} value={numeric} onChange={(event) => onChange(Number(event.target.value))} className="mt-4 w-full" /></label>
  }
  const selected = field.type === 'multi' ? arrayValue(value) : [String(value ?? '')]
  return <div className="space-y-3"><div><p className="text-sm font-black text-slate-950">{field.label}{field.required ? <span className="ml-1 text-rose-500">*</span> : null}</p>{field.description ? <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{field.description}</p> : null}</div><div className={cx('grid gap-2', field.options.length > 8 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2')}>
    {field.options.map((option) => { const active = selected.includes(option.code); return <button key={option.code} type="button" onClick={() => field.type === 'multi' ? onChange(active ? selected.filter((item) => item !== option.code) : [...selected, option.code]) : onChange(option.code)} className={cx('relative min-h-14 rounded-2xl border px-3 py-3 text-left transition', active ? 'border-slate-950 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400')}><span className="block text-xs font-black">{option.label}</span>{option.description ? <span className={cx('mt-1 block text-[10px] font-semibold leading-4', active ? 'text-slate-300' : 'text-slate-500')}>{option.description}</span> : null}{active ? <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/15"><Check size={11} /></span> : null}</button> })}
  </div></div>
}
