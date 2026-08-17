'use client'

import Link from 'next/link'
import {
  ArrowLeft, Check, CircleDashed, FileCheck2, Link2, LockKeyhole, MessageSquareText, ShieldCheck,
  UserRound, UserRoundCheck, Workflow,
} from 'lucide-react'
import type { Angelcare360ClaimTicketRecord } from '@/types/angelcare360/communications'
import type { ClaimStaffOption } from './Angelcare360ClaimActionStudio'
import styles from './TrustResolutionOS.module.css'
import Angelcare360ClaimActionStudio from './Angelcare360ClaimActionStudio'
import {
  claimAge, claimLifecycleProgress, claimPriorityLabel, claimStatusLabel, compactIdentity,
  formatClaimDate, normalizeClaimHistory,
} from './claimPresentation'

type Props = { ticket: Angelcare360ClaimTicketRecord; schoolId: string; staff: ClaimStaffOption[] }

function linkedAuthority(ticket: Angelcare360ClaimTicketRecord) {
  const source = `${ticket.category || ''} ${ticket.related_entity_type || ''}`.toLowerCase()
  if (source.includes('transport') || source.includes('route') || source.includes('vehicle') || source.includes('pickup')) return { label: 'Autorité Transport', href: '/angelcare-360-command-center/transport', detail: 'Le dossier référence le contexte mobilité. Toute mutation de circuit, véhicule ou ramassage reste dans Transport.' }
  if (source.includes('finance') || source.includes('invoice') || source.includes('facture') || source.includes('payment')) return { label: 'Autorité Finance', href: '/angelcare-360-command-center/finance', detail: 'Le dossier peut expliquer le litige, mais les factures, paiements et soldes restent sous l’autorité Finance.' }
  if (source.includes('attendance') || source.includes('presence') || source.includes('absence') || source.includes('retard')) return { label: 'Autorité Présences', href: '/angelcare-360-command-center/presences', detail: 'Les événements de présence restent modifiés dans Présences ; Réclamations conserve la relation et la résolution.' }
  if (source.includes('academic') || source.includes('cours') || source.includes('grade') || source.includes('note')) return { label: 'Autorité Académique', href: '/angelcare-360-command-center/academique', detail: 'Cours, évaluations et notes restent gouvernés par le domaine Académique.' }
  if (source.includes('document')) return { label: 'Autorité Documents', href: '/angelcare-360-command-center/documents', detail: 'La production et le statut des documents restent gouvernés par Documents.' }
  return null
}

