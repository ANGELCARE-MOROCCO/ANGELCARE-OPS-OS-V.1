import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../design/tokens'
import {CareLinkType} from '../design/typography'

export function ErrorState({title, body}: {title: string; body: string}) {
  return (
    <View style={styles.wrap}>
      <Text style={[CareLinkType.cardTitle, styles.title]}>{title}</Text>
      <Text style={CareLinkType.body}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: CareLinkRadius.xl,
    backgroundColor: CareLinkColors.dangerBg,
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: CareLinkSpace.lg,
    gap: 8,
  },
  title: {
    color: CareLinkColors.rose,
  },
})
