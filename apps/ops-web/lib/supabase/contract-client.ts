import { createClient as createRawClient } from '@supabase/supabase-js'
import { wrapSupabaseClient } from './contract-safe'

/**
 * Drop-in replacement for @supabase/supabase-js createClient.
 * It intentionally preserves Supabase's full overloaded/generic function type
 * while routing every created client through AngelCare's canonical contract layer.
 */
export const createClient: typeof createRawClient = ((...args: any[]) => {
  return wrapSupabaseClient(createRawClient(...args as Parameters<typeof createRawClient>))
}) as typeof createRawClient
