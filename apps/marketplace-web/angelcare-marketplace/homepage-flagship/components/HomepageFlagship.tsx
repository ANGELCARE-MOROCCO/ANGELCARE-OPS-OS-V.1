"use client"

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import {
  ArrowRight, BadgeCheck, BookOpenCheck, Building2, CalendarDays, Check, ChevronLeft, ChevronRight,
  ClipboardCheck, GitCompareArrows, GraduationCap, Heart, Hotel, MapPin, PackageOpen, Play, Search,
  ShieldCheck, ShoppingBag, Sparkles, Star, UsersRound,
} from 'lucide-react'
import { homepageCopy } from '../copy'
import type { HomepageCampaign, HomepageExperience, HomepageItem, HomepageLocale } from '../types'
import styles from '../homepage.module.css'

function priceLabel(item: HomepageItem, locale: HomepageLocale): string {
  if (item.price_mode === 'quote_only' || item.price_amount === null) return locale === 'ar' ? 'حسب الطلب' : locale === 'en' ? 'Request quote' : 'Sur devis'
  const value = new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-MA' : 'fr-MA', { maximumFractionDigits: 0 }).format(item.price_amount)
  if (item.price_mode === 'starting_from') return locale === 'ar' ? `ابتداءً من ${value} ${item.currency_label}` : locale === 'en' ? `From ${value} ${item.currency_label}` : `À partir de ${value} ${item.currency_label}`
  if (item.price_mode === 'subscription') return locale === 'ar' ? `${value} ${item.currency_label} / اشتراك` : locale === 'en' ? `${value} ${item.currency_label} / subscription` : `${value} ${item.currency_label} / abonnement`
  return `${value} ${item.currency_label}`
}

function availabilityLabel(item: HomepageItem, locale: HomepageLocale): string {
  if (item.availability_status === 'available') return locale === 'ar' ? 'متاح' : locale === 'en' ? 'Available' : 'Disponible'
  if (item.availability_status === 'out_of_stock') return locale === 'ar' ? 'غير متوفر' : locale === 'en' ? 'Unavailable' : 'Indisponible'
  if (item.availability_status === 'territory_restricted') return locale === 'ar' ? 'حسب المنطقة' : locale === 'en' ? 'Territory restricted' : 'Selon territoire'
  return locale === 'ar' ? 'يتطلب التأهيل' : locale === 'en' ? 'Qualification required' : 'Qualification requise'
}

function itemHref(item: HomepageItem, locale: HomepageLocale): string {
  return `/angelcare-marketplace/${locale}/experience/${item.slug}`
}


function nativeSignals(item: HomepageItem, locale: HomepageLocale): string[] {
  const config = { ...item.metadata, ...item.experience_configuration }
  const value = (key: string) => {
    const raw = config[key]
    if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 2).join(' · ')
    if (raw === null || raw === undefined || raw === '') return ''
    return String(raw)
  }
  const schema = item.experience_schema_key || ''
  const candidates = schema.includes('flashcards')
    ? [['age_min','age_max'],['language'],['number_of_cards']]
    : schema.includes('montessori-development-kit')
      ? [['age_min','age_max'],['kit_type'],['component_count']]
      : schema.includes('home-childcare') || schema.includes('care')
        ? [['territory_codes'],['minimum_duration_hours'],['caregiver_language_options']]
        : schema.includes('academy') || schema.includes('cohort') || schema.includes('certification')
          ? [['level'],['delivery_mode'],['starts_at']]
          : schema.includes('programme') || schema.includes('partner') || schema.includes('quality') || schema.includes('managed')
            ? [['organization_type'],['site_count'],['pricing_mode']]
            : [['age_min','age_max'],['language'],['duration']]
  const labels: string[] = []
  for (const group of candidates) {
    if (group.length === 2 && value(group[0]) && value(group[1])) {
      labels.push(locale === 'ar' ? `${value(group[0])}–${value(group[1])} سنة` : `${value(group[0])}–${value(group[1])} ans`)
    } else {
      const found = group.map(value).find(Boolean)
      if (found) labels.push(found)
    }
  }
  return labels.slice(0, 3)
}

