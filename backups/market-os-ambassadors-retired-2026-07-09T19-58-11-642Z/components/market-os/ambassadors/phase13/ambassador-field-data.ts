import type { AmbassadorFieldSnapshot } from "./ambassador-field-types";

export const ambassadorFieldSnapshot: AmbassadorFieldSnapshot = {
  territories: [
    { id: "territory-rabat", city: "Rabat", region: "Rabat-Salé-Kénitra", status: "covered", currentAmbassadors: 42, targetAmbassadors: 50, activeCampaigns: 6, leadDemandScore: 84, manager: "Regional Manager Rabat", priority: "medium" },
    { id: "territory-casablanca", city: "Casablanca", region: "Casablanca-Settat", status: "under_covered", currentAmbassadors: 61, targetAmbassadors: 90, activeCampaigns: 8, leadDemandScore: 94, manager: "Regional Manager Casablanca", priority: "high" },
    { id: "territory-agadir", city: "Agadir", region: "Souss-Massa", status: "critical_gap", currentAmbassadors: 9, targetAmbassadors: 32, activeCampaigns: 3, leadDemandScore: 76, manager: "Regional Growth Manager", priority: "critical" },
    { id: "territory-fes", city: "Fes", region: "Fès-Meknès", status: "expansion", currentAmbassadors: 13, targetAmbassadors: 28, activeCampaigns: 2, leadDemandScore: 68, manager: "Regional Growth Manager", priority: "medium" }
  ],
  activations: [
    { id: "activation-rabat-001", title: "Rabat Home Support Ambassador Meetup", city: "Rabat", location: "AngelCare Rabat Office", date: "2026-05-15", owner: "Regional Manager Rabat", expectedAmbassadors: 24, checkedInAmbassadors: 0, generatedLeads: 0, status: "planned" },
    { id: "activation-casa-001", title: "Casablanca Academy Referral Field Sprint", city: "Casablanca", location: "Academy Partner Venue", date: "2026-05-16", owner: "Academy Growth Manager", expectedAmbassadors: 35, checkedInAmbassadors: 0, generatedLeads: 0, status: "planned" },
    { id: "activation-agadir-001", title: "Agadir Partner Clinic Recruitment Visit", city: "Agadir", location: "Partner Clinic Network", date: "2026-05-18", owner: "Regional Growth Manager", expectedAmbassadors: 8, checkedInAmbassadors: 0, generatedLeads: 0, status: "planned" }
  ],
  tasks: [
    { id: "field-task-001", title: "Recruit 15 Agadir healthcare ambassadors", type: "recruitment", city: "Agadir", assignee: "Regional Growth Manager", dueDate: "2026-05-20", priority: "critical", status: "doing", expectedImpact: "Close territory coverage gap and unlock local campaign capacity." },
    { id: "field-task-002", title: "Map Casablanca high-demand neighborhoods", type: "community_mapping", city: "Casablanca", assignee: "Regional Manager Casablanca", dueDate: "2026-05-17", priority: "high", status: "todo", expectedImpact: "Improve mission targeting and lead density." },
    { id: "field-task-003", title: "Prepare Rabat ambassador event check-in list", type: "event", city: "Rabat", assignee: "Ambassador Operations Lead", dueDate: "2026-05-14", priority: "medium", status: "todo", expectedImpact: "Increase field activation attendance and proof quality." }
  ],
  recruitmentGaps: [
    { id: "gap-agadir", city: "Agadir", missingAmbassadors: 23, targetProfile: "Healthcare/community micro-influencers", reason: "Campaign demand rising while coverage remains weak.", recommendedSource: "partners", urgency: "critical" },
    { id: "gap-casablanca", city: "Casablanca", missingAmbassadors: 29, targetProfile: "Academy referral ambassadors and care service creators", reason: "Revenue potential is high but active capacity is below target.", recommendedSource: "academy", urgency: "high" },
    { id: "gap-fes", city: "Fes", missingAmbassadors: 15, targetProfile: "Student ambassadors and community advocates", reason: "Expansion city requires ambassador foundation before campaign scaling.", recommendedSource: "campus", urgency: "medium" }
  ]
};
