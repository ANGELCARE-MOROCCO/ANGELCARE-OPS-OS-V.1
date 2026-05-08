import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HRHero, HRPanel, HRRow } from '../_components/HRMaxUI'

export default function HRSettingsPage() {
  const settings = [
    ['Recruitment stages','new, screening, interview, trial, offer, hired, rejected'],
    ['Task priorities','low, medium, high, urgent, critical'],
    ['Document statuses','pending, verified, rejected, expired'],
    ['Attendance correction states','pending, approved, rejected, needs_more_info'],
    ['Roster conflict severity','low, medium, high, critical'],
  ]
  return <AppShell title="HR Settings" subtitle="Operational configuration reference." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Settings'}]} actions={<PageAction href="/hr" variant="light">HR</PageAction>}>
    <HRHero title="HR Operating Configuration" subtitle="Reference workspace for HR stages, statuses and configuration standards used across HR MAX." />
    <HRPanel title="Configuration matrix" subtitle="Phase 3 gives visibility first; later phase can make these editable in database.">
      {settings.map(([a,b])=><HRRow key={a} title={a} meta={b} status="configured"/>)}
    </HRPanel>
  </AppShell>
}
