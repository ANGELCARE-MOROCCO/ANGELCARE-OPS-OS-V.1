import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CareLink Ops Control',
  description: 'Centre de contrôle desktop pour dispatch, missions terrain, agents, incidents et conformité CareLink.',
}

export default function CareLinkOpsLayout({ children }: { children: React.ReactNode }) {
  return <section className="min-h-screen bg-slate-50 text-slate-950 antialiased">{children}</section>
}
