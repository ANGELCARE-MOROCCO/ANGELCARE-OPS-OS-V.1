import {Platform, ViewStyle} from 'react-native'

const base = {
  shadowColor: '#08142a',
  shadowOpacity: 0.14,
  shadowRadius: 24,
  shadowOffset: {width: 0, height: 12},
  elevation: 6,
} satisfies ViewStyle

export const CareLinkShadows = {
  hero: {
    ...base,
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: {width: 0, height: 18},
    elevation: 12,
  } satisfies ViewStyle,
  card: {
    ...base,
    shadowOpacity: 0.11,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  } satisfies ViewStyle,
  lifted: {
    ...base,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  } satisfies ViewStyle,
  hairline: Platform.OS === 'android'
    ? {elevation: 1}
    : {shadowColor: '#08142a', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: {width: 0, height: 4}},
}
