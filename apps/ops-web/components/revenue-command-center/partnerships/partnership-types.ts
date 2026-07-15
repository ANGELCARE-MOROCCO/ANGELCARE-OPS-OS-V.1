export type PartnerStatus = "Active" | "Pending" | "Inactive" | "At Risk";
export type ProgramStatus = "Draft" | "Active" | "Review" | "Published";

export type PartnerRecord = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  type: string;
  category: string;
  city: string;
  district: string;
  status: PartnerStatus;
  programs: string[];
  revenueImpact: number;
  engagement: number;
  joinedOn: string;
  website: string;
  summary: string;
  documents: string[];
  notes: string;
};

export type ProgramRecord = {
  id: string;
  name: string;
  subtitle: string;
  partnerType: string;
  category: string;
  status: ProgramStatus;
  partners: number;
  revenueImpact: number;
  engagement: number;
  owner: string;
  city: string;
  offers: string[];
  pricingRules: string[];
  contractTerms: string[];
  eligibilityRequirements: string[];
  publishReview: {
    publishStatus: string;
    launchOwner: string;
    approvalRoute: string;
    executiveSummary: string;
    goLiveConditions: string;
    reportingCadence: string;
  };
};

export type PartnershipTab =
  | "overview"
  | "partners"
  | "programs"
  | "pipeline"
  | "dealRooms"
  | "contracts"
  | "performance"
  | "insights";
