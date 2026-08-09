'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
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
  const [result, setResult] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const mutation = useStudioMutation()

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
          <h2>Import JSON structuré</h2>
          <textarea
            className={styles.codeEditor}
            value={source}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setSource(event.target.value)}
            rows={20}
          />
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
