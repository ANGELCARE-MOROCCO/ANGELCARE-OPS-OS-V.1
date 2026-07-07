import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { changeAngelcare360ExamStatus, getAngelcare360ExamById, updateAngelcare360Exam } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import { optionValue, numberValue, relatedLabel, secondaryLinkStyle } from '../../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

async function updateExamAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/examens')
  const result = await updateAngelcare360Exam({
    schoolId: context.school.id,
    id: String(formData.get('id') || ''),
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    classId: String(formData.get('classId') || ''),
    sectionId: optionValue(formData.get('sectionId')),
    subjectId: String(formData.get('subjectId') || ''),
    staffId: optionValue(formData.get('staffId')),
    examCode: optionValue(formData.get('examCode')),
    title: String(formData.get('title') || ''),
    examType: String(formData.get('examType') || 'Composition'),
    scheduledOn: String(formData.get('scheduledOn') || ''),
    durationMinutes: numberValue(formData.get('durationMinutes')),
    maxScore: numberValue(formData.get('maxScore')),
    status: String(formData.get('status') || 'draft'),
  })
  if (!result.ok) throw new Error(result.error || 'Mise à jour de l’examen impossible.')
  revalidatePath('/angelcare-360-command-center/academique/examens')
  revalidatePath(`/angelcare-360-command-center/academique/examens/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/examens/${String(formData.get('id') || '')}`)
}

async function changeStatusAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/examens')
  const result = await changeAngelcare360ExamStatus({
    schoolId: context.school.id,
    id: String(formData.get('id') || ''),
    status: String(formData.get('status') || 'draft'),
  })
  if (!result.ok) throw new Error(result.error || 'Changement de statut impossible.')
  revalidatePath('/angelcare-360-command-center/academique/examens')
  revalidatePath(`/angelcare-360-command-center/academique/examens/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/examens/${String(formData.get('id') || '')}`)
}

export default async function Angelcare360ExamDetailPage({ params }: { params: { id: string } }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const detail = await getAngelcare360ExamById({ schoolId: context.school.id, id: params.id })
  if (!detail) notFound()

  const exam = detail.exam
  const [years, classes, sections, subjects, teachers] = await Promise.all([
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, exam.academic_year_id),
    listAngelcare360Sections(context.school.id, exam.academic_year_id),
    listAngelcare360Subjects(context.school.id),
    listAngelcare360TeacherAssignments(context.school.id, exam.academic_year_id),
  ])

  return (
    <Angelcare360AcademicPageShell
      title={`Examen ${exam.exam_code}`}
      subtitle="Détail de l’examen, sessions associées et mutation serveur contrôlée."
      badge="Examen"
      statusLabel={exam.status}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/academique/examens" style={secondaryLinkStyle}>Retour</Link>}
      contextRow={
        <>
          <Badge label={exam.class_name || exam.class_id} />
          <Badge label={exam.subject_name || exam.subject_id} />
          <Badge label={`${detail.sessionCount} session(s)`} />
          <Badge label={`${detail.markCount} note(s)`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Résumé</div>
            <h2 style={panelTitleStyle}>{exam.title}</h2>
            <p style={panelMetaStyle}>{exam.exam_type} · {exam.scheduled_on} · Max {exam.max_score ?? '—'}</p>
          </div>
        </div>
        <div style={summaryGridStyle}>
          <Summary label="Durée" value={exam.duration_minutes ? `${exam.duration_minutes} min` : 'Non renseignée'} />
          <Summary label="Sessions" value={String(detail.sessionCount)} />
          <Summary label="Notes" value={String(detail.markCount)} />
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Édition</div>
            <h2 style={panelTitleStyle}>Modifier l’examen</h2>
          </div>
        </div>
        {years.length === 0 || classes.length === 0 || subjects.length === 0 ? (
          <Angelcare360EmptyState title="Données de référence manquantes" description="Impossible d’éditer l’examen sans année, classe et matière actives." />
        ) : (
          <form action={updateExamAction} style={formGridStyle}>
            <input type="hidden" name="id" value={exam.id} />
            <Select name="academicYearId" defaultValue={exam.academic_year_id}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
            <Select name="classId" defaultValue={exam.class_id}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="sectionId" defaultValue={exam.section_id || ''}><option value="">Aucune section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subjectId" defaultValue={exam.subject_id}>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="staffId" defaultValue=""><option value="">Surveillant non renseigné</option>{teachers.map((item) => <option key={item.id} value={item.staff_id}>{relatedLabel(item.staff) || item.staff_id}</option>)}</Select>
            <Input name="examCode" defaultValue={exam.exam_code} />
            <Input name="title" defaultValue={exam.title} />
            <Input name="examType" defaultValue={exam.exam_type} />
            <Input name="scheduledOn" type="date" defaultValue={exam.scheduled_on} />
            <Input name="durationMinutes" type="number" min="1" step="1" defaultValue={exam.duration_minutes ?? ''} />
            <Input name="maxScore" type="number" min="1" step="0.01" defaultValue={exam.max_score ?? ''} />
            <Select name="status" defaultValue={exam.status}>
              <option value="draft">Brouillon</option>
              <option value="planned">Planifié</option>
              <option value="scheduled">Programmé</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="graded">Noté</option>
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
          {['draft', 'planned', 'scheduled', 'active', 'completed', 'graded', 'archived'].map((nextStatus) => (
            <form key={nextStatus} action={changeStatusAction}>
              <input type="hidden" name="id" value={exam.id} />
              <input type="hidden" name="status" value={nextStatus} />
              <button type="submit" style={secondaryButtonStyle}>{labelForStatus(nextStatus)}</button>
            </form>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Sessions</div>
            <h2 style={panelTitleStyle}>Session d’examen</h2>
          </div>
          <div style={panelMetaStyle}>Gestion détaillée sur la page dédiée</div>
        </div>
        <Link href="/angelcare-360-command-center/academique/sessions-examens" style={secondaryLinkStyle}>Ouvrir les sessions d’examens</Link>
      </section>
    </Angelcare360AcademicPageShell>
  )
}

function labelForStatus(value: string) {
  switch (value) {
    case 'draft':
      return 'Brouillon'
    case 'planned':
      return 'Planifier'
    case 'scheduled':
      return 'Programmé'
    case 'active':
      return 'Activer'
    case 'completed':
      return 'Terminer'
    case 'graded':
      return 'Marquer'
    default:
      return 'Archiver'
  }
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <article style={summaryCardStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
    </article>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={inputStyle} />
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

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const summaryCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  padding: 14,
  background: '#f8fafc',
}

const summaryLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const summaryValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 14,
  lineHeight: 1.65,
  fontWeight: 700,
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

const inputStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '11px 13px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
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
