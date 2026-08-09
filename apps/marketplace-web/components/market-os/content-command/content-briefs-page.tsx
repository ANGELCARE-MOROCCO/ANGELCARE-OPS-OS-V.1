"use client"

import { useSearchParams } from "next/navigation"
import LocalBriefPortfolio from "./content-briefs-page.dossier-recovery-base"
import DossierBriefRecoveryWorkspace from "./experience-bulk1/DossierBriefRecoveryWorkspace"

export default function ContentBriefsPage() {
  const searchParams = useSearchParams()
  const dossierId = searchParams.get("dossierId") || searchParams.get("dossier") || ""
  const returnTo = searchParams.get("returnTo") || undefined

  if (dossierId) {
    return (
      <DossierBriefRecoveryWorkspace
        dossierId={dossierId}
        returnTo={returnTo}
      />
    )
  }

  return <LocalBriefPortfolio />
}
