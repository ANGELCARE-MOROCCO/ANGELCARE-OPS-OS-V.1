'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle, ArrowLeft, BookOpenCheck, CheckCircle2, ChevronRight, ClipboardCheck,
  GraduationCap, KeyRound, LifeBuoy, Loader2, PlayCircle, RefreshCw, Route, Search,
  ShieldCheck, SlidersHorizontal, TerminalSquare, UsersRound, X,
} from 'lucide-react'
import type { AiProviderSnapshot, JsonRecord } from '@/lib/ai-provider-control/types'
import { Badge, EmptyState, Metric, formatDate, statusTone, text } from './headquarters-primitives'
import styles from './ai-sovereignty-headquarters.module.css'

type Actor = { id: string; name: string; role: string }
type RoleKey = 'executive' | 'governance_admin' | 'provider_admin' | 'revenue_manager' | 'incident_manager' | 'auditor' | 'new_operator'

const roles: Array<{ key: RoleKey; label: string; promise: string }> = [
  { key: 'executive', label: 'Executive', promise: 'Décisions, risques et publication' },
  { key: 'governance_admin', label: 'AI Governance Admin', promise: 'Routage, quotas et versions' },
  { key: 'provider_admin', label: 'Provider Admin', promise: 'Dossiers, credentials et modèles' },
  { key: 'revenue_manager', label: 'Revenue AI Manager', promise: 'Commandes, schedules et usage' },
  { key: 'incident_manager', label: 'Incident Manager', promise: 'Diagnostic, résolution et prévention' },
  { key: 'auditor', label: 'Auditor', promise: 'Preuves, contrôles et conformité' },
  { key: 'new_operator', label: 'New Operator', promise: 'Parcours complet accompagné' },
]

