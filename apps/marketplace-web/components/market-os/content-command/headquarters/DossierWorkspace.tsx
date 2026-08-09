import Bulk1DossierWorkspace from "../experience-bulk1/Bulk1DossierWorkspace"

export default function DossierWorkspace({ dossierId, compatibilityMode = false }: { dossierId: string; compatibilityMode?: boolean }) {
  return <Bulk1DossierWorkspace dossierId={dossierId} compatibilityMode={compatibilityMode} />
}
