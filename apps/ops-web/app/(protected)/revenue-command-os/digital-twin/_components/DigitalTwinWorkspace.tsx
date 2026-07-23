'use client'

import { useState } from 'react'
import type { RevenueTwinEditableEntity, RevenueTwinSectionKey } from '@/lib/revenue-command-os/types'
import DigitalTwinEntityDrawer from './DigitalTwinEntityDrawer'
import {
  BusinessUnitsExperience,
  BundlesCombinationsExperience,
  CapacityConstraintsExperience,
  ChannelsJourneysExperience,
  CustomerSegmentsExperience,
  DecisionMakersExperience,
  ExpansionRenewalExperience,
  MarketsTerritoriesExperience,
  ModelValidationExperience,
  OffersServicesExperience,
  PricingMarginsExperience,
  RevenueDependenciesExperience,
  SeasonalityExperience,
  TwinOverviewExperience,
} from './sovereign-twin-experience/routes'

export default function DigitalTwinWorkspace({ sectionKey }: { sectionKey: RevenueTwinSectionKey }) {
  const [editor, setEditor] = useState<{ entity: RevenueTwinEditableEntity; item?: Record<string, unknown> } | null>(null)
  const openEditor = (entity: RevenueTwinEditableEntity, item?: Record<string, unknown>) => setEditor({ entity, item })

  let content: React.ReactNode
  if (sectionKey === 'overview') content = <TwinOverviewExperience openEditor={openEditor} />
  else if (sectionKey === 'business-units') content = <BusinessUnitsExperience openEditor={openEditor} />
  else if (sectionKey === 'offers-services') content = <OffersServicesExperience openEditor={openEditor} />
  else if (sectionKey === 'bundles-combinations') content = <BundlesCombinationsExperience openEditor={openEditor} />
  else if (sectionKey === 'customer-segments') content = <CustomerSegmentsExperience openEditor={openEditor} />
  else if (sectionKey === 'decision-makers') content = <DecisionMakersExperience openEditor={openEditor} />
  else if (sectionKey === 'markets-territories') content = <MarketsTerritoriesExperience openEditor={openEditor} />
  else if (sectionKey === 'channels-journeys') content = <ChannelsJourneysExperience openEditor={openEditor} />
  else if (sectionKey === 'pricing-margins') content = <PricingMarginsExperience openEditor={openEditor} />
  else if (sectionKey === 'capacity-constraints') content = <CapacityConstraintsExperience openEditor={openEditor} />
  else if (sectionKey === 'seasonality') content = <SeasonalityExperience openEditor={openEditor} />
  else if (sectionKey === 'expansion-renewal') content = <ExpansionRenewalExperience openEditor={openEditor} />
  else if (sectionKey === 'revenue-dependencies') content = <RevenueDependenciesExperience openEditor={openEditor} />
  else content = <ModelValidationExperience openEditor={openEditor} />

  return <>
    {content}
    <DigitalTwinEntityDrawer entity={editor?.entity || null} item={editor?.item} onClose={() => setEditor(null)} />
  </>
}
