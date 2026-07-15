'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Heart,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'
import type { AuthorizedWorkspaceHubData } from '@/lib/workspace-hub/authorized-modules'
import WorkspaceModuleCard from '@/components/workspace-hub/WorkspaceModuleCard'
import PersonalAccountSpace from '@/components/workspace-hub/PersonalAccountSpace'

const FAVORITES_KEY = 'angelcare.workspaceHub.favorites.v1'

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-500">{label}</div>
    </div>
  )
}

export default function AuthorizedWorkspaceHub({ initialData }: { initialData: AuthorizedWorkspaceHubData }) {
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
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
    <main className="min-h-screen bg-[#edf4ff] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <ActionProgressPanel progress={actionProgress.progress} onClose={actionProgress.closeProgress} />

      <section className="mx-auto w-full max-w-none">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                Authorized Workspace Hub
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 md:text-5xl">
                Welcome back, {data.user.name}
              </h1>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Your authorized modules are arranged as compact smart cards. Favourite important workspaces, expand any card to see permitted pages, and keep the dashboard short.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                Role: {data.user.role}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                {data.user.status}
              </span>
              {data.user.fullAccess ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  Full access
                </span>
              ) : null}
            </div>
          </div>

          <PersonalAccountSpace hubUser={data.user} />

          {data.warnings.length && data.user.fullAccess ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              data.stats.registryStatus === 'registry_error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}>
              <div className="font-black">
                {data.stats.registryStatus === 'registry_error'
                  ? 'CEO notice: live registry needs attention.'
                  : 'CEO notice: workspace hub is using generated route fallback.'}
              </div>
              <div className="mt-1">{data.warnings[0]}</div>
              <Link href="/users" className="mt-2 inline-flex font-black underline underline-offset-4">
                Open User Management and run App Access Scan
              </Link>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Modules" value={data.stats.authorizedModules} />
            <MiniStat label="Pages" value={data.stats.authorizedPages} />
            <MiniStat label="Permissions" value={data.stats.permissionCount} />
            <MiniStat label="Expanded" value={expandedCount} />
          </div>

          {favoriteModules.length ? (
            <div className="mt-5 rounded-[24px] border border-rose-100 bg-rose-50/60 p-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-rose-700">
                <Heart className="h-4 w-4 fill-current" />
                Favourite bookmarks
              </div>
              <div className="flex flex-wrap gap-2">
                {favoriteModules.map((module) => (
                  <div key={module.moduleKey} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-2 shadow-sm">
                    <Link href={module.primaryHref || '#'} className="text-xs font-black text-slate-800 hover:text-rose-700">
                      {module.moduleLabel}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(module.moduleKey)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                      aria-label="Remove favourite"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search modules, workspaces or permissions…"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {groups.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All groups' : item}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={collapseAll}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
              >
                Collapse all
              </button>

              <button
                type="button"
                onClick={() => void refreshHub()}
                disabled={actionProgress.isRunning}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${actionProgress.isRunning ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {groupedModules.length ? (
          <div className="mt-6 space-y-7 overflow-visible">
            {groupedModules.map(([groupName, modules]) => (
              <section key={groupName} className="relative overflow-visible rounded-[30px] border border-slate-200 bg-white/70 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-blue-600">
                      <Layers3 className="h-4 w-4" />
                      {groupName}
                    </div>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">
                      {modules.length} smart card{modules.length === 1 ? '' : 's'}
                    </h2>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Synced access
                  </div>
                </div>

                <div className="relative grid grid-cols-2 gap-4 overflow-visible sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
          <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_65px_rgba(15,23,42,0.06)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">No workspace access has been assigned yet.</div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Ask an administrator to assign module access from User Management.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
