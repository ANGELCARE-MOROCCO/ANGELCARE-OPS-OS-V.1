#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const EVENTS = [
  'CHECKOUT.ORDER.APPROVED',
  'CHECKOUT.PAYMENT-APPROVAL.REVERSED',
  'PAYMENT.CAPTURE.PENDING',
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DECLINED',
  'PAYMENT.CAPTURE.REFUNDED',
  'PAYMENT.CAPTURE.REVERSED',
  'PAYMENT.REFUND.PENDING',
  'PAYMENT.REFUND.FAILED',
]

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvFile(path.join(ROOT, '.env.local'))
loadEnvFile(path.join(ROOT, '.env'))

const environment = String(process.env.PAYPAL_ENV || '').trim().toLowerCase()
const clientId = String(process.env.PAYPAL_CLIENT_ID || '').trim()
const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || '').trim()
const webhookId = String(process.env.PAYPAL_WEBHOOK_ID || '').trim()
const currency = String(process.env.PAYPAL_CURRENCY || '').trim().toUpperCase()
const rate = Number(process.env.PAYPAL_DH_PER_PAYPAL_UNIT || 0)
const provider = String(process.env.ANGELCARE_PAYMENT_PROVIDER || '').trim().toLowerCase()
const marketplaceBase = String(process.env.MARKETPLACE_BASE_URL || 'https://my.angelcarehub.com/angelcare-marketplace').trim().replace(/\/$/, '')
const expectedUrl = `${new URL(marketplaceBase).origin}/api/angelcare-marketplace/payments/webhooks/paypal`
const baseUrl = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

const errors = []
if (provider !== 'paypal') errors.push('ANGELCARE_PAYMENT_PROVIDER must equal paypal')
if (!['live', 'sandbox'].includes(environment)) errors.push('PAYPAL_ENV must be live or sandbox')
if (!clientId) errors.push('PAYPAL_CLIENT_ID missing')
if (!clientSecret) errors.push('PAYPAL_CLIENT_SECRET missing')
if (!webhookId) errors.push('PAYPAL_WEBHOOK_ID missing')
if (currency !== 'EUR') errors.push('PAYPAL_CURRENCY must equal EUR for the approved Marketplace policy')
if (!Number.isFinite(rate) || rate <= 0) errors.push('PAYPAL_DH_PER_PAYPAL_UNIT must be a positive number')
if (errors.length) {
  console.error('PAYPAL PREFLIGHT: FAIL')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

async function oauth() {
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.access_token) throw new Error(`OAuth failed (${response.status})`)
  return body.access_token
}

const token = await oauth()
const response = await fetch(`${baseUrl}/v1/notifications/webhooks/${encodeURIComponent(webhookId)}`, {
  headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
})
const hook = await response.json().catch(() => ({}))
if (!response.ok) throw new Error(`Webhook lookup failed (${response.status}): ${hook.message || hook.name || 'unknown error'}`)
const actualUrl = String(hook.url || '').replace(/\/$/, '')
const actualEvents = new Set((Array.isArray(hook.event_types) ? hook.event_types : []).map((event) => String(event.name || '')))
if (actualUrl !== expectedUrl) errors.push(`webhook URL mismatch: expected ${expectedUrl}, got ${actualUrl || '(empty)'}`)
for (const event of EVENTS) if (!actualEvents.has(event)) errors.push(`webhook event missing: ${event}`)

if (errors.length) {
  console.error('PAYPAL PREFLIGHT: FAIL')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('PAYPAL PREFLIGHT: PASS')
console.log(`Environment: ${environment}`)
console.log(`Currency: ${currency}`)
console.log(`Dh per ${currency}: ${rate}`)
console.log(`Webhook URL: ${expectedUrl}`)
console.log(`Webhook ID configured: YES`)
console.log(`Required events: ${EVENTS.length}/${EVENTS.length}`)
console.log('OAuth: PASS')
console.log('No payment order was created. No charge was attempted.')
