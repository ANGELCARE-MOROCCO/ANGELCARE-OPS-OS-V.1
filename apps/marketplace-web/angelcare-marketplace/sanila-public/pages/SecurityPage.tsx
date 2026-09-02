import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function SecurityPage() {
  const page = getSanilaPublicPage('securite')!
  return (
    <>
      <RecognitionBand page={page} />
      <SecurityConstitution />
      <WorkflowSection page={page} title="Identifier, autoriser, isoler, opérer, tracer." />
      <ProofSection page={page} />
      <AccessLobby />
      <FinalCTA page={page} />
    </>
  )
}
