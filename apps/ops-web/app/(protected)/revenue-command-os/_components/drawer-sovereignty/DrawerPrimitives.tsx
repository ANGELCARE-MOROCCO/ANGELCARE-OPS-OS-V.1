'use client'

import { useEffect, type ElementType, type ReactNode } from 'react'
import { ArrowRight, ShieldCheck, X } from 'lucide-react'
import styles from './DrawerSovereignty.module.css'

type Tone = 'blue' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate'

const tones: Record<Tone, { badge: string; icon: string; line: string; soft: string }> = {
  blue: { badge: 'border-blue-200 bg-blue-50 text-blue-800', icon: 'bg-blue-50 text-blue-700', line: 'bg-blue-600', soft: 'border-blue-200 bg-blue-50/70' },
  cyan: { badge: 'border-cyan-200 bg-cyan-50 text-cyan-900', icon: 'bg-cyan-50 text-cyan-700', line: 'bg-cyan-600', soft: 'border-cyan-200 bg-cyan-50/70' },
  emerald: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: 'bg-emerald-50 text-emerald-700', line: 'bg-emerald-600', soft: 'border-emerald-200 bg-emerald-50/70' },
  violet: { badge: 'border-violet-200 bg-violet-50 text-violet-800', icon: 'bg-violet-50 text-violet-700', line: 'bg-violet-600', soft: 'border-violet-200 bg-violet-50/70' },
  amber: { badge: 'border-amber-200 bg-amber-50 text-amber-900', icon: 'bg-amber-50 text-amber-700', line: 'bg-amber-500', soft: 'border-amber-200 bg-amber-50/75' },
  rose: { badge: 'border-rose-200 bg-rose-50 text-rose-800', icon: 'bg-rose-50 text-rose-700', line: 'bg-rose-600', soft: 'border-rose-200 bg-rose-50/70' },
  slate: { badge: 'border-slate-200 bg-slate-100 text-slate-800', icon: 'bg-slate-100 text-slate-700', line: 'bg-slate-700', soft: 'border-slate-200 bg-slate-50' },
}

export function SovereignDrawerOverlay({ children, onClose, label, zIndex = 'z-[170]' }: { children: ReactNode; onClose: () => void; label: string; zIndex?: string }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return <div className={`fixed inset-0 ${zIndex} flex justify-end bg-slate-950/48 backdrop-blur-[5px] ${styles.overlay}`} role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>{children}</div>
}

export function SovereignDrawerPanel({ children, width = 'max-w-[820px]', dataId }: { children: ReactNode; width?: string; dataId: string }) {
  return <aside className={`relative flex h-full w-full ${width} flex-col overflow-hidden border-l border-white/10 bg-white shadow-[-34px_0_110px_rgba(2,6,23,.32)] ${styles.panel}`} data-drawer-id={dataId}>{children}</aside>
}

export function DrawerCloseButton({ onClose, inverted = false }: { onClose: () => void; inverted?: boolean }) {
  return <button type="button" onClick={onClose} aria-label="Fermer le panneau" className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-4 ${inverted ? 'border-white/15 bg-white/10 text-white hover:bg-white/15 focus-visible:ring-white/20' : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-blue-100'}`}><X size={19} /></button>
}

export function DrawerBadge({ children, tone = 'slate', inverted = false }: { children: ReactNode; tone?: Tone; inverted?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[.11em] ${inverted ? 'border-white/15 bg-white/10 text-white' : tones[tone].badge}`}>{children}</span>
}

export function DrawerSection({ title, eyebrow, icon: Icon, tone = 'blue', children, action, dark = false }: { title: string; eyebrow?: string; icon?: ElementType; tone?: Tone; children: ReactNode; action?: ReactNode; dark?: boolean }) {
  return <section className={`overflow-hidden rounded-[28px] border ${dark ? 'border-white/10 bg-slate-950 text-white' : 'border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,.045)]'}`}>
    <div className={`h-1 ${tones[tone].line}`} />
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${dark ? 'bg-white/10 text-white' : tones[tone].icon}`}><Icon size={18} /></span> : null}
          <div className="min-w-0">
            {eyebrow ? <p className={`text-[9px] font-black uppercase tracking-[.16em] ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{eyebrow}</p> : null}
            <h3 className={`mt-1 text-sm font-black tracking-[-.01em] ${dark ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
          </div>
        </div>
        {action}
      </div>
      <div className={`mt-4 text-sm font-medium leading-6 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{children}</div>
    </div>
  </section>
}

export function DrawerMetric({ label, value, note, icon: Icon, tone = 'blue', dark = false }: { label: string; value: ReactNode; note?: string; icon?: ElementType; tone?: Tone; dark?: boolean }) {
  return <div className={`rounded-[22px] border p-4 ${dark ? 'border-white/10 bg-white/[.06]' : 'border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,.035)]'}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className={`text-[9px] font-black uppercase tracking-[.13em] ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
        <p className={`mt-2 text-xl font-black tracking-[-.02em] ${dark ? 'text-white' : 'text-slate-950'}`}>{value}</p>
      </div>
      {Icon ? <span className={`grid h-9 w-9 place-items-center rounded-xl ${dark ? 'bg-white/10 text-white' : tones[tone].icon}`}><Icon size={16} /></span> : null}
    </div>
    {note ? <p className={`mt-2 text-[10px] font-semibold leading-4 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{note}</p> : null}
  </div>
}

export function DrawerExecutiveBrief({ children, tone = 'blue', dark = false }: { children: ReactNode; tone?: Tone; dark?: boolean }) {
  return <div className={`rounded-[26px] border p-5 ${dark ? 'border-white/10 bg-white/[.07]' : tones[tone].soft}`}>
    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] ${dark ? 'text-white' : 'text-slate-700'}`}><ShieldCheck size={15} /> Lecture exécutive</div>
    <div className={`mt-3 text-sm font-bold leading-6 ${dark ? 'text-white' : 'text-slate-900'}`}>{children}</div>
  </div>
}

export function DrawerActionFooter({ children, note }: { children: ReactNode; note?: string }) {
  return <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/97 px-5 py-4 shadow-[0_-18px_45px_rgba(15,23,42,.07)] backdrop-blur-xl sm:px-7">
    {note ? <p className="mb-3 text-[10px] font-semibold leading-4 text-slate-600">{note}</p> : null}
    <div className="flex flex-wrap items-center justify-end gap-2.5">{children}</div>
  </footer>
}

export function DrawerPrimaryAction({ children, disabled, onClick, type = 'button', tone = 'slate' }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: 'button' | 'submit'; tone?: Tone }) {
  const background = tone === 'rose' ? 'bg-rose-700 hover:bg-rose-800' : tone === 'emerald' ? 'bg-emerald-700 hover:bg-emerald-800' : tone === 'blue' ? 'bg-blue-700 hover:bg-blue-800' : tone === 'violet' ? 'bg-violet-700 hover:bg-violet-800' : tone === 'cyan' ? 'bg-cyan-800 hover:bg-cyan-900' : tone === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-950 hover:bg-slate-800'
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-black text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-45 ${background}`}>{children}</button>
}

export function DrawerSecondaryAction({ children, disabled, onClick, danger = false }: { children: ReactNode; disabled?: boolean; onClick?: () => void; danger?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-45 ${danger ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 focus-visible:ring-rose-100' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-blue-100'}`}>{children}</button>
}

export function DrawerInlineLink({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 hover:text-blue-900"><span>{children}</span><ArrowRight size={12} /></button>
}

export function drawerTone(tone: Tone) { return tones[tone] }
export type DrawerTone = Tone
export { styles as drawerStyles }
