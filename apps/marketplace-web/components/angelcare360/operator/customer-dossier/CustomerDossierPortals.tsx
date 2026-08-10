'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileSearch, LockKeyhole, ShieldAlert } from 'lucide-react'
import SovereignPortal from '../sovereign/SovereignPortal'
import type { Wave2CustomerCommand, Wave2Evidence } from '../wave2/Wave2CommandTypes'
import styles from './CustomerRelationshipCommandRoom.module.css'
import {
  EvidenceList,
  formatDateTime,
  formatDh,
  humanize,
} from './CustomerDossierPrimitives'
import type { CustomerPortalState } from './CustomerDossierContract'

export type CustomerDossierCapabilities = {
  updateClient: boolean
  archiveClient: boolean
  createSupportTicket: boolean
  createServiceAction: boolean
  createNote: boolean
}

type Props = {
  command: Wave2CustomerCommand
  portal: CustomerPortalState
  capabilities: CustomerDossierCapabilities
  onClose: () => void
}

type ApiResponse = { ok?: boolean; error?: string; [key: string]: unknown }

async function postOperation(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({ ok: false, error: `Réponse HTTP ${response.status}` })) as ApiResponse
  if (!response.ok || result.ok === false) throw new Error(result.error || `L’opération a échoué (${response.status}).`)
  return result
}

function clientPayload(command: Wave2CustomerCommand, overrides: Record<string, unknown> = {}) {
  const client = command.client
  return {
    id: client.id,
    clientCode: client.client_code,
    displayName: client.display_name,
    legalName: client.legal_name || '',
    clientType: client.client_type,
    city: client.city || '',
    country: client.country || 'Maroc',
    address: client.address || '',
    primaryContactName: client.primary_contact_name || '',
    primaryContactEmail: client.primary_contact_email || '',
    primaryContactPhone: client.primary_contact_phone || '',
    status: client.status,
    lifecycleStage: client.lifecycle_stage,
    source: client.source || '',
    healthStatus: client.health_status || '',
    riskLevel: client.risk_level || '',
    notes: client.notes || '',
    ...overrides,
  }
}

export default function CustomerDossierPortals({ command, portal, capabilities, onClose }: Props) {
  if (!portal) return null
  if (portal.kind === 'edit-customer') return capabilities.updateClient ? <EditCustomerPortal command={command} onClose={onClose} /> : <PermissionPortal title="Modification du client" onClose={onClose} />
  if (portal.kind === 'edit-contact') return capabilities.updateClient ? <ContactPortal command={command} onClose={onClose} /> : <PermissionPortal title="Configuration du contact" onClose={onClose} />
  if (portal.kind === 'intervention') return capabilities.createServiceAction ? <InterventionPortal command={command} onClose={onClose} /> : <PermissionPortal title="Intervention client" onClose={onClose} />
  if (portal.kind === 'support-ticket') return capabilities.createSupportTicket ? <SupportTicketPortal command={command} onClose={onClose} /> : <PermissionPortal title="Création du ticket" onClose={onClose} />
  if (portal.kind === 'confidential-note') return capabilities.createNote ? <ConfidentialNotePortal command={command} onClose={onClose} /> : <PermissionPortal title="Note confidentielle" onClose={onClose} />
  if (portal.kind === 'lifecycle') return capabilities.updateClient ? <LifecyclePortal command={command} onClose={onClose} /> : <PermissionPortal title="Transition relationnelle" onClose={onClose} />
  if (portal.kind === 'archive') return capabilities.archiveClient ? <ArchivePortal command={command} onClose={onClose} /> : <PermissionPortal title="Archivage du client" onClose={onClose} />
  if (portal.kind === 'evidence') return <EvidencePortal command={command} evidenceId={portal.evidenceId} onClose={onClose} />
  return <LockedPortal title={portal.lockedTitle || 'Capacité verrouillée'} reason={portal.lockedReason || 'Le backend signé ne permet pas encore cette opération de manière sûre.'} onClose={onClose} />
}

function useMutation(onClose: () => void) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function run(operation: () => Promise<unknown>, successMessage: string) {
    setBusy(true); setError(''); setSuccess('')
    try {
      await operation()
      setSuccess(successMessage)
      router.refresh()
      window.setTimeout(onClose, 650)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur inconnue a interrompu l’opération.')
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, success, run }
}

