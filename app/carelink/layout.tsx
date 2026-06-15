import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'AngelCare CareLink',
  description: 'Portail mobile AngelCare CareLink pour agents terrain, aidants et spécialistes enfance.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function CareLinkLayout({ children }: { children: React.ReactNode }) {
  return <section className="min-h-dvh bg-white text-slate-950 antialiased">{children}</section>
}
