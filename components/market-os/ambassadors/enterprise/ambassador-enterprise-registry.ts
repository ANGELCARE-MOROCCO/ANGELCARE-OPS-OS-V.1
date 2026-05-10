import type { AmbassadorEnterpriseSnapshot } from "./ambassador-enterprise-types";

export const ambassadorEnterpriseSnapshot: AmbassadorEnterpriseSnapshot = {
  modules: [
    {
      id: "enterprise-ops",
      title: "Operations Command",
      layer: "operations",
      route: "/market-os/ambassadors",
      phaseRange: "1-14",
      maturityScore: 94,
      owner: "Ambassador Director",
      purpose: "Core ambassador operations, onboarding, missions, rewards, territories, compliance, and field execution.",
      productionStatus: "ready_ui"
    },
    {
      id: "enterprise-revenue",
      title: "Revenue Performance",
      layer: "intelligence",
      route: "/market-os/ambassadors/revenue-performance",
      phaseRange: "15",
      maturityScore: 91,
      owner: "Revenue Command",
      purpose: "Attribution, conversion, payout forecasting, ROI, and intervention queues.",
      productionStatus: "needs_backend"
    },
    {
      id: "enterprise-ai",
      title: "AI Intelligence & Autonomous Growth",
      layer: "automation",
      route: "/market-os/ambassadors/ai-command",
      phaseRange: "16-19",
      maturityScore: 88,
      owner: "CEO / Operations Director",
      purpose: "AI recommendations, autonomous optimization, multi-agent coordination, and growth simulations.",
      productionStatus: "needs_governance"
    },
    {
      id: "enterprise-infra",
      title: "Infrastructure & Live Execution",
      layer: "infrastructure",
      route: "/market-os/ambassadors/live-execution",
      phaseRange: "20-26",
      maturityScore: 82,
      owner: "Engineering / Ops",
      purpose: "Event bus, queues, orchestration runtimes, dependency graphs, and runtime readiness.",
      productionStatus: "backend_ready"
    },
    {
      id: "enterprise-exec",
      title: "Executive Command",
      layer: "executive",
      route: "/market-os/ambassadors/executive-command",
      phaseRange: "23",
      maturityScore: 92,
      owner: "CEO",
      purpose: "Strategic initiatives, forecasts, executive briefings, and enterprise risk matrix.",
      productionStatus: "ready_ui"
    },
    {
      id: "enterprise-market",
      title: "Market Dominance Intelligence",
      layer: "market",
      route: "/market-os/ambassadors/market-dominance",
      phaseRange: "24",
      maturityScore: 84,
      owner: "Marketing Director",
      purpose: "Competitor monitoring, market signals, opportunity scoring, sentiment, and expansion timing.",
      productionStatus: "needs_backend"
    },
    {
      id: "enterprise-governance",
      title: "Operating Model & Governance",
      layer: "governance",
      route: "/market-os/ambassadors/operating-model",
      phaseRange: "25",
      maturityScore: 95,
      owner: "CEO / Operations Director",
      purpose: "Approval gates, operating rhythms, controls, ownership, and governance blueprint.",
      productionStatus: "ready_ui"
    },
    {
      id: "enterprise-release",
      title: "Production Hardening",
      layer: "production",
      route: "/market-os/ambassadors/production-hardening",
      phaseRange: "22",
      maturityScore: 89,
      owner: "Engineering / QA",
      purpose: "Build-safety, route coverage, release gates, diagnostics, and deployment readiness.",
      productionStatus: "ready_ui"
    }
  ],
  connectors: [
    {
      id: "connector-supabase",
      name: "Supabase Persistence Connector",
      target: "supabase",
      status: "ready_to_connect",
      safetyNote: "Requires real migrations, RLS policies, environment variables, and role validation.",
      nextEngineeringStep: "Create tables for ambassadors, missions, proofs, rewards, payouts, audit logs, events, and AI actions."
    },
    {
      id: "connector-api",
      name: "Server API Connector",
      target: "api",
      status: "placeholder",
      safetyNote: "Do not expose finance/compliance actions without server-side permission enforcement.",
      nextEngineeringStep: "Create route handlers/server actions for CRUD, approvals, proof review, payouts, and task generation."
    },
    {
      id: "connector-realtime",
      name: "Realtime Sync Connector",
      target: "realtime",
      status: "placeholder",
      safetyNote: "Needs authenticated channels and event filtering by role/team.",
      nextEngineeringStep: "Connect Supabase Realtime or websocket channels for live activities, alerts, and task changes."
    },
    {
      id: "connector-queue",
      name: "Queue & Worker Connector",
      target: "queue",
      status: "placeholder",
      safetyNote: "Requires retry policy, dead-letter handling, idempotency, and monitoring.",
      nextEngineeringStep: "Add background workers for notifications, sync recovery, AI recommendations, and scheduled checks."
    },
    {
      id: "connector-ai-memory",
      name: "AI Memory Connector",
      target: "ai_memory",
      status: "placeholder",
      safetyNote: "Needs auditability, retrieval boundaries, and human approval for high-risk actions.",
      nextEngineeringStep: "Create AI memory tables, execution history, embeddings pipeline, and retrieval policies."
    },
    {
      id: "connector-notifications",
      name: "Notification Dispatch Connector",
      target: "notification",
      status: "placeholder",
      safetyNote: "WhatsApp/email/SMS require consent, templates, logs, opt-out, and delivery tracking.",
      nextEngineeringStep: "Connect approved providers and persist communication logs."
    }
  ],
  permissions: [
    {
      id: "perm-payout-approve",
      action: "approve_payout",
      allowedRoles: ["ceo", "finance_operations"],
      requiresServerValidation: true,
      risk: "critical"
    },
    {
      id: "perm-proof-approve",
      action: "approve_healthcare_proof",
      allowedRoles: ["ceo", "compliance_manager", "content_reviewer"],
      requiresServerValidation: true,
      risk: "critical"
    },
    {
      id: "perm-mission-redistribute",
      action: "redistribute_missions",
      allowedRoles: ["ceo", "marketing_director", "ambassador_director"],
      requiresServerValidation: true,
      risk: "high"
    },
    {
      id: "perm-ai-action-approve",
      action: "approve_ai_action",
      allowedRoles: ["ceo", "operations_director"],
      requiresServerValidation: true,
      risk: "critical"
    },
    {
      id: "perm-market-read",
      action: "read_market_intelligence",
      allowedRoles: ["ceo", "marketing_director", "ambassador_director"],
      requiresServerValidation: true,
      risk: "medium"
    }
  ],
  auditModels: [
    {
      id: "audit-payout",
      eventName: "ambassador.payout.approval",
      entity: "payout",
      requiredFields: ["actor_id", "actor_role", "payout_id", "amount_mad", "decision", "timestamp"],
      retention: "permanent"
    },
    {
      id: "audit-proof",
      eventName: "ambassador.proof.review",
      entity: "proof",
      requiredFields: ["actor_id", "proof_id", "decision", "risk_flags", "review_notes", "timestamp"],
      retention: "permanent"
    },
    {
      id: "audit-ai-action",
      eventName: "ambassador.ai.action",
      entity: "ai_execution",
      requiredFields: ["agent_id", "recommendation_id", "confidence_score", "human_approval", "timestamp"],
      retention: "1y"
    },
    {
      id: "audit-mission",
      eventName: "ambassador.mission.assignment",
      entity: "mission",
      requiredFields: ["actor_id", "mission_id", "ambassador_id", "assignment_reason", "timestamp"],
      retention: "1y"
    }
  ],
  checklist: [
    {
      id: "check-build",
      area: "build",
      title: "Run production build",
      status: "pending",
      priority: "critical",
      instruction: "Run npm run build after injecting this pack."
    },
    {
      id: "check-routes",
      area: "routes",
      title: "Validate route access",
      status: "pending",
      priority: "high",
      instruction: "Open enterprise-dashboard, backend-readiness, permission-matrix, audit-models, and production-transition routes."
    },
    {
      id: "check-sidebar",
      area: "routes",
      title: "Add sidebar/menu links manually",
      status: "pending",
      priority: "medium",
      instruction: "Only add links after confirming route pages render successfully."
    },
    {
      id: "check-security",
      area: "security",
      title: "Server-side permission enforcement",
      status: "blocked",
      priority: "critical",
      instruction: "Do not allow finance, compliance, or AI approval actions until backend validation exists."
    },
    {
      id: "check-db",
      area: "backend",
      title: "Create Supabase migrations",
      status: "pending",
      priority: "critical",
      instruction: "Move from blueprint to real DB migrations in the secondary infrastructure layer."
    },
    {
      id: "check-ai",
      area: "ai",
      title: "Human approval for AI actions",
      status: "pending",
      priority: "critical",
      instruction: "AI can recommend. Critical execution must wait for explicit human approval."
    }
  ]
};
