import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { bulkUpdateAngelcare360Marks, listAngelcare360MarksEntrySheet, updateAngelcare360Mark } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects } from '@/lib/angelcare360/server/administration'
import { formGridStyle, optionValue, numberValue } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

async function saveMarkAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/notes')
  const result = await updateAngelcare360Mark({
    schoolId: context.school.id,
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    studentId: String(formData.get('studentId') || ''),
    subjectId: String(formData.get('subjectId') || ''),
    examId: optionValue(formData.get('examId')),
    assignmentId: optionValue(formData.get('assignmentId')),
    assessmentType: String(formData.get('assessmentType') || 'Contrôle'),
    score: numberValue(formData.get('score')),
    maxScore: Number(formData.get('maxScore') || 20),
    markState: String(formData.get('markState') || 'present') as 'present' | 'absent' | 'exempt' | 'pending',
    grade: optionValue(formData.get('grade')),
    recordedByStaffId: optionValue(formData.get('recordedByStaffId')),
  })
  if (!result.ok) throw new Error(result.error || 'Enregistrement de la note impossible.')
  revalidatePath('/angelcare-360-command-center/academique/notes')
  redirect('/angelcare-360-command-center/academique/notes')
}

async function bulkSaveAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/notes')
  const raw = String(formData.get('recordsJson') || '').trim()
  if (!raw) throw new Error('Le lot de notes est vide.')
  const records = JSON.parse(raw)
  const result = await bulkUpdateAngelcare360Marks({
    schoolId: context.school.id,
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    examId: optionValue(formData.get('examId')),
    assignmentId: optionValue(formData.get('assignmentId')),
    classId: optionValue(formData.get('classId')),
    sectionId: optionValue(formData.get('sectionId')),
    subjectId: String(formData.get('subjectId') || ''),
    assessmentType: String(formData.get('assessmentType') || 'Contrôle'),
    records,
  })
  if (!result.ok) {
    const errorMessage = typeof result === 'object' && result && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'Enregistrement du lot impossible.'
    throw new Error(errorMessage)
  }
  revalidatePath('/angelcare-360-command-center/academique/notes')
  redirect('/angelcare-360-command-center/academique/notes')
}

