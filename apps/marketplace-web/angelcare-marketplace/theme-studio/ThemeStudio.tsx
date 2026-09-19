'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Blocks, ChevronDown, ChevronUp, Copy, Eye, FileClock, Image as ImageIcon, Layers3, Monitor, Palette, Plus, Redo2, Save, Smartphone, Tablet, Trash2, Undo2 } from 'lucide-react'
import { HomepageFlagship } from '../homepage-flagship/components/HomepageFlagship'
import type { HomepageCampaign, HomepageCategory, HomepageExperience, HomepageLocale, HomepageSectionDefinition } from '../homepage-flagship/types'
import type { CommerceRecord, HomepageSectionRecord, MediaAsset } from '../commerce-studio/types'
import type { ExperienceSchemaRecord, HomepageBlockRecord } from '../category-native/types'
import { ANGELCARE_FLAGSHIP_THEME, THEME_PRESETS } from './defaults'
import type { HomepageThemeConfig, HomepageThemeStudioDocument } from './types'
import styles from './theme-studio.module.css'

type Device = 'desktop' | 'tablet' | 'mobile'
type LeftTab = 'layers' | 'blocks' | 'themes'
type InspectorTab = 'content' | 'design' | 'media'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const sectionLabel = (key: string) => key.replaceAll('-', ' ').replaceAll('_', ' ')

function responseData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null
  const source = payload as Record<string, unknown>
  if (source.data && typeof source.data === 'object') return source.data as T
  if (source.result && typeof source.result === 'object') return source.result as T
  return source as T
}

function compositionFromSections(sections: HomepageSectionRecord[], base: HomepageExperience): HomepageSectionDefinition[] {
  const existing = new Map(base.composition.map((entry) => [entry.id, entry]))
  return sections.filter((section) => section.section_key !== '__theme_root__').map((section) => ({
    id: section.id,
    section_key: section.section_key,
    section_type: section.section_type,
    title: section.title,
    subtitle: section.subtitle,
    sort_order: section.sort_order,
    layout_variant: section.layout_variant,
    visible: section.visible,
    accent: section.accent,
    background_variant: section.background_variant,
    settings: section.settings,
    items: existing.get(section.id)?.items || base.composition.find((entry) => entry.section_key === section.section_key)?.items || [],
  }))
}

