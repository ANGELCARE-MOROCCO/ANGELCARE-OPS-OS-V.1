
import Image from 'next/image'

type AngelCareLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  priority?: boolean
  inverse?: boolean
}

const sizeMap = {
  xs: { width: 54, height: 40 },
  sm: { width: 72, height: 52 },
  md: { width: 108, height: 78 },
  lg: { width: 164, height: 120 },
}

export default function AngelCareLogo({ size = 'sm', className = '', showText = false, priority = false, inverse = false }: AngelCareLogoProps) {
  const dims = sizeMap[size]
  return (
    <div className={`inline-flex min-w-0 items-center gap-3 ${className}`} data-angelcare-official-brand="true">
      <span className="relative inline-flex shrink-0 overflow-hidden rounded-xl bg-white/95 shadow-[0_8px_28px_rgba(15,23,42,.10)] ring-1 ring-slate-200/80" style={{ width: dims.width, height: dims.height }}>
        <Image src="/brand/angelcare-official.webp" alt="AngelCare — identité officielle" fill sizes={`${dims.width}px`} priority={priority || size === 'lg'} className="object-contain p-1.5" />
      </span>
      {showText ? <span className="min-w-0 leading-tight">
        <strong className={`block truncate text-[11px] font-black uppercase tracking-[0.18em] ${inverse ? 'text-white' : 'text-slate-950'}`}>AngelCare</strong>
        <small className={`block truncate text-[9px] font-bold uppercase tracking-[0.13em] ${inverse ? 'text-white/65' : 'text-slate-500'}`}>Operations System</small>
      </span> : null}
    </div>
  )
}
