import { ServiceDocumentStudio } from '@/components/carelink/service-design/documents/ServiceDocumentStudio'

export function CommercialDocumentStudioWorkspace({ sellableId }: { sellableId?: string }) {
  return <ServiceDocumentStudio sourceKind="sellable" sourceId={sellableId} initialTemplateId="b2c-service-presentation" />
}
