import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (p) => readFileSync(resolve(root, p), 'utf8')
const sha = (p) => createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex')
const checks = []
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`)
}

const protectedFiles = {
  'angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx': '512fa645b3eb59867cd228c2b56b0476b8358057254786428a306a840f99973e',
  'angelcare-marketplace/footer-studio/components/EnterpriseFooter.tsx': '4b6f32b6cac3e9c13187a9f5e7400feec34b6933126b2b4c40e4f87631021108',
  'angelcare-marketplace/public-universe/public.module.css': '11cd880bafe460814ff56be02b5e670f55f6c44fda07dd0add97b73a6df661f9',
}
for (const [file, expected] of Object.entries(protectedFiles)) {
  check(`PROTECTED ${file}`, existsSync(resolve(root, file)) && sha(file) === expected, existsSync(resolve(root, file)) ? sha(file) : 'missing')
}
check('REFERENCE_IMAGE_SHA', sha('public/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png') === '37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d')

const world = read('angelcare-marketplace/homepage-living-marketplace/world.ts')
const homepage = read('angelcare-marketplace/homepage-living-marketplace/components/LivingMarketplaceHomepage.tsx')
const css = read('angelcare-marketplace/homepage-living-marketplace/components/living-marketplace.module.css')
const recipe = read('angelcare-marketplace/studio-homepage-pro-max/recipe.ts')
const puck = read('angelcare-marketplace/studio-homepage-pro-max/puck.tsx')
const library = read('angelcare-marketplace/studio-homepage-pro-max/components/HomepageProMaxLibrary.tsx')
const renderer = read('angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx')
const route = read('app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx')
const publicRepo = read('angelcare-marketplace/public-universe/repository.ts')
const conversion = read('angelcare-marketplace/conversion-universe/content.ts')
const contract = read('docs/angelcare-marketplace/homepage-living-marketplace/WORLD_02_IMPLEMENTATION_CONTRACT.md')

check('WORLD02_ID', world.includes("ac.homepage.living-marketplace.hyper-commerce.02"))
check('WORLD02_REVISION_2', world.includes('LIVING_MARKETPLACE_WORLD_REVISION = 2 as const'))
check('WORLD02_COMPONENT_PREFIX', world.includes("ac_home_pro_max_living_world_02") && publicRepo.includes("type.startsWith('ac_home_pro_max_')"))
check('WORLD01_PRESERVED', recipe.includes('AngelCare Famille & Bébé — Hyper-Commerce 01') && recipe.includes('HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS'))
check('WORLD02_STUDIO_REGISTERED', recipe.includes('LIVING_MARKETPLACE_COMPONENT_TYPE') && puck.includes('LivingMarketplaceWorldEditor') && library.includes('LIVING_MARKETPLACE_WORLD_02'))
check('WORLD02_SOURCE_LOCKED', puck.includes("compositionMode:'hardcoded-source-owned'") && puck.includes('edit:false') && world.includes('locked: true'))
check('WORLD02_PUBLIC_RENDERER', renderer.includes('type===LIVING_MARKETPLACE_COMPONENT_TYPE') && renderer.includes('getHomepageExperience({locale})') && renderer.includes('<LivingMarketplaceHomepage experience={experience}/>'))
check('STUDIO_HOMEPAGE_PRECEDENCE', route.indexOf('getPublishedStudioHomepage({ locale })') >= 0 && route.indexOf('getPublishedStudioHomepage({ locale })') < route.lastIndexOf('getHomepageExperience({ locale })'))
check('FLAGSHIP_FALLBACK_PRESERVED', route.includes('<HomepageFlagship experience={homepage} />'))

check('CANONICAL_CONVERSION_IMPORT', homepage.includes('journeyForItem') && homepage.includes('journeyPath') && homepage.includes('journeyLabel'))
check('CONVERSION_SERVICE_BOOKING', conversion.includes("case 'service_booking'") && conversion.includes('/booking/'))
check('CONVERSION_TRAINING_ENROLLMENT', conversion.includes("case 'academy_enrollment'") && conversion.includes('/enrollment/'))
check('CONVERSION_B2B_QUOTATION', conversion.includes('/quotation/'))
check('CONVERSION_PRODUCT_BASKET', conversion.includes('/basket?item='))
check('ENGAGEMENT_ENDPOINT', homepage.includes('/api/angelcare-marketplace/homepage/engagement'))

check('SUPPORT_ROUTE_CANONICAL', homepage.includes("href={`/angelcare-marketplace/${locale}/family/request`}") && !homepage.includes('/contact`'))
check('COLLECTION_CONTEXT_WIRED', homepage.includes('marketplace/${encodeURIComponent(first.slug)}?collection=${encodeURIComponent(collection.id)}'))
check('NEW_ARRIVALS_TRUTHFUL', homepage.includes('uniqueItems(experience.newArrivalItems).slice(0, 6)') && !homepage.includes('uniqueItems(experience.newArrivalItems, all)'))

