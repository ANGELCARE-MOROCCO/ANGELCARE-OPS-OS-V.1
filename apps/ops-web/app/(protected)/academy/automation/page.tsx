import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { buildAutomationSignals } from '../_lib/automationEngine'
import { AutomationSignalPanel, ExecutivePlaybook } from '../_components/AutomationUI'

export default async function AcademyAutomationPage() {
  await requireAccess('academy.view')
  const supabase = await createClient()

  const [{ data: trainees }, { data: payments }, { data: attendance }, { data: certificates }, { data: followups }] = await Promise.all([
    supabase.from('academy_trainees').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('academy_payments').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('academy_attendance').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_certificates').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('academy_graduation_followups').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  const signals = buildAutomationSignals({ trainees: trainees || [], payments: payments || [], attendance: attendance || [], certificates: certificates || [], followups: followups || [] })

  return (
    <AppShell
      title="Academy Automation Layer"
      subtitle="Exception detection, manager prompts, operational playbooks, and notification-readiness for Academy leadership."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Automation' }]}
      actions={<><PageAction href="/academy">Academy</PageAction><PageAction href="/academy/command-center" variant="light">Command Center</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <AutomationSignalPanel signals={signals} />
        <ExecutivePlaybook />
      </div>
    </AppShell>
  )
}
