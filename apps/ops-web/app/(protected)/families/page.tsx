import Link from 'next/link'
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Building2,
  CalendarClock,
  FileText,
  Grid2X2,
  HeartHandshake,
  List,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/auth/permissions'
import { requireUser } from '@/lib/auth/session'
import {
  BrandLockup,
  ContinuityItem,
  EmptyState,
  Eyebrow,
  HeroMetric,
  KpiCard,
  LocationLine,
  ManagerAlert,
  MetaBox,
  Monogram,
  StatusBadge,
  formatDate,
  isActiveStatus,
  isSensitiveStatus,
  normalize,
  statusTone,
  text,
} from './_components/FamilyUi'
import styles from './_components/families-sanila.module.css'

type Family = Record<string, any>
type Related = Record<string, any>

type SearchParams = {
  q?: string
  city?: string
  status?: string
  segment?: string
  focus?: string
  view?: string
}

function getFamilyState(family: Family, missions: Related[], contracts: Related[], leads: Related[]) {
  const familyId = Number(family.id)
  const familyMissions = missions.filter((item) => Number(item.family_id) === familyId)
  const familyContracts = contracts.filter((item) => Number(item.family_id) === familyId)
  const familyLeads = leads.filter((item) => Number(item.family_id) === familyId)
  const activeMissions = familyMissions.filter((item) => isActiveStatus(item.status))
  const activeContracts = familyContracts.filter((item) => isActiveStatus(item.status) || ['signed', 'active'].includes(normalize(item.status)))
  const latestActivity = [
    ...familyMissions.map((item) => item.updated_at || item.created_at || item.mission_date),
    ...familyContracts.map((item) => item.updated_at || item.created_at || item.start_date),
    ...familyLeads.map((item) => item.updated_at || item.created_at),
    family.updated_at,
    family.created_at,
  ].filter(Boolean).sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0]

  return { familyMissions, familyContracts, familyLeads, activeMissions, activeContracts, latestActivity }
}

