'use client'

import Link from 'next/link'
import {
  AppWindow,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
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

function accentClass(iconKey: string) {
  if (iconKey === 'receipt') return 'from-fuchsia-600 to-rose-500'
  if (iconKey === 'shield') return 'from-blue-700 to-cyan-500'
  if (iconKey === 'users') return 'from-indigo-600 to-blue-500'
  if (iconKey === 'map') return 'from-emerald-600 to-teal-500'
  if (iconKey === 'mail') return 'from-sky-600 to-blue-500'
  if (iconKey === 'graduation') return 'from-violet-600 to-indigo-500'
  if (iconKey === 'handshake') return 'from-amber-500 to-orange-500'
  if (iconKey === 'chart') return 'from-blue-600 to-violet-500'
  if (iconKey === 'banknote') return 'from-emerald-700 to-lime-500'
  return 'from-slate-950 to-blue-700'
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
  const accent = accentClass(module.iconKey)

  return (
    <article className={`relative min-w-0 overflow-visible transition-all duration-300 ${expanded ? 'z-[120] pb-[360px]' : 'z-10 pb-0'}`}>
      <div className={`group relative overflow-visible rounded-[26px] border bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.13)] ${
        expanded ? 'z-40 border-blue-200 ring-blue-100' : 'border-slate-200 ring-slate-100'
      }`}>
        <div className={`absolute inset-x-0 top-0 h-1 rounded-t-[26px] bg-gradient-to-r ${accent}`} />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]`}>
            <Icon iconKey={module.iconKey} />
          </div>

          <button
            type="button"
            onClick={() => onFavorite(module.moduleKey)}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
              favorite
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-rose-500'
            }`}
            aria-label={favorite ? 'Remove favourite' : 'Add favourite'}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="mt-4 min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-blue-500">
            {module.moduleGroup}
          </div>
          <h3 className="mt-1 line-clamp-2 min-h-[48px] text-lg font-black leading-6 tracking-[-0.04em] text-slate-950">
            {module.moduleLabel}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-xs leading-5 text-slate-600">
            {module.description}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-lg font-black text-slate-950">{module.routeCount}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Pages</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-lg font-black text-slate-950">{module.permissionCount}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Keys</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {disabled ? (
            <button
              type="button"
              disabled
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-200 px-3 py-2.5 text-xs font-black text-slate-500"
            >
              No route
            </button>
          ) : (
            <Link
              href={module.primaryHref}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => onToggle(module.moduleKey)}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            Pages
            <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {expanded ? (
          <div className="absolute left-0 right-0 top-full z-[200] mt-3 rounded-[24px] border border-blue-200 bg-white p-3 shadow-[0_34px_110px_rgba(15,23,42,0.30)] ring-1 ring-blue-100">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Permitted pages</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-500">{module.routes.length} synced access route{module.routes.length === 1 ? '' : 's'}</div>
              </div>
              <button
                type="button"
                onClick={() => onToggle(module.moduleKey)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {module.routes.map((route) => (
                <div key={`${route.permissionKey}-${route.href}`} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <div className="truncate text-xs font-black text-slate-950">{route.label}</div>
                    </div>
                    <div className="mt-1 truncate text-[11px] font-semibold text-slate-500">{route.href}</div>
                  </div>
                  <Link href={route.href} className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-black text-white">
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
