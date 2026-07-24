'use client'

import { useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, HeroStat, Notice, Panel, SalesHero, SourceBadge, styles,
} from '../_components/Sales360UI'

export default function SalesWriteTestPage() {
  const [confirmation, setConfirmation] = useState('')
  const [result, setResult] = useState('Aucun test exécuté.')
  const [running, setRunning] = useState(false)

  async function runTest() {
    if (confirmation !== 'WRITE TEST') return setResult('Confirmation incorrecte. Saisissez exactement WRITE TEST.')
    setRunning(true)
    setResult('Création réelle du client et de la commande de test…')
    try {
      const response = await fetch('/api/sales-terminal/debug-write', { cache: 'no-store' })
      const json = await response.json()
      setResult(JSON.stringify(json, null, 2))
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally { setRunning(false) }
  }

  return <AppShell title="Sales Real Write Test" subtitle="Restricted data-mutation diagnostic." breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Assurance technique', href: '/sales/qa' }, { label: 'Write Test' }]} actions={<PageAction href="/sales/qa">Retour assurance technique</PageAction>}>
    <div className={styles.page}>
      <SalesHero technical eyebrow="Restricted Mutation Test" title="Prouver la capacité d’écriture en créant de vraies données de test." text="Cette action appelle l’endpoint existant /api/sales-terminal/debug-write. Elle crée réellement un client WRITE TEST CLIENT puis une commande SO-DEBUG dans Supabase." actions={<ActionLink href="/sales/qa" tone="light">Retour aux contrôles sans écriture</ActionLink>} aside={<><HeroStat label="Mutation" value="Réelle" detail="Client + commande créés" tone="red" /><HeroStat label="Rollback automatique" value="Non" detail="Suppression manuelle si nécessaire" tone="amber" /><HeroStat label="Endpoint" value="debug-write" detail="GET avec effet d’écriture" tone="slate" /></>} />
      <CommercialNav active="technical" />
      <Notice tone="red" title="Action créatrice de données" text="Ce test n’est pas un simple health check. Chaque exécution peut ajouter un nouveau client et une nouvelle commande. N’exécutez pas ce test sur une base que vous ne souhaitez pas modifier." />

      <div className={styles.grid2} style={{ marginTop: 18 }}>
        <Panel title="Autorisation explicite" subtitle="Saisissez WRITE TEST pour déverrouiller l’action." action={<SourceBadge tone="red">Mutation réelle</SourceBadge>}>
          <div className={styles.stack}><input className={styles.input} value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="WRITE TEST"/><ActionButton tone="red" icon="alert" onClick={() => void runTest()} disabled={running || confirmation !== 'WRITE TEST'}>{running ? 'Écriture en cours…' : 'Exécuter le test réel'}</ActionButton></div>
        </Panel>
        <Panel title="Effet attendu" subtitle="Contrat exact de l’endpoint existant."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Client</small><strong>WRITE TEST CLIENT</strong></div><div className={styles.summaryCell}><small>Ville</small><strong>Test City</strong></div><div className={styles.summaryCell}><small>Commande</small><strong>SO-DEBUG-…</strong></div><div className={styles.summaryCell}><small>Montant</small><strong>100 Dh</strong></div></div></Panel>
      </div>

      <Panel title="Réponse technique" subtitle="Résultat brut retourné par l’API." className="" ><pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflow: 'auto', borderRadius: 16, padding: 16, background: '#102138', color: '#d8e7f7', fontSize: 11, lineHeight: 1.6 }}>{result}</pre></Panel>
    </div>
  </AppShell>
}
