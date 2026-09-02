'use client'

import { useState } from 'react'
import { Download, FileCheck2, UploadCloud } from 'lucide-react'
import { CSV_FILE_ACCEPT, MarketplaceFilePicker } from '../../components/MarketplaceFilePicker'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import styles from '../customer-commerce.module.css'

type ImportRow = { row: number; status: string; error?: string }
type ImportResult = { mode: 'validate' | 'upsert'; total: number; valid: number; invalid: number; rows: ImportRow[] }
type Envelope<T> = { data?: T; error?: { message?: string } }
const template = 'policy_key,customer_email,starts_at,ends_at,status\nwallet_member,client@example.com,,,active\n'

async function submit(csvText: string, mode: 'validate' | 'upsert', reason?: string) {
  const response = await fetch('/api/angelcare-marketplace/admin/wallet/imports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ csvText, mode, reason }) })
  const payload = await response.json().catch(() => ({})) as Envelope<ImportResult>
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Import Wallet impossible.')
  return payload.data
}

export function WalletPolicyImportStudio() {
  const requestAction = useGovernedAction()
  const [csvText, setCsvText] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(mode: 'validate' | 'upsert') {
    if (!csvText.trim()) return
    let reason = ''
    if (mode === 'upsert') {
      const confirmed = await requestAction({ title: 'Exécuter l’import des affectations Wallet', objectLabel: `${result?.valid || 'lignes validées'} · affectations de politiques`, currentState: 'dry-run validé', nextState: 'assignments upserted', consequence: 'Les politiques Wallet sont affectées aux comptes clients reconnus; les lignes invalides restent rejetées.', permission: 'marketplace.finance.price_books.manage', danger: true })
      if (!confirmed) return
      reason = confirmed
    }
    setBusy(true); setError(null)
    try { setResult(await submit(csvText, mode, reason || undefined)) }
    catch (value) { setError(value instanceof Error ? value.message : 'Import impossible.') }
    finally { setBusy(false) }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ac-wallet-policy-assignments.csv'; anchor.click(); URL.revokeObjectURL(url)
  }

  async function chooseCsv(files: File[]) {
    setSelectedFiles(files); setResult(null); setError(null)
    const file = files[0]
    if (!file) { setCsvText(''); return }
    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('Le fichier est vide.')
      setCsvText(text)
    } catch (value) {
      setSelectedFiles([]); setCsvText(''); setError(value instanceof Error ? value.message : 'Impossible de lire le fichier.')
    }
  }

  function pasteCsv(value: string) {
    setSelectedFiles([]); setResult(null); setError(null); setCsvText(value)
  }

  return <section className={styles.adminPanel} style={{ marginTop: 24 }}>
    <header><div><span className={styles.eyebrow}>WALLET ASSIGNMENT IMPORT</span><h2>Dry-run, erreurs ligne par ligne, exécution gouvernée</h2></div><button className={styles.secondaryButton} type="button" onClick={downloadTemplate}><Download size={15} />Télécharger le modèle</button></header>
    <div className={styles.formGrid}>
      <div className={styles.fullField}><MarketplaceFilePicker accept={CSV_FILE_ACCEPT} files={selectedFiles} onFilesChange={(files) => void chooseCsv(files)} label="Importer le fichier CSV" description="Affectations Wallet · sélection ou glisser-déposer · dry-run obligatoire" /></div>
      <label className={styles.fullField}><span>Coller le CSV</span><textarea rows={7} value={csvText} onChange={event => pasteCsv(event.target.value)} placeholder="policy_key,customer_email,starts_at,ends_at,status" /></label>
    </div>
    <div className={styles.authActions}><button className={styles.secondaryButton} disabled={busy || !csvText.trim()} onClick={() => void run('validate')}><FileCheck2 size={15} />Valider / dry-run</button><button className={styles.primaryButton} disabled={busy || !result || result.mode !== 'validate' || result.invalid > 0} onClick={() => void run('upsert')}><UploadCloud size={15} />Exécuter les lignes valides</button></div>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}
    {result ? <div className={styles.simulatorResult} role="status"><div><span>Total</span><strong>{result.total}</strong></div><div><span>Valides</span><strong>{result.valid}</strong></div><div><span>Invalides</span><strong>{result.invalid}</strong></div><div><span>Mode</span><strong>{result.mode}</strong></div>{result.rows.filter(row => row.status === 'invalid').map(row => <p key={row.row}><b>Ligne {row.row}</b><span>{row.error || 'invalid'}</span></p>)}</div> : null}
  </section>
}
