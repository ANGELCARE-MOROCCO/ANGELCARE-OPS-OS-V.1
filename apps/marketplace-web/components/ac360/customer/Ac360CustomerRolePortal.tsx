'use client'

import Link from 'next/link'
import { ac360CustomerModules } from '@/lib/ac360/customer-ui-model'
import {
  getAc360RoleHomeHref,
  getAc360RoleMobileActions,
  getAc360RoleModulePermission,
  getAc360RolePermissionLabel,
  getAc360RolePermissionTone,
  getAc360RolePortalByLabel,
  getAc360RoleVisibleModules,
  type Ac360MobileActionTone,
} from '@/lib/ac360/customer-role-portal-model'
import type { Ac360CustomerLiveCockpit } from '@/lib/ac360/customer-live-data'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function toneClass(tone: Ac360MobileActionTone) {
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (tone === 'violet') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (tone === 'slate') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

export function Ac360CustomerRolePortal({ selectedRole, activeModuleKey, live, compact = false }: { selectedRole: string; activeModuleKey?: string; live?: Ac360CustomerLiveCockpit | null; compact?: boolean }) {
  const portal = getAc360RolePortalByLabel(selectedRole)
  const visibleModules = getAc360RoleVisibleModules(portal).slice(0, compact ? 6 : 12)
  const mobileActions = getAc360RoleMobileActions(portal, activeModuleKey).slice(0, compact ? 3 : 4)
  const activePermission = activeModuleKey ? getAc360RoleModulePermission(portal, activeModuleKey) : 'principal'

  return (
    <section className={cx('rounded-[2rem] border border-slate-200 bg-white shadow-sm', compact ? 'p-4' : 'p-5 md:p-7')} data-ac360-phase3k="role-based-customer-portal">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3K · Portail rôle</SmallBadge>
            <SmallBadge className={toneClass(getAc360RolePermissionTone(activePermission))}>{getAc360RolePermissionLabel(activePermission)}</SmallBadge>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">FR Maroc natif</SmallBadge>
          </div>
          <h2 className={cx('mt-4 font-black tracking-[-0.04em] text-slate-950', compact ? 'text-2xl' : 'text-3xl md:text-4xl')}>{portal.headline}</h2>
          <p className="mt-3 max-w-5xl text-sm font-semibold leading-7 text-slate-600 md:text-base">{portal.mission}</p>
        </div>
        <Link href={getAc360RoleHomeHref(portal)} className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white shadow-sm hover:bg-blue-800">
          Ouvrir accueil rôle
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {portal.cockpitKpis.map((kpi) => (
          <div key={kpi.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <SmallBadge className={toneClass(kpi.tone)}>{kpi.label}</SmallBadge>
            <p className="mt-3 text-2xl font-black text-slate-950">{kpi.value}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{kpi.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Navigation permission-aware</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">Modules visibles pour {portal.shortLabel}</h3>
            </div>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">{visibleModules.length} surfaces</SmallBadge>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {visibleModules.map((module) => (
              <Link key={module.key} href={module.href} className={cx('rounded-3xl border p-3 transition hover:border-blue-200 hover:bg-blue-50', activeModuleKey === module.key ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 bg-slate-50')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">{module.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{module.group} · {module.primaryMetric}</p>
                  </div>
                  <SmallBadge className={toneClass(getAc360RolePermissionTone(module.permission))}>{getAc360RolePermissionLabel(module.permission)}</SmallBadge>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-blue-100 bg-blue-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Règles de portail</p>
          <div className="mt-4 space-y-2">
            {portal.permissionRules.map((rule) => (
              <div key={rule} className="rounded-2xl border border-blue-100 bg-white p-3 text-xs font-bold leading-5 text-slate-700">{rule}</div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            <div className="rounded-2xl border border-blue-100 bg-white p-3 text-xs font-black uppercase tracking-[0.12em] text-blue-800">{portal.navigationPromise}</div>
            <div className="rounded-2xl border border-blue-100 bg-white p-3 text-xs font-black uppercase tracking-[0.12em] text-blue-800">{portal.auditPromise}</div>
            <div className="rounded-2xl border border-blue-100 bg-white p-3 text-xs font-black uppercase tracking-[0.12em] text-blue-800">{portal.billingPromise}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.7rem] border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Vue mobile exécution</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">Actions rapides terrain sans casser la gouvernance.</h3>
          </div>
          <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Plan {live?.context.planName || 'Command'} · crédits {live?.billing.creditPercent ?? 82}%</SmallBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {mobileActions.map((action) => (
            <Link key={action.key} href={action.href} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-lg">
              <SmallBadge className={toneClass(action.tone)}>{action.label}</SmallBadge>
              <p className="mt-3 text-sm font-black text-slate-950">{action.intent}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{action.guardSignal}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Ac360CustomerMobileExecutionDock({ selectedRole, activeModuleKey }: { selectedRole: string; activeModuleKey?: string }) {
  const portal = getAc360RolePortalByLabel(selectedRole)
  const actions = getAc360RoleMobileActions(portal, activeModuleKey).slice(0, 4)
  const activeModule = activeModuleKey ? ac360CustomerModules.find((module) => module.key === activeModuleKey) : null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden" data-ac360-phase3k="mobile-execution-dock">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Vue mobile · {portal.shortLabel}{activeModule ? ` · ${activeModule.label}` : ''}</span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-800">gardé</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <Link key={action.key} href={action.href} className={cx('rounded-2xl border px-2 py-2 text-center text-[10px] font-black uppercase leading-4 tracking-[0.08em]', toneClass(action.tone))}>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
