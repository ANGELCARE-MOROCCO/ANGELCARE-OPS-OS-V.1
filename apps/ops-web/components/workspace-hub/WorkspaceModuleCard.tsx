'use client'

import Link from 'next/link'
import {
  AppWindow,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Command,
  ExternalLink,
  FileText,
  GraduationCap,
  Handshake,
  Heart,
  Mail,
  MapPinned,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { AuthorizedWorkspaceModule } from '@/lib/workspace-hub/authorized-modules'

function Icon({ iconKey }: { iconKey: string }) {
  const className = 'h-5 w-5'
  if (iconKey === 'shield') return <ShieldCheck className={className} />
  if (iconKey === 'users') return <Users className={className} />
  if (iconKey === 'map') return <MapPinned className={className} />
  if (iconKey === 'receipt') return <ReceiptText className={className} />
  if (iconKey === 'mail') return <Mail className={className} />
  if (iconKey === 'graduation') return <GraduationCap className={className} />
  if (iconKey === 'handshake') return <Handshake className={className} />
  if (iconKey === 'chart') return <BarChart3 className={className} />
  if (iconKey === 'banknote') return <Banknote className={className} />
  if (iconKey === 'command') return <Command className={className} />
  if (iconKey === 'briefcase') return <BriefcaseBusiness className={className} />
  return <AppWindow className={className} />
}

function accentClasses(iconKey: string) {
  if (iconKey === 'receipt') {
    return {
      gradient: 'from-fuchsia-600 to-rose-500',
      soft: 'from-fuchsia-50 to-rose-50',
      text: 'text-fuchsia-700',
      border: 'border-fuchsia-100',
    }
  }
  if (iconKey === 'shield') {
    return {
      gradient: 'from-blue-800 to-cyan-500',
      soft: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
    }
  }
  if (iconKey === 'users') {
    return {
      gradient: 'from-indigo-700 to-blue-500',
      soft: 'from-indigo-50 to-blue-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100',
    }
  }
  if (iconKey === 'map') {
    return {
      gradient: 'from-emerald-700 to-teal-500',
      soft: 'from-emerald-50 to-teal-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    }
  }
  if (iconKey === 'mail') {
    return {
      gradient: 'from-sky-700 to-blue-500',
      soft: 'from-sky-50 to-blue-50',
      text: 'text-sky-700',
      border: 'border-sky-100',
    }
  }
  if (iconKey === 'graduation') {
    return {
      gradient: 'from-violet-700 to-indigo-500',
      soft: 'from-violet-50 to-indigo-50',
      text: 'text-violet-700',
      border: 'border-violet-100',
    }
  }
  if (iconKey === 'handshake') {
    return {
      gradient: 'from-amber-500 to-orange-500',
      soft: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    }
  }
  if (iconKey === 'chart') {
    return {
      gradient: 'from-blue-700 to-violet-500',
      soft: 'from-blue-50 to-violet-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
    }
  }
  if (iconKey === 'banknote') {
    return {
      gradient: 'from-emerald-800 to-lime-500',
      soft: 'from-emerald-50 to-lime-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    }
  }
  return {
    gradient: 'from-slate-950 to-blue-700',
    soft: 'from-slate-50 to-blue-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
  }
}

function riskClass(riskLevel: string) {
  const risk = String(riskLevel || '').toLowerCase()
  if (risk.includes('critical') || risk.includes('high')) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (risk.includes('medium') || risk.includes('warning')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default function WorkspaceModuleCard({
  module,
  expanded,
  onToggle,
  favorite,
  onFavorite,
}: {
  module: AuthorizedWorkspaceModule
  expanded: boolean
  onToggle: (moduleKey: string) => void
  favorite: boolean
  onFavorite: (moduleKey: string) => void
}) {
  const disabled = !module.primaryHref || module.primaryHref === '#'
  const accent = accentClasses(module.iconKey)

  return (
    <article className={`group relative min-w-0 overflow-hidden rounded-[30px] border bg-white shadow-[0_18px_55px_rgba(15,23,42,0.075)] ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_85px_rgba(15,23,42,0.13)] ${
      expanded ? 'border-blue-200 ring-blue-100' : 'border-slate-200/90 ring-white'
    }`}>
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.gradient}`} />
      <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${accent.soft} opacity-90 blur-2xl transition duration-500 group-hover:scale-125`} aria-hidden="true" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${accent.gradient} text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]`}>
              <Icon iconKey={module.iconKey} />
            </div>
            <div className="min-w-0">
              <div className={`truncate text-[9px] font-black uppercase tracking-[0.22em] ${accent.text}`}>
                {module.moduleGroup}
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Authorized
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onFavorite(module.moduleKey)}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition hover:-translate-y-0.5 ${
              favorite
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500'
            }`}
            aria-label={favorite ? 'Remove favourite' : 'Add favourite'}
            aria-pressed={favorite}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="mt-5 min-w-0">
          <h3 className="line-clamp-2 min-h-[56px] text-xl font-black leading-7 tracking-[-0.045em] text-slate-950">
            {module.moduleLabel}
          </h3>
          <p className="mt-2 line-clamp-3 min-h-[60px] text-xs font-semibold leading-5 text-slate-600">
            {module.description}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className={`rounded-[20px] border bg-gradient-to-br ${accent.soft} ${accent.border} px-3.5 py-3`}>
            <div className="text-2xl font-black tracking-[-0.05em] text-slate-950">{module.routeCount}</div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Reachable pages</div>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-3.5 py-3">
            <div className="text-2xl font-black tracking-[-0.05em] text-slate-950">{module.permissionCount}</div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Access keys</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            {module.status || 'active'}
          </span>
          <span className={`rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${riskClass(module.riskLevel)}`}>
            {module.riskLevel || 'normal'} risk
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
          {disabled ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-500"
            >
              Route unavailable
            </button>
          ) : (
            <Link
              href={module.primaryHref}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${accent.gradient} px-4 py-3 text-xs font-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.24)]`}
            >
              Enter workspace
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => onToggle(module.moduleKey)}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} permitted pages for ${module.moduleLabel}`}
          >
            Pages
            <ChevronDown className={`h-3.5 w-3.5 transition duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="relative border-t border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Your permitted routes</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{module.routes.length} synchronized page{module.routes.length === 1 ? '' : 's'}</div>
            </div>
            <button
              type="button"
              onClick={() => onToggle(module.moduleKey)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
            {module.routes.map((route) => (
              <div key={`${route.permissionKey}-${route.href}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-black text-slate-950">{route.label}</div>
                      <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{route.href}</div>
                    </div>
                  </div>
                </div>
                <Link href={route.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-blue-800">
                  Open
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}
