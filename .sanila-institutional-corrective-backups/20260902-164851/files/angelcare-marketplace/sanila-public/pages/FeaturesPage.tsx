import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function FeaturesPage() {
  const page = getSanilaPublicPage('fonctionnalites')!
  return (
    <>
      <RecognitionBand page={page} />
      <CapabilitiesSection page={page} />
      <DomainExplorer />
      <WorkflowSection page={page} title="Lire SANILA par responsabilité, pas par liste de menus." />
      <ProofSection page={page} />
      <FinalCTA page={page} />
    </>
  )
}
