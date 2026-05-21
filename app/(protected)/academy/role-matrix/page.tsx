import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyRoleMatrixPage() {
  const data = await getAcademyData()
  const roles=[['academy.view','Open Academy cockpit and read operational records'],['academy.manage','Create and update operational Academy records'],['academy.trainees.manage','Control trainee dossiers, status and eligibility'],['academy.payments.manage','Manage payment ledger and unpaid recovery'],['academy.certificates.manage','Issue and control certificates'],['academy.reports.view','Access reports, exports and board summaries'],['academy.admin','Governance, integrations, settings and destructive actions']]
  return <AppShell title="Academy Role Matrix" subtitle="Permissions blueprint for production staff access." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Role Matrix'}]} actions={<PageAction href="/academy/governance">Governance</PageAction>}>
    <div style={page}><PageHeader title="Academy permissions control" subtitle="Use this matrix to wire users by role without exposing sensitive Academy operations to the wrong staff."/>
    <Card><h2>Recommended permissions</h2><DataTable headers={['Permission','Purpose']} rows={roles.map((r)=>[<Badge>{r[0]}</Badge>,r[1]])}/></Card></div>
  </AppShell>
}
