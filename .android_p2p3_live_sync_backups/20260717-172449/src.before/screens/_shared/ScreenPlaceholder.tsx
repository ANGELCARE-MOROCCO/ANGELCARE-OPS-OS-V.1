import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Card} from '../../ui/Card'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'

export function ScreenPlaceholder({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <View style={styles.wrap}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.label, styles.eyebrow]}>{eyebrow}</Text>
        <Text style={[CareLinkType.sectionTitle, styles.title]}>{title}</Text>
        <Text style={[CareLinkType.body, styles.body]}>{body}</Text>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: CareLinkSpace.lg,
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: CareLinkColors.surfaceInverse,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: CareLinkRadius.xl,
    gap: 12,
  },
  eyebrow: {
    color: '#93c5fd',
  },
  title: {
    color: '#ffffff',
  },
  body: {
    color: '#dbeafe',
  },
})
