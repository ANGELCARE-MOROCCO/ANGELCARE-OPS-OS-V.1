'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartHandshake,
  History,
  House,
  MapPin,
  MessageSquareText,
  Pencil,
  Phone,
  Route,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { archiveFamily } from '../archive-action'
import {
  BrandLockup,
  ContinuityItem,
  EmptyState,
  Eyebrow,
  InfoBox,
  KpiCard,
  ManagerAlert,
  Monogram,
  PanelHeader,
  RelatedItem,
  StatusBadge,
  formatDate,
  isActiveStatus,
  isSensitiveStatus,
  normalize,
  statusTone,
  text,
} from './FamilyUi'
import styles from './families-sanila.module.css'

type RecordRow = Record<string, any>

type DossierData = {
  family: RecordRow
  leads: RecordRow[]
  missions: RecordRow[]
  notes: RecordRow[]
  contracts: RecordRow[]
  incidents: RecordRow[]
}

const tabs = [
  { key: 'overview', label: 'Vue d’ensemble', icon: House },
  { key: 'needs', label: 'Famille & besoins', icon: UsersRound },
  { key: 'commercial', label: 'Parcours commercial', icon: BriefcaseBusiness },
  { key: 'contracts', label: 'Contrats', icon: FileText },
  { key: 'missions', label: 'Missions', icon: Route },
  { key: 'incidents', label: 'Incidents', icon: Siren },
  { key: 'notes', label: 'Notes & historique', icon: History },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function FamilyDossierNavigator({ data, canEdit = true, canArchive = true }: { data: DossierData; canEdit?: boolean; canArchive?: boolean }) {
  const { family, leads, missions, notes, contracts, incidents } = data
  const [tab, setTab] = useState<TabKey>('overview')

  const activeMissions = missions.filter((mission) => isActiveStatus(mission.status))
  const sensitiveMissions = missions.filter((mission) => isSensitiveStatus(mission.status))
  const activeContracts = contracts.filter((contract) => isActiveStatus(contract.status) || ['signed', 'active'].includes(normalize(contract.status)))
  const openIncidents = incidents.filter((incident) => !['closed', 'resolved', 'completed'].includes(normalize(incident.status)))
  const risk = family.risk_level || (openIncidents.length || sensitiveMissions.length ? 'high' : 'normal')
  const overdueReview = Boolean(family.next_review_at && new Date(family.next_review_at).getTime() < Date.now())

  const managerAction = useMemo(() => {
    if (family.is_archived) return 'Examiner la restauration avant toute nouvelle activation.'
    if (openIncidents.some((incident) => isSensitiveStatus(incident.severity || incident.priority || incident.status))) return 'Traiter l’incident prioritaire et sécuriser la continuité de service.'
    if (overdueReview) return 'Réaliser la revue relationnelle en retard.'
    if (!activeContracts.length && leads.length) return 'Qualifier la prochaine étape contractuelle.'
    if (!activeMissions.length) return 'Confirmer le besoin et proposer une mission adaptée.'
    return 'Maintenir le suivi qualité et préparer la prochaine revue.'
  }, [activeContracts.length, activeMissions.length, family.is_archived, leads.length, openIncidents, overdueReview])

  const timeline = useMemo(() => {
    const entries: Array<{ id: string; date: string | null; title: string; detail: string }> = []
    if (family.created_at) entries.push({ id: `family-${family.id}`, date: family.created_at, title: 'Dossier famille créé', detail: text(family.source, 'Source non renseignée') })
    leads.forEach((lead) => entries.push({ id: `lead-${lead.id}`, date: lead.created_at || lead.updated_at || null, title: `Lead #${lead.id}`, detail: `${text(lead.status, 'Statut inconnu')} · ${text(lead.service_interest || lead.service_type || lead.source, 'Parcours commercial')}` }))
    contracts.forEach((contract) => entries.push({ id: `contract-${contract.id}`, date: contract.created_at || contract.start_date || null, title: `Contrat #${contract.id}`, detail: `${text(contract.status)} · ${text(contract.contract_type || contract.service_type, 'Contrat famille')}` }))
    missions.forEach((mission) => entries.push({ id: `mission-${mission.id}`, date: mission.created_at || mission.mission_date || mission.start_date || null, title: `Mission #${mission.id}`, detail: `${text(mission.status)} · ${text(mission.service_type || mission.title, 'Prestation')}` }))
    incidents.forEach((incident) => entries.push({ id: `incident-${incident.id}`, date: incident.created_at || incident.incident_date || null, title: `Incident #${incident.id}`, detail: `${text(incident.status)} · ${text(incident.title || incident.incident_type || incident.severity, 'Incident opérationnel')}` }))
    notes.forEach((note) => entries.push({ id: `note-${note.id}`, date: note.created_at || null, title: text(note.note_type, 'Note relationnelle'), detail: text(note.content || note.note) }))
    return entries.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
  }, [contracts, family, incidents, leads, missions, notes])

  return (
    <div className={styles.page}>
      {family.is_archived ? (
        <div className={styles.warningNotice}><Archive size={19} /><span>Ce dossier est archivé. Les historiques restent visibles, mais toute nouvelle activation doit être précédée d’une restauration depuis le Centre d’archives.</span></div>
      ) : null}

      <section className={styles.dossierHero}>
        <div className={styles.passport}>
          <BrandLockup />
          <div className={styles.passportTop}>
            <Monogram familyName={family.family_name} parentName={family.parent_name} large />
            <div>
              <Eyebrow>Family 360° Executive Dossier</Eyebrow>
              <h1>{text(family.family_name, text(family.parent_name, `Famille #${family.id}`))}</h1>
              <p>{text(family.parent_name, 'Parent principal non renseigné')} · {[text(family.city, ''), text(family.zone, '')].filter(Boolean).join(' · ') || 'Localisation à compléter'}</p>
              <div className={styles.passportTags}>
                <StatusBadge value={family.status} />
                <StatusBadge value={risk} label={`Risque ${text(risk, 'normal')}`} tone={isSensitiveStatus(risk) ? 'red' : 'green'} />
                <span className={styles.trustBadge}>Dossier #{family.id}</span>
                {family.family_segment ? <span className={styles.trustBadge}>{family.family_segment}</span> : null}
              </div>
            </div>
          </div>
          <div className={styles.actionRow} style={{ marginTop: 21 }}>
            {canEdit ? <Link href={`/families/edit/${family.id}`} className={styles.primaryButton}><Pencil size={16} />Modifier le dossier</Link> : null}
            <Link href={`/missions/new?family_id=${family.id}`} className={styles.secondaryButton}><Route size={16} />Créer une mission</Link>
            <Link href="/families" className={styles.softButton}><ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />Portefeuille familles</Link>
          </div>
        </div>

        <aside className={styles.managerBrief}>
          <PanelHeader title="Manager Brief" text="Lecture décisionnelle fondée sur les relations existantes du dossier." />
          <div className={styles.briefGrid}>
            <BriefRow label="État de la relation" value={family.is_archived ? 'Archivée' : text(family.status, 'Active')} />
            <BriefRow label="Contrat" value={activeContracts.length ? `${activeContracts.length} actif(s)` : 'Aucun actif'} />
            <BriefRow label="Missions" value={activeMissions.length ? `${activeMissions.length} active(s)` : 'Aucune active'} />
            <BriefRow label="Commercial" value={leads.length ? `${leads.length} lead(s) lié(s)` : 'Aucun lead lié'} />
            <BriefRow label="Incidents" value={openIncidents.length ? `${openIncidents.length} ouvert(s)` : 'Aucun ouvert'} />
            <BriefRow label="Prochaine revue" value={formatDate(family.next_review_at)} />
            <BriefRow label="Action recommandée" value={managerAction} />
          </div>
        </aside>
      </section>

      <section className={styles.kpiGrid}>
        <KpiCard label="Missions" value={missions.length} sub={`${activeMissions.length} active(s)`} tone={activeMissions.length ? 'green' : 'amber'} />
        <KpiCard label="Leads" value={leads.length} sub="opportunités liées" tone="blue" />
        <KpiCard label="Contrats" value={contracts.length} sub={`${activeContracts.length} actif(s)`} tone={activeContracts.length ? 'green' : 'amber'} />
        <KpiCard label="Incidents" value={incidents.length} sub={`${openIncidents.length} ouvert(s)`} tone={openIncidents.length ? 'red' : 'green'} />
        <KpiCard label="Notes" value={notes.length} sub="mémoire relationnelle" tone="violet" />
        <KpiCard label="Revue" value={overdueReview ? 'En retard' : family.next_review_at ? 'Planifiée' : 'À définir'} sub={formatDate(family.next_review_at)} tone={overdueReview ? 'red' : family.next_review_at ? 'green' : 'amber'} />
      </section>

      <nav className={`${styles.tabNav} ${styles.stickyTabs}`} aria-label="Navigation du dossier famille">
        {tabs.map((item) => {
          const Icon = item.icon
          return <button key={item.key} type="button" className={`${styles.tabButton} ${tab === item.key ? styles.tabActive : ''}`} onClick={() => setTab(item.key)}><Icon size={14} />{item.label}</button>
        })}
      </nav>

      {tab === 'overview' ? (
        <div className={styles.workspaceGrid}>
          <section className={styles.workspacePanel}>
            <PanelHeader title="Continuité de la relation" text="La chaîne commerciale et opérationnelle visible pour cette famille." />
            <div className={styles.continuityRow}>
              <ContinuityItem label="Lead" value={leads.length ? `${leads.length} lié(s)` : 'Absent'} tone={leads.length ? 'blue' : 'slate'} />
              <ContinuityItem label="Contrat" value={activeContracts.length ? 'Actif' : contracts.length ? 'Historique' : 'Absent'} tone={activeContracts.length ? 'green' : contracts.length ? 'amber' : 'slate'} />
              <ContinuityItem label="Mission" value={activeMissions.length ? `${activeMissions.length} active(s)` : 'Aucune active'} tone={activeMissions.length ? 'green' : 'amber'} />
              <ContinuityItem label="Incident" value={openIncidents.length ? `${openIncidents.length} ouvert(s)` : 'Sous contrôle'} tone={openIncidents.length ? 'red' : 'green'} />
            </div>
          </section>

          <section className={styles.workspacePanel}>
            <PanelHeader title="Alertes & priorités" text="Signaux déterministes issus du dossier existant." />
            <div className={styles.alertList}>
              {overdueReview ? <ManagerAlert title="Revue relationnelle en retard" text={`La revue planifiée au ${formatDate(family.next_review_at)} doit être traitée.`} tone="red" /> : null}
              {!activeMissions.length ? <ManagerAlert title="Aucune mission active" text="Le foyer ne dispose pas actuellement d’une prestation active dans l’historique chargé." tone="amber" /> : null}
              {!activeContracts.length ? <ManagerAlert title="Aucun contrat actif" text="Vérifiez si la relation relève d’un prospect, d’une mission ponctuelle ou d’une contractualisation à venir." tone="amber" /> : null}
              {openIncidents.length ? <ManagerAlert title="Incident opérationnel ouvert" text={`${openIncidents.length} incident(s) nécessitent encore une résolution ou une clôture.`} tone="red" /> : null}
              {family.special_needs ? <ManagerAlert title="Besoins spécifiques documentés" text="Consultez le contexte avant tout matching ou briefing de mission." tone="blue" /> : null}
              {!overdueReview && activeMissions.length && !openIncidents.length ? <ManagerAlert title="Continuité opérationnelle stable" text="Une prestation est active et aucun incident ouvert n’est détecté dans les données chargées." tone="green" /> : null}
            </div>
          </section>

          <section className={`${styles.workspacePanel} ${styles.workspaceWide}`}>
            <PanelHeader title="Dernières activités reliées" text="Vue consolidée des derniers éléments du parcours commercial et opérationnel." action={<button type="button" className={styles.inlineAction} onClick={() => setTab('notes')}>Voir l’historique complet<ArrowRight size={14} /></button>} />
            <div className={styles.timeline}>
              {timeline.slice(0, 8).map((entry) => <TimelineItem key={entry.id} entry={entry} />)}
              {!timeline.length ? <EmptyState title="Aucune activité reliée" text="Le dossier ne contient encore aucun lead, contrat, mission, incident ou note dans les sources chargées." /> : null}
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'needs' ? (
        <div className={styles.workspaceGrid}>
          <section className={styles.workspacePanel}>
            <PanelHeader title="Identité du foyer" text="Coordonnées et contexte de résidence enregistrés." />
            <div className={styles.infoGrid}>
              <InfoBox label="Parent principal" value={text(family.parent_name)} />
              <InfoBox label="Téléphone" value={text(family.phone)} />
              <InfoBox label="Téléphone 2" value={text(family.secondary_phone)} />
              <InfoBox label="Source" value={text(family.source)} />
              <InfoBox label="Ville" value={text(family.city)} />
              <InfoBox label="Zone" value={text(family.zone)} />
              <InfoBox label="Adresse" value={text(family.address)} />
              <InfoBox label="Statut" value={text(family.status)} />
            </div>
          </section>
          <section className={styles.workspacePanel}>
            <PanelHeader title="Enfants & prise en charge" text="Informations utiles à la préparation et à la qualité de service." />
            <div className={styles.infoGrid}>
              <InfoBox label="Nombre d’enfants" value={text(family.children_count, '0')} />
              <InfoBox label="Âges" value={text(family.children_ages)} />
              <InfoBox label="Créneaux" value={text(family.preferred_schedule)} />
              <InfoBox label="Préférences" value={text(family.service_preferences)} />
            </div>
            <div className={styles.privacyNotice} style={{ marginTop: 14 }}><ShieldCheck size={18} /><span><strong>Besoins spécifiques :</strong> {text(family.special_needs)}</span></div>
          </section>
          <section className={`${styles.workspacePanel} ${styles.workspaceWide}`}>
            <PanelHeader title="Contexte relationnel" text="Mémoire CRM principale du dossier." />
            <div className={styles.infoGrid}>
              <InfoBox label="Segment" value={text(family.family_segment)} />
              <InfoBox label="Priorité" value={text(family.priority)} />
              <InfoBox label="Risque" value={text(risk)} />
              <InfoBox label="Prochaine revue" value={formatDate(family.next_review_at)} />
            </div>
            <div className={styles.reasonCard} style={{ marginTop: 14 }}><strong>Notes internes</strong><p>{text(family.notes)}</p></div>
          </section>
        </div>
      ) : null}

      {tab === 'commercial' ? (
        <section className={styles.workspacePanel}>
          <PanelHeader title="Parcours commercial lié" text="Leads explicitement rattachés à cette famille." action={<Link href="/leads/new" className={styles.inlineAction}>Nouveau lead<ArrowRight size={14} /></Link>} />
          <div className={styles.relatedList}>
            {leads.map((lead) => <RelatedItem key={lead.id} href={`/leads/${lead.id}`} title={`Lead #${lead.id} · ${text(lead.service_interest || lead.service_type, 'Besoin familial')}`} status={lead.status} date={lead.created_at || lead.updated_at} meta={`${text(lead.source, 'Source non renseignée')} · ${formatDate(lead.created_at || lead.updated_at, true)}`} />)}
            {!leads.length ? <EmptyState title="Aucun lead rattaché" text="La famille peut avoir été créée directement ou son parcours commercial n’est pas encore relié à ce dossier." /> : null}
          </div>
        </section>
      ) : null}

      {tab === 'contracts' ? (
        <section className={styles.workspacePanel}>
          <PanelHeader title="Contrats de la famille" text="Contrats explicitement rattachés par family_id." action={<Link href="/contracts/new" className={styles.inlineAction}>Créer un contrat<ArrowRight size={14} /></Link>} />
          <div className={styles.relatedList}>
            {contracts.map((contract) => <RelatedItem key={contract.id} href={`/contracts/${contract.id}`} title={`Contrat #${contract.id} · ${text(contract.contract_type || contract.service_type, 'Contrat famille')}`} status={contract.status} date={contract.created_at || contract.start_date} meta={`${formatDate(contract.start_date || contract.created_at)} · ${text(contract.end_date ? `jusqu’au ${formatDate(contract.end_date)}` : '', 'Durée non renseignée')}`} />)}
            {!contracts.length ? <EmptyState title="Aucun contrat rattaché" text="La relation peut encore se situer au stade prospect ou relever d’une prestation ponctuelle." action={<Link href="/contracts/new" className={styles.primaryButton}>Créer un contrat</Link>} /> : null}
          </div>
        </section>
      ) : null}

      {tab === 'missions' ? (
        <section className={styles.workspacePanel}>
          <PanelHeader title="Missions & continuité de service" text="Historique opérationnel explicitement rattaché à la famille." action={<div className={styles.actionRow}><Link href={`/missions/new?family_id=${family.id}`} className={styles.inlineAction}>Créer une mission<ArrowRight size={14} /></Link><Link href="/carelink-ops/missions" className={styles.inlineAction}>Ouvrir CareLink<ArrowRight size={14} /></Link></div>} />
          <div className={styles.relatedList}>
            {missions.map((mission) => <RelatedItem key={mission.id} href={`/missions/${mission.id}`} title={`Mission #${mission.id} · ${text(mission.service_type || mission.title, 'Prestation')}`} status={mission.status} date={mission.mission_date || mission.start_date || mission.created_at} meta={`${text(mission.city || family.city, '')}${mission.zone ? ` · ${mission.zone}` : ''} · ${formatDate(mission.mission_date || mission.start_date || mission.created_at, true)}`} />)}
            {!missions.length ? <EmptyState title="Aucune mission rattachée" text="Cette famille ne dispose actuellement d’aucune prestation opérationnelle enregistrée." action={<Link href={`/missions/new?family_id=${family.id}`} className={styles.primaryButton}>Créer une mission</Link>} /> : null}
          </div>
        </section>
      ) : null}

      {tab === 'incidents' ? (
        <section className={styles.workspacePanel}>
          <PanelHeader title="Incidents & protection de la relation" text="Événements explicitement rattachés à la famille." action={<Link href="/incidents/new" className={styles.inlineAction}>Déclarer un incident<ArrowRight size={14} /></Link>} />
          <div className={styles.relatedList}>
            {incidents.map((incident) => <RelatedItem key={incident.id} href={`/incidents/${incident.id}`} title={`Incident #${incident.id} · ${text(incident.title || incident.incident_type, 'Événement opérationnel')}`} status={incident.status || incident.severity} date={incident.created_at || incident.incident_date} meta={`${text(incident.severity || incident.priority, 'Sévérité non renseignée')} · ${formatDate(incident.created_at || incident.incident_date, true)}`} />)}
            {!incidents.length ? <EmptyState title="Aucun incident rattaché" text="Aucun événement qualité ou sécurité n’est directement lié à cette famille dans les données chargées." /> : null}
          </div>
        </section>
      ) : null}

      {tab === 'notes' ? (
        <div className={styles.workspaceGrid}>
          <section className={styles.workspacePanel}>
            <PanelHeader title="Notes relationnelles" text="Derniers éléments de contexte explicitement enregistrés." />
            <div className={styles.stack}>
              {notes.map((note) => <div key={note.id} className={styles.relatedItem}><strong>{text(note.note_type, 'Note relationnelle')}</strong><p>{text(note.content || note.note)}</p><p>{formatDate(note.created_at, true)}</p></div>)}
              {!notes.length ? <EmptyState title="Aucune note relationnelle" text="Le dossier ne contient encore aucune note issue de family_notes." /> : null}
            </div>
          </section>
          <section className={styles.workspacePanel}>
            <PanelHeader title="Historique consolidé" text="Chronologie visuelle construite à partir des sources existantes." />
            <div className={styles.timeline}>
              {timeline.map((entry) => <TimelineItem key={entry.id} entry={entry} />)}
              {!timeline.length ? <EmptyState title="Historique vide" text="Aucun événement daté n’est disponible pour ce dossier." /> : null}
            </div>
          </section>
          {canArchive && !family.is_archived ? (
            <section className={`${styles.workspacePanel} ${styles.workspaceWide}`}>
              <details>
                <summary style={{ cursor: 'pointer', color: '#9f2734', fontWeight: 900 }}>Contrôle administratif · Archiver le dossier</summary>
                <div className={styles.warningNotice} style={{ marginTop: 14 }}><Archive size={18} /><span>L’archivage est réversible et ne supprime pas automatiquement les leads, contrats, missions, incidents ou notes reliés.</span></div>
                <form action={archiveFamily} style={{ marginTop: 14, maxWidth: 360 }}>
                  <input type="hidden" name="family_id" value={family.id} />
                  <button type="submit" className={styles.dangerButton}><Archive size={16} />Archiver cette famille</button>
                </form>
              </details>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return <div className={styles.briefRow}><span>{label}</span><strong>{value}</strong></div>
}

function TimelineItem({ entry }: { entry: { date: string | null; title: string; detail: string } }) {
  return <div className={styles.timelineItem}><span className={styles.timelineDate}>{formatDate(entry.date, true)}</span><span className={styles.timelineDot} /><div className={styles.timelineBody}><strong>{entry.title}</strong><span>{entry.detail}</span></div></div>
}