function track(payload: Record<string, unknown>) {
  void fetch('/api/angelcare-marketplace/homepage/engagement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => undefined)
}

function ItemCard({ item, locale, saved, compared, onSave, onCompare, variant = 'service' }: { item: HomepageItem; locale: HomepageLocale; saved: boolean; compared: boolean; onSave: () => void; onCompare: () => void; variant?: 'service' | 'product' | 'academy' | 'programme' | 'saas' }) {
  const c = homepageCopy(locale)
  const signals = nativeSignals(item, locale)
  return <article className={styles.itemCard} data-variant={variant} data-experience-schema={item.experience_schema_key || 'legacy'}>
    <div className={styles.itemMedia}>
      {item.media_url ? <img src={item.media_url} alt={item.name} loading="lazy" /> : <div className={styles.mediaFallback}><Sparkles size={28}/></div>}
      <div className={styles.cardActions}>
        <button type="button" aria-label={c.save} data-active={saved} onClick={onSave}><Heart size={17} fill={saved ? 'currentColor' : 'none'}/></button>
        <button type="button" aria-label={c.compare} data-active={compared} onClick={onCompare}><GitCompareArrows size={17}/></button>
      </div>
      <div className={styles.itemType}>{item.category_title || item.kind}</div>
      {item.trust_labels.length ? <div className={styles.verified}><BadgeCheck size={14}/>{item.trust_labels[0]}</div> : null}
    </div>
    <div className={styles.itemBody}>
      <div className={styles.itemMeta}><span>{item.public_reference}</span><span data-availability={item.availability_status}>{availabilityLabel(item, locale)}</span></div>
      <h3><Link href={itemHref(item, locale)} onClick={() => track({ event_name: 'item.opened', locale, catalog_item_id: item.id, route: itemHref(item, locale) })}>{item.name}</Link></h3>
      <p>{item.short_description}</p>
      {signals.length ? <div className={styles.nativeSignals}>{signals.map((signal) => <span key={signal}>{signal}</span>)}</div> : null}
      <div className={styles.itemFoot}><strong>{priceLabel(item, locale)}</strong><Link href={itemHref(item, locale)} aria-label={`${c.open}: ${item.name}`}><ArrowRight size={17}/></Link></div>
    </div>
  </article>
}

function Rail({ title, subtitle, items, locale, saved, compared, toggle, sectionKey }: { title: string; subtitle?: string | null; items: HomepageItem[]; locale: HomepageLocale; saved: Set<string>; compared: Set<string>; toggle: (type: 'saved' | 'compare', item: HomepageItem) => void; sectionKey: string }) {
  if (!items.length) return null
  return <section className={styles.railSection} data-section-key={sectionKey}>
    <div className={styles.sectionHeading}><div><span>ANGELCARE CURATION</span><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><Link href={`/angelcare-marketplace/${locale}/marketplace`}>{homepageCopy(locale).viewAll}<ArrowRight size={16}/></Link></div>
    <div className={styles.itemRail}>{items.map((item) => <ItemCard key={item.id} item={item} locale={locale} saved={saved.has(item.id)} compared={compared.has(item.id)} onSave={() => toggle('saved', item)} onCompare={() => toggle('compare', item)} variant={item.kind === 'kit' || item.kind === 'product' ? 'product' : item.kind === 'training' ? 'academy' : item.kind === 'saas_module' ? 'saas' : item.metadata.audience === 'organization' ? 'programme' : 'service'} />)}</div>
  </section>
}

function CampaignVisual({ campaign, active }: { campaign: HomepageCampaign; active: boolean }) {
  return <picture className={styles.heroPicture} data-active={active}>
    {campaign.mobile_asset_url ? <source media="(max-width: 680px)" srcSet={campaign.mobile_asset_url}/> : null}
    {campaign.tablet_asset_url ? <source media="(max-width: 1024px)" srcSet={campaign.tablet_asset_url}/> : null}
    <img src={campaign.desktop_asset_url} alt={campaign.title} fetchPriority={active ? 'high' : 'auto'}/>
  </picture>
}

export function HomepageFlagship({ experience }: { experience: HomepageExperience }) {
  const { locale } = experience
  const c = homepageCopy(locale)
  const rtl = locale === 'ar'
  const [campaignIndex, setCampaignIndex] = useState(0)
  const [audience, setAudience] = useState<'family' | 'organization' | 'professional'>('family')
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [saved, setSaved] = useState(() => new Set(experience.selection.saved))
  const [compared, setCompared] = useState(() => new Set(experience.selection.compare))
  const mainRef = useRef<HTMLElement | null>(null)
  const campaigns = experience.campaigns
  const activeCampaign = campaigns[campaignIndex] || null

  useEffect(() => {
    track({ event_name: 'homepage.viewed', locale, territory_code: experience.territory?.territory_code, route: `/angelcare-marketplace/${locale}` })
    if (campaigns.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setCampaignIndex((current) => (current + 1) % campaigns.length), 9000)
    return () => window.clearInterval(timer)
  }, [campaigns.length, experience.territory?.territory_code, locale])

  useEffect(() => {
    const main = mainRef.current
    if (!main || !experience.composition.length) return
    const config = new Map(experience.composition.map((section) => [section.section_key, section]))
    const children = Array.from(main.querySelectorAll<HTMLElement>(':scope > [data-section-key]'))
    children.sort((left, right) => (config.get(left.dataset.sectionKey || '')?.sort_order ?? 999) - (config.get(right.dataset.sectionKey || '')?.sort_order ?? 999))
    for (const child of children) {
      const section = config.get(child.dataset.sectionKey || '')
      child.hidden = section ? !section.visible : false
      main.appendChild(child)
    }
  }, [experience.composition])

  const topItems = useMemo(() => experience.bestPickItems.length ? experience.bestPickItems : experience.collections.find((collection) => collection.collection_key.includes('top-picks'))?.items || experience.featuredItems.slice(0, 10), [experience.bestPickItems, experience.collections, experience.featuredItems])
  const territoryItems = useMemo(() => experience.collections.find((collection) => collection.collection_key.includes('territory'))?.items || experience.availableItems.slice(0, 10), [experience.availableItems, experience.collections])

  function toggle(type: 'saved' | 'compare', item: HomepageItem) {
    const setter = type === 'saved' ? setSaved : setCompared
    const current = type === 'saved' ? saved : compared
    const next = new Set(current)
    const active = !next.has(item.id)
    if (active) next.add(item.id); else next.delete(item.id)
    setter(next)
    track({ event_name: active ? `item.${type}` : `item.${type}.removed`, selection_type: type, active, locale, territory_code: experience.territory?.territory_code, catalog_item_id: item.id, route: `/angelcare-marketplace/${locale}` })
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams({ q: query, audience, territory: experience.territory?.territory_code || 'MA-MASTER' })
    if (date) params.set('date', date)
    track({ event_name: 'search.submitted', locale, territory_code: experience.territory?.territory_code, route: `/angelcare-marketplace/${locale}/marketplace?${params.toString()}`, event_data: { query, audience, date } })
    window.location.href = `/angelcare-marketplace/${locale}/marketplace?${params.toString()}`
  }

  const audienceCards = [
    { key: 'family', title: c.families, icon: UsersRound, text: locale === 'ar' ? 'خدمات منزلية، دعم متكرر، أنشطة وتوجيه عائلي.' : locale === 'en' ? 'Home services, recurring support, activities and guided family journeys.' : 'Services à domicile, accompagnement récurrent, activités et parcours guidés.', href: `/angelcare-marketplace/${locale}/${locale === 'fr' ? 'familles' : 'families'}` },
    { key: 'organization', title: c.organizations, icon: Building2, text: locale === 'ar' ? 'حلول للمدارس والفنادق والشركات والشركاء الصحيين.' : locale === 'en' ? 'Solutions for schools, hospitality, corporate and health-adjacent partners.' : 'Solutions pour établissements, hospitality, Corporate et partenaires santé.', href: `/angelcare-marketplace/${locale}/establishments` },
    { key: 'professional', title: c.professionals, icon: GraduationCap, text: locale === 'ar' ? 'التدريب والشهادات وفرص مقدمي الخدمات ونظام الشركاء.' : locale === 'en' ? 'Training, certification, provider opportunities and Partner OS.' : 'Formation, certification, opportunités providers et Partner OS.', href: `/angelcare-marketplace/${locale}/academy` },
  ] as const

  const b2b = [
    { key: 'institutions', title: locale === 'ar' ? 'المدارس والحضانات' : locale === 'en' ? 'Schools & childcare centers' : 'Écoles & crèches', icon: Building2, href: `/angelcare-marketplace/${locale}/establishments`, tone: 'institution' },
    { key: 'hospitality', title: locale === 'ar' ? 'الفنادق والضيافة' : locale === 'en' ? 'Hotels & hospitality' : 'Hôtellerie & hospitality', icon: Hotel, href: `/angelcare-marketplace/${locale}/hospitality`, tone: 'hospitality' },
    { key: 'health-adjacent', title: locale === 'ar' ? 'دعم صحي غير طبي' : locale === 'en' ? 'Non-medical health-adjacent support' : 'Accompagnement santé non médical', icon: ShieldCheck, href: `/angelcare-marketplace/${locale}/health-partners`, tone: 'health' },
    { key: 'corporate', title: locale === 'ar' ? 'الشركات والموارد البشرية' : locale === 'en' ? 'Corporate & HR' : 'Corporate & RH', icon: UsersRound, href: `/angelcare-marketplace/${locale}/corporates`, tone: 'corporate' },
  ]

  return <div className={styles.storefront} dir={rtl ? 'rtl' : 'ltr'}>
    <nav className={styles.categoryBar} aria-label={c.navigation}>
      <Link className={styles.allCategories} href={`/angelcare-marketplace/${locale}/marketplace`}><PackageOpen size={17}/>{c.navigation}</Link>
      <div className={styles.categoryScroll}>{experience.categories.slice(0, 10).map((category) => <Link key={category.id} href={`/angelcare-marketplace/${locale}/marketplace?category=${encodeURIComponent(category.category_key)}`} onClick={() => track({ event_name: 'category.opened', locale, category_key: category.category_key, route: `/angelcare-marketplace/${locale}/marketplace` })}>{category.title}<span>{category.item_count}</span></Link>)}</div>
    </nav>

    <section className={styles.heroTheatre}>
      <div className={styles.heroBackdrop}>{campaigns.map((campaign, index) => <CampaignVisual key={campaign.id} campaign={campaign} active={index === campaignIndex}/>)}</div>
      <div className={styles.heroShade}/>
      <div className={styles.heroContent}>
        {activeCampaign ? <>
          <span className={styles.heroEyebrow}><Sparkles size={14}/>{activeCampaign.eyebrow || c.marketplace}</span>
          <h1>{activeCampaign.title}</h1>
          <p>{activeCampaign.subtitle}</p>
          <div className={styles.heroActions}><Link className={styles.heroPrimary} href={activeCampaign.primary_cta_href} onClick={() => track({ event_name: 'hero.clicked', locale, campaign_id: activeCampaign.id, route: activeCampaign.primary_cta_href })}>{activeCampaign.primary_cta_label}<ArrowRight size={18}/></Link>{activeCampaign.secondary_cta_href ? <Link className={styles.heroSecondary} href={activeCampaign.secondary_cta_href}>{activeCampaign.secondary_cta_label}<Play size={15}/></Link> : null}</div>
        </> : <><span className={styles.heroEyebrow}>{c.marketplace}</span><h1>{c.noCampaign}</h1></>}
      </div>
      {campaigns.length > 1 ? <div className={styles.heroControls}><button type="button" onClick={() => setCampaignIndex((campaignIndex - 1 + campaigns.length) % campaigns.length)} aria-label="Previous"><ChevronLeft/></button><div>{campaigns.map((campaign, index) => <button type="button" key={campaign.id} data-active={index === campaignIndex} onClick={() => setCampaignIndex(index)} aria-label={`Campaign ${index + 1}`}/>)}</div><button type="button" onClick={() => setCampaignIndex((campaignIndex + 1) % campaigns.length)} aria-label="Next"><ChevronRight/></button></div> : null}

      <form className={styles.searchDock} onSubmit={submitSearch}>
        <label className={styles.searchMain}><Search size={21}/><span><small>{c.marketplace}</small><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder={c.searchPlaceholder} aria-label={c.searchPlaceholder}/></span></label>
        <label><UsersRound size={19}/><span><small>{c.audience}</small><select value={audience} onChange={(event: ChangeEvent<HTMLSelectElement>) => setAudience(event.target.value as typeof audience)}><option value="family">{c.families}</option><option value="organization">{c.organizations}</option><option value="professional">{c.professionals}</option></select></span></label>
        <label><MapPin size={19}/><span><small>{c.location}</small><select defaultValue={experience.territory?.territory_code || 'MA-MASTER'}><option value={experience.territory?.territory_code || 'MA-MASTER'}>{experience.territory?.name || 'Morocco'}</option></select></span></label>
        <label><CalendarDays size={19}/><span><small>{c.date}</small><input type="date" value={date} onChange={(event: ChangeEvent<HTMLInputElement>) => setDate(event.target.value)}/></span></label>
        <button type="submit"><Search size={20}/>{c.search}</button>
      </form>
    </section>

    <div className={styles.livePulse}><span><span className={styles.pulseDot}/>{c.livePulse}</span><div><Link href={`/angelcare-marketplace/${locale}/marketplace`}>{experience.featuredItems.length} {locale === 'ar' ? 'عروض مميزة' : locale === 'en' ? 'featured offers' : 'offres mises en avant'}</Link><Link href={`/angelcare-marketplace/${locale}/academy`}>{experience.academyCohorts.length} {locale === 'ar' ? 'دفعات أكاديمية' : locale === 'en' ? 'academy cohorts' : 'cohortes Academy'}</Link><Link href={`/angelcare-marketplace/${locale}/trust`}>{experience.trustSignals.length} {locale === 'ar' ? 'إشارات ثقة عامة' : locale === 'en' ? 'public trust signals' : 'preuves publiques actives'}</Link></div></div>

    <main className={styles.marketMain} ref={mainRef}>
      <section className={styles.audienceGateway} data-section-key="audience-gateway">{audienceCards.map(({ key, title, icon: Icon, text: description, href }, index) => <Link key={key} href={href} className={styles.audienceCard} data-tone={key} onMouseEnter={() => setAudience(key)}><div className={styles.audienceNumber}>0{index + 1}</div><Icon size={28}/><h2>{title}</h2><p>{description}</p><span>{c.open}<ArrowRight size={17}/></span></Link>)}</section>

      <section className={styles.categoryExchange} data-section-key="category-mosaic">
        <div className={styles.sectionHeading}><div><span>MEGA MARKETPLACE DIRECTORY</span><h2>{c.categories}</h2><p>{c.categoriesLead}</p></div><Link href={`/angelcare-marketplace/${locale}/marketplace`}>{c.viewAll}<ArrowRight size={16}/></Link></div>
        <div className={styles.categoryMosaic}>{experience.categories.slice(0, 9).map((category, index) => <Link key={category.id} href={`/angelcare-marketplace/${locale}/marketplace?category=${category.category_key}`} className={styles.categoryTile} data-size={index === 0 || index === 5 ? 'large' : index === 1 || index === 6 ? 'wide' : 'standard'} data-theme={category.visual_theme}><img src={category.cover_asset_url || '/angelcare-marketplace/homepage/category-universal.svg'} alt="" loading="lazy"/><div><span>{category.item_count} {locale === 'ar' ? 'عرض' : locale === 'en' ? 'offers' : 'offres'}</span><h3>{category.title}</h3><p>{category.short_description}</p><b>{c.open}<ArrowRight size={15}/></b></div></Link>)}</div>
      </section>

      <Rail sectionKey="featured-products" title={c.featured} subtitle={c.featuredLead} items={experience.featuredItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/>
      <Rail sectionKey="best-picks" title={c.topPicks} items={topItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/>
      <Rail sectionKey="territory-picks" title={c.territory} items={territoryItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/>
      <Rail sectionKey="available-now" title={c.availableNow} items={experience.availableItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/>

      {experience.popularItems.length ? <Rail sectionKey="popular-now" title={locale === 'ar' ? 'الأكثر رواجاً' : locale === 'en' ? 'Popular now' : 'Populaires maintenant'} items={experience.popularItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/> : null}
      {experience.newArrivalItems.length ? <Rail sectionKey="new-arrivals" title={locale === 'ar' ? 'وصل حديثاً' : locale === 'en' ? 'New arrivals' : 'Nouveautés'} items={experience.newArrivalItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/> : null}

      <section className={styles.familyShowcase} data-section-key="family-services">
        <div className={styles.showcaseVisual}><img src="/angelcare-marketplace/homepage/family-showcase.svg" alt="" loading="lazy"/><div className={styles.visualSeal}><ShieldCheck size={21}/><span>ANGELCARE<br/>FAMILY JOURNEY</span></div></div>
        <div className={styles.showcaseBody}><span>FAMILY COMMERCE CONCIERGE</span><h2>{c.familyTitle}</h2><p>{c.familyLead}</p><div className={styles.needChips}>{['Garde à domicile','Accompagnement récurrent','Après-école','Vacances scolaires','Montessori','Événements'].map((label) => <Link key={label} href={`/angelcare-marketplace/${locale}/marketplace?q=${encodeURIComponent(label)}`}>{label}</Link>)}</div><div className={styles.showcaseActions}><Link href={`/angelcare-marketplace/${locale}/${locale === 'fr' ? 'familles' : 'families'}`}>{c.viewAll}<ArrowRight size={18}/></Link><Link href={`/angelcare-marketplace/${locale}/family/request`}>{c.continueJourney}</Link></div></div>
        <div className={styles.familyMiniRail}>{experience.familyItems.slice(0, 3).map((item) => <Link href={itemHref(item, locale)} key={item.id}><div>{item.media_url ? <img src={item.media_url} alt=""/> : <Sparkles/>}</div><span>{item.name}</span><strong>{priceLabel(item, locale)}</strong></Link>)}</div>
      </section>

      <Rail sectionKey="development-montessori" title={c.development} items={experience.developmentItems} locale={locale} saved={saved} compared={compared} toggle={toggle}/>

      <section className={styles.academyLive} data-section-key="academy">
        <div className={styles.academyIntro}><span>ANGELCARE ACADEMY LIVE</span><h2>{c.academy}</h2><p>{locale === 'ar' ? 'برامج وتدريب وشهادات مرتبطة فعليا بالأهلية المهنية.' : locale === 'en' ? 'Programs, cohorts and credentials connected to real professional eligibility.' : 'Programmes, cohortes et certifications réellement reliés à l’éligibilité professionnelle.'}</p><Link href={`/angelcare-marketplace/${locale}/academy`}>{c.viewAll}<ArrowRight size={17}/></Link></div>
        <div className={styles.cohortBoard}>{experience.academyCohorts.length ? experience.academyCohorts.slice(0, 4).map((cohort) => <Link href={`/angelcare-marketplace/${locale}/academy/programs/${cohort.course_slug}`} key={cohort.id}><div className={styles.cohortDate}><CalendarDays size={17}/><span>{cohort.starts_at ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(cohort.starts_at)) : '—'}</span></div><div><small>{cohort.delivery_mode}</small><h3>{cohort.course_title || cohort.name}</h3><p>{cohort.enrolled_count}/{cohort.capacity} {locale === 'ar' ? 'مسجل' : locale === 'en' ? 'enrolled' : 'inscrits'}</p></div><ArrowRight size={18}/></Link>) : experience.academyItems.slice(0, 4).map((item) => <Link href={itemHref(item, locale)} key={item.id}><BookOpenCheck size={24}/><div><small>{item.public_reference}</small><h3>{item.name}</h3><p>{item.short_description}</p></div><ArrowRight size={18}/></Link>)}</div>
      </section>

      <section className={styles.b2bExchange} data-section-key="b2b-verticals">
        <div className={styles.sectionHeading}><div><span>B2B VERTICAL EXCHANGE</span><h2>{c.organizationsTitle}</h2><p>{locale === 'ar' ? 'أربع تجارب تجارية متخصصة، كل واحدة مرتبطة بتشخيصها وبرامجها ومسارها التجاري.' : locale === 'en' ? 'Four purpose-built commercial universes, each connected to its own diagnostic, programs and conversion path.' : 'Quatre univers commerciaux dédiés, chacun relié à son diagnostic, ses programmes et son parcours de conversion.'}</p></div></div>
        <div className={styles.b2bGrid}>{b2b.map(({ key, title, icon: Icon, href, tone }, index) => { const count = experience.organizationItems.filter((item) => item.category_key === key).length; return <Link href={href} key={key} data-tone={tone}><div className={styles.b2bTop}><span>0{index + 1}</span><Icon size={28}/></div><h3>{title}</h3><p>{count} {locale === 'ar' ? 'حلول منشورة' : locale === 'en' ? 'published solutions' : 'solutions publiées'}</p><b>{c.open}<ArrowRight size={17}/></b></Link> })}</div>
      </section>

      <section className={styles.partnerShowcase} data-section-key="partner-os">
        <div className={styles.partnerCopy}><span>PARTNER OS · MULTI-TENANT SAAS</span><h2>{c.partnerOs}</h2><p>{locale === 'ar' ? 'خطط ووحدات وتهيئة المؤسسات ضمن منصة تشغيل واحدة.' : locale === 'en' ? 'Plans, modules and organization onboarding inside one operational SaaS platform.' : 'Plans, modules et onboarding institutionnel dans une seule plateforme SaaS opérationnelle.'}</p><Link href={`/angelcare-marketplace/${locale}/partner-os`}>{c.viewAll}<ArrowRight size={18}/></Link></div>
        <div className={styles.planGrid}>{experience.partnerPlans.slice(0, 3).map((plan, index) => <article key={plan.id} data-featured={index === 1}><div className={styles.planHead}><span>{plan.plan_key}</span>{index === 1 ? <Star size={17} fill="currentColor"/> : null}</div><h3>{plan.name}</h3><p>{plan.description}</p><ul>{plan.modules.slice(0, 5).map((module) => <li key={module}><Check size={14}/>{module.replaceAll('_',' ')}</li>)}</ul><div><strong>{plan.base_price === null ? c.quote : `${plan.base_price} ${plan.currency_label}`}</strong><Link href={`/angelcare-marketplace/${locale}/partner-os/contact`}>{c.open}<ArrowRight size={15}/></Link></div></article>)}</div>
      </section>

      <section className={styles.trustAuthority} data-section-key="trust-evidence">
        <div className={styles.trustIntro}><span>TRUST & QUALITY AUTHORITY</span><h2>{c.trust}</h2><p>{locale === 'ar' ? 'لا تظهر أي شارة إلا إذا كانت مرتبطة بدليل صالح ونشر معتمد.' : locale === 'en' ? 'No badge appears unless it is connected to current evidence and approved public wording.' : 'Aucun badge n’apparaît sans preuve en cours de validité et formulation publique approuvée.'}</p><Link href={`/angelcare-marketplace/${locale}/trust`}>{c.trustCenter}<ArrowRight size={17}/></Link></div>
        <div className={styles.trustGrid}>{experience.trustSignals.length ? experience.trustSignals.map((signal) => <Link key={signal.id} href={`/angelcare-marketplace/${locale}/trust/verification/${signal.verification_reference}`}><BadgeCheck size={30}/><h3>{signal.name}</h3><p>{signal.public_claims.join(' · ') || signal.verification_reference}</p><span>{signal.valid_until ? new Intl.DateTimeFormat(locale).format(new Date(signal.valid_until)) : '—'}</span></Link>) : <><Link href={`/angelcare-marketplace/${locale}/trust/quality`}><ClipboardCheck size={30}/><h3>Quality Check 360</h3><p>{locale === 'ar' ? 'أطر تقييم وأدلة وإجراءات تصحيحية.' : locale === 'en' ? 'Assessment frameworks, evidence and corrective action.' : 'Référentiels, preuves et actions correctives.'}</p></Link><Link href={`/angelcare-marketplace/${locale}/trust/providers`}><ShieldCheck size={30}/><h3>{locale === 'ar' ? 'منهجية التحقق' : locale === 'en' ? 'Verification methodology' : 'Méthode de vérification'}</h3><p>{c.noBadge}</p></Link><Link href={`/angelcare-marketplace/${locale}/trust/complaints`}><UsersRound size={30}/><h3>{locale === 'ar' ? 'مسار الشكايات' : locale === 'en' ? 'Complaint pathway' : 'Parcours réclamation'}</h3><p>{locale === 'ar' ? 'استلام، تحقيق، حل وتتبع.' : locale === 'en' ? 'Intake, investigation, resolution and traceability.' : 'Réception, investigation, résolution et traçabilité.'}</p></Link></>}</div>
      </section>

      <section className={styles.territoryAtlas} data-section-key="territory-atlas">
        <div className={styles.atlasMap}><div className={styles.mapShape}/>{experience.territory?.cities.map((city, index) => <span key={city.id} style={{ '--x': `${18 + (index * 19) % 68}%`, '--y': `${20 + (index * 27) % 62}%` } as CSSProperties} data-status={city.coverage_status}><i/>{city.city_name}</span>)}</div>
        <div className={styles.atlasCopy}><span>TERRITORY OS · LIVE SCOPE</span><h2>{c.atlas}</h2><div className={styles.territoryIdentity}><MapPin size={24}/><div><strong>{experience.territory?.name || 'Morocco'}</strong><small>{experience.territory?.territory_code || 'MA-MASTER'} · {experience.territory?.currency_label || 'Dh'} · {experience.territory?.status || 'configuration'}</small></div></div><div className={styles.readiness}><div><span>{locale === 'ar' ? 'جاهزية النطاق' : locale === 'en' ? 'Territory readiness' : 'Readiness territoire'}</span><b>{experience.territory?.readiness_score || 0}%</b></div><i><span style={{ width: `${experience.territory?.readiness_score || 0}%` }}/></i></div>{experience.territory?.cities.length ? <div className={styles.cityList}>{experience.territory.cities.map((city) => <span key={city.id}>{city.city_name}<b>{city.coverage_status}</b></span>)}</div> : <p className={styles.cityPending}>{c.cityPending}</p>}<Link href={`/angelcare-marketplace/${locale}/marketplace?territory=${experience.territory?.territory_code || 'MA-MASTER'}`}>{c.viewAll}<ArrowRight size={17}/></Link></div>
      </section>

      {experience.composition.filter((section) => section.section_type.startsWith('custom_')).map((section) => <section key={section.id} data-section-key={section.section_key} className={styles.customCommerceSection} data-accent={section.accent} data-background={section.background_variant}><div className={styles.sectionHeading}><div><span>ANGELCARE EDITORIAL COMMERCE</span><h2>{section.title}</h2>{section.subtitle ? <p>{section.subtitle}</p> : null}</div></div>{section.items.length ? <div className={styles.itemRail}>{section.items.slice(0, Number(section.settings.item_limit || 12)).map((item) => <ItemCard key={item.id} item={item} locale={locale} saved={saved.has(item.id)} compared={compared.has(item.id)} onSave={() => toggle('saved', item)} onCompare={() => toggle('compare', item)}/>)}</div> : <div className={styles.customEditorialBody}>{String(section.settings.body || '')}</div>}</section>)}

      <section className={styles.finalCommerceBand} data-section-key="final-commerce-band"><div><span>ANGELCARE MARKETPLACE</span><h2>{locale === 'ar' ? 'ابدأ من الحاجة. تابع حتى التنفيذ.' : locale === 'en' ? 'Start with the need. Continue through execution.' : 'Partez du besoin. Continuez jusqu’à l’exécution.'}</h2><p>{locale === 'ar' ? 'بحث، مقارنة، طلب عرض، تشخيص، تأهيل ومتابعة ضمن نفس النظام.' : locale === 'en' ? 'Search, compare, request a quote, qualify and continue inside the same operating system.' : 'Recherchez, comparez, demandez un devis, qualifiez et continuez dans le même système opérationnel.'}</p></div><div><Link href={`/angelcare-marketplace/${locale}/marketplace`}><ShoppingBag size={20}/>{c.viewAll}</Link><Link href={`/angelcare-marketplace/${locale}/contact`}>{c.continueJourney}<ArrowRight size={18}/></Link></div></section>
    </main>

    <aside className={styles.floatingCommerce} aria-label="Marketplace quick actions"><Link href={`/angelcare-marketplace/${locale}/marketplace?saved=1`}><Heart size={18}/><span>{saved.size}</span></Link><Link href={`/angelcare-marketplace/${locale}/marketplace?compare=1`}><GitCompareArrows size={18}/><span>{compared.size}</span></Link><Link href={`/angelcare-marketplace/${locale}/quote-basket`}><ShoppingBag size={18}/></Link></aside>
  </div>
}
