"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  ContactRound,
  FileSignature,
  Gauge,
  Handshake,
  History,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Network,
  Phone,
  Plus,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react"
import styles from "./ProspectEnterprise.module.css"
import type { ProspectEnterpriseRow } from "./types"
import { mutateRevenueEndpoint, useProspectEnterpriseData } from "./useProspectEnterpriseData"
import { EnterpriseActionModal, type ProspectEnterpriseModalKind } from "./ProspectEnterpriseWorkspace"
import DossierEnterpriseModals, { type DossierEnterpriseModalKind } from "./DossierEnterpriseModals"

export type ProspectDossierMode = "overview" | "qualification" | "decision-map" | "proposal" | "negotiation" | "recovery"

const fmtDh = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
const fmtDateTime = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

function n(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function dh(value: unknown) {
  return `${fmtDh.format(n(value))} Dh`
}

function date(value: unknown) {
  if (!value) return "Non planifiée"
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? "Non planifiée" : fmtDate.format(parsed)
}

function dateTime(value: unknown) {
  if (!value) return "Non horodaté"
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? "Non horodaté" : fmtDateTime.format(parsed)
}

function initials(value: unknown) {
  return String(value || "AC").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AC"
}

function tone(value: unknown): "green" | "amber" | "red" | "blue" | "violet" | undefined {
  const normalized = String(value || "").toLowerCase()
  if (["active", "won", "closed_won", "approved", "completed", "done", "champion", "supportive", "low"].includes(normalized)) return "green"
  if (["critical", "high", "blocked", "overdue", "closed_lost", "hostile", "resistant"].includes(normalized)) return "red"
  if (["medium", "proposal", "negotiation", "pending", "review"].includes(normalized)) return "amber"
  if (["decision_maker", "economic_buyer", "sponsor", "influencer"].includes(normalized)) return "violet"
  return "blue"
}

function Badge({ children, value }: { children: React.ReactNode; value?: unknown }) {
  return <span className={styles.badge} data-tone={tone(value ?? children)}>{children}</span>
}

function Panel({ icon, title, subtitle, action, children }: { icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span className={styles.panelTitleIcon}>{icon}</span>
          <div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
        </div>
        {action}
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  )
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className={styles.emptyState}><span className={styles.emptyStateIcon}><Target size={21} /></span><h2>{title}</h2><p>{description}</p></div>
}

function DossierTabs({ id, mode }: { id: string; mode: ProspectDossierMode }) {
  const items: Array<{ key: ProspectDossierMode; label: string; href: string }> = [
    { key: "overview", label: "Vue 360°", href: `/revenue-command-center/prospects/${id}` },
    { key: "qualification", label: "Qualification", href: `/revenue-command-center/prospects/${id}/qualification` },
    { key: "decision-map", label: "Centre de décision", href: `/revenue-command-center/prospects/${id}/decision-map` },
    { key: "proposal", label: "Proposition", href: `/revenue-command-center/prospects/${id}/proposal` },
    { key: "negotiation", label: "Négociation", href: `/revenue-command-center/prospects/${id}/negotiation` },
    { key: "recovery", label: "Récupération", href: `/revenue-command-center/prospects/${id}/recovery` },
  ]
  return <nav className={styles.dossierTabs} aria-label="Navigation du dossier prospect">{items.map((item) => <Link key={item.key} href={item.href} data-active={mode === item.key}>{item.label}</Link>)}</nav>
}

function buildRow(dossier: any): ProspectEnterpriseRow {
  const prospect = dossier?.prospect || {}
  const account = dossier?.account || {}
  const contact = dossier?.primaryContact || {}
  const opportunities = dossier?.opportunities || []
  const openValue = opportunities.filter((item: any) => item.status === "open").reduce((sum: number, item: any) => sum + n(item.value_mad), 0)
  const weighted = opportunities.filter((item: any) => item.status === "open").reduce((sum: number, item: any) => sum + (n(item.value_mad) * n(item.probability)) / 100, 0)
  return {
    prospect_id: prospect.id,
    prospect_name: prospect.name,
    company: prospect.company,
    city: prospect.city,
    prospect_stage: prospect.stage,
    priority: prospect.priority,
    score: prospect.score,
    prospect_value_mad: prospect.value_mad,
    prospect_probability: prospect.probability,
    owner: prospect.owner,
    contact_name: prospect.contact_name,
    email: prospect.email,
    phone: prospect.phone,
    next_action_at: prospect.next_action_at,
    last_activity_at: prospect.last_activity_at,
    prospect_status: prospect.status,
    account_id: prospect.account_id,
    account_name: account.account_name,
    legal_name: account.legal_name,
    account_type: account.account_type,
    account_segment: account.segment,
    lifecycle_stage: account.lifecycle_stage,
    industry: account.industry,
    website: account.website,
    domain: account.domain,
    account_status: account.status,
    contact_id: prospect.contact_id,
    primary_contact_name: contact.full_name,
    primary_contact_role: contact.role_title,
    primary_contact_decision_role: contact.decision_role,
    primary_contact_influence: contact.influence_level,
    opportunity_count: opportunities.length,
    open_opportunity_value_mad: openValue,
    weighted_pipeline_mad: weighted,
    open_task_count: (dossier?.tasks || []).filter((item: any) => ["open", "pending", "todo"].includes(String(item.status))).length,
    overdue_task_count: (dossier?.tasks || []).filter((item: any) => ["open", "pending", "todo"].includes(String(item.status)) && item.due_date && new Date(item.due_date).getTime() < Date.now()).length,
    upcoming_meeting_count: (dossier?.appointments || []).filter((item: any) => item.status === "scheduled" && new Date(item.appointment_at).getTime() >= Date.now()).length,
    open_risk_count: [...(dossier?.accountRisks || []), ...(dossier?.opportunityRisks || [])].filter((item: any) => item.status === "open").length,
    decision_member_count: (dossier?.decisionMap || []).filter((item: any) => item.status === "active").length,
    updated_at: prospect.updated_at,
  }
}

function Overview({
  dossier,
  row,
  onOpportunity,
  onAccount,
  onContact,
  onOpportunityTransition,
}: {
  dossier: any
  row: ProspectEnterpriseRow
  onOpportunity: () => void
  onAccount: () => void
  onContact: (contact?: any) => void
  onOpportunityTransition: (opportunity: any) => void
}) {
  const opportunities = dossier.opportunities || []
  const tasks = dossier.tasks || []
  const appointments = dossier.appointments || []
  const activities = dossier.activities || []
  const contacts = dossier.contacts || []
  return (
    <div className={styles.contentGridWide}>
      <div style={{ gridColumn: "span 8", display: "grid", gap: 14 }}>
        <Panel icon={<Building2 size={16} />} title="Identité du compte" subtitle="Données d’organisation reliées à la source de vérité Revenue Command" action={<button type="button" className={styles.ghostButton} onClick={onAccount}><FilePenLineIcon /> {dossier.account ? "Modifier" : "Structurer"}</button>}>
          {dossier.account ? <div className={styles.formGrid}><div className={styles.priorityItem}><span className={styles.itemIcon}><Building2 size={14} /></span><div><h3>{dossier.account.account_name}</h3><p>{dossier.account.legal_name || "Dénomination légale à confirmer"}</p></div><Badge value={dossier.account.status}>{dossier.account.status}</Badge></div><div className={styles.priorityItem}><span className={styles.itemIcon}><MapPin size={14} /></span><div><h3>{dossier.account.city || row.city || "Ville non attribuée"}</h3><p>{dossier.account.territory || "Territoire non défini"}</p></div><Badge>{dossier.account.segment || "b2b"}</Badge></div><div className={styles.priorityItem}><span className={styles.itemIcon}><Target size={14} /></span><div><h3>{dossier.account.industry || "Secteur à qualifier"}</h3><p>{dossier.account.domain || dossier.account.website || "Présence numérique à renseigner"}</p></div><Badge value={dossier.account.lifecycle_stage}>{dossier.account.lifecycle_stage || "prospect"}</Badge></div><div className={styles.priorityItem}><span className={styles.itemIcon}><UserRound size={14} /></span><div><h3>{dossier.account.owner_name || row.owner || "Non attribué"}</h3><p>Propriétaire du compte</p></div><Badge value={dossier.account.priority}>{dossier.account.priority || "medium"}</Badge></div></div> : <Empty title="Compte non structuré" description="Le prospect existe, mais aucune identité de compte canonique n’est encore reliée." />}
        </Panel>

        <Panel icon={<BriefcaseBusiness size={16} />} title="Opportunités commerciales" subtitle="Valeur, probabilité, prochaine étape et historique de progression" action={<button type="button" className={styles.ghostButton} onClick={onOpportunity}><Plus size={13} /> Opportunité</button>}>
          {opportunities.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Opportunité</th><th>Étape</th><th>Valeur</th><th>Probabilité</th><th>Clôture</th><th>Prochaine étape</th><th>Progression</th></tr></thead><tbody>{opportunities.map((item: any) => <tr key={item.id}><td><strong>{item.title}</strong><div style={{ marginTop: 4, color: "#8193a3", fontSize: 9 }}>{item.owner || "Non attribué"}</div></td><td><Badge value={item.stage}>{String(item.stage || "qualification").replaceAll("_", " ")}</Badge></td><td><strong>{dh(item.value_mad)}</strong></td><td>{Math.round(n(item.probability))}%</td><td>{date(item.expected_close_date)}</td><td>{item.next_step || "À définir"}</td><td><button type="button" className={styles.ghostButton} onClick={() => onOpportunityTransition(item)}>Faire progresser</button></td></tr>)}</tbody></table></div> : <Empty title="Aucune opportunité reliée" description="Créez une opportunité pour rendre la valeur, la probabilité et la progression auditables." />}
        </Panel>

        <Panel icon={<History size={16} />} title="Chronologie commerciale" subtitle="Activités, changements d’étape et actions effectuées sur ce dossier">
          {activities.length ? <div className={styles.timeline}>{activities.slice(0, 18).map((activity: any) => <div className={styles.timelineItem} key={activity.id}><span className={styles.timelineDot}><Activity size={13} /></span><div><h3>{activity.title || activity.event_title || activity.event_type}</h3><p>{activity.body || activity.event_body || "Événement enregistré dans Revenue Command"}<br />Par {activity.actor || "Système"}</p></div><span className={styles.timelineDate}>{dateTime(activity.created_at)}</span></div>)}</div> : <Empty title="Aucune activité enregistrée" description="Les actions, rendez-vous, transitions et décisions apparaîtront dans cette chronologie." />}
        </Panel>
      </div>

      <div style={{ gridColumn: "span 4", display: "grid", gap: 14 }}>
        <Panel icon={<ContactRound size={16} />} title="Contacts et pouvoir" subtitle="Personnes reliées au compte et au dossier" action={<button type="button" className={styles.ghostButton} onClick={() => onContact()}><Plus size={13} /> Contact</button>}>
          <div className={styles.priorityList}>{contacts.length ? contacts.slice(0, 10).map((contact: any) => <div className={styles.priorityItem} key={contact.id}><span className={styles.itemIcon}><ContactRound size={14} /></span><div><h3>{contact.full_name}</h3><p>{contact.role_title || "Fonction à confirmer"} · {contact.email || contact.phone || "Coordonnée manquante"}</p></div><div style={{ display: "grid", gap: 6, justifyItems: "end" }}><Badge value={contact.decision_role}>{contact.decision_role || "contact"}</Badge><button type="button" className={styles.inlineAction} onClick={() => onContact(contact)}>Modifier</button></div></div>) : <Empty title="Aucun contact relié" description="Créez le contact principal puis complétez la cartographie décisionnelle." />}</div>
        </Panel>

        <Panel icon={<Clock3 size={16} />} title="Actions ouvertes" subtitle="Tâches et échéances reliées au dossier">
          <div className={styles.priorityList}>{tasks.length ? tasks.slice(0, 10).map((task: any) => <div className={styles.priorityItem} key={task.id}><span className={styles.itemIcon}>{task.due_date && new Date(task.due_date).getTime() < Date.now() ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}</span><div><h3>{task.title}</h3><p>{task.owner || "Non attribué"} · échéance {dateTime(task.due_date)}</p></div><Badge value={task.status}>{task.status}</Badge></div>) : <Empty title="Aucune tâche ouverte" description="Créez une action datée pour assurer la continuité commerciale." />}</div>
        </Panel>

        <Panel icon={<CalendarDays size={16} />} title="Rendez-vous" subtitle="Rencontres passées et prochaines">
          <div className={styles.timeline}>{appointments.length ? appointments.slice(0, 8).map((meeting: any) => <div className={styles.timelineItem} key={meeting.id}><span className={styles.timelineDot}><CalendarDays size={13} /></span><div><h3>{meeting.title}</h3><p>{meeting.location || meeting.meeting_link || "Lieu à confirmer"} · {meeting.owner || "Non attribué"}</p></div><span className={styles.timelineDate}>{dateTime(meeting.appointment_at)}</span></div>) : <Empty title="Aucun rendez-vous" description="Planifiez une rencontre pour faire progresser le dossier." />}</div>
        </Panel>
      </div>
    </div>
  )
}

function FilePenLineIcon() {
  return <BriefcaseBusiness size={13} />
}

function Qualification({ dossier, row, onOpen }: { dossier: any; row: ProspectEnterpriseRow; onOpen: () => void }) {
  const latest = dossier.qualifications?.[0]
  const dimensions = [
    ["Besoin", latest?.need_score],
    ["Autorité", latest?.authority_score],
    ["Budget", latest?.budget_score],
    ["Timing", latest?.timing_score],
    ["Adéquation", latest?.fit_score],
    ["Urgence", latest?.urgency_score],
    ["Preuves", latest?.evidence_quality],
  ]
  const overall = n(latest?.overall_score ?? row.score)
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<ClipboardCheck size={16} />} title="Évaluation de qualification" subtitle="Lecture pondérée de la qualité et de la preuve commerciale" action={<button type="button" className={styles.ghostButton} onClick={onOpen}><Plus size={13} /> Nouvelle évaluation</button>}>
        <div className={styles.matrix}>{dimensions.map(([label, value]) => <article className={styles.matrixCard} key={String(label)}><div className={styles.matrixCardTop}><div><h3>{label}</h3><p>Score fondé sur les informations confirmées du dossier.</p></div><span className={styles.scoreRing} style={{ "--score": n(value) } as React.CSSProperties}><strong>{Math.round(n(value))}</strong></span></div><div style={{ marginTop: 14 }}><div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${n(value)}%` }} /></div></div></article>)}</div>
      </Panel>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<Gauge size={16} />} title="Décision de qualification" subtitle="Recommandation actuelle"><div className={styles.scoreLarge}><strong>{Math.round(overall)}/100</strong><span>{latest?.recommendation ? String(latest.recommendation).replaceAll("_", " ") : "Aucune évaluation complète enregistrée."}</span></div><div style={{ marginTop: 12 }}><Badge value={overall >= 70 ? "active" : overall >= 45 ? "medium" : "critical"}>{overall >= 70 ? "Progression défendable" : overall >= 45 ? "Découverte à poursuivre" : "Qualification insuffisante"}</Badge></div></Panel>
        <Panel icon={<ShieldCheck size={16} />} title="Preuves et gouvernance" subtitle="Ce qui doit être confirmé avant proposition"><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Besoin explicite, conséquence et urgence.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Autorité et centre de décision identifiés.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Budget ou mécanisme de financement compris.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Prochaine décision datée et responsable désigné.</div></div></Panel>
        {latest ? <Panel icon={<History size={16} />} title="Dernière évaluation" subtitle={`Évaluée ${dateTime(latest.assessed_at)}`}><p style={{ margin: 0, color: "#5e778d", fontSize: 10, lineHeight: 1.65 }}>{latest.notes || "Aucune note complémentaire."}</p><div style={{ marginTop: 12 }}><Badge>{latest.assessed_by_name || "Revenue Command"}</Badge></div></Panel> : null}
      </div>
    </div>
  )
}

function DecisionMap({ dossier, row, onOpen }: { dossier: any; row: ProspectEnterpriseRow; onOpen: () => void }) {
  const members = dossier.decisionMap || []
  return (
    <div className={styles.contentGrid}>
      <div className={styles.decisionStage}>
        <div className={styles.decisionCore}><strong>{row.account_name || row.prospect_name}</strong><span>{members.length} membre(s) identifié(s)<br />{dh(row.open_opportunity_value_mad || row.prospect_value_mad)}</span></div>
        <div className={styles.decisionMembers}>{members.slice(0, 9).map((member: any) => <article className={styles.decisionMember} key={member.id}><h3>{member.revenue_contacts?.full_name || "Contact relié"}</h3><p>{member.revenue_contacts?.role_title || "Fonction à confirmer"}<br />{member.engagement_strategy || "Stratégie d’engagement à définir"}</p><div className={styles.decisionMemberFooter}><Badge value={member.member_role}>{String(member.member_role || "influencer").replaceAll("_", " ")}</Badge><Badge value={member.support_level}>{member.support_level || "neutral"}</Badge><Badge>{Math.round(n(member.influence_score))}/100</Badge></div></article>)}{!members.length ? <article className={styles.decisionMember}><h3>Centre de décision non cartographié</h3><p>Ajoutez un contact existant pour identifier le pouvoir, l’influence, l’accès et la stratégie d’engagement.</p></article> : null}</div>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<Network size={16} />} title="Contrôle décisionnel" subtitle="État de la couverture du centre de pouvoir"><div className={styles.priorityList}><div className={styles.priorityItem}><span className={styles.itemIcon}><Users size={14} /></span><div><h3>{members.length} membre(s)</h3><p>Contacts actifs dans la cartographie</p></div><Badge value={members.length >= 3 ? "active" : "medium"}>{members.length >= 3 ? "Couverture avancée" : "À compléter"}</Badge></div><div className={styles.priorityItem}><span className={styles.itemIcon}><Target size={14} /></span><div><h3>{members.filter((member: any) => ["decision_maker", "economic_buyer"].includes(String(member.member_role))).length} décideur(s)</h3><p>Acheteurs économiques ou décideurs formels</p></div><Badge value={members.some((member: any) => ["decision_maker", "economic_buyer"].includes(String(member.member_role))) ? "active" : "critical"}>Contrôle</Badge></div><div className={styles.priorityItem}><span className={styles.itemIcon}><Handshake size={14} /></span><div><h3>{members.filter((member: any) => ["champion", "supportive"].includes(String(member.support_level))).length} soutien(s)</h3><p>Champions et acteurs favorables</p></div><Badge value="violet">Influence</Badge></div></div><button type="button" className={styles.ghostButton} style={{ marginTop: 13, width: "100%" }} onClick={onOpen}><Plus size={14} /> Ajouter un membre</button></Panel>
        <Panel icon={<ShieldAlert size={16} />} title="Risque relationnel" subtitle="Blocage ou absence de sponsor"><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Accès au décideur vérifié.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Sponsor interne identifié.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Résistances et influence concurrente documentées.</div></div></Panel>
      </div>
    </div>
  )
}

function Proposal({ dossier, row, onOpportunity }: { dossier: any; row: ProspectEnterpriseRow; onOpportunity: () => void }) {
  const opportunities = dossier.opportunities || []
  const latestQualification = dossier.qualifications?.[0]
  const readiness = Math.round((Math.min(100, n(latestQualification?.overall_score ?? row.score)) + Math.min(100, n(row.decision_member_count) * 25) + (opportunities.length ? 100 : 20) + (row.primary_contact_name || row.contact_name ? 100 : 30)) / 4)
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<FileSignature size={16} />} title="Préparation de la proposition" subtitle="Contrôles de maturité avant l’ouverture du Studio de proposition">
        <div className={styles.accountPortfolio}>{opportunities.map((opportunity: any) => <article className={styles.accountCard} key={opportunity.id}><div className={styles.accountCardTop}><div><h3>{opportunity.title}</h3><p>{String(opportunity.stage || "qualification").replaceAll("_", " ")} · {opportunity.owner || "Non attribué"}</p></div><Badge value={opportunity.status}>{opportunity.status}</Badge></div><div className={styles.accountValue}><span>Valeur de l’offre</span><strong>{dh(opportunity.value_mad)}</strong></div><div className={styles.accountStats}><div><span>Probabilité</span><strong>{Math.round(n(opportunity.probability))}%</strong></div><div><span>Clôture</span><strong>{date(opportunity.expected_close_date)}</strong></div><div><span>Étape</span><strong>{opportunity.stage}</strong></div></div></article>)}{!opportunities.length ? <div style={{ gridColumn: "1 / -1" }}><Empty title="Opportunité requise" description="Une proposition doit être reliée à une opportunité avec valeur, probabilité et prochaine étape." /></div> : null}</div>
      </Panel>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<Gauge size={16} />} title="Indice de préparation" subtitle="Maturité du dossier pour produire une offre"><div className={styles.donut} style={{ "--value": readiness } as React.CSSProperties}><div className={styles.donutCenter}><strong>{readiness}%</strong><span>prêt pour cadrage</span></div></div><div className={styles.checklist}><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Qualification : {Math.round(n(latestQualification?.overall_score ?? row.score))}/100.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Centre de décision : {n(row.decision_member_count)} membre(s).</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Opportunités : {opportunities.length}.</div><div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Contact principal : {row.primary_contact_name || row.contact_name || "manquant"}.</div></div></Panel>
        {!opportunities.length ? <button type="button" className={styles.ghostButton} onClick={onOpportunity}><Plus size={14} /> Créer l’opportunité requise</button> : <div className={styles.schemaNotice}><Sparkles size={18} /><div><strong>Studio de proposition — phase suivante</strong><p>Ce build prépare les comptes, contacts, qualifications et opportunités. Le moteur complet de versions, lignes tarifaires, approbations et envoi sera introduit dans la phase Proposition–Négociation.</p></div></div>}
      </div>
    </div>
  )
}

function Negotiation({ dossier }: { dossier: any }) {
  const opportunities = (dossier.opportunities || []).filter((item: any) => ["proposal", "negotiation", "contracting"].includes(String(item.stage)))
  const risks = [...(dossier.accountRisks || []), ...(dossier.opportunityRisks || [])]
  const competitors = dossier.competitors || []
  return (
    <div className={styles.contentGridWide}>
      <div style={{ gridColumn: "span 7", display: "grid", gap: 14 }}>
        <Panel icon={<Handshake size={16} />} title="Position commerciale actuelle" subtitle="Opportunités engagées dans la zone de proposition, négociation ou contractualisation">
          {opportunities.length ? <div className={styles.priorityList}>{opportunities.map((item: any) => <div className={styles.priorityItem} key={item.id}><span className={styles.itemIcon}><Handshake size={14} /></span><div><h3>{item.title}</h3><p>{item.next_step || "Prochaine étape à définir"} · clôture {date(item.expected_close_date)}</p></div><span className={styles.itemMetric}>{dh(item.value_mad)}<br /><Badge value={item.stage}>{item.stage}</Badge></span></div>)}</div> : <Empty title="Aucune négociation active" description="L’opportunité doit atteindre la proposition ou la négociation avant d’être pilotée dans cette salle." />}
        </Panel>
        <Panel icon={<ShieldAlert size={16} />} title="Risques de négociation" subtitle="Obstacles, concurrence et exposition de valeur"><div className={styles.riskList}>{risks.length ? risks.map((risk: any) => <div className={styles.riskItem} key={risk.id}><span className={styles.itemIcon}><AlertTriangle size={14} /></span><div><h3>{risk.title}</h3><p>{risk.mitigation_plan || "Plan de mitigation à définir"}</p></div><span className={styles.itemMetric}>{dh(risk.impact_mad)}</span></div>) : <Empty title="Aucun risque déclaré" description="Déclarez les risques de budget, concurrence, pouvoir, timing ou relation avant toute concession." />}</div></Panel>
      </div>
      <div style={{ gridColumn: "span 5", display: "grid", gap: 14 }}>
        <Panel icon={<CircleDollarSign size={16} />} title="Valeur à protéger" subtitle="Valeur totale dans la zone de négociation"><div className={styles.scoreLarge}><strong>{dh(opportunities.reduce((sum: number, item: any) => sum + n(item.value_mad), 0))}</strong><span>Chaque concession future devra conserver sa raison, son approbateur et la contrepartie obtenue.</span></div></Panel>
        <Panel icon={<Users size={16} />} title="Pression concurrentielle" subtitle="Concurrents reliés aux opportunités"><div className={styles.priorityList}>{competitors.length ? competitors.map((competitor: any) => <div className={styles.priorityItem} key={competitor.id}><span className={styles.itemIcon}><Target size={14} /></span><div><h3>{competitor.competitor_name}</h3><p>{competitor.response_strategy || "Stratégie de réponse à définir"}</p></div><Badge value={competitor.position}>{competitor.position}</Badge></div>) : <div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Aucun concurrent n’est actuellement enregistré dans ce dossier.</div>}</div></Panel>
        <div className={styles.schemaNotice}><Sparkles size={18} /><div><strong>Registre de négociation — phase suivante</strong><p>Les tours, objections, contre-offres, concessions et approbations seront ajoutés sans simuler leur présence avant la migration dédiée.</p></div></div>
      </div>
    </div>
  )
}

function Recovery({ dossier, row, onRisk }: { dossier: any; row: ProspectEnterpriseRow; onRisk: () => void }) {
  const overdueTasks = (dossier.tasks || []).filter((task: any) => ["open", "pending", "todo"].includes(String(task.status)) && task.due_date && new Date(task.due_date).getTime() < Date.now())
  const risks = [...(dossier.accountRisks || []), ...(dossier.opportunityRisks || [])].filter((risk: any) => risk.status === "open")
  return (
    <div className={styles.contentGrid}>
      <Panel icon={<RotateCcw size={16} />} title="Plan de récupération" subtitle="Diagnostic, intervention, limite et résultat attendu">
        <div className={styles.timeline}><div className={styles.timelineItem}><span className={styles.timelineDot}><SearchIcon /></span><div><h3>Diagnostic du blocage</h3><p>{risks[0]?.description || "Le blocage principal n’est pas encore documenté. Analysez le décideur, le timing, le budget et la concurrence."}</p></div><span className={styles.timelineDate}>{risks.length} risque(s)</span></div><div className={styles.timelineItem}><span className={styles.timelineDot}><Target size={13} /></span><div><h3>Intervention prioritaire</h3><p>{risks[0]?.mitigation_plan || "Définir un plan de mitigation, un canal, un responsable et une date limite."}</p></div><span className={styles.timelineDate}>{row.owner || "Non attribué"}</span></div><div className={styles.timelineItem}><span className={styles.timelineDot}><Clock3 size={13} /></span><div><h3>Pression d’exécution</h3><p>{overdueTasks.length ? `${overdueTasks.length} action(s) sont en retard et nécessitent une reprise immédiate.` : "Aucune action en retard confirmée."}</p></div><span className={styles.timelineDate}>{dateTime(row.next_action_at)}</span></div><div className={styles.timelineItem}><span className={styles.timelineDot}><CheckCircle2 size={13} /></span><div><h3>Issue attendue</h3><p>Réactivation, nurturing contrôlé ou clôture documentée avec raison de perte.</p></div><span className={styles.timelineDate}>{dh(row.open_opportunity_value_mad || row.prospect_value_mad)}</span></div></div>
      </Panel>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel icon={<ShieldAlert size={16} />} title="Risques ouverts" subtitle="Exposition confirmée du dossier"><div className={styles.riskList}>{risks.length ? risks.map((risk: any) => <div className={styles.riskItem} key={risk.id}><span className={styles.itemIcon}><AlertTriangle size={14} /></span><div><h3>{risk.title}</h3><p>{risk.owner || "Sans responsable"} · échéance {dateTime(risk.due_at)}</p></div><Badge value={risk.severity}>{risk.severity}</Badge></div>) : <Empty title="Aucun risque déclaré" description="Déclarez le risque réel avant de lancer une récupération." />}</div><button type="button" className={styles.ghostButton} style={{ marginTop: 13, width: "100%" }} onClick={onRisk}><Plus size={14} /> Déclarer un risque</button></Panel>
        <Panel icon={<Clock3 size={16} />} title="Actions en retard" subtitle="Discipline à restaurer"><div className={styles.priorityList}>{overdueTasks.length ? overdueTasks.map((task: any) => <div className={styles.priorityItem} key={task.id}><span className={styles.itemIcon}><Clock3 size={14} /></span><div><h3>{task.title}</h3><p>{task.owner || "Non attribué"}</p></div><Badge value="overdue">{dateTime(task.due_date)}</Badge></div>) : <div className={styles.checkItem}><CheckCircle2 size={14} className={styles.checkIcon} /> Aucune action en retard sur ce dossier.</div>}</div></Panel>
      </div>
    </div>
  )
}

function SearchIcon() {
  return <Target size={13} />
}

export default function ProspectEnterpriseDossier({ prospectId, mode = "overview" }: { prospectId: string; mode?: ProspectDossierMode }) {
  const { dossier: payload, loading, refreshing, error, refresh } = useProspectEnterpriseData("directory", prospectId)
  const [modal, setModal] = useState<{ kind: ProspectEnterpriseModalKind; prospect: ProspectEnterpriseRow | null }>({ kind: null, prospect: null })
  const [recordModal, setRecordModal] = useState<{ kind: DossierEnterpriseModalKind; contact?: any; opportunity?: any }>({ kind: null })
  const dossier = payload?.dossier
  const row = useMemo(() => dossier ? buildRow(dossier) : null, [dossier])

  function open(kind: ProspectEnterpriseModalKind) {
    if (row) setModal({ kind, prospect: row })
  }

  if (loading) return <main className={styles.shell} data-accent="navy"><div className={styles.loadingState}><span className={styles.loadingStateIcon}><Loader2 size={22} className={styles.loadingSpin} /></span><h2>Ouverture du dossier commercial</h2><p>Chargement du compte, des contacts, opportunités, tâches, rendez-vous, risques et activités.</p></div></main>
  if (error || !dossier || !row) return <main className={styles.shell} data-accent="red"><div className={styles.errorState}><span className={styles.errorStateIcon}><AlertTriangle size={22} /></span><h2>Dossier indisponible</h2><p>{error || "Le prospect demandé n’existe pas dans la source de vérité."}</p><Link href="/revenue-command-center/prospects/directory" className={styles.ghostButton} style={{ marginTop: 14 }}>Retour au répertoire</Link></div></main>

  const currentOpportunityValue = (dossier.opportunities || []).filter((item: any) => item.status === "open").reduce((sum: number, item: any) => sum + n(item.value_mad), 0)
  const latestQualification = dossier.qualifications?.[0]
  const score = n(latestQualification?.overall_score ?? row.score)


  return (
    <main className={styles.shell} data-accent={mode === "recovery" ? "red" : mode === "negotiation" || mode === "proposal" ? "amber" : mode === "decision-map" ? "violet" : mode === "qualification" ? "green" : "navy"}>
      <div className={styles.topline}><nav className={styles.breadcrumbs}><Link href="/revenue-command-center">Revenue Command</Link><ChevronRight size={12} /><Link href="/revenue-command-center/prospects/directory">Prospects & comptes</Link><ChevronRight size={12} /><span>{row.prospect_name}</span></nav><span className={styles.freshness}><span className={styles.freshnessDot} /> Dossier canonique · {dateTime(payload?.generatedAt)}</span></div>

      <section className={styles.dossierHero}>
        <article className={styles.identityCard}>
          <div className={styles.identityTop}><div className={styles.identityTitle}><span className={styles.identityLogo}>{initials(row.account_name || row.prospect_name)}</span><div><p className={styles.eyebrow} style={{ marginBottom: 8 }}><span className={styles.eyebrowMark} /> Dossier commercial 360°</p><h1>{row.account_name || row.prospect_name}</h1><p>{row.prospect_name} · {row.city || "Ville non attribuée"} · Responsable {row.owner || "non attribué"}</p></div></div><div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}><Badge value={row.priority}>{row.priority || "medium"}</Badge><Badge value={row.prospect_stage}>{String(row.prospect_stage || "new_lead").replaceAll("_", " ")}</Badge></div></div>
          <div className={styles.identityActions}><Link className={styles.primaryButton} href={`/revenue-command-center/appointments/new?prospectId=${encodeURIComponent(prospectId)}`}><CalendarDays size={14} /> Planifier un rendez-vous</Link><button type="button" className={styles.secondaryButton} onClick={() => open("opportunity")}><BriefcaseBusiness size={14} /> Créer une opportunité</button><button type="button" className={styles.secondaryButton} onClick={() => setRecordModal({ kind: "prospect" })}><ClipboardCheck size={14} /> Modifier le dossier</button><button type="button" className={styles.secondaryButton} onClick={() => refresh(true)}>{refreshing ? <Loader2 size={14} className={styles.loadingSpin} /> : <RefreshCcw size={14} />} Actualiser</button></div>
          <div className={styles.identityFacts}><div className={styles.identityFact}><span>Valeur ouverte</span><strong>{dh(currentOpportunityValue || row.prospect_value_mad)}</strong></div><div className={styles.identityFact}><span>Score</span><strong>{Math.round(score)}/100</strong></div><div className={styles.identityFact}><span>Décideurs</span><strong>{n(row.decision_member_count)}</strong></div><div className={styles.identityFact}><span>Risques</span><strong>{n(row.open_risk_count)}</strong></div></div>
        </article>
        <aside className={styles.dossierScoreCard}><div className={styles.dossierScoreTop}><div><h2>Posture commerciale</h2><p>Lecture de maturité fondée sur les données du dossier</p></div><Gauge size={20} color="#1d689d" /></div><div className={styles.scoreLarge}><strong>{Math.round(score)}</strong><span>Score de qualification actuel. La valeur pondérée visible est de {dh(row.weighted_pipeline_mad)}.</span></div><div className={styles.priorityList}><div className={styles.priorityItem}><span className={styles.itemIcon}><ContactRound size={14} /></span><div><h3>{row.primary_contact_name || row.contact_name || "Contact principal manquant"}</h3><p>{row.primary_contact_role || "Rôle à qualifier"}</p></div><Badge value={row.primary_contact_influence}>{row.primary_contact_influence || "unknown"}</Badge></div><div className={styles.priorityItem}><span className={styles.itemIcon}><Clock3 size={14} /></span><div><h3>Prochaine action</h3><p>{dossier.prospect?.data?.nextAction || "À définir dans le dossier"}</p></div><Badge>{dateTime(row.next_action_at)}</Badge></div></div></aside>
      </section>

      <DossierTabs id={prospectId} mode={mode} />

      {Object.values(payload?.schema || {}).some((available) => available === false) ? <div className={styles.schemaNotice}><AlertTriangle size={18} /><div><strong>Capacité entreprise partiellement disponible</strong><p>La vue utilise les tables présentes. Appliquez la migration additive Phase 2 pour activer l’intégralité des cartographies, risques, plans et historiques.</p></div></div> : null}

      {mode === "overview" ? <Overview dossier={dossier} row={row} onOpportunity={() => open("opportunity")} onAccount={() => setRecordModal({ kind: "account" })} onContact={(contact) => setRecordModal({ kind: "contact", contact })} onOpportunityTransition={(opportunity) => setRecordModal({ kind: "opportunity-transition", opportunity })} /> : null}
      {mode === "qualification" ? <Qualification dossier={dossier} row={row} onOpen={() => open("qualification")} /> : null}
      {mode === "decision-map" ? <DecisionMap dossier={dossier} row={row} onOpen={() => open("decision")} /> : null}
      {mode === "proposal" ? <Proposal dossier={dossier} row={row} onOpportunity={() => open("opportunity")} /> : null}
      {mode === "negotiation" ? <Negotiation dossier={dossier} /> : null}
      {mode === "recovery" ? <Recovery dossier={dossier} row={row} onRisk={() => open("risk")} /> : null}

      <EnterpriseActionModal kind={modal.kind} prospect={modal.prospect} contactOptions={dossier.contacts || []} onClose={() => setModal({ kind: null, prospect: null })} onSaved={() => refresh(true)} />
      <DossierEnterpriseModals kind={recordModal.kind} dossier={dossier} selectedContact={recordModal.contact || null} selectedOpportunity={recordModal.opportunity || null} onClose={() => setRecordModal({ kind: null })} onSaved={() => refresh(true)} />
    </main>
  )
}
