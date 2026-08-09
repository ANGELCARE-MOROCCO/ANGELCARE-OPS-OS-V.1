'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  categories: any[]
  courses: any[]
  versions: any[]
  kits: any[]
  resources: any[]
  modules: any[]
  sessions: any[]
  proposalItems: any[]
  orderItems: any[]
  certificates: any[]
  entitlements: any[]
  queryWarnings: string[]
}

type ModalMode = 'category-create' | 'category-edit' | 'course-create' | 'course-edit' | 'course-detail' | 'impact' | null
type DetailTab = 'preview' | 'edit' | 'impact' | 'sync'

const activeStatuses = new Set(['active', 'published', 'ready_to_sell'])
const archivedStatuses = new Set(['archived', 'inactive', 'disabled'])

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(amountMinor?: number | null, currency = 'MAD') {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n(amountMinor) / 100)} ${currency || 'MAD'}`
}

function statusText(value?: string | null) {
  const status = String(value || 'draft').replace(/_/g, ' ')
  if (status === 'active') return 'Active'
  if (status === 'published') return 'Publiée'
  if (status === 'draft') return 'Brouillon'
  if (status === 'archived') return 'Archivée'
  if (status === 'inactive') return 'Désactivée'
  if (status === 'disabled') return 'Vente arrêtée'
  return status
}

function statusTone(value?: string | null) {
  const status = String(value || '').toLowerCase()
  if (status === 'published' || status === 'active') return { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' }
  if (status === 'draft' || status === 'ready_to_sell') return { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }
  if (archivedStatuses.has(status)) return { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' }
  return { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }
}

function categoryName(course: any, categories: any[]) {
  return course?.trn_categories?.name || course?.category?.name || categories.find((category) => category.id === course.category_id)?.name || 'Sans catégorie'
}

function categoryCode(course: any, categories: any[]) {
  return course?.trn_categories?.code || course?.category?.code || categories.find((category) => category.id === course.category_id)?.code || 'CAT'
}

function courseReadiness(course: any, counts: { versions: number; kits: number; resources: number; modules: number }) {
  const hasPrice = n(course.onsite_entry_price_minor) > 0
  const hasDuration = n(course.min_hours) > 0 && n(course.max_hours) >= n(course.min_hours)
  const hasParticipants = n(course.starter_min_participants) >= 1 && n(course.starter_max_participants) >= n(course.starter_min_participants)
  const hasStory = Boolean(course.short_description || course.commercial_description)
  const hasVersion = counts.versions > 0
  const hasKit = counts.kits > 0 || counts.resources > 0
  const hasRefresh = Boolean(course.has_refresh_module) || counts.modules > 0
  const score = [hasPrice, hasDuration, hasParticipants, hasStory, hasVersion, hasKit, hasRefresh].filter(Boolean).length
  return Math.round((score / 7) * 100)
}


function readinessLabel(score: number) {
  if (score >= 85) return 'Excellent'
  if (score >= 75) return 'Prêt à vendre'
  if (score >= 50) return 'À renforcer'
  return 'Incomplet'
}

function asTags(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  return String(value || '')
}

function toEditForm(course: any) {
  return {
    ...course,
    positioning_tags: asTags(course.positioning_tags),
    onsite_entry_price_minor: n(course.onsite_entry_price_minor) / 100,
    refresh_entry_price_minor: n(course.refresh_entry_price_minor) / 100,
  }
}

function impactForCourse(courseId: string, data: Props) {
  const sessions = data.sessions.filter((row) => row.course_id === courseId).length
  const proposals = data.proposalItems.filter((row) => row.course_id === courseId).length
  const orders = data.orderItems.filter((row) => row.course_id === courseId).length
  const certificates = data.certificates.filter((row) => row.course_id === courseId).length
  const modules = data.modules.filter((row) => row.course_id === courseId).length
  const resources = data.resources.filter((row) => row.course_id === courseId).length
  const kits = data.kits.filter((row) => row.course_id === courseId).length
  const entitlements = data.entitlements.filter((row) => row.course_id === courseId).length
  const total = sessions + proposals + orders + certificates + modules + resources + kits + entitlements
  return { sessions, proposals, orders, certificates, modules, resources, kits, entitlements, total, safeToDelete: total === 0 }
}

function impactForCategory(categoryId: string, courses: any[]) {
  const linkedCourses = courses.filter((course) => course.category_id === categoryId).length
  return { courses: linkedCourses, total: linkedCourses, safeToDelete: linkedCourses === 0 }
}

export default function TrainingHubCatalogueStrategicWorkspace(props: Props) {
  const { categories, courses, versions, kits, resources, modules, queryWarnings } = props
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('preview')
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const courseRows = useMemo(() => {
    return courses.map((course) => {
      const courseVersions = versions.filter((row) => row.course_id === course.id)
      const courseKits = kits.filter((row) => row.course_id === course.id)
      const courseResources = resources.filter((row) => row.course_id === course.id)
      const courseModules = modules.filter((row) => row.course_id === course.id)
      const readiness = courseReadiness(course, {
        versions: courseVersions.length,
        kits: courseKits.length,
        resources: courseResources.length,
        modules: courseModules.length,
      })
      const impact = impactForCourse(course.id, props)
      return {
        ...course,
        categoryName: categoryName(course, categories),
        categoryCode: categoryCode(course, categories),
        readiness,
        impact,
        counts: {
          versions: courseVersions.length,
          kits: courseKits.length,
          resources: courseResources.length,
          modules: courseModules.length,
        },
      }
    })
  }, [courses, categories, versions, kits, resources, modules, props])

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courseRows.filter((course) => {
      const matchSearch = !q || `${course.ref} ${course.title} ${course.short_description || ''} ${course.categoryName}`.toLowerCase().includes(q)
      const matchCategory = categoryFilter === 'all' || course.category_id === categoryFilter
      const statusKey = `${course.status || ''}:${course.publication_status || ''}`.toLowerCase()
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && course.publication_status === 'published') ||
        (statusFilter === 'draft' && (course.publication_status === 'draft' || course.status === 'draft')) ||
        (statusFilter === 'disabled' && (course.status === 'inactive' || course.publication_status === 'disabled')) ||
        (statusFilter === 'archived' && statusKey.includes('archived'))
      const matchLevel =
        levelFilter === 'all' ||
        (levelFilter === 'ready' && course.readiness >= 75) ||
        (levelFilter === 'attention' && course.readiness < 75) ||
        (levelFilter === 'refresh' && (course.has_refresh_module || course.counts.modules > 0)) ||
        (levelFilter === 'kit' && (course.counts.kits > 0 || course.counts.resources > 0))
      return matchSearch && matchCategory && matchStatus && matchLevel
    })
  }, [courseRows, search, categoryFilter, statusFilter, levelFilter])

  const published = courseRows.filter((course) => course.publication_status === 'published').length
  const ready = courseRows.filter((course) => course.readiness >= 75).length
  const refresh = courseRows.filter((course) => course.has_refresh_module || course.counts.modules > 0).length
  const protectedCourses = courseRows.filter((course) => !course.impact.safeToDelete).length
  const avgReadiness = courseRows.length ? Math.round(courseRows.reduce((sum, course) => sum + course.readiness, 0) / courseRows.length) : 0

  function updateField(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCategoryCreate() {
    setSelected(null)
    setForm({ code: '', name: '', subtitle: '', description: '', owner_promise: '', market_risk: '', display_order: categories.length + 1, status: 'active' })
    setModalMode('category-create')
  }

  function openCategoryEdit(category: any) {
    setSelected(category)
    setForm({ ...category })
    setModalMode('category-edit')
  }

  function openCourseCreate() {
    setSelected(null)
    setForm({
      category_id: categories[0]?.id || '',
      ref: '',
      title: '',
      short_description: '',
      commercial_description: '',
      owner_alert: '',
      positioning_tags: '',
      onsite_entry_price_minor: 0,
      refresh_entry_price_minor: 0,
      currency_code: 'MAD',
      starter_min_participants: 3,
      starter_max_participants: 8,
      min_hours: 6,
      max_hours: 15,
      has_refresh_module: true,
      publication_status: 'draft',
      status: 'draft',
    })
    setModalMode('course-create')
  }

  function openCourseDetail(course: any, tab: DetailTab = 'preview') {
    setSelected(course)
    setForm(toEditForm(course))
    setDetailTab(tab)
    setModalMode('course-detail')
  }

  function openCourseEdit(course: any) {
    setSelected(course)
    setForm(toEditForm(course))
    setModalMode('course-edit')
  }

  function openImpact(entity: 'category' | 'course', item: any) {
    setSelected({ entity, item })
    setModalMode('impact')
  }

  async function control(entity: 'category' | 'course', action: string, id?: string, payload?: Record<string, any>) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/catalogue/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, action, id, payload: payload || {} }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.blocked || result?.ok === false) {
        const impact = result?.impact
        if (impact) {
          setMessage(`Action bloquée : ${impact.recommendation || 'archivage recommandé'}.`)
          setSelected({ entity, item: selected || { id }, serverImpact: impact })
          setModalMode('impact')
        } else {
          setMessage(result?.error?.message || result?.message || 'Action non finalisée.')
        }
        return
      }
      setMessage('Action enregistrée avec succès.')
      setModalMode(null)
      setSelected(null)
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  async function submitModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (modalMode === 'category-create') return control('category', 'create', undefined, form)
    if (modalMode === 'category-edit') return control('category', 'update', selected?.id, form)
    if (modalMode === 'course-create') return control('course', 'create', undefined, form)
    if (modalMode === 'course-edit') return control('course', 'update', selected?.id, form)
    if (modalMode === 'course-detail') return control('course', 'update', selected?.id, form)
  }

  return (
    <div style={pageStackStyle}>
      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <div style={heroEyebrowStyle}>CENTRE DES PROGRAMMES & OFFRES</div>
          <h2 style={heroTitleStyle}>Un catalogue vivant, gouverné et prêt à vendre.</h2>
          <p style={heroTextStyle}>
            Ajoutez, modifiez, publiez, désactivez, archivez ou supprimez uniquement quand c’est sûr. Les formations utilisées en vente, delivery, certificats ou e-learning restent protégées par l’historique.
          </p>
          <div style={heroActionsStyle}>
            <button type="button" onClick={openCourseCreate} style={primaryActionStyle}>+ Nouvelle formation</button>
            <button type="button" onClick={openCategoryCreate} style={secondaryActionStyle}>+ Nouvelle catégorie</button>
            <button type="button" onClick={() => setLevelFilter('ready')} style={ghostActionStyle}>Voir prêts à vendre</button>
          </div>
        </div>

        <aside style={scorePanelStyle}>
          <div style={scoreTopStyle}>
            <span>Qualité portefeuille</span>
            <strong>{avgReadiness}/100</strong>
          </div>
          <div style={scoreTrackStyle}><div style={{ ...scoreFillStyle, width: `${avgReadiness}%` }} /></div>
          <div style={scoreGridStyle}>
            <Mini label="Formations" value={courseRows.length} />
            <Mini label="Publiées" value={published} />
            <Mini label="Prêtes" value={ready} />
            <Mini label="Protégées" value={protectedCourses} />
          </div>
        </aside>
      </section>

      <section style={metricGridStyle}>
        <Metric label="Catégories" value={categories.length} detail="familles d’offres" accent="#2563eb" />
        <Metric label="Formations publiées" value={published} detail="visibles commercialement" accent="#059669" />
        <Metric label="Avec refresh" value={refresh} detail="continuité e-learning" accent="#0f766e" />
        <Metric label="Avec kit / support" value={courseRows.filter((c) => c.counts.kits || c.counts.resources).length} detail="workbooks & fiches" accent="#7c3aed" />
        <Metric label="Historique protégé" value={protectedCourses} detail="vente ou delivery lié" accent="#db2777" />
        <Metric label="À renforcer" value={courseRows.filter((c) => c.readiness < 75).length} detail="avant accélération" accent="#ea580c" />
      </section>

      <section style={filterPanelStyle}>
        <div style={filterHeaderStyle}>
          <div>
            <div style={sectionEyebrowStyle}>CATALOGUE INTELLIGENT</div>
            <h2 style={sectionTitleStyle}>Formations et catégories</h2>
            <p style={sectionTextStyle}>Filtrez par catégorie, statut, readiness, refresh ou kit, puis appliquez les actions contrôlées.</p>
          </div>
          <div style={resultBadgeStyle}>{filteredCourses.length} résultat(s)</div>
        </div>

        <div style={filterBarStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une formation, une référence, une catégorie…" style={searchStyle} />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={selectStyle}>
            <option value="all">Toutes les catégories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.code} • {category.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
            <option value="disabled">Désactivées</option>
            <option value="archived">Archivées</option>
          </select>
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} style={selectStyle}>
            <option value="all">Tous les niveaux</option>
            <option value="ready">Prêtes à vendre</option>
            <option value="attention">À renforcer</option>
            <option value="refresh">Avec refresh</option>
            <option value="kit">Avec kit/support</option>
          </select>
        </div>

        <div style={contentGridStyle}>
          <aside style={categoryPanelStyle}>
            <div style={categoryPanelTopStyle}>
              <div>
                <div style={sectionEyebrowStyle}>CATÉGORIES</div>
                <h3 style={sideTitleStyle}>Structure portefeuille</h3>
              </div>
              <button type="button" onClick={openCategoryCreate} style={miniButtonStyle}>Ajouter</button>
            </div>
            <div style={categoryListStyle}>
              {categories.map((category) => {
                const count = courses.filter((course) => course.category_id === category.id).length
                const tone = statusTone(category.status)
                return (
                  <article key={category.id} style={categoryCardStyle}>
                    <div>
                      <span style={categoryCodeStyle}>{category.code}</span>
                      <strong>{category.name}</strong>
                      <small>{count} formation(s)</small>
                    </div>
                    <span style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusText(category.status)}</span>
                    <div style={categoryActionsStyle}>
                      <button type="button" onClick={() => openCategoryEdit(category)} style={textButtonStyle}>Modifier</button>
                      <button type="button" onClick={() => openImpact('category', category)} style={textButtonStyle}>Impact</button>
                      <button type="button" onClick={() => control('category', 'archive', category.id)} style={textButtonStyle}>Archiver</button>
                    </div>
                  </article>
                )
              })}
            </div>
          </aside>

          <section style={coursePanelStyle}>
            <div style={courseGridStyle}>
              {filteredCourses.length ? filteredCourses.map((course) => <CourseCard key={course.id} course={course} openCourseDetail={openCourseDetail} control={control} />) : <Empty text="Aucune formation ne correspond aux filtres." />}
            </div>
          </section>
        </div>
      </section>

      <section style={strategyGridStyle}>
        <Panel title="Packs à construire" text="Préparez des offres commerciales groupées à partir du catalogue.">
          <StrategyItem title="Pack Direction" text="Pilotage, qualité, communication, conformité et posture managériale." />
          <StrategyItem title="Pack Équipe éducative" text="Bases terrain, sécurité, observation, animation et progression enfant." />
          <StrategyItem title="Pack Refresh annuel" text="Recyclage e-learning, certificats, supports et relance périodique." />
        </Panel>

        <Panel title="Règles de gouvernance" text="Ce catalogue reste la source officielle de toutes les offres formation.">
          <StrategyItem title="Historique protégé" text="Une formation utilisée en vente ou delivery ne doit pas être supprimée." />
          <StrategyItem title="Versionner plutôt que casser" text="Les changements majeurs passent par une nouvelle version." />
          <StrategyItem title="Désactiver sans perdre" text="Une offre désactivée reste visible dans l’historique." />
        </Panel>
      </section>

      {message ? <div style={messageStyle}>{message}</div> : null}
      {queryWarnings.length ? <div style={warningStyle}>Certaines données ne sont pas encore alimentées. Le catalogue reste opérationnel avec les informations disponibles.</div> : null}

      {modalMode ? (
        <div style={modalBackdropStyle}>
          <div style={modalStyle}>
            <div style={modalTopStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  {modalMode === 'impact' ? 'IMPACT AVANT ACTION' : modalMode?.includes('category') ? 'CATÉGORIE' : 'FORMATION'}
                </div>
                <h2 style={modalTitleStyle}>
                  {modalMode === 'category-create' && 'Nouvelle catégorie'}
                  {modalMode === 'category-edit' && 'Modifier la catégorie'}
                  {modalMode === 'course-create' && 'Nouvelle formation'}
                  {modalMode === 'course-edit' && 'Modifier la formation'}
                  {modalMode === 'impact' && 'Aperçu impact & sécurité'}
                </h2>
              </div>
              <button type="button" onClick={() => setModalMode(null)} style={closeButtonStyle}>×</button>
            </div>

            {modalMode === 'impact' ? (
              <ImpactView
                selected={selected}
                courses={courses}
                propsData={props}
                busy={busy}
                control={control}
              />
            ) : modalMode === 'course-detail' ? (
              <CourseDetailModal
                course={selected}
                form={form}
                updateField={updateField}
                submitModal={submitModal}
                categories={categories}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                busy={busy}
                control={control}
                openImpact={openImpact}
                propsData={props}
              />
            ) : (
              <form onSubmit={submitModal} style={formStyle}>
                {modalMode?.includes('category') ? (
                  <>
                    <Field label="Code" value={form.code || ''} onChange={(value) => updateField('code', value)} />
                    <Field label="Nom" value={form.name || ''} onChange={(value) => updateField('name', value)} />
                    <Field label="Sous-titre" value={form.subtitle || ''} onChange={(value) => updateField('subtitle', value)} />
                    <TextArea label="Promesse direction" value={form.owner_promise || ''} onChange={(value) => updateField('owner_promise', value)} />
                    <TextArea label="Risque marché couvert" value={form.market_risk || ''} onChange={(value) => updateField('market_risk', value)} />
                    <div style={formGridStyle}>
                      <Field label="Ordre" type="number" value={form.display_order || ''} onChange={(value) => updateField('display_order', value)} />
                      <SelectField label="Statut" value={form.status || 'active'} onChange={(value) => updateField('status', value)} options={[['active', 'Active'], ['draft', 'Brouillon'], ['inactive', 'Désactivée'], ['archived', 'Archivée']]} />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={formGridStyle}>
                      <SelectField label="Catégorie" value={form.category_id || ''} onChange={(value) => updateField('category_id', value)} options={categories.map((category) => [category.id, `${category.code} • ${category.name}`])} />
                      <Field label="Référence" value={form.ref || ''} onChange={(value) => updateField('ref', value)} />
                    </div>
                    <Field label="Titre" value={form.title || ''} onChange={(value) => updateField('title', value)} />
                    <TextArea label="Description courte" value={form.short_description || ''} onChange={(value) => updateField('short_description', value)} />
                    <TextArea label="Argument commercial" value={form.commercial_description || ''} onChange={(value) => updateField('commercial_description', value)} />
                    <div style={formGridStyle}>
                      <Field label="Prix starter onsite MAD" type="number" value={form.onsite_entry_price_minor ?? ''} onChange={(value) => updateField('onsite_entry_price_minor', value)} />
                      <Field label="Prix refresh MAD" type="number" value={form.refresh_entry_price_minor ?? ''} onChange={(value) => updateField('refresh_entry_price_minor', value)} />
                    </div>
                    <div style={formGridStyle}>
                      <Field label="Participants min" type="number" value={form.starter_min_participants || 3} onChange={(value) => updateField('starter_min_participants', value)} />
                      <Field label="Participants max" type="number" value={form.starter_max_participants || 8} onChange={(value) => updateField('starter_max_participants', value)} />
                      <Field label="Heures min" type="number" value={form.min_hours || 6} onChange={(value) => updateField('min_hours', value)} />
                      <Field label="Heures max" type="number" value={form.max_hours || 15} onChange={(value) => updateField('max_hours', value)} />
                    </div>
                    <Field label="Tags de positionnement" value={form.positioning_tags || ''} onChange={(value) => updateField('positioning_tags', value)} />
                    <div style={formGridStyle}>
                      <SelectField label="Statut commercial" value={form.publication_status || 'draft'} onChange={(value) => updateField('publication_status', value)} options={[['draft', 'Brouillon'], ['published', 'Publiée'], ['disabled', 'Vente arrêtée'], ['archived', 'Archivée']]} />
                      <SelectField label="État interne" value={form.status || 'draft'} onChange={(value) => updateField('status', value)} options={[['draft', 'Brouillon'], ['active', 'Active'], ['inactive', 'Désactivée'], ['archived', 'Archivée']]} />
                    </div>
                    <label style={checkboxStyle}>
                      <input type="checkbox" checked={Boolean(form.has_refresh_module)} onChange={(event) => updateField('has_refresh_module', event.target.checked)} />
                      Inclure un refresh e-learning durable
                    </label>
                  </>
                )}
                <div style={modalActionsStyle}>
                  <button type="button" onClick={() => setModalMode(null)} style={cancelButtonStyle}>Annuler</button>
                  <button type="submit" disabled={busy} style={saveButtonStyle}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}


function CourseCard({
  course,
  openCourseDetail,
  control,
}: {
  course: any
  openCourseDetail: (course: any, tab?: DetailTab) => void
  control: (entity: 'category' | 'course', action: string, id?: string, payload?: Record<string, any>) => Promise<void>
}) {
  const publicationTone = statusTone(course.publication_status || course.status)
  return (
    <article
      style={courseCardPremiumStyle}
      role="button"
      tabIndex={0}
      onClick={() => openCourseDetail(course)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') openCourseDetail(course)
      }}
    >
      <div style={courseCardGlowStyle} />
      <div style={courseTopStyle}>
        <div>
          <div style={refStyle}>{course.ref} • {course.categoryCode}</div>
          <h3 style={courseTitleStyle}>{course.title}</h3>
          <p style={courseTextStyle}>{course.short_description || 'Description commerciale à compléter.'}</p>
        </div>
        <span style={{ ...badgeStyle, background: publicationTone.bg, color: publicationTone.fg, borderColor: publicationTone.border }}>
          {statusText(course.publication_status || course.status)}
        </span>
      </div>

      <div style={courseMetaGridStyle}>
        <div><span>Prix</span><strong>{money(course.onsite_entry_price_minor, course.currency_code)}</strong></div>
        <div><span>Groupe</span><strong>{course.starter_min_participants || 3}–{course.starter_max_participants || 8}</strong></div>
        <div><span>Durée</span><strong>{course.min_hours || 6}–{course.max_hours || 15}h</strong></div>
        <div><span>Refresh</span><strong>{course.has_refresh_module || course.counts.modules ? 'Oui' : 'Non'}</strong></div>
      </div>

      <div style={readinessStyle}>
        <div style={readinessTopStyle}>
          <span>{readinessLabel(course.readiness)}</span>
          <strong>{course.readiness}%</strong>
        </div>
        <div style={readinessTrackStyle}><div style={{ ...readinessFillStyle, width: `${course.readiness}%` }} /></div>
      </div>

      <div style={syncGridStyle}>
        <span>{course.counts.versions} version(s)</span>
        <span>{course.counts.resources + course.counts.kits} support(s)</span>
        <span>{course.impact.sessions} session(s)</span>
        <span>{course.impact.certificates} certificat(s)</span>
      </div>

      <div style={cardFooterStyle}>
        <button type="button" onClick={(event) => { event.stopPropagation(); openCourseDetail(course, 'preview') }} style={cardMainButtonStyle}>Ouvrir la fiche</button>
        <button type="button" onClick={(event) => { event.stopPropagation(); openCourseDetail(course, 'edit') }} style={cardSoftButtonStyle}>Modifier</button>
        <button type="button" onClick={(event) => { event.stopPropagation(); control('course', 'disable', course.id) }} style={cardDangerButtonStyle}>Désactiver</button>
      </div>
    </article>
  )
}

function CourseDetailModal({
  course,
  form,
  updateField,
  submitModal,
  categories,
  detailTab,
  setDetailTab,
  busy,
  control,
  openImpact,
  propsData,
}: {
  course: any
  form: Record<string, any>
  updateField: (key: string, value: any) => void
  submitModal: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  categories: any[]
  detailTab: DetailTab
  setDetailTab: (tab: DetailTab) => void
  busy: boolean
  control: (entity: 'category' | 'course', action: string, id?: string, payload?: Record<string, any>) => Promise<void>
  openImpact: (entity: 'category' | 'course', item: any) => void
  propsData: Props
}) {
  const impact = course ? impactForCourse(course.id, propsData) : null
  if (!course) return <Empty text="Aucune formation sélectionnée." />

  return (
    <div style={detailModalBodyStyle}>
      <section style={detailHeroStyle}>
        <div>
          <div style={detailRefStyle}>{course.ref} • {course.categoryName}</div>
          <h3 style={detailHeroTitleStyle}>{course.title}</h3>
          <p style={detailHeroTextStyle}>{course.commercial_description || course.short_description || 'Argumentaire commercial à compléter.'}</p>
        </div>
        <div style={detailScoreStyle}>
          <span>Prêt à vendre</span>
          <strong>{course.readiness}%</strong>
          <small>{readinessLabel(course.readiness)}</small>
        </div>
      </section>

      <div style={detailTabsStyle}>
        {(['preview', 'edit', 'impact', 'sync'] as DetailTab[]).map((tab) => (
          <button key={tab} type="button" onClick={() => setDetailTab(tab)} style={detailTab === tab ? detailTabActiveStyle : detailTabStyle}>
            {tab === 'preview' && 'Aperçu'}
            {tab === 'edit' && 'Modifier'}
            {tab === 'impact' && 'Impact'}
            {tab === 'sync' && 'Liens système'}
          </button>
        ))}
      </div>

      {detailTab === 'preview' ? (
        <section style={detailGridStyle}>
          <div style={detailPanelStyle}>
            <h4>Positionnement commercial</h4>
            <p>{course.short_description || 'Description courte à compléter.'}</p>
            <div style={tagRowStyle}>
              {(Array.isArray(course.positioning_tags) ? course.positioning_tags : []).slice(0, 8).map((tag: string) => <span key={tag}>{tag}</span>)}
              {!Array.isArray(course.positioning_tags) || !course.positioning_tags.length ? <span>Tags à compléter</span> : null}
            </div>
          </div>

          <div style={detailPanelStyle}>
            <h4>Format de vente</h4>
            <div style={detailStatsGridStyle}>
              <div><span>Prix onsite</span><strong>{money(course.onsite_entry_price_minor, course.currency_code)}</strong></div>
              <div><span>Prix refresh</span><strong>{money(course.refresh_entry_price_minor, course.currency_code)}</strong></div>
              <div><span>Participants</span><strong>{course.starter_min_participants || 3}–{course.starter_max_participants || 8}</strong></div>
              <div><span>Durée</span><strong>{course.min_hours || 6}–{course.max_hours || 15}h</strong></div>
            </div>
          </div>

          <div style={detailPanelWideStyle}>
            <h4>Décision recommandée</h4>
            <p>
              {course.readiness >= 75
                ? 'Cette formation peut être poussée commercialement. Vérifiez simplement les packs, les supports et la cohérence du refresh.'
                : 'Cette formation doit être renforcée avant accélération : description, prix, version, kit, ressources ou refresh.'}
            </p>
          </div>
        </section>
      ) : null}

      {detailTab === 'edit' ? (
        <form onSubmit={submitModal} style={formStyle}>
          <CourseEditFields form={form} updateField={updateField} categories={categories} />
          <div style={detailActionBarStyle}>
            <button type="submit" disabled={busy} style={saveButtonStyle}>{busy ? 'Enregistrement…' : 'Enregistrer les changements'}</button>
            <button type="button" disabled={busy} onClick={() => control('course', 'publish', course.id)} style={actionButtonStyle}>Publier</button>
            <button type="button" disabled={busy} onClick={() => control('course', 'version', course.id)} style={actionButtonStyle}>Créer nouvelle version</button>
            <button type="button" disabled={busy} onClick={() => control('course', 'disable', course.id)} style={dangerSoftButtonStyle}>Désactiver temporairement</button>
            <button type="button" disabled={busy} onClick={() => control('course', 'archive', course.id)} style={dangerSoftButtonStyle}>Archiver</button>
            <button type="button" disabled={busy} onClick={() => openImpact('course', course)} style={dangerButtonStyle}>Supprimer définitivement</button>
          </div>
        </form>
      ) : null}

      {detailTab === 'impact' ? <ImpactSummary impact={impact} /> : null}

      {detailTab === 'sync' ? (
        <section style={detailGridStyle}>
          <SyncCell label="Versions" value={course.counts.versions} text="Versions pédagogiques et commerciales" />
          <SyncCell label="Supports" value={course.counts.resources + course.counts.kits} text="Kits, workbooks, fiches et ressources" />
          <SyncCell label="Modules refresh" value={course.counts.modules} text="Continuité e-learning" />
          <SyncCell label="Sessions" value={impact?.sessions || 0} text="Historique delivery terrain" />
          <SyncCell label="Propositions" value={impact?.proposals || 0} text="Historique commercial" />
          <SyncCell label="Certificats" value={impact?.certificates || 0} text="Preuves déjà émises" />
        </section>
      ) : null}
    </div>
  )
}

function CourseEditFields({ form, updateField, categories }: { form: Record<string, any>; updateField: (key: string, value: any) => void; categories: any[] }) {
  return (
    <>
      <div style={formGridStyle}>
        <SelectField label="Catégorie" value={form.category_id || ''} onChange={(value) => updateField('category_id', value)} options={categories.map((category) => [category.id, `${category.code} • ${category.name}`])} />
        <Field label="Référence" value={form.ref || ''} onChange={(value) => updateField('ref', value)} />
      </div>
      <Field label="Titre" value={form.title || ''} onChange={(value) => updateField('title', value)} />
      <TextArea label="Description courte" value={form.short_description || ''} onChange={(value) => updateField('short_description', value)} />
      <TextArea label="Argument commercial" value={form.commercial_description || ''} onChange={(value) => updateField('commercial_description', value)} />
      <div style={formGridStyle}>
        <Field label="Prix starter onsite MAD" type="number" value={form.onsite_entry_price_minor ?? ''} onChange={(value) => updateField('onsite_entry_price_minor', value)} />
        <Field label="Prix refresh MAD" type="number" value={form.refresh_entry_price_minor ?? ''} onChange={(value) => updateField('refresh_entry_price_minor', value)} />
      </div>
      <div style={formGridStyle}>
        <Field label="Participants min" type="number" value={form.starter_min_participants || 3} onChange={(value) => updateField('starter_min_participants', value)} />
        <Field label="Participants max" type="number" value={form.starter_max_participants || 8} onChange={(value) => updateField('starter_max_participants', value)} />
        <Field label="Heures min" type="number" value={form.min_hours || 6} onChange={(value) => updateField('min_hours', value)} />
        <Field label="Heures max" type="number" value={form.max_hours || 15} onChange={(value) => updateField('max_hours', value)} />
      </div>
      <Field label="Tags de positionnement" value={form.positioning_tags || ''} onChange={(value) => updateField('positioning_tags', value)} />
      <div style={formGridStyle}>
        <SelectField label="Statut commercial" value={form.publication_status || 'draft'} onChange={(value) => updateField('publication_status', value)} options={[["draft", "Brouillon"], ["published", "Publiée"], ["disabled", "Vente arrêtée"], ["archived", "Archivée"]]} />
        <SelectField label="État interne" value={form.status || 'draft'} onChange={(value) => updateField('status', value)} options={[["draft", "Brouillon"], ["active", "Active"], ["inactive", "Désactivée"], ["archived", "Archivée"]]} />
      </div>
      <label style={checkboxStyle}>
        <input type="checkbox" checked={Boolean(form.has_refresh_module)} onChange={(event) => updateField('has_refresh_module', event.target.checked)} />
        Inclure un refresh e-learning durable
      </label>
    </>
  )
}

function ImpactSummary({ impact }: { impact: ReturnType<typeof impactForCourse> | null }) {
  if (!impact) return <Empty text="Impact non disponible." />
  return (
    <div style={impactStyle}>
      <div style={impactDecisionStyle}>
        <strong>{impact.safeToDelete ? 'Suppression définitive possible' : 'Suppression définitive bloquée'}</strong>
        <span>{impact.safeToDelete ? 'Aucun historique sensible détecté.' : 'Cette formation est déjà liée au système. Archivez ou désactivez pour protéger l’historique.'}</span>
      </div>
      <div style={impactGridStyle}>
        {Object.entries(impact).filter(([key]) => !['total', 'safeToDelete'].includes(key)).map(([key, value]) => (
          <div key={key} style={impactCellStyle}><span>{key}</span><strong>{String(value)}</strong></div>
        ))}
      </div>
    </div>
  )
}

function SyncCell({ label, value, text }: { label: string; value: number; text: string }) {
  return <div style={syncCellStyle}><strong>{value}</strong><span>{label}</span><small>{text}</small></div>
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div style={miniStyle}><strong>{value}</strong><span>{label}</span></div>
}

function Metric({ label, value, detail, accent }: { label: string; value: number; detail: string; accent: string }) {
  return <article style={metricCardStyle}><div style={{ ...metricAccentStyle, background: accent }} /><strong>{value}</strong><span>{label}</span><small>{detail}</small></article>
}

function Panel({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return <section style={panelStyle}><h2>{title}</h2><p>{text}</p>{children}</section>
}

function StrategyItem({ title, text }: { title: string; text: string }) {
  return <div style={strategyItemStyle}><strong>{title}</strong><span>{text}</span></div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label style={fieldStyle}><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} /></label>
}

function TextArea({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label style={fieldStyle}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} style={textAreaStyle} /></label>
}

function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label style={fieldStyle}><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
}

function ImpactView({ selected, courses, propsData, busy, control }: { selected: any; courses: any[]; propsData: Props; busy: boolean; control: (entity: 'category' | 'course', action: string, id?: string, payload?: Record<string, any>) => Promise<void> }) {
  if (!selected?.item) return <Empty text="Aucun élément sélectionné." />
  const entity = selected.entity as 'category' | 'course'
  const item = selected.item
  const impact = selected.serverImpact || (entity === 'course' ? impactForCourse(item.id, propsData) : impactForCategory(item.id, courses))
  const entries = Object.entries(impact.dependencies || impact).filter(([key]) => !['total', 'safeToDelete'].includes(key))
  return (
    <div style={impactStyle}>
      <div style={impactDecisionStyle}>
        <strong>{impact.safeToDelete ? 'Suppression définitive possible' : 'Suppression définitive bloquée'}</strong>
        <span>{impact.safeToDelete ? 'Aucun historique sensible détecté.' : 'Cet élément est déjà lié au système. Archivez-le pour protéger l’historique.'}</span>
      </div>
      <div style={impactGridStyle}>
        {entries.map(([key, value]) => <div key={key} style={impactCellStyle}><span>{key}</span><strong>{String(value)}</strong></div>)}
      </div>
      <div style={modalActionsStyle}>
        <button type="button" disabled={busy} onClick={() => control(entity, 'delete', item.id)} style={dangerButtonStyle}>Supprimer définitivement</button>
        <button type="button" disabled={busy} onClick={() => control(entity, 'archive', item.id)} style={saveButtonStyle}>Archiver plutôt</button>
      </div>
    </div>
  )
}

const pageStackStyle: CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(360px,.75fr)', gap: 18 }
const heroCopyStyle: CSSProperties = { borderRadius: 34, padding: 28, background: 'radial-gradient(circle at top right, rgba(37,99,235,.13), transparent 36%), linear-gradient(135deg,#ffffff,#f8fbff)', border: '1px solid #dbeafe', boxShadow: '0 24px 64px rgba(15,23,42,.08)' }
const heroEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }
const heroTitleStyle: CSSProperties = { margin: 0, maxWidth: 860, fontSize: 46, lineHeight: 1, letterSpacing: '-.06em', fontWeight: 980, color: '#0f172a' }
const heroTextStyle: CSSProperties = { margin: '15px 0 0', maxWidth: 780, color: '#475569', lineHeight: 1.7, fontSize: 15, fontWeight: 750 }
const heroActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }
const primaryActionStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '13px 16px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const secondaryActionStyle: CSSProperties = { ...primaryActionStyle, background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4' }
const ghostActionStyle: CSSProperties = { ...primaryActionStyle, background: '#fff', color: '#475569', border: '1px solid #e2e8f0' }
const scorePanelStyle: CSSProperties = { borderRadius: 34, padding: 24, color: '#fff', background: 'radial-gradient(circle at top right, rgba(96,165,250,.32), transparent 34%), linear-gradient(160deg,#0b2348,#123c72 52%,#2557d6)', boxShadow: '0 24px 64px rgba(15,42,82,.22)' }
const scoreTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16, fontWeight: 950 }
const scoreTrackStyle: CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden', marginBottom: 16 }
const scoreFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const scoreGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const miniStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 13, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)' }
const metricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const metricCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 42px rgba(15,23,42,.06)', display: 'grid', gap: 5 }
const metricAccentStyle: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const filterPanelStyle: CSSProperties = { borderRadius: 32, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const filterHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const sectionEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const sectionTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 780 }
const resultBadgeStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '10px 12px', fontWeight: 950, whiteSpace: 'nowrap' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const searchStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', borderRadius: 16, padding: '13px 14px', fontWeight: 850, color: '#0f172a', outline: 'none' }
const selectStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#334155', fontWeight: 850 }
const contentGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '340px minmax(0,1fr)', gap: 16 }
const categoryPanelStyle: CSSProperties = { borderRadius: 26, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe' }
const categoryPanelTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }
const sideTitleStyle: CSSProperties = { margin: 0, fontSize: 19, fontWeight: 950, letterSpacing: '-.03em' }
const miniButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', padding: '9px 11px', fontWeight: 950, cursor: 'pointer' }
const categoryListStyle: CSSProperties = { display: 'grid', gap: 10 }
const categoryCardStyle: CSSProperties = { display: 'grid', gap: 10, borderRadius: 20, padding: 13, background: '#fff', border: '1px solid #e2e8f0' }
const categoryCodeStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }
const categoryActionsStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const textButtonStyle: CSSProperties = { border: 0, background: 'transparent', color: '#1d4ed8', fontWeight: 900, cursor: 'pointer', padding: 0 }
const coursePanelStyle: CSSProperties = { minWidth: 0 }
const courseGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const courseCardStyle: CSSProperties = { borderRadius: 24, padding: 18, background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.05)', display: 'grid', gap: 14 }
const courseTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }
const refStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }
const courseTitleStyle: CSSProperties = { margin: 0, fontSize: 18, lineHeight: 1.12, letterSpacing: '-.03em', fontWeight: 950 }
const courseTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.45, fontWeight: 700 }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap' }
const courseMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }
const readinessStyle: CSSProperties = { display: 'grid', gap: 8 }
const readinessTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#334155', fontSize: 12, fontWeight: 950 }
const readinessTrackStyle: CSSProperties = { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const readinessFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const syncGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 850 }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const actionButtonStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 13, padding: '9px 10px', fontWeight: 900, cursor: 'pointer', fontSize: 12 }
const dangerSoftButtonStyle: CSSProperties = { ...actionButtonStyle, borderColor: '#fed7aa', background: '#fff7ed', color: '#c2410c' }
const strategyGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const strategyItemStyle: CSSProperties = { display: 'grid', gap: 4, padding: 13, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: 10 }
const messageStyle: CSSProperties = { borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const warningStyle: CSSProperties = { borderRadius: 18, padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 850 }
const emptyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
const modalBackdropStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 60 }
const modalStyle: CSSProperties = { width: 'min(860px, 100%)', maxHeight: '88vh', overflow: 'auto', borderRadius: 30, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 30px 100px rgba(15,23,42,.30)' }
const modalTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const modalTitleStyle: CSSProperties = { margin: 0, fontSize: 26, letterSpacing: '-.04em', fontWeight: 950 }
const closeButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 14, width: 42, height: 42, fontSize: 24, cursor: 'pointer' }
const formStyle: CSSProperties = { display: 'grid', gap: 13 }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 15, padding: '12px 13px', color: '#0f172a', fontWeight: 800 }
const textAreaStyle: CSSProperties = { ...inputStyle, minHeight: 92, resize: 'vertical' }
const checkboxStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, color: '#334155' }
const modalActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, flexWrap: 'wrap' }
const cancelButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const saveButtonStyle: CSSProperties = { border: 0, background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const impactStyle: CSSProperties = { display: 'grid', gap: 14 }
const impactDecisionStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 20, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }
const impactGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const impactCellStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 16, padding: 12, background: '#fff', border: '1px solid #e2e8f0' }


const courseCardPremiumStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 20, background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #dbeafe', boxShadow: '0 18px 48px rgba(15,23,42,.07)', display: 'grid', gap: 15, cursor: 'pointer', outline: 'none' }
const courseCardGlowStyle: CSSProperties = { position: 'absolute', right: -48, top: -48, width: 130, height: 130, borderRadius: 999, background: 'rgba(37,99,235,.10)', filter: 'blur(18px)' }
const cardFooterStyle: CSSProperties = { position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 8 }
const cardMainButtonStyle: CSSProperties = { border: 0, background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const cardSoftButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const cardDangerButtonStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const detailModalBodyStyle: CSSProperties = { display: 'grid', gap: 16 }
const detailHeroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 180px', gap: 18, borderRadius: 28, padding: 22, color: '#fff', background: 'radial-gradient(circle at top right, rgba(96,165,250,.30), transparent 38%), linear-gradient(135deg,#0b2348,#123c72 52%,#2557d6)' }
const detailRefStyle: CSSProperties = { color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 9 }
const detailHeroTitleStyle: CSSProperties = { margin: 0, fontSize: 36, lineHeight: 1, letterSpacing: '-.055em', fontWeight: 980 }
const detailHeroTextStyle: CSSProperties = { margin: '12px 0 0', color: 'rgba(255,255,255,.78)', lineHeight: 1.65, fontWeight: 750 }
const detailScoreStyle: CSSProperties = { display: 'grid', gap: 4, alignContent: 'center', justifyItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)', padding: 16 }
const detailTabsStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }
const detailTabStyle: CSSProperties = { border: 0, borderRadius: 14, background: 'transparent', color: '#475569', padding: '10px 13px', fontWeight: 950, cursor: 'pointer' }
const detailTabActiveStyle: CSSProperties = { ...detailTabStyle, background: '#0f2a52', color: '#fff' }
const detailGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const detailPanelStyle: CSSProperties = { borderRadius: 22, padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }
const detailPanelWideStyle: CSSProperties = { ...detailPanelStyle, gridColumn: '1 / -1' }
const tagRowStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }
const detailStatsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const detailActionBarStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const syncCellStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 20, padding: 18, background: '#f8fbff', border: '1px solid #dbeafe' }
