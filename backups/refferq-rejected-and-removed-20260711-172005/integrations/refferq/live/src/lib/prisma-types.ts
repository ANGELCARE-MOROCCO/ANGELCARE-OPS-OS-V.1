// @ts-nocheck
export type Role = "ADMIN" | "AFFILIATE"

export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED"

export type User = {
  id: string
  email: string
  password: string
  name: string
  role: Role
  status: UserStatus
  profilePicture?: string | null
  affiliate?: unknown
}
