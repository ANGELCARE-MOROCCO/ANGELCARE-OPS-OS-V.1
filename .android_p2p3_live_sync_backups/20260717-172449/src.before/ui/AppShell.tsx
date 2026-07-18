import React, {ReactNode} from 'react'
import {StatusBar, StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {CareLinkColors} from '../design/tokens'

export function AppShell({children, inverse = false}: {children: ReactNode; inverse?: boolean}) {
  return (
    <SafeAreaView style={[styles.safe, {backgroundColor: inverse ? CareLinkColors.hero : CareLinkColors.background}]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={inverse ? 'light-content' : 'dark-content'} backgroundColor={inverse ? CareLinkColors.hero : CareLinkColors.background} />
      <View style={[styles.glowA, inverse ? styles.glowAInverse : styles.glowAHome]} />
      <View style={[styles.glowB, inverse ? styles.glowBInverse : styles.glowBHome]} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  glowA: {
    position: 'absolute',
    top: -50,
    right: -80,
    width: 210,
    height: 210,
    borderRadius: 210,
    opacity: 0.6,
  },
  glowB: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 220,
    opacity: 0.5,
  },
  glowAHome: {
    backgroundColor: '#dbeafe',
  },
  glowBHome: {
    backgroundColor: '#eff6ff',
  },
  glowAInverse: {
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
  glowBInverse: {
    backgroundColor: 'rgba(14,165,233,0.14)',
  },
})
