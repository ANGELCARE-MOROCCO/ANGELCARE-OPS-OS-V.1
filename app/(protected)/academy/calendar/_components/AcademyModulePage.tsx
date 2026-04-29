
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { getAcademyModule, type AcademyModuleKey } from '../_lib/config'
import { getAcademyRows } from '../_lib/data'
import { AcademyHero, AcademyNav, AcademyRecordForm, CrossModulePanel, ExecutiveInsights, KpiGrid, RecordTable, WorkflowBoard } from './AcademyUI'

export default async function AcademyModulePage({ moduleKey }: { moduleKey: AcademyModuleKey }) {
  await requireAccess('academy.view')
  const module = getAcademyModule(moduleKey)
  const { rows, error } = await getAcademyRows(moduleKey, 30)
  const open = rows.filter((r) => !['completed','closed','paid','issued'].includes(String(r.status || r.eligibility_status || ''))).length
  return (
    <AppShell
      title={module.title}
      subtitle={module.executiveIntent}
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: module.title }]}
      actions={<><PageAction href="/academy" variant="light">Academy Hub</PageAction><PageAction href="/reports">Reports</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <AcademyNav active={moduleKey} />
        <AcademyHero title={`${module.icon} ${module.title}`} subtitle={module.managementMission} badge="ANGELCARE ACADEMY V3 OPERATING LAYER">
          <div style={{ display: 'grid', gap: 10 }}>
            <strong style={{ fontSize: 34 }}>{rows.length}</strong>
            <span style={{ fontWeight: 900 }}>stored records</span>
            <small style={{ color: 'rgba(255,255,255,.75)', fontWeight: 800 }}>Table: {module.table}</small>
          </div>
        </AcademyHero>
        <KpiGrid items={[{ label: 'Stored Records', value: String(rows.length), sub: module.table }, { label: 'Open Controls', value: String(open), tone: '#7c3aed', sub: 'needs manager attention' }, { label: 'Workflow Steps', value: String(module.workflow.length), tone: '#0891b2', sub: 'controlled sequence' }, { label: 'Risk Rules', value: String(module.riskRules.length), tone: '#dc2626', sub: 'operational checks' }]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start' }}>
          <AcademyRecordForm moduleKey={moduleKey} />
          <CrossModulePanel moduleKey={moduleKey} />
        </div>
        <WorkflowBoard moduleKey={moduleKey} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start' }}>
          <RecordTable moduleKey={moduleKey} rows={rows} error={error} />
          <ExecutiveInsights moduleKey={moduleKey} rows={rows} />
        </div>
      </div>
    </AppShell>
  )
}
