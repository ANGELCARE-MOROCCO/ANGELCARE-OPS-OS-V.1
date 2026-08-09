'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, FileClock, Network, Pencil, Save, ShieldCheck } from 'lucide-react'
import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import SovereignPortal from './SovereignPortal'
import styles from './SovereignExperience.module.css'

type Field = { name: string; label: string; kind?: 'text'|'textarea'|'number'|'date'|'select'; options?: Array<{label:string;value:string}>; required?: boolean }
type Operation = { endpoint: string; operation: string; entity?: string; label: string; fields: Field[]; values: Record<string,string>; dangerous?: boolean }

type Props = {
  entity: SovereignEntity | null
  snapshot: SovereignWorkspaceSnapshot
  onClose: () => void
}

export default function SovereignEntityPortal({ entity, snapshot, onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'inspect'|'edit'>('inspect')
  const operation = useMemo(() => entity ? operationForEntity(entity) : null, [entity])
  const [values, setValues] = useState<Record<string,string>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{tone:'good'|'bad';text:string}|null>(null)

  if (!entity) return null
  const tone = toneForEntity(entity)
  const connectedIds = snapshot.relationships[entity.id] || []
  const connected = snapshot.entities.filter((candidate) => connectedIds.includes(candidate.id) || snapshot.relationships[candidate.id]?.includes(entity.id)).slice(0,8)

  function startEdit() {
    if (!operation) return
    setValues(operation.values)
    setMessage(null)
    setMode('edit')
  }

  async function submit() {
    if (!operation) return
    setBusy(true); setMessage(null)
    try {
      const response = await fetch(operation.endpoint, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ operation:operation.operation, entity:operation.entity, payload:normalizeEntityPayload(operation.fields, values) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'L’opération n’a pas pu être enregistrée.')
      setMessage({tone:'good',text:'Configuration enregistrée et transmise au moteur Operator.'})
      router.refresh()
      setMode('inspect')
    } catch (error) {
      setMessage({tone:'bad',text:error instanceof Error ? error.message : 'Erreur opérationnelle.'})
    } finally { setBusy(false) }
  }

  return (
    <SovereignPortal
      open
      tone={operation?.dangerous ? 'danger' : tone}
      size={mode === 'edit' ? 'mission' : 'operational'}
      title={mode === 'edit' && operation ? operation.label : entity.title}
      eyebrow={mode === 'edit' ? 'Configuration opérationnelle gouvernée' : `${entity.kind} · Operational twin`}
      subtitle={entity.subtitle || 'Objet connecté au graphe opérationnel AngelCare.'}
      breadcrumbs={[towerLabel(snapshot.tower), entity.kind, entity.title]}
      onClose={onClose}
      onBack={mode === 'edit' ? () => setMode('inspect') : undefined}
      dirty={mode === 'edit' && JSON.stringify(values) !== JSON.stringify(operation?.values || {})}
      sidecar={
        <>
          <div className={styles.sidecarBlock}><h4><Network size={13}/> Relations connectées</h4><p>{connected.length ? `${connected.length} objet(s) directement liés dans le contexte chargé.` : 'Aucune relation supplémentaire visible dans ce périmètre.'}</p>{connected.map((item) => <div className={styles.sidecarEvent} key={`${item.kind}-${item.id}`}><span className={styles.sidecarDot}/><div><strong>{item.title}</strong><span>{item.kind} · {item.status || 'état non défini'}</span></div></div>)}</div>
          <div className={styles.sidecarBlock}><h4><ShieldCheck size={13}/> Gouvernance</h4><p>Toute mutation passe par l’API Operator existante, conserve le contexte et déclenche le rafraîchissement de la source.</p></div>
          <div className={styles.sidecarBlock}><h4><FileClock size={13}/> Traçabilité</h4><p>Identifiant technique masqué dans l’interface. La preuve complète reste disponible dans le journal d’audit autorisé.</p></div>
        </>
      }
      footer={mode === 'edit' ? <><button type="button" className="acSovereignSecondary" onClick={() => setMode('inspect')} disabled={busy}>Annuler</button><button type="button" className="acSovereignPrimary" onClick={() => void submit()} disabled={busy}><Save size={15}/>{busy ? 'Enregistrement…' : 'Enregistrer et actualiser'}</button></> : <><button type="button" className="acSovereignSecondary" onClick={onClose}>Fermer</button>{entity.href ? <Link className="acSovereignSecondary" href={entity.href}>Ouvrir le command room <ArrowUpRight size={14}/></Link> : null}{operation ? <button type="button" className="acSovereignPrimary" onClick={startEdit}><Pencil size={14}/>Configurer</button> : null}</>}
    >
      <div className={styles.portalChapters}><button className={styles.portalChapterActive} type="button">Situation</button><button className={styles.portalChapter} type="button">Relations</button><button className={styles.portalChapter} type="button">Évidence</button><button className={styles.portalChapter} type="button">Historique</button></div>
      {message ? <div className={styles.portalSection} style={{borderColor:message.tone==='good'?'#a7f3d0':'#fecaca',background:message.tone==='good'?'#ecfdf5':'#fef2f2'}}><strong>{message.tone==='good'?<CheckCircle2 size={17}/>:null}{message.text}</strong></div> : null}
      {mode === 'inspect' ? (
        <>
          <section className={styles.portalSection}><header className={styles.portalSectionHeader}><div><h3>Identité et état opérationnel</h3><p>Lecture humaine, sans identifiants techniques, de l’objet actif et de ses principaux signaux.</p></div><span className={styles.entityTileStatus}>{entity.status || 'État non défini'}</span></header><div className={styles.portalFactGrid}>{entity.fields.map((field) => <div className={styles.portalFact} key={field.label}><span>{field.label}</span><strong>{field.value}</strong></div>)}</div></section>
          <section className={styles.portalSection}><header className={styles.portalSectionHeader}><div><h3>Contexte de management</h3><p>L’objet est relié aux univers client, tenant, revenu, service et gouvernance selon les données réellement disponibles.</p></div></header><div className={styles.flow}><div className={styles.flowNode}><span>Type</span><strong>{entity.kind}</strong></div><div className={styles.flowNode}><span>Statut</span><strong>{entity.status || 'Indisponible'}</strong></div><div className={styles.flowNode}><span>Relations</span><strong>{connected.length}</strong></div><div className={styles.flowNode}><span>Source</span><strong>{snapshot.sourceState}</strong></div></div></section>
          {!operation ? <section className={styles.portalSection}><header className={styles.portalSectionHeader}><div><h3>Contrôle en lecture</h3><p>Aucune mutation sûre n’est publiée pour ce type d’objet dans le contrat backend actuel. Le portail n’affiche donc pas de faux bouton de configuration.</p></div></header></section> : null}
        </>
      ) : operation ? (
        <>
          <section className={styles.portalSection}><header className={styles.portalSectionHeader}><div><h3>Configuration contrôlée</h3><p>Les valeurs existantes sont préchargées. Les champs correspondent au contrat réel de l’API Operator.</p></div></header><div className="acSovereignFormGrid">{operation.fields.map((field) => <label className="acSovereignField" key={field.name}><span>{field.label}{field.required ? ' *' : ''}</span>{field.kind === 'textarea' ? <textarea rows={4} value={values[field.name] || ''} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValues((current) => ({...current,[field.name]:event.target.value}))}/> : field.kind === 'select' ? <select value={values[field.name] || ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValues((current) => ({...current,[field.name]:event.target.value}))}><option value="">Sélectionner</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'} value={values[field.name] || ''} onChange={(event: ChangeEvent<HTMLInputElement>) => setValues((current) => ({...current,[field.name]:event.target.value}))}/>}</label>)}</div></section>
          <section className={styles.portalSection}><header className={styles.portalSectionHeader}><div><h3>Conséquences et preuve</h3><p>La mutation actualisera l’objet, rafraîchira la vue et utilisera les règles de permission et d’audit du backend existant.</p></div></header><div className={styles.portalFactGrid}><div className={styles.portalFact}><span>Action</span><strong>{operation.operation}</strong></div><div className={styles.portalFact}><span>API</span><strong>{operation.endpoint}</strong></div><div className={styles.portalFact}><span>Réversibilité</span><strong>{operation.dangerous ? 'Décision sensible' : 'Selon état métier'}</strong></div><div className={styles.portalFact}><span>Validation</span><strong>Serveur Operator</strong></div></div></section>
        </>
      ) : null}
    </SovereignPortal>
  )
}

function value(row: Record<string, unknown>, key: string) {
  const current = row[key]
  return current === null || current === undefined ? '' : String(current)
}
function options(values: Array<[string, string]>) { return values.map(([label, value]) => ({ label, value })) }
const statusOptions = {
  client: options([['Prospect','prospect'],['Pilote','pilot'],['Actif','active'],['Suspendu','suspended'],['Résilié','churned'],['Archivé','archived']]),
  tenant: options([['Non créé','not_created'],['Provisionnement','provisioning'],['Actif','active'],['Suspendu','suspended'],['Archivé','archived']]),
  subscription: options([['Essai','trial'],['Actif','active'],['En retard','past_due'],['Suspendu','suspended'],['Annulé','cancelled'],['Expiré','expired'],['Archivé','archived']]),
  support: options([['Nouveau','new'],['Triage','triage'],['Assigné','assigned'],['Attente client','waiting_client'],['Attente interne','waiting_internal'],['Résolu','resolved'],['Clôturé','closed'],['Archivé','archived']]),
  task: options([['À faire','todo'],['En cours','in_progress'],['Bloqué','blocked'],['Terminé','done'],['Annulé','cancelled']]),
}

function operationForEntity(entity: SovereignEntity): Operation | null {
  const r = entity.raw
  switch (entity.kind) {
    case 'client': return {
      endpoint:'/api/angelcare360/operator/clients', operation:'update', label:`Configurer ${entity.title}`,
      values:{ id:entity.id, clientCode:value(r,'client_code'), displayName:value(r,'display_name'), clientType:value(r,'client_type'), status:value(r,'status'), lifecycleStage:value(r,'lifecycle_stage'), city:value(r,'city'), country:value(r,'country'), legalName:value(r,'legal_name'), primaryContactName:value(r,'primary_contact_name'), primaryContactEmail:value(r,'primary_contact_email'), primaryContactPhone:value(r,'primary_contact_phone'), source:value(r,'source'), healthStatus:value(r,'health_status'), riskLevel:value(r,'risk_level'), notes:value(r,'notes') },
      fields:[{name:'clientCode',label:'Code client',required:true},{name:'displayName',label:'Nom affiché',required:true},{name:'clientType',label:'Type de client',required:true},{name:'status',label:'Statut',kind:'select',options:statusOptions.client,required:true},{name:'lifecycleStage',label:'Cycle de vie',required:true},{name:'legalName',label:'Raison sociale'},{name:'city',label:'Ville'},{name:'country',label:'Pays'},{name:'primaryContactName',label:'Contact principal'},{name:'primaryContactEmail',label:'Email principal'},{name:'primaryContactPhone',label:'Téléphone'},{name:'source',label:'Origine'},{name:'healthStatus',label:'Santé'},{name:'riskLevel',label:'Risque'},{name:'notes',label:'Notes',kind:'textarea'}],
    }
    case 'tenant': return {
      endpoint:'/api/angelcare360/operator/tenants', operation:'update', label:`Configurer le tenant ${entity.title}`,
      values:{ id:entity.id, clientId:value(r,'client_id'), status:value(r,'status'), provisioningStatus:value(r,'provisioning_status'), commandCenterUrl:value(r,'command_center_url') },
      fields:[{name:'status',label:'Statut',kind:'select',options:statusOptions.tenant,required:true},{name:'provisioningStatus',label:'Provisioning'},{name:'commandCenterUrl',label:'URL Command Center'}],
    }
    case 'plan': return {
      endpoint:'/api/angelcare360/operator/plans', entity:'plan', operation:'update', label:`Configurer le plan ${entity.title}`,
      values:{ id:entity.id, planCode:value(r,'plan_code'), name:value(r,'name'), description:value(r,'description'), monthlyPriceMad:value(r,'monthly_price_mad'), annualPriceMad:value(r,'annual_price_mad'), billingCycle:value(r,'billing_cycle'), maxStudents:value(r,'max_students'), maxStaff:value(r,'max_staff'), maxUsers:value(r,'max_users'), maxSites:value(r,'max_sites'), includedModules:Array.isArray(r.included_modules)?r.included_modules.join(', '):'', includedFeatures:Array.isArray(r.included_features)?r.included_features.join(', '):'', supportLevel:value(r,'support_level'), status:value(r,'status') },
      fields:[{name:'planCode',label:'Code plan',required:true},{name:'name',label:'Nom',required:true},{name:'description',label:'Description',kind:'textarea'},{name:'monthlyPriceMad',label:'Mensuel Dh',kind:'number',required:true},{name:'annualPriceMad',label:'Annuel Dh',kind:'number',required:true},{name:'billingCycle',label:'Cycle',required:true},{name:'maxStudents',label:'Étudiants max',kind:'number'},{name:'maxStaff',label:'Personnel max',kind:'number'},{name:'maxUsers',label:'Utilisateurs max',kind:'number'},{name:'maxSites',label:'Sites max',kind:'number'},{name:'includedModules',label:'Modules (virgules)',kind:'textarea'},{name:'includedFeatures',label:'Fonctionnalités (virgules)',kind:'textarea'},{name:'supportLevel',label:'Support'},{name:'status',label:'Statut',kind:'select',options:options([['Brouillon','draft'],['Actif','active'],['Retiré','retired'],['Archivé','archived']]),required:true}],
    }
    case 'package': return {
      endpoint:'/api/angelcare360/operator/packages', operation:'update', label:`Configurer le package ${entity.title}`,
      values:{ id:entity.id, packageCode:value(r,'package_code'), name:value(r,'name'), description:value(r,'description'), moduleKeys:Array.isArray(r.module_keys)?r.module_keys.join(', '):'', featureKeys:Array.isArray(r.feature_keys)?r.feature_keys.join(', '):'', status:value(r,'status') },
      fields:[{name:'packageCode',label:'Code package',required:true},{name:'name',label:'Nom',required:true},{name:'description',label:'Description',kind:'textarea'},{name:'moduleKeys',label:'Modules (virgules)',kind:'textarea'},{name:'featureKeys',label:'Fonctionnalités (virgules)',kind:'textarea'},{name:'status',label:'Statut',kind:'select',options:options([['Brouillon','draft'],['Actif','active'],['Retiré','retired'],['Archivé','archived']]),required:true}],
    }
    case 'subscription': return {
      endpoint:'/api/angelcare360/operator/subscriptions', operation:'update', label:`Configurer ${entity.title}`,
      values:{ id:entity.id, clientId:value(r,'client_id'), tenantId:value(r,'tenant_id'), planId:value(r,'plan_id'), subscriptionCode:value(r,'subscription_code'), status:value(r,'status'), startDate:value(r,'start_date'), trialEndsAt:value(r,'trial_ends_at'), currentPeriodStart:value(r,'current_period_start'), currentPeriodEnd:value(r,'current_period_end'), billingCycle:value(r,'billing_cycle'), billingAmountMad:value(r,'billing_amount_mad'), discountAmountMad:value(r,'discount_amount_mad'), cancellationReason:value(r,'cancellation_reason'), suspendedReason:value(r,'suspended_reason') },
      fields:[{name:'subscriptionCode',label:'Code abonnement',required:true},{name:'status',label:'Statut',kind:'select',options:statusOptions.subscription,required:true},{name:'startDate',label:'Début',kind:'date',required:true},{name:'trialEndsAt',label:'Fin essai',kind:'date'},{name:'currentPeriodStart',label:'Début période',kind:'date'},{name:'currentPeriodEnd',label:'Fin période',kind:'date'},{name:'billingCycle',label:'Cycle',required:true},{name:'billingAmountMad',label:'Montant Dh',kind:'number',required:true},{name:'discountAmountMad',label:'Remise Dh',kind:'number'},{name:'cancellationReason',label:'Motif annulation',kind:'textarea'},{name:'suspendedReason',label:'Motif suspension',kind:'textarea'}],
    }
    case 'billing-account': return {
      endpoint:'/api/angelcare360/operator/billing', entity:'account', operation:'update', label:`Configurer ${entity.title}`,
      values:{ id:entity.id, clientId:value(r,'client_id'), billingName:value(r,'billing_name'), billingEmail:value(r,'billing_email'), billingPhone:value(r,'billing_phone'), billingAddress:value(r,'billing_address'), taxIdentifier:value(r,'tax_identifier'), paymentTermsDays:value(r,'payment_terms_days'), status:value(r,'status') },
      fields:[{name:'billingName',label:'Nom de facturation',required:true},{name:'billingEmail',label:'Email',required:true},{name:'billingPhone',label:'Téléphone'},{name:'billingAddress',label:'Adresse',kind:'textarea'},{name:'taxIdentifier',label:'Identifiant fiscal'},{name:'paymentTermsDays',label:'Délai de paiement',kind:'number'},{name:'status',label:'Statut',kind:'select',options:options([['Actif','active'],['Inactif','inactive'],['Archivé','archived']]),required:true}],
    }
    case 'invoice': return {
      endpoint:'/api/angelcare360/operator/billing', entity:'invoice', operation:value(r,'status') === 'draft' ? 'issue' : 'cancel', label:value(r,'status') === 'draft' ? `Émettre ${entity.title}` : `Annuler ${entity.title}`,
      values:{ id:entity.id, reason:'' }, fields:value(r,'status') === 'draft' ? [{name:'id',label:'Facture',required:true}] : [{name:'reason',label:'Motif et preuve',kind:'textarea',required:true}], dangerous:value(r,'status') !== 'draft',
    }
    case 'payment': return {
      endpoint:'/api/angelcare360/operator/billing', entity:'payment', operation:value(r,'status') === 'pending' ? 'confirm' : 'reject', label:value(r,'status') === 'pending' ? `Confirmer ${entity.title}` : `Réexaminer ${entity.title}`,
      values:{ id:entity.id, reason:'' }, fields:value(r,'status') === 'pending' ? [{name:'id',label:'Paiement',required:true}] : [{name:'reason',label:'Motif du rejet',kind:'textarea',required:true}], dangerous:value(r,'status') !== 'pending',
    }
    case 'dunning': return { endpoint:'/api/angelcare360/operator/billing',entity:'dunning',operation:'complete',label:`Clôturer ${entity.title}`,values:{id:entity.id},fields:[{name:'id',label:'Action de recouvrement',required:true}] }
    case 'contract': return { endpoint:'/api/angelcare360/operator/contracts',operation:'status',label:`Faire évoluer ${entity.title}`,values:{id:entity.id,status:value(r,'status')},fields:[{name:'status',label:'Statut',kind:'select',options:options([['Brouillon','draft'],['Envoyé','sent'],['Signé','signed'],['Actif','active'],['Expiré','expired'],['Annulé','cancelled'],['Archivé','archived']]),required:true}] }
    case 'renewal': return { endpoint:'/api/angelcare360/operator/renewals',operation:'status',label:'Faire évoluer le renouvellement',values:{id:entity.id,status:value(r,'status')},fields:[{name:'status',label:'Statut',kind:'select',options:options([['À venir','upcoming'],['En discussion','in_discussion'],['Proposition envoyée','proposal_sent'],['Renouvelé','renewed'],['À risque','at_risk'],['Perdu','lost'],['Annulé','cancelled']]),required:true}] }
    case 'ticket': return { endpoint:'/api/angelcare360/operator/support',operation:'status',label:'Faire évoluer le ticket support',values:{id:entity.id,status:value(r,'status'),reason:''},fields:[{name:'status',label:'Statut',kind:'select',options:statusOptions.support,required:true},{name:'reason',label:'Motif / dépendance',kind:'textarea'}] }
    case 'service-request': return {
      endpoint:'/api/angelcare360/operator/service',entity:'request',operation:'update',label:`Configurer ${entity.title}`,
      values:{id:entity.id,clientId:value(r,'client_id'),tenantId:value(r,'tenant_id'),requestType:value(r,'request_type'),title:value(r,'title'),description:value(r,'description'),priority:value(r,'priority'),status:value(r,'status'),assignedTo:value(r,'assigned_to'),dueDate:value(r,'due_date')},
      fields:[{name:'requestType',label:'Type',required:true},{name:'title',label:'Titre',required:true},{name:'description',label:'Description',kind:'textarea',required:true},{name:'priority',label:'Priorité',kind:'select',options:options([['Basse','low'],['Normale','normal'],['Haute','high'],['Urgente','urgent']]),required:true},{name:'status',label:'Statut',kind:'select',options:statusOptions.support,required:true},{name:'assignedTo',label:'Assigné à'},{name:'dueDate',label:'Échéance',kind:'date'}],
    }
    case 'task': return {
      endpoint:'/api/angelcare360/operator/service',entity:'task',operation:'update',label:`Configurer ${entity.title}`,
      values:{id:entity.id,clientId:value(r,'client_id'),tenantId:value(r,'tenant_id'),title:value(r,'title'),description:value(r,'description'),ownerId:value(r,'owner_id'),status:value(r,'status'),priority:value(r,'priority'),dueDate:value(r,'due_date')},
      fields:[{name:'title',label:'Action',required:true},{name:'description',label:'Description',kind:'textarea'},{name:'ownerId',label:'Responsable'},{name:'status',label:'Statut',kind:'select',options:statusOptions.task,required:true},{name:'priority',label:'Priorité',kind:'select',options:options([['Basse','low'],['Normale','normal'],['Haute','high'],['Urgente','urgent']]),required:true},{name:'dueDate',label:'Échéance',kind:'date'}],
    }
    case 'incident': return { endpoint:'/api/angelcare360/operator/service',entity:'incident',operation:'resolve',label:'Chambre de résolution incident',values:{id:entity.id},fields:[{name:'id',label:'Incident',required:true}],dangerous:true }
    case 'feature': return { endpoint:'/api/angelcare360/operator/features',entity:'flag',operation:'update',label:`Configurer ${entity.title}`,values:{id:entity.id,enabled:String(Boolean(r.enabled)),status:value(r,'status'),lockedReason:value(r,'locked_reason'),scheduledFor:value(r,'scheduled_for')},fields:[{name:'enabled',label:'Activé',kind:'select',options:options([['Oui','true'],['Non','false']]),required:true},{name:'status',label:'Statut',kind:'select',options:options([['Activé','enabled'],['Désactivé','disabled'],['Verrouillé','locked'],['Planifié','scheduled'],['Configuration requise','requires_configuration']]),required:true},{name:'lockedReason',label:'Motif de verrouillage',kind:'textarea'},{name:'scheduledFor',label:'Planifié pour',kind:'date'}] }
    case 'limit': return { endpoint:'/api/angelcare360/operator/features',entity:'usage',operation:'update',label:`Configurer ${entity.title}`,values:{id:entity.id,allowedValue:value(r,'allowed_value'),currentValue:value(r,'current_value'),status:value(r,'status'),resetCycle:value(r,'reset_cycle')},fields:[{name:'allowedValue',label:'Valeur autorisée',kind:'number'},{name:'currentValue',label:'Valeur actuelle',kind:'number'},{name:'status',label:'Statut',kind:'select',options:options([['Active','active'],['En pause','paused'],['Archivée','archived']]),required:true},{name:'resetCycle',label:'Cycle de remise à zéro'}] }
    case 'onboarding': return {
      endpoint:'/api/angelcare360/operator/onboarding',operation:'update',label:`Piloter ${entity.title}`,
      values:{id:entity.id,clientId:value(r,'client_id'),tenantId:value(r,'tenant_id'),title:value(r,'title'),description:value(r,'description'),ownerId:value(r,'owner_id'),status:value(r,'status'),priority:value(r,'priority'),dueDate:value(r,'due_date')},
      fields:[{name:'title',label:'Mission',required:true},{name:'description',label:'Description',kind:'textarea'},{name:'ownerId',label:'Responsable'},{name:'status',label:'Statut',kind:'select',options:statusOptions.task,required:true},{name:'priority',label:'Priorité',kind:'select',options:options([['Basse','low'],['Normale','normal'],['Haute','high'],['Urgente','urgent']]),required:true},{name:'dueDate',label:'Échéance',kind:'date'}],
    }
    default: return null
  }
}

function toneForEntity(entity: SovereignEntity): 'neutral'|'commercial'|'tenant'|'finance'|'service'|'governance'|'danger' {
  if (['client','contract','renewal'].includes(entity.kind)) return 'commercial'
  if (['tenant','subscription','feature','limit','plan','package'].includes(entity.kind)) return 'tenant'
  if (['billing-account','invoice','payment','dunning'].includes(entity.kind)) return 'finance'
  if (['ticket','incident','onboarding','task','service-request','note'].includes(entity.kind)) return entity.kind === 'incident' ? 'danger' : 'service'
  if (entity.kind === 'audit') return 'governance'
  return 'neutral'
}
function towerLabel(tower: SovereignWorkspaceSnapshot['tower']) {
  return ({ direction:'Direction', growth:'Croissance', tenants:'Tenants & Produit', revenue:'Revenus', service:'Service', platform:'Plateforme' })[tower]
}

function normalizeEntityPayload(fields: Field[], values: Record<string, string>) {
  const fieldMap = new Map(fields.map((field) => [field.name, field]))
  const arrays = new Set(['includedModules', 'includedFeatures', 'moduleKeys', 'featureKeys'])
  return Object.fromEntries(Object.entries(values).map(([name, rawValue]) => {
    const field = fieldMap.get(name)
    const trimmed = rawValue.trim()
    if (arrays.has(name)) return [name, trimmed.split(',').map((entry) => entry.trim()).filter(Boolean)]
    if (name === 'enabled' || name === 'blocking') return [name, trimmed === 'true']
    if (field?.kind === 'number') return [name, trimmed === '' ? null : Number(trimmed)]
    return [name, trimmed === '' ? null : trimmed]
  }))
}
