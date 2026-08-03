'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Bot, Database, ShieldCheck, Sparkles } from 'lucide-react'
import { HSD_CONTEXT_NAV, HSD_MASTER_UNIVERSES, HSD_ROUTE_ROOT } from '@/lib/homeservice-design/constants'
import { ServiceDesignDock, ServiceDesignPulseRail, sd2030 } from './studio2030'

function masterKey(pathname: string) {
  if (pathname === HSD_ROUTE_ROOT || pathname.startsWith(`${HSD_ROUTE_ROOT}/factory`)) return 'factory'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/catalogue`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/standards`)) return 'catalogue'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/planning`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/offers`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/bundles`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/documents`)) return 'results'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/vitrine`)) return 'vitrine'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/handoffs`)) return 'carelink'
  return 'advanced'
}

function routeTitle(pathname: string, fallback: string) {
  const labels: Array<[string, string, string]> = [
    [`${HSD_ROUTE_ROOT}/workbench`, 'Direct Manipulation Workbench', 'Timeline éditable, autosave, transformations et multi-audience'],
    [`${HSD_ROUTE_ROOT}/my-work`, 'Mon travail Service Design', 'Drafts, favoris, vues sauvegardées et documents'],
    [`${HSD_ROUTE_ROOT}/compare`, 'Visual Difference Engine', 'Comparaison, différences et fusion de scénarios'],
    [`${HSD_ROUTE_ROOT}/factory/category`, 'Category Experience Studio', 'Configuration métier, scénario prérempli et génération contrôlée'],
    [`${HSD_ROUTE_ROOT}/factory/import`, 'Import Intelligence Studio', 'Import ciblé par catégorie et ressource'],
    [`${HSD_ROUTE_ROOT}/catalogue/categories`, 'Service Portfolio Landscape', 'Catégories, readiness et dossiers produit'],
    [`${HSD_ROUTE_ROOT}/standards/doctrine`, 'Doctrine Intelligence Studio', 'Règles, activités, capacités et autorité locale'],
    [`${HSD_ROUTE_ROOT}/planning/documents`, 'A4 & PDF Production Studio', 'Plans techniques, pagination et export PDF'],
    [`${HSD_ROUTE_ROOT}/documents`, 'A4 & PDF Production Studio', '14 gabarits ISO, preview, impression et export'],
    [`${HSD_ROUTE_ROOT}/operations/documents`, 'Executive Document Studio', 'Rapports exécutifs attribuables et imprimables'],
    [`${HSD_ROUTE_ROOT}/planning`, 'Mission Plan Studio', 'Timelines, progression et scénarios techniques'],
    [`${HSD_ROUTE_ROOT}/offers`, 'Package & Economics Studio', 'Prix, marge, options et composition commerciale'],
    [`${HSD_ROUTE_ROOT}/vitrine`, 'Vitrine Release Studio', 'Références B2C et B2B prêtes à vendre'],
    [`${HSD_ROUTE_ROOT}/handoffs`, 'CARELINK Mission Bridge', 'Préflight et transmission opérationnelle'],
    [`${HSD_ROUTE_ROOT}/performance`, 'Service Intelligence', 'Performance, qualité et expérience client'],
    [`${HSD_ROUTE_ROOT}/quality`, 'Quality Evolution Studio', 'Signaux, causes et améliorations gouvernées'],
    [`${HSD_ROUTE_ROOT}/operations`, 'Production Sovereignty', 'Santé, incidents, readiness et sécurité'],
  ]
  const match = labels.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return match ? { title: match[1], detail: match[2] } : { title: fallback, detail: 'Service intelligence, expérience client et mission engineering' }
}

