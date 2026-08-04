"use server";

import {
  addActivity,
  archiveDocument,
  archiveJourney,
  archiveTask,
  createDocument,
  createJourney,
  createTask,
  performJourneyAction,
  updateDocument,
  updateJourney,
  updateTask,
} from "@/lib/hr-onboarding/server";

// Compatibility server actions retained for any internal caller. The page itself
// now uses the canonical no-store APIs so every mutation returns structured state.
export async function createOnboardingJourney(payload: Record<string, unknown>) { return createJourney(payload); }
export async function updateOnboardingJourney(id: string, payload: Record<string, unknown>) { return updateJourney(id, payload); }
export async function deleteOnboardingJourney(id: string, payload: Record<string, unknown> = {}) { return archiveJourney(id, payload); }
export async function createOnboardingTask(payload: Record<string, unknown>) { return createTask(String(payload.journeyKey ?? payload.journey_key ?? payload.journey_id ?? ""), payload); }
export async function updateOnboardingTask(id: string, payload: Record<string, unknown>) { return updateTask(id, payload); }
export async function deleteOnboardingTask(id: string, payload: Record<string, unknown> = {}) { return archiveTask(id, payload); }
export async function createOnboardingDocument(payload: Record<string, unknown>) { return createDocument(String(payload.journeyKey ?? payload.journey_key ?? payload.journey_id ?? ""), payload); }
export async function updateOnboardingDocument(id: string, payload: Record<string, unknown>) { return updateDocument(id, payload); }
export async function deleteOnboardingDocument(id: string, payload: Record<string, unknown> = {}) { return archiveDocument(id, payload); }
export async function addOnboardingNote(payload: Record<string, unknown>) { return addActivity(String(payload.journeyKey ?? payload.journey_key ?? payload.journey_id ?? ""), payload); }
export async function createOnboardingReminder(payload: Record<string, unknown>) { return addActivity(String(payload.journeyKey ?? payload.journey_key ?? payload.journey_id ?? ""), { ...payload, type: "reminder" }); }
export async function reassignOnboardingOwner(id: string, owner: string, version: number) { return performJourneyAction(id, { action: "reassign", owner, version }); }
