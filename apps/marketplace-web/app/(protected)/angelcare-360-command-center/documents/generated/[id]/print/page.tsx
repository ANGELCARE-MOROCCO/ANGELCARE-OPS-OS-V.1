import { notFound } from 'next/navigation'
import Angelcare360A4DocumentFrame from '@/components/angelcare360/documents/Angelcare360A4DocumentFrame'
import Angelcare360A4KpiBlock from '@/components/angelcare360/documents/Angelcare360A4KpiBlock'
import Angelcare360A4SignatureBlock from '@/components/angelcare360/documents/Angelcare360A4SignatureBlock'
import Angelcare360A4StatusStamp from '@/components/angelcare360/documents/Angelcare360A4StatusStamp'
import Angelcare360A4Table from '@/components/angelcare360/documents/Angelcare360A4Table'
import Angelcare360PrintToolbar from '@/components/angelcare360/documents/Angelcare360PrintToolbar'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { buildCustomerGeneratedDocumentA4Model } from '@/lib/angelcare360/documents/builders'
import { getAngelcare360DocumentsContext } from '../../../_utils'
import { getAngelcare360GeneratedDocumentById } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360GeneratedDocumentPrintPage({ params }: PageProps) {
  const context = await getAngelcare360DocumentsContext()
  if (!context) notFound()
  const { id } = await params
  const document = await getAngelcare360GeneratedDocumentById({ schoolId: context.school.id, id })
  if (!document) {
    return (
      <Angelcare360EmptyState
        title="Document généré introuvable"
        description="Le document demandé ne peut pas être imprimé car il est absent du registre documentaire."
        actionLabel="Retour aux documents"
        actionHref="/angelcare-360-command-center/documents/generated"
      />
    )
  }

  const model = buildCustomerGeneratedDocumentA4Model(document)
  const documentMetadata = document.metadata_json as Record<string, unknown> | undefined

  return (
    <main style={pageStyle}>
      <Angelcare360PrintToolbar backHref="/angelcare-360-command-center/documents/generated" printLabel="Imprimer le document" />
      <Angelcare360A4DocumentFrame model={model}>
        <div style={stackStyle}>
          <section style={kpiGridStyle}>
            <Angelcare360A4KpiBlock label="Statut" value={String(document.status || '—')} tone="primary" />
            <Angelcare360A4KpiBlock label="Visibilité" value={String(document.visibility || '—')} tone="neutral" />
            <Angelcare360A4KpiBlock label="Stockage" value={String(document.storage_provider || 'supabase')} tone="success" />
            <Angelcare360A4StatusStamp label={String(documentMetadata?.document_state || 'active')} tone="neutral" />
          </section>

          <Angelcare360A4Table
            headers={['Champ', 'Valeur']}
            rows={[
              ['Code document', String(document.document_code || document.id)],
              ['Titre', String(document.title || '—')],
              ['Nom de fichier', String(document.file_name || '—')],
              ['Chemin', String(document.file_path || '—')],
              ['Catégorie', String(document.category || '—')],
              ['Poids', document.file_size_bytes ? `${Number(document.file_size_bytes).toLocaleString('fr-FR')} octets` : 'Inconnu'],
            ]}
          />

          <div style={summaryStyle}>
            <div>
              <div style={sectionLabelStyle}>Résumé documentaire</div>
              <p style={summaryTextStyle}>
                Ce document correspond à un fichier réellement persistant et peut être ouvert en impression A4 navigateur.
              </p>
            </div>
            <Angelcare360A4SignatureBlock label="Validation document" name="AngelCare 360" title="Command Center" />
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
