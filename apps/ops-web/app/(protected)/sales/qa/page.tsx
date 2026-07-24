'use client'

import { useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, EmptyState, HeroStat, Notice, Panel, Pill, SalesHero,
  SourceBadge, styles,
} from '../_components/Sales360UI'

type Check = { label: string; endpoint?: string; state: 'pending' | 'ok' | 'error' | 'manual'; message?: string }

const initialChecks: Check[] = [
  { label: 'Clients Sales Terminal', endpoint: '/api/sales-terminal/clients', state: 'pending' },
  { label: 'Commandes Sales Terminal', endpoint: '/api/sales-terminal/orders', state: 'pending' },
  { label: 'Options de configuration', endpoint: '/api/sales-terminal/options', state: 'pending' },
  { label: 'Catalogue Services', endpoint: '/api/sales-terminal/service-catalog', state: 'pending' },
  { label: 'Production check sales_*', endpoint: '/api/sales-terminal/production-check', state: 'pending' },
  { label: 'Création de devis et documents', state: 'manual', message: 'À vérifier depuis un dossier de commande.' },
  { label: 'Impression PDF', state: 'manual', message: 'À vérifier depuis un document existant.' },
  { label: 'Écriture réelle', state: 'manual', message: 'Surface séparée /sales/write-test — crée des données.' },
]

export default function SalesQA() {
  const [checks, setChecks] = useState<Check[]>(initialChecks)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('Zone de diagnostic prête. Aucun test d’écriture n’est exécuté ici.')

  async function runReadChecks() {
    setRunning(true)
    const next = [...initialChecks]
    for (let index = 0; index < next.length; index += 1) {
      const check = next[index]
      if (!check.endpoint) continue
      try {
        const response = await fetch(check.endpoint, { cache: 'no-store' })
        const json = await response.json()
        next[index] = { ...check, state: json.ok ? 'ok' : 'error', message: json.message || `${Array.isArray(json.data) ? json.data.length : 'Source'} disponible` }
      } catch (error) {
        next[index] = { ...check, state: 'error', message: error instanceof Error ? error.message : 'Erreur inconnue' }
      }
      setChecks([...next])
    }
    setMessage('Contrôles de lecture terminés. Les sources sales_* et sales_terminal_* restent interprétées séparément.')
    setRunning(false)
  }

  const ok = checks.filter(check => check.state === 'ok').length
  const errors = checks.filter(check => check.state === 'error').length
  const manual = checks.filter(check => check.state === 'manual').length

  return <AppShell title="Sales Technical Assurance" subtitle="Diagnostic Zone — lecture, production checks et preuve contrôlée." breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Assurance technique' }]} actions={<PageAction href="/sales">Retour Sales 360</PageAction>}>
    <div className={styles.page}>
      <SalesHero technical eyebrow="Restricted Technical Assurance Zone" title="Vérifier les connexions du Sales Terminal sans les confondre avec l’exploitation commerciale." text="Cette page est une surface de diagnostic. Les contrôles de lecture sont sans mutation ; le test d’écriture réel reste isolé et crée explicitement un client et une commande de test." actions={<><ActionButton tone="amber" icon="technical" onClick={() => void runReadChecks()} disabled={running}>{running ? 'Contrôles en cours…' : 'Lancer les contrôles de lecture'}</ActionButton><ActionLink href="/sales/write-test" tone="red" icon="alert">Zone d’écriture réelle</ActionLink></>} aside={<><HeroStat label="Contrôles réussis" value={ok} detail={`${checks.length} contrôles au total`} tone="green" /><HeroStat label="Erreurs" value={errors} detail="Sources ou endpoints indisponibles" tone={errors ? 'red' : 'green'} /><HeroStat label="Vérifications manuelles" value={manual} detail="Documents et écriture" tone="amber" /></>} />
      <CommercialNav active="technical" />
      <Notice tone="amber" title="Sources différentes" text="Le production-check inspecte notamment sales_clients, sales_orders et sales_documents, alors que les pages opérationnelles principales lisent sales_terminal_clients, sales_terminal_orders et sales_terminal_documents." />

      <Panel title="Matrice de vérification" subtitle={message} action={<SourceBadge tone="amber">Diagnostic uniquement</SourceBadge>}>
        <div className={styles.recordList}>{checks.length === 0 ? <EmptyState title="Aucun contrôle" text="Aucun diagnostic n’est configuré." /> : checks.map((check, index) => <article key={`${check.label}-${index}`} className={styles.recordCard}><div className={styles.recordMain}><div className={styles.recordTitle}><strong>{String(index + 1).padStart(2, '0')} · {check.label}</strong><Pill tone={check.state === 'ok' ? 'green' : check.state === 'error' ? 'red' : check.state === 'manual' ? 'amber' : 'slate'}>{check.state}</Pill></div><p className={styles.muted}>{check.message || check.endpoint || 'Contrôle manuel'}</p>{check.endpoint ? <code>{check.endpoint}</code> : null}</div></article>)}</div>
      </Panel>

      <div className={styles.grid3} style={{ marginTop: 18 }}>
        <Panel title="Périmètre opérationnel" subtitle="Ce qui alimente les pages Sales visibles."><p className={styles.muted}>sales_terminal_clients · sales_terminal_orders · sales_terminal_documents · sales_terminal_options</p></Panel>
        <Panel title="Périmètre avancé" subtitle="Sales Execution OS, source distincte."><p className={styles.muted}>sales_orders · sales_documents · sales_action_queue · sales_autopilot_rules · sales_audit_logs</p></Panel>
        <Panel title="Test d’écriture" subtitle="Action destructive contrôlée."><p className={styles.muted}>Crée un client WRITE TEST CLIENT et une commande SO-DEBUG. À exécuter uniquement avec intention.</p><ActionLink href="/sales/write-test" tone="red">Ouvrir la zone restreinte</ActionLink></Panel>
      </div>
    </div>
  </AppShell>
}
