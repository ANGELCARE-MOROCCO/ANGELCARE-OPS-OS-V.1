export interface FinalContentCommandRepository<TRecord, TCreate, TUpdate> {
  list(): Promise<TRecord[]>;
  getById(id: string): Promise<TRecord | null>;
  create(input: TCreate): Promise<TRecord>;
  update(id: string, input: TUpdate): Promise<TRecord>;
  archive(id: string): Promise<TRecord>;
}

export interface FinalAuditRepository {
  recordEvent(input: {
    actorId?: string;
    entityTable: string;
    entityId: string;
    action: string;
    payload?: Record<string, unknown>;
  }): Promise<void>;
}