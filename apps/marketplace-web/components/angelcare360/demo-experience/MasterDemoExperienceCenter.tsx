'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Boxes,
  Building2,
  Bus,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Compass,
  GraduationCap,
  Heart,
  Library,
  MessageCircle,
  Play,
  RotateCcw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SanilaCommandCenterSnapshot } from '@/lib/angelcare360/server/command-center-experience'
import type { SanilaDemoExperienceState } from '@/lib/angelcare360/server/demo-experience-state'
import {
  SANILA_EXPERIENCE_MODULES,
  SANILA_GUIDED_JOURNEYS,
  SANILA_PRIORITY_OPTIONS,
  type SanilaExperienceModuleId,
} from '@/lib/angelcare360/experience/contract'
import styles from './MasterDemoExperienceCenter.module.css'

type Props = {
  snapshot: SanilaCommandCenterSnapshot
  initialState: SanilaDemoExperienceState
  visitorName?: string | null
}

type DemoEvent = Record<string, unknown> & { eventType: string }

const ICONS: Record<SanilaExperienceModuleId, LucideIcon> = {
  'cockpit-direction': BarChart3,
  people: Users,
  admissions: UserRoundCheck,
  presences: ClipboardCheck,
  academique: GraduationCap,
  finance: WalletCards,
  paie: Building2,
  transport: Bus,
  bibliotheque: Library,
  inventaire: Boxes,
  messagerie: MessageCircle,
  reclamations: ShieldCheck,
  rapports: TrendingUp,
  administration: Building2,
}

function value(metric: { value: number | null }) {
  return metric.value == null ? '—' : new Intl.NumberFormat('fr-FR').format(metric.value)
}

