import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { OPSOS_MODULES } from '@/lib/opsos-global/mega-pack-v1'
import { GlobalButton, GlobalHero, GlobalMetric, GlobalNavStrip, GlobalPanel, GlobalRow, GlobalShell, globalGrid } from '@/components/angelcare-enterprise/GlobalEnterpriseUI'

export default function Page() {
  const nav = [
    { label: 'Enterprise Command', href: '/executive-cockpit', tone: 'blue' as const },
    { label: 'Executive Cockpit', href: '/executive-cockpit', tone: 'purple' as const },
    { label: 'Module Specialization', href: '/module-specialization', tone: 'cyan' as const },
    { label: 'Ops War Room', href: '/operations-war-room', tone: 'red' as const },
    { label: 'Growth War Room', href: '/growth-war-room', tone: 'amber' as const },
    { label: 'Revenue War Room', href: '/revenue-war-room', tone: 'green' as const },
    { label: 'Academy Campus', href: '/academy-campus-command', tone: 'cyan' as const },
    { label: 'Final QA', href: '/opsos-final-qa', tone: 'slate' as const },
  ]

  return (
    <AppShell title="Executive Cockpit" subtitle="CEO / director command surface" breadcrumbs={[{ label: 'OPS OS', href: '/executive-cockpit' }, { label: 'Executive Cockpit' }]} actions={<PageAction href="/opsos-final-qa" variant="light">Final QA</PageAction>}>
      <GlobalShell>
        <GlobalNavStrip items={nav} />
        <GlobalHero
          eyebrow="AngelCare OPS OS Mega Pack V1"
          title="Executive Cockpit"
          subtitle="Leadership overview of all enterprise modules and operating domains."
          tone="purple"
          stats={[
            { label: 'Modules', value: OPSOS_MODULES.length, detail: 'Specialized command domains' },
            { label: 'UX Goal', value: 'Premium', detail: 'Enterprise operating system feel' },
            { label: 'SQL', value: '0', detail: 'No schema risk in this pack' },
          ]}
          actions={<><GlobalButton href="/staff-home" tone="blue">Staff Portal</GlobalButton><GlobalButton href="/hr" tone="purple">HR MAX</GlobalButton><GlobalButton href="/market-os" tone="amber">Market OS</GlobalButton><GlobalButton href="/revenue-command-center" tone="green">Revenue</GlobalButton></>}
        />

        <div style={globalGrid}>
          {OPSOS_MODULES.map((m) => <GlobalMetric key={m.key} label={m.label} value={m.widgets.length} detail={m.output} tone={m.tone} />)}
        </div>

        <div style={{ height: 22 }} />

        <GlobalPanel title="Executive Domain Signals" subtitle="Board-level navigation and module pressure." tone="purple">
          {OPSOS_MODULES.map((m) => (
            <GlobalRow key={m.key} title={m.label} meta={`${m.mission} · ${m.widgets.join(' / ')}`} status="open" href={m.commandHref} tone={m.tone} />
          ))}
        </GlobalPanel>
      </GlobalShell>
    </AppShell>
  )
}
