'use client'
import type { HomepageExperience } from '../../homepage-flagship/types'
import { LivingCommerceHomepage } from '../immersive/LivingCommerceHomepage'

/** Existing World 02 entry point and published selectors remain stable. */
export function LivingMarketplaceHomepage({experience}:{experience:HomepageExperience}) {
  return <LivingCommerceHomepage experience={experience}/>
}
