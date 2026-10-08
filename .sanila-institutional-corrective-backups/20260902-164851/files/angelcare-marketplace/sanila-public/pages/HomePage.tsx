import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function HomePage() {
  const page = getSanilaPublicPage('accueil')!
  return (
    <>
      <RecognitionBand page={page} />
      <BeforeAfterSection />
      <RoleExperienceSection />
      <DayWithSanilaSection page={page} />
      <DomainExplorer />
      <SolutionCards />
      <ProofSection page={page} />
      <ContextSection page={page} />
      <FinalCTA page={page} />
    </>
  )
}
