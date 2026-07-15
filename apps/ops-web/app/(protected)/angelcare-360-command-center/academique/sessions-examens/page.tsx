import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { createAngelcare360ExamSession, listAngelcare360ExamSessions, listAngelcare360Exams } from '@/lib/angelcare360/server/academics'
import { listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import { optionValue, relatedLabel } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

async function createSessionAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/sessions-examens')
  const result = await createAngelcare360ExamSession({
    schoolId: context.school.id,
    examId: String(formData.get('examId') || ''),
    sessionCode: String(formData.get('sessionCode') || ''),
    room: optionValue(formData.get('room')),
    startsAt: optionValue(formData.get('startsAt')),
    endsAt: optionValue(formData.get('endsAt')),
    invigilatorStaffId: optionValue(formData.get('invigilatorStaffId')),
    status: String(formData.get('status') || 'planned'),
  })
  if (!result.ok) throw new Error(result.error || 'Création de session impossible.')
  revalidatePath('/angelcare-360-command-center/academique/sessions-examens')
  redirect('/angelcare-360-command-center/academique/sessions-examens')
}

export default async function Angelcare360SessionsExamensPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const [sessions, exams, teachers] = await Promise.all([
    listAngelcare360ExamSessions({ schoolId: context.school.id }),
    listAngelcare360Exams({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360TeacherAssignments(context.school.id, context.academicYear?.id || null),
  ])

  return (
    <Angelcare360AcademicPageShell
      title="Sessions d’examens"
      subtitle="Créneaux, salles et surveillance des sessions d’examens avec statut serveur."
      badge="Académique"
      statusLabel={`${sessions.length} session(s)`}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Création</div>
            <h2 style={panelTitleStyle}>Nouvelle session</h2>
          </div>
        </div>
        {exams.length === 0 ? (
          <Angelcare360EmptyState title="Aucun examen" description="Créez un examen avant d’ouvrir une session associée." />
        ) : (
          <form action={createSessionAction} style={formGridStyle}>
            <Select name="examId" defaultValue={exams[0]?.id || ''}>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</Select>
            <Input name="sessionCode" placeholder="Code session" />
            <Input name="room" placeholder="Salle" />
            <Input name="startsAt" type="datetime-local" />
            <Input name="endsAt" type="datetime-local" />
            <Select name="invigilatorStaffId" defaultValue=""><option value="">Surveillant non renseigné</option>{teachers.map((item) => <option key={item.id} value={item.staff_id}>{relatedLabel(item.staff) || item.staff_id}</option>)}</Select>
            <Select name="status" defaultValue="planned">
              <option value="planned">Planifiée</option>
              <option value="scheduled">Planifiée</option>
              <option value="open">Ouverte</option>
              <option value="closed">Clôturée</option>
              <option value="archived">Archivée</option>
            </Select>
            <button type="submit" style={primaryButtonStyle}>Enregistrer la session</button>
          </form>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Sessions</div>
            <h2 style={panelTitleStyle}>Liste des sessions</h2>
          </div>
          <div style={panelMetaStyle}>{sessions.length} enregistrement(s)</div>
        </div>
        {sessions.length === 0 ? (
          <Angelcare360EmptyState title="Aucune session" description="Aucune session d’examen n’est enregistrée pour l’instant." />
        ) : (
          <div style={tableStyle}>
            {sessions.map((session) => (
              <article key={session.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{session.exam_title || session.exam_code || session.exam_id}</div>
                  <div style={rowMetaStyle}>{session.session_code} · {session.room || 'Sans salle'}</div>
                  <div style={rowMetaStyle}>{session.starts_at || 'Début non fixé'} → {session.ends_at || 'Fin non fixée'}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={session.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Angelcare360AcademicPageShell>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={inputStyle} />
}

function Status({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    planned: ['Planifiée', '#dbeafe'],
    scheduled: ['Planifiée', '#dbeafe'],
    open: ['Ouverte', '#dcfce7'],
    closed: ['Clôturée', '#fee2e2'],
    archived: ['Archivée', '#e2e8f0'],
  }
  const [label, background] = map[status] || [status, '#f8fafc']
  return <span style={{ ...statusStyle, background }}>{label}</span>
}

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const panelMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const tableStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const rowMainStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const rowTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 900,
}

const rowMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 600,
}

const rowActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 10,
}

const inputStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '11px 13px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
}

const statusStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 900,
}

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '11px 14px',
  fontWeight: 800,
}
