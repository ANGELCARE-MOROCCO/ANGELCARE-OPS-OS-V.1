import { Activity, ArrowUpRight, BadgeDollarSign, Building2, CircleDollarSign, HeartHandshake, Radar, ShieldCheck, Sparkles, TrendingUp, UsersRound } from 'lucide-react'
import GrowthOperatingSystem from '@/components/angelcare360/operator/growth/GrowthOperatingSystem'
import type { GrowthMode, GrowthWorkspaceSnapshot } from '@/types/angelcare360/operator/growth'
import styles from './GrowthSovereignTakeoff.module.css'

export default function GrowthSovereignTakeoff({
  snapshot,
  initialMode,
}: {
  snapshot: GrowthWorkspaceSnapshot
  initialMode: GrowthMode
}) {
  const activeClients = snapshot.clients.filter((item) => !['archived', 'inactive'].includes(String(item.status || ''))).length
  const openDeals = snapshot.opportunities.filter((item) => !['won', 'lost', 'archived'].includes(String(item.stage || '')))
  const pipelineValue = openDeals.reduce((sum, item) => sum + Number(item.expected_arr_mad || 0), 0)
  const openCases = snapshot.cases.filter((item) => !['resolved', 'closed', 'archived'].includes(String(item.status || ''))).length
  const renewalPressure = snapshot.renewals.filter((item) => !['renewed', 'won', 'closed', 'archived'].includes(String(item.status || ''))).length
  const activeTenants = snapshot.tenants.filter((item) => String(item.status || '') === 'active').length
  const acceptedOffers = snapshot.offers.filter((item) => ['accepted', 'converted', 'approved'].includes(String(item.status || ''))).length

  const signals = [
    { icon: CircleDollarSign, label: 'Pipeline contrôlé', value: money(pipelineValue), note: `${openDeals.length} opportunité(s) actives`, tone: 'blue' },
    { icon: Building2, label: 'Portefeuille vivant', value: String(activeClients), note: `${activeTenants} tenant(s) opérationnels`, tone: 'green' },
    { icon: HeartHandshake, label: 'Rétention sous contrôle', value: String(renewalPressure), note: 'renewals / expansions à piloter', tone: 'amber' },
    { icon: ShieldCheck, label: 'Pression relationnelle', value: String(openCases), note: 'cas ouverts à sécuriser', tone: openCases > 0 ? 'red' : 'green' },
  ] as const

  return (
    <div className={styles.takeoff}>
      <section className={styles.sovereignCrown}>
        <div className={styles.crownGrid} aria-hidden="true" />
        <div className={styles.crownGlow} aria-hidden="true" />
        <div className={styles.identityPlane}>
          <div className={styles.eyebrow}><Sparkles size={14} /> AngelCare 360 · Customer & Growth Sovereign OS</div>
          <h1>Revenue Relationship Command Universe</h1>
          <p>
            Une architecture commerciale et client de très haut niveau qui relie marché, comptes, influence,
            opportunités, offres, contrats, activation, expérience, renouvellement et expansion dans un seul flux souverain.
          </p>
          <div className={styles.authorityStrip}>
            <span><Radar size={15} /> Snapshot opérationnel consolidé</span>
            <span><Activity size={15} /> 8 scènes live profondément actionnables</span>
            <span><BadgeDollarSign size={15} /> Valeur, marge, risque et décisions reliés</span>
          </div>
        </div>

        <div className={styles.signalMatrix}>
          {signals.map(({ icon: Icon, label, value, note, tone }) => (
            <article key={label} data-tone={tone}>
              <div><Icon size={18} /></div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </div>

        <div className={styles.liveValueRail}>
          <div>
            <span>Offres approuvées / acceptées</span>
            <strong>{acceptedOffers}</strong>
          </div>
          <div>
            <span>Couverture contacts</span>
            <strong>{snapshot.contacts.length}</strong>
          </div>
          <div>
            <span>Institutions cartographiées</span>
            <strong>{snapshot.institutions.length}</strong>
          </div>
          <div>
            <span>Expansion détectée</span>
            <strong>{snapshot.expansion.length}</strong>
          </div>
          <div className={styles.takeoffStatus}>
            <TrendingUp size={17} />
            <div><span>Takeoff status</span><strong>Operational excellence</strong></div>
            <ArrowUpRight size={17} />
          </div>
        </div>
      </section>

      <div className={styles.operatingStage}>
        <GrowthOperatingSystem snapshot={snapshot} initialMode={initialMode} />
      </div>
    </div>
  )
}

function money(value: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value) + ' Dh'
}