export default async function FamiliesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = await searchParams
  const q = (sp?.q || '').trim()
  const city = (sp?.city || '').trim()
  const status = (sp?.status || '').trim()
  const segment = (sp?.segment || '').trim()
  const focus = (sp?.focus || 'all').trim()
  const view = sp?.view === 'table' ? 'table' : 'cards'

  const [supabase, user] = await Promise.all([createClient(), requireUser()])

  let query = supabase.from('families').select('*').eq('is_archived', false).order('id', { ascending: false })
  if (city) query = query.eq('city', city)
  if (status) query = query.eq('status', status)
  if (segment) query = query.eq('family_segment', segment)
  if (q) query = query.or(`family_name.ilike.%${q}%,parent_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,zone.ilike.%${q}%`)

  const [filteredRes, allRes, missionsRes, contractsRes, leadsRes] = await Promise.all([
    query,
    supabase.from('families').select('*').eq('is_archived', false),
    supabase.from('missions').select('*').order('id', { ascending: false }).limit(2000),
    supabase.from('contracts').select('*').order('id', { ascending: false }).limit(1200),
    supabase.from('leads').select('*').order('id', { ascending: false }).limit(1600),
  ])

  const all = (allRes.data || []) as Family[]
  const missions = (missionsRes.data || []) as Related[]
  const contracts = (contractsRes.data || []) as Related[]
  const leads = (leadsRes.data || []) as Related[]
  const baseFamilies = (filteredRes.data || []) as Family[]
  const today = Date.now()

  const familyStates = new Map<number, ReturnType<typeof getFamilyState>>()
  all.forEach((family) => familyStates.set(Number(family.id), getFamilyState(family, missions, contracts, leads)))

  const focusedFamilies = baseFamilies.filter((family) => {
    const state = familyStates.get(Number(family.id)) || getFamilyState(family, missions, contracts, leads)
    if (focus === 'active') return normalize(family.status) === 'active'
    if (focus === 'priority') return ['high', 'urgent', 'critical', 'haute'].some((token) => normalize(family.priority).includes(token))
    if (focus === 'risk') return isSensitiveStatus(family.risk_level)
    if (focus === 'no-mission') return state.activeMissions.length === 0
    if (focus === 'special') return Boolean(String(family.special_needs || '').trim())
    if (focus === 'vip') return normalize(family.family_segment || family.status).includes('vip')
    if (focus === 'review') return Boolean(family.next_review_at && new Date(family.next_review_at).getTime() <= today)
    return true
  })

  const active = all.filter((family) => normalize(family.status) === 'active').length
  const vip = all.filter((family) => normalize(family.family_segment || family.status).includes('vip')).length
  const risk = all.filter((family) => isSensitiveStatus(family.risk_level)).length
  const children = all.reduce((sum, family) => sum + Number(family.children_count || 0), 0)
  const pendingReview = all.filter((family) => family.next_review_at && new Date(family.next_review_at).getTime() <= today).length
  const noMission = all.filter((family) => (familyStates.get(Number(family.id))?.activeMissions.length || 0) === 0).length
  const activeContracts = all.filter((family) => (familyStates.get(Number(family.id))?.activeContracts.length || 0) > 0).length
  const specialNeeds = all.filter((family) => String(family.special_needs || '').trim()).length

  const cities = Array.from(new Set(all.map((family) => family.city).filter(Boolean))).sort() as string[]
  const segments = Array.from(new Set(all.map((family) => family.family_segment).filter(Boolean))).sort() as string[]

  const canCreate = hasPermission(user, 'families.create') || hasPermission(user, 'families.view')
  const canEdit = hasPermission(user, 'families.edit') || hasPermission(user, 'families.view')

  const focusLinks = [
    ['all', 'Toutes', all.length],
    ['active', 'Actives', active],
    ['priority', 'Prioritaires', all.filter((family) => ['high', 'urgent', 'critical', 'haute'].some((token) => normalize(family.priority).includes(token))).length],
    ['risk', 'À risque', risk],
    ['no-mission', 'Sans mission', noMission],
    ['special', 'Besoins spécifiques', specialNeeds],
    ['vip', 'VIP', vip],
    ['review', 'À revoir', pendingReview],
  ] as const

  return (
    <AppShell
      title="Families 360°"
      subtitle="Household Relationship, Care Delivery & Trust Command"
      breadcrumbs={[{ label: 'Families 360°' }]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <BrandLockup />
            <Eyebrow>Household Relationship Command</Eyebrow>
            <h1 className={styles.heroTitle}>Chaque famille devient une relation suivie, comprise et opérationnellement protégée.</h1>
            <p className={styles.heroText}>
              Une vue consolidée des foyers, besoins enfants, parcours commercial, contrats et continuité de mission—sans dissocier la confiance client de l’exécution terrain.
            </p>
            <div className={styles.actionRow} style={{ marginTop: 24 }}>
              {canCreate ? <Link href="/families/new" className={styles.primaryButton}><Plus size={16} />Nouvelle famille</Link> : null}
              <Link href="/families/intelligence" className={styles.secondaryButton}><Sparkles size={16} />Centre d’intelligence</Link>
              <Link href="/admin/archive-center" className={styles.softButton}><Archive size={16} />Archives</Link>
              <Link href="/families" className={styles.softButton}><RefreshCcw size={16} />Actualiser</Link>
            </div>
          </div>
          <div className={styles.heroSide}>
            <HeroMetric type="families" value={all.length} label="foyers actifs dans le portefeuille" />
            <HeroMetric type="trust" value={activeContracts} label="familles avec contrat actif" />
            <HeroMetric type="review" value={pendingReview} label="revues relationnelles dues" />
          </div>
        </section>

        <section className={styles.kpiGrid}>
          <KpiCard label="Familles actives" value={active} sub={`${all.length} foyers non archivés`} tone="green" />
          <KpiCard label="À risque" value={risk} sub="vigilance managériale" tone={risk ? 'red' : 'green'} />
          <KpiCard label="Sans mission active" value={noMission} sub="continuité à confirmer" tone={noMission ? 'amber' : 'green'} />
          <KpiCard label="Besoins spécifiques" value={specialNeeds} sub="briefing renforcé" tone="blue" />
          <KpiCard label="Contrats actifs" value={activeContracts} sub="relation contractualisée" tone="green" />
          <KpiCard label="Enfants suivis" value={children} sub="population déclarée" tone="violet" />
        </section>

        <section className={styles.lifecycle} aria-label="Lecture du cycle relationnel familles">
          <div className={styles.lifecycleStep}><strong>{leads.length}</strong>Prospects & leads</div>
          <div className={styles.lifecycleStep}><strong>{all.length}</strong>Foyers qualifiés</div>
          <div className={styles.lifecycleStep}><strong>{contracts.length}</strong>Contrats liés</div>
          <div className={styles.lifecycleStep}><strong>{activeContracts}</strong>Services activés</div>
          <div className={styles.lifecycleStep}><strong>{missions.filter((item) => isActiveStatus(item.status)).length}</strong>Missions actives</div>
          <div className={styles.lifecycleStep}><strong>{risk}</strong>À surveiller</div>
          <div className={styles.lifecycleStep}><strong>{pendingReview}</strong>Revues dues</div>
        </section>

        <nav className={styles.segmentNav} aria-label="Segments du portefeuille familles">
          {focusLinks.map(([key, label, count]) => {
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (city) params.set('city', city)
            if (status) params.set('status', status)
            if (segment) params.set('segment', segment)
            params.set('focus', key)
            params.set('view', view)
            return <Link key={key} href={`/families?${params.toString()}`} className={`${styles.segmentLink} ${focus === key ? styles.segmentActive : ''}`}>{label}<span>{count}</span></Link>
          })}
        </nav>

        <form className={styles.commandBar}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 13, top: 14, color: '#718299' }} />
            <input name="q" defaultValue={q} placeholder="Famille, parent, téléphone, ville ou zone…" className={styles.input} style={{ paddingLeft: 38 }} />
          </div>
          <select name="city" defaultValue={city} className={styles.select}><option value="">Toutes les villes</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select name="status" defaultValue={status} className={styles.select}><option value="">Tous les statuts</option><option value="active">Active</option><option value="pending">En attente</option><option value="inactive">Inactive</option><option value="vip">VIP</option></select>
          <select name="segment" defaultValue={segment} className={styles.select}><option value="">Tous les segments</option>{segments.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <input type="hidden" name="focus" value={focus} />
          <input type="hidden" name="view" value={view} />
          <button className={styles.primaryButton} type="submit">Appliquer</button>
        </form>

        {filteredRes.error ? <div className={styles.error}>Impossible de charger le portefeuille : {filteredRes.error.message}</div> : null}

        <div className={styles.contentWithRail}>
          <main style={{ minWidth: 0, display: 'grid', gap: 14 }}>
            <div className={styles.actionRow} style={{ justifyContent: 'space-between' }}>
              <div style={{ color: '#5f748c', fontSize: 12, fontWeight: 800 }}>{focusedFamilies.length} résultat(s) · filtre « {focusLinks.find(([key]) => key === focus)?.[1] || 'Toutes'} »</div>
              <div className={styles.actionRow}>
                <Link href={buildViewHref(sp, 'cards')} className={view === 'cards' ? styles.primaryButton : styles.secondaryButton}><Grid2X2 size={15} />Cartes</Link>
                <Link href={buildViewHref(sp, 'table')} className={view === 'table' ? styles.primaryButton : styles.secondaryButton}><List size={15} />Tableau</Link>
              </div>
            </div>

            {view === 'cards' ? (
              <section className={styles.cardGrid}>
                {focusedFamilies.map((family) => {
                  const state = familyStates.get(Number(family.id)) || getFamilyState(family, missions, contracts, leads)
                  const riskTone = isSensitiveStatus(family.risk_level) ? 'red' : statusTone(family.status)
                  return (
                    <article key={family.id} className={styles.familyCard}>
                      <div className={styles.cardHeader}>
                        <Monogram familyName={family.family_name} parentName={family.parent_name} />
                        <div className={styles.cardIdentity}>
                          <h3>{text(family.family_name, text(family.parent_name, `Famille #${family.id}`))}</h3>
                          <p>{text(family.parent_name, 'Parent principal à compléter')}</p>
                        </div>
                        <StatusBadge value={family.risk_level || family.status} tone={riskTone} />
                      </div>

                      <div className={styles.cardMeta}>
                        <MetaBox label="Localisation" value={<LocationLine city={family.city} zone={family.zone} />} />
                        <MetaBox label="Enfants" value={`${Number(family.children_count || 0)} · ${text(family.children_ages, 'âges non saisis')}`} />
                        <MetaBox label="Service" value={text(family.service_preferences, 'À qualifier')} />
                        <MetaBox label="Prochaine revue" value={formatDate(family.next_review_at)} />
                      </div>

                      <div className={styles.continuityRow}>
                        <ContinuityItem label="Leads" value={state.familyLeads.length} tone={state.familyLeads.length ? 'blue' : 'slate'} />
                        <ContinuityItem label="Contrat" value={state.activeContracts.length ? 'Actif' : state.familyContracts.length ? 'Historique' : 'Absent'} tone={state.activeContracts.length ? 'green' : state.familyContracts.length ? 'amber' : 'slate'} />
                        <ContinuityItem label="Mission" value={state.activeMissions.length ? `${state.activeMissions.length} active(s)` : 'Aucune'} tone={state.activeMissions.length ? 'green' : 'amber'} />
                        <ContinuityItem label="Activité" value={formatDate(state.latestActivity)} tone="slate" />
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.actionRow}>
                          <Link href={`/families/${family.id}`} className={styles.primaryButton}>Ouvrir le dossier<ArrowRight size={15} /></Link>
                          {canEdit ? <Link href={`/families/edit/${family.id}`} className={styles.secondaryButton}>Modifier</Link> : null}
                        </div>
                        <Link href={`/missions/new?family_id=${family.id}`} className={styles.inlineAction}>Mission<Plus size={14} /></Link>
                      </div>
                    </article>
                  )
                })}
              </section>
            ) : (
              <section className={styles.tablePanel}>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead><tr><th>Famille</th><th>Parent</th><th>Localisation</th><th>Enfants</th><th>Statut</th><th>Risque</th><th>Missions</th><th>Contrat</th><th>Revue</th><th>Actions</th></tr></thead>
                    <tbody>
                      {focusedFamilies.map((family) => {
                        const state = familyStates.get(Number(family.id)) || getFamilyState(family, missions, contracts, leads)
                        return <tr key={family.id}><td><strong>{text(family.family_name, `Famille #${family.id}`)}</strong></td><td>{text(family.parent_name)}</td><td>{[text(family.city, ''), text(family.zone, '')].filter(Boolean).join(' · ') || '—'}</td><td>{Number(family.children_count || 0)}</td><td><StatusBadge value={family.status} /></td><td><StatusBadge value={family.risk_level || 'normal'} tone={isSensitiveStatus(family.risk_level) ? 'red' : 'green'} /></td><td>{state.activeMissions.length} active(s)</td><td>{state.activeContracts.length ? 'Actif' : state.familyContracts.length ? 'Historique' : 'Absent'}</td><td>{formatDate(family.next_review_at)}</td><td><Link href={`/families/${family.id}`} className={styles.inlineAction}>Ouvrir<ArrowRight size={14} /></Link></td></tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!focusedFamilies.length ? <EmptyState title="Aucune famille dans cette vue" text="Aucun dossier ne correspond aux critères actuels. Réinitialisez les filtres ou créez une nouvelle famille." action={<Link href="/families" className={styles.secondaryButton}>Réinitialiser</Link>} /> : null}
          </main>

          <aside className={styles.rail}>
            <section className={styles.railPanel}>
              <h2 className={styles.railTitle}>Priorités managériales</h2>
              <div className={styles.alertList} style={{ marginTop: 13 }}>
                {risk ? <ManagerAlert title={`${risk} famille(s) à risque`} text="Ouvrez le Centre d’intelligence pour comprendre les causes et prioriser l’intervention." tone="red" /> : <ManagerAlert title="Portefeuille sans risque critique" text="Aucun niveau high, critical ou urgent n’est actuellement déclaré." tone="green" />}
                {noMission ? <ManagerAlert title={`${noMission} famille(s) sans mission active`} text="Vérifiez les foyers récemment convertis, en attente ou sans activation opérationnelle." tone="amber" /> : null}
                {pendingReview ? <ManagerAlert title={`${pendingReview} revue(s) due(s)`} text="Les prochaines revues sont arrivées à échéance ou sont en retard." tone="amber" /> : null}
                {specialNeeds ? <ManagerAlert title={`${specialNeeds} contexte(s) spécifiques`} text="Préparez le matching et le briefing avec une attention renforcée à la confidentialité." tone="blue" /> : null}
              </div>
              <Link href="/families/intelligence" className={styles.secondaryButton} style={{ marginTop: 14, width: '100%' }}>Ouvrir l’intelligence<ArrowRight size={15} /></Link>
            </section>

            <section className={styles.railPanel}>
              <h2 className={styles.railTitle}>Portefeuille relationnel</h2>
              <div className={styles.miniStats} style={{ marginTop: 13 }}>
                <MetaBox label="VIP" value={vip} />
                <MetaBox label="Contrats" value={activeContracts} />
                <MetaBox label="Leads" value={leads.length} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function buildViewHref(sp: SearchParams | undefined, view: 'cards' | 'table') {
  const params = new URLSearchParams()
  Object.entries(sp || {}).forEach(([key, value]) => { if (value) params.set(key, value) })
  params.set('view', view)
  return `/families?${params.toString()}`
}
