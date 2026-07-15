export function academyRefundReceiptUrl(refundId: string | number) {
  return `/academy-print/refunds/${encodeURIComponent(String(refundId))}`
}
