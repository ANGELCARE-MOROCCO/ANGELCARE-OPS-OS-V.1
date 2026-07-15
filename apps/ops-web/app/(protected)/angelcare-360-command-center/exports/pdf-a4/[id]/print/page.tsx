import { notFound } from 'next/navigation'
import Angelcare360A4DocumentFrame from '@/components/angelcare360/documents/Angelcare360A4DocumentFrame'
import Angelcare360A4KpiBlock from '@/components/angelcare360/documents/Angelcare360A4KpiBlock'
import Angelcare360A4SignatureBlock from '@/components/angelcare360/documents/Angelcare360A4SignatureBlock'
import Angelcare360A4StatusStamp from '@/components/angelcare360/documents/Angelcare360A4StatusStamp'
import Angelcare360A4Table from '@/components/angelcare360/documents/Angelcare360A4Table'
import Angelcare360PrintToolbar from '@/components/angelcare360/documents/Angelcare360PrintToolbar'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { buildCustomerExportFileA4Model } from '@/lib/angelcare360/documents/builders'
import { getAngelcare360ExportsContext } from '../../../_utils'
import { getAngelcare360ExportFileById } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360ExportPdfA4PrintPage({ params }: PageProps) {
  const context = await getAngelcare360ExportsContext()
  if (!context) notFound()
  const { id } = await params
  const file = await getAngelcare360ExportFileById({ schoolId: context.school.id, id })
  if (!file) {
    return (
      <Angelcare360EmptyState
        title="Fichier d’export introuvable"
        description="Le fichier demandé ne peut pas être imprimé car il n’existe pas dans le registre des exports."
        actionLabel="Retour aux exports"
        actionHref="/angelcare-360-command-center/exports/files"
      />
    )
  }

  const model = buildCustomerExportFileA4Model(file)
  const fileMetadata = file.metadata_json as Record<string, unknown> | undefined

  return (
    <main style={pageStyle}>
      <Angelcare360PrintToolbar backHref="/angelcare-360-command-center/exports/files" printLabel="Imprimer le fichier" />
      <Angelcare360A4DocumentFrame model={model}>
        <div style={stackStyle}>
          <section style={kpiGridStyle}>
            <Angelcare360A4KpiBlock label="Format" value={String(file.export_format || '—')} tone="primary" />
            <Angelcare360A4KpiBlock label="Statut" value={String(file.status || '—')} tone="warning" />
            <Angelcare360A4KpiBlock label="Stockage" value={String(file.storage_provider || 'supabase')} tone="success" />
            <Angelcare360A4StatusStamp label={String(fileMetadata?.document_state || 'active')} tone="neutral" />
          </section>

          <Angelcare360A4Table
            headers={['Champ', 'Valeur']}
            rows={[
              ['Code export', String(file.export_code || file.id)],
              ['Nom du fichier', String(file.file_name || '—')],
              ['Chemin', String(file.file_path || '—')],
              ['Rapport', String(file.report_label || file.report_code || '—')],
              ['MIME', String(file.mime_type || '—')],
              ['Poids', file.file_size_bytes ? `${Number(file.file_size_bytes).toLocaleString('fr-FR')} octets` : 'Inconnu'],
            ]}
          />

          <div style={summaryStyle}>
            <div>
              <div style={sectionLabelStyle}>Résumé export</div>
              <p style={summaryTextStyle}>
                Ce fichier d’export reflète une sortie réelle persistée dans le registre documentaire et peut être imprimé en A4 navigateur.
              </p>
            </div>
            <Angelcare360A4SignatureBlock label="Validation export" name="AngelCare 360" title="Command Center" />
          </div>
        </div>
      </Angelcare360A4DocumentFrame>
    </main>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 16 }
const stackStyle: React.CSSProperties = { display: 'grid', gap: 14 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }
const summaryStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: '1.2fr .8fr', alignItems: 'start' }
const sectionLabelStyle: React.CSSProperties = { color: '#0f172a', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }
const summaryTextStyle: React.CSSProperties = { margin: '8px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
