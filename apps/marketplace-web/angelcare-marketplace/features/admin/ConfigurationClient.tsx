"use client"

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { CheckCircle2, LockKeyhole, Pencil, Search, Settings2, X } from 'lucide-react'
import type { MarketplaceConfiguration } from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import { Button, StatusChip } from '../../design-system/ui'

async function responseData<T>(response: Response): Promise<T> {
  const payload = await response.json() as { data?: T; error?: { message?: string } }
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'L’opération n’a pas abouti.')
  return payload.data
}

function displayValue(configuration: MarketplaceConfiguration): string {
  if (configuration.sensitive) return 'Valeur serveur protégée'
  if (typeof configuration.value === 'string') return configuration.value
  return JSON.stringify(configuration.value)
}

export function ConfigurationClient({
  initialConfigurations,
  canManage,
}: {
  initialConfigurations: MarketplaceConfiguration[]
  canManage: boolean
}) {
  const [configurations, setConfigurations] = useState(initialConfigurations)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<MarketplaceConfiguration | null>(null)
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return configurations.filter((item) =>
      !normalized ||
      item.config_key.toLowerCase().includes(normalized) ||
      item.label.toLowerCase().includes(normalized) ||
      item.category.toLowerCase().includes(normalized),
    )
  }, [configurations, query])

  function openEdit(configuration: MarketplaceConfiguration) {
    setEditing(configuration)
    setValue(displayValue(configuration))
    setReason('')
    setFeedback(null)
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    let parsedValue: unknown = value
    if (editing.value_type === 'boolean') parsedValue = value === 'true'
    if (editing.value_type === 'number') parsedValue = Number(value)
    if (editing.value_type === 'json') {
      try {
        parsedValue = JSON.parse(value)
      } catch {
        setFeedback({ type: 'error', message: 'La valeur JSON n’est pas valide.' })
        return
      }
    }
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/angelcare-marketplace/foundation/configuration/${encodeURIComponent(editing.config_key)}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ value: parsedValue, reason }),
          },
        )
        const updated = await responseData<MarketplaceConfiguration>(response)
        setConfigurations((current) => current.map((item) => item.id === updated.id ? updated : item))
        setEditing(null)
        setFeedback({ type: 'success', message: `${updated.label} a été modifié et audité.` })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Modification impossible.' })
      }
    })
  }

  return (
    <>
      {feedback ? (
        <div className={`${styles.feedback} ${feedback.type === 'success' ? styles.noticeSuccess : styles.noticeDanger}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          <div>{feedback.message}</div>
        </div>
      ) : null}
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <Search size={16} className={styles.muted} />
          <input
            className={styles.searchField}
            value={query}
            onChange={(event: { target: { value: string } }) => setQuery(event.target.value)}
            placeholder="Rechercher une configuration ou une catégorie…"
          />
        </div>
        {filtered.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Configuration</th>
                  <th>Catégorie</th>
                  <th>Valeur effective</th>
                  <th>Type</th>
                  <th>Contrôle</th>
                  <th>Version</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((configuration) => (
                  <tr key={configuration.id}>
                    <td>
                      <div className={styles.tablePrimary}>{configuration.label}</div>
                      <div className={styles.tableSecondary}><code>{configuration.config_key}</code><br />{configuration.description}</div>
                    </td>
                    <td>{configuration.category}</td>
                    <td><span className={styles.code}>{displayValue(configuration)}</span></td>
                    <td>{configuration.value_type}</td>
                    <td>
                      <StatusChip
                        status={configuration.sensitive ? 'blocked' : configuration.editable ? 'enabled' : 'disabled'}
                      />
                    </td>
                    <td>v{configuration.version}</td>
                    <td>
                      <div className={styles.tableActions}>
                        {canManage && configuration.editable && !configuration.sensitive ? (
                          <Button type="button" variant="secondary" onClick={() => openEdit(configuration)}>
                            <Pencil size={14} /> Modifier
                          </Button>
                        ) : (
                          <span className={styles.scopeBadge}><LockKeyhole size={12} /> Serveur</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div>
              <span className={styles.stateIcon}><Settings2 size={25} /></span>
              <h2 className={styles.stateTitle}>Aucune configuration trouvée</h2>
              <p className={styles.stateText}>Ajustez la recherche. Les secrets ne sont jamais affichés dans cette vue.</p>
            </div>
          </div>
        )}
      </section>

      {editing ? (
        <div className={styles.modalBackdrop}>
          <form className={styles.modalPanel} onSubmit={submitEdit} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div><h2>Modifier {editing.label}</h2><p>Version actuelle : v{editing.version}. La valeur précédente restera traçable dans l’audit.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setEditing(null)} aria-label="Fermer"><X size={16} /></button>
            </header>
            <div className={styles.modalBody}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Nouvelle valeur *</span>
                {editing.value_type === 'boolean' ? (
                  <select className={styles.selectField} value={value} onChange={(event: { target: { value: string } }) => setValue(event.target.value)}>
                    <option value="true">Activé</option>
                    <option value="false">Désactivé</option>
                  </select>
                ) : editing.value_type === 'json' ? (
                  <textarea className={styles.textArea} value={value} onChange={(event: { target: { value: string } }) => setValue(event.target.value)} required />
                ) : (
                  <input
                    className={styles.textField}
                    type={editing.value_type === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(event: { target: { value: string } }) => setValue(event.target.value)}
                    required
                  />
                )}
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Raison et impact *</span>
                <textarea className={styles.textArea} value={reason} onChange={(event: { target: { value: string } }) => setReason(event.target.value)} required />
              </label>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setEditing(null)}>Annuler</Button>
              <Button type="submit" disabled={isPending || !reason.trim()}>{isPending ? 'Validation…' : 'Enregistrer et auditer'}</Button>
            </footer>
          </form>
        </div>
      ) : null}
    </>
  )
}
