'use client'

export default function ReceiptPrintButton({ label = 'Imprimer / Enregistrer PDF' }: { label?: string }) {
  return <button type="button" onClick={() => window.print()}>{label}</button>
}
