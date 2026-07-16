import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace, CareLinkTone} from '../design/tokens'
import {CareLinkType} from '../design/typography'

const toneMap: Record<CareLinkTone, {bg: string; text: string; border: string}> = {
  blue: {bg: '#e8f1ff', text: CareLinkColors.blue, border: '#d3e2ff'},
  emerald: {bg: '#ecfdf5', text: CareLinkColors.emerald, border: '#bbf7d0'},
  amber: {bg: '#fffbeb', text: CareLinkColors.amber, border: '#fde68a'},
  rose: {bg: '#fff1f2', text: CareLinkColors.rose, border: '#fecdd3'},
  slate: {bg: '#eef2f7', text: CareLinkColors.slate, border: '#dbe4f0'},
}

export function StatusPill({
  label,
  tone = 'slate',
}: {
  label: string
  tone?: CareLinkTone
}) {
  const colors = toneMap[tone]
  return (
    <View style={[styles.pill, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      <Text style={[CareLinkType.label, styles.label, {color: colors.text}]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: CareLinkRadius.pill,
    paddingHorizontal: CareLinkSpace.md,
    paddingVertical: 9,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    letterSpacing: 1.1,
  },
})
