import DashboardWorkspace from "./DashboardWorkspace"
import SignalsWorkspace from "./SignalsWorkspace"
import StrategyWorkspace from "./StrategyWorkspace"
import MissionsWorkspace from "./MissionsWorkspace"
import DirectoryWorkspace from "./DirectoryWorkspace"
import StudioWorkspace from "./StudioWorkspace"
import EvidenceWorkspace from "./EvidenceWorkspace"
import ValidationWorkspace from "./ValidationWorkspace"
import SourceVaultWorkspace from "./SourceVaultWorkspace"
import DistributionWorkspace from "./DistributionWorkspace"
import AiFoundryWorkspace from "./AiFoundryWorkspace"
import DossierWorkspace from "./DossierWorkspace"
import { Bulk7AttributionChamber, Bulk7ImpactObservatory, Bulk7LearningChamber, Bulk7OptimizationFoundry } from "../experience-bulk7/Bulk7ImpactWorkspaces"
import type { HeadquartersView } from "./client"

export default function ContentCommandHeadquartersWorkspace({ view, dossierId }: { view: HeadquartersView; dossierId?: string }) {
  if (view === "signals") return <SignalsWorkspace />
  if (view === "strategies") return <StrategyWorkspace />
  if (view === "missions") return <MissionsWorkspace />
  if (view === "directory") return <DirectoryWorkspace />
  if (view === "studio") return <StudioWorkspace />
  if (view === "evidence") return <EvidenceWorkspace />
  if (view === "validation") return <ValidationWorkspace />
  if (view === "source-vault") return <SourceVaultWorkspace />
  if (view === "distribution") return <DistributionWorkspace />
  if (view === "performance") return <Bulk7ImpactObservatory />
  if (view === "attribution") return <Bulk7AttributionChamber />
  if (view === "optimization") return <Bulk7OptimizationFoundry />
  if (view === "learning") return <Bulk7LearningChamber />
  if (view === "ai-foundry") return <AiFoundryWorkspace />
  if (view === "dossier" && dossierId) return <DossierWorkspace dossierId={dossierId} />
  return <DashboardWorkspace />
}
