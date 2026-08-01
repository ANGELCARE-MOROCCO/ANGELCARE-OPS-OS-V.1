"use client"

import * as React from "react"
import { ArrowRight, Database, ShieldCheck, Sparkles, Trash2 } from "lucide-react"
import {
  clearLegacyBusinessStore,
  readLegacyStoreForMigration,
} from "../content-command-system"
import { headquartersAction } from "./client"
import { Empty, SectionHeader } from "./primitives"
import styles from "./content-command-headquarters.module.css"

export default function LegacyPromotionPanel({ onPromoted }: { onPromoted: () => void }) {
  const [inventory, setInventory] = React.useState({ items: 0, tasks: 0, assets: 0, briefs: 0 })
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [promotionComplete, setPromotionComplete] = React.useState(false)

  const refreshInventory = React.useCallback(() => {
    const legacy = readLegacyStoreForMigration()
    setInventory({
      items: legacy.items.length,
      tasks: legacy.tasks.length,
      assets: legacy.assets.length,
      briefs: legacy.briefs.length,
    })
  }, [])

  React.useEffect(() => { refreshInventory() }, [refreshInventory])

  async function promote() {
    setBusy(true)
    setMessage("")
    setPromotionComplete(false)
    try {
      const legacy = readLegacyStoreForMigration()
      const records = legacy.items.map((item) => ({
        ...item,
        tasks: legacy.tasks.filter((task) => task.contentId === item.id),
        assets: legacy.assets.filter((asset) => asset.linkedContentId === item.id),
        briefs: legacy.briefs.filter((brief) => brief.title === item.title || brief.campaign === item.campaign),
      }))
      const result = await headquartersAction("promote_legacy_content", { records }) as { created?: unknown[]; skipped?: unknown[] }
      setMessage(`${result.created?.length || 0} dossier(s) promu(s), ${result.skipped?.length || 0} déjà présent(s). Vérifiez les dossiers puis effacez les copies navigateur.`)
      setPromotionComplete(true)
      onPromoted()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PROMOTION_FAILED")
    } finally {
      setBusy(false)
    }
  }

  function clearMigratedCopies() {
    if (!promotionComplete) {
      setMessage("La suppression locale est disponible uniquement après une promotion confirmée pendant cette session.")
      return
    }
    clearLegacyBusinessStore()
    refreshInventory()
    setPromotionComplete(false)
    setMessage("Copies navigateur supprimées. Le backend canonique reste l’unique source opérationnelle.")
  }

  return (
    <section className={styles.legacyPromotion}>
      <SectionHeader
        eyebrow="MIGRATION CONTRÔLÉE"
        title="Promouvoir les anciens records navigateur"
        description="Ces données sont lues uniquement pour migration. Aucune nouvelle donnée métier n’est enregistrée dans localStorage."
      />
      <div className={styles.legacyInventory}>
        <span><Database /><strong>{inventory.items}</strong><small>Contenus locaux</small></span>
        <span><ShieldCheck /><strong>{inventory.tasks}</strong><small>Tâches liées</small></span>
        <span><Sparkles /><strong>{inventory.assets}</strong><small>Assets locaux</small></span>
        <span><ArrowRight /><strong>{inventory.briefs}</strong><small>Briefs locaux</small></span>
      </div>
      {inventory.items ? (
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} onClick={() => void promote()}><ShieldCheck /> Promouvoir avec provenance</button>
          <button disabled={!promotionComplete || busy} onClick={clearMigratedCopies}><Trash2 /> Effacer les copies migrées</button>
        </div>
      ) : (
        <Empty title="Aucun record navigateur à migrer" detail="Le Content Command Center travaille maintenant exclusivement sur le backend canonique." />
      )}
      {message ? <p>{message}</p> : null}
    </section>
  )
}
