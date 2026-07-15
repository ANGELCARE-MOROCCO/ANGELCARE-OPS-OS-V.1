import TrainingHubShell from '@/components/traininghub/TrainingHubShell'
import { requireTrainingHubPageContext } from '../traininghub-page-context'
import { getTrainingHubResourcesUiData } from '@/lib/traininghub/ui'

export default async function TrainingHubResourcesPage() {
  const context = await requireTrainingHubPageContext()
  const { resources, kits } = await getTrainingHubResourcesUiData()
  return (
    <TrainingHubShell context={context} active="resources" title="Training Kits & Resources" subtitle="Workbooks, checklists, process cards, trainer decks et ressources contrôlées par entitlement.">
      <section style={columnsStyle}>
        <section style={panelStyle}><h2 style={panelTitleStyle}>Course resources</h2>{(resources as any[]).length ? (resources as any[]).map((r) => <div key={r.id} style={rowStyle}><strong>{r.resource_title}</strong><span>{r.resource_type || 'resource'} • {r.visibility_scope}</span></div>) : <Empty />}</section>
        <section style={panelStyle}><h2 style={panelTitleStyle}>Kit checklist</h2>{(kits as any[]).length ? (kits as any[]).map((k) => <div key={k.id} style={rowStyle}><strong>{k.kit_item_name}</strong><span>{k.kit_item_type} • {k.included_in_starter ? 'included starter' : 'optional'}</span></div>) : <Empty />}</section>
      </section>
    </TrainingHubShell>
  )
}
function Empty() { return <div style={emptyStyle}>Aucun enregistrement pour le moment.</div> }
const columnsStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
const panelStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 16px 40px rgba(15,23,42,.06)' }
const panelTitleStyle = { margin: '0 0 14px', fontWeight: 950, fontSize: 20 }
const rowStyle = { display: 'grid', gap: 5, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 8, color: '#0f172a', fontWeight: 850 }
const emptyStyle = { color: '#64748b', background: '#f8fafc', borderRadius: 16, padding: 14, fontWeight: 800 }
