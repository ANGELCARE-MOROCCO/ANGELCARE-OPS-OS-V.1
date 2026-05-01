import HrOsShell from '@/app/components/hr-os/HrOsShell'
import { ActionButton, Badge, Kpi, Panel, inputStyle } from '@/app/components/hr-os/EliteCards'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { calculateTrainingScore, getRolePath, getTrainingStatus, shouldBlockAdvancedAccess } from '../_lib/hrSmartOnboardingEngine'
import { createOnboardingAssessment, markSmartOnboardingStep } from '../_actionsSmartOnboarding'

export default async function SmartOnboardingPage({ searchParams }: { searchParams?: Promise<{ role?: string; user?: string }> }) {
  await requireAccess('hr.view')
  const params = await searchParams
  const role = params?.role || 'agent'
  const userId = params?.user || 'current-user'
  const path = getRolePath(role)

  const supabase = await createClient()
  let progress: any[] = []
  let assessments: any[] = []

  try {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('hr_os_smart_onboarding_progress').select('*').eq('user_id', userId).eq('role', role),
      supabase.from('hr_os_onboarding_assessments').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    progress = p || []
    assessments = a || []
  } catch {
    progress = []
    assessments = []
  }

  const completedCodes = new Set(progress.map((p) => p.step_code))
  const completed = path.filter((step) => completedCodes.has(step.code)).length
  const score = calculateTrainingScore(completed, path.length)
  const status = getTrainingStatus(score)
  const blocked = shouldBlockAdvancedAccess(score)

  return (
    <HrOsShell
      title="HR-OS V11.2 Smart Onboarding"
      subtitle="Role-based onboarding, training checkpoints, usage enforcement readiness, manager assessment and adoption control."
      active="onboarding-smart"
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <Kpi label="Training Score" value={`${score}%`} tone={blocked ? '#ef4444' : '#16a34a'} />
          <Kpi label="Completed Steps" value={`${completed}/${path.length}`} tone="#2563eb" />
          <Kpi label="Status" value={status} tone="#7c3aed" />
          <Kpi label="Advanced Access" value={blocked ? 'Blocked' : 'Allowed'} tone={blocked ? '#ef4444' : '#16a34a'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Role-Based Training Path" subtitle="Each role has a mandatory route sequence connected to real HR-OS usage." tone="#2563eb">
            <div style={{ display: 'grid', gap: 10 }}>
              {path.map((step) => {
                const done = completedCodes.has(step.code)
                return (
                  <div key={step.code} style={row}>
                    <div>
                      <Badge tone={done ? '#16a34a' : '#f59e0b'}>{done ? 'completed' : 'pending'}</Badge>
                      <h3 style={{ margin: '8px 0 4px' }}>{step.code} · {step.title}</h3>
                      <a href={step.route} style={{ color: '#2563eb', fontWeight: 900 }}>Open training route</a>
                    </div>
                    <form action={markSmartOnboardingStep} style={{ display: 'grid', gap: 8, width: 260 }}>
                      <input type="hidden" name="user_id" value={userId} />
                      <input type="hidden" name="role" value={role} />
                      <input type="hidden" name="step_code" value={step.code} />
                      <input type="hidden" name="step_title" value={step.title} />
                      <input name="evidence_note" placeholder="Evidence note" style={inputStyle} />
                      <button style={smallButton}>Mark Complete</button>
                    </form>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Manager Assessment" subtitle="Manager validates whether user is allowed to operate independently." tone="#7c3aed">
            <form action={createOnboardingAssessment} style={{ display: 'grid', gap: 10 }}>
              <input name="user_id" defaultValue={userId} style={inputStyle} />
              <select name="role" defaultValue={role} style={inputStyle}>
                <option value="agent">agent</option>
                <option value="manager">manager</option>
                <option value="executive">executive</option>
              </select>
              <input name="score" type="number" defaultValue={score} style={inputStyle} />
              <select name="decision" defaultValue={status} style={inputStyle}>
                <option value="blocked">blocked</option>
                <option value="in_progress">in_progress</option>
                <option value="nearly_ready">nearly_ready</option>
                <option value="certified">certified</option>
              </select>
              <textarea name="manager_note" placeholder="Manager validation note..." style={{ ...inputStyle, minHeight: 100 }} />
              <ActionButton>Save Assessment</ActionButton>
            </form>
          </Panel>
        </div>

        <Panel title="Assessment History" subtitle="Latest manager assessments and certification decisions." tone="#0f172a">
          <div style={{ display: 'grid', gap: 10 }}>
            {assessments.length ? assessments.map((a) => (
              <div key={a.id} style={row}>
                <div>
                  <strong>{a.user_id} · {a.role}</strong>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750 }}>{a.manager_note || 'No note'}</p>
                </div>
                <Badge tone={a.decision === 'certified' ? '#16a34a' : a.decision === 'blocked' ? '#ef4444' : '#f59e0b'}>{a.decision}</Badge>
              </div>
            )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No assessments yet.</p>}
          </div>
        </Panel>
      </div>
    </HrOsShell>
  )
}

const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 15, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }
const smallButton: React.CSSProperties = { border: 0, borderRadius: 11, padding: '9px 11px', background: '#0f172a', color: '#fff', fontWeight: 900 }
