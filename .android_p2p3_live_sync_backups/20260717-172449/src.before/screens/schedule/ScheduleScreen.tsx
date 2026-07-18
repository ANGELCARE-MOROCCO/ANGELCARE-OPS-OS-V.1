import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {Card} from '../../ui/Card'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'

export function ScheduleScreen({workspace}: {workspace: CareLinkMobileWorkspace | null}) {
  const schedule = workspace?.schedule || []
  const nextMission = workspace?.nextMission || workspace?.activeMission || null

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>PLANNING</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>Disponibilité & roster</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>Vue live des créneaux synchronisés avec le backend OPS.</Text>
        <View style={styles.row}>
          <StatusPill label={String(schedule.length)} tone="blue" />
          <StatusPill label={nextMission ? 'Prochaine mission active' : 'Aucune mission active'} tone={nextMission ? 'emerald' : 'slate'} />
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Chronologie</Text>
        <View style={styles.list}>
          {schedule.length ? schedule.slice(0, 8).map((entry, index) => (
            <View key={String((entry as any).date || index)} style={styles.item}>
              <View style={styles.itemTop}>
                <Text style={styles.itemCode}>{String((entry as any).date || 'Date inconnue')}</Text>
                <StatusPill label={`${String((entry as any).missions?.length || 0)} mission(s)`} tone="emerald" />
              </View>
              <Text style={styles.itemBody}>
                {String((entry as any).missions?.slice?.(0, 2)?.map?.((mission: any) => mission.code || mission.title || mission.status)?.join?.(' · ') || 'Synchronisé depuis OPS')}
              </Text>
            </View>
          )) : <EmptyState title="Aucun créneau synchronisé" body="Le planning réapparaîtra dès que le backend renverra une disponibilité ou une mission datée." />}
        </View>
      </Card>
    </ScrollView>
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
  itemBody: {
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
})
