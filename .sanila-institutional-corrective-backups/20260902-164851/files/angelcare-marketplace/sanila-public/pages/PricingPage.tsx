import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function PricingPage() {
  const page = getSanilaPublicPage('tarifs')!
  return (
    <>
      <RecognitionBand page={page} />
      <PricingSection />
      <WorkflowSection page={page} title="Construire le prix à partir du périmètre réel." />
      <ProofSection page={page} />
      <FinalCTA page={page} />
    </>
  )
}
