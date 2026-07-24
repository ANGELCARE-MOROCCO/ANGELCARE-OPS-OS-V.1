import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  FileText,
  HeartHandshake,
  Route,
  ShieldAlert,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import {
  BrandLockup,
  EmptyState,
  Eyebrow,
  HeroMetric,
  KpiCard,
  StatusBadge,
  formatDate,
  isActiveStatus,
  isSensitiveStatus,
  normalize,
  text,
} from '../_components/FamilyUi'
import styles from '../_components/families-sanila.module.css'

type Row = Record<string, any>

function linkedToFamily(rows: Row[], familyId: unknown) {
  return rows.filter((row) => Number(row.family_id) === Number(familyId))
}

export default async function FamiliesIntelligencePage() {
  const supabase = await createClient()
  const [familiesRes, missionsRes, leadsRes, contractsRes, incidentsRes] = await Promise.all([
    supabase.from('families').select('*').eq('is_archived', false),
    supabase.from('missions').select('*').order('id', { ascending: false }).limit(2000),
    supabase.from('leads').select('*').order('id', { ascending: false }).limit(1600),
    supabase.from('contracts').select('*').order('id', { ascending: false }).limit(1200),
    supabase.from('incidents').select('*').order('id', { ascending: false }).limit(1200),
  ])

  const families = (familiesRes.data || []) as Row[]
  const missions = (missionsRes.data || []) as Row[]
  const leads = (leadsRes.data || []) as Row[]
  const contracts = (contractsRes.data || []) as Row[]
  const incidents = (incidentsRes.data || []) as Row[]
  const now = Date.now()

  const riskFamilies = families.filter((family) => isSensitiveStatus(family.risk_level))
  const vipFamilies = families.filter((family) => normalize(family.family_segment || family.status).includes('vip'))
  const specialNeeds = families.filter((family) => String(family.special_needs || '').trim())
  const withoutMission = families.filter((family) => !linkedToFamily(missions, family.id).some((mission) => isActiveStatus(mission.status)))
  const reviewDue = families.filter((family) => family.next_review_at && new Date(family.next_review_at).getTime() <= now)
  const openIncidentFamilies = families.filter((family) => linkedToFamily(incidents, family.id).some((incident) => !['closed', 'resolved', 'completed'].includes(normalize(incident.status))))
  const contractWithoutMission = families.filter((family) => {
    const hasActiveContract = linkedToFamily(contracts, family.id).some((contract) => isActiveStatus(contract.status) || ['signed', 'active'].includes(normalize(contract.status)))
    const hasActiveMission = linkedToFamily(missions, family.id).some((mission) => isActiveStatus(mission.status))
    return hasActiveContract && !hasActiveMission
  })
  const convertedWithoutActivation = families.filter((family) => {
    const familyLeads = linkedToFamily(leads, family.id)
    const converted = familyLeads.some((lead) => ['converted', 'won', 'qualified'].includes(normalize(lead.status)))
    const hasActiveMission = linkedToFamily(missions, family.id).some((mission) => isActiveStatus(mission.status))
    return converted && !hasActiveMission
  })

  const portfolioAlerts = new Set([...riskFamilies, ...withoutMission, ...reviewDue, ...openIncidentFamilies].map((family) => family.id)).size

  return (
    <AppShell
      title="Families Intelligence"
      subtitle="Risk, Care Continuity & Relationship Priority Command"
      breadcrumbs={[{ label: 'Families 360°', href: '/families' }, { label: 'Intelligence' }]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <BrandLockup />
            <Eyebrow>Family Portfolio Intelligence Center</Eyebrow>
            <h1 className={styles.heroTitle}>Transformer les signaux dispersés en priorités relationnelles claires.</h1>
            <p className={styles.heroText}>
              Une lecture fondée sur les champs et relations existants : risque déclaré, mission active, contrat, incident, besoins spécifiques et échéance de revue.
            </p>
            <div className={styles.actionRow} style={{ marginTop: 24 }}>
              <Link href="/families" className={styles.primaryButton}><ArrowLeft size={16} />Retour au portefeuille</Link>
              <Link href="/families/new" className={styles.secondaryButton}><UsersRound size={16} />Nouvelle famille</Link>
            </div>
          </div>
          <div className={styles.heroSide}>
            <HeroMetric type="families" value={families.length} label="foyers analysés" />
            <HeroMetric type="trust" value={portfolioAlerts} label="dossiers avec signal d’attention" />
            <HeroMetric type="review" value={reviewDue.length} label="revues arrivées à échéance" />
          </div>
        </section>

        <section className={styles.kpiGrid}>
          <KpiCard label="À risque" value={riskFamilies.length} sub="high, critical ou urgent" tone={riskFamilies.length ? 'red' : 'green'} />
          <KpiCard label="Sans mission active" value={withoutMission.length} sub="continuité à confirmer" tone={withoutMission.length ? 'amber' : 'green'} />
          <KpiCard label="Contrat sans mission" value={contractWithoutMission.length} sub="écart d’activation" tone={contractWithoutMission.length ? 'red' : 'green'} />
          <KpiCard label="Incidents ouverts" value={openIncidentFamilies.length} sub="familles concernées" tone={openIncidentFamilies.length ? 'red' : 'green'} />
          <KpiCard label="Besoins spécifiques" value={specialNeeds.length} sub="matching renforcé" tone="blue" />
          <KpiCard label="VIP / Premium" value={vipFamilies.length} sub="relation stratégique" tone="violet" />
        </section>

        <section className={styles.boardsGrid}>
          <IntelligenceBoard
            title="Risk Watch"
            text="Familles avec un niveau de risque explicitement sensible."
            icon={<ShieldAlert size={19} />}
            items={riskFamilies}
            reason={(family) => `Risque déclaré : ${text(family.risk_level)}`}
            empty="Aucune famille n’est actuellement classée high, critical ou urgent."
          />
          <IntelligenceBoard
            title="Continuité non activée"
            text="Familles sans mission active malgré une relation enregistrée."
            icon={<Route size={19} />}
            items={withoutMission}
            reason={(family) => linkedToFamily(contracts, family.id).some((contract) => isActiveStatus(contract.status)) ? 'Contrat présent · mission absente' : linkedToFamily(leads, family.id).length ? 'Lead présent · mission absente' : 'Aucune mission active'}
            empty="Toutes les familles disposent d’au moins une mission active."
          />
          <IntelligenceBoard
            title="Revues dues"
            text="Échéances relationnelles arrivées ou dépassées."
            icon={<CalendarClock size={19} />}
            items={reviewDue}
            reason={(family) => `Échéance : ${formatDate(family.next_review_at)}`}
            empty="Aucune revue relationnelle n’est actuellement due."
          />
          <IntelligenceBoard
            title="Incidents & protection"
            text="Familles avec au moins un incident encore ouvert."
            icon={<AlertTriangle size={19} />}
            items={openIncidentFamilies}
            reason={(family) => `${linkedToFamily(incidents, family.id).filter((incident) => !['closed', 'resolved', 'completed'].includes(normalize(incident.status))).length} incident(s) ouvert(s)`}
            empty="Aucun incident ouvert n’est rattaché au portefeuille."
          />
          <IntelligenceBoard
            title="Attention spécifique"
            text="Besoins particuliers nécessitant un briefing proportionné et confidentiel."
            icon={<HeartHandshake size={19} />}
            items={specialNeeds}
            reason={(family) => text(family.special_needs, 'Contexte spécifique')}
            empty="Aucun besoin spécifique n’est documenté."
          />
          <IntelligenceBoard
            title="VIP & relations stratégiques"
            text="Familles identifiées comme VIP ou Premium."
            icon={<Star size={19} />}
            items={vipFamilies}
            reason={(family) => `${text(family.family_segment || family.status)} · ${linkedToFamily(missions, family.id).filter((mission) => isActiveStatus(mission.status)).length} mission(s) active(s)`}
            empty="Aucune relation VIP ou Premium n’est actuellement identifiée."
          />
          <IntelligenceBoard
            title="Conversion sans activation"
            text="Leads qualifiés ou convertis sans mission active visible."
            icon={<Sparkles size={19} />}
            items={convertedWithoutActivation}
            reason={(family) => `${linkedToFamily(leads, family.id).length} lead(s) · aucune mission active`}
            empty="Aucun écart conversion → activation n’est détecté."
          />
          <IntelligenceBoard
            title="Contrat sans exécution"
            text="Contrat actif sans mission active actuellement chargée."
            icon={<FileText size={19} />}
            items={contractWithoutMission}
            reason={(family) => `${linkedToFamily(contracts, family.id).filter((contract) => isActiveStatus(contract.status) || ['signed', 'active'].includes(normalize(contract.status))).length} contrat(s) actif(s)`}
            empty="Tous les contrats actifs disposent d’une mission active visible."
          />
        </section>
      </div>
    </AppShell>
  )
}

function IntelligenceBoard({ title, text: description, icon, items, reason, empty }: { title: string; text: string; icon: ReactNode; items: Row[]; reason: (family: Row) => string; empty: string }) {
  return (
    <section className={styles.board}>
      <div className={styles.boardHeader}>
        <div><h2 className={styles.boardTitle}>{title}</h2><p className={styles.boardText}>{description}</p></div>
        <span className={styles.iconTile} style={{ width: 40, height: 40, borderRadius: 13 }}>{icon}</span>
      </div>
      <div className={styles.boardItems}>
        {items.slice(0, 12).map((family) => (
          <Link key={family.id} href={`/families/${family.id}`} className={styles.boardItem}>
            <div>
              <h3>{text(family.family_name, text(family.parent_name, `Famille #${family.id}`))}</h3>
              <p>{text(family.parent_name)} · {[text(family.city, ''), text(family.zone, '')].filter(Boolean).join(' · ') || 'Localisation non renseignée'}</p>
              <div className={styles.passportTags} style={{ marginTop: 8 }}><StatusBadge value={family.status} /><StatusBadge value={family.risk_level || 'normal'} tone={isSensitiveStatus(family.risk_level) ? 'red' : 'green'} /></div>
            </div>
            <div className={styles.boardReason}>{reason(family)}<ArrowRight size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></div>
          </Link>
        ))}
        {!items.length ? <EmptyState title="Aucun dossier dans cette lane" text={empty} /> : null}
      </div>
    </section>
  )
}
