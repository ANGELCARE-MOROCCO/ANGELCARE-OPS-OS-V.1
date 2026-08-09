# ANGELCARE Marketplace Route & Navigation Authority

**Status:** PASS
**Routes:** 694
**Pages:** 438
**APIs:** 256
**Literal Marketplace links:** 131

## Audience distribution

| Audience | Routes |
| --- | --- |
| admin | 328 |
| api | 256 |
| customer-account | 14 |
| family | 15 |
| platform | 5 |
| provider | 10 |
| public-localized | 60 |
| tenant | 1 |
| trainer | 5 |

## Domain distribution

| Domain | Routes |
| --- | --- |
| academy | 17 |
| access-denied | 1 |
| account | 14 |
| action-center | 1 |
| analytics | 12 |
| angelcare-marketplace | 1 |
| apiacademy | 11 |
| apiadmin | 3 |
| apianalytics | 5 |
| apib2b | 16 |
| apibackoffice | 9 |
| apicatalog | 3 |
| apicms | 9 |
| apiconversion | 12 |
| apicrm | 6 |
| apidevelopment | 6 |
| apidiscovery | 1 |
| apifamily | 12 |
| apifinance | 11 |
| apifoundation | 14 |
| apigrowth | 3 |
| apihomepage | 2 |
| apiintelligence | 3 |
| apijourneys | 10 |
| apilaunch | 10 |
| apilocalization | 12 |
| apioperations | 26 |
| apipartner-os | 6 |
| apiperformance | 1 |
| apiproviders | 11 |
| apipublic | 3 |
| apiqa | 7 |
| apiquote-baskets | 2 |
| apisecurity | 10 |
| apisuppliers | 1 |
| apiterritories | 15 |
| apiterritory-overrides | 3 |
| apitrust | 13 |
| approvals | 1 |
| basket | 1 |
| booking | 1 |
| catalog | 9 |
| checkout | 7 |
| command | 1 |
| commercial | 4 |
| configuration | 1 |
| conversion | 13 |
| corporates | 5 |
| development | 5 |
| enrollment | 1 |
| establishments | 8 |
| executive-briefs | 1 |
| experience | 20 |
| families | 2 |
| family | 15 |
| family-requests | 2 |
| feature-flags | 1 |
| finance | 10 |
| foundation-ui | 1 |
| growth | 8 |
| health-partners | 5 |
| home-services | 1 |
| hospitality | 6 |
| intelligence | 17 |
| journeys | 16 |
| kits | 1 |
| launch | 12 |
| localization | 13 |
| marketplace | 6 |
| modules | 2 |
| objects | 1 |
| operations | 31 |
| partner | 1 |
| partner-os | 5 |
| platform-performance | 7 |
| preview | 1 |
| provider | 9 |
| providers | 17 |
| public-inquiries | 1 |
| qa | 12 |
| quality-assurance | 10 |
| quality-check | 1 |
| quotation | 1 |
| quote-basket | 1 |
| quote-baskets | 1 |
| readiness | 1 |
| root | 2 |
| search | 1 |
| security | 17 |
| security-audit | 1 |
| subscription | 1 |
| suppliers | 1 |
| territories | 10 |
| trainer | 5 |
| trust | 22 |
| unavailable | 1 |
| vendors | 11 |
| verticals | 23 |
| workspace | 1 |

## Integrity

| Gate | Result |
| --- | --- |
| Duplicate Next.js routes | PASS |
| Unresolved literal Marketplace links | PASS |

## Route register

