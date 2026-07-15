import type { Phase11ConfigOption, Phase11GovernanceRule, Phase11SettingsValidation, Phase11SlaRule } from './phase11-settings-types';

export function validatePhase11Settings(
  options: Phase11ConfigOption[],
  governanceRules: Phase11GovernanceRule[],
  slaRules: Phase11SlaRule[]
): Phase11SettingsValidation {
  const warnings: string[] = [];

  const enabledStatuses = options.filter((option) => option.scope === 'statuses' && option.enabled);
  const enabledLanguages = options.filter((option) => option.scope === 'languages' && option.enabled);
  const enabledChannels = options.filter((option) => option.scope === 'channels' && option.enabled);

  if (enabledStatuses.length < 3) warnings.push('At least draft, review, and approved statuses should remain enabled.');
  if (enabledLanguages.length === 0) warnings.push('At least one language should remain enabled.');
  if (enabledChannels.length === 0) warnings.push('At least one distribution channel should remain enabled.');
  if (!governanceRules.some((rule) => rule.enabled)) warnings.push('At least one governance rule should remain enabled.');
  if (!slaRules.some((rule) => rule.enabled)) warnings.push('At least one SLA rule should remain enabled.');

  return {
    valid: warnings.length === 0,
    warnings,
  };
}