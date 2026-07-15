import type { FinalOperatingModelSnapshot } from "./operating-model-types";

export const finalOperatingModelSnapshot: FinalOperatingModelSnapshot = {
  pillars: [
    {
      id: "pillar-001",
      title: "Ambassador Growth Operations",
      owner: "Ambassador Director",
      maturityScore: 94,
      description: "Owns recruitment, activation, mission execution, retention, and regional expansion.",
      requiredRhythm: "Daily execution standup and weekly performance review."
    },
    {
      id: "pillar-002",
      title: "Revenue & Attribution Governance",
      owner: "Revenue Command",
      maturityScore: 91,
      description: "Ensures ambassador-generated leads, conversions, payouts, and ROI are tracked safely.",
      requiredRhythm: "Daily attribution checks and weekly profitability review."
    },
    {
      id: "pillar-003",
      title: "AI Operations Supervision",
      owner: "CEO / Operations Director",
      maturityScore: 88,
      description: "Supervises autonomous recommendations, multi-agent delegation, and human approval gates.",
      requiredRhythm: "Daily AI recommendation triage and monthly governance audit."
    },
    {
      id: "pillar-004",
      title: "Compliance & Brand Safety",
      owner: "Compliance Manager",
      maturityScore: 90,
      description: "Controls proof validation, health claims, content safety, and campaign eligibility locks.",
      requiredRhythm: "Daily proof review queue and weekly compliance coaching review."
    }
  ],
  approvalGates: [
    {
      id: "gate-001",
      gate: "Payout approval",
      domain: "finance",
      priority: "critical",
      requiredApprover: "Finance Operations or CEO",
      autoExecutionAllowed: false,
      rule: "AI may recommend payouts but cannot approve or release payment."
    },
    {
      id: "gate-002",
      gate: "Healthcare content approval",
      domain: "compliance",
      priority: "critical",
      requiredApprover: "Compliance Manager",
      autoExecutionAllowed: false,
      rule: "All regulated claims require human review before publication."
    },
    {
      id: "gate-003",
      gate: "Mission redistribution",
      domain: "ai",
      priority: "high",
      requiredApprover: "Ambassador Director",
      autoExecutionAllowed: true,
      rule: "AI may redistribute low-risk missions unless finance or compliance risk is detected."
    },
    {
      id: "gate-004",
      gate: "Regional recruitment sprint",
      domain: "recruitment",
      priority: "high",
      requiredApprover: "Marketing Director",
      autoExecutionAllowed: true,
      rule: "AI may create recruitment tasks, but hiring budget requires approval."
    }
  ],
  rhythms: [
    {
      id: "rhythm-001",
      cadence: "daily",
      ritual: "Ambassador Operations Standup",
      owner: "Ambassador Operations Lead",
      expectedOutput: "Top blockers, urgent campaigns, proof queues, and field priorities."
    },
    {
      id: "rhythm-002",
      cadence: "weekly",
      ritual: "Revenue & ROI Review",
      owner: "Revenue Command",
      expectedOutput: "Attribution quality, payout ratios, campaign profitability, and intervention queue."
    },
    {
      id: "rhythm-003",
      cadence: "weekly",
      ritual: "Market Expansion Council",
      owner: "Marketing Director",
      expectedOutput: "City expansion choices, recruitment sprints, competitor response, and territory scoring."
    },
    {
      id: "rhythm-004",
      cadence: "monthly",
      ritual: "AI Governance Audit",
      owner: "CEO / Operations Director",
      expectedOutput: "AI action logs, override review, governance breaches, and approval-gate tuning."
    }
  ],
  controls: [
    {
      id: "control-001",
      risk: "Autonomous AI approves restricted finance or compliance actions",
      severity: "critical",
      control: "Hard-block finance and regulated-content approval through governance gates.",
      escalationOwner: "CEO"
    },
    {
      id: "control-002",
      risk: "Ambassador rewards exceed profitable revenue ratio",
      severity: "high",
      control: "Monitor reward-to-revenue ratio and pause payout automation when threshold is exceeded.",
      escalationOwner: "Finance Operations"
    },
    {
      id: "control-003",
      risk: "Regional growth outpaces operational capacity",
      severity: "high",
      control: "Use territory readiness and staffing capacity checks before expansion.",
      escalationOwner: "Operations Director"
    },
    {
      id: "control-004",
      risk: "Market intelligence remains simulated instead of live",
      severity: "medium",
      control: "Connect external sources, CRM data, and real attribution feeds before final production launch.",
      escalationOwner: "Marketing Director"
    }
  ]
};
