import { ServiceDocumentStudio } from '@/components/carelink/service-design/documents/ServiceDocumentStudio'

export function A4DocumentStudioWorkspace({ planId }: { planId?: string }) {
  return <ServiceDocumentStudio sourceKind="plan" sourceId={planId} initialTemplateId="mission-technical-passport" />
}
