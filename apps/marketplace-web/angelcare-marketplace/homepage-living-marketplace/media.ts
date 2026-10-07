/** Editorial context photographs; never substitute them for an exact product image. */
export const LIVING_EDITORIAL_MEDIA = {
  family: '/angelcare-marketplace/living-world-02/family-editorial.jpg',
  care: '/angelcare-marketplace/living-world-02/care-editorial.jpg',
  academy: '/angelcare-marketplace/living-world-02/academy-editorial.jpg',
  development: '/angelcare-marketplace/living-world-02/development-editorial.jpg',
  professional: '/angelcare-marketplace/living-world-02/professional-editorial.jpg',
  school: '/angelcare-marketplace/living-world-02/school-editorial-r4.jpg',
  preschool: '/angelcare-marketplace/living-world-02/preschool-editorial-r4.jpg',
  hospitality: '/angelcare-marketplace/living-world-02/hospitality-editorial-r4.jpg',
  health: '/angelcare-marketplace/living-world-02/health-editorial-r4.jpg',
  corporate: '/angelcare-marketplace/living-world-02/corporate-editorial-r4.jpg',
  desk: '/angelcare-marketplace/living-world-02/desk-editorial-r4.jpg',
  flashcards: '/angelcare-marketplace/living-world-02/flashcards-editorial-r4.jpg',
  support: '/angelcare-marketplace/living-world-02/support-editorial-r4.jpg',
  newborn: '/angelcare-marketplace/living-world-02/newborn-editorial-r4.jpg',
} as const

export function photographicMedia(value: string | null | undefined): string | null {
  if (!value) return null
  // Legacy homepage SVG illustrations are preserved for World 01, but they are
  // not a photographic banner source for this world.
  return /\.svg(?:[?#]|$)/i.test(value) ? null : value
}
