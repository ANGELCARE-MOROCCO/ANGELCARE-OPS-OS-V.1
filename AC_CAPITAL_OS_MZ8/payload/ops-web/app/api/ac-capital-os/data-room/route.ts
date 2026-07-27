import { NextResponse } from 'next/server';
import {
  AC_CAPITAL_DATA_ROOM_CONTRACT,
  dataRoomCaseEvidenceLinks,
  dataRoomCategories,
  dataRoomDocuments,
  dataRoomMissingEvidence,
  dataRoomPackageBuilders,
  dataRoomReadinessScores,
  dataRoomSubmissionArchive,
  dataRoomVersionControl,
  getDataRoomSnapshot,
} from '../../../../lib/ac-capital-os/data-room';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_DATA_ROOM_CONTRACT,
    snapshot: getDataRoomSnapshot(),
    objectFamilies: [
      'dataRoomDocuments',
      'dataRoomCategories',
      'dataRoomReadinessScores',
      'dataRoomMissingEvidence',
      'dataRoomVersionControl',
      'dataRoomPackageBuilders',
      'dataRoomCaseEvidenceLinks',
      'dataRoomSubmissionArchive',
      'dataRoomCredibilityScores',
      'dataRoomFounderApprovals',
      'dataRoomAuditEvents',
    ],
    data: {
      dataRoomDocuments,
      dataRoomCategories,
      dataRoomReadinessScores,
      dataRoomMissingEvidence,
      dataRoomVersionControl,
      dataRoomPackageBuilders,
      dataRoomCaseEvidenceLinks,
      dataRoomSubmissionArchive,
    },
    status: 'mz8-due-diligence-data-room-installed',
  });
}
