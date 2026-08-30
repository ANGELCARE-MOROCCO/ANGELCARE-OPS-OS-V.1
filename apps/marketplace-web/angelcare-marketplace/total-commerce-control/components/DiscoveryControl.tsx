'use client'

import Link from 'next/link'
import { ExternalLink, FlaskConical, Pause, Play, RotateCcw, Save, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DiscoverySearch } from '../../catalog-discovery/types'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import type { AssistedOrderOptions, SearchRule } from '../types'
import styles from './discovery-control.module.css'

type Envelope<T> = { data?: T; error?: { message?: string } }
type RuleType = SearchRule['rule_type']

const types: Array<{ value: RuleType; label: string }> = [
  { value: 'synonym', label: 'Synonyme' }, { value: 'alias', label: 'Alias' },
  { value: 'pin', label: 'Épingler un produit' }, { value: 'bury', label: 'Déprioriser un produit' },
  { value: 'suggestion', label: 'Suggestion' }, { value: 'empty_result', label: 'Recovery zéro résultat' },
  { value: 'banner', label: 'Bannière recherche' },
]

export function DiscoveryControl({ initial, options, canManage }: { initial: SearchRule[]; options: AssistedOrderOptions; canManage: boolean }) {
  const requestAction = useGovernedAction()
  const [rules, setRules] = useState(initial)
  const [selectedKey, setSelectedKey] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [type, setType] = useState<RuleType>('synonym')
  const [pattern, setPattern] = useState('')
  const [replacement, setReplacement] = useState('')
  const [itemId, setItemId] = useState('')
  const [categoryKey, setCategoryKey] = useState('')
  const [headline, setHeadline] = useState('')
  const [href, setHref] = useState('')
  const [locale, setLocale] = useState('fr')
  const [priority, setPriority] = useState(100)
  const [status, setStatus] = useState<SearchRule['status']>('draft')
  const [testQuery, setTestQuery] = useState('')
  const [testLocale, setTestLocale] = useState('fr')
  const [testResult, setTestResult] = useState<DiscoverySearch | null>(null)
  const [testBusy, setTestBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const rows = useMemo(() => rules.filter((rule) => {
    const haystack = `${rule.query_pattern} ${rule.replacement_query || ''} ${rule.rule_type} ${rule.rule_key}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (!typeFilter || rule.rule_type === typeFilter) && (!statusFilter || rule.status === statusFilter)
  }), [rules, query, typeFilter, statusFilter])
  const categories = [...new Set(options.items.map((item) => item.category_key).filter((value): value is string => Boolean(value)))].sort()
  const matchingTestRules = rules.filter((rule) => rule.status === 'active' && (!rule.locale || rule.locale === testLocale) && rule.query_pattern.trim().toLowerCase() === testQuery.trim().toLowerCase())

  function resetEditor() {
    setSelectedKey(''); setType('synonym'); setPattern(''); setReplacement(''); setItemId(''); setCategoryKey('')
    setHeadline(''); setHref(''); setLocale('fr'); setPriority(100); setStatus('draft'); setError(''); setMessage('')
  }

  function selectRule(rule: SearchRule) {
    setSelectedKey(rule.rule_key); setType(rule.rule_type); setPattern(rule.query_pattern); setReplacement(rule.replacement_query || '')
    setItemId(rule.catalog_item_id || ''); setCategoryKey(rule.category_key || ''); setHeadline(String(rule.content.headline || ''))
    setHref(String(rule.content.href || '')); setLocale(rule.locale || 'fr'); setPriority(rule.priority); setStatus(rule.status); setError(''); setMessage('')
  }

  async function persist(nextStatus: SearchRule['status'], governanceReason = '') {
    if (!canManage) { setError('Permission marketplace.merchandising.manage requise.'); return }
    if (!pattern.trim()) { setError('Le motif de recherche est obligatoire.'); return }
    if (['pin', 'bury'].includes(type) && !itemId) { setError('Un produit publié doit être sélectionné.'); return }
    setBusy(true); setError(''); setMessage('')
    const ruleKey = selectedKey || `${type}:${locale}:${pattern.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${itemId || categoryKey || 'global'}`
    const body = {
      rule_key: ruleKey, rule_type: type, query_pattern: pattern,
      replacement_query: ['synonym', 'alias', 'suggestion', 'empty_result'].includes(type) ? replacement || null : null,
      catalog_item_id: ['pin', 'bury'].includes(type) ? itemId || null : null, category_key: categoryKey || null, locale, priority,
      status: nextStatus, content: { headline: headline || null, href: href || null, governance_reason: governanceReason || null },
    }
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/search-rules', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json() as Envelope<SearchRule>
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Impossible d’enregistrer la règle.')
      setRules((current) => [payload.data!, ...current.filter((rule) => rule.rule_key !== ruleKey)])
      selectRule(payload.data); setMessage(`Règle ${payload.data.status} enregistrée dans le moteur canonique.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.') }
    finally { setBusy(false) }
  }

  async function save() {
    if (status !== 'active') { await persist(status); return }
    const reason = await requestAction({
      title: selectedKey ? 'Enregistrer la règle Discovery active' : 'Créer et publier la règle Discovery',
      objectLabel: `${type} · ${pattern}`, currentState: selectedKey ? status : 'NON ENREGISTRÉ', nextState: 'active',
      consequence: 'La règle influence immédiatement la recherche publique canonique pour la locale et la cible définies.',
      reversibility: 'La règle peut ensuite être suspendue; le moteur doit être retesté après transition.',
      permission: 'marketplace.merchandising.manage',
    })
    if (reason) await persist('active', reason)
  }

  async function transition(nextStatus: SearchRule['status']) {
    if (!selectedKey || !canManage) return
    const reason = await requestAction({
      title: nextStatus === 'active' ? 'Réactiver la règle Discovery' : 'Suspendre la règle Discovery',
      objectLabel: `${type} · ${pattern}`, currentState: status, nextState: nextStatus,
      consequence: nextStatus === 'active' ? 'La règle influence de nouveau les résultats publics.' : 'La règle cesse d’influencer la recherche publique.',
      reversibility: 'L’autorité source permet une nouvelle sauvegarde avec un autre statut.', permission: 'marketplace.merchandising.manage',
    })
    if (reason) await persist(nextStatus, reason)
  }

  async function runTest() {
    if (!testQuery.trim()) return
    setTestBusy(true); setError(''); setMessage('')
    try {
      const params = new URLSearchParams({ q: testQuery.trim(), locale: testLocale, limit: '24' })
      const response = await fetch(`/api/angelcare-marketplace/discovery/search?${params}`, { cache: 'no-store' })
      const payload = await response.json() as Envelope<DiscoverySearch>
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Test public impossible.')
      setTestResult(payload.data); setMessage(`Test réel terminé · ${payload.data.items.length} résultats chargés sur ${payload.data.total}.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Test public impossible.') }
    finally { setTestBusy(false) }
  }

  return <main className={styles.root} data-readonly={!canManage}>
    <header className={styles.hero}><div><span>SEARCH & DISCOVERY CONTROL</span><h1>Gouverner, publier et tester le moteur de découverte.</h1><p>Synonymes, alias, pin/bury, suggestions, recovery et bannières restent reliés au catalogue public canonique.</p></div><div className={styles.metrics}><article><strong>{rules.length}</strong><span>règles</span></article><article><strong>{rules.filter((rule) => rule.status === 'active').length}</strong><span>actives</span></article><article><strong>{options.items.length}</strong><span>offres publiées</span></article></div></header>
    {!canManage ? <div className={styles.permission}><ShieldCheck/>Lecture seule · la mutation nécessite marketplace.merchandising.manage.</div> : null}
    {message ? <div className={styles.notice}>{message}</div> : null}{error ? <div className={styles.error}>{error}</div> : null}
    <section className={styles.commandGrid}>
      <div className={styles.registry}><header><div><h2>Règles Discovery</h2><button type="button" disabled={!canManage} onClick={resetEditor}>Nouvelle règle</button></div><div className={styles.filters}><label><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Motif, clé, remplacement…"/></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Tous types</option>{types.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tous statuts</option>{['draft','active','paused','archived'].map((value) => <option key={value}>{value}</option>)}</select></div></header><div className={styles.ruleList}>{rows.map((rule) => <button type="button" key={rule.id} data-selected={selectedKey === rule.rule_key} onClick={() => selectRule(rule)}><b>{rule.rule_type}</b><div><strong>{rule.query_pattern}</strong><span>{rule.replacement_query || rule.category_key || rule.catalog_item_id || String(rule.content.headline || 'règle de classement')}</span></div><small>P{rule.priority} · {rule.locale || 'all'}</small><em data-status={rule.status}>{rule.status}</em></button>)}{!rows.length ? <div className={styles.empty}>Aucune règle ne correspond aux filtres.</div> : null}</div></div>
      <aside className={styles.editor}><header><span>{selectedKey ? 'INSPECTEUR DE RÈGLE' : 'NOUVEAU BROUILLON'}</span><h2>{selectedKey || 'Règle Discovery'}</h2><small>{status} · locale {locale}</small></header><fieldset disabled={!canManage || busy}><label>Type<select value={type} onChange={(event) => setType(event.target.value as RuleType)}>{types.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select></label><label>Recherche / motif<input value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="nounou soirée"/></label>{['synonym','alias','suggestion','empty_result'].includes(type) ? <label>Expansion / suggestion<input value={replacement} onChange={(event) => setReplacement(event.target.value)}/></label> : null}{['pin','bury'].includes(type) ? <label>Produit<select value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Sélectionner…</option>{options.items.map((item) => <option key={item.id} value={item.id}>{item.name_fr} · {item.public_reference}</option>)}</select></label> : null}<label>Catégorie optionnelle<select value={categoryKey} onChange={(event) => setCategoryKey(event.target.value)}><option value="">Toutes catégories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>{['banner','empty_result'].includes(type) ? <><label>Message commercial<input value={headline} onChange={(event) => setHeadline(event.target.value)}/></label><label>Destination<input value={href} onChange={(event) => setHref(event.target.value)} placeholder="/angelcare-marketplace/fr/..."/></label></> : null}<div className={styles.two}><label>Locale<select value={locale} onChange={(event) => setLocale(event.target.value)}><option>fr</option><option>en</option><option>ar</option></select></label><label>Priorité<input type="number" value={priority} onChange={(event) => setPriority(Number(event.target.value))}/></label></div></fieldset><footer><button type="button" disabled={!canManage || busy || !pattern.trim()} onClick={() => void save()}><Save/>Enregistrer {status}</button>{status !== 'active' ? <button type="button" disabled={!selectedKey || !canManage || busy} onClick={() => void transition('active')}><Play/>Activer</button> : <button type="button" disabled={!canManage || busy} onClick={() => void transition('paused')}><Pause/>Suspendre</button>}</footer></aside>
    </section>
    <section className={styles.testBench}><header><div><span>PUBLIC ENGINE TEST BENCH</span><h2>Tester l’impact réel avant de quitter l’Admin</h2><p>Cette commande appelle le même endpoint de recherche que le Marketplace public. Aucun résultat n’est simulé.</p></div><Link href={`/angelcare-marketplace/${testLocale}/marketplace/search?q=${encodeURIComponent(testQuery)}`} target="_blank">Vue publique<ExternalLink/></Link></header><div className={styles.testControls}><label><Search/><input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} placeholder="Requête publique exacte…" onKeyDown={(event) => { if (event.key === 'Enter') void runTest() }}/></label><select value={testLocale} onChange={(event) => setTestLocale(event.target.value)}><option>fr</option><option>en</option><option>ar</option></select><button type="button" disabled={testBusy || !testQuery.trim()} onClick={() => void runTest()}><FlaskConical/>{testBusy ? 'Test…' : 'Exécuter le test réel'}</button><button type="button" onClick={() => { setTestQuery(''); setTestResult(null) }}><RotateCcw/>Réinitialiser</button></div>{testResult ? <div className={styles.testResult}><aside><strong>{testResult.items.length} / {testResult.total}</strong><span>résultats retournés</span><dl><div><dt>Règles actives exactes</dt><dd>{matchingTestRules.length}</dd></div><div><dt>Expansion</dt><dd>{matchingTestRules.filter((rule) => ['synonym','alias'].includes(rule.rule_type)).map((rule) => rule.replacement_query).filter(Boolean).join(', ') || 'Aucune'}</dd></div><div><dt>Présentation</dt><dd>{matchingTestRules.filter((rule) => ['suggestion','banner','empty_result'].includes(rule.rule_type)).map((rule) => rule.rule_type).join(', ') || 'Aucune'}</dd></div></dl></aside><div className={styles.results}>{testResult.items.map((item) => <article key={item.id}><span>{item.kind} · {item.availability_status}</span><strong>{item.name}</strong><small>{item.public_reference} · {item.category_title || item.category_key || 'sans catégorie'}</small><b>{item.price_amount == null ? item.price_mode : `${item.price_amount.toLocaleString('fr-FR')} ${item.currency_label}`}</b></article>)}{!testResult.items.length ? <div className={styles.empty}>Aucun produit. Les règles recovery/bannière correspondantes sont affichées dans le diagnostic.</div> : null}</div></div> : <div className={styles.testEmpty}>Saisissez une requête pour contrôler expansion, ordre et résultat public.</div>}</section>
  </main>
}
