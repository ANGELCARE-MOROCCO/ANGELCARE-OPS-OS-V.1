'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { academyNavigation, academyNavGroups } from './academyNavigation'

type AcademyShellProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

function isActiveRoute(pathname: string, href: string) {
  if (href === '/academy') return pathname === '/academy'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AcademyShell({
  eyebrow = 'AngelCare Academy',
  title,
  description,
  actions,
  children,
}: AcademyShellProps) {
  const pathname = usePathname() || '/academy'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-[1800px] gap-6 px-5 py-6 lg:px-8">
        <aside className="hidden w-[292px] shrink-0 lg:block">
          <div className="sticky top-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-6">
              <div className="text-xs font-black uppercase tracking-[0.32em] text-sky-700">
                AngelCare
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Academy OS
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Training, cohorts, certification, placement and Academy operations.
              </p>
            </div>

            <nav className="space-y-5 px-4 py-5">
              {academyNavGroups.map((group) => {
                const items = academyNavigation.filter((item) => item.group === group.key)

                if (!items.length) return null

                return (
                  <div key={group.key}>
                    <div className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">
                      {group.label}
                    </div>

                    <div className="space-y-1">
                      {items.map((item) => {
                        const active = isActiveRoute(pathname, item.href)

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={[
                              'block rounded-2xl border px-4 py-3 transition',
                              active
                                ? 'border-sky-200 bg-sky-50 text-sky-950 shadow-sm'
                                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950',
                            ].join(' ')}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black">{item.label}</span>
                              {active ? (
                                <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                                  Live
                                </span>
                              ) : null}
                            </div>
                            {item.description ? (
                              <div className="mt-1 text-xs leading-5 text-slate-500">
                                {item.description}
                              </div>
                            ) : null}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-sky-700">
                  {eyebrow}
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>

              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {academyNavigation.map((item) => {
                const active = isActiveRoute(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black transition',
                      active
                        ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-500',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </header>

          <section className="min-w-0">{children}</section>
        </main>
      </div>
    </div>
  )
}
