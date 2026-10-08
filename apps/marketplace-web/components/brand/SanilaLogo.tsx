import Image from 'next/image'

type SanilaLogoProps = {
  variant: 'normal' | 'white'
  className?: string
  priority?: boolean
  width?: number
  height?: number
}

const SANILA_LOGOS = {
  normal: '/sanila/sanila-operating-system-logo.png',
  white: '/sanila/sanila-operating-system-logo-white.png',
} as const

export default function SanilaLogo({
  variant,
  className,
  priority = false,
  width = 188,
  height = 66,
}: SanilaLogoProps) {
  return <Image src={SANILA_LOGOS[variant]} alt="SANILA Operating System" width={width} height={height} className={className} priority={priority} />
}
