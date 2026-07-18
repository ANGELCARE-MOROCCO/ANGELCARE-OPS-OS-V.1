import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {Card} from '../../ui/Card'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'

export function ProfileScreen({workspace}: {workspace: CareLinkMobileWorkspace | null}) {
  const agent = workspace?.agent || workspace?.profile || {}
  const readiness = workspace?.readiness || {}
  const support = workspace?.support || []

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>PROFIL</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>{String((agent as any).fullName || (agent as any).name || 'Profil agent')}</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>Identité et conformité synchronisées depuis le backend OPS.</Text>
        <View style={styles.row}>
          <StatusPill label={String((agent as any).status || 'active')} tone="emerald" />
          <StatusPill label={String((agent as any).role || 'CareLink')} tone="blue" />
          <StatusPill label={`Readiness ${String(readiness.score ?? '-')}`} tone="amber" />
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Résumé</Text>
        <View style={styles.summaryGrid}>
          <MiniStat label="Accès" value={String((agent as any).accessStatus || (workspace as any)?.access?.access_status || 'actif')} />
          <MiniStat label="Blocages" value={String(readiness.blockers?.length || 0)} />
          <MiniStat label="Alertes" value={String(workspace?.alerts?.length || 0)} />
          <MiniStat label="Messages" value={String(workspace?.messages?.length || 0)} />
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Readiness</Text>
        {readiness.nextAction ? <Text style={styles.detail}>{String(readiness.nextAction)}</Text> : null}
        <View style={styles.list}>
          {readiness.blockers?.length ? readiness.blockers.slice(0, 3).map((item, index) => (
            <Row key={`${item}-${index}`} title="Blocage" body={String(item)} tone="rose" />
          )) : <EmptyState title="Aucun blocage" body="La readiness reste disponible et synchronisée avec OPS." />}
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Support et sécurité</Text>
        <View style={styles.list}>
          {support.length ? support.slice(0, 3).map((item, index) => (
            <Row key={String((item as any).id || index)} title={String((item as any).title || 'Support')} body={String((item as any).body || '')} tone="blue" />
          )) : <EmptyState title="Aucun contact support" body="Les liens support approuvés apparaîtront ici sans exposer d’annuaire staff." />}
        </View>
      </Card>
    </ScrollView>
  )
}

function MiniStat({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  )
}

function Row({
  title,
  body,
  tone,
}: {
  title: string
  body: string
  tone: 'blue' | 'rose'
}) {
  const color = tone === 'rose' ? CareLinkColors.rose : CareLinkColors.blue
  return (
    <View style={styles.rowCard}>
      <Text style={[styles.rowTitle, {color}]}>{title}</Text>
      <Text style={styles.rowBody}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    padding: CareLinkSpace.lg,
    gap: CareLinkSpace.lg,
  },
  hero: {
    borderColor: 'rgba(255,255,255,0.12)',
    gap: CareLinkSpace.sm,
  },
  kicker: {
    color: '#93c5fd',
  },
  title: {
    marginTop: 2,
  },
  body: {
    marginTop: -2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CareLinkSpace.sm,
  },
  panel: {
    gap: CareLinkSpace.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CareLinkSpace.sm,
  },
  miniStat: {
    width: '48.4%',
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.surfaceMuted,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    padding: CareLinkSpace.md,
    gap: 4,
  },
  miniLabel: {
    color: CareLinkColors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  miniValue: {
    color: CareLinkColors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  detail: {
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  list: {
    gap: CareLinkSpace.sm,
  },
  rowCard: {
    borderRadius: CareLinkRadius.lg,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    backgroundColor: CareLinkColors.surfaceMuted,
    padding: CareLinkSpace.md,
    gap: 4,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  rowBody: {
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
})
