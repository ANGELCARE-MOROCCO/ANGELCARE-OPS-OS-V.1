export type CategoryNativeLocale = 'fr' | 'en' | 'ar'

export type ExperienceFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'integer'
  | 'money'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'list'
  | 'date'
  | 'datetime'
  | 'time'
  | 'time_ranges'
  | 'territory_list'
  | 'media'
  | 'media_list'
  | 'component_list'
  | 'json'

export type ExperienceSchemaStatus = 'draft' | 'active' | 'paused' | 'archived'
export type CategoryNativeImportMode = 'dry_run' | 'create' | 'update' | 'upsert'
export type CategoryNativeImportStatus =
  | 'uploaded'
  | 'validating'
  | 'validated'
  | 'importing'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'rolled_back'

export interface ExperienceFieldBlueprint {
  field_key: string
  section_key: string
  label_fr: string
  label_en: string
  label_ar: string
  help_fr: string
  field_type: ExperienceFieldType
  required: boolean
  allowed_values: string[]
  validation: Record<string, unknown>
  default_value: unknown
  admin_visible: boolean
  csv_enabled: boolean
  public_visible: boolean
  filter_enabled: boolean
  comparison_enabled: boolean
  operations_visible: boolean
  sort_order: number
}

export interface ExperienceVariantGroupBlueprint {
  group_key: string
  label_fr: string
  label_en: string
  label_ar: string
  selection_type: string
  required: boolean
  values: string[]
  affects_media: boolean
  affects_price: boolean
  affects_availability: boolean
  sort_order: number
}

export interface ExperienceSchemaBlueprint {
  schema_key: string
  version: number
  segment_key: string
  vertical_key: string
  category_key: string
  subcategory_key: string
  archetype_key: string
  parent_schema_key: string | null
  name_fr: string
  name_en: string
  name_ar: string
  description_fr: string
  admin_studio_template: string
  public_experience_template: string
  conversion_template: string
  operations_handover_type: string
  homepage_card_template: string
  availability_authority: string
  pricing_modes: string[]
  media_requirements: Record<string, unknown>
  search_filters: string[]
  comparison_fields: string[]
  analytics_dimensions: string[]
  configuration: Record<string, unknown>
  status: ExperienceSchemaStatus
  fields: ExperienceFieldBlueprint[]
  variant_groups: ExperienceVariantGroupBlueprint[]
}

export interface ExperienceSchemaFieldRecord extends ExperienceFieldBlueprint {
  id: string
  schema_id: string
  conditional_rule: Record<string, unknown>
  status: ExperienceSchemaStatus
  created_at?: string
  updated_at?: string
}

export interface ExperienceVariantGroupRecord extends ExperienceVariantGroupBlueprint {
  id: string
  schema_id: string
  status: ExperienceSchemaStatus
}

export interface ExperienceAttributeGroupRecord {
  id: string
  schema_id: string
  group_key: string
  label_fr: string
  label_en: string | null
  label_ar: string | null
  settings: Record<string, unknown>
  sort_order: number
  status: ExperienceSchemaStatus
}

export interface CategoryNativeCsvTemplateRecord {
  id: string
  template_key: string
  schema_id: string
  version: number
  file_name: string
  delimiter: string
  encoding: string
  columns: Array<Record<string, unknown>>
  examples: Array<Record<string, unknown>>
  allowed_values: Record<string, unknown>
  instructions_fr: string | null
  status: ExperienceSchemaStatus
  generated_at: string
}

export interface ExperienceSchemaRecord extends Omit<ExperienceSchemaBlueprint, 'fields' | 'variant_groups'> {
  id: string
  description_en: string | null
  description_ar: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  fields: ExperienceSchemaFieldRecord[]
  variant_groups: ExperienceVariantGroupRecord[]
  attribute_groups: ExperienceAttributeGroupRecord[]
  csv_templates: CategoryNativeCsvTemplateRecord[]
}

export interface HomepageBlockBlueprint {
  block_key: string
  name_fr: string
  name_en: string
  name_ar: string
  category_family: string
  block_type: string
  compatible_archetypes: string[]
  required_data_fields: string[]
  default_settings: Record<string, unknown>
  layout_presets: string[]
  icon_key: string
}

export interface HomepageBlockRecord extends HomepageBlockBlueprint {
  id: string
  status: ExperienceSchemaStatus
  created_at?: string
  updated_at?: string
}

export interface CategoryNativeImportRow {
  id: string
  job_id: string
  row_number: number
  identity_key: string | null
  payload: Record<string, unknown>
  normalized_payload: Record<string, unknown>
  before_snapshot: Record<string, unknown> | null
  status: 'valid' | 'invalid' | 'imported' | 'updated' | 'skipped' | 'failed' | 'rolled_back'
  errors: string[]
  warnings: string[]
  target_item_id: string | null
  created_at: string
  updated_at: string
}

export interface CategoryNativeImportJob {
  id: string
  public_reference: string
  schema_id: string
  template_id: string | null
  schema_key?: string
  schema_name_fr?: string
  source_file_name: string
  template_version: number
  mode: CategoryNativeImportMode
  status: CategoryNativeImportStatus
  total_rows: number
  valid_rows: number
  invalid_rows: number
  imported_rows: number
  updated_rows: number
  failed_rows: number
  created_by: string | null
  created_at: string
  validated_at: string | null
  executed_at: string | null
  rolled_back_at: string | null
  error_summary: Record<string, unknown>
  rows?: CategoryNativeImportRow[]
}

export interface CategoryNativeSummary {
  activeSchemas: number
  totalFields: number
  csvTemplates: number
  homepageBlocks: number
  activeImports: number
  failedImportRows: number
  segments: Array<{ key: string; count: number }>
  verticals: Array<{ key: string; count: number }>
  readiness: {
    schemaCoverage: number
    csvCoverage: number
    homepageBlockCoverage: number
    operationalHandoverCoverage: number
  }
}

export interface CategoryNativeStudioData {
  summary: CategoryNativeSummary
  schemas: ExperienceSchemaRecord[]
  homepageBlocks: HomepageBlockRecord[]
  imports: CategoryNativeImportJob[]
}

export interface RowValidationResult {
  rowNumber: number
  identityKey: string | null
  valid: boolean
  normalized: Record<string, unknown>
  errors: string[]
  warnings: string[]
}

export interface CsvTemplateDocument {
  schemaKey: string
  version: number
  fileName: string
  headers: string[]
  example: Record<string, unknown>
  fieldGuide: Array<{
    key: string
    label: string
    type: ExperienceFieldType
    required: boolean
    allowedValues: string[]
    help: string
  }>
  csv: string
}
