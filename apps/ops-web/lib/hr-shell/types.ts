export type HRSnapshotTone = "healthy" | "neutral" | "attention" | "critical" | "unavailable";

export type HRSnapshotFactor = {
  key: string;
  label: string;
  sentence: string;
  value: string;
  href: string;
  tone: HRSnapshotTone;
  available: boolean;
};

export type HRShellSnapshot = {
  generatedAt: string;
  generatedLabel: string;
  timezone: "Africa/Casablanca";
  factors: HRSnapshotFactor[];
  sourceHealth: {
    available: number;
    unavailable: number;
    total: number;
  };
};

export type HRShellIdentity = {
  userId: string | null;
  fullName: string;
  role: string;
  roleLabel: string;
  department: string | null;
  tenantLabel: string | null;
  organizationLabel: string | null;
  permissions: string[];
  sovereign: boolean;
};
