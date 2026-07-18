import {Platform, TextStyle} from 'react-native'
import {CareLinkColors} from './tokens'

const nativeSans = Platform.select({
  android: 'sans-serif',
  ios: 'System',
  default: undefined,
})

const nativeSansMedium = Platform.select({
  android: 'sans-serif-medium',
  ios: 'System',
  default: undefined,
})

const base: TextStyle = {
  color: CareLinkColors.text,
  fontFamily: nativeSans,
  includeFontPadding: false,
}

export const CareLinkType = {
  heroKicker: {
    ...base,
    fontFamily: nativeSansMedium,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  } as TextStyle,

  heroTitle: {
    ...base,
    color: '#ffffff',
    fontFamily: nativeSansMedium,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.4,
  } as TextStyle,

  heroBody: {
    ...base,
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  } as TextStyle,

  sectionTitle: {
    ...base,
    color: CareLinkColors.textStrong,
    fontFamily: nativeSansMedium,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.2,
  } as TextStyle,

  cardTitle: {
    ...base,
    color: CareLinkColors.textStrong,
    fontFamily: nativeSansMedium,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  } as TextStyle,

  body: {
    ...base,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  } as TextStyle,

  label: {
    ...base,
    fontFamily: nativeSansMedium,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  caption: {
    ...base,
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  } as TextStyle,
}

export const CareLinkFont = {
  regular: nativeSans,
  medium: nativeSansMedium,
}
