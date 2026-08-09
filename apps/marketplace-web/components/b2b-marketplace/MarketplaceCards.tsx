import Link from 'next/link'
import type { AcademyModule, MarketplaceCategory, MarketplaceGateway, MarketplacePack, MarketplaceProduct } from '@/lib/b2b-marketplace/types'
import { moneyMad } from '@/lib/b2b-marketplace/repository'
import { AddToQuoteButton } from './QuoteCartProvider'

const accentClass: Record<string, { chip: string; ring: string; glow: string; icon: string }> = {
  navy: { chip: 'bg-[#eef4ff] text-[#092e63] border-[#cfe0f5]', ring: 'from-[#092e63] to-[#2f69b2]', glow: 'bg-blue-100/70', icon: 'text-[#092e63]' },
  blue: { chip: 'bg-blue-50 text-blue-800 border-blue-100', ring: 'from-blue-700 to-sky-400', glow: 'bg-sky-100/70', icon: 'text-blue-800' },
  gold: { chip: 'bg-amber-50 text-amber-800 border-amber-100', ring: 'from-[#b7791f] to-[#f3c969]', glow: 'bg-amber-100/70', icon: 'text-amber-800' },
  green: { chip: 'bg-emerald-50 text-emerald-800 border-emerald-100', ring: 'from-emerald-700 to-teal-400', glow: 'bg-emerald-100/70', icon: 'text-emerald-800' },
  orange: { chip: 'bg-orange-50 text-orange-800 border-orange-100', ring: 'from-orange-700 to-amber-400', glow: 'bg-orange-100/70', icon: 'text-orange-800' },
  rose: { chip: 'bg-rose-50 text-rose-800 border-rose-100', ring: 'from-rose-700 to-pink-400', glow: 'bg-rose-100/70', icon: 'text-rose-800' },
  purple: { chip: 'bg-violet-50 text-violet-800 border-violet-100', ring: 'from-violet-700 to-fuchsia-400', glow: 'bg-violet-100/70', icon: 'text-violet-800' },
}

export function SectionHeader({ eyebrow, title, subtitle, href, cta }: { eyebrow?: string; title: string; subtitle?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        {eyebrow ? <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#092e63] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#d8a84a]" />{eyebrow}</div> : null}
        <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
        {subtitle ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{subtitle}</p> : null}
      </div>
      {href && cta ? <Link href={href} className="group inline-flex w-fit items-center gap-3 rounded-full border border-[#d9e5f4] bg-white px-5 py-3 text-sm font-black text-[#092e63] shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"><span>{cta}</span><span className="transition group-hover:translate-x-1">→</span></Link> : null}
    </div>
  )
}

export function PremiumStat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm shadow-slate-200/70 backdrop-blur-xl">
      <div className="text-3xl font-black tracking-tight text-[#092e63]">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      {note ? <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p> : null}
    </div>
  )
}

