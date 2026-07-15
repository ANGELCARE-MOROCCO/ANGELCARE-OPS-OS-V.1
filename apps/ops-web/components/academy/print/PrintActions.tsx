'use client'

import Link from 'next/link'

export function PrintActions({ backHref = '/academy/payments?view=refunds' }: { backHref?: string }) {
  return (
    <div className="print-toolbar">
      <Link href={backHref}>Retour remboursements</Link>
      <button type="button" className="primary" onClick={() => window.print()}>
        Imprimer / Enregistrer PDF
      </button>
    </div>
  )
}
