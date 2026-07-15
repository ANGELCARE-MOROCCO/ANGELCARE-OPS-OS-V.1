import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Assignments, createAngelcare360Assignment } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import { optionValue, numberValue, primaryLinkStyle, relatedLabel } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

async function createAssignmentAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/devoirs')
  const result = await createAngelcare360Assignment({
    schoolId: context.school.id,
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
  if (!result.ok) throw new Error(result.error || 'Création du devoir impossible.')
  revalidatePath('/angelcare-360-command-center/academique/devoirs')
  redirect('/angelcare-360-command-center/academique/devoirs')
}

export default async function Angelcare360DevoirsPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const academicYearId = String(searchParams?.academicYearId || context.academicYear?.id || '')
  const classId = optionValue(searchParams?.classId as FormDataEntryValue | null)
  const sectionId = optionValue(searchParams?.sectionId as FormDataEntryValue | null)
  const subjectId = optionValue(searchParams?.subjectId as FormDataEntryValue | null)
  const staffId = optionValue(searchParams?.staffId as FormDataEntryValue | null)
  const status = optionValue(searchParams?.status as FormDataEntryValue | null)
  const search = optionValue(searchParams?.q as FormDataEntryValue | null)

  const [assignments, years, classes, sections, subjects, teacherAssignments] = await Promise.all([
    listAngelcare360Assignments({ schoolId: context.school.id, academicYearId: academicYearId || null, classId, sectionId, subjectId, staffId, status, search }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Subjects(context.school.id),
    listAngelcare360TeacherAssignments(context.school.id, academicYearId || context.academicYear?.id || null),
  ])

  return (
    <Angelcare360AcademicPageShell
      title="Devoirs"
      subtitle="Planification, publication et suivi des remises avec statut serveur réel."
      badge="Académique"
      statusLabel={`${assignments.length} devoir(s)`}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="#nouveau-devoir" style={primaryLinkStyle}>Nouveau devoir</Link>}
      contextRow={
        <>
          <Badge label={`Année: ${years.find((year) => year.id === academicYearId)?.label || context.academicYear?.label || 'Non résolue'}`} />
          <Badge label={`Devoirs publiés: ${assignments.filter((item) => item.status === 'published').length}`} />
          <Badge label={`Remises en attente: ${assignments.reduce((total, item) => total + (item.pending_submission_count || 0), 0)}`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Filtres</div>
            <h2 style={panelTitleStyle}>Rechercher un devoir</h2>
          </div>
        </div>
        <form method="get" style={filterGridStyle}>
          <Input name="q" placeholder="Titre, code, statut" defaultValue={search || ''} />
          <Select name="academicYearId" defaultValue={academicYearId || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
          <Select name="classId" defaultValue={classId || ''}><option value="">Toutes les classes</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="sectionId" defaultValue={sectionId || ''}><option value="">Toutes les sections</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="subjectId" defaultValue={subjectId || ''}><option value="">Toutes les matières</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="staffId" defaultValue={staffId || ''}><option value="">Tous les enseignants</option>{teacherAssignments.map((item) => <option key={item.id} value={item.staff_id}>{relatedLabel(item.staff) || item.staff_id}</option>)}</Select>
          <Select name="status" defaultValue={status || ''}>
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="closed">Clôturé</option>
            <option value="archived">Archivé</option>
          </Select>
          <button type="submit" style={primaryButtonStyle}>Appliquer</button>
        </form>
      </section>

      <section id="nouveau-devoir" style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Création</div>
            <h2 style={panelTitleStyle}>Nouveau devoir</h2>
          </div>
          <div style={panelMetaStyle}>Publication verrouillée sans date d’échéance</div>
        </div>
        {years.length === 0 || classes.length === 0 || subjects.length === 0 ? (
          <Angelcare360EmptyState title="Données de référence manquantes" description="Créez au moins une année, une classe et une matière pour publier un devoir." />
        ) : (
          <form action={createAssignmentAction} style={formGridStyle}>
            <Select name="academicYearId" defaultValue={years[0]?.id || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
            <Select name="classId" defaultValue={classes[0]?.id || ''}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="sectionId" defaultValue=""><option value="">Aucune section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subjectId" defaultValue={subjects[0]?.id || ''}>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="staffId" defaultValue={teacherAssignments[0]?.staff_id || ''}>{teacherAssignments.map((item) => <option key={item.id} value={item.staff_id}>{relatedLabel(item.staff) || item.staff_id}</option>)}</Select>
            <Input name="assignmentCode" placeholder="Code devoir" />
            <Input name="title" placeholder="Titre du devoir" />
            <Textarea name="description" placeholder="Consigne pédagogique" />
            <Input name="dueOn" type="date" />
            <Input name="maxScore" type="number" min="1" step="0.01" placeholder="20" />
            <Select name="status" defaultValue="draft">
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="closed">Clôturé</option>
              <option value="archived">Archivé</option>
            </Select>
            <button type="submit" style={primaryButtonStyle}>Enregistrer le devoir</button>
          </form>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Devoirs</div>
            <h2 style={panelTitleStyle}>Travaux enregistrés</h2>
          </div>
          <div style={panelMetaStyle}>{assignments.length} enregistrement(s)</div>
        </div>
        {assignments.length === 0 ? (
          <Angelcare360EmptyState title="Aucun devoir" description="Aucun devoir ne correspond aux filtres courants." />
        ) : (
          <div style={tableStyle}>
            {assignments.map((assignment) => (
              <article key={assignment.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{assignment.title}</div>
                  <div style={rowMetaStyle}>{assignment.assignment_code} · {assignment.due_on || 'Sans échéance'} · Max {assignment.max_score ?? '—'}</div>
                  <div style={rowMetaStyle}>{assignment.class_name || assignment.class_id} · {assignment.subject_name || assignment.subject_id}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={assignment.status} />
                  <Link href={`/angelcare-360-command-center/academique/devoirs/${assignment.id}`} style={secondaryButtonStyle}>Détail</Link>
                </div>
              </article>
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
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
