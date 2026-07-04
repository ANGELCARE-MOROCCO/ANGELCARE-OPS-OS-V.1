import Link from 'next/link'
import { getMarketplaceTheme, listNavigation } from '@/lib/b2b-marketplace/repository'
import { QuoteCartProvider, StickyQuoteCart } from './QuoteCartProvider'
import MarketplaceLiveSyncListener from './MarketplaceLiveSyncListener'

export default async function PublicMarketplaceChrome({ children }: { children: React.ReactNode }) {
  const [theme, navigation] = await Promise.all([getMarketplaceTheme(), listNavigation()])
  const mainNav = navigation.filter((item) => item.location === 'main-horizontal').sort((a, b) => a.order - b.order)
  const mobileNav = navigation.filter((item) => item.location === 'mobile-horizontal').sort((a, b) => a.order - b.order)
  const footerQuick = navigation.filter((item) => item.location === 'footer-quick').sort((a, b) => a.order - b.order)
  const footerCommercial = navigation.filter((item) => item.location === 'footer-commercial').sort((a, b) => a.order - b.order)
  const mobileItems = mobileNav.length ? mobileNav : mainNav
  const logoWidth = Math.max(32, Math.min(theme.logoWidthPx || 52, 220))
  const logoHeight = Math.max(32, Math.min(theme.logoHeightPx || 52, 120))
  const showText = theme.logoDisplayMode !== 'symbol-only'
  const showLogo = theme.logoDisplayMode !== 'wordmark-only'
  const menuClass = theme.menuStyle === 'underline'
    ? 'hidden items-center gap-5 lg:flex'
    : 'hidden items-center gap-1 rounded-full border border-[#dbe6f3] bg-[#f7faff] p-1.5 shadow-inner lg:flex'
  const menuLinkClass = theme.menuStyle === 'underline'
    ? 'border-b-2 border-transparent px-1 py-3 text-sm font-black text-slate-700 transition hover:border-[#d8a84a] hover:text-[#092e63]'
    : 'rounded-full px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-white hover:text-[#092e63] hover:shadow-sm'

  return (
    <QuoteCartProvider>
      <MarketplaceLiveSyncListener />
      <div className="min-h-screen bg-[#f3f7fc] text-[#071120] selection:bg-[#d8e7ff] selection:text-[#071120]">
        <header className="sticky top-0 z-40 border-b border-[#dbe6f3]/80 bg-white/88 shadow-sm shadow-slate-200/50 backdrop-blur-2xl">
          {theme.announcementEnabled ? (
            <div style={{ backgroundColor: theme.announcementBackground || '#092e63', color: theme.announcementTextColor || '#ffffff' }}>
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-5 py-2 text-[11px] font-black uppercase tracking-[0.16em]">
                <div className="flex shrink-0 items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300" />{theme.announcementText}</div>
                <div className="hidden shrink-0 opacity-80 md:block">Catalogue réel • Devis wholesale • Prix de gros • Admin Studio synchronisé</div>
                {theme.announcementCtaHref ? <Link href={theme.announcementCtaHref} className="shrink-0 rounded-full bg-white/10 px-3 py-1 transition hover:bg-white/20">{theme.announcementCtaLabel || 'Découvrir'} →</Link> : null}
              </div>
            </div>
          ) : null}

          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3">
            <Link href="/b2b-marketplace" className="group flex min-w-0 items-center gap-3">
              {showLogo ? (
                <div className="flex items-center justify-center rounded-[20px] border border-[#dbe6f3] bg-white p-1 shadow-lg shadow-slate-200/70" style={{ width: logoWidth, height: logoHeight }}>
                  <img src={theme.logoUrl || '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png'} alt={theme.logoAlt || 'AngelCare'} className="h-full w-full object-contain" />
                </div>
              ) : null}
              {showText ? (
                <div className="min-w-0">
                  <div className="truncate text-sm font-black uppercase tracking-[0.32em]" style={{ color: theme.primaryColor || '#092e63' }}>AngelCare</div>
                  <div className="truncate text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">B2B Crèche Marketplace</div>
                </div>
              ) : null}
            </Link>

            <nav className={menuClass}>
              {mainNav.map((item) => (
                <Link key={item.id} href={item.href} className={menuLinkClass}>
                  {item.label}{item.badge ? <span className="ml-2 rounded-full bg-[#d8a84a]/15 px-2 py-0.5 text-[10px] text-[#8a5a08]">{item.badge}</span> : null}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Link href="/b2b-marketplace/search" className="rounded-full border border-[#dbe6f3] bg-white px-4 py-3 text-sm font-black text-[#092e63] shadow-sm transition hover:-translate-y-0.5">Recherche</Link>
              <Link href="/b2b-marketplace/request-quote" className="rounded-full px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5" style={{ backgroundColor: theme.primaryColor || '#092e63' }}>
                Demander un devis
              </Link>
            </div>
          </div>

          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
            {mobileItems.map((item) => (
              <Link key={item.id} href={item.href} className="shrink-0 rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        {children}

        <footer className="border-t border-[#dbe6f3] bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                {showLogo ? <div className="flex items-center justify-center rounded-2xl border border-[#dbe6f3] bg-white p-1 shadow-sm" style={{ width: Math.min(logoWidth, 58), height: Math.min(logoHeight, 58) }}><img src={theme.logoUrl || '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png'} alt={theme.logoAlt || 'AngelCare'} className="h-full w-full object-contain" /></div> : null}
                <div>
                  <div className="text-lg font-black" style={{ color: theme.primaryColor || '#092e63' }}>AngelCare B2B Marketplace</div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Catalogue public premium</div>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Showroom digital B2B pour crèches: produits, supports, formations, packs sur-mesure et demandes de prix de gros. Parcours public, sans paiement en ligne.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                {['Sans login', 'Devis B2B', 'Personnalisation', 'Catalogue réel', 'Prix de gros'].map((tag) => <span key={tag} className="rounded-full bg-[#f4f7fb] px-3 py-1.5">{tag}</span>)}
              </div>
            </div>
            <div className="text-sm text-slate-600">
              <div className="mb-3 font-black uppercase tracking-[0.14em] text-slate-900">Accès rapide</div>
              {(footerQuick.length ? footerQuick : mainNav.slice(0, 4)).map((item) => <Link key={item.id} className="block py-1.5 transition hover:text-[#092e63]" href={item.href}>{item.label}</Link>)}
            </div>
            <div className="text-sm text-slate-600">
              <div className="mb-3 font-black uppercase tracking-[0.14em] text-slate-900">Commercial</div>
              {(footerCommercial.length ? footerCommercial : mainNav.slice(-3)).map((item) => <Link key={item.id} className="block py-1.5 transition hover:text-[#092e63]" href={item.href}>{item.label}</Link>)}
            </div>
          </div>
        </footer>
        {theme.stickyQuoteEnabled !== false ? <StickyQuoteCart /> : null}
      </div>
    </QuoteCartProvider>
  )
}
