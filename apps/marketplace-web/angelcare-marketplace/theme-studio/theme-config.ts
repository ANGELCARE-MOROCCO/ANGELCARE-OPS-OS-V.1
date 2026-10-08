export interface HomepageThemeConfig {
  id: string
  name: string
  surface: string
  surfaceSoft: string
  ink: string
  muted: string
  navy: string
  navy2: string
  blue: string
  red: string
  line: string
  warm: string
  contentWidth: number
  sectionRadius: number
  cardRadius: number
  spacingScale: number
  headingScale: number
  bodyScale: number
  headerVariant: 'classic' | 'compact' | 'editorial'
  density: 'comfortable' | 'compact' | 'cinematic'
}
