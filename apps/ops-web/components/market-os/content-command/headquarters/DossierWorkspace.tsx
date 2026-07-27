"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, LoaderCircle } from "lucide-react"
import { useContentStore } from "../content-command-system"
import { useHeadquartersSnapshot } from "./client"
import {
  buildLegacyDossierViewModel,
  buildLiveDossierViewModel,
  findLiveDossier,
  record,
} from "./mz2-view-models"
import {
  DossierActionRail,
  DossierBrief,
  DossierCollaborationAudit,
  DossierConstitution,
  DossierCreativeEvidence,
  DossierDecisions,
  DossierExecution,
  DossierIdentityHeader,
  DossierLifecycleSpine,
  DossierLineageOwnership,
  DossierSectionNavigation,
  DossierSourcesDistribution,
} from "./dossier/DossierSections"
import styles from "./mz2-executive-dossier.module.css"

export default function DossierWorkspace({ dossierId, compatibilityMode = false }: { dossierId: string; compatibilityMode?: boolean }) {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const { store } = useContentStore()
  const [storeReady, setStoreReady] = React.useState(false)
  const [sampleBusy, setSampleBusy] = React.useState(false)
  React.useEffect(() => setStoreReady(true), [])

  const liveRecord = findLiveDossier(snapshot, dossierId)
  const legacyItem = store.items.find((item) => item.id === dossierId)
  const dossier = React.useMemo(() => {
    if (liveRecord) return buildLiveDossierViewModel(snapshot, liveRecord)
    if (legacyItem) return buildLegacyDossierViewModel({
      item: record(legacyItem),
      tasks: store.tasks.filter((task) => task.contentId === dossierId).map(record),
      assets: store.assets.filter((asset) => asset.linkedContentId === dossierId || legacyItem.assets.includes(asset.id)).map(record),
      briefs: store.briefs.map(record),
      logs: store.logs.filter((entry) => entry.entity === dossierId || entry.detail.toLowerCase().includes(legacyItem.title.toLowerCase())).map(record),
    })
    return null
  }, [dossierId, legacyItem, liveRecord, snapshot, store.assets, store.briefs, store.logs, store.tasks])

  async function generateSample() {
    if (!liveRecord || sampleBusy) return
    setSampleBusy(true)
    try {
      const response = await fetch("/api/market-os/content-command-headquarters/sample-generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dossierId, purpose: "Référence visuelle gouvernée selon le brief, la constitution et la doctrine ANGELCARE" }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.ok) throw new Error(body.error || "SAMPLE_FAILED")
      await refresh()
    } finally {
      setSampleBusy(false)
    }
  }

  if ((loading || !storeReady) && !dossier) return <main className={styles.dossierCanvas}><div className={styles.routeLoading}><LoaderCircle/><strong>Ouverture du dossier institutionnel…</strong><span>Constitution, responsabilités, preuves, décisions, sources et diffusion sont consolidées.</span></div></main>

  if (!dossier) return <main className={styles.dossierCanvas}><section className={styles.routeFailure}><AlertTriangle/><div><span>DOSSIER INTROUVABLE</span><h1>Aucun dossier visible pour cet identifiant.</h1><p>{error ? "La source Headquarters est indisponible et aucun enregistrement historique correspondant n’existe dans le registre local." : "Le record demandé n’existe pas ou n’est pas accessible avec la session actuelle."}</p><div><Link href="/market-os/content-command-center/directory">Retour au Content Atlas <ArrowRight/></Link><button type="button" onClick={refresh}>Réessayer</button></div></div></section></main>

  const generatedSamples = dossier.assets.filter((asset) => asset.owner === "AI Director").length
  return <main className={styles.dossierCanvas} data-mz2-dossier data-dossier-source={dossier.sourceType}>
    {error && dossier.sourceType === "legacy" ? <div className={styles.compatibilityNotice}><AlertTriangle/><span><strong>Mode de compatibilité historique</strong>La source Headquarters n’est pas disponible. Le dossier utilise exclusivement les informations réellement présentes dans le registre historique local.</span></div> : null}
    {compatibilityMode && dossier.sourceType === "headquarters" ? <div className={styles.compatibilityNotice}><AlertTriangle/><span><strong>URL historique préservée</strong>Ce lien ancien ouvre désormais l’expérience Dossier 360 canonique sans modifier l’adresse enregistrée.</span></div> : null}
    <DossierIdentityHeader dossier={dossier}/>
    <DossierSectionNavigation/>
    <div className={styles.dossierOperatingLayout}>
      <DossierLifecycleSpine dossier={dossier}/>
      <div className={styles.dossierMainFlow}>
        <DossierConstitution dossier={dossier}/>
        <DossierLineageOwnership dossier={dossier}/>
        <DossierBrief dossier={dossier}/>
        <DossierExecution dossier={dossier}/>
        <DossierCreativeEvidence dossier={dossier} canGenerateSample={generatedSamples < 2} sampleBusy={sampleBusy} onGenerateSample={() => void generateSample()}/>
        <DossierDecisions dossier={dossier}/>
        <DossierSourcesDistribution dossier={dossier}/>
        <DossierCollaborationAudit dossier={dossier}/>
      </div>
      <DossierActionRail dossier={dossier}/>
    </div>
  </main>
}
