'use client'

import { useState } from 'react'
import { Activity, CheckCircle2, CircleAlert, CreditCard, ExternalLink, RefreshCw, ShieldCheck, Webhook } from 'lucide-react'
import styles from './paypal-operations.module.css'

type Health = Awaited<ReturnType<typeof import('../paypal-admin').paypalAdminHealth>>
type Envelope = { data?: { ok: boolean; environment: string; baseUrl: string; latencyMs: number; checkedAt: string }; error?: { message?: string } }

export function PayPalOperations({ initial, canManage }: { initial: Health; canManage: boolean }) {
  const [test, setTest] = useState<{ state: 'idle' | 'busy' | 'success' | 'error'; message: string }>({ state: 'idle', message: '' })
  const configuration = initial.configuration
  async function runTest() {
    setTest({ state: 'busy', message: 'Authentification OAuth PayPal en cours…' })
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/integrations/paypal/health', { method: 'POST' })
      const payload = await response.json() as Envelope
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Test PayPal impossible.')
      setTest({ state: 'success', message: `OAuth ${payload.data.environment} confirmé en ${payload.data.latencyMs} ms · ${new Date(payload.data.checkedAt).toLocaleString('fr-FR')}.` })
    } catch (cause) { setTest({ state: 'error', message: cause instanceof Error ? cause.message : 'Test PayPal impossible.' }) }
  }
  const readiness = [configuration.providerEnabled, configuration.clientIdPresent, configuration.clientSecretPresent, configuration.webhookIdPresent, configuration.conversionRatePresent]
  return <main className={styles.shell}>
    <section className={styles.hero}><div><span>PARAMÈTRES & GOUVERNANCE · INTÉGRATIONS · PAIEMENTS</span><h1>PayPal Operations</h1><p>État réel de l’adaptateur, des secrets injectés, des webhooks et des transactions — sans jamais exposer une valeur sensible.</p></div><aside data-ready={configuration.configured}><CreditCard/><strong>{configuration.configured ? 'READY' : 'CONFIG REQUIRED'}</strong><small>{configuration.environment} · {configuration.currency}</small></aside></section>
    <section className={styles.metrics}><article><ShieldCheck/><span>Provider</span><strong>{configuration.providerEnabled ? 'PayPal activé' : 'Non sélectionné'}</strong></article><article><Activity/><span>Configuration</span><strong>{readiness.filter(Boolean).length}/{readiness.length}</strong></article><article><Webhook/><span>Webhooks</span><strong>{initial.webhooks.failures ? `${initial.webhooks.failures} échec(s)` : 'Sans échec récent'}</strong></article><article><CheckCircle2/><span>Dernière transaction</span><strong>{initial.transactions.lastSuccessful?.public_reference || 'Aucune observée'}</strong></article></section>
    <div className={styles.grid}><section className={styles.panel}><header><div><span>SAFE CONFIGURATION</span><h2>Présence des autorités serveur</h2></div><a href={configuration.baseUrl || '#'} target="_blank" rel="noreferrer">API {configuration.environment}<ExternalLink/></a></header><div className={styles.checks}>{[
      ['Provider PayPal sélectionné', configuration.providerEnabled], ['PAYPAL_CLIENT_ID injecté', configuration.clientIdPresent], ['PAYPAL_CLIENT_SECRET injecté', configuration.clientSecretPresent], ['PAYPAL_WEBHOOK_ID injecté', configuration.webhookIdPresent], ['Taux Dh/EUR injecté', configuration.conversionRatePresent], ['Devise adapter EUR', configuration.currency === 'EUR'],
    ].map(([label, ready]) => <div key={String(label)} data-ready={ready}><span>{ready ? <CheckCircle2/> : <CircleAlert/>}{label}</span><strong>{ready ? 'CONFIGURÉ' : 'MANQUANT AU RUNTIME'}</strong></div>)}</div><button disabled={!canManage || test.state === 'busy' || !configuration.configured} title={!canManage ? 'Permission marketplace.configuration.manage requise' : !configuration.configured ? 'Configuration runtime incomplète' : undefined} onClick={() => void runTest()}><RefreshCw/>{test.state === 'busy' ? 'Test en cours…' : 'Tester la connexion PayPal'}</button>{test.message ? <p className={styles.testResult} data-state={test.state}>{test.message}</p> : null}</section>
      <section className={styles.panel}><header><div><span>ADAPTER CAPABILITIES</span><h2>Pouvoirs réellement codés</h2></div></header><div className={styles.capabilities}>{initial.capabilities.map((item) => <article key={item.key} data-supported={item.supported}><span>{item.supported ? <CheckCircle2/> : <CircleAlert/>}</span><div><strong>{item.label}</strong><small>{item.supported ? configuration.configured ? 'READY' : 'CONFIG_REQUIRED' : 'NOT_SUPPORTED_BY_CURRENT_ADAPTER'}</small></div></article>)}</div></section>
      <section className={styles.panel}><header><div><span>VERIFIED WEBHOOKS</span><h2>Derniers événements</h2></div><strong>{initial.webhooks.last?.created_at ? new Date(String(initial.webhooks.last.created_at)).toLocaleString('fr-FR') : 'Aucun reçu'}</strong></header><div className={styles.rows}>{initial.webhooks.recent.map((event) => <div key={String(event.id)}><span data-status={event.status}>{event.status}</span><div><strong>{event.event_type}</strong><small>{event.provider_event_id} · signature {event.signature_valid ? 'vérifiée' : 'non vérifiée'} · {new Date(String(event.created_at)).toLocaleString('fr-FR')}</small>{event.error_message ? <em>{event.error_message}</em> : null}</div></div>)}{!initial.webhooks.recent.length ? <p className={styles.empty}>Aucun webhook PayPal persistant observé.</p> : null}</div></section>
      <section className={styles.panel}><header><div><span>PAYMENT EVIDENCE</span><h2>Dernières intentions PayPal</h2></div></header><div className={styles.rows}>{initial.transactions.recent.map((payment) => <div key={String(payment.id)}><span data-status={payment.status}>{payment.status}</span><div><strong>{payment.public_reference}</strong><small>Référence provider {payment.provider_reference || 'non attribuée'} · {new Date(String(payment.updated_at)).toLocaleString('fr-FR')}</small></div></div>)}{!initial.transactions.recent.length ? <p className={styles.empty}>Aucune transaction PayPal persistante observée.</p> : null}</div></section>
    </div>
  </main>
}
