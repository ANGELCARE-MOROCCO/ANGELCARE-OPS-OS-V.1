import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { blockAngelcare360AcademicExport, getAngelcare360ReportCardById, updateAngelcare360ReportCardStatus } from '@/lib/angelcare360/server/academics'
import { secondaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

async function updateReportCardStatusAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/bulletins')
  const result = await updateAngelcare360ReportCardStatus({
    schoolId: context.school.id,
    id: String(formData.get('id') || ''),
    status: String(formData.get('status') || 'draft'),
  })
  if (!result.ok) throw new Error(result.error || 'Changement de statut du bulletin impossible.')
  revalidatePath('/angelcare-360-command-center/academique/bulletins')
  revalidatePath(`/angelcare-360-command-center/academique/bulletins/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/bulletins/${String(formData.get('id') || '')}`)
}

async function blockExportAction(formData: FormData) {
  'use server'
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/academique/bulletins')
  const result = await blockAngelcare360AcademicExport({
    schoolId: context.school.id,
    reason: String(formData.get('reason') || 'Export PDF non disponible.'),
    entityType: 'report_card',
    entityId: String(formData.get('id') || ''),
  })
  if (!result.ok) throw new Error(result.error || 'Blocage export impossible.')
  revalidatePath(`/angelcare-360-command-center/academique/bulletins/${String(formData.get('id') || '')}`)
  redirect(`/angelcare-360-command-center/academique/bulletins/${String(formData.get('id') || '')}`)
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360BulletinDetailPage({ params }: PageProps) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  const { id } = await params
  const detail = await getAngelcare360ReportCardById({ schoolId: context.school.id, id })
  if (!detail) notFound()

  const reportCard = detail.reportCard

  return (
    <Angelcare360AcademicPageShell
      title={`Bulletin ${reportCard.report_card_code}`}
      subtitle="Détail du bulletin, lignes de matières, notes, appréciations et verrouillage export."
      badge="Bulletin"
      statusLabel={reportCard.status}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/academique/bulletins" style={secondaryLinkStyle}>Retour</Link>}
      contextRow={
        <>
          <Badge label={reportCard.student_full_name || reportCard.student_id} />
          <Badge label={reportCard.class_name || reportCard.class_id} />
          <Badge label={reportCard.term_label || reportCard.term_id || 'Sans période'} />
          <Badge label={`${detail.lines.length} ligne(s)`} />
        </>
      }
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Résumé</div>
            <h2 style={panelTitleStyle}>{reportCard.student_full_name || reportCard.student_id}</h2>
            <p style={panelMetaStyle}>Moyenne: {reportCard.overall_average ?? '—'} · Rang: {reportCard.rank_position ?? '—'}</p>
          </div>
        </div>
        <div style={summaryGridStyle}>
          <Summary label="Lignes" value={String(detail.lines.length)} />
          <Summary label="Appreciations" value={String(detail.commentCount)} />
          <Summary label="Calcul prêt" value={reportCard.ready_for_calculation ? 'Oui' : 'Non'} />
          <Summary label="Présences" value={reportCard.attendance_summary || 'Non résumé'} />
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Lignes</div>
            <h2 style={panelTitleStyle}>Synthèse par matière</h2>
          </div>
        </div>
        {detail.lines.length === 0 ? (
          <p style={bodyTextStyle}>Aucune ligne de bulletin n’est encore calculée pour ce dossier.</p>
        ) : (
          <div style={tableStyle}>
            {detail.lines.map((line) => (
              <article key={line.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{line.subject_name || line.subject_code || line.subject_id}</div>
                  <div style={rowMetaStyle}>Moyenne: {line.mark_average ?? '—'} · Coefficient: {line.coefficient}</div>
                  <div style={rowMetaStyle}>{line.teacher_comment_text || line.remarks || 'Aucune remarque'}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Status status={line.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Statut</div>
            <h2 style={panelTitleStyle}>Cycle du bulletin</h2>
          </div>
        </div>
        <div style={statusRowStyle}>
          {['draft', 'calculated', 'reviewed', 'approved', 'published', 'archived'].map((nextStatus) => (
            <form key={nextStatus} action={updateReportCardStatusAction}>
              <input type="hidden" name="id" value={reportCard.id} />
              <input type="hidden" name="status" value={nextStatus} />
              <button type="submit" style={secondaryButtonStyle}>{labelForStatus(nextStatus)}</button>
            </form>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Export</div>
            <h2 style={panelTitleStyle}>PDF verrouillé</h2>
          </div>
          <div style={panelMetaStyle}>Aucune infrastructure d’export PDF réelle n’est connectée</div>
        </div>
        <form action={blockExportAction} style={formGridStyle}>
          <input type="hidden" name="id" value={reportCard.id} />
          <Input name="reason" defaultValue="L’export PDF n’est pas encore disponible pour ce module." />
          <button type="submit" style={primaryButtonStyle}>Demander l’export</button>
        </form>
      </section>
    </Angelcare360AcademicPageShell>
  )
}

function labelForStatus(value: string) {
  switch (value) {
    case 'draft':
      return 'Brouillon'
    case 'calculated':
      return 'Calculé'
    case 'reviewed':
      return 'Vérifier'
    case 'approved':
      return 'Approuver'
    case 'published':
      return 'Publier'
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

function Status({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active: ['Actif', '#dcfce7'],
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

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
  margin: 0,
  color: '#0f172a',
  fontWeight: 700,
  lineHeight: 1.7,
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
