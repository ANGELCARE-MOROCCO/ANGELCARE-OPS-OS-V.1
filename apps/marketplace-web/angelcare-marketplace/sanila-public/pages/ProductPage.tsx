import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function ProductPage() {
  const page = getSanilaPublicPage('produit')!
  return (
    <>
      <RecognitionBand page={page} />
      <SystemArchitectureStory />
      <CapabilitiesSection page={page} />
      <RoleExperienceSection />
      <WorkflowSection page={page} title="Une architecture qui conserve le contexte d’un métier à l’autre." />
      <ProofSection page={page} />
      <FinalCTA page={page} />
    </>
  )
}
