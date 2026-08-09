import type { Phase10ManagedEntity, Phase10ValidationResult } from './phase10-management-types';

export function validatePhase10Entity(entity: Partial<Phase10ManagedEntity>): Phase10ValidationResult {
  const errors: string[] = [];

  if (!entity.title || entity.title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters.');
  }

  if (!entity.owner || entity.owner.trim().length < 2) {
    errors.push('Owner is required.');
  }

  if (entity.language && !['fr', 'ar', 'en'].includes(entity.language)) {
    errors.push('Language must be fr, ar, or en.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}