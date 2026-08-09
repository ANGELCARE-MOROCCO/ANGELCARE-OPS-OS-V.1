"use client"

import { useMemo, useState } from 'react'
import { Download, FileClock, Search } from 'lucide-react'
import type { MarketplaceAuditEvent } from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import { ButtonLink, StatusChip } from '../../design-system/ui'

export function AuditViewerClient({
  initialEvents,
  canExport,
}: {
  initialEvents: MarketplaceAuditEvent[]
  canExport: boolean
}) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')
  const [severity, setSeverity] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return initialEvents.filter((event) => {
      const queryMatches =
        !normalized ||
        event.action.toLowerCase().includes(normalized) ||
        event.object_type.toLowerCase().includes(normalized) ||
        String(event.actor_role || '').toLowerCase().includes(normalized) ||
        String(event.reason || '').toLowerCase().includes(normalized)
      return queryMatches && (!result || event.result === result) && (!severity || event.severity === severity)
    })
  }, [initialEvents, query, result, severity])

  const exportQuery = new URLSearchParams()
  if (query) exportQuery.set('q', query)
  if (result) exportQuery.set('result', result)
  if (severity) exportQuery.set('severity', severity)

  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <Search size={16} className={styles.muted} />
        <input
          className={styles.searchField}
          value={query}
          onChange={(event: { target: { value: string } }) => setQuery(event.target.value)}
          placeholder="Rechercher une action, un objet, un rôle ou une raison…"
        />
        <select className={styles.selectField} value={result} onChange={(event: { target: { value: string } }) => setResult(event.target.value)}>
          <option value="">Tous les résultats</option>
          <option value="success">Réussi</option>
          <option value="denied">Refusé</option>
          <option value="failed">Échec</option>
        </select>
        <select className={styles.selectField} value={severity} onChange={(event: { target: { value: string } }) => setSeverity(event.target.value)}>
          <option value="">Toutes les sévérités</option>
          <option value="info">Information</option>
          <option value="warning">Avertissement</option>
          <option value="critical">Critique</option>
        </select>
        {canExport ? (
          <ButtonLink
            href={`/api/angelcare-marketplace/foundation/audit/export?${exportQuery.toString()}`}
            variant="secondary"
          >
            <Download size={14} /> Exporter CSV
          </ButtonLink>
        ) : null}
      </div>
      {filtered.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Objet</th>
                <th>Acteur</th>
                <th>Résultat</th>
                <th>Sévérité</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.created_at).toLocaleString('fr-FR')}</td>
                  <td>
                    <div className={styles.tablePrimary}>{event.action}</div>
                    <div className={styles.tableSecondary}>{event.reason || 'Aucune note complémentaire.'}</div>
                  </td>
                  <td>{event.object_type}<br /><span className={styles.tableSecondary}>{event.object_id || 'Objet global'}</span></td>
                  <td>{event.actor_role || 'Système'}<br /><span className={styles.tableSecondary}>{event.actor_id || 'Non applicable'}</span></td>
                  <td><StatusChip status={event.result} /></td>
                  <td><StatusChip status={event.severity} /></td>
                  <td><span className={styles.code}>{event.request_id.slice(0, 12)}…</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div>
            <span className={styles.stateIcon}><FileClock size={25} /></span>
            <h2 className={styles.stateTitle}>Aucune preuve correspondante</h2>
            <p className={styles.stateText}>Modifiez les filtres. L’absence d’événement est affichée explicitement.</p>
          </div>
        </div>
      )}
    </section>
  )
}
