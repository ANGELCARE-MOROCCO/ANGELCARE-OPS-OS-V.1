import QRCode from 'qrcode'
import { createHash, randomBytes } from 'crypto'

export type AcademyDocumentType =
  | 'payment_receipt'
  | 'invoice'
  | 'refund_receipt'
  | 'certificate'
  | 'attendance_sheet'
  | 'trainee_card'
  | 'contract'
  | 'partnership_agreement'

export function makeDocumentNumber(type: AcademyDocumentType) {
  const prefix: Record<AcademyDocumentType, string> = {
    payment_receipt: 'ACA-REC',
    invoice: 'ACA-INV',
    refund_receipt: 'ACA-REF',
    certificate: 'ACA-CERT',
    attendance_sheet: 'ACA-ATT',
    trainee_card: 'ACA-TRN',
    contract: 'ACA-CTR',
    partnership_agreement: 'ACA-PRT',
  }
  const year = new Date().getFullYear()
  const rand = randomBytes(4).toString('hex').toUpperCase()
  return `${prefix[type]}-${year}-${rand}`
}

export function makeVerificationToken(seed?: string) {
  return createHash('sha256')
    .update(`${seed || ''}:${Date.now()}:${randomBytes(24).toString('hex')}`)
    .digest('hex')
}

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function makeVerificationUrl(token: string) {
  return `${getBaseUrl()}/verify/${token}`
}

export async function makeQrDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 220,
    color: { dark: '#0f172a', light: '#ffffff' },
  })
}
