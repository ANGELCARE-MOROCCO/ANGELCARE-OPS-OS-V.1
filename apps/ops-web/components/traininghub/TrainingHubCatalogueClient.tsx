'use client'

import { useMemo, useState, type CSSProperties } from 'react'

export type TrainingHubCatalogueCategory = {
  id: string
  code: string | null
  name: string | null
  owner_promise?: string | null
  market_risk?: string | null
  status?: string | null
  display_order?: number | null
}

export type TrainingHubCatalogueCourse = {
  id: string
  category_id: string | null
  ref: string | null
  title: string | null
  short_description?: string | null
  publication_status?: string | null
  status?: string | null
  onsite_entry_price_minor?: number | null
  refresh_entry_price_minor?: number | null
  currency_code?: string | null
  starter_min_participants?: number | null
  starter_max_participants?: number | null
  min_hours?: number | null
  max_hours?: number | null
  positioning_tags?: string[] | null
}

type Props = {
  categories: TrainingHubCatalogueCategory[]
  courses: TrainingHubCatalogueCourse[]
}

function money(amountMinor?: number | null, currency = 'MAD') {
  const value = Number(amountMinor || 0) / 100
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function tagsOf(course: TrainingHubCatalogueCourse) {
  return Array.isArray(course.positioning_tags) ? course.positioning_tags.filter(Boolean) : []
}

export default function TrainingHubCatalogueClient({ categories, courses }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [selectedRef, setSelectedRef] = useState<string | null>(courses[0]?.ref || null)

  const categoryById = useMemo(() => {
    const map = new Map<string, TrainingHubCatalogueCategory>()
    for (const category of categories) map.set(category.id, category)
    return map
  }, [categories])

  const courseCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const course of courses) {
      if (!course.category_id) continue
      map.set(course.category_id, (map.get(course.category_id) || 0) + 1)
    }
    return map
  }, [courses])

  const filteredCourses = useMemo(() => {
    const nq = normalize(query)
    return courses.filter((course) => {
      const category = course.category_id ? categoryById.get(course.category_id) : null
      const matchesCategory = activeCategory === 'ALL' || category?.code === activeCategory
      const matchesStatus = status === 'ALL' || course.publication_status === status || course.status === status
      const text = normalize([course.ref, course.title, course.short_description, category?.name, tagsOf(course).join(' ')].join(' '))
      const matchesQuery = !nq || text.includes(nq)
      return matchesCategory && matchesStatus && matchesQuery
    })
  }, [activeCategory, categoryById, courses, query, status])

  const selectedCourse = useMemo(() => {
    return filteredCourses.find((course) => course.ref === selectedRef) || filteredCourses[0] || courses[0] || null
  }, [courses, filteredCourses, selectedRef])

  const selectedCategory = selectedCourse?.category_id ? categoryById.get(selectedCourse.category_id) : null

  return (
    <div style={workspaceStyle}>
      <section style={topRailStyle}>
        <div style={searchBoxStyle}>
          <span style={searchLabelStyle}>Recherche catalogue</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ref, titre, tag, catégorie..."
            style={inputStyle}
          />
        </div>
        <div style={filterBoxStyle}>
          <span style={searchLabelStyle}>Statut</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}>
            <option value="ALL">Tous les statuts</option>
            <option value="published">Published</option>
            <option value="ready">Ready</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div style={kpiMiniStyle}>
          <strong>{filteredCourses.length}</strong>
          <span>cours visibles</span>
        </div>
        <div style={kpiMiniStyle}>
          <strong>{categories.length}</strong>
          <span>catégories</span>
        </div>
      </section>

      <section style={categoryStripStyle}>
        <button type="button" onClick={() => setActiveCategory('ALL')} style={activeCategory === 'ALL' ? catButtonActiveStyle : catButtonStyle}>
          <strong>ALL</strong>
          <span>{courses.length} cours</span>
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            onClick={() => setActiveCategory(String(category.code || ''))}
            style={activeCategory === category.code ? catButtonActiveStyle : catButtonStyle}
          >
            <strong>{category.code}</strong>
            <span>{courseCounts.get(category.id) || 0} cours</span>
          </button>
        ))}
      </section>

      <section style={mainGridStyle}>
        <div style={courseListPanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={panelTitleStyle}>Catalogue formations</h2>
              <p style={panelSubtitleStyle}>Liste contrôlée par DB, RBAC et RLS — aucune donnée OpsOS.</p>
            </div>
            <a href="/api/traininghub/catalogue/summary" style={apiButtonStyle}>Summary API</a>
          </div>

          <div style={courseListStyle}>
            {filteredCourses.map((course) => {
              const category = course.category_id ? categoryById.get(course.category_id) : null
              const selected = selectedCourse?.id === course.id
              return (
                <button
                  type="button"
                  key={course.id}
                  onClick={() => setSelectedRef(course.ref || null)}
                  style={selected ? courseRowActiveStyle : courseRowStyle}
                >
                  <span style={courseTopStyle}>
                    <strong>{course.ref}</strong>
                    <small>{category?.code || 'CAT'}</small>
                  </span>
                  <span style={courseRowTitleStyle}>{course.title}</span>
                  <span style={courseRowMetaStyle}>
                    <span>{money(course.onsite_entry_price_minor, course.currency_code || 'MAD')}</span>
                    <span>Refresh {money(course.refresh_entry_price_minor, course.currency_code || 'MAD')}</span>
                    <span>{course.publication_status || course.status || 'status'}</span>
                  </span>
                </button>
              )
            })}
            {!filteredCourses.length ? <div style={emptyStyle}>Aucun cours ne correspond au filtre.</div> : null}
          </div>
        </div>

        <aside style={detailPanelStyle}>
          {selectedCourse ? (
            <>
              <div style={detailCategoryStyle}>{selectedCategory?.code} • {selectedCategory?.name}</div>
              <h2 style={detailTitleStyle}>{selectedCourse.ref} — {selectedCourse.title}</h2>
              <p style={detailDescriptionStyle}>{selectedCourse.short_description || 'Description courte à enrichir depuis la fiche complète.'}</p>

              <div style={priceGridStyle}>
                <div style={priceCardStyle}>
                  <span>Onsite initial</span>
                  <strong>{money(selectedCourse.onsite_entry_price_minor, selectedCourse.currency_code || 'MAD')}</strong>
                </div>
                <div style={priceCardStyle}>
                  <span>Refresh e-learning</span>
                  <strong>{money(selectedCourse.refresh_entry_price_minor, selectedCourse.currency_code || 'MAD')}</strong>
                </div>
              </div>

              <div style={ruleGridStyle}>
                <Rule label="Participants starter" value={`${selectedCourse.starter_min_participants || 3} à ${selectedCourse.starter_max_participants || 8}`} />
                <Rule label="Distribution heures" value={`${selectedCourse.min_hours || 6} à ${selectedCourse.max_hours || 15}h`} />
                <Rule label="Refresh" value="Débloqué après session validée" />
                <Rule label="Kit" value="Workbook + checklist + cards" />
              </div>

              <div style={tagWrapStyle}>
                {tagsOf(selectedCourse).length ? tagsOf(selectedCourse).map((tag) => <span key={tag} style={tagStyle}>{tag}</span>) : <span style={tagStyle}>No tag</span>}
              </div>

              <section style={marketBlockStyle}>
                <h3>Promesse propriétaire</h3>
                <p>{selectedCategory?.owner_promise || 'Promesse catégorie disponible dans la fiche catégorie.'}</p>
                <h3>Risque marché</h3>
                <p>{selectedCategory?.market_risk || 'Risque marché disponible dans la fiche catégorie.'}</p>
              </section>

              <div style={actionGridStyle}>
                <a href={`/api/traininghub/catalogue/courses/${selectedCourse.ref}/full`} style={primaryActionStyle}>Fiche complète API</a>
                <a href={`/api/traininghub/catalogue/categories/${selectedCategory?.code || ''}`} style={secondaryActionStyle}>Catégorie API</a>
              </div>
            </>
          ) : (
            <div style={emptyStyle}>Sélectionnez une formation.</div>
          )}
        </aside>
      </section>
    </div>
  )
}

