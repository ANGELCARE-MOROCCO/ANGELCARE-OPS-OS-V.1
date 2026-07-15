import TrainingHubShell from '@/components/traininghub/TrainingHubShell'
import { requireTrainingHubPageContext } from '../../traininghub-page-context'
import { getTrainingHubAccessUiData } from '@/lib/traininghub/ui'

export default async function TrainingHubAccessPage() {
  const context = await requireTrainingHubPageContext()
  const { organizations, roles, permissions } = await getTrainingHubAccessUiData()
  return (
    <TrainingHubShell context={context} active="access" title="Access & Governance" subtitle="Organisations, rôles RBAC, permissions et séparation complète TrainingHub / OpsOS.">
      <section style={columnsStyle}>
        <List title="Organisations" rows={organizations as any[]} mainKey="name" subKey="organization_type" />
        <List title="Roles" rows={roles as any[]} mainKey="code" subKey="scope" />
        <List title="Permissions" rows={permissions as any[]} mainKey="code" subKey="risk_level" />
      </section>
    </TrainingHubShell>
  )
}
function List({ title, rows, mainKey, subKey }: { title: string; rows: any[]; mainKey: string; subKey: string }) { return <section style={panelStyle}><h2 style={panelTitleStyle}>{title}</h2>{rows.length ? rows.map((row) => <div key={row.id} style={rowStyle}><strong>{row[mainKey] || row.id}</strong><span>{row[subKey] || row.status || 'active'}</span></div>) : <div style={emptyStyle}>Aucun enregistrement.</div>}</section> }
const columnsStyle = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }
const panelStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 16px 40px rgba(15,23,42,.06)' }
const panelTitleStyle = { margin: '0 0 14px', fontWeight: 950, fontSize: 20 }
const rowStyle = { display: 'grid', gap: 5, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 8, color: '#0f172a', fontWeight: 850 }
const emptyStyle = { color: '#64748b', background: '#f8fafc', borderRadius: 16, padding: 14, fontWeight: 800 }
