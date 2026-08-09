export type AssignmentView = 'today'|'team'|'classes'|'subjects'|'workload'|'availability'|'replacements'|'conflicts'|'attention'|'history'
export type AssignmentDossierKind = 'staff'|'assignment'|'replacement'|'conflict'
export type AssignmentDossierTab = 'todo'|'assignments'|'classes-subjects'|'workload'|'availability'|'qualifications'|'replacements'|'history'
export type AssignmentTone = 'neutral'|'active'|'verified'|'warning'|'critical'|'decision'
export type AssignmentActionKey =
  | 'assignment.create'|'assignment.update'|'assignment.preview'|'assignment.request_approval'|'assignment.approve'|'assignment.activate'|'assignment.suspend'|'assignment.resume'|'assignment.schedule_end'|'assignment.end'|'assignment.cancel'|'assignment.archive'
  | 'class_responsibility.assign'|'class_responsibility.replace'|'class_responsibility.end'
  | 'subject_assignment.assign'|'subject_assignment.replace'|'subject_assignment.end'
  | 'assistant_assignment.assign'|'assistant_assignment.replace'|'assistant_assignment.end'
  | 'assignment_workload.preview'|'assignment_workload.request_exception'|'assignment_workload.approve_exception'
  | 'assignment_qualification.request_verification'|'assignment_qualification.request_exception'|'assignment_qualification.approve_exception'
  | 'replacement.prepare'|'replacement.compare_candidates'|'replacement.request_confirmation'|'replacement.confirm'|'replacement.activate'|'replacement.extend'|'replacement.end'|'replacement.cancel'
  | 'continuity_plan.create'|'continuity_plan.update'|'continuity_plan.approve'|'continuity_plan.complete'
  | 'assignment_batch.preview'|'assignment_batch.execute'|'assignment_batch.retry_item'
  | 'assignment_conflict.assign'|'assignment_conflict.resolve'|'assignment_conflict.reopen'
  | 'assignment_task.assign'|'assignment_task.complete'|'assignment_task.reopen'
  | 'assignment_note.add'|'assignment_evidence.request'|'assignment_access.request'
export type AssignmentMetric={key:string;label:string;value:string;detail:string;tone:AssignmentTone;view:AssignmentView}
export type AssignmentStaffRecord={id:string;staffCode:string|null;name:string;roleLabel:string;siteLabel:string|null;employmentState:string;availabilityState:string;availabilityLabel:string;qualificationState:string;qualificationLabel:string;plannedHours:number;contractHours:number|null;classLabels:string[];subjectLabels:string[];assignmentIds:string[];conflictIds:string[];nextActionKey:AssignmentActionKey|null;nextActionLabel:string;tone:AssignmentTone}
export type AssignmentRecord={id:string;code:string;staffId:string|null;staffLabel:string;assignmentType:string;assignmentTypeLabel:string;classId:string|null;classLabel:string|null;sectionId:string|null;sectionLabel:string|null;subjectId:string|null;subjectLabel:string|null;siteId:string|null;siteLabel:string|null;academicYearId:string|null;academicYearLabel:string|null;startsAt:string|null;endsAt:string|null;weeklyHours:number;allocationPercent:number|null;lifecycle:string;lifecycleLabel:string;approvalState:string;availabilityState:string;qualificationState:string;workloadState:string;timetableState:string;conflictCount:number;replacementForId:string|null;nextActionKey:AssignmentActionKey|null;nextActionLabel:string;tone:AssignmentTone}
export type AssignmentReplacement={id:string;sourceAssignmentId:string|null;originalStaffLabel:string;replacementStaffId:string|null;replacementStaffLabel:string|null;startsAt:string|null;endsAt:string|null;reason:string|null;state:string;stateLabel:string;affectedClasses:string[];candidateCount:number;tone:AssignmentTone}
export type AssignmentConflict={id:string;fingerprint:string;category:string;title:string;detail:string;consequence:string;staffId:string|null;staffLabel:string|null;assignmentId:string|null;classId:string|null;classLabel:string|null;severity:string;state:string;ownerLabel:string|null;dueAt:string|null;recommendedActionKey:AssignmentActionKey|null;recommendedActionLabel:string;tone:AssignmentTone}
export type AssignmentHistoryEvent={id:string;label:string;detail:string|null;entityType:string;entityId:string|null;actorLabel:string|null;createdAt:string;tone:AssignmentTone}
export type AssignmentDirectory={staff:Array<{id:string;label:string;secondary?:string|null}>;classes:Array<{id:string;label:string;secondary?:string|null}>;subjects:Array<{id:string;label:string;secondary?:string|null}>;sites:Array<{id:string;label:string}>;academicYears:Array<{id:string;label:string}>}
export type AssignmentSnapshot={school:{id:string;name:string;singleSite:boolean;activeAcademicYearLabel:string|null};viewer:{roleLabel:string;canWrite:boolean;canApprove:boolean};metrics:AssignmentMetric[];staff:AssignmentStaffRecord[];assignments:AssignmentRecord[];replacements:AssignmentReplacement[];conflicts:AssignmentConflict[];history:AssignmentHistoryEvent[];directory:AssignmentDirectory;productAccess:{staffUserLimit:number|null;staffUsersUsed:number|null;remainingStaffUsers:number|null;exactTopupHref:string|null};generatedAt:string}
export type AssignmentActionRequest={actionKey:AssignmentActionKey;assignmentId?:string|null;staffId?:string|null;replacementId?:string|null;conflictId?:string|null;values?:Record<string,string|number|boolean|null>;idempotencyKey:string}
export type AssignmentActionResult={ok:boolean;message:string;snapshot:AssignmentSnapshot}
