import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HRPhase6NavigationBoard, HRPhase6RouteStats, HRPhase6TopNav } from '../_components/HRPhase6Nav'
import { HRHero } from '../_components/HRMaxUI'

export default function HRNavigationPage() {
  return (
    <AppShell
      title="HR Navigation Hub"
      subtitle="Unified navigation layer for the full HR MAX module."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Navigation' }]}
      actions={<PageAction href="/hr" variant="light">HR Dashboard</PageAction>}
    >
      <HRPhase6TopNav />
      <HRHero
        title="HR MAX Navigation Hub"
        subtitle="A consolidated navigation board connecting every HR MAX workspace: command, recruitment, staff, onboarding, rosters, attendance, governance, analytics and configuration."
      />
      <HRPhase6RouteStats />
      <div style={{ height: 22 }} />
      <HRPhase6NavigationBoard />
    </AppShell>
  )
}
