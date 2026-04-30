import AppShell from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { createClient } from '@/lib/supabase/server'
import { EnterpriseActionList, EnterpriseCard, EnterpriseGrid, EnterpriseHero, EnterpriseTable } from '../_components/EnterprisePanels'
import { buildAcademyGovernanceFindings, governanceScore } from '../_lib/governanceEngine'

export default async function AcademyGovernancePage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [traineesRes, enrollmentsRes, paymentsRes, attendanceRes, certificatesRes] = await Promise.all([
    supabase.from('academy_trainees').select('*').limit(500),
    supabase.from('academy_enrollments').select('*').limit(500),
    supabase.from('academy_payments').select('*').limit(500),
    supabase.from('academy_attendance').select('*').limit(500),
    supabase.from('academy_certificates').select('*').limit(500),
  ])
  const findings = buildAcademyGovernanceFindings({ trainees: traineesRes.data || [], enrollments: enrollmentsRes.data || [], payments: paymentsRes.data || [], attendance: attendanceRes.data || [], certificates: certificatesRes.data || [] })
  const score = governanceScore(findings)

  return (
    <AppShell title="Academy Governance" subtitle="Enterprise controls, compliance findings and operating discipline." breadcrumbs={[{ label: 'Academy' }, { label: 'Governance' }]}>
      <div style={{ display: 'grid', gap: 20 }}>
        <EnterpriseHero title="Academy Governance & Compliance Control" subtitle="A consolidated view of operational integrity, certification discipline, evidence readiness and management exceptions." badge="V5 PHASE 5" />
        <EnterpriseGrid>
          <EnterpriseCard title="Governance score" value={`${score}/100`} subtitle="Weighted control health score." />
          <EnterpriseCard title="Findings" value={String(findings.length)} subtitle="Open integrity/compliance findings." />
          <EnterpriseCard title="Critical" value={String(findings.filter(f => f.severity === 'critical').length)} subtitle="Immediate manager intervention required." />
          <EnterpriseCard title="High" value={String(findings.filter(f => f.severity === 'high').length)} subtitle="Needs operational correction." />
        </EnterpriseGrid>
        <EnterpriseTable rows={findings.map(f => ({ Severity: f.severity, Module: f.module, Finding: f.title, Recommendation: f.recommendation, Owner: f.ownerHint }))} />
        <EnterpriseActionList actions={[
          { title: 'Repair trainee serials', detail: 'Open trainee permanent folders and fix missing serials.', href: '/academy/trainees', priority: 'Compliance' },
          { title: 'Validate approved candidates', detail: 'Move approved but un-enrolled candidates into enrollment.', href: '/academy/enrollments', priority: 'Conversion' },
          { title: 'Review certificate evidence', detail: 'Check certificate readiness and attendance proof.', href: '/academy/certificates', priority: 'Audit' },
        ]} />
      </div>
    </AppShell>
  )
}