function Rule({ label, value }: { label: string; value: string }) {
  return <div style={ruleCardStyle}><span>{label}</span><strong>{value}</strong></div>
}

const workspaceStyle: CSSProperties = { display: 'grid', gap: 16 }
const topRailStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 220px 130px 130px', gap: 12 }
const searchBoxStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 14, boxShadow: '0 14px 34px rgba(15,23,42,.06)' }
const filterBoxStyle: CSSProperties = { ...searchBoxStyle }
const searchLabelStyle: CSSProperties = { display: 'block', fontSize: 11, color: '#64748b', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }
const inputStyle: CSSProperties = { width: '100%', border: 0, outline: 'none', fontSize: 15, fontWeight: 850, color: '#0f172a', background: 'transparent' }
const selectStyle: CSSProperties = { width: '100%', border: 0, outline: 'none', fontSize: 14, fontWeight: 850, color: '#0f172a', background: 'transparent' }
const kpiMiniStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 4, background: '#0f2a52', color: '#fff', borderRadius: 22, padding: 15, boxShadow: '0 14px 34px rgba(15,42,82,.18)' }

const categoryStripStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(9,minmax(0,1fr))', gap: 8 }
const catButtonStyle: CSSProperties = { display: 'grid', gap: 3, padding: '12px 10px', borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', textAlign: 'left', cursor: 'pointer', boxShadow: '0 10px 24px rgba(15,23,42,.04)' }
const catButtonActiveStyle: CSSProperties = { ...catButtonStyle, background: '#2563eb', borderColor: '#2563eb', color: '#fff' }

const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) 430px', gap: 16, alignItems: 'start' }
const courseListPanelStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 18, boxShadow: '0 16px 40px rgba(15,23,42,.06)' }
const panelHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }
const panelTitleStyle: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 950, letterSpacing: '-.03em' }
const panelSubtitleStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 760 }
const apiButtonStyle: CSSProperties = { padding: '10px 12px', borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none', fontWeight: 950, fontSize: 12, border: '1px solid #bfdbfe' }
const courseListStyle: CSSProperties = { display: 'grid', gap: 9, maxHeight: 'calc(100vh - 330px)', overflow: 'auto', paddingRight: 4 }
const courseRowStyle: CSSProperties = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 18, background: '#f8fafc', padding: 13, textAlign: 'left', display: 'grid', gap: 6, cursor: 'pointer', color: '#0f172a' }
const courseRowActiveStyle: CSSProperties = { ...courseRowStyle, background: '#0f2a52', borderColor: '#0f2a52', color: '#fff', boxShadow: '0 16px 36px rgba(15,42,82,.18)' }
const courseTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 950, letterSpacing: '.04em' }
const courseRowTitleStyle: CSSProperties = { fontSize: 15, fontWeight: 950, lineHeight: 1.25 }
const courseRowMetaStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, fontWeight: 850, opacity: .82 }

