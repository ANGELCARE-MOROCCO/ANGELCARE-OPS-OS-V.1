'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  resolveDirectionActionDefinition,
  type DirectionActionDefinition,
  type DirectionActionField,
  type DirectionActionModalType,
} from '@/lib/ac360/customer-direction-action-map'
import type { DirectionTone } from '@/lib/ac360/customer-direction-cockpit-model'

type DirectionExecutionState = {
  status: 'idle' | 'running' | 'success' | 'blocked' | 'error'
  message?: string
  proofReference?: string
  result?: unknown
}

type DirectionDraft = {
  title: string
  module: string
  impact: string
  payload: Record<string, unknown>
  buttonId?: string
  modalType?: DirectionActionModalType
  operation?: string
  submitLabel?: string
} | null

type Props = {
  draft: DirectionDraft
  onClose: () => void
  onExecute: (formState: Record<string, unknown>) => void | Promise<void>
  execution: DirectionExecutionState
}

type FieldSetter = (key: string, value: unknown) => void

type WorkflowShellProps = {
  definition: DirectionActionDefinition
  draft: NonNullable<DirectionDraft>
  formState: Record<string, unknown>
  setValue: FieldSetter
  onClose: () => void
  onExecute: (formState: Record<string, unknown>) => void | Promise<void>
  execution: DirectionExecutionState
}

const modalTone: Record<DirectionActionModalType, DirectionTone> = {
  period_selector: 'blue',
  site_selector: 'cyan',
  alert_center: 'rose',
  command_palette: 'violet',
  create_action: 'blue',
  launch_control: 'emerald',
  risk_register: 'amber',
  report_center: 'slate',
  export_center: 'cyan',
  report_builder: 'violet',
  detail_drawer: 'blue',
  decision_approval: 'amber',
  escalation_drawer: 'rose',
  mobile_quick_action: 'emerald',
  success_proof: 'emerald',
}

const toneClass: Record<DirectionTone, { text: string; border: string; bg: string; soft: string; ring: string; dot: string; fill: string }> = {
  blue: { text: 'text-blue-800', border: 'border-blue-200', bg: 'bg-blue-600', soft: 'bg-blue-50', ring: 'ring-blue-100', dot: 'bg-blue-500', fill: 'from-blue-600 to-indigo-600' },
  emerald: { text: 'text-emerald-800', border: 'border-emerald-200', bg: 'bg-emerald-600', soft: 'bg-emerald-50', ring: 'ring-emerald-100', dot: 'bg-emerald-500', fill: 'from-emerald-600 to-teal-600' },
  amber: { text: 'text-amber-800', border: 'border-amber-200', bg: 'bg-amber-500', soft: 'bg-amber-50', ring: 'ring-amber-100', dot: 'bg-amber-500', fill: 'from-amber-500 to-orange-500' },
  rose: { text: 'text-rose-800', border: 'border-rose-200', bg: 'bg-rose-600', soft: 'bg-rose-50', ring: 'ring-rose-100', dot: 'bg-rose-500', fill: 'from-rose-600 to-red-600' },
  violet: { text: 'text-violet-800', border: 'border-violet-200', bg: 'bg-violet-600', soft: 'bg-violet-50', ring: 'ring-violet-100', dot: 'bg-violet-500', fill: 'from-violet-600 to-fuchsia-600' },
  cyan: { text: 'text-cyan-800', border: 'border-cyan-200', bg: 'bg-cyan-600', soft: 'bg-cyan-50', ring: 'ring-cyan-100', dot: 'bg-cyan-500', fill: 'from-cyan-600 to-sky-600' },
  slate: { text: 'text-slate-800', border: 'border-slate-200', bg: 'bg-slate-800', soft: 'bg-slate-50', ring: 'ring-slate-100', dot: 'bg-slate-500', fill: 'from-slate-800 to-slate-600' },
  orange: { text: 'text-orange-800', border: 'border-orange-200', bg: 'bg-orange-600', soft: 'bg-orange-50', ring: 'ring-orange-100', dot: 'bg-orange-500', fill: 'from-orange-600 to-amber-500' },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function PrimaryButton({ children, onClick, disabled, tone = 'blue', className = '' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: DirectionTone; className?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br px-5 py-3 text-[12px] font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.24),inset_0_1px_0_rgba(255,255,255,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_52px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60',
        toneClass[tone].fill,
        className,
      )}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cx('inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[12px] font-black text-slate-800 shadow-[0_10px_25px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_38px_rgba(15,23,42,0.13)]', className)}>
      {children}
    </button>
  )
}

