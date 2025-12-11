'use client';

import { TeamSelectorWrapper } from './TeamSelectorWrapper';

/**
 * Placeholder component for team selector
 * Can be imported into server components
 */
export function TeamSelectorPlaceholder() {
  return (
    <div className="flex justify-center mb-4">
      <TeamSelectorWrapper variant="inline" />
    </div>
  );
}
