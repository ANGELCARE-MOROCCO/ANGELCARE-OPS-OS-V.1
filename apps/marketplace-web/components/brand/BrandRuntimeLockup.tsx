
'use client'

import AngelCareLogo from './AngelCareLogo'
import type { BrandRuntime } from '@/types/angelcare360/operator/branding'

type Props = {
  runtime?: BrandRuntime | null
  compact?: boolean
  className?: string
  priority?: boolean
}

export default function BrandRuntimeLockup({ runtime, compact = false, className = '', priority = false }: Props) {
  const mode = runtime?.resolvedMode || 'angelcare_only'
  const customerLogo = runtime?.logoUrl || ''
  const customerName = runtime?.brandName || 'Établissement'

  if (mode === 'angelcare_only' || !customerLogo) return <AngelCareLogo size={compact ? 'xs' : 'sm'} showText={!compact} priority={priority} className={className} />

  if (mode === 'white_label') return <div className={`inline-flex min-w-0 items-center gap-3 ${className}`} data-brand-mode="white_label">
    <CustomerLogo src={customerLogo} name={customerName} compact={compact} />
  </div>

  if (mode === 'customer_primary') return <div className={`inline-flex min-w-0 items-center gap-3 ${className}`} data-brand-mode="customer_primary">
    <CustomerLogo src={customerLogo} name={customerName} compact={compact} />
    <span className="h-8 w-px bg-slate-200" />
    <span className="grid gap-0.5"><small className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">Powered by</small><AngelCareLogo size="xs" /></span>
  </div>

  return <div className={`inline-flex min-w-0 items-center gap-3 ${className}`} data-brand-mode="cobrand">
    <AngelCareLogo size={compact ? 'xs' : 'sm'} priority={priority} />
    <span className="h-9 w-px bg-slate-200" />
    <CustomerLogo src={customerLogo} name={customerName} compact={compact} />
  </div>
}

function CustomerLogo({ src, name, compact }: { src: string; name: string; compact: boolean }) {
  return <span className="inline-flex min-w-0 items-center gap-2">
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${compact ? 'h-10 w-14' : 'h-[52px] w-20'}`}>
      {/* The URL is resolved server-side and streams an approved published asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Logo ${name}`} className="h-full w-full object-contain p-1.5" />
    </span>
    {!compact ? <strong className="max-w-40 truncate text-[11px] font-black uppercase tracking-[.12em] text-slate-900">{name}</strong> : null}
  </span>
}
