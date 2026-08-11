import { NextRequest } from 'next/server'
import { acContext, canAccessConversationRow, fail, ok, scopeAccountRows } from '@/lib/ac-whatsapp/server'

export const runtime = 'nodejs'

type SearchResult = {
  id: string
  type: 'message' | 'file' | 'response' | 'team'
  title: string
  subtitle: string
  href: string
  status?: string
}

function clean(value: unknown) { return String(value || '').trim() }
function lower(value: unknown) { return clean(value).toLowerCase() }
function unique(rows: SearchResult[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.type}:${row.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.view')
  if ('error' in context) return context.error
  const q = clean(request.nextUrl.searchParams.get('q'))
  if (q.length < 2) return ok({ results: [] })

  try {
    let conversationQuery: any = context.supabase
      .from('ac_whatsapp_conversations')
      .select('id,account_id,queue_id,assigned_user_id,status,contact_id')
      .order('updated_at', { ascending: false })
      .limit(2500)
    conversationQuery = scopeAccountRows(conversationQuery, context, 'account_id')
    const conversations = await conversationQuery
    if (conversations.error) throw conversations.error
    const accessibleIds = (conversations.data || [])
      .filter((row: any) => canAccessConversationRow(context, row))
      .map((row: any) => String(row.id))
      .slice(0, 2000)
    const accessible = new Set(accessibleIds)

    const messageQueries: PromiseLike<any>[] = []
    if (accessibleIds.length) {
      messageQueries.push(
        context.supabase.from('ac_whatsapp_messages').select('id,conversation_id,body,caption,direction,message_type,status,created_at').in('conversation_id', accessibleIds).ilike('body', `%${q}%`).order('created_at', { ascending: false }).limit(20),
        context.supabase.from('ac_whatsapp_messages').select('id,conversation_id,body,caption,direction,message_type,status,created_at').in('conversation_id', accessibleIds).ilike('caption', `%${q}%`).order('created_at', { ascending: false }).limit(20),
      )
    }

    const canSeeTeam = context.access.permissions.some((permission: string) => ['ac-whatsapp.members.manage', 'ac-whatsapp.*', '*'].includes(permission))
    const [bodyMessages, captionMessages, attachments, templates, memberships, users] = await Promise.all([
      messageQueries[0] || Promise.resolve({ data: [], error: null }),
      messageQueries[1] || Promise.resolve({ data: [], error: null }),
      accessibleIds.length
        ? context.supabase.from('ac_whatsapp_attachments').select('id,file_name,mime_type,size_bytes,migration_status,message:ac_whatsapp_messages!inner(conversation_id,created_at)').is('purged_at', null).ilike('file_name', `%${q}%`).order('created_at', { ascending: false }).limit(25)
        : Promise.resolve({ data: [], error: null }),
      context.supabase.from('ac_whatsapp_templates').select('id,name,body,shortcut,status,approval_status,category,service_line').eq('status', 'active').eq('approval_status', 'approved').order('usage_count', { ascending: false }).limit(500),
      canSeeTeam ? context.supabase.from('ac_whatsapp_memberships').select('user_id,role_key,status').neq('status', 'removed').limit(500) : Promise.resolve({ data: [], error: null }),
      canSeeTeam ? context.supabase.from('app_users').select('id,display_name,full_name,name,email,job_title,role').limit(1000) : Promise.resolve({ data: [], error: null }),
    ])
    const error = [bodyMessages, captionMessages, attachments, templates, memberships, users].find((row: any) => row?.error)?.error
    if (error) throw error

    const results: SearchResult[] = []
    const messageRows = unique([...(bodyMessages.data || []), ...(captionMessages.data || [])].map((row: any) => ({
      id: String(row.id),
      type: 'message' as const,
      title: clean(row.body || row.caption || row.message_type || 'Message WhatsApp').slice(0, 120),
      subtitle: `${row.direction === 'inbound' ? 'Entrant' : row.direction === 'outbound' ? 'Sortant' : 'Interne'} · ${row.message_type || 'message'}`,
      href: `/ac-whatsapp/live?conversation=${encodeURIComponent(row.conversation_id)}&message=${encodeURIComponent(row.id)}`,
      status: row.status || undefined,
    })))
    results.push(...messageRows)

    for (const row of attachments.data || []) {
      const message = Array.isArray(row.message) ? row.message[0] : row.message
      if (!message?.conversation_id || !accessible.has(String(message.conversation_id))) continue
      results.push({
        id: String(row.id), type: 'file', title: clean(row.file_name || 'Pièce jointe'),
        subtitle: `${row.mime_type || 'Fichier'}${row.size_bytes ? ` · ${Math.max(1, Math.round(Number(row.size_bytes) / 1024))} Ko` : ''}`,
        href: `/ac-whatsapp/live?conversation=${encodeURIComponent(message.conversation_id)}&attachment=${encodeURIComponent(row.id)}`,
        status: row.migration_status || undefined,
      })
    }

    const needle = lower(q)
    for (const row of templates.data || []) {
      if (![row.name, row.body, row.shortcut, row.category, row.service_line].some((value) => lower(value).includes(needle))) continue
      results.push({
        id: String(row.id), type: 'response', title: clean(row.name || 'Réponse enregistrée'),
        subtitle: [row.shortcut, row.category, row.service_line].filter(Boolean).join(' · '),
        href: `/ac-whatsapp/accounts?view=responses&response=${encodeURIComponent(row.id)}`,
        status: row.status || undefined,
      })
    }

    if (canSeeTeam) {
      const userMap = new Map((users.data || []).map((row: any) => [String(row.id), row]))
      for (const membership of memberships.data || []) {
        const user: any = userMap.get(String(membership.user_id)) || {}
        const name = clean(user.display_name || user.full_name || user.name || user.email || membership.user_id)
        const meta = [user.job_title || user.role, membership.role_key, user.email].filter(Boolean).join(' · ')
        if (!lower(`${name} ${meta}`).includes(needle)) continue
        results.push({ id: String(membership.user_id), type: 'team', title: name, subtitle: meta, href: `/ac-whatsapp/team?member=${encodeURIComponent(membership.user_id)}`, status: membership.status || undefined })
      }
    }

    return ok({ results: unique(results).slice(0, 48) })
  } catch (cause) {
    return fail(cause instanceof Error ? cause.message : 'AC_WHATSAPP_SEARCH_FAILED', 500)
  }
}
