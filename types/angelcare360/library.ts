import type { Angelcare360UUID } from './database'

export interface Angelcare360LibraryBookRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  book_code: string
  isbn?: string | null
  title: string
  author?: string | null
  status: string
}

export interface Angelcare360LibraryLoanRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  copy_id: Angelcare360UUID
  borrower_type: 'student' | 'staff'
  due_at: string
  status: string
}