export default function Angelcare360ClaimTicketDetail({ ticket, schoolId, staff }: Props) {
  const history = normalizeClaimHistory(ticket)
  const progress = claimLifecycleProgress(String(ticket.status))
  const operationallyResolved = ['resolved', 'closed', 'archived'].includes(String(ticket.status))
  const assigned = Boolean(ticket.assigned_staff_id)
  const waiting = ['waiting_parent', 'waiting_internal'].includes(String(ticket.status))
  const authority = linkedAuthority(ticket)

  return <main className={styles.casePage}>
    <div className={styles.caseRibbon}>
      <div className={styles.ribbonIdentity}><strong>{ticket.reclamation_code}</strong><span>{claimPriorityLabel(ticket.priority)} · {claimStatusLabel(ticket.status)} · {claimAge(ticket.created_at).label}</span></div>
      <div className={styles.ribbonActions}>
        <Angelcare360ClaimActionStudio mode="assign" ticket={ticket} schoolId={schoolId} staff={staff} triggerClassName={styles.ribbonButton} triggerLabel="Assigner" />
        <Angelcare360ClaimActionStudio mode="status" ticket={ticket} schoolId={schoolId} staff={staff} triggerClassName={styles.ribbonButton} triggerLabel="Étape" />
      </div>
    </div>

    <section className={styles.caseHero}>
      <div><Link className={styles.textLink} href="/angelcare-360-command-center/reclamations/tickets"><ArrowLeft size={12} />Retour aux dossiers</Link><div className={styles.eyebrow} style={{ marginTop: 18 }}>INSTITUTIONAL CASE CHAMBER</div><h1>{ticket.subject}</h1><p className={styles.caseDescription}>{ticket.description}</p></div>
      <div className={styles.caseHeroMeta}>
        <CaseMetric label="Priorité" value={claimPriorityLabel(ticket.priority)} />
        <CaseMetric label="Étape" value={claimStatusLabel(ticket.status)} />
        <CaseMetric label="Ouvert" value={formatClaimDate(ticket.created_at, false)} />
        <CaseMetric label="Progression" value={`${progress}% cycle`} />
      </div>
    </section>

    <section className={styles.caseChamber}>
      <aside className={styles.relationshipPortrait}>
        <div className={styles.portraitHead}><div className={styles.portraitMark}><UserRound /></div><h2>{ticket.requester_label || 'Demandeur protégé'}</h2><p>{ticket.reporter_role || 'Rôle non documenté'}</p></div>
        <div className={styles.portraitFacts}>
          <PortraitFact label="Référence dossier" value={ticket.reclamation_code} />
          <PortraitFact label="Catégorie" value={ticket.category || 'Non catégorisée'} />
          <PortraitFact label="Autorité liée" value={ticket.related_entity_type ? `${ticket.related_entity_type} · ${compactIdentity(ticket.related_entity_id)}` : 'Aucune entité liée'} />
          <PortraitFact label="Responsable" value={ticket.assigned_staff_label || (ticket.assigned_staff_id ? compactIdentity(ticket.assigned_staff_id) : 'À attribuer')} />
          <PortraitFact label="Assigné le" value={formatClaimDate(ticket.assigned_at)} />
        </div>
        <div className={styles.relationshipTruth}>Ce portrait montre uniquement les identités et relations réellement présentes dans le dossier. Historique familial, valeur client, satisfaction et sentiment ne sont pas fabriqués.</div>
      </aside>

      <section className={styles.narrativePanel}>
        <div className={styles.narrativeHead}><div className={styles.eyebrow}>CASE NARRATIVE CANVAS</div><h2>Colonne vertébrale factuelle</h2><p>Temps, transitions et notes internes persistées. Les notes protégées restent visuellement séparées de la voix famille.</p></div>
        <div className={styles.narrativeCanvas}>{history.map((event) => <div className={styles.narrativeEvent} key={event.id}><div className={styles.narrativeDot} data-kind={event.kind} /><article className={styles.narrativeBody}><div className={styles.narrativeMeta}><span>{event.kind === 'note' ? 'Interne protégé' : 'Transition dossier'}</span><span>{formatClaimDate(event.at)}</span></div><strong>{event.title}</strong><p>{event.detail}</p>{event.actor ? <p>Acteur · {compactIdentity(event.actor)}</p> : null}</article></div>)}</div>
      </section>

      <aside className={styles.recoveryConsole}>
        <div className={styles.consoleHead}><div className={styles.eyebrow}>RECOVERY CONSOLE</div><h2>État de récupération</h2><p>Ce qui est documenté, ce qui reste attendu et ce que SANILA refuse d’inventer.</p></div>
        <div className={styles.recoveryObjective}><span>Objectif opérationnel</span><strong>{ticket.resolution_summary || 'Établir la résolution, engager la responsabilité et documenter le résultat avant fermeture.'}</strong></div>
        <div className={styles.recoverySteps}>
          <RecoveryStep state="done" title="Signal enregistré" detail="Dossier canonique présent" />
          <RecoveryStep state={assigned ? 'done' : 'pending'} title="Responsabilité engagée" detail={assigned ? (ticket.assigned_staff_label || compactIdentity(ticket.assigned_staff_id)) : 'À attribuer'} />
          <RecoveryStep state={waiting ? 'pending' : operationallyResolved ? 'done' : 'pending'} title="Dépendances traitées" detail={waiting ? claimStatusLabel(ticket.status) : operationallyResolved ? 'Aucune attente courante persistée' : 'Traitement en cours'} />
          <RecoveryStep state={operationallyResolved ? 'done' : 'pending'} title="Correction documentée" detail={ticket.resolution_summary || 'Résumé de résolution requis'} />
          <RecoveryStep state="locked" title="Confirmation famille" detail="Non modélisée dans ce ticket" />
          <RecoveryStep state="locked" title="Confiance restaurée" detail="Aucun trust score n’est calculé" />
        </div>
        <div className={styles.consoleAction}><Angelcare360ClaimActionStudio mode="resolve" ticket={ticket} schoolId={schoolId} staff={staff} triggerClassName={styles.primaryButton} triggerLabel={operationallyResolved ? 'Réviser la résolution' : 'Ouvrir le Resolution Studio'} /></div>
      </aside>
    </section>

    <section className={styles.caseLower}>
      <section className={styles.voicePanel}>
        <div className={styles.voiceHead}><div className={styles.eyebrow}>FAMILY VOICE CHAMBER</div><h2>Voix famille vs raisonnement interne</h2><p>La séparation visuelle protège contre la confusion entre communication externe et note interne.</p></div>
        <div className={styles.voiceColumns}>
          <div className={styles.voiceColumn}><span>Voix famille / demandeur</span><strong>{ticket.subject}</strong><p>{ticket.description}</p><p>Le ticket ne contient pas de fil de messagerie externe lié ; aucune conversation n’est simulée ici.</p></div>
          <div className={styles.voiceColumn} data-kind="internal"><span>Interne · jamais présenté comme message famille</span><strong>{ticket.internal_notes_json?.length || 0} note(s) persistée(s)</strong><p>{ticket.resolution_notes || 'Aucune note de résolution enregistrée.'}</p></div>
        </div>
      </section>

      <section className={styles.evidencePanel}>
        <div className={styles.evidenceHead}><div className={styles.eyebrow}>EVIDENCE & AUTHORITY</div><h2>Preuves et autorité liée</h2><p>Références disponibles dans le dossier, sans dupliquer Finance, Transport, Présences ou autre domaine métier.</p></div>
        {authority ? <div className={styles.domainContext}><div className={styles.domainContextTop}><span>ADAPTIVE DOMAIN CONTEXT</span><Link className={styles.textLink} href={authority.href}>Ouvrir l’autorité <Link2 size={11} /></Link></div><strong>{authority.label}</strong><p>{authority.detail}</p></div> : null}
        <div className={styles.evidenceGrid}>
          <Evidence label="Entité liée" value={ticket.related_entity_type || 'Non documentée'} icon={<Link2 size={14} />} />
          <Evidence label="Identifiant lié" value={compactIdentity(ticket.related_entity_id)} icon={<FileCheck2 size={14} />} />
          <Evidence label="Résolu le" value={formatClaimDate(ticket.resolved_at)} icon={<ShieldCheck size={14} />} />
          <Evidence label="Clos le" value={formatClaimDate(ticket.closed_at)} icon={<LockKeyhole size={14} />} />
        </div>
      </section>
    </section>

    <section style={{ padding: '0 clamp(18px,3vw,40px) 42px' }}>
      <div className={styles.workspacePanel}>
        <div className={styles.panelHead}><div><div className={styles.eyebrow}>COMMAND ACTIONS</div><h2>Décisions du dossier</h2><p>Chaque action utilise les API existantes et conserve l’autorité, la validation et l’audit du backend.</p></div></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, padding: 18 }}>
          <Angelcare360ClaimActionStudio mode="assign" ticket={ticket} schoolId={schoolId} staff={staff} triggerLabel="Attribuer un responsable" />
          <Angelcare360ClaimActionStudio mode="status" ticket={ticket} schoolId={schoolId} staff={staff} triggerLabel="Changer l’étape" />
          <Angelcare360ClaimActionStudio mode="resolve" ticket={ticket} schoolId={schoolId} staff={staff} triggerLabel="Certifier la résolution" />
          <Angelcare360ClaimActionStudio mode="close" ticket={ticket} schoolId={schoolId} staff={staff} triggerClassName={styles.dangerButton} triggerLabel="Certifier la fermeture" />
        </div>
      </div>
    </section>
  </main>
}

function CaseMetric({ label, value }: { label: string; value: string }) { return <div className={styles.caseHeroMetric}><span>{label}</span><strong>{value}</strong></div> }
function PortraitFact({ label, value }: { label: string; value: string }) { return <div className={styles.portraitFact}><span>{label}</span><strong>{value}</strong></div> }
function RecoveryStep({ state, title, detail }: { state: 'done' | 'pending' | 'locked'; title: string; detail: string }) { return <div className={styles.recoveryStep}><div className={styles.stepIcon} data-state={state}>{state === 'done' ? <Check /> : state === 'locked' ? <LockKeyhole /> : <CircleDashed />}</div><div><strong>{title}</strong><span>{detail}</span></div></div> }
function Evidence({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className={styles.evidenceItem}><span>{label}</span><strong style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{icon}{value}</strong></div> }
