import React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../design/tokens'
import {CareLinkType} from '../design/typography'

export type CareLinkTabKey = 'home' | 'missions' | 'schedule' | 'messages' | 'profile'

const tabs: Array<{key: CareLinkTabKey; label: string}> = [
  {key: 'home', label: 'Accueil'},
  {key: 'missions', label: 'Missions'},
  {key: 'schedule', label: 'Planning'},
  {key: 'messages', label: 'Messages'},
  {key: 'profile', label: 'Profil'},
]

export function CareLinkTabs({
  active,
  onChange,
}: {
  active: CareLinkTabKey
  onChange: (key: CareLinkTabKey) => void
}) {
  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const isActive = active === tab.key
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={({pressed}) => [styles.tab, isActive && styles.tabActive, pressed && styles.tabPressed]}>
            <Text style={[CareLinkType.label, styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    gap: 8,
    padding: CareLinkSpace.sm,
    marginHorizontal: CareLinkSpace.lg,
    marginBottom: CareLinkSpace.lg,
    borderRadius: CareLinkRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: CareLinkColors.border,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: CareLinkRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: CareLinkColors.surfaceInverse,
  },
  tabPressed: {
    opacity: 0.92,
    transform: [{scale: 0.99}],
  },
  tabLabel: {
    color: CareLinkColors.textMuted,
  },
  tabLabelActive: {
    color: '#ffffff',
  },
})