function Pill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: DirectionTone }) {
  return <span className={cx('inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em]', toneClass[tone].border, toneClass[tone].soft, toneClass[tone].text)}>{children}</span>
}

function Progress({ value, tone = 'blue' }: { value: number; tone?: DirectionTone }) {
  return <div className="h-2 rounded-full bg-slate-100"><div className={cx('h-full rounded-full bg-gradient-to-r', toneClass[tone].fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

function FieldControl({ field, value, setValue, className = '' }: { field: DirectionActionField; value: unknown; setValue: FieldSetter; className?: string }) {
  const base = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-bold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50'
  return (
    <label className={cx('block', className)}>
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
      {field.type === 'textarea' ? (
        <textarea className={cx(base, 'min-h-[110px] resize-none')} value={String(value ?? '')} placeholder={field.placeholder || ''} onChange={(event) => setValue(field.key, event.target.value)} />
      ) : field.type === 'select' ? (
        <select className={base} value={String(value ?? field.defaultValue ?? '')} onChange={(event) => setValue(field.key, event.target.value)}>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : field.type === 'toggle' ? (
        <button type="button" onClick={() => setValue(field.key, !(value === true || value === 'true'))} className={cx('flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-[12px] font-black transition', value === true || value === 'true' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700')}>
          <span>{value === true || value === 'true' ? 'Activé' : 'Désactivé'}</span>
          <span className={cx('h-6 w-11 rounded-full p-1 transition', value === true || value === 'true' ? 'bg-emerald-500' : 'bg-slate-200')}><span className={cx('block h-4 w-4 rounded-full bg-white transition', value === true || value === 'true' ? 'translate-x-5' : 'translate-x-0')} /></span>
        </button>
      ) : (
        <input className={base} type={field.type === 'date' ? 'date' : 'text'} value={String(value ?? '')} placeholder={field.placeholder || ''} onChange={(event) => setValue(field.key, event.target.value)} />
      )}
      {field.help ? <span className="mt-1 block text-[11px] font-semibold text-slate-500">{field.help}</span> : null}
    </label>
  )
}

function ExecutionResultPanel({ execution, definition, onClose }: { execution: DirectionExecutionState; definition: DirectionActionDefinition; onClose: () => void }) {
  if (execution.status === 'idle') return null
  const tone: DirectionTone = execution.status === 'success' ? 'emerald' : execution.status === 'blocked' ? 'amber' : execution.status === 'error' ? 'rose' : 'blue'
  return (
    <div className={cx('mt-5 rounded-[1.3rem] border p-4', toneClass[tone].border, toneClass[tone].soft)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={cx('text-[10px] font-black uppercase tracking-[0.16em]', toneClass[tone].text)}>{execution.status === 'running' ? 'Traitement en cours' : execution.status === 'success' ? 'Action confirmée' : execution.status === 'blocked' ? 'Action à finaliser' : 'Correction requise'}</p>
          <p className="mt-1 max-w-3xl text-[12px] font-bold leading-6 text-slate-700">{execution.message || 'Résultat reçu.'}</p>
          {execution.proofReference ? <p className="mt-2 text-[12px] font-black text-slate-950">{definition.proofLabel} : {execution.proofReference}</p> : null}
        </div>
        {execution.status === 'success' ? <SecondaryButton onClick={onClose}>Revenir au cockpit</SecondaryButton> : null}
      </div>
    </div>
  )
}

function ActionFooter({ definition, execution, onClose, onExecute, formState }: { definition: DirectionActionDefinition; execution: DirectionExecutionState; onClose: () => void; onExecute: (formState: Record<string, unknown>) => void | Promise<void>; formState: Record<string, unknown> }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap gap-2">
        <Pill tone={modalTone[definition.modalType]}>Action gouvernée</Pill>
        <Pill tone="emerald">Preuve après traitement</Pill>
      </div>
      <div className="flex flex-wrap gap-3">
        <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
        <PrimaryButton tone={modalTone[definition.modalType]} disabled={execution.status === 'running'} onClick={() => onExecute(formState)}>{execution.status === 'running' ? 'Traitement…' : definition.submitLabel}</PrimaryButton>
      </div>
    </div>
  )
}

function ModalFrame({ title, eyebrow, subtitle, tone, children, footer, onClose, wide = false }: { title: string; eyebrow: string; subtitle: string; tone: DirectionTone; children: React.ReactNode; footer: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-700/20 p-4 backdrop-blur-md">
      <div className={cx('max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_36px_110px_rgba(15,23,42,0.28)]', wide ? 'max-w-6xl' : 'max-w-5xl')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cx('text-[11px] font-black uppercase tracking-[0.2em]', toneClass[tone].text)}>{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">{title}</h2>
            <p className="mt-2 max-w-4xl text-[13px] font-semibold leading-6 text-slate-500">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5">×</button>
        </div>
        <div className="mt-6">{children}</div>
        {footer}
      </div>
    </div>
  )
}

function DrawerFrame({ title, eyebrow, subtitle, tone, children, footer, onClose, critical = false }: { title: string; eyebrow: string; subtitle: string; tone: DirectionTone; children: React.ReactNode; footer: React.ReactNode; onClose: () => void; critical?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-700/20 backdrop-blur-md">
      <div className="absolute inset-y-0 right-0 flex w-full justify-end p-4">
        <div className={cx('max-h-full w-full max-w-[1180px] overflow-y-auto rounded-[2rem] border bg-white p-6 shadow-[0_36px_110px_rgba(15,23,42,0.30)]', critical ? 'border-rose-200' : 'border-white/80')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={cx('text-[11px] font-black uppercase tracking-[0.2em]', toneClass[tone].text)}>{eyebrow}</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">{title}</h2>
              <p className="mt-2 max-w-4xl text-[13px] font-semibold leading-6 text-slate-500">{subtitle}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5">×</button>
          </div>
          <div className="mt-6">{children}</div>
          {footer}
        </div>
      </div>
    </div>
  )
}

function QuickPeriodTile({ label, active, setActive }: { label: string; active: boolean; setActive: () => void }) {
  return <button type="button" onClick={setActive} className={cx('rounded-2xl border p-4 text-left transition hover:-translate-y-0.5', active ? 'border-blue-300 bg-blue-50 shadow-[0_14px_30px_rgba(37,99,235,0.13)]' : 'border-slate-200 bg-white hover:border-blue-200')}><p className="text-[12px] font-black text-slate-950">{label}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Recalcul instantané du cockpit</p></button>
}

function PeriodSelectorWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  const active = String(formState.periodPreset || 'Ce mois')
  return (
    <ModalFrame wide tone="blue" eyebrow="Contexte de pilotage" title="Période de pilotage" subtitle="Choisissez une période, une comparaison et une lecture école/réseau sans créer d’action inutile." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.2fr_0.85fr]">
        <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Périodes rapides</p>
          <div className="mt-4 grid gap-3">
            {['Aujourd’hui', 'Cette semaine', 'Ce mois', 'Trimestre en cours', 'Année scolaire'].map((period) => <QuickPeriodTile key={period} label={period} active={active === period} setActive={() => setValue('periodPreset', period)} />)}
          </div>
        </section>
        <section className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Calendrier & comparaison</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {definition.fields.filter((field) => field.key !== 'periodPreset').map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}
          </div>
          <div className="mt-5 rounded-[1.3rem] border border-blue-100 bg-blue-50 p-4">
            <p className="text-[12px] font-black text-blue-900">Impact sur le cockpit</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {['KPIs recalculés', 'Graphes synchronisés', 'Exports alignés'].map((item, index) => <div key={item} className="rounded-2xl bg-white p-3"><p className="text-[20px] font-black text-slate-950">{index === 0 ? '8' : index === 1 ? '14' : '5'}</p><p className="text-[11px] font-bold text-slate-500">{item}</p></div>)}
            </div>
          </div>
        </section>
        <section className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Prévisualisation</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Lecture directionnelle</h3>
          <div className="mt-4 space-y-3">
            {['Performance actuelle', 'Écart vs objectif', 'Tendance précédente'].map((item, index) => <div key={item} className="rounded-2xl bg-white p-3"><div className="flex items-center justify-between"><p className="text-[12px] font-black text-slate-800">{item}</p><Pill tone={index === 1 ? 'amber' : 'emerald'}>{index === 1 ? 'À surveiller' : 'Prêt'}</Pill></div><Progress value={index === 1 ? 62 : 86} tone={index === 1 ? 'amber' : 'emerald'} /></div>)}
          </div>
        </section>
      </div>
    </ModalFrame>
  )
}

function SiteSelectorWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  const selectedCity = String(formState.city || 'Tous')
  const cities = ['Tous', 'Casablanca', 'Rabat', 'Tanger', 'Marrakech', 'Fès', 'Agadir', 'Kénitra', 'Témara']
  const sites = ['Casablanca Anfa', 'Rabat Agdal', 'Marrakech Guéliz', 'Tanger Malabata', 'Fès Atlas', 'Agadir Founty', 'Kénitra Centre', 'Témara Écoles']
  return (
    <ModalFrame wide tone="cyan" eyebrow="Pilotage réseau" title="Sélecteur multi-sites" subtitle="Définissez le périmètre exact du cockpit : réseau complet, ville, site, ou groupe sauvegardé." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr_0.85fr]">
        <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Villes</p>
          <div className="mt-4 grid gap-2">
            {cities.map((city) => <button key={city} type="button" onClick={() => setValue('city', city)} className={cx('flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-[12px] font-black transition', selectedCity === city ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700')}><span>{city}</span><span>{city === 'Tous' ? '14' : Math.max(1, city.length % 4 + 1)} sites</span></button>)}
          </div>
        </section>
        <section className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Sites inclus</p>
            <Pill tone="cyan">Comparaison activée</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sites.map((site, index) => <button key={site} type="button" className="rounded-[1.2rem] border border-slate-200 bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-cyan-200"><div className="flex items-center justify-between"><p className="text-[13px] font-black text-slate-950">{site}</p><Pill tone={index % 3 === 0 ? 'emerald' : index % 3 === 1 ? 'blue' : 'amber'}>{index % 3 === 2 ? 'À suivre' : 'Inclus'}</Pill></div><p className="mt-2 text-[11px] font-semibold text-slate-500">Occupation {88 + (index % 5)}% · alertes {index % 4}</p><Progress value={78 + (index % 5) * 4} tone={index % 3 === 2 ? 'amber' : 'emerald'} /></button>)}
          </div>
        </section>
        <section className="rounded-[1.4rem] border border-cyan-100 bg-cyan-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-800">Résumé périmètre</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">14 crèches analysées</h3>
          <div className="mt-4 space-y-3">
            {['Vue consolidée', 'Comparaison par site', 'Rapports multi-sites', 'Vue sauvegardable'].map((item, index) => <div key={item} className="rounded-2xl bg-white p-3"><div className="flex items-center justify-between"><span className="text-[12px] font-black text-slate-800">{item}</span><Pill tone={index === 3 ? 'violet' : 'emerald'}>{index === 3 ? 'Option' : 'Actif'}</Pill></div></div>)}
          </div>
        </section>
      </div>
    </ModalFrame>
  )
}

function AlertCenterWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  const alerts = ['Créances en hausse — Casablanca Anfa', 'Réclamation critique ParentTrust — Tanger', 'Absence staff non planifiée — Rabat', 'Transport en retard — Marrakech', 'Contrôle sécurité à finaliser — Fès']
  return (
    <DrawerFrame tone="rose" critical eyebrow="Centre opérationnel" title="Centre d’alertes critiques" subtitle="Traitez les alertes par priorité, responsable, SLA et preuve attendue." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.65fr_1.1fr_0.9fr]">
        <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Catégories</p><div className="mt-4 grid gap-2">{['Toutes', 'Finance', 'ParentTrust', 'RH', 'Sécurité', 'Transport', 'Admissions'].map((cat, index) => <button key={cat} onClick={() => setValue('alertType', cat)} type="button" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[12px] font-black text-slate-700"><span>{cat}</span><span className={index < 3 ? 'text-rose-700' : 'text-slate-400'}>{index < 3 ? index + 2 : index}</span></button>)}</div></section>
        <section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">File d’alertes</p><div className="mt-4 space-y-3">{alerts.map((alert, index) => <button key={alert} type="button" onClick={() => setValue('selectedAlert', alert)} className="w-full rounded-[1.2rem] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-200"><div className="flex items-center justify-between"><p className="text-[13px] font-black text-slate-950">{alert}</p><Pill tone={index < 2 ? 'rose' : 'amber'}>{index < 2 ? 'Critique' : 'Élevée'}</Pill></div><p className="mt-2 text-[11px] font-semibold text-slate-500">SLA {index + 1}h · responsable à confirmer · preuve attendue</p></button>)}</div></section>
        <section className="rounded-[1.4rem] border border-rose-100 bg-rose-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-800">Traitement sélectionné</p><h3 className="mt-2 text-xl font-black text-slate-950">Transformer en suivi</h3><div className="mt-4 grid gap-3">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div></section>
      </div>
    </DrawerFrame>
  )
}

function CommandPaletteWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <ModalFrame wide tone="violet" eyebrow="Commandes direction" title="Palette de commandes exécutives" subtitle="Recherchez, préparez et lancez les commandes de direction les plus importantes." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><FieldControl field={definition.fields[0]} value={formState.commandSearch} setValue={setValue} /><div className="mt-4 grid gap-3 md:grid-cols-2">{['Relancer impayés critiques','Contrôle sécurité réseau','Rapport direction hebdo','Escalader réclamation parent','Créer action RH','Planifier export preuve'].map((cmd, index) => <button key={cmd} type="button" onClick={() => setValue('commandType', cmd)} className="rounded-[1.2rem] border border-violet-100 bg-violet-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white"><Pill tone={index % 2 ? 'blue' : 'violet'}>{index % 2 ? 'Module' : 'Commande'}</Pill><p className="mt-3 text-[13px] font-black text-slate-950">{cmd}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Prépare contexte, responsable, preuve et prochaines étapes.</p></button>)}</div></section>
        <section className="rounded-[1.4rem] border border-violet-100 bg-violet-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-800">Préparation</p><div className="mt-4 grid gap-3">{definition.fields.slice(1).map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div><div className="mt-4 rounded-2xl bg-white p-4"><p className="text-[12px] font-black text-slate-950">Commandes récentes</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Relance finance · rapport qualité · action ParentTrust · contrôle présence.</p></div></section>
      </div>
    </ModalFrame>
  )
}

function CreateActionWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <ModalFrame wide tone="blue" eyebrow="Action directionnelle" title="Créer une action de direction" subtitle="Créez une action réelle avec propriétaire, échéance, impact, preuve attendue et suivi automatique." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Formulaire exécutif</p><div className="mt-4 grid gap-4 md:grid-cols-2">{definition.fields.map((field, index) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} className={field.type === 'textarea' || index === 0 ? 'md:col-span-2' : ''} />)}</div></section>
        <section className="space-y-4"><div className="rounded-[1.4rem] border border-blue-100 bg-blue-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-800">Impact attendu</p><div className="mt-4 grid gap-3">{['Finance / parent / opérations', 'Responsable assigné', 'Échéance visible', 'Preuve obligatoire'].map((item, i) => <div key={item} className="rounded-2xl bg-white p-3"><div className="flex items-center justify-between"><span className="text-[12px] font-black text-slate-800">{item}</span><Pill tone={i === 0 ? 'blue' : 'emerald'}>{i === 0 ? 'Classé' : 'Suivi'}</Pill></div></div>)}</div></div><div className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Étapes après création</p><ol className="mt-3 space-y-3 text-[12px] font-bold text-slate-600"><li>1. Action enregistrée dans le cockpit.</li><li>2. Responsable notifié.</li><li>3. Preuve attendue ajoutée au suivi.</li><li>4. Vue direction rafraîchie.</li></ol></div></section>
      </div>
    </ModalFrame>
  )
}

function LaunchControlWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <ModalFrame wide tone="emerald" eyebrow="Contrôle directionnel" title="Lancer un contrôle opérationnel" subtitle="Préparez un contrôle de direction avec périmètre, grille de vérification, propriétaire, échéance et preuve attendue." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1fr_0.8fr]"><section className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">Type de contrôle</p><div className="mt-4 grid gap-3">{['Finance', 'Présence', 'Qualité', 'Sécurité', 'ParentTrust', 'RH'].map((item) => <button key={item} type="button" onClick={() => setValue('controlType', item)} className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-left text-[12px] font-black text-slate-800">Contrôle {item}</button>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Paramètres</p><div className="mt-4 grid gap-4 md:grid-cols-2">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Grille de contrôle</p><div className="mt-4 space-y-3">{['Données présentes', 'Responsable identifié', 'Écart à vérifier', 'Preuve à déposer', 'Date de revue'].map((item, index) => <div key={item} className="rounded-2xl bg-white p-3"><div className="flex items-center justify-between"><span className="text-[12px] font-black text-slate-800">{item}</span><Pill tone={index < 2 ? 'emerald' : 'amber'}>{index < 2 ? 'Prêt' : 'À contrôler'}</Pill></div></div>)}</div></section></div>
    </ModalFrame>
  )
}

function RiskRegisterWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  const cells = [2, 4, 6, 9, 3, 5, 8, 12, 4, 7, 11, 16]
  return (
    <ModalFrame wide tone="amber" eyebrow="Registre des risques" title="Déclarer un risque opérationnel" subtitle="Qualifiez le risque, mesurez son impact, assignez un propriétaire et formalisez un plan de mitigation." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr_0.8fr]"><section className="rounded-[1.4rem] border border-amber-100 bg-amber-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">Matrice gravité x probabilité</p><div className="mt-4 grid grid-cols-4 gap-2">{cells.map((cell, index) => <div key={`${cell}-${index}`} className={cx('rounded-2xl p-5 text-center text-xl font-black', cell > 10 ? 'bg-rose-100 text-rose-800' : cell > 6 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>{cell}</div>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Fiche risque</p><div className="mt-4 grid gap-4 md:grid-cols-2">{definition.fields.map((field, index) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} className={field.type === 'textarea' || index === 0 ? 'md:col-span-2' : ''} />)}</div></section><section className="rounded-[1.4rem] border border-rose-100 bg-rose-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-800">Impact direction</p><div className="mt-4 space-y-3">{['Impact financier estimé', 'Impact parent / réputation', 'Impact sécurité', 'Plan de mitigation'].map((item, index) => <div key={item} className="rounded-2xl bg-white p-3"><p className="text-[12px] font-black text-slate-900">{item}</p><Progress value={index === 0 ? 78 : index === 1 ? 64 : 42} tone={index === 0 ? 'rose' : 'amber'} /></div>)}</div></section></div>
    </ModalFrame>
  )
}

function ReportWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  const templates = ['Tableau de bord exécutif', 'Rapport financier consolidé', 'Rapport qualité & sécurité', 'Rapport RH & social', 'Rapport opérations', 'Rapport admissions']
  return (
    <ModalFrame wide tone="violet" eyebrow="Rapports & Board Pack" title={definition.modalType === 'report_builder' ? 'Constructeur de rapport' : 'Centre de rapports direction'} subtitle="Composez un rapport A4 ou un pack conseil avec sections, période, périmètre, destinataires et preuve d’édition." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr_0.85fr]"><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Bibliothèque de modèles</p><div className="mt-4 grid gap-3 md:grid-cols-2">{templates.map((template, index) => <button key={template} type="button" onClick={() => setValue('reportTemplate', template)} className="rounded-[1.2rem] border border-violet-100 bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:bg-violet-50"><Pill tone={['blue','emerald','amber','violet','cyan','rose'][index] as DirectionTone}>A4</Pill><p className="mt-3 text-[13px] font-black text-slate-950">{template}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Sections gouvernées · export PDF/XLSX</p></button>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Paramètres du rapport</p><div className="mt-4 grid gap-3">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div></section><section className="rounded-[1.4rem] border border-violet-100 bg-violet-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-800">Prévisualisation A4</p><div className="mt-4 rounded-[1.1rem] border border-white bg-white p-4 shadow-inner"><div className="h-80 rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4"><p className="text-[14px] font-black text-slate-950">AngelCare 360</p><p className="mt-2 text-[11px] font-bold text-slate-500">Pack direction · période sélectionnée · 14 crèches</p><div className="mt-5 grid grid-cols-2 gap-3">{[1,2,3,4].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100" />)}</div><div className="mt-4 h-24 rounded-xl bg-blue-50" /><div className="mt-4 h-16 rounded-xl bg-slate-100" /></div></div></section></div>
    </ModalFrame>
  )
}

function ExportWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <ModalFrame wide tone="cyan" eyebrow="Export & preuve" title="Centre d’export et de téléchargement" subtitle="Préparez un fichier propre, contrôlé, archivé et relié au contexte de pilotage." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr_0.9fr]"><section className="rounded-[1.4rem] border border-cyan-100 bg-cyan-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-800">Formats</p><div className="mt-4 grid gap-3">{['PDF direction', 'XLSX analyse', 'CSV données', 'Pack preuve'].map((format, i) => <button key={format} type="button" onClick={() => setValue('format', format)} className="rounded-2xl border border-cyan-100 bg-white px-4 py-4 text-left"><p className="text-[13px] font-black text-slate-950">{format}</p><p className="text-[11px] font-semibold text-slate-500">{i === 0 ? 'Présentation A4' : i === 1 ? 'Tableaux modifiables' : i === 2 ? 'Données brutes contrôlées' : 'Archive gouvernée'}</p></button>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Périmètre & contenu</p><div className="mt-4 grid gap-4 md:grid-cols-2">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div><div className="mt-4 grid gap-3 md:grid-cols-3">{['Inclure filtres actifs', 'Inclure preuves', 'Archiver historique'].map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-3"><p className="text-[12px] font-black text-slate-800">{item}</p><Pill tone="emerald">Recommandé</Pill></div>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Historique récent</p><div className="mt-4 space-y-3">{['Pack exécutif — Mai', 'Rapport finance — Avril', 'Qualité & sécurité — S18'].map((file, index) => <div key={file} className="rounded-2xl bg-white p-3"><div className="flex items-center justify-between"><p className="text-[12px] font-black text-slate-900">{file}</p><Pill tone={index === 0 ? 'emerald' : 'blue'}>{index === 0 ? 'Prêt' : 'Archivé'}</Pill></div><p className="text-[11px] font-semibold text-slate-500">PDF · preuve conservée</p></div>)}</div></section></div>
    </ModalFrame>
  )
}

function DetailWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution, draft } = props
  return (
    <DrawerFrame tone="blue" eyebrow="Analyse contextuelle" title={draft.title || 'Détail directionnel'} subtitle="Analysez la donnée sélectionnée avec tendances, ventilation, risques liés et actions recommandées." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.8fr]"><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Tendance</p><div className="mt-4 h-64 rounded-[1.2rem] border border-slate-100 bg-gradient-to-b from-white to-blue-50 p-4"><svg viewBox="0 0 500 180" className="h-full w-full"><polyline points="0,130 80,115 160,105 240,88 320,96 400,70 500,62" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round"/><polyline points="0,150 80,140 160,120 240,112 320,105 400,92 500,76" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round"/></svg></div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Ventilation</p><div className="mt-4 space-y-3">{['Casablanca Anfa', 'Rabat Agdal', 'Marrakech Guéliz', 'Tanger Malabata'].map((site, index) => <div key={site} className="rounded-2xl bg-white p-3"><div className="flex justify-between text-[12px] font-black text-slate-800"><span>{site}</span><span>{95 - index * 4}%</span></div><Progress value={95 - index * 4} tone={index > 2 ? 'amber' : 'emerald'} /></div>)}</div></section><section className="rounded-[1.4rem] border border-blue-100 bg-blue-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-800">Actions liées</p><div className="mt-4 grid gap-3">{definition.recommendedNextActions.map((action) => <button key={action} type="button" onClick={() => setValue('recommendedNextAction', action)} className="rounded-2xl bg-white p-3 text-left text-[12px] font-black text-slate-800">{action}</button>)}</div></section></div>
    </DrawerFrame>
  )
}

function DecisionWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <DrawerFrame tone="amber" eyebrow="Gouvernance & arbitrage" title="Validation de décision" subtitle="Examinez la demande, son impact, ses preuves et l’historique avant approbation ou demande de complément." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr_0.8fr]"><section className="rounded-[1.4rem] border border-amber-100 bg-amber-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">Demande à valider</p><h3 className="mt-2 text-2xl font-black text-slate-950">Ouverture / budget / remise / plan d’action</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{['Montant: 320 K MAD', 'Demandeur: Responsable Finance', 'Échéance: Aujourd’hui', 'Impact: Budget & réputation'].map((item) => <div key={item} className="rounded-2xl bg-white p-3 text-[12px] font-black text-slate-800">{item}</div>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Décision</p><div className="mt-4 grid gap-3">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Historique</p><ol className="mt-4 space-y-3 text-[12px] font-bold text-slate-600"><li>1. Demande créée par responsable.</li><li>2. Justificatif ajouté.</li><li>3. Validation direction requise.</li><li>4. Preuve enregistrée après décision.</li></ol></section></div>
    </DrawerFrame>
  )
}

function EscalationWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <DrawerFrame critical tone="rose" eyebrow="Escalade critique" title="Escalader un point sensible" subtitle="Structurez une escalade avec criticité, SLA, responsable, chemin de résolution et communication suivie." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr_0.9fr]"><section className="rounded-[1.4rem] border border-rose-200 bg-rose-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-800">SLA & urgence</p><div className="mt-4 grid grid-cols-2 gap-3">{['15 min', '1 h', '4 h', '24 h'].map((sla, index) => <button key={sla} type="button" onClick={() => setValue('sla', sla)} className={cx('rounded-2xl border p-5 text-center text-xl font-black', index === 0 ? 'border-rose-300 bg-white text-rose-800' : 'border-slate-200 bg-white text-slate-800')}>{sla}</button>)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Fiche escalade</p><div className="mt-4 grid gap-4 md:grid-cols-2">{definition.fields.map((field, index) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} className={field.type === 'textarea' || index === 0 ? 'md:col-span-2' : ''} />)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Chemin d’escalade</p><div className="mt-4 space-y-3">{['Responsable module', 'Direction établissement', 'AngelCare Success', 'Preuve de clôture'].map((item, index) => <div key={item} className="rounded-2xl bg-white p-3"><div className="flex items-center gap-3"><span className={cx('flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white', index === 0 ? 'bg-rose-600' : 'bg-slate-400')}>{index+1}</span><span className="text-[12px] font-black text-slate-800">{item}</span></div></div>)}</div></section></div>
    </DrawerFrame>
  )
}

function MobileQuickWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <ModalFrame tone="emerald" eyebrow="Action mobile" title="Action rapide direction" subtitle="Version compacte pour validation, relance, escalade ou rapport depuis mobile." onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-4"><div className="grid gap-3 md:grid-cols-4">{['Valider', 'Relancer', 'Escalader', 'Rapport'].map((item) => <button key={item} type="button" onClick={() => setValue('mobileAction', item)} className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-5 text-center text-[13px] font-black text-emerald-900">{item}</button>)}</div><div className="grid gap-3 md:grid-cols-2">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div></div>
    </ModalFrame>
  )
}

function DefaultWorkflow(props: WorkflowShellProps) {
  const { definition, formState, setValue, onClose, onExecute, execution } = props
  return (
    <ModalFrame wide tone={modalTone[definition.modalType]} eyebrow="Workflow directionnel" title={definition.label} subtitle={definition.purpose} onClose={onClose} footer={<><ExecutionResultPanel execution={execution} definition={definition} onClose={onClose} /><ActionFooter definition={definition} execution={execution} onClose={onClose} onExecute={onExecute} formState={formState} /></>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]"><section className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Champs opérationnels</p><div className="mt-4 grid gap-4 md:grid-cols-2">{definition.fields.map((field) => <FieldControl key={field.key} field={field} value={formState[field.key]} setValue={setValue} />)}</div></section><section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Résultat attendu</p><div className="mt-4 space-y-3">{definition.recommendedNextActions.map((item) => <div key={item} className="rounded-2xl bg-white p-3 text-[12px] font-black text-slate-800">{item}</div>)}</div></section></div>
    </ModalFrame>
  )
}