export function HomeServiceDesignShell({ children, databaseReady = true, pendingApprovals = 0 }: { children: ReactNode; databaseReady?: boolean; pendingApprovals?: number }) {
  const pathname = usePathname() || HSD_ROUTE_ROOT
  const activeMaster = masterKey(pathname)
  const activeUniverse = HSD_MASTER_UNIVERSES.find((item) => item.key === activeMaster)
  const contextNav = HSD_CONTEXT_NAV[activeMaster as keyof typeof HSD_CONTEXT_NAV] || []
  const identity = routeTitle(pathname, activeUniverse?.label || 'Service Design OS')

  return (
    <main className="service-design-2030 min-h-screen overflow-x-clip bg-[#f3f6fb] text-slate-950">
      <section className="relative border-b border-slate-200 bg-white/88 px-4 py-4 backdrop-blur-xl sm:px-6 xl:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_12%_0%,rgba(59,130,246,.11),transparent_26%),radial-gradient(circle_at_92%_120%,rgba(34,211,238,.10),transparent_30%)]" />
        <div className="relative mx-auto flex max-w-[1920px] flex-wrap items-center gap-4">
          <Link href={HSD_ROUTE_ROOT} className="group flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,.20)]"><Sparkles size={19} className="transition group-hover:rotate-6" /></div>
            <div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.25em] text-blue-600">ANGELCARE · Service Intelligence Studio</div><div className="mt-1 truncate text-lg font-black tracking-[-.035em] text-slate-950">{identity.title}</div><div className="truncate text-[10px] font-semibold text-slate-500">{identity.detail}</div></div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <div title={databaseReady ? 'Données opérationnelles disponibles' : 'Configuration base requise'} className={sd2030('hidden h-10 items-center gap-2 rounded-2xl border px-3 text-[9px] font-black uppercase tracking-[.12em] sm:flex', databaseReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}><Database size={14} />{databaseReady ? 'Catalogue live' : 'Base requise'}</div>
            <div title="OpenRouter Free" className="hidden h-10 items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-[9px] font-black uppercase tracking-[.12em] text-violet-700 lg:flex"><Bot size={14} />Advisory AI</div>
            <Link href={`${HSD_ROUTE_ROOT}/command/approvals`} className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"><ShieldCheck size={14} />{pendingApprovals > 0 ? `${pendingApprovals} validation${pendingApprovals > 1 ? 's' : ''}` : 'Intégrité'}</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1920px] px-4 py-4 sm:px-6 xl:px-8 xl:py-5">
        <ServiceDesignDock contextLinks={contextNav} />
        <ServiceDesignPulseRail databaseReady={databaseReady} pendingApprovals={pendingApprovals} />
        <div className="sd2030-workspace">{children}</div>
      </div>

      <style>{`
        .service-design-2030 { --sd-navy:#07142b; --sd-blue:#2563eb; --sd-cyan:#22d3ee; }
        .service-design-2030 .sd2030-workspace { animation: sd2030-enter .32s ease-out both; }
        .service-design-2030 .sd2030-workspace input,
        .service-design-2030 .sd2030-workspace select,
        .service-design-2030 .sd2030-workspace textarea { transition:border-color .18s ease, box-shadow .18s ease, background .18s ease; }
        .service-design-2030 .sd2030-workspace input:focus,
        .service-design-2030 .sd2030-workspace select:focus,
        .service-design-2030 .sd2030-workspace textarea:focus { outline:none; border-color:rgba(37,99,235,.55); box-shadow:0 0 0 4px rgba(37,99,235,.10); }
        .service-design-2030 .sd2030-workspace button,
        .service-design-2030 .sd2030-workspace a { -webkit-tap-highlight-color:transparent; }
        [data-service-design-focus="1"] .service-design-2030 .sd2030-pulse { display:none; }
        [data-service-design-focus="1"] .service-design-2030 .sd2030-workspace { max-width:1920px; margin-inline:auto; }
        @keyframes sd2030-enter { from { opacity:.25; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @media (prefers-reduced-motion: reduce) {
          .service-design-2030 *, .service-design-2030 *::before, .service-design-2030 *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important; }
        }
      `}</style>
    </main>
  )
}
