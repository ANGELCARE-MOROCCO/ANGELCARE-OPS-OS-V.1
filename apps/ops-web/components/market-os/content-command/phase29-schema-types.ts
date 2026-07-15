export type Phase29ColumnType =
  | 'uuid'
  | 'text'
  | 'integer'
  | 'numeric'
  | 'boolean'
  | 'jsonb'
  | 'timestamp'
  | 'enum';

export type Phase29PolicyAction = 'select' | 'insert' | 'update' | 'delete';

export interface Phase29SchemaColumn {
  name: string;
  type: Phase29ColumnType;
  required: boolean;
  indexed: boolean;
  notes: string;
}

export interface Phase29TableBlueprint {
  id: string;
  tableName: string;
  purpose: string;
  columns: Phase29SchemaColumn[];
  rlsRequired: boolean;
  auditRequired: boolean;
}

export interface Phase29RelationshipMap {
  id: string;
  fromTable: string;
  toTable: string;
  relation: 'one_to_one' | 'one_to_many' | 'many_to_many';
  notes: string;
}

export interface Phase29RlsPolicyPlan {
  id: string;
  tableName: string;
  action: Phase29PolicyAction;
  policyName: string;
  ruleDescription: string;
  readyForMigration: boolean;
}

export interface Phase29MigrationReadiness {
  label: string;
  percent: number;
  blocker: string;
}