function WorkflowRenderer(props: WorkflowShellProps) {
  switch (props.definition.modalType) {
    case 'period_selector': return <PeriodSelectorWorkflow {...props} />
    case 'site_selector': return <SiteSelectorWorkflow {...props} />
    case 'alert_center': return <AlertCenterWorkflow {...props} />
    case 'command_palette': return <CommandPaletteWorkflow {...props} />
    case 'create_action': return <CreateActionWorkflow {...props} />
    case 'launch_control': return <LaunchControlWorkflow {...props} />
    case 'risk_register': return <RiskRegisterWorkflow {...props} />
    case 'report_center': return <ReportWorkflow {...props} />
    case 'report_builder': return <ReportWorkflow {...props} />
    case 'export_center': return <ExportWorkflow {...props} />
    case 'detail_drawer': return <DetailWorkflow {...props} />
    case 'decision_approval': return <DecisionWorkflow {...props} />
    case 'escalation_drawer': return <EscalationWorkflow {...props} />
    case 'mobile_quick_action': return <MobileQuickWorkflow {...props} />
    default: return <DefaultWorkflow {...props} />
  }
}

export function Ac360DirectionDistinctEnterpriseModal({ draft, onClose, onExecute, execution }: Props) {
  const definition = useMemo(() => resolveDirectionActionDefinition({
    buttonId: draft?.buttonId,
    modalType: draft?.modalType,
    operation: draft?.operation || String(draft?.payload?.operation || ''),
    title: draft?.title,
    module: draft?.module,
    payload: draft?.payload,
  }), [draft])

  const [formState, setFormState] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!draft) return
    const initial: Record<string, unknown> = {}
    for (const field of definition.fields) initial[field.key] = draft.payload?.[field.key] ?? field.defaultValue ?? ''
    initial.contextTitle = draft.title
    initial.contextModule = draft.module
    initial.modalType = definition.modalType
    setFormState(initial)
  }, [draft, definition])

  if (!draft) return null

  const setValue = (key: string, value: unknown) => setFormState((current) => ({ ...current, [key]: value }))

  return <WorkflowRenderer definition={definition} draft={draft} formState={formState} setValue={setValue} onClose={onClose} onExecute={onExecute} execution={execution} />
}
