import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))
const checks=[]
const check=(name,ok,detail='')=>{checks.push({name,ok:Boolean(ok),detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` :: ${detail}`:''}`)}
const contains=(file,...needles)=>{const s=read(file);return needles.every((n)=>s.includes(n))}
const notContains=(file,...needles)=>{const s=read(file);return needles.every((n)=>!s.includes(n))}

const storefronts=['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals']
const registry='angelcare-marketplace/public-experience-authority/registry.ts'
const nav='angelcare-marketplace/public-experience-authority/storefront-navigation.ts'
const shell='angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx'
const publicCss='angelcare-marketplace/public-universe/public.module.css'
const customerRepo='angelcare-marketplace/customer-commerce/repository.ts'
const customerApi='angelcare-marketplace/customer-commerce/api-handlers.ts'
const customerCss='angelcare-marketplace/customer-commerce/customer-commerce.module.css'
const portalNav='angelcare-marketplace/customer-commerce/components/CustomerPortalNavigation.tsx'
const portfolio='angelcare-marketplace/customer-commerce/components/CustomerPortfolioWorkspace.tsx'
const command='angelcare-marketplace/customer-commerce/components/CustomerPortalCommand.tsx'
const saved='angelcare-marketplace/customer-commerce/components/CustomerSavedWorkspace.tsx'
const action='angelcare-marketplace/customer-commerce/components/CustomerActionCenterWorkspace.tsx'
const docs='angelcare-marketplace/customer-commerce/components/CustomerDocumentsWorkspace.tsx'
const notifications='angelcare-marketplace/customer-commerce/components/CustomerNotificationsWorkspace.tsx'
const support='angelcare-marketplace/customer-commerce/components/CustomerSupportWorkspace.tsx'
const family='angelcare-marketplace/customer-commerce/components/CustomerFamilyWorkspace.tsx'
const settings='angelcare-marketplace/customer-commerce/components/CustomerSettingsWorkspace.tsx'
const payments='angelcare-marketplace/customer-commerce/components/CustomerPaymentsWorkspace.tsx'
const compare='app/angelcare-marketplace/[locale]/marketplace/compare/page.tsx'
const compareRepo='angelcare-marketplace/category-native-experience/comparison-selection.ts'
const journeyRepo='angelcare-marketplace/journey-control/repository.ts'
const journeyApi='angelcare-marketplace/journey-control/api-handlers.ts'
const changePanel='angelcare-marketplace/journey-control/components/CustomerChangeRequestPanel.tsx'
const journeyDetail='app/angelcare-marketplace/[locale]/account/journeys/[journeyId]/page.tsx'
const adminDetail='angelcare-marketplace/journey-control/components/JourneyAdminDetail.tsx'
const contract='docs/angelcare-marketplace/customer-os/CUSTOMER_OS_NAVIGATION_PROMAX_CONTRACT.md'

check('STOREFRONT_REGISTRY_EXACT_12',contains(registry,'PUBLIC_EXPERIENCE_STOREFRONTS.length!==12'), 'registry guard present')
check('STOREFRONT_NAV_DERIVES_REGISTRY',contains(nav,'PUBLIC_EXPERIENCE_STOREFRONTS.map','items.length !== 12'))
for(const key of storefronts) check(`STOREFRONT_ROUTE_${key.toUpperCase().replaceAll('-','_')}`,exists(`app/angelcare-marketplace/[locale]/${key}/page.tsx`))
check('MARKETPLACE_SHELL_12_RAIL',contains(shell,'getPublicStorefrontNavigation','storefrontNavigation.map','data-storefront={item.key}'))
check('LEGACY_MENU_NOT_MARKETPLACE_AUTHORITY',contains(shell,"marketplace?getPublicStorefrontNavigation(locale):[]")&&contains(shell,": <header className={styles.header}"))
check('ALL_MARKETPLACE_ADDITIONAL_ACTION',contains(shell,'marketAllLink',`/${'angelcare-marketplace'}/${'${locale}'}/marketplace`))
check('PROFESSIONALS_UTILITY_ROUTE',contains(shell,'/${locale}/professionals'))
check('HEADER_SAVED_ROUTE',contains(shell,'/${locale}/account/saved'))
check('HEADER_COMPARE_ROUTE',contains(shell,'/${locale}/marketplace/compare'))
check('STOREFRONT_RAIL_SCROLLABLE',contains(publicCss,'.marketStorefrontRail','overflow-x:auto','scroll-snap-type:x proximity'))
check('STOREFRONT_TOUCH_TARGET',contains(publicCss,'.marketStorefrontLink{min-height:42px'))

const accountRoutes=['action-center','assessments','bookings','documents','enrollments','family','journeys','notifications','orders','payments','quotations','saved','settings','subscriptions','support','wallet']
check('CUSTOMER_OS_ROOT_ROUTE',exists('app/angelcare-marketplace/[locale]/account/page.tsx'))
for(const route of accountRoutes) check(`CUSTOMER_OS_ROUTE_${route.toUpperCase().replaceAll('-','_')}`,exists(`app/angelcare-marketplace/[locale]/account/${route}/page.tsx`))
check('CUSTOMER_OS_DEEP_JOURNEY',exists(journeyDetail)&&contains(journeyDetail,'CustomerPortalNavigation','JourneyExperience'))
check('CUSTOMER_NAV_16_DESTINATIONS',(read(portalNav).match(/\{suffix:'/g)||[]).length===16,'16 first-class customer destinations')
check('CUSTOMER_NAV_SCROLLABLE',contains(customerCss,'.portalNav','overflow-x:auto','scrollbar-width:none'))
check('CUSTOMER_NAV_TOUCH_TARGET',contains(customerCss,'.portalNav a{min-height:42px')&&contains(customerCss,'@media(max-width:460px)', '.portalNav a{min-height:44px'))

check('SPECIALIZED_COMMERCE_CONFIG',contains(portfolio,'product_order','family_booking','academy_enrollment','b2b_quotation','partner_activation','quality_assessment'))
check('SPECIALIZED_REAL_FACTS',contains(portfolio,'journeyFacts','financial_status','fulfillment_status','scheduled_start_at'))
check('LIVE_CATALOG_CONTINUATION',contains(portfolio,'data.catalogItems[j.id]','catalogAction','marketplace/item/${item.slug}'))
check('REBUY_REBOOK_NOT_FAKE',contains(customerRepo,"canonical_object_type==='catalog_item'",'getDiscoveryItemById')&&contains(portfolio,'item?<Link'))
check('PORTAL_CONSUMER_LABELS',contains(command,'journeyTypeLabel','customerStatus'))

check('SAVED_PAGE_REAL',exists('app/angelcare-marketplace/[locale]/account/saved/page.tsx')&&contains(saved,'initialItems','product.unsaved'))
check('SAVED_ACCOUNT_OWNERSHIP',contains(customerRepo,"eq('customer_account_id',context.account.id)","eq('selection_type','saved')"))
check('SAVED_CANONICAL_ITEM_ROUTE',contains(saved,'/marketplace/item/${item.slug}'))
check('SAVED_AUTH_ENGAGEMENT',contains('angelcare-marketplace/homepage-flagship/api-handlers.ts','customer_account_id','selection_type'))
check('GUEST_SELECTION_CLAIM_EXISTS',contains('angelcare-marketplace/customer-commerce/customer-auth.ts','claimGuestCommerce'))

check('COMPARE_PERSISTED_SELECTION',exists(compareRepo)&&contains(compareRepo,".eq('selection_type', 'compare')",'catalog_item_id')&&contains(compare,'comparisonSelectionSlugs'))
check('COMPARE_CANONICAL_EMPTY_STATE',contains(compare,'!slugs.length','No comparison is fabricated'))

check('FULL_PAYMENT_HISTORY',contains(customerRepo,'export async function listCustomerPayments',"eq('customer_account_id',context.account.id).order('updated_at'" )&&contains('app/angelcare-marketplace/[locale]/account/payments/page.tsx','listCustomerPayments'))
check('PAYMENT_REFUND_VISIBLE',contains(payments,'refunded_amount','statusCopy'))
check('PENDING_PAYMENTS_SEPARATE_SIGNAL',contains(customerRepo,".in('status',['requires_method','requires_customer_action','pending','failed','reconciliation_pending'])"))

check('DOCUMENTS_AGGREGATE_REAL_RECORDS',contains(docs,'journeys.flatMap','j.documents.map','document.download_url','document.document_type'))
check('NOTIFICATIONS_AGGREGATE_REAL_RECORDS',contains(notifications,'journeys.flatMap','j.notifications.map',"status!=='acknowledged'"))
check('NOTIFICATION_ACK_AUTHORITY',contains(notifications,'/journeys/notifications/${id}/acknowledge'))
check('ACTION_CENTER_REAL_OBLIGATIONS',contains(action,'data.journeys.flatMap','j.actions.filter','data.pendingPayments','j.recovery_cases.filter'))
check('FAMILY_OS_REAL_DASHBOARD',contains(family,'FamilyDashboardData','data.children','data.requests','data.missions','data.reports','data.tickets'))
check('SUPPORT_UNIFIED_REAL_TICKETS',contains(support,'initialTickets','/api/angelcare-marketplace/family/support','j.recovery_cases.filter'))
check('FAMILY_SPECIALIST_AUTHORITY_PRESERVED',exists('app/angelcare-marketplace/(family)/family/layout.tsx')&&contains(family,'/angelcare-marketplace/family/children','/angelcare-marketplace/family/requests','/angelcare-marketplace/family/missions'))

check('ADDRESS_CANONICAL_TABLE',contains(customerRepo,'angelcare_marketplace_customer_addresses',"eq('customer_account_id',context.account.id)"))
check('ADDRESS_SELF_SERVICE_API',exists('app/api/angelcare-marketplace/customer/addresses/route.ts')&&exists('app/api/angelcare-marketplace/customer/addresses/[addressId]/route.ts'))
check('SETTINGS_REAL_ADDRESS_CONTROLS',contains(settings,'createAddress','patchAddress','Set default','archived'))
check('SETTINGS_REAL_PASSWORD_CONTROL',contains(settings,"/api/angelcare-marketplace/customer/auth/password",'method:\'PATCH\''))
check('SETTINGS_REAL_SESSION_REVOCATION',contains(settings,"/api/angelcare-marketplace/customer/sessions",'method:\'DELETE\''))
check('SETTINGS_PRIVACY_TRUTHFUL_SUPPORT',contains(settings,'Privacy & data','/account/support'))

check('CHANGE_REQUEST_CUSTOMER_SUBMIT',contains(changePanel,'/change-requests','cancellation_request','return_request','reschedule_request'))
check('CHANGE_REQUEST_NO_AUTO_PROMISE',contains(changePanel,'does not guarantee approval')&&contains(changePanel,'refund decisions'))
check('CHANGE_REQUEST_OPERATOR_RESOLUTION',contains(journeyRepo,'resolveAdminChangeRequest','under_review','approved','rejected','completed','cancelled'))
check('CHANGE_REQUEST_ADMIN_API',exists('app/api/angelcare-marketplace/journeys/admin/[journeyId]/change-requests/[changeRequestId]/route.ts')&&contains(journeyApi,'handleAdminChangeRequest'))
check('CHANGE_REQUEST_GOVERNED_PERMISSION',contains(journeyApi,"requireMarketplaceApiContext('marketplace.journeys.manage')"))
check('CHANGE_REQUEST_ADMIN_UI',contains(adminDetail,'resolveChangeRequest','customerMessage','Aucun remboursement ni changement financier'))
check('CHANGE_REQUEST_CUSTOMER_DECISION_VISIBLE',contains(changePanel,'decisionMessage','requestStatus','request.resolved_at'))
check('CHANGE_REQUEST_AUDITED',contains(journeyRepo,"marketplace.journey.change_request.resolved",'writeMarketplaceAudit'))
check('CHANGE_REQUEST_NO_SHADOW_REFUND',notContains(journeyRepo,'createPaymentRefund')&&contains(customerApi,'handleAdminPaymentRefund'))

check('CUSTOMER_COPY_NO_FAMILY_AUTHORITY_JARGON',notContains('angelcare-marketplace/family-experience/components/FamilyShell.tsx','Specialist family authority'))
const consumerJourneyFiles=['JourneyHero.tsx','JourneyTimeline.tsx','JourneyActionPanel.tsx','DocumentVault.tsx','NotificationCenter.tsx','RecoveryPanel.tsx','CustomerChangeRequestPanel.tsx']
check('CUSTOMER_JOURNEY_NO_OPERATOR_HEADINGS',consumerJourneyFiles.every((f)=>notContains(`angelcare-marketplace/journey-control/components/${f}`,'JOURNEY AUTHORITY','OPERATOR DECISION')))
check('CUSTOMER_JOURNEY_TRILINGUAL',contains(changePanel,'fr:','en:','ar:')&&contains('angelcare-marketplace/journey-control/components/JourneyHero.tsx','copy={fr:','en:{','ar:{'))

const css=read(customerCss)
const fonts=[...css.matchAll(/font-size\s*:\s*(\d+)px/g)].map((m)=>Number(m[1])).sort((a,b)=>a-b)
const median=fonts.length?(fonts[Math.floor((fonts.length-1)/2)]+fonts[Math.floor(fonts.length/2)])/2:0
check('CUSTOMER_CSS_MEDIAN_FONT_GTE_11',median>=11,`median=${median}px declarations=${fonts.length}`)
check('CUSTOMER_CORE_TOUCH_TARGETS',contains(customerCss,'.cardPrimary{min-height:42px')&&contains(customerCss,'.savedActions a,.savedActions button{min-height:44px')&&contains(customerCss,'.notificationToolbar button{min-height:44px'))
check('CUSTOMER_MOBILE_RESPONSIVE',contains(customerCss,'@media(max-width:720px)','@media(max-width:460px)'))
check('CUSTOMER_RTL_EXPLICIT',contains(saved,"dir={locale==='ar'?'rtl':'ltr'}")&&contains(portfolio,"dir={locale==='ar'?'rtl':'ltr'}"))

check('NO_NEW_SQL_CONTRACT',contains(contract,'No SQL or migration'))
check('CONTRACT_PRESENT',exists(contract)&&contains(contract,'12-storefront','Mon ANGELCARE Customer OS'))
check('TARGETED_TSC_CONFIG',exists('tsconfig.customer-os-navigation-promax.json'))

const failed=checks.filter((c)=>!c.ok)
console.log(`\nCUSTOMER_OS_NAVIGATION_PROMAX_CHECKS=${checks.length}`)
console.log(`CUSTOMER_OS_NAVIGATION_PROMAX_FAILED=${failed.length}`)
console.log(`CUSTOMER_OS_NAVIGATION_PROMAX_VERIFY=${failed.length?'FAIL':'PASS'}`)
if(failed.length){for(const item of failed)console.error(`FAILED_CHECK=${item.name}`);process.exit(1)}
