export type Phase31HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type Phase31EndpointRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase31ApiEndpoint {
  id: string;
  method: Phase31HttpMethod;
  path: string;
  purpose: string;
  risk: Phase31EndpointRisk;
  readyForImplementation: boolean;
}

export interface Phase31ApiContract {
  id: string;
  endpointId: string;
  requestShape: string[];
  responseShape: string[];
  validationRequired: boolean;
}

export interface Phase31ServerActionPlan {
  id: string;
  actionName: string;
  entity: string;
  mutation: 'create' | 'update' | 'archive' | 'approve' | 'publish';
  requiresAudit: boolean;
  requiresPermission: boolean;
}

export interface Phase31ApiQaCheck {
  id: string;
  label: string;
  passed: boolean;
  blocker: string;
}