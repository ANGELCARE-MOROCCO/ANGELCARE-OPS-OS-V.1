'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Grid2X2, Heart, Pause, Play, X } from 'lucide-react'
import Link from 'next/link'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import { FAMILY_ATOMIC_STORIES } from '../contract'
import { FAMILY_CHAPTERS, FAMILY_SERVICE_SECTIONS, familyDisplayLabel, familyLabel, familyRequestHref, familyWords } from '../experience'
import { FAMILY_EDITORIAL_MEDIA, FAMILY_HERO_MEDIA } from '../media'
import styles from './families-storefront.module.css'

export function FamiliesNavigation({ locale, extraSections = [] }: { locale: CatalogLocale; extraSections?: typeof FAMILY_SERVICE_SECTIONS }) {
  const [active, setActive] = useState('family-needs')
  const [progress, setProgress] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const sections = ['family-needs', ...FAMILY_CHAPTERS.map(chapter => 'family-' + chapter.key), 'family-collections', 'family-guidance'].map(id => document.getElementById(id)).filter((node): node is HTMLElement => !!node)
    let frame = 0
    const world=document.querySelector<HTMLElement>('[data-ac-families-storefront]')
    const headers=[...document.querySelectorAll<HTMLElement>('header,nav')].filter(node=>!world?.contains(node)&&getComputedStyle(node).position==='sticky')
    let stickyOffset=0
    const measure=()=>{stickyOffset=headers.reduce((height,node)=>{const top=parseFloat(getComputedStyle(node).top)||0;const rect=node.getBoundingClientRect();const visibleForms=[...node.querySelectorAll<HTMLElement>('form')].filter(form=>form.getClientRects().length);const extent=Math.max(node.offsetHeight,...visibleForms.map(form=>form.getBoundingClientRect().bottom-rect.top));return Math.max(height,extent+top)},0);world?.style.setProperty('--family-sticky-offset',stickyOffset+'px')}
    const resize=new ResizeObserver(measure);headers.forEach(node=>resize.observe(node));measure()
    const update = () => {
      frame = 0
      const current = sections.filter(node => node.getBoundingClientRect().top <= stickyOffset+110).at(-1)
      setActive(current?.id || 'family-needs')
      const world = document.querySelector<HTMLElement>('[data-ac-families-storefront]')
      if (world) {
        const top = world.getBoundingClientRect().top + scrollY
        setProgress(Math.max(0, Math.min(1, (scrollY - top) / Math.max(1, world.offsetHeight - innerHeight))))
      }
    }
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const viewportResize = () => { measure(); scroll() }
    addEventListener('scroll', scroll, { passive: true }); addEventListener('resize', viewportResize)
    update()
    return () => { removeEventListener('scroll', scroll); removeEventListener('resize', viewportResize); cancelAnimationFrame(frame); resize.disconnect() }
  }, [])
  const close = () => dialog.current?.close()
  const navigation = [{ key: 'family-needs', label: familyWords(['Explorer', 'Explore', 'استكشفوا'], locale) }, ...FAMILY_CHAPTERS.map(chapter => ({ key: 'family-' + chapter.key, label: familyWords(chapter.title, locale) })), { key: 'family-collections', label: familyWords(['Collections', 'Collections', 'مجموعات'], locale) }, { key: 'family-guidance', label: familyWords(['Être accompagné', 'Get guidance', 'المرافقة'], locale) }]
  return <>
    <nav className={styles.pageNav} aria-label={familyWords(['Navigation Familles', 'Families navigation', 'تنقل الأسرة'], locale)}>
      <div className={styles.navInner}>
        <button type="button" className={styles.universesButton} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog"><Grid2X2 size={17} /><span>{familyWords(['16 univers', '16 universes', '16 عالمًا'], locale)}</span></button>
        <div className={styles.navLinks}>{navigation.map(link => <a key={link.key} href={'#' + link.key} aria-current={active === link.key ? 'location' : undefined}>{link.label}</a>)}</div>
        <Link className={styles.navHelp} href={familyRequestHref(locale)}><Heart size={16} /><span>{familyWords(['Mon besoin', 'My need', 'احتياجي'], locale)}</span></Link>
      </div>
      <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: progress * 100 + '%' }} /></div>
    </nav>
    <dialog ref={dialog} className={styles.universeDialog} aria-labelledby="family-dialog-title" onClick={event => { if (event.target === event.currentTarget) close() }}>
      <div className={styles.dialogHeader}><div><small>ANGELCARE · FAMILIES</small><h2 id="family-dialog-title">{familyWords(['Votre univers famille', 'Your family universe', 'عالم أسرتكم'], locale)}</h2></div><button type="button" onClick={close} aria-label={familyWords(['Fermer', 'Close', 'إغلاق'], locale)}><X /></button></div>
      <div className={styles.dialogGrid}>{FAMILY_ATOMIC_STORIES.map(story => <a href={'#' + story.anchor} key={story.schemaKey} onClick={close}><img src={FAMILY_EDITORIAL_MEDIA[story.schemaKey]} alt="" width={120} height={90} loading="lazy" /><strong>{familyLabel(story.schemaKey, locale)}</strong><ArrowRight size={15} /></a>)}</div>
      {extraSections.length ? <div className={styles.serviceShortcuts}>{extraSections.map(section => <a href={'#' + section.anchor} key={section.key} onClick={close}><strong>{familyDisplayLabel(section.key, locale)}</strong><ArrowRight size={15} /></a>)}</div> : null}
    </dialog>
  </>
}