function PortalFeedback({ error, success }: { error: string; success: string }) {
  if (success) return <div className={styles.portalSuccess}><CheckCircle2 size={17} /><span>{success}</span></div>
  if (error) return <div className={styles.portalError}><AlertTriangle size={17} /><span>{error}</span></div>
  return null
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return <label className={styles.formField}><span>{label}{required ? <b> *</b> : null}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

function PortalSidecar({ command, action }: { command: Wave2CustomerCommand; action: string }) {
  return (
    <div className={styles.portalSidecarStack}>
      <div><span>Client actif</span><strong>{command.client.display_name}</strong><p>{command.client.client_code} · {command.client.city || 'Ville non renseignée'}</p></div>
      <div><span>Situation</span><strong>{humanize(command.client.status)}</strong><p>{humanize(command.client.lifecycle_stage)} · santé {command.healthScore}/100</p></div>
      <div><span>Impact financier</span><strong>{formatDh(command.financialValueDh)}</strong><p>Exposition ou valeur dérivée des sources disponibles.</p></div>
      <div><span>Audit attendu</span><strong>{action}</strong><p>L’API signée doit tracer l’acteur, l’entité et le changement.</p></div>
    </div>
  )
}

function EditCustomerPortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const c = command.client
  const [form, setForm] = useState({
    clientCode: c.client_code, displayName: c.display_name, legalName: c.legal_name || '', clientType: c.client_type,
    city: c.city || '', country: c.country || 'Maroc', address: c.address || '', status: String(c.status), lifecycleStage: String(c.lifecycle_stage),
    source: c.source || '', healthStatus: c.health_status || '', riskLevel: c.risk_level || '', notes: c.notes || '',
  })
  const original = useMemo(() => JSON.stringify(form), []) // initial snapshot intentionally stable
  const dirty = JSON.stringify(form) !== original
  const mutation = useMutation(onClose)
  function update(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })) }
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.run(() => postOperation('/api/angelcare360/operator/clients', { operation: 'update', payload: clientPayload(command, form) }), 'Dossier client mis à jour et synchronisé.')
  }
  return (
    <SovereignPortal open title="Modifier le dossier client" eyebrow="Customer configuration portal" subtitle="Identité, classification, localisation et gouvernance relationnelle." tone="commercial" size="mission" breadcrumbs={['Clients & Croissance', c.display_name, 'Identité & gouvernance']} dirty={dirty} onClose={onClose} sidecar={<PortalSidecar command={command} action="client.updated" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-edit-form" disabled={mutation.busy}>{mutation.busy ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></div>}>
      <form id="customer-edit-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <FormChapter title="Identité institutionnelle" description="Les valeurs sont préchargées depuis le dossier actuel.">
          <div className={styles.formGrid}>
            <Field label="Code client" required><input value={form.clientCode} onChange={(e) => update('clientCode', e.target.value)} required /></Field>
            <Field label="Nom commercial" required><input value={form.displayName} onChange={(e) => update('displayName', e.target.value)} required /></Field>
            <Field label="Raison légale"><input value={form.legalName} onChange={(e) => update('legalName', e.target.value)} /></Field>
            <Field label="Type de client" required><input value={form.clientType} onChange={(e) => update('clientType', e.target.value)} required /></Field>
          </div>
        </FormChapter>
        <FormChapter title="Localisation" description="Adresse institutionnelle utilisée dans la relation Operator.">
          <div className={styles.formGrid}>
            <Field label="Ville"><input value={form.city} onChange={(e) => update('city', e.target.value)} /></Field>
            <Field label="Pays"><input value={form.country} onChange={(e) => update('country', e.target.value)} /></Field>
            <Field label="Adresse"><textarea rows={3} value={form.address} onChange={(e) => update('address', e.target.value)} /></Field>
          </div>
        </FormChapter>
        <FormChapter title="État, cycle et risque" description="Les transitions sensibles disposent d’une chambre dédiée, mais ces valeurs restent configurables par un utilisateur autorisé.">
          <div className={styles.formGrid}>
            <Field label="État" required><select value={form.status} onChange={(e) => update('status', e.target.value)}><option value="prospect">Prospect</option><option value="pilot">Pilote</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="churned">Perdu</option><option value="archived">Archivé</option></select></Field>
            <Field label="Phase relationnelle" required><select value={form.lifecycleStage} onChange={(e) => update('lifecycleStage', e.target.value)}><option value="lead">Lead</option><option value="qualified">Qualifié</option><option value="demo_done">Démo réalisée</option><option value="proposal_sent">Offre envoyée</option><option value="contract_pending">Contrat en attente</option><option value="onboarding">Onboarding</option><option value="live">Opérationnel</option><option value="renewal">Renouvellement</option><option value="at_risk">À risque</option><option value="churned">Perdu</option></select></Field>
            <Field label="Santé déclarée"><input value={form.healthStatus} onChange={(e) => update('healthStatus', e.target.value)} placeholder="good, warning, critical…" /></Field>
            <Field label="Risque"><input value={form.riskLevel} onChange={(e) => update('riskLevel', e.target.value)} placeholder="low, medium, high…" /></Field>
            <Field label="Source relationnelle"><input value={form.source} onChange={(e) => update('source', e.target.value)} /></Field>
          </div>
        </FormChapter>
        <FormChapter title="Notes de gouvernance" description="Ces notes appartiennent au dossier client et sont auditées avec la modification.">
          <Field label="Notes"><textarea rows={7} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></Field>
        </FormChapter>
      </form>
    </SovereignPortal>
  )
}

function ContactPortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const c = command.client
  const [form, setForm] = useState({ name: c.primary_contact_name || '', email: c.primary_contact_email || '', phone: c.primary_contact_phone || '' })
  const initial = useMemo(() => JSON.stringify(form), [])
  const mutation = useMutation(onClose)
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.run(() => postOperation('/api/angelcare360/operator/clients', { operation: 'update', payload: clientPayload(command, { primaryContactName: form.name, primaryContactEmail: form.email, primaryContactPhone: form.phone }) }), 'Contact principal configuré.')
  }
  return (
    <SovereignPortal open title="Configurer le contact principal" eyebrow="Decision-maker portal" subtitle="Point de responsabilité humain utilisé par la relation, le service et le renouvellement." tone="commercial" size="operational" breadcrumbs={['Clients & Croissance', c.display_name, 'Contacts & influence']} dirty={JSON.stringify(form) !== initial} onClose={onClose} sidecar={<PortalSidecar command={command} action="client.primary_contact.updated" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-contact-form" disabled={mutation.busy}>{mutation.busy ? 'Enregistrement…' : 'Enregistrer le contact'}</button></div>}>
      <form id="customer-contact-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <FormChapter title="Identité et communication" description="Le backend actuel persiste un seul contact principal. Le registre multi-contacts reste verrouillé.">
          <div className={styles.formGrid}>
            <Field label="Nom complet" required><input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} /></Field>
            <Field label="Téléphone"><input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} /></Field>
          </div>
        </FormChapter>
        <div className={styles.portalLockNote}><LockKeyhole size={17} /><p>Influence, autorité décisionnelle, institution et préférences nécessitent un registre relationnel additionnel. Ces données ne sont pas simulées.</p></div>
      </form>
    </SovereignPortal>
  )
}

function InterventionPortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const [form, setForm] = useState({ tenantId: command.tenants[0]?.id || '', title: '', description: '', priority: 'high', dueDate: '' })
  const mutation = useMutation(onClose)
  const dirty = Boolean(form.title || form.description || form.dueDate)
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.run(() => postOperation('/api/angelcare360/operator/service', { entity: 'task', operation: 'create', payload: { clientId: command.client.id, tenantId: form.tenantId || null, title: form.title, description: form.description, status: 'todo', priority: form.priority, dueDate: form.dueDate || null } }), 'Intervention client créée et reliée au dossier.')
  }
  return (
    <SovereignPortal open title="Créer une intervention client" eyebrow="Customer intervention mission" subtitle="Formaliser l’objectif, l’impact, l’échéance, la preuve et le résultat attendu." tone="commercial" size="mission" breadcrumbs={['Clients & Croissance', command.client.display_name, 'Intervention']} dirty={dirty} onClose={onClose} sidecar={<PortalSidecar command={command} action="task.created" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-intervention-form" disabled={mutation.busy}>{mutation.busy ? 'Création…' : 'Créer la mission'}</button></div>}>
      <form id="customer-intervention-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <FormChapter title="Situation et objectif" description="La mission est persistée comme action service auditable dans le backend signé.">
          <div className={styles.formGrid}>
            <Field label="Titre de la mission" required><input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} required /></Field>
            <Field label="Tenant concerné"><select value={form.tenantId} onChange={(e) => setForm((v) => ({ ...v, tenantId: e.target.value }))}><option value="">Relation client globale</option>{command.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.tenant_slug}</option>)}</select></Field>
            <Field label="Priorité" required><select value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: e.target.value }))}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></Field>
            <Field label="Échéance"><input type="date" value={form.dueDate} onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))} /></Field>
          </div>
          <Field label="Diagnostic, plan d’action, preuve et succès attendu" required><textarea rows={10} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Situation actuelle…\nImpact client et financier…\nActions attendues…\nPreuve requise…\nCritère de succès…" required /></Field>
        </FormChapter>
        <div className={styles.portalLockNote}><LockKeyhole size={17} /><p>L’affectation d’un owner n’est pas exposée sous forme d’identifiant technique. La mission sera créée non attribuée jusqu’à disponibilité d’un annuaire Operator humanisé.</p></div>
      </form>
    </SovereignPortal>
  )
}

function SupportTicketPortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const [form, setForm] = useState({ tenantId: command.tenants[0]?.id || '', subject: '', description: '', category: 'customer_service', priority: 'normal' })
  const mutation = useMutation(onClose)
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.run(() => postOperation('/api/angelcare360/operator/support', { operation: 'create', payload: { clientId: command.client.id, tenantId: form.tenantId || null, subject: form.subject, description: form.description, category: form.category, priority: form.priority, status: 'new', assignedTo: null, resolutionSummary: null } }), 'Ticket créé dans le dossier client.')
  }
  return (
    <SovereignPortal open title="Créer un ticket support" eyebrow="Service resolution portal" subtitle="Qualifier le problème, l’impact, le tenant et la priorité sans perdre le contexte client." tone="service" size="mission" breadcrumbs={['Déploiement & Service', command.client.display_name, 'Support']} dirty={Boolean(form.subject || form.description)} onClose={onClose} sidecar={<PortalSidecar command={command} action="support_ticket.created" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-ticket-form" disabled={mutation.busy}>{mutation.busy ? 'Création…' : 'Créer le ticket'}</button></div>}>
      <form id="customer-ticket-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <FormChapter title="Contexte du service" description="Le client est pré-sélectionné automatiquement; aucun identifiant technique n’est demandé à l’opérateur.">
          <div className={styles.formGrid}>
            <Field label="Client"><input value={command.client.display_name} readOnly /></Field>
            <Field label="Tenant"><select value={form.tenantId} onChange={(e) => setForm((v) => ({ ...v, tenantId: e.target.value }))}><option value="">Relation globale</option>{command.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.tenant_slug}</option>)}</select></Field>
            <Field label="Catégorie" required><input value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} required /></Field>
            <Field label="Priorité" required><select value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: e.target.value }))}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></Field>
          </div>
        </FormChapter>
        <FormChapter title="Qualification du problème" description="Décrire le symptôme, l’impact, les utilisateurs affectés, le contexte et la première attente.">
          <Field label="Sujet" required><input value={form.subject} onChange={(e) => setForm((v) => ({ ...v, subject: e.target.value }))} required /></Field>
          <Field label="Description complète" required><textarea rows={11} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} required /></Field>
        </FormChapter>
        <div className={styles.portalLockNote}><LockKeyhole size={17} /><p>Aucun moteur SLA persistant n’est présent dans le backend signé. Le ticket est créé honnêtement avec priorité et état initial, sans faux compte à rebours.</p></div>
      </form>
    </SovereignPortal>
  )
}

function ConfidentialNotePortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const [form, setForm] = useState({ noteType: 'customer_confidential', visibility: 'restricted', tenantId: '', body: '' })
  const mutation = useMutation(onClose)
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.run(() => postOperation('/api/angelcare360/operator/service', { entity: 'note', operation: 'create', payload: { clientId: command.client.id, tenantId: form.tenantId || null, noteType: form.noteType, body: form.body, visibility: form.visibility } }), 'Note confidentielle enregistrée.')
  }
  return (
    <SovereignPortal open title="Ajouter une note confidentielle" eyebrow="Governed internal note" subtitle="Tracer une information relationnelle avec une visibilité contrôlée et un audit serveur." tone="governance" size="operational" breadcrumbs={['Clients & Croissance', command.client.display_name, 'Documents & audit']} dirty={Boolean(form.body)} onClose={onClose} sidecar={<PortalSidecar command={command} action="note.created" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-note-form" disabled={mutation.busy}>{mutation.busy ? 'Enregistrement…' : 'Enregistrer la note'}</button></div>}>
      <form id="customer-note-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <div className={styles.confidentialWarning}><ShieldAlert size={18} /><div><strong>Information interne AngelCare</strong><p>Cette note ne doit jamais être exposée aux utilisateurs du tenant ou du Customer Command Center.</p></div></div>
        <div className={styles.formGrid}>
          <Field label="Type de note" required><input value={form.noteType} onChange={(e) => setForm((v) => ({ ...v, noteType: e.target.value }))} required /></Field>
          <Field label="Visibilité" required><select value={form.visibility} onChange={(e) => setForm((v) => ({ ...v, visibility: e.target.value }))}><option value="internal">Interne</option><option value="restricted">Restreinte</option><option value="public">Publique autorisée</option></select></Field>
          <Field label="Contexte tenant"><select value={form.tenantId} onChange={(e) => setForm((v) => ({ ...v, tenantId: e.target.value }))}><option value="">Dossier client global</option>{command.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.tenant_slug}</option>)}</select></Field>
        </div>
        <Field label="Contenu" required><textarea rows={13} value={form.body} onChange={(e) => setForm((v) => ({ ...v, body: e.target.value }))} required /></Field>
      </form>
    </SovereignPortal>
  )
}

function LifecyclePortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const [stage, setStage] = useState(String(command.client.lifecycle_stage))
  const [status, setStatus] = useState(String(command.client.status))
  const [reason, setReason] = useState('')
  const mutation = useMutation(onClose)
  function submit(event: FormEvent) {
    event.preventDefault()
    const auditNote = `[Transition ${new Date().toISOString()}] ${humanize(command.client.lifecycle_stage)} → ${humanize(stage)}. Raison: ${reason}`
    const notes = [command.client.notes, auditNote].filter(Boolean).join('\n\n')
    mutation.run(() => postOperation('/api/angelcare360/operator/clients', { operation: 'update', payload: clientPayload(command, { status, lifecycleStage: stage, notes }) }), 'Transition relationnelle enregistrée.')
  }
  return (
    <SovereignPortal open title="Gouverner la transition client" eyebrow="Lifecycle decision chamber" subtitle="Une transition relationnelle doit exposer son contexte, sa raison, ses effets et son audit." tone="danger" size="mission" breadcrumbs={['Clients & Croissance', command.client.display_name, 'Transition']} dirty={stage !== command.client.lifecycle_stage || status !== command.client.status || Boolean(reason)} onClose={onClose} sidecar={<PortalSidecar command={command} action="client.lifecycle.transition" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-lifecycle-form" disabled={mutation.busy || !reason.trim()}>{mutation.busy ? 'Exécution…' : 'Valider la transition'}</button></div>}>
      <form id="customer-lifecycle-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <div className={styles.decisionComparison}>
          <div><span>État actuel</span><strong>{humanize(command.client.status)}</strong><p>{humanize(command.client.lifecycle_stage)}</p></div>
          <div><span>État proposé</span><strong>{humanize(status)}</strong><p>{humanize(stage)}</p></div>
        </div>
        <FormChapter title="Décision et justification" description="La raison sera ajoutée aux notes du dossier afin de préserver le contexte en plus de l’audit API.">
          <div className={styles.formGrid}>
            <Field label="Nouvel état" required><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="prospect">Prospect</option><option value="pilot">Pilote</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="churned">Perdu</option><option value="archived">Archivé</option></select></Field>
            <Field label="Nouvelle phase" required><select value={stage} onChange={(e) => setStage(e.target.value)}><option value="lead">Lead</option><option value="qualified">Qualifié</option><option value="demo_done">Démo réalisée</option><option value="proposal_sent">Offre envoyée</option><option value="contract_pending">Contrat en attente</option><option value="onboarding">Onboarding</option><option value="live">Opérationnel</option><option value="renewal">Renouvellement</option><option value="at_risk">À risque</option><option value="churned">Perdu</option></select></Field>
          </div>
          <Field label="Raison, conditions et suivi requis" required><textarea rows={9} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
        </FormChapter>
        <div className={styles.decisionImpactGrid}><div><span>Impact client</span><strong>La perception et les actions de suivi peuvent changer.</strong></div><div><span>Impact tenant</span><strong>Aucune mutation tenant automatique.</strong></div><div><span>Impact financier</span><strong>Aucune facture modifiée automatiquement.</strong></div><div><span>Réversibilité</span><strong>Nouvelle transition autorisée avec raison.</strong></div></div>
      </form>
    </SovereignPortal>
  )
}

