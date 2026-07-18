import React, {ReactNode} from 'react'
import {StyleSheet, View, ViewStyle} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../design/tokens'
import {CareLinkShadows} from '../design/shadows'

export function Card({
  children,
  tone = 'default',
  style,
}: {
  children: ReactNode
  tone?: 'default' | 'muted' | 'inverse'
  style?: ViewStyle
}) {
  const backgroundColor =
    tone === 'inverse' ? CareLinkColors.surfaceInverse : tone === 'muted' ? CareLinkColors.surfaceMuted : CareLinkColors.surface

  return <View style={[styles.card, CareLinkShadows.card, {backgroundColor}, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CareLinkRadius.xl,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    padding: CareLinkSpace.lg,
  },
})