async function postEvent(payload: DemoEvent) {
  const response = await fetch('/api/angelcare360/demo-experience', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return response.ok
}

function MiniLine({ points }: { points: number[] }) {
  if (!points.length) return null
  const width = 210
  const height = 54
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = Math.max(max - min, 1)
  const path = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
    const y = height - 5 - ((point - min) / range) * (height - 12)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
  return <svg className={styles.sparkline} viewBox={`0 0 ${width} ${height}`} aria-hidden="true"><path d={path} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function ProgressRing({ value }: { value: number }) {
  const radius = 29
  const circumference = Math.PI * 2 * radius
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference
  return (
    <div className={styles.progressRing} aria-label={`${value}% de la visite complétée`}>
      <svg viewBox="0 0 72 72" aria-hidden="true"><circle className={styles.ringTrack} cx="36" cy="36" r={radius}/><circle className={styles.ringValue} cx="36" cy="36" r={radius} strokeDasharray={circumference} strokeDashoffset={offset}/></svg>
      <strong>{value}%</strong>
    </div>
  )
}

export default function MasterDemoExperienceCenter({ snapshot, initialState, visitorName }: Props) {
  const [visited, setVisited] = useState<Set<SanilaExperienceModuleId>>(new Set(initialState.visitedModules))
  const [favorites, setFavorites] = useState<Set<SanilaExperienceModuleId>>(new Set(initialState.favorites))
  const [priorities, setPriorities] = useState<Set<string>>(new Set(initialState.priorities))
  const [questions, setQuestions] = useState(initialState.questions)
  const [journeyId, setJourneyId] = useState<string | null>(initialState.currentJourneyId)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('Tous')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const key = 'sanila-demo-experience-started'
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
    void postEvent({ eventType: 'experience_visit_started' })
  }, [])

  const progress = Math.round((visited.size / SANILA_EXPERIENCE_MODULES.length) * 100)
  const currentJourney = SANILA_GUIDED_JOURNEYS.find((journey) => journey.id === journeyId) || null
  const nextJourneyModule = currentJourney?.modules.map((id) => SANILA_EXPERIENCE_MODULES.find((module) => module.id === id)).find((module) => module && !visited.has(module.id)) || null
  const nextModule = nextJourneyModule || SANILA_EXPERIENCE_MODULES.find((module) => !visited.has(module.id)) || SANILA_EXPERIENCE_MODULES[0]
  const resumeHref = initialState.lastRoute?.startsWith('/angelcare-360-command-center') ? initialState.lastRoute : nextModule.href

  const filteredModules = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return SANILA_EXPERIENCE_MODULES.filter((module) => {
      const matchesFamily = family === 'Tous' || module.family === family
      const matchesQuery = !needle || `${module.label} ${module.promise} ${module.proof}`.toLowerCase().includes(needle)
      return matchesFamily && matchesQuery
    })
  }, [family, query])

  async function send(payload: DemoEvent, success?: string) {
    const ok = await postEvent(payload).catch(() => false)
    setStatus(ok ? success || null : 'Votre action reste visible dans cette page, mais sa synchronisation n’a pas pu être confirmée.')
    return ok
  }

  function markVisited(moduleId: SanilaExperienceModuleId, href: string) {
    setVisited((current) => new Set([...current, moduleId]))
    void send({ eventType: 'experience_module_visited', moduleId, path: href })
  }

  function toggleFavorite(moduleId: SanilaExperienceModuleId) {
    const enabled = !favorites.has(moduleId)
    setFavorites((current) => {
      const next = new Set(current)
      if (enabled) next.add(moduleId); else next.delete(moduleId)
      return next
    })
    void send({ eventType: 'experience_favorite_set', moduleId, enabled }, enabled ? 'Ajouté à vos favoris.' : 'Retiré de vos favoris.')
  }

  function togglePriority(priority: string) {
    const enabled = !priorities.has(priority)
    setPriorities((current) => {
      const next = new Set(current)
      if (enabled) next.add(priority); else next.delete(priority)
      return next
    })
    void send({ eventType: 'experience_priority_set', priority, enabled })
  }

  async function submitQuestion(event: FormEvent) {
    event.preventDefault()
    const text = question.trim()
    if (text.length < 3) return
    const ok = await send({ eventType: 'experience_question_added', question: text }, 'Question ajoutée à votre bilan de visite.')
    if (ok) {
      setQuestions((current) => [...current, { id: `local-${Date.now()}`, text, createdAt: new Date().toISOString() }])
      setQuestion('')
    }
  }

  function chooseJourney(id: string) {
    setJourneyId(id)
    void send({ eventType: 'experience_journey_selected', journeyId: id }, 'Parcours sélectionné.')
  }

  async function resetVisit() {
    if (!window.confirm('Réinitialiser uniquement votre parcours de découverte ? Les données de l’école de démonstration ne seront pas modifiées.')) return
    const ok = await send({ eventType: 'experience_visit_reset' })
    if (ok) {
      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index)
        if (key?.startsWith('sanila-demo-visit:') || key === 'sanila-demo-experience-started') window.sessionStorage.removeItem(key)
      }
      setVisited(new Set()); setFavorites(new Set()); setPriorities(new Set()); setQuestions([]); setJourneyId(null); setStatus('Votre parcours de découverte a été réinitialisé.')
    }
  }

  const attendanceRate = snapshot.metrics.attendanceToday.value
    ? Math.round((((snapshot.metrics.attendanceToday.value || 0) - (snapshot.metrics.absencesToday.value || 0)) / Math.max(snapshot.metrics.attendanceToday.value || 1, 1)) * 1000) / 10
    : null

  const families = ['Tous', 'Pilotage', 'Scolarité', 'Gestion', 'Services', 'Gouvernance']

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlowOne}/><div className={styles.heroGlowTwo}/>
        <div className={styles.heroTopline}>
          <span className={styles.liveBadge}><span/>École de démonstration en activité</span>
          <span className={styles.heroTime}><Clock3 size={14}/>{snapshot.businessTimeLabel}</span>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><Sparkles size={15}/> SANILA EXPERIENCE CENTER</div>
            <h1>{visitorName ? `Bienvenue ${visitorName.split(' ')[0]}.` : 'Bienvenue dans SANILA.'}<br/><span>Explorez une école déjà en mouvement.</span></h1>
            <p>Découvrez comment SANILA relie direction, scolarité, finance, équipes et services autour d’une même réalité opérationnelle. Chaque univers ci-dessous ouvre le vrai produit.</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={() => { chooseJourney('direction'); document.getElementById('journeys')?.scrollIntoView({ behavior: 'smooth' }) }}><Play size={17}/>Démarrer une visite guidée</button>
              <a className={styles.secondaryButton} href="#univers"><Compass size={17}/>Explorer librement</a>
              {initialState.eventCount > 0 ? <Link className={styles.ghostButton} href={resumeHref}><Route size={17}/>Reprendre ma visite</Link> : null}
            </div>
          </div>
          <aside className={styles.schoolPassport}>
            <div className={styles.passportHeader}><div><small>ÉTABLISSEMENT</small><strong>{snapshot.school.name}</strong></div><div className={styles.schoolMark}><Building2 size={22}/></div></div>
            <div className={styles.passportGrid}>
              <div><strong>{value(snapshot.metrics.students)}</strong><span>élèves</span></div>
              <div><strong>{value(snapshot.metrics.classes)}</strong><span>classes</span></div>
              <div><strong>{value(snapshot.metrics.teachers)}</strong><span>enseignants</span></div>
              <div><strong>{value(snapshot.metrics.staff)}</strong><span>collaborateurs</span></div>
            </div>
            <div className={styles.passportFooter}><span>{snapshot.school.academicYearLabel || 'Année scolaire active'}</span><span>Package Enterprise</span></div>
          </aside>
        </div>
      </section>

      <section className={styles.proofRail} aria-label="Preuves de la vie de l’établissement">
        <div className={styles.proofLead}><span>AUJOURD’HUI</span><strong>La journée est déjà vivante.</strong><p>Entrez par un indicateur, puis descendez jusqu’au dossier opérationnel.</p></div>
        <Link href="/angelcare-360-command-center/presences/jour" className={styles.proofCard} onClick={() => markVisited('presences', '/angelcare-360-command-center/presences/jour')}><ClipboardCheck/><div><small>Présences suivies</small><strong>{value(snapshot.metrics.attendanceToday)}</strong><span>{attendanceRate == null ? 'Synchronisation à vérifier' : `${attendanceRate}% de présence / arrivée`}</span></div><ChevronRight/></Link>
        <Link href="/angelcare-360-command-center/finance" className={styles.proofCard} onClick={() => markVisited('finance', '/angelcare-360-command-center/finance')}><WalletCards/><div><small>Factures dans l’année</small><strong>{value(snapshot.metrics.invoices)}</strong><span>{value(snapshot.metrics.overdueInvoices)} à recouvrer</span></div><ChevronRight/></Link>
        <Link href="/angelcare-360-command-center/academique" className={styles.proofCard} onClick={() => markVisited('academique', '/angelcare-360-command-center/academique')}><GraduationCap/><div><small>Évaluations & notes</small><strong>{value(snapshot.metrics.marks)}</strong><span>{value(snapshot.metrics.assignments)} devoirs structurés</span></div><ChevronRight/></Link>
        <Link href="/angelcare-360-command-center/transport" className={styles.proofCard} onClick={() => markVisited('transport', '/angelcare-360-command-center/transport')}><Bus/><div><small>Circuits actifs</small><strong>{value(snapshot.metrics.transportRoutes)}</strong><span>Matin exécuté · après-midi planifié</span></div><ChevronRight/></Link>
      </section>

      <section id="journeys" className={styles.section}>
        <div className={styles.sectionHeading}><div><span>VISITES GUIDÉES</span><h2>Choisissez le parcours qui ressemble à votre rôle.</h2><p>Vous pouvez quitter le parcours à tout moment et continuer librement.</p></div><div className={styles.sectionBadge}><Compass size={18}/>5 parcours</div></div>
        <div className={styles.journeyGrid}>
          {SANILA_GUIDED_JOURNEYS.map((journey, index) => {
            const selected = journey.id === journeyId
            const done = journey.modules.filter((id) => visited.has(id)).length
            return <button type="button" key={journey.id} className={`${styles.journeyCard} ${selected ? styles.journeySelected : ''}`} onClick={() => chooseJourney(journey.id)}>
              <div className={styles.journeyIndex}>0{index + 1}</div>
              <div className={styles.journeyContent}><div className={styles.journeyMeta}><span>{journey.durationMinutes} min</span><span>{done}/{journey.modules.length} explorés</span></div><h3>{journey.label}</h3><p>{journey.description}</p><div className={styles.journeyModules}>{journey.modules.slice(0, 6).map((id) => <span key={id}>{SANILA_EXPERIENCE_MODULES.find((module) => module.id === id)?.shortLabel}</span>)}</div></div>
              <div className={styles.journeyAction}>{selected ? <><Check size={16}/>Sélectionné</> : <>Choisir<ArrowRight size={16}/></>}</div>
            </button>
          })}
        </div>
        {currentJourney ? <div className={styles.resumeBand}><div><span>PARCOURS ACTIF</span><strong>{currentJourney.label}</strong><p>{nextJourneyModule ? `Prochaine étape recommandée : ${nextJourneyModule.label}` : 'Vous avez exploré toutes les étapes de ce parcours.'}</p></div>{nextJourneyModule ? <Link href={nextJourneyModule.href} onClick={() => markVisited(nextJourneyModule.id, nextJourneyModule.href)}>Continuer le parcours<ArrowRight size={17}/></Link> : <button type="button" onClick={() => setDrawerOpen(true)}>Voir mon bilan<Star size={16}/></button>}</div> : null}
      </section>

      <section className={styles.todayGrid}>
        <article className={`${styles.todayCard} ${styles.attendanceCard}`}>
          <div className={styles.cardTop}><div><span>PRÉSENCES · 7 JOURS</span><h3>Rythme quotidien</h3></div><ClipboardCheck size={20}/></div>
          <div className={styles.chartNumber}>{attendanceRate == null ? '—' : `${attendanceRate}%`}<small>aujourd’hui</small></div>
          <MiniLine points={snapshot.attendanceTrend.map((point) => point.primary)}/>
          <div className={styles.chartLegend}>{snapshot.attendanceTrend.map((point) => <span key={point.key}><i/>{point.label}</span>)}</div>
          <Link href="/angelcare-360-command-center/presences">Explorer les présences<ArrowRight size={15}/></Link>
        </article>
        <article className={`${styles.todayCard} ${styles.financeCard}`}>
          <div className={styles.cardTop}><div><span>FINANCE · 6 MOIS</span><h3>Facturation & encaissement</h3></div><WalletCards size={20}/></div>
          <div className={styles.financeBars}>{snapshot.financeTrend.map((point) => { const max = Math.max(...snapshot.financeTrend.map((item) => item.primary), 1); return <div key={point.key} className={styles.financeBarItem}><div className={styles.financeBarTrack}><i style={{ height: `${Math.max(8, (point.primary / max) * 100)}%` }}/><b style={{ height: `${Math.max(5, ((point.secondary || 0) / max) * 100)}%` }}/></div><span>{point.label}</span></div> })}</div>
          <div className={styles.miniLegend}><span><i/>Facturé</span><span><b/>Encaissé</span></div>
          <Link href="/angelcare-360-command-center/finance">Explorer la finance<ArrowRight size={15}/></Link>
        </article>
        <article className={`${styles.todayCard} ${styles.admissionsCard}`}>
          <div className={styles.cardTop}><div><span>ADMISSIONS</span><h3>Du dossier à l’inscription</h3></div><UserRoundCheck size={20}/></div>
          <div className={styles.funnel}>{snapshot.admissionsFunnel.map((point, index) => { const max = Math.max(...snapshot.admissionsFunnel.map((item) => item.primary), 1); return <div key={point.key}><div className={styles.funnelLabel}><span>{point.label}</span><strong>{point.primary}</strong></div><div className={styles.funnelTrack}><i style={{ width: `${Math.max(6, (point.primary / max) * 100)}%`, opacity: 1 - index * .1 }}/></div></div> })}</div>
          <Link href="/angelcare-360-command-center/admissions">Explorer les admissions<ArrowRight size={15}/></Link>
        </article>
      </section>

      <section id="univers" className={styles.section}>
        <div className={styles.sectionHeading}><div><span>14 UNIVERS SANILA</span><h2>Explorez le produit à votre rythme.</h2><p>Chaque carte ouvre un vrai espace opérationnel de l’école de démonstration.</p></div><button type="button" className={styles.visitButtonInline} onClick={() => setDrawerOpen(true)}><ProgressRing value={progress}/><div><strong>Ma visite SANILA</strong><span>{visited.size}/14 explorés · {favorites.size} favoris</span></div><ChevronRight size={18}/></button></div>
        <div className={styles.catalogToolbar}><div className={styles.searchBox}><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un univers ou un besoin…"/></div><div className={styles.familyFilters}>{families.map((item) => <button type="button" className={family === item ? styles.filterActive : ''} onClick={() => setFamily(item)} key={item}>{item}</button>)}</div></div>
        <div className={styles.moduleGrid}>
          {filteredModules.map((module, index) => {
            const Icon = ICONS[module.id]
            const isVisited = visited.has(module.id)
            const isFavorite = favorites.has(module.id)
            return <article key={module.id} className={`${styles.moduleCard} ${styles[`accent_${module.accent}`] || ''}`}>
              <div className={styles.moduleTop}><div className={styles.moduleIcon}><Icon size={21}/></div><div className={styles.moduleStatus}>{isVisited ? <><Check size={13}/>Visité</> : <>{String(index + 1).padStart(2, '0')}</>}</div></div>
              <div className={styles.moduleFamily}>{module.family}</div><h3>{module.label}</h3><p>{module.promise}</p><div className={styles.moduleProof}><BookOpenCheck size={15}/><span>{module.proof}</span></div>
              <div className={styles.moduleFooter}><span><Clock3 size={13}/>{module.durationMinutes} min</span><div><button type="button" aria-label={isFavorite ? `Retirer ${module.label} des favoris` : `Ajouter ${module.label} aux favoris`} className={isFavorite ? styles.favoriteActive : ''} onClick={() => toggleFavorite(module.id)}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'}/></button><Link href={module.href} onClick={() => markVisited(module.id, module.href)}>Explorer<ArrowRight size={15}/></Link></div></div>
            </article>
          })}
        </div>
      </section>

      <section className={styles.conversionSection}>
        <div className={styles.conversionCopy}><span>VOTRE PROJET, PAS UNE DÉMO GÉNÉRIQUE</span><h2>Transformez votre exploration en discussion utile.</h2><p>Vos favoris, vos priorités et vos questions restent rassemblés dans votre bilan de visite. Ils permettent de préparer une présentation plus pertinente pour votre établissement.</p></div>
        <div className={styles.conversionActions}><button type="button" onClick={() => setDrawerOpen(true)}><Star size={17}/>Voir mon bilan</button><Link href="/angelcare-marketplace/fr/demonstration" onClick={() => void send({ eventType: 'experience_conversion_intent', intent: 'guided_demo' })}>Demander une présentation accompagnée<ArrowRight size={17}/></Link></div>
      </section>

      <button type="button" className={styles.floatingVisit} onClick={() => setDrawerOpen(true)}><ProgressRing value={progress}/><span><strong>Ma visite</strong><small>{visited.size}/14 · {favorites.size} favoris</small></span><ChevronRight size={17}/></button>

      {drawerOpen ? <div className={styles.drawerBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDrawerOpen(false) }}><aside className={styles.visitDrawer} aria-label="Ma visite SANILA">
        <header><div><span>MON PARCOURS D’ÉVALUATION</span><h2>Ma visite SANILA</h2></div><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fermer"><X size={20}/></button></header>
        <div className={styles.drawerProgress}><ProgressRing value={progress}/><div><strong>{visited.size} / 14 univers explorés</strong><p>{progress === 100 ? 'Parcours complet. Votre bilan est prêt.' : `Encore ${14 - visited.size} univers à découvrir.`}</p></div></div>
        <div className={styles.drawerSection}><div className={styles.drawerSectionTitle}><Check size={16}/>Checklist</div><div className={styles.checklist}>{SANILA_EXPERIENCE_MODULES.map((module) => <Link key={module.id} href={module.href} onClick={() => markVisited(module.id, module.href)} className={visited.has(module.id) ? styles.checkDone : ''}><span>{visited.has(module.id) ? <Check size={13}/> : null}</span>{module.shortLabel}<ChevronRight size={14}/></Link>)}</div></div>
        <div className={styles.drawerSection}><div className={styles.drawerSectionTitle}><Heart size={16}/>Ce que j’ai aimé</div>{favorites.size ? <div className={styles.favoriteList}>{SANILA_EXPERIENCE_MODULES.filter((module) => favorites.has(module.id)).map((module) => <button type="button" onClick={() => toggleFavorite(module.id)} key={module.id}><Heart size={14} fill="currentColor"/>{module.label}<X size={13}/></button>)}</div> : <p className={styles.emptyCopy}>Utilisez le cœur sur un univers pour le conserver dans votre sélection.</p>}</div>
        <div className={styles.drawerSection}><div className={styles.drawerSectionTitle}><Target size={16}/>Mes priorités</div><div className={styles.priorityGrid}>{SANILA_PRIORITY_OPTIONS.map((priority) => <button type="button" onClick={() => togglePriority(priority)} className={priorities.has(priority) ? styles.priorityActive : ''} key={priority}>{priorities.has(priority) ? <Check size={13}/> : <Target size={13}/>} {priority}</button>)}</div></div>
        <div className={styles.drawerSection}><div className={styles.drawerSectionTitle}><CircleHelp size={16}/>Mes questions</div><form onSubmit={submitQuestion} className={styles.questionForm}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex. Peut-on personnaliser les frais par niveau ?" maxLength={600}/><button type="submit" disabled={question.trim().length < 3}>Ajouter</button></form>{questions.length ? <div className={styles.questions}>{questions.slice(-6).reverse().map((item) => <div key={item.id}><CircleHelp size={14}/><span>{item.text}</span></div>)}</div> : null}</div>
        <div className={styles.drawerRecap}><span>VOTRE BILAN</span><strong>{favorites.size} favori{favorites.size > 1 ? 's' : ''} · {priorities.size} priorité{priorities.size > 1 ? 's' : ''} · {questions.length} question{questions.length > 1 ? 's' : ''}</strong><p>{nextModule ? `Prochaine recommandation : ${nextModule.label}.` : 'Votre parcours est complet.'}</p><div><Link href={nextModule.href} onClick={() => markVisited(nextModule.id, nextModule.href)}>Continuer<ArrowRight size={15}/></Link><Link href="/angelcare-marketplace/fr/contact" onClick={() => void send({ eventType: 'experience_conversion_intent', intent: 'contact' })}>Parler de mon projet</Link></div></div>
        <button type="button" className={styles.resetVisit} onClick={() => void resetVisit()}><RotateCcw size={14}/>Réinitialiser uniquement ma visite</button>
      </aside></div> : null}

      {status ? <div className={styles.toast} role="status"><span>{status.includes('pas pu') ? <AlertTriangle size={16}/> : <Check size={16}/>}</span>{status}<button type="button" onClick={() => setStatus(null)} aria-label="Fermer"><X size={14}/></button></div> : null}
    </div>
  )
}