| Route | Type | Audience | Domain | Source |
| --- | --- | --- | --- | --- |
| /angelcare-marketplace | page | platform | angelcare-marketplace | app/angelcare-marketplace/page.tsx |
| /angelcare-marketplace/[locale]/[[...slug]] | page | public-localized | root | app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx |
| /angelcare-marketplace/[locale]/academy | page | public-localized | academy | app/angelcare-marketplace/[locale]/academy/page.tsx |
| /angelcare-marketplace/[locale]/academy/programs | page | public-localized | academy | app/angelcare-marketplace/[locale]/academy/programs/page.tsx |
| /angelcare-marketplace/[locale]/academy/programs/[slug] | page | public-localized | academy | app/angelcare-marketplace/[locale]/academy/programs/[slug]/page.tsx |
| /angelcare-marketplace/[locale]/academy/request | page | public-localized | academy | app/angelcare-marketplace/[locale]/academy/request/page.tsx |
| /angelcare-marketplace/[locale]/account | page | customer-account | account | app/angelcare-marketplace/[locale]/account/page.tsx |
| /angelcare-marketplace/[locale]/account/action-center | page | customer-account | account | app/angelcare-marketplace/[locale]/account/action-center/page.tsx |
| /angelcare-marketplace/[locale]/account/assessments | page | customer-account | account | app/angelcare-marketplace/[locale]/account/assessments/page.tsx |
| /angelcare-marketplace/[locale]/account/bookings | page | customer-account | account | app/angelcare-marketplace/[locale]/account/bookings/page.tsx |
| /angelcare-marketplace/[locale]/account/documents | page | customer-account | account | app/angelcare-marketplace/[locale]/account/documents/page.tsx |
| /angelcare-marketplace/[locale]/account/enrollments | page | customer-account | account | app/angelcare-marketplace/[locale]/account/enrollments/page.tsx |
| /angelcare-marketplace/[locale]/account/journeys | page | customer-account | account | app/angelcare-marketplace/[locale]/account/journeys/page.tsx |
| /angelcare-marketplace/[locale]/account/journeys/[journeyId] | page | customer-account | account | app/angelcare-marketplace/[locale]/account/journeys/[journeyId]/page.tsx |
| /angelcare-marketplace/[locale]/account/notifications | page | customer-account | account | app/angelcare-marketplace/[locale]/account/notifications/page.tsx |
| /angelcare-marketplace/[locale]/account/orders | page | customer-account | account | app/angelcare-marketplace/[locale]/account/orders/page.tsx |
| /angelcare-marketplace/[locale]/account/quotations | page | customer-account | account | app/angelcare-marketplace/[locale]/account/quotations/page.tsx |
| /angelcare-marketplace/[locale]/account/subscriptions | page | customer-account | account | app/angelcare-marketplace/[locale]/account/subscriptions/page.tsx |
| /angelcare-marketplace/[locale]/account/support | page | customer-account | account | app/angelcare-marketplace/[locale]/account/support/page.tsx |
| /angelcare-marketplace/[locale]/basket | page | public-localized | basket | app/angelcare-marketplace/[locale]/basket/page.tsx |
| /angelcare-marketplace/[locale]/booking/[itemSlug] | page | public-localized | booking | app/angelcare-marketplace/[locale]/booking/[itemSlug]/page.tsx |
| /angelcare-marketplace/[locale]/checkout | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/page.tsx |
| /angelcare-marketplace/[locale]/checkout/availability | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/availability/page.tsx |
| /angelcare-marketplace/[locale]/checkout/configuration | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/configuration/page.tsx |
| /angelcare-marketplace/[locale]/checkout/confirmation | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/confirmation/page.tsx |
| /angelcare-marketplace/[locale]/checkout/consent | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/consent/page.tsx |
| /angelcare-marketplace/[locale]/checkout/identity | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/identity/page.tsx |
| /angelcare-marketplace/[locale]/checkout/review | page | public-localized | checkout | app/angelcare-marketplace/[locale]/checkout/review/page.tsx |
| /angelcare-marketplace/[locale]/corporates | page | public-localized | corporates | app/angelcare-marketplace/[locale]/corporates/page.tsx |
| /angelcare-marketplace/[locale]/corporates/emergency-support | page | public-localized | corporates | app/angelcare-marketplace/[locale]/corporates/emergency-support/page.tsx |
| /angelcare-marketplace/[locale]/corporates/family-benefits | page | public-localized | corporates | app/angelcare-marketplace/[locale]/corporates/family-benefits/page.tsx |
| /angelcare-marketplace/[locale]/corporates/family-days | page | public-localized | corporates | app/angelcare-marketplace/[locale]/corporates/family-days/page.tsx |
| /angelcare-marketplace/[locale]/corporates/request | page | public-localized | corporates | app/angelcare-marketplace/[locale]/corporates/request/page.tsx |
| /angelcare-marketplace/[locale]/development | page | public-localized | development | app/angelcare-marketplace/[locale]/development/page.tsx |
| /angelcare-marketplace/[locale]/enrollment/[itemSlug] | page | public-localized | enrollment | app/angelcare-marketplace/[locale]/enrollment/[itemSlug]/page.tsx |
| /angelcare-marketplace/[locale]/establishments | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/page.tsx |
| /angelcare-marketplace/[locale]/establishments/academy | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/academy/page.tsx |
| /angelcare-marketplace/[locale]/establishments/creches | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/creches/page.tsx |
| /angelcare-marketplace/[locale]/establishments/diagnostic | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/diagnostic/page.tsx |
| /angelcare-marketplace/[locale]/establishments/partner-os | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/partner-os/page.tsx |
| /angelcare-marketplace/[locale]/establishments/quality-check-360 | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/quality-check-360/page.tsx |
| /angelcare-marketplace/[locale]/establishments/request | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/request/page.tsx |
| /angelcare-marketplace/[locale]/establishments/schools | page | public-localized | establishments | app/angelcare-marketplace/[locale]/establishments/schools/page.tsx |
| /angelcare-marketplace/[locale]/families | page | public-localized | families | app/angelcare-marketplace/[locale]/families/page.tsx |
| /angelcare-marketplace/[locale]/health-partners | page | public-localized | health-partners | app/angelcare-marketplace/[locale]/health-partners/page.tsx |
| /angelcare-marketplace/[locale]/health-partners/maternity | page | public-localized | health-partners | app/angelcare-marketplace/[locale]/health-partners/maternity/page.tsx |
| /angelcare-marketplace/[locale]/health-partners/mother-baby-care | page | public-localized | health-partners | app/angelcare-marketplace/[locale]/health-partners/mother-baby-care/page.tsx |
| /angelcare-marketplace/[locale]/health-partners/request | page | public-localized | health-partners | app/angelcare-marketplace/[locale]/health-partners/request/page.tsx |
| /angelcare-marketplace/[locale]/health-partners/workshops | page | public-localized | health-partners | app/angelcare-marketplace/[locale]/health-partners/workshops/page.tsx |
| /angelcare-marketplace/[locale]/home-services | page | public-localized | home-services | app/angelcare-marketplace/[locale]/home-services/page.tsx |
| /angelcare-marketplace/[locale]/hospitality | page | public-localized | hospitality | app/angelcare-marketplace/[locale]/hospitality/page.tsx |
| /angelcare-marketplace/[locale]/hospitality/family-concierge | page | public-localized | hospitality | app/angelcare-marketplace/[locale]/hospitality/family-concierge/page.tsx |
| /angelcare-marketplace/[locale]/hospitality/guest-childcare | page | public-localized | hospitality | app/angelcare-marketplace/[locale]/hospitality/guest-childcare/page.tsx |
| /angelcare-marketplace/[locale]/hospitality/kids-club | page | public-localized | hospitality | app/angelcare-marketplace/[locale]/hospitality/kids-club/page.tsx |
| /angelcare-marketplace/[locale]/hospitality/request | page | public-localized | hospitality | app/angelcare-marketplace/[locale]/hospitality/request/page.tsx |
| /angelcare-marketplace/[locale]/hospitality/seasonal-programs | page | public-localized | hospitality | app/angelcare-marketplace/[locale]/hospitality/seasonal-programs/page.tsx |
| /angelcare-marketplace/[locale]/kits | page | public-localized | kits | app/angelcare-marketplace/[locale]/kits/page.tsx |
| /angelcare-marketplace/[locale]/marketplace | page | public-localized | marketplace | app/angelcare-marketplace/[locale]/marketplace/page.tsx |
| /angelcare-marketplace/[locale]/marketplace/[slug] | page | public-localized | marketplace | app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx |
| /angelcare-marketplace/[locale]/marketplace/category/[categorySlug] | page | public-localized | marketplace | app/angelcare-marketplace/[locale]/marketplace/category/[categorySlug]/page.tsx |
| /angelcare-marketplace/[locale]/marketplace/item/[itemSlug] | page | public-localized | marketplace | app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx |
| /angelcare-marketplace/[locale]/marketplace/search | page | public-localized | marketplace | app/angelcare-marketplace/[locale]/marketplace/search/page.tsx |
| /angelcare-marketplace/[locale]/partner-os | page | public-localized | partner-os | app/angelcare-marketplace/[locale]/partner-os/page.tsx |
| /angelcare-marketplace/[locale]/partner-os/contact | page | public-localized | partner-os | app/angelcare-marketplace/[locale]/partner-os/contact/page.tsx |
| /angelcare-marketplace/[locale]/quality-check | page | public-localized | quality-check | app/angelcare-marketplace/[locale]/quality-check/page.tsx |
| /angelcare-marketplace/[locale]/quotation/[itemSlug] | page | public-localized | quotation | app/angelcare-marketplace/[locale]/quotation/[itemSlug]/page.tsx |
| /angelcare-marketplace/[locale]/quote-basket | page | public-localized | quote-basket | app/angelcare-marketplace/[locale]/quote-basket/page.tsx |
| /angelcare-marketplace/[locale]/subscription/[itemSlug] | page | public-localized | subscription | app/angelcare-marketplace/[locale]/subscription/[itemSlug]/page.tsx |
| /angelcare-marketplace/[locale]/trust | page | public-localized | trust | app/angelcare-marketplace/[locale]/trust/page.tsx |
| /angelcare-marketplace/[locale]/trust/complaints | page | public-localized | trust | app/angelcare-marketplace/[locale]/trust/complaints/page.tsx |
| /angelcare-marketplace/[locale]/trust/providers | page | provider | trust | app/angelcare-marketplace/[locale]/trust/providers/page.tsx |
| /angelcare-marketplace/[locale]/trust/quality | page | public-localized | trust | app/angelcare-marketplace/[locale]/trust/quality/page.tsx |
| /angelcare-marketplace/[locale]/trust/safety | page | public-localized | trust | app/angelcare-marketplace/[locale]/trust/safety/page.tsx |
| /angelcare-marketplace/[locale]/trust/standards | page | public-localized | trust | app/angelcare-marketplace/[locale]/trust/standards/page.tsx |
| /angelcare-marketplace/[locale]/trust/verification/[reference] | page | public-localized | trust | app/angelcare-marketplace/[locale]/trust/verification/[reference]/page.tsx |
| /angelcare-marketplace/access-denied | page | platform | access-denied | app/angelcare-marketplace/access-denied/page.tsx |
| /angelcare-marketplace/account | page | customer-account | account | app/angelcare-marketplace/(protected)/account/page.tsx |
| /angelcare-marketplace/admin | page | admin | root | app/angelcare-marketplace/(protected)/admin/page.tsx |
| /angelcare-marketplace/admin/academy | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/page.tsx |
| /angelcare-marketplace/admin/academy/assessments | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/assessments/page.tsx |
| /angelcare-marketplace/admin/academy/attendance | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/attendance/page.tsx |
| /angelcare-marketplace/admin/academy/b2b-training | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/b2b-training/page.tsx |
| /angelcare-marketplace/admin/academy/catalog | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/catalog/page.tsx |
| /angelcare-marketplace/admin/academy/certificates | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/certificates/page.tsx |
| /angelcare-marketplace/admin/academy/cohorts | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/cohorts/page.tsx |
| /angelcare-marketplace/admin/academy/compliance | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/compliance/page.tsx |
| /angelcare-marketplace/admin/academy/courses | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/courses/page.tsx |
| /angelcare-marketplace/admin/academy/enrollments | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/enrollments/page.tsx |
| /angelcare-marketplace/admin/academy/programs | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/programs/page.tsx |
| /angelcare-marketplace/admin/academy/sessions | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/sessions/page.tsx |
| /angelcare-marketplace/admin/academy/trainers | page | admin | academy | app/angelcare-marketplace/(protected)/admin/academy/trainers/page.tsx |
| /angelcare-marketplace/admin/action-center | page | admin | action-center | app/angelcare-marketplace/(protected)/admin/action-center/page.tsx |
| /angelcare-marketplace/admin/analytics | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/page.tsx |
| /angelcare-marketplace/admin/analytics/academy | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/academy/page.tsx |
| /angelcare-marketplace/admin/analytics/b2b | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/b2b/page.tsx |
| /angelcare-marketplace/admin/analytics/data-quality | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/data-quality/page.tsx |
| /angelcare-marketplace/admin/analytics/executive | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/executive/page.tsx |
| /angelcare-marketplace/admin/analytics/families | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/families/page.tsx |
| /angelcare-marketplace/admin/analytics/finance | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/finance/page.tsx |
| /angelcare-marketplace/admin/analytics/marketplace | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/marketplace/page.tsx |
| /angelcare-marketplace/admin/analytics/operations | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/operations/page.tsx |
| /angelcare-marketplace/admin/analytics/providers | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/providers/page.tsx |
| /angelcare-marketplace/admin/analytics/territories | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/territories/page.tsx |
| /angelcare-marketplace/admin/analytics/trust | page | admin | analytics | app/angelcare-marketplace/(protected)/admin/analytics/trust/page.tsx |
| /angelcare-marketplace/admin/approvals | page | admin | approvals | app/angelcare-marketplace/(protected)/admin/approvals/page.tsx |
| /angelcare-marketplace/admin/catalog | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/page.tsx |
| /angelcare-marketplace/admin/catalog/categories | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/categories/page.tsx |
| /angelcare-marketplace/admin/catalog/collections | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/collections/page.tsx |
| /angelcare-marketplace/admin/catalog/items | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/items/page.tsx |
| /angelcare-marketplace/admin/catalog/localization | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/localization/page.tsx |
| /angelcare-marketplace/admin/catalog/media | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/media/page.tsx |
| /angelcare-marketplace/admin/catalog/publication | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/publication/page.tsx |
| /angelcare-marketplace/admin/catalog/search | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/search/page.tsx |
| /angelcare-marketplace/admin/catalog/trust | page | admin | catalog | app/angelcare-marketplace/(protected)/admin/catalog/trust/page.tsx |
| /angelcare-marketplace/admin/command | page | admin | command | app/angelcare-marketplace/(protected)/admin/command/page.tsx |
| /angelcare-marketplace/admin/commercial | page | admin | commercial | app/angelcare-marketplace/(protected)/admin/commercial/page.tsx |
| /angelcare-marketplace/admin/commercial/leads | page | admin | commercial | app/angelcare-marketplace/(protected)/admin/commercial/leads/page.tsx |
| /angelcare-marketplace/admin/commercial/opportunities | page | admin | commercial | app/angelcare-marketplace/(protected)/admin/commercial/opportunities/page.tsx |
| /angelcare-marketplace/admin/commercial/quotes | page | admin | commercial | app/angelcare-marketplace/(protected)/admin/commercial/quotes/page.tsx |
| /angelcare-marketplace/admin/configuration | page | admin | configuration | app/angelcare-marketplace/(protected)/admin/configuration/page.tsx |
| /angelcare-marketplace/admin/conversion | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/page.tsx |
| /angelcare-marketplace/admin/conversion/abandonment | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/abandonment/page.tsx |
| /angelcare-marketplace/admin/conversion/analytics | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/analytics/page.tsx |
| /angelcare-marketplace/admin/conversion/baskets | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/baskets/page.tsx |
| /angelcare-marketplace/admin/conversion/bookings | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/bookings/page.tsx |
| /angelcare-marketplace/admin/conversion/configuration | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/configuration/page.tsx |
| /angelcare-marketplace/admin/conversion/consents | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/consents/page.tsx |
| /angelcare-marketplace/admin/conversion/enrollments | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/enrollments/page.tsx |
| /angelcare-marketplace/admin/conversion/exceptions | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/exceptions/page.tsx |
| /angelcare-marketplace/admin/conversion/holds | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/holds/page.tsx |
| /angelcare-marketplace/admin/conversion/quotations | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/quotations/page.tsx |
| /angelcare-marketplace/admin/conversion/sessions | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/sessions/page.tsx |
| /angelcare-marketplace/admin/conversion/sessions/[sessionId] | page | admin | conversion | app/angelcare-marketplace/(protected)/admin/conversion/sessions/[sessionId]/page.tsx |
| /angelcare-marketplace/admin/development | page | admin | development | app/angelcare-marketplace/(protected)/admin/development/page.tsx |
| /angelcare-marketplace/admin/development/activities | page | admin | development | app/angelcare-marketplace/(protected)/admin/development/activities/page.tsx |
| /angelcare-marketplace/admin/development/kits | page | admin | development | app/angelcare-marketplace/(protected)/admin/development/kits/page.tsx |
| /angelcare-marketplace/admin/development/supplier-specs | page | admin | development | app/angelcare-marketplace/(protected)/admin/development/supplier-specs/page.tsx |
| /angelcare-marketplace/admin/executive-briefs | page | admin | executive-briefs | app/angelcare-marketplace/(protected)/admin/executive-briefs/page.tsx |
| /angelcare-marketplace/admin/experience | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/page.tsx |
| /angelcare-marketplace/admin/experience/block-library | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/block-library/page.tsx |
| /angelcare-marketplace/admin/experience/ctas | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/ctas/page.tsx |
| /angelcare-marketplace/admin/experience/homepage | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/analytics | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/analytics/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/audiences | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/audiences/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/campaigns | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/campaigns/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/collections | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/collections/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/hero | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/hero/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/media | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/media/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/placements | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/placements/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/preview | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/preview/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/sections | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/sections/page.tsx |
| /angelcare-marketplace/admin/experience/homepage/territories | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/homepage/territories/page.tsx |
| /angelcare-marketplace/admin/experience/menus | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/menus/page.tsx |
| /angelcare-marketplace/admin/experience/pages | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/pages/page.tsx |
| /angelcare-marketplace/admin/experience/pages/[pageId] | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/pages/[pageId]/page.tsx |
| /angelcare-marketplace/admin/experience/pages/[pageId]/builder | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/pages/[pageId]/builder/page.tsx |
| /angelcare-marketplace/admin/experience/pages/new | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/pages/new/page.tsx |
| /angelcare-marketplace/admin/experience/publishing | page | admin | experience | app/angelcare-marketplace/(protected)/admin/experience/publishing/page.tsx |
| /angelcare-marketplace/admin/families | page | admin | families | app/angelcare-marketplace/(protected)/admin/families/page.tsx |
| /angelcare-marketplace/admin/family-requests | page | admin | family-requests | app/angelcare-marketplace/(protected)/admin/family-requests/page.tsx |
| /angelcare-marketplace/admin/family-requests/[requestId] | page | admin | family-requests | app/angelcare-marketplace/(protected)/admin/family-requests/[requestId]/page.tsx |
| /angelcare-marketplace/admin/feature-flags | page | admin | feature-flags | app/angelcare-marketplace/(protected)/admin/feature-flags/page.tsx |
| /angelcare-marketplace/admin/finance | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/page.tsx |
| /angelcare-marketplace/admin/finance/commissions | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/commissions/page.tsx |
| /angelcare-marketplace/admin/finance/discounts | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/discounts/page.tsx |
| /angelcare-marketplace/admin/finance/exceptions | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/exceptions/page.tsx |
| /angelcare-marketplace/admin/finance/invoice-readiness | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/invoice-readiness/page.tsx |
| /angelcare-marketplace/admin/finance/margins | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/margins/page.tsx |
| /angelcare-marketplace/admin/finance/price-books | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/price-books/page.tsx |
| /angelcare-marketplace/admin/finance/reconciliation | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/reconciliation/page.tsx |
| /angelcare-marketplace/admin/finance/reports | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/reports/page.tsx |
| /angelcare-marketplace/admin/finance/revenue-streams | page | admin | finance | app/angelcare-marketplace/(protected)/admin/finance/revenue-streams/page.tsx |
| /angelcare-marketplace/admin/foundation-ui | page | admin | foundation-ui | app/angelcare-marketplace/(protected)/admin/foundation-ui/page.tsx |
| /angelcare-marketplace/admin/growth | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/page.tsx |
| /angelcare-marketplace/admin/growth/audiences | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/audiences/page.tsx |
| /angelcare-marketplace/admin/growth/campaigns | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/campaigns/page.tsx |
| /angelcare-marketplace/admin/growth/experiments | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/experiments/page.tsx |
| /angelcare-marketplace/admin/growth/opportunities | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/opportunities/page.tsx |
| /angelcare-marketplace/admin/growth/recommendations | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/recommendations/page.tsx |
| /angelcare-marketplace/admin/growth/recovery | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/recovery/page.tsx |
| /angelcare-marketplace/admin/growth/retention | page | admin | growth | app/angelcare-marketplace/(protected)/admin/growth/retention/page.tsx |
| /angelcare-marketplace/admin/intelligence | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/page.tsx |
| /angelcare-marketplace/admin/intelligence/academy | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/academy/page.tsx |
| /angelcare-marketplace/admin/intelligence/b2b | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/b2b/page.tsx |
| /angelcare-marketplace/admin/intelligence/categories | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/categories/page.tsx |
| /angelcare-marketplace/admin/intelligence/conversion | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/conversion/page.tsx |
| /angelcare-marketplace/admin/intelligence/customers | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/customers/page.tsx |
| /angelcare-marketplace/admin/intelligence/demand | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/demand/page.tsx |
| /angelcare-marketplace/admin/intelligence/discovery | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/discovery/page.tsx |
| /angelcare-marketplace/admin/intelligence/executive | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/executive/page.tsx |
| /angelcare-marketplace/admin/intelligence/experiments | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/experiments/page.tsx |
| /angelcare-marketplace/admin/intelligence/forecasting | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/forecasting/page.tsx |
| /angelcare-marketplace/admin/intelligence/growth | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/growth/page.tsx |
| /angelcare-marketplace/admin/intelligence/operations | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/operations/page.tsx |
| /angelcare-marketplace/admin/intelligence/partner-os | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/partner-os/page.tsx |
| /angelcare-marketplace/admin/intelligence/revenue | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/revenue/page.tsx |
| /angelcare-marketplace/admin/intelligence/territories | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/territories/page.tsx |
| /angelcare-marketplace/admin/intelligence/trust | page | admin | intelligence | app/angelcare-marketplace/(protected)/admin/intelligence/trust/page.tsx |
| /angelcare-marketplace/admin/journeys | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/page.tsx |
| /angelcare-marketplace/admin/journeys/[journeyId] | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/[journeyId]/page.tsx |
| /angelcare-marketplace/admin/journeys/action-center | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/action-center/page.tsx |
| /angelcare-marketplace/admin/journeys/analytics | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/analytics/page.tsx |
| /angelcare-marketplace/admin/journeys/assessments | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/assessments/page.tsx |
| /angelcare-marketplace/admin/journeys/bookings | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/bookings/page.tsx |
| /angelcare-marketplace/admin/journeys/configuration | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/configuration/page.tsx |
| /angelcare-marketplace/admin/journeys/documents | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/documents/page.tsx |
| /angelcare-marketplace/admin/journeys/enrollments | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/enrollments/page.tsx |
| /angelcare-marketplace/admin/journeys/exceptions | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/exceptions/page.tsx |
| /angelcare-marketplace/admin/journeys/fulfillment | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/fulfillment/page.tsx |
| /angelcare-marketplace/admin/journeys/notifications | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/notifications/page.tsx |
| /angelcare-marketplace/admin/journeys/orders | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/orders/page.tsx |
| /angelcare-marketplace/admin/journeys/quotations | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/quotations/page.tsx |
| /angelcare-marketplace/admin/journeys/recovery | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/recovery/page.tsx |
| /angelcare-marketplace/admin/journeys/subscriptions | page | admin | journeys | app/angelcare-marketplace/(protected)/admin/journeys/subscriptions/page.tsx |
| /angelcare-marketplace/admin/launch | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/page.tsx |
| /angelcare-marketplace/admin/launch/approvals | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/approvals/page.tsx |
| /angelcare-marketplace/admin/launch/blockers | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/blockers/page.tsx |
| /angelcare-marketplace/admin/launch/defects | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/defects/page.tsx |
| /angelcare-marketplace/admin/launch/evidence | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/evidence/page.tsx |
| /angelcare-marketplace/admin/launch/gates | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/gates/page.tsx |
| /angelcare-marketplace/admin/launch/monitoring | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/monitoring/page.tsx |
| /angelcare-marketplace/admin/launch/post-launch | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/post-launch/page.tsx |
| /angelcare-marketplace/admin/launch/readiness | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/readiness/page.tsx |
| /angelcare-marketplace/admin/launch/release | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/release/page.tsx |
| /angelcare-marketplace/admin/launch/rollback | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/rollback/page.tsx |
| /angelcare-marketplace/admin/launch/runbook | page | admin | launch | app/angelcare-marketplace/(protected)/admin/launch/runbook/page.tsx |
| /angelcare-marketplace/admin/localization | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/page.tsx |
| /angelcare-marketplace/admin/localization/csv | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/csv/page.tsx |
| /angelcare-marketplace/admin/localization/glossary | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/glossary/page.tsx |
| /angelcare-marketplace/admin/localization/imports | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/imports/page.tsx |
| /angelcare-marketplace/admin/localization/inventory | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/inventory/page.tsx |
| /angelcare-marketplace/admin/localization/memory | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/memory/page.tsx |
| /angelcare-marketplace/admin/localization/readiness | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/readiness/page.tsx |
| /angelcare-marketplace/admin/localization/reviews | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/reviews/page.tsx |
| /angelcare-marketplace/admin/localization/rtl-lab | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/rtl-lab/page.tsx |
| /angelcare-marketplace/admin/localization/scanner | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/scanner/page.tsx |
| /angelcare-marketplace/admin/localization/seo | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/seo/page.tsx |
| /angelcare-marketplace/admin/localization/sources | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/sources/page.tsx |
| /angelcare-marketplace/admin/localization/translations | page | admin | localization | app/angelcare-marketplace/(protected)/admin/localization/translations/page.tsx |
| /angelcare-marketplace/admin/marketplace | page | admin | marketplace | app/angelcare-marketplace/(protected)/admin/marketplace/page.tsx |
| /angelcare-marketplace/admin/modules | page | admin | modules | app/angelcare-marketplace/(protected)/admin/modules/page.tsx |
| /angelcare-marketplace/admin/modules/[moduleKey] | page | admin | modules | app/angelcare-marketplace/(protected)/admin/modules/[moduleKey]/page.tsx |
| /angelcare-marketplace/admin/objects/[objectType]/[objectId] | page | admin | objects | app/angelcare-marketplace/(protected)/admin/objects/[objectType]/[objectId]/page.tsx |
| /angelcare-marketplace/admin/operations | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/page.tsx |
| /angelcare-marketplace/admin/operations/academy | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/academy/page.tsx |
| /angelcare-marketplace/admin/operations/action-center | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/action-center/page.tsx |
| /angelcare-marketplace/admin/operations/analytics | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/analytics/page.tsx |
| /angelcare-marketplace/admin/operations/b2b | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/b2b/page.tsx |
| /angelcare-marketplace/admin/operations/checklists | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/checklists/page.tsx |
| /angelcare-marketplace/admin/operations/closure | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/closure/page.tsx |
| /angelcare-marketplace/admin/operations/configuration | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/configuration/page.tsx |
| /angelcare-marketplace/admin/operations/dispatch | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/dispatch/page.tsx |
| /angelcare-marketplace/admin/operations/disputes | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/disputes/page.tsx |
| /angelcare-marketplace/admin/operations/escalations | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/escalations/page.tsx |
| /angelcare-marketplace/admin/operations/exceptions | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/exceptions/page.tsx |
| /angelcare-marketplace/admin/operations/fulfillment | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/fulfillment/page.tsx |
| /angelcare-marketplace/admin/operations/fulfillment/[caseId] | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/fulfillment/[caseId]/page.tsx |
| /angelcare-marketplace/admin/operations/incidents | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/incidents/page.tsx |
| /angelcare-marketplace/admin/operations/live | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/live/page.tsx |
| /angelcare-marketplace/admin/operations/missions | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/missions/page.tsx |
| /angelcare-marketplace/admin/operations/missions/[missionId] | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/missions/[missionId]/page.tsx |
| /angelcare-marketplace/admin/operations/orders | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/orders/page.tsx |
| /angelcare-marketplace/admin/operations/partner-os | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/partner-os/page.tsx |
| /angelcare-marketplace/admin/operations/proof | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/proof/page.tsx |
| /angelcare-marketplace/admin/operations/quality-check | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/quality-check/page.tsx |
| /angelcare-marketplace/admin/operations/reconciliation | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/reconciliation/page.tsx |
| /angelcare-marketplace/admin/operations/recovery | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/recovery/page.tsx |
| /angelcare-marketplace/admin/operations/replacements | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/replacements/page.tsx |
| /angelcare-marketplace/admin/operations/reports | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/reports/page.tsx |
| /angelcare-marketplace/admin/operations/returns | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/returns/page.tsx |
| /angelcare-marketplace/admin/operations/services | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/services/page.tsx |
| /angelcare-marketplace/admin/operations/settlements | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/settlements/page.tsx |
| /angelcare-marketplace/admin/operations/today | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/today/page.tsx |
| /angelcare-marketplace/admin/operations/validation | page | admin | operations | app/angelcare-marketplace/(protected)/admin/operations/validation/page.tsx |
| /angelcare-marketplace/admin/partner-os | page | admin | partner-os | app/angelcare-marketplace/(protected)/admin/partner-os/page.tsx |
| /angelcare-marketplace/admin/partner-os/plans | page | admin | partner-os | app/angelcare-marketplace/(protected)/admin/partner-os/plans/page.tsx |
| /angelcare-marketplace/admin/partner-os/tenants | page | admin | partner-os | app/angelcare-marketplace/(protected)/admin/partner-os/tenants/page.tsx |
| /angelcare-marketplace/admin/platform-performance | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/page.tsx |
| /angelcare-marketplace/admin/platform-performance/apis | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/apis/page.tsx |
| /angelcare-marketplace/admin/platform-performance/database | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/database/page.tsx |
| /angelcare-marketplace/admin/platform-performance/errors | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/errors/page.tsx |
| /angelcare-marketplace/admin/platform-performance/media | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/media/page.tsx |
| /angelcare-marketplace/admin/platform-performance/routes | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/routes/page.tsx |
| /angelcare-marketplace/admin/platform-performance/search | page | admin | platform-performance | app/angelcare-marketplace/(protected)/admin/platform-performance/search/page.tsx |
| /angelcare-marketplace/admin/providers | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/page.tsx |
| /angelcare-marketplace/admin/providers/assignments | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/assignments/page.tsx |
| /angelcare-marketplace/admin/providers/availability | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/availability/page.tsx |
| /angelcare-marketplace/admin/providers/certifications | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/certifications/page.tsx |
| /angelcare-marketplace/admin/providers/commerce | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/commerce/page.tsx |
| /angelcare-marketplace/admin/providers/commerce/disputes | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/commerce/disputes/page.tsx |
| /angelcare-marketplace/admin/providers/commerce/evidence | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/commerce/evidence/page.tsx |
| /angelcare-marketplace/admin/providers/commerce/payables | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/commerce/payables/page.tsx |
| /angelcare-marketplace/admin/providers/commerce/quality | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/commerce/quality/page.tsx |
| /angelcare-marketplace/admin/providers/commerce/readiness | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/commerce/readiness/page.tsx |
| /angelcare-marketplace/admin/providers/documents | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/documents/page.tsx |
| /angelcare-marketplace/admin/providers/dossiers | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/dossiers/page.tsx |
| /angelcare-marketplace/admin/providers/dossiers/[providerId] | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/dossiers/[providerId]/page.tsx |
| /angelcare-marketplace/admin/providers/eligibility | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/eligibility/page.tsx |
| /angelcare-marketplace/admin/providers/onboarding | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/onboarding/page.tsx |
| /angelcare-marketplace/admin/providers/payable-eligibility | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/payable-eligibility/page.tsx |
| /angelcare-marketplace/admin/providers/performance | page | admin | providers | app/angelcare-marketplace/(protected)/admin/providers/performance/page.tsx |
| /angelcare-marketplace/admin/public-inquiries | page | admin | public-inquiries | app/angelcare-marketplace/(protected)/admin/public-inquiries/page.tsx |
| /angelcare-marketplace/admin/qa | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/page.tsx |
| /angelcare-marketplace/admin/qa/accessibility | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/accessibility/page.tsx |
| /angelcare-marketplace/admin/qa/contracts | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/contracts/page.tsx |
| /angelcare-marketplace/admin/qa/data-integrity | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/data-integrity/page.tsx |
| /angelcare-marketplace/admin/qa/defects | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/defects/page.tsx |
| /angelcare-marketplace/admin/qa/evidence | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/evidence/page.tsx |
| /angelcare-marketplace/admin/qa/localization | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/localization/page.tsx |
| /angelcare-marketplace/admin/qa/regression | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/regression/page.tsx |
| /angelcare-marketplace/admin/qa/responsive | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/responsive/page.tsx |
| /angelcare-marketplace/admin/qa/routes | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/routes/page.tsx |
| /angelcare-marketplace/admin/qa/security | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/security/page.tsx |
| /angelcare-marketplace/admin/qa/workflows | page | admin | qa | app/angelcare-marketplace/(protected)/admin/qa/workflows/page.tsx |
| /angelcare-marketplace/admin/quality-assurance | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/accessibility | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/accessibility/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/defects | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/defects/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/localization | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/localization/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/performance | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/performance/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/regressions | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/regressions/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/release | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/release/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/runs | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/runs/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/security | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/security/page.tsx |
| /angelcare-marketplace/admin/quality-assurance/suites | page | admin | quality-assurance | app/angelcare-marketplace/(protected)/admin/quality-assurance/suites/page.tsx |
| /angelcare-marketplace/admin/quote-baskets | page | admin | quote-baskets | app/angelcare-marketplace/(protected)/admin/quote-baskets/page.tsx |
| /angelcare-marketplace/admin/readiness | page | admin | readiness | app/angelcare-marketplace/(protected)/admin/readiness/page.tsx |
| /angelcare-marketplace/admin/search | page | admin | search | app/angelcare-marketplace/(protected)/admin/search/page.tsx |
| /angelcare-marketplace/admin/security | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/page.tsx |
| /angelcare-marketplace/admin/security-audit | page | admin | security-audit | app/angelcare-marketplace/(protected)/admin/security-audit/page.tsx |
| /angelcare-marketplace/admin/security/access | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/access/page.tsx |
| /angelcare-marketplace/admin/security/audit | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/audit/page.tsx |
| /angelcare-marketplace/admin/security/data-exposure | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/data-exposure/page.tsx |
| /angelcare-marketplace/admin/security/data-retention | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/data-retention/page.tsx |
| /angelcare-marketplace/admin/security/events | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/events/page.tsx |
| /angelcare-marketplace/admin/security/incidents | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/incidents/page.tsx |
| /angelcare-marketplace/admin/security/permissions | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/permissions/page.tsx |
| /angelcare-marketplace/admin/security/rbac | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/rbac/page.tsx |
| /angelcare-marketplace/admin/security/recovery | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/recovery/page.tsx |
| /angelcare-marketplace/admin/security/reviews | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/reviews/page.tsx |
| /angelcare-marketplace/admin/security/roles | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/roles/page.tsx |
| /angelcare-marketplace/admin/security/secrets | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/secrets/page.tsx |
| /angelcare-marketplace/admin/security/separation-of-duties | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/separation-of-duties/page.tsx |
| /angelcare-marketplace/admin/security/sessions | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/sessions/page.tsx |
| /angelcare-marketplace/admin/security/tenant-isolation | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/tenant-isolation/page.tsx |
| /angelcare-marketplace/admin/security/territory-isolation | page | admin | security | app/angelcare-marketplace/(protected)/admin/security/territory-isolation/page.tsx |
| /angelcare-marketplace/admin/suppliers | page | admin | suppliers | app/angelcare-marketplace/(protected)/admin/suppliers/page.tsx |
| /angelcare-marketplace/admin/territories | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/page.tsx |
| /angelcare-marketplace/admin/territories/[territoryCode] | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/[territoryCode]/page.tsx |
| /angelcare-marketplace/admin/territories/[territoryCode]/health | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/[territoryCode]/health/page.tsx |
| /angelcare-marketplace/admin/territories/[territoryCode]/overrides | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/[territoryCode]/overrides/page.tsx |
| /angelcare-marketplace/admin/territories/[territoryCode]/preview | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/[territoryCode]/preview/page.tsx |
| /angelcare-marketplace/admin/territories/[territoryCode]/readiness | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/[territoryCode]/readiness/page.tsx |
| /angelcare-marketplace/admin/territories/[territoryCode]/settings | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/[territoryCode]/settings/page.tsx |
| /angelcare-marketplace/admin/territories/clone | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/clone/page.tsx |
| /angelcare-marketplace/admin/territories/new | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/new/page.tsx |
| /angelcare-marketplace/admin/territories/registry | page | admin | territories | app/angelcare-marketplace/(protected)/admin/territories/registry/page.tsx |
| /angelcare-marketplace/admin/trust | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/page.tsx |
| /angelcare-marketplace/admin/trust/audits | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/audits/page.tsx |
| /angelcare-marketplace/admin/trust/badges | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/badges/page.tsx |
| /angelcare-marketplace/admin/trust/command | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/command/page.tsx |
| /angelcare-marketplace/admin/trust/complaints | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/complaints/page.tsx |
| /angelcare-marketplace/admin/trust/compliance | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/compliance/page.tsx |
| /angelcare-marketplace/admin/trust/corrective-actions | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/corrective-actions/page.tsx |
| /angelcare-marketplace/admin/trust/evidence | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/evidence/page.tsx |
| /angelcare-marketplace/admin/trust/investigations | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/investigations/page.tsx |
| /angelcare-marketplace/admin/trust/non-conformities | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/non-conformities/page.tsx |
| /angelcare-marketplace/admin/trust/quality-check-360 | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/quality-check-360/page.tsx |
| /angelcare-marketplace/admin/trust/reports | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/reports/page.tsx |
| /angelcare-marketplace/admin/trust/sensitive-content | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/sensitive-content/page.tsx |
| /angelcare-marketplace/admin/trust/sops | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/sops/page.tsx |
| /angelcare-marketplace/admin/trust/standards | page | admin | trust | app/angelcare-marketplace/(protected)/admin/trust/standards/page.tsx |
| /angelcare-marketplace/admin/vendors | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/page.tsx |
| /angelcare-marketplace/admin/vendors/catalog-links | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/catalog-links/page.tsx |
| /angelcare-marketplace/admin/vendors/contracts | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/contracts/page.tsx |
| /angelcare-marketplace/admin/vendors/disputes | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/disputes/page.tsx |
| /angelcare-marketplace/admin/vendors/inventory | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/inventory/page.tsx |
| /angelcare-marketplace/admin/vendors/onboarding | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/onboarding/page.tsx |
| /angelcare-marketplace/admin/vendors/orders | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/orders/page.tsx |
| /angelcare-marketplace/admin/vendors/performance | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/performance/page.tsx |
| /angelcare-marketplace/admin/vendors/quality | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/quality/page.tsx |
| /angelcare-marketplace/admin/vendors/registry | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/registry/page.tsx |
| /angelcare-marketplace/admin/vendors/settlements | page | admin | vendors | app/angelcare-marketplace/(protected)/admin/vendors/settlements/page.tsx |
| /angelcare-marketplace/admin/verticals | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/page.tsx |
| /angelcare-marketplace/admin/verticals/corporates | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/corporates/page.tsx |
| /angelcare-marketplace/admin/verticals/corporates/eligibility | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/corporates/eligibility/page.tsx |
| /angelcare-marketplace/admin/verticals/corporates/impact | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/corporates/impact/page.tsx |
| /angelcare-marketplace/admin/verticals/corporates/programs | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/corporates/programs/page.tsx |
| /angelcare-marketplace/admin/verticals/corporates/usage | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/corporates/usage/page.tsx |
| /angelcare-marketplace/admin/verticals/establishments | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/establishments/page.tsx |
| /angelcare-marketplace/admin/verticals/establishments/conversions | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/establishments/conversions/page.tsx |
| /angelcare-marketplace/admin/verticals/establishments/diagnostics | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/establishments/diagnostics/page.tsx |
| /angelcare-marketplace/admin/verticals/establishments/proposals | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/establishments/proposals/page.tsx |
| /angelcare-marketplace/admin/verticals/establishments/quality-checks | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/establishments/quality-checks/page.tsx |
| /angelcare-marketplace/admin/verticals/health-partners | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/health-partners/page.tsx |
| /angelcare-marketplace/admin/verticals/health-partners/compliance | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/health-partners/compliance/page.tsx |
| /angelcare-marketplace/admin/verticals/health-partners/consents | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/health-partners/consents/page.tsx |
| /angelcare-marketplace/admin/verticals/health-partners/programs | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/health-partners/programs/page.tsx |
| /angelcare-marketplace/admin/verticals/health-partners/referrals | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/health-partners/referrals/page.tsx |
| /angelcare-marketplace/admin/verticals/hospitality | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/hospitality/page.tsx |
| /angelcare-marketplace/admin/verticals/hospitality/programs | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/hospitality/programs/page.tsx |
| /angelcare-marketplace/admin/verticals/hospitality/properties | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/hospitality/properties/page.tsx |
| /angelcare-marketplace/admin/verticals/hospitality/readiness | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/hospitality/readiness/page.tsx |
| /angelcare-marketplace/admin/verticals/hospitality/reports | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/hospitality/reports/page.tsx |
| /angelcare-marketplace/admin/verticals/organizations | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/organizations/page.tsx |
| /angelcare-marketplace/admin/verticals/organizations/[organizationId] | page | admin | verticals | app/angelcare-marketplace/(protected)/admin/verticals/organizations/[organizationId]/page.tsx |
| /angelcare-marketplace/family | page | family | family | app/angelcare-marketplace/(family)/family/page.tsx |
| /angelcare-marketplace/family/account | page | family | family | app/angelcare-marketplace/(family)/family/account/page.tsx |
| /angelcare-marketplace/family/children | page | family | family | app/angelcare-marketplace/(family)/family/children/page.tsx |
| /angelcare-marketplace/family/children/[childId] | page | family | family | app/angelcare-marketplace/(family)/family/children/[childId]/page.tsx |
| /angelcare-marketplace/family/children/new | page | family | family | app/angelcare-marketplace/(family)/family/children/new/page.tsx |
| /angelcare-marketplace/family/dashboard | page | family | family | app/angelcare-marketplace/(family)/family/dashboard/page.tsx |
| /angelcare-marketplace/family/diagnostic | page | family | family | app/angelcare-marketplace/(family)/family/diagnostic/page.tsx |
| /angelcare-marketplace/family/missions | page | family | family | app/angelcare-marketplace/(family)/family/missions/page.tsx |
| /angelcare-marketplace/family/missions/[missionId] | page | family | family | app/angelcare-marketplace/(family)/family/missions/[missionId]/page.tsx |
| /angelcare-marketplace/family/reports | page | family | family | app/angelcare-marketplace/(family)/family/reports/page.tsx |
| /angelcare-marketplace/family/request | page | family | family | app/angelcare-marketplace/(family)/family/request/page.tsx |
| /angelcare-marketplace/family/requests | page | family | family | app/angelcare-marketplace/(family)/family/requests/page.tsx |
| /angelcare-marketplace/family/requests/[requestId] | page | family | family | app/angelcare-marketplace/(family)/family/requests/[requestId]/page.tsx |
| /angelcare-marketplace/family/support | page | family | family | app/angelcare-marketplace/(family)/family/support/page.tsx |
| /angelcare-marketplace/family/support/[ticketId] | page | family | family | app/angelcare-marketplace/(family)/family/support/[ticketId]/page.tsx |
| /angelcare-marketplace/partner/dashboard | page | tenant | partner | app/angelcare-marketplace/(tenant)/partner/dashboard/page.tsx |
| /angelcare-marketplace/preview/[token] | page | platform | preview | app/angelcare-marketplace/preview/[token]/page.tsx |
| /angelcare-marketplace/provider | page | provider | provider | app/angelcare-marketplace/(provider)/provider/page.tsx |
| /angelcare-marketplace/provider/availability | page | provider | provider | app/angelcare-marketplace/(provider)/provider/availability/page.tsx |
| /angelcare-marketplace/provider/certifications | page | provider | provider | app/angelcare-marketplace/(provider)/provider/certifications/page.tsx |
| /angelcare-marketplace/provider/documents | page | provider | provider | app/angelcare-marketplace/(provider)/provider/documents/page.tsx |
| /angelcare-marketplace/provider/missions | page | provider | provider | app/angelcare-marketplace/(provider)/provider/missions/page.tsx |
| /angelcare-marketplace/provider/missions/[missionId] | page | provider | provider | app/angelcare-marketplace/(provider)/provider/missions/[missionId]/page.tsx |
| /angelcare-marketplace/provider/onboarding | page | provider | provider | app/angelcare-marketplace/(provider)/provider/onboarding/page.tsx |
| /angelcare-marketplace/provider/payments | page | provider | provider | app/angelcare-marketplace/(provider)/provider/payments/page.tsx |
| /angelcare-marketplace/provider/reports | page | provider | provider | app/angelcare-marketplace/(provider)/provider/reports/page.tsx |
| /angelcare-marketplace/trainer | page | trainer | trainer | app/angelcare-marketplace/(trainer)/trainer/page.tsx |
| /angelcare-marketplace/trainer/assessments | page | trainer | trainer | app/angelcare-marketplace/(trainer)/trainer/assessments/page.tsx |
| /angelcare-marketplace/trainer/attendance | page | trainer | trainer | app/angelcare-marketplace/(trainer)/trainer/attendance/page.tsx |
| /angelcare-marketplace/trainer/cohorts | page | trainer | trainer | app/angelcare-marketplace/(trainer)/trainer/cohorts/page.tsx |
| /angelcare-marketplace/trainer/sessions | page | trainer | trainer | app/angelcare-marketplace/(trainer)/trainer/sessions/page.tsx |
| /angelcare-marketplace/unavailable | page | platform | unavailable | app/angelcare-marketplace/unavailable/page.tsx |
| /angelcare-marketplace/workspace | page | platform | workspace | app/angelcare-marketplace/(protected)/workspace/page.tsx |
| /api/angelcare-marketplace/academy/assessment-results | api | api | apiacademy | app/api/angelcare-marketplace/academy/assessment-results/route.ts |
| /api/angelcare-marketplace/academy/assessments | api | api | apiacademy | app/api/angelcare-marketplace/academy/assessments/route.ts |
| /api/angelcare-marketplace/academy/attendance | api | api | apiacademy | app/api/angelcare-marketplace/academy/attendance/route.ts |
| /api/angelcare-marketplace/academy/b2b-training | api | api | apiacademy | app/api/angelcare-marketplace/academy/b2b-training/route.ts |
| /api/angelcare-marketplace/academy/certificates | api | api | apiacademy | app/api/angelcare-marketplace/academy/certificates/route.ts |
| /api/angelcare-marketplace/academy/certificates/[certificateId]/decision | api | api | apiacademy | app/api/angelcare-marketplace/academy/certificates/[certificateId]/decision/route.ts |
| /api/angelcare-marketplace/academy/cohorts | api | api | apiacademy | app/api/angelcare-marketplace/academy/cohorts/route.ts |
| /api/angelcare-marketplace/academy/enrollments | api | api | apiacademy | app/api/angelcare-marketplace/academy/enrollments/route.ts |
| /api/angelcare-marketplace/academy/programs | api | api | apiacademy | app/api/angelcare-marketplace/academy/programs/route.ts |
| /api/angelcare-marketplace/academy/sessions | api | api | apiacademy | app/api/angelcare-marketplace/academy/sessions/route.ts |
| /api/angelcare-marketplace/academy/summary | api | api | apiacademy | app/api/angelcare-marketplace/academy/summary/route.ts |
| /api/angelcare-marketplace/admin/families | api | api | apiadmin | app/api/angelcare-marketplace/admin/families/route.ts |
| /api/angelcare-marketplace/admin/family-requests | api | api | apiadmin | app/api/angelcare-marketplace/admin/family-requests/route.ts |
| /api/angelcare-marketplace/admin/family-requests/[requestId]/qualify | api | api | apiadmin | app/api/angelcare-marketplace/admin/family-requests/[requestId]/qualify/route.ts |
| /api/angelcare-marketplace/analytics/data-quality | api | api | apianalytics | app/api/angelcare-marketplace/analytics/data-quality/route.ts |
| /api/angelcare-marketplace/analytics/metrics | api | api | apianalytics | app/api/angelcare-marketplace/analytics/metrics/route.ts |
| /api/angelcare-marketplace/analytics/refresh | api | api | apianalytics | app/api/angelcare-marketplace/analytics/refresh/route.ts |
| /api/angelcare-marketplace/analytics/snapshots | api | api | apianalytics | app/api/angelcare-marketplace/analytics/snapshots/route.ts |
| /api/angelcare-marketplace/analytics/summary | api | api | apianalytics | app/api/angelcare-marketplace/analytics/summary/route.ts |
| /api/angelcare-marketplace/b2b/corporates/eligibility | api | api | apib2b | app/api/angelcare-marketplace/b2b/corporates/eligibility/route.ts |
| /api/angelcare-marketplace/b2b/corporates/programs | api | api | apib2b | app/api/angelcare-marketplace/b2b/corporates/programs/route.ts |
| /api/angelcare-marketplace/b2b/corporates/quotas/[quotaId]/consume | api | api | apib2b | app/api/angelcare-marketplace/b2b/corporates/quotas/[quotaId]/consume/route.ts |
| /api/angelcare-marketplace/b2b/diagnostics | api | api | apib2b | app/api/angelcare-marketplace/b2b/diagnostics/route.ts |
| /api/angelcare-marketplace/b2b/diagnostics/[diagnosticId]/convert | api | api | apib2b | app/api/angelcare-marketplace/b2b/diagnostics/[diagnosticId]/convert/route.ts |
| /api/angelcare-marketplace/b2b/diagnostics/[diagnosticId]/transition | api | api | apib2b | app/api/angelcare-marketplace/b2b/diagnostics/[diagnosticId]/transition/route.ts |
| /api/angelcare-marketplace/b2b/establishments/quality-checks | api | api | apib2b | app/api/angelcare-marketplace/b2b/establishments/quality-checks/route.ts |
| /api/angelcare-marketplace/b2b/health-partners/compliance | api | api | apib2b | app/api/angelcare-marketplace/b2b/health-partners/compliance/route.ts |
| /api/angelcare-marketplace/b2b/hospitality/programs | api | api | apib2b | app/api/angelcare-marketplace/b2b/hospitality/programs/route.ts |
| /api/angelcare-marketplace/b2b/hospitality/properties | api | api | apib2b | app/api/angelcare-marketplace/b2b/hospitality/properties/route.ts |
| /api/angelcare-marketplace/b2b/organizations | api | api | apib2b | app/api/angelcare-marketplace/b2b/organizations/route.ts |
| /api/angelcare-marketplace/b2b/organizations/[organizationId] | api | api | apib2b | app/api/angelcare-marketplace/b2b/organizations/[organizationId]/route.ts |
| /api/angelcare-marketplace/b2b/programs | api | api | apib2b | app/api/angelcare-marketplace/b2b/programs/route.ts |
| /api/angelcare-marketplace/b2b/programs/[programId]/transition | api | api | apib2b | app/api/angelcare-marketplace/b2b/programs/[programId]/transition/route.ts |
| /api/angelcare-marketplace/b2b/public/diagnostics | api | api | apib2b | app/api/angelcare-marketplace/b2b/public/diagnostics/route.ts |
| /api/angelcare-marketplace/b2b/summary | api | api | apib2b | app/api/angelcare-marketplace/b2b/summary/route.ts |
| /api/angelcare-marketplace/backoffice/actions | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/actions/route.ts |
| /api/angelcare-marketplace/backoffice/actions/[actionId] | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/actions/[actionId]/route.ts |
| /api/angelcare-marketplace/backoffice/approvals | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/approvals/route.ts |
| /api/angelcare-marketplace/backoffice/approvals/[approvalId]/decision | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/approvals/[approvalId]/decision/route.ts |
| /api/angelcare-marketplace/backoffice/briefs | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/briefs/route.ts |
| /api/angelcare-marketplace/backoffice/objects/[objectType]/[objectId] | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/objects/[objectType]/[objectId]/route.ts |
| /api/angelcare-marketplace/backoffice/objects/[objectType]/[objectId]/comments | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/objects/[objectType]/[objectId]/comments/route.ts |
| /api/angelcare-marketplace/backoffice/search | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/search/route.ts |
| /api/angelcare-marketplace/backoffice/summary | api | api | apibackoffice | app/api/angelcare-marketplace/backoffice/summary/route.ts |
| /api/angelcare-marketplace/catalog | api | api | apicatalog | app/api/angelcare-marketplace/catalog/route.ts |
| /api/angelcare-marketplace/catalog/[itemId]/transition | api | api | apicatalog | app/api/angelcare-marketplace/catalog/[itemId]/transition/route.ts |
| /api/angelcare-marketplace/catalog/summary | api | api | apicatalog | app/api/angelcare-marketplace/catalog/summary/route.ts |
| /api/angelcare-marketplace/cms/ctas | api | api | apicms | app/api/angelcare-marketplace/cms/ctas/route.ts |
| /api/angelcare-marketplace/cms/menus | api | api | apicms | app/api/angelcare-marketplace/cms/menus/route.ts |
| /api/angelcare-marketplace/cms/pages | api | api | apicms | app/api/angelcare-marketplace/cms/pages/route.ts |
| /api/angelcare-marketplace/cms/pages/[pageId] | api | api | apicms | app/api/angelcare-marketplace/cms/pages/[pageId]/route.ts |
| /api/angelcare-marketplace/cms/pages/[pageId]/blocks | api | api | apicms | app/api/angelcare-marketplace/cms/pages/[pageId]/blocks/route.ts |
| /api/angelcare-marketplace/cms/pages/[pageId]/preview | api | api | apicms | app/api/angelcare-marketplace/cms/pages/[pageId]/preview/route.ts |
| /api/angelcare-marketplace/cms/pages/[pageId]/rollback | api | api | apicms | app/api/angelcare-marketplace/cms/pages/[pageId]/rollback/route.ts |
| /api/angelcare-marketplace/cms/pages/[pageId]/transition | api | api | apicms | app/api/angelcare-marketplace/cms/pages/[pageId]/transition/route.ts |
| /api/angelcare-marketplace/cms/publishing | api | api | apicms | app/api/angelcare-marketplace/cms/publishing/route.ts |
| /api/angelcare-marketplace/conversion/admin/sessions | api | api | apiconversion | app/api/angelcare-marketplace/conversion/admin/sessions/route.ts |
| /api/angelcare-marketplace/conversion/admin/sessions/[sessionId]/recover | api | api | apiconversion | app/api/angelcare-marketplace/conversion/admin/sessions/[sessionId]/recover/route.ts |
| /api/angelcare-marketplace/conversion/admin/summary | api | api | apiconversion | app/api/angelcare-marketplace/conversion/admin/summary/route.ts |
| /api/angelcare-marketplace/conversion/basket | api | api | apiconversion | app/api/angelcare-marketplace/conversion/basket/route.ts |
| /api/angelcare-marketplace/conversion/basket/[basketId]/checkout | api | api | apiconversion | app/api/angelcare-marketplace/conversion/basket/[basketId]/checkout/route.ts |
| /api/angelcare-marketplace/conversion/basket/[basketId]/items | api | api | apiconversion | app/api/angelcare-marketplace/conversion/basket/[basketId]/items/route.ts |
| /api/angelcare-marketplace/conversion/sessions | api | api | apiconversion | app/api/angelcare-marketplace/conversion/sessions/route.ts |
| /api/angelcare-marketplace/conversion/sessions/[sessionKey] | api | api | apiconversion | app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/route.ts |
| /api/angelcare-marketplace/conversion/sessions/[sessionKey]/availability | api | api | apiconversion | app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/availability/route.ts |
| /api/angelcare-marketplace/conversion/sessions/[sessionKey]/confirm | api | api | apiconversion | app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/confirm/route.ts |
| /api/angelcare-marketplace/conversion/sessions/[sessionKey]/consent | api | api | apiconversion | app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/consent/route.ts |
| /api/angelcare-marketplace/conversion/sessions/[sessionKey]/price | api | api | apiconversion | app/api/angelcare-marketplace/conversion/sessions/[sessionKey]/price/route.ts |
| /api/angelcare-marketplace/crm/accounts | api | api | apicrm | app/api/angelcare-marketplace/crm/accounts/route.ts |
| /api/angelcare-marketplace/crm/leads | api | api | apicrm | app/api/angelcare-marketplace/crm/leads/route.ts |
| /api/angelcare-marketplace/crm/opportunities | api | api | apicrm | app/api/angelcare-marketplace/crm/opportunities/route.ts |
| /api/angelcare-marketplace/crm/opportunities/[opportunityId]/transition | api | api | apicrm | app/api/angelcare-marketplace/crm/opportunities/[opportunityId]/transition/route.ts |
| /api/angelcare-marketplace/crm/quotes | api | api | apicrm | app/api/angelcare-marketplace/crm/quotes/route.ts |
| /api/angelcare-marketplace/crm/summary | api | api | apicrm | app/api/angelcare-marketplace/crm/summary/route.ts |
| /api/angelcare-marketplace/development/activities | api | api | apidevelopment | app/api/angelcare-marketplace/development/activities/route.ts |
| /api/angelcare-marketplace/development/activities/[activityId]/transition | api | api | apidevelopment | app/api/angelcare-marketplace/development/activities/[activityId]/transition/route.ts |
| /api/angelcare-marketplace/development/categories | api | api | apidevelopment | app/api/angelcare-marketplace/development/categories/route.ts |
| /api/angelcare-marketplace/development/kits | api | api | apidevelopment | app/api/angelcare-marketplace/development/kits/route.ts |
| /api/angelcare-marketplace/development/summary | api | api | apidevelopment | app/api/angelcare-marketplace/development/summary/route.ts |
| /api/angelcare-marketplace/development/supplier-specs | api | api | apidevelopment | app/api/angelcare-marketplace/development/supplier-specs/route.ts |
| /api/angelcare-marketplace/discovery/search | api | api | apidiscovery | app/api/angelcare-marketplace/discovery/search/route.ts |
| /api/angelcare-marketplace/family/account | api | api | apifamily | app/api/angelcare-marketplace/family/account/route.ts |
| /api/angelcare-marketplace/family/children | api | api | apifamily | app/api/angelcare-marketplace/family/children/route.ts |
| /api/angelcare-marketplace/family/children/[childId] | api | api | apifamily | app/api/angelcare-marketplace/family/children/[childId]/route.ts |
| /api/angelcare-marketplace/family/dashboard | api | api | apifamily | app/api/angelcare-marketplace/family/dashboard/route.ts |
| /api/angelcare-marketplace/family/diagnostics | api | api | apifamily | app/api/angelcare-marketplace/family/diagnostics/route.ts |
| /api/angelcare-marketplace/family/missions | api | api | apifamily | app/api/angelcare-marketplace/family/missions/route.ts |
| /api/angelcare-marketplace/family/missions/[missionId] | api | api | apifamily | app/api/angelcare-marketplace/family/missions/[missionId]/route.ts |
| /api/angelcare-marketplace/family/requests | api | api | apifamily | app/api/angelcare-marketplace/family/requests/route.ts |
| /api/angelcare-marketplace/family/requests/[requestId] | api | api | apifamily | app/api/angelcare-marketplace/family/requests/[requestId]/route.ts |
| /api/angelcare-marketplace/family/support | api | api | apifamily | app/api/angelcare-marketplace/family/support/route.ts |
| /api/angelcare-marketplace/family/support/[ticketId] | api | api | apifamily | app/api/angelcare-marketplace/family/support/[ticketId]/route.ts |
| /api/angelcare-marketplace/family/support/[ticketId]/messages | api | api | apifamily | app/api/angelcare-marketplace/family/support/[ticketId]/messages/route.ts |
| /api/angelcare-marketplace/finance/invoice-readiness | api | api | apifinance | app/api/angelcare-marketplace/finance/invoice-readiness/route.ts |
| /api/angelcare-marketplace/finance/invoice-readiness/evaluate | api | api | apifinance | app/api/angelcare-marketplace/finance/invoice-readiness/evaluate/route.ts |
| /api/angelcare-marketplace/finance/margin-exceptions | api | api | apifinance | app/api/angelcare-marketplace/finance/margin-exceptions/route.ts |
| /api/angelcare-marketplace/finance/margin-exceptions/[exceptionId]/decision | api | api | apifinance | app/api/angelcare-marketplace/finance/margin-exceptions/[exceptionId]/decision/route.ts |
| /api/angelcare-marketplace/finance/price-books | api | api | apifinance | app/api/angelcare-marketplace/finance/price-books/route.ts |
| /api/angelcare-marketplace/finance/price-books/[priceBookId]/transition | api | api | apifinance | app/api/angelcare-marketplace/finance/price-books/[priceBookId]/transition/route.ts |
| /api/angelcare-marketplace/finance/price-rules | api | api | apifinance | app/api/angelcare-marketplace/finance/price-rules/route.ts |
| /api/angelcare-marketplace/finance/price-rules/[priceRuleId]/evaluate | api | api | apifinance | app/api/angelcare-marketplace/finance/price-rules/[priceRuleId]/evaluate/route.ts |
| /api/angelcare-marketplace/finance/reconciliation | api | api | apifinance | app/api/angelcare-marketplace/finance/reconciliation/route.ts |
| /api/angelcare-marketplace/finance/revenue-streams | api | api | apifinance | app/api/angelcare-marketplace/finance/revenue-streams/route.ts |
| /api/angelcare-marketplace/finance/summary | api | api | apifinance | app/api/angelcare-marketplace/finance/summary/route.ts |
| /api/angelcare-marketplace/foundation/audit | api | api | apifoundation | app/api/angelcare-marketplace/foundation/audit/route.ts |
| /api/angelcare-marketplace/foundation/audit/export | api | api | apifoundation | app/api/angelcare-marketplace/foundation/audit/export/route.ts |
| /api/angelcare-marketplace/foundation/configuration | api | api | apifoundation | app/api/angelcare-marketplace/foundation/configuration/route.ts |
| /api/angelcare-marketplace/foundation/configuration/[key] | api | api | apifoundation | app/api/angelcare-marketplace/foundation/configuration/[key]/route.ts |
| /api/angelcare-marketplace/foundation/context | api | api | apifoundation | app/api/angelcare-marketplace/foundation/context/route.ts |
| /api/angelcare-marketplace/foundation/feature-flags | api | api | apifoundation | app/api/angelcare-marketplace/foundation/feature-flags/route.ts |
| /api/angelcare-marketplace/foundation/feature-flags/[flagKey] | api | api | apifoundation | app/api/angelcare-marketplace/foundation/feature-flags/[flagKey]/route.ts |
| /api/angelcare-marketplace/foundation/health | api | api | apifoundation | app/api/angelcare-marketplace/foundation/health/route.ts |
| /api/angelcare-marketplace/foundation/modules | api | api | apifoundation | app/api/angelcare-marketplace/foundation/modules/route.ts |
| /api/angelcare-marketplace/foundation/modules/[moduleKey] | api | api | apifoundation | app/api/angelcare-marketplace/foundation/modules/[moduleKey]/route.ts |
| /api/angelcare-marketplace/foundation/modules/[moduleKey]/transition | api | api | apifoundation | app/api/angelcare-marketplace/foundation/modules/[moduleKey]/transition/route.ts |
| /api/angelcare-marketplace/foundation/readiness | api | api | apifoundation | app/api/angelcare-marketplace/foundation/readiness/route.ts |
| /api/angelcare-marketplace/foundation/readiness/[checkKey] | api | api | apifoundation | app/api/angelcare-marketplace/foundation/readiness/[checkKey]/route.ts |
| /api/angelcare-marketplace/foundation/readiness/sign-off | api | api | apifoundation | app/api/angelcare-marketplace/foundation/readiness/sign-off/route.ts |
| /api/angelcare-marketplace/growth/experiments | api | api | apigrowth | app/api/angelcare-marketplace/growth/experiments/route.ts |
| /api/angelcare-marketplace/growth/experiments/[experimentId]/transition | api | api | apigrowth | app/api/angelcare-marketplace/growth/experiments/[experimentId]/transition/route.ts |
| /api/angelcare-marketplace/growth/opportunities | api | api | apigrowth | app/api/angelcare-marketplace/growth/opportunities/route.ts |
| /api/angelcare-marketplace/homepage/[kind] | api | api | apihomepage | app/api/angelcare-marketplace/homepage/[kind]/route.ts |
| /api/angelcare-marketplace/homepage/engagement | api | api | apihomepage | app/api/angelcare-marketplace/homepage/engagement/route.ts |
| /api/angelcare-marketplace/intelligence/executive | api | api | apiintelligence | app/api/angelcare-marketplace/intelligence/executive/route.ts |
| /api/angelcare-marketplace/intelligence/metrics | api | api | apiintelligence | app/api/angelcare-marketplace/intelligence/metrics/route.ts |
| /api/angelcare-marketplace/intelligence/observations | api | api | apiintelligence | app/api/angelcare-marketplace/intelligence/observations/route.ts |
| /api/angelcare-marketplace/journeys | api | api | apijourneys | app/api/angelcare-marketplace/journeys/route.ts |
| /api/angelcare-marketplace/journeys/[journeyId] | api | api | apijourneys | app/api/angelcare-marketplace/journeys/[journeyId]/route.ts |
| /api/angelcare-marketplace/journeys/[journeyId]/actions/[actionId]/complete | api | api | apijourneys | app/api/angelcare-marketplace/journeys/[journeyId]/actions/[actionId]/complete/route.ts |
| /api/angelcare-marketplace/journeys/[journeyId]/change-requests | api | api | apijourneys | app/api/angelcare-marketplace/journeys/[journeyId]/change-requests/route.ts |
| /api/angelcare-marketplace/journeys/[journeyId]/recovery | api | api | apijourneys | app/api/angelcare-marketplace/journeys/[journeyId]/recovery/route.ts |
| /api/angelcare-marketplace/journeys/account | api | api | apijourneys | app/api/angelcare-marketplace/journeys/account/route.ts |
| /api/angelcare-marketplace/journeys/admin | api | api | apijourneys | app/api/angelcare-marketplace/journeys/admin/route.ts |
| /api/angelcare-marketplace/journeys/admin/[journeyId] | api | api | apijourneys | app/api/angelcare-marketplace/journeys/admin/[journeyId]/route.ts |
| /api/angelcare-marketplace/journeys/admin/summary | api | api | apijourneys | app/api/angelcare-marketplace/journeys/admin/summary/route.ts |
| /api/angelcare-marketplace/journeys/notifications/[notificationId]/acknowledge | api | api | apijourneys | app/api/angelcare-marketplace/journeys/notifications/[notificationId]/acknowledge/route.ts |
| /api/angelcare-marketplace/launch/approvals | api | api | apilaunch | app/api/angelcare-marketplace/launch/approvals/route.ts |
| /api/angelcare-marketplace/launch/evidence | api | api | apilaunch | app/api/angelcare-marketplace/launch/evidence/route.ts |
| /api/angelcare-marketplace/launch/gates | api | api | apilaunch | app/api/angelcare-marketplace/launch/gates/route.ts |
| /api/angelcare-marketplace/launch/gates/[gateId]/update | api | api | apilaunch | app/api/angelcare-marketplace/launch/gates/[gateId]/update/route.ts |
| /api/angelcare-marketplace/launch/monitoring | api | api | apilaunch | app/api/angelcare-marketplace/launch/monitoring/route.ts |
| /api/angelcare-marketplace/launch/post-launch | api | api | apilaunch | app/api/angelcare-marketplace/launch/post-launch/route.ts |
| /api/angelcare-marketplace/launch/releases | api | api | apilaunch | app/api/angelcare-marketplace/launch/releases/route.ts |
| /api/angelcare-marketplace/launch/releases/[releaseId]/transition | api | api | apilaunch | app/api/angelcare-marketplace/launch/releases/[releaseId]/transition/route.ts |
| /api/angelcare-marketplace/launch/runbooks | api | api | apilaunch | app/api/angelcare-marketplace/launch/runbooks/route.ts |
| /api/angelcare-marketplace/launch/summary | api | api | apilaunch | app/api/angelcare-marketplace/launch/summary/route.ts |
| /api/angelcare-marketplace/localization/exports | api | api | apilocalization | app/api/angelcare-marketplace/localization/exports/route.ts |
| /api/angelcare-marketplace/localization/glossary | api | api | apilocalization | app/api/angelcare-marketplace/localization/glossary/route.ts |
| /api/angelcare-marketplace/localization/imports | api | api | apilocalization | app/api/angelcare-marketplace/localization/imports/route.ts |
| /api/angelcare-marketplace/localization/inventory | api | api | apilocalization | app/api/angelcare-marketplace/localization/inventory/route.ts |
| /api/angelcare-marketplace/localization/memory | api | api | apilocalization | app/api/angelcare-marketplace/localization/memory/route.ts |
| /api/angelcare-marketplace/localization/query | api | api | apilocalization | app/api/angelcare-marketplace/localization/query/route.ts |
| /api/angelcare-marketplace/localization/readiness | api | api | apilocalization | app/api/angelcare-marketplace/localization/readiness/route.ts |
| /api/angelcare-marketplace/localization/rtl-preview | api | api | apilocalization | app/api/angelcare-marketplace/localization/rtl-preview/route.ts |
| /api/angelcare-marketplace/localization/scans | api | api | apilocalization | app/api/angelcare-marketplace/localization/scans/route.ts |
| /api/angelcare-marketplace/localization/seo | api | api | apilocalization | app/api/angelcare-marketplace/localization/seo/route.ts |
| /api/angelcare-marketplace/localization/summary | api | api | apilocalization | app/api/angelcare-marketplace/localization/summary/route.ts |
| /api/angelcare-marketplace/localization/translations | api | api | apilocalization | app/api/angelcare-marketplace/localization/translations/route.ts |
| /api/angelcare-marketplace/operations/check-events | api | api | apioperations | app/api/angelcare-marketplace/operations/check-events/route.ts |
| /api/angelcare-marketplace/operations/checklists | api | api | apioperations | app/api/angelcare-marketplace/operations/checklists/route.ts |
| /api/angelcare-marketplace/operations/commerce/summary | api | api | apioperations | app/api/angelcare-marketplace/operations/commerce/summary/route.ts |
| /api/angelcare-marketplace/operations/daily-closures | api | api | apioperations | app/api/angelcare-marketplace/operations/daily-closures/route.ts |
| /api/angelcare-marketplace/operations/disputes | api | api | apioperations | app/api/angelcare-marketplace/operations/disputes/route.ts |
| /api/angelcare-marketplace/operations/escalations | api | api | apioperations | app/api/angelcare-marketplace/operations/escalations/route.ts |
| /api/angelcare-marketplace/operations/fulfillment | api | api | apioperations | app/api/angelcare-marketplace/operations/fulfillment/route.ts |
| /api/angelcare-marketplace/operations/fulfillment/[caseId] | api | api | apioperations | app/api/angelcare-marketplace/operations/fulfillment/[caseId]/route.ts |
| /api/angelcare-marketplace/operations/fulfillment/[caseId]/evidence | api | api | apioperations | app/api/angelcare-marketplace/operations/fulfillment/[caseId]/evidence/route.ts |
| /api/angelcare-marketplace/operations/fulfillment/[caseId]/transition | api | api | apioperations | app/api/angelcare-marketplace/operations/fulfillment/[caseId]/transition/route.ts |
| /api/angelcare-marketplace/operations/incidents | api | api | apioperations | app/api/angelcare-marketplace/operations/incidents/route.ts |
| /api/angelcare-marketplace/operations/missions | api | api | apioperations | app/api/angelcare-marketplace/operations/missions/route.ts |
| /api/angelcare-marketplace/operations/missions/[missionId] | api | api | apioperations | app/api/angelcare-marketplace/operations/missions/[missionId]/route.ts |
| /api/angelcare-marketplace/operations/missions/[missionId]/dispatch | api | api | apioperations | app/api/angelcare-marketplace/operations/missions/[missionId]/dispatch/route.ts |
| /api/angelcare-marketplace/operations/missions/[missionId]/transition | api | api | apioperations | app/api/angelcare-marketplace/operations/missions/[missionId]/transition/route.ts |
| /api/angelcare-marketplace/operations/proof | api | api | apioperations | app/api/angelcare-marketplace/operations/proof/route.ts |
| /api/angelcare-marketplace/operations/proposals/[proposalId]/decision | api | api | apioperations | app/api/angelcare-marketplace/operations/proposals/[proposalId]/decision/route.ts |
| /api/angelcare-marketplace/operations/providers | api | api | apioperations | app/api/angelcare-marketplace/operations/providers/route.ts |
| /api/angelcare-marketplace/operations/reconciliation | api | api | apioperations | app/api/angelcare-marketplace/operations/reconciliation/route.ts |
| /api/angelcare-marketplace/operations/reconciliation/[caseId]/handover | api | api | apioperations | app/api/angelcare-marketplace/operations/reconciliation/[caseId]/handover/route.ts |
| /api/angelcare-marketplace/operations/recovery | api | api | apioperations | app/api/angelcare-marketplace/operations/recovery/route.ts |
| /api/angelcare-marketplace/operations/reports | api | api | apioperations | app/api/angelcare-marketplace/operations/reports/route.ts |
| /api/angelcare-marketplace/operations/returns | api | api | apioperations | app/api/angelcare-marketplace/operations/returns/route.ts |
| /api/angelcare-marketplace/operations/settlements | api | api | apioperations | app/api/angelcare-marketplace/operations/settlements/route.ts |
| /api/angelcare-marketplace/operations/summary | api | api | apioperations | app/api/angelcare-marketplace/operations/summary/route.ts |
| /api/angelcare-marketplace/operations/vendors | api | api | apioperations | app/api/angelcare-marketplace/operations/vendors/route.ts |
| /api/angelcare-marketplace/partner-os/plans | api | api | apipartner-os | app/api/angelcare-marketplace/partner-os/plans/route.ts |
| /api/angelcare-marketplace/partner-os/subscriptions | api | api | apipartner-os | app/api/angelcare-marketplace/partner-os/subscriptions/route.ts |
| /api/angelcare-marketplace/partner-os/summary | api | api | apipartner-os | app/api/angelcare-marketplace/partner-os/summary/route.ts |
| /api/angelcare-marketplace/partner-os/tenants | api | api | apipartner-os | app/api/angelcare-marketplace/partner-os/tenants/route.ts |
| /api/angelcare-marketplace/partner-os/tenants/[tenantId]/transition | api | api | apipartner-os | app/api/angelcare-marketplace/partner-os/tenants/[tenantId]/transition/route.ts |
| /api/angelcare-marketplace/partner-os/tenants/[tenantId]/workspace | api | api | apipartner-os | app/api/angelcare-marketplace/partner-os/tenants/[tenantId]/workspace/route.ts |
| /api/angelcare-marketplace/performance/observations | api | api | apiperformance | app/api/angelcare-marketplace/performance/observations/route.ts |
| /api/angelcare-marketplace/providers | api | api | apiproviders | app/api/angelcare-marketplace/providers/route.ts |
| /api/angelcare-marketplace/providers/[providerId] | api | api | apiproviders | app/api/angelcare-marketplace/providers/[providerId]/route.ts |
| /api/angelcare-marketplace/providers/[providerId]/availability | api | api | apiproviders | app/api/angelcare-marketplace/providers/[providerId]/availability/route.ts |
| /api/angelcare-marketplace/providers/[providerId]/documents/[documentId]/review | api | api | apiproviders | app/api/angelcare-marketplace/providers/[providerId]/documents/[documentId]/review/route.ts |
| /api/angelcare-marketplace/providers/[providerId]/eligibility/recalculate | api | api | apiproviders | app/api/angelcare-marketplace/providers/[providerId]/eligibility/recalculate/route.ts |
| /api/angelcare-marketplace/providers/assignments | api | api | apiproviders | app/api/angelcare-marketplace/providers/assignments/route.ts |
| /api/angelcare-marketplace/providers/certifications | api | api | apiproviders | app/api/angelcare-marketplace/providers/certifications/route.ts |
| /api/angelcare-marketplace/providers/documents | api | api | apiproviders | app/api/angelcare-marketplace/providers/documents/route.ts |
| /api/angelcare-marketplace/providers/payable | api | api | apiproviders | app/api/angelcare-marketplace/providers/payable/route.ts |
| /api/angelcare-marketplace/providers/payable/[payableId]/decision | api | api | apiproviders | app/api/angelcare-marketplace/providers/payable/[payableId]/decision/route.ts |
| /api/angelcare-marketplace/providers/summary | api | api | apiproviders | app/api/angelcare-marketplace/providers/summary/route.ts |
| /api/angelcare-marketplace/public/catalog/[slug] | api | api | apipublic | app/api/angelcare-marketplace/public/catalog/[slug]/route.ts |
| /api/angelcare-marketplace/public/events | api | api | apipublic | app/api/angelcare-marketplace/public/events/route.ts |
| /api/angelcare-marketplace/public/inquiries | api | api | apipublic | app/api/angelcare-marketplace/public/inquiries/route.ts |
| /api/angelcare-marketplace/qa/checks | api | api | apiqa | app/api/angelcare-marketplace/qa/checks/route.ts |
| /api/angelcare-marketplace/qa/defects | api | api | apiqa | app/api/angelcare-marketplace/qa/defects/route.ts |
| /api/angelcare-marketplace/qa/defects/[defectId]/transition | api | api | apiqa | app/api/angelcare-marketplace/qa/defects/[defectId]/transition/route.ts |
| /api/angelcare-marketplace/qa/results | api | api | apiqa | app/api/angelcare-marketplace/qa/results/route.ts |
| /api/angelcare-marketplace/qa/runs | api | api | apiqa | app/api/angelcare-marketplace/qa/runs/route.ts |
| /api/angelcare-marketplace/qa/suites | api | api | apiqa | app/api/angelcare-marketplace/qa/suites/route.ts |
| /api/angelcare-marketplace/qa/summary | api | api | apiqa | app/api/angelcare-marketplace/qa/summary/route.ts |
| /api/angelcare-marketplace/quote-baskets | api | api | apiquote-baskets | app/api/angelcare-marketplace/quote-baskets/route.ts |
| /api/angelcare-marketplace/quote-baskets/[basketId]/items | api | api | apiquote-baskets | app/api/angelcare-marketplace/quote-baskets/[basketId]/items/route.ts |
| /api/angelcare-marketplace/security/access-reviews | api | api | apisecurity | app/api/angelcare-marketplace/security/access-reviews/route.ts |
| /api/angelcare-marketplace/security/assessments | api | api | apisecurity | app/api/angelcare-marketplace/security/assessments/route.ts |
| /api/angelcare-marketplace/security/controls | api | api | apisecurity | app/api/angelcare-marketplace/security/controls/route.ts |
| /api/angelcare-marketplace/security/events | api | api | apisecurity | app/api/angelcare-marketplace/security/events/route.ts |
| /api/angelcare-marketplace/security/isolation-tests | api | api | apisecurity | app/api/angelcare-marketplace/security/isolation-tests/route.ts |
| /api/angelcare-marketplace/security/isolation-tests/[testId]/execute | api | api | apisecurity | app/api/angelcare-marketplace/security/isolation-tests/[testId]/execute/route.ts |
| /api/angelcare-marketplace/security/recovery-tests | api | api | apisecurity | app/api/angelcare-marketplace/security/recovery-tests/route.ts |
| /api/angelcare-marketplace/security/recovery-tests/[testId]/transition | api | api | apisecurity | app/api/angelcare-marketplace/security/recovery-tests/[testId]/transition/route.ts |
| /api/angelcare-marketplace/security/retention | api | api | apisecurity | app/api/angelcare-marketplace/security/retention/route.ts |
| /api/angelcare-marketplace/security/summary | api | api | apisecurity | app/api/angelcare-marketplace/security/summary/route.ts |
| /api/angelcare-marketplace/suppliers | api | api | apisuppliers | app/api/angelcare-marketplace/suppliers/route.ts |
| /api/angelcare-marketplace/territories | api | api | apiterritories | app/api/angelcare-marketplace/territories/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode] | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/health | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/health/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/overrides | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/overrides/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/preview | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/preview/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/readiness | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/readiness/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/readiness/[gateKey] | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/readiness/[gateKey]/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/readiness/sign-off | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/readiness/sign-off/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/readiness/validate | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/readiness/validate/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/settings | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/settings/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/settings/[settingKey] | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/settings/[settingKey]/route.ts |
| /api/angelcare-marketplace/territories/[territoryCode]/transition | api | api | apiterritories | app/api/angelcare-marketplace/territories/[territoryCode]/transition/route.ts |
| /api/angelcare-marketplace/territories/clone | api | api | apiterritories | app/api/angelcare-marketplace/territories/clone/route.ts |
| /api/angelcare-marketplace/territories/export | api | api | apiterritories | app/api/angelcare-marketplace/territories/export/route.ts |
| /api/angelcare-marketplace/territories/templates | api | api | apiterritories | app/api/angelcare-marketplace/territories/templates/route.ts |
| /api/angelcare-marketplace/territory-overrides/[overrideId] | api | api | apiterritory-overrides | app/api/angelcare-marketplace/territory-overrides/[overrideId]/route.ts |
| /api/angelcare-marketplace/territory-overrides/[overrideId]/review | api | api | apiterritory-overrides | app/api/angelcare-marketplace/territory-overrides/[overrideId]/review/route.ts |
| /api/angelcare-marketplace/territory-overrides/[overrideId]/rollback | api | api | apiterritory-overrides | app/api/angelcare-marketplace/territory-overrides/[overrideId]/rollback/route.ts |
| /api/angelcare-marketplace/trust/assessments | api | api | apitrust | app/api/angelcare-marketplace/trust/assessments/route.ts |
| /api/angelcare-marketplace/trust/assessments/[assessmentId]/recalculate | api | api | apitrust | app/api/angelcare-marketplace/trust/assessments/[assessmentId]/recalculate/route.ts |
| /api/angelcare-marketplace/trust/assessments/[assessmentId]/transition | api | api | apitrust | app/api/angelcare-marketplace/trust/assessments/[assessmentId]/transition/route.ts |
| /api/angelcare-marketplace/trust/capa | api | api | apitrust | app/api/angelcare-marketplace/trust/capa/route.ts |
| /api/angelcare-marketplace/trust/capa/[actionId]/transition | api | api | apitrust | app/api/angelcare-marketplace/trust/capa/[actionId]/transition/route.ts |
| /api/angelcare-marketplace/trust/complaints | api | api | apitrust | app/api/angelcare-marketplace/trust/complaints/route.ts |
| /api/angelcare-marketplace/trust/complaints/[complaintId]/transition | api | api | apitrust | app/api/angelcare-marketplace/trust/complaints/[complaintId]/transition/route.ts |
| /api/angelcare-marketplace/trust/evidence | api | api | apitrust | app/api/angelcare-marketplace/trust/evidence/route.ts |
| /api/angelcare-marketplace/trust/sensitive-reviews | api | api | apitrust | app/api/angelcare-marketplace/trust/sensitive-reviews/route.ts |
| /api/angelcare-marketplace/trust/sensitive-reviews/[reviewId]/approve | api | api | apitrust | app/api/angelcare-marketplace/trust/sensitive-reviews/[reviewId]/approve/route.ts |
| /api/angelcare-marketplace/trust/sops | api | api | apitrust | app/api/angelcare-marketplace/trust/sops/route.ts |
| /api/angelcare-marketplace/trust/sops/[sopId]/transition | api | api | apitrust | app/api/angelcare-marketplace/trust/sops/[sopId]/transition/route.ts |
| /api/angelcare-marketplace/trust/summary | api | api | apitrust | app/api/angelcare-marketplace/trust/summary/route.ts |
