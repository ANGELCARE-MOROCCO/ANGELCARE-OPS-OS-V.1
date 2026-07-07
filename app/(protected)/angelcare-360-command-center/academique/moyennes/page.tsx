import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { calculateAngelcare360Averages, getAngelcare360AverageReadiness } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360Terms } from '@/lib/angelcare360/server/administration'
import { formGridStyle, optionValue } from '../_utils'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

async function checkReadinessAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/moyennes')
  const result = await getAngelcare360AverageReadiness({
    schoolId: context.school.id,
    academicYearId: optionValue(formData.get('academicYearId')),
    termId: optionValue(formData.get('termId')),
    classId: optionValue(formData.get('classId')),
    sectionId: optionValue(formData.get('sectionId')),
    studentId: optionValue(formData.get('studentId')),
    subjectId: optionValue(formData.get('subjectId')),
  })
  if (!result.ok) throw new Error(result.error || 'Le contrôle de readiness a échoué.')
  revalidatePath('/angelcare-360-command-center/academique/moyennes')
  redirect('/angelcare-360-command-center/academique/moyennes')
}

async function calculateAveragesAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/moyennes')
  const result = await calculateAngelcare360Averages({
    schoolId: context.school.id,
    academicYearId: optionValue(formData.get('academicYearId')),
    termId: optionValue(formData.get('termId')),
    classId: optionValue(formData.get('classId')),
    sectionId: optionValue(formData.get('sectionId')),
    studentId: optionValue(formData.get('studentId')),
    subjectId: optionValue(formData.get('subjectId')),
  })
  if (!result.ok) throw new Error(result.error || 'Le calcul des moyennes est verrouillé.')
  revalidatePath('/angelcare-360-command-center/academique/moyennes')
  redirect('/angelcare-360-command-center/academique/moyennes')
}

export default async function Angelcare360MoyennesPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const academicYearId = String(searchParams?.academicYearId || context.academicYear?.id || '')
  const termId = optionValue(searchParams?.termId as FormDataEntryValue | null)
  const classId = optionValue(searchParams?.classId as FormDataEntryValue | null)
  const sectionId = optionValue(searchParams?.sectionId as FormDataEntryValue | null)
  const studentId = optionValue(searchParams?.studentId as FormDataEntryValue | null)
  const subjectId = optionValue(searchParams?.subjectId as FormDataEntryValue | null)

  const [readiness, years, classes, sections, terms, subjects] = await Promise.all([
    getAngelcare360AverageReadiness({
      schoolId: context.school.id,
      academicYearId: academicYearId || null,
      termId,
      classId,
      sectionId,
      studentId,
      subjectId,
    }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Terms(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Subjects(context.school.id),
  ])

  const record = readiness.ok ? readiness.record : null

  return (
    <Angelcare360AcademicPageShell
      title="Moyennes"
      subtitle="Préparation des calculs, contrôle de la formule et verrouillage si la formule pédagogique n’est pas validée."
      badge="Académique"
      statusLabel={record?.canCalculate ? 'Calcul prêt' : 'Verrouillé'}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Contrôle</div>
            <h2 style={panelTitleStyle}>Préparer le calcul</h2>
          </div>
        </div>
        <form method="get" style={filterGridStyle}>
          <Select name="academicYearId" defaultValue={academicYearId || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
          <Select name="termId" defaultValue={termId || ''}><option value="">Sélectionner une période</option>{terms.map((term) => <option key={term.id} value={term.id}>{term.label}</option>)}</Select>
          <Select name="classId" defaultValue={classId || ''}><option value="">Sélectionner une classe</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="sectionId" defaultValue={sectionId || ''}><option value="">Toutes les sections</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Input name="studentId" defaultValue={studentId || ''} placeholder="ID élève" />
          <Select name="subjectId" defaultValue={subjectId || ''}><option value="">Toutes les matières</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <button type="submit" style={primaryButtonStyle}>Vérifier</button>
        </form>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>État</div>
            <h2 style={panelTitleStyle}>Readiness des moyennes</h2>
          </div>
          <div style={panelMetaStyle}>{record?.reason || 'Contrôle non lancé'}</div>
        </div>

        {record ? (
          <div style={gridStyle}>
            <Summary label="Notes" value={String(record.marksCount)} />
            <Summary label="Coefficients" value={record.coefficientsReady ? 'Oui' : 'Non'} />
            <Summary label="Formule" value={record.formulaReady ? 'Oui' : 'Non'} />
            <Summary label="Période" value={record.termSelected ? 'Oui' : 'Non'} />
            <Summary label="Élève" value={record.studentSelected ? 'Oui' : 'Non'} />
            <Summary label="Classe" value={record.classSelected ? 'Oui' : 'Non'} />
          </div>
        ) : null}

        <p style={bodyTextStyle}>Le calcul automatique des moyennes sera activé après validation de la formule pédagogique de l’établissement.</p>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Calcul</div>
            <h2 style={panelTitleStyle}>Tentative de calcul</h2>
          </div>
        </div>
        <form action={calculateAveragesAction} style={formGridStyle}>
          <input type="hidden" name="academicYearId" value={academicYearId} />
          <input type="hidden" name="termId" value={termId || ''} />
          <input type="hidden" name="classId" value={classId || ''} />
          <input type="hidden" name="sectionId" value={sectionId || ''} />
          <input type="hidden" name="studentId" value={studentId || ''} />
          <input type="hidden" name="subjectId" value={subjectId || ''} />
          <button type="submit" style={primaryButtonStyle}>Lancer le calcul</button>
        </form>
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <article style={summaryCardStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
    </article>
  )
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
  fontSize: 16,
  fontWeight: 800,
}

const bodyTextStyle: React.CSSProperties = {
  margin: '14px 0 0',
  color: '#0f172a',
  fontWeight: 700,
  lineHeight: 1.7,
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
