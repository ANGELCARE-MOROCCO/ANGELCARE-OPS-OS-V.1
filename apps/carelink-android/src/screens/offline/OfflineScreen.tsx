import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import {useOfflineQueueStore, clearOfflineQueue} from '../../store/offlineQueueStore'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'

export function OfflineScreen() {
  const queue = useOfflineQueueStore()
  return <ScrollView contentContainerStyle={styles.wrap}><Card tone="inverse" style={styles.hero}><Text style={[CareLinkType.heroKicker, styles.kicker]}>SYNCHRONISATION</Text><Text style={CareLinkType.heroTitle}>File hors-ligne</Text><Text style={CareLinkType.heroBody}>Actions en attente de synchronisation OPS.</Text><StatusPill label={`${queue.length} action(s)`} tone={queue.length ? 'amber' : 'emerald'} /></Card><Card style={styles.panel}><Text style={CareLinkType.cardTitle}>Actions en attente</Text>{queue.length ? queue.map((item) => <View key={item.id} style={styles.item}><Text style={styles.title}>{item.label}</Text><Text style={styles.body}>{item.endpoint}</Text><Text style={styles.body}>{item.lastError || item.createdAt}</Text></View>) : <EmptyState title="File vide" body="Aucune action terrain n’est en attente." />}<Button label="Vider la file" onPress={clearOfflineQueue} tone="slate" /></Card></ScrollView>
}
const styles = StyleSheet.create({wrap: {padding: CareLinkSpace.lg, gap: CareLinkSpace.lg}, hero: {gap: CareLinkSpace.sm}, kicker: {color: '#93c5fd'}, panel: {gap: CareLinkSpace.sm}, item: {borderRadius: CareLinkRadius.lg, padding: CareLinkSpace.md, backgroundColor: CareLinkColors.surfaceMuted, borderWidth: 1, borderColor: CareLinkColors.border, gap: 4}, title: {color: CareLinkColors.textStrong, fontSize: 14, fontWeight: '900'}, body: {color: CareLinkColors.textMuted, fontSize: 12, fontWeight: '700'}})