const fallbackArticles: JsonRecord[] = [
  { article_key:'provider-dossier-create',sort_order:10,category:'Provider Management Foundation',title:'Créer un dossier fournisseur',summary:'Créer le passeport institutionnel, le capacity pool et les limites externes.',roles:['provider_admin','governance_admin','new_operator'],objective:'Créer un fournisseur sans perturber les routes actives.',prerequisites:['Project ID confirmé','Plafonds fournisseur connus','Autorité manage'],steps:['Ouvrir Portefeuille fournisseurs','Créer le dossier et son code stable','Créer le capacity pool','Enregistrer les plafonds externes','Conserver le dossier en Draft'],evidence:['Capture du passeport','ID du capacity pool','Audit create_dossier'],errors:['Project ID inventé','Quota externe confondu avec quota SANILA'],recovery:['Corriger le passeport','Conserver la route désactivée'],checklist:['Nom officiel','Code stable','Project ID','Tier','Owner']},
  { article_key:'credential-activate',sort_order:20,category:'Credential Security',title:'Ajouter, valider et activer une credential',summary:'Chiffrer la clé, tester un modèle autorisé et activer sans exposition navigateur.',roles:['provider_admin','governance_admin','new_operator'],objective:'Mettre une credential en production avec preuve.',prerequisites:['Dossier créé','Modèle actif','Vault disponible'],steps:['Ajouter la credential write-only','Choisir le capacity pool','Enregistrer dans Vault','Tester la connectivité','Vérifier la preuve de santé','Activer après validation'],evidence:['Fingerprint','Validated at','Last success','Audit activation'],errors:['No active model','Minimum interval','Provider output mismatch','Vault unavailable'],recovery:['Vérifier modèle','Réinitialiser état testing','Consulter Incident Laboratory'],checklist:['Secret chiffré','Fingerprint visible','Test réussi','Activation explicite']},
  { article_key:'credential-rotate',sort_order:30,category:'Credential Security',title:'Rotation sans interruption',summary:'Introduire V2, observer, mettre V1 en standby puis révoquer.',roles:['provider_admin','governance_admin'],objective:'Changer de secret sans panne.',prerequisites:['V1 active','Nouvelle clé prête'],steps:['Créer V2','Tester V2','Activer V2','Vérifier les appels','Passer V1 en standby','Révoquer V1 après observation'],evidence:['Deux versions','Dernier succès V2','V1 standby/revoked'],errors:['Révocation prématurée','Deux credentials actives non voulues'],recovery:['Réactiver la version saine','Restaurer la route'],checklist:['V2 validée','Route saine','Fenêtre observation','V1 révoquée']},
  { article_key:'revenue-assign',sort_order:40,category:'Revenue AI Operations',title:'Alimenter Revenue Command OS',summary:'Créer l’affectation primaire, le modèle et la route exclusive ou fallback.',roles:['revenue_manager','governance_admin','new_operator'],objective:'Connecter Revenue OS à une ressource gouvernée.',prerequisites:['Credential active','Modèles actifs'],steps:['Ouvrir Matrice alimentation','Créer affectation revenue_os','Définir modèle primaire et fallback','Créer la route','Simuler','Publier configuration'],evidence:['Cellule Primary','Route enabled','Simulation allowed'],errors:['Module non alimenté','Route sans assignment','Fallback même capacity pool'],recovery:['Recréer affectation','Vérifier indépendance du fallback'],checklist:['Assignment enabled','Primary model','Routing enabled','Version publiée']},
  { article_key:'quota-change',sort_order:50,category:'Quota & Cost Governance',title:'Modifier un quota en sécurité',summary:'Prévisualiser l’impact avant une baisse ou augmentation.',roles:['governance_admin','executive','revenue_manager'],objective:'Contrôler l’usage sans bloquer les opérations prioritaires.',prerequisites:['Usage actuel connu','Schedules recensés'],steps:['Ouvrir Laboratoire capacité','Lire consommation et réserves','Simuler impact','Créer change request','Approuver','Modifier la politique','Observer'],evidence:['Impact analysis','Change request','Version publiée'],errors:['Augmenter SANILA au-dessus du plafond fournisseur','Baisser sous usage sans prévoir déferrement'],recovery:['Restaurer version précédente','Suspendre schedule secondaire'],checklist:['Plafond fournisseur','Usage actuel','Impact schedules','Reserve','Rollback']},
  { article_key:'resolve-429',sort_order:60,category:'Incident Response',title:'Résoudre un 429 RESOURCE_EXHAUSTED',summary:'Séparer plafond fournisseur, quota SANILA, cadence et fallback.',roles:['incident_manager','provider_admin','governance_admin','new_operator'],objective:'Rétablir le service sans retry loop.',prerequisites:['Incident ou health event disponible'],steps:['Inspecter l’erreur','Identifier capacity pool','Comparer plafonds et usage','Inspecter schedules/retries','Activer cooldown','Simuler fallback indépendant','Déférer si nécessaire','Clore avec prévention'],evidence:['Incident dossier','Root cause','Resolution','Prevention'],errors:['Utiliser une seconde clé du même project comme faux fallback','Retry agressif'],recovery:['Pause schedule','Reserve-only','Provider indépendant'],checklist:['Pool identifié','Quota vérifié','Retries contrôlés','Fallback indépendant','Incident clos']},
  { article_key:'model-replace',sort_order:70,category:'Model Lifecycle',title:'Remplacer un modèle indisponible',summary:'Tester le remplacement et publier une configuration compatible.',roles:['provider_admin','governance_admin','revenue_manager'],objective:'Éliminer un 404 modèle sans casser les commandes.',prerequisites:['Nouveau model code confirmé'],steps:['Suspendre le modèle défaillant','Enregistrer le remplacement','Tester génération/JSON/grounding','Analyser commandes affectées','Modifier assignments/policies','Simuler','Publier'],evidence:['Health checks','Compatibility evidence','Change request'],errors:['Utiliser un alias non supporté','Grounding activé sans capacité'],recovery:['Rollback version','Fallback compatible'],checklist:['Code exact','Capabilities testées','Impact analysé','Version publiée']},
  { article_key:'route-failover',sort_order:80,category:'Advanced Routing',title:'Créer un failover réellement indépendant',summary:'Éviter les faux fallbacks partageant le même quota projet.',roles:['governance_admin','provider_admin'],objective:'Assurer une reprise de service réelle.',prerequisites:['Deux capacity pools indépendants'],steps:['Créer dossier ou pool indépendant','Ajouter credential','Tester modèle','Créer assignment failover','Ajouter au routing','Simuler 429/5xx','Publier'],evidence:['Deux external project IDs','Simulation fallback','Route version'],errors:['Deux clés même projet','Fallback sans quota'],recovery:['Désactiver fallback trompeur','Créer pool indépendant'],checklist:['Projet indépendant','Credential active','Model compatible','Simulation pass']},
  { article_key:'config-publish',sort_order:90,category:'Change Governance',title:'Publier et rollback une configuration',summary:'Créer une preuve complète et conserver un chemin de retour.',roles:['executive','governance_admin','auditor'],objective:'Déployer un changement avec contrôle.',prerequisites:['Change request approved','Testing evidence'],steps:['Comparer actuel/proposé','Vérifier impact','Publier snapshot','Observer santé et usage','Accepter ou rollback'],evidence:['Version code','Checksum','Published at','Audit'],errors:['Publication sans rollback plan','Test non documenté'],recovery:['Restore configuration version'],checklist:['Reason','Impact','Testing','Approval','Rollback']},
  { article_key:'credential-destroy',sort_order:100,category:'Credential Security',title:'Détruire définitivement une credential',summary:'Révoquer, vérifier les dépendances, approuver puis supprimer le secret Vault.',roles:['provider_admin','governance_admin','executive','auditor'],objective:'Supprimer irréversiblement un secret sans interrompre le service.',prerequisites:['Credential non active','Remplacement disponible ou module suspendu'],steps:['Inspecter dépendances','Passer standby/revoked','Créer destruction request','Taper confirmation exacte','Faire approuver','Exécuter','Vérifier tombstone'],evidence:['Dependency snapshot','Approval','Destroyed at','Fingerprint tombstone'],errors:['Détruire la credential active','Détruire sans remplacement'],recovery:['Impossible après destruction; restaurer avec nouvelle credential'],checklist:['Non active','Dépendances zéro','Approval','Confirmation','Tombstone']},
  { article_key:'incident-workbook',sort_order:110,category:'Incident Response',title:'Conduire un incident de bout en bout',summary:'Détection, qualification, chronologie, root cause et prévention.',roles:['incident_manager','auditor','new_operator'],objective:'Transformer une erreur en apprentissage institutionnel.',prerequisites:['Évidence collectée'],steps:['Créer incident code','Classer sévérité','Identifier modules','Documenter impact','Exécuter diagnostic','Appliquer correction sûre','Observer','Clore','Définir prévention'],evidence:['Timeline','Actions attempted','Resolution','Root cause'],errors:['Clore sans preuve','Confondre historique et incident actif'],recovery:['Rouvrir incident','Ajouter preuves'],checklist:['Code','Severity','Impact','Evidence','Resolution','Prevention']},
  { article_key:'audit-export',sort_order:120,category:'Audit & Compliance',title:'Préparer un dossier de preuve AI',summary:'Exporter configuration, usage, incidents et changements pour audit.',roles:['auditor','executive','governance_admin'],objective:'Fournir une preuve traçable sans exposer les secrets.',prerequisites:['Période et périmètre définis'],steps:['Définir période','Exporter usage','Exporter config versions','Associer incidents','Associer change requests','Vérifier absence de secret','Signer le dossier'],evidence:['CSV','A4 summary','Checksums','Audit log'],errors:['Inclure un secret','Mélanger usage SANILA et provider reconciled'],recovery:['Révoquer export','Recréer dossier nettoyé'],checklist:['Période','Scope','No secrets','Checksums','Authority']},
]

