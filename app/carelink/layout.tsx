import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'AngelCare CareLink',
  description: 'Portail mobile AngelCare pour caregivers, childcare specialists et agents terrain.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function CareLinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-dvh bg-white text-slate-950">
      {children}
    </section>
  )
}