const detailPanelStyle: CSSProperties = { position: 'sticky', top: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 30, padding: 22, boxShadow: '0 18px 44px rgba(15,23,42,.08)' }
const detailCategoryStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 9 }
const detailTitleStyle: CSSProperties = { margin: 0, fontSize: 27, lineHeight: 1.05, letterSpacing: '-.04em', color: '#0f172a' }
const detailDescriptionStyle: CSSProperties = { color: '#64748b', fontWeight: 780, lineHeight: 1.55, fontSize: 13 }
const priceGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' }
const priceCardStyle: CSSProperties = { display: 'grid', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 18, padding: 13, color: '#1e3a8a' }
const ruleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }
const ruleCardStyle: CSSProperties = { display: 'grid', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 12, color: '#0f172a' }
const tagWrapStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7, margin: '16px 0' }
const tagStyle: CSSProperties = { padding: '8px 10px', borderRadius: 999, background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 950, fontSize: 11 }
const marketBlockStyle: CSSProperties = { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: 15, color: '#7c2d12', fontSize: 13, lineHeight: 1.5, fontWeight: 750 }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }
const primaryActionStyle: CSSProperties = { textAlign: 'center', padding: '12px 10px', borderRadius: 15, background: '#0f2a52', color: '#fff', textDecoration: 'none', fontWeight: 950, fontSize: 12 }
const secondaryActionStyle: CSSProperties = { ...primaryActionStyle, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
const emptyStyle: CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 850 }
