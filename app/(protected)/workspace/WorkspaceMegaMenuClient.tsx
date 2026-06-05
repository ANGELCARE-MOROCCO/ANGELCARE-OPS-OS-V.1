'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  Clock,
  Cog,
  FileText,
  Filter,
  Flag,
  Gauge,
  Globe2,
  GraduationCap,
  Handshake,
  Heart,
  Link2,
  Lock,
  Map,
  MapPin,
  Megaphone,
  Monitor,
  Package,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  WORKSPACE_FILTER_CHIPS,
  type WorkspaceAccent,
  type WorkspaceFilterKey,
  type WorkspaceGroup,
  type WorkspaceIconName,
  type WorkspaceModule,
} from '@/lib/workspace/workspace-modules'

const iconMap: Record<WorkspaceIconName, LucideIcon> = {
  activity: Activity,
  arrowRightLeft: ArrowRightLeft,
  barChart: BarChart3,
  boxes: Boxes,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  clock: Clock,
  cog: Cog,
  fileText: FileText,
  filter: Filter,
  flag: Flag,
  gauge: Gauge,
  globe: Globe2,
  graduationCap: GraduationCap,
  handshake: Handshake,
  heart: Heart,
  link: Link2,
  lock: Lock,
  map: Map,
  mapPin: MapPin,
  megaphone: Megaphone,
  monitor: Monitor,
  package: Package,
  receipt: Receipt,
  settings: Settings,
  shield: ShieldCheck,
  target: Target,
  trendingUp: TrendingUp,
  triangleAlert: TriangleAlert,
  userPlus: UserPlus,
  users: Users,
}

const accentStyles: Record<
  WorkspaceAccent,
  {
    card: string
    iconShell: string
    icon: string
    tileIcon: string
    tileHover: string
  }
