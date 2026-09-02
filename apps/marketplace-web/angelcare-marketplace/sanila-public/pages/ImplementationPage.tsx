import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function ImplementationPage() {
  const page = getSanilaPublicPage('mise-en-service')!
  return (
    <>
      <RecognitionBand page={page} />
      <ImplementationSection />
      <WorkflowSection page={page} title="Une transition préparée plutôt qu’une activation aveugle." />
      <ProofSection page={page} />
      <FinalCTA page={page} />
    </>
  )
}
