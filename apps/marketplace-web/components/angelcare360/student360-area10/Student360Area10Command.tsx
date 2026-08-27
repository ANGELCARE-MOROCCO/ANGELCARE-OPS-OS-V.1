'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileWarning,
  GraduationCap,
  HeartPulse,
  History,
  Home,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import type {
  Angelcare360Area10Attention,
  Angelcare360Area10CommandData,
  Angelcare360Area10Dossier,
  Angelcare360Area10DossierTab,
  Angelcare360Area10Metric,
  Angelcare360Area10MutationRequest,
  Angelcare360Area10MutationResult,
  Angelcare360Area10StudentSummary,
  Angelcare360Area10Tone,
  Angelcare360Area10View,
} from '@/types/angelcare360/student360-area10'
import styles from './Student360Area10Command.module.css'

type Props = {
  initialData: Angelcare360Area10CommandData
}

type ComposerState = {
  operation: string
  studentId: string
  title: string
  description: string
  fields: Array<{ key: string; label: string; type?: 'text' | 'textarea' | 'datetime-local' | 'select'; options?: Array<{ value: string; label: string }>; required?: boolean; placeholder?: string }>
  submitLabel: string
  deepLinkOnly?: string | null
} | null

const VIEW_CONFIG: Array<{ key: Angelcare360Area10View; label: string; icon: ReactNode; hint: string }> = [
  { key: 'today', label: "Aujourd’hui", icon: <Activity size={17}/>, hint: 'La réalité opérationnelle du jour' },
  { key: 'students', label: 'Tous les élèves', icon: <UsersRound size={17}/>, hint: 'Dossiers actifs et recherche' },
  { key: 'new-enrollments', label: 'Nouveaux inscrits', icon: <Sparkles size={17}/>, hint: 'Accueil et adaptation' },
  { key: 'attendance', label: 'Présence & journée', icon: <Clock3 size={17}/>, hint: 'Arrivées, absences et départs' },
  { key: 'journey', label: 'Classes & parcours', icon: <Route size={17}/>, hint: 'Années, classes et transitions' },
  { key: 'health-safety', label: 'Santé & sécurité', icon: <HeartPulse size={17}/>, hint: 'Instructions opérationnelles utiles' },
  { key: 'documents', label: 'Documents', icon: <FileCheck2 size={17}/>, hint: 'Validité, preuve et conformité' },
  { key: 'authorizations', label: 'Autorisations', icon: <ShieldCheck size={17}/>, hint: 'Consentements consommés en opération' },
  { key: 'academics', label: 'Suivi pédagogique', icon: <GraduationCap size={17}/>, hint: 'Progression issue des sources académiques' },
  { key: 'wellbeing', label: 'Bien-être & comportement', icon: <Stethoscope size={17}/>, hint: 'Faits, interventions et accompagnement' },
  { key: 'incidents', label: 'Incidents & accompagnement', icon: <AlertTriangle size={17}/>, hint: 'Résolution contrôlée' },
  { key: 'services', label: 'Services & activités', icon: <BookOpenCheck size={17}/>, hint: 'Participation et continuité' },
  { key: 'transport-meals', label: 'Transport & repas', icon: <Route size={17}/>, hint: 'Contexte quotidien transversal' },
  { key: 'attention', label: 'À régler', icon: <ClipboardCheck size={17}/>, hint: 'Uniquement ce qui demande une action' },
  { key: 'transitions', label: 'Transitions & départs', icon: <ArrowRight size={17}/>, hint: 'Préparer avant d’exécuter' },
  { key: 'history', label: 'Historique', icon: <History size={17}/>, hint: 'Mémoire institutionnelle' },
]

const DOSSIER_TABS: Array<{ key: Angelcare360Area10DossierTab; label: string }> = [
  { key: 'today', label: "Aujourd’hui" }, { key: 'overview', label: 'Vue 360' }, { key: 'journey', label: 'Parcours' },
  { key: 'family', label: 'Famille' }, { key: 'health', label: 'Santé & sécurité' }, { key: 'documents', label: 'Documents' },
  { key: 'attendance', label: 'Présence' }, { key: 'academics', label: 'Pédagogie' }, { key: 'wellbeing', label: 'Bien-être' },
  { key: 'incidents', label: 'Incidents' }, { key: 'services', label: 'Services' }, { key: 'transport', label: 'Transport' },
  { key: 'finance', label: 'Finance' }, { key: 'actions', label: 'Actions' }, { key: 'history', label: 'Historique' },
]

const VIEW_COPY: Record<Angelcare360Area10View, { eyebrow: string; title: string; description: string }> = {
  today: { eyebrow: 'Student Life Command', title: 'La journée des enfants, sans angle mort.', description: 'Présence, sécurité, responsables, transport et actions utiles remontent ici avant de devenir un problème.' },
  students: { eyebrow: 'Répertoire institutionnel', title: 'Un dossier maître par enfant.', description: 'Recherchez un élève et ouvrez sa réalité opérationnelle sans repartir à la chasse aux informations.' },
  'new-enrollments': { eyebrow: 'Bienvenue & adaptation', title: 'Transformer une inscription en première semaine réussie.', description: 'Les nouveaux inscrits restent suivis jusqu’à ce que l’accueil, la classe et l’adaptation soient réellement stabilisés.' },
  attendance: { eyebrow: 'Présence & journée', title: 'Qui est là, qui manque, qui doit être vérifié.', description: 'Une lecture enfant-centrique de la présence, sans dupliquer le registre canonique des présences.' },
  journey: { eyebrow: 'Institutional Journey', title: 'Le même enfant, plusieurs années, une seule histoire.', description: 'Classes, sections et transitions restent lisibles sans recréer l’élève à chaque année scolaire.' },
  'health-safety': { eyebrow: 'Safety Beacon', title: 'Montrer la bonne instruction à la bonne personne.', description: 'Les vigilances utiles sont visibles; les dossiers médicaux complets restent compartimentés et gouvernés.' },
  documents: { eyebrow: 'Document Integrity Rail', title: 'Une pièce déposée n’est pas automatiquement une pièce valide.', description: 'Les dossiers incomplets, expirés ou à vérifier deviennent directement actionnables.' },
  authorizations: { eyebrow: 'Operational Authority', title: 'Autorisation, responsabilité légale et instruction restent séparées.', description: 'Le dossier consomme les autorisations utiles sans voler la future autorité canonique Famille 360.' },
  academics: { eyebrow: 'Pedagogical Progress', title: 'Comprendre la progression sans recréer le carnet de notes.', description: 'La vue élève synthétise les sources académiques officielles et ouvre la matière exacte quand une intervention est nécessaire.' },
  wellbeing: { eyebrow: 'Accompagnement', title: 'Des faits observables, pas des étiquettes sur les enfants.', description: 'Observations, actions et plans de soutien sont structurés sans diagnostic automatisé ni score psychologique.' },
  incidents: { eyebrow: 'Resolution Board', title: 'Un incident n’est clos que quand son suivi l’est vraiment.', description: 'Faits, action immédiate, responsable, suivi et conclusion restent reconstruisibles.' },
  services: { eyebrow: 'Services & continuité', title: 'Voir ce que l’enfant utilise sans créer un second registre de services.', description: 'Les demandes et changements restent reliés à leurs modules propriétaires.' },
  'transport-meals': { eyebrow: 'Contexte terrain', title: 'Transport, repas et sécurité dans la réalité du jour.', description: 'Les informations nécessaires aux équipes terrain sont rapprochées du dossier sans dupliquer les routes ni les plans de santé.' },
  attention: { eyebrow: 'À régler', title: 'Pas de KPI décoratif : uniquement ce qui réclame une décision.', description: 'Chaque matière explique son risque, son élève, son action et son chemin de résolution.' },
  transitions: { eyebrow: 'Transition Command', title: 'Préparer la prochaine situation avant de modifier la source canonique.', description: 'Classe, site, année scolaire et départ suivent des gates lisibles et réparables.' },
  history: { eyebrow: 'Institutional Memory', title: 'Pouvoir répondre : “qu’est-ce qui était vrai à cette date ?”', description: 'Le dossier rassemble les références historiques sans recopier les journaux sources.' },
}

