import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { createAngelcare360TeacherComment, listAngelcare360TeacherComments } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Terms, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import { optionValue, numberValue, relatedLabel } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

async function createCommentAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/appreciations')
  const result = await createAngelcare360TeacherComment({
    schoolId: context.school.id,
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    studentId: String(formData.get('studentId') || ''),
    classId: String(formData.get('classId') || ''),
    sectionId: optionValue(formData.get('sectionId')),
    termId: optionValue(formData.get('termId')),
    staffId: String(formData.get('staffId') || ''),
    commentType: String(formData.get('commentType') || 'appreciation'),
    commentText: String(formData.get('commentText') || ''),
    rating: numberValue(formData.get('rating')),
    status: String(formData.get('status') || 'active') as 'active' | 'archived',
  })
  if (!result.ok) throw new Error(result.error || 'Création de l’appréciation impossible.')
  revalidatePath('/angelcare-360-command-center/academique/appreciations')
  redirect('/angelcare-360-command-center/academique/appreciations')
}

export default async function Angelcare360AppreciationsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const [comments, years, classes, sections, terms, teachers] = await Promise.all([
    listAngelcare360TeacherComments({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, context.academicYear?.id || null),
    listAngelcare360Terms(context.school.id, context.academicYear?.id || null),
    listAngelcare360TeacherAssignments(context.school.id, context.academicYear?.id || null),
  ])

  return (
    <Angelcare360AcademicPageShell
      title="Appréciations"
      subtitle="Commentaires enseignant, observations disciplinaires et synthèses liées à un élève."
      badge="Académique"
      statusLabel={`${comments.length} commentaire(s)`}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Création</div>
            <h2 style={panelTitleStyle}>Nouvelle appréciation</h2>
          </div>
        </div>
        {years.length === 0 || classes.length === 0 ? (
          <Angelcare360EmptyState title="Données de référence manquantes" description="Créez une année et une classe avant d’enregistrer une appréciation." />
        ) : (
          <form action={createCommentAction} style={formGridStyle}>
            <Select name="academicYearId" defaultValue={years[0]?.id || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
            <Input name="studentId" placeholder="ID élève" />
            <Select name="classId" defaultValue={classes[0]?.id || ''}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="sectionId" defaultValue=""><option value="">Aucune section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="termId" defaultValue=""><option value="">Aucune période</option>{terms.map((term) => <option key={term.id} value={term.id}>{term.label}</option>)}</Select>
            <Select name="staffId" defaultValue={teachers[0]?.staff_id || ''}>{teachers.map((item) => <option key={item.id} value={item.staff_id}>{relatedLabel(item.staff) || item.staff_id}</option>)}</Select>
            <Input name="commentType" defaultValue="appreciation" />
            <Textarea name="commentText" placeholder="Texte de l’appréciation" />
            <Input name="rating" type="number" min="0" max="5" step="1" placeholder="5" />
            <Select name="status" defaultValue="active">
              <option value="active">Actif</option>
              <option value="archived">Archivé</option>
            </Select>
            <button type="submit" style={primaryButtonStyle}>Enregistrer</button>
          </form>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Commentaires</div>
            <h2 style={panelTitleStyle}>Liste des appréciations</h2>
          </div>
          <div style={panelMetaStyle}>{comments.length} enregistrement(s)</div>
        </div>
        {comments.length === 0 ? (
          <Angelcare360EmptyState title="Aucune appréciation" description="Aucune appréciation n’a encore été enregistrée." />
        ) : (
          <div style={tableStyle}>
            {comments.map((comment) => (
              <article key={comment.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{comment.student_full_name || comment.student_code || comment.student_id}</div>
                  <div style={rowMetaStyle}>{comment.comment_type} · {comment.term_label || 'Sans période'}</div>
                  <div style={rowMetaStyle}>{comment.comment_text}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={comment.status} />
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

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 88 }} />
}

function Status({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active: ['Actif', '#dcfce7'],
    archived: ['Archivé', '#e2e8f0'],
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
