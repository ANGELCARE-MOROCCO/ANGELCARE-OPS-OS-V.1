import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {Card} from '../../ui/Card'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'

export function MissionsScreen({workspace}: {workspace: CareLinkMobileWorkspace | null}) {
  const missions = workspace?.records || []
  const todayCount = workspace?.stats?.todayMissions ?? missions.length
  const activeCount = workspace?.stats?.completedCount ?? 0
  const missionList = missions.slice(0, 6)

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>FILE DE MISSIONS</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>Missions terrain</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>Vue live des missions liées au compte CareLink et synchronisées depuis OPS.</Text>
        <View style={styles.row}>
          <StatusPill label={`${todayCount} aujourd’hui`} tone="emerald" />
          <StatusPill label={`${activeCount} complétées`} tone="blue" />
          <StatusPill label={`${missions.length} total`} tone="slate" />
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Missions récentes</Text>
        <View style={styles.list}>
          {missionList.length ? missionList.map((mission, index) => (
            <View key={String(mission.id || index)} style={styles.item}>
              <View style={styles.itemTop}>
                <Text style={styles.itemCode}>{String((mission as any).code || (mission as any).familyName || `Mission ${index + 1}`)}</Text>
                <StatusPill label={String((mission as any).status || 'live')} tone={toneForStatus(String((mission as any).status || ''))} />
              </View>
              <Text style={styles.itemTitle}>{String((mission as any).title || (mission as any).subject || 'Mission synchronisée')}</Text>
              <Text style={styles.itemBody}>{String((mission as any).dateLabel || (mission as any).scheduledStart || (mission as any).status || 'Synchronisée depuis le backend.')}</Text>
            </View>
          )) : <EmptyState title="Aucune mission synchronisée" body="Les missions apparaîtront dès qu’OPS renverra une affectation mobile." />}
        </View>
      </Card>
    </ScrollView>
  )
}

function toneForStatus(status: string) {
  const value = status.toLowerCase()
  if (['incident', 'blocked', 'cancelled', 'canceled', 'no_show'].includes(value)) return 'rose'
  if (['completed', 'closed', 'done', 'report_submitted'].includes(value)) return 'emerald'
  if (['draft', 'assigned', 'pending', 'validation'].includes(value)) return 'amber'
  return 'blue'
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
  list: {
    gap: CareLinkSpace.sm,
  },
  item: {
    borderRadius: CareLinkRadius.lg,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    backgroundColor: CareLinkColors.surfaceMuted,
    padding: CareLinkSpace.md,
    gap: 6,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: CareLinkSpace.sm,
  },
  itemCode: {
    color: CareLinkColors.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  itemTitle: {
    color: CareLinkColors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  itemBody: {
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
})
