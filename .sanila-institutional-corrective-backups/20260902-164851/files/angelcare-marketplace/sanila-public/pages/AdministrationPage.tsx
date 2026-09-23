import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function AdministrationPage() {
  const page = getSanilaPublicPage('administration')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <CapabilitiesSection page={page} />
      <WorkflowSection page={page} title="De la structure de l’établissement à la gouvernance quotidienne." />
      <CrossDomainBridge from="administration" to="presences" title="Une bonne structure administrative doit simplifier les opérations qui viennent ensuite." body="Classes, périodes, matières et responsabilités deviennent le contexte utilisé par les domaines quotidiens." />
      <ProofSection page={page} />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
