import { createServiceClient } from '@/lib/supabase/server'
import { paypalConfigurationStatus, testPayPalConnection } from './paypal'

export async function paypalAdminHealth() {
  const db = await createServiceClient()
  const [events, payments] = await Promise.all([
    db.from('angelcare_marketplace_payment_provider_events').select('id,provider_event_id,event_type,signature_valid,status,error_message,processed_at,created_at').eq('provider_key', 'paypal').order('created_at', { ascending: false }).limit(20),
    db.from('angelcare_marketplace_payment_intents').select('id,public_reference,status,provider_reference,updated_at').eq('provider_key', 'paypal').order('updated_at', { ascending: false }).limit(20),
  ])
  const eventRows = events.error ? [] : events.data || []
  const paymentRows = payments.error ? [] : payments.data || []
  const lastWebhook = eventRows[0] || null
  const lastSuccess = paymentRows.find((row) => ['captured', 'partially_refunded', 'refunded', 'reconciled'].includes(String(row.status))) || null
  return {
    configuration: paypalConfigurationStatus(),
    webhooks: { last: lastWebhook, recent: eventRows, failures: eventRows.filter((row) => row.status === 'failed').length },
    transactions: { lastSuccessful: lastSuccess, recent: paymentRows },
    capabilities: [
      { key: 'create_order', label: 'Créer une commande PayPal', supported: true },
      { key: 'capture', label: 'Capturer après approbation serveur', supported: true },
      { key: 'refund', label: 'Rembourser une capture', supported: true },
      { key: 'void', label: 'Void / annulation provider', supported: false },
      { key: 'webhook', label: 'Vérifier et traiter les webhooks', supported: true },
      { key: 'reconciliation', label: 'Réconciliation et preuve provider', supported: true },
    ],
    readWarnings: [events.error ? 'Lecture des événements provider indisponible.' : null, payments.error ? 'Lecture des paiements PayPal indisponible.' : null].filter(Boolean),
  }
}

export async function runPayPalSafeConnectionTest() { return testPayPalConnection() }
