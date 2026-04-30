import AppShell from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { createClient } from '@/lib/supabase/server'
import { EnterpriseCard, EnterpriseGrid, EnterpriseHero, EnterpriseTable } from '../_components/EnterprisePanels'
import { runAcademyDataQuality } from '../_lib/dataQualityEngine'

export default async function AcademyDataQualityPage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [trainees, courses, trainers, groups, payments] = await Promise.all([
    supabase.from('academy_trainees').select('*').limit(500),
    supabase.from('academy_courses').select('*').limit(500),
    supabase.from('academy_trainers').select('*').limit(500),
    supabase.from('academy_groups').select('*').limit(500),
    supabase.from('academy_payments').select('*').limit(500),
  ])
  const checks = runAcademyDataQuality({ trainees: trainees.data || [], courses: courses.data || [], trainers: trainers.data || [], groups: groups.data || [], payments: payments.data || [] })
  const passed = checks.filter(c => c.passed).length
  return (
    <AppShell title="Academy Data Quality" subtitle="Operational data discipline for reliable management reporting and automation." breadcrumbs={[{ label: 'Academy' }, { label: 'Data Quality' }]}>
      <div style={{ display: 'grid', gap: 20 }}>
        <EnterpriseHero title="Academy Data Quality Control" subtitle="Identify missing data, weak records and operational blockers before they contaminate reports, certificates or automation." badge="DATA DISCIPLINE" />
        <EnterpriseGrid>
          <EnterpriseCard title="Checks passed" value={`${passed}/${checks.length}`} subtitle="Current quality rule compliance." />
          <EnterpriseCard title="Open issues" value={String(checks.reduce((s,c)=>s+c.count,0))} subtitle="Records requiring correction." />
          <EnterpriseCard title="Compliance issues" value={String(checks.filter(c=>c.impact==='compliance' && !c.passed).length)} subtitle="Audit-sensitive data defects." />
          <EnterpriseCard title="Financial issues" value={String(checks.filter(c=>c.impact==='financial' && !c.passed).length)} subtitle="Revenue/reporting defects." />
        </EnterpriseGrid>
        <EnterpriseTable rows={checks.map(c => ({ Check: c.label, Passed: c.passed ? 'Yes' : 'No', Issues: c.count, Impact: c.impact, Fix: c.fix }))} />
      </div>
    </AppShell>
  )
}
