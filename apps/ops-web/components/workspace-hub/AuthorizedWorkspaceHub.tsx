'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Activity,
  BadgeCheck,
  Building2,
  Command,
  Crown,
  Eye,
  EyeOff,
  Heart,
  Layers3,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'
import type { AuthorizedWorkspaceHubData } from '@/lib/workspace-hub/authorized-modules'
import WorkspaceModuleCard from '@/components/workspace-hub/WorkspaceModuleCard'
import PersonalAccountSpace from '@/components/workspace-hub/PersonalAccountSpace'

const FAVORITES_KEY = 'angelcare.workspaceHub.favorites.v1'

function initialsFromName(name: string) {
  const initials = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'AC'
}

function MiniStat({
  label,
  value,
  icon,
  detail,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  detail: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-white/90 bg-white/90 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(30,64,175,0.12)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl transition duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl font-black tracking-[-0.06em] text-slate-950">{value}</div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</div>
          <div className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">{detail}</div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

function PassportPortrait({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    setPhotoFailed(false)
  }, [photoUrl])

  const showPhoto = Boolean(photoUrl && !photoFailed)

  return (
    <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-blue-200 to-sky-400 p-[5px] shadow-[0_22px_48px_rgba(2,6,23,0.3)]">
        <div className="h-full w-full rounded-full bg-white p-[4px]">
          {showPhoto ? (
            <img
              src={photoUrl || ''}
              alt={`Official staff portrait of ${name}`}
              onError={() => setPhotoFailed(true)}
              className="h-full w-full rounded-full bg-blue-100 object-cover object-[center_24%]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#0b2f78] via-[#184ea8] to-[#0f6ec7] text-3xl font-black tracking-[-0.06em] text-white backdrop-blur-xl">
              {initialsFromName(name)}
            </div>
          )}
        </div>
      </div>
      <span className="absolute bottom-1 right-0 flex h-9 w-9 items-center justify-center rounded-full border-[4px] border-[#123f91] bg-emerald-400 text-[#073b2c] shadow-[0_10px_24px_rgba(16,185,129,0.35)]" title="Verified staff identity photo">
        <BadgeCheck className="h-4 w-4" strokeWidth={2.6} />
      </span>
    </div>
  )
}

export default function AuthorizedWorkspaceHub({ initialData }: { initialData: AuthorizedWorkspaceHubData }) {
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showModuleCards, setShowModuleCards] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const actionProgress = useActionProgress()

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setFavorites(parsed.map(String))
      }
    } catch {
      setFavorites([])
    }
  }, [])

  function persistFavorites(next: string[]) {
    setFavorites(next)
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    } catch {
      // local storage may be unavailable
    }
  }

  function toggleFavorite(moduleKey: string) {
    const next = favorites.includes(moduleKey)
      ? favorites.filter((key) => key !== moduleKey)
      : [moduleKey, ...favorites]
    persistFavorites(next)
  }

  const groups = useMemo(() => {
    return ['all', ...Array.from(new Set(data.modules.map((module) => module.moduleGroup).filter(Boolean))).sort()]
  }, [data.modules])

  const favoriteModules = useMemo(() => {
    const map = new Map(data.modules.map((module) => [module.moduleKey, module]))
    return favorites.map((key) => map.get(key)).filter(Boolean) as typeof data.modules
  }, [data.modules, favorites])

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase()
    const visible = data.modules.filter((module) => {
      const matchesGroup = group === 'all' || module.moduleGroup === group
      const haystack = `${module.moduleLabel} ${module.moduleKey} ${module.description} ${module.moduleGroup}`.toLowerCase()
      return matchesGroup && (!q || haystack.includes(q))
    })

    return [...visible].sort((a, b) => {
      const af = favorites.includes(a.moduleKey) ? 0 : 1
      const bf = favorites.includes(b.moduleKey) ? 0 : 1
      if (af !== bf) return af - bf
      return a.moduleLabel.localeCompare(b.moduleLabel)
    })
  }, [data.modules, favorites, group, query])

  const groupedModules = useMemo(() => {
    const map = new Map<string, typeof filteredModules>()
    for (const module of filteredModules) {
      const key = module.moduleGroup || 'ANGELCARE Workspaces'
      const list = map.get(key) || []
      list.push(module)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [filteredModules])

  const expandedCount = Object.values(expanded).filter(Boolean).length

  function toggleModule(moduleKey: string) {
    setExpanded((current) => ({
      ...current,
      [moduleKey]: !current[moduleKey],
    }))
  }

  function collapseAll() {
    setExpanded({})
  }

  function toggleModuleCardsVisibility() {
    if (showModuleCards) collapseAll()
    setShowModuleCards((current) => !current)
  }

  async function refreshHub() {
    actionProgress.startAction({
      title: 'Refresh Workspace Hub',
      subtitle: 'Reloading authorized modules from your latest permissions.',
      steps: [
        { id: 'session', label: 'Validate session', percent: 15 },
        { id: 'permissions', label: 'Load user permissions', percent: 35 },
        { id: 'registry', label: 'Load module registry', percent: 65 },
        { id: 'modules', label: 'Calculate authorized modules', percent: 90 },
        { id: 'complete', label: 'Workspace ready', percent: 100 },
      ],
    })

    try {
      actionProgress.setStep('session', 'running', 'Checking active session…', 15)
      actionProgress.setStep('permissions', 'running', 'Loading permission set…', 35)

      const response = await fetch('/api/workspace-hub/allowed-modules', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to refresh workspace hub.')
      }

      actionProgress.setStep('registry', 'done', 'Registry loaded.', 70)
      setData(payload.data)
      actionProgress.setStep('modules', 'done', 'Authorized workspaces calculated.', 95)
      actionProgress.completeAction('Workspace hub refreshed successfully.', {
        modules: payload.data?.stats?.authorizedModules || 0,
        pages: payload.data?.stats?.authorizedPages || 0,
      })
    } catch (error) {
      actionProgress.failAction(error instanceof Error ? error.message : 'Unable to refresh workspace hub.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2f7ff] [font-family:Inter,ui-sans-serif,system-ui,sans-serif] px-3 pb-10 pt-5 text-slate-950 sm:px-5 lg:px-7">
      <ActionProgressPanel progress={actionProgress.progress} onClose={actionProgress.closeProgress} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-12rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-blue-200/40 blur-[110px]" />
        <div className="absolute right-[-10rem] top-[12rem] h-[30rem] w-[30rem] rounded-full bg-cyan-100/60 blur-[120px]" />
        <div className="absolute bottom-[-16rem] left-[28%] h-[34rem] w-[34rem] rounded-full bg-indigo-100/50 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:34px_34px]" />
      </div>

      <section className="relative w-full max-w-none">
        <header className="relative overflow-hidden rounded-[40px] border border-white/90 bg-white/[0.92] p-5 shadow-[0_34px_110px_rgba(30,64,175,0.13)] ring-1 ring-slate-200/70 backdrop-blur-2xl sm:p-7 xl:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#e11d48_0%,#e11d48_12%,#1d4ed8_12%,#1d4ed8_68%,#0ea5e9_68%,#0ea5e9_86%,#16a34a_86%)]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rotate-12 rounded-[70px] border border-blue-100 bg-gradient-to-br from-blue-50/90 to-white/20" aria-hidden="true" />
          <div className="pointer-events-none absolute right-20 top-16 h-16 w-16 rotate-45 rounded-[18px] border border-rose-100 bg-rose-50/80" aria-hidden="true" />

          <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.75fr)] xl:items-stretch">
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex min-h-[58px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                    <Image
                      src="/logo.png"
                      alt="AngelCare"
                      width={146}
                      height={50}
                      priority
                      className="h-auto w-[126px] object-contain sm:w-[146px]"
                    />
                    <span className="h-8 w-px shrink-0 bg-slate-200" aria-hidden="true" />
                    <span className="leading-none">
                      <span className="block text-[10px] font-black uppercase tracking-[0.30em] text-blue-700">SANILA OS</span>
                      <span className="mt-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Operating environment</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Private operating environment
                  </div>
                </div>

                <div className="mt-7 max-w-5xl">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.26em] text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    Your place inside AngelCare
                  </div>
                  <h1 className="mt-3 text-[clamp(2.45rem,5.3vw,5.6rem)] font-black leading-[0.92] tracking-[-0.075em] text-slate-950">
                    Welcome to the
                    <span className="block bg-gradient-to-r from-[#0b2f78] via-blue-700 to-sky-500 bg-clip-text text-transparent">SANILA operating force.</span>
                  </h1>
                  <p className="mt-5 max-w-4xl text-sm font-semibold leading-7 text-slate-600 sm:text-base sm:leading-8">
                    {data.user.name}, this workspace is generated from your verified AngelCare identity. Every module, page and command shown below reflects the trust, responsibility and privileges assigned to your role.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 shadow-sm">
                  <Crown className="h-4 w-4 text-amber-500" />
                  {data.user.role || 'Authorized member'}
                </span>
                {data.user.department ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 shadow-sm">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    {data.user.department}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
                  {data.user.status}
                </span>
                {data.user.fullAccess ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-blue-700 shadow-sm">
                    <Zap className="h-4 w-4" />
                    Full system clearance
                  </span>
                ) : null}
              </div>
            </div>

            <div role="complementary" className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-[#0b2f78] via-[#103d91] to-[#0f5eb5] p-5 text-white shadow-[0_26px_70px_rgba(11,47,120,0.28)] sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10 bg-white/10 blur-sm" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-100">SANILA access passport</div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-blue-100/90">Authenticated member profile</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    Verified
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <PassportPortrait name={data.user.name} photoUrl={data.user.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-black uppercase tracking-[0.23em] text-sky-200">Official staff identity</div>
                    <div className="mt-2 truncate text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">{data.user.name}</div>
                    <div className="mt-1 truncate text-sm font-semibold text-blue-100">{data.user.email || data.user.username || 'AngelCare member'}</div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                      Secure identity active
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-white/[0.12] bg-white/10 p-3 backdrop-blur">
                    <div className="text-xl font-black text-white">{data.stats.authorizedModules}</div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.17em] text-blue-100">Modules</div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.12] bg-white/10 p-3 backdrop-blur">
                    <div className="text-xl font-black text-white">{data.stats.authorizedPages}</div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.17em] text-blue-100">Pages</div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.12] bg-white/10 p-3 backdrop-blur">
                    <div className="text-xl font-black text-white">{data.stats.permissionCount}</div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.17em] text-blue-100">Keys</div>
                  </div>
                </div>

                <div className="mt-auto pt-7">
                  <div className="flex items-center justify-between gap-4 border-t border-white/[0.12] pt-4 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
                    <span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-300" />Live access matrix</span>
                    <span>{data.stats.registryStatus.replaceAll('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {data.warnings.length && data.user.fullAccess ? (
          <div className={`mt-5 rounded-[24px] border px-5 py-4 text-sm font-semibold shadow-sm ${
            data.stats.registryStatus === 'registry_error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-black">
                  {data.stats.registryStatus === 'registry_error'
                    ? 'CEO notice: live registry needs attention.'
                    : 'CEO notice: workspace hub is using generated route fallback.'}
                </div>
                <div className="mt-1">{data.warnings[0]}</div>
              </div>
              <Link href="/users" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white/70 px-4 py-2.5 text-xs font-black shadow-sm transition hover:bg-white">
                Open User Management
              </Link>
            </div>
          </div>
        ) : null}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Authorized modules" value={data.stats.authorizedModules} icon={<Command className="h-5 w-5" />} detail="Your approved operating domains" />
          <MiniStat label="Reachable pages" value={data.stats.authorizedPages} icon={<Layers3 className="h-5 w-5" />} detail="Live routes attached to your profile" />
          <MiniStat label="Permission keys" value={data.stats.permissionCount} icon={<ShieldCheck className="h-5 w-5" />} detail="Granular access rights in force" />
          <MiniStat label="Open card sets" value={expandedCount} icon={<Activity className="h-5 w-5" />} detail="Expanded route collections below" />
        </section>

        <section className="mt-6 overflow-hidden rounded-[34px] border border-white/90 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-blue-700">
                <Command className="h-4 w-4" />
                SANILA workspace navigator
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl">Enter the work that belongs to you.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Search, filter and open only the workspaces authorized for your AngelCare mission. Your access profile remains the source of truth.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {filteredModules.length} visible now
            </div>
          </div>

          {favoriteModules.length ? (
            <div className="mt-5 rounded-[24px] border border-rose-100 bg-gradient-to-r from-rose-50/90 via-white to-white p-3.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">
                  <Heart className="h-4 w-4 fill-current" />
                  Personal command rail
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteModules.map((module) => (
                    <div key={module.moduleKey} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <Link href={module.primaryHref || '#'} className="text-xs font-black text-slate-800 transition hover:text-rose-700">
                        {module.moduleLabel}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(module.moduleKey)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                        aria-label="Remove favourite"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 rounded-[26px] border border-slate-200 bg-slate-50/90 p-3 xl:grid-cols-[minmax(0,1fr)_260px_auto_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search authorized modules</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a module, workspace, mission or permission…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold shadow-sm outline-none transition placeholder:font-semibold focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="sr-only">Filter by workspace group</span>
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="h-full w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {groups.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All workspace families' : item}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={toggleModuleCardsVisibility}
              aria-pressed={!showModuleCards}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-black shadow-sm transition ${
                showModuleCards
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100'
              }`}
            >
              {showModuleCards ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showModuleCards ? 'Hide all cards' : 'Show all cards'}
            </button>

            <button
              type="button"
              onClick={collapseAll}
              disabled={!showModuleCards || expandedCount === 0}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
            >
              Collapse cards
            </button>

            <button
              type="button"
              onClick={() => void refreshHub()}
              disabled={actionProgress.isRunning}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0b2f78] to-blue-700 px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(29,78,216,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(29,78,216,0.30)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${actionProgress.isRunning ? 'animate-spin' : ''}`} />
              Refresh access
            </button>
          </div>
        </section>

        {!showModuleCards ? (
          <div className="mt-6 overflow-hidden rounded-[30px] border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-5 shadow-[0_18px_55px_rgba(30,64,175,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm">
                  <EyeOff className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-950">Module cards start collapsed.</div>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    Your filters, permissions and authorized workspaces remain active. Click “Show all cards” when you want to open the module catalogue.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModuleCards(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0b2f78] to-blue-700 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(29,78,216,0.22)] transition hover:-translate-y-0.5"
              >
                <Eye className="h-4 w-4" />
                Show all cards
              </button>
            </div>
          </div>
        ) : groupedModules.length ? (
          <div className="mt-6 space-y-6">
            {groupedModules.map(([groupName, modules]) => (
              <section key={groupName} className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/[0.78] p-4 shadow-[0_22px_70px_rgba(15,23,42,0.065)] ring-1 ring-slate-200/60 backdrop-blur-xl sm:p-5">
                <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-blue-100/55 blur-3xl" aria-hidden="true" />
                <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                      <Layers3 className="h-4 w-4" />
                      {groupName}
                    </div>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-3xl">
                      {modules.length} authorized workspace{modules.length === 1 ? '' : 's'}
                    </h2>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.17em] text-slate-600 shadow-sm">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Access synchronized
                  </div>
                </div>

                <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 min-[2360px]:grid-cols-6">
                  {modules.map((module) => (
                    <WorkspaceModuleCard
                      key={module.moduleKey}
                      module={module}
                      expanded={Boolean(expanded[module.moduleKey])}
                      onToggle={toggleModule}
                      favorite={favorites.includes(module.moduleKey)}
                      onFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[36px] border border-white/90 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm ring-1 ring-blue-100">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="mt-5 text-2xl font-black tracking-[-0.05em] text-slate-950">No matching workspace is visible.</div>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              Adjust the search or group filter. When no access is assigned, an administrator can authorize modules from User Management.
            </p>
          </div>
        )}

        <div className="mt-7 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Member command suite</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">Identity, personal memos and direct AngelCare headquarters support.</div>
          </div>
        </div>

        <PersonalAccountSpace hubUser={data.user} />
      </section>
    </main>
  )
}
