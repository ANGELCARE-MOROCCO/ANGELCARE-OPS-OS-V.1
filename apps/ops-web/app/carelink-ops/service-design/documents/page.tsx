import { ServiceDocumentStudio } from '@/components/carelink/service-design/documents/ServiceDocumentStudio'
import type { ServiceDocumentSourceKind } from '@/components/carelink/service-design/documents/types'

const kinds = new Set<ServiceDocumentSourceKind>(['plan', 'sellable', 'handoff', 'executive', 'custom'])

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = searchParams ? await searchParams : {}
  const rawKind = Array.isArray(query.kind) ? query.kind[0] : query.kind
  const rawId = Array.isArray(query.id) ? query.id[0] : query.id
  const kind = kinds.has(rawKind as ServiceDocumentSourceKind) ? rawKind as ServiceDocumentSourceKind : 'custom'
  return <ServiceDocumentStudio sourceKind={kind} sourceId={rawId || undefined} initialTemplateId="complete-service-dossier" />
}
