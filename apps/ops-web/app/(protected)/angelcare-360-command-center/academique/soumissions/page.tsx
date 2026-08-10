import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AssignmentSubmissions, updateAngelcare360AssignmentSubmissionStatus } from '@/lib/angelcare360/server/academics'
import { listAngelcare360Assignments } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects } from '@/lib/angelcare360/server/administration'
import { optionValue, numberValue } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

async function updateSubmissionAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/soumissions')
  const result = await updateAngelcare360AssignmentSubmissionStatus({
    schoolId: context.school.id,
    assignmentId: String(formData.get('assignmentId') || ''),
    studentId: String(formData.get('studentId') || ''),
    status: String(formData.get('status') || 'submitted'),
    score: numberValue(formData.get('score')),
    feedback: optionValue(formData.get('feedback')),
    submittedAt: optionValue(formData.get('submittedAt')),
  })
  if (!result.ok) throw new Error(result.error || 'Mise à jour de la soumission impossible.')
  revalidatePath('/angelcare-360-command-center/academique/soumissions')
  redirect('/angelcare-360-command-center/academique/soumissions')
}

export default async function Angelcare360SoumissionsPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const assignmentId = optionValue(searchParams?.assignmentId as FormDataEntryValue | null)
  const studentId = optionValue(searchParams?.studentId as FormDataEntryValue | null)
  const classId = optionValue(searchParams?.classId as FormDataEntryValue | null)
  const status = optionValue(searchParams?.status as FormDataEntryValue | null)
  const search = optionValue(searchParams?.q as FormDataEntryValue | null)

  const [submissions, assignments, years, classes, sections, subjects] = await Promise.all([
    listAngelcare360AssignmentSubmissions({ schoolId: context.school.id, assignmentId, studentId, classId, status, search }),
    listAngelcare360Assignments({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, context.academicYear?.id || null),
    listAngelcare360Subjects(context.school.id),
  ])

  return (
    <Angelcare360AcademicPageShell
      title="Soumissions"
      subtitle="Liste opérationnelle des remises avec correction, retard et statut de suivi."
      badge="Académique"
      statusLabel={`${submissions.length} soumission(s)`}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      contextRow={
        <>
          <Badge label={`Devoirs: ${assignments.length}`} />
          <Badge label={`Classes: ${classes.length}`} />
          <Badge label={`Matières: ${subjects.length}`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Filtres</div>
            <h2 style={panelTitleStyle}>Filtrer les soumissions</h2>
          </div>
        </div>
        <form method="get" style={filterGridStyle}>
          <Input name="q" placeholder="Recherche" defaultValue={search || ''} />
          <Select name="assignmentId" defaultValue={assignmentId || ''}><option value="">Tous les devoirs</option>{assignments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select>
          <Input name="studentId" placeholder="ID élève" defaultValue={studentId || ''} />
          <Select name="classId" defaultValue={classId || ''}><option value="">Toutes les classes</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="status" defaultValue={status || ''}>
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="submitted">Soumis</option>
            <option value="late">En retard</option>
            <option value="reviewed">Corrigé</option>
            <option value="missing">Manquant</option>
          </Select>
          <button type="submit" style={primaryButtonStyle}>Appliquer</button>
        </form>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Soumissions</div>
            <h2 style={panelTitleStyle}>Remises enregistrées</h2>
          </div>
          <div style={panelMetaStyle}>{submissions.length} enregistrement(s)</div>
        </div>
        {submissions.length === 0 ? (
          <Angelcare360EmptyState title="Aucune soumission" description="Aucune remise ne correspond aux filtres courants." />
        ) : (
          <div style={tableStyle}>
            {submissions.map((submission) => (
              <form key={submission.id} action={updateSubmissionAction} style={rowStyle}>
                <input type="hidden" name="assignmentId" value={submission.assignment_id} />
                <input type="hidden" name="studentId" value={submission.student_id} />
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{submission.student_full_name || submission.student_code || submission.student_id}</div>
                  <div style={rowMetaStyle}>{submission.assignment_title || submission.assignment_code || submission.assignment_id}</div>
                  <div style={rowMetaStyle}>{submission.due_on || 'Sans échéance'} · {submission.submitted_at || 'Non remis'}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={submission.status} />
                  <Input name="score" type="number" min="0" step="0.01" placeholder="Note" defaultValue={submission.score ?? ''} />
                  <Input name="feedback" placeholder="Retour" defaultValue={submission.feedback || ''} />
                  <Input name="submittedAt" type="datetime-local" defaultValue={submission.submitted_at || ''} />
                  <Select name="status" defaultValue={submission.status}>
                    <option value="pending">En attente</option>
                    <option value="submitted">Soumis</option>
                    <option value="late">En retard</option>
                    <option value="reviewed">Corrigé</option>
                    <option value="missing">Manquant</option>
                  </Select>
                  <button type="submit" style={primaryButtonStyle}>Mettre à jour</button>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>
    </Angelcare360AcademicPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={inputStyle} />
}

function Status({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ['En attente', '#f1f5f9'],
    submitted: ['Soumis', '#dbeafe'],
    late: ['En retard', '#fee2e2'],
    reviewed: ['Corrigé', '#dcfce7'],
    missing: ['Manquant', '#fef3c7'],
  }
  const [label, background] = map[status] || [status, '#f8fafc']
  return <span style={{ ...statusStyle, background }}>{label}</span>
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1e40af',
  fontSize: 12,
  fontWeight: 900,
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

const filterGridStyle: React.CSSProperties = {
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