export default async function Angelcare360NotesPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const academicYearId = String(searchParams?.academicYearId || context.academicYear?.id || '')
  const classId = optionValue(searchParams?.classId as FormDataEntryValue | null)
  const sectionId = optionValue(searchParams?.sectionId as FormDataEntryValue | null)
  const subjectId = optionValue(searchParams?.subjectId as FormDataEntryValue | null)
  const examId = optionValue(searchParams?.examId as FormDataEntryValue | null)
  const assignmentId = optionValue(searchParams?.assignmentId as FormDataEntryValue | null)

  const [sheet, years, classes, sections, subjects] = await Promise.all([
    classId ? listAngelcare360MarksEntrySheet({ schoolId: context.school.id, academicYearId: academicYearId || null, classId, sectionId, subjectId, examId, assignmentId }) : Promise.resolve({ students: [], marks: [], context: null }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Subjects(context.school.id),
  ])

  return (
    <Angelcare360AcademicPageShell
      title="Notes"
      subtitle="Workspace de saisie des notes avec contrôle de plage, état explicite et mutation serveur."
      badge="Académique"
      statusLabel={classId ? `${sheet.students.length} élève(s)` : 'Sélection requise'}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      contextRow={
        <>
          <Badge label={`Année: ${years.find((year) => year.id === academicYearId)?.label || context.academicYear?.label || 'Non résolue'}`} />
          <Badge label={`Classe: ${classId || 'Aucune'}`} />
          <Badge label={`Matière: ${subjectId || 'Aucune'}`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Sélection</div>
            <h2 style={panelTitleStyle}>Ouvrir une feuille de notes</h2>
          </div>
        </div>
        <form method="get" style={filterGridStyle}>
          <Select name="academicYearId" defaultValue={academicYearId || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
          <Select name="classId" defaultValue={classId || ''}><option value="">Sélectionner une classe</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="sectionId" defaultValue={sectionId || ''}><option value="">Toutes les sections</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="subjectId" defaultValue={subjectId || ''}><option value="">Sélectionner une matière</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Input name="examId" placeholder="ID examen" defaultValue={examId || ''} />
          <Input name="assignmentId" placeholder="ID devoir" defaultValue={assignmentId || ''} />
          <button type="submit" style={primaryButtonStyle}>Ouvrir la feuille</button>
        </form>
      </section>

      {classId ? (
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelEyebrowStyle}>Saisie</div>
              <h2 style={panelTitleStyle}>Élèves et notes</h2>
            </div>
            <div style={panelMetaStyle}>{sheet.students.length} ligne(s)</div>
          </div>

          {sheet.students.length === 0 ? (
            <Angelcare360EmptyState title="Aucune ligne" description="Aucun élève n’est rattaché à la sélection courante." />
          ) : (
            <div style={tableStyle}>
              {sheet.students.map(({ enrollment, mark }) => (
                <form key={String(enrollment.student_id)} action={saveMarkAction} style={rowStyle}>
                  <input type="hidden" name="academicYearId" value={academicYearId} />
                  <input type="hidden" name="studentId" value={String(enrollment.student_id)} />
                  <input type="hidden" name="subjectId" value={subjectId || ''} />
                  <input type="hidden" name="examId" value={examId || ''} />
                  <input type="hidden" name="assignmentId" value={assignmentId || ''} />
                  <input type="hidden" name="recordedByStaffId" value="" />
                  <div style={rowMainStyle}>
                    <div style={rowTitleStyle}>{mark?.student_full_name || enrollment.student_id}</div>
                    <div style={rowMetaStyle}>{mark?.student_code || enrollment.student_id}</div>
                  </div>
                  <div style={rowActionsStyle}>
                    <Input name="assessmentType" defaultValue={mark?.assessment_type || 'Contrôle'} />
                    <Input name="score" type="number" min="0" step="0.01" defaultValue={mark?.score ?? ''} />
                    <Input name="maxScore" type="number" min="1" step="0.01" defaultValue={mark?.max_score ?? 20} />
                    <Select name="markState" defaultValue={mark?.mark_state || 'present'}>
                      <option value="present">Présent</option>
                      <option value="absent">Absent</option>
                      <option value="exempt">Dispensé</option>
                      <option value="pending">En attente</option>
                    </Select>
                    <Input name="grade" defaultValue={mark?.grade || ''} placeholder="Mention" />
                    <button type="submit" style={primaryButtonStyle}>Enregistrer</button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Lot</div>
            <h2 style={panelTitleStyle}>Mise à jour en masse</h2>
          </div>
          <div style={panelMetaStyle}>JSON validé côté serveur</div>
        </div>
        <form action={bulkSaveAction} style={formGridStyle}>
          <input type="hidden" name="academicYearId" value={academicYearId} />
          <input type="hidden" name="classId" value={classId || ''} />
          <input type="hidden" name="sectionId" value={sectionId || ''} />
          <input type="hidden" name="subjectId" value={subjectId || ''} />
          <input type="hidden" name="examId" value={examId || ''} />
          <input type="hidden" name="assignmentId" value={assignmentId || ''} />
          <Input name="assessmentType" defaultValue="Contrôle" />
          <Textarea name="recordsJson" placeholder='[{"studentId":"...","score":14,"maxScore":20,"markState":"present"}]' />
          <button type="submit" style={primaryButtonStyle}>Enregistrer le lot</button>
        </form>
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
  return <textarea {...props} style={{ ...inputStyle, minHeight: 110 }} />
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
  display: 'grid',
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

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '11px 14px',
  fontWeight: 800,
}