export function TagPill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'navy' | 'gold' | 'green' | 'violet' | 'rose' }) {
  const styles = {
    slate: 'bg-[#f4f7fb] text-slate-700 border-[#edf2f8]',
    navy: 'bg-[#eef4ff] text-[#092e63] border-[#cfe0f5]',
    gold: 'bg-amber-50 text-amber-800 border-amber-100',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    violet: 'bg-violet-50 text-violet-800 border-violet-100',
    rose: 'bg-rose-50 text-rose-800 border-rose-100',
  }
  return <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-black ${styles[tone]}`}>{children}</span>
}

export function GatewayCard({ gateway }: { gateway: MarketplaceGateway }) {
  const accent = accentClass[gateway.accent] || accentClass.navy
  return (
    <Link href={gateway.href} className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/80 transition duration-500 hover:-translate-y-1.5 hover:border-[#c8d9ee] hover:shadow-2xl hover:shadow-slate-300/40">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.ring}`} />
      <div className={`absolute -right-12 -top-12 h-44 w-44 rounded-full ${accent.glow} blur-2xl transition duration-500 group-hover:scale-125`} />
      <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-amber-50 blur-xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.9),transparent_35%),linear-gradient(135deg,rgba(9,46,99,0.04),transparent_45%)]" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-[26px] border bg-white text-3xl font-black shadow-lg shadow-slate-200/70 ${accent.chip}`}>{gateway.icon}</div>
        {gateway.featuredBadge ? <span className="rounded-full bg-[#092e63] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg shadow-blue-950/15">{gateway.featuredBadge}</span> : null}
      </div>
      <h3 className="relative z-10 mt-7 text-2xl font-black leading-tight text-slate-950">{gateway.title}</h3>
      <p className="relative z-10 mt-3 grow text-sm leading-7 text-slate-600">{gateway.subtitle}</p>
      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        {gateway.tags.slice(0, 3).map((tag, index) => <TagPill key={`${tag}-${index}`} tone={index === 0 ? 'navy' : 'slate'}>{tag}</TagPill>)}
      </div>
      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-[#edf2f8] pt-5 text-sm font-black text-[#092e63]">
        <span>{gateway.ctaLabel}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#092e63] text-white shadow-lg shadow-blue-950/15 transition group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}

export function CategoryCard({ category }: { category: MarketplaceCategory }) {
  return (
    <Link href={`/b2b-marketplace/categories/${category.slug}`} className="group relative overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/80 transition duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-300/40">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[80px] bg-[#eef5ff]" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#092e63] via-[#2f69b2] to-[#d8a84a] opacity-70" />
      <div className="relative z-10 text-[11px] font-black uppercase tracking-[0.20em] text-[#092e63]">Espace catalogue</div>
      <h3 className="relative z-10 mt-4 text-2xl font-black leading-tight text-slate-950">{category.title}</h3>
      <p className="relative z-10 mt-4 text-sm leading-7 text-slate-600">{category.shortDescription}</p>
      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        {category.tags.slice(0, 4).map((tag, index) => <TagPill key={`${tag}-${index}`} tone={index === 0 ? 'navy' : 'slate'}>{tag}</TagPill>)}
      </div>
      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-[#edf2f8] pt-5 text-sm font-black text-[#092e63]">
        <span>Ouvrir le rayon</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f8fd] transition group-hover:translate-x-1 group-hover:bg-[#092e63] group-hover:text-white">→</span>
      </div>
    </Link>
  )
}

export function ProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-white shadow-sm shadow-slate-200/80 transition duration-500 hover:-translate-y-1.5 hover:border-[#c9daee] hover:shadow-2xl hover:shadow-slate-300/40">
      <Link href={`/b2b-marketplace/products/${product.reference}`} className="relative block overflow-hidden bg-gradient-to-br from-[#f9fbff] via-[#eef6ff] to-[#fffaf0] p-5">
        <div className="absolute right-5 top-5 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#092e63] shadow-sm">{product.reference}</div>
        <div className="absolute left-5 top-5 z-10 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800">B2B quote</div>
        <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-[30px] border border-white/90 bg-white/80 p-3 shadow-inner">
          {product.sourceImage ? <img src={product.sourceImage} alt={product.title} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" /> : <div className="text-center text-sm font-black text-slate-600">Source catalogue</div>}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-transparent p-4">
            <div className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{product.setName}</div>
          </div>
        </div>
      </Link>
      <div className="flex grow flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <TagPill tone="navy">Produit catalogue</TagPill>
          {product.personalizable ? <TagPill tone="gold">Personnalisable</TagPill> : null}
          {product.wholesaleAvailable ? <TagPill tone="green">Prix de gros</TagPill> : null}
        </div>
        <Link href={`/b2b-marketplace/products/${product.reference}`} className="mt-4 text-xl font-black leading-tight text-slate-950 transition hover:text-[#092e63]">{product.title}</Link>
        <p className="mt-3 grow text-sm leading-7 text-slate-600">{product.shortDescription}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
          {[product.schoolArea, product.eventType].filter(Boolean).map((item, index) => <span key={`${item}-${index}`} className="rounded-2xl bg-[#f6f8fb] px-3 py-2">{item}</span>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eef3fa] pt-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Prix indicatif</div>
            <div className="text-xl font-black text-[#092e63]">{moneyMad(product.startingPriceMad)}</div>
          </div>
          <AddToQuoteButton itemType="product" reference={product.reference} title={product.title} estimatedUnitPriceMad={product.startingPriceMad} label="Ajouter" />
        </div>
      </div>
    </div>
  )
}

export function AcademyCard({ module }: { module: AcademyModule }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-white shadow-sm shadow-slate-200/80 transition duration-500 hover:-translate-y-1.5 hover:border-violet-100 hover:shadow-2xl hover:shadow-slate-300/40">
      <Link href={`/b2b-marketplace/academy/${module.slug}`} className="relative block overflow-hidden bg-gradient-to-br from-violet-50 via-white to-[#eef5ff] p-5">
        <div className="absolute right-5 top-5 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-violet-800 shadow-sm">{module.duration}</div>
        <div className="relative h-40 overflow-hidden rounded-[30px] border border-white/90 bg-white/80 p-3 shadow-inner">
          {module.sourceImage ? <img src={module.sourceImage} alt={module.title} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" /> : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-transparent p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-700">{module.reference}</div>
          </div>
        </div>
      </Link>
      <div className="flex grow flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <TagPill tone="violet">Formation catalogue</TagPill>
          {module.includesCertificate ? <TagPill tone="green">Certificat</TagPill> : null}
          {module.includesElearning ? <TagPill tone="navy">E-learning</TagPill> : null}
        </div>
        <Link href={`/b2b-marketplace/academy/${module.slug}`} className="mt-4 text-xl font-black leading-tight text-slate-950 transition hover:text-[#092e63]">{module.title}</Link>
        <p className="mt-3 grow text-sm leading-7 text-slate-600">{module.shortDescription}</p>
        <div className="mt-4 rounded-2xl bg-[#f8fbff] px-4 py-3 text-[11px] font-black text-slate-600">{module.participants}</div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eef3fa] pt-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Prix indicatif</div>
            <div className="text-xl font-black text-[#092e63]">{moneyMad(module.startingPriceMad)}</div>
          </div>
          <AddToQuoteButton itemType="training" reference={module.reference} title={module.title} estimatedUnitPriceMad={module.startingPriceMad} label="Ajouter" />
        </div>
      </div>
    </div>
  )
}

export function PackCard({ pack }: { pack: MarketplacePack }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[38px] border border-[#d7e3f3] bg-white shadow-sm shadow-slate-200/80 transition duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-300/40">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#092e63] via-[#17477f] to-[#d8a84a] p-6 text-white">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-center justify-between gap-4">
          <TagPill tone="gold">Pack sur-mesure</TagPill>
          {pack.customizable ? <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-black">Configurable</span> : null}
        </div>
        <h3 className="relative mt-6 text-2xl font-black leading-tight">{pack.title}</h3>
        <p className="relative mt-3 text-sm leading-7 text-blue-50">{pack.shortDescription}</p>
      </div>
      <div className="flex grow flex-col p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-[#f8fbff] p-4"><div className="text-2xl font-black text-[#092e63]">{pack.includedProductRefs.length}</div><div className="text-[11px] font-black text-slate-500">Produits</div></div>
          <div className="rounded-3xl bg-[#f8fbff] p-4"><div className="text-2xl font-black text-violet-700">{pack.includedTrainingSlugs.length}</div><div className="text-[11px] font-black text-slate-500">Formations</div></div>
        </div>
        <div className="mt-4 flex grow flex-wrap content-start gap-2">
          {pack.bestFor.slice(0, 4).map((item, index) => <TagPill key={`${item}-${index}`}>{item}</TagPill>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eef3fa] pt-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">À partir de</div>
            <div className="text-xl font-black text-[#092e63]">{moneyMad(pack.startingPriceMad)}</div>
          </div>
          <Link href={`/b2b-marketplace/packs/${pack.slug}`} className="rounded-full bg-[#092e63] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5">Configurer</Link>
        </div>
      </div>
    </div>
  )
}
