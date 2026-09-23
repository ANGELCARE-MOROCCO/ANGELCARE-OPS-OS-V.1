import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function NurserySolutionPage() {
  const page = getSanilaPublicPage('solutions/creches-maternelles')!
  return (
    <>
      <RecognitionBand page={page} />
      <ContextSection page={page} />
      <WorkflowSection page={page} title="Un parcours où la confiance famille se construit dans les routines." />
      <CapabilitiesSection page={page} />
      <RoleExperienceSection />
      <ProofSection page={page} />
      <SolutionCards />
      <FinalCTA page={page} />
    </>
  )
}
