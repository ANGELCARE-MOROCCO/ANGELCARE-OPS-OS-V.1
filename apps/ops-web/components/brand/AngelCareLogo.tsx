import Image from "next/image"

type AngelCareLogoProps = {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
  priority?: boolean
}

const sizeMap = {
  sm: { width: 42, height: 42 },
  md: { width: 64, height: 64 },
  lg: { width: 96, height: 96 },
} as const

export default function AngelCareLogo({
  size = "md",
  className = "",
  showText = false,
  priority,
}: AngelCareLogoProps) {
  const dims = sizeMap[size]

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} data-angelcare-official-logo>
      <Image
        src="/logo.png"
        alt="Logo officiel AngelCare"
        width={dims.width}
        height={dims.height}
        priority={priority ?? size === "lg"}
        className="shrink-0 object-contain"
      />
      {showText ? (
        <div className="leading-tight">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">
            AngelCare
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            SANILA Operations System
          </p>
        </div>
      ) : null}
    </div>
  )
}
