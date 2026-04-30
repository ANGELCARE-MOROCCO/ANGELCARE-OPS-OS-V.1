import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { runAutomation } from '../_lib/automationEngine'

export default async function AutomationPage() {
  return (
    <AppShell
      title="Automation Engine"
      subtitle="Run system automation to generate tasks and enforce execution"
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Automation' }]}
      actions={<form action={async () => { 'use server'; await runAutomation() }}>
        <button style={{padding:12,background:'#0f172a',color:'#fff',borderRadius:10}}>Run Automation</button>
      </form>}
    >
      <div style={{padding:20}}>
        Automation is configured to:
        <ul>
          <li>Create tasks for inactive prospects (48h+)</li>
          <li>Create tasks for missing next actions</li>
        </ul>
      </div>
    </AppShell>
  )
}
