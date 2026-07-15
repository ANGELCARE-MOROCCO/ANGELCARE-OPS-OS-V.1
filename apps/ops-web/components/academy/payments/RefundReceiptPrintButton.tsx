'use client'

export default function RefundReceiptPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print receipt-print-button"
      aria-label="Imprimer ou enregistrer le reçu de remboursement en PDF"
    >
      Imprimer / Enregistrer PDF
    </button>
  )
}
