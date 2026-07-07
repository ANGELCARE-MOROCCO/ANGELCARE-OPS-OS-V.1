import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { createAngelcare360ReportCardDraft, listAngelcare360ReportCards } from '@/lib/angelcare360/server/academics'
import { listAngelcare360AcademicYears, listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Terms } from '@/lib/angelcare360/server/administration'
import { formGridStyle, optionValue, primaryLinkStyle } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

async function createReportCardAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/bulletins')
  const result = await createAngelcare360ReportCardDraft({
    schoolId: context.school.id,
    academicYearId: String(formData.get('academicYearId') || context.academicYear?.id || ''),
    studentId: String(formData.get('studentId') || ''),
    classId: String(formData.get('classId') || ''),
    sectionId: optionValue(formData.get('sectionId')),
    termId: String(formData.get('termId') || ''),
    reportCardCode: optionValue(formData.get('reportCardCode')),
    generatedOn: optionValue(formData.get('generatedOn')),
  })
  if (!result.ok) throw new Error(result.error || 'Création du bulletin impossible.')
  revalidatePath('/angelcare-360-command-center/academique/bulletins')
  redirect('/angelcare-360-command-center/academique/bulletins')
}

export default async function Angelcare360BulletinsPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const academicYearId = String(searchParams?.academicYearId || context.academicYear?.id || '')
  const termId = optionValue(searchParams?.termId as FormDataEntryValue | null)
  const classId = optionValue(searchParams?.classId as FormDataEntryValue | null)
  const sectionId = optionValue(searchParams?.sectionId as FormDataEntryValue | null)
  const studentId = optionValue(searchParams?.studentId as FormDataEntryValue | null)
  const status = optionValue(searchParams?.status as FormDataEntryValue | null)

  const [reportCards, years, classes, sections, terms] = await Promise.all([
    listAngelcare360ReportCards({ schoolId: context.school.id, academicYearId: academicYearId || null, termId, classId, sectionId, studentId, status }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, academicYearId || context.academicYear?.id || null),
    listAngelcare360Terms(context.school.id, academicYearId || context.academicYear?.id || null),
  ])

  return (
    <Angelcare360AcademicPageShell
      title="Bulletins"
      subtitle="Brouillons, lignes, appréciations et statuts de validation des bulletins."
      badge="Académique"
      statusLabel={`${reportCards.length} bulletin(s)`}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="#nouveau-bulletin" style={primaryLinkStyle}>Nouveau bulletin</Link>}
      contextRow={
        <>
          <Badge label={`Année: ${years.find((year) => year.id === academicYearId)?.label || context.academicYear?.label || 'Non résolue'}`} />
          <Badge label={`Brouillons: ${reportCards.filter((item) => item.status === 'draft').length}`} />
          <Badge label={`Publiés: ${reportCards.filter((item) => item.status === 'published').length}`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Filtres</div>
            <h2 style={panelTitleStyle}>Filtrer les bulletins</h2>
          </div>
        </div>
        <form method="get" style={filterGridStyle}>
          <Select name="academicYearId" defaultValue={academicYearId || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
          <Select name="termId" defaultValue={termId || ''}><option value="">Toutes les périodes</option>{terms.map((term) => <option key={term.id} value={term.id}>{term.label}</option>)}</Select>
          <Select name="classId" defaultValue={classId || ''}><option value="">Toutes les classes</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select name="sectionId" defaultValue={sectionId || ''}><option value="">Toutes les sections</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Input name="studentId" defaultValue={studentId || ''} placeholder="ID élève" />
          <Select name="status" defaultValue={status || ''}>
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="calculated">Calculé</option>
            <option value="reviewed">Vérifié</option>
            <option value="approved">Approuvé</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </Select>
          <button type="submit" style={primaryButtonStyle}>Appliquer</button>
        </form>
      </section>

      <section id="nouveau-bulletin" style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Création</div>
            <h2 style={panelTitleStyle}>Nouveau bulletin brouillon</h2>
          </div>
          <div style={panelMetaStyle}>Nécessite élève, classe et période</div>
        </div>
        {years.length === 0 || classes.length === 0 || terms.length === 0 ? (
          <Angelcare360EmptyState title="Données de référence manquantes" description="Créez une année, une classe et une période avant d’ouvrir un bulletin." />
        ) : (
          <form action={createReportCardAction} style={formGridStyle}>
            <Select name="academicYearId" defaultValue={years[0]?.id || ''}>{years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}</Select>
            <Input name="studentId" placeholder="ID élève" />
            <Select name="classId" defaultValue={classes[0]?.id || ''}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="sectionId" defaultValue=""><option value="">Aucune section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="termId" defaultValue={terms[0]?.id || ''}>{terms.map((term) => <option key={term.id} value={term.id}>{term.label}</option>)}</Select>
            <Input name="reportCardCode" placeholder="Code bulletin" />
            <Input name="generatedOn" type="date" />
            <button type="submit" style={primaryButtonStyle}>Créer le brouillon</button>
          </form>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Bulletins</div>
            <h2 style={panelTitleStyle}>Liste des bulletins</h2>
          </div>
          <div style={panelMetaStyle}>{reportCards.length} enregistrement(s)</div>
        </div>
        {reportCards.length === 0 ? (
          <Angelcare360EmptyState title="Aucun bulletin" description="Aucun bulletin ne correspond aux filtres courants." />
        ) : (
          <div style={tableStyle}>
            {reportCards.map((card) => (
              <article key={card.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{card.student_full_name || card.student_code || card.student_id}</div>
                  <div style={rowMetaStyle}>{card.report_card_code} · {card.term_label || card.term_id || 'Sans période'}</div>
                  <div style={rowMetaStyle}>Moyenne: {card.overall_average ?? '—'} · Lignes: {card.line_count || 0}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={card.status} />
                  <Link href={`/angelcare-360-command-center/academique/bulletins/${card.id}`} style={secondaryButtonStyle}>Détail</Link>
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

function Status({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft: ['Brouillon', '#f1f5f9'],
    calculated: ['Calculé', '#dbeafe'],
    reviewed: ['Vérifié', '#e0e7ff'],
    approved: ['Approuvé', '#dcfce7'],
    published: ['Publié', '#fee2e2'],
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
