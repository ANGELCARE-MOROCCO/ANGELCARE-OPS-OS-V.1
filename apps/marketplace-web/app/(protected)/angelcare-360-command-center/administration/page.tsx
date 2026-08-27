import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360GovernanceCommand from '@/components/angelcare360/governance/Angelcare360GovernanceCommand'
import { getGovernanceCommandSnapshot } from '@/lib/angelcare360/server/governance-command'
import { getInstitutionsSitesSnapshot } from '@/lib/angelcare360/server/institutions-sites'
import { getAcademicStructureSnapshot } from '@/lib/angelcare360/server/academic-structure-area'
import { getClassesCapacitySnapshot } from '@/lib/angelcare360/server/classes-capacity-area'
import { getCurriculumSnapshot } from '@/lib/angelcare360/server/curriculum-area'
import { getAssignmentsSnapshot } from '@/lib/angelcare360/server/assignments-area'
import { getAccessAreaSnapshot } from '@/lib/angelcare360/server/access-area'
import { getSettingsAreaSnapshot } from '@/lib/angelcare360/server/settings-area'
import { getAuditAreaSnapshot } from '@/lib/angelcare360/server/audit-area'
import type { GovernanceEntityType, GovernancePlaneKey } from '@/types/angelcare360/governance-command'
import type { InstitutionAreaView, InstitutionDossierTab, InstitutionKind } from '@/types/angelcare360/institutions-sites'
import type { AcademicDossierKind, AcademicDossierTab, AcademicStructureView } from '@/types/angelcare360/academic-structure-area'
import type { CapacityDossierKind, CapacityDossierTab, ClassesCapacityView } from '@/types/angelcare360/classes-capacity-area'
import type { CurriculumDossierKind, CurriculumDossierTab, CurriculumView } from '@/types/angelcare360/curriculum-area'
import type { AssignmentDossierKind, AssignmentDossierTab, AssignmentView } from '@/types/angelcare360/assignments-area'
import type { AccessAreaView, AccessDossierKind, AccessDossierTab } from '@/types/angelcare360/access-area'
import type { SettingsView, SettingsDossierKind, SettingsDossierTab } from '@/types/angelcare360/settings-area'
import type { AuditView, AuditDossierKind, AuditDossierTab } from '@/types/angelcare360/audit-area'

export const dynamic = 'force-dynamic'

