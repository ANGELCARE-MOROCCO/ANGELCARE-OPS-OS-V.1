import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360LessonById, updateAngelcare360Lesson } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import { optionValue, relatedLabel, secondaryLinkStyle } from '../../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

async function updateLessonAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/cours')
  const result = await updateAngelcare360Lesson({
    schoolId: context.school.id,
    id: String(formData.get('id') || ''),
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    classId: String(formData.get('classId') || ''),
    sectionId: optionValue(formData.get('sectionId')),
    subjectId: String(formData.get('subjectId') || ''),
    staffId: optionValue(formData.get('staffId')),
    lessonDate: String(formData.get('lessonDate') || ''),
    title: String(formData.get('title') || ''),
    objectives: optionValue(formData.get('objectives')),
    homeworkSummary: optionValue(formData.get('homeworkSummary')),
    status: String(formData.get('status') || 'planned'),
  })
  if (!result.ok) throw new Error(result.error || 'Mise à jour du cours impossible.')
  revalidatePath('/angelcare-360-command-center/academique/cours')
  revalidatePath(`/angelcare-360-command-center/academique/cours/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/cours/${String(formData.get('id') || '')}`)
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360LessonDetailPage({ params }: PageProps) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  const { id } = await params
  const detail = await getAngelcare360LessonById({ schoolId: context.school.id, id })
  if (!detail) notFound()

  const [years, classes, sections, subjects, assignments] = await Promise.all([
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, detail.academic_year_id),
    listAngelcare360Sections(context.school.id, detail.academic_year_id),
    listAngelcare360Subjects(context.school.id),
    listAngelcare360TeacherAssignments(context.school.id, detail.academic_year_id),
  ])

  const lesson = detail

  return (
    <Angelcare360AcademicPageShell
      title={`Cours ${lesson.lesson_code}`}
      subtitle="Détail du cours, contexte académique et mise à jour serveur validée."
      badge="Cours"
      statusLabel={lesson.status}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/academique/cours" style={secondaryLinkStyle}>Retour</Link>}
      contextRow={
        <>
          <Badge label={lesson.academic_year_label || lesson.academic_year_id} />
          <Badge label={lesson.class_name || lesson.class_id} />
          <Badge label={lesson.subject_name || lesson.subject_id} />
          <Badge label={lesson.staff_full_name || 'Aucun enseignant'} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Cours</div>
            <h2 style={panelTitleStyle}>{lesson.topic}</h2>
            <p style={panelMetaStyle}>{lesson.lesson_date}</p>
          </div>
        </div>

        <div style={summaryGridStyle}>
          <Summary label="Objectifs" value={lesson.objectives || 'Non renseignés'} />
          <Summary label="Travail à faire" value={lesson.homework_summary || 'Aucun'} />
          <Summary label="Historique" value={`Créé pour ${lesson.class_name || lesson.class_id}`} />
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Édition</div>
            <h2 style={panelTitleStyle}>Modifier le cours</h2>
          </div>
        </div>
        {years.length === 0 || classes.length === 0 || subjects.length === 0 ? (
          <Angelcare360EmptyState title="Données de référence manquantes" description="Impossible d’éditer le cours sans année, classe et matière actives." />
        ) : (
          <form action={updateLessonAction} style={formGridStyle}>
            <input type="hidden" name="id" value={lesson.id} />
            <Select name="academicYearId" defaultValue={lesson.academic_year_id}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
            <Select name="classId" defaultValue={lesson.class_id}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="sectionId" defaultValue={lesson.section_id || ''}><option value="">Aucune section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subjectId" defaultValue={lesson.subject_id}>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="staffId" defaultValue={lesson.staff_id || ''}>
              <option value="">Enseignant non renseigné</option>
              {assignments.map((assignment) => <option key={assignment.id} value={assignment.staff_id}>{relatedLabel(assignment.staff) || assignment.staff_id}</option>)}
            </Select>
            <Input name="lessonDate" type="date" defaultValue={lesson.lesson_date} />
            <Input name="title" defaultValue={lesson.topic} />
            <Textarea name="objectives" defaultValue={lesson.objectives || ''} />
            <Textarea name="homeworkSummary" defaultValue={lesson.homework_summary || ''} />
            <Select name="status" defaultValue={lesson.status}>
              <option value="draft">Brouillon</option>
              <option value="planned">Planifié</option>
              <option value="completed">Réalisé</option>
              <option value="archived">Archivé</option>
            </Select>
            <button type="submit" style={primaryButtonStyle}>Enregistrer</button>
          </form>
        )}
      </section>
    </Angelcare360AcademicPageShell>
  )
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

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={inputStyle} />
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 88 }} />
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
