'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, HardDrive, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react'
import styles from './media-storage-operations.module.css'

type Snapshot = Awaited<ReturnType<typeof import('../media-storage-api').marketplaceMediaStorageOperations>>
type Envelope = { data?: Snapshot; error?: { message?: string } }

function bytes(value: unknown): string {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return 'Non disponible'
  if (amount >= 1024 ** 3) return `${(amount / 1024 ** 3).toFixed(1)} Go`
  if (amount >= 1024 ** 2) return `${(amount / 1024 ** 2).toFixed(1)} Mo`
  return `${Math.round(amount / 1024)} Ko`
}

export function MediaStorageOperations({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function refresh() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/media/storage/health', { cache: 'no-store' })
      const payload = await response.json() as Envelope
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Contrôle indisponible.')
      setSnapshot(payload.data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Contrôle indisponible.') }
    finally { setBusy(false) }
  }
  const configured = snapshot.configured
  const ready = configured && snapshot.reachable && snapshot.healthy
  const freeBytes = snapshot.totalBytes == null || snapshot.usedBytes == null
    ? null
    : Math.max(0, Number(snapshot.totalBytes) - Number(snapshot.usedBytes))
  return <main className={styles.shell}>
    <section className={styles.hero}><div><span>PARAMÈTRES & GOUVERNANCE · STOCKAGE</span><h1>Marketplace Media Storage</h1><p>Autorité Windows auto-hébergée isolée pour les assets Marketplace, avec transfert direct signé, livraison temporairement signée et métadonnées canoniques.</p></div><aside data-ready={ready}>{ready?<CheckCircle2/>:<AlertTriangle/>}<strong>{ready?'OPÉRATIONNEL':configured?'INJOIGNABLE':'CONFIGURATION REQUISE'}</strong><small>Marketplace/assets · aucun secret affiché</small></aside></section>
    <section className={styles.metrics}><article><HardDrive/><span>Backend</span><strong>Windows self-hosted</strong></article><article><Database/><span>Assets</span><strong>{snapshot.assets.count} · {bytes(snapshot.assets.bytes)}</strong></article><article><UploadCloud/><span>Dernier upload</span><strong>{snapshot.assets.lastUpload?new Date(String(snapshot.assets.lastUpload.updated_at)).toLocaleString('fr-FR'):'Aucun'}</strong></article><article><ShieldCheck/><span>Réserve disque</span><strong>{freeBytes==null?'Non remontée':bytes(freeBytes)}</strong></article></section>
    <div className={styles.grid}><section className={styles.panel}><header><div><span>CONFIGURATION SAFE</span><h2>Autorités injectées</h2></div><button onClick={()=>void refresh()} disabled={busy}><RefreshCw/>{busy?'Contrôle…':'Tester la santé'}</button></header><div className={styles.checks}>{[
      ['URL publique du gateway',snapshot.gatewayUrlPresent],['Jeton administrateur',snapshot.adminTokenPresent],['Secret de signature',snapshot.signingSecretPresent],['Livraison publique signée',snapshot.publicServingPresent],['Gateway joignable',snapshot.reachable],['Gateway sain',snapshot.healthy],
    ].map(([label,ok])=><div key={String(label)} data-ready={ok}><span>{ok?<CheckCircle2/>:<AlertTriangle/>}{label}</span><strong>{ok?'PRÊT':'MANQUANT / BLOQUÉ'}</strong></div>)}</div>{error?<p className={styles.error}>{error}</p>:null}</section>
      <section className={styles.panel}><header><div><span>STORAGE POLICY</span><h2>Isolation et limites</h2></div></header><dl><div><dt>Racine logique</dt><dd>{snapshot.logicalRoot}</dd></div><div><dt>Taille maximale</dt><dd>{bytes(snapshot.maxUploadBytes)}</dd></div><div><dt>Types acceptés</dt><dd>{snapshot.acceptedMimeFamilies.join(', ')}</dd></div><div><dt>Utilisé</dt><dd>{snapshot.usedBytes==null?'Non remonté':bytes(snapshot.usedBytes)}</dd></div><div><dt>Total</dt><dd>{snapshot.totalBytes==null?'Non remonté':bytes(snapshot.totalBytes)}</dd></div><div><dt>Temporaires</dt><dd>{snapshot.temporaryFiles==null?'Non remonté':String(snapshot.temporaryFiles)}</dd></div></dl></section>
      <section className={styles.panel}><header><div><span>OPERATIONAL EVIDENCE</span><h2>État des métadonnées</h2></div></header><div className={styles.evidence}><article><strong>{snapshot.assets.processing}</strong><span>upload(s) en attente</span></article><article><strong>{snapshot.assets.failed}</strong><span>échec(s) persistés</span></article></div>{snapshot.assets.lastFailure?<p className={styles.warning}>Dernier échec: {String(snapshot.assets.lastFailure.file_name)} · {new Date(String(snapshot.assets.lastFailure.updated_at)).toLocaleString('fr-FR')}</p>:<p className={styles.success}>Aucun upload Windows en échec dans le registre courant.</p>}{Array.isArray(snapshot.warnings)&&snapshot.warnings.length?<ul>{snapshot.warnings.map(item=><li key={item}>{item}</li>)}</ul>:null}</section>
    </div>
  </main>
}
