import type { Angelcare360UUID } from './database'

export interface Angelcare360InventoryCategoryRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  category_code: string
  label: string
  status: string
}

export interface Angelcare360InventoryItemRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  category_id: Angelcare360UUID
  item_code: string
  label: string
  current_stock: number
  reorder_level: number
  status: string
}

