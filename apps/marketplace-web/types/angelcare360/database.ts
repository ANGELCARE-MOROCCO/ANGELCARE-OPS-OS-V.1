export type Angelcare360UUID = string
export type Angelcare360ISODate = string
export type Angelcare360ISODateTime = string
export type Angelcare360Json = Record<string, unknown>

export type Angelcare360EntityStatus =
  | 'active'
  | 'inactive'
  | 'draft'
  | 'planned'
  | 'pending'
  | 'suspended'
  | 'archived'

export interface Angelcare360BaseRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  status: Angelcare360EntityStatus | string
  created_at: Angelcare360ISODateTime
  updated_at: Angelcare360ISODateTime
  created_by?: Angelcare360UUID | null
  updated_by?: Angelcare360UUID | null
  metadata_json?: Angelcare360Json
}

export interface Angelcare360TimeStamped {
  created_at: Angelcare360ISODateTime
  updated_at: Angelcare360ISODateTime
}

