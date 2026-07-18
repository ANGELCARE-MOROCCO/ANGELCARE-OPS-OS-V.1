import {TextStyle} from 'react-native'
import {CareLinkColors} from './tokens'

const base: TextStyle = {
  color: CareLinkColors.text,
}

export const CareLinkType = {
  heroKicker: {
    ...base,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  } as TextStyle,
  heroTitle: {
    ...base,
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.6,
  } as TextStyle,
  heroBody: {
    ...base,
    color: '#dbeafe',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  } as TextStyle,
  sectionTitle: {
    ...base,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
  } as TextStyle,
  cardTitle: {
    ...base,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  } as TextStyle,
  body: {
    ...base,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  } as TextStyle,
  label: {
    ...base,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
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