function toneClass(tone: Angelcare360Area10Tone) {
  return styles[`tone_${tone}`] || styles.tone_neutral
}

function fmtMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' Dh'
}

function fmtDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function fmtTime(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function recordText(row: Record<string, unknown>, keys: string[], fallback = '—') {
  for (const key of keys) {
    const value = row[key]
    if (value !== null && value !== undefined && String(value).trim()) return String(value)
  }
  return fallback
}

function collectionTitle(view: Angelcare360Area10View) {
  return VIEW_CONFIG.find((item) => item.key === view)?.label || 'Élèves'
}

export default function Student360Area10Command({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialData.selectedStudent?.student.id || '')
  const [dossierTab, setDossierTab] = useState<Angelcare360Area10DossierTab>('today')
  const [composer, setComposer] = useState<ComposerState>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const view = data.view
  const copy = VIEW_COPY[view]
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let rows = data.students
    if (view === 'new-enrollments') rows = rows.filter((student) => student.admissionDate && Date.now() - new Date(student.admissionDate).getTime() < 45 * 86400000)
    if (view === 'attendance') rows = rows.filter((student) => student.attendanceState !== 'unknown')
    if (view === 'health-safety') rows = rows.filter((student) => student.hasHealthAlert)
    if (view === 'documents') rows = rows.filter((student) => student.documentState !== 'Vérifié')
    if (view === 'incidents') rows = rows.filter((student) => student.openIncidentCount > 0)
    if (view === 'transport-meals') rows = rows.filter((student) => student.transportActive || student.hasHealthAlert)
    if (view === 'attention') rows = rows.filter((student) => student.attentionCount > 0)
    if (view === 'transitions') rows = rows.filter((student) => ['transfer_pending', 'departure_pending', 'completed', 'inactive'].includes(student.status.toLowerCase()) || student.openTaskCount > 0)
    if (!needle) return rows
    return rows.filter((student) => [student.fullName, student.studentCode, student.className, student.sectionName, student.guardianLabel].some((value) => value?.toLowerCase().includes(needle)))
  }, [data.students, query, view])

  function idempotency(operation: string, studentId: string) {
    return `${operation}:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  }

  async function fetchCommand(nextView = view, studentId = selectedId) {
    const params = new URLSearchParams({ view: nextView })
    if (studentId) params.set('student', studentId)
    const response = await fetch(`/api/angelcare360/students/area10?${params.toString()}`, { cache: 'no-store' })
    const json = await response.json() as { ok: boolean; data?: Angelcare360Area10CommandData; error?: string }
    if (!response.ok || !json.ok || !json.data) throw new Error(json.error || 'Impossible de rafraîchir Élève 360.')
    setData(json.data)
    return json.data
  }

  function switchView(nextView: Angelcare360Area10View) {
    startTransition(() => {
      const params = new URLSearchParams({ view: nextView })
      router.replace(`/angelcare-360-command-center/eleves?${params.toString()}`, { scroll: false })
      fetchCommand(nextView, '').then((next) => { setSelectedId(''); setData(next) }).catch((error) => setToast(error instanceof Error ? error.message : 'Erreur de chargement'))
    })
  }

  function openStudent(studentId: string, tab: Angelcare360Area10DossierTab = 'today') {
    setSelectedId(studentId)
    setDossierTab(tab)
    startTransition(() => {
      fetchCommand(view, studentId).then((next) => setData(next)).catch((error) => setToast(error instanceof Error ? error.message : 'Dossier indisponible'))
    })
  }

  function closeStudent() {
    setSelectedId('')
    setData((current) => ({ ...current, selectedStudent: null }))
  }

  async function execute(request: Angelcare360Area10MutationRequest) {
    const response = await fetch('/api/angelcare360/students/area10', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })
    const result = await response.json() as Angelcare360Area10MutationResult & { error?: string }
    if (!response.ok || !result.ok) throw new Error(result.error || result.message || 'L’action n’a pas abouti.')
    setToast(result.message)
    if (result.deepLink && composer?.deepLinkOnly) router.push(result.deepLink)
    await fetchCommand(view, request.studentId)
    return result
  }

  function openComposer(next: NonNullable<ComposerState>) {
    if (next.deepLinkOnly) {
      router.push(next.deepLinkOnly)
      return
    }
    setForm({})
    setComposer(next)
  }

  function submitComposer() {
    if (!composer) return
    const missing = composer.fields.find((field) => field.required && !form[field.key]?.trim())
    if (missing) { setToast(`${missing.label} est obligatoire.`); return }
    startTransition(() => {
      execute({ operation: composer.operation, studentId: composer.studentId, idempotencyKey: idempotency(composer.operation, composer.studentId), payload: form })
        .then(() => setComposer(null))
        .catch((error) => setToast(error instanceof Error ? error.message : 'Action impossible'))
    })
  }

  return (
    <main className={styles.page} data-area10-student360="true">
      <header className={styles.crown}>
        <div className={styles.crownIdentity}>
          <span className={styles.crownMark}><GraduationCap size={24}/></span>
          <div>
            <div className={styles.eyebrow}>SANILA · ÉLÈVE 360</div>
            <h1>Élèves</h1>
            <p>{data.school.name} · {data.academicYear.label}</p>
          </div>
        </div>
        <div className={styles.crownAction}>
          <button type="button" onClick={() => startTransition(() => { fetchCommand(view, selectedId).catch((error) => setToast(String(error))) })} disabled={isPending}><RefreshCw size={16}/> Actualiser</button>
          <button type="button" className={styles.primaryButton} onClick={() => router.push('/angelcare-360-command-center/admissions?view=enrollments&source=student360')}><Sparkles size={16}/> Nouvel élève via inscription</button>
        </div>
      </header>

      <section className={styles.metricRail} aria-label="Indicateurs Élève 360">
        {data.metrics.map((metric) => <MetricCard key={metric.key} metric={metric} active={metric.targetView === view} onClick={() => switchView(metric.targetView)}/>) }
      </section>

      <section className={styles.commandDeck}>
        <div className={styles.viewRail}>
          {VIEW_CONFIG.map((item) => (
            <button key={item.key} type="button" className={item.key === view ? styles.viewActive : styles.viewButton} onClick={() => switchView(item.key)}>
              <span>{item.icon}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span>
            </button>
          ))}
        </div>

        <div className={styles.workspace}>
          <section className={styles.hero}>
            <div><span className={styles.eyebrow}>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.description}</p></div>
            <div className={styles.heroPulse}>
              <span className={styles.pulseDot}/><div><strong>{data.attention.length ? `${data.attention.length} matière${data.attention.length > 1 ? 's' : ''} à régler` : 'Journée maîtrisée'}</strong><small>Dernière réconciliation · {fmtTime(data.generatedAt)}</small></div>
            </div>
          </section>

          <section className={styles.toolbar}>
            <label className={styles.search}><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, matricule, classe, responsable…"/><span>{filtered.length}</span></label>
            {data.sourceWarnings.length ? <button type="button" className={styles.sourceWarning} onClick={() => setToast(`${data.sourceWarnings.length} source(s) optionnelle(s) indisponible(s). Le dossier reste factuel.`)}><AlertTriangle size={15}/>{data.sourceWarnings.length} source(s) à vérifier</button> : null}
          </section>

          {view === 'attention' ? <AttentionBoard attention={data.attention} onStudent={openStudent} routerPush={(href) => router.push(href)}/> : null}
          {view === 'health-safety' ? <SafetyBoard students={filtered} onStudent={(id) => openStudent(id, 'health')}/> : null}
          {view === 'attendance' ? <AttendanceBoard students={filtered} onStudent={(id) => openStudent(id, 'attendance')} routerPush={(href) => router.push(href)}/> : null}
          {view === 'transitions' ? <TransitionBoard students={filtered} onStudent={(id) => openStudent(id, 'journey')} onPrepare={(student) => openComposer(transitionComposer(student))}/> : null}
          {!['attention', 'health-safety', 'attendance', 'transitions'].includes(view) ? <StudentGrid view={view} students={filtered} onStudent={openStudent}/> : null}
        </div>

        <aside className={styles.attentionRail}>
          <div className={styles.railHeader}><span><ClipboardCheck size={18}/></span><div><strong>Ce qui demande votre attention</strong><small>{data.attention.length ? 'Priorisé par conséquence opérationnelle' : 'Aucune matière bloquante'}</small></div></div>
          <div className={styles.attentionList}>
            {data.attention.slice(0, 7).map((item) => <AttentionMini key={item.id} item={item} onClick={() => openStudent(item.studentId, item.category === 'health' ? 'health' : item.category === 'incident' ? 'incidents' : item.category === 'attendance' ? 'attendance' : 'actions')}/>) }
            {!data.attention.length ? <div className={styles.calmState}><CheckCircle2 size={22}/><strong>Les dossiers sont à jour.</strong><span>Aucune présence, pièce, sécurité ou action n’exige une intervention.</span></div> : null}
          </div>
          <button type="button" className={styles.railFooter} onClick={() => switchView('attention')}>Ouvrir le commandement À régler <ChevronRight size={16}/></button>
        </aside>
      </section>

      {data.selectedStudent ? <StudentDossier dossier={data.selectedStudent} tab={dossierTab} setTab={setDossierTab} close={closeStudent} openComposer={openComposer} routerPush={(href) => router.push(href)}/> : null}
      {composer ? <ActionComposer state={composer} form={form} setForm={setForm} close={() => setComposer(null)} submit={submitComposer} pending={isPending}/> : null}
      {toast ? <button type="button" className={styles.toast} onClick={() => setToast(null)}><BadgeCheck size={17}/><span>{toast}</span><X size={15}/></button> : null}
    </main>
  )
}

function MetricCard({ metric, active, onClick }: { metric: Angelcare360Area10Metric; active: boolean; onClick: () => void }) {
  return <button type="button" className={`${styles.metric} ${toneClass(metric.tone)} ${active ? styles.metricActive : ''}`} onClick={onClick}><span className={styles.metricLabel}>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small><ChevronRight size={16}/></button>
}

function StudentGrid({ view, students, onStudent }: { view: Angelcare360Area10View; students: Angelcare360Area10StudentSummary[]; onStudent: (id: string, tab?: Angelcare360Area10DossierTab) => void }) {
  return <section className={styles.gridSection}>
    <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>{collectionTitle(view)}</span><h3>{students.length ? `${students.length} dossier${students.length > 1 ? 's' : ''}` : 'Aucun dossier dans cette vue'}</h3></div><span>Chaque carte ouvre un dossier Élève 360 actionnable.</span></div>
    <div className={styles.studentGrid}>
      {students.map((student) => <StudentCard key={student.id} view={view} student={student} onClick={() => onStudent(student.id)}/>) }
      {!students.length ? <div className={styles.emptyState}><UsersRound size={28}/><strong>Aucun élève ne correspond à ce contexte.</strong><span>La vue reste vide plutôt que d’inventer des dossiers ou des signaux.</span></div> : null}
    </div>
  </section>
}

function StudentCard({ view, student, onClick }: { view: Angelcare360Area10View; student: Angelcare360Area10StudentSummary; onClick: () => void }) {
  return <button type="button" className={styles.studentCard} onClick={onClick}>
    <div className={styles.studentTop}>
      <div className={styles.avatar}>{student.photoUrl ? <img src={student.photoUrl} alt=""/> : <span>{student.firstName?.[0] || student.fullName[0]}{student.lastName?.[0] || ''}</span>}</div>
      <div className={styles.studentIdentity}><strong>{student.fullName}</strong><span>{student.studentCode || 'Matricule à confirmer'} · {student.ageLabel || 'Âge à confirmer'}</span><small>{student.className} · {student.sectionName}</small></div>
      <span className={`${styles.statusChip} ${student.status.toLowerCase() === 'active' ? styles.statusSuccess : ''}`}>{student.statusLabel}</span>
    </div>
    <div className={styles.lifeRail} aria-label={`Student Life Rail · ${collectionTitle(view)}`}>
      <ViewStudentSignals view={view} student={student}/>
    </div>
    <div className={styles.studentBottom}><span>{student.guardianLabel || 'Responsable à confirmer'}</span><span>{student.transportActive ? student.transportLabel || 'Transport actif' : 'Sans transport actif'}</span><strong>{student.attentionCount ? `${student.attentionCount} à régler` : 'À jour'}</strong></div>
  </button>
}

function ViewStudentSignals({ view, student }: { view: Angelcare360Area10View; student: Angelcare360Area10StudentSummary }) {
  if (view === 'new-enrollments') return <>
    <LifeSignal icon={<Sparkles size={14}/>} label="Accueil" value={student.adaptationState || 'À suivre'} tone={student.adaptationState === 'completed' ? 'success' : 'info'}/>
    <LifeSignal icon={<CalendarDays size={14}/>} label="Inscription" value={student.admissionDate ? fmtDate(student.admissionDate) : 'À confirmer'} tone="info"/>
    <LifeSignal icon={<ClipboardCheck size={14}/>} label="Actions" value={student.openTaskCount ? `${student.openTaskCount} ouverte(s)` : 'À jour'} tone={student.openTaskCount ? 'warning' : 'success'}/>
  </>
  if (view === 'journey') return <>
    <LifeSignal icon={<GraduationCap size={14}/>} label="Classe" value={student.className || 'À confirmer'} tone="violet"/>
    <LifeSignal icon={<Route size={14}/>} label="Section" value={student.sectionName || 'À confirmer'} tone="info"/>
    <LifeSignal icon={<CalendarDays size={14}/>} label="Année" value={student.academicYearLabel} tone="neutral"/>
  </>
  if (view === 'documents') return <>
    <LifeSignal icon={<FileCheck2 size={14}/>} label="Dossier" value={student.documentState} tone={student.documentState === 'Vérifié' ? 'success' : 'warning'}/>
    <LifeSignal icon={<ShieldCheck size={14}/>} label="Sécurité" value={student.hasHealthAlert ? 'Pièce sensible' : 'Standard'} tone={student.hasHealthAlert ? 'warning' : 'neutral'}/>
    <LifeSignal icon={<ClipboardCheck size={14}/>} label="Action" value={student.documentState === 'Vérifié' ? 'Aucune' : 'Vérifier'} tone={student.documentState === 'Vérifié' ? 'success' : 'warning'}/>
  </>
  if (view === 'authorizations') return <>
    <LifeSignal icon={<ShieldCheck size={14}/>} label="Autorité" value={student.guardianLabel ? 'Relation visible' : 'À confirmer'} tone={student.guardianLabel ? 'success' : 'warning'}/>
    <LifeSignal icon={<UsersRound size={14}/>} label="Responsable" value={student.guardianLabel || 'À confirmer'} tone={student.guardianLabel ? 'info' : 'warning'}/>
    <LifeSignal icon={<FileCheck2 size={14}/>} label="Preuve" value={student.documentState} tone={student.documentState === 'Vérifié' ? 'success' : 'warning'}/>
  </>
  if (view === 'academics') return <>
    <LifeSignal icon={<GraduationCap size={14}/>} label="Parcours" value={student.className || 'Classe à confirmer'} tone="violet"/>
    <LifeSignal icon={<BookOpenCheck size={14}/>} label="Section" value={student.sectionName || '—'} tone="info"/>
    <LifeSignal icon={<ClipboardCheck size={14}/>} label="Suivi" value={student.openTaskCount ? `${student.openTaskCount} action(s)` : 'À jour'} tone={student.openTaskCount ? 'warning' : 'success'}/>
  </>
  if (view === 'wellbeing') return <>
    <LifeSignal icon={<Activity size={14}/>} label="Journée" value={student.attendanceLabel} tone={student.attendanceState === 'absent' ? 'warning' : 'success'}/>
    <LifeSignal icon={<ClipboardCheck size={14}/>} label="Accompagnement" value={student.openTaskCount ? `${student.openTaskCount} suivi(s)` : 'Sans action'} tone={student.openTaskCount ? 'info' : 'success'}/>
    <LifeSignal icon={<ShieldCheck size={14}/>} label="Sécurité" value={student.hasHealthAlert ? 'Vigilance' : 'Stable'} tone={student.hasHealthAlert ? 'danger' : 'success'}/>
  </>
  if (view === 'services') return <>
    <LifeSignal icon={<Route size={14}/>} label="Transport" value={student.transportActive ? 'Actif' : 'Non actif'} tone={student.transportActive ? 'info' : 'neutral'}/>
    <LifeSignal icon={<WalletCards size={14}/>} label="Contexte finance" value={student.balance ? fmtMoney(student.balance) : 'À jour'} tone={student.balance > 0 ? 'warning' : 'success'}/>
    <LifeSignal icon={<ClipboardCheck size={14}/>} label="Demandes" value={student.openTaskCount ? `${student.openTaskCount} ouverte(s)` : 'Aucune'} tone={student.openTaskCount ? 'info' : 'success'}/>
  </>
  if (view === 'history') return <>
    <LifeSignal icon={<History size={14}/>} label="Statut" value={student.statusLabel} tone="neutral"/>
    <LifeSignal icon={<CalendarDays size={14}/>} label="Entrée" value={student.admissionDate ? fmtDate(student.admissionDate) : '—'} tone="info"/>
    <LifeSignal icon={<GraduationCap size={14}/>} label="Parcours actuel" value={student.className || '—'} tone="violet"/>
  </>
  if (view === 'transport-meals') return <>
    <LifeSignal icon={<Route size={14}/>} label="Transport" value={student.transportActive ? student.transportLabel || 'Actif' : 'Non actif'} tone={student.transportActive ? 'info' : 'neutral'}/>
    <LifeSignal icon={<HeartPulse size={14}/>} label="Repas / santé" value={student.hasHealthAlert ? 'Restriction à voir' : 'Aucune alerte'} tone={student.hasHealthAlert ? 'danger' : 'success'}/>
    <LifeSignal icon={<Clock3 size={14}/>} label="Présence" value={student.attendanceLabel} tone={student.attendanceState === 'absent' ? 'warning' : 'success'}/>
  </>
  return <>
    <LifeSignal icon={<Clock3 size={14}/>} label="Présence" value={student.attendanceLabel} tone={student.attendanceState === 'absent' ? 'warning' : 'success'}/>
    <LifeSignal icon={<ShieldCheck size={14}/>} label="Sécurité" value={student.hasHealthAlert ? 'Vigilance' : 'Stable'} tone={student.hasHealthAlert ? 'danger' : 'success'}/>
    <LifeSignal icon={<FileCheck2 size={14}/>} label="Dossier" value={student.documentState} tone={student.documentState === 'Vérifié' ? 'success' : 'warning'}/>
  </>
}

function LifeSignal({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: Angelcare360Area10Tone }) {
  return <span className={`${styles.lifeSignal} ${toneClass(tone)}`}><span>{icon}</span><small>{label}</small><strong>{value}</strong></span>
}

function AttentionMini({ item, onClick }: { item: Angelcare360Area10Attention; onClick: () => void }) {
  return <button type="button" className={`${styles.attentionMini} ${toneClass(item.tone)}`} onClick={onClick}><span className={styles.attentionIcon}>{item.tone === 'danger' ? <AlertTriangle size={16}/> : <ClipboardCheck size={16}/>}</span><span><strong>{item.title}</strong><small>{item.studentLabel}</small><em>{item.detail}</em></span><ChevronRight size={16}/></button>
}

function AttentionBoard({ attention, onStudent, routerPush }: { attention: Angelcare360Area10Attention[]; onStudent: (id: string) => void; routerPush: (href: string) => void }) {
  return <section className={styles.board}><div className={styles.boardTitle}><div><span className={styles.eyebrow}>ACTION QUEUE</span><h3>À régler maintenant</h3></div><span>{attention.length} matière{attention.length > 1 ? 's' : ''}</span></div>
    <div className={styles.attentionBoard}>{attention.map((item) => <article key={item.id} className={`${styles.matterCard} ${toneClass(item.tone)}`}><div className={styles.matterHeader}><span>{item.category}</span><strong>{item.studentLabel}</strong></div><h4>{item.title}</h4><p>{item.detail}</p><div className={styles.consequence}><AlertTriangle size={15}/><span><strong>Pourquoi cela compte</strong>{item.consequence}</span></div><div className={styles.cardActions}><button type="button" onClick={() => onStudent(item.studentId)}>Ouvrir le dossier</button>{item.deepLink ? <button type="button" onClick={() => routerPush(item.deepLink!)}>{item.actionLabel}<ArrowRight size={14}/></button> : null}</div></article>)}</div>
    {!attention.length ? <div className={styles.emptyState}><CheckCircle2 size={28}/><strong>Les élèves sont à jour.</strong><span>Aucune absence, sécurité, document ou action ne demande une intervention.</span></div> : null}
  </section>
}

function SafetyBoard({ students, onStudent }: { students: Angelcare360Area10StudentSummary[]; onStudent: (id: string) => void }) {
  return <section className={styles.board}><div className={styles.boardTitle}><div><span className={styles.eyebrow}>SAFETY BEACON</span><h3>Vigilances opérationnelles</h3></div><span>Accès compartimenté · besoin de savoir</span></div><div className={styles.safetyGrid}>{students.map((student) => <button type="button" key={student.id} className={styles.safetyCard} onClick={() => onStudent(student.id)}><span className={styles.safetyBeacon}><HeartPulse size={20}/></span><div><strong>{student.fullName}</strong><span>{student.className} · {student.sectionName}</span><p>{student.healthAlertLabel || 'Instruction santé active à consulter.'}</p></div><ChevronRight size={17}/></button>)}</div>{!students.length ? <div className={styles.emptyState}><ShieldCheck size={28}/><strong>Aucune vigilance prioritaire.</strong><span>Les informations sensibles ne sont pas affichées sans nécessité opérationnelle.</span></div> : null}</section>
}

function AttendanceBoard({ students, onStudent, routerPush }: { students: Angelcare360Area10StudentSummary[]; onStudent: (id: string) => void; routerPush: (href: string) => void }) {
  return <section className={styles.board}><div className={styles.boardTitle}><div><span className={styles.eyebrow}>TODAY PRESENCE RUNWAY</span><h3>Présence, arrivée et départ</h3></div><button type="button" onClick={() => routerPush('/angelcare-360-command-center/presences?source=student360')}>Ouvrir le registre canonique <ArrowRight size={14}/></button></div><div className={styles.presenceRows}>{students.map((student) => <button key={student.id} type="button" className={styles.presenceRow} onClick={() => onStudent(student.id)}><span className={`${styles.presenceDot} ${student.attendanceState === 'absent' ? styles.dotWarning : styles.dotSuccess}`}/><strong>{student.fullName}</strong><span>{student.className}</span><span>{student.attendanceLabel}</span><span>{student.arrivedAt ? `Arrivée ${fmtTime(student.arrivedAt)}` : 'Arrivée —'}</span><span>{student.departedAt ? `Départ ${fmtTime(student.departedAt)}` : 'Départ —'}</span><ChevronRight size={16}/></button>)}</div></section>
}

function TransitionBoard({ students, onStudent, onPrepare }: { students: Angelcare360Area10StudentSummary[]; onStudent: (id: string) => void; onPrepare: (student: Angelcare360Area10StudentSummary) => void }) {
  return <section className={styles.board}><div className={styles.boardTitle}><div><span className={styles.eyebrow}>TRANSITION COMMAND</span><h3>Préparer avant d’exécuter</h3></div><span>La classe reste sous l’autorité de l’Aire 3.</span></div><div className={styles.transitionGrid}>{students.map((student) => <article key={student.id} className={styles.transitionCard}><div><span className={styles.avatarSmall}>{student.firstName?.[0] || student.fullName[0]}</span><span><strong>{student.fullName}</strong><small>{student.className} · {student.statusLabel}</small></span></div><p>Prévisualisez la cible, les prérequis et l’impact avant de modifier la source canonique.</p><div className={styles.cardActions}><button type="button" onClick={() => onStudent(student.id)}>Voir le parcours</button><button type="button" onClick={() => onPrepare(student)}>Préparer une transition <ArrowRight size={14}/></button></div></article>)}</div>{!students.length ? <div className={styles.emptyState}><Route size={28}/><strong>Aucune transition active.</strong><span>Les changements seront préparés ici avant exécution dans leur source canonique.</span></div> : null}</section>
}

function StudentDossier({ dossier, tab, setTab, close, openComposer, routerPush }: { dossier: Angelcare360Area10Dossier; tab: Angelcare360Area10DossierTab; setTab: (tab: Angelcare360Area10DossierTab) => void; close: () => void; openComposer: (state: NonNullable<ComposerState>) => void; routerPush: (href: string) => void }) {
  const student = dossier.student
  return <CustomerOverlaySurface kind="dossier" onClose={close} ariaLabel={`Dossier Élève 360 · ${student.fullName}`}>
    <section className={styles.dossier}>
      <header className={styles.dossierCrown}>
        <div className={styles.dossierIdentity}><div className={styles.avatarLarge}>{student.photoUrl ? <img src={student.photoUrl} alt=""/> : <UserRound size={30}/>}</div><div><span className={styles.eyebrow}>DOSSIER ÉLÈVE 360 · {student.studentCode || 'MATRICULE À CONFIRMER'}</span><h2>{student.fullName}</h2><p>{student.className} · {student.sectionName} · {student.institutionLabel}</p><div className={styles.identityChips}><span className={styles.goodChip}>{student.statusLabel}</span><span>{student.attendanceLabel}</span>{student.hasHealthAlert ? <span className={styles.dangerChip}>Vigilance sécurité</span> : <span className={styles.goodChip}>Sécurité stable</span>}<span>{student.attentionCount ? `${student.attentionCount} action(s)` : 'Dossier à jour'}</span></div></div></div>
        <div className={styles.dossierActions}><button type="button" onClick={() => openComposer(taskComposer(student))}><ClipboardCheck size={16}/> Attribuer une action</button><button type="button" onClick={() => openComposer(noteComposer(student))}>Ajouter une note</button><button type="button" className={styles.closeButton} onClick={close} aria-label="Fermer"><X size={19}/></button></div>
      </header>

      <nav className={styles.dossierTabs} aria-label="Sections du dossier Élève 360">{DOSSIER_TABS.map((item) => <button type="button" key={item.key} className={item.key === tab ? styles.dossierTabActive : styles.dossierTab} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
      <div className={styles.dossierBody}>{renderDossierTab(dossier, tab, openComposer, routerPush)}</div>
    </section>
  </CustomerOverlaySurface>
}

function renderDossierTab(dossier: Angelcare360Area10Dossier, tab: Angelcare360Area10DossierTab, openComposer: (state: NonNullable<ComposerState>) => void, routerPush: (href: string) => void) {
  const student = dossier.student
  if (tab === 'today') return <TodayDossier dossier={dossier} openComposer={openComposer} routerPush={routerPush}/>
  if (tab === 'overview') return <div className={styles.dossierColumns}><KeyValuePanel title="Identité institutionnelle" icon={<UserRound size={18}/>} rows={[["Matricule", student.studentCode || '—'], ['Date de naissance', fmtDate(student.dateOfBirth)], ['Âge', student.ageLabel || '—'], ['Statut', student.statusLabel], ['Classe', student.className || '—'], ['Section', student.sectionName || '—']]}/><KeyValuePanel title="Student Life Rail" icon={<Activity size={18}/>} rows={[["Présence", student.attendanceLabel], ['Sécurité', student.hasHealthAlert ? student.healthAlertLabel || 'Vigilance' : 'Stable'], ['Documents', student.documentState], ['Responsable', student.guardianLabel || 'À confirmer'], ['Transport', student.transportActive ? student.transportLabel || 'Actif' : 'Non actif'], ['Finance', fmtMoney(student.balance)]]}/></div>
  if (tab === 'journey') return <CollectionPanel title="Parcours institutionnel" description="Les affectations proviennent de l’autorité canonique des classes. Élève 360 ne les recrée pas." rows={dossier.enrollmentHistory} empty="Aucune affectation historique." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/administration?plane=classes-capacity&student=${student.id}&source=student360`)}>Ouvrir l’affectation exacte <ArrowRight size={14}/></button>}/>
  if (tab === 'family') return <div className={styles.dossierColumns}><CollectionPanel title="Responsables & relations opérationnelles" description="Les relations sont consommées ici; Famille 360 restera l’autorité canonique." rows={dossier.family} empty="Aucun responsable actif lié." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/parents?student=${student.id}&source=student360`)}>Vérifier dans Parents <ArrowRight size={14}/></button>}/><CollectionPanel title="Contacts d’urgence" description="Informations strictement utiles aux opérations et urgences." rows={dossier.emergencyContacts} empty="Aucun contact d’urgence enregistré."/></div>
  if (tab === 'health') return <HealthDossier dossier={dossier} openComposer={openComposer}/>
  if (tab === 'documents') return <CollectionPanel title="Documents élève" description="Déposé ne veut pas dire vérifié. Les statuts et versions restent visibles." rows={dossier.documents} empty="Aucun document référencé." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/personnes/documents?student=${student.id}&source=student360`)}>Ouvrir la source documents <ArrowRight size={14}/></button>}/>
  if (tab === 'attendance') return <CollectionPanel title="Présence récente" description="Lecture enfant-centrique du registre canonique des présences." rows={dossier.attendance} empty="Aucune présence récente disponible." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/presences?student=${student.id}&source=student360`)}>Résoudre dans Présences <ArrowRight size={14}/></button>}/>
  if (tab === 'academics') return <CollectionPanel title="Suivi pédagogique" description="Bulletins et notes restent sous l’autorité du module Académique." rows={dossier.academics} empty="Aucune donnée académique consolidée." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/academique?student=${student.id}&source=student360`)}>Ouvrir le dossier académique <ArrowRight size={14}/></button>}/>
  if (tab === 'wellbeing') return <WellbeingDossier dossier={dossier} openComposer={openComposer}/>
  if (tab === 'incidents') return <IncidentDossier dossier={dossier} openComposer={openComposer}/>
  if (tab === 'services') return <CollectionPanel title="Services & activités" description="Élève 360 présente le contexte et crée les demandes; chaque service reste propriétaire de son registre." rows={dossier.services} empty="Aucun service consolidé dans cette source." action={<button type="button" onClick={() => openComposer(serviceRequestComposer(student))}>Demander un changement</button>}/>
  if (tab === 'transport') return <CollectionPanel title="Transport & remise" description="Route, arrêt et affectation proviennent du moteur Transport." rows={dossier.transport} empty="Aucune affectation transport active." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/transport?student=${student.id}&source=student360`)}>Ouvrir le transport exact <ArrowRight size={14}/></button>}/>
  if (tab === 'finance') return <CollectionPanel title="Contexte financier" description="Uniquement ce qui affecte les opérations; factures et paiements restent en Finance." rows={dossier.finance} empty="Aucune facture liée à cet élève." action={<button type="button" onClick={() => routerPush(`/angelcare-360-command-center/finance?view=student-balances&student=${student.id}&source=student360`)}>Ouvrir le compte exact <ArrowRight size={14}/></button>}/>
  if (tab === 'actions') return <CollectionPanel title="Actions du dossier" description="Une action n’est terminée que lorsque son résultat attendu est obtenu." rows={dossier.tasks} empty="Aucune action ouverte." action={<button type="button" onClick={() => openComposer(taskComposer(student))}>Attribuer une action</button>}/>
  return <TimelinePanel events={dossier.timeline} studentId={student.id} routerPush={routerPush}/>
}

function TodayDossier({ dossier, openComposer, routerPush }: { dossier: Angelcare360Area10Dossier; openComposer: (state: NonNullable<ComposerState>) => void; routerPush: (href: string) => void }) {
  const student = dossier.student
  return <div className={styles.todayDossier}>
    <section className={styles.todayHero}><div><span className={styles.eyebrow}>TODAY PULSE</span><h3>{student.attendanceLabel}</h3><p>{student.arrivedAt ? `Arrivée enregistrée à ${fmtTime(student.arrivedAt)}.` : 'Aucune heure d’arrivée visible dans le registre du jour.'}</p></div><span className={`${styles.todayBadge} ${student.attendanceState === 'absent' ? styles.todayBadgeWarn : ''}`}><Clock3 size={20}/>{student.attendanceState || 'inconnu'}</span></section>
    <div className={styles.todayGrid}>
      <TodayTile icon={<ShieldCheck/>} label="Sécurité" value={student.hasHealthAlert ? student.healthAlertLabel || 'Vigilance active' : 'Aucune vigilance prioritaire'} action="Voir les instructions" onClick={() => openComposer({ operation: 'student_health.view', studentId: student.id, title: 'Santé & sécurité', description: 'Ouvrir les instructions santé utiles au dossier.', fields: [], submitLabel: 'Ouvrir', deepLinkOnly: `/angelcare-360-command-center/eleves/${student.id}?tab=health` })}/>
      <TodayTile icon={<UsersRound/>} label="Responsable" value={student.guardianLabel || 'Responsable à confirmer'} action="Vérifier la relation" onClick={() => routerPush(`/angelcare-360-command-center/parents?student=${student.id}&source=student360`)}/>
      <TodayTile icon={<Route/>} label="Transport" value={student.transportActive ? student.transportLabel || 'Transport actif' : 'Aucun transport actif'} action="Voir le trajet" onClick={() => routerPush(`/angelcare-360-command-center/transport?student=${student.id}&source=student360`)}/>
      <TodayTile icon={<ClipboardCheck/>} label="Actions" value={student.openTaskCount ? `${student.openTaskCount} action(s) ouverte(s)` : 'Aucune action ouverte'} action="Attribuer" onClick={() => openComposer(taskComposer(student))}/>
    </div>
    {dossier.admissionHandover.length ? <div className={styles.handoverBanner}><BadgeCheck size={18}/><div><strong>Handover Admissions retrouvé</strong><span>La conversion de l’Aire 9 reste référencée; Élève 360 poursuit le cycle sans réécrire l’admission.</span></div></div> : null}
  </div>
}

function TodayTile({ icon, label, value, action, onClick }: { icon: ReactNode; label: string; value: string; action: string; onClick: () => void }) {
  return <button type="button" className={styles.todayTile} onClick={onClick}><span>{icon}</span><small>{label}</small><strong>{value}</strong><em>{action}<ChevronRight size={14}/></em></button>
}

function HealthDossier({ dossier, openComposer }: { dossier: Angelcare360Area10Dossier; openComposer: (state: NonNullable<ComposerState>) => void }) {
  const student = dossier.student
  return <div className={styles.stack}><div className={styles.sectionTitle}><div><span className={styles.eyebrow}>SAFETY BEACON</span><h3>Santé & sécurité</h3><p>Déclaration, preuve médicale et instruction opérationnelle restent explicitement séparées.</p></div><button type="button" className={styles.primaryButton} onClick={() => openComposer(healthComposer(student))}>Nouvelle instruction</button></div><CollectionPanel title="Instructions actives" description="Version, sévérité, source et période d’effet." rows={dossier.healthInstructions} empty="Aucune instruction santé spécifique enregistrée."/><CollectionPanel title="Plans médicaments" description="Aucun ordre informel de médicament : plan, autorisation et preuve restent séparés." rows={dossier.medicationPlans} empty="Aucun plan médicament actif." action={<button type="button" onClick={() => openComposer(medicationComposer(student))}>Créer un plan contrôlé</button>}/><CollectionPanel title="Administrations récentes" description="Administration, omission et observation restent traçables." rows={dossier.medicationAdministrations} empty="Aucune administration enregistrée."/></div>
}

function WellbeingDossier({ dossier, openComposer }: { dossier: Angelcare360Area10Dossier; openComposer: (state: NonNullable<ComposerState>) => void }) {
  const student = dossier.student
  return <div className={styles.stack}><div className={styles.sectionTitle}><div><span className={styles.eyebrow}>FAITS · ACTION · SUIVI</span><h3>Bien-être & accompagnement</h3><p>Le système protège l’enfant des étiquettes : l’observation factuelle est distincte de l’interprétation.</p></div><div className={styles.inlineActions}><button type="button" onClick={() => openComposer(observationComposer(student))}>Ajouter une observation</button><button type="button" className={styles.primaryButton} onClick={() => openComposer(supportComposer(student))}>Créer un plan</button></div></div><CollectionPanel title="Observations" description="Faits observés, contexte, action et suivi." rows={dossier.wellbeing} empty="Aucune observation structurée."/><CollectionPanel title="Plans d’accompagnement" description="Objectif, actions, responsable, revue et condition de réussite." rows={dossier.supportPlans} empty="Aucun plan actif."/></div>
}

function IncidentDossier({ dossier, openComposer }: { dossier: Angelcare360Area10Dossier; openComposer: (state: NonNullable<ComposerState>) => void }) {
  const student = dossier.student
  return <div className={styles.stack}><div className={styles.sectionTitle}><div><span className={styles.eyebrow}>RESOLUTION BOARD</span><h3>Incidents & accompagnement</h3><p>Clôturer signifie que le suivi réel est terminé, pas seulement que le statut a changé.</p></div><button type="button" className={styles.primaryButton} onClick={() => openComposer(incidentComposer(student))}>Ouvrir un incident</button></div><div className={styles.incidentList}>{dossier.incidents.map((row) => <article key={String(row.id)} className={styles.incidentCard}><div><span className={`${styles.statusChip} ${recordText(row, ['severity']) === 'critical' ? styles.dangerChip : ''}`}>{recordText(row, ['severity'], 'standard')}</span><span>{fmtDate(recordText(row, ['occurred_at', 'created_at']))}</span></div><h4>{recordText(row, ['title', 'incident_type'], 'Incident')}</h4><p>{recordText(row, ['facts', 'summary'], 'Faits à renseigner')}</p><small>État · {recordText(row, ['status'], 'open')}</small></article>)}</div>{!dossier.incidents.length ? <div className={styles.emptyState}><ShieldCheck size={28}/><strong>Aucun incident ouvert.</strong><span>Les faits et suivis futurs apparaîtront ici sans profilage de l’enfant.</span></div> : null}</div>
}

function KeyValuePanel({ title, icon, rows }: { title: string; icon: ReactNode; rows: Array<[string, string]> }) {
  return <section className={styles.detailPanel}><div className={styles.panelHeader}><span>{icon}</span><h3>{title}</h3></div><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

function CollectionPanel({ title, description, rows, empty, action }: { title: string; description: string; rows: Array<Record<string, unknown>>; empty: string; action?: ReactNode }) {
  return <section className={styles.collectionPanel}><div className={styles.collectionHeader}><div><h3>{title}</h3><p>{description}</p></div>{action}</div>{rows.length ? <div className={styles.collectionRows}>{rows.slice(0, 30).map((row, index) => <div key={String(row.id || index)} className={styles.collectionRow}><span className={styles.rowIcon}>{recordText(row, ['status'], '•').slice(0, 1).toUpperCase()}</span><div><strong>{recordText(row, ['title', 'full_name', 'class_name', 'name', 'category', 'incident_type', 'plan_type', 'transition_type', 'document_code', 'invoice_number', 'status'], 'Élément')}</strong><span>{recordText(row, ['detail', 'instruction', 'facts', 'objective', 'relationship_type', 'enrollment_status', 'description', 'status'], 'Information enregistrée')}</span></div><small>{fmtDate(recordText(row, ['effective_from', 'observed_at', 'occurred_at', 'enrolled_on', 'created_at'], ''))}</small></div>)}</div> : <div className={styles.panelEmpty}><FileWarning size={20}/><span>{empty}</span></div>}</section>
}

function TimelinePanel({ events, studentId, routerPush }: { events: Angelcare360Area10Dossier['timeline']; studentId: string; routerPush: (href: string) => void }) {
  return <section className={styles.collectionPanel}><div className={styles.collectionHeader}><div><h3>Institutional Timeline</h3><p>Références historiques transversales, triées par date, sans copier les registres sources.</p></div><button type="button" onClick={() => routerPush(`/angelcare-360-command-center/administration?plane=audit&entity=student&entityId=${studentId}&source=student360`)}>Ouvrir l’Aire 8 <ArrowRight size={14}/></button></div><div className={styles.timeline}>{events.map((event) => <article key={event.id}><span className={`${styles.timelineDot} ${toneClass(event.tone)}`}/><div><small>{fmtDate(event.at)} · {event.category}</small><strong>{event.title}</strong><p>{event.detail}</p><em>{event.source}</em></div></article>)}</div>{!events.length ? <div className={styles.panelEmpty}><History size={20}/><span>Aucun événement historique consolidé.</span></div> : null}</section>
}

function ActionComposer({ state, form, setForm, close, submit, pending }: { state: NonNullable<ComposerState>; form: Record<string, string>; setForm: (value: Record<string, string>) => void; close: () => void; submit: () => void; pending: boolean }) {
  return <CustomerOverlaySurface kind="nested-command" onClose={close} dirty={Object.values(form).some(Boolean)} ariaLabel={state.title}><section className={styles.composer}><header><div><span className={styles.eyebrow}>COMMANDE CONTEXTUELLE</span><h3>{state.title}</h3><p>{state.description}</p></div><button type="button" onClick={close} aria-label="Fermer"><X size={18}/></button></header><div className={styles.formGrid}>{state.fields.map((field) => <label key={field.key}><span>{field.label}{field.required ? ' *' : ''}</span>{field.type === 'textarea' ? <textarea rows={4} value={form[field.key] || ''} placeholder={field.placeholder} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}/> : field.type === 'select' ? <select value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}><option value="">Choisir…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type || 'text'} value={form[field.key] || ''} placeholder={field.placeholder} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}/>}</label>)}</div><footer><button type="button" onClick={close}>Annuler</button><button type="button" className={styles.primaryButton} onClick={submit} disabled={pending}>{pending ? 'Traitement…' : state.submitLabel}</button></footer></section></CustomerOverlaySurface>
}

function taskComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_task.assign', studentId: student.id, title: `Attribuer une action · ${student.fullName}`, description: 'L’action reste ouverte jusqu’à obtention de son résultat attendu.', submitLabel: 'Attribuer l’action', fields: [{ key: 'title', label: 'Action', required: true, placeholder: 'Ex. Vérifier le document médical' }, { key: 'detail', label: 'Contexte', type: 'textarea' }, { key: 'dueAt', label: 'Échéance', type: 'datetime-local' }, { key: 'expectedOutcome', label: 'Résultat attendu', required: true }, { key: 'priority', label: 'Priorité', type: 'select', options: [{ value: 'normal', label: 'Normale' }, { value: 'high', label: 'Haute' }, { value: 'critical', label: 'Critique' }] }] } }
function noteComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_note.add', studentId: student.id, title: `Ajouter une note · ${student.fullName}`, description: 'Note opérationnelle interne, distincte d’un diagnostic ou d’une communication parent.', submitLabel: 'Ajouter la note', fields: [{ key: 'title', label: 'Titre' }, { key: 'body', label: 'Note', type: 'textarea', required: true }, { key: 'visibility', label: 'Visibilité', type: 'select', options: [{ value: 'internal', label: 'Interne' }, { value: 'restricted', label: 'Restreinte' }] }] } }
function healthComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_health.add_instruction', studentId: student.id, title: `Nouvelle instruction santé · ${student.fullName}`, description: 'Enregistrez ce qui doit être appliqué, sa source et sa période. Aucun diagnostic automatisé.', submitLabel: 'Enregistrer l’instruction', fields: [{ key: 'title', label: 'Titre', required: true }, { key: 'instruction', label: 'Instruction opérationnelle', type: 'textarea', required: true }, { key: 'severity', label: 'Niveau', type: 'select', options: [{ value: 'standard', label: 'Standard' }, { value: 'high', label: 'Haute vigilance' }, { value: 'critical', label: 'Critique' }] }, { key: 'sourceKind', label: 'Source', type: 'select', options: [{ value: 'family_declaration', label: 'Déclaration famille' }, { value: 'medical_document', label: 'Document médical' }, { value: 'professional_instruction', label: 'Instruction professionnelle' }] }, { key: 'sourceReference', label: 'Référence source' }, { key: 'effectiveUntil', label: 'Valide jusqu’au', type: 'datetime-local' }] } }
function medicationComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_medication.create', studentId: student.id, title: `Plan médicament · ${student.fullName}`, description: 'Plan contrôlé : médicament, dosage, horaires et preuves d’autorisation restent explicitement reliés.', submitLabel: 'Créer le plan', fields: [{ key: 'medicationName', label: 'Médicament', required: true }, { key: 'dosageInstruction', label: 'Dosage autorisé', required: true }, { key: 'scheduleInstruction', label: 'Horaire / fréquence', required: true }, { key: 'authorizationDocumentId', label: 'Référence autorisation' }, { key: 'medicalEvidenceDocumentId', label: 'Référence médicale' }, { key: 'effectiveUntil', label: 'Fin de validité', type: 'datetime-local' }] } }
function observationComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_wellbeing.add_observation', studentId: student.id, title: `Observation factuelle · ${student.fullName}`, description: 'Décrivez ce qui a été observé avant toute interprétation. Le système ne pose aucun diagnostic.', submitLabel: 'Enregistrer l’observation', fields: [{ key: 'observedFact', label: 'Fait observé', type: 'textarea', required: true }, { key: 'context', label: 'Contexte', type: 'textarea' }, { key: 'adultInterpretation', label: 'Interprétation adulte (facultative)', type: 'textarea' }, { key: 'actionTaken', label: 'Action prise', type: 'textarea' }, { key: 'followUp', label: 'Suivi prévu', type: 'textarea' }] } }
function supportComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_wellbeing.create_support_plan', studentId: student.id, title: `Plan d’accompagnement · ${student.fullName}`, description: 'Un plan concret avec objectif, actions, revue et condition de réussite.', submitLabel: 'Créer le plan', fields: [{ key: 'planType', label: 'Type', type: 'select', options: [{ value: 'adaptation', label: 'Adaptation' }, { value: 'language', label: 'Langage' }, { value: 'academic', label: 'Pédagogique' }, { value: 'wellbeing', label: 'Bien-être' }] }, { key: 'objective', label: 'Objectif', required: true }, { key: 'needStatement', label: 'Besoin constaté', type: 'textarea' }, { key: 'reviewAt', label: 'Prochaine revue', type: 'datetime-local' }, { key: 'successCondition', label: 'Condition de réussite', required: true }] } }
function incidentComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_incident.create', studentId: student.id, title: `Ouvrir un incident · ${student.fullName}`, description: 'Enregistrez les faits, l’action immédiate et la gravité sans qualifier l’enfant.', submitLabel: 'Ouvrir l’incident', fields: [{ key: 'incidentType', label: 'Type', type: 'select', options: [{ value: 'safety', label: 'Sécurité' }, { value: 'health', label: 'Santé' }, { value: 'behaviour', label: 'Comportement' }, { value: 'transport', label: 'Transport' }, { value: 'pickup', label: 'Remise / récupération' }, { value: 'operational', label: 'Autre opérationnel' }] }, { key: 'title', label: 'Titre', required: true }, { key: 'facts', label: 'Faits observés', type: 'textarea', required: true }, { key: 'severity', label: 'Gravité', type: 'select', options: [{ value: 'standard', label: 'Standard' }, { value: 'high', label: 'Importante' }, { value: 'critical', label: 'Critique' }] }, { key: 'immediateAction', label: 'Action immédiate', type: 'textarea' }] } }
function transitionComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_transition.prepare', studentId: student.id, title: `Préparer une transition · ${student.fullName}`, description: 'Cette préparation ne change pas la classe. L’Aire 3 conserve l’autorité d’exécution.', submitLabel: 'Préparer la transition', fields: [{ key: 'transitionType', label: 'Type', type: 'select', options: [{ value: 'class_change', label: 'Changement de classe' }, { value: 'section_change', label: 'Changement de section' }, { value: 'academic_year', label: 'Nouvelle année scolaire' }, { value: 'site_transfer', label: 'Transfert de site' }, { value: 'return', label: 'Retour après absence' }] }, { key: 'fromLabel', label: 'Situation actuelle', placeholder: student.className || '' }, { key: 'toLabel', label: 'Situation cible', required: true }, { key: 'effectiveAt', label: 'Date d’effet', type: 'datetime-local' }, { key: 'reason', label: 'Motif', type: 'textarea' }] } }
function serviceRequestComposer(student: Angelcare360Area10StudentSummary): NonNullable<ComposerState> { return { operation: 'student_service.request_change', studentId: student.id, title: `Demande service · ${student.fullName}`, description: 'La demande est suivie dans Élève 360, mais le registre du service reste la source canonique.', submitLabel: 'Créer la demande', fields: [{ key: 'title', label: 'Demande', required: true }, { key: 'detail', label: 'Contexte', type: 'textarea' }, { key: 'dueAt', label: 'Échéance', type: 'datetime-local' }] } }