function phase6(snapshot: AiProviderSnapshot) { return snapshot.phase6 || { incidents: [], changeRequests: [], destructionRequests: [], providerAdapters: [], capabilities: [], modules: [], sopArticles: [], sopProgress: [], operatorNotes: [], actionJobs: [], tombstones: [] } }
function array(value: unknown): string[] { return Array.isArray(value) ? value.map(String) : [] }

export default function AiSovereigntyOperatorAcademy({ actor }: { actor: Actor }) {
  const [snapshot, setSnapshot] = useState<AiProviderSnapshot | null>(null)
  const [role, setRole] = useState<RoleKey>('new_operator')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<JsonRecord | null>(null)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/ai-provider-control/snapshot', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'SNAPSHOT_FAILED')
      setSnapshot(result.data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Academy indisponible.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const articles = useMemo(() => {
    const source = snapshot && phase6(snapshot).sopArticles.length ? phase6(snapshot).sopArticles : fallbackArticles
    return source.filter((article) => {
      const rolesForArticle = array(article.roles)
      const roleMatch = !rolesForArticle.length || rolesForArticle.includes(role) || role === 'new_operator'
      const q = query.toLowerCase().trim()
      const queryMatch = !q || `${text(article.title)} ${text(article.category)} ${text(article.summary)} ${JSON.stringify(article)}`.toLowerCase().includes(q)
      return roleMatch && queryMatch
    })
  }, [query, role, snapshot])

  const progress = snapshot ? phase6(snapshot).sopProgress.filter((row) => row.user_id === actor.id) : []
  const completeCount = progress.filter((row) => row.status === 'completed').length
  const articleProgress = selected ? progress.find((row) => row.article_key === selected.article_key) : null

  useEffect(() => {
    if (!selected) return
    const row = progress.find((item) => item.article_key === selected.article_key)
    setChecklist((row?.checklist_state as Record<string, boolean>) || {})
    setNotes(text(row?.workbook_notes))
  }, [selected, progress])

  async function saveProgress(status: 'in_progress' | 'completed') {
    if (!selected) return
    setBusy(true); setError(''); setMessage('')
    try {
      const required = array(selected.checklist)
      const done = required.filter((item) => checklist[item]).length
      const completion = required.length ? Math.round(done / required.length * 100) : status === 'completed' ? 100 : 10
      if (status === 'completed' && required.length && done !== required.length) throw new Error('CHECKLIST_INCOMPLETE')
      const response = await fetch('/api/ai-provider-control/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'phase6_save_sop_progress', payload: { articleKey: selected.article_key, roleKey: role, status, completionPercent: status === 'completed' ? 100 : completion, checklistState: checklist, workbookNotes: notes, assessmentScore: status === 'completed' ? 100 : null } }) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'SAVE_FAILED')
      setMessage(status === 'completed' ? 'Procédure terminée et enregistrée.' : 'Workbook sauvegardé.'); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sauvegarde impossible.') }
    finally { setBusy(false) }
  }

  if (loading && !snapshot) return <main className={styles.loading}><Loader2 className={styles.spin}/><strong>Ouverture de l’Operator Academy</strong><span>Chargement des SOP, workbooks et certifications…</span></main>

  return <main className={styles.root}>
    <header className={styles.academyHero} style={{ marginTop: 0 }}><div><GraduationCap/><span>SANILA AI SOVEREIGNTY OPERATOR ACADEMY</span><h2>Manuel vivant, workbook et certification opérateur</h2><p>Chaque procédure est reliée aux véritables objets du Control Plane, aux erreurs possibles, aux preuves attendues et à l’autorité nécessaire.</p></div><Link href="/ai-provider-control" className={styles.lightButton}><ArrowLeft/> Retour Headquarters</Link></header>
    {(error || message) ? <div className={`${styles.message} ${error ? styles.messageError : styles.messageSuccess}`}><div>{error ? <AlertTriangle/> : <CheckCircle2/>}<strong>{error || message}</strong></div><button onClick={() => { setError(''); setMessage('') }}><X/></button></div> : null}
    <section className={styles.academyStats}>
      <Metric icon={BookOpenCheck} label="Procédures" value={articles.length} detail="Adaptées au rôle choisi" tone="blue"/>
      <Metric icon={ClipboardCheck} label="Terminées" value={completeCount} detail="Progression personnelle" tone="good"/>
      <Metric icon={UsersRound} label="Rôle actif" value={roles.find((item) => item.key === role)?.label || role} detail="Le contenu et l’autorité s’adaptent" tone="blue"/>
      <Metric icon={TerminalSquare} label="Practice Labs" value="5" detail="Aucun effet production" tone="warn"/>
    </section>
    <section className={styles.panel} style={{ marginBottom: 14 }}>
      <div className={styles.sectionTitle}><div><span>ROLE & KNOWLEDGE FILTER</span><h2>Construire votre parcours opérateur</h2><p>Sélectionnez votre fonction puis recherchez une erreur, une action ou un objet.</p></div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{roles.map((item) => <button key={item.key} className={role === item.key ? styles.primaryButton : styles.secondaryButton} onClick={() => setRole(item.key)}><ShieldCheck size={14}/>{item.label}</button>)}</div>
      <label className={styles.field} style={{ marginTop: 14 }}><span>Recherche manuel et troubleshooting</span><div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #cddce7', borderRadius: 10, padding: '0 11px' }}><Search size={16}/><input value={query} onChange={(event: any) => setQuery(event.target.value)} placeholder="429, Vault, rotation, modèle indisponible, route…" style={{ border: 0, boxShadow: 'none' }}/></div></label>
    </section>
    <div className={styles.changeColumns}>
      <section className={styles.panel}>
        <div className={styles.sectionTitle}><div><span>SEARCHABLE SOP LIBRARY</span><h2>Procédures disponibles</h2><p>{roles.find((item) => item.key === role)?.promise}</p></div></div>
        <div className={styles.academyCourses}><div>{articles.map((article) => { const row = progress.find((item) => item.article_key === article.article_key); return <button key={text(article.article_key)} onClick={() => setSelected(article)}><div className={styles.courseNumber}>{String(article.sort_order || 0).padStart(2, '0')}</div><div><span>{text(article.category)}</span><strong>{text(article.title)}</strong><small>{text(article.summary)}</small></div>{row ? <Badge tone={statusTone(row.status)}>{text(row.status)}</Badge> : <ChevronRight/>}</button> })}</div></div>
        {!articles.length ? <EmptyState icon={BookOpenCheck} title="Aucune procédure" body="Modifiez le rôle ou la recherche."/> : null}
      </section>
      <section className={styles.panel}>
        {!selected ? <EmptyState icon={GraduationCap} title="Sélectionnez une procédure" body="Le workbook détaillé, les étapes, erreurs, preuves et checklist apparaîtront ici."/> : <div>
          <div className={styles.sectionTitle}><div><span>{text(selected.category)}</span><h2>{text(selected.title)}</h2><p>{text(selected.summary)}</p></div>{articleProgress ? <Badge tone={statusTone(articleProgress.status)}>{text(articleProgress.status)}</Badge> : null}</div>
          <div className={styles.drawerPassport}><div><span>Objectif</span><strong>{text(selected.objective)}</strong></div><div><span>Autorité</span><strong>{roles.find((item) => item.key === role)?.label}</strong></div><div><span>Version</span><strong>{text(selected.version || '1.0.0')}</strong></div><div><span>Dernière progression</span><strong>{formatDate(articleProgress?.updated_at)}</strong></div></div>
          <ManualBlock title="Prérequis" icon={<ShieldCheck/>} items={array(selected.prerequisites)}/>
          <ManualBlock title="Exécution pas à pas" icon={<PlayCircle/>} items={array(selected.steps)} numbered/>
          <ManualBlock title="Preuves à capturer" icon={<ClipboardCheck/>} items={array(selected.evidence)}/>
          <ManualBlock title="Erreurs fréquentes" icon={<AlertTriangle/>} items={array(selected.errors)}/>
          <ManualBlock title="Actions de récupération" icon={<LifeBuoy/>} items={array(selected.recovery)}/>
          <div style={{ marginTop: 14, padding: 14, border: '1px solid #d9e5ee', borderRadius: 14, background: '#f8fbfd' }}><strong style={{ fontSize: 11 }}>Checklist workbook</strong><div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{array(selected.checklist).map((item) => <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 800 }}><input type="checkbox" checked={Boolean(checklist[item])} onChange={(event: any) => setChecklist((current) => ({ ...current, [item]: event.target.checked }))}/>{item}</label>)}</div></div>
          <label className={styles.field} style={{ marginTop: 14 }}><span>Notes opérateur / preuve / observations</span><textarea rows={6} value={notes} onChange={(event: any) => setNotes(event.target.value)} placeholder="Documentez ce qui a été fait, le résultat et les références de preuve…"/></label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}><button className={styles.secondaryButton} disabled={busy} onClick={() => void saveProgress('in_progress')}><RefreshCw size={14}/> Sauvegarder</button><button className={styles.primaryButton} disabled={busy} onClick={() => void saveProgress('completed')}>{busy ? <Loader2 className={styles.spin}/> : <CheckCircle2/>} Terminer & certifier</button></div>
        </div>}
      </section>
    </div>
    <section className={styles.panel} style={{ marginTop: 14 }}>
      <div className={styles.sectionTitle}><div><span>SAFE PRACTICE LABORATORY</span><h2>Pratiquer sans modifier la production</h2><p>Les scénarios simulent les décisions et exigent une checklist avant de révéler le résultat attendu.</p></div></div>
      <div className={styles.decisionTrees}><div><article><KeyRound/><h3>Rotation V1 → V2</h3><p>Déterminez l’ordre sans downtime.</p></article><article><SlidersHorizontal/><h3>Quota divisé par deux</h3><p>Identifiez les schedules impactés.</p></article><article><Route/><h3>Failover sur 429</h3><p>Vérifiez l’indépendance du projet.</p></article><article><LifeBuoy/><h3>Provider outage</h3><p>Priorisez incident, cooldown et reprise.</p></article></div></div>
    </section>
  </main>
}

function ManualBlock({ title, icon, items, numbered = false }: { title: string; icon: ReactNode; items: string[]; numbered?: boolean }) {
  return <section style={{ marginTop: 12, padding: 13, border: '1px solid #dce7ef', borderRadius: 13, background: '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>{icon}<strong style={{ fontSize: 10 }}>{title}</strong></div><ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, listStyle: numbered ? 'decimal' : 'disc' }}>{items.map((item, index) => <li key={`${index}-${item}`} style={{ fontSize: 9, lineHeight: 1.45, color: '#526b7d' }}>{item}</li>)}</ol></section>
}
