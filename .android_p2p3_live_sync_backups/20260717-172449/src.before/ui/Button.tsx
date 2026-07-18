import React, {ReactNode} from 'react'
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace, CareLinkTone} from '../design/tokens'
import {CareLinkType} from '../design/typography'
import {CareLinkShadows} from '../design/shadows'

export function Button({
  label,
  onPress,
  tone = 'blue',
  loading = false,
  disabled = false,
  icon,
}: {
  label: string
  onPress: () => void | Promise<void>
  tone?: CareLinkTone
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
}) {
  const colors = tone === 'emerald'
    ? {bg: CareLinkColors.emerald, text: '#ffffff'}
    : tone === 'amber'
      ? {bg: CareLinkColors.amber, text: '#ffffff'}
      : tone === 'rose'
        ? {bg: CareLinkColors.rose, text: '#ffffff'}
        : tone === 'slate'
          ? {bg: CareLinkColors.surfaceInverse, text: '#ffffff'}
          : {bg: CareLinkColors.blue, text: '#ffffff'}

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.button,
        CareLinkShadows.lifted,
        {backgroundColor: colors.bg},
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={colors.text} /> : icon || null}
        <Text style={[CareLinkType.label, {color: colors.text}]}>{label}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    paddingHorizontal: CareLinkSpace.lg,
    borderRadius: CareLinkRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CareLinkSpace.sm,
  },
  pressed: {
    transform: [{scale: 0.985}],
    opacity: 0.94,
  },
  disabled: {
    opacity: 0.7,
  },
})
