import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function AdmissionsPage() {
  const page = getSanilaPublicPage('admissions')!
  return (
    <>
      <RecognitionBand page={page} />
      <ContextSection page={page} />
      <DomainSignature page={page} />
      <WorkflowSection page={page} title="De la première demande à l’inscription, sans rupture de dossier." />
      <CrossDomainBridge from="admissions" to="finance" title="L’inscription ne devrait pas obliger la finance à reconstruire le dossier famille." body="La continuité commerciale devient une continuité administrative et financière lorsque le contexte reste relié." />
      <CapabilitiesSection page={page} />
      <ProofSection page={page} />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
