import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function CommunicationPage() {
  const page = getSanilaPublicPage('communication')!
  return (
    <>
      <RecognitionBand page={page} />
      <ContextSection page={page} />
      <DomainSignature page={page} />
      <WorkflowSection page={page} title="Du contexte au bon destinataire, réduire le bruit." />
      <CapabilitiesSection page={page} />
      <CrossDomainBridge from="communication" to="reclamations" title="Une question qui exige un suivi ne doit pas rester un simple message." body="SANILA peut faire évoluer la relation famille d’une information vers un traitement structuré lorsque la situation le nécessite." />
      <ProofSection page={page} />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
