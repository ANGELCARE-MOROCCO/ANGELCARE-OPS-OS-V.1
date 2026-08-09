#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const WEBHOOK_PATH = '/api/angelcare-marketplace/payments/webhooks/paypal'
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

const environment = String(process.env.PAYPAL_ENV || 'live').trim().toLowerCase()
const clientId = String(process.env.PAYPAL_CLIENT_ID || '').trim()
const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || '').trim()
const baseUrl = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
const marketplaceBase = String(process.env.MARKETPLACE_BASE_URL || 'https://my.angelcarehub.com/angelcare-marketplace').trim().replace(/\/$/, '')
const origin = new URL(marketplaceBase).origin
const webhookUrl = String(process.env.PAYPAL_WEBHOOK_URL || `${origin}${WEBHOOK_PATH}`).trim()

if (!['live', 'sandbox'].includes(environment)) throw new Error('PAYPAL_ENV must be live or sandbox.')
if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required.')
if (!webhookUrl.startsWith('https://')) throw new Error('PayPal webhook URL must use HTTPS.')

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
  if (!response.ok || !body.access_token) throw new Error(`PayPal OAuth failed (${response.status}): ${body.error_description || body.error || body.message || 'unknown error'}`)
  return body.access_token
}

async function api(token, pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`PayPal ${init.method || 'GET'} ${pathname} failed (${response.status}): ${body.message || body.name || JSON.stringify(body)}`)
  return body
}

const token = await oauth()
const listing = await api(token, '/v1/notifications/webhooks')
const hooks = Array.isArray(listing.webhooks) ? listing.webhooks : []
let hook = hooks.find((candidate) => String(candidate.url || '').replace(/\/$/, '') === webhookUrl.replace(/\/$/, ''))

if (!hook) {
  hook = await api(token, '/v1/notifications/webhooks', {
    method: 'POST',
    body: JSON.stringify({ url: webhookUrl, event_types: EVENTS.map((name) => ({ name })) }),
  })
  console.log('CREATED PayPal webhook subscription')
} else {
  const current = new Set((Array.isArray(hook.event_types) ? hook.event_types : []).map((event) => String(event.name || '')))
  const differs = current.size !== EVENTS.length || EVENTS.some((name) => !current.has(name))
  if (differs) {
    hook = await api(token, `/v1/notifications/webhooks/${encodeURIComponent(hook.id)}`, {
      method: 'PATCH',
      body: JSON.stringify([{ op: 'replace', path: '/event_types', value: EVENTS.map((name) => ({ name })) }]),
    })
    console.log('UPDATED PayPal webhook event subscription')
  } else {
    console.log('UNCHANGED PayPal webhook subscription')
  }
}

if (!hook?.id) throw new Error('PayPal did not return a webhook ID.')
console.log(`PAYPAL_ENV=${environment}`)
console.log(`PAYPAL_WEBHOOK_URL=${webhookUrl}`)
console.log(`PAYPAL_WEBHOOK_ID=${hook.id}`)
console.log(`EVENT_COUNT=${EVENTS.length}`)
console.log('No payment order was created. No charge was attempted.')