export function FamiliesHero({ locale, published }: { locale: CatalogLocale; published: number }) {
  const [index, setIndex] = useState(0)
  const [auto, setAuto] = useState(true)
  const [interaction, setInteraction] = useState(false)
  const [reduced, setReduced] = useState(false)
  const slides = [
    { image: FAMILY_HERO_MEDIA, title: ['Les petits moments font les grandes familles.', 'Small moments make great family memories.', 'اللحظات الصغيرة تصنع ذكريات الأسرة.'] as const, href: '#family-care' },
    { image: FAMILY_EDITORIAL_MEDIA['montessori-home-service'], title: ['Leur curiosité mérite de nouveaux horizons.', 'Their curiosity deserves new horizons.', 'فضولهم يستحق آفاقًا جديدة.'] as const, href: '#family-learn' },
    { image: FAMILY_EDITORIAL_MEDIA['montessori-development-kit'], title: ['Jouer ensemble. Grandir ensemble.', 'Play together. Grow together.', 'العبوا معًا وانموا معًا.'] as const, href: '#family-play' },
  ]
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!auto || reduced || interaction) return
    const timer = setInterval(() => { if (!document.hidden) setIndex(value => (value + 1) % 3) }, 6500)
    return () => clearInterval(timer)
  }, [auto, interaction, reduced])
  const select = (value: number) => { setAuto(false); setIndex((value + 3) % 3) }
  return <section className={styles.hero} id="family-top">
    <div className={styles.heroCopy}><span className={styles.eyebrow}><Heart size={15} /> ANGELCARE · FAMILIES</span>
      <h1>{familyWords(['Le bonheur de grandir. La liberté de souffler.', 'The joy of growing. The freedom to breathe.', 'فرحة النمو وراحة البال.'], locale)}</h1>
      <p>{familyWords(['Des relais pour votre quotidien. Des découvertes pour vos enfants. Tout un univers pour avancer en famille.', 'Support for everyday life. Discoveries for your children. A whole universe to move forward as a family.', 'دعم لحياتكم اليومية واكتشافات لأطفالكم وعالم متكامل للتقدم كأسرة.'], locale)}</p>
      <div className={styles.heroActions}><a href="#family-needs">{familyWords(['Trouver mon point de départ', 'Find my starting point', 'ابحثوا عن نقطة البداية'], locale)}<ArrowRight size={17} /></a><Link href={familyRequestHref(locale)}>{familyWords(['Aidez-moi à choisir', 'Help me choose', 'ساعدوني على الاختيار'], locale)}</Link></div>
      <div className={styles.heroSignals}><span><strong>16</strong>{familyWords(['univers famille', 'family universes', 'عالمًا عائليًا'], locale)}</span>{published > 0 ? <span><strong>{published}</strong>{familyWords(['offres publiées', 'published offers', 'عروض منشورة'], locale)}</span> : null}<span>{familyWords(['Services · Jeux · Découvertes', 'Care · Play · Discovery', 'رعاية ولعب واكتشاف'], locale)}</span></div>
    </div>
    <div className={styles.heroMedia} onMouseEnter={() => setInteraction(true)} onMouseLeave={() => setInteraction(false)} onFocusCapture={() => setInteraction(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setInteraction(false) }}>
      {slides.map((slide, i) => <img key={slide.image} className={styles.heroPhoto} data-active={i === index} src={slide.image} alt="" width={1536} height={1024} loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} aria-hidden={i !== index} />)}
      <div className={styles.heroVisualCopy}><small>{familyWords(['INSPIRATIONS FAMILLE', 'FAMILY INSPIRATION', 'إلهام للأسرة'], locale)}</small><strong>{familyWords(slides[index].title, locale)}</strong><a href={slides[index].href}>{familyWords(['Explorer', 'Explore', 'استكشفوا'], locale)}<ArrowRight size={14} /></a></div>
      <div className={styles.heroControls}>
        <button type="button" onClick={() => select(index - 1)} aria-label={familyWords(['Image précédente', 'Previous image', 'الصورة السابقة'], locale)}><ChevronLeft size={17} /></button>
        <div>{slides.map((slide, i) => <button type="button" key={slide.image} onClick={() => select(i)} aria-label={familyWords(['Inspiration ', 'Inspiration ', 'إلهام '], locale) + (i + 1)} aria-pressed={i === index} />)}</div>
        <button type="button" onClick={() => select(index + 1)} aria-label={familyWords(['Image suivante', 'Next image', 'الصورة التالية'], locale)}><ChevronRight size={17} /></button>
        {!reduced ? <button type="button" onClick={() => setAuto(value => !value)} aria-label={auto ? familyWords(['Suspendre le diaporama', 'Pause slideshow', 'إيقاف العرض'], locale) : familyWords(['Reprendre le diaporama', 'Resume slideshow', 'استئناف العرض'], locale)}>{auto ? <Pause size={15} /> : <Play size={15} />}</button> : null}
      </div>
    </div>
    <aside className={styles.heroDecision}><small>{familyWords(['QU’EST-CE QUI VOUS FERAIT DU BIEN ?', 'WHAT WOULD HELP YOUR FAMILY?', 'ما الذي تحتاجه أسرتكم؟'], locale)}</small>
      {[
        { key: 'home-childcare-one-time' as const, title: ['Un relais pour quelques heures', 'A few hours of support', 'دعم لبضع ساعات'] as const },
        { key: 'school-pickup-care' as const, title: ['Une sortie d’école sereine', 'An easier school pickup', 'استلام هادئ من المدرسة'] as const },
        { key: 'montessori-home-service' as const, title: ['Une activité pour découvrir', 'An activity to discover', 'نشاط للاكتشاف'] as const },
        { key: 'flashcards-learning-product' as const, title: ['De nouvelles idées pour jouer', 'New ideas for play', 'أفكار جديدة للعب'] as const },
      ].map(row => <a href={'#' + FAMILY_ATOMIC_STORIES.find(story => story.schemaKey === row.key)!.anchor} key={row.key}><img src={FAMILY_EDITORIAL_MEDIA[row.key]} alt="" width={80} height={80} /><div><strong>{familyWords(row.title, locale)}</strong><span>{familyLabel(row.key, locale)}</span></div><ArrowRight size={15} /></a>)}
      <Link href={familyRequestHref(locale)} className={styles.decisionHelp}>{familyWords(['Parlons de votre besoin', 'Tell us what you need', 'حدثونا عن احتياجكم'], locale)}<ArrowRight size={16} /></Link>
    </aside>
  </section>
}