> = {
  teal: {
    card: 'hover:border-teal-200',
    iconShell: 'bg-teal-50 ring-teal-100',
    icon: 'text-teal-600',
    tileIcon: 'text-teal-600',
    tileHover: 'hover:border-teal-200 hover:bg-teal-50/40',
  },
  violet: {
    card: 'hover:border-violet-200',
    iconShell: 'bg-violet-50 ring-violet-100',
    icon: 'text-violet-600',
    tileIcon: 'text-violet-600',
    tileHover: 'hover:border-violet-200 hover:bg-violet-50/40',
  },
  green: {
    card: 'hover:border-emerald-200',
    iconShell: 'bg-emerald-50 ring-emerald-100',
    icon: 'text-emerald-600',
    tileIcon: 'text-emerald-600',
    tileHover: 'hover:border-emerald-200 hover:bg-emerald-50/40',
  },
  blue: {
    card: 'hover:border-blue-200',
    iconShell: 'bg-blue-50 ring-blue-100',
    icon: 'text-blue-600',
    tileIcon: 'text-blue-600',
    tileHover: 'hover:border-blue-200 hover:bg-blue-50/40',
  },
  purple: {
    card: 'hover:border-fuchsia-200',
    iconShell: 'bg-fuchsia-50 ring-fuchsia-100',
    icon: 'text-fuchsia-600',
    tileIcon: 'text-fuchsia-600',
    tileHover: 'hover:border-fuchsia-200 hover:bg-fuchsia-50/40',
  },
  orange: {
    card: 'hover:border-orange-200',
    iconShell: 'bg-orange-50 ring-orange-100',
    icon: 'text-orange-600',
    tileIcon: 'text-orange-600',
    tileHover: 'hover:border-orange-200 hover:bg-orange-50/40',
  },
  sky: {
    card: 'hover:border-sky-200',
    iconShell: 'bg-sky-50 ring-sky-100',
    icon: 'text-blue-600',
    tileIcon: 'text-blue-600',
    tileHover: 'hover:border-sky-200 hover:bg-sky-50/40',
  },
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function groupSearchText(group: WorkspaceGroup) {
  return normalize(`${group.title} ${group.description} ${group.href || ''}`)
}

function moduleSearchText(group: WorkspaceGroup, module: WorkspaceModule) {
  return normalize(`${group.title} ${group.description} ${module.title} ${module.description || ''} ${module.href}`)
}

function matchesFilter(categories: string[], activeFilter: WorkspaceFilterKey) {
  return activeFilter === 'all' || categories.includes(activeFilter)
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, input, textarea, select'))
}

function IconBadge({
  icon,
  accent,
  size = 'large',
}: {
  icon: WorkspaceIconName
  accent: WorkspaceAccent
  size?: 'large' | 'small'
}) {
  const Icon = iconMap[icon] || Activity
  const styles = accentStyles[accent]
  const shellSize = size === 'large' ? 'h-14 w-14' : 'h-9 w-9'
  const iconSize = size === 'large' ? 'h-8 w-8' : 'h-5 w-5'

  return (
    <span className={`${shellSize} grid place-items-center rounded-lg ring-1 ${styles.iconShell}`}>
      <Icon className={`${iconSize} ${size === 'large' ? styles.icon : styles.tileIcon}`} aria-hidden="true" strokeWidth={1.9} />
    </span>
  )
}

export default function WorkspaceMegaMenuClient({
  displayName,
  groups,
}: {
  displayName: string
  groups: WorkspaceGroup[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<WorkspaceFilterKey>('all')

  const filteredGroups = useMemo(() => {
    const q = normalize(query)

    return groups
      .map((group) => {
        const categoryModules = group.modules.filter((module) => matchesFilter(module.categories, activeFilter))
        if (!categoryModules.length && !matchesFilter(group.categories, activeFilter)) return null

        const groupMatchesSearch = !q || groupSearchText(group).includes(q)
        const modules = groupMatchesSearch
          ? categoryModules
          : categoryModules.filter((module) => moduleSearchText(group, module).includes(q))

        if (!modules.length) return null

        return { ...group, modules }
      })
      .filter((group): group is WorkspaceGroup => Boolean(group))
  }, [activeFilter, groups, query])

  function openGroup(group: WorkspaceGroup, event: MouseEvent<HTMLElement>) {
    if (!group.href || isInteractiveTarget(event.target)) return
    router.push(group.href)
  }

  function openGroupWithKeyboard(group: WorkspaceGroup, event: KeyboardEvent<HTMLElement>) {
    if (!group.href) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    router.push(group.href)
  }

  return (
    <main className="min-h-[calc(100vh-86px)] bg-[#f7faff] px-4 py-8 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1780px]">
        <section className="max-w-5xl">
          <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Welcome, {displayName}
          </h1>
          <p className="mt-4 max-w-5xl text-base font-semibold leading-7 text-blue-950/75 sm:text-lg">
            You are entitled only for your role-based workspace. If you click on something that is not included in your system, you will be denied access. It's normal, do not panic. If you think it's an error, contact ANGELCARE system users manager for support:{' '}
            <a className="font-black text-blue-600 underline decoration-blue-200 underline-offset-4 hover:text-blue-700" href="mailto:backoffice@angelcarehub.com">
              backoffice@angelcarehub.com
            </a>
          </p>
        </section>

        <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="flex h-14 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/70 lg:max-w-[560px]">
            <Search className="h-5 w-5 text-blue-950/65" aria-hidden="true" />
            <span className="sr-only">Search workspaces</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-blue-950/55"
              placeholder="Search workspaces, modules, tools..."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {WORKSPACE_FILTER_CHIPS.map((chip) => {
              const selected = chip.key === activeFilter
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActiveFilter(chip.key)}
                  className={`h-12 rounded-lg border px-6 text-sm font-black transition ${
                    selected
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'border-slate-200 bg-white text-blue-950 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </section>

        {filteredGroups.length ? (
          <section className="mt-7 grid gap-5 xl:grid-cols-3">
            {filteredGroups.map((group) => {
              const styles = accentStyles[group.accent]
              const GroupIcon = iconMap[group.icon] || Activity

              return (
                <article
                  key={group.id}
                  role={group.href ? 'link' : undefined}
                  tabIndex={group.href ? 0 : undefined}
                  onClick={(event) => openGroup(group, event)}
                  onKeyDown={(event) => openGroupWithKeyboard(group, event)}
                  className={`rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/80 transition ${styles.card} ${
                    group.href ? 'cursor-pointer hover:shadow-lg hover:shadow-slate-200/80' : ''
                  } ${group.wide ? 'xl:col-span-2' : ''}`}
                  aria-label={group.href ? `Open ${group.title}` : undefined}
                >
                  <div className="grid gap-4 sm:grid-cols-[86px_1fr] sm:items-start">
                    <IconBadge icon={group.icon} accent={group.accent} />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-black leading-snug text-slate-950 sm:text-2xl">
                            {group.order}. {group.title}
                          </h2>
                          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-blue-950/70">
                            {group.description}
                          </p>
                        </div>
                        {group.href ? (
                          <GroupIcon className={`mt-1 h-5 w-5 shrink-0 ${styles.icon}`} aria-hidden="true" strokeWidth={2} />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
                    {group.modules.map((module) => (
                      <Link
                        key={`${group.id}-${module.id}`}
                        href={module.href}
                        title={module.href}
                        className={`grid min-h-24 place-items-center gap-2 rounded-md border border-slate-200 bg-white p-3 text-center text-blue-950 shadow-sm shadow-slate-100 transition ${styles.tileHover}`}
                      >
                        <IconBadge icon={module.icon} accent={group.accent} size="small" />
                        <span className="max-w-full text-balance text-xs font-black leading-4">
                          {module.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <section className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-950">No authorized workspaces found</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              No workspace module matches the current search, filter, or assigned permissions.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
