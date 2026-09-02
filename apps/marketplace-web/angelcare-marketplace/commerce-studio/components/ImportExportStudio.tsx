'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { MarketplaceFilePicker } from '../../components/MarketplaceFilePicker'
import styles from '../commerce-studio.module.css'
import { apiRequest, StudioNotice, useStudioMutation } from './StudioClient'

const resources = [
  'catalog-items',
  'catalog-variants',
  'catalog-categories',
  'catalog-item-categories',
  'homepage-collections',
  'homepage-collection-items',
  'homepage-placements',
  'navigation-items',
  'price-rules',
  'catalog-availability',
  'merchandising-rules',
]

const initialSource = JSON.stringify([
  {
    name_fr: 'Nouvel objet commercial',
    kind: 'product',
    price_mode: 'quote_only',
  },
], null, 2)

interface ImportResult {
  dryRun: boolean
  imported: number
  errors: Array<{ row: number; message: string }>
}

export function ImportExportStudio() {
  const [resource, setResource] = useState('catalog-items')
  const [source, setSource] = useState(initialSource)
  const [sourceFormat, setSourceFormat] = useState<'json' | 'csv'>('json')
  const [result, setResult] = useState('')
  const [importFiles, setImportFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const mutation = useStudioMutation()
  const importFile = importFiles[0] || null

  async function chooseImportFile(files: File[]) {
    setImportFiles(files); setFileError(''); setResult('')
    const file = files[0]
    if (!file) { setSource(''); return }
    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('Le fichier est vide.')
      setSource(text)
      setSourceFormat(file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv') ? 'csv' : 'json')
    } catch (error) {
      setImportFiles([]); setFileError(error instanceof Error ? error.message : 'Impossible de lire le fichier.')
    }
  }

  function editSource(value: string) {
    setImportFiles([]); setFileError(''); setResult(''); setSource(value)
  }

  async function run(dryRun: boolean) {
    if (importFile) {
      const form = new FormData()
      form.set('file', importFile)
      form.set('dry_run', String(dryRun))
      const response = await mutation.run(
        () => apiRequest<ImportResult>(`/api/angelcare-marketplace/admin/commerce/import/${resource}`, { method: 'POST', body: form }),
        dryRun ? 'Dry-run fichier terminé.' : 'Fichier importé immédiatement.',
      )
      if (response) setResult(JSON.stringify(response, null, 2))
      return
    }
    if (sourceFormat === 'csv') {
      if (!source.trim()) { setResult('Le contenu CSV est vide.'); return }
      const response = await mutation.run(
        () => apiRequest<ImportResult>(`/api/angelcare-marketplace/admin/commerce/import/${resource}?dry_run=${String(dryRun)}`, { method: 'POST', headers: { 'content-type': 'text/csv' }, body: source }),
        dryRun ? 'Dry-run CSV terminé.' : 'CSV importé immédiatement.',
      )
      if (response) setResult(JSON.stringify(response, null, 2))
      return
    }
    let records: unknown

    try {
      records = JSON.parse(source)
    } catch {
      setResult('JSON invalide.')
      return
    }

    const response = await mutation.run(
      () => apiRequest<ImportResult>(
        `/api/angelcare-marketplace/admin/commerce/import/${resource}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ records, dry_run: dryRun }),
        },
      ),
      dryRun ? 'Dry-run terminé.' : 'Import exécuté immédiatement.',
    )

    if (response) {
      setResult(JSON.stringify(response, null, 2))
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.workspaceHero} data-accent="catalog">
        <div>
          <span>ENTERPRISE IMPORT / EXPORT</span>
          <h1>Accélérateur massif sans remplacer les studios visuels.</h1>
          <p>
            Prévisualisez chaque lot, corrigez les erreurs exactes puis
            exécutez sans approbation.
          </p>
        </div>
        <div className={styles.workspaceStats}>
          <FileSpreadsheet size={30} />
          <strong>{resources.length}</strong>
          <span>registres structurés</span>
        </div>
      </section>

      <section className={styles.importExportGrid}>
        <article>
          <h2>Registre</h2>
          <label className={styles.field}>
            <span>Ressource</span>
            <select
              value={resource}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setResource(event.target.value)}
            >
              {resources.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </label>
          <a
            className={styles.primaryAction}
            href={`/api/angelcare-marketplace/admin/commerce/export/${resource}`}
          >
            <Download size={17} /> Exporter CSV
          </a>
          <a
            className={styles.inlineAction}
            href={`/api/angelcare-marketplace/admin/commerce/export/${resource}?format=json`}
          >
            <Download size={15} /> Exporter JSON
          </a>
        </article>

        <article>
          <h2>Import CSV ou JSON structuré</h2>
          <MarketplaceFilePicker accept=".csv,.json,text/csv,application/json" files={importFiles} onFilesChange={(files) => void chooseImportFile(files)} label="Choisir un fichier CSV ou JSON" description="Le fichier est lu localement puis attend votre dry-run ou exécution explicite." />
          {fileError ? <p className={styles.errorNotice} role="alert">{fileError}</p> : null}
          <label className={styles.field}>
            <span>Format du contenu collé</span>
            <select value={sourceFormat} onChange={(event) => { setImportFiles([]); setSourceFormat(event.target.value as 'json' | 'csv'); setSource(event.target.value === 'csv' ? '' : initialSource) }}>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{sourceFormat === 'csv' ? 'Coller le CSV' : 'Coller le JSON'}</span>
            <textarea
              className={styles.codeEditor}
              value={source}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => editSource(event.target.value)}
              placeholder={sourceFormat === 'csv' ? 'Collez ici le contenu CSV…' : 'Collez ici le tableau JSON…'}
              rows={20}
            />
          </label>
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.inlineAction}
              onClick={() => void run(true)}
            >
              Dry-run
            </button>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => void run(false)}
            >
              <Upload size={17} /> Exécuter
            </button>
          </div>
          <StudioNotice
            message={mutation.message}
            error={mutation.error}
            onClose={mutation.clear}
          />
        </article>

        <article>
          <h2>Résultat exact</h2>
          <pre className={styles.resultConsole}>
            {result || 'Aucune exécution.'}
          </pre>
        </article>
      </section>
    </main>
  )
}
