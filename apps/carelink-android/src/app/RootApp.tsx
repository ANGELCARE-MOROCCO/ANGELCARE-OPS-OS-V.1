import React from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {AppNavigator} from '../navigation/AppNavigator'

export default function AppRoot() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  )
}
