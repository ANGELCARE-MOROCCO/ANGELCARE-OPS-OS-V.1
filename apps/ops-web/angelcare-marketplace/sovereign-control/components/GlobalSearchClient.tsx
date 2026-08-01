'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import type { ApiSuccess } from '../../domain/types'
import type { SearchResult } from '../types'
import styles from '../sovereign.module.css'

export function GlobalSearchClient() {
  const [query, setQuery] = useState('')
  const [objectType, setObjectType] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim().length < 2) { setMessage('Saisissez au moins deux caractères.'); return }
    setState('loading'); setMessage('')
    const params = new URLSearchParams({ q: query.trim() })
    if (objectType) params.set('type', objectType)
    try {
      const response = await fetch(`/api/angelcare-marketplace/backoffice/search?${params.toString()}`, { cache: 'no-store' })
      const payload = await response.json() as ApiSuccess<SearchResult[]> | { error?: { message?: string } }
      if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message : 'Recherche indisponible.')
      setResults(payload.data); setState('success')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Recherche indisponible.'); setState('error') }
  }

  return <div className={styles.searchShell}>
    <form className={styles.searchBar} onSubmit={submit}>
      <input className={styles.input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, référence, route, famille, demande..." aria-label="Recherche globale" />
      <select className={styles.select} value={objectType} onChange={(event) => setObjectType(event.target.value)} aria-label="Type d’objet">
        <option value="">Tous les objets</option><option value="cms_page">Pages publiques</option><option value="family_account">Familles</option><option value="family_quote_request">Demandes de devis</option><option value="public_inquiry">Entrées publiques</option><option value="territory">Territoires</option><option value="approval_request">Approbations</option>
      </select>
      <button className={styles.primaryButton} disabled={state === 'loading'}>{state === 'loading' ? 'Recherche…' : 'Rechercher'}</button>
    </form>
    {message ? <div className={styles.risk} data-severity="critical"><strong>Recherche interrompue</strong><p>{message}</p></div> : null}
    <section className={styles.results} aria-live="polite">
      {state === 'idle' ? <div className={styles.empty}>La recherche interroge uniquement les objets auxquels votre rôle a accès.</div> : null}
      {state === 'success' && !results.length ? <div className={styles.empty}>Aucun objet correspondant.</div> : null}
      {results.map((result) => <Link href={result.route} className={styles.resultRow} key={`${result.object_type}-${result.object_id}`}><span className={styles.resultType}>{result.object_type}</span><span><span className={styles.resultTitle}>{result.title}</span><span className={styles.resultSub}>{result.subtitle || result.public_reference || 'Objet gouverné'}</span></span><span className={styles.status} data-status={result.status}>{result.status}</span><span>Ouvrir →</span></Link>)}
    </section>
  </div>
}
