import React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../design/tokens'
import {CareLinkFont} from '../design/typography'

export type CareLinkTabKey = 'home' | 'missions' | 'schedule' | 'messages' | 'profile'

const tabs: Array<{key: CareLinkTabKey; label: string; short: string}> = [
  {key: 'home', label: 'Accueil', short: 'Accueil'},
  {key: 'missions', label: 'Missions', short: 'Missions'},
  {key: 'schedule', label: 'Planning', short: 'Planning'},
  {key: 'messages', label: 'Messages', short: 'Messages'},
  {key: 'profile', label: 'Profil', short: 'Profil'},
]

export function CareLinkTabs({
  active,
  onChange,
}: {
  active: CareLinkTabKey
  onChange: (key: CareLinkTabKey) => void
}) {
  return (
    <View style={styles.outer}>
      <View style={styles.shell}>
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              onPress={() => onChange(tab.key)}
              style={({pressed}) => [
                styles.tab,
                isActive && styles.tabActive,
                pressed && styles.tabPressed,
              ]}>
              <View style={[styles.dot, isActive && styles.dotActive]} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.short}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: CareLinkSpace.lg,
    paddingBottom: CareLinkSpace.md,
    paddingTop: CareLinkSpace.xs,
    backgroundColor: 'transparent',
  },
  shell: {
    flexDirection: 'row',
    gap: 5,
    padding: 7,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: CareLinkRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    gap: 4,
  },
  tabActive: {
    backgroundColor: CareLinkColors.surfaceInverse,
  },
  tabPressed: {
    opacity: 0.92,
    transform: [{scale: 0.985}],
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#ffffff',
  },
  tabLabel: {
    color: CareLinkColors.textMuted,
    fontFamily: CareLinkFont.medium,
    fontSize: 8.8,
    lineHeight: 11,
    fontWeight: '900',
    letterSpacing: 0.15,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
})
