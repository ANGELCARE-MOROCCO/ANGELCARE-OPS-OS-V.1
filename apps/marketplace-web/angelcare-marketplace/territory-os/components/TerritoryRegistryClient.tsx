"use client"

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Download, Eye, Filter, MoreHorizontal, Search } from 'lucide-react'
import type { Territory } from '../types'
import styles from '../territory-os.module.css'
import { ReadinessBar, TerritoryEmpty, TerritoryHealthPill, TerritoryStatusPill } from './TerritoryPrimitives'
import { ownerLabel } from '../format'

export function TerritoryRegistryClient({ territories, canExport }: { territories: Territory[]; canExport: boolean }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [health, setHealth] = useState('all')
  const [country, setCountry] = useState('all')
  const countries = useMemo(() => [...new Set(territories.map((item) => item.country_code))].sort(), [territories])
  const filtered = useMemo(() => territories.filter((territory) => {
    const haystack = `${territory.name} ${territory.territory_code} ${territory.country_code}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) &&
      (status === 'all' || territory.status === status) &&
      (health === 'all' || territory.health_status === health) &&
      (country === 'all' || territory.country_code === country)
  }), [territories, query, status, health, country])

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}><Search className={styles.searchIcon} size={15} /><input className={styles.searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un territoire, code ou pays…" /></div>
        <select className={`${styles.select} ${styles.filterSelect}`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option><option value="draft">Brouillon</option><option value="configuring">Configuration</option><option value="review">En revue</option><option value="soft_launch">Soft launch</option><option value="live">Live</option><option value="paused">Suspendu</option><option value="archived">Archivé</option></select>
        <select className={`${styles.select} ${styles.filterSelect}`} value={health} onChange={(event) => setHealth(event.target.value)}><option value="all">Toutes les santés</option><option value="healthy">Sain</option><option value="attention_required">Attention</option><option value="at_risk">À risque</option><option value="critical">Critique</option><option value="paused">Suspendu</option></select>
        <select className={`${styles.select} ${styles.filterSelect}`} value={country} onChange={(event) => setCountry(event.target.value)}><option value="all">Tous les pays</option>{countries.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        {canExport ? <Link href="/api/angelcare-marketplace/territories/export" className={styles.buttonSecondary}><Download size={13} /> Exporter</Link> : null}
      </div>
      {filtered.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Territoire</th><th>Statut</th><th>Langues</th><th>Propriétaire</th><th>Préparation</th><th>Santé</th><th>Cible lancement</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((territory) => (
                <tr key={territory.id}>
                  <td><Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}`} className={styles.territoryIdentity}><span className={styles.territoryMonogram}>{territory.country_code}</span><span className={styles.territoryName}><strong>{territory.name}</strong><span>{territory.territory_code} · {territory.territory_type}</span></span></Link></td>
                  <td><TerritoryStatusPill status={territory.status} /></td>
                  <td><span className={styles.localeSet}>{territory.active_locales.map((locale) => <span className={styles.localeTag} key={locale}>{locale}</span>)}</span></td>
                  <td><span className={styles.ownerBlock}><strong>{ownerLabel(territory.owner_id)}</strong><span>{territory.executive_sponsor_id ? 'Sponsor exécutif assigné' : 'Sponsor à assigner'}</span></span></td>
                  <td><ReadinessBar value={territory.readiness_score} /></td>
                  <td><TerritoryHealthPill status={territory.health_status} /></td>
                  <td><span className={styles.ownerBlock}><strong>{territory.target_launch_at ? new Date(territory.target_launch_at).toLocaleDateString('fr-FR') : 'Non planifié'}</strong><span>{territory.currency_label} · {territory.timezone}</span></span></td>
                  <td><div className={styles.rowActions}><Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}`} className={styles.iconAction} aria-label={`Ouvrir ${territory.name}`}><Eye size={14} /></Link><Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/readiness`} className={styles.iconAction} aria-label="Ouvrir la readiness"><ArrowUpRight size={14} /></Link><button className={styles.iconAction} aria-label="Actions supplémentaires"><MoreHorizontal size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <TerritoryEmpty title="Aucun territoire ne correspond" text="Modifiez les filtres ou créez un nouveau territoire avec un propriétaire, une stratégie d’activation et un dossier de readiness." action={<button className={styles.buttonSecondary} onClick={() => { setQuery(''); setStatus('all'); setHealth('all'); setCountry('all') }}><Filter size={13} /> Réinitialiser les filtres</button>} />}
    </section>
  )
}
