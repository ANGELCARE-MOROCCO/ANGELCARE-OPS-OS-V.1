export async function GET() {
  const coordinatorTodayActions = [
    {
      id: "coord-task-bank-email",
      taskTitle: "Send bank follow-up email manually",
      taskType: "send email manually",
      relatedCaseId: "case-bank-ilayki-2027",
      relatedFunderId: "funder-attijari-dar-al-moukawil",
      relatedPipelineRecordId: "pipeline-ilayki-bank-route",
      priority: "Critical",
      status: "Due Today",
      dueAt: "2026-07-27T16:00:00.000Z",
      owner: "Capital Coordinator",
      aiPrepared: true,
      humanActionRequired: "Review, copy, attach Bank Pack, send manually, upload proof.",
      proofRequired: true,
      founderApprovalRequired: true,
      riskIfMissed: "Do Not Send Without Founder Approval; missed follow-up delays bank file cycle.",
      nextStepAfterCompletion: "Upload proof of sending and move pipeline to Submitted or Follow-Up Due.",
      sourceWorkspace: "Capital Pipeline CRM + Fundraising Case Builder",
    },
    {
      id: "coord-task-bank-call",
      taskTitle: "Call bank relationship desk",
      taskType: "call funder",
      relatedCaseId: "case-bank-ilayki-2027",
      relatedFunderId: "funder-attijari-dar-al-moukawil",
      relatedPipelineRecordId: "pipeline-ilayki-bank-route",
      priority: "High",
      status: "Ready",
      dueAt: "2026-07-27T17:30:00.000Z",
      owner: "Capital Coordinator",
      aiPrepared: true,
      humanActionRequired: "Call, ask confirmation questions, log outcome and next action.",
      proofRequired: true,
      founderApprovalRequired: false,
      riskIfMissed: "Missed follow-up delays file cycle.",
      nextStepAfterCompletion: "Log call result and schedule follow-up.",
      sourceWorkspace: "Follow-Up Engine",
    },
  ];

  const coordinatorAIPreparedTasks = [
    {
      id: "ai-task-bank-cover-email",
      preparedBy: "Document Factory / Case Builder",
      linkedCaseId: "case-bank-ilayki-2027",
      linkedPipelineRecordId: "pipeline-ilayki-bank-route",
      linkedDataRoomItemId: "pack-bank-ready",
      linkedFunderId: "funder-attijari-dar-al-moukawil",
      aiConfidence: 88,
      doctrineUsed: ["Bank Funding Doctrine", "Founder Approval Rules"],
      scriptOrDocumentPrepared: "Bank cover email",
      approvalRequired: true,
      humanSafetyCheck: "Financial Sensitivity + Founder Approval Required",
      recommendedAction: "Approve Task or Request AI Revision",
      status: "Pending Human Review",
    },
    {
      id: "ai-task-vc-blocked",
      preparedBy: "Investor Psychology + Doctrine Vault",
      linkedCaseId: "case-vc-partner-os",
      linkedPipelineRecordId: "pipeline-partner-os-saas-investor",
      linkedDataRoomItemId: "pack-vc-saas",
      linkedFunderId: "funder-mena-saas-angels",
      aiConfidence: 74,
      doctrineUsed: ["VC Investor Doctrine", "SaaS Partner OS Doctrine"],
      scriptOrDocumentPrepared: "VC introduction draft",
      approvalRequired: true,
      humanSafetyCheck: "Do Not Send Without Founder Approval",
      recommendedAction: "Escalate to Founder",
      status: "Blocked",
    },
  ];

  const coordinatorManualEmails = [
    {
      id: "email-bank-cover",
      relatedTaskId: "coord-task-bank-email",
      relatedCaseId: "case-bank-ilayki-2027",
      relatedFunderId: "funder-attijari-dar-al-moukawil",
      recipient: "Dar Al Moukawil Rabat",
      subject: "Transmission du dossier de financement AngelCare",
      bodyDraft: "Draft prepared for manual review and sending only. Founder approval required before sending.",
      suggestedAttachments: ["Bank Pack", "Financial projections", "Use-of-funds note", "Founder profiles"],
      tone: "Bank-safe, conservative, documentation-first",
      approvalRequired: true,
      approvalStatus: "Pending Founder Review",
      riskNotes: ["Financial Sensitivity", "Bank Commitment Sensitive", "Do Not Send Without Founder Approval"],
      sendInstruction: "Copy and send manually only after approval. Upload proof of sending.",
      proofRequiredAfterSending: true,
      followupDate: "2026-08-03",
      status: "Prepared",
    },
  ];

  const coordinatorCallDesk = [
    {
      id: "call-bank-status",
      relatedTaskId: "coord-task-bank-call",
      contactPerson: "Bank relationship desk",
      objective: "Confirm file expectations and submission path.",
      script: "Ask for required annexes, preferred submission channel, expected review timing and follow-up rhythm.",
      questionsToAsk: [
        "Which annexes are mandatory before review?",
        "Should the file be submitted by email, branch visit or both?",
        "What confirmation proof should AngelCare keep?",
      ],
      documentsToReference: ["Bank Pack", "Use-of-funds note", "Financial projections"],
      risksToAvoid: ["Do not overpromise approvals", "Do not provide unapproved financial commitments"],
      callStatus: "Planned",
      callSummary: null,
      outcome: null,
      nextAction: "Log call result and update pipeline.",
      followupDate: "2026-08-03",
      proofReference: null,
    },
  ];

  const coordinatorProofTasks = [
    {
      id: "proof-bank-email",
      proofRequired: "Proof of bank email sending",
      relatedCaseId: "case-bank-ilayki-2027",
      relatedFunderId: "funder-attijari-dar-al-moukawil",
      requiredDocumentType: "communication proof",
      sourceWorkspace: "Capital Pipeline CRM",
      urgency: "Critical",
      sensitivity: "Financial Sensitive",
      founderApprovalRequired: true,
      signatureRequired: false,
      stampRequired: false,
      dataRoomTargetCategory: "Communication Proof",
      instructions: "Upload screenshot/export of sent email or confirmation note after manual sending.",
      status: "Waiting Proof",
    },
  ];

  const coordinatorFounderApprovals = [
    {
      id: "approval-bank-package",
      approvalTitle: "Final bank submission package",
      approvingFounder: "Ilyass Aissaoui + Pamela Jacosalem Pacumba",
      relatedCaseId: "case-bank-ilayki-2027",
      relatedDocumentId: "pack-bank-ready",
      reasonRequired: "Bank commitment, funding amount, financial projections and final package.",
      riskIfUnapproved: "Block Submission Until Approved",
      dueAt: "2026-07-29T12:00:00.000Z",
      status: "Pending Founder Review",
      comments: [],
      approvalHistory: [],
    },
  ];

  const coordinatorSubmissionReadiness = [
    {
      id: "submission-ready-bank",
      caseTitle: "ILAYKI / TAMWILCOM Bank Package",
      funder: "Attijariwafa Bank - Dar Al Moukawil Rabat",
      packageType: "Bank Package",
      packageReadiness: 86,
      dataRoomReadiness: 84,
      founderApprovalStatus: "Pending Founder Review",
      requiredDocumentsStatus: "Mostly ready",
      scriptsReady: true,
      submissionMethod: "Email + physical bank branch handover",
      deadline: "2027-01-15",
      remainingBlockers: ["Founder approval", "Final proof of supplier annexes"],
      finalCoordinatorChecklist: [
        "Verify founder approval",
        "Confirm final package version",
        "Attach Bank Pack",
        "Copy and send approved email manually",
        "Upload proof of sending",
        "Move pipeline to Submitted",
        "Schedule follow-up in 3 business days",
      ],
    },
  ];

  const coordinatorEscalations = [
    {
      id: "esc-deadline-founder",
      severity: "Critical",
      reason: "Deadline under 48 hours with missing founder approval.",
      relatedCaseId: "case-bank-ilayki-2027",
      relatedFunderId: "funder-attijari-dar-al-moukawil",
      recommendedTarget: "Ilyass Aissaoui",
      deadline: "2026-07-29T12:00:00.000Z",
      status: "Founder Decision Needed",
      resolutionNote: null,
    },
  ];

  const coordinatorWorkload = {
    totalTasks: 18,
    urgentTasks: 7,
    overdueTasks: 2,
    completedToday: 5,
    averageCompletionTimeHours: 3.2,
    workloadPressureScore: 82,
  };

  const coordinatorHandoverSheets = [
    {
      id: "handover-bank-package",
      caseSummary: "ILAYKI / TAMWILCOM Bank Package",
      funder: "Attijariwafa Bank - Dar Al Moukawil Rabat",
      packageType: "Bank Package",
      deadline: "2027-01-15",
      whatAIPrepared: ["Bank cover email", "required document checklist", "follow-up rhythm", "risk warnings"],
      whatHumanMustDo: ["approve", "attach", "send manually", "upload proof", "schedule follow-up"],
      documentsReady: ["Business plan", "Financial projections", "Use-of-funds note"],
      documentsMissing: ["Final supplier proof annex"],
      founderApprovals: ["Final bank submission package"],
      emailCallScripts: ["Bank cover email", "Bank status call script"],
      proofToUploadAfterExecution: ["Email sending proof", "Call note", "submission confirmation"],
      followupDate: "2026-08-03",
      escalationConditions: ["No founder approval", "bank asks sensitive financial commitment", "deadline risk"],
      finalChecklist: [
        "Verify founder approval.",
        "Confirm final package version.",
        "Attach Bank Pack.",
        "Copy and send approved email manually.",
        "Upload proof of sending.",
        "Move pipeline to Submitted.",
        "Schedule follow-up in 3 business days.",
        "Log any funder response.",
      ],
    },
  ];

  const coordinatorSafetyWarnings = [
    "Do Not Send Without Founder Approval",
    "Financial Sensitivity",
    "Legal / Compliance Risk",
    "Child / Safety Sensitive",
    "Equity / Dilution Sensitive",
    "Bank Commitment Sensitive",
    "International Expansion Wording Sensitive",
    "Human Verification Required",
    "AI Confidence Low",
    "Missing Proof",
    "Deadline Risk",
  ];

  const coordinatorCompletionEvents = [
    {
      id: "complete-call-log",
      eventType: "call logged",
      relatedTaskId: "coord-task-bank-call",
      completedBy: "Capital Coordinator",
      completedAt: null,
      proofReference: null,
      nextActionCreated: true,
      pipelineUpdateRequired: true,
    },
  ];

  return Response.json({
    ok: true,
    contract: "MZ10_AC_CAPITAL_OS_COORDINATOR_COCKPIT",
    restoredFor: "MZ11 previous API preservation verifier",
    workspace: "Human Coordinator Cockpit",
    truthBoundary: "Seeded API contract restored for coordinator cockpit. No real email sending, phone calling, calendar sync, notifications, file storage upload, automatic submission or autonomous AI actions.",
    coordinatorTodayActions,
    coordinatorAIPreparedTasks,
    coordinatorManualEmails,
    coordinatorCallDesk,
    coordinatorProofTasks,
    coordinatorFounderApprovals,
    coordinatorSubmissionReadiness,
    coordinatorEscalations,
    coordinatorWorkload,
    coordinatorHandoverSheets,
    coordinatorSafetyWarnings,
    coordinatorCompletionEvents,
  });
}
