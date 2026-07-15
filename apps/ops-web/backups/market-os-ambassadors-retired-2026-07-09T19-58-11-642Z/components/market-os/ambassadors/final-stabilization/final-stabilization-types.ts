export type StabilizationStatus = 'passed' | 'warning' | 'failed' | 'pending';

export type StabilizationCheck = {
  id: string;
  title: string;
  area: 'build' | 'routes' | 'navigation' | 'database' | 'security' | 'backend' | 'ui' | 'deployment';
  status: StabilizationStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  instruction: string;
};

export type AmbassadorRouteRegistryItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  priority: number;
  shouldExposeInSidebar: boolean;
};

export type FinalStabilizationSnapshot = {
  checks: StabilizationCheck[];
  routes: AmbassadorRouteRegistryItem[];
};
