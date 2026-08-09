'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown, ChevronLeft, ChevronRight, Command, Menu, PanelLeftClose, PanelLeftOpen,
  Plus, Search, Settings2, Sparkles, X,
} from 'lucide-react'
import { FLASHCARDS_STUDIO_NAVIGATION, flashcardsWorkspaceIdentity } from '@/lib/flashcards-os/studio-navigation'
import FlashcardsCommandPalette from './FlashcardsCommandPalette'
import FlashcardsProductPulse from './FlashcardsProductPulse'
import styles from './flashcards-studio-2030.module.css'

function isActive(pathname: string, href: string, exact = false) {
  const clean = href.split('?')[0]
  return exact ? pathname === clean : pathname === clean || pathname.startsWith(`${clean}/`)
}

export default function FlashcardsStudioFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [compact, setCompact] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [palette, setPalette] = useState(false)
  const [focus, setFocus] = useState(false)
  const [density, setDensity] = useState<'compact'|'standard'|'comfortable'>('standard')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(FLASHCARDS_STUDIO_NAVIGATION.map((group) => [group.key, true])))
  const identity = useMemo(() => flashcardsWorkspaceIdentity(pathname), [pathname])

  const [preferencesLoaded,setPreferencesLoaded]=useState(false)
  useEffect(() => {
    const stored = window.localStorage.getItem('flashcards-os-studio-preferences')
    if (stored) try { const value = JSON.parse(stored); setCompact(Boolean(value.compact)); setFocus(Boolean(value.focus)); if (['compact','standard','comfortable'].includes(value.density)) setDensity(value.density) } catch {}
    fetch('/api/flashcards-os/px/preferences',{cache:'no-store'}).then((response)=>response.ok?response.json():null).then((payload)=>{const value=payload?.value;if(value){setCompact(Boolean(value.compact));setFocus(Boolean(value.focus));if(['compact','standard','comfortable'].includes(value.density))setDensity(value.density)}}).finally(()=>setPreferencesLoaded(true))
  }, [])
  useEffect(() => { if(!preferencesLoaded)return;const value={compact,focus,density};window.localStorage.setItem('flashcards-os-studio-preferences',JSON.stringify(value));const timer=window.setTimeout(()=>{fetch('/api/flashcards-os/px/preferences',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({value})}).catch(()=>null)},400);return()=>window.clearTimeout(timer) }, [compact, focus, density,preferencesLoaded])
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(true) }
      if (event.key === 'Escape') { setPalette(false); setMobile(false) }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [])

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const q = String(data.get('q') || '').trim()
    if (q) router.push(`/flashcards-os/product/collections?q=${encodeURIComponent(q)}`)
  }

  return <section className={styles.studio} data-compact={compact} data-focus={focus} data-density={density} data-accent={identity.accent}>
    <aside className={`${styles.sidebar} ${mobile ? styles.sidebarMobileOpen : ''}`}>
      <div className={styles.brandCorner}>
        <Link href="/flashcards-os" aria-label="ANGELCARE Flashcards OS"><img src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="ANGELCARE"/><span><strong>Flashcards OS</strong><small>Product & Learning Studio</small></span></Link>
        <button type="button" className={styles.mobileClose} onClick={() => setMobile(false)}><X size={17}/></button>
      </div>
      <button type="button" className={styles.collapseButton} onClick={() => setCompact((value) => !value)}>{compact ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}<span>{compact ? 'Étendre' : 'Réduire le studio'}</span></button>
      <nav className={styles.sidebarNavigation} aria-label="Navigation Flashcards Product & Learning Studio">
        {FLASHCARDS_STUDIO_NAVIGATION.map((group) => <section key={group.key}>
          <button type="button" className={styles.groupButton} onClick={() => setExpanded((value) => ({ ...value, [group.key]: !value[group.key] }))}><span>{group.label}</span><ChevronDown size={13} data-open={expanded[group.key]}/></button>
          {expanded[group.key] ? <div className={styles.groupItems}>{group.items.map((item) => { const Icon = item.icon; const active = isActive(pathname, item.href, item.exact); return <Link href={item.href} key={item.href} className={active ? styles.navItemActive : ''} data-accent={item.accent} title={compact ? item.label : item.description} onClick={() => setMobile(false)}><span className={styles.navIcon}><Icon size={17}/></span><span className={styles.navCopy}><strong>{item.shortLabel}</strong><small>{item.description}</small></span>{active ? <i/> : null}</Link> })}</div> : null}
        </section>)}
      </nav>
      <div className={styles.sidebarFooter}><span><i/> Catalogue local connecté</span><Link href="/flashcards-os/intelligence/control/providers"><Settings2 size={15}/><span>OpenRouter Free</span></Link></div>
    </aside>

    {mobile ? <button type="button" className={styles.mobileBackdrop} onClick={() => setMobile(false)} aria-label="Fermer le menu"/> : null}

    <div className={styles.workspace}>
      <header className={styles.overhead}>
        <div className={styles.overheadLeft}><button type="button" className={styles.mobileMenu} onClick={() => setMobile(true)}><Menu size={18}/></button><div className={styles.breadcrumb}><span>ANGELCARE</span><ChevronRight size={12}/><span>FLASHCARDS OS</span><ChevronRight size={12}/><strong>{identity.label}</strong></div><div><h1>{identity.label}</h1><p>{identity.description}</p></div></div>
        <form className={styles.globalSearch} onSubmit={search}><Search size={16}/><input name="q" placeholder="Collection, code, client, document…"/><button type="button" onClick={() => setPalette(true)}><Command size={14}/> K</button></form>
        <div className={styles.overheadActions}>
          <select value={density} onChange={(event: any) => setDensity(event.target.value as any)} aria-label="Densité"><option value="compact">Compact</option><option value="standard">Standard</option><option value="comfortable">Confort</option></select>
          <button type="button" onClick={() => setFocus((value) => !value)} className={focus ? styles.focusActive : ''}><Sparkles size={15}/><span>{focus ? 'Quitter focus' : 'Focus Studio'}</span></button>
          <Link href="/flashcards-os/product/collections?create=1" className={styles.primaryAction}><Plus size={16}/><span>Créer</span></Link>
        </div>
      </header>
      <FlashcardsProductPulse hidden={focus}/>
      <main className={styles.canvas}>{children}</main>
    </div>
    <FlashcardsCommandPalette open={palette} onClose={() => setPalette(false)}/>
  </section>
}
