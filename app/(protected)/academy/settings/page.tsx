import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademySettingsPage() {
  const data = await getAcademyData()
  const settings=[['Default city','Rabat / Temara'],['Default lifecycle','prospect → eligible → enrolled → completed → certified → placed'],['Payment recovery','Unpaid rows create revenue sync workload'],['Attendance risk','Absence creates manager follow-up'],['Certificate rule','Issue only after completion and evaluation evidence']]
  return <AppShell title="Academy Settings" subtitle="Production behavior settings blueprint." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Settings'}]} actions={<PageAction href="/academy/role-matrix">Role Matrix</PageAction>}>
    <div style={page}><PageHeader title="Academy production settings" subtitle="Centralize Academy operating rules before exposing staff to live workflows."/>
    <Card><h2>Current operating assumptions</h2><DataTable headers={['Setting','Production rule']} rows={settings.map((s: any)=>[s[0],s[1]])}/></Card></div>
  </AppShell>
}