check('VISUAL_HERO_THREE_PART', homepage.includes('heroCopy') && homepage.includes('heroMediaPanel') && homepage.includes('heroAside'))
check('VISUAL_HERO_DOMINANT_MEDIA', homepage.includes('heroImage') && css.includes('.heroMediaPanel') && css.includes('grid-template-columns: minmax(320px, .94fr) minmax(430px, 1.28fr) minmax(250px, .62fr)'))
check('VISUAL_ACADEMY_BANNER', homepage.includes('academyVisual') && homepage.includes('academyCohorts') && css.includes('.academyVisualCopy'))
check('VISUAL_GUIDES_IMAGE_LED', homepage.includes('GuideCard') && homepage.includes('guideMedia') && css.includes('.guideCard'))
check('VISUAL_HUMAN_GUIDANCE', homepage.includes('humanGuidance') && homepage.includes('ANGELCARE HUMAN GUIDANCE'))
check('VISUAL_ENGAGEMENT_PHOTOGRAPHIC', homepage.includes('EngagementCard') && homepage.includes('engagementMedia') && css.includes('.engagementCard'))
check('VISUAL_B2B_MEDIA_CAPABLE', homepage.includes('sectorMedia') && css.includes('.sectorCard'))
check('VISUAL_SIX_CARD_DENSITY', css.includes('grid-template-columns: repeat(6, minmax(0,1fr))') && css.includes('.serviceGrid'))
check('VISUAL_MOBILE_SWIPE_DENSITY', css.includes('scroll-snap-type: x mandatory') && css.includes('flex: 0 0 78vw'))

const fontSizes = [...css.matchAll(/font-size:\s*(\d+)px/g)].map((match) => Number(match[1]))
const sortedFonts = [...fontSizes].sort((a, b) => a - b)
const median = sortedFonts.length ? sortedFonts[Math.floor(sortedFonts.length / 2)] : 0
check('VISUAL_FONT_MEDIAN_GTE_11', median >= 11, `median=${median}px declarations=${fontSizes.length}`)
check('VISUAL_NO_SUB_9PX_FONT', fontSizes.every((size) => size >= 9), `min=${fontSizes.length ? Math.min(...fontSizes) : 0}px`)
check('VISUAL_TOUCH_TARGETS_HARDENED', css.includes('width: 44px; height: 44px') && css.includes('min-height: 44px') && css.includes('.saveButton'))
check('VISUAL_PRICE_HIERARCHY', css.includes('.itemFoot > strong') && css.includes('font-size: 15px'))

check('NO_FAKE_REVIEW_RENDERING', !homepage.includes('reviewCount') && !homepage.includes('rating.toFixed') && !homepage.toLowerCase().includes('testimonial'))
check('NO_FAKE_APP_STORE', !homepage.includes('App Store') && !homepage.includes('Google Play'))
check('NO_FAKE_SCARCITY_COPY', !homepage.includes('Dernières places') && !/Only \d/.test(homepage) && !homepage.includes('Stock limité') && !homepage.includes('Limited seats'))
check('NO_SQL_MIGRATION_WORLD02', !world.toLowerCase().includes('.sql') && !homepage.toLowerCase().includes('.sql'))
check('CONTRACT_R2', contract.includes('Visual Pro Max Revision 2') && contract.includes('newArrivalItems'))
check('TARGETED_TSC_CONFIG', existsSync(resolve(root, 'tsconfig.homepage-living-world02.json')))

const failed = checks.filter((entry) => !entry.ok)
console.log(`\nHOMEPAGE_LIVING_WORLD02_CHECKS=${checks.length}`)
console.log(`HOMEPAGE_LIVING_WORLD02_FAILED=${failed.length}`)
if (failed.length) {
  console.error(failed.map((entry) => entry.name).join('\n'))
  process.exit(1)
}
console.log('HOMEPAGE_LIVING_WORLD02_VISUAL_PROMAX_VERIFY=PASS')
