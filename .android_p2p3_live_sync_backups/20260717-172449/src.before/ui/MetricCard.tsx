import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace, CareLinkTone} from '../design/tokens'
import {CareLinkType} from '../design/typography'
import {CareLinkShadows} from '../design/shadows'

const toneMap: Record<CareLinkTone, {bg: string; text: string; border: string}> = {
  blue: {bg: '#eef5ff', text: CareLinkColors.blue, border: '#d6e5ff'},
  emerald: {bg: '#ecfdf5', text: CareLinkColors.emerald, border: '#bbf7d0'},
  amber: {bg: '#fffbeb', text: CareLinkColors.amber, border: '#fde68a'},
  rose: {bg: '#fff1f2', text: CareLinkColors.rose, border: '#fecdd3'},
  slate: {bg: '#f1f5f9', text: CareLinkColors.slate, border: '#dbe4f0'},
}

export function MetricCard({
  label,
  value,
  detail,
  tone = 'blue',
}: {
  label: string
  value: string
  detail: string
  tone?: CareLinkTone
}) {
  const colors = toneMap[tone]

  return (
    <View style={[styles.card, CareLinkShadows.lifted, {borderColor: colors.border}]}>
      <Text style={[CareLinkType.label, styles.label, {color: colors.text}]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={CareLinkType.caption}>{detail}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.surface,
    borderWidth: 1,
    padding: CareLinkSpace.lg,
    gap: 6,
  },
  label: {
    letterSpacing: 1.1,
  },
  value: {
    color: CareLinkColors.textStrong,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
})
