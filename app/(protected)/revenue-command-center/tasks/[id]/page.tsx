import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { addChecklistItemAction, addTaskCommentAction, toggleChecklistItemAction, updateTaskStatusAction } from '../actions'
import { CockpitHero, Panel, PriorityBadge, StatusBadge, formatDateTime, linkedHref } from '../../_components/ExecutionPrimitives'

export default async function RevenueTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager', 'agent'])
  const { id } = await params
  const supabase = await createClient()

  const [{ data: task }, { data: users }, { data: comments }, { data: checklist }, { data: activities }] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('id', id).maybeSingle(),
    supabase.from('app_users').select('id, full_name, username, role'),
    supabase.from('bd_task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_task_checklist_items').select('*').eq('task_id', id).order('created_at', { ascending: true }),
    supabase.from('bd_task_activity_logs').select('*').eq('task_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!task) notFound()
  const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name || u.username]))
  const linked = linkedHref(task.linked_entity_type, task.linked_entity_id)

  return (
    <AppShell
      title="Task Workspace"
      subtitle={task.title}
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: task.title }]}
      actions={<><PageAction href="/revenue-command-center/tasks" variant="light">Retour tasks</PageAction><PageAction href="/revenue-command-center/cockpit" variant="light">Cockpit</PageAction></>}
    >
      <div style={pageStyle}>
        <CockpitHero title={task.title} subtitle={task.description || 'Aucune description — ajoutez un brief clair pour rendre cette tâche exploitable.'} right={<div style={heroRight}><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div>} />

        <section style={gridStyle}>
          <Panel title="Control Panel" subtitle="Statut, timing, propriétaire et objet business lié.">
            <div style={infoGrid}>
              <Info label="Assigné à" value={userMap.get(task.assigned_to) || 'Non assigné'} />
              <Info label="Créateur" value={userMap.get(task.created_by) || '—'} />
              <Info label="Début" value={formatDateTime(task.start_at)} />
              <Info label="Fin" value={formatDateTime(task.end_at)} />
              <Info label="Type lié" value={task.linked_entity_type || '—'} />
              <Info label="Objet lié" value={task.linked_entity_label || task.linked_entity_id || '—'} />
            </div>
            {linked ? <a href={linked} style={linkButton}>Ouvrir l’objet lié</a> : null}

            <form action={updateTaskStatusAction} style={statusForm}>
              <input type="hidden" name="task_id" value={task.id} />
              <select name="status" defaultValue={task.status} style={inputStyle}><option value="open">Open</option><option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
              <button style={buttonStyle}>Mettre à jour statut</button>
            </form>
          </Panel>

          <Panel title="Checklist" subtitle="Micro-exécution: étapes nécessaires pour terminer proprement.">
            <div style={{ display: 'grid', gap: 10 }}>
              {(checklist || []).map((item: any) => (
                <form key={item.id} action={toggleChecklistItemAction} style={checkRow}>
                  <input type="hidden" name="task_id" value={task.id} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="is_done" value={String(item.is_done)} />
                  <button style={tinyButton}>{item.is_done ? '✅' : '⬜'}</button>
                  <span style={{ textDecoration: item.is_done ? 'line-through' : 'none', color: item.is_done ? '#64748b' : '#0f172a', fontWeight: 850 }}>{item.label}</span>
                </form>
              ))}
            </div>
            <form action={addChecklistItemAction} style={miniForm}>
              <input type="hidden" name="task_id" value={task.id} />
              <input name="label" placeholder="Ajouter item checklist..." style={inputStyle} />
              <button style={buttonStyle}>Ajouter</button>
            </form>
          </Panel>
        </section>

        <section style={gridStyle}>
          <Panel title="Commentaires" subtitle="Fil de discussion interne pour manager et agent.">
            <form action={addTaskCommentAction} style={commentForm}>
              <input type="hidden" name="task_id" value={task.id} />
              <textarea name="comment" rows={4} required placeholder="Ajouter un commentaire, blocage, résultat d’appel, prochaine étape..." style={inputStyle} />
              <button style={buttonStyle}>Publier commentaire</button>
            </form>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {(comments || []).map((c: any) => <div key={c.id} style={commentCard}><strong>{userMap.get(c.author_user_id) || 'Utilisateur'}</strong><p>{c.comment}</p><small>{formatDateTime(c.created_at)}</small></div>)}
            </div>
          </Panel>

          <Panel title="Activity History" subtitle="Audit opérationnel de cette tâche.">
            <div style={{ display: 'grid', gap: 10 }}>
              {(activities || []).map((a: any) => <div key={a.id} style={activityCard}><strong>{a.action}</strong><small>{formatDateTime(a.created_at)}</small></div>)}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: string }) { return <div style={infoCard}><span>{label}</span><strong>{value}</strong></div> }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroRight: React.CSSProperties = { display: 'flex', gap: 8, background: 'rgba(255,255,255,.08)', padding: 16, borderRadius: 22, border: '1px solid rgba(255,255,255,.16)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }
const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const infoCard: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const statusForm: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 16 }
const miniForm: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 16 }
const commentForm: React.CSSProperties = { display: 'grid', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '12px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const tinyButton: React.CSSProperties = { border: 'none', background: '#eef2ff', borderRadius: 10, padding: 8, cursor: 'pointer' }
const linkButton: React.CSSProperties = { display: 'inline-flex', marginTop: 14, padding: '11px 14px', borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, textDecoration: 'none' }
const checkRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '40px 1fr', alignItems: 'center', gap: 10 }
const commentCard: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const activityCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: 13, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }
