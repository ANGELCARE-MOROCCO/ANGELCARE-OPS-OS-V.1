'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import styles from './AdmissionsArea9Command.module.css'
import type {
  Angelcare360Area9CommandData,
  Angelcare360Area9Metric,
  Angelcare360Area9MutationRequest,
  Angelcare360Area9Record,
  Angelcare360Area9Tone,
  Angelcare360Area9View,
} from '@/types/angelcare360/admissions-area9'

type Props = { initialData: Angelcare360Area9CommandData }
type ActionState = {
  operation: string
  title: string
  description: string
  record: Angelcare360Area9Record | null
  fields: Array<{ key: string; label: string; type?: 'text' | 'date' | 'datetime-local' | 'textarea' | 'select'; required?: boolean; options?: string[]; placeholder?: string }>
  values: Record<string, string>
} | null

const VIEWS: Array<{ key: Angelcare360Area9View; label: string; short: string; description: string }> = [
  { key: 'today', label: 'Aujourd’hui', short: 'Aujourd’hui', description: 'Priorités, délais et décisions du jour.' },
  { key: 'inquiries', label: 'Nouvelles demandes', short: 'Demandes', description: 'Premier contact, qualification et relances.' },
  { key: 'families', label: 'Familles intéressées', short: 'Familles', description: 'Vue admission des familles et enfants candidats.' },
  { key: 'visits', label: 'Visites & rendez-vous', short: 'Visites', description: 'Agenda, confirmation et résultats des rencontres.' },
  { key: 'applications', label: 'Candidatures', short: 'Candidatures', description: 'Dossiers, progression et préparation des décisions.' },
  { key: 'documents', label: 'Documents', short: 'Documents', description: 'Pièces requises, réception et vérification.' },
  { key: 'evaluations', label: 'Évaluations', short: 'Évaluations', description: 'Compatibilité, besoins et avis pédagogiques.' },
  { key: 'decisions', label: 'Décisions', short: 'Décisions', description: 'Autorité, conditions et communication familiale.' },
  { key: 'waiting-list', label: 'Liste d’attente', short: 'Attente', description: 'Priorité explicable et alternatives de place.' },
  { key: 'offers', label: 'Offres & réservations', short: 'Offres', description: 'Propositions, réponses, réservations et échéances.' },
  { key: 'enrollments', label: 'Inscriptions', short: 'Inscriptions', description: 'Contrôles de préparation et conversion atomique.' },
  { key: 'onboarding', label: 'Accueil & intégration', short: 'Accueil', description: 'Préparation du premier jour et handover opérationnel.' },
  { key: 'attention', label: 'À régler', short: 'À régler', description: 'Blocages réels, retards et causes à corriger.' },
  { key: 'history', label: 'Historique', short: 'Historique', description: 'Chronologie reconstructible de chaque parcours.' },
]

const TONE_CLASS: Record<Angelcare360Area9Tone, string> = {
  navy: styles.toneNavy,
  cyan: styles.toneCyan,
  emerald: styles.toneEmerald,
  amber: styles.toneAmber,
  red: styles.toneRed,
  violet: styles.toneViolet,
  graphite: styles.toneGraphite,
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'À planifier'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'À planifier'
  return new Intl.DateTimeFormat('fr-FR', includeTime
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function iconFor(kind: Angelcare360Area9Record['kind']) {
  const icons: Record<Angelcare360Area9Record['kind'], string> = {
    inquiry: '◎', family: '⌂', candidate: '◉', visit: '◷', application: '▤', document: '▣', evaluation: '◇', decision: '◆', waitlist: '≋', offer: '◫', reservation: '⌛', enrollment: '✓', onboarding: '✦', issue: '!', history: '↺',
  }
  return icons[kind]
}

function makeIdempotencyKey(operation: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  return `area9:${operation}:${random}`
}

function defaultAction(record: Angelcare360Area9Record): ActionState {
  if (record.kind === 'inquiry' && record.stage === 'new') {
    return {
      operation: 'admission_inquiry.contact',
      title: 'Enregistrer le premier contact',
      description: 'Confirmez le résultat du contact et engagez immédiatement la prochaine étape.',
      record,
      fields: [
        { key: 'nextAction', label: 'Prochaine action', required: true, placeholder: 'Proposer une visite' },
        { key: 'dueAt', label: 'Échéance', type: 'datetime-local' },
        { key: 'notes', label: 'Compte rendu', type: 'textarea', placeholder: 'Besoin, questions et engagement de la famille…' },
      ],
      values: { nextAction: 'Proposer une visite', dueAt: '', notes: '' },
    }
  }
  if (record.kind === 'application' && ['approved', 'accepted'].includes(record.stage)) {
    return {
      operation: 'admission_enrollment.convert',
      title: 'Confirmer l’inscription',
      description: 'Lancez la conversion contrôlée vers les autorités Student 360, Family 360 et placement.',
      record,
      fields: [
        { key: 'confirmation', label: 'Confirmation', type: 'select', required: true, options: ['Je confirme les contrôles de préparation'] },
        { key: 'notes', label: 'Instructions de handover', type: 'textarea' },
      ],
      values: { confirmation: 'Je confirme les contrôles de préparation', notes: '' },
    }
  }
  if (record.kind === 'application') {
    return {
      operation: 'admission_application.mark_ready',
      title: 'Préparer la décision',
      description: 'Confirmez que le dossier est suffisamment complet pour l’autorité de décision.',
      record,
      fields: [
        { key: 'nextAction', label: 'Action suivante', required: true },
        { key: 'dueAt', label: 'Échéance de décision', type: 'datetime-local' },
      ],
      values: { nextAction: 'Enregistrer la décision', dueAt: '' },
    }
  }
  if (record.kind === 'visit') {
    return {
      operation: 'admission_visit.complete',
      title: 'Enregistrer l’issue de la visite',
      description: 'Transformez la rencontre en résultat clair et en prochaine action.',
      record,
      fields: [
        { key: 'outcome', label: 'Résultat', type: 'select', required: true, options: ['Candidature souhaitée', 'Réflexion en cours', 'Nouvelle visite demandée', 'Programme non adapté', 'Famille non intéressée'] },
        { key: 'nextAction', label: 'Prochaine action', required: true },
        { key: 'notes', label: 'Compte rendu', type: 'textarea' },
      ],
      values: { outcome: 'Candidature souhaitée', nextAction: 'Ouvrir la candidature', notes: '' },
    }
  }
  if (record.kind === 'document') {
    return {
      operation: 'admission_document.verify',
      title: 'Vérifier la pièce',
      description: 'Confirmez la conformité de la pièce et son impact sur la préparation du dossier.',
      record,
      fields: [{ key: 'notes', label: 'Note de vérification', type: 'textarea' }],
      values: { notes: '' },
    }
  }
  if (record.kind === 'evaluation') {
    return {
      operation: 'admission_evaluation.complete',
      title: 'Conclure l’évaluation',
      description: 'Enregistrez un résultat explicable sans le confondre avec la décision finale.',
      record,
      fields: [
        { key: 'outcome', label: 'Résultat', type: 'select', required: true, options: ['Compatible', 'Compatible sous conditions', 'Informations supplémentaires requises', 'Autre programme recommandé', 'Avis spécialisé requis'] },
        { key: 'notes', label: 'Avis et conditions', type: 'textarea' },
      ],
      values: { outcome: 'Compatible', notes: '' },
    }
  }
  if (record.kind === 'decision') {
    return {
      operation: 'admission_decision.approve',
      title: 'Valider la décision',
      description: 'Appliquez l’autorité de décision avec motif, conditions et date de validité.',
      record,
      fields: [
        { key: 'decision', label: 'Décision', type: 'select', required: true, options: ['Admettre', 'Admettre sous conditions', 'Liste d’attente', 'Autre programme', 'Reporter', 'Refuser'] },
        { key: 'reason', label: 'Motif', type: 'textarea', required: true },
      ],
      values: { decision: 'Admettre', reason: '' },
    }
  }
  if (record.kind === 'waitlist') {
    return {
      operation: 'admission_waitlist.confirm_interest',
      title: 'Confirmer l’intérêt de la famille',
      description: 'Actualisez l’intérêt, les alternatives acceptables et la prochaine révision.',
      record,
      fields: [
        { key: 'nextAction', label: 'Prochaine révision', required: true },
        { key: 'dueAt', label: 'Date', type: 'date' },
      ],
      values: { nextAction: 'Revoir la disponibilité', dueAt: '' },
    }
  }
  if (record.kind === 'offer') {
    return {
      operation: 'admission_offer.send',
      title: 'Envoyer l’offre',
      description: 'Envoyez une proposition familiale claire, traçable et limitée dans le temps.',
      record,
      fields: [
        { key: 'preferredChannel', label: 'Canal', type: 'select', options: ['Email', 'WhatsApp approuvé', 'Remise en main propre'] },
        { key: 'dueAt', label: 'Date limite de réponse', type: 'date', required: true },
      ],
      values: { preferredChannel: 'Email', dueAt: '' },
    }
  }
  if (record.kind === 'reservation') {
    return {
      operation: 'admission_reservation.extend',
      title: 'Prolonger la réservation',
      description: 'La prolongation reste motivée, autorisée et visible dans la capacité réelle.',
      record,
      fields: [
        { key: 'dueAt', label: 'Nouvelle expiration', type: 'datetime-local', required: true },
        { key: 'reason', label: 'Motif', type: 'textarea', required: true },
      ],
      values: { dueAt: '', reason: '' },
    }
  }
  if (record.kind === 'onboarding') {
    return {
      operation: 'admission_onboarding.confirm_readiness',
      title: 'Confirmer la préparation du premier jour',
      description: 'Validez les responsabilités, informations de sécurité et communications nécessaires.',
      record,
      fields: [{ key: 'notes', label: 'Vérification finale', type: 'textarea' }],
      values: { notes: '' },
    }
  }
  if (record.kind === 'issue') {
    return {
      operation: 'admission_issue.resolve',
      title: 'Vérifier la résolution',
      description: 'Le contrôle ne sera clôturé que si la cause réelle a été corrigée.',
      record,
      fields: [{ key: 'resolution', label: 'Correction réalisée', type: 'textarea', required: true }],
      values: { resolution: '' },
    }
  }
  return {
    operation: 'admission_note.add',
    title: 'Ajouter une note de suivi',
    description: 'Ajoutez une information utile sans modifier silencieusement l’historique.',
    record,
    fields: [{ key: 'notes', label: 'Note', type: 'textarea', required: true }],
    values: { notes: '' },
  }
}

export default function AdmissionsArea9Command({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [selectedView, setSelectedView] = useState<Angelcare360Area9View>(initialData.selectedView)
  const [selectedRecord, setSelectedRecord] = useState<Angelcare360Area9Record | null>(initialData.selectedRecord)
  const [action, setAction] = useState<ActionState>(null)
  const [query, setQuery] = useState('')
  const [toneFilter, setToneFilter] = useState<'all' | Angelcare360Area9Tone>('all')
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedViewMeta = VIEWS.find((item) => item.key === selectedView) || VIEWS[0]
  const visibleRecords = useMemo(() => {
    const source = data.recordsByView[selectedView] || []
    const normalized = query.trim().toLowerCase()
    return source.filter((record) => {
      const matchesText = !normalized || [record.title, record.subtitle, record.reference, record.stageLabel, record.nextAction, record.contactName, record.candidateName].some((value) => String(value || '').toLowerCase().includes(normalized))
      const matchesTone = toneFilter === 'all' || record.tone === toneFilter
      return matchesText && matchesTone
    })
  }, [data, query, selectedView, toneFilter])

  function changeView(view: Angelcare360Area9View) {
    setSelectedView(view)
    setSelectedRecord(null)
    setAction(null)
    setQuery('')
    router.replace(`/angelcare-360-command-center/admissions?view=${view}`, { scroll: false })
  }

  function openRecord(record: Angelcare360Area9Record) {
    setSelectedRecord(record)
    setAction(null)
    router.replace(`/angelcare-360-command-center/admissions?view=${selectedView}&record=${encodeURIComponent(record.id)}`, { scroll: false })
  }

  function closeRecord() {
    setSelectedRecord(null)
    setAction(null)
    router.replace(`/angelcare-360-command-center/admissions?view=${selectedView}`, { scroll: false })
  }

  function createInquiry() {
    setAction({
      operation: 'admission_inquiry.create',
      title: 'Nouvelle demande d’inscription',
      description: 'Capturez uniquement les informations nécessaires au premier contact. Le dossier permanent sera créé plus tard, après vérification.',
      record: null,
      fields: [
        { key: 'candidateName', label: 'Nom de l’enfant candidat', required: true },
        { key: 'contactName', label: 'Nom du contact familial', required: true },
        { key: 'phone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'programme', label: 'Programme ou niveau demandé' },
        { key: 'intake', label: 'Rentrée souhaitée' },
        { key: 'source', label: 'Source', type: 'select', options: ['Appel direct', 'Site web', 'Passage spontané', 'Recommandation d’une famille', 'Partenaire', 'Campagne', 'Événement', 'Source inconnue'] },
        { key: 'preferredChannel', label: 'Canal préféré', type: 'select', options: ['Téléphone', 'Email', 'WhatsApp approuvé'] },
        { key: 'notes', label: 'Besoin initial', type: 'textarea' },
      ],
      values: { candidateName: '', contactName: '', phone: '', email: '', programme: '', intake: '', source: 'Appel direct', preferredChannel: 'Téléphone', notes: '' },
    })
  }

  async function refresh() {
    const response = await fetch(`/api/angelcare360/admissions/area9?view=${selectedView}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok || !payload?.data) throw new Error(payload?.error || 'Actualisation impossible.')
    setData(payload.data as Angelcare360Area9CommandData)
    if (selectedRecord) {
      const refreshed = Object.values((payload.data as Angelcare360Area9CommandData).recordsByView).flat().find((record) => record.id === selectedRecord.id)
      setSelectedRecord(refreshed || null)
    }
  }

  async function executeAction() {
    if (!action) return
    const missing = action.fields.find((field) => field.required && !String(action.values[field.key] || '').trim())
    if (missing) {
      setMessage({ tone: 'error', text: `Le champ « ${missing.label} » est obligatoire.` })
      return
    }
    setMessage(null)
    startTransition(() => {
      void (async () => {
        try {
          const request: Angelcare360Area9MutationRequest = {
          operation: action.operation,
          idempotencyKey: makeIdempotencyKey(action.operation),
          recordId: action.record?.id || null,
          sourceId: action.record?.sourceId || null,
          payload: {
            ...action.values,
            candidateName: action.values.candidateName || action.record?.candidateName || action.record?.title,
            contactName: action.values.contactName || action.record?.contactName,
            applicationId: action.record?.kind === 'application' ? action.record.sourceId : undefined,
            leadId: action.record?.kind === 'inquiry' ? action.record.sourceId : undefined,
            classId: action.values.classId || String(action.record?.metadata?.classId || ''),
            sectionId: action.values.sectionId || String(action.record?.metadata?.sectionId || ''),
            academicYearId: action.values.academicYearId || String(action.record?.metadata?.academicYearId || ''),
          },
        }
        const response = await fetch('/api/angelcare360/admissions/area9', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
        })
        const result = await response.json()
        if (!response.ok || !result?.ok) throw new Error(result?.message || result?.error || 'L’action n’a pas été terminée.')
        await refresh()
        setMessage({ tone: 'success', text: result.message || 'Action terminée.' })
        setAction(null)
        } catch (error) {
          setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'L’action n’a pas été terminée.' })
        }
      })()
    })
  }

  function openCustomAction(operation: string, title: string, description: string, fields: NonNullable<ActionState>['fields'], values: Record<string, string>, record = selectedRecord) {
    setAction({ operation, title, description, record, fields, values })
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroTopline}>
          <div className={styles.brandLockup}>
            <span className={styles.brandMark}>A9</span>
            <div>
              <span className={styles.eyebrow}>SANILA · FAMILY ADMISSION JOURNEY COMMAND</span>
              <strong>{data.school.name}</strong>
            </div>
          </div>
          <div className={styles.heroMeta}>
            <span>{data.academicYear.label}</span>
            <span>Actualisé {formatDate(data.generatedAt, true)}</span>
          </div>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.sectionKicker}>Admissions & inscriptions</span>
            <h1>Chaque famille guidée.<br /><em>Chaque inscription maîtrisée.</em></h1>
            <p>Du premier contact au premier jour, SANILA orchestre les réponses, visites, pièces, décisions, places, conditions et handovers sans perdre le contexte familial.</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={createInquiry} disabled={!data.capabilities.canCreate}>Nouvelle demande <span>＋</span></button>
              <button type="button" className={styles.secondaryButton} onClick={() => changeView('attention')}>Ouvrir les priorités <span>→</span></button>
              <button type="button" className={styles.ghostButton} onClick={() => changeView('enrollments')}>Préparer une inscription</button>
            </div>
          </div>
          <div className={styles.heroCommandCard}>
            <div className={styles.commandHeader}>
              <div><span>Action recommandée</span><strong>{data.attention[0]?.nextAction || 'Poursuivre les admissions sans blocage'}</strong></div>
              <span className={data.attention.length ? styles.commandAlert : styles.commandHealthy}>{data.attention.length || '✓'}</span>
            </div>
            {data.attention[0] ? (
              <button className={styles.commandMatter} type="button" onClick={() => data.attention[0].record && openRecord(data.attention[0].record)}>
                <span className={`${styles.commandIcon} ${TONE_CLASS[data.attention[0].tone]}`}>!</span>
                <span><strong>{data.attention[0].title}</strong><small>{data.attention[0].detail}</small></span>
                <em>Traiter</em>
              </button>
            ) : (
              <div className={styles.commandMatterStatic}><span className={`${styles.commandIcon} ${styles.toneEmerald}`}>✓</span><span><strong>Admissions à jour</strong><small>Aucune réponse, pièce ou décision ne nécessite une intervention immédiate.</small></span></div>
            )}
            <div className={styles.readinessGrid}>
              <Readiness label="Année scolaire" ready={data.readiness.academicYear} />
              <Readiness label="Exigences dossier" ready={data.readiness.applicationRequirements} />
              <Readiness label="Capacité classes" ready={data.readiness.capacityAuthority} />
              <Readiness label="Autorité décision" ready={data.readiness.decisionAuthority} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid} aria-label="Indicateurs admissions">
        {data.metrics.map((metric) => <MetricCard key={metric.key} metric={metric} onOpen={() => changeView(metric.view)} />)}
      </section>

      <nav className={styles.viewRail} aria-label="Navigation admissions">
        {VIEWS.map((view) => (
          <button key={view.key} type="button" className={selectedView === view.key ? styles.viewButtonActive : styles.viewButton} onClick={() => changeView(view.key)}>
            <span>{view.short}</span>
            {view.key === 'attention' && data.attention.length ? <em>{data.attention.length}</em> : null}
          </button>
        ))}
      </nav>

      {selectedView === 'today' ? (
        <TodayCommand data={data} onOpen={openRecord} onView={changeView} />
      ) : (
        <section className={styles.operatingSurface}>
          <header className={styles.surfaceHeader}>
            <div>
              <span className={styles.sectionKicker}>{selectedViewMeta.label}</span>
              <h2>{selectedViewMeta.description}</h2>
            </div>
            <div className={styles.surfaceActions}>
              <div className={styles.searchField}><span>⌕</span><input value={query} onChange={(event: { target: { value: string } }) => setQuery(event.target.value)} placeholder="Rechercher une famille, un enfant, une référence…" /></div>
              <select value={toneFilter} onChange={(event: { target: { value: string } }) => setToneFilter(event.target.value as typeof toneFilter)} aria-label="Filtrer par état">
                <option value="all">Tous les états</option>
                <option value="cyan">Nouveau / actif</option>
                <option value="amber">À vérifier</option>
                <option value="red">Bloqué / en retard</option>
                <option value="violet">Décision / offre</option>
                <option value="emerald">Prêt / confirmé</option>
              </select>
              {selectedView === 'inquiries' ? <button type="button" className={styles.compactPrimary} onClick={createInquiry}>＋ Demande</button> : null}
            </div>
          </header>

          {selectedView === 'attention' ? (
            <AttentionBoard data={data} onOpen={openRecord} />
          ) : selectedView === 'decisions' ? (
            <DecisionBoard records={visibleRecords} onOpen={openRecord} />
          ) : selectedView === 'enrollments' ? (
            <EnrollmentBoard records={visibleRecords} onOpen={openRecord} />
          ) : selectedView === 'visits' ? (
            <VisitAgenda records={visibleRecords} onOpen={openRecord} />
          ) : selectedView === 'history' ? (
            <HistoryTimeline records={visibleRecords} onOpen={openRecord} />
          ) : (
            <RecordGrid records={visibleRecords} onOpen={openRecord} emptyTitle={selectedViewMeta.label} />
          )}
        </section>
      )}

      {message ? <div className={message.tone === 'success' ? styles.toastSuccess : styles.toastError} role="status"><span>{message.tone === 'success' ? '✓' : '!'}</span>{message.text}<button type="button" onClick={() => setMessage(null)}>×</button></div> : null}

      {selectedRecord ? (
        <RecordDrawer
          record={selectedRecord}
          canApprove={data.capabilities.canApprove}
          onClose={closeRecord}
          onPrimary={() => setAction(defaultAction(selectedRecord))}
          onCustom={openCustomAction}
        />
      ) : null}

      {action ? (
        <ActionChamber
          action={action}
          pending={isPending}
          onClose={() => setAction(null)}
          onChange={(key, value) => setAction((current) => current ? { ...current, values: { ...current.values, [key]: value } } : current)}
          onExecute={executeAction}
        />
      ) : null}
    </main>
  )
}

function MetricCard({ metric, onOpen }: { metric: Angelcare360Area9Metric; onOpen: () => void }) {
  return (
    <button type="button" className={`${styles.metricCard} ${TONE_CLASS[metric.tone]}`} onClick={onOpen}>
      <span className={styles.metricTop}><em>{metric.label}</em><i>↗</i></span>
      <strong>{metric.value}</strong>
      <small>{metric.detail}</small>
      <span className={styles.metricLine}><i /></span>
    </button>
  )
}

function Readiness({ label, ready }: { label: string; ready: boolean }) {
  return <div className={styles.readinessItem}><span className={ready ? styles.readyDot : styles.watchDot}>{ready ? '✓' : '!'}</span><strong>{label}</strong><em>{ready ? 'Prêt' : 'À vérifier'}</em></div>
}

function TodayCommand({ data, onOpen, onView }: { data: Angelcare360Area9CommandData; onOpen: (record: Angelcare360Area9Record) => void; onView: (view: Angelcare360Area9View) => void }) {
  return (
    <section className={styles.todayGrid}>
      <article className={styles.journeyBoard}>
        <header className={styles.panelHeader}><div><span className={styles.sectionKicker}>Family Journey Board</span><h2>Du premier contact au premier jour</h2></div><button type="button" onClick={() => onView('applications')}>Vue complète →</button></header>
        <div className={styles.lanes}>
          {data.lanes.map((lane) => (
            <div key={lane.key} className={styles.lane}>
              <div className={styles.laneHeader}><span className={`${styles.laneIcon} ${TONE_CLASS[lane.tone]}`}>{lane.count}</span><div><strong>{lane.label}</strong><small>{lane.description}</small></div></div>
              <div className={styles.laneBody}>
                {lane.records.length ? lane.records.slice(0, 3).map((record) => <JourneyMiniCard key={record.id} record={record} onOpen={() => onOpen(record)} />) : <div className={styles.laneEmpty}>Aucun dossier dans cette étape.</div>}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className={styles.priorityBoard}>
        <header className={styles.panelHeader}><div><span className={styles.sectionKicker}>Ce qui demande votre attention</span><h2>Agir avant que la famille ne décroche</h2></div><button type="button" onClick={() => onView('attention')}>Tout voir →</button></header>
        <div className={styles.priorityList}>
          {data.attention.length ? data.attention.slice(0, 6).map((item) => (
            <button key={item.id} type="button" className={styles.priorityItem} onClick={() => item.record && onOpen(item.record)}>
              <span className={`${styles.priorityIcon} ${TONE_CLASS[item.tone]}`}>!</span>
              <span><strong>{item.title}</strong><small>{item.consequence}</small></span>
              <em>{item.dueAt ? formatDate(item.dueAt, true) : 'Traiter'}</em>
            </button>
          )) : <div className={styles.healthyEmpty}><span>✓</span><strong>Admissions à jour</strong><p>Aucun blocage ou délai prioritaire n’est détecté.</p></div>}
        </div>
      </article>

      <article className={styles.nextVisits}>
        <header className={styles.panelHeader}><div><span className={styles.sectionKicker}>Visites & rendez-vous</span><h2>Prochaines rencontres</h2></div><button type="button" onClick={() => onView('visits')}>Agenda →</button></header>
        <VisitAgenda records={data.recordsByView.visits.slice(0, 5)} onOpen={onOpen} compact />
      </article>

      <article className={styles.conversionGate}>
        <header className={styles.panelHeader}><div><span className={styles.sectionKicker}>Enrollment Readiness Gate</span><h2>Inscriptions prêtes et bloquées</h2></div><button type="button" onClick={() => onView('enrollments')}>Ouvrir →</button></header>
        <EnrollmentBoard records={data.recordsByView.enrollments.concat(data.recordsByView.applications.filter((r) => ['approved', 'accepted', 'converted'].includes(r.stage))).slice(0, 6)} onOpen={onOpen} compact />
      </article>
    </section>
  )
}

function JourneyMiniCard({ record, onOpen }: { record: Angelcare360Area9Record; onOpen: () => void }) {
  return <button type="button" className={styles.journeyMiniCard} onClick={onOpen}><span className={`${styles.recordIcon} ${TONE_CLASS[record.tone]}`}>{iconFor(record.kind)}</span><span><strong>{record.title}</strong><small>{record.nextAction || record.stageLabel}</small></span>{record.dueAt ? <em>{formatDate(record.dueAt)}</em> : null}</button>
}

function RecordGrid({ records, onOpen, emptyTitle }: { records: Angelcare360Area9Record[]; onOpen: (record: Angelcare360Area9Record) => void; emptyTitle: string }) {
  if (!records.length) return <EmptyState title={`Aucun élément · ${emptyTitle}`} detail="Les dossiers apparaîtront ici dès qu’une action réelle alimentera cette étape." />
  return <div className={styles.recordGrid}>{records.map((record) => <RecordCard key={record.id} record={record} onOpen={() => onOpen(record)} />)}</div>
}

function RecordCard({ record, onOpen }: { record: Angelcare360Area9Record; onOpen: () => void }) {
  return (
    <button type="button" className={styles.recordCard} onClick={onOpen}>
      <div className={styles.recordCardHead}><span className={`${styles.recordIcon} ${TONE_CLASS[record.tone]}`}>{iconFor(record.kind)}</span><span className={`${styles.statusPill} ${TONE_CLASS[record.tone]}`}>{record.stageLabel}</span></div>
      <div className={styles.recordIdentity}><span>{record.reference}</span><h3>{record.title}</h3><p>{record.subtitle}</p></div>
      <div className={styles.recordFacts}>
        <Fact label="Prochaine action" value={record.nextAction || 'À définir'} />
        <Fact label="Échéance" value={formatDate(record.dueAt, true)} />
        <Fact label="Programme" value={record.programme || 'À préciser'} />
      </div>
      {typeof record.completion === 'number' ? <div className={styles.completion}><span><em>Préparation</em><strong>{record.completion}%</strong></span><i><b style={{ width: `${Math.max(0, Math.min(100, record.completion))}%` }} /></i></div> : null}
      <div className={styles.recordFooter}>{record.flags.length ? <span className={styles.flagCount}>{record.flags.length} point{record.flags.length > 1 ? 's' : ''} à vérifier</span> : <span className={styles.clearState}>Aucun blocage détecté</span>}<em>Ouvrir le dossier →</em></div>
    </button>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <span><em>{label}</em><strong>{value}</strong></span>
}

function AttentionBoard({ data, onOpen }: { data: Angelcare360Area9CommandData; onOpen: (record: Angelcare360Area9Record) => void }) {
  if (!data.attention.length) return <EmptyState title="Les admissions sont à jour" detail="Aucune réponse, décision, pièce ou réservation n’exige une intervention." success />
  return <div className={styles.attentionBoard}>{data.attention.map((item) => <article key={item.id} className={styles.attentionCard}><div className={styles.attentionTop}><span className={`${styles.attentionSeverity} ${TONE_CLASS[item.tone]}`}>!</span><div><span>{item.record?.reference || 'Contrôle admissions'}</span><h3>{item.title}</h3><p>{item.detail}</p></div></div><div className={styles.consequence}><span>Pourquoi cela compte</span><p>{item.consequence}</p></div><div className={styles.recommended}><span>Action recommandée</span><strong>{item.nextAction}</strong></div><button type="button" onClick={() => item.record && onOpen(item.record)}>Traiter dans le dossier <span>→</span></button></article>)}</div>
}

function DecisionBoard({ records, onOpen }: { records: Angelcare360Area9Record[]; onOpen: (record: Angelcare360Area9Record) => void }) {
  if (!records.length) return <EmptyState title="Aucune décision en attente" detail="Les candidatures prêtes à analyser apparaîtront dans cette chambre de décision." />
  return <div className={styles.decisionBoard}>{records.map((record) => <article key={record.id} className={styles.decisionCard}><div className={styles.decisionIdentity}><span className={`${styles.recordIcon} ${TONE_CLASS[record.tone]}`}>◆</span><div><span>{record.reference}</span><h3>{record.title}</h3><p>{record.subtitle}</p></div></div><div className={styles.decisionAxes}><Fact label="Dossier" value={typeof record.completion === 'number' ? `${record.completion}% prêt` : 'À examiner'} /><Fact label="Pièces" value={record.missingCount ? `${record.missingCount} manquante(s)` : 'À jour'} /><Fact label="Place" value={String(record.metadata?.classId || 'À simuler')} /><Fact label="Autorité" value="Direction / Admissions" /></div><div className={styles.decisionFooter}><span className={`${styles.statusPill} ${TONE_CLASS[record.tone]}`}>{record.stageLabel}</span><button type="button" onClick={() => onOpen(record)}>Ouvrir la décision →</button></div></article>)}</div>
}

function EnrollmentBoard({ records, onOpen, compact = false }: { records: Angelcare360Area9Record[]; onOpen: (record: Angelcare360Area9Record) => void; compact?: boolean }) {
  if (!records.length) return <EmptyState title="Aucune inscription prête" detail="Les candidatures admises apparaîtront ici après validation des conditions." />
  return <div className={compact ? styles.enrollmentListCompact : styles.enrollmentList}>{records.map((record) => {
    const gates = [!record.missingCount, ['approved', 'accepted', 'converted', 'validated', 'ready'].includes(record.stage), Boolean(record.metadata?.academicYearId || record.intake), true]
    return <button type="button" key={record.id} className={styles.enrollmentRow} onClick={() => onOpen(record)}><span className={`${styles.recordIcon} ${TONE_CLASS[record.tone]}`}>✓</span><span className={styles.enrollmentIdentity}><strong>{record.title}</strong><small>{record.reference} · {record.contactName || record.subtitle}</small></span><span className={styles.gateDots}>{gates.map((ready, index) => <i key={index} className={ready ? styles.gateReady : styles.gateMissing}>{ready ? '✓' : '!'}</i>)}</span><span className={`${styles.statusPill} ${TONE_CLASS[record.tone]}`}>{record.stageLabel}</span><em>Ouvrir →</em></button>})}</div>
}

function VisitAgenda({ records, onOpen, compact = false }: { records: Angelcare360Area9Record[]; onOpen: (record: Angelcare360Area9Record) => void; compact?: boolean }) {
  if (!records.length) return <EmptyState title="Aucune visite planifiée" detail="Les rencontres et entretiens à venir apparaîtront ici." />
  return <div className={compact ? styles.visitAgendaCompact : styles.visitAgenda}>{records.map((record) => <button type="button" key={record.id} className={styles.visitRow} onClick={() => onOpen(record)}><span className={styles.dateBlock}><strong>{record.dueAt ? new Date(record.dueAt).getDate().toString().padStart(2, '0') : '—'}</strong><em>{record.dueAt ? new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(record.dueAt)) : 'à planifier'}</em></span><span><strong>{record.title}</strong><small>{record.subtitle}</small></span><span className={`${styles.statusPill} ${TONE_CLASS[record.tone]}`}>{record.stageLabel}</span><em>{record.dueAt ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(record.dueAt)) : '—'}</em></button>)}</div>
}

function HistoryTimeline({ records, onOpen }: { records: Angelcare360Area9Record[]; onOpen: (record: Angelcare360Area9Record) => void }) {
  if (!records.length) return <EmptyState title="Aucun événement admissions" detail="La chronologie se construira à partir des actions réellement exécutées." />
  return <div className={styles.historyTimeline}>{records.map((record, index) => <button type="button" key={record.id} className={styles.historyEvent} onClick={() => onOpen(record)}><span className={styles.historyRail}><i className={`${TONE_CLASS[record.tone]}`}>{iconFor(record.kind)}</i>{index < records.length - 1 ? <b /> : null}</span><span><em>{formatDate(record.updatedAt, true)}</em><strong>{record.title}</strong><small>{record.subtitle}</small></span><span className={`${styles.statusPill} ${TONE_CLASS[record.tone]}`}>{record.stageLabel}</span></button>)}</div>
}

function EmptyState({ title, detail, success = false }: { title: string; detail: string; success?: boolean }) {
  return <div className={success ? styles.emptySuccess : styles.emptyState}><span>{success ? '✓' : '◇'}</span><h3>{title}</h3><p>{detail}</p></div>
}

function RecordDrawer({ record, canApprove, onClose, onPrimary, onCustom }: { record: Angelcare360Area9Record; canApprove: boolean; onClose: () => void; onPrimary: () => void; onCustom: (operation: string, title: string, description: string, fields: NonNullable<ActionState>['fields'], values: Record<string, string>, record?: Angelcare360Area9Record | null) => void }) {
  const [activeSection, setActiveSection] = useState<'todo' | 'family' | 'application' | 'documents' | 'decision' | 'history'>('todo')
  const followupOperation = record.kind === 'inquiry' ? 'admission_inquiry.schedule_followup' : 'admission_application.update'
  const canSchedule = record.kind === 'inquiry' || record.kind === 'application'
  const auditHref = `/angelcare-360-command-center/administration?plane=audit&view=history&entity=${encodeURIComponent(record.sourceId || record.id)}&source=admissions`

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event: { target: EventTarget; currentTarget: EventTarget }) => event.target === event.currentTarget && onClose()}>
      <aside className={styles.recordDrawer} role="dialog" aria-modal="true" aria-label={`Dossier ${record.title}`}>
        <header className={styles.drawerHeader}>
          <div className={styles.drawerIdentity}><span className={`${styles.drawerIcon} ${TONE_CLASS[record.tone]}`}>{iconFor(record.kind)}</span><div><span>{record.reference} · Enfant candidat — non encore inscrit</span><h2>{record.title}</h2><p>{record.subtitle}</p></div></div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">×</button>
        </header>
        <div className={styles.drawerCrown}>
          <span className={`${styles.statusPill} ${TONE_CLASS[record.tone]}`}>{record.stageLabel}</span>
          <div><em>Prochaine action</em><strong>{record.nextAction || 'À définir dans le dossier'}</strong></div>
          <div><em>Échéance</em><strong>{formatDate(record.dueAt, true)}</strong></div>
          <div><em>Préparation</em><strong>{typeof record.completion === 'number' ? `${record.completion}%` : 'À évaluer'}</strong></div>
        </div>
        <nav className={styles.drawerTabs} aria-label="Sections du dossier">
          {([
            ['todo', 'À faire'],
            ['family', 'Vue famille'],
            ['application', 'Candidature'],
            ['documents', 'Documents'],
            ['decision', 'Décision'],
            ['history', 'Historique'],
          ] as const).map(([key, label]) => <button key={key} type="button" className={activeSection === key ? styles.drawerTabActive : undefined} aria-current={activeSection === key ? 'page' : undefined} onClick={() => setActiveSection(key)}>{label}</button>)}
        </nav>
        <div className={styles.drawerBody}>
          {activeSection === 'todo' ? <>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Matter Command</span><h3>Prochaine décision opérationnelle</h3></header>
              <div className={styles.nextActionCard}><span className={`${styles.nextActionIcon} ${TONE_CLASS[record.tone]}`}>→</span><div><strong>{record.nextAction || 'Définir la prochaine action'}</strong><p>Traitez la matière ici, ou ouvrez l’autorité concernée avec le contexte déjà sélectionné.</p></div><button type="button" onClick={onPrimary}>Traiter maintenant</button></div>
            </section>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Contrôles & préparation</span><h3>Ce qui peut empêcher la progression</h3></header>
              {record.flags.length ? <div className={styles.flagList}>{record.flags.map((flag) => <div key={flag}><span>!</span><strong>{flag}</strong><button type="button" onClick={onPrimary}>Corriger</button></div>)}</div> : <div className={styles.clearPanel}><span>✓</span><strong>Aucun blocage critique détecté</strong><p>Le dossier peut poursuivre son parcours selon les autorisations actives.</p></div>}
            </section>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Actions entreprise</span><h3>Résoudre sans quitter le dossier</h3></header>
              <div className={styles.actionMatrix}>
                <button type="button" onClick={onPrimary}><span>◎</span><strong>Action recommandée</strong><small>Traiter la prochaine étape</small></button>
                <button type="button" onClick={() => onCustom('admission_note.add', 'Ajouter une note', 'Préservez une information de contexte sans altérer l’historique.', [{ key: 'notes', label: 'Note', type: 'textarea', required: true }], { notes: '' }, record)}><span>＋</span><strong>Ajouter une note</strong><small>Contexte et compte rendu</small></button>
                {canSchedule ? <button type="button" onClick={() => onCustom(followupOperation, 'Programmer une relance', 'Attribuez une prochaine action précise avec échéance.', [{ key: 'nextAction', label: 'Action', required: true }, { key: 'dueAt', label: 'Échéance', type: 'datetime-local', required: true }], { nextAction: 'Relancer la famille', dueAt: '' }, record)}><span>◷</span><strong>Programmer</strong><small>Relance et échéance</small></button> : null}
                {record.kind === 'inquiry' ? <button type="button" onClick={() => onCustom('admission_application.create', 'Ouvrir la candidature', 'Transformez la demande qualifiée en candidature sans dupliquer la famille.', [{ key: 'programme', label: 'Programme', required: true }, { key: 'intake', label: 'Rentrée', required: true }], { programme: record.programme || '', intake: record.intake || '' }, record)}><span>▤</span><strong>Ouvrir candidature</strong><small>Créer le dossier formel</small></button> : null}
                {record.kind === 'application' && canApprove ? <button type="button" onClick={() => onCustom('admission_decision.prepare', 'Préparer la décision', 'Consolidez les éléments nécessaires avant validation.', [{ key: 'reason', label: 'Analyse', type: 'textarea', required: true }], { reason: '' }, record)}><span>◆</span><strong>Préparer décision</strong><small>Analyse et autorité</small></button> : null}
                <button type="button" onClick={() => onCustom('admission_evidence.request', 'Demander une preuve', 'Demandez une pièce ou confirmation liée à la décision.', [{ key: 'title', label: 'Pièce attendue', required: true }, { key: 'dueAt', label: 'Échéance', type: 'date' }], { title: '', dueAt: '' }, record)}><span>▣</span><strong>Demander une pièce</strong><small>Preuve ciblée et vérifiable</small></button>
              </div>
            </section>
          </> : null}

          {activeSection === 'family' ? <>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Vue famille admission</span><h3>Personnes déclarées et projet familial</h3></header>
              <div className={styles.detailGrid}><Fact label="Enfant candidat" value={record.candidateName || record.title} /><Fact label="Contact déclaré" value={record.contactName || 'À confirmer'} /><Fact label="Programme demandé" value={record.programme || 'À préciser'} /><Fact label="Rentrée souhaitée" value={record.intake || 'À préciser'} /><Fact label="Source" value={record.source || 'Non renseignée'} /><Fact label="Canal préféré" value={record.preferredChannel || 'À confirmer'} /></div>
              <div className={styles.truthNotice}><strong>Protection de la vérité</strong><p>Le contact admission n’est pas encore un gardien légal vérifié, et l’enfant candidat n’est pas encore un élève inscrit. La vérification canonique interviendra dans Family 360.</p></div>
            </section>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Continuité de contact</span><h3>Maintenir une relation claire</h3></header>
              <div className={styles.nextActionCard}><span className={`${styles.nextActionIcon} ${styles.toneCyan}`}>☎</span><div><strong>{record.preferredChannel || 'Canal à confirmer'}</strong><p>Dernière mise à jour : {formatDate(record.updatedAt, true)}. Toute relance reste liée à ce parcours et à son consentement.</p></div>{canSchedule ? <button type="button" onClick={() => onCustom(followupOperation, 'Programmer une relance familiale', 'Planifiez le prochain engagement sans perdre le contexte.', [{ key: 'nextAction', label: 'Action', required: true }, { key: 'dueAt', label: 'Échéance', type: 'datetime-local', required: true }], { nextAction: 'Relancer la famille', dueAt: '' }, record)}>Programmer</button> : null}</div>
            </section>
          </> : null}

          {activeSection === 'application' ? <>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Application Readiness</span><h3>Préparation de la candidature</h3></header>
              <div className={styles.detailGrid}><Fact label="État" value={record.stageLabel} /><Fact label="Préparation" value={typeof record.completion === 'number' ? `${record.completion}%` : 'À mesurer'} /><Fact label="Programme" value={record.programme || 'À préciser'} /><Fact label="Rentrée" value={record.intake || 'À préciser'} /><Fact label="Responsable" value={record.owner || 'À attribuer'} /><Fact label="Prochaine action" value={record.nextAction || 'À définir'} /></div>
            </section>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Progression gouvernée</span><h3>Faire avancer le dossier</h3></header>
              {record.kind === 'inquiry' ? <div className={styles.nextActionCard}><span className={`${styles.nextActionIcon} ${styles.toneViolet}`}>▤</span><div><strong>La candidature formelle n’est pas encore ouverte</strong><p>Les données de la demande seront réutilisées sans créer une seconde famille.</p></div><button type="button" onClick={() => onCustom('admission_application.create', 'Ouvrir la candidature', 'Transformez la demande qualifiée en candidature sans dupliquer la famille.', [{ key: 'programme', label: 'Programme', required: true }, { key: 'intake', label: 'Rentrée', required: true }], { programme: record.programme || '', intake: record.intake || '' }, record)}>Ouvrir</button></div> : <div className={styles.nextActionCard}><span className={`${styles.nextActionIcon} ${TONE_CLASS[record.tone]}`}>→</span><div><strong>{record.nextAction || 'Vérifier la préparation'}</strong><p>La progression dépend des pièces, évaluations, places et validations réellement disponibles.</p></div><button type="button" onClick={onPrimary}>Continuer</button></div>}
            </section>
          </> : null}

          {activeSection === 'documents' ? <>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Document Completeness Rail</span><h3>Pièces nécessaires à la décision</h3></header>
              <div className={styles.detailGrid}><Fact label="Pièces manquantes" value={record.missingCount ? String(record.missingCount) : 'Aucune signalée'} /><Fact label="État du contrôle" value={record.missingCount ? 'Dossier incomplet' : 'À jour selon les données disponibles'} /><Fact label="Référence" value={record.reference} /><Fact label="Dernière mise à jour" value={formatDate(record.updatedAt, true)} /></div>
              {record.flags.length ? <div className={styles.flagList}>{record.flags.map((flag) => <div key={flag}><span>!</span><strong>{flag}</strong><button type="button" onClick={() => onCustom('admission_evidence.request', 'Demander la pièce manquante', 'Créez une demande ciblée, datée et traçable.', [{ key: 'title', label: 'Pièce attendue', required: true }, { key: 'dueAt', label: 'Échéance', type: 'date' }], { title: flag, dueAt: '' }, record)}>Demander</button></div>)}</div> : <div className={styles.clearPanel}><span>✓</span><strong>Aucun manque déclaré</strong><p>La vérification finale reste attachée à chaque pièce et à son état réel.</p></div>}
            </section>
          </> : null}

          {activeSection === 'decision' ? <>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Decision Chamber</span><h3>Autorité, place et conditions</h3></header>
              <div className={styles.detailGrid}><Fact label="État actuel" value={record.stageLabel} /><Fact label="Autorité" value={canApprove ? 'Autorité disponible' : 'Validation supérieure requise'} /><Fact label="Classe cible" value={String(record.metadata?.classId || 'À simuler dans Places')} /><Fact label="Motif enregistré" value={String(record.metadata?.decisionReason || 'À préparer')} /><Fact label="Pièces manquantes" value={record.missingCount ? String(record.missingCount) : 'Aucune signalée'} /><Fact label="Préparation" value={typeof record.completion === 'number' ? `${record.completion}%` : 'À évaluer'} /></div>
              <div className={styles.truthNotice}><strong>Décision humaine gouvernée</strong><p>SANILA consolide les faits et contrôles. La décision finale appartient uniquement à l’autorité autorisée et ne peut pas être déduite d’un score opaque.</p></div>
            </section>
            {record.kind === 'application' ? <section className={styles.drawerSection}><header><span className={styles.sectionKicker}>Action d’autorité</span><h3>Préparer sans contourner les contrôles</h3></header><div className={styles.nextActionCard}><span className={`${styles.nextActionIcon} ${styles.toneViolet}`}>◆</span><div><strong>{canApprove ? 'Préparer la décision d’admission' : 'Demander la validation de la Direction'}</strong><p>Le dossier, la place, les conditions et les preuves restent visibles avant toute décision.</p></div><button type="button" onClick={() => onCustom('admission_decision.prepare', 'Préparer la décision', 'Consolidez les éléments nécessaires avant validation.', [{ key: 'reason', label: 'Analyse', type: 'textarea', required: true }], { reason: '' }, record)}>Préparer</button></div></section> : null}
          </> : null}

          {activeSection === 'history' ? <>
            <section className={styles.drawerSection}>
              <header><span className={styles.sectionKicker}>Institutional Memory</span><h3>Chronologie reconstructible</h3></header>
              <div className={styles.detailGrid}><Fact label="Création / référence" value={record.reference} /><Fact label="Dernière activité" value={formatDate(record.updatedAt, true)} /><Fact label="État actuel" value={record.stageLabel} /><Fact label="Source" value={record.source || 'Interne / non renseignée'} /><Fact label="Responsable" value={record.owner || 'À confirmer'} /><Fact label="Identifiant source" value={record.sourceId || record.id} /></div>
              <div className={styles.nextActionCard}><span className={`${styles.nextActionIcon} ${styles.toneGraphite}`}>↺</span><div><strong>Audit, preuves & historique</strong><p>Ouvrez la chronologie institutionnelle complète avec ce dossier déjà ciblé.</p></div><a href={auditHref}>Ouvrir l’historique</a></div>
            </section>
          </> : null}
        </div>
        <footer className={styles.drawerFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button><button type="button" className={styles.primaryButton} onClick={onPrimary}>Action recommandée <span>→</span></button></footer>
      </aside>
    </div>
  )
}

function ActionChamber({ action, pending, onClose, onChange, onExecute }: { action: NonNullable<ActionState>; pending: boolean; onClose: () => void; onChange: (key: string, value: string) => void; onExecute: () => void }) {
  return (
    <div className={styles.commandOverlay} role="presentation" onMouseDown={(event: { target: EventTarget; currentTarget: EventTarget }) => event.target === event.currentTarget && !pending && onClose()}>
      <section className={styles.actionChamber} role="dialog" aria-modal="true" aria-label={action.title}>
        <header className={styles.actionHeader}><div><span className={styles.sectionKicker}>Command Chamber</span><h2>{action.title}</h2><p>{action.description}</p></div><button type="button" className={styles.closeButton} onClick={onClose} disabled={pending}>×</button></header>
        {action.record ? <div className={styles.actionContext}><span className={`${styles.recordIcon} ${TONE_CLASS[action.record.tone]}`}>{iconFor(action.record.kind)}</span><div><strong>{action.record.title}</strong><small>{action.record.reference} · {action.record.stageLabel}</small></div></div> : null}
        <div className={styles.actionForm}>
          {action.fields.map((field) => <label key={field.key} className={field.type === 'textarea' ? styles.fullField : styles.field}><span>{field.label}{field.required ? <em>Obligatoire</em> : null}</span>{field.type === 'textarea' ? <textarea value={action.values[field.key] || ''} onChange={(event: { target: { value: string } }) => onChange(field.key, event.target.value)} placeholder={field.placeholder} /> : field.type === 'select' ? <select value={action.values[field.key] || ''} onChange={(event: { target: { value: string } }) => onChange(field.key, event.target.value)}>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input type={field.type || 'text'} value={action.values[field.key] || ''} onChange={(event: { target: { value: string } }) => onChange(field.key, event.target.value)} placeholder={field.placeholder} />}</label>)}
        </div>
        <div className={styles.actionImpact}><span>Protection d’exécution</span><div><strong>Autorité vérifiée</strong><small>Rôle, périmètre, opération canonique et idempotence.</small></div><div><strong>Historique préservé</strong><small>Chaque changement produit un reçu et un événement Area 8.</small></div><div><strong>Réconciliation immédiate</strong><small>Les compteurs, dossiers et priorités seront actualisés.</small></div></div>
        <footer className={styles.actionFooter}><button type="button" className={styles.secondaryButton} onClick={onClose} disabled={pending}>Annuler</button><button type="button" className={styles.primaryButton} onClick={onExecute} disabled={pending}>{pending ? 'Exécution sécurisée…' : 'Confirmer et exécuter'} <span>{pending ? '◌' : '→'}</span></button></footer>
      </section>
    </div>
  )
}
