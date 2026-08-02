import { CommercialDocumentStudioWorkspace } from '@/components/carelink/service-design/commercial/workspaces/CommercialDocumentStudioWorkspace'

export default async function Page({ params }: { params: Promise<{ sellableId: string }> }) {
  const { sellableId } = await params
  return <CommercialDocumentStudioWorkspace sellableId={sellableId}/>
}
