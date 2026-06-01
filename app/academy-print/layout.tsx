import type { ReactNode } from 'react'
import './print.css'

export const metadata = {
  title: 'AngelCare Academy Print Center',
  robots: { index: false, follow: false },
}

export default function AcademyPrintLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
