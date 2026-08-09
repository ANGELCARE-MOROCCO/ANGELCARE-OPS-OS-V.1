"use client"

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { CheckCircle2, Flag, Plus, Search, ToggleLeft, X } from 'lucide-react'
import type { MarketplaceFeatureFlag } from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import { Button, StatusChip } from '../../design-system/ui'

async function responseData<T>(response: Response): Promise<T> {
  const payload = await response.json() as { data?: T; error?: { message?: string } }
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'L’opération n’a pas abouti.')
  return payload.data
}

export function FeatureFlagsClient({
  initialFlags,
  canManage,
}: {
  initialFlags: MarketplaceFeatureFlag[]
  canManage: boolean
}) {
  const [flags, setFlags] = useState(initialFlags)
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<MarketplaceFeatureFlag | null>(null)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    return flags.filter((flag) =>
      !value ||
      flag.flag_key.toLowerCase().includes(value) ||
      flag.name.toLowerCase().includes(value) ||
      String(flag.description || '').toLowerCase().includes(value),
    )
  }, [flags, query])

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      try {
        const response = await fetch('/api/angelcare-marketplace/foundation/feature-flags', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            flagKey: form.get('flagKey'),
            name: form.get('name'),
            description: form.get('description'),
            scopeType: form.get('scopeType'),
            enabled: false,
            reason: form.get('reason'),
          }),
        })
        const created = await responseData<MarketplaceFeatureFlag>(response)
        setFlags((current) => [...current, created].sort((a, b) => a.flag_key.localeCompare(b.flag_key)))
        setCreateOpen(false)
        setFeedback({ type: 'success', message: `${created.name} a été créé en état sûr et audité.` })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Création impossible.' })
      }
    })
  }

  function submitToggle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setFeedback(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/angelcare-marketplace/foundation/feature-flags/${encodeURIComponent(editing.flag_key)}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ enabled: !editing.enabled, reason }),
          },
        )
        const updated = await responseData<MarketplaceFeatureFlag>(response)
        setFlags((current) => current.map((flag) => flag.id === updated.id ? updated : flag))
        setEditing(null)
        setReason('')
        setFeedback({
          type: 'success',
          message: `${updated.name} est maintenant ${updated.enabled ? 'actif' : 'inactif'}.`,
        })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Mise à jour impossible.' })
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
            placeholder="Rechercher un flag, un usage ou un périmètre…"
          />
          {canManage ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Nouveau flag
            </Button>
          ) : null}
        </div>
        {filtered.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Feature flag</th>
                  <th>Périmètre</th>
                  <th>État</th>
                  <th>Version</th>
                  <th>Propriétaire</th>
                  <th>Validité</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((flag) => (
                  <tr key={flag.id}>
                    <td>
                      <div className={styles.tablePrimary}>{flag.name}</div>
                      <div className={styles.tableSecondary}>
                        <code>{flag.flag_key}</code><br />{flag.description || 'Activation gouvernée.'}
                      </div>
                    </td>
                    <td>{flag.scope_type}{flag.scope_id ? ` · ${flag.scope_id}` : ''}</td>
                    <td><StatusChip status={flag.status} /></td>
                    <td>v{flag.version}</td>
                    <td>{flag.owner_id ? 'Assigné' : 'À assigner'}</td>
                    <td>{flag.expires_at ? new Date(flag.expires_at).toLocaleDateString('fr-FR') : 'Sans échéance'}</td>
                    <td>
                      <div className={styles.tableActions}>
                        {canManage && flag.status !== 'archived' ? (
                          <Button
                            type="button"
                            variant={flag.enabled ? 'danger' : 'secondary'}
                            onClick={() => { setEditing(flag); setReason('') }}
                          >
                            <ToggleLeft size={14} /> {flag.enabled ? 'Désactiver' : 'Activer'}
                          </Button>
                        ) : null}
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
              <span className={styles.stateIcon}><Flag size={25} /></span>
              <h2 className={styles.stateTitle}>Aucun feature flag trouvé</h2>
              <p className={styles.stateText}>Aucun indicateur artificiel n’est créé pour remplir la vue.</p>
            </div>
          </div>
        )}
      </section>

      {createOpen ? (
        <div className={styles.modalBackdrop}>
          <form className={styles.modalPanel} onSubmit={submitCreate} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div><h2>Créer un feature flag</h2><p>La valeur initiale reste désactivée jusqu’à une activation motivée.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setCreateOpen(false)} aria-label="Fermer"><X size={16} /></button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Clé *</span>
                  <input className={styles.textField} name="flagKey" required placeholder="marketplace.capability.enabled" />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Nom *</span>
                  <input className={styles.textField} name="name" required />
                </label>
              </div>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Description opérationnelle</span>
                <textarea className={styles.textArea} name="description" />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Périmètre</span>
                  <select className={styles.selectField} name="scopeType" defaultValue="global">
                    <option value="global">Global</option>
                    <option value="territory">Territoire</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Raison *</span>
                  <input className={styles.textField} name="reason" required />
                </label>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Création…' : 'Créer en état désactivé'}</Button>
            </footer>
          </form>
        </div>
      ) : null}

      {editing ? (
        <div className={styles.modalBackdrop}>
          <form className={styles.modalPanel} onSubmit={submitToggle} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <h2>{editing.enabled ? 'Désactiver' : 'Activer'} {editing.name}</h2>
                <p>Le changement est contrôlé côté serveur et produit une preuve d’audit.</p>
              </div>
              <button className={styles.iconButton} type="button" onClick={() => setEditing(null)} aria-label="Fermer"><X size={16} /></button>
            </header>
            <div className={styles.modalBody}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Raison et impact *</span>
                <textarea className={styles.textArea} value={reason} onChange={(event: { target: { value: string } }) => setReason(event.target.value)} required />
              </label>
              <div className={styles.noticeWarning}>
                <ToggleLeft size={18} />
                <div>Un flag ne remplace jamais la livraison contractuelle d’un Mega ZIP absent.</div>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setEditing(null)}>Annuler</Button>
              <Button type="submit" variant={editing.enabled ? 'danger' : 'primary'} disabled={isPending || !reason.trim()}>
                {isPending ? 'Contrôle…' : 'Confirmer et auditer'}
              </Button>
            </footer>
          </form>
        </div>
      ) : null}
    </>
  )
}
