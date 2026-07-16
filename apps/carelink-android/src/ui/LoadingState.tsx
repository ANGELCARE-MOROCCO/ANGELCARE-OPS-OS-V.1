import React from 'react'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../design/tokens'
import {CareLinkType} from '../design/typography'

export function LoadingState({label = 'Synchronisation en cours'}: {label?: string}) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={CareLinkColors.blue} />
      <Text style={CareLinkType.body}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 120,
    borderRadius: CareLinkRadius.xl,
    backgroundColor: CareLinkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: CareLinkSpace.md,
  },
})
