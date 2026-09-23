import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function TransportPage() {
  const page = getSanilaPublicPage('transport')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <ProofSection page={page} />
      <WorkflowSection page={page} title="Du circuit à l’incident, structurer l’opération terrain." />
      <CapabilitiesSection page={page} />
      <CrossDomainBridge from="transport" to="communication" title="Une opération terrain doit pouvoir informer les bonnes personnes sans inventer un suivi GPS." body="SANILA distingue la structure transport de la communication et reste explicite sur les capacités dépendant d’un fournisseur ou d’une infrastructure externe." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
