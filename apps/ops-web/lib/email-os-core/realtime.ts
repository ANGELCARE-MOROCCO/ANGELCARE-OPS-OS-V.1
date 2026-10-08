"use client"

import { createClient } from '@/lib/supabase/contract-client'

export const emailOSRealtime =
  typeof window !== "undefined"
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      )
    : null
