import AppShell from '@/app/components/erp/AppShell'
import { getStaff360 } from '@/lib/hr-production/staff-enterprise'
import { StaffHero, StaffPanel, StaffShell, StaffTable, StaffButton } from '../../../_components/StaffEnterpriseUI'

const fieldMap: Record<string,string[]> = {
  attendance: ['work_date','status','punch_in_at','punch_out_at'],
  documents: ['document_type','status','expires_at','created_at'],
  contracts: ['contract_type','status','start_date','end_date'],
  training: ['title','status','score','created_at'],
  performance: ['title','status','score','created_at'],
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data: any = await getStaff360(id)
  const staff = data.staff
  const rows = (data['performance'] || data.docs || data.reviews || []).slice(0,100)
  const fields = fieldMap['performance'] || ['title','status','created_at']
  return <AppShell><StaffShell>
    <StaffHero eyebrow="Staff 360" title="Staff Performance" subtitle={staff?.full_name || staff?.name || 'Staff record'} actions={<><StaffButton href={`/hr/staff/${id}`}>Back to 360</StaffButton><StaffButton href={`/hr/staff/${id}/edit`} variant="light">Edit profile</StaffButton></>} />
    <StaffPanel title="Staff Performance" subtitle="Synchronized staff records.">
      <StaffTable headers={fields.map(f => f.replaceAll('_',' '))} rows={rows.map((x:any)=>fields.map(f=>x?.[f] || '—'))} />
    </StaffPanel>
  </StaffShell></AppShell>
}
