export type PayrollSovereignScene = 'command' | 'workforce' | 'compensation' | 'inputs' | 'production' | 'delivery' | 'compliance'
export type PayrollTone = 'healthy' | 'active' | 'warning' | 'critical' | 'governed' | 'neutral'
export type PayrollOperationKey =
  | 'workforce.employment.create' | 'workforce.employment.transition' | 'workforce.contract.create' | 'workforce.contract.approve'
  | 'workforce.contract.amend' | 'workforce.assignment.create' | 'workforce.assignment.end' | 'workforce.compensation.assign'
  | 'workforce.compensation.change' | 'payroll.policy.publish' | 'payroll.component.publish' | 'payroll.calendar.publish'
  | 'payroll.period.open' | 'payroll.period.cutoff' | 'payroll.input.create' | 'payroll.input.approve'
  | 'payroll.bonus.approve' | 'payroll.deduction.approve' | 'payroll.advance.request' | 'payroll.advance.approve'
  | 'payroll.advance.disburse' | 'payroll.advance.reschedule' | 'payroll.reimbursement.submit' | 'payroll.reimbursement.approve'
  | 'payroll.adjustment.request' | 'payroll.adjustment.approve' | 'payroll.run.preview' | 'payroll.run.calculate'
  | 'payroll.run.recalculate' | 'payroll.run.validate' | 'payroll.run.approve' | 'payroll.run.finalize'
  | 'payroll.run.reopen' | 'payroll.offcycle.create' | 'payroll.payslip.generate' | 'payroll.payslip.publish'
  | 'payroll.payment_batch.create' | 'payroll.payment_batch.approve' | 'payroll.payment_batch.export' | 'payroll.payment.record'
  | 'payroll.payment.repair' | 'payroll.reconciliation.resolve' | 'payroll.final_settlement.execute'
  | 'payroll.report.execute' | 'payroll.export.execute' | 'payroll.approval.decide'

export type PayrollPlane = { key:string; label:string; description:string; scene:PayrollSovereignScene; permission:string }
export type PayrollMetric = { key:string; label:string; value:string; detail:string; tone:PayrollTone }
export type PayrollRecord = { id:string; code:string; title:string; subtitle:string; status:string; tone:PayrollTone; amount?:string|null; date?:string|null; owner?:string|null; href?:string|null; meta?:Record<string,string|number|boolean|null> }
export type PayrollSnapshot = {
  generatedAt:string; schoolId:string; schoolName:string; academicYearId:string|null; academicYearLabel:string|null; currency:string;
  scene:PayrollSovereignScene; permissions:string[]; metrics:PayrollMetric[]; records:Record<string,PayrollRecord[]>;
  readiness:Array<{key:string;label:string;ready:number;warning:number;blocked:number}>;
  variances:Array<{label:string;current:string;previous:string;change:string;tone:PayrollTone}>;
  period:{id:string|null;label:string;status:string;cutoffAt:string|null;paymentDate:string|null;blockers:number};
  system:{personMaster:boolean;sharedApprovals:boolean;privateDocuments:boolean;preciseArithmetic:boolean;periodLocking:boolean;idempotency:boolean};
}
export type PayrollCommandRequest={operationKey:PayrollOperationKey;entityId?:string|null;idempotencyKey?:string|null;reason?:string|null;payload?:Record<string,unknown>}
export type PayrollCommandResult={ok:boolean;state:'completed'|'approval_required'|'blocked'|'failed'|'replayed';message:string;operationKey:PayrollOperationKey;executionId?:string|null;entityId?:string|null;result?:Record<string,unknown>;blockers?:string[]}
