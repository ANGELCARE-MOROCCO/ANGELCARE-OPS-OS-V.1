'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Layers3, Plus, Search, Settings2 } from 'lucide-react'
import { DELIVERY_NAVIGATION, FLASHCARDS_MASTER_UNIVERSES, INTELLIGENCE_NAVIGATION, PRODUCT_NAVIGATION, PRODUCTION_NAVIGATION, REVENUE_NAVIGATION, SOLUTIONS_NAVIGATION } from '@/lib/flashcards-os/navigation'
import styles from './flashcards-os.module.css'

function universeActive(pathname: string, href: string) {
  if (href === '/flashcards-os') return pathname === href
  return pathname.startsWith(href)
}

export default function FlashcardsOSShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const productContext = pathname.startsWith('/flashcards-os/product') || pathname.startsWith('/flashcards-os/governance')
  const intelligenceContext = pathname.startsWith('/flashcards-os/intelligence')
  const productionContext = pathname.startsWith('/flashcards-os/intelligence/production-commands') || pathname.startsWith('/flashcards-os/product/external-production')
  const deliveryContext = pathname.startsWith('/flashcards-os/delivery')
  const solutionsContext = pathname.startsWith('/flashcards-os/solutions')
  const revenueContext = pathname.startsWith('/flashcards-os/revenue')

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const query = String(form.get('q') || '').trim()
    if (query) router.push(`/flashcards-os/product/collections?q=${encodeURIComponent(query)}`)
  }

  return (
    <section className={styles.shell} data-flashcards-os-shell>
      <header className={styles.topRail}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/flashcards-os" aria-label="ANGELCARE Flashcards OS">
            <span className={styles.brandMark}><Layers3 size={22} strokeWidth={2.4} /></span>
            <span className={styles.brandText}>
              <span className={styles.brandEyebrow}>ANGELCARE · Product Enterprise</span>
              <span className={styles.brandTitle}>Flashcards OS</span>
            </span>
          </Link>

          <form className={styles.searchBox} onSubmit={submitSearch}>
            <Search size={17} />
            <input name="q" aria-label="Recherche Flashcards OS" placeholder="Rechercher une collection, un code, une catégorie…" />
            <span className={styles.searchHint}>⌘ K</span>
          </form>

          <div className={styles.topActions}>
            <button className={styles.iconButton} type="button" title="Centre de décisions"><Bell size={17} /></button>
            <button className={styles.iconButton} type="button" title="Configuration Flashcards OS"><Settings2 size={17} /></button>
            <Link className={styles.actionButton} href={productionContext ? '/flashcards-os/intelligence/production-commands/new' : revenueContext ? '/flashcards-os/revenue/devis/new' : solutionsContext ? '/flashcards-os/solutions/composer' : intelligenceContext ? '/flashcards-os/intelligence/research/new' : deliveryContext ? '/flashcards-os/delivery/fulfilment' : '/flashcards-os/product/collections?create=1'}>
              <Plus size={16} /><span>{productionContext ? 'Nouvelle commande' : revenueContext ? 'Nouveau devis' : solutionsContext ? 'Nouvelle solution' : intelligenceContext ? 'Nouvelle mission' : deliveryContext ? 'Nouveau fulfilment' : 'Nouvelle collection'}</span>
            </Link>
          </div>
        </div>

        <nav className={styles.masterNav} aria-label="Univers Flashcards OS">
          {FLASHCARDS_MASTER_UNIVERSES.map((universe) => {
            const Icon = universe.icon
            const active = universeActive(pathname, universe.href)
            const className = [
              styles.masterItem,
              active ? styles.masterItemActive : '',
              !universe.active ? styles.masterItemLocked : '',
            ].filter(Boolean).join(' ')

            if (!universe.active) {
              return (
                <span className={className} key={universe.key} title={`${universe.description} · Ultra Mega ZIP ${universe.delivery}`}>
                  <span className={styles.masterIcon}><Icon size={17} /></span>
                  <span className={styles.masterCopy}>
                    <span className={styles.masterLabel}>{universe.label}</span>
                    <span className={styles.masterEyebrow}>{universe.eyebrow}</span>
                  </span>
                  <span className={styles.deliveryBadge}>U{universe.delivery}</span>
                </span>
              )
            }

            return (
              <Link className={className} href={universe.href} key={universe.key} title={universe.description}>
                <span className={styles.masterIcon}><Icon size={17} /></span>
                <span className={styles.masterCopy}>
                  <span className={styles.masterLabel}>{universe.label}</span>
                  <span className={styles.masterEyebrow}>{universe.eyebrow}</span>
                </span>
                <span className={styles.deliveryBadge}>U{universe.delivery}</span>
              </Link>
            )
          })}
        </nav>

        {productionContext ? (
          <div className={`${styles.contextBar} ${styles.intelligenceContextBar}`}>
            <nav className={styles.contextLinks} aria-label="Navigation Production Command">
              {PRODUCTION_NAVIGATION.map((item) => <Link className={`${styles.contextLink} ${pathname === item.href || pathname.startsWith(item.href + '/') ? styles.contextLinkActive : ''}`} href={item.href} key={item.href} title={item.description}>{item.label}</Link>)}
            </nav>
            <div className={styles.contextStatus}><span className={styles.statusDot} />UMZ3 · Design → Command → External Production</div>
          </div>
        ) : deliveryContext ? (
          <div className={styles.contextBar}>
            <nav className={styles.contextLinks} aria-label="Navigation Product Delivery">
              {DELIVERY_NAVIGATION.map((item) => <Link className={`${styles.contextLink} ${pathname === item.href || (item.href !== '/flashcards-os/delivery' && pathname.startsWith(item.href)) ? styles.contextLinkActive : ''}`} href={item.href} key={item.href} title={item.description}>{item.label}</Link>)}
            </nav>
            <div className={styles.contextStatus}><span className={styles.statusDot} />UMZ6 · Fulfilment → CX → Executive Control</div>
          </div>
        ) : revenueContext ? (
          <div className={`${styles.contextBar} ${styles.intelligenceContextBar}`}>
            <nav className={styles.contextLinks} aria-label="Navigation Revenue">
              {REVENUE_NAVIGATION.map((item) => <Link className={`${styles.contextLink} ${pathname === item.href || (item.href !== '/flashcards-os/revenue' && pathname.startsWith(item.href)) ? styles.contextLinkActive : ''}`} href={item.href} key={item.href} title={item.description}>{item.label}</Link>)}
            </nav>
            <div className={styles.contextStatus}><span className={styles.statusDot} />UMZ5 · CRM → Devis → Delivery → Invoice → Payment</div>
          </div>
        ) : solutionsContext ? (
          <div className={`${styles.contextBar} ${styles.intelligenceContextBar}`}>
            <nav className={styles.contextLinks} aria-label="Navigation Solutions">
              {SOLUTIONS_NAVIGATION.map((item) => <Link className={`${styles.contextLink} ${pathname === item.href || (item.href !== '/flashcards-os/solutions' && pathname.startsWith(item.href)) ? styles.contextLinkActive : ''}`} href={item.href} key={item.href} title={item.description}>{item.label}</Link>)}
            </nav>
            <div className={styles.contextStatus}><span className={styles.statusDot} />UMZ4 · Release → Scenario → Sellable / Journey</div>
          </div>
        ) : productContext ? (
          <div className={styles.contextBar}>
            <nav className={styles.contextLinks} aria-label="Navigation Product">
              {PRODUCT_NAVIGATION.map((item) => <Link className={`${styles.contextLink} ${pathname === item.href ? styles.contextLinkActive : ''}`} href={item.href} key={item.href} title={item.description}>{item.label}</Link>)}
            </nav>
            <div className={styles.contextStatus}><span className={styles.statusDot} />Foundation U1 · protected</div>
          </div>
        ) : intelligenceContext ? (
          <div className={`${styles.contextBar} ${styles.intelligenceContextBar}`}>
            <nav className={styles.contextLinks} aria-label="Navigation Intelligence">
              {INTELLIGENCE_NAVIGATION.map((item) => <Link className={`${styles.contextLink} ${pathname === item.href || (item.href !== '/flashcards-os/intelligence' && pathname.startsWith(item.href)) ? styles.contextLinkActive : ''}`} href={item.href} key={item.href} title={item.description}>{item.label}</Link>)}
            </nav>
            <div className={styles.contextStatus}><span className={styles.statusDot} />UMZ2 · Tavily → Evidence → OpenRouter</div>
          </div>
        ) : null}
      </header>
      <main className={styles.content}>{children}</main>
    </section>
  )
}
