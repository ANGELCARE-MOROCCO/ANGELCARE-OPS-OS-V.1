"use client"

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Plus,
  Power,
  Search,
  X,
} from 'lucide-react'
import type {
  MarketplaceModule,
  MarketplaceModuleStatus,
  MarketplacePermission,
} from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import { Button, StatusChip } from '../../design-system/ui'

interface Feedback {
  type: 'success' | 'error'
  message: string
}

async function responseData<T>(response: Response): Promise<T> {
  const payload = await response.json() as {
    data?: T
    error?: { message?: string }
  }
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || 'L’opération n’a pas abouti.')
  }
  return payload.data
}

const transitionOptions: MarketplaceModuleStatus[] = [
  'registered',
  'disabled',
  'enabled',
  'blocked',
  'degraded',
  'deprecated',
  'archived',
]

export function ModuleRegistryClient({
  initialModules,
  permissions,
}: {
  initialModules: MarketplaceModule[]
  permissions: MarketplacePermission[]
}) {
  const [modules, setModules] = useState(initialModules)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [transitioning, setTransitioning] = useState<MarketplaceModule | null>(null)
  const [targetStatus, setTargetStatus] = useState<MarketplaceModuleStatus>('disabled')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const canCreate = permissions.includes('marketplace.modules.create')
  const canUpdate = permissions.includes('marketplace.modules.update')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return modules.filter((module) => {
      const matchesQuery =
        !normalized ||
        module.name.toLowerCase().includes(normalized) ||
        module.module_key.toLowerCase().includes(normalized) ||
        String(module.description || '').toLowerCase().includes(normalized)
      return matchesQuery && (!status || module.status === status)
    })
  }, [modules, query, status])

  function openTransition(module: MarketplaceModule) {
    setTransitioning(module)
    setTargetStatus(module.status === 'enabled' ? 'disabled' : 'enabled')
    setReason('')
    setFeedback(null)
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      try {
        const response = await fetch('/api/angelcare-marketplace/foundation/modules', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            moduleKey: form.get('moduleKey'),
            name: form.get('name'),
            routePrefix: form.get('routePrefix'),
            description: form.get('description'),
            audience: ['admin'],
            introducedByMegaZip: Number(form.get('introducedByMegaZip') || 1),
            localeAware: true,
            reason: form.get('reason'),
          }),
        })
        const created = await responseData<MarketplaceModule>(response)
        setModules((current) => [...current, created].sort((a, b) => a.navigation_order - b.navigation_order))
        setCreateOpen(false)
        setFeedback({ type: 'success', message: `Le module ${created.name} a été enregistré et audité.` })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Création impossible.' })
      }
    })
  }

  function submitTransition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!transitioning) return
    setFeedback(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/angelcare-marketplace/foundation/modules/${encodeURIComponent(transitioning.module_key)}/transition`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ targetStatus, reason }),
          },
        )
        const updated = await responseData<MarketplaceModule>(response)
        setModules((current) => current.map((module) => module.id === updated.id ? updated : module))
        setTransitioning(null)
        setFeedback({
          type: 'success',
          message: `${updated.name} est maintenant « ${updated.status} ». La transition est tracée.`,
        })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Transition impossible.' })
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
          <div className={styles.inline} style={{ flex: '1 1 320px' }}>
            <Search size={16} className={styles.muted} />
            <input
              className={styles.searchField}
              value={query}
              onChange={(event: { target: { value: string } }) => setQuery(event.target.value)}
              placeholder="Rechercher par nom, clé ou responsabilité…"
              aria-label="Rechercher les modules"
            />
          </div>
          <select
            className={styles.selectField}
            value={status}
            onChange={(event: { target: { value: string } }) => setStatus(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {['enabled', 'registered', 'not_installed', 'disabled', 'blocked', 'degraded', 'deprecated', 'archived'].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          {canCreate ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Enregistrer un module
            </Button>
          ) : null}
        </div>

        {filtered.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Mega ZIP</th>
                  <th>Statut</th>
                  <th>Périmètres</th>
                  <th>Dépendances</th>
                  <th>Santé</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((module) => (
                  <tr key={module.id}>
                    <td>
                      <Link
                        href={`/angelcare-marketplace/admin/modules/${encodeURIComponent(module.module_key)}`}
                        className={styles.tablePrimary}
                      >
                        {module.name}
                      </Link>
                      <div className={styles.tableSecondary}>
                        <code>{module.module_key}</code> · {module.route_prefix}
                      </div>
                    </td>
                    <td>ZIP {String(module.introduced_by_mega_zip).padStart(2, '0')}</td>
                    <td><StatusChip status={module.status} /></td>
                    <td>
                      <div className={styles.tableSecondary}>
                        {module.territory_aware ? 'Territoire · ' : ''}
                        {module.tenant_aware ? 'Tenant · ' : ''}
                        {module.locale_aware ? 'Locale' : 'Global'}
                      </div>
                    </td>
                    <td>{module.required_dependencies.length || '—'}</td>
                    <td><StatusChip status={module.health_status} /></td>
                    <td>
                      <div className={styles.tableActions}>
                        <Link
                          className={styles.buttonQuiet}
                          href={`/angelcare-marketplace/admin/modules/${encodeURIComponent(module.module_key)}`}
                        >
                          Détail <ArrowRight size={14} />
                        </Link>
                        {canUpdate && module.status !== 'archived' && module.status !== 'not_installed' ? (
                          <Button type="button" variant="secondary" onClick={() => openTransition(module)}>
                            <Power size={14} /> Transition
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
              <span className={styles.stateIcon}><Boxes size={25} /></span>
              <h2 className={styles.stateTitle}>Aucun module ne correspond</h2>
              <p className={styles.stateText}>
                Ajustez les filtres. Un registre vide ne sera jamais remplacé par des valeurs artificielles.
              </p>
            </div>
          </div>
        )}
      </section>

      {createOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <form className={styles.modalPanel} onSubmit={submitCreate} aria-modal="true" role="dialog">
            <header className={styles.modalHeader}>
              <div>
                <h2>Enregistrer un module</h2>
                <p>Cette action crée un objet durable dans le registre. Elle n’installe pas un Mega ZIP non livré.</p>
              </div>
              <button className={styles.iconButton} type="button" onClick={() => setCreateOpen(false)} aria-label="Fermer">
                <X size={16} />
              </button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Clé module *</span>
                  <input className={styles.textField} name="moduleKey" required placeholder="marketplace.domain-key" />
                  <span className={styles.fieldHelp}>Stable, unique, sans espaces.</span>
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Nom *</span>
                  <input className={styles.textField} name="name" required />
                </label>
              </div>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Route *</span>
                <input
                  className={styles.textField}
                  name="routePrefix"
                  required
                  defaultValue="/angelcare-marketplace/"
                />
                <span className={styles.fieldHelp}>La route doit rester dans le domaine Marketplace.</span>
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Responsabilité du module</span>
                <textarea className={styles.textArea} name="description" />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Mega ZIP propriétaire</span>
                  <input className={styles.textField} name="introducedByMegaZip" type="number" min="1" max="20" defaultValue="1" />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Raison *</span>
                  <input className={styles.textField} name="reason" required placeholder="Pourquoi ce module est enregistré maintenant ?" />
                </label>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer et auditer'}</Button>
            </footer>
          </form>
        </div>
      ) : null}

      {transitioning ? (
        <div className={styles.modalBackdrop} role="presentation">
          <form className={styles.modalPanel} onSubmit={submitTransition} aria-modal="true" role="dialog">
            <header className={styles.modalHeader}>
              <div>
                <h2>Transition contrôlée</h2>
                <p>{transitioning.name} · état actuel : {transitioning.status}</p>
              </div>
              <button className={styles.iconButton} type="button" onClick={() => setTransitioning(null)} aria-label="Fermer">
                <X size={16} />
              </button>
            </header>
            <div className={styles.modalBody}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Statut cible *</span>
                <select
                  className={styles.selectField}
                  value={targetStatus}
                  onChange={(event: { target: { value: string } }) => setTargetStatus(event.target.value as MarketplaceModuleStatus)}
                >
                  {transitionOptions.filter((value) => value !== transitioning.status).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Raison et impact *</span>
                <textarea
                  className={styles.textArea}
                  value={reason}
                  onChange={(event: { target: { value: string } }) => setReason(event.target.value)}
                  required
                  placeholder="Expliquez la décision, son propriétaire et l’effet attendu."
                />
              </label>
              <div className={styles.noticeWarning}>
                <Power size={18} />
                <div>
                  Le serveur vérifiera la transition, la permission spécifique et les dépendances avant toute activation.
                </div>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setTransitioning(null)}>Annuler</Button>
              <Button type="submit" disabled={isPending || !reason.trim()}>
                {isPending ? 'Vérification…' : 'Confirmer la transition'}
              </Button>
            </footer>
          </form>
        </div>
      ) : null}
    </>
  )
}
