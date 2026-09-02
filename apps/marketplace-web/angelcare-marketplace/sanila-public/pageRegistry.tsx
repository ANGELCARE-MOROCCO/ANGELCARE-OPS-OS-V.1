import type { ComponentType } from 'react'
import { AccessPage } from './pages/AccessPage'
import { AdministrationPage } from './pages/AdministrationPage'
import { AdmissionsPage } from './pages/AdmissionsPage'
import { AttendancePage } from './pages/AttendancePage'
import { ClaimsPage } from './pages/ClaimsPage'
import { CommunicationPage } from './pages/CommunicationPage'
import { ContactPage } from './pages/ContactPage'
import { DemoPage } from './pages/DemoPage'
import { DirectionPage } from './pages/DirectionPage'
import { FAQPage } from './pages/FAQPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { FinancePage } from './pages/FinancePage'
import { HomePage } from './pages/HomePage'
import { ImplementationPage } from './pages/ImplementationPage'
import { InventoryPage } from './pages/InventoryPage'
import { LibraryPage } from './pages/LibraryPage'
import { NurserySolutionPage } from './pages/NurserySolutionPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PayrollPage } from './pages/PayrollPage'
import { PedagogyPage } from './pages/PedagogyPage'
import { PricingPage } from './pages/PricingPage'
import { PrivateSchoolSolutionPage } from './pages/PrivateSchoolSolutionPage'
import { ProductPage } from './pages/ProductPage'
import { ReportsPage } from './pages/ReportsPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { SchoolGroupSolutionPage } from './pages/SchoolGroupSolutionPage'
import { SecurityPage } from './pages/SecurityPage'
import { SolutionsPage } from './pages/SolutionsPage'
import { TransportPage } from './pages/TransportPage'

export const SANILA_PAGE_COMPONENTS: Record<string, ComponentType> = {
  accueil: HomePage,
  produit: ProductPage,
  fonctionnalites: FeaturesPage,
  direction: DirectionPage,
  administration: AdministrationPage,
  admissions: AdmissionsPage,
  presences: AttendancePage,
  pedagogie: PedagogyPage,
  finance: FinancePage,
  paie: PayrollPage,
  transport: TransportPage,
  communication: CommunicationPage,
  bibliotheque: LibraryPage,
  inventaire: InventoryPage,
  reclamations: ClaimsPage,
  rapports: ReportsPage,
  solutions: SolutionsPage,
  'solutions/creches-maternelles': NurserySolutionPage,
  'solutions/ecoles-privees': PrivateSchoolSolutionPage,
  'solutions/groupes-scolaires': SchoolGroupSolutionPage,
  securite: SecurityPage,
  'mise-en-service': ImplementationPage,
  tarifs: PricingPage,
  ressources: ResourcesPage,
  faq: FAQPage,
  demonstration: DemoPage,
  contact: ContactPage,
  'creer-mon-etablissement': OnboardingPage,
  connexion: AccessPage,
}
