import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function SchoolGroupSolutionPage() {
  const page = getSanilaPublicPage('solutions/groupes-scolaires')!
  return (
    <>
      <RecognitionBand page={page} />
      <SystemArchitectureStory />
      <WorkflowSection page={page} title="Définir les standards communs sans effacer le contexte local." />
      <CapabilitiesSection page={page} />
      <ProofSection page={page} />
      <SolutionCards />
      <FinalCTA page={page} />
    </>
  )
}
