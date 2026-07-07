import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { changeAngelcare360AssignmentStatus, getAngelcare360AssignmentById, updateAngelcare360Assignment } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import { optionValue, numberValue, relatedLabel, secondaryLinkStyle } from '../../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

async function updateAssignmentAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/devoirs')
  const result = await updateAngelcare360Assignment({
    schoolId: context.school.id,
    id: String(formData.get('id') || ''),
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    classId: String(formData.get('classId') || ''),
    sectionId: optionValue(formData.get('sectionId')),
    subjectId: String(formData.get('subjectId') || ''),
    staffId: String(formData.get('staffId') || ''),
    assignmentCode: optionValue(formData.get('assignmentCode')),
    title: String(formData.get('title') || ''),
    description: optionValue(formData.get('description')),
    dueOn: optionValue(formData.get('dueOn')),
    maxScore: numberValue(formData.get('maxScore')),
    status: String(formData.get('status') || 'draft'),
  })
  if (!result.ok) throw new Error(result.error || 'Mise à jour du devoir impossible.')
  revalidatePath('/angelcare-360-command-center/academique/devoirs')
  revalidatePath(`/angelcare-360-command-center/academique/devoirs/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/devoirs/${String(formData.get('id') || '')}`)
}

async function changeStatusAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/devoirs')
  const result = await changeAngelcare360AssignmentStatus({
    schoolId: context.school.id,
    id: String(formData.get('id') || ''),
    status: String(formData.get('status') || 'draft'),
  })
  if (!result.ok) throw new Error(result.error || 'Changement de statut impossible.')
  revalidatePath('/angelcare-360-command-center/academique/devoirs')
  revalidatePath(`/angelcare-360-command-center/academique/devoirs/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/devoirs/${String(formData.get('id') || '')}`)
}

export default async function Angelcare360DevoirDetailPage({ params }: { params: { id: string } }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const detail = await getAngelcare360AssignmentById({ schoolId: context.school.id, id: params.id })
  if (!detail) notFound()

  const assignment = detail.assignment
  const [years, classes, sections, subjects, teachers] = await Promise.all([
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, assignment.academic_year_id),
    listAngelcare360Sections(context.school.id, assignment.academic_year_id),
    listAngelcare360Subjects(context.school.id),
    listAngelcare360TeacherAssignments(context.school.id, assignment.academic_year_id),
  ])

  return (
    <Angelcare360AcademicPageShell
      title={`Devoir ${assignment.assignment_code}`}
      subtitle="Détail du devoir, remises et statut de publication contrôlés côté serveur."
      badge="Devoir"
      statusLabel={assignment.status}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/academique/devoirs" style={secondaryLinkStyle}>Retour</Link>}
      contextRow={
        <>
          <Badge label={assignment.class_name || assignment.class_id} />
          <Badge label={assignment.subject_name || assignment.subject_id} />
          <Badge label={`${detail.submissions.length} remise(s)`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Résumé</div>
            <h2 style={panelTitleStyle}>{assignment.title}</h2>
            <p style={panelMetaStyle}>{assignment.due_on || 'Sans échéance'} · Max {assignment.max_score ?? '—'}</p>
          </div>
        </div>
        <p style={bodyTextStyle}>{assignment.description || 'Aucune consigne détaillée.'}</p>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Édition</div>
            <h2 style={panelTitleStyle}>Modifier le devoir</h2>
          </div>
        </div>
        {years.length === 0 || classes.length === 0 || subjects.length === 0 ? (
          <Angelcare360EmptyState title="Données de référence manquantes" description="Impossible d’éditer le devoir sans année, classe et matière." />
        ) : (
          <form action={updateAssignmentAction} style={formGridStyle}>
            <input type="hidden" name="id" value={assignment.id} />
            <Select name="academicYearId" defaultValue={assignment.academic_year_id}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
            <Select name="classId" defaultValue={assignment.class_id}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="sectionId" defaultValue={assignment.section_id || ''}><option value="">Aucune section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subjectId" defaultValue={assignment.subject_id}>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="staffId" defaultValue={assignment.created_by_staff_id || ''}><option value="">Responsable non renseigné</option>{teachers.map((item) => <option key={item.id} value={item.staff_id}>{relatedLabel(item.staff) || item.staff_id}</option>)}</Select>
            <Input name="assignmentCode" defaultValue={assignment.assignment_code} />
            <Input name="title" defaultValue={assignment.title} />
            <Textarea name="description" defaultValue={assignment.description || ''} />
            <Input name="dueOn" type="date" defaultValue={assignment.due_on || ''} />
            <Input name="maxScore" type="number" min="1" step="0.01" defaultValue={assignment.max_score ?? ''} />
            <Select name="status" defaultValue={assignment.status}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="closed">Clôturé</option>
              <option value="archived">Archivé</option>
            </Select>
            <button type="submit" style={primaryButtonStyle}>Enregistrer</button>
          </form>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Statut</div>
            <h2 style={panelTitleStyle}>Changer le statut</h2>
          </div>
        </div>
        <div style={statusRowStyle}>
          {['draft', 'published', 'closed', 'archived'].map((nextStatus) => (
            <form key={nextStatus} action={changeStatusAction}>
              <input type="hidden" name="id" value={assignment.id} />
              <input type="hidden" name="status" value={nextStatus} />
              <button type="submit" style={secondaryButtonStyle}>{labelForStatus(nextStatus)}</button>
            </form>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Soumissions</div>
            <h2 style={panelTitleStyle}>Travail remis</h2>
          </div>
          <div style={panelMetaStyle}>{detail.submissions.length} élève(s)</div>
        </div>
        {detail.submissions.length === 0 ? (
          <Angelcare360EmptyState title="Aucune remise" description="Les soumissions seront visibles dès que des élèves transmettront leur travail." />
        ) : (
          <div style={tableStyle}>
            {detail.submissions.map((submission) => (
              <article key={submission.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{submission.student_full_name || submission.student_code || submission.student_id}</div>
                  <div style={rowMetaStyle}>{submission.status} · {submission.submitted_at || 'Non remis'}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={submission.status} />
                  <span style={rowNoteStyle}>{submission.score ?? '—'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Angelcare360AcademicPageShell>
  )
}

function labelForStatus(value: string) {
  return value === 'draft' ? 'Brouillon' : value === 'published' ? 'Publier' : value === 'closed' ? 'Clôturer' : 'Archiver'
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

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 88 }} />
}

function Status({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft: ['Brouillon', '#f1f5f9'],
    published: ['Publié', '#dbeafe'],
    closed: ['Clôturé', '#fee2e2'],
    archived: ['Archivé', '#e2e8f0'],
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
  margin: '8px 0 0',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
}

const bodyTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 14,
  lineHeight: 1.7,
  fontWeight: 600,
}

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
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

const rowNoteStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
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

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}