export default async function Angelcare360GovernancePage({
  searchParams,
}: {
  searchParams?: Promise<{ plane?: string; view?: string; entity?: string; type?: string; drawer?: string; tab?: string; focus?: string }>
}) {
  try {
    const emptyParams: { plane?: string; view?: string; entity?: string; type?: string; drawer?: string; tab?: string; focus?: string } = {}
    const [snapshot, institutionSnapshot, academicSnapshot, capacitySnapshot, curriculumSnapshot, assignmentSnapshot, accessSnapshot, settingsSnapshot, auditSnapshot, params] = await Promise.all([getGovernanceCommandSnapshot(), getInstitutionsSitesSnapshot(), getAcademicStructureSnapshot(), getClassesCapacitySnapshot(), getCurriculumSnapshot(), getAssignmentsSnapshot(), getAccessAreaSnapshot(), getSettingsAreaSnapshot(), getAuditAreaSnapshot(), searchParams || Promise.resolve(emptyParams)])
    return (
      <Angelcare360GovernanceCommand
        initialSnapshot={snapshot}
        initialInstitutionSnapshot={institutionSnapshot}
        initialAcademicSnapshot={academicSnapshot}
        initialCapacitySnapshot={capacitySnapshot}
        initialCurriculumSnapshot={curriculumSnapshot}
        initialAssignmentSnapshot={assignmentSnapshot}
        initialAccessSnapshot={accessSnapshot}
        initialSettingsSnapshot={settingsSnapshot}
        initialAuditSnapshot={auditSnapshot}
        initialAuditView={(params.view || 'today') as AuditView}
        initialAuditTab={(params.tab || null) as AuditDossierTab | null}
        initialAuditEntityKind={(params.type === 'decision' ? 'decision' : params.type === 'evidence' ? 'evidence' : params.type === 'finding' ? 'finding' : params.type === 'investigation' ? 'investigation' : params.type === 'review' ? 'review' : params.type === 'export' ? 'export' : params.type === 'integrity' ? 'integrity' : params.type === 'event' ? 'event' : null) as AuditDossierKind | null}
        initialSettingsView={(params.view || 'today') as SettingsView}
        initialSettingsTab={(params.tab || null) as SettingsDossierTab | null}
        initialSettingsEntityKind={(params.type === 'policy' ? 'policy' : params.type === 'template' ? 'template' : params.type === 'integration' ? 'integration' : params.type === 'variation' ? 'variation' : params.type === 'release' ? 'release' : params.type === 'issue' ? 'issue' : params.type === 'configuration' ? 'configuration' : null) as SettingsDossierKind | null}
        initialAccessView={(params.view || 'today') as AccessAreaView}
        initialAccessTab={(params.tab || null) as AccessDossierTab | null}
        initialAccessEntityKind={(params.type === 'role' ? 'role' : params.type === 'request' ? 'request' : params.type === 'delegation' ? 'delegation' : params.type === 'review' ? 'review' : params.type === 'issue' ? 'issue' : params.type === 'user' ? 'user' : null) as AccessDossierKind | null}
        initialAssignmentView={(params.view || 'today') as AssignmentView}
        initialAssignmentTab={(params.tab || null) as AssignmentDossierTab | null}
        initialAssignmentEntityKind={(params.type === 'staff' ? 'staff' : params.type === 'replacement' ? 'replacement' : params.type === 'conflict' ? 'conflict' : params.type === 'assignment' ? 'assignment' : null) as AssignmentDossierKind | null}
        initialCurriculumView={(params.view || 'today') as CurriculumView}
        initialCurriculumTab={(params.tab || null) as CurriculumDossierTab | null}
        initialCurriculumEntityKind={(params.type === 'curriculum' ? 'curriculum' : params.type === 'evaluation_policy' ? 'evaluation_policy' : params.type === 'resource' ? 'resource' : params.type === 'issue' ? 'issue' : params.type === 'subject' ? 'subject' : null) as CurriculumDossierKind | null}
        initialCapacityView={(params.view || 'today') as ClassesCapacityView}
        initialCapacityTab={(params.tab || null) as CapacityDossierTab | null}
        initialCapacityEntityKind={(params.type === 'section' ? 'section' : params.type === 'movement' ? 'movement' : params.type === 'reservation' ? 'reservation' : params.type === 'issue' ? 'issue' : params.type === 'class' ? 'class' : null) as CapacityDossierKind | null}
        initialAcademicView={(params.view || 'today') as AcademicStructureView}
        initialAcademicTab={(params.tab || null) as AcademicDossierTab | null}
        initialAcademicEntityKind={(params.type === 'period' ? 'period' : params.type === 'transition' ? 'transition' : params.type === 'academic_year' ? 'academic_year' : null) as AcademicDossierKind | null}
        initialInstitutionView={(params.view || 'today') as InstitutionAreaView}
        initialInstitutionTab={(params.tab || null) as InstitutionDossierTab | null}
        initialInstitutionKind={(params.type === 'site' ? 'site' : params.type === 'institution' ? 'school' : null) as InstitutionKind | null}
        initialPlane={(params.plane || 'institutions') as GovernancePlaneKey}
        initialEntityId={params.entity || null}
        initialEntityType={(params.type || null) as GovernanceEntityType | null}
        initialDrawer={params.drawer || null}
        initialFocus={params.focus || null}
      />
    )
  } catch (error) {
    return (
      <Angelcare360EmptyState
        title="Gouvernance institutionnelle indisponible"
        description={error instanceof Error ? error.message : 'Le commandement institutionnel ne peut pas être chargé.'}
        actionLabel="Retour au command center"
        actionHref="/angelcare-360-command-center"
      />
    )
  }
}
