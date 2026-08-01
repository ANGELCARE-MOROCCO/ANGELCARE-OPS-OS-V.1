import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export async function GET(){const access=await assertFlashcardsApiAccess('flashcards_os.manage_model_profiles');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});const data=await loadIntelligenceOverview();return NextResponse.json({profiles:data.modelProfiles,providerHealth:data.providerHealth,usage:data.usage,sourceMode:data.sourceMode})}