function ArchivePortal({ command, onClose }: { command: Wave2CustomerCommand; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const mutation = useMutation(onClose)
  const eligible = confirmation.trim().toUpperCase() === 'ARCHIVER'
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.run(() => postOperation('/api/angelcare360/operator/clients', { operation: 'archive', payload: { id: command.client.id, reason } }), 'Client archivé avec succès.')
  }
  return (
    <SovereignPortal open title="Archiver le client" eyebrow="Critical governance chamber" subtitle="L’archivage retire le client des flux actifs sans prétendre supprimer ses preuves." tone="danger" size="mission" breadcrumbs={['Clients & Croissance', command.client.display_name, 'Archivage']} dirty={Boolean(reason || confirmation)} onClose={onClose} sidecar={<PortalSidecar command={command} action="client.archived" />} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="submit" form="customer-archive-form" data-danger disabled={mutation.busy || !eligible || !reason.trim()}>{mutation.busy ? 'Archivage…' : 'Archiver définitivement'}</button></div>}>
      <form id="customer-archive-form" className={styles.portalForm} onSubmit={submit}>
        <PortalFeedback error={mutation.error} success={mutation.success} />
        <div className={styles.criticalChamber}><AlertTriangle size={22} /><div><strong>Conséquence importante</strong><p>{command.tenants.length} tenant(s), {command.subscriptions.length} abonnement(s), {command.invoices.length} facture(s) et {command.tickets.length} ticket(s) restent historiquement liés. Cette action n’archive pas automatiquement ces objets.</p></div></div>
        <Field label="Raison de l’archivage" required><textarea rows={8} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
        <Field label="Confirmation" required hint="Saisissez ARCHIVER pour autoriser l’action."><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" required /></Field>
      </form>
    </SovereignPortal>
  )
}

function EvidencePortal({ command, evidenceId, onClose }: { command: Wave2CustomerCommand; evidenceId?: string; onClose: () => void }) {
  const initial = evidenceId ? command.evidence.find((item) => item.id === evidenceId) : command.evidence[0]
  const [selected, setSelected] = useState(initial?.id || '')
  const current = command.evidence.find((item) => item.id === selected) || initial
  return (
    <SovereignPortal open title="Explorateur de preuves" eyebrow="Customer evidence portal" subtitle="Les signaux du dossier restent traçables jusqu’à leur source opérationnelle." tone="governance" size="mission" breadcrumbs={['Clients & Croissance', command.client.display_name, 'Preuves']} onClose={onClose} sidecar={current ? <div className={styles.evidenceDetail}><FileSearch size={22} /><span>{current.label}</span><h3>{current.title}</h3><p>{current.detail}</p><dl><div><dt>Source</dt><dd>{current.source}</dd></div><div><dt>État</dt><dd>{current.verified ? 'Vérifié' : 'À vérifier'}</dd></div><div><dt>Date</dt><dd>{formatDateTime(current.timestamp)}</dd></div>{current.value ? <div><dt>Valeur</dt><dd>{current.value}</dd></div> : null}</dl>{current.href ? <a href={current.href}>Ouvrir l’espace source</a> : null}</div> : undefined}>
      <EvidenceList evidence={command.evidence} selectedId={selected} onSelect={setSelected} />
    </SovereignPortal>
  )
}

function PermissionPortal({ title, onClose }: { title: string; onClose: () => void }) {
  return <LockedPortal title={title} reason="Votre session permet la consultation du dossier, mais ne possède pas l’autorité requise pour cette mutation." onClose={onClose} />
}

function LockedPortal({ title, reason, onClose }: { title: string; reason: string; onClose: () => void }) {
  return (
    <SovereignPortal open title={title} eyebrow="Capability control" subtitle="La plateforme distingue une capacité verrouillée d’un contrôle inopérant." tone="governance" size="inspector" onClose={onClose}>
      <div className={styles.lockedPortal}><LockKeyhole size={28} /><h3>Action non disponible</h3><p>{reason}</p><strong>Aucune mutation n’a été envoyée.</strong></div>
    </SovereignPortal>
  )
}

function FormChapter({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className={styles.formChapter}><header><span>Configuration</span><h3>{title}</h3><p>{description}</p></header>{children}</section>
}