export function ThemeStudio({
  initialSections, collections, blocks, schemas, experiences, media, canManage, canViewHistory,
}: {
  initialSections: HomepageSectionRecord[]
  collections: CommerceRecord[]
  blocks: HomepageBlockRecord[]
  schemas: ExperienceSchemaRecord[]
  experiences: Record<HomepageLocale, HomepageExperience>
  media: MediaAsset[]
  canManage: boolean
  canViewHistory: boolean
}) {
  const [locale, setLocale] = useState<HomepageLocale>('fr')
  const [device, setDevice] = useState<Device>('desktop')
  const [leftTab, setLeftTab] = useState<LeftTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('content')
  const [sectionsByLocale, setSectionsByLocale] = useState<Record<HomepageLocale, HomepageSectionRecord[]>>(() => ({
    fr: clone(initialSections.filter((section) => section.locale === 'fr')),
    en: clone(initialSections.filter((section) => section.locale === 'en')),
    ar: clone(initialSections.filter((section) => section.locale === 'ar')),
  }))
  const [campaignsByLocale, setCampaignsByLocale] = useState<Record<HomepageLocale, HomepageCampaign[]>>(() => ({ fr: clone(experiences.fr.campaigns), en: clone(experiences.en.campaigns), ar: clone(experiences.ar.campaigns) }))
  const [categoriesByLocale, setCategoriesByLocale] = useState<Record<HomepageLocale, HomepageCategory[]>>(() => ({ fr: clone(experiences.fr.categories), en: clone(experiences.en.categories), ar: clone(experiences.ar.categories) }))
  const [selectedCategoryId, setSelectedCategoryId] = useState(experiences.fr.categories[0]?.id || '')
  const [themeByLocale, setThemeByLocale] = useState<Record<HomepageLocale, HomepageThemeConfig>>(() => ({ fr: clone(experiences.fr.theme || ANGELCARE_FLAGSHIP_THEME), en: clone(experiences.en.theme || ANGELCARE_FLAGSHIP_THEME), ar: clone(experiences.ar.theme || ANGELCARE_FLAGSHIP_THEME) }))
  const [selectedKey, setSelectedKey] = useState('hero')
  const [history, setHistory] = useState<string[]>([])
  const [future, setFuture] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mediaTarget, setMediaTarget] = useState<'desktop' | 'tablet' | 'mobile' | null>(null)

  const sections = sectionsByLocale[locale]
  const campaigns = campaignsByLocale[locale]
  const categories = categoriesByLocale[locale]
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || categories[0] || null
  const selectedSection = sections.find((section) => section.section_key === selectedKey) || null
  const ctaCapable = Boolean(selectedSection && ['category-mosaic','featured-products','best-picks','territory-picks','available-now','popular-now','new-arrivals','family-services','development-montessori','academy','partner-os','trust-evidence','territory-atlas','final-commerce-band'].includes(selectedSection.section_key))
  const sectionMediaCapable = Boolean(selectedSection && (selectedSection.section_key === 'family-services' || selectedSection.section_type.startsWith('custom_')))
  const theme = themeByLocale[locale]
  const activeCampaign = campaigns[0] || null

  const experience = useMemo<HomepageExperience>(() => ({
    ...experiences[locale],
    locale,
    campaigns,
    categories,
    composition: compositionFromSections(sections, experiences[locale]),
    theme,
  }), [campaigns, categories, experiences, locale, sections, theme])

  function serializeCurrent() { return JSON.stringify({ sectionsByLocale, campaignsByLocale, categoriesByLocale, themeByLocale, selectedKey, selectedCategoryId }) }
  function checkpoint() { setHistory((current) => [...current.slice(-39), serializeCurrent()]); setFuture([]) }
  function restore(serialized: string) {
    const parsed = JSON.parse(serialized) as { sectionsByLocale: typeof sectionsByLocale; campaignsByLocale: typeof campaignsByLocale; categoriesByLocale: typeof categoriesByLocale; themeByLocale: typeof themeByLocale; selectedKey: string; selectedCategoryId: string }
    setSectionsByLocale(parsed.sectionsByLocale); setCampaignsByLocale(parsed.campaignsByLocale); setCategoriesByLocale(parsed.categoriesByLocale); setThemeByLocale(parsed.themeByLocale); setSelectedKey(parsed.selectedKey); setSelectedCategoryId(parsed.selectedCategoryId)
  }
  function undo() { const previous = history.at(-1); if (!previous) return; setFuture((current) => [serializeCurrent(), ...current]); setHistory((current) => current.slice(0, -1)); restore(previous) }
  function redo() { const next = future[0]; if (!next) return; setHistory((current) => [...current, serializeCurrent()]); setFuture((current) => current.slice(1)); restore(next) }

  useEffect(() => {
    let active = true
    void fetch(`/api/angelcare-marketplace/admin/homepage/theme-studio?locale=${locale}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!active) return
        const draft = responseData<{ document?: HomepageThemeStudioDocument }>(payload)
        if (!draft?.document || draft.document.locale !== locale) return
        setSectionsByLocale((current) => ({ ...current, [locale]: draft.document!.sections }))
        setCampaignsByLocale((current) => ({ ...current, [locale]: draft.document!.campaigns }))
        setCategoriesByLocale((current) => ({ ...current, [locale]: draft.document!.categories || experiences[locale].categories }))
        setThemeByLocale((current) => ({ ...current, [locale]: draft.document!.theme }))
        setMessage(`Brouillon Theme Studio restauré · ${draft.document.theme.name}`)
      }).catch(() => undefined)
    return () => { active = false }
  }, [locale, experiences])

  function patchSection(patch: Partial<HomepageSectionRecord>) {
    if (!selectedSection || !canManage) return
    checkpoint()
    setSectionsByLocale((current) => ({ ...current, [locale]: current[locale].map((section) => section.id === selectedSection.id ? { ...section, ...patch } : section) }))
  }
  function patchCampaign(patch: Partial<HomepageCampaign>) {
    if (!activeCampaign || !canManage) return
    checkpoint()
    setCampaignsByLocale((current) => ({ ...current, [locale]: current[locale].map((campaign, index) => index === 0 ? { ...campaign, ...patch } : campaign) }))
  }
  function patchCategory(patch: Partial<HomepageCategory>) {
    if (!selectedCategory || !canManage) return
    checkpoint()
    setCategoriesByLocale((current) => ({ ...current, [locale]: current[locale].map((category) => category.id === selectedCategory.id ? { ...category, ...patch } : category) }))
  }
  function patchTheme(patch: Partial<HomepageThemeConfig>) {
    if (!canManage) return
    checkpoint()
    const structuralKeys = ['sectionRadius','cardRadius','spacingScale','headingScale','bodyScale','headerVariant','density']
    const structuralChange = Object.keys(patch).some((key) => structuralKeys.includes(key))
    setThemeByLocale((current) => {
      const active = current[locale]
      const nextId = structuralChange && active.id === 'angelcare-flagship-2026' ? `angelcare-custom-${locale}` : active.id
      return { ...current, [locale]: { ...active, id: nextId, ...patch } }
    })
  }
  function moveSection(id: string, direction: -1 | 1) {
    const list = [...sections].sort((a, b) => a.sort_order - b.sort_order)
    const index = list.findIndex((section) => section.id === id); const target = index + direction
    if (index < 0 || target < 0 || target >= list.length) return
    checkpoint(); [list[index], list[target]] = [list[target], list[index]]
    const normalized = list.map((section, position) => ({ ...section, sort_order: (position + 1) * 10 }))
    setSectionsByLocale((current) => ({ ...current, [locale]: normalized }))
  }
  function duplicateSection(section: HomepageSectionRecord) {
    checkpoint()
    const copy: HomepageSectionRecord = { ...clone(section), id: `draft-${crypto.randomUUID()}`, section_key: `${section.section_key}-copy-${Date.now()}`, title: `${section.title} · copie`, status: 'active', sort_order: Math.max(0, ...sections.map((item) => item.sort_order)) + 10 }
    setSectionsByLocale((current) => ({ ...current, [locale]: [...current[locale], copy] })); setSelectedKey(copy.section_key)
  }
  function deleteSection(id: string) {
    if (!confirm('Retirer cette section du prochain thème publié ?')) return
    checkpoint()
    if (id.startsWith('draft-')) setSectionsByLocale((current) => ({ ...current, [locale]: current[locale].filter((section) => section.id !== id) }))
    else setSectionsByLocale((current) => ({ ...current, [locale]: current[locale].map((section) => section.id === id ? { ...section, visible: false } : section) }))
    setSelectedKey('hero')
  }
  function addBlock(block: HomepageBlockRecord) {
    checkpoint()
    const section: HomepageSectionRecord = {
      id: `draft-${crypto.randomUUID()}`, section_key: `${block.block_key}-${Date.now()}`, section_type: block.block_type, locale,
      title: block.name_fr, subtitle: `Bloc ${block.category_family.replaceAll('_', ' ')}`, layout_variant: block.layout_presets[0] || 'rail', sort_order: Math.max(0, ...sections.map((item) => item.sort_order)) + 10,
      settings: clone(block.default_settings), visible: true, audience: 'all', starts_at: null, ends_at: null, background_variant: 'white', accent: 'navy', status: 'active',
    }
    setSectionsByLocale((current) => ({ ...current, [locale]: [...current[locale], section] })); setSelectedKey(section.section_key); setLeftTab('layers')
  }

  function buildDocument(): HomepageThemeStudioDocument { return { schemaVersion: 1, locale, theme, sections, campaigns, categories, savedAt: new Date().toISOString() } }
  async function action(kind: 'save_draft' | 'publish') {
    if (!canManage) return
    setBusy(true); setError(''); setMessage(kind === 'publish' ? 'Publication du thème en cours…' : 'Enregistrement du brouillon…')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/homepage/theme-studio', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: kind, document: buildDocument() }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error((payload as { error?: { message?: string } } | null)?.error?.message || `HTTP ${response.status}`)
      const result = responseData<{ version?: number }>(payload)
      setMessage(kind === 'publish' ? `Thème publié · version ${result?.version || 'créée'} · runtime public synchronisé.` : `Brouillon durable enregistré · version ${result?.version || 'créée'}.`)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Action Theme Studio impossible.') } finally { setBusy(false) }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(buildDocument(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `angelcare-homepage-theme-${locale}-${Date.now()}.json`; anchor.click(); URL.revokeObjectURL(url)
  }

  const sortedSections = [...sections].filter((section) => section.section_key !== '__theme_root__').sort((a, b) => a.sort_order - b.sort_order)
  return <main className={styles.shell}>
    <header className={styles.topbar}><div className={styles.brand}><Palette/><div><b>ANGELCARE · Theme Studio</b><span>Runtime-parity Marketplace Experience OS</span></div></div><div className={styles.commands}>
      <button disabled={!history.length || busy} onClick={undo}><Undo2 size={14}/><span>Undo</span></button><button disabled={!future.length || busy} onClick={redo}><Redo2 size={14}/><span>Redo</span></button>
      <button data-active={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor size={14}/></button><button data-active={device === 'tablet'} onClick={() => setDevice('tablet')}><Tablet size={14}/></button><button data-active={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={14}/></button>
      <select value={locale} onChange={(event) => { setLocale(event.target.value as HomepageLocale); setSelectedKey('hero') }}><option value="fr">FR</option><option value="en">EN</option><option value="ar">AR RTL</option></select>
      <Link href="/angelcare-marketplace/admin/navigation/header">Navigation</Link><Link href="/angelcare-marketplace/admin/footer-studio/composer">Footer</Link><Link href="/angelcare-marketplace/admin/media/library"><ImageIcon size={14}/>Vault</Link>{canViewHistory ? <Link href="/angelcare-marketplace/admin/homepage/history"><FileClock size={14}/>Versions</Link> : null}<a href={`/angelcare-marketplace/${locale}`} target="_blank"><Eye size={14}/>Live</a>
      <button className={styles.save} disabled={!canManage || busy} onClick={() => void action('save_draft')}><Save size={14}/>Brouillon</button><button className={styles.publish} disabled={!canManage || busy} onClick={() => void action('publish')}>Publier maintenant</button>
    </div></header>
    <section className={styles.layout}>
      <aside className={styles.panel}><div className={styles.tabs}><button data-active={leftTab === 'layers'} onClick={() => setLeftTab('layers')}><Layers3 size={13}/> Calques</button><button data-active={leftTab === 'blocks'} onClick={() => setLeftTab('blocks')}><Blocks size={13}/> Blocs</button><button data-active={leftTab === 'themes'} onClick={() => setLeftTab('themes')}><Palette size={13}/> Thèmes</button></div><div className={styles.panelBody}>
        {leftTab === 'layers' ? <><div className={styles.panelHeader}><span>PAGE TREE</span><h2>Homepage réelle</h2></div><div className={styles.sectionList}><button className={styles.sectionRow} data-active={selectedKey === 'hero'} onClick={() => setSelectedKey('hero')}><i>◆</i><span><strong>Hero & recherche</strong><small>Campagnes · CTA · médias</small></span></button>{sortedSections.map((section, index) => <div key={section.id} className={styles.sectionRow} data-active={selectedKey === section.section_key} data-hidden={!section.visible} onClick={() => setSelectedKey(section.section_key)}><i>#{index + 1}</i><span><strong>{section.title || sectionLabel(section.section_key)}</strong><small>{section.section_key}</small></span><div className={styles.rowActions}><button title="Monter" onClick={(event) => { event.stopPropagation(); moveSection(section.id, -1) }}><ChevronUp size={12}/></button><button title="Descendre" onClick={(event) => { event.stopPropagation(); moveSection(section.id, 1) }}><ChevronDown size={12}/></button></div></div>)}</div></> : null}
        {leftTab === 'blocks' ? <><div className={styles.panelHeader}><span>SECTION LIBRARY</span><h2>Ajouter sans coder</h2></div>{Array.from(new Set(blocks.map((block) => block.category_family))).map((family) => <div className={styles.libraryGroup} key={family}><h3>{family.replaceAll('_', ' ')}</h3>{blocks.filter((block) => block.category_family === family).map((block) => <button className={styles.libraryCard} key={block.block_key} onClick={() => addBlock(block)} disabled={!canManage}><Plus size={15}/><span><strong>{block.name_fr}</strong><small>{block.layout_presets.join(' · ')}</small></span></button>)}</div>)}</> : null}
        {leftTab === 'themes' ? <><div className={styles.panelHeader}><span>THEME LIBRARY</span><h2>Identité globale</h2></div><div className={styles.themeCards}>{THEME_PRESETS.map((preset) => <button className={styles.themeCard} data-active={theme.id === preset.id} key={preset.id} onClick={() => { checkpoint(); setThemeByLocale((current) => ({ ...current, [locale]: clone(preset) })) }}><div className={styles.swatches}><i style={{ background: preset.navy }}/><i style={{ background: preset.red }}/><i style={{ background: preset.blue }}/><i style={{ background: preset.surfaceSoft }}/></div><strong>{preset.name}</strong><small>{preset.density} · {preset.contentWidth}px</small></button>)}</div><button className={styles.jsonButton} onClick={exportJson}>Exporter le document JSON</button></> : null}
      </div></aside>
      <section className={styles.canvasStage}><div className={styles.canvasToolbar}><span>PREVIEW = RENDERER PUBLIC RÉEL · aucun faux canvas</span><span>{device.toUpperCase()} · {locale.toUpperCase()} · {theme.name}</span></div><div className={styles.viewport} data-device={device}><div className={styles.previewCapture}><HomepageFlagship experience={experience} editor={{ selectedSectionKey: selectedKey, onSelectSection: setSelectedKey }}/></div></div></section>
      <aside className={`${styles.panel} ${styles.right}`}><div className={styles.tabs}><button data-active={inspectorTab === 'content'} onClick={() => setInspectorTab('content')}>Contenu</button><button data-active={inspectorTab === 'design'} onClick={() => setInspectorTab('design')}>Design</button><button data-active={inspectorTab === 'media'} onClick={() => setInspectorTab('media')}>Médias</button></div><div className={styles.inspector}><span>INSPECTOR</span><h2>{selectedKey === 'hero' ? 'Hero & campagnes' : selectedSection?.title || sectionLabel(selectedKey)}</h2>
        {inspectorTab === 'content' && selectedKey === 'hero' && activeCampaign ? <fieldset className={styles.fieldset} disabled={!canManage}><label className={styles.field}><span>Eyebrow</span><input value={activeCampaign.eyebrow || ''} onChange={(event) => patchCampaign({ eyebrow: event.target.value })}/></label><label className={styles.field}><span>Titre</span><textarea value={activeCampaign.title} onChange={(event) => patchCampaign({ title: event.target.value })}/></label><label className={styles.field}><span>Sous-titre</span><textarea value={activeCampaign.subtitle || ''} onChange={(event) => patchCampaign({ subtitle: event.target.value })}/></label><label className={styles.field}><span>CTA principal</span><input value={activeCampaign.primary_cta_label} onChange={(event) => patchCampaign({ primary_cta_label: event.target.value })}/></label><label className={styles.field}><span>Lien CTA principal</span><input value={activeCampaign.primary_cta_href} onChange={(event) => patchCampaign({ primary_cta_href: event.target.value })}/></label><label className={styles.field}><span>CTA secondaire</span><input value={activeCampaign.secondary_cta_label || ''} onChange={(event) => patchCampaign({ secondary_cta_label: event.target.value })}/></label><label className={styles.field}><span>Lien CTA secondaire</span><input value={activeCampaign.secondary_cta_href || ''} onChange={(event) => patchCampaign({ secondary_cta_href: event.target.value })}/></label></fieldset> : null}
        {inspectorTab === 'content' && selectedKey === 'category-mosaic' && selectedCategory ? <fieldset className={styles.fieldset} disabled={!canManage}><label className={styles.field}><span>Tuile catégorie</span><select value={selectedCategory.id} onChange={(event) => setSelectedCategoryId(event.target.value)}>{categories.slice(0, 12).map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label><label className={styles.field}><span>Titre de la tuile</span><input value={selectedCategory.title} onChange={(event) => patchCategory({ title: event.target.value })}/></label><label className={styles.field}><span>Description</span><textarea value={selectedCategory.short_description || ''} onChange={(event) => patchCategory({ short_description: event.target.value })}/></label><label className={styles.field}><span>Traitement visuel</span><select value={selectedCategory.visual_theme} onChange={(event) => patchCategory({ visual_theme: event.target.value })}><option value="navy">Navy</option><option value="warm">Warm</option><option value="red">Red</option></select></label></fieldset> : null}
        {inspectorTab === 'content' && selectedSection ? <fieldset className={styles.fieldset} disabled={!canManage}><label className={styles.field}><span>Titre CMS</span><input value={selectedSection.title} onChange={(event) => patchSection({ title: event.target.value })}/></label><label className={styles.field}><span>Sous-titre CMS</span><textarea value={selectedSection.subtitle || ''} onChange={(event) => patchSection({ subtitle: event.target.value })}/></label><label className={styles.field}><span>Collection / source</span><select value={String(selectedSection.settings.collection_id || '')} onChange={(event) => patchSection({ settings: { ...selectedSection.settings, collection_id: event.target.value } })}><option value="">Source native de la section</option>{collections.map((collection) => <option key={String(collection.id)} value={String(collection.id)}>{String(collection.title || collection.collection_key || collection.id)}</option>)}</select></label><div className={styles.pair}><label className={styles.field}><span>Layout</span><select value={selectedSection.layout_variant} onChange={(event) => patchSection({ layout_variant: event.target.value })}>{['rail','grid','mosaic','split','full-width','editorial','comparison'].map((value) => <option key={value}>{value}</option>)}</select></label><label className={styles.field}><span>Audience</span><select value={selectedSection.audience} onChange={(event) => patchSection({ audience: event.target.value })}><option value="all">Tous</option><option value="family">Familles</option><option value="organization">Organisations</option><option value="professional">Professionnels</option></select></label></div>{ctaCapable ? <><label className={styles.field}><span>Libellé CTA</span><input value={String(selectedSection.settings.primary_cta_label || '')} onChange={(event) => patchSection({ settings: { ...selectedSection.settings, primary_cta_label: event.target.value } })}/></label><label className={styles.field}><span>Destination CTA</span><input value={String(selectedSection.settings.primary_cta_href || '')} onChange={(event) => patchSection({ settings: { ...selectedSection.settings, primary_cta_href: event.target.value } })}/></label></> : null}<div className={styles.toggleRow}><button type="button" data-active={selectedSection.visible} onClick={() => patchSection({ visible: !selectedSection.visible })}>{selectedSection.visible ? 'Visible' : 'Masquée'}</button><button type="button" onClick={() => duplicateSection(selectedSection)}><Copy size={12}/>Dupliquer</button><button type="button" className={styles.danger} onClick={() => deleteSection(selectedSection.id)}><Trash2 size={12}/>Retirer</button></div></fieldset> : null}
        {inspectorTab === 'design' ? <fieldset className={styles.fieldset} disabled={!canManage}><label className={styles.field}><span>Nom du thème</span><input value={theme.name} onChange={(event) => patchTheme({ name: event.target.value })}/></label><div className={styles.pair}>{(['navy','red','blue','ink','surface','surfaceSoft','warm','line'] as const).map((key) => <label className={styles.field} key={key}><span>{key}</span><input type="color" value={theme[key]} onChange={(event) => patchTheme({ [key]: event.target.value } as Partial<HomepageThemeConfig>)}/></label>)}</div><label className={styles.field}><span>Largeur contenu · {theme.contentWidth}px</span><input type="range" min="960" max="1800" step="20" value={theme.contentWidth} onChange={(event) => patchTheme({ contentWidth: Number(event.target.value) })}/></label><label className={styles.field}><span>Rayon sections · {theme.sectionRadius}px</span><input type="range" min="0" max="64" value={theme.sectionRadius} onChange={(event) => patchTheme({ sectionRadius: Number(event.target.value) })}/></label><label className={styles.field}><span>Espacement · {theme.spacingScale.toFixed(2)}×</span><input type="range" min="0.65" max="1.6" step="0.05" value={theme.spacingScale} onChange={(event) => patchTheme({ spacingScale: Number(event.target.value) })}/></label><label className={styles.field}><span>Échelle titres · {theme.headingScale.toFixed(2)}×</span><input type="range" min="0.8" max="1.4" step="0.05" value={theme.headingScale} onChange={(event) => patchTheme({ headingScale: Number(event.target.value) })}/></label><label className={styles.field}><span>Densité</span><select value={theme.density} onChange={(event) => patchTheme({ density: event.target.value as HomepageThemeConfig['density'] })}><option value="comfortable">Comfortable</option><option value="compact">Compact</option><option value="cinematic">Cinematic</option></select></label><label className={styles.field}><span>Navigation homepage</span><select value={theme.headerVariant} onChange={(event) => patchTheme({ headerVariant: event.target.value as HomepageThemeConfig['headerVariant'] })}><option value="classic">Classic</option><option value="compact">Compact</option><option value="editorial">Editorial</option></select></label><div className={styles.infoBox}>Les tokens modifient le renderer public réel. Theme V1 reprend exactement les valeurs actuelles pour garantir zéro régression visuelle.</div></fieldset> : null}
        {inspectorTab === 'media' ? <><div className={styles.infoBox}>Un média présent dans le Vault et sélectionné par l’admin est suffisant. Aucun marquage “officiel”, ratio imposé ou statut d’optimisation n’est requis par Theme Studio.</div>{selectedKey !== 'hero' && selectedKey !== 'category-mosaic' && !sectionMediaCapable ? <div className={styles.infoBox}>Cette section utilise ses médias depuis son autorité native (catalogue, Academy, Partner OS ou Trust). Aucune fausse substitution média n’est exposée ici.</div> : null}{selectedKey === 'hero' && activeCampaign ? <div className={styles.toggleRow}><button data-active={mediaTarget === 'desktop'} onClick={() => setMediaTarget('desktop')}>Desktop</button><button data-active={mediaTarget === 'tablet'} onClick={() => setMediaTarget('tablet')}>Tablet</button><button data-active={mediaTarget === 'mobile'} onClick={() => setMediaTarget('mobile')}>Mobile</button></div> : null}{(selectedKey === 'hero' || selectedKey === 'category-mosaic' || sectionMediaCapable) ? <div className={styles.mediaGrid}>{media.filter((asset) => asset.media_type === 'image').slice(0, 160).map((asset) => <button className={styles.media} key={asset.id} onClick={() => { const url = asset.public_url || asset.desktop_url; if (selectedKey === 'hero' && activeCampaign) { const target = mediaTarget || 'desktop'; patchCampaign(target === 'desktop' ? { desktop_asset_url: url } : target === 'tablet' ? { tablet_asset_url: url } : { mobile_asset_url: url }); setMediaTarget(null); return } if (selectedKey === 'category-mosaic' && selectedCategory) { patchCategory({ cover_asset_url: url }); return } if (sectionMediaCapable && selectedSection) patchSection({ settings: { ...selectedSection.settings, media_url: url } }) }}><img src={asset.public_url || asset.desktop_url} alt=""/><small>{asset.file_name}</small></button>)}</div> : null}</> : null}
        <div className={styles.infoBox} style={{ marginTop: 14 }}>Contrats de schéma disponibles: {schemas.length} · Collections: {collections.length} · Médias: {media.length}</div>
      </div></aside>
    </section>
    {(message || error) ? <div className={styles.status} data-error={Boolean(error)}>{error || message}</div> : null}
  </main>
}
