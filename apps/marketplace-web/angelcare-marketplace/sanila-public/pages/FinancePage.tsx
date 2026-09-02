import { getSanilaPublicPage } from '../content'
import { AccessLobby, BeforeAfterSection, CapabilitiesSection, ContextSection, DayWithSanilaSection, DomainExplorer, FAQSection, FinalCTA, ImplementationSection, PricingSection, ProofSection, RecognitionBand, ResourcesSection, RoleExperienceSection, SolutionCards, WorkflowSection } from '../components/SanilaSections'
import { CrossDomainBridge, DemoPreparation, DomainSignature, OnboardingGuardrail, SecurityConstitution, SystemArchitectureStory } from '../components/SanilaSpecialSections'

export function FinancePage() {
  const page = getSanilaPublicPage('finance')!
  return (
    <>
      <RecognitionBand page={page} />
      <DomainSignature page={page} />
      <ProofSection page={page} />
      <WorkflowSection page={page} title="De la création du frais à la relance, suivre la chaîne financière complète." />
      <CapabilitiesSection page={page} />
      <CrossDomainBridge from="finance" to="reclamations" title="Une situation financière incomprise devient vite une question de relation famille." body="Factures, reçus, soldes et historique donnent à l’équipe le contexte nécessaire avant qu’un désaccord ne devienne une réclamation." />
      <DomainExplorer currentSlug={page.slug} />
      <FinalCTA page={page} />
    </>
  )
}
