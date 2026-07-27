import { NextResponse } from 'next/server';
import {
  AC_CAPITAL_CASE_BUILDER_CONTRACT,
  caseBuilderCases,
  caseBuilderCoordinatorHandovers,
  caseBuilderDocuments,
  caseBuilderFinancialSections,
  caseBuilderFounderApprovals,
  caseBuilderHandoffTargets,
  caseBuilderImpactSections,
  caseBuilderNarratives,
  caseBuilderPositioningBlocks,
  caseBuilderProofPacks,
  caseBuilderRiskPlans,
  caseBuilderStages,
  caseBuilderOutreachScripts,
  getCaseBuilderSnapshot,
} from '../../../../lib/ac-capital-os/case-builder';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_CASE_BUILDER_CONTRACT,
    snapshot: getCaseBuilderSnapshot(),
    objectFamilies: [
      'caseBuilderCases',
      'caseBuilderStages',
      'caseBuilderDocuments',
      'caseBuilderNarratives',
      'caseBuilderPositioningBlocks',
      'caseBuilderFinancialSections',
      'caseBuilderRiskPlans',
      'caseBuilderImpactSections',
      'caseBuilderOutreachScripts',
      'caseBuilderProofPacks',
      'caseBuilderFounderApprovals',
      'caseBuilderCoordinatorHandovers',
      'caseBuilderHandoffTargets',
    ],
    data: {
      caseBuilderCases,
      caseBuilderStages,
      caseBuilderDocuments,
      caseBuilderNarratives,
      caseBuilderPositioningBlocks,
      caseBuilderFinancialSections,
      caseBuilderRiskPlans,
      caseBuilderImpactSections,
      caseBuilderOutreachScripts,
      caseBuilderProofPacks,
      caseBuilderFounderApprovals,
      caseBuilderCoordinatorHandovers,
      caseBuilderHandoffTargets,
    },
    status: 'mz7-fundraising-case-builder-installed',
  });
}
