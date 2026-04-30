import AppShell from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { EnterpriseActionList, EnterpriseCard, EnterpriseGrid, EnterpriseHero } from '../_components/EnterprisePanels'

export default async function AcademyWorkbenchPage() {
  await requireAccess('academy.view')
  return (
    <AppShell title="Academy Manager Workbench" subtitle="One place for managers to execute the most important Academy operating motions." breadcrumbs={[{ label: 'Academy' }, { label: 'Workbench' }]}>
      <div style={{ display: 'grid', gap: 20 }}>
        <EnterpriseHero title="Academy Manager Workbench" subtitle="A daily execution surface connecting trainee intake, eligibility, enrollment, payment, attendance, certification and partner outcomes." badge="MANAGER EXECUTION" />
        <EnterpriseGrid>
          <EnterpriseCard title="Intake" value="Trainees" subtitle="Create and classify candidate records." href="/academy/trainees" />
          <EnterpriseCard title="Gate" value="Eligibility" subtitle="Approve/reject candidates before enrollment." href="/academy/eligibility" />
          <EnterpriseCard title="Revenue" value="Payments" subtitle="Validate and follow outstanding payments." href="/academy/payments" />
          <EnterpriseCard title="Outcome" value="Certificates" subtitle="Issue verified training proof." href="/academy/certificates" />
        </EnterpriseGrid>
        <EnterpriseActionList actions={[
          { title: 'Run governance review', detail: 'Check control findings, missing evidence and lifecycle exceptions.', href: '/academy/governance', priority: 'Control' },
          { title: 'Run data quality check', detail: 'Detect incomplete records before reporting or automation.', href: '/academy/data-quality', priority: 'Quality' },
          { title: 'Review integration readiness', detail: 'Prepare PDF, WhatsApp, Email and Drive activation.', href: '/academy/integrations', priority: 'Scale' },
          { title: 'Open executive Academy cockpit', detail: 'Review intelligence and automation dashboards.', href: '/academy/executive', priority: 'Executive' },
        ]} />
      </div>
    </AppShell>
  )
}
