import React, {ReactNode} from 'react'
import {ScrollView, StyleSheet, View, ViewStyle} from 'react-native'
import {CareLinkColors, CareLinkSpace} from '../design/tokens'

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode
  scroll?: boolean
  contentStyle?: ViewStyle
}) {
  if (!scroll) {
    return <View style={[styles.page, contentStyle]}>{children}</View>
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, contentStyle]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: CareLinkSpace.lg,
    paddingBottom: 36,
    backgroundColor: CareLinkColors.background,
  },
})
