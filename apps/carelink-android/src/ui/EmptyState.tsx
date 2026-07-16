import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../design/tokens'
import {CareLinkType} from '../design/typography'

export function EmptyState({title, body}: {title: string; body: string}) {
  return (
    <View style={styles.wrap}>
      <Text style={CareLinkType.cardTitle}>{title}</Text>
      <Text style={[CareLinkType.body, styles.body]}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: CareLinkRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CareLinkColors.borderStrong,
    backgroundColor: CareLinkColors.surfaceMuted,
    padding: CareLinkSpace.lg,
    gap: 8,
  },
  body: {
    color: CareLinkColors.textMuted,
  },
})
