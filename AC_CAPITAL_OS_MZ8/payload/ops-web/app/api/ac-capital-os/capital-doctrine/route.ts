import { NextResponse } from 'next/server';
import { AC_CAPITAL_DOCTRINE_CONTRACT, getAcCapitalDoctrineVaultSnapshot } from '../../../../lib/ac-capital-os/capital-doctrine';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_DOCTRINE_CONTRACT,
    snapshot: getAcCapitalDoctrineVaultSnapshot(),
    objectFamilies: [
      'capitalDoctrineItems',
      'capitalDoctrineCategories',
      'capitalDoctrineCommands',
      'capitalDoctrinePrompts',
      'capitalDoctrineSkills',
      'capitalDoctrineConflicts',
      'capitalDoctrineApplications',
      'capitalDoctrineAgentBindings',
      'capitalDoctrineMonthlyInjections',
      'capitalDoctrineAuditEvents',
    ],
    status: 'mz6-capital-doctrine-vault-installed',
  });
}
