import Image from 'next/image'

type AngelCareLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  priority?: boolean
  inverse?: boolean
}

const sizeMap = {
  xs: { width: 64, height: 46 },
  sm: { width: 98, height: 70 },
  md: { width: 126, height: 91 },
  lg: { width: 174, height: 125 },
}

export default function AngelCareLogo({ size = 'sm', className = '', showText = false, priority = false, inverse = false }: AngelCareLogoProps) {
  const dims = sizeMap[size]
  return (
    <div className={`inline-flex min-w-0 items-center gap-3 ${className}`} data-angelcare-official-brand="true">
      <span
        className="relative inline-flex shrink-0"
        style={{ width: dims.width, height: dims.height }}
      >
        <Image
          src="/brand/angelcare-official.webp"
          alt="AngelCare — identité officielle complète"
          fill
          sizes={`${dims.width}px`}
          priority={priority || size === 'lg'}
          className="object-contain"
        />
      </span>
      {showText ? (
        <span className="min-w-0 leading-tight">
          <strong className={`block text-[10px] font-black uppercase tracking-[0.18em] ${inverse ? 'text-white' : 'text-slate-950'}`}>Operations System</strong>
          <small className={`block text-[8px] font-bold uppercase tracking-[0.13em] ${inverse ? 'text-white/65' : 'text-slate-500'}`}>AngelCare 360 Operator</small>
        </span>
      ) : null}
    </div>
  )
}